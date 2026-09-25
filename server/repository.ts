// server/repository.ts
// Read access to the NEXG catalogue, backed by PostgreSQL.
//
// Row -> API shaping lives here so the HTTP layer stays thin and the
// frontend's NexGMerchant contract is honoured in exactly one place.

import { query } from './db.ts';

/** The neighbourhood is stored in merchants.metadata->>'area'. */
const MERCHANT_SELECT = `
  SELECT
    m.id,
    m.name,
    m.slug,
    m.tagline,
    m.description,
    m.primary_category_id,
    c.name  AS category_name,
    c.slug  AS category_slug,
    m.rating,
    m.review_count,
    m.delivery_time_min,
    m.delivery_time_max,
    m.delivery_fee,
    m.currency,
    m.price_level,
    m.address,
    m.hero_image_url,
    m.logo_url,
    m.is_open,
    m.is_featured,
    m.special_offer,
    m.metadata
  FROM merchants m
  JOIN categories c ON c.id = m.primary_category_id
  WHERE m.status = 'active'
`;

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value);
}

/** Map a joined merchant row onto the frontend's NexGMerchant shape. */
export function mapMerchant(row: any, items: any[] = [], subcategory?: any) {
  const min = asNumber(row.delivery_time_min, 20);
  const max = asNumber(row.delivery_time_max, 35);
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const categoryName = asString(row.category_name, row.primary_category_id);

  return {
    id: asString(row.id),
    name: asString(row.name),
    slug: asString(row.slug),
    category: categoryName,
    categoryId: asString(row.primary_category_id),
    subcategory: asString(subcategory?.name, categoryName),
    subcategoryId: subcategory?.id ? asString(subcategory.id) : undefined,
    nairobiArea: asString(metadata.area, 'Nairobi'),
    address: asString(row.address),
    brandArchetype: metadata.archetype ? asString(metadata.archetype) : undefined,
    brandPalette: metadata.palette ? asString(metadata.palette) : undefined,
    workflow: asString(metadata.workflow),
    rating: asNumber(row.rating, 0),
    ratingCount: asNumber(row.review_count, 0),
    deliveryTimeMin: min,
    deliveryTimeMax: max,
    deliveryTime: `${min}-${max} min`,
    deliveryFee: asNumber(row.delivery_fee, 0),
    priceLevel: asNumber(row.price_level, 2),
    heroImage: asString(row.hero_image_url),
    logoUrl: asString(row.logo_url),
    badges: row.is_featured ? ['Featured'] : [],
    isOpen: row.is_open !== false,
    specialOffer: row.special_offer ? asString(row.special_offer) : undefined,
    items,
  };
}

/** Map an items row onto the frontend's NexGCatalogItem shape. */
export function mapItem(row: any, merchant?: { id: string; name: string }, subcategoryName?: string) {
  const price = asNumber(row.price, 0);
  const compareAt = row.compare_at_price === null || row.compare_at_price === undefined
    ? undefined
    : asNumber(row.compare_at_price, 0);

  return {
    id: asString(row.id),
    merchantId: asString(row.merchant_id, merchant?.id ?? ''),
    merchantName: asString(merchant?.name),
    category: asString(row.category_name, ''),
    categoryId: asString(row.category_id, ''),
    subcategory: asString(subcategoryName, ''),
    name: asString(row.name),
    price,
    originalPrice: compareAt && compareAt > price ? compareAt : undefined,
    currency: asString(row.currency, 'KSh'),
    image: asString(row.image_url),
    commerceMode: 'instant_purchase' as const,
    description: asString(row.description),
    isAvailable: row.is_available !== false,
  };
}

/** Total counts, from the database, used by /api/health. */
export async function getCounts() {
  const rows = await query<{ categories: string; subcategories: string; merchants: string; items: string }>(
    `
    SELECT
      (SELECT count(*) FROM categories)    AS categories,
      (SELECT count(*) FROM subcategories) AS subcategories,
      (SELECT count(*) FROM merchants WHERE status = 'active') AS merchants,
      (SELECT count(*) FROM items)         AS items
  `,
    [],
    'catalog.counts'
  );
  const r = rows[0] ?? ({} as any);
  return {
    totalCategories: asNumber(r.categories, 0),
    totalSubcategories: asNumber(r.subcategories, 0),
    totalMerchants: asNumber(r.merchants, 0),
    totalItems: asNumber(r.items, 0),
  };
}

/** 21 categories with their subcategories nested. */
export async function listCategories() {
  const cats = await query(
    `
    SELECT id, name, slug, description, icon_name, image_url, display_order
    FROM categories
    WHERE is_active = TRUE
    ORDER BY display_order, name
  `,
    [],
    'categories.list'
  );
  const subs = await query(
    `
    SELECT id, category_id, name, slug, description, image_url, display_order
    FROM subcategories
    WHERE is_active = TRUE
    ORDER BY display_order, name
  `,
    [],
    'subcategories.list'
  );

  const byCategory = new Map<string, any[]>();
  for (const s of subs) {
    const key = asString(s.category_id);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push({
      id: asString(s.id),
      name: asString(s.name),
      slug: asString(s.slug),
      description: s.description ? asString(s.description) : undefined,
      image_url: asString(s.image_url),
    });
  }

  return cats.map((c) => ({
    id: asString(c.id),
    name: asString(c.name),
    slug: asString(c.slug),
    description: c.description ? asString(c.description) : undefined,
    icon_name: asString(c.icon_name, 'Sparkles'),
    image_url: asString(c.image_url),
    subcategories: byCategory.get(asString(c.id)) ?? [],
  }));
}

