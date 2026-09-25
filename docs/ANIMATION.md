# Animation libraries

Two physics libraries are installed. They overlap, and using both on the same element
or in the same subtree makes them compete for the same frames. This file records the
boundary so that never happens by accident.

| Library | Version | Where it is used today |
| --- | --- | --- |
| **Motion** (`motion/react`) | 12.x | 25 files — page and route transitions, modal enter/exit, layout animation, `useReducedMotion`, `useScroll` |
| **react-spring** | 10.0.4 | Discovery category rail drag momentum and seamless auto-loop. |

`framer-motion` 13.x is also present as Motion's legacy alias. New code imports
`motion/react`, never `framer-motion`.

## The rule

**One library per component subtree.** A component may import one of these, not both.
Composition is fine — a react-spring element can sit inside a Motion-animated page —
but no single element may have its transform driven by both.

The reason is not stylistic. Both write `transform` on the same node every frame; two
writers means the last one to run wins, and which one that is depends on mount order.
The visible result is an element that jitters, or one whose animation silently stops
partway with no error to explain it.

## Which to reach for

**react-spring** when the motion is *physical or gesture-driven*:
- drag-to-dismiss on sheet and drawer surfaces, with velocity carried into the exit
- the discovery category rail, where pointer drag momentum and the looping track share one controller
- pull-to-refresh and rubber-banding
- anything interrupted mid-flight, where a released spring must continue from its
  current position and velocity rather than restarting
- spring chains, where one value drives several derived ones

**Motion** when the motion is a *declarative state change*:
- `AnimatePresence` for mount and unmount
- `layout` animation and shared-element transitions
- variants and stagger orchestration
- scroll-linked values via `useScroll`, which is already in use in several components

The split is real rather than arbitrary: react-spring's model is imperative physics
with velocity continuity, Motion's is declarative targets with orchestration. Pick by
which of those the interaction actually is.

## Bundle cost

Currently **zero**. Vite tree-shakes react-spring entirely while nothing imports it —
confirmed by building and finding no reference in any chunk. It only starts costing
bytes when a module imports it, and because the import is per-route and lazy, it lands
in whichever chunk uses it rather than the entry.

## Reduced motion

Both libraries expose a reduced-motion path and **neither applies it automatically**.
react-spring: pass `immediate: true` to a spring, or read
`window.matchMedia('(prefers-reduced-motion: reduce)')`. Motion: `useReducedMotion()`.

Every animation added from here needs one of those. `src/index.css` already carries the
CSS-level fallbacks for the hand-written animations, so a new consumer that forgets is
visibly inconsistent rather than quietly worse.
