// Source of truth for the Figma variable export on /tokens.
//
// Anything that is a literal in CSS (Tailwind defaults + our @theme overrides)
// is listed here. Brand hexes are the resolved values from the style guide.
// Theme (semantic) colours are derived at runtime by the cascade in
// _themes.css, so /tokens resolves those in the browser rather than here.

import { color, px, seconds, number, string, fontFamily, aliasTo, remToPx } from '../../utils/dtcg'
import { spacing as sectionSpacing } from '../../utils/spacing'
import { headingSize } from '../../utils/heading-size'

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const ramp = (hexes) => ({
	softest: hexes[0],
	softer: hexes[1],
	soft: hexes[2],
	subtle: hexes[3],
	muted: hexes[4],
	DEFAULT: hexes[5],
	strong: hexes[6],
})

export const palette = [
	{ key: 'neutral', label: 'Neutral', brandName: 'Neutral', css: '--color-neutral', hexes: ramp(['#f7f7f7', '#efefef', '#dfdfdf', '#6a6867', '#3f3d3b', '#181614', '#060605']) },
	{ key: 'primary', label: 'Primary', brandName: 'Hidcote Blue', css: '--color-primary', hexes: ramp(['#faf9ff', '#f0eeff', '#e2ddff', '#af9eff', '#977cff', '#8353fd', '#603bbc']) },
	{ key: 'secondary', label: 'Secondary', brandName: 'Hillier Pink', css: '--color-secondary', hexes: ramp(['#fff7f8', '#ffe9ea', '#ffd2d6', '#fa8795', '#f15875', '#e60054', '#aa013c']) },
	{ key: 'tertiary', label: 'Tertiary', brandName: 'Galaxy Purple', css: '--color-tertiary', hexes: ramp(['#fbf9ff', '#f4edff', '#e9ddfe', '#856dab', '#603e8d', '#3e016f', '#2b0050']) },
	// Named after the brand guideline colour rather than its CSS slot: it is an
	// accent, never a section theme, so the ordinal name would mislead in Figma.
	{ key: 'saffron', label: 'Saffron', brandName: 'Saffron', css: '--color-quaternary', hexes: ramp(['#fffbeb', '#fff3c9', '#ffeba3', '#ffe27d', '#ffd74a', '#ffc700', '#e6b300']) },
]

export const rampOrder = ['softest', 'softer', 'soft', 'subtle', 'muted', 'DEFAULT', 'strong']

export const base = [
	{ key: 'white', hex: '#ffffff', css: '--color-white' },
	{ key: 'black', hex: '#000000', css: '--color-black' },
]

// Tailwind palette colours that carry meaning in the markup. The stray gray /
// emerald / blue utilities are mistakes and deliberately not tokenised.
export const status = [
	{ key: 'success', hex: '#00c950', css: '--color-green-500' },
	{ key: 'error', hex: '#fb2c36', css: '--color-red-500' },
]

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const fonts = [
	{ key: 'sans', family: 'articulat-cf', figma: 'Articulat CF', css: '--font-sans', note: 'Adobe Fonts' },
	{ key: 'serif', family: 'Noto Serif', figma: 'Noto Serif', css: '--font-serif', note: 'Google Fonts' },
	{ key: 'cursive', family: 'Caveat', figma: 'Caveat', css: '--font-cursive', note: 'Google Fonts' },
]

export const weights = [
	{ key: 'thin', weight: 100 },
	{ key: 'extralight', weight: 200 },
	{ key: 'light', weight: 300 },
	{ key: 'normal', weight: 400 },
	{ key: 'medium', weight: 500, note: 'Body default' },
	{ key: 'semibold', weight: 600, note: 'Emphasis' },
	{ key: 'bold', weight: 700, note: 'Headings' },
	{ key: 'extrabold', weight: 800 },
]

// Size + line-height pairs. Line-height is Tailwind's default for the size;
// 2xs is ours and follows the same 4px step (xs is 12/16).
export const textScale = [
	{ key: '2xs', rem: '0.625rem', lineHeight: '0.875rem', note: 'Custom' },
	{ key: 'xs', rem: '0.75rem', lineHeight: '1rem' },
	{ key: 'sm', rem: '0.875rem', lineHeight: '1.25rem' },
	{ key: 'base', rem: '1rem', lineHeight: '1.5rem' },
	{ key: 'lg', rem: '1.125rem', lineHeight: '1.75rem' },
	{ key: 'xl', rem: '1.25rem', lineHeight: '1.75rem' },
	{ key: '2xl', rem: '1.5rem', lineHeight: '2rem' },
	{ key: '3xl', rem: '1.875rem', lineHeight: '2.25rem' },
	{ key: '4xl', rem: '2.25rem', lineHeight: '2.5rem' },
	{ key: '5xl', rem: '3rem', lineHeight: '3rem' },
	{ key: '6xl', rem: '3.75rem', lineHeight: '3.75rem' },
	{ key: '7xl', rem: '4.5rem', lineHeight: '4.5rem' },
	{ key: '8xl', rem: '6rem', lineHeight: '6rem' },
	{ key: '9xl', rem: '8rem', lineHeight: '8rem' },
]

