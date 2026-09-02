export default function anchorPolyfill() {
	if (typeof window === 'undefined') return
	// Native anchor positioning: Chromium 125+ / Safari 26+. iOS 18 is the target that needs this.
	if ('anchorName' in document.documentElement.style) return

	import('../vendor/css-anchor-positioning').then(({ default: polyfill }) =>
		polyfill({
			// Leave `useAnimationFrame` off — one continuous rAF loop per anchored declaration
			// makes WebKit lag. The default listeners already track the sticky bar's transition.
			// Never wrap `position-area` targets: wrapping breaks a popover's promotion to the
			// top layer, and every `.dropdown` is a popover. Compute insets on the target instead.
			positionAreaContainingBlock: false,
		}),
	)
}

// The polyfill is vendored (with local fixes) at src/assets/vendor/css-anchor-positioning.js;
// see its header. To re-check after changes there, here, or in the dropdown markup, use an
// engine without native support — Chromium 124 is the only one that runs locally on macOS 26:
//   npx @puppeteer/browsers install chrome@124
//   pnpm build && pnpm preview --port 4399
// then drive it via Playwright's executablePath: an open dropdown must stay glued to its anchor
// through scroll and the header's show/hide transition. Manual WebKit check: untick
// Develop > Feature Flags > CSS Anchor Positioning in Safari.