export interface MerchantQuery {
  category?: string;
  subcategory?: string;
  area?: string;
  search?: string;
  sort?: string;
  limit: number;
  offset: number;
}

/**
 * Whitelisted ORDER BY clauses.
 *
 * Sorting MUST happen in SQL, not in the client over the loaded page. The client
 * version sorted only the accumulated array while pagination kept appending in
 * server order, so scrolling re-shuffled the list and the header total disagreed
 * with what the user could see — a control that appeared to work and did not.
 *
 * A whitelist rather than interpolation: the sort key arrives from a query string
 * and is concatenated into SQL, so it can never be taken on trust.
 */
const SORT_CLAUSES: Record<string, string> = {
  recommended: 'm.is_featured DESC, m.rating DESC, m.name ASC',
  rating: 'm.rating DESC, m.review_count DESC, m.name ASC',
  delivery: 'm.delivery_time_min ASC, m.rating DESC, m.name ASC',
  price_low: 'm.price_level ASC, m.rating DESC, m.name ASC',
  price_high: 'm.price_level DESC, m.rating DESC, m.name ASC',
};

export function resolveSortClause(sort?: string): string {
  return SORT_CLAUSES[sort ?? 'recommended'] ?? SORT_CLAUSES.recommended;
}

/**
 * Paginated merchant list. Filtering happens in SQL (with indexes) rather than
 * by loading every row and slicing in JavaScript.
 */
export async function listMerchants(opts: MerchantQuery) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.category && opts.category !== 'all') {
    if (opts.category === 'experiences') {
      const experiencesParam = params.length + 1;
      const travelToursParam = params.length + 2;
      params.push('experiences', 'travel-tours');
      where.push(
        `(m.primary_category_id IN ($${experiencesParam}, $${travelToursParam}) OR c.slug IN ($${experiencesParam}, $${travelToursParam}))`
      );
    } else {
      params.push(opts.category);
      where.push(`(m.primary_category_id = $${params.length} OR c.slug = $${params.length})`);
    }
  }
  if (opts.subcategory) {
    params.push(opts.subcategory);
    where.push(`EXISTS (
      SELECT 1 FROM merchant_subcategories ms
      JOIN subcategories s ON s.id = ms.subcategory_id
      WHERE ms.merchant_id = m.id AND (s.id = $${params.length} OR s.slug = $${params.length})
    )`);
  }
  if (opts.area && opts.area !== 'all') {
    params.push(opts.area);
    where.push(`m.metadata->>'area' = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    // ILIKE over the trigram-indexed name column, plus category/subcategory.
    where.push(`(m.name ILIKE $${params.length} OR c.name ILIKE $${params.length} OR EXISTS (
      SELECT 1 FROM merchant_subcategories ms
      JOIN subcategories s ON s.id = ms.subcategory_id
      WHERE ms.merchant_id = m.id AND s.name ILIKE $${params.length}
    ))`);
  }

  const whereSql = where.length ? ` AND ${where.join(' AND ')}` : '';

  const countRows = await query<{ total: string }>(
    `SELECT count(*) AS total FROM merchants m JOIN categories c ON c.id = m.primary_category_id
     WHERE m.status = 'active'${whereSql}`,
    params,
    'merchants.count'
  );
  const total = asNumber(countRows[0]?.total, 0);

  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  const rows = await query(
    `${MERCHANT_SELECT}${whereSql}
     ORDER BY ${resolveSortClause(opts.sort)}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...params, opts.limit, opts.offset],
    'merchants.list'
  );

  const merchants = rows.map((r) => mapMerchant(r));
  await attachSubcategories(merchants);
  await attachItems(merchants);
  return { total, merchants };
}

/**
 * Attach each merchant's PRIMARY subcategory, in one query for the whole page.
 *
 * Before this existed, list responses carried no subcategory at all: the cards
 * fell back to printing the category name, and the client could not resolve the
 * catalogue-declared order requirements (liquor licence, age gate, session
 * duration) because `orderRequirements` looks up fields by subcategory.
 *
 * Same batching discipline as attachItems: one query per page, not per merchant.
 */
export async function attachSubcategories(merchants: any[]): Promise<any[]> {
  const ids = merchants.map((m) => m.id).filter(Boolean);
  if (ids.length === 0) return merchants;

  const rows = await query(
    `SELECT DISTINCT ON (ms.merchant_id)
            ms.merchant_id, s.id, s.name, s.slug
     FROM merchant_subcategories ms
     JOIN subcategories s ON s.id = ms.subcategory_id
     WHERE ms.merchant_id = ANY($1::varchar[])
     ORDER BY ms.merchant_id, ms.is_primary DESC, s.display_order, s.name`,
    [ids],
    'merchants.subcategories.page'
  );

  const byMerchant = new Map<string, any>();
  for (const r of rows) byMerchant.set(asString(r.merchant_id), r);

  for (const m of merchants) {
    const sub = byMerchant.get(m.id);
    if (!sub) continue;
    m.subcategory = asString(sub.name, m.subcategory);
    m.subcategoryId = asString(sub.id);
  }
  return merchants;
}

