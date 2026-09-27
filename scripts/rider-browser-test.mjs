import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-KE' });
const page = await context.newPage();
const pageErrors = [];
const observedMutations = [];
const asOf = '2026-09-26T10:00:00.000Z';
const riderIdentity = { account_id: '00000000-0000-4000-8000-000000000111', display_name: 'Portal Test Rider', phone: null, profile_status: 'approved' };
let signedIn = false;
let availability = { online: false, eligible: false, reason: 'offline', version: 0, as_of: asOf };
let offers = [{
  id: 'offer_fixture_001', version: 0, status: 'OFFERED',
  merchant: { display_name: 'Fixture Merchant' }, pickup_area: 'Westlands',
  scheduled_at: null, priority: true, created_at: asOf,
  pickup_address: 'Fixture pickup address', order_summary: { line_count: 2 },
}];
let assigned = [];
let history = [];
let proofHistory = [];
let proofEvents = [];
const retrievedPhotoProofs = [];
let badgeCredential = '';
const financeReads = [];
const rewardsReads = [];
const rewardProgressFixture = {
  program_id: '00000000-0000-7000-8000-000000000701', program_version: 1,
  feature: 'daily_challenge', title: 'Daily deliveries', status: 'active', progress: 2, target: 5,
  unit: 'deliveries', currency: null, starts_at: asOf, ends_at: '2026-09-26T21:00:00.000Z', time_zone: 'Africa/Nairobi', as_of: asOf,
};
const rewardAwardFixture = {
  award_id: '00000000-0000-7000-8000-000000000702', program_id: '00000000-0000-7000-8000-000000000701',
  program_version: 1, kind: 'milestone', title: 'Rider milestone', status: 'posted', amount_minor: 500,
  currency: 'KES', finance_entry_id: '00000000-0000-7000-8000-000000000703', badge_id: '00000000-0000-7000-8000-000000000704', earned_at: asOf,
};
const rewardBadgeFixture = {
  badge_id: '00000000-0000-7000-8000-000000000704', program_id: rewardAwardFixture.program_id,
  program_version: 1, label: 'Reliable Rider', icon_key: 'reliable-rider', public_tracking: true, earned_at: asOf,
};
const financeTransactions = [
  { id: 'finance_entry_fixture_001', category: 'delivery_earning', amount_minor: 12345, payable_delta_minor: 12345, currency: 'KES', occurred_at: asOf, source_reference: 'delivery_fixture_001' },
  { id: 'finance_entry_fixture_002', category: 'tip', amount_minor: 250, payable_delta_minor: 250, currency: 'KES', occurred_at: asOf, source_reference: null },
];
const financePeriodData = (period) => {
  const windows = {
    business_day: ['2026-09-26T00:00:00.000Z', '2026-09-27T00:00:00.000Z'],
    current_shift: ['2026-09-26T06:00:00.000Z', '2026-09-26T18:00:00.000Z'],
    rolling_7_days: ['2026-09-19T10:00:00.000Z', '2026-09-26T10:00:00.000Z'],
    month: ['2026-09-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'],
  };
  return {
    status: 'ready', source: 'Finance API', as_of: asOf,
    period: { key: period, starts_at: windows[period][0], ends_at: windows[period][1], time_zone: 'Africa/Nairobi' },
    by_currency: [{ currency: 'KES', delivery_earnings_minor: 12345, bonuses_minor: 500, tips_minor: 250, payable_minor: 13095 }],
  };
};
let financeStatements = [];
let financeStatementSequence = 0;
let statementDownloads = [];
let delivery = {
  id: 'delivery_fixture_001', status: 'ACCEPTED', version: 1,
  merchant: { display_name: 'Fixture Merchant' },
  pickup_address: 'Fixture pickup address', dropoff_address: 'Fixture drop-off address',
  customer: { display_name: 'Fixture Customer', masked_phone: '+2547••••11' },
  order: { lines: [{ title: 'Fixture meal', quantity: 1 }, { title: 'Fixture drink', quantity: 2 }] },
  created_at: asOf, updated_at: asOf, scheduled_at: null, priority: true,
  failure_reason_code: null, cancellation_request: null,
};

