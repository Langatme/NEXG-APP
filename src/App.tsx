import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
// Home-page sections are imported EAGERLY, not lazily.
//
// They used to be lazy, which meant the hero painted and then four separate Suspense
// fallbacks appeared where these belong — four identical grey blocks, arriving after the
// page looked finished. That is what the user saw and objected to, correctly: a skeleton
// that does not match what is arriving is worse than no skeleton at all.
//
// The cost of loading them up front is measured, not assumed: MerchantAdCarousel 6.0 KB
// gzipped, NexGLandingHero 2.4, Promo 1.8, HowItWorks 1.2, Features 1.1 — 12.5 KB total.
// Against an entry chunk of 79 KB that is noise, and it removes the entire class of
// problem rather than dressing it up with a more accurate skeleton.
//
// The heavy routes stay lazy. MerchantOnboarding, the booking modals and the admin
// surfaces are tens of kilobytes each and most visitors never open them.
import MerchantAdCarousel from './components/MerchantAdCarousel';
import HowItWorks from './components/HowItWorks';
import Promo from './components/Promo';
import Features from './components/Features';
import NexGLandingHero from './components/NexGLandingHero';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
const ForMerchants = lazy(() => import('./components/ForMerchants'));
const MerchantOnboarding = lazy(() => import('./components/MerchantOnboarding'));
const Restaurants = lazy(() => import('./components/Restaurants'));
const Experiences = lazy(() => import('./components/Experiences'));
const SpaWellness = lazy(() => import('./components/SpaWellness'));
const TransportPage = lazy(() => import('./components/TransportPage'));
const GroceriesPage = lazy(() => import('./components/GroceriesPage'));
const ForProperties = lazy(() => import('./components/ForProperties'));
const ForCouriers = lazy(() => import('./components/ForCouriers'));
const CourierOnboarding = lazy(() => import('./components/CourierOnboarding'));
const RiderPortal = lazy(() => import('./components/RiderPortal'));
const RiderBadgeVerification = lazy(() => import('./components/RiderBadgeVerification'));
const HostPortal = import.meta.env.DEV ? lazy(() => import('./components/HostPortal')) : null;

// NEXG Flow Components
const NexGDiscoveryView = lazy(() => import('./components/NexGDiscoveryView'));
const NexGCategoryDrilldown = lazy(() => import('./components/NexGCategoryDrilldown'));
import { CATEGORIES_21, CatalogCategory } from './data/categoryCatalog21';
const DatabaseSqlModal = lazy(() => import('./components/DatabaseSqlModal'));

// Customer Lifecycle & Cart Modals
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
const DishCustomizerModal = lazy(() => import('./components/DishCustomizerModal'));
const RestaurantDetailModal = lazy(() => import('./components/RestaurantDetailModal'));
const CartDrawer = lazy(() => import('./components/CartDrawer'));
const CheckoutSimulatedModal = lazy(() => import('./components/CheckoutSimulatedModal'));
const OrderTrackingModal = lazy(() => import('./components/OrderTrackingModal'));
import { NexGNavigationProvider, useNexGNavigation } from './components/nexg/NexGNavigationContext';
import { NexGItemSheet } from './components/nexg/NexGItemSheet';const FloatingCartBar = lazy(() => import('./components/FloatingCartBar'));
import { NexGMerchant } from './types/nexg';
const DiscoveryScreen = lazy(() => import('./components/discovery/DiscoveryScreen'));
const MerchantPreviewSheet = lazy(() =>
  import('./components/discovery/MerchantPreviewSheet').then((m) => ({ default: m.MerchantPreviewSheet }))
);
import type { ApiItem, ApiMerchant } from './lib/apiClient';
import RouteFallback from './components/RouteFallback';
const MerchantRoute = lazy(() => import('./components/merchant/MerchantRoute'));

/**
 * Warm every route chunk the moment someone hits the site.
 *
 * These pages total ~60 KB gzipped. A first version staggered them 250ms apart once the
 * browser was idle, which was wrong twice over: the delay meant a fast click still landed
 * on the fallback, and `requestIdleCallback` never fired at all on this page because the
 * hero animates continuously, so the browser reported no idle period.
 *
 * Now they are requested together, immediately. 60 KB alongside an 87 KB entry is a
 * rounding error, and the user's expectation is explicit: reach any page with nothing in
 * between. Fire-and-forget, because a failed prefetch costs nothing — the route still
 * loads on demand.
 *
 * Still skipped under `saveData` or a 2G/3G `effectiveType`: the user has told the browser
 * not to spend their data on pages they may never open, and that outranks our latency.
 *
 * DiscoveryScreen is included. It is the browse surface behind the hero search, so it is
 * a first-class destination rather than a detail page.
 */
