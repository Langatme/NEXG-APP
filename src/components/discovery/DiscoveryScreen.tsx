import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';
import { fetchCategories, type ApiCategory, type ApiMerchant } from '../../lib/apiClient';
import { useMerchantSearch, SORT_OPTIONS, type SortKey } from '../../hooks/useMerchantSearch';
import { mergeTravelToursIntoExperiences } from '../../lib/categoryGrouping';
import { DiscoveryMerchantCard } from './DiscoveryMerchantCard';
import {
  DiscoveryCategoryRail,
  featuredDiscoveryCategories,
  orderDiscoveryCategories,
} from './DiscoveryCategoryRail';

interface DiscoveryScreenProps {
  /** Optional query to seed the field, e.g. from the hero search box. */
  initialQuery?: string;
  onBack: () => void;
  onOpenMerchant: (merchant: ApiMerchant) => void;
}

const CATEGORY_STORIES: Record<string, string> = {
  'concierge-services': 'Reservations, thoughtful errands and personal assistance for the details in between.',
  experiences: 'Explore safaris, guided tours, events and travel plans worth looking forward to.',
  'airport-transfers': 'Arrange an airport pickup, meet-and-greet or executive ride before you land.',
  'vehicle-rentals': 'Choose a car for a day in the city, a weekend away or the open road.',
  wellness: 'Make time for recovery, movement and a slower afternoon.',
  beauty: 'Book a salon, skincare service or beauty appointment that suits your day.',
  'alcohol-beverages': 'Discover wine, spirits and occasion-ready bottles from Nairobi partners.',
  'flowers-gifts': 'Send flowers, considered gifts and hampers across the city.',
  'fashion-apparel': 'Shop clothing, accessories and personal style services.',
  'tech-electronics': 'Find electronics, everyday upgrades and accessories from local stores.',
  'restaurants-food': 'Find your next meal, from a quick lunch to an unhurried dinner.',
  'groceries-essentials': 'Restock the kitchen and home with everyday essentials and fresh picks.',
  pharmacy: 'Order pharmacy and personal care essentials from nearby partners.',
  'adults-only': 'Explore age-restricted offerings with privacy and responsible access.',
};

