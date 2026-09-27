import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  Award,
  ArrowLeft,
  ArrowRight,
  Bike,
  Bell,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  Moon,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  TrendingUp,
  Target,
  Wallet,
  Zap,
} from 'lucide-react';
import LogoIcon from './LogoIcon';
import { useTheme } from '../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';

type PortalPage = 'home' | 'couriers';
type RiderPortalProps = { onNavigate: (page: PortalPage) => void };
type RiderIdentity = {
  account_id: string;
  display_name: string | null;
  phone: string | null;
  profile_status: string;
};
type WidgetStatus = 'ready' | 'empty' | 'unavailable' | 'partial';
type Widget<T = unknown> = {
  status: WidgetStatus;
  value: T | null;
  source: string;
  as_of: string | null;
  message?: string;
};
type AssignedJob = {
  id: string;
  status: string;
  version?: number;
  merchant_name: string | null;
  created_at: string;
  updated_at: string;
  scheduled_at?: string | null;
  priority?: boolean | null;
};
type RiderAvailability = { online: boolean; eligible: boolean; reason: string | null; version: number; as_of: string };
type RiderOffer = {
  id: string;
  version: number;
  status: string;
  merchant: { display_name: string };
  pickup_area: string | null;
  pickup_address?: string | null;
  scheduled_at: string | null;
  priority: boolean | null;
  created_at: string;
  order_summary?: { line_count: number };
};
type RiderDelivery = {
  id: string;
  status: string;
  version: number;
  merchant: { display_name: string } | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  customer?: { display_name: string | null; masked_phone: string | null } | null;
  order?: { lines: Array<{ title: string; quantity: number }> };
  created_at: string;
  updated_at: string;
  scheduled_at?: string | null;
  priority?: boolean | null;
  failure_reason_code?: string | null;
  cancellation_request?: { status: string; reason_code: string } | null;
};
type RiderProof = {
  proof_id: string;
  delivery_id: string;
  purpose: 'pickup' | 'delivery';
  method: 'qr' | 'otp' | 'photo';
  status: 'READY' | 'RESERVED' | 'CONSUMED';
  version: number;
  verified_at: string;
};
type ProofHistoryItem = {
  id: string;
  delivery_id: string | null;
  purpose: string | null;
  result_code: string;
  proof_id: string | null;
  proof_status: 'READY' | 'RESERVED' | 'CONSUMED' | null;
  method: 'qr' | 'otp' | 'photo' | null;
  occurred_at: string;
};
type ProofEvent = { id: string; type: string; subject: string; time: string; data: Record<string, unknown> };
type BarcodeDetectorApi = new (options: { formats: string[] }) => { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> };
type Page<T> = { data: T[]; next_cursor: string | null; as_of: string };
type AssignedPage = { items: AssignedJob[]; active_count: number; completed_count: number; as_of: string };
type FinancePeriod = 'current_shift' | 'rolling_7_days' | 'month';
type FinanceCurrencyTotals = { currency: string; delivery_earnings_minor: number; bonuses_minor: number; tips_minor: number; payable_minor: number };
type FinanceSummary = {
  status: WidgetStatus;
  source: 'Finance API';
  as_of: string | null;
  period: { key: FinancePeriod; starts_at: string; ends_at: string; time_zone: string } | null;
  by_currency: FinanceCurrencyTotals[] | null;
  message?: string | null;
};
type FinanceEntry = { id: string; category: string; amount_minor: number; payable_delta_minor: number; currency: string; occurred_at: string; source_reference: string | null };
type FinanceTransactionPage = { status: WidgetStatus; items: FinanceEntry[]; next_cursor: string | null; as_of: string | null; message?: string | null };
type FinanceStatement = { id: string; period: FinancePeriod; period_start: string; period_end: string; time_zone: string; generated_at: string; download_path: string };
type FinanceStatementList = { status: WidgetStatus; items: FinanceStatement[]; as_of: string | null; message?: string | null };
type FinanceStatementResult = { status: 'created' | 'replayed' | 'empty' | 'unavailable'; statement?: FinanceStatement; message?: string | null };
type RewardProgress = { program_id: string; program_version: number; feature: string; title: string; status: 'active' | 'completed' | 'expired' | 'source_unavailable'; progress: number; target: number; unit: string; currency: string | null; starts_at: string; ends_at: string | null; time_zone: string; as_of: string | null };
type RewardAward = { award_id: string; program_id: string; program_version: number; kind: string; title: string; status: string; amount_minor: number | null; currency: string | null; finance_entry_id: string | null; badge_id: string | null; earned_at: string };
type RewardBadge = { badge_id: string; program_id: string; program_version: number; label: string; icon_key: string; public_tracking: boolean; earned_at: string };
type RewardsSummary = { status: WidgetStatus; source: 'Rewards API'; as_of: string | null; message?: string; streaks: RewardProgress[]; challenges: RewardProgress[]; bonuses: RewardAward[] };
type RewardsHistory = { status: WidgetStatus; items: RewardAward[]; next_cursor: string | null; as_of: string | null };
type RewardsBadges = { status: WidgetStatus; items: RewardBadge[]; as_of: string | null };
type Workspace = 'dashboard' | 'jobs' | 'deliveries' | 'earnings' | 'rewards';
type RiderDashboard = {
  as_of: string;
  widgets: {
    availability: Widget;
    assigned_jobs: Widget<{ items: AssignedJob[]; count: number }>;
    earnings_today: Widget<FinanceSummary>;
    completed_deliveries: Widget<{ total: number }>;
    performance_summary: Widget;
    active_delivery: Widget<AssignedJob>;
    incentives_and_bonuses: Widget<RewardsSummary>;
    recent_notifications: Widget;
    quick_actions: Widget<Array<{ id: string; label: string }>>;
  };
};

const API = '/api/v1/rider';
const sections = [
  ['availability', 'Availability'],
  ['assigned-jobs', 'Assigned jobs'],
  ['earnings-today', 'Earnings'],
  ['completed-deliveries', 'Completed'],
  ['performance-summary', 'Performance'],
  ['active-delivery', 'Active delivery'],
  ['incentives', 'Incentives'],
  ['recent-notifications', 'Notifications'],
  ['quick-actions', 'Quick actions'],
] as const;

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null) as { data?: T; error?: string; code?: string } | null;
  if (!response.ok) {
    const error = new Error(body?.error ?? body?.code ?? 'rider_service_unavailable') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body?.data as T;
}

function extractScannedCredential(rawValue: string) {
  const value = rawValue.trim();
  try {
    const parsed = JSON.parse(value) as { credential?: unknown; code?: unknown; token?: unknown };
    for (const candidate of [parsed.credential, parsed.code, parsed.token]) if (typeof candidate === 'string') return candidate;
  } catch {
    // The owner QR may be the opaque credential itself rather than JSON.
  }
  try {
    const url = new URL(value);
    for (const key of ['credential', 'code', 'token']) {
      const candidate = url.searchParams.get(key);
      if (candidate) return candidate;
    }
  } catch {
    // An opaque code is expected for the QR/OTP handshake.
  }
  return value;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    ACCEPTED: 'Accepted',
    ARRIVED_PICKUP: 'At pickup',
    PICKED: 'Picked up',
    ARRIVED_DROP: 'At delivery',
    not_submitted: 'Profile not submitted',
    pending: 'Profile pending review',
    approved: 'Approved rider',
    rejected: 'Profile needs attention',
    finance_pending: 'Awaiting Finance confirmation',
    finance_unknown: 'Finance confirmation pending',
    posted: 'Posted by Finance',
    reversed: 'Reversed by Finance',
    source_unavailable: 'Source not connected',
  };
  return labels[status] ?? status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatMoneyMinor(amountMinor: number, currency: string) {
  try {
    const formatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits;
    return formatter.format(amountMinor / (10 ** fractionDigits));
  } catch {
    return `${amountMinor} ${currency} minor units`;
  }
}

function financePeriodLabel(period: FinancePeriod) {
  const labels: Record<FinancePeriod, string> = {
    current_shift: 'Current shift',
    rolling_7_days: 'Last 7 days',
    month: 'This month',
  };
  return labels[period];
}

function Surface({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`min-w-0 rounded-2xl border p-5 sm:p-6 ${className}`}>{children}</section>;
}

function WidgetMeta({ widget, secondaryText }: { widget: Widget; secondaryText: string }) {
  const updated = formatTime(widget.as_of);
  return (
    <div className={`mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-3 text-xs ${secondaryText}`}>
      <span>Source: {widget.source}</span>
      {updated && <time dateTime={widget.as_of ?? undefined}>Updated {updated}</time>}
    </div>
  );
}

