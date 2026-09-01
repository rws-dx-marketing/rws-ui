// Drives components/VariantPicker.astro on the resource demo pages.
//
// The page renders one copy of the resource per variant inside
// `[data-variant-preview]`; this hides all but the selected one. Same shape as
// theme-picker.js, minus the "all" option — the variants are alternatives to
// each other, so stacking them would just read as two pages.

export default function variantPicker() {
	const picker = document.querySelector('[data-variant-picker]')
	const previews = [...document.querySelectorAll('[data-variant-preview] > [data-variant]')]
	if (!picker || !previews.length) return

	const inputs = [...picker.querySelectorAll('input[type="radio"]')]
	if (!inputs.length) return

	const apply = (value) => {
		previews.forEach((preview) => {
			preview.hidden = preview.dataset.variant !== value
		})

		// Revealing a preview un-hides measurement-driven UI that measured 0×0 while
		// hidden. Resize is the re-measure hook those scripts already listen for.
		dispatchEvent(new Event('resize'))
	}

	// `?variant=` wins over the checked default, so a page can be linked straight
	// to one variant — how the gated form's redirect lands on the open version.
	const requested = new URLSearchParams(location.search).get('variant')
	const initial = inputs.find((input) => input.value === requested) ?? inputs.find((input) => input.checked) ?? inputs[0]
	initial.checked = true

	apply(initial.value)

	picker.addEventListener('change', (event) => {
		const input = event.target.closest('input[type="radio"]')
		if (input) apply(input.value)
	})
}
