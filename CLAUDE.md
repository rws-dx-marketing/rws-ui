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

- **Astro 6** — static site generator with file-based routing
- **Tailwind CSS 4** — utility-first styling via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **Flowbite 4** — pre-built UI component library
- **ApexCharts** — for any chart/data visualization pages

## Architecture

### Routing
File-based: every `.astro` file in `src/pages/` maps directly to a URL. Subdirectories create nested routes (e.g. `src/pages/resources/blog.astro` → `/resources/blog`).

### Component layers
- `src/layouts/` — page wrappers (`Layout.astro` is the primary shell; `Trados.astro` for specific product pages). Import and wrap page content.
- `src/blocks/` — full-width marketing sections (Hero, Features, Pricing, Testimonials, FAQ, etc.). These are composited inside pages.
- `src/components/` — smaller reusable elements (Header, Footer, forms, dropdowns).

### Styles
Global CSS lives in `src/assets/styles/global.css` and imports Tailwind. Tailwind 4 is configured inline via CSS `@theme` directives rather than a separate config file.

### Client-side interactivity
Scripts in `src/assets/scripts/` are loaded with `<script>` tags in layouts or components:
- `theme.client.js` — dark mode toggle, persisted to `localStorage`
- `secondary-nav.js` — resolves active secondary nav items from current pathname
- Other scripts handle count-up animations, card filters, dropdown filters, and button magnet effects

Animations use Tailwind Motion's `intersect:motion-preset-*` classes with `intersect-once` — they trigger once when elements enter the viewport via IntersectionObserver.

### Data
Static data (e.g. partner lists) lives in `src/data/` as JS/TS modules and is imported directly into `.astro` files at build time.

### Theming
Components accept `data-theme` attributes to switch between light/dark visual variants. The theme toggle script sets `data-theme` on `<html>` and persists to localStorage.
