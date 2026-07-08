# Theming

Reference for the CSS theming system and how to port/maintain it on the production **.NET / Razor** site.

## Mental model

Every themed region declares **three seed colours**, and the whole palette is **derived from those seeds with `color-mix`**. You never hand-pick a "muted blue" or a "soft border" — you set the seeds, and the scale (`-muted`, `-soft`, `-softer`, `-strong`, …) is computed for you.

```
data-theme="…"  ──▶  --background-seed
                     --foreground-seed   ──▶  derivation block  ──▶  full token set
                     --accent-seed             (color-mix)            (bg/fg/accent + scale)
```

A region is any element with a `data-theme` or `data-card` attribute. Nesting is allowed: a `data-card` inside a `data-theme` re-seeds and recomputes the whole scale relative to the card's own background.

### Why it's built this way
- **One source of truth.** The mix ratios live in exactly one place (`_themes.css`). Adding a theme is ~3 lines.
- **Change a brand colour once.** Update `--color-primary` in `_colors.css` and every tint, border, hover and ring follows automatically.
- **Portable.** It's plain CSS custom properties + Tailwind utilities. No JS, no build-time colour computation.

## File map

Load order matters (see `global.css`). Relevant files:

| File | Role |
|------|------|
| `_colors.css` | **Brand palette.** Defines `--color-primary/secondary/tertiary` + a static tint ramp for each, and `--color-neutral`. Also the gradient utilities. |
| `_themes.css` | **The engine.** Semantic token registration (`@theme inline`), the derivation block, and per-theme seed definitions. |
| `_buttons.css` | `.btn-*` component classes (consume the tokens). |
| `_inputs.css` / `_hubspot.css` | Form control styling (consume the tokens). |
| `global.css` | Imports everything; sets `<html>` base `bg-background text-foreground`. |

## The two colour layers

### 1. Static brand ramp — `_colors.css`
Fixed, theme-independent tints of each brand colour, computed once. Example for primary:

```
--color-primary            base brand colour (oklch)
--color-primary-muted      80% primary + white
--color-primary-subtle     60% primary + white
--color-primary-soft       very light tint   (oklch relative)
--color-primary-softer     lighter tint
--color-primary-softest    faintest tint
--color-primary-strong     80% primary + black (darker)
--color-on-primary         text colour to sit on primary (white)
```

Same pattern for `secondary` and `tertiary`. These feed theme seeds and button hover/ring states (`hover:bg-primary-strong`, `focus-visible:ring-primary-soft`).

### 2. Semantic tokens — `_themes.css`
The tokens components actually use. Registered as Tailwind colours via `@theme inline`, so they become utilities: `bg-background`, `text-foreground-muted`, `border-accent-soft`, `ring-foreground-soft`, etc.

Three families, each with a scale:

```
--background   --background-soft/-softer/-softest   --background-strong
--foreground   --foreground-muted/-subtle/-soft/-softer/-softest   --foreground-strong
--accent       --accent-muted/-subtle/-soft/-softer/-softest   --accent-strong
--on-accent    --input
```

## Scale meaning (important — it's asymmetric)

The scale words mean **"mix this much of the seed into the background."** Direction differs per family, so read this table rather than guessing:

| Suffix | foreground / accent | background |
|--------|--------------------|-----------|
| *(base)* | full seed colour | full seed colour |
| `-muted` | 80% seed | — |
| `-subtle` | 50–60% seed | — |
| `-soft` | ~12% (fg) / 24% (accent) seed → faint tint | — |
| `-softer` | ~6% / 12% seed | — |
| `-softest` | ~3% / 6% seed → barely-there tint | ~1% |
| `-soft/-softer/-softest` (bg) | — | 10% / 4% / 1% foreground mixed in |
| `-strong` | pushed toward **black** (fg) / toward **foreground** (accent) | pushed toward **white** |

So for text/borders: `-muted` is the strongest tint, `-softest` the faintest. `-strong` goes the *other* way (toward black/white) and is used for high-contrast fills.

`--foreground-soft/-softer/-softest` are additionally multiplied by `--tint-boost` (default `1`, set to `3` on the saturated brand themes so faint tints stay visible on coloured backgrounds).

## Themes

Set via `data-theme="…"` on a section/wrapper. Available values:

| `data-theme` | Look |
|--------------|------|
| `default` | White background, dark text, primary accent. Cards get a faint tertiary tint. |
| `pale` | Very light neutral background. |
| `dots` / `dots-enhanced` | Light accent-tinted background with a dot pattern (`dots-enhanced` reacts to the cursor via JS). |
| `primary` / `secondary` / `tertiary` | Full brand-colour background, white text, `--tint-boost: 3`, brand gradient available. |
| `inverse` | Near-black background, white text. |