// Percent of font size, matching Figma's letter-spacing unit.
export const tracking = [
	{ key: 'tighter', em: '-0.02em', note: 'Custom (Tailwind -0.05em)' },
	{ key: 'tight', em: '-0.01em', note: 'Custom (Tailwind -0.025em)' },
	{ key: 'normal', em: '0em' },
	{ key: 'wide', em: '0.025em' },
	{ key: 'wider', em: '0.05em' },
	{ key: 'widest', em: '0.1em' },
]

// Multipliers, exported as percent for Figma's line-height field.
export const leading = [
	{ key: 'none', value: 1 },
	{ key: 'tight', value: 1.25 },
	{ key: 'snug', value: 1.375 },
	{ key: 'normal', value: 1.5 },
	{ key: 'relaxed', value: 1.625 },
	{ key: 'loose', value: 2 },
]

// Whole scale is overridden in global.css; `base` is the bare `rounded` utility.
export const radius = [
	{ key: '0', rem: '0rem' },
	{ key: 'xs', rem: '0.25rem' },
	{ key: 'sm', rem: '0.375rem' },
	{ key: 'base', rem: '0.5rem' },
	{ key: 'md', rem: '0.75rem' },
	{ key: 'lg', rem: '1rem' },
	{ key: 'xl', rem: '1.25rem' },
	{ key: '2xl', rem: '1.5rem' },
	{ key: '3xl', rem: '1.75rem' },
	{ key: '4xl', rem: '2rem' },
	{ key: 'full', rem: null, pxValue: 9999 },
]

// Tailwind's spacing multiplier is 0.25rem; these are the named steps in use.
export const spacingSteps = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]

export const breakpoints = [
	{ key: 'sm', rem: '40rem' },
	{ key: 'md', rem: '48rem' },
	{ key: 'lg', rem: '64rem' },
	{ key: 'xl', rem: '80rem' },
	{ key: '2xl', rem: '96rem' },
]

export const containers = [
	{ key: '3xs', rem: '16rem' },
	{ key: '2xs', rem: '18rem' },
	{ key: 'xs', rem: '20rem' },
	{ key: 'sm', rem: '24rem' },
	{ key: 'md', rem: '28rem' },
	{ key: 'lg', rem: '32rem' },
	{ key: 'xl', rem: '36rem' },
	{ key: '2xl', rem: '42rem' },
	{ key: '3xl', rem: '48rem' },
	{ key: '4xl', rem: '56rem' },
	{ key: '5xl', rem: '64rem' },
	{ key: '6xl', rem: '72rem' },
	{ key: '7xl', rem: '80rem' },
]

export const durations = [
	{ key: 'default', ms: 400, note: 'Custom (Tailwind 150ms)' },
	{ key: 'fast', ms: 250, note: 'Transform on magnetic buttons' },
]

