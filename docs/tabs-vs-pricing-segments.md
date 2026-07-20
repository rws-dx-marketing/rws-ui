# Tabs block vs. Pricing segment picker

Both use the same **pill radio switcher** UI — a bordered rounded-full fieldset, a sliding gradient indicator, radio inputs styled as labels. That's not a coincidence: the Tabs block was *extracted from* the pricing segment picker. But they solve different problems and their requirements diverge sharply. This doc explains when to reach for each, and what each one needs to work — including notes for porting to the **.NET / Razor** site.

## TL;DR

| | **Tabs** (`Tabs.astro`) | **Pricing segments** (`PricingContent.astro`) |
|---|---|---|
| Purpose | Generic content switcher | One bespoke pricing page |
| Reusable? | Yes — drop in anywhere, multiple per page | No — single instance, data baked in |
| Content model | **Slots** — one block per tab | **One dataset, tagged & filtered** |
| Switching swaps… | The whole panel (slides off/in) | Which nodes are *visible* (morph/slide) |
| Extra state | None | Currency, billing, cadence, popular/recommended |
| URL params | None | `?segment` `?currency` `?popular` `?recommended` |
| Config surface | Props (`tabs`, `name`, `theme`…) | `lockSegment` only; everything else internal |
| Script | `tabs.js` (~100 lines) | `pricing-content.js` (~216 lines) |

## The core difference: slots vs. filtered dataset

This is the one thing to internalise. Everything else follows from it.

**Tabs swaps *panels*.** Each tab is a named slot. The consuming page authors completely independent content per tab — they can be different block types entirely (a `Split`, an `Accordions`, a `Features`). The block knows nothing about what's inside; it just shows one panel and hides the rest.

```astro
<Tabs name="about" tabs={[{ key: 'split', label: 'Who we are' }, …]}>
  <Fragment slot="split"><Split /></Fragment>
  <Fragment slot="accordions"><Accordions /></Fragment>
</Tabs>
```

At runtime `applyTab()` just toggles `panel.hidden` and slides the whole panel across. Only one panel exists per view; there is no shared data.

**Pricing filters *one* dataset.** There are no per-segment slots. A single set of cards and table rows is rendered once, each tagged with the segments it belongs to:

```astro
<div data-product="team" data-segment data-segments="teams businesses">…</div>
```

Switching segment just changes `data-active-segment` on the root; CSS (`_pricing-content.css`) hides everything that doesn't match:

```css
[data-pricing][data-active-segment='teams'] [data-segment]:not([data-segments~='teams']) {
  display: none !important;
}
```

The consequence that matters: **a product can live in several segments** (`team` and `business` appear for both LSPs and businesses, with *different* descriptions/features per segment). When you switch, those shared cards don't slide out and back — they **morph** in place (`view-transition-class: card-morph`), while single-segment cards slide (`card-move`). Tabs has no equivalent; a panel is wholly present or wholly gone.

## What each one requires

### Tabs — lightweight, portable

- **A unique `name` per instance.** All view-transition names are namespaced by it. Two tab groups with the same `name` will fight over the same VT snapshots.
- **Slot content keyed by `t.key`.** That's the whole contract.
- **`tabs.js` handles multiple groups.** Because every named element on the page is pulled into any view transition, `otherNamedElements()` blanks the VT names of *other* tab groups before a transition so they don't reflow. This is the only cross-instance coordination it needs.
- No CSS beyond `_tabs.css` (the slide keyframes + VT plumbing). No URL state. No data.

If you want a segmented switcher for arbitrary content, this is the one to port.

### Pricing — heavy, self-contained, single-purpose

- **The entire data model lives in the component** (`products`, `matrix`, `segments`). It is not passed in and not reusable. Editing pricing = editing the `.astro` file.
- **Every filterable node needs `data-segment` + `data-segments="…"`** tokens, and the hide-CSS must be present globally. Miss a token and a node leaks across segments (or vanishes).
- **The comparison table's column grid is keyed off the active segment** via Tailwind `group-data-[active-segment=…]:grid-cols-…` — the column count changes (2 / 3 / 4 products) with the segment. This is bespoke to the table's markup.
- **Coordinated satellite elements:** subtitles (`[data-segment-subtitle]`), the comparison subtitle, the "popular" badge and "recommended" highlight all update on segment change.
- **Extra independent state machines** that Tabs has nothing analogous to:
  - **currency** (GBP/USD/EUR, per-card popover, persisted to URL),
  - **billing** (monthly vs annual contract),
  - **cadence** (yearly-upfront vs monthly instalments on an annual contract),
  - **popular / recommended** targeting via `?popular=` / `?recommended=` comma-lists mapped to segment order.
