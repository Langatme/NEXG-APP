import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Sparkles, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { OfferCard, type Offer } from './ui/offer-carousel';
import InfiniteMarquee from './ui/InfiniteMarquee';
import { ProductCarousel, type Product } from './ui/product-carousel';

interface MerchantAdCarouselProps {
  onNavigate?: (page: string) => void;
  onOpenCategories?: () => void;
}

export default function MerchantAdCarousel({
  onNavigate,
  onOpenCategories,
}: MerchantAdCarouselProps) {
  const { t } = useLanguage();
  const { isLight } = useTheme();
  const { addToCart, setIsCartOpen } = useCart();

  // Location State: Site asks for location immediately on entering
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>('Nairobi, Kenya');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Request browser location immediately
  const requestLocation = useCallback(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHasLocation(true);
          setIsLocating(false);
          // Coordinates obtained; map to high-end delivery zone
          const { latitude, longitude } = position.coords;
          setLocationName(
            latitude && longitude
              ? 'Westlands & Karen, Nairobi'
              : 'Nairobi Central District'
          );
        },
        (error) => {
          console.warn('Location prompt response/denied:', error.message);
          setHasLocation(false);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  // Ask for location immediately upon entering the site
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // 1. POPULAR RIGHT NOW / POPULAR AROUND YOU PRODUCTS
  const popularItems: Product[] = [
    {
      id: 'pop-1',
      name: 'Dom Pérignon Vintage Brut Champagne 2013',
      quantity: '750ml thermal case with Riedel crystal flutes',
      price: 45000,
      originalPrice: 52000,
      discount: '15% OFF',
      deliveryTime: '20 mins',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-1`,
          menuItemId: 'dom-perignon-2013',
          restaurantId: 'sommelier-reserve',
          restaurantName: 'Sommelier Reserve Cellar',
          name: 'Dom Pérignon Vintage Brut Champagne 2013',
          price: 45000,
          image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 45000,
        });
        setIsCartOpen(true);
      },
    },
    {
      id: 'pop-2',
      name: 'Japanese Miyazaki A5 Wagyu Ribeye Cut',
      quantity: '350g Prime BMS 11+ with Himalayan salt block',
      price: 14800,
      originalPrice: 17500,
      discount: 'CHEF CHOICE',
      deliveryTime: '25 mins',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-2`,
          menuItemId: 'wagyu-ribeye-a5',
          restaurantId: 'hemingways-brasserie',
          restaurantName: 'Hemingways Brasserie',
          name: 'Japanese Miyazaki A5 Wagyu Ribeye Cut',
          price: 14800,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 14800,
        });
        setIsCartOpen(true);
      },
    },
    {
      id: 'pop-3',
      name: 'Imperial Beluga Hybrid Caviar',
      quantity: '50g tin with mother-of-pearl tasting spoon',
      price: 24500,
      deliveryTime: '18 mins',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-3`,
          menuItemId: 'beluga-caviar',
          restaurantId: 'sommelier-reserve',
          restaurantName: 'Sommelier Reserve Cellar',
          name: 'Imperial Beluga Hybrid Caviar',
          price: 24500,
          image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 24500,
        });
        setIsCartOpen(true);
      },
    },
    {
      id: 'pop-4',
      name: 'The Macallan 18 Year Double Cask Single Malt',
      quantity: '700ml bespoke highland oak casket presentation',
      price: 52000,
      deliveryTime: '22 mins',
      imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-4`,
          menuItemId: 'macallan-18',
          restaurantId: 'sommelier-reserve',
          restaurantName: 'Sommelier Reserve Cellar',
          name: 'The Macallan 18 Year Double Cask Single Malt',
          price: 52000,
          image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 52000,
        });
        setIsCartOpen(true);
      },
    },
    {
      id: 'pop-5',
      name: 'Pan-Seared Brittany Turbot with Truffle Glaze',
      quantity: 'Wild caught fillet with chanterelles & caviar emulsion',
      price: 8500,
      originalPrice: 9500,
      discount: 'SIGNATURE',
      deliveryTime: '30 mins',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-5`,
          menuItemId: 'turbot-truffle',
          restaurantId: 'hemingways-brasserie',
          restaurantName: 'Hemingways Brasserie',
          name: 'Pan-Seared Brittany Turbot with Truffle Glaze',
          price: 8500,
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 8500,
        });
        setIsCartOpen(true);
      },
    },
    {
      id: 'pop-6',
      name: 'Couples Volcanic Hot Stone Ritual Package',
      quantity: '90-min in-suite therapy with botanical wild oils',
      price: 18000,
      deliveryTime: 'Priority Booking',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80',
      onAdd: () => {
        addToCart({
          id: `item-${Date.now()}-6`,
          menuItemId: 'volcanic-spa-stones',
          restaurantId: 'entim-sidai',
          restaurantName: 'Entim Sidai Sanctuary',
          name: 'Couples Volcanic Hot Stone Ritual Package',
          price: 18000,
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80',
          quantity: 1,
          selectedOptions: [],
          itemTotal: 18000,
        });
        setIsCartOpen(true);
      },
    },
  ];

  // 2. SPONSORED OFFERS (Strictly 2 per screen, subtle non-contrasting border stroke, 2s auto-scroll, bottom dots)
  const sponsoredOffers: Offer[] = [
    {
      id: 'spons-1',
      imageSrc: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Michelin-curated private dining in suite',
      tag: 'Chef Experience',
      title: 'Private Butler Table Service',
      description: '5-course bespoke European dinner curated table-side with sommelier wine pairing.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80',
      brandName: 'Hemingways Brasserie',
      promoCode: 'BUTLER20',
      href: '#',
      onClick: () => {
        if (onOpenCategories) onOpenCategories();
        else onNavigate?.('restaurants');
      },
    },
    {
      id: 'spons-2',
      imageSrc: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Mercedes Maybach airport tarmac transfer',
      tag: 'Priority Mobility',
      title: 'VIP Tarmac & City Escort',
      description: 'Chauffeured Mercedes-Maybach S680 with executive security escort and flight tracking.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=120&q=80',
      brandName: 'Apex Chauffeur Fleet',
      promoCode: 'MAYBACH15',
      href: '#',
      onClick: () => {
        onNavigate?.('transport');
      },
    },
    {
      id: 'spons-3',
      imageSrc: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Dom Perignon & Grand Cru champagne cellar',
      tag: 'Cellar Vault',
      title: 'Dom Pérignon Thermal Delivery',
      description: 'Rare vintage champagnes delivered in temperature-controlled cases with crystal flutes.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=120&q=80',
      brandName: 'Sommelier Reserve',
      promoCode: 'GRANDCRU',
      href: '#',
      onClick: () => {
        if (onOpenCategories) onOpenCategories();
        else onNavigate?.('groceries');
      },
    },
    {
      id: 'spons-4',
      imageSrc: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Forest wellness spa massage',
      tag: 'In-Suite Wellness',
      title: 'Volcanic Warm Stone Ritual',
      description: '90-minute couples hot stone therapy with indigenous aromatherapy botanical oils.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=120&q=80',
      brandName: 'Entim Sidai Sanctuary',
      promoCode: 'SERENE90',
      href: '#',
      onClick: () => {
        onNavigate?.('spa');
      },
    },
    {
      id: 'spons-5',
      imageSrc: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Private helicopter safari over savannah',
      tag: 'Exclusive Aerial',
      title: 'Helicopter Wildlife Safari',
      description: 'Private charter flight over the Great Rift Valley with champagne bush landing.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1507525428033-b723cf961d3e?auto=format&fit=crop&w=120&q=80',
      brandName: 'Horizon Aero Safari',
      promoCode: 'FLYSAFARI',
      href: '#',
      onClick: () => {
        if (onOpenCategories) onOpenCategories();
        else onNavigate?.('experiences');
      },
    },
    {
      id: 'spons-6',
      imageSrc: 'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Haute Parfumerie bespoke fragrance bottles',
      tag: 'Haute Parfumerie',
      title: 'Bespoke Olfactory Suite Bar',
      description: 'Private in-room fragrance consultation with rare French essences and custom flacon engraving.',
      brandLogoSrc: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=120&q=80',
      brandName: 'Maison de Parfum',
      promoCode: 'SCENTVIP',
      href: '#',
      onClick: () => {
        if (onOpenCategories) onOpenCategories();
        else onNavigate?.('experiences');
      },
    },
  ];

  return (
    <section
      id="merchant-ad-carousel"
      className="py-10 px-4 sm:px-8 xl:px-16 max-w-[1440px] mx-auto space-y-12 transition-colors duration-300"
    >
      {/* ==================================================================== */}
      {/* 1. FIRST CAROUSEL: "Popular Right Now" / "Popular Around You"       */}
      {/* (Changes to "Popular Around You" only when user location is on)       */}
      {/* ==================================================================== */}
      <div id="popular-carousel-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {hasLocation ? 'Popular Around You' : 'Popular Right Now'}
              </h2>

              {hasLocation ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{locationName}</span>
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  disabled={isLocating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-[#FFF9EB] text-[#493000] border-[#7D5A11]/55 hover:bg-white hover:border-[#62430A] shadow-[0_1px_3px_rgba(33,25,13,0.12)]'
                      : 'bg-[#181A1F] text-[#F8F3E8] border-white/10 hover:bg-[#202328]'
                  }`}
                  title={t.ui.merchantAdCarousel.s_430fac}
                >
                  <Navigation
                    size={12}
                    className={`${isLocating ? 'animate-spin' : ''} ${isLight ? 'text-[#7D5A11]' : 'text-[#E5B65F]'}`}
                  />
                  <span>{isLocating ? 'Detecting...' : 'Enable location'}</span>
                </button>
              )}
            </div>

            <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              {hasLocation
                ? `Showing curated culinary and concierge highlights trending around ${locationName}`
                : 'Real-time trending luxury favorites and instant suite arrivals'}
            </p>
          </div>

          <button
            onClick={() => onOpenCategories?.()}
            className={`self-start sm:self-auto text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer hover:underline ${
              isLight ? 'text-[#7d5a11]' : 'text-[#E5B65F]'
            }`}
          >
            Explore all items &gt;
          </button>
        </div>

        {/* Popular Carousel with 2-second auto-scroll, subtle low-contrast stroke, and bottom dots */}
        <ProductCarousel
          title=""
          products={popularItems}
          autoScrollInterval={2000}
        />
      </div>

      {/* ==================================================================== */}
      {/* 2. SECOND CAROUSEL: "Sponsored"                                     */}
      {/* (Clean header, exactly two merchant cards per screen, 2s auto-scroll) */}
      {/* ==================================================================== */}
      <div id="sponsored-carousel-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Sponsored
            </h2>
            <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-[#40341E]' : 'text-gray-400'}`}>{t.ui.merchantAdCarousel.s_3340de}</p>
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-white/5 border-white/10 text-gray-300'
            }`}
          >{t.ui.merchantAdCarousel.s_2d4e52}</span>
        </div>

        {/* A continuous rail rather than the paging carousel.
            The paging version advanced every 2s and jumped from the last slide back
            to the first, which reads as a bounce on a loop. A marquee never resets
            visibly: the track is rendered twice and translates by exactly -50%, so
            the wrap lands on an identical frame. It also has no end state, which is
            what "sponsored" wants — the rail is texture, not something to finish. */}
        <InfiniteMarquee
          label={t.ui.merchantAdCarousel.s_297522}
          pixelsPerSecond={38}
          className={
            isLight
              ? '[--marquee-fade:#D8B350] py-1'
              : '[--marquee-fade:#111315] py-1'
          }
        >
          {sponsoredOffers.map((offer) => (
            <div key={offer.id} className="w-[300px] sm:w-[340px] shrink-0">
              <OfferCard offer={offer} twoPerScreen={false} />
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </section>
  );
}