const response = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const listOffers = (url) => {
  const params = url.searchParams;
  let values = availability.online ? [...offers] : [];
  if (params.has('q')) values = values.filter((item) => `${item.merchant.display_name} ${item.id}`.toLowerCase().includes(params.get('q').toLowerCase()));
  if (params.has('scheduled')) values = values.filter((item) => (item.scheduled_at !== null) === (params.get('scheduled') === 'true'));
  if (params.has('priority')) values = values.filter((item) => (item.priority === true) === (params.get('priority') === 'true'));
  return { data: values, next_cursor: null, as_of: asOf };
};
const listAssigned = () => ({
  items: assigned.map((item) => ({
    id: item.id, status: item.status, version: item.version,
    merchant_name: item.merchant?.display_name ?? 'Assigned delivery',
    created_at: item.created_at, updated_at: item.updated_at,
    scheduled_at: item.scheduled_at, priority: item.priority,
  })),
  active_count: assigned.filter((item) => !['DELIVERED', 'FAILED', 'CANCELLED'].includes(item.status)).length,
  completed_count: history.filter((item) => item.status === 'DELIVERED').length,
  as_of: asOf,
});
const dashboardValue = () => {
  const jobItems = listAssigned().items;
  const ready = (value, source) => ({ status: value === null ? 'empty' : 'ready', value, source, as_of: asOf });
  const unavailable = (source, message) => ({ status: 'unavailable', value: null, source, as_of: null, message });
  return {
    as_of: asOf,
    widgets: {
      availability: ready(availability, 'Dispatch API'),
      assigned_jobs: ready({ items: jobItems, count: jobItems.length }, 'Core Delivery API'),
      earnings_today: { status: 'ready', value: financePeriodData('business_day'), source: 'Finance API', as_of: asOf },
      completed_deliveries: ready({ total: history.filter((item) => item.status === 'DELIVERED').length }, 'Core Delivery API'),
      performance_summary: unavailable('Analytics API', 'Performance metrics are not connected to the Analytics API.'),
      active_delivery: ready(jobItems[0] ?? null, 'Core Delivery API'),
      incentives_and_bonuses: { status: 'ready', value: { status: 'ready', source: 'Rewards API', as_of: asOf, streaks: [], challenges: [rewardProgressFixture], bonuses: [rewardAwardFixture] }, source: 'Rewards API', as_of: asOf },
      recent_notifications: unavailable('Notifications API', 'Rider notifications are not connected to the Notifications API.'),
      quick_actions: ready([{ id: 'view_assigned_jobs', label: 'View assigned jobs' }], 'Rider Portal'),
    },
  };
};