- **`lockSegment` prop** renders a single-segment page (picker hidden, only that segment's products emitted). The script tolerates the missing radios by falling back to `data-locked-*` attributes on the root.

> **Note:** this subsection describes the *original* coupling. Much of it is what the [Proposed refactor](#proposed-refactor-decoupling-cards-from-segments) below removes — read the two together.

## What they genuinely share

Worth knowing so a fix in one can inform the other:

- **The indicator pill.** Both position a sliding pill with JS (`positionIndicator`), measuring the active label's offset/size, and both suppress its transition on first paint (set `transition:none`, position, re-enable next frame) so it doesn't animate in from `0×0`.
- **Radio interaction pattern.** `click` (preventDefault + drive the transition) plus `keyup` (sync on keyboard nav), reading/writing a `data-active-*` attribute on the root.
- **View Transitions.** Directional `forward`/`back` animation chosen by comparing indices in the declared order, all guarded by `prefers-reduced-motion` and a `startViewTransition` feature check, with a non-VT fallback that just applies state instantly.

## Choosing between them

- **Reach for Tabs** when you have a handful of distinct, self-contained content blocks and you want the user to switch between them. Different content, one at a time, no shared data.
- **Reach for the pricing pattern** when you're showing *the same set of things* filtered/re-annotated by an audience or dimension, especially if items overlap between filter values or there's additional cross-cutting state (price toggles, currency, etc.).
- If you find yourself wanting Tabs but with overlapping items that should persist across switches, or with URL-driven state — that's a signal you actually want the filtered-dataset approach, not more slots.

## Proposed refactor: decoupling cards from segments

The backend team pushed back on making the segment control a bespoke "tabs" component: the Store can exist *without* tabs, so baking pricing knowledge into the tab logic complicates both the backend and the CMS. Their position — the tabs should only *organize and display* content; the cards should own their own data and behaviour, whether or not they sit inside tabs. The only genuine cross-tab concern is selected currency, which JS already handles.

This branch implements that split. The **slots-vs-filtered-dataset** distinction above is unchanged — cards still all render in one container, tagged with `data-segments`, so shared products (`team`, `business`) still **morph** between segments. What changes is *who owns what*: everything pricing-specific moves off the tab control and onto the card or into filtered content.

| Concern | Original (coupled) | Refactored (decoupled) |
|---|---|---|
| Which card is "popular" | `data-popular` on the segment radio → JS maps segment → product | `data-popular-in="teams"` on the **card** (segment-scoped token, mirrors `data-segments`) |
| Segment subtitle | `data-subtitle` on the radio → JS writes `[data-segment-subtitle]` text | Per-segment `<p data-segment data-segments="…">` content nodes, shown/hidden by the existing hide-CSS |
| Comparison heading | `data-label` on the radio → JS interpolates the string | Per-segment content nodes, same as the subtitle |
| Locked pages | `data-locked-*` attributes on the root as a radio-less fallback | No fallback needed — the one segment's content nodes just render and the CSS shows them |

Why `data-popular-in` is a *token list*, not a boolean: the morphing cards are popular in **different** segments. `team` is popular in `teams` only; `business` is popular in `businesses` only — yet both are present in both segments. A plain flag can't express "popular here but not there," so the card carries the same shape as `data-segments`.

Script fallout (`pricing-content.js`): `segMeta` / `segmentInput` and the `data-locked-*` plumbing are gone; `applySegment` no longer swaps subtitle/heading text; `applyPopular` resolves the default via `[data-popular-in~="<segment>"]`. The `?popular=` / `?recommended=` overrides still work, now falling back to the card's declared default instead of the segment's.

Net effect: the tab control knows nothing about pricing. Standalone cards drop into a generic container with no logical dependency between them — exactly what the backend team asked for. The one deliberate tradeoff if they instead go fully slot-based (a card per tab): the cross-segment morph is lost and duplicated products must be authored per tab. Keeping the single-container/filtered-dataset model (as this branch does) preserves the morph.

## Porting notes (.NET / Razor)

Per repo convention, when these work here but not on the Razor site the cause is almost always **markup**, not the scripts:

- **Tabs:** confirm the unique `name` is emitted into every `view-transition-name` inline style, the `data-tab-order` list matches the rendered panels, and each panel carries `data-tab-panel` + `data-tab-key`.
- **Pricing:** the fragile bits are the `data-segments` tokens on every card *and* table cell, the presence of the global hide-CSS, and the `group-data-[active-segment=…]` grid-column classes on the table header and rows. The script also depends on `data-product`, `data-popular-in` (segment-scoped popular flag, post-refactor), `data-price` (+ its `data-*-gbp` attributes), `data-billing`, `data-currency-option`, and `data-cadence-option` hooks — a renamed or dropped attribute silently disables that feature. The per-segment subtitle/heading are now plain `data-segment` content nodes, so they need the hide-CSS present, not a script hook.
