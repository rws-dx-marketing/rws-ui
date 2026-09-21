# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start Astro dev server
pnpm build      # Production build
pnpm preview    # Preview production build
pnpm format     # Format with Prettier
```

No test or lint scripts are configured.

## Stack

- **Astro 7** — static site generator with file-based routing
- **Tailwind CSS 4** — utility-first styling via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **ApexCharts** — charts/data visualization (currently only `dashboard.astro`)

Some markup began life as Flowbite templates (hence occasional `flowbite.s3.amazonaws.com` placeholder assets), but Flowbite is **not** a dependency — there is no Flowbite JS/CSS in the project.

## Architecture

### Routing

File-based: every `.astro` file in `src/pages/` maps directly to a URL. Subdirectories create nested routes (e.g. `src/pages/resources/blog.astro` → `/resources/blog`).

### Component layers

- `src/layouts/` — page wrappers. `Layout.astro` is the single shell (real Header, SecondaryNav, client scripts); import and wrap page content.
- `src/blocks/` — full-width marketing sections (Hero, Features, Pricing, Testimonials, etc.). These are composited inside pages.
- `src/components/` — smaller reusable elements (Header, forms, dropdowns) plus the shared section primitives:
  - `Section.astro` — section wrapper: `theme` + vertical `spacing` (from `utils/spacing`) + centred container.
  - `Intro.astro` — the "subheading + heading + copy" lede; prop-driven with placeholder fallbacks.
  - `Heading.astro` — heading with responsive `size` presets from `utils/heading-size`.
  - Prefer these over re-declaring the section/intro markup inline. Blocks take `theme`, `showIntro`, and pass remaining props through to `Intro`.

### Styles

Global CSS lives in `src/assets/styles/global.css` and imports Tailwind. Tailwind 4 is configured inline via CSS `@theme` directives rather than a separate config file.

### Client-side interactivity

Scripts in `src/assets/scripts/` are loaded with `<script>` tags in layouts or components:

- `mode.client.js` — dark mode toggle, persisted to `localStorage`
- `secondary-nav.js` — resolves active secondary nav items from current pathname
- Other scripts handle count-up animations, card filters, and dropdown filters
- All modules are wired through `init.client.js`; `mode.client.js` runs standalone

Animations use Tailwind Motion's `intersect:motion-preset-*` classes with `intersect-once` — they trigger once when elements enter the viewport via IntersectionObserver.

### Data

Static data (e.g. partner lists) lives in `src/data/` as JS modules and is imported directly into `.astro` files at build time. Astro Content Collections are deliberately **not** used — there is no markdown and no dynamic routing, so they would add schemas (i.e. types) for nothing.

Data filenames mirror `src/pages/`: a section's main content module is `src/data/<section>/index.js` (imported as `../../data/<section>`), and where a section has several pages the data files take the page names — `data/events/index.js`, `webinars.js`, `recorded.js` alongside `pages/events/index.astro`, `webinars.astro`, `recorded.astro`. `filters.js` is the exception: it has no page of its own and keeps that name everywhere.

Filter option lists all come from `src/data/taxonomies.js` — one source for products, solutions, industries, countries, service areas, topics etc., plus the `facet()`, `relabel()` and `labelFor()` helpers. Each archive's `src/data/<domain>/filters.js` composes facets from it rather than restating option lists; don't inline a new option list in a domain file if the axis already exists there. Option `value` strings are the contract with `card-filters.js`: every value in a record's `filters` object must exist in the facet of the same `id`.

### Theming

Components accept `data-theme` attributes to switch between visual variants.

### Conventions

- **Avoid TypeScript types.** Components use `// @ts-nocheck` and plain destructured props with defaults rather than `interface Props`/typed generics. Keep types minimal.

## Project context

This repo is a **design/prototype playground** — components and scripts are built here first, then ported to the real production codebase, which is a **.NET / Razor** project in a separate repo. When something works here but not there, the most likely causes are markup differences (missing IDs, different element structure) rather than script bugs.

## Response Style

- Be concise. State the fix first, reasoning second.
- No preamble, no flattering summaries, no closing fluff.
- Prefer targeted edits over rewriting large files.
- Read each file once unless it changed.
- When debugging: form a hypothesis, test it, report result. Do not explore multiple theories simultaneously.
- If stuck after two attempts, stop and ask me a specific question rather than continuing to try things.