Each theme is just a seed block, e.g.:

```css
[data-theme='primary'] {
	--background-seed: var(--color-primary);
	--foreground-seed: var(--color-on-primary);
	--accent-seed: var(--color-on-primary);
	--tint-boost: 3;
}
```

### Cards
`data-card` marks a nested surface that re-seeds itself (e.g. a white card on a tinted section). Per-theme card overrides live in `_themes.css` (`[data-theme='primary'] [data-card] { … }`). A card automatically gets `bg-background text-foreground`.

## Using it in markup

- The base rule applies `bg-background text-foreground` to **every** `[data-theme]` and `[data-card]`, so it's now redundant to add `bg-background text-foreground` manually on those elements.
- Everything else is normal Tailwind utilities against the semantic tokens:

```html
<section data-theme="default">
  <p class="text-foreground-muted">…</p>
  <span class="border border-foreground-softer">…</span>
  <a class="text-accent hover:text-accent-muted">…</a>
  <div data-card>
    <button class="btn btn-primary">…</button>
  </div>
</section>
```

### Opacity variants vs scale tokens
Prefer the scale token (`bg-foreground-softest`) over an opacity variant (`bg-foreground/3`) — the scale token produces an **opaque** mix and respects `--tint-boost`. Reserve opacity variants (`/NN`) for cases that genuinely need transparency:
- translucent overlays over `backdrop-blur` (`bg-background/75`),
- faint gradient stops (`from-primary/5`).

Quick mapping if you find leftover opacity variants: `/80 → -muted`, `/50 → -subtle`, `/33 → -soft`, `/20 → -soft`, `/12 → -softer`, `/6 → -softest`.

## Component patterns

**Buttons** (`_buttons.css`): base `.btn` sets ring *width* (`focus-visible:ring-4`); each variant supplies the ring *colour* and hover:
```css
.btn-primary { @apply bg-primary text-white hover:bg-primary-strong
               focus-visible:bg-primary-strong focus-visible:ring-primary-soft; }
.btn-outline { @apply … hover:bg-foreground-softest focus-visible:ring-foreground-soft; }
```
> A `.btn` with no variant class has no ring colour — always pair them.

**Inputs / form controls** follow the same soft-palette format: `focus-visible:ring-*-soft`, hover backgrounds `bg-*-softest`, muted accents `text-accent-muted`.

## Porting to .NET / Razor

The system is plain CSS + Tailwind 4 utilities, so it transfers directly. Checklist:

1. **Copy the CSS files** and preserve the `global.css` import order (`_colors.css` before `_themes.css`; `_themes.css` after the component files it may reference).
2. **Tailwind 4** must be configured the same way — inline `@theme` directives, no `tailwind.config.js`. The `@theme inline` block in `_themes.css` is what turns tokens into `bg-*/text-*/border-*` utilities.
3. **Markup must carry the attributes.** Themes only activate where `data-theme` / `data-card` exist. This is the most common porting gap: a Razor partial missing `data-card`, or a different wrapper element, means no tokens resolve. Per project convention, when something works here but not there, suspect **markup differences (missing IDs/attributes, different element structure)** before script/CSS bugs.
4. **Don't re-add `bg-background text-foreground`** on themed elements — the base rule already applies them.
5. **Brand colours** live only in `_colors.css` (`--color-primary/secondary/tertiary`, `--color-neutral`). Match these to the production brand values and the rest derives.
6. **`--color-white` / `--color-black`** are Tailwind built-ins (not defined in `_colors.css`).

## Adding or tweaking

- **Change a brand colour:** edit `--color-primary` (etc.) in `_colors.css`. Everything downstream updates.
- **Add a theme:** add a `[data-theme='x']` block in `_themes.css` with `--background-seed`, `--foreground-seed`, `--accent-seed` (+ optional `--tint-boost`, `--gradient`, card overrides).
- **Tune the scale globally:** edit the `color-mix` percentages in the derivation block (`[data-theme], [data-card] { … }`). Values are intentionally hand-tuned for the brand palette — change one, view the `/blocks/tester` page, confirm it reads well.

## Known limitations

- **No dark mode.** The old `.dark` cascade was dropped (parked, not implemented). The seed model makes it straightforward to add later — define `.dark [data-theme='…']` seed overrides — but it does not exist today. The `theme-toggle` button in the header is `hidden`.
- **`-strong` direction differs by family** (fg→black, accent→foreground, background→white). Read the scale table above rather than assuming.