function Unavailable({ widget, secondaryText, isLight }: { widget: Widget; secondaryText: string; isLight: boolean }) {
  return (
    <div className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed ${isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-white/10 bg-white/[0.025] text-gray-300'}`}>
      {widget.message ?? 'This information is not available yet.'}
      <WidgetMeta widget={widget} secondaryText={secondaryText} />
    </div>
  );
}

function SectionTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#B88728] dark:text-[#E5B65F]">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight sm:text-xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>{title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

export default function RiderPortal({ onNavigate }: RiderPortalProps) {
  const { isLight, toggleTheme } = useTheme();
  const initialWorkspace = new URLSearchParams(window.location.search).get('workspace');
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace === 'jobs' || initialWorkspace === 'deliveries' || initialWorkspace === 'earnings' || initialWorkspace === 'rewards' ? initialWorkspace : 'dashboard');
  const [identity, setIdentity] = useState<RiderIdentity | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [dashboard, setDashboard] = useState<RiderDashboard | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [authError, setAuthError] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [availability, setAvailability] = useState<RiderAvailability | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [offers, setOffers] = useState<RiderOffer[]>([]);
  const [assigned, setAssigned] = useState<AssignedPage | null>(null);
  const [offersCursor, setOffersCursor] = useState<string | null>(null);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsScheduled, setJobsScheduled] = useState('all');
  const [jobsPriority, setJobsPriority] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<RiderOffer | null>(null);
  const [deliveries, setDeliveries] = useState<AssignedPage | null>(null);
  const [history, setHistory] = useState<Page<RiderDelivery> | null>(null);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historySince, setHistorySince] = useState('');
  const [historyUntil, setHistoryUntil] = useState('');
  const [earningsPeriod, setEarningsPeriod] = useState<FinancePeriod>('current_shift');
  const [earningsSummary, setEarningsSummary] = useState<FinanceSummary | null>(null);
  const [earningTransactions, setEarningTransactions] = useState<FinanceTransactionPage | null>(null);
  const [earningStatements, setEarningStatements] = useState<FinanceStatementList | null>(null);
  const [financeBusy, setFinanceBusy] = useState(false);
  const [financeError, setFinanceError] = useState('');
  const [statementMessage, setStatementMessage] = useState('');
  const [statementBusy, setStatementBusy] = useState(false);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [rewardsHistory, setRewardsHistory] = useState<RewardsHistory | null>(null);
  const [rewardsBadges, setRewardsBadges] = useState<RewardsBadges | null>(null);
  const [rewardsBusy, setRewardsBusy] = useState(false);
  const [rewardsError, setRewardsError] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<RiderDelivery | null>(null);
  const [proofHistory, setProofHistory] = useState<Page<ProofHistoryItem> | null>(null);
  const [proofEvents, setProofEvents] = useState<ProofEvent[]>([]);
  const [openPhotoProofId, setOpenPhotoProofId] = useState<string | null>(null);
  const [verifiedProof, setVerifiedProof] = useState<RiderProof | null>(null);
  const [proofCredential, setProofCredential] = useState('');
  const [proofMessage, setProofMessage] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [shareProfile, setShareProfile] = useState(false);
  const [badgeUrl, setBadgeUrl] = useState('');
  const [badgeExpiresAt, setBadgeExpiresAt] = useState('');
  const [reasonCode, setReasonCode] = useState('customer_unavailable');
  const [pendingReasonAction, setPendingReasonAction] = useState<'report-failure' | 'request-cancellation' | null>(null);
  const idempotencyKeys = useRef(new Map<string, string>());
  const scannerVideo = useRef<HTMLVideoElement>(null);
  const scannerStream = useRef<MediaStream | null>(null);
  const scannerTimer = useRef<number | null>(null);
  const proofPurpose = selectedDelivery?.status === 'ARRIVED_PICKUP' ? 'pickup'
    : selectedDelivery?.status === 'ARRIVED_DROP' ? 'delivery' : null;
  const currentWorkspaceRefresh = useRef<() => void>(() => undefined);

  const page = isLight ? 'bg-[#F7F8FA] text-[#1A1D20]' : 'bg-[#111315] text-[#F2F2F2]';
  const surface = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#181A1F]';
  const divider = isLight ? 'border-slate-200' : 'border-white/10';
  const secondaryText = isLight ? 'text-slate-600' : 'text-gray-400';
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88728] dark:focus-visible:outline-[#E5B65F]';
  const accent = isLight ? 'text-[#8A6413]' : 'text-[#E5B65F]';

  const loadAvailability = useCallback(async () => {
    try {
      const result = await request<RiderAvailability>('/availability');
      setAvailability(result);
    } catch (error) {
      if ((error as Error & { status?: number }).status === 401) {
        setIdentity(null);
        setCsrfToken('');
      }
    }
  }, []);

  const loadJobs = useCallback(async (options: { cursor?: string | null; append?: boolean; search?: string; scheduled?: string; priority?: string } = {}) => {
    setWorkspaceBusy(true);
    setWorkspaceError('');
    const query = new URLSearchParams({ limit: '20' });
    const search = options.search ?? '';
    const scheduled = options.scheduled ?? 'all';
    const priority = options.priority ?? 'all';
    if (search.trim()) query.set('q', search.trim());
    if (scheduled !== 'all') query.set('scheduled', scheduled);
    if (priority !== 'all') query.set('priority', priority);
    if (options.cursor) query.set('cursor', options.cursor);
    try {
      const [offerPage, assignedJobs] = await Promise.all([
        request<Page<RiderOffer>>(`/jobs/offers?${query.toString()}`),
        request<AssignedPage>('/jobs/assigned'),
      ]);
      setOffers((current) => options.append ? [...current, ...offerPage.data] : offerPage.data);
      setOffersCursor(offerPage.next_cursor);
      setAssigned(assignedJobs);
      if (!options.append && selectedOffer) {
        const fresh = offerPage.data.find((offer) => offer.id === selectedOffer.id);
        setSelectedOffer(fresh ?? null);
      }
    } catch (error) {
      const code = (error as Error).message;
      setWorkspaceError(code === 'rider_not_available' ? 'Go online to receive available offers.' : 'Jobs could not be refreshed from Dispatch. Retry when the service is available.');
    } finally {
      setWorkspaceBusy(false);
    }
  }, [selectedOffer]);

  const loadDeliveries = useCallback(async (filters: { status?: string; since?: string; until?: string } = {}) => {
    setWorkspaceBusy(true);
    setWorkspaceError('');
    const query = new URLSearchParams({ limit: '20' });
    if (filters.status && filters.status !== 'all') query.set('status', filters.status);
    if (filters.since) query.set('since', new Date(`${filters.since}T00:00:00`).toISOString());
    if (filters.until) query.set('until', new Date(`${filters.until}T23:59:59.999`).toISOString());
    try {
      const [active, completed] = await Promise.all([
        request<AssignedPage>('/deliveries/assigned'),
        request<Page<RiderDelivery>>(`/deliveries/history?${query.toString()}`),
      ]);
      setDeliveries(active);
      setHistory(completed);
      if (!active.items.some((item) => item.id === selectedDelivery?.id) && selectedDelivery) setSelectedDelivery(null);
    } catch {
      setWorkspaceError('Deliveries could not be refreshed from Core Delivery. Retry when the service is available.');
    } finally {
      setWorkspaceBusy(false);
    }
  }, [selectedDelivery]);

  const loadEarnings = useCallback(async (period: FinancePeriod = earningsPeriod) => {
    setFinanceBusy(true);
    setFinanceError('');
    setEarningsSummary(null);
    setEarningTransactions(null);
    setEarningStatements(null);
    const query = new URLSearchParams({ period });
    const [summaryResult, transactionsResult, statementsResult] = await Promise.allSettled([
      request<FinanceSummary>(`/earnings?${query.toString()}`),
      request<FinanceTransactionPage>('/earnings/transactions?limit=50'),
      request<FinanceStatementList>(`/earnings/statements?${query.toString()}`),
    ]);
    if (summaryResult.status === 'fulfilled') setEarningsSummary(summaryResult.value);
    if (transactionsResult.status === 'fulfilled') setEarningTransactions(transactionsResult.value);
    if (statementsResult.status === 'fulfilled') setEarningStatements(statementsResult.value);
    if ([summaryResult, transactionsResult, statementsResult].some((result) => result.status === 'rejected')) {
      setFinanceError('Finance details are temporarily unavailable. Retry when the Finance service is available.');
    }
    setFinanceBusy(false);
  }, [earningsPeriod]);

  const loadRewards = useCallback(async () => {
    setRewardsBusy(true);
    setRewardsError('');
    const [summaryResult, historyResult, badgesResult] = await Promise.allSettled([
      request<RewardsSummary>('/rewards'),
      request<RewardsHistory>('/rewards/history?limit=50'),
      request<RewardsBadges>('/rewards/badges'),
    ]);
    if (summaryResult.status === 'fulfilled') setRewardsSummary(summaryResult.value);
    if (historyResult.status === 'fulfilled') setRewardsHistory(historyResult.value);
    if (badgesResult.status === 'fulfilled') setRewardsBadges(badgesResult.value);
    if ([summaryResult, historyResult, badgesResult].some((result) => result.status === 'rejected')) {
      setRewardsError('Rewards details are temporarily unavailable. Retry when the Rewards service is available.');
    }
    setRewardsBusy(false);
  }, []);

  const loadMoreRewardHistory = async () => {
    const cursor = rewardsHistory?.next_cursor;
    if (!cursor || rewardsBusy) return;
    setRewardsBusy(true);
    setRewardsError('');
    try {
      const page = await request<RewardsHistory>(`/rewards/history?${new URLSearchParams({ cursor, limit: '50' })}`);
      setRewardsHistory((current) => current ? { ...page, items: [...current.items, ...page.items] } : page);
    } catch {
      setRewardsError('More reward history could not be loaded. The current entries are still available.');
    } finally {
      setRewardsBusy(false);
    }
  };

  const loadMoreEarnings = async () => {
    const cursor = earningTransactions?.next_cursor;
    if (!cursor || financeBusy) return;
    setFinanceBusy(true);
    setFinanceError('');
    try {
      const query = new URLSearchParams({ cursor, limit: '50' });
      const page = await request<FinanceTransactionPage>(`/earnings/transactions?${query.toString()}`);
      setEarningTransactions((current) => current ? { ...page, items: [...current.items, ...page.items] } : page);
    } catch {
      setFinanceError('More Finance transactions could not be loaded. Your current rows are still available.');
    } finally {
      setFinanceBusy(false);
    }
  };

  const generateStatement = async () => {
    if (!csrfToken || statementBusy) return;
    setStatementBusy(true);
    setStatementMessage('');
    const scope = `finance-statement:${identity?.account_id ?? 'unknown'}:${earningsPeriod}`;
    const key = idempotencyKeys.current.get(scope) ?? crypto.randomUUID();
    idempotencyKeys.current.set(scope, key);
    try {
      const result = await request<FinanceStatementResult>('/earnings/statements', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key },
        body: JSON.stringify({ period: earningsPeriod }),
      });
      idempotencyKeys.current.delete(scope);
      setStatementMessage(result.message ?? (result.status === 'created' || result.status === 'replayed' ? 'Finance statement is ready to download.' : 'No statement is available for this period.'));
      await loadEarnings(earningsPeriod);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status && status < 500) idempotencyKeys.current.delete(scope);
      setStatementMessage('Finance could not generate this statement. Retry when the service is available.');
    } finally {
      setStatementBusy(false);
    }
  };

  const downloadStatement = async (statement: FinanceStatement) => {
    setStatementMessage('');
    try {
      const response = await fetch(`${API}/earnings/statements/${encodeURIComponent(statement.id)}/download`, {
        credentials: 'include', cache: 'no-store', headers: { Accept: 'text/csv' },
      });
      if (!response.ok) throw new Error('statement_download_failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nexg-rider-statement-${statement.id}.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatementMessage('Finance statement downloaded.');
    } catch {
      setStatementMessage('Finance could not download this statement. Retry when the service is available.');
    }
  };

  const loadProofActivity = async (deliveryId: string) => {
    setOpenPhotoProofId(null);
    const query = new URLSearchParams({ delivery_id: deliveryId, limit: '50' });
    try {
      const historyPage = await request<Page<ProofHistoryItem>>(`/proofs/history?${query.toString()}`);
      setProofHistory(historyPage);
      const latestProof = historyPage.data.find((entry) => entry.delivery_id === deliveryId && entry.proof_id && (entry.proof_status === 'READY' || entry.proof_status === 'RESERVED'));
      setVerifiedProof(latestProof?.proof_id && latestProof.purpose && latestProof.method && latestProof.proof_status
        ? { proof_id: latestProof.proof_id, delivery_id: deliveryId, purpose: latestProof.purpose as 'pickup' | 'delivery', method: latestProof.method, status: latestProof.proof_status, version: 0, verified_at: latestProof.occurred_at }
        : null);
    } catch {
      setProofHistory(null);
      setVerifiedProof(null);
      setProofMessage('QR proof history is unavailable. Delivery status remains owned by Core Delivery.');
    }
    try {
      const eventPage = await request<Page<ProofEvent>>('/proofs/events');
      setProofEvents(eventPage.data);
    } catch {
      setProofEvents([]);
    }
  };

  const enterWorkspace = (next: Workspace) => {
    setWorkspace(next);
    const url = new URL(window.location.href);
    if (next === 'dashboard') url.searchParams.delete('workspace');
    else url.searchParams.set('workspace', next);
    window.history.replaceState({}, '', url);
    if (next === 'jobs') void loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority });
    if (next === 'deliveries') void loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil });
    if (next === 'rewards') void loadRewards();
  };

  const withIdempotency = async (scope: string, action: (key: string) => Promise<void>) => {
    const key = idempotencyKeys.current.get(scope) ?? crypto.randomUUID();
    idempotencyKeys.current.set(scope, key);
    setActionBusy(true);
    setActionMessage('');
    try {
      await action(key);
      idempotencyKeys.current.delete(scope);
      setActionMessage('Saved by the owner service.');
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status && status < 500 && (error as Error).message !== 'operation_in_progress') idempotencyKeys.current.delete(scope);
      setActionMessage(status && status < 500
        ? 'The owner service rejected this action. Refresh the record and review the latest state.'
        : 'The result is not confirmed. Retry this same action to safely reconcile it with the owner service.');
      throw error;
    } finally {
      setActionBusy(false);
    }
  };

  const stopScanner = () => {
    if (scannerTimer.current !== null) window.clearTimeout(scannerTimer.current);
    scannerTimer.current = null;
    scannerStream.current?.getTracks().forEach((track) => track.stop());
    scannerStream.current = null;
    setScannerActive(false);
  };

  const startScanner = async () => {
    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorApi }).BarcodeDetector;
    if (!Detector) {
      setProofMessage('QR camera scanning is unavailable in this browser. Enter the QR or OTP code below.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !scannerVideo.current) {
      setProofMessage('Camera access is unavailable here. Enter the QR or OTP code below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      scannerStream.current = stream;
      scannerVideo.current.srcObject = stream;
      await scannerVideo.current.play();
      setScannerActive(true);
      setProofMessage('Point the camera at the owner-issued QR code.');
      const detector = new Detector({ formats: ['qr_code'] });
      const scan = async () => {
        const video = scannerVideo.current;
        if (!video || !scannerStream.current) return;
        try {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const values = await detector.detect(video);
            if (values[0]?.rawValue) {
              setProofCredential(extractScannedCredential(values[0].rawValue));
              setProofMessage('QR code captured. Verify it with the QR owner service.');
              stopScanner();
              return;
            }
          }
          scannerTimer.current = window.setTimeout(() => { void scan(); }, 250);
        } catch {
          stopScanner();
          setProofMessage('The QR code could not be read. Check camera permission or enter the code manually.');
        }
      };
      void scan();
    } catch {
      stopScanner();
      setProofMessage('Camera permission was not granted. Enter the QR or OTP code manually.');
    }
  };

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => () => {
    if (scannerTimer.current !== null) window.clearTimeout(scannerTimer.current);
    scannerStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const saveAvailability = async () => {
    if (!availability) return;
    setAvailabilityBusy(true);
    setWorkspaceError('');
    try {
      const online = !availability.online;
      await withIdempotency(`availability:${online}:${availability.version}`, async (key) => {
        const result = await request<RiderAvailability>('/availability', {
          method: 'PUT',
          headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key, 'If-Match': `"${availability.version}"` },
          body: JSON.stringify({ online, expected_version: availability.version }),
        });
        setAvailability(result);
      });
      await loadAvailability();
    } catch (error) {
      setWorkspaceError((error as Error).message === 'rider_not_approved'
        ? 'Only an approved Rider can go online.'
        : 'Availability was not changed. Refresh its owner state before trying again.');
    } finally {
      setAvailabilityBusy(false);
    }
  };

  currentWorkspaceRefresh.current = () => {
    if (workspace === 'jobs') void loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority });
    if (workspace === 'deliveries') void loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil });
  };

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setServiceError('');
    try {
      const result = await request<RiderDashboard>('/dashboard');
      setDashboard(result);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) {
        setIdentity(null);
        setDashboard(null);
        setCsrfToken('');
      } else {
        setServiceError('The Rider service could not refresh this dashboard. Your session is still held securely; retry when the service is available.');
      }
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    let active = true;
    request<{ identity: RiderIdentity; csrf_token: string }>('/session')
      .then(async (session) => {
        if (!active) return;
        setIdentity(session.identity);
        setCsrfToken(session.csrf_token);
        setLoadingSession(false);
        await fetchDashboard();
      })
      .catch((error) => {
        if (!active) return;
        const status = (error as Error & { status?: number }).status;
        if (status === 401) {
          setIdentity(null);
        } else {
          setServiceError('The Rider service is not reachable. Start the local Rider API and try again.');
        }
        setLoadingSession(false);
      });
    return () => { active = false; };
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setAuthError('');
    setServiceError('');
    try {
      const session = await request<{ identity: RiderIdentity; csrf_token: string }>('/session', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), pin }),
      });
      setIdentity(session.identity);
      setCsrfToken(session.csrf_token);
      setPin('');
      await fetchDashboard();
    } catch (error) {
      const code = (error as Error).message;
      setAuthError(code === 'invalid_credentials' ? 'Phone number or PIN was not accepted.'
        : code === 'rider_access_required' ? 'This account does not have Rider access.'
          : code === 'too_many_attempts' ? 'Too many sign-in attempts. Wait a few minutes and try again.'
            : code === 'platform_unavailable' ? 'NEXG Identity is not reachable right now.'
              : 'Rider sign-in failed. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setServiceError('');
    try {
      await request('/session', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
      setIdentity(null);
      setDashboard(null);
      setCsrfToken('');
      setAvailability(null);
      setSelectedDelivery(null);
      setSelectedOffer(null);
    } catch {
      setServiceError('Sign out could not reach the Rider service. Retry when it is available.');
    }
  };

  const openOffer = async (offerId: string) => {
    setWorkspaceError('');
    try {
      setSelectedOffer(await request<RiderOffer>(`/jobs/offers/${encodeURIComponent(offerId)}`));
    } catch {
      setWorkspaceError('That offer is no longer available. Refresh the offer list.');
      await loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority });
    }
  };

  const actOnOffer = async (action: 'accept' | 'decline') => {
    if (!selectedOffer) return;
    const offer = selectedOffer;
    try {
      await withIdempotency(`offer:${offer.id}:${action}`, async (key) => {
        await request(`/jobs/offers/${encodeURIComponent(offer.id)}/${action}`, {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key, 'If-Match': `"${offer.version}"` },
          body: JSON.stringify({ expected_version: offer.version }),
        });
      });
      setSelectedOffer(null);
      await Promise.all([
        loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority }),
        fetchDashboard(),
      ]);
    } catch {
      setWorkspaceError('The offer response was not confirmed. Refresh the offer before another action.');
    }
  };

  const openDelivery = async (deliveryId: string) => {
    setWorkspaceError('');
    try {
      setSelectedDelivery(await request<RiderDelivery>(`/deliveries/${encodeURIComponent(deliveryId)}`));
      setPendingReasonAction(null);
      setProofCredential('');
      setBadgeUrl('');
      setShareProfile(false);
      stopScanner();
      await loadProofActivity(deliveryId);
    } catch {
      setWorkspaceError('Delivery details could not be loaded for this Rider account. Refresh the list.');
    }
  };

  const runDeliveryCommand = async (command: string, reason?: string, proofId?: string) => {
    if (!selectedDelivery) return;
    const delivery = selectedDelivery;
    try {
      await withIdempotency(`delivery:${delivery.id}:${command}:${reason ?? ''}`, async (key) => {
        const updated = await request<RiderDelivery>(`/deliveries/${encodeURIComponent(delivery.id)}/commands/${command}`, {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key, 'If-Match': `"${delivery.version}"` },
          body: JSON.stringify({ expected_version: delivery.version, ...(reason ? { reason_code: reason } : {}), ...(proofId ? { proof_id: proofId } : {}) }),
        });
        setSelectedDelivery(updated);
      });
      setPendingReasonAction(null);
      if (proofId) setVerifiedProof(null);
      await Promise.all([
        loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil }),
        fetchDashboard(),
      ]);
      await loadProofActivity(delivery.id);
    } catch {
      setWorkspaceError('The delivery command was not confirmed. Refresh this delivery before trying another command.');
    }
  };

  const verifyProofCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDelivery || !proofPurpose || !proofCredential.trim()) return;
    setProofBusy(true);
    try {
      await withIdempotency(`proof:${selectedDelivery.id}:${proofPurpose}`, async (key) => {
        const proof = await request<RiderProof>('/proofs/verify', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key },
          body: JSON.stringify({ delivery_id: selectedDelivery.id, purpose: proofPurpose, credential: proofCredential.trim() }),
        });
        setVerifiedProof(proof);
      });
      setProofCredential('');
      setProofMessage('Owner-verified proof is ready to attach to this delivery stage.');
      await loadProofActivity(selectedDelivery.id);
    } catch (error) {
      const code = (error as Error).message;
      setProofMessage(code === 'proof_invalid' ? 'That code did not match this delivery or proof stage.'
        : code === 'proof_expired' ? 'That code has expired. Ask the customer or merchant for a new code.'
          : code === 'proof_attempt_limit' ? 'Too many attempts. Ask the delivery owner to issue a new code.'
            : 'Proof was not confirmed. Retry the same code to reconcile the owner response.');
    } finally {
      setProofBusy(false);
    }
  };

  const uploadPhotoProof = async () => {
    if (!selectedDelivery || !proofPurpose || !photoFile) return;
    setProofBusy(true);
    try {
      await withIdempotency(`photo:${selectedDelivery.id}:${proofPurpose}`, async (key) => {
        const proof = await request<RiderProof>(`/proofs/photo?delivery_id=${encodeURIComponent(selectedDelivery.id)}&purpose=${proofPurpose}`, {
          method: 'POST',
          headers: { 'Content-Type': photoFile.type, 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key },
          body: photoFile,
        });
        setVerifiedProof(proof);
      });
      setPhotoFile(null);
      setProofMessage('Photo was decoded, cleaned and stored as private encrypted proof.');
      await loadProofActivity(selectedDelivery.id);
    } catch {
      setProofMessage('Photo proof was not confirmed. Select the same photo and retry to reconcile the owner response.');
    } finally {
      setProofBusy(false);
    }
  };

  const createRiderBadge = async () => {
    if (!selectedDelivery) return;
    setProofBusy(true);
    setProofMessage('');
    try {
      await withIdempotency(`badge:${selectedDelivery.id}:${shareProfile}`, async (key) => {
        const result = await request<{ token: string; expires_at: string }>('/badges', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key },
          body: JSON.stringify({ delivery_id: selectedDelivery.id, share_profile: shareProfile }),
        });
        const link = new URL(window.location.href);
        link.searchParams.set('page', 'rider_badge');
        link.searchParams.delete('workspace');
        link.hash = result.token;
        setBadgeUrl(link.toString());
        setBadgeExpiresAt(result.expires_at);
      });
      setProofMessage('Short-lived Rider badge created. Show its QR code to the person checking your assignment.');
    } catch {
      setProofMessage('Rider badge could not be issued for this active assignment.');
    } finally {
      setProofBusy(false);
    }
  };

  useEffect(() => {
    if (!identity) return;
    void loadAvailability();
    if (workspace === 'jobs') void loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority });
    if (workspace === 'deliveries') void loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil });
  }, [identity?.account_id]);

  useEffect(() => {
    if (!identity || workspace !== 'earnings') return;
    void loadEarnings(earningsPeriod);
  }, [identity?.account_id, workspace, earningsPeriod, loadEarnings]);

  useEffect(() => {
    if (!identity || workspace !== 'rewards') return;
    void loadRewards();
  }, [identity?.account_id, workspace, loadRewards]);

  useEffect(() => {
    if (!identity) return;
    let active = true;
    const sync = async () => {
      try {
        const page = await request<Page<{ id: string; type: string }>>('/events?limit=100');
        if (!active || page.data.length === 0) return;
        await Promise.all([fetchDashboard(), loadAvailability()]);
        currentWorkspaceRefresh.current();
      } catch {
        // Event synchronization is a convenience; the owner list APIs remain authoritative.
      }
    };
    void sync();
    const timer = window.setInterval(() => { void sync(); }, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [identity?.account_id]);

  const today = new Intl.DateTimeFormat('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  if (loadingSession) {
    return (
      <div className={`flex min-h-screen flex-1 items-center justify-center ${page}`}>
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300" role="status">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking Rider session…
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className={`min-h-screen flex-1 ${page}`}>
        <header className={`border-b ${divider} ${isLight ? 'bg-white' : 'bg-[#111315]'}`}>
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => onNavigate('couriers')} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold ${secondaryText} ${focus}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">For couriers</span>
              </button>
              <span className={`h-7 border-l ${divider}`} aria-hidden="true" />
              <button type="button" onClick={() => onNavigate('home')} aria-label="NEXG App home" className={focus}>
                <LogoIcon variant="wordmark" className="h-6 w-auto" />
              </button>
            </div>
            <button type="button" onClick={toggleTheme} aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'} className={`flex h-10 w-10 items-center justify-center rounded-full border ${divider} ${focus}`}>
              {isLight ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </header>
        <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-16">
          <div className="max-w-2xl">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isLight ? 'border-amber-300 bg-amber-50 text-[#76530B]' : 'border-[#E5B65F]/30 bg-[#E5B65F]/10 text-[#F2D69B]'}`}>
              <Bike className="h-3.5 w-3.5" aria-hidden="true" /> Rider workspace
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Your workday, in one place.</h1>
            <p className={`mt-4 max-w-xl text-base leading-relaxed sm:text-lg ${secondaryText}`}>
              Sign in with your NEXG Rider account to see assigned deliveries and the connected services available to your account.
            </p>
            <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm ${secondaryText}`}>
              <span className="inline-flex items-center gap-2"><ShieldCheck className={`h-4 w-4 ${accent}`} aria-hidden="true" /> Central account verification</span>
              <span className="inline-flex items-center gap-2"><PackageCheck className={`h-4 w-4 ${accent}`} aria-hidden="true" /> Assigned work only</span>
            </div>
          </div>
          <Surface className={`${surface} p-6 sm:p-8`}>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>Rider sign in</h2>
            <p className={`mt-2 text-sm leading-relaxed ${secondaryText}`}>Use the phone number and PIN on your NEXG Rider account.</p>
            {serviceError && (
              <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{serviceError}</div>
            )}
            {authError && (
              <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{authError}</div>
            )}
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold" htmlFor="rider-phone">Phone number</label>
              <input id="rider-phone" name="phone" type="tel" autoComplete="username" inputMode="tel" required maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} className={`min-h-12 w-full rounded-xl border px-3 text-base ${divider} ${isLight ? 'bg-white text-slate-900' : 'bg-[#111315] text-white'} ${focus}`} />
              <label className="block pt-1 text-sm font-semibold" htmlFor="rider-pin">PIN</label>
              <input id="rider-pin" name="pin" type="password" autoComplete="current-password" inputMode="numeric" required maxLength={64} value={pin} onChange={(event) => setPin(event.target.value)} className={`min-h-12 w-full rounded-xl border px-3 text-base ${divider} ${isLight ? 'bg-white text-slate-900' : 'bg-[#111315] text-white'} ${focus}`} />
              <button type="submit" disabled={submitting} className={`mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${isLight ? 'bg-[#B88728] text-slate-950 hover:bg-[#9e721d]' : 'bg-[#E5B65F] text-[#17130B] hover:bg-[#d6a54d]'} ${focus}`}>
                {submitting ? <><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>
            <p className={`mt-5 border-t pt-4 text-xs leading-relaxed ${divider} ${secondaryText}`}>Rider access is issued through NEXG. This portal will not create an account or store your PIN in the browser.</p>
          </Surface>
        </main>
      </div>
    );
  }

  const widgets = dashboard?.widgets;
  const assignedWidget = widgets?.assigned_jobs;
  const assignedJobs = assignedWidget?.status === 'ready' || assignedWidget?.status === 'empty'
    ? assignedWidget.value?.items ?? [] : [];
  const activeWidget = widgets?.active_delivery;
  const activeDelivery = activeWidget?.status === 'ready' ? activeWidget.value : null;
  const completedWidget = widgets?.completed_deliveries;
  const completedTotal = completedWidget?.status === 'ready' ? completedWidget.value?.total ?? 0 : null;
  const dashboardEarnings = widgets?.earnings_today?.value ?? null;
  const dashboardRewards = widgets?.incentives_and_bonuses?.value ?? null;
  const rewardProgressItems = dashboardRewards ? [...dashboardRewards.streaks, ...dashboardRewards.challenges] : [];
  const profileNeedsReview = identity.profile_status !== 'approved';
  const badge = (priority: boolean | null | undefined) => priority
    ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-400/10 text-amber-200'}`}>Priority</span>
    : null;
  const filterField = `min-h-11 rounded-xl border px-3 text-sm ${divider} ${isLight ? 'bg-white text-slate-900' : 'bg-[#111315] text-white'} ${focus}`;
  const jobsWorkspace = (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`mb-2 text-sm font-medium ${secondaryText}`}>Dispatch · {formatTime(availability?.as_of ?? null) ?? 'Live owner data'}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Jobs</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${secondaryText}`}>Browse eligible offers and work assigned to your Rider account. Offer acceptance is confirmed by Dispatch.</p>
        </div>
        <button type="button" onClick={() => void loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority })} disabled={workspaceBusy} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>
          <RefreshCw className={`h-4 w-4 ${workspaceBusy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh jobs
        </button>
      </div>
      {workspaceError && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{workspaceError}</div>}
      {actionMessage && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${divider} ${secondaryText}`} role="status">{actionMessage}</div>}
      <form onSubmit={(event) => { event.preventDefault(); void loadJobs({ search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority }); }} className={`mb-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(180px,1fr)_170px_150px_auto] ${surface}`}>
        <label className="sr-only" htmlFor="rider-job-search">Search jobs</label>
        <span className="relative block">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${secondaryText}`} aria-hidden="true" />
          <input id="rider-job-search" value={jobsSearch} onChange={(event) => setJobsSearch(event.target.value)} maxLength={120} placeholder="Search merchant or job ID" className={`${filterField} w-full pl-10`} />
        </span>
        <label className="sr-only" htmlFor="rider-job-scheduled">Scheduled jobs</label>
        <select id="rider-job-scheduled" value={jobsScheduled} onChange={(event) => setJobsScheduled(event.target.value)} className={filterField}>
          <option value="all">All schedules</option><option value="true">Scheduled</option><option value="false">Available now</option>
        </select>
        <label className="sr-only" htmlFor="rider-job-priority">Job priority</label>
        <select id="rider-job-priority" value={jobsPriority} onChange={(event) => setJobsPriority(event.target.value)} className={filterField}>
          <option value="all">All priority</option><option value="true">Priority</option><option value="false">Standard</option>
        </select>
        <button type="submit" disabled={workspaceBusy} className={`min-h-11 rounded-full px-5 text-sm font-bold ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Search jobs</button>
      </form>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)]">
        <div className="space-y-5">
          <Surface className={surface}>
            <SectionTitle icon={<Zap className="h-5 w-5" aria-hidden="true" />} title="Available offers" description="Offers visible only while your approved account is online." />
            {!availability?.online && <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${divider} ${secondaryText}`}>You are offline. Change availability from the dashboard to see eligible offers.</p>}
            {offers.length === 0 ? (
              <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{workspaceBusy ? 'Loading offers…' : 'No eligible offers match these filters.'}</p>
            ) : (
              <ul className={`mt-4 divide-y ${divider}`}>
                {offers.map((offer) => (
                  <li key={offer.id} className="py-3 first:pt-0 last:pb-0">
                    <button type="button" onClick={() => void openOffer(offer.id)} aria-pressed={selectedOffer?.id === offer.id} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${focus} ${selectedOffer?.id === offer.id ? (isLight ? 'bg-amber-50' : 'bg-[#E5B65F]/10') : 'hover:bg-black/[0.025] dark:hover:bg-white/[0.035]'}`}>
                      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{offer.merchant.display_name}</span><span className={`mt-1 block truncate text-xs ${secondaryText}`}>Job {offer.id} · {offer.scheduled_at ? `Scheduled ${formatTime(offer.scheduled_at)}` : `Received ${formatTime(offer.created_at)}`}</span></span>
                      <span className="flex shrink-0 items-center gap-2">{badge(offer.priority)}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {offersCursor && <button type="button" onClick={() => void loadJobs({ cursor: offersCursor, append: true, search: jobsSearch, scheduled: jobsScheduled, priority: jobsPriority })} disabled={workspaceBusy} className={`mt-4 min-h-10 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Load more offers</button>}
          </Surface>
          <Surface className={surface}>
            <SectionTitle icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />} title="Assigned work" description={`${assigned?.active_count ?? 0} active · ${assigned?.completed_count ?? 0} completed`} />
            {!assigned?.items.length ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{workspaceBusy ? 'Loading assigned work…' : 'No active deliveries are assigned to your account.'}</p> : (
              <ul className={`mt-4 divide-y ${divider}`}>
                {assigned.items.map((job) => <li key={job.id} className="py-3 first:pt-0 last:pb-0"><button type="button" onClick={() => void openDelivery(job.id)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${focus}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold">{job.merchant_name ?? 'Assigned delivery'}</span><span className={`mt-1 block text-xs ${secondaryText}`}>Job {job.id} · {formatStatus(job.status)}</span></span><span className="flex items-center gap-2">{badge(job.priority)}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span></button></li>)}
              </ul>
            )}
          </Surface>
        </div>
        <Surface className={`${surface} xl:sticky xl:top-24`}>
          <SectionTitle icon={<MapPin className="h-5 w-5" aria-hidden="true" />} title="Offer details" description="Review pickup and order summary before responding." />
          {!selectedOffer ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>Select an available offer to review its details.</p> : (
            <div className={`mt-4 rounded-xl border p-4 ${divider}`}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-bold">{selectedOffer.merchant.display_name}</p><p className={`mt-1 text-xs ${secondaryText}`}>Offer {selectedOffer.id} · Version {selectedOffer.version}</p></div>{badge(selectedOffer.priority)}</div>
              <dl className={`mt-5 space-y-3 text-sm ${secondaryText}`}>
                <div><dt className="font-semibold text-current">Pickup</dt><dd className="mt-1">{selectedOffer.pickup_address ?? 'Pickup details provided by Dispatch after review.'}</dd></div>
                <div><dt className="font-semibold text-current">Timing</dt><dd className="mt-1">{selectedOffer.scheduled_at ? formatTime(selectedOffer.scheduled_at) : 'Available now'}</dd></div>
                <div><dt className="font-semibold text-current">Order summary</dt><dd className="mt-1">{selectedOffer.order_summary?.line_count ?? 0} item lines</dd></div>
              </dl>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={actionBusy || !availability?.eligible} onClick={() => void actOnOffer('accept')} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Accept offer</button>
                <button type="button" disabled={actionBusy} onClick={() => void actOnOffer('decline')} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Decline for me</button>
              </div>
            </div>
          )}
        </Surface>
      </div>
    </main>
  );
  const deliveriesWorkspace = (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className={`mb-2 text-sm font-medium ${secondaryText}`}>Core Delivery · {deliveries?.as_of ? formatTime(deliveries.as_of) : 'Owner data'}</p><h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Deliveries</h1><p className={`mt-2 max-w-2xl text-sm leading-relaxed ${secondaryText}`}>Track assigned work, record delivery milestones and review your delivery history.</p></div>
        <button type="button" onClick={() => void loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil })} disabled={workspaceBusy} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}><RefreshCw className={`h-4 w-4 ${workspaceBusy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh deliveries</button>
      </div>
      {workspaceError && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{workspaceError}</div>}
      {actionMessage && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${divider} ${secondaryText}`} role="status">{actionMessage}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-5">
          <Surface className={surface}>
            <SectionTitle icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} title="Active deliveries" description={`${deliveries?.active_count ?? 0} active in Core Delivery`} />
            {!deliveries?.items.length ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{workspaceBusy ? 'Loading deliveries…' : 'There are no active deliveries assigned to your account.'}</p> : (
              <ul className={`mt-4 divide-y ${divider}`}>
                {deliveries.items.map((delivery) => <li key={delivery.id} className="py-3 first:pt-0 last:pb-0"><button type="button" onClick={() => void openDelivery(delivery.id)} aria-pressed={selectedDelivery?.id === delivery.id} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${focus} ${selectedDelivery?.id === delivery.id ? (isLight ? 'bg-amber-50' : 'bg-[#E5B65F]/10') : ''}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold">{delivery.merchant_name ?? 'Delivery'}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatStatus(delivery.status)} · {delivery.id}</span></span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button></li>)}
              </ul>
            )}
          </Surface>
          <Surface className={surface}>
            <SectionTitle icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} title="Delivery history" description="Completed, failed and cancelled deliveries assigned to you." />
            <form onSubmit={(event) => { event.preventDefault(); void loadDeliveries({ status: historyStatus, since: historySince, until: historyUntil }); }} className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="sr-only" htmlFor="rider-history-status">History status</label><select id="rider-history-status" value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} className={filterField}><option value="all">All outcomes</option><option value="DELIVERED">Delivered</option><option value="FAILED">Failed</option><option value="CANCELLED">Cancelled</option></select>
              <label className="sr-only" htmlFor="rider-history-since">From date</label><input id="rider-history-since" type="date" value={historySince} onChange={(event) => setHistorySince(event.target.value)} className={filterField} />
              <label className="sr-only" htmlFor="rider-history-until">To date</label><input id="rider-history-until" type="date" value={historyUntil} onChange={(event) => setHistoryUntil(event.target.value)} className={filterField} />
              <button type="submit" className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Filter history</button>
            </form>
            {!history?.data.length ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{workspaceBusy ? 'Loading history…' : 'No delivery history matches these filters.'}</p> : <ul className={`mt-4 divide-y ${divider}`}>{history.data.map((delivery) => <li key={delivery.id} className="py-3 first:pt-0 last:pb-0"><button type="button" onClick={() => void openDelivery(delivery.id)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${focus}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold">{delivery.merchant?.display_name ?? 'Delivery'}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatStatus(delivery.status)} · {formatTime(delivery.updated_at)}</span></span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button></li>)}</ul>}
          </Surface>
        </div>
        <Surface className={`${surface} xl:sticky xl:top-24`}>
          <SectionTitle icon={<MapPin className="h-5 w-5" aria-hidden="true" />} title="Delivery detail" description="Addresses and customer details are shown only for an assigned delivery." />
          {!selectedDelivery ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>Select one of your deliveries to see its progress and available actions.</p> : (
            <div className={`mt-4 rounded-xl border p-4 sm:p-5 ${divider}`}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{selectedDelivery.merchant?.display_name ?? 'Delivery'}</h2><p className={`mt-1 text-xs ${secondaryText}`}>Delivery {selectedDelivery.id} · {formatStatus(selectedDelivery.status)} · v{selectedDelivery.version}</p></div>{badge(selectedDelivery.priority)}</div>
              <ol aria-label="Delivery progress" className="mt-5 grid gap-2 sm:grid-cols-5">{[['ACCEPTED','Assigned'],['ARRIVED_PICKUP','At pickup'],['PICKED','On the way'],['ARRIVED_DROP','At drop-off'],['DELIVERED','Delivered']].map(([status,label]) => { const stages = ['ACCEPTED','ARRIVED_PICKUP','PICKED','ARRIVED_DROP','DELIVERED']; const current = stages.indexOf(selectedDelivery.status); const index = stages.indexOf(status); const reached = current >= index; return <li key={status} className={`rounded-xl border px-3 py-3 text-xs font-semibold ${divider} ${reached ? (isLight ? 'bg-emerald-50 text-emerald-900' : 'bg-emerald-400/10 text-emerald-200') : secondaryText}`}><span className="block">{label}</span><span className="mt-1 block opacity-75">{reached ? 'Recorded' : 'Next'}</span></li>; })}</ol>
              <dl className={`mt-5 grid gap-4 text-sm sm:grid-cols-2 ${secondaryText}`}>
                <div><dt className="font-semibold text-current">Pickup address</dt><dd className="mt-1 leading-relaxed">{selectedDelivery.pickup_address ?? 'Not provided'}</dd></div>
                <div><dt className="font-semibold text-current">Drop-off address</dt><dd className="mt-1 leading-relaxed">{selectedDelivery.dropoff_address ?? 'Not provided'}</dd></div>
                <div><dt className="font-semibold text-current">Customer</dt><dd className="mt-1">{selectedDelivery.customer?.display_name ?? 'Name unavailable'}{selectedDelivery.customer?.masked_phone ? ` · ${selectedDelivery.customer.masked_phone}` : ''}</dd></div>
                <div><dt className="font-semibold text-current">Order items</dt><dd className="mt-1">{selectedDelivery.order?.lines.length ? selectedDelivery.order.lines.map((line) => `${line.quantity} × ${line.title}`).join(', ') : 'No item lines returned'}</dd></div>
                {selectedDelivery.failure_reason_code && <div><dt className="font-semibold text-current">Failure reason</dt><dd className="mt-1">{formatStatus(selectedDelivery.failure_reason_code)}</dd></div>}
                {selectedDelivery.cancellation_request && <div><dt className="font-semibold text-current">Cancellation request</dt><dd className="mt-1">{formatStatus(selectedDelivery.cancellation_request.status)} · {formatStatus(selectedDelivery.cancellation_request.reason_code)}</dd></div>}
              </dl>
              <section aria-labelledby="rider-proof-title" className={`mt-6 border-t pt-5 ${divider}`}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${accent}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 id="rider-proof-title" className="font-bold">Pickup and delivery proof</h3>
                    <p className={`mt-1 text-sm leading-relaxed ${secondaryText}`}>Codes are checked by the QR Proof owner. Photo evidence is decoded, cleaned and encrypted before storage.</p>
                  </div>
                </div>
                {proofPurpose ? (
                  <div className="mt-4 space-y-4">
                    <div className={`rounded-xl border p-3 text-sm ${divider} ${secondaryText}`}>
                      Current stage: <strong className="text-current">{proofPurpose === 'pickup' ? 'Pickup' : 'Delivery hand-off'}</strong>
                      {verifiedProof?.delivery_id === selectedDelivery.id && verifiedProof.purpose === proofPurpose && (
                        <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${verifiedProof.status === 'CONSUMED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'}`}>
                          {verifiedProof.method.toUpperCase()} proof · {formatStatus(verifiedProof.status)}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
                      <div className="flex flex-wrap gap-2">
                        {!scannerActive ? <button type="button" onClick={() => void startScanner()} disabled={proofBusy} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Scan QR with camera</button>
                          : <button type="button" onClick={stopScanner} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Stop camera</button>}
                        <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>
                          Capture or choose photo
                          <input type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (file && file.size > 2_097_152) {
                              setProofMessage('Photo proof must be 2 MB or smaller.');
                              setPhotoFile(null);
                              event.target.value = '';
                            } else setPhotoFile(file);
                          }} />
                        </label>
                      </div>
                      <video ref={scannerVideo} playsInline muted aria-label="QR code camera preview" className={`max-h-64 w-full rounded-xl bg-black object-contain ${scannerActive ? 'block' : 'hidden'}`} />
                    </div>
                    <form onSubmit={(event) => void verifyProofCredential(event)} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="sr-only" htmlFor="rider-proof-code">QR or OTP code</label>
                      <input id="rider-proof-code" type="text" autoComplete="off" spellCheck={false} maxLength={128} value={proofCredential} onChange={(event) => setProofCredential(event.target.value)} placeholder="Enter the customer or merchant QR / OTP code" className={filterField} />
                      <button type="submit" disabled={proofBusy || actionBusy || !proofCredential.trim()} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>{proofBusy ? 'Checking…' : 'Verify code'}</button>
                    </form>
                    {photoFile && (
                      <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${divider}`}>
                        {photoPreview && <img src={photoPreview} alt="Selected private proof preview" className="h-20 w-20 rounded-lg object-cover" />}
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{photoFile.name}</p><p className={`mt-1 text-xs ${secondaryText}`}>{Math.ceil(photoFile.size / 1024)} KB · upload begins only when submitted</p></div>
                        <button type="button" onClick={() => void uploadPhotoProof()} disabled={proofBusy || actionBusy} className={`min-h-10 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>{proofBusy ? 'Submitting…' : 'Submit photo proof'}</button>
                        <button type="button" onClick={() => setPhotoFile(null)} disabled={proofBusy} className={`min-h-10 rounded-full border px-3 text-sm ${divider} ${focus}`}>Remove</button>
                      </div>
                    )}
                    {proofMessage && <p role="status" className={`rounded-xl border px-3 py-2 text-sm ${divider} ${secondaryText}`}>{proofMessage}</p>}
                    {verifiedProof?.delivery_id === selectedDelivery.id && verifiedProof.purpose === proofPurpose && verifiedProof.status !== 'CONSUMED' && (
                      <p className={`rounded-xl border px-3 py-2 text-sm ${isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`} role="status">Verified proof is bound to this Rider, delivery and stage. Use the matching delivery action below to commit it.</p>
                    )}
                  </div>
                ) : (
                  <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${divider} ${secondaryText}`}>QR and photo proof controls become available when Core Delivery records arrival at pickup or drop-off.</p>
                )}
                {proofMessage && !proofPurpose && <p role="status" className={`mt-3 rounded-xl border px-3 py-2 text-sm ${divider} ${secondaryText}`}>{proofMessage}</p>}
                <div className={`mt-4 border-t pt-4 ${divider}`}>
                  <h4 className="text-sm font-bold">Proof validation history</h4>
                  {!proofHistory?.data.length ? <p className={`mt-2 text-sm ${secondaryText}`}>No QR, OTP or photo checks are recorded for this delivery.</p> : (
                    <ul className={`mt-2 divide-y ${divider}`}>
                      {proofHistory.data.filter((entry) => entry.delivery_id === selectedDelivery.id).slice(0, 6).map((entry) => (
                        <li key={entry.id} className="py-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">{entry.method?.toUpperCase() ?? 'BADGE'} · {formatStatus(entry.result_code)}{entry.proof_status ? ` · ${formatStatus(entry.proof_status)}` : ''}</span>
                            <time className={secondaryText} dateTime={entry.occurred_at}>{formatTime(entry.occurred_at)}</time>
                          </div>
                          {entry.method === 'photo' && entry.proof_id && (
                            <>
                              <button
                                type="button"
                                aria-expanded={openPhotoProofId === entry.proof_id}
                                onClick={() => setOpenPhotoProofId(openPhotoProofId === entry.proof_id ? null : entry.proof_id)}
                                className={`mt-2 min-h-9 rounded-full border px-3 text-xs font-semibold ${divider} ${focus}`}
                              >
                                {openPhotoProofId === entry.proof_id ? 'Hide photo proof' : 'View photo proof'}
                              </button>
                              {openPhotoProofId === entry.proof_id && (
                                <img
                                  src={`${API}/proofs/${encodeURIComponent(entry.proof_id)}/photo`}
                                  alt={`Private ${entry.purpose ?? 'delivery'} photo proof`}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className="mt-2 max-h-72 max-w-full rounded-xl border object-contain"
                                />
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {proofEvents.some((event) => event.data.delivery_id === selectedDelivery.id) && <p className={`mt-2 text-xs ${secondaryText}`}>QR events are synced from the QR owner into the Rider event projection.</p>}
                </div>
              </section>
              {!['DELIVERED','FAILED','CANCELLED'].includes(selectedDelivery.status) && (
                <section className={`mt-5 border-t pt-5 ${divider}`}>
                  <h3 className="font-bold">Rider verification badge</h3>
                  <p className={`mt-1 text-sm leading-relaxed ${secondaryText}`}>Create a one-time badge for this active assignment. Your display name is private unless you opt in below.</p>
                  <label className={`mt-3 flex items-start gap-3 rounded-xl border p-3 text-sm ${divider}`}>
                    <input type="checkbox" checked={shareProfile} onChange={(event) => setShareProfile(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#B88728]" />
                    <span>Allow this badge to show my display name during verification.</span>
                  </label>
                  <button type="button" onClick={() => void createRiderBadge()} disabled={proofBusy || actionBusy} className={`mt-3 min-h-11 rounded-full border px-4 text-sm font-semibold disabled:opacity-50 ${divider} ${focus}`}>{proofBusy ? 'Creating badge…' : 'Create short-lived badge'}</button>
                  {badgeUrl && (
                    <div className={`mt-4 flex flex-wrap items-center gap-4 rounded-xl border p-4 ${divider}`}>
                      <div className="rounded-lg bg-white p-2"><QRCodeSVG value={badgeUrl} size={156} level="M" title="One-time Rider verification badge QR code" /></div>
                      <div className="min-w-0 flex-1"><p className="font-semibold">Show this code to verify your active Rider assignment</p><p className={`mt-1 text-sm ${secondaryText}`}>Expires {formatTime(badgeExpiresAt) ?? 'soon'} · one use · no phone, address, payout or identity documents are shared.</p><button type="button" onClick={() => void navigator.clipboard?.writeText(badgeUrl)} className={`mt-2 min-h-10 rounded-full border px-3 text-sm ${divider} ${focus}`}>Copy verification link</button></div>
                    </div>
                  )}
                </section>
              )}
              <div className={`mt-5 flex flex-wrap gap-2 border-t pt-4 ${divider}`}>
                {selectedDelivery.status === 'ACCEPTED' && <button type="button" disabled={actionBusy} onClick={() => void runDeliveryCommand('arrive-at-pickup')} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Arrived at pickup</button>}
                {selectedDelivery.status === 'ARRIVED_PICKUP' && <button type="button" disabled={actionBusy || !verifiedProof || verifiedProof.delivery_id !== selectedDelivery.id || verifiedProof.purpose !== 'pickup' || verifiedProof.status === 'CONSUMED'} onClick={() => void runDeliveryCommand('confirm-pickup', undefined, verifiedProof?.proof_id)} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Confirm pickup with proof</button>}
                {selectedDelivery.status === 'PICKED' && <button type="button" disabled={actionBusy} onClick={() => void runDeliveryCommand('arrive-at-drop')} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Arrived at drop-off</button>}
                {selectedDelivery.status === 'ARRIVED_DROP' && <div className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${divider} ${secondaryText}`}><span><strong className="text-current">Completion requires owner-verified proof.</strong> Delivery stays open until the QR owner confirms it.</span><button type="button" disabled={actionBusy || !verifiedProof || verifiedProof.delivery_id !== selectedDelivery.id || verifiedProof.purpose !== 'delivery' || verifiedProof.status === 'CONSUMED'} onClick={() => void runDeliveryCommand('complete', undefined, verifiedProof?.proof_id)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>Complete with proof</button></div>}
                {!['DELIVERED','FAILED','CANCELLED'].includes(selectedDelivery.status) && <>
                  <button type="button" disabled={actionBusy} onClick={() => setPendingReasonAction('report-failure')} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Report a problem</button>
                  <button type="button" disabled={actionBusy} onClick={() => setPendingReasonAction('request-cancellation')} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>Request cancellation</button>
                </>}
              </div>
              {pendingReasonAction && <form onSubmit={(event) => { event.preventDefault(); void runDeliveryCommand(pendingReasonAction, reasonCode); }} className={`mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto] ${divider}`}>
                <label className="sr-only" htmlFor="rider-delivery-reason">Reason</label><select id="rider-delivery-reason" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className={filterField}><option value="customer_unavailable">Customer unavailable</option><option value="wrong_address">Wrong address</option><option value="vehicle_breakdown">Vehicle breakdown</option><option value="security_issue">Security issue</option><option value="road_accident">Road accident</option><option value="other">Other</option></select>
                <button type="submit" disabled={actionBusy} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>{pendingReasonAction === 'report-failure' ? 'Submit failure report' : 'Send cancellation request'}</button>
              </form>}
            </div>
          )}
        </Surface>
      </div>
    </main>
  );

  const earningsWorkspace = (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`mb-2 text-sm font-medium ${secondaryText}`}>Finance · {formatTime(earningsSummary?.as_of ?? null) ?? 'Owner data'}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Earnings</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${secondaryText}`}>Authoritative earnings, payable entries and statements from Finance. Amounts are not estimated by the Rider portal.</p>
        </div>
        <button type="button" onClick={() => void loadEarnings()} disabled={financeBusy} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>
          <RefreshCw className={`h-4 w-4 ${financeBusy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh earnings
        </button>
      </div>
      <div className={`mb-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(220px,1fr)_auto] sm:items-end ${divider} ${surface}`}>
        <label className="block text-sm font-semibold" htmlFor="rider-earnings-period">
          Earnings period
          <select id="rider-earnings-period" value={earningsPeriod} onChange={(event) => setEarningsPeriod(event.target.value as FinancePeriod)} className={`mt-2 block min-h-11 w-full rounded-xl border px-3 text-sm font-normal ${divider} ${isLight ? 'bg-white text-slate-900' : 'bg-[#111315] text-white'} ${focus}`}>
            <option value="current_shift">Current shift</option>
            <option value="rolling_7_days">Last 7 days</option>
            <option value="month">This month</option>
          </select>
        </label>
        <p className={`max-w-lg text-xs leading-relaxed ${secondaryText}`}>Period dates, currency and payable status come from Finance. Values appear only after the source service returns them.</p>
      </div>
      {financeError && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{financeError}</div>}
      {statementMessage && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${divider} ${secondaryText}`} role="status">{statementMessage}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="space-y-5">
          <Surface className={surface}>
            <SectionTitle icon={<Wallet className="h-5 w-5" aria-hidden="true" />} title={`${financePeriodLabel(earningsPeriod)} summary`} description="Finance ledger totals, grouped by the currency returned by Finance." />
            {!earningsSummary ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Finance API', as_of: null, message: financeBusy ? 'Loading Finance totals…' : 'Earnings have not loaded.' }} secondaryText={secondaryText} isLight={isLight} />
              : earningsSummary.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Finance API', as_of: earningsSummary.as_of, message: earningsSummary.message ?? 'Finance has not configured this period.' }} secondaryText={secondaryText} isLight={isLight} />
                : earningsSummary.status === 'empty' ? <div className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}><p className="font-semibold text-current">{earningsSummary.message ?? 'No Finance earning entries were posted for this period.'}</p>{earningsSummary.period && <p className="mt-2">{formatTime(earningsSummary.period.starts_at)} – {formatTime(earningsSummary.period.ends_at)} · {earningsSummary.period.time_zone}</p>}<WidgetMeta widget={{ status: 'empty', value: null, source: earningsSummary.source, as_of: earningsSummary.as_of }} secondaryText={secondaryText} /></div>
                  : <>
                    {earningsSummary.period && <p className={`mt-4 text-xs ${secondaryText}`}>{formatTime(earningsSummary.period.starts_at)} – {formatTime(earningsSummary.period.ends_at)} · {earningsSummary.period.time_zone}</p>}
                    {!earningsSummary.by_currency?.length ? <p className={`mt-4 rounded-xl border px-4 py-4 text-sm ${divider} ${secondaryText}`}>Finance returned no currency totals for this period.</p> : (
                      <div className="mt-4 space-y-4">{earningsSummary.by_currency.map((totals) => <div key={totals.currency} className={`rounded-xl border p-4 ${divider}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${secondaryText}`}>{totals.currency}</p>
                        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                          {[['Delivery earnings', totals.delivery_earnings_minor], ['Bonuses', totals.bonuses_minor], ['Tips', totals.tips_minor], ['Payable balance', totals.payable_minor]].map(([label, amount]) => <div key={String(label)}><dt className={`text-xs ${secondaryText}`}>{label}</dt><dd className="mt-1 text-lg font-bold tabular-nums">{formatMoneyMinor(Number(amount), totals.currency)}</dd></div>)}
                        </dl>
                      </div>)}</div>
                    )}
                    <WidgetMeta widget={{ status: 'ready', value: earningsSummary, source: earningsSummary.source, as_of: earningsSummary.as_of }} secondaryText={secondaryText} />
                  </>}
          </Surface>
          <Surface className={surface}>
            <SectionTitle icon={<Activity className="h-5 w-5" aria-hidden="true" />} title="Finance transaction history" description="Owner-posted earning, tip, bonus, adjustment and settlement entries." />
            {!earningTransactions || earningTransactions.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Finance API', as_of: earningTransactions?.as_of ?? null, message: earningTransactions?.message ?? (financeBusy ? 'Loading Finance transactions…' : 'Transactions have not loaded.') }} secondaryText={secondaryText} isLight={isLight} />
              : !earningTransactions.items.length ? <p className={`mt-4 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{earningTransactions.message ?? 'No Finance transactions are available.'}</p>
                : <>
                  <ul className={`mt-4 divide-y ${divider}`}>{earningTransactions.items.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0"><span className="block text-sm font-semibold">{formatStatus(entry.category)}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatTime(entry.occurred_at)}{entry.source_reference ? ` · ${entry.source_reference}` : ''}</span></span>
                    <span className="text-right"><span className="block text-sm font-bold tabular-nums">{formatMoneyMinor(entry.amount_minor, entry.currency)}</span><span className={`mt-1 block text-xs ${secondaryText}`}>Payable change {formatMoneyMinor(entry.payable_delta_minor, entry.currency)}</span></span>
                  </li>)}</ul>
                  {earningTransactions.next_cursor && <button type="button" onClick={() => void loadMoreEarnings()} disabled={financeBusy} className={`mt-4 min-h-10 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>{financeBusy ? 'Loading…' : 'Load more transactions'}</button>}
                  <WidgetMeta widget={{ status: earningTransactions.status, value: null, source: 'Finance API', as_of: earningTransactions.as_of }} secondaryText={secondaryText} />
                </>}
          </Surface>
        </div>
        <div className="space-y-5">
          <Surface className={surface}>
            <SectionTitle icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} title="Statements" description="Generate a snapshot from Finance entries in the selected configured period." />
            <button type="button" onClick={() => void generateStatement()} disabled={statementBusy || !csrfToken} className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]'} ${focus}`}>
              {statementBusy ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{statementBusy ? 'Generating…' : 'Generate statement'}
            </button>
            {!earningStatements || earningStatements.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Finance API', as_of: earningStatements?.as_of ?? null, message: earningStatements?.message ?? (financeBusy ? 'Loading Finance statements…' : 'Statements have not loaded.') }} secondaryText={secondaryText} isLight={isLight} />
              : !earningStatements.items.length ? <p className={`mt-4 rounded-xl border px-4 py-4 text-sm ${divider} ${secondaryText}`}>{earningStatements.message ?? 'No statements are available for this period.'}</p>
                : <ul className={`mt-4 divide-y ${divider}`}>{earningStatements.items.map((statement) => <li key={statement.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span className="min-w-0"><span className="block text-sm font-semibold">{financePeriodLabel(statement.period)}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatTime(statement.period_start)} – {formatTime(statement.period_end)} · {statement.time_zone}</span><span className={`mt-1 block text-xs ${secondaryText}`}>Generated {formatTime(statement.generated_at)}</span></span><button type="button" onClick={() => void downloadStatement(statement)} className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${divider} ${focus}`}>Download CSV</button></li>)}</ul>}
          </Surface>
          <p className={`rounded-xl border px-4 py-4 text-xs leading-relaxed ${divider} ${secondaryText}`}>Statements are Finance-provided data exports. They do not execute a payout or certify tax treatment. Missing Finance policy or entries stay unavailable until the owner service provides them.</p>
        </div>
      </div>
    </main>
  );

  const rewardProgressCard = (item: RewardProgress) => {
    const progressValue = Math.max(0, item.progress);
    const target = Math.max(1, item.target);
    const percent = Math.min(100, Math.round((progressValue / target) * 100));
    const amountLabel = item.unit === 'amount_minor' && item.currency
      ? `${formatMoneyMinor(progressValue, item.currency)} of ${formatMoneyMinor(target, item.currency)}`
      : `${progressValue.toLocaleString()} of ${target.toLocaleString()} ${item.unit.replaceAll('_', ' ')}`;
    return (
      <article key={`${item.program_id}:${item.program_version}`} className={`rounded-xl border p-4 ${divider}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isLight ? 'bg-amber-50 text-[#76530B]' : 'bg-[#E5B65F]/10 text-[#F2D69B]'}`}><Target className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0"><h3 className="font-semibold">{item.title}</h3><p className={`mt-1 text-xs ${secondaryText}`}>{formatStatus(item.feature)} · {item.time_zone}{item.ends_at ? ` · Ends ${formatTime(item.ends_at)}` : ''}</p></div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'completed' ? (isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-400/10 text-emerald-200') : item.status === 'source_unavailable' ? (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-gray-300') : (isLight ? 'bg-amber-50 text-[#76530B]' : 'bg-[#E5B65F]/10 text-[#F2D69B]')}`}>{formatStatus(item.status)}</span>
        </div>
        {item.status === 'source_unavailable' ? <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${isLight ? 'bg-slate-50 text-slate-600' : 'bg-white/[0.035] text-gray-300'}`}>The Analytics source for this program is not connected. No performance value is estimated.</p> : <>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className={secondaryText}>Progress</span><span className="font-semibold tabular-nums">{amountLabel}</span></div>
          <div className={`mt-2 h-2 overflow-hidden rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/10'}`} role="progressbar" aria-label={`${item.title} progress`} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(progressValue, target)}>
            <div className={`h-full rounded-full ${isLight ? 'bg-[#B88728]' : 'bg-[#E5B65F]'}`} style={{ width: `${percent}%` }} />
          </div>
        </>}
      </article>
    );
  };

  const rewardsWorkspace = (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`mb-2 text-sm font-medium ${secondaryText}`}>Rewards · {formatTime(rewardsSummary?.as_of ?? null) ?? 'Owner data'}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Streaks, challenges and badges</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${secondaryText}`}>Configured progress comes from Rewards. A bonus amount appears only after Finance confirms its ledger entry.</p>
        </div>
        <button type="button" onClick={() => void loadRewards()} disabled={rewardsBusy} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>
          <RefreshCw className={`h-4 w-4 ${rewardsBusy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh rewards
        </button>
      </div>
      {rewardsError && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">{rewardsError}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
          <Surface className={surface}>
            <SectionTitle icon={<Target className="h-5 w-5" aria-hidden="true" />} title="Your progress" description="Active streaks, daily and weekly challenges, configured milestones and owner-connected performance programs." />
            {!rewardsSummary || rewardsSummary.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Rewards API', as_of: rewardsSummary?.as_of ?? null, message: rewardsSummary?.message ?? (rewardsBusy ? 'Loading Rewards progress…' : 'Rewards progress has not loaded.') }} secondaryText={secondaryText} isLight={isLight} />
              : rewardsSummary.status === 'empty' ? <p className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>{rewardsSummary.message ?? 'No reward programs are configured.'}</p>
                : <div className="mt-5 space-y-3">
                  {rewardsSummary.message && <p className={`rounded-xl border px-4 py-3 text-sm ${divider} ${secondaryText}`} role="status">{rewardsSummary.message}</p>}
                  {[...rewardsSummary.streaks, ...rewardsSummary.challenges].length
                    ? [...rewardsSummary.streaks, ...rewardsSummary.challenges].map(rewardProgressCard)
                    : <p className={`rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>No active streaks or challenges are available for this Rider account.</p>}
                </div>}
            {rewardsSummary && <WidgetMeta widget={{ status: rewardsSummary.status, value: null, source: rewardsSummary.source, as_of: rewardsSummary.as_of }} secondaryText={secondaryText} />}
          </Surface>
          <Surface className={surface}>
            <SectionTitle icon={<Award className="h-5 w-5" aria-hidden="true" />} title="Reward history" description="Completed recognition and Finance-confirmed bonus entries, newest first." />
            {!rewardsHistory || rewardsHistory.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Rewards API', as_of: rewardsHistory?.as_of ?? null, message: rewardsBusy ? 'Loading reward history…' : 'Reward history has not loaded.' }} secondaryText={secondaryText} isLight={isLight} />
              : !rewardsHistory.items.length ? <p className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>No rewards have been earned for this Rider account.</p>
                : <>
                  <ol className={`mt-4 divide-y ${divider}`}>{rewardsHistory.items.map((award) => <li key={award.award_id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex min-w-0 items-start gap-3"><Award className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-semibold">{award.title}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatStatus(award.kind)} · {formatTime(award.earned_at)}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatStatus(award.status)}</span></span></span>
                    {award.status === 'posted' && award.amount_minor !== null && award.currency && <span className="text-sm font-bold tabular-nums">{formatMoneyMinor(award.amount_minor, award.currency)}</span>}
                  </li>)}</ol>
                  {rewardsHistory.next_cursor && <button type="button" onClick={() => void loadMoreRewardHistory()} disabled={rewardsBusy} className={`mt-4 min-h-10 rounded-full border px-4 text-sm font-semibold ${divider} ${focus}`}>{rewardsBusy ? 'Loading…' : 'Load more history'}</button>}
                </>}
          </Surface>
        </div>
        <Surface className={surface}>
          <SectionTitle icon={<Award className="h-5 w-5" aria-hidden="true" />} title="Achievement badges" description="Badges published by Rewards for your profile. Guest visibility follows each program's setting." />
          {!rewardsBadges || rewardsBadges.status === 'unavailable' ? <Unavailable widget={{ status: 'unavailable', value: null, source: 'Rewards API', as_of: rewardsBadges?.as_of ?? null, message: rewardsBusy ? 'Loading achievement badges…' : 'Achievement badges have not loaded.' }} secondaryText={secondaryText} isLight={isLight} />
            : !rewardsBadges.items.length ? <p className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>No achievement badges have been earned yet.</p>
              : <ul className={`mt-4 divide-y ${divider}`}>{rewardsBadges.items.map((item) => <li key={item.badge_id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span className="flex min-w-0 items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isLight ? 'bg-amber-50 text-[#76530B]' : 'bg-[#E5B65F]/10 text-[#F2D69B]'}`}><Award className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.label}</span><span className={`mt-1 block text-xs ${secondaryText}`}>Earned {formatTime(item.earned_at)}</span></span></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.public_tracking ? (isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-400/10 text-emerald-200') : `${divider} ${secondaryText}`}`}>{item.public_tracking ? 'Guest-visible' : 'Rider only'}</span></li>)}</ul>}
        </Surface>
      </div>
    </main>
  );

  return (
    <div className={`min-h-screen flex-1 ${page}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur ${divider} ${isLight ? 'bg-white/95' : 'bg-[#111315]/95'}`}>
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={() => onNavigate('couriers')} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold ${secondaryText} ${focus}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">For couriers</span>
            </button>
            <span className={`h-7 border-l ${divider}`} aria-hidden="true" />
            <button type="button" onClick={() => onNavigate('home')} aria-label="NEXG App home" className={`rounded-sm ${focus}`}>
              <LogoIcon variant="wordmark" className="h-6 w-auto" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${profileNeedsReview ? (isLight ? 'border-amber-300 bg-amber-50 text-[#76530B]' : 'border-[#E5B65F]/30 bg-[#E5B65F]/10 text-[#F2D69B]') : (isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300')}`}>
              {formatStatus(identity.profile_status)}
            </span>
            <button type="button" onClick={toggleTheme} aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'} className={`flex h-10 w-10 items-center justify-center rounded-full border ${divider} ${secondaryText} ${focus}`}>
              {isLight ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => void signOut()} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${divider} ${secondaryText} ${focus}`}>
              <LogOut className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <nav aria-label="Rider workspace" className={`mx-auto flex max-w-[1600px] gap-2 overflow-x-auto border-b px-4 py-3 sm:px-6 lg:px-8 ${divider}`}>
        {([['dashboard', 'Dashboard'], ['jobs', 'Jobs'], ['deliveries', 'Deliveries'], ['earnings', 'Earnings'], ['rewards', 'Rewards']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => enterWorkspace(id)} aria-current={workspace === id ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${divider} ${workspace === id ? (isLight ? 'bg-amber-50 text-[#76530B]' : 'bg-[#E5B65F]/10 text-[#F2D69B]') : `${secondaryText} hover:text-current`} ${focus}`}>
            {id === 'dashboard' ? <Activity className="h-4 w-4" aria-hidden="true" /> : id === 'jobs' ? <Zap className="h-4 w-4" aria-hidden="true" /> : id === 'deliveries' ? <PackageCheck className="h-4 w-4" aria-hidden="true" /> : id === 'earnings' ? <Wallet className="h-4 w-4" aria-hidden="true" /> : <Award className="h-4 w-4" aria-hidden="true" />}{label}
          </button>
        ))}
      </nav>

      {workspace === 'jobs' ? jobsWorkspace : workspace === 'deliveries' ? deliveriesWorkspace : workspace === 'earnings' ? earningsWorkspace : workspace === 'rewards' ? rewardsWorkspace : <main id="overview" className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className={`mb-2 text-sm font-medium ${secondaryText}`}>{today}</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>Rider dashboard</h1>
            <p className={`mt-2 text-base ${secondaryText}`}>Welcome{identity.display_name ? `, ${identity.display_name}` : ''}. Your dashboard is connected to NEXG services.</p>
          </div>
          <button type="button" onClick={() => void fetchDashboard()} disabled={loadingDashboard} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${divider} ${focus}`}>
            <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin' : ''}`} aria-hidden="true" />{loadingDashboard ? 'Refreshing…' : 'Refresh dashboard'}
          </button>
        </div>

        {profileNeedsReview && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${isLight ? 'border-amber-300 bg-amber-50 text-[#503A0B]' : 'border-[#E5B65F]/30 bg-[#E5B65F]/10 text-[#F2D69B]'}`} role="status">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Your NEXG rider profile is <strong>{formatStatus(identity.profile_status).toLowerCase()}</strong>. The dashboard only shows work assigned to your account. Contact Rider Operations if this status is unexpected.</p>
          </div>
        )}
        {serviceError && (
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${isLight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`} role="alert">
            <span>{serviceError}</span>
            <button type="button" onClick={() => void fetchDashboard()} className={`min-h-9 rounded-full border px-3 font-semibold ${focus}`}>Retry</button>
          </div>
        )}

        <nav aria-label="Rider dashboard sections" className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition-colors ${divider} ${secondaryText} hover:text-current ${focus}`}>{label}</a>
          ))}
        </nav>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <Surface id="availability" className={surface}>
            <SectionTitle icon={<Bike className="h-5 w-5" aria-hidden="true" />} title="Availability status" description="Dispatch controls online availability." />
            {!availability ? <Unavailable widget={widgets?.availability ?? { status: 'unavailable', value: null, source: 'Dispatch API', as_of: null, message: 'Loading availability…' }} secondaryText={secondaryText} isLight={isLight} /> : (
              <div className={`mt-5 rounded-xl border p-4 ${divider}`}>
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-lg font-bold">{availability.online ? 'Online' : 'Offline'}</p><p className={`mt-1 text-sm ${secondaryText}`}>{availability.eligible ? 'Eligible to receive offers.' : availability.reason === 'profile_not_approved' ? 'Profile approval is required before going online.' : 'You will not receive new Dispatch offers while offline.'}</p></div><button type="button" onClick={() => void saveAvailability()} disabled={availabilityBusy || (profileNeedsReview && !availability.online)} aria-pressed={availability.online} className={`min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${availability.online ? `border ${divider}` : (isLight ? 'bg-[#B88728] text-slate-950' : 'bg-[#E5B65F] text-[#17130B]')} ${focus}`}>{availabilityBusy ? 'Saving…' : availability.online ? 'Go offline' : 'Go online'}</button></div>
                <WidgetMeta widget={{ status: availability.online ? 'ready' : 'empty', value: availability, source: 'Dispatch API', as_of: availability.as_of }} secondaryText={secondaryText} />
              </div>
            )}
          </Surface>

          <Surface id="assigned-jobs" className={surface}>
            <SectionTitle icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />} title="Assigned jobs" description="Deliveries assigned to your Rider account." />
            {assignedWidget?.status === 'unavailable' || !assignedWidget ? (
              <Unavailable widget={assignedWidget ?? { status: 'unavailable', value: null, source: 'Core Delivery API', as_of: null, message: 'Loading assigned work…' }} secondaryText={secondaryText} isLight={isLight} />
            ) : assignedJobs.length === 0 ? (
              <div className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>
                <p className="font-semibold text-current">No active deliveries assigned</p>
                <p className="mt-1">When a delivery is assigned to your account, it will appear here.</p>
                <WidgetMeta widget={assignedWidget} secondaryText={secondaryText} />
              </div>
            ) : (
              <ul className={`mt-4 divide-y ${divider}`}>
                {assignedJobs.map((job) => (
                  <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{job.merchant_name || 'Assigned delivery'}</p>
                      <p className={`mt-1 text-xs ${secondaryText}`}>Delivery {job.id}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isLight ? 'bg-amber-50 text-[#76530B]' : 'bg-[#E5B65F]/10 text-[#F2D69B]'}`}>{formatStatus(job.status)}</span>
                  </li>
                ))}
                <li className="pt-2"><WidgetMeta widget={assignedWidget} secondaryText={secondaryText} /></li>
              </ul>
            )}
          </Surface>

          <Surface id="earnings-today" className={surface}>
            <SectionTitle icon={<Wallet className="h-5 w-5" aria-hidden="true" />} title="Earnings today" description="Verified earnings from the Finance service." />
            {!dashboardEarnings || dashboardEarnings.status === 'unavailable' ? <Unavailable widget={widgets?.earnings_today ?? { status: 'unavailable', value: null, source: 'Finance API', as_of: null, message: 'Loading earnings…' }} secondaryText={secondaryText} isLight={isLight} />
              : dashboardEarnings.status === 'empty' ? <div className={`mt-5 rounded-xl border px-4 py-4 text-sm ${divider} ${secondaryText}`}>{dashboardEarnings.message ?? 'No Finance earnings have been posted for this period.'}<WidgetMeta widget={{ status: 'empty', value: dashboardEarnings, source: 'Finance API', as_of: dashboardEarnings.as_of }} secondaryText={secondaryText} /></div>
                : <div className={`mt-5 rounded-xl border p-4 ${divider}`}>
                  <p className={`text-xs ${secondaryText}`}>{dashboardEarnings.period ? `${formatTime(dashboardEarnings.period.starts_at)} – ${formatTime(dashboardEarnings.period.ends_at)} · ${dashboardEarnings.period.time_zone}` : 'Finance period'}</p>
                  <div className="mt-3 space-y-3">{(dashboardEarnings.by_currency ?? []).map((totals) => <div key={totals.currency} className="flex flex-wrap items-baseline justify-between gap-2"><span className={`text-xs font-semibold uppercase ${secondaryText}`}>{totals.currency} · delivery earnings</span><span className="text-lg font-bold tabular-nums">{formatMoneyMinor(totals.delivery_earnings_minor, totals.currency)}</span></div>)}</div>
                  <WidgetMeta widget={{ status: 'ready', value: dashboardEarnings, source: 'Finance API', as_of: dashboardEarnings.as_of }} secondaryText={secondaryText} />
                </div>}
            <button type="button" onClick={() => enterWorkspace('earnings')} className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${divider} ${focus}`}>View earnings and statements <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </Surface>

          <Surface id="completed-deliveries" className={surface}>
            <SectionTitle icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} title="Completed deliveries" description="Assigned delivery records in delivered status." />
            {completedTotal === null ? (
              <Unavailable widget={completedWidget ?? { status: 'unavailable', value: null, source: 'Core Delivery API', as_of: null, message: 'Loading completed deliveries…' }} secondaryText={secondaryText} isLight={isLight} />
            ) : (
              <>
                <p className="mt-6 text-4xl font-bold tabular-nums">{completedTotal}</p>
                <p className={`mt-1 text-sm ${secondaryText}`}>Recorded by Core Delivery</p>
                <WidgetMeta widget={completedWidget!} secondaryText={secondaryText} />
              </>
            )}
          </Surface>

          <Surface id="performance-summary" className={surface}>
            <SectionTitle icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />} title="Performance summary" description="Metrics defined and published by Analytics." />
            <Unavailable widget={widgets?.performance_summary ?? { status: 'unavailable', value: null, source: 'Analytics API', as_of: null, message: 'Loading performance metrics…' }} secondaryText={secondaryText} isLight={isLight} />
          </Surface>

          <Surface id="active-delivery" className={surface}>
            <SectionTitle icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} title="Active delivery" description="Current delivery state from Core Delivery." />
            {activeWidget?.status === 'unavailable' || !activeWidget ? (
              <Unavailable widget={activeWidget ?? { status: 'unavailable', value: null, source: 'Core Delivery API', as_of: null, message: 'Loading active delivery…' }} secondaryText={secondaryText} isLight={isLight} />
            ) : activeDelivery ? (
              <div className={`mt-5 rounded-xl border p-4 ${divider}`}>
                <p className="text-base font-semibold">{activeDelivery.merchant_name || 'Assigned delivery'}</p>
                <p className={`mt-1 text-sm ${secondaryText}`}>Delivery {activeDelivery.id}</p>
                <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-400/10 text-emerald-300'}`}>{formatStatus(activeDelivery.status)}</span>
                <WidgetMeta widget={activeWidget} secondaryText={secondaryText} />
              </div>
            ) : (
              <div className={`mt-5 rounded-xl border px-4 py-5 text-sm ${divider} ${secondaryText}`}>
                {activeWidget.message ?? 'There is no active delivery assigned to your account.'}
                <WidgetMeta widget={activeWidget} secondaryText={secondaryText} />
              </div>
            )}
          </Surface>

          <Surface id="incentives" className={surface}>
            <SectionTitle icon={<Zap className="h-5 w-5" aria-hidden="true" />} title="Incentives and bonuses" description="Offers published by the Rewards service." />
            {!widgets?.incentives_and_bonuses || widgets.incentives_and_bonuses.status === 'unavailable' ? <Unavailable widget={widgets?.incentives_and_bonuses ?? { status: 'unavailable', value: null, source: 'Rewards API', as_of: null, message: 'Loading incentives…' }} secondaryText={secondaryText} isLight={isLight} />
              : widgets.incentives_and_bonuses.status === 'empty' ? <div className={`mt-5 rounded-xl border px-4 py-4 text-sm ${divider} ${secondaryText}`}>{widgets.incentives_and_bonuses.message ?? 'No reward programs are configured.'}<WidgetMeta widget={widgets.incentives_and_bonuses} secondaryText={secondaryText} /></div>
                : <div className="mt-5 space-y-3">
                  {widgets.incentives_and_bonuses.message && <p className={`rounded-xl border px-3 py-2 text-xs ${divider} ${secondaryText}`} role="status">{widgets.incentives_and_bonuses.message}</p>}
                  {rewardProgressItems.length ? rewardProgressItems.map((item) => rewardProgressCard(item)) : <p className={`rounded-xl border px-4 py-4 text-sm ${divider} ${secondaryText}`}>No active streaks or challenges are available.</p>}
                  {dashboardRewards?.bonuses.length ? <ul className={`divide-y ${divider}`}>{dashboardRewards.bonuses.slice(0, 3).map((award) => <li key={award.award_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0"><span className="block font-semibold">{award.title}</span><span className={`mt-1 block text-xs ${secondaryText}`}>{formatStatus(award.status)}</span></span>{award.status === 'posted' && award.amount_minor !== null && award.currency && <span className="font-bold tabular-nums">{formatMoneyMinor(award.amount_minor, award.currency)}</span>}</li>)}</ul> : null}
                  <WidgetMeta widget={widgets.incentives_and_bonuses} secondaryText={secondaryText} />
                </div>}
            <button type="button" onClick={() => enterWorkspace('rewards')} className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${divider} ${focus}`}>View challenges and reward history <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </Surface>

          <Surface id="recent-notifications" className={surface}>
            <SectionTitle icon={<Bell className="h-5 w-5" aria-hidden="true" />} title="Recent notifications" description="Updates targeted to this Rider account." />
            <Unavailable widget={widgets?.recent_notifications ?? { status: 'unavailable', value: null, source: 'Notifications API', as_of: null, message: 'Loading notifications…' }} secondaryText={secondaryText} isLight={isLight} />
          </Surface>

          <Surface id="quick-actions" className={surface}>
            <SectionTitle icon={<Activity className="h-5 w-5" aria-hidden="true" />} title="Quick actions" description="Useful actions for this dashboard." />
            <div className={`mt-5 divide-y ${divider}`}>
              <button type="button" onClick={() => enterWorkspace('jobs')} className={`flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-sm font-semibold ${accent} ${focus}`}>
                View offers and assigned jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => enterWorkspace('deliveries')} className={`flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-sm font-semibold ${accent} ${focus}`}>
                Open delivery and QR proof history <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => void fetchDashboard()} disabled={loadingDashboard} className={`flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-sm font-semibold ${accent} disabled:opacity-60 ${focus}`}>
                {loadingDashboard ? 'Refreshing dashboard…' : 'Refresh dashboard'} <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
            {widgets?.quick_actions && <WidgetMeta widget={widgets.quick_actions} secondaryText={secondaryText} />}
          </Surface>
        </div>

        <p className={`mt-8 text-center text-xs ${secondaryText}`}>
          Dashboard values come from the named service shown on each card. Unavailable services do not use sample data.
        </p>
      </main>}
    </div>
  );
}