export default function DiscoveryScreen({
  initialQuery = '',
  onBack,
  onOpenMerchant,
}: DiscoveryScreenProps) {
  const { t } = useLanguage();
  const { isLight } = useTheme();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState('all');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryLoadAttempt, setCategoryLoadAttempt] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const railHeadingRef = useRef<HTMLHeadingElement>(null);

  const orderedCategories = useMemo(() => orderDiscoveryCategories(categories), [categories]);
  const featuredCategories = useMemo(() => featuredDiscoveryCategories(categories), [categories]);
  const activeCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const { merchants, total, loading, loadingMore, error, hasMore, loadMore, retry } =
    useMerchantSearch({
      category: categoryId ?? undefined,
      subcategory: subcategoryId === 'all' ? undefined : subcategoryId,
      query,
      sort,
      pageSize: 24,
    });

  useEffect(() => {
    const controller = new AbortController();
    setCategoriesError(null);
    fetchCategories(controller.signal)
      .then((loadedCategories) => setCategories(mergeTravelToursIntoExperiences(loadedCategories)))
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setCategoriesError(err?.message ?? 'Could not load categories');
      });
    return () => controller.abort();
  }, [categoryLoadAttempt]);

  // Search launches directly into the field. Opening Explore without a query keeps
  // the mobile keyboard closed so the category rail and city-wide edit are visible.
  useEffect(() => {
    if (!initialQuery.trim()) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [initialQuery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && !loading) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const selectCategory = (category: ApiCategory) => {
    setCategoryId(category.id);
    setSubcategoryId('all');
    setShowAllCategories(false);
    scrollToTop();
  };

  const goBack = () => {
    if (activeCategory) {
      setCategoryId(null);
      setSubcategoryId('all');
      scrollToTop();
      return;
    }
    onBack();
  };

  const scrollToCategories = () => {
    railHeadingRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div
      className={cn(
        'min-h-[100dvh] transition-colors duration-300',
        isLight ? 'bg-gold-canvas text-[#21190D]' : 'bg-[#111315] text-[#F2F2F2]'
      )}
    >
      <header
        className={cn(
          'sticky top-0 z-40 border-b backdrop-blur-2xl',
          isLight ? 'border-black/15 bg-[#241D12]/95 text-[#FAF1DB]' : 'border-white/10 bg-[#141618]/95'
        )}
      >
        <div className="mx-auto flex max-w-[2200px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goBack}
            aria-label={activeCategory ? 'Back to discovery' : 'Back to home'}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors',
              isLight
                ? 'border-white/15 bg-white/10 text-[#FAF1DB] hover:bg-white/15'
                : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
            )}
          >
            <ArrowLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeCategory) {
                setCategoryId(null);
                setSubcategoryId('all');
                scrollToTop();
              }
            }}
            className="hidden shrink-0 font-heading text-lg font-bold tracking-[0.1em] text-[#E5B65F] sm:block"
            aria-label="NEXG discovery"
          >
            NEXG
          </button>

          <label
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors',
              isLight
                ? 'border-[#F6E7C0] bg-[#F6E7C0] text-[#21190D] focus-within:border-[#7D5A11]'
                : 'border-white/10 bg-white/[0.06] text-white focus-within:border-[#E5B65F]'
            )}
          >
            <Search size={16} className={cn('shrink-0', isLight ? 'text-[#7D5A11]' : 'text-[#D6AD55]')} />
            <input
              ref={searchRef}
              id="discovery-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.ui.discoveryScreen.s_f4d948}
              aria-label={t.ui.discoveryScreen.s_8344a6}
              className={cn(
                'w-full bg-transparent text-sm font-medium outline-none',
                isLight ? 'placeholder:text-[#594A2D]' : 'placeholder:text-gray-400'
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label={t.ui.discoveryScreen.s_67300d}
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  isLight ? 'text-[#594A2D] hover:bg-black/5' : 'text-gray-300 hover:bg-white/10'
                )}
              >
                <X size={13} />
              </button>
            )}
          </label>

          <div className={cn('hidden shrink-0 items-center gap-1.5 text-xs font-semibold md:flex', isLight ? 'text-[#F4E8CE]' : 'text-gray-300')}>
            <MapPin size={14} className="text-[#E5B65F]" /> Nairobi
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[2200px] px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {!activeCategory && !query.trim() && (
          <section className="relative isolate mb-8 min-h-[260px] overflow-hidden rounded-[1.65rem] bg-[#18150F] sm:min-h-[320px] lg:min-h-[360px]">
            <img
              src="/images/nexg-discovery-rooftop.png"
              alt="A NEXG concierge welcoming guests to a Nairobi rooftop at sunset"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[64%_44%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#15120d]/95 via-[#15120d]/72 to-[#15120d]/10" />
            <div className="relative flex min-h-[260px] max-w-2xl flex-col items-start justify-center p-6 text-white sm:min-h-[320px] sm:p-10 lg:min-h-[360px] lg:p-14">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E5B65F]/50 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F3D48C] backdrop-blur-sm">
                NEXG · NAIROBI
              </span>
              <h1 className="max-w-xl font-heading text-[clamp(2rem,5vw,4.4rem)] font-bold leading-[0.98] tracking-[-0.04em]">
                What do you need today?
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                From airport pickups and dinner to wellness, travel and everyday essentials, find it here.
              </p>
              <button
                type="button"
                onClick={scrollToCategories}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E5B65F] px-5 text-sm font-bold text-[#21190D] transition-transform active:scale-[0.98]"
              >
                Explore services <ArrowDown size={15} />
              </button>
            </div>
            <div className="absolute bottom-4 right-4 hidden rounded-2xl border border-white/15 bg-[#21190D]/70 px-4 py-3 text-right text-xs text-white/85 backdrop-blur-md sm:block">
              <span className="block font-bold text-[#F3D48C]">One NEXG</span>
              <span>Food · services · experiences</span>
            </div>
          </section>
        )}

        {!activeCategory && (
          <section className="mb-9 scroll-mt-28" aria-labelledby="discovery-categories-heading">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.17em]', isLight ? 'text-[#483512]' : 'text-[#E5B65F]')}>
                  Browse NEXG
                </p>
                <h2 ref={railHeadingRef} id="discovery-categories-heading" className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  Explore the range
                </h2>
                <p className={cn('mt-1 text-xs sm:text-sm', isLight ? 'text-[#40341E]' : 'text-gray-400')}>
                  From everyday errands to plans worth looking forward to.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCategories((value) => !value)}
                aria-expanded={showAllCategories}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors',
                  isLight ? 'text-[#21190D] hover:bg-black/5' : 'text-[#E5B65F] hover:bg-white/5'
                )}
              >
                {showAllCategories ? 'Show priority edit' : `All ${orderedCategories.length} categories`}
                <ArrowRight size={13} />
              </button>
            </div>

            {categoriesError && (
              <div className={cn('mb-3 rounded-xl border px-4 py-3 text-xs', isLight ? 'border-[#6D531D]/25 bg-[#F4E4BC] text-[#3D2E12]' : 'border-white/10 bg-white/5 text-gray-300')}>
                <p>We couldn’t load service categories. You can still search the catalogue.</p>
                <button
                  type="button"
                  onClick={() => setCategoryLoadAttempt((attempt) => attempt + 1)}
                  className="mt-2 inline-flex items-center gap-1.5 font-bold underline underline-offset-2"
                >
                  <RefreshCw size={12} /> Try again
                </button>
              </div>
            )}

            <DiscoveryCategoryRail
              categories={featuredCategories}
              isLight={isLight}
              onSelectCategory={selectCategory}
            />

            {showAllCategories && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {orderedCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={cn(
                      'group relative aspect-[1.24] overflow-hidden rounded-2xl border text-left shadow-sm transition-transform active:scale-[0.99]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21190D] focus-visible:ring-offset-2',
                      isLight ? 'border-black/10 focus-visible:ring-offset-[#D8B350]' : 'border-white/10 focus-visible:ring-offset-[#111315]'
                    )}
                  >
                    <img
                      src={category.image_url || '/images/hero_section-640.webp'}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-3 right-3 text-xs font-bold leading-tight text-white sm:text-sm">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {activeCategory && (
          <section className="relative isolate mb-6 min-h-[220px] overflow-hidden rounded-[1.55rem] bg-[#18150F] sm:min-h-[270px]">
            <img
              src={activeCategory.image_url || '/images/hero_section-640.webp'}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/15" />
            <div className="relative flex min-h-[220px] max-w-2xl flex-col justify-end p-6 text-white sm:min-h-[270px] sm:p-9">
              <button
                type="button"
                onClick={() => {
                  setCategoryId(null);
                  setSubcategoryId('all');
                  scrollToTop();
                }}
                className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-black/45"
              >
                <ArrowLeft size={13} /> All services
              </button>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F3D48C]">
                NEXG · NAIROBI
              </p>
              <h1 className="font-heading text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-none tracking-[-0.035em]">
                {activeCategory.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {CATEGORY_STORIES[activeCategory.id] || activeCategory.description || `Explore ${activeCategory.name.toLowerCase()} from NEXG partners across Nairobi.`}
              </p>
            </div>
          </section>
        )}

        {activeCategory && (
          <div className="mb-5 flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <SubcategoryChip isLight={isLight} active={subcategoryId === 'all'} onClick={() => setSubcategoryId('all')}>
              All {activeCategory.name}
            </SubcategoryChip>
            {(activeCategory.subcategories ?? []).map((subcategory) => (
              <SubcategoryChip
                key={subcategory.id}
                isLight={isLight}
                active={subcategoryId === subcategory.id}
                onClick={() => setSubcategoryId(subcategory.id)}
              >
                {subcategory.name}
              </SubcategoryChip>
            ))}
          </div>
        )}

        <section ref={resultsRef} aria-labelledby="discovery-results-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.15em]', isLight ? 'text-[#483512]' : 'text-[#E5B65F]')}>
                {query.trim() ? 'Search NEXG' : activeCategory ? 'Local partners' : 'A few places to start'}
              </p>
              <h2 id="discovery-results-heading" className="font-heading text-lg font-bold tracking-tight sm:text-xl">
                {query.trim()
                  ? `Results for “${query.trim()}”`
                  : activeCategory
                  ? activeCategory.name
                  : 'Find your next stop'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {!loading && (
                <span className={cn('text-xs font-semibold', isLight ? 'text-[#40341E]' : 'text-gray-400')}>
                  {total.toLocaleString()} {total === 1 ? 'partner' : 'partners'}
                </span>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((value) => !value)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold whitespace-nowrap',
                    isLight ? 'border-black/15 bg-[#F5E9C9] text-[#21190D] hover:bg-[#F9F0DA]' : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                  )}
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden sm:inline">{SORT_OPTIONS.find((option) => option.key === sort)?.label}</span>
                  <ChevronDown size={12} className={cn('transition-transform', sortOpen && 'rotate-180')} />
                </button>
                {sortOpen && (
                  <>
                    <button type="button" aria-label="Close sorting menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setSortOpen(false)} />
                    <ul
                      role="listbox"
                      aria-label="Sort partners"
                      className={cn(
                        'absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border py-1 shadow-2xl',
                        isLight ? 'border-black/10 bg-[#F7EED8] text-[#21190D]' : 'border-white/10 bg-[#1A1D21] text-white'
                      )}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <li key={option.key}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={sort === option.key}
                            onClick={() => {
                              setSort(option.key);
                              setSortOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold transition-colors',
                              sort === option.key
                                ? isLight ? 'text-[#6F4E0F]' : 'text-[#E5B65F]'
                                : isLight ? 'hover:bg-black/5' : 'text-gray-300 hover:bg-white/5'
                            )}
                          >
                            {option.label}
                            {sort === option.key && <Check size={13} />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className={cn('rounded-2xl border p-6 text-center', isLight ? 'border-black/10 bg-[#F7EED8]' : 'border-white/10 bg-[#181A1F]')}>
              <p className="text-sm font-bold text-rose-600">We couldn’t load partners just now.</p>
              <p className={cn('mt-1 text-xs', isLight ? 'text-[#594A2D]' : 'text-gray-400')}>Try again in a moment.</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E5B65F] px-4 py-2 text-xs font-bold text-[#21190D] transition-transform active:scale-[0.98]"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {loading && !error && <SkeletonGrid isLight={isLight} />}

          {!loading && !error && merchants.length === 0 && (
            <div className={cn('rounded-2xl border p-10 text-center', isLight ? 'border-black/10 bg-[#F7EED8]' : 'border-white/10 bg-[#181A1F]')}>
              <div className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full', isLight ? 'bg-[#E9D8AD] text-[#594A2D]' : 'bg-white/5 text-gray-400')}>
                {query.trim() ? <Search size={20} /> : <Store size={20} />}
              </div>
              <h3 className="text-sm font-bold">No partners found here yet</h3>
              <p className={cn('mx-auto mt-1 max-w-sm text-xs', isLight ? 'text-[#594A2D]' : 'text-gray-400')}>
                {query.trim()
                  ? `Nothing matches “${query.trim()}”. Try another search or browse a different service.`
                  : 'Try another service, or check back as the NEXG range grows.'}
              </p>
              {(query.trim() || activeCategory) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCategoryId(null);
                    setSubcategoryId('all');
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E5B65F] px-4 py-2 text-xs font-bold text-[#21190D] transition-transform active:scale-[0.98]"
                >
                  Browse discovery
                </button>
              )}
            </div>
          )}

          {!error && merchants.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                {merchants.map((merchant) => (
                  <DiscoveryMerchantCard key={merchant.id} merchant={merchant} onOpen={onOpenMerchant} />
                ))}
              </div>
              {loadingMore && <SkeletonGrid isLight={isLight} count={3} className="mt-5" />}
              <div ref={sentinelRef} className="h-10" />
              {hasMore && !loadingMore && (
                <div className="flex justify-center pb-8 pt-3">
                  <button
                    type="button"
                    onClick={loadMore}
                    className={cn(
                      'rounded-full border px-5 py-2.5 text-xs font-bold transition-colors',
                      isLight ? 'border-black/15 bg-[#F5E9C9] text-[#21190D] hover:bg-[#F9F0DA]' : 'border-white/15 bg-white/5 text-gray-100 hover:bg-white/10'
                    )}
                  >
                    Load more partners
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

const SubcategoryChip: React.FC<{
  isLight: boolean;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isLight, active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'max-w-full rounded-full border px-3.5 py-2 text-xs font-bold transition-colors',
      active
        ? isLight
          ? 'border-[#21190D] bg-[#21190D] text-[#F8EED5]'
          : 'border-[#E5B65F] bg-[#E5B65F] text-[#21190D]'
        : isLight
        ? 'border-black/15 bg-[#F5E9C9] text-[#342818] hover:bg-[#F9F0DA]'
        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
    )}
  >
    {children}
  </button>
);

const SkeletonGrid: React.FC<{ isLight: boolean; count?: number; className?: string }> = ({
  isLight,
  count = 6,
  className,
}) => (
  <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className={cn('animate-status overflow-hidden rounded-2xl border', isLight ? 'border-black/10 bg-[#F7EED8]' : 'border-white/10 bg-[#181A1F]')}
      >
        <div className={cn('aspect-[16/10] w-full', isLight ? 'bg-[#E8D7AA]' : 'bg-white/5')} />
        <div className="space-y-2.5 p-4">
          <div className={cn('h-3.5 w-3/4 rounded', isLight ? 'bg-[#E8D7AA]' : 'bg-white/5')} />
          <div className={cn('h-3 w-1/2 rounded', isLight ? 'bg-[#E8D7AA]' : 'bg-white/5')} />
          <div className={cn('h-3 w-2/3 rounded', isLight ? 'bg-[#E8D7AA]' : 'bg-white/5')} />
        </div>
      </div>
    ))}
  </div>
);
