import React, { useEffect, useRef, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ApiCategory } from '../../lib/apiClient';

/**
 * The opening edit is intentionally smaller than the full catalogue. It puts
 * bookable services and high-value requests first, while keeping Adults Only at
 * the end of that first set. The remaining six stay available through All categories.
 * These are strategic revenue-potential priorities, not category commission rates:
 * the catalogue only defines platform fees by fulfilment method.
 */
const FEATURED_IDS = [
  'concierge-services',
  'experiences',
  'airport-transfers',
  'vehicle-rentals',
  'wellness',
  'beauty',
  'alcohol-beverages',
  'flowers-gifts',
  'fashion-apparel',
  'tech-electronics',
  'restaurants-food',
  'groceries-essentials',
  'pharmacy',
  'adults-only',
] as const;

const LOWER_PRIORITY_IDS = [
  'health',
  'vehicle-services',
  'marketplace',
  'laundry-cleaning',
  'logistics-shipping',
  'financial-services',
] as const;

export function orderDiscoveryCategories(categories: ApiCategory[]): ApiCategory[] {
  const priority = [...FEATURED_IDS.slice(0, -1), ...LOWER_PRIORITY_IDS, 'adults-only'];
  const rank = new Map(priority.map((id, index) => [id, index]));

  return [...categories].sort((a, b) => {
    const aRank = rank.get(a.id) ?? priority.length;
    const bRank = rank.get(b.id) ?? priority.length;
    return aRank - bRank || a.name.localeCompare(b.name);
  });
}

export function featuredDiscoveryCategories(categories: ApiCategory[]): ApiCategory[] {
  const ordered = orderDiscoveryCategories(categories);
  const byId = new Map(ordered.map((category) => [category.id, category]));
  const primary = FEATURED_IDS.flatMap((id) => {
    const category = byId.get(id);
    return category ? [category] : [];
  });

  // If an API category has a new id or a vertical is temporarily absent, fill the
  // opening edit from the next available services and keep Adults Only last.
  const adultOnly = primary.find((category) => category.id === 'adults-only');
  const withoutAdults = primary.filter((category) => category.id !== 'adults-only');
  const extras = ordered.filter(
    (category) => !FEATURED_IDS.includes(category.id as (typeof FEATURED_IDS)[number])
  );
  const availableCount = Math.min(15, ordered.length);
  return [...withoutAdults, ...extras].slice(0, Math.max(0, availableCount - (adultOnly ? 1 : 0)))
    .concat(adultOnly ? [adultOnly] : [])
    .slice(0, availableCount);
}

interface DiscoveryCategoryRailProps {
  categories: ApiCategory[];
  isLight: boolean;
  onSelectCategory: (category: ApiCategory) => void;
}

// A featured category should drift by only about once every 12 seconds.
const LOOP_DURATION_MS = 180_000;
const DRAG_THRESHOLD = 6;