const PREFETCH_ROUTES = [
  () => import('./components/Restaurants'),
  () => import('./components/SpaWellness'),
  () => import('./components/TransportPage'),
  () => import('./components/GroceriesPage'),
  () => import('./components/Experiences'),
  () => import('./components/ForProperties'),
  () => import('./components/ForCouriers'),
  () => import('./components/ForMerchants'),
  () => import('./components/discovery/DiscoveryScreen'),
];

function prefetchRoutes() {
  if (typeof window === 'undefined') return;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection;
  if (conn?.saveData) return;
  if (conn?.effectiveType && /(^|-)2g$|(^|-)3g$/.test(conn.effectiveType)) return;

  for (const load of PREFETCH_ROUTES) {
    // Failure is expected and harmless — offline, or a chunk that no longer exists after
    // a deploy. The route still loads on demand when it is actually needed.
    load().catch(() => {});
  }
}

/**
 * The operations dashboard, also split out. It is a developer surface reached by
 * `?page=metrics`, so no customer journey should download its charts.
 */
const MetricsDashboard = lazy(() => import('./components/observability/MetricsDashboard'));

export type AppCurrentPage =
  | 'home'
  | 'merchants'
  | 'restaurants'
  | 'experiences'
  | 'spa'
  | 'transport'
  | 'groceries'
  | 'merchant_onboarding'
  | 'properties'
  | 'couriers'
  | 'courier_onboarding'
  | 'rider_portal'
  | 'rider_badge'
  | 'host_login'
  | 'host_apply'
  | 'host_status'
  | 'host_workspace'
  | 'host_review'
  | 'metrics';

/**
 * Pages addressable through `?page=`.
 *
 * Without this, every route lives only in React state, so a page cannot be linked
 * to, reloaded, or audited by any external tool — a URL scanner can only ever see
 * `home`. Reading the initial page from the query string fixes all three, and the
 * allow-list keeps an unknown value from rendering a blank screen.
 */
const HOST_PORTAL_PAGES: readonly AppCurrentPage[] = [
  'host_login',
  'host_apply',
  'host_status',
  'host_workspace',
  'host_review',
];

const DEEP_LINK_PAGES: readonly AppCurrentPage[] = [
  'home',
  'merchants',
  'restaurants',
  'experiences',
  'spa',
  'transport',
  'groceries',
  'merchant_onboarding',
  'properties',
  'couriers',
  'courier_onboarding',
  'rider_portal',
  'rider_badge',
  ...(import.meta.env.DEV ? HOST_PORTAL_PAGES : []),
  'metrics',
];

function pageFromUrl(): AppCurrentPage {
  try {
    const requested = new URLSearchParams(window.location.search).get('page');
    if (requested && (DEEP_LINK_PAGES as readonly string[]).includes(requested)) {
      return requested as AppCurrentPage;
    }
  } catch {
    // A malformed query string must not stop the app from booting.
  }
  return 'home';
}

/**
 * `?merchant=<id-or-slug>` opens a merchant page directly.
 *
 * The merchant page previously existed only as React state, so it could not be
 * linked, refreshed, or opened by an external tool — the same gap the page deep
 * links close for the top-level routes. Only the identifier is read; the full
 * record is fetched by MerchantRoute, which already resolves either an id or a slug.
 */