page.on('pageerror', (error) => pageErrors.push(error.message));
await page.route('**/api/v1/rider/**', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.replace('/api/v1/rider', '') || '/';
  const method = request.method();

  if (path === '/session' && method === 'GET') {
    return signedIn
      ? response(route, 200, { data: { identity: riderIdentity, csrf_token: 'fixture-csrf-token' } })
      : response(route, 401, { error: 'rider_session_required' });
  }
  if (path === '/session' && method === 'POST') {
    signedIn = true;
    return response(route, 201, { data: { identity: riderIdentity, csrf_token: 'fixture-csrf-token' } });
  }
  if (path === '/session' && method === 'DELETE') {
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    signedIn = false;
    return response(route, 200, { data: { signed_out: true } });
  }
  if (path === '/dashboard') return response(route, 200, { data: dashboardValue() });
  if (path === '/rewards' && method === 'GET') {
    rewardsReads.push('summary');
    return response(route, 200, { data: { status: 'ready', source: 'Rewards API', as_of: asOf, streaks: [], challenges: [rewardProgressFixture], bonuses: [rewardAwardFixture] } });
  }
  if (path === '/rewards/history' && method === 'GET') {
    const cursor = url.searchParams.get('cursor');
    rewardsReads.push(cursor ? `history:${cursor}` : 'history:first');
    const older = { ...rewardAwardFixture, award_id: '00000000-0000-7000-8000-000000000705', title: 'Earlier streak' };
    return response(route, 200, { data: { status: 'ready', items: cursor ? [older] : [rewardAwardFixture], next_cursor: cursor ? null : 'fixture-rewards-cursor', as_of: asOf } });
  }
  if (path === '/rewards/badges' && method === 'GET') {
    rewardsReads.push('badges');
    return response(route, 200, { data: { status: 'ready', items: [rewardBadgeFixture], as_of: asOf } });
  }
  if (path === '/earnings' && method === 'GET') {
    const period = url.searchParams.get('period') ?? 'current_shift';
    financeReads.push(`summary:${period}`);
    return response(route, 200, { data: financePeriodData(period) });
  }
  if (path === '/earnings/transactions' && method === 'GET') {
    const cursor = url.searchParams.get('cursor');
    financeReads.push(cursor ? `transactions:${cursor}` : 'transactions:first');
    return response(route, 200, { data: {
      status: 'ready', items: cursor ? financeTransactions.slice(1) : financeTransactions.slice(0, 1),
      next_cursor: cursor ? null : 'fixture-earnings-cursor', as_of: asOf,
    } });
  }
  if (path === '/earnings/statements' && method === 'GET') {
    const period = url.searchParams.get('period') ?? 'current_shift';
    financeReads.push(`statements:${period}`);
    return response(route, 200, { data: { status: financeStatements.length ? 'ready' : 'empty', items: financeStatements.filter((item) => item.period === period), as_of: asOf } });
  }
  if (path === '/earnings/statements' && method === 'POST') {
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    const { period } = request.postDataJSON();
    assert.ok(['current_shift', 'rolling_7_days', 'month'].includes(period));
    const statement = {
      id: `00000000-0000-7000-8000-${String(++financeStatementSequence).padStart(12, '0')}`,
      period, period_start: financePeriodData(period).period.starts_at,
      period_end: financePeriodData(period).period.ends_at, time_zone: 'Africa/Nairobi', generated_at: asOf,
      download_path: `/api/v1/rider/earnings/statements/00000000-0000-7000-8000-${String(financeStatementSequence).padStart(12, '0')}/download`,
    };
    financeStatements = [statement, ...financeStatements];
    return response(route, 201, { data: { status: 'created', statement } });
  }
  const statementDownloadMatch = /^\/earnings\/statements\/([0-9a-f-]+)\/download$/i.exec(path);
  if (statementDownloadMatch && method === 'GET') {
    assert.equal(signedIn, true, 'statement download requires an authenticated Rider session');
    assert.ok(financeStatements.some((statement) => statement.id === statementDownloadMatch[1]), 'only a listed Finance statement can be downloaded');
    statementDownloads.push(statementDownloadMatch[1]);
    return route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', headers: { 'content-disposition': `attachment; filename="nexg-rider-statement-${statementDownloadMatch[1]}.csv"`, 'cache-control': 'no-store' }, body: 'category,amount_minor,currency\ndelivery_earning,12345,KES\n' });
  }
  if (path === '/availability' && method === 'GET') return response(route, 200, { data: availability });
  if (path === '/availability' && method === 'PUT') {
    const body = request.postDataJSON();
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    assert.equal(request.headers()['if-match'], `"${availability.version}"`);
    availability = { online: body.online, eligible: body.online, reason: body.online ? null : 'offline', version: availability.version + 1, as_of: asOf };
    return response(route, 200, { data: availability });
  }
  if (path === '/jobs/offers' && method === 'GET') return response(route, 200, { data: listOffers(url) });
  if (path === '/jobs/offers/offer_fixture_001' && method === 'GET') {
    const item = offers.find((offer) => offer.id === 'offer_fixture_001');
    return item ? response(route, 200, { data: item }) : response(route, 404, { error: 'offer_not_found' });
  }
  if (path === '/jobs/offers/offer_fixture_001/accept' && method === 'POST') {
    const body = request.postDataJSON();
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    assert.equal(request.headers()['if-match'], `"${body.expected_version}"`);
    observedMutations.push('accept-offer');
    delivery = { ...delivery, status: 'ACCEPTED', version: 1 };
    offers = [];
    assigned = [delivery];
    return response(route, 200, { data: { id: delivery.id, status: delivery.status, version: delivery.version } });
  }
  if (path === '/jobs/offers/offer_fixture_001/decline' && method === 'POST') {
    observedMutations.push('decline-offer');
    offers = [];
    return response(route, 200, { data: { recorded: true, delivery_id: 'offer_fixture_001' } });
  }
  if (path === '/jobs/assigned' && method === 'GET') return response(route, 200, { data: listAssigned() });
  if (path === '/deliveries/assigned' && method === 'GET') return response(route, 200, { data: listAssigned() });
  if (path === '/deliveries/history' && method === 'GET') {
    let values = [...history];
    if (url.searchParams.has('status')) values = values.filter((item) => item.status === url.searchParams.get('status'));
    return response(route, 200, { data: { data: values, next_cursor: null, as_of: asOf } });
  }
  if (path === `/deliveries/${delivery.id}` && method === 'GET') return response(route, 200, { data: delivery });
  if (path === '/proofs/history' && method === 'GET') {
    const deliveryId = url.searchParams.get('delivery_id');
    return response(route, 200, { data: { data: proofHistory.filter((item) => !deliveryId || item.delivery_id === deliveryId), next_cursor: null, as_of: asOf } });
  }
  const photoProofMatch = /^\/proofs\/([0-9a-f-]+)\/photo$/i.exec(path);
  if (photoProofMatch && method === 'GET') {
    assert.equal(signedIn, true, 'photo proof retrieval requires an authenticated Rider session');
    assert.ok(proofHistory.some((item) => item.proof_id === photoProofMatch[1] && item.method === 'photo'), 'only photo proof references can be retrieved');
    retrievedPhotoProofs.push(photoProofMatch[1]);
    return route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=', 'base64'),
    });
  }
  if (path === '/proofs/events' && method === 'GET') {
    return response(route, 200, { data: { data: proofEvents.filter((event) => event.data.delivery_id === delivery.id), next_cursor: null, as_of: asOf } });
  }
  if (path === '/proofs/verify' && method === 'POST') {
    const body = request.postDataJSON();
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    if (body.credential === 'invalid-code') return response(route, 404, { error: 'proof_invalid', code: 'proof_invalid' });
    assert.equal(body.delivery_id, delivery.id);
    const proof = {
      proof_id: `00000000-0000-4000-8000-${String(proofHistory.length + 1).padStart(12, '0')}`,
      delivery_id: delivery.id, purpose: body.purpose, method: body.credential === '246810' ? 'otp' : 'qr',
      status: 'READY', version: 0, verified_at: asOf,
    };
    proofHistory.unshift({ id: `attempt_${proofHistory.length + 1}`, ...proof, result_code: 'verified', proof_status: 'READY', occurred_at: asOf });
    proofEvents.unshift({ id: `event_${proofHistory.length}`, type: 'qr.proof-verified.v1', subject: `deliveries/${delivery.id}/proofs/${proof.proof_id}`, time: asOf, data: { delivery_id: delivery.id, proof_id: proof.proof_id, rider_account_id: riderIdentity.account_id } });
    observedMutations.push(`verify-${body.purpose}-${proof.method}`);
    return response(route, 200, { data: proof });
  }
  if (path === '/proofs/photo' && method === 'POST') {
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    assert.equal(request.headers()['content-type'], 'image/png');
    assert.ok((request.postDataBuffer()?.byteLength ?? 0) > 0);
    const proof = {
      proof_id: `00000000-0000-4000-8000-${String(proofHistory.length + 1).padStart(12, '0')}`,
      delivery_id: url.searchParams.get('delivery_id'), purpose: url.searchParams.get('purpose'), method: 'photo',
      status: 'READY', version: 0, verified_at: asOf,
    };
    proofHistory.unshift({ id: `attempt_${proofHistory.length + 1}`, ...proof, result_code: 'verified', proof_status: 'READY', occurred_at: asOf });
    proofEvents.unshift({ id: `event_${proofHistory.length}`, type: 'qr.proof-verified.v1', subject: `deliveries/${delivery.id}/proofs/${proof.proof_id}`, time: asOf, data: { delivery_id: delivery.id, proof_id: proof.proof_id, rider_account_id: riderIdentity.account_id, method: 'photo' } });
    observedMutations.push('submit-photo-proof');
    return response(route, 201, { data: proof });
  }
  if (path === '/badges' && method === 'POST') {
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    assert.equal(request.postDataJSON().delivery_id, delivery.id);
    badgeCredential = 'badge_fixture_credential_000000000000000000000000000000';
    return response(route, 201, { data: { token: badgeCredential, expires_at: '2026-09-26T10:10:00.000Z' } });
  }
  if (path === '/badges/verify' && method === 'POST') {
    assert.equal(request.headers().cookie, undefined, 'public badge checks must not send the Rider session cookie');
    assert.equal(request.headers().authorization, undefined, 'public badge checks must not send an Authorization token');
    assert.equal(request.postDataJSON().token, badgeCredential);
    return response(route, 200, { data: { verified: true, status: 'arrived_drop', rider_profile: null } });
  }
  const commandMatch = new RegExp(`^/deliveries/${delivery.id}/commands/([a-z-]+)$`).exec(path);
  if (commandMatch && method === 'POST') {
    const command = commandMatch[1];
    const body = request.postDataJSON();
    assert.equal(request.headers()['x-csrf-token'], 'fixture-csrf-token');
    assert.ok(request.headers()['idempotency-key']);
    assert.equal(request.headers()['if-match'], `"${delivery.version}"`);
    observedMutations.push(command);
    if (command === 'request-cancellation') {
      delivery = { ...delivery, version: delivery.version + 1, cancellation_request: { status: 'PENDING', reason_code: body.reason_code } };
    } else if (command === 'arrive-at-pickup') {
      delivery = { ...delivery, status: 'ARRIVED_PICKUP', version: delivery.version + 1 };
    } else if (command === 'confirm-pickup') {
      assert.equal(body.proof_id, proofHistory.find((item) => item.purpose === 'pickup' && item.proof_status === 'READY')?.proof_id);
      const used = proofHistory.find((item) => item.proof_id === body.proof_id);
      if (used) used.proof_status = 'CONSUMED';
      delivery = { ...delivery, status: 'PICKED', version: delivery.version + 1 };
    } else if (command === 'arrive-at-drop') {
      delivery = { ...delivery, status: 'ARRIVED_DROP', version: delivery.version + 1 };
    } else if (command === 'complete') {
      assert.equal(body.proof_id, proofHistory.find((item) => item.purpose === 'delivery' && item.proof_status === 'READY')?.proof_id);
      const used = proofHistory.find((item) => item.proof_id === body.proof_id);
      if (used) used.proof_status = 'CONSUMED';
      delivery = { ...delivery, status: 'DELIVERED', version: delivery.version + 1, updated_at: asOf };
      assigned = [];
      history = [delivery];
    } else if (command === 'report-failure') {
      delivery = { ...delivery, status: 'FAILED', version: delivery.version + 1, failure_reason_code: body.reason_code, updated_at: asOf };
      assigned = [];
      history = [delivery];
    }
    return response(route, 200, { data: delivery });
  }
  if (path === '/events' && method === 'GET') return response(route, 200, { data: { data: [], next_cursor: null, as_of: asOf } });
  return response(route, 404, { error: 'fixture_route_not_found', path, method });
});