export function DiscoveryCategoryRail({
  categories,
  isLight,
  onSelectCategory,
}: DiscoveryCategoryRailProps) {
  const reducedMotion = useReducedMotion();
  const [track, api] = useSpring(() => ({
    x: 0,
    config: { mass: 1, tension: 170, friction: 28 },
  }));
  const [cycleWidth, setCycleWidth] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [springing, setSpringing] = useState(false);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    springX: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const paused = !!reducedMotion || hovered || focused || pressed || springing;

  useEffect(() => {
    const element = firstSetRef.current;
    if (!element) return;

    const measure = () => setCycleWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (cycleWidth <= 0 || !categories.length || reducedMotion || paused) {
      api.stop();
      return;
    }

    let disposed = false;
    const runCycle = (requestedStart: number) => {
      if (disposed) return;
      let from = Math.max(-cycleWidth, Math.min(0, requestedStart));
      let remaining = cycleWidth + from;
      if (remaining < 1) {
        api.set({ x: 0 });
        from = 0;
        remaining = cycleWidth;
      }

      api.start({
        from: { x: from },
        to: { x: -cycleWidth },
        config: { duration: Math.max(900, LOOP_DURATION_MS * (remaining / cycleWidth)) },
        onRest: (result) => {
          if (!result.finished || disposed) return;
          // The second set occupies the first set's exact coordinates, so resetting
          // here is visually seamless while the spring controller owns the motion.
          api.set({ x: 0 });
          runCycle(0);
        },
      });
    };

    runCycle(track.x.get());
    return () => {
      disposed = true;
      api.stop();
    };
  }, [api, categories.length, cycleWidth, paused, reducedMotion, track.x]);

  const clampX = (value: number) => Math.max(-cycleWidth, Math.min(0, value));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    api.stop();
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      springX: track.x.get(),
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
      active: false,
    };
    setPressed(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.active && Math.abs(dx) >= DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      drag.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.active) return;

    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocity = ((event.clientX - drag.lastX) / elapsed) * 1000;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    api.start({ x: clampX(drag.springX + dx), immediate: true });
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;

    if (!drag.active || cycleWidth <= 0) {
      setPressed(false);
      return;
    }

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 260);

    setPressed(false);
    setSpringing(true);
    const projected = clampX(track.x.get() + drag.velocity * 0.12);
    api.start({
      x: projected,
      config: { mass: 0.9, tension: 180, friction: 30, clamp: true },
      onRest: () => setSpringing(false),
    });
  };

  const handleCategoryClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: ApiCategory
  ) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onSelectCategory(category);
  };

  const renderCategory = (category: ApiCategory, duplicate = false) => (
    <button
      key={`${duplicate ? 'loop-' : ''}${category.id}`}
      type="button"
      tabIndex={duplicate ? -1 : 0}
      onClick={(event) => handleCategoryClick(event, category)}
      aria-label={`Explore ${category.name}`}
      className={cn(
        'group flex w-[clamp(78px,6.6vw,112px)] shrink-0 flex-col text-left',
        'rounded-[1.15rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2112] focus-visible:ring-offset-2',
        isLight ? 'focus-visible:ring-offset-[#D8B350]' : 'focus-visible:ring-offset-[#111315]'
      )}
    >
      <span className="relative block aspect-[1.05] w-full overflow-hidden rounded-[1.15rem] border border-black/10 bg-black/10 shadow-sm">
        <img
          src={category.image_url || '/images/hero_section-640.webp'}
          alt=""
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.endsWith('/images/hero_section-640.webp')) {
              image.src = '/images/hero_section-640.webp';
            }
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
        />
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#241D12]/75 text-[#F8EED5] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      </span>
      <span
        className={cn(
          'mt-1.5 line-clamp-2 min-h-[2rem] px-0.5 text-[10px] font-bold leading-[1.15] sm:text-[11px]',
          isLight ? 'text-[#21190D]' : 'text-[#F1EEE7]'
        )}
      >
        {category.name}
      </span>
    </button>
  );

  if (categories.length === 0) return null;

  return (
    <div
      className="overflow-hidden touch-pan-y"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        if (dragRef.current && !dragRef.current.active) {
          dragRef.current = null;
          setPressed(false);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onClickCapture={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      aria-label="NEXG service categories"
    >
      <animated.div
        className="flex w-max select-none gap-2.5 py-1 sm:gap-3"
        style={{ transform: track.x.to((x) => `translate3d(${x}px, 0, 0)`) }}
      >
        <div ref={firstSetRef} className="flex w-max gap-2.5 pr-2.5 sm:gap-3 sm:pr-3">
          {categories.map((category) => renderCategory(category))}
        </div>
        <div aria-hidden="true" className="flex w-max gap-2.5 pr-2.5 sm:gap-3 sm:pr-3">
          {categories.map((category) => renderCategory(category, true))}
        </div>
      </animated.div>
    </div>
  );
}

export { FEATURED_IDS as FEATURED_DISCOVERY_CATEGORY_IDS };