function merchantIdFromUrl(): string | null {
  try {
    const requested = new URLSearchParams(window.location.search).get('merchant');
    if (requested && requested.trim()) return requested.trim();
  } catch {
    // Ignore malformed input.
  }
  return null;
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<AppCurrentPage>(pageFromUrl);
  const [nexgStage, setNexgStage] = useState<'none' | 'discovery' | 'drilldown'>('none');
  const [selectedNexGCategory, setSelectedNexGCategory] = useState<CatalogCategory>(
    CATEGORIES_21[0]
  );
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  // Typed as ApiMerchant, which is what the API returns and what MerchantRoute
// expects. It was NexGMerchant, a legacy type for the old static-data flow; the two
// are structurally near-identical, which is exactly why the mismatch stayed hidden
// until React's own types were installed.
  const [selectedMerchant, setSelectedMerchant] = useState<ApiMerchant | null>(null);
  // An identifier from the address bar, resolved to a full record by MerchantRoute.
  // Kept separate from `selectedMerchant` so a deep link never passes a partial
  // object off as a loaded merchant.
  const [deepLinkMerchantId, setDeepLinkMerchantId] = useState<string | null>(merchantIdFromUrl);

  // Keep the query string in step with the page so the address bar stays accurate
  // and Back/Forward work, using replaceState rather than pushState: navigating the
  // SPA should not bury the previous site in the history stack.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (currentPage === 'home') params.delete('page');
      else params.set('page', currentPage);
      const openMerchantId = selectedMerchant?.id ?? deepLinkMerchantId;
      if (openMerchantId) params.set('merchant', openMerchantId);
      else params.delete('merchant');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`
      );
    } catch {
      // History is unavailable in some embedded contexts; navigation still works.
    }
  }, [currentPage, selectedMerchant, deepLinkMerchantId]);

  // Browser Back/Forward re-reads the address bar.
  useEffect(() => {
    const syncFromUrl = () => {
      setCurrentPage(pageFromUrl());
      setDeepLinkMerchantId(merchantIdFromUrl());
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  /**
   * A host page may re-route this document without reloading it.
   *
   * The device room (scripts/device-room/) frames this app once per device width and
   * needs to show the same screen on all of them at once. Reloading every frame on
   * each change would refetch the catalogue and re-run every entrance animation, so it
   * rewrites the query string and asks the app to re-read it instead.
   *
   * Accepted only from the document's own origin: the room is same-origin by
   * construction, and a document must not let a foreign frame steer its navigation.
   * `event.source === window.parent` also rejects a sibling frame talking sideways.
   */
  useEffect(() => {
    const onHostMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.parent) return;
      const data = event.data as { type?: string; search?: string } | null;
      if (!data || data.type !== 'nexg:set-route') return;
      // Rebuild the URL from the host's query string, keeping the path this document
      // was served from so a mounted app is never sent to a different entry point.
      const search = typeof data.search === 'string' ? data.search : '';
      window.history.replaceState(null, '', `${window.location.pathname}${search}`);
      setCurrentPage(pageFromUrl());
      setDeepLinkMerchantId(merchantIdFromUrl());
      (window.parent as Window).postMessage({ type: 'nexg:route-changed' }, event.origin);
    };
    window.addEventListener('message', onHostMessage);
    return () => window.removeEventListener('message', onHostMessage);
  }, []);

  // v2 discovery flow.
  // `isDiscoveryOpen` renders the merchant discovery surface; `previewMerchant`
  // holds the merchant whose PREVIEW SHEET is open. They are separate on purpose:
  // opening a preview must never replace the browse surface (requirement R3).
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [previewMerchant, setPreviewMerchant] = useState<ApiMerchant | null>(null);
  // Set when the journey into the merchant page came from the sheet's workflow CTA.
  const [focusOfferings, setFocusOfferings] = useState(false);

  const {
    customizingDish,
    setCustomizingDish,
    selectedRestaurant,
    setSelectedRestaurant,
    addToCart,
  } = useCart();

  const { isLight } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, nexgStage]);

  // Warm the other routes once, on mount, in the browser's idle time. No dependencies:
  // it must not re-run on navigation, or it would re-request chunks on every click.
  useEffect(() => {
    prefetchRoutes();
  }, []);

  // Prompt for location immediately on entering the site
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Location granted
        },
        (err) => {
          console.log('Location prompt notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const isPartnerOrOnboarding = [
    'merchants',
    'properties',
    'couriers',
    'merchant_onboarding',
    'courier_onboarding',
    'rider_portal',
    'host_login',
    'host_apply',
    'host_status',
    'host_workspace',
    'host_review',
  ].includes(currentPage);

  /**
   * Open the discovery surface, optionally pre-filled with a query.
   *
   * This is the single browse entry point, reached from the hero search box, the
   * "Explore Categories" cards and the header's Explore action.
   *
   * v2 requirement R1: it ALWAYS opens merchant discovery, with or without a
   * query. An earlier pass routed an empty query to the taxonomy explorer, so
   * clicking the search bar produced a category list with no merchants, results
   * or filters.
   *
   * v1 fix retained: `setIsCategoryExplorerOpen(true)` originally existed nowhere
   * in the app, so every one of these entry points was entirely inert (D-10).
   */
  const handleOpenNexGWorkflow = (query = '') => {
    setDiscoveryQuery(query.trim());
    setIsDiscoveryOpen(true);
    setNexgStage('none');
  };

  /** Alias so the header call site reads as its intent. */
  const handleOpenDiscovery = (query = '') => handleOpenNexGWorkflow(query);

  /**
   * A merchant card was activated in discovery.
   *
   * Requirement R3: this opens the PREVIEW SHEET and must never navigate to the
   * merchant page. Navigation happens only from the sheet's explicit "view full"
   * action, handled by `handleViewFullMerchant`.
   */
  const handlePreviewMerchant = (merchant: ApiMerchant) => {
    setPreviewMerchant(merchant);
  };

  /**
   * Explicit, user-initiated navigation to the full merchant screen.
   *
   * This is now the ONLY path to the merchant page. The merchant is held by id so
   * the route can re-fetch the complete record, with the list copy passed as a
   * fallback so the page paints immediately instead of flashing a loader.
   */
  const handleViewFullMerchant = (merchant: ApiMerchant, focusOfferings = false) => {
    setPreviewMerchant(null);
    setFocusOfferings(focusOfferings);
    setSelectedMerchant(merchant);
  };

  /** An order line was confirmed inside the item modal. */
  const handleAddedToCart = ({ item, quantity }: { item: ApiItem; quantity: number }) => {
    addToCart({ id: item.id, name: item.name, price: item.price, quantity });
  };

  const handleNavigate = useCallback((page: string) => {
    if (!import.meta.env.DEV && HOST_PORTAL_PAGES.includes(page as AppCurrentPage)) {
      setCurrentPage('properties');
      return;
    }
    if (page === 'home') {
      setNexgStage('none');
    }
    setCurrentPage(page as AppCurrentPage);
  }, []);

  return (
    <div
      className={`font-sans min-h-screen selection:bg-[#E5B65F] selection:text-black relative flex flex-col justify-between transition-colors duration-500 ${
        isLight ? 'bg-gold-canvas text-[#1a1d20]' : 'bg-[#111315] text-[#f2f2f2]'
      }`}
    >
      {/* Global Docked Header. Hidden while the discovery surface is open, which
          brings its own header with the search field. */}
      {!isPartnerOrOnboarding && !isDiscoveryOpen && (currentPage !== 'home' || nexgStage === 'none') && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          // "Explore" in the header used to be a no-op: it called
          // onNavigate('home'), which on the home page changed nothing (D-17).
          onExplore={() => handleOpenDiscovery()}
        />
      )}

      {/* Main View Router.
          Precedence matters. The merchant page must be reachable FROM discovery,
          so it is tested first: when a merchant is selected we render it whatever
          else is open, and only then fall through to discovery or the site.

          The single Suspense boundary covers every lazily-loaded route. One boundary
          rather than one per route because React re-suspends on each route change, so
          a shared fallback is what keeps the shell (header, footer) mounted and only
          the content area swapping. */}
      <main className="flex-grow">
        <Suspense fallback={<RouteFallback isLight={isLight} />}>
        {selectedMerchant || deepLinkMerchantId ? (
          <MerchantRoute
            merchantId={selectedMerchant?.id ?? deepLinkMerchantId ?? ''}
            fallback={selectedMerchant}
            onBack={() => {
              setSelectedMerchant(null);
              setDeepLinkMerchantId(null);
            }}
            onAddedToCart={handleAddedToCart}
            focusOfferings={focusOfferings}
          />
        ) : isDiscoveryOpen ? (
          <DiscoveryScreen
            initialQuery={discoveryQuery}
            onBack={() => setIsDiscoveryOpen(false)}
            onOpenMerchant={handlePreviewMerchant}
          />
        ) : (
          <>
        {currentPage === 'home' && (
          <>
            {/* NEXG DISCOVERY DEFAULT STATE */}
            {nexgStage === 'none' && (
              <>
                <Hero 
                  onNavigate={handleNavigate} 
                  onOpenCategories={handleOpenNexGWorkflow}
                />
                <MerchantAdCarousel 
                  onNavigate={handleNavigate} 
                  onOpenCategories={() => handleOpenNexGWorkflow('')}
                />
                <HowItWorks />
                <Promo onNavigate={handleNavigate} />
                <Features />
              </>
            )}

            {/* NEXG DISCOVERY WORKFLOW (legacy static-data flow) */}
            {nexgStage === 'discovery' && (
              <NexGDiscoveryView
                onSelectCategory={(category) => {
                  setSelectedNexGCategory(category);
                  setNexgStage('drilldown');
                }}
                onOpenStore={(restaurant) => {
                  setSelectedRestaurant(restaurant);
                }}
                onSelectMerchant={(merchant) => {
                  setSelectedMerchant(merchant);
                }}
                onBackToLanding={() => {
                  setNexgStage('none');
                }}
                onOpenDatabaseViewer={() => {
                  setIsSqlModalOpen(true);
                }}
              />
            )}

            {/* NEXG CATEGORY DRILLDOWN */}
            {nexgStage === 'drilldown' && (
              <NexGCategoryDrilldown
                category={selectedNexGCategory}
                onBackToDiscovery={() => {
                  setNexgStage('discovery');
                }}
              />
            )}
          </>
        )}

        {currentPage === 'restaurants' && (
          <Restaurants onNavigate={handleNavigate} />
        )}

        {currentPage === 'spa' && (
          <SpaWellness onNavigate={handleNavigate} />
        )}

        {currentPage === 'transport' && (
          <TransportPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'groceries' && (
          <GroceriesPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'experiences' && (
          <Experiences onNavigate={handleNavigate} />
        )}

        {currentPage === 'merchants' && (
          <ForMerchants onNavigate={handleNavigate} />
        )}

        {currentPage === 'properties' && (
          <ForProperties onNavigate={handleNavigate} />
        )}

        {currentPage === 'couriers' && (
          <ForCouriers onNavigate={handleNavigate} />
        )}

        {currentPage === 'merchant_onboarding' && (
          <MerchantOnboarding onNavigate={handleNavigate} />
        )}

        {currentPage === 'courier_onboarding' && (
          <CourierOnboarding onNavigate={handleNavigate} />
        )}

        {currentPage === 'rider_portal' && (
          <RiderPortal onNavigate={handleNavigate} />
        )}

        {currentPage === 'rider_badge' && <RiderBadgeVerification />}

        {import.meta.env.DEV && HOST_PORTAL_PAGES.includes(currentPage) && HostPortal && (
          <HostPortal page={currentPage as 'host_login' | 'host_apply' | 'host_status' | 'host_workspace' | 'host_review'} onNavigate={handleNavigate} />
        )}

        {/* Developer surface: live request metrics, traces and build identity.
            Reached by `?page=metrics` and rendered inside the existing Suspense
            boundary above, like every other lazily-loaded page. */}
        {currentPage === 'metrics' && (
          <MetricsDashboard />
        )}
          </>
        )}
        </Suspense>
      </main>

      {/* Unified Global Footer (present on original site and sub-pages).
          Hidden while discovery is open: discovery owns the full viewport. */}
      {!isPartnerOrOnboarding && !isDiscoveryOpen && (currentPage !== 'home' || nexgStage === 'none') && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* Customer Lifecycle Modals & Drawers */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
      />

      {/* v2 merchant PREVIEW.
          Requirement R3: activating a merchant card opens this sheet and never
          navigates to the merchant screen. `onViewFull` is the only path to
          MerchantPage, and it is an explicit user action. */}
      <MerchantPreviewSheet
        merchant={previewMerchant}
        onClose={() => setPreviewMerchant(null)}
        onViewFull={(m) => handleViewFullMerchant(m, false)}
        onPrimaryAction={(m) => handleViewFullMerchant(m, true)}
      />

      <DishCustomizerModal
        dish={customizingDish}
        restaurantName={selectedRestaurant?.name}
        onClose={() => setCustomizingDish(null)}
      />

      <CartDrawer />
      <CheckoutSimulatedModal />
      <OrderTrackingModal />
      <FloatingCartBar />
      <NexGItemSheet />

      {/* PostgreSQL DB Schema & Seed Viewer Modal */}
      <DatabaseSqlModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Floating Scroll-To-Top Button */}
      <ScrollToTop />
    </div>
  );
}

/**
 * The providers, exported so `main.tsx` can wrap MORE than the application with them.
 *
 * `ConsentBanner` is mounted as a SIBLING of `<App />` in main.tsx, deliberately, because it has
 * to outlive every route change and its click capture must be installed before the first lazily
 * loaded page is fetched. Both are properties of the document rather than of a page.
 *
 * That sibling relationship is what broke when the banner gained a `useLanguage()` call: it sat
 * outside `LanguageProvider`, the hook threw, and the entire application failed to render — a
 * blank page, with the error naming the hook rather than the component. The fix is not to remove
 * the call but to put the provider above both, which is where it belonged.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CartProvider>
          <NexGNavigationProvider>{children}</NexGNavigationProvider>
        </CartProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export { AppContent };

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