export const easings = [
	{ key: 'default', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
	{ key: 'in', value: 'cubic-bezier(0.4, 0, 1, 1)' },
	{ key: 'out', value: 'cubic-bezier(0, 0, 0.2, 1)' },
]

// Reference only — Figma variables have no shadow type, so these become effect
// styles by hand.
export const shadows = [
	{ key: 'xs', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
	{ key: 'sm', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
	{ key: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
	{ key: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
]

// ---------------------------------------------------------------------------
// Theme (semantic) — resolved in the browser
// ---------------------------------------------------------------------------

export const themeModes = ['default', 'pale', 'dots', 'primary', 'secondary', 'tertiary']

export const semantic = [
	{ group: 'background', keys: ['DEFAULT', 'softest', 'softer', 'soft', 'strong'] },
	{ group: 'foreground', keys: ['DEFAULT', 'softest', 'softer', 'soft', 'subtle', 'muted', 'strong'] },
	{ group: 'accent', keys: ['DEFAULT', 'softest', 'softer', 'soft', 'subtle', 'muted', 'strong'] },
	{ group: 'on-accent', keys: ['DEFAULT'] },
	{ group: 'border', keys: ['DEFAULT'] },
	{ group: 'input', keys: ['DEFAULT'] },
]

// [data-card] re-seeds inside a theme; only the surface-level values differ
// enough to need their own variables.
export const cardSemantic = [{ group: 'card', keys: ['background', 'border', 'input'] }]

export const cssVar = (group, key) => {
	if (group === 'card') return key === 'background' ? '--background' : `--${key}`
	return key === 'DEFAULT' ? `--${group}` : `--${group}-${key}`
}

// ---------------------------------------------------------------------------
// Breakpoint modes — responsive scales from utils, parsed rather than restated
// ---------------------------------------------------------------------------

export const breakpointModes = ['base', 'md', 'lg', 'xl']

// 'pt-2 md:pt-4 lg:pt-6' → { base: '2', md: '4', lg: '6' }, then cascaded so
// every mode has a value.
const parseResponsive = (classes, prefix) => {
	const found = {}
	for (const cls of classes.split(/\s+/)) {
		const m = cls.match(new RegExp(`^(?:(sm|md|lg|xl|2xl):)?${prefix}-(.+)$`))
		if (m) found[m[1] || 'base'] = m[2]
	}
	const out = {}
	let last = found.base
	for (const bp of ['base', 'sm', 'md', 'lg', 'xl']) {
		if (found[bp] !== undefined) last = found[bp]
		out[bp] = last
	}
	return out
}

const textPx = Object.fromEntries(textScale.map((t) => [t.key, remToPx(t.rem)]))
const lineHeightPx = Object.fromEntries(textScale.map((t) => [t.key, remToPx(t.lineHeight)]))

export const sectionPadding = Object.entries(sectionSpacing).map(([key, { top }]) => {
	const steps = parseResponsive(top, 'pt')
	return {
		key,
		step: Object.fromEntries(breakpointModes.map((bp) => [bp, steps[bp]])),
		px: Object.fromEntries(breakpointModes.map((bp) => [bp, Number(steps[bp]) * 4])),
	}
})

export const headingSizes = Object.entries(headingSize).map(([key, classes]) => {
	const sizes = parseResponsive(classes, 'text')
	return {
		key,
		size: Object.fromEntries(breakpointModes.map((bp) => [bp, sizes[bp]])),
		px: Object.fromEntries(breakpointModes.map((bp) => [bp, textPx[sizes[bp]]])),
		lineHeight: Object.fromEntries(breakpointModes.map((bp) => [bp, lineHeightPx[sizes[bp]]])),
	}
})

// Section.astro container gutter: px-8 lg:px-12
export const gutterStep = { base: '8', md: '8', lg: '12', xl: '12' }
export const gutter = Object.fromEntries(Object.entries(gutterStep).map(([bp, step]) => [bp, Number(step) * 4]))

// ---------------------------------------------------------------------------
// DTCG files
// ---------------------------------------------------------------------------

const groupOf = (entries) => Object.fromEntries(entries)

// Figma collection names the cross-collection aliases resolve against.
export const collectionNames = { primitives: 'Primitives', palette: 'Palette', theme: 'Theme', breakpoint: 'Breakpoint' }

export const primitivesFile = () => ({
	font: {
		family: groupOf(fonts.map((f) => [f.key, fontFamily(f.figma, f.css)])),
		// Figma's importer has no fontWeight type; a number binds to the weight field.
		weight: groupOf(weights.map((w) => [w.key, number(w.weight, w.note)])),
		size: groupOf(textScale.map((t) => [t.key, px(remToPx(t.rem), `--text-${t.key}`)])),
		lineHeight: groupOf(textScale.filter((t) => t.lineHeight).map((t) => [t.key, px(remToPx(t.lineHeight), `Line-height for text-${t.key}`)])),
		tracking: groupOf(tracking.map((t) => [t.key, number(parseFloat(t.em) * 100, `${t.em} as % of font size`)])),
		leading: groupOf(leading.map((l) => [l.key, number(l.value * 100, `${l.value}× as %`)])),
	},
	spacing: groupOf(spacingSteps.map((s) => [String(s), px(s * 4, `spacing-${s}`)])),
	radius: groupOf(radius.map((r) => [r.key, px(r.rem ? remToPx(r.rem) : r.pxValue, r.key === 'base' ? 'rounded' : `rounded-${r.key}`)])),
	breakpoint: groupOf(breakpoints.map((b) => [b.key, px(remToPx(b.rem))])),
	container: groupOf(containers.map((c) => [c.key, px(remToPx(c.rem))])),
	duration: groupOf(durations.map((d) => [d.key, seconds(d.ms, d.note)])),
	easing: groupOf(easings.map((e) => [e.key, string(e.value)])),
})

export const paletteFile = () => ({
	...groupOf(palette.map((b) => [b.key, groupOf(rampOrder.map((step) => [step, color(b.hexes[step], step === 'DEFAULT' ? `${b.brandName} · ${b.css}` : `${b.css}-${step}`)]))])),
	...groupOf(base.map((b) => [b.key, color(b.hex, b.css)])),
	...groupOf(status.map((s) => [s.key, color(s.hex, s.css)])),
})

const spacingAlias = (step, description) => aliasTo(px(Number(step) * 4, description), collectionNames.primitives, `spacing/${step}`)

export const breakpointFile = (bp) => ({
	section: {
		padding: groupOf(sectionPadding.map((s) => [s.key, spacingAlias(s.step[bp], `pt-${s.step[bp]}`)])),
		gutter: spacingAlias(gutterStep[bp], `px-${gutterStep[bp]}`),
	},
	// Heading sizes alias the primitive size + line-height pairs rather than
	// restating them, so a change to the type scale flows through.
	heading: {
		size: groupOf(headingSizes.map((h) => [h.key, aliasTo(px(h.px[bp], `text-${h.size[bp]}`), collectionNames.primitives, `font/size/${h.size[bp]}`)])),
		lineHeight: groupOf(headingSizes.map((h) => [h.key, aliasTo(px(h.lineHeight[bp], `Line-height for text-${h.size[bp]}`), collectionNames.primitives, `font/lineHeight/${h.size[bp]}`)])),
	},
})
