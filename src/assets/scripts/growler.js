// Dismissal is keyed per growler id so each page's growler is remembered
// separately. The pre-paint hide on load lives inline in Growler.astro.
export default function growler() {
	if (typeof window === 'undefined') return

	const section = document.getElementById('growler')
	if (!section) return

	const key = `rws:growler:${section.dataset.growlerId}`

	section.querySelector('[data-growler-close]')?.addEventListener('click', () => {
		localStorage.setItem(key, 'dismissed')
		section.hidden = true
	})

	// ---------------------------------------------------------------------------
	// PROTOTYPE ONLY — do not port to production.
	// Binds the "Show growler" checkbox in the PreviewSettings cog so testers can
	// bring a dismissed growler back without clearing localStorage.
	// ---------------------------------------------------------------------------
	const toggle = document.querySelector('[data-growler-toggle] input')
	if (!toggle) return

	toggle.checked = !section.hidden

	toggle.addEventListener('change', () => {
		if (toggle.checked) localStorage.removeItem(key)
		else localStorage.setItem(key, 'dismissed')
		section.hidden = !toggle.checked
	})

	section.querySelector('[data-growler-close]')?.addEventListener('click', () => {
		toggle.checked = false
	})
}