/**
 * Attach items to a set of merchants using ONE query for the whole page.
 *
 * Deliberately avoids the N+1 pattern (one items query per merchant): a
 * 200-merchant page would otherwise issue 201 round trips.
 */
export async function attachItems(merchants: any[], itemLimit = 30): Promise<any[]> {
  const ids = merchants.map((m) => m.id).filter(Boolean);
  if (ids.length === 0) return merchants;

  const rows = await query(
    `SELECT * FROM (
       SELECT i.*, c.name AS category_name, c.id AS category_id,
              row_number() OVER (PARTITION BY i.merchant_id ORDER BY i.is_featured DESC, i.display_order, i.name) AS rn
       FROM items i
       JOIN merchants m ON m.id = i.merchant_id
       JOIN categories c ON c.id = m.primary_category_id
       WHERE i.is_available = TRUE AND i.merchant_id = ANY($1::varchar[])
     ) ranked
     WHERE rn <= $2
     ORDER BY merchant_id, rn`,
    [ids, itemLimit],
    'items.byMerchants.page'
  );

  const byMerchant = new Map<string, any[]>();
  for (const r of rows) {
    const key = asString(r.merchant_id);
    if (!byMerchant.has(key)) byMerchant.set(key, []);
    byMerchant.get(key)!.push(r);
  }

  for (const m of merchants) {
    const itemRows = byMerchant.get(m.id) ?? [];
    m.items = itemRows.map((i) => mapItem(i, { id: m.id, name: m.name }, m.subcategory));
  }
  return merchants;
}

/** A single merchant with its subcategory and up to `itemLimit` items. */
export async function getMerchant(idOrSlug: string, itemLimit = 60) {
  const rows = await query(
    `${MERCHANT_SELECT} AND (m.id = $1 OR m.slug = $1) LIMIT 1`,
    [idOrSlug],
    'merchants.byIdOrSlug'
  );
  const row = rows[0];
  if (!row) return null;

  const subRows = await query(
    `SELECT s.id, s.name, s.slug
     FROM merchant_subcategories ms
     JOIN subcategories s ON s.id = ms.subcategory_id
     WHERE ms.merchant_id = $1
     ORDER BY ms.is_primary DESC, s.display_order
     LIMIT 1`,
    [row.id],
    'merchants.primarySubcategory'
  );

  const itemRows = await query(
    `SELECT i.*, c.name AS category_name, c.id AS category_id
     FROM items i
     JOIN merchants m ON m.id = i.merchant_id
     JOIN categories c ON c.id = m.primary_category_id
     WHERE i.merchant_id = $1 AND i.is_available = TRUE
     ORDER BY i.is_featured DESC, i.display_order, i.name
     LIMIT $2`,
    [row.id, itemLimit],
    'items.byMerchant'
  );

  const merchant = mapMerchant(row, [], subRows[0]);
  merchant.items = itemRows.map((i) =>
    mapItem(i, { id: merchant.id, name: merchant.name }, merchant.subcategory)
  );
  return merchant;
}

/** Heterogeneous search across merchants and items. */
export async function search(term: string, limit = 20) {
  const like = `%${term}%`;

  const merchantRows = await query(
    `${MERCHANT_SELECT} AND (m.name ILIKE $1 OR c.name ILIKE $1 OR m.metadata->>'area' ILIKE $1)
     ORDER BY m.is_featured DESC, m.rating DESC
     LIMIT $2`,
    [like, limit],
    'search.merchants'
  );

  const itemRows = await query(
    `SELECT i.*, c.name AS category_name, c.id AS category_id, m.name AS merchant_name
     FROM items i
     JOIN merchants m ON m.id = i.merchant_id
     JOIN categories c ON c.id = m.primary_category_id
     WHERE i.is_available = TRUE AND (i.name ILIKE $1 OR i.description ILIKE $1)
     ORDER BY i.is_featured DESC, i.name
     LIMIT $2`,
    [like, limit],
    'search.items'
  );

  return {
    merchants: merchantRows.map((r) => mapMerchant(r)),
    items: itemRows.map((i) =>
      mapItem(i, { id: asString(i.merchant_id), name: asString(i.merchant_name) })
    ),
  };
}

/** Distinct neighbourhoods, for filter UI. */
export async function listAreas() {
  const rows = await query<{ area: string }>(
    `SELECT DISTINCT metadata->>'area' AS area
     FROM merchants
     WHERE status = 'active' AND metadata->>'area' IS NOT NULL
     ORDER BY area`,
    [],
    'merchants.areas'
  );
  return rows.map((r) => asString(r.area)).filter(Boolean);
}
