// Drives components/ThemePicker.astro on the block reference pages.
//
// The page renders one copy of the block per theme inside `[data-theme-preview]`;
// this hides all but the selected one ('all' shows the full stack).

// Divider drawn between stacked previews in single-theme mode. Has to stay a bare
// literal — it's the only occurrence in the project, so Tailwind's source scan of
// this file is what generates the utility.
const DIVIDER = 'border-t-64'

export default function themePicker() {
	const picker = document.querySelector('[data-theme-picker]')
	const previews = [...document.querySelectorAll('[data-theme-preview] > [data-theme]')]
	if (!picker || !previews.length) return

	const inputs = [...picker.querySelectorAll('input[type="radio"]')]
	if (!inputs.length) return

	const apply = (value) => {
		const single = value !== 'all'

		previews.forEach((preview) => {
			preview.hidden = single && preview.dataset.theme !== value
		})

		// Rules between the previews, but only in single-theme mode — with every
		// theme shown the background changes are separation enough. Done here rather
		// than with `divide-y` on the wrapper because the hidden previews are still
		// children: `:not(:last-child)` would leave a stray rule under the last
		// *visible* one whenever the selected theme isn't the last in the stack.
		previews.filter((preview) => !preview.hidden).forEach((preview, i) => preview.classList.toggle(DIVIDER, single && i > 0))

		// Revealing a preview un-hides measurement-driven UI (the Tabs pill, the
		// events segment indicator) that measured 0×0 while hidden. Resize is the
		// re-measure hook those scripts already listen for.
		dispatchEvent(new Event('resize'))
	}

	apply(inputs.find((input) => input.checked)?.value ?? inputs[0].value)

	picker.addEventListener('change', (event) => {
		const input = event.target.closest('input[type="radio"]')
		if (input) apply(input.value)
	})
}
