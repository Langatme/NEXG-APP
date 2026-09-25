import React, { useRef, useState } from 'react';
import { MapPin, Sun, Moon, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotion } from 'motion/react';
import { HeroWipeSubtitle } from './HeroRotatingSubtitle';
import DockedSearchBar from './hero/DockedSearchBar';
import heroRooftopBlueHourDesktop from '../assets/images/hero_rooftop_blue_hour_desktop.webp';
import heroRooftopBlueHourMobile from '../assets/images/hero_rooftop_blue_hour_mobile.webp';
import heroRooftopSunsetDesktop from '../assets/images/hero_rooftop_sunset_desktop.webp';
import heroRooftopSunsetMobile from '../assets/images/hero_rooftop_sunset_mobile.webp';
import { splitHeadline } from '../lib/headline';

interface HeroProps {
  onNavigate?: (page: string) => void;
  onOpenCategories?: (initialQuery?: string) => void;
}

export default function Hero({ onNavigate, onOpenCategories }: HeroProps) {
  const [query, setQuery] = useState('');
  const { isLight, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // The inline search. The docked bar observes this element: once it has scrolled past the
  // header, the docked bar takes over. Typed as HTMLElement rather than HTMLFormElement so
  // the same ref works whether it lands on the wrapper div or the form inside it.
  const inlineSearchRef = useRef<HTMLDivElement | null>(null);

  /**
   * The search itself, extracted from the form handler so the docked bar can run exactly
   * the same logic. Two submit paths that drift apart is the classic way a duplicated
   * control starts behaving differently from the original.
   */
  const runSearch = () => {
    if (onOpenCategories) {
      onOpenCategories(query);
      return;
    }
    if (!query.trim()) return;
    const q = query.toLowerCase();
    if (q.includes('spa') || q.includes('massage') || q.includes('facial') || q.includes('wellness')) {
      onNavigate?.('spa');
    } else if (q.includes('car') || q.includes('maybach') || q.includes('ride') || q.includes('heli') || q.includes('transport')) {
      onNavigate?.('transport');
    } else if (q.includes('grocery') || q.includes('caviar') || q.includes('wine') || q.includes('pantry') || q.includes('cellar')) {
      onNavigate?.('groceries');
    } else if (q.includes('yacht') || q.includes('experience') || q.includes('safari') || q.includes('polo')) {
      onNavigate?.('experiences');
    } else {
      onNavigate?.('restaurants');
    }
  };

  /** Kept for the inline form's onSubmit, which must still preventDefault. */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const handleSuggestionClick = (sug: string) => {
    setQuery(sug);
    if (onOpenCategories) {
      onOpenCategories(sug);
      return;
    }
    const q = sug.toLowerCase();
    if (q.includes('massage')) onNavigate?.('spa');
    else if (q.includes('maybach')) onNavigate?.('transport');
    else if (q.includes('caviar')) onNavigate?.('groceries');
    else if (q.includes('yacht')) onNavigate?.('experiences');
    else onNavigate?.('restaurants');
  };

  return (
    <section className={`hero-section relative min-h-[92vh] lg:min-h-[100svh] px-4 sm:px-8 xl:px-16 flex flex-col justify-center overflow-hidden pt-24 sm:pt-28 pb-16 transition-colors duration-700 ${
      isLight ? 'hero-section--light bg-gold-canvas' : 'hero-section--dark bg-[#111315]'
    }`}>
      {/* Background Imagery with Smooth Mode Cross-Fade & Organic Feathering */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Dark-mode blue-hour rooftop image, composed to match the supplied reference. */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            isLight ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* A restrained left-side wash keeps the headline legible over the skyline. */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#071521]/48 via-[#071521]/22 to-transparent" />
          
          {/* Full-bleed hero art: phones use the dedicated portrait composition,
              while desktop keeps the wide rooftop framing. Eager loading protects
              the first paint because this is the page's largest visual. */}
          <picture className="absolute inset-0 z-0 block h-full w-full">
            <source media="(max-width: 639px)" srcSet={heroRooftopBlueHourMobile} />
            <img
              src={heroRooftopBlueHourDesktop}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-b from-transparent via-[#111315]/45 to-[#111315] sm:h-24"
          />
        </div>

        {/* Light mode uses matching sunset edits of the blue-hour desktop and mobile artwork. */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            isLight ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Warm gold scrims preserve headline contrast without bleaching the image. */}
          <div className="hero-light-warmth absolute inset-0 z-10" />
          <div className="hero-light-ground absolute inset-0 z-10" />
          <div
            aria-hidden="true"
            className="hero-light-transition absolute inset-x-0 bottom-0 z-10 h-16 sm:h-24"
          />
          <picture className="absolute inset-0 z-0 block h-full w-full">
            <source media="(max-width: 639px)" srcSet={heroRooftopSunsetMobile} />
            <img
              src={heroRooftopSunsetDesktop}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="hero-light-image h-full w-full object-cover"
            />
          </picture>
        </div>

      </div>

      <div className={`container mx-auto relative z-20 flex flex-col justify-center flex-1 ${isLight ? 'hero-content--light' : 'hero-content--dark'}`}>
        <div className={`hero-copy mt-auto sm:mt-0 mb-8 sm:mb-0 ${isLight ? 'hero-copy--light' : 'hero-copy--dark'}`}>
          
          {/* Hero headline. Values baked from the accepted live-mode variant:
              scale=large, leading=snug, ink=tight. The @scope scaffolding and the
              helper markers are gone; this is the permanent form.
          
              The general line-2 treatment is 0.95em. The accepted home compositions
              override it to equal-size lines, matching the supplied reference. */}
          <h1
            className={`hero-h1 font-display font-bold transition-colors duration-300 ${
              isLight ? 'text-slate-900' : 'text-[#F8F3E8]'
            }`}
          >
            {/*
              ONE MARKUP, TWO SHAPES.

              Desktop keeps the approved two lines. Below `sm` the same two phrases are split
              into four, which lets the type be markedly larger: the size ceiling is set by the
              longest line, and the longest of four is 756 units against 961 for the longest of
              two — a 1.27x gain, measured. That is 38px instead of 30px on a 320px screen and
              47px instead of 37px at 390.

              The split is algorithmic rather than authored, because line breaks are not
              portable. `Intl.Segmenter` finds the break opportunities each language actually
              has — spaces for English, Swahili and Arabic, and the correct boundaries for
              Chinese, which has none. Hardcoding "Everything you / need" would produce a single
              unbroken Chinese line, since the whole phrase contains no space to break at.

              Both shapes are in the DOM and CSS decides which shows. Rendering one or the
              other in JS would mean a resize listener to swap them, and the layout would
              reflow visibly on rotation.
            */}
            <span className="hero-h1__two">
              <span className="hero-h1__lead">{t.hero.titleLine1}</span>{' '}
              <span className="hero-h1__line2">{t.hero.titleLine2}</span>
            </span>
            <span className="hero-h1__four" aria-hidden="true">
              {splitHeadline(`${t.hero.titleLine1} ${t.hero.titleLine2}`, 4).map((line, i) => (
                <span key={i} className={i === 0 ? 'hero-h1__lead' : 'hero-h1__line2'}>
                  {line}
                </span>
              ))}
            </span>
          </h1>

          {/* The service line: a customer's word, then what that word buys. Dark mode
              uses the reference's fixed Rides line; light mode retains its own copy.
              TWO spacing decisions, both deliberate:

              `pl-[0.18em]` indents it very slightly from the headline's left edge. The
              indent is what signals that this line belongs TO the headline rather than
              being a sibling of it — the difference is small enough to read as
              intentional positioning rather than as a misalignment, which is the risk
              with any indent this shallow.

              `mt-6` against `mb-4` puts MORE space above than below, so the line groups
              downward with the search bar. Equal gaps had it floating between the two,
              belonging to neither. */}
          <HeroWipeSubtitle
            isLight={isLight}
            reduceMotion={Boolean(prefersReducedMotion)}
            staticRides={!isLight}
            className={`mt-6 mb-4 pl-[0.26em] text-base sm:text-lg md:text-xl font-semibold leading-snug transition-colors duration-300 ${
              isLight ? 'hero-light-services text-slate-900' : 'hero-dark-services text-[#E9E3D8]'
            }`}
          />

          {/* Adaptive Editable Search Bar with Live Clear & Suggestions.
              The docked bar watches a WRAPPER, not the form itself, and the wrapper is
              given 220px of extra height below. A one-line element leaves the viewport
              almost immediately, so observing it directly would dock the bar after about
              sixty pixels of scrolling — the bar would appear before the user had
              meaningfully left the hero. The extra box means the hero search must travel
              properly out of view first. */}
          <div ref={inlineSearchRef}>
          <form onSubmit={handleSearchSubmit} className={`relative mb-3 ${isLight ? 'hero-search--light' : 'hero-search--dark'}`}>
            <MapPin
              className="hero-search-icon absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
              size={22}
            />
            
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={() => onOpenCategories?.(query)}
              placeholder={t.hero.searchPlaceholder}
              className={`w-full pl-13 pr-24 sm:pr-32 py-4 sm:py-4.5 text-xs sm:text-sm md:text-base font-semibold outline-none backdrop-blur-xl transition duration-300 cursor-pointer text-ellipsis ${
                isLight
                  ? 'rounded-2xl bg-[#F7EED8]/95 text-slate-900 border border-[#6D531D]/20 placeholder:text-[#594A2D] focus:border-[#7D5A11] focus:ring-4 focus:ring-[#7D5A11]/20 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                  : 'rounded-full bg-[#181A1F] text-[#F8F3E8] border border-white/10 placeholder:text-[#C4CBD3] focus:border-[#E5B65F] focus:ring-4 focus:ring-[#E5B65F]/20 shadow-[0_10px_32px_rgba(0,0,0,0.38)]'
              }`}
            />

            {/* Clear Input Button */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className={`absolute right-24 sm:right-28 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
                  isLight ? 'text-[#7D5A11] hover:text-[#3D2E12] hover:bg-[#E9D9B6]' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={t.ui.hero.s_67300d}
              >
                <X size={16} />
              </button>
            )}

            <button
              id="hero-search-submit-btn"
              type="submit"
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-2.5 sm:py-2.5 font-bold text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95 ${
                isLight
                  ? 'rounded-xl bg-[#B88728] hover:bg-[#9e721d] text-slate-950'
                  : 'rounded-full bg-[#E5B65F] hover:bg-[#d6a54d] text-[#1A1712]'
              }`}
            >
              {t.hero.searchBtn}
            </button>
          </form>
          </div>
        </div>
      </div>

      {/* The docked bar lives inside the hero rather than at app level, so it is scoped
          to the home page by construction. The user asked for the scroll effect here and
          nowhere else, and a component mounted per-page cannot leak onto another route.
          It is `fixed`, so its position in this tree has no effect on where it renders. */}
      <DockedSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={runSearch}
        onOpenCategories={onOpenCategories}
        anchorRef={inlineSearchRef}
        placeholder={t.hero.searchPlaceholder}
      />
    </section>
  );
}

