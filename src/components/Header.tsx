import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  ShoppingBag,
  Bike,
  Sun,
  Moon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import LogoIcon from './LogoIcon';
import LanguageSwitcher from './LanguageSwitcher';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  /** Opens the category explorer. Without this, "Explore" was a no-op. */
  onExplore?: () => void;
}

export default function Header({ currentPage, onNavigate, onExplore }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPartnersExpanded, setIsPartnersExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemsCount, setIsCartOpen, activeOrder, setIsTrackingOpen } = useCart();
  const { isLight, toggleTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Close the drawer whenever the route changes.
   *
   * Every navigation path funnels through `currentPage`, so this covers the ones that
   * bypass `handleMobileNav` — the logo, the Explore button, a deep link, and any caller
   * that forgets. Closing at the point of navigation rather than in each handler is what
   * makes it impossible to add a menu item later that forgets to dismiss the menu.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsPartnersExpanded(false);
  }, [currentPage]);

  /**
   * Lock the page behind the drawer while it is open.
   *
   * Without this the page scrolls under an open drawer, which on a phone means the user
   * scrolls the content they cannot see and loses their place. Restoring the previous
   * value rather than clearing it, so a second scroll lock elsewhere is not broken.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isMobileMenuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /**
     * Escape closes the drawer.
     *
     * The drawer had no keyboard dismissal at all. Every other overlay in this app goes
     * through `useModalBehavior`, which exists precisely to own "Escape to dismiss" -
     * but the drawer is rendered by the Header and never adopted it, so a keyboard user
     * could open the menu with Enter and then only leave it by tabbing to the toggle.
     *
     * Bound on `document` in the capture phase for one reason that has already cost this
     * project time: a handler on a container stops receiving the event if anything inside
     * calls `stopPropagation`, and the comment in `MerchantPreviewSheet` records exactly
     * that failure. Capture cannot be swallowed by a descendant.
     */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previous;
    };
  }, [isMobileMenuOpen]);

  const handleMobileNav = (page: any) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const homeHeaderBackground = currentPage === 'home'
    ? isLight
      ? 'rgb(252 249 241 / 46%)'
      : 'rgb(24 26 31 / 66%)'
    : undefined;
  const headerBackdrop = currentPage === 'home'
    ? 'bg-transparent'
    : isLight
      ? isScrolled
        ? 'bg-[#FCF9F1]/48'
        : 'bg-[#FCF9F1]'
      : 'bg-[#181A1F]';

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 rounded-none border-none transition duration-300 ${
        isScrolled
          ? isLight
            ? 'py-2.5 sm:py-3 shadow-[0_6px_25px_rgba(0,0,0,0.04)]'
            : 'py-2.5 sm:py-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)]'
          : isLight
          ? 'py-4 sm:py-6'
          : 'py-3.5 sm:py-4 xl:py-6'
      } ${
        isLight ? 'text-slate-900' : 'text-[#F8F3E8]'
      }`}
      style={{ backgroundColor: homeHeaderBackground }}
    >
      {/* Progressive Blur Layering System */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Layer 1: Core Frosted Glass with gradual vertical transparency falloff */}
        <div
          className={`absolute inset-0 backdrop-blur-xl transition-colors duration-500 ${headerBackdrop}`}
          style={{ WebkitMaskImage: 'none', maskImage: 'none' }}
        />
        {/* Layer 2: Extended Feathered Progressive Blur below bottom border for seamless scroll bleed */}
        <div
          className={`absolute -bottom-5 left-0 right-0 h-5 backdrop-blur-md transition-opacity duration-500 pointer-events-none ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          } ${
            isLight
              ? 'bg-gradient-to-b from-[#F3E4BD]/30 to-transparent'
              : 'bg-gradient-to-b from-[#181A1F]/40 to-transparent'
          }`}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>
      {/* The row must be able to SHRINK.
          A flex row gives its items their content width, and `min-width: auto` on a flex item
          refuses to go below that — so on `?page=metrics`, whose nav has more labels than any
          other surface, the row kept its natural width and pushed the page sideways by 32 to
          145px at every phone width. The other routes had fewer labels and happened to fit,
          which is why this looked like a metrics bug rather than a header one.

          `min-w-0` lets the children shrink; `truncate` is what they shrink into; the control
          cluster is `shrink-0` because navigation must stay tappable. */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 md:px-7 flex items-center justify-between gap-3 min-w-0 relative z-10">
        {/* Brand — the supplied wordmark, with no text beside it.
            The artwork already spells NEXG, so a text block next to it said the name twice.
            Sized by height rather than a square box because the artwork is 361x137, about
            2.6:1: it needs roughly 40px of height to stay legible, which makes it about
            105px wide. `w-auto` is therefore load-bearing — a fixed width would squash it. */}
        <div
          className="flex items-center shrink-0 cursor-pointer select-none group"
          onClick={() => onNavigate('home')}
        >
          <LogoIcon
            variant="wordmark"
            className="w-auto group-hover:scale-[1.03] transition-transform origin-left h-8 sm:h-10 lg:h-11"
          />
        </div>

        {/* Desktop Navigation Links
            v2: reduced to Explore + Partners. The six vertical entries that used
            to sit between them (Fine Dining, Spa & Wellness, VIP Mobility, Fine
            Cellar, Experiences) now live in the Discovery surface, which is the
            single browse entry point, and remain reachable from the footer.

            This also fixes v1 defect D-15: the full nav needed ~1331px inside a
            1280px `xl` breakpoint, so items crowded at exactly the width where
            they first appeared. */}
        <nav className={`hidden sm:flex items-center min-w-0 ${isLight
          ? 'gap-7 xl:gap-14 text-base lg:text-lg font-medium tracking-normal md:absolute md:left-1/2 md:-translate-x-1/2'
          : 'gap-7 xl:gap-14 text-xs sm:text-[13px] xl:text-base font-semibold tracking-wide xl:tracking-normal xl:absolute xl:left-1/2 xl:-translate-x-1/2'
        }`}>
          <button
            onClick={() => (onExplore ? onExplore() : onNavigate('home'))}
            className={`group flex items-center gap-1 transition-colors cursor-pointer text-left bg-transparent border-none p-0 ${
              currentPage === 'home'
                ? isLight
                  ? 'text-[#946200] font-medium'
                  : 'text-[#E5B65F] font-bold'
                : isLight
                ? 'text-[#171717] hover:text-[#7d5a11]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {t.nav.explore}
            <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
          </button>

          {/* Partners Dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center gap-1 transition-colors cursor-pointer text-left bg-transparent border-none p-0 ${
                currentPage === 'merchants' ||
                currentPage === 'properties' ||
                currentPage === 'couriers'
                  ? isLight
                    ? 'text-[#7d5a11] font-bold'
                    : 'text-[#E5B65F] font-bold'
                  : isLight
                  ? 'text-[#171717] hover:text-[#7d5a11]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>{t.nav.partners}</span>
              <ChevronDown size={13} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-colors duration-200">
              <div
                className={`w-48 rounded-xl shadow-2xl flex flex-col overflow-hidden py-2 border backdrop-blur-xl ${
                  isLight
                    ? 'bg-[#F7EED8]/95 text-slate-800 border-[#6D531D]/20'
                    : 'bg-[#181A1F]/95 text-gray-200 border-white/15'
                }`}
              >
                <button
                  onClick={() => onNavigate('properties')}
                  className={`px-4 py-2 text-left text-xs font-semibold w-full cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-[#E9D9B6] text-slate-700' : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  {t.nav.forProperties}
                </button>
                <button
                  onClick={() => onNavigate('couriers')}
                  className={`px-4 py-2 text-left text-xs font-semibold w-full cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-[#E9D9B6] text-slate-700' : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  {t.nav.forCouriers}
                </button>
                <button
                  onClick={() => onNavigate('merchants')}
                  className={`px-4 py-2 text-left text-xs font-semibold w-full cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-[#E9D9B6] text-slate-700' : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  {t.nav.forMerchants}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Right Controls */}
        <div className={`flex items-center gap-2 sm:gap-2.5 shrink-0 ${
          currentPage === 'home' ? (isLight ? 'home-light-header-controls' : 'home-dark-header-controls') : ''
        }`}>
          {/* Active Order Tracker Shortcut */}
          {activeOrder && activeOrder.estimatedMinutesLeft > 0 && activeOrder.status !== 'delivered' && (
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Bike size={14} />
              <span className="hidden sm:inline">{t.nav.track}</span>
              <span>~{activeOrder.estimatedMinutesLeft}m</span>
            </button>
          )}

          {/* Dedicated Single-Color Language Switcher in Header */}
          <LanguageSwitcher align="right" />

          {/* Theme Toggle Button (Light / Dark Mode Switch) */}
          <button
            id="header-theme-toggle-btn"
            onClick={toggleTheme}
            className={`flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border transition-colors cursor-pointer sm:w-auto sm:px-3 ${
              isLight
                ? 'bg-[#F7EED8] hover:bg-[#EEE5D1] border-[#6D531D]/30 text-[#7D5A11]'
                : 'bg-[#181A1F] hover:bg-[#202328] border-white/20 text-[#E5B65F]'
            }`}
            aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon size={17} /> : <Sun size={17} />}
            <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline">
              {isLight ? 'Dark mode' : 'Light mode'}
            </span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
            }`}
            aria-label={t.ui.header.s_7abd6c}
          >
            <ShoppingBag size={17} />
            {itemsCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E5B65F] text-black font-extrabold text-[10px] flex items-center justify-center shadow-md"
              >
                {itemsCount}
              </motion.span>
            )}
          </button>

          {/* Mobile Hamburger Toggle.
              `sm:hidden`, not `xl:hidden`. The two breakpoints have to agree with the nav
              above: with the nav appearing at `sm` and the hamburger disappearing only at
              `xl`, every width between them showed BOTH controls — the hamburger still on
              screen at 1280px on a desktop, which is the bug the user reported.

              Below `sm` the hamburger is the only entry point, so it stays. */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-1.5 sm:hidden cursor-pointer ${
              isLight ? 'text-slate-800 hover:text-[#B88728]' : 'text-white hover:text-[#E5B65F]'
            }`}
            /* The name follows the state. It used to be the fixed string "Open Mobile Menu"
               while the icon flipped to an X, so once the drawer was open a screen reader
               still announced "Open Mobile Menu" for a control that closes it - the name and
               the action disagreed. `aria-expanded` states the same fact in the form assistive
               technology expects, and the label is the action the button will perform next.

               This also misled an audit: searching for a close button found none, because the
               only button there keeps its "Open" name forever. */
            aria-label={isMobileMenuOpen ? 'Close Mobile Menu' : 'Open Mobile Menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu-drawer"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`w-full border-t p-5 shadow-2xl flex flex-col gap-3.5 z-50 xl:hidden ${
              isLight
                ? 'bg-[#F7EED8]/98 text-slate-900 border-[#6D531D]/20'
                : 'bg-[#181A1F]/98 text-white border-white/15'
            }`}
          >
            {/* Mobile Language & Theme Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <LanguageSwitcher variant="mobile" />
              </div>
              <button
                id="header-mobile-theme-toggle-btn"
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#E9D9B6] border-[#6D531D]/20 text-amber-900'
                    : 'bg-white/10 border-white/15 text-[#E5B65F]'
                }`}
                title={t.ui.header.s_64f892}
              >
                {isLight ? <Moon size={15} /> : <Sun size={15} />}
                <span>{isLight ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 font-medium text-sm pt-2 border-t border-black/5 dark:border-white/10">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onExplore) onExplore();
                  else onNavigate('home');
                }}
                className={`text-left py-2 transition-colors border-b ${
                  isLight ? 'border-[#6D531D]/15 hover:text-[#7d5a11] text-slate-800' : 'border-white/10 hover:text-[#E5B65F] text-gray-200'
                }`}
              >
                {t.nav.explore}
              </button>

              <div>
                <button
                  onClick={() => setIsPartnersExpanded(!isPartnersExpanded)}
                  className={`flex items-center justify-between w-full text-left py-2 transition-colors border-b ${
                    isLight ? 'border-[#6D531D]/15 hover:text-[#7d5a11] text-slate-800' : 'border-white/10 hover:text-[#E5B65F] text-gray-200'
                  }`}
                >
                  <span>{t.nav.partners}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${isPartnersExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isPartnersExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`overflow-hidden rounded-xl mt-2 px-4 py-2 flex flex-col gap-2 text-xs ${
                        isLight ? 'bg-[#E9D9B6] text-slate-700' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => handleMobileNav('properties')}
                        className="text-left py-1.5 hover:text-[#B88728] transition-colors"
                      >
                        {t.nav.forProperties}
                      </button>
                      <button
                        onClick={() => handleMobileNav('couriers')}
                        className="text-left py-1.5 hover:text-[#B88728] transition-colors"
                      >
                        {t.nav.forCouriers}
                      </button>
                      <button
                        onClick={() => handleMobileNav('merchants')}
                        className="text-left py-1.5 hover:text-[#B88728] transition-colors"
                      >
                        {t.nav.forMerchants}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

