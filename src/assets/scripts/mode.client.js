// Dark mode toggle (light/dark, distinct from data-theme colour themes). The <html> class is applied before paint by the inline script in
// Layout.astro; this only handles the buttons (one in the desktop header, one in the
// mobile menu), the theme-color meta, and other tabs changing the preference. A page
// rendered with data-mode has forced its mode server-side, so the toggles are hidden
// there and the stored preference is untouched.
if (typeof window !== 'undefined') {
	const root = document.documentElement
	const buttons = document.querySelectorAll('[data-mode-toggle]')
	const themeColor = document.querySelector('meta[name="theme-color"]')

	const sync = () => {
		const dark = root.classList.contains('dark')
		buttons.forEach((button) => button.setAttribute('aria-pressed', String(dark)))
		// Read the page colour rather than hardcoding a hex so the browser chrome follows --ink.
		if (themeColor) themeColor.content = getComputedStyle(root).backgroundColor
	}

	// Snap rather than transition: only some elements have transitions declared, so
	// letting them run leaves buttons fading while headings and images jump.
	const snap = (apply) => {
		root.classList.add('mode-switching')
		apply()
		sync()
		// Two frames: the first commits the new colours, the second lets transitions resume.
		requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('mode-switching')))
	}

	sync()

	if (root.dataset.mode) {
		buttons.forEach((button) => (button.hidden = true))
	} else {
		buttons.forEach((button) => {
			button.addEventListener('click', () => {
				snap(() => localStorage.setItem('rws:mode', root.classList.toggle('dark') ? 'dark' : 'light'))
			})
		})

		window.addEventListener('storage', (event) => {
			if (event.key === 'rws:mode') snap(() => root.classList.toggle('dark', event.newValue === 'dark'))
		})
	}
}
