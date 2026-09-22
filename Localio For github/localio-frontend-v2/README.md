# Localio frontend v2 (redesign)

Vite + React + TypeScript + React Router + Tailwind v4 + Framer Motion + Lucide React.
This replaces the earlier Next.js build - the master design instruction specified this
exact stack, plus a very different visual direction, so it's a clean rebuild rather
than a patch of the old one.

## Run it

```bash
npm install
cp .env.local.example .env.local   # points at the backend, defaults to localhost:8000
npm run dev
```

Start the backend first (see `../localio-backend/README.md`) and seed it -
this app has nothing to show without it.

## What's built

All 7 core pages from the instruction, phases 1-8 of the development rule:

- **Home** - compact hero, then straight into discovery: "People are talking about...",
  "Trending nearby", "Hidden gems", "Highly rated by verified visitors", "Recently reviewed"
- **Explore** - category + discovery-angle browsing (trending / hidden gems / highly rated /
  most reviewed / recently discovered)
- **Nearby** - locality-grouped list ("Around Navrangpura"), not address-first
- **Place** - the most important page: community rating first, review feed with
  filter (All/Taste/Value/Hygiene/Crowd) + sort (helpful/newest/highest/lowest/verified),
  "About this place" deliberately last
- **Write a review** - star -> tag ratings -> photo -> comment -> post, one screen,
  Framer Motion micro-interactions, geolocation-based verified-visit check
- **Profile** - reviewer credibility (review count, verified-visit count) + their
  review history
- **Login** - phone OTP (dev stub, same as backend); signup forks into two
  roles right at the start: Reviewer or Vendor
- **Vendor onboarding** - one-time business claim/create flow: name, category,
  locality/landmark, a location-confirmation step (same geolocation check used
  for verified reviews), optional photo and GST number. One listing per vendor
  account, no edit access afterward by design.
- **Vendor dashboard** - read-only: rating, review count, total helpful votes,
  and the review feed itself. No reply/edit/hide controls - reviews stay an
  untouchable trust signal, which is the whole point of the product.

Search is wired (`/search?q=`) and does a client-side match across name/locality/landmark
since the backend only text-matches locality server-side today - noted inline in the code.

## Design system

Documented inline in `src/index.css`. Summary: warm ivory background, charcoal text,
one restrained warm accent (a muted saffron-gold - deliberately not the generic
AI-cream+neon-terracotta combo), a separate deep teal reserved only for verification/trust
signals, and a muted maroon reserved only for star ratings so accent and rating don't
compete. Plus Jakarta Sans for display/headlines, Inter for body. Medium-radius cards
with hairline borders and soft shadows - no glassmorphism, no pill-shaped everything
(pills are reserved for categories/filters/tags/status per the brief).

Fonts and icons are all self-hosted npm packages (`@fontsource/*`, `lucide-react`)
rather than a Google Fonts CDN call, so this builds without needing network access to
fonts.google.com.

## Known gaps / what's mocked

- **Photos**: review photo upload is wired end-to-end to the backend, but the backend
  doesn't persist the actual file yet (placeholder URL) - so photo review cards show a
  neutral placeholder instead of a broken image, not a real photo.
- **Business photos/hours/popular items**: not in the current data model at all -
  the "About this place" section says so honestly rather than faking it.
- **Categories**: the instruction's example categories (Chai & Coffee, Snacks, Desserts,
  Drinks...) aren't in the backend's category enum yet (`street_food` / `eatery` only) -
  Explore's category filter reflects real data instead of decorative categories that
  don't actually filter anything.
- **Search**: client-side substring match over a full listing pull, not real search -
  fine at seed-data scale, won't scale past a few hundred listings.
- **Map view**: not built - the instruction treats map as secondary/optional, so it was
  deprioritized in favor of the review-first list views. "Get directions" links out to
  Google Maps instead.
- **No PWA service worker yet** - manifest is in place, installability/offline shell isn't.

## Before this touches real users

Same list as the backend README (OTP, photo storage, geolocation spoofing) - see there.