try {
  await page.goto(`${base}/?page=rider_portal`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Rider sign in' }).waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('[data-analytics="consent-reject-all"]').click();
  assert.equal(await page.getByLabel('Phone number').isVisible(), true);
  assert.equal(await page.getByLabel('PIN').isVisible(), true);
  await page.getByLabel('Phone number').fill('+254700000111');
  await page.getByLabel('PIN').fill('1234');
  await page.getByRole('button', { name: /Sign in/ }).click();

  const dashboardSections = [
    'Availability status', 'Assigned jobs', 'Earnings today', 'Completed deliveries',
    'Performance summary', 'Active delivery', 'Incentives and bonuses', 'Recent notifications', 'Quick actions',
  ];
  for (const heading of dashboardSections) await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.getByText('Earnings and payable totals are not connected to the Finance API.').count(), 0);
  assert.ok(await page.getByText(/123\.45/).count() > 0, 'dashboard earnings come from the Finance owner fixture');
  await page.getByText('Daily deliveries', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Rewards', exact: true }).click();
  await page.getByRole('heading', { name: 'Streaks, challenges and badges', exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Reliable Rider', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Rider milestone', { exact: true }).waitFor({ state: 'visible' });
  assert.ok(await page.getByText(/5\.00/).count() > 0, 'only Finance-posted reward amounts are shown');
  await page.getByRole('button', { name: 'Load more history' }).click();
  await page.getByText('Earlier streak', { exact: true }).waitFor({ state: 'visible' });
  assert.ok(rewardsReads.includes('summary') && rewardsReads.includes('badges') && rewardsReads.includes('history:fixture-rewards-cursor'), 'Rewards summary, history and badges load through Rider BFF routes');
  await page.getByRole('button', { name: 'Earnings', exact: true }).click();
  await page.getByRole('heading', { name: 'Earnings', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Current shift summary', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Finance transaction history', exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Delivery Earning', { exact: true }).waitFor({ state: 'visible' });
  await page.getByLabel('Earnings period').selectOption('rolling_7_days');
  await page.getByRole('heading', { name: 'Last 7 days summary', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Load more transactions' }).click();
  await page.getByText('Tip', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Generate statement' }).click();
  await page.getByText('Finance statement is ready to download.').waitFor({ state: 'visible' });
  const statementDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const downloadedStatement = await statementDownload;
  assert.match(downloadedStatement.suggestedFilename(), /^nexg-rider-statement-[0-9a-f-]+\.csv$/i);
  assert.equal(statementDownloads.length, 1, 'statement is retrieved through the authenticated Finance route');
  assert.ok(financeReads.includes('summary:rolling_7_days'));
  assert.ok(financeReads.includes('transactions:fixture-earnings-cursor'));
  assert.ok(financeReads.includes('statements:rolling_7_days'));
  await page.getByLabel('Earnings period').selectOption('month');
  await page.getByRole('heading', { name: 'This month summary', exact: true }).waitFor({ state: 'visible' });
  assert.ok(financeReads.includes('summary:month'), 'month totals come from the configured Finance period');
  assert.ok(financeReads.includes('statements:month'), 'statement list follows the selected Finance period');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Go online' }).click();
  await page.getByRole('button', { name: 'Go offline' }).waitFor({ state: 'visible' });

  await page.getByRole('button', { name: 'Jobs', exact: true }).click();
  await page.getByRole('heading', { name: 'Jobs', exact: true }).waitFor({ state: 'visible' });
  await page.getByLabel('Search jobs').fill('Fixture Merchant');
  await page.getByRole('button', { name: 'Search jobs' }).click();
  await page.getByText('Fixture Merchant', { exact: true }).first().waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Fixture Merchant.*offer_fixture_001/s }).click();
  await page.getByText('Fixture pickup address', { exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.getByText('2 item lines').isVisible(), true);
  await page.getByRole('button', { name: 'Accept offer' }).click();
  await page.getByText('Assigned work', { exact: true }).waitFor({ state: 'visible' });
  assert.ok(observedMutations.includes('accept-offer'));

  await page.getByRole('button', { name: 'Deliveries', exact: true }).click();
  await page.getByRole('heading', { name: 'Deliveries', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Fixture Merchant.*delivery_fixture_001/s }).click();
  await page.getByText('Fixture drop-off address', { exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.getByText(/\+2547••••11/).isVisible(), true);

  await page.getByRole('button', { name: 'Request cancellation' }).click();
  await page.getByRole('button', { name: 'Send cancellation request' }).click();
  await page.getByText(/Pending · Customer Unavailable/).waitFor({ state: 'visible' });

  await page.getByRole('button', { name: 'Arrived at pickup' }).click();
  const pickupProof = page.getByLabel('QR or OTP code');
  await pickupProof.fill('invalid-code');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await page.getByText('That code did not match this delivery or proof stage.').waitFor({ state: 'visible' });
  await pickupProof.fill('246810');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await page.getByText('Owner-verified proof is ready to attach to this delivery stage.').waitFor({ state: 'visible' });
  await page.getByText('OTP · Verified · Ready', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Confirm pickup with proof' }).click();
  await page.getByRole('button', { name: 'Arrived at drop-off' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Arrived at drop-off' }).click();
  const complete = page.getByRole('button', { name: 'Complete with proof' });
  await page.getByText('Completion requires owner-verified proof.').waitFor({ state: 'visible' });
  assert.equal(await complete.isDisabled(), true, 'delivery must remain open without owner-verified proof');

  await page.getByRole('button', { name: 'Create short-lived badge' }).click();
  await page.getByText('Show this code to verify your active Rider assignment').waitFor({ state: 'visible' });
  assert.equal(await page.locator('svg').filter({ has: page.locator('title', { hasText: 'One-time Rider verification badge QR code' }) }).count(), 1);
  const badgePage = await context.newPage();
  await badgePage.route('**/api/v1/rider/badges/verify', async (route) => {
    const request = route.request();
    assert.equal(request.headers().cookie, undefined, 'public badge checks must not send the Rider session cookie');
    assert.equal(request.headers().authorization, undefined, 'public badge checks must not send an Authorization token');
    assert.equal(request.postDataJSON().token, badgeCredential);
    return response(route, 200, { data: { verified: true, status: 'arrived_drop', rider_profile: null } });
  });
  await badgePage.goto(`${base}/?page=rider_badge#${encodeURIComponent(badgeCredential)}`, { waitUntil: 'domcontentloaded' });
  await badgePage.getByText('Verified NEXG Rider', { exact: true }).waitFor({ state: 'visible' });
  assert.equal(new URL(badgePage.url()).hash, '', 'one-time badge credential must be removed from the visible URL');
  assert.equal(await badgePage.getByText('Portal Test Rider', { exact: true }).count(), 0, 'badge profile remains private without opt-in');
  await badgePage.close();

  const fileInput = page.getByLabel('Capture or choose photo');
  await fileInput.setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(2_097_153) });
  await page.getByText('Photo proof must be 2 MB or smaller.').waitFor({ state: 'visible' });
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=', 'base64');
  await fileInput.setInputFiles({ name: 'delivery-proof.png', mimeType: 'image/png', buffer: tinyPng });
  await page.getByRole('button', { name: 'Submit photo proof' }).click();
  await page.getByText('Photo was decoded, cleaned and stored as private encrypted proof.').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'View photo proof' }).click();
  await page.getByRole('img', { name: 'Private delivery photo proof' }).waitFor({ state: 'visible' });
  assert.equal(retrievedPhotoProofs.length, 1, 'the dashboard retrieves a photo proof through the authenticated Rider route');
  await page.getByRole('button', { name: 'Hide photo proof' }).click();
  await page.getByLabel('QR or OTP code').fill('delivery-owner-qr-code');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await page.getByText('Owner-verified proof is ready to attach to this delivery stage.').waitFor({ state: 'visible' });
  await page.getByText('QR · Verified · Ready', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('QR events are synced from the QR owner into the Rider event projection.').waitFor({ state: 'visible' });
  await complete.click();
  assert.equal(delivery.status, 'DELIVERED');
  assert.deepEqual(observedMutations, ['accept-offer', 'request-cancellation', 'arrive-at-pickup', 'verify-pickup-otp', 'confirm-pickup', 'arrive-at-drop', 'submit-photo-proof', 'verify-delivery-qr', 'complete']);

  await page.getByRole('button', { name: /Sign out/ }).click();
  await page.getByRole('heading', { name: 'Rider sign in' }).waitFor({ state: 'visible', timeout: 10000 });
  delivery = { ...delivery, id: 'delivery_fixture_002', status: 'ACCEPTED', version: 1, updated_at: asOf };
  assigned = [delivery];
  offers = [];
  proofHistory = [];
  proofEvents = [];
  signedIn = false;
  await page.getByLabel('Phone number').fill('+254700000111');
  await page.getByLabel('PIN').fill('1234');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await page.getByRole('button', { name: 'Deliveries', exact: true }).click();
  await page.getByRole('button', { name: /Fixture Merchant.*delivery_fixture_002/s }).click();
  await page.getByRole('button', { name: 'Report a problem' }).click();
  await page.getByRole('button', { name: 'Submit failure report' }).click();
  await page.getByText('Failure reason', { exact: true }).waitFor({ state: 'visible' });
  assert.equal(delivery.status, 'FAILED');
  assert.deepEqual(observedMutations, ['accept-offer', 'request-cancellation', 'arrive-at-pickup', 'verify-pickup-otp', 'confirm-pickup', 'arrive-at-drop', 'submit-photo-proof', 'verify-delivery-qr', 'complete', 'report-failure']);
  await page.getByRole('button', { name: /Sign out/ }).click();
  await page.getByRole('heading', { name: 'Rider sign in' }).waitFor({ state: 'visible', timeout: 10000 });
  assert.deepEqual(pageErrors, []);
  console.log('PASS: Rewards dashboard and workspace; progress/history/badges and Finance-confirmed amount; connected Finance earnings; period filtering; cursor paging; CSRF/idempotent statement creation; private CSV download; jobs/deliveries; owner-bound proof; proof-gated completion; one-time badge; sign-out');
} finally {
  await browser.close();
}
