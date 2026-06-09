export default function headerScroll() {
	if (typeof window === 'undefined') return

	const root = document.documentElement
	const header = document.getElementById('site-header')
	if (!header) return

	let lastScrollY = window.scrollY
	let headerHidden = false
	let downAccumulator = 0
	let peakScrollY = 0
	const HIDE_THRESHOLD = 0
	const HIDE_AFTER = 20
	const SHOW_AFTER = 80

	const hideHeader = () => {
		if (headerHidden) return
		headerHidden = true
		downAccumulator = 0
		peakScrollY = window.scrollY
		root.style.setProperty('--header-top', `-${header.offsetHeight}px`)
		root.style.setProperty('--secondary-nav-top', '0px')
	}
	const showHeader = () => {
		if (!headerHidden) return
		headerHidden = false
		root.style.setProperty('--header-top', '0px')
		root.style.setProperty('--secondary-nav-top', `${header.offsetHeight}px`)
	}
	const syncOffsets = () => {
		if (headerHidden) {
			root.style.setProperty('--header-top', `-${header.offsetHeight}px`)
			root.style.setProperty('--secondary-nav-top', '0px')
		} else {
			root.style.setProperty('--header-top', '0px')
			root.style.setProperty('--secondary-nav-top', `${header.offsetHeight}px`)
		}
	}

	// If the page is loaded/restored mid-scroll, hide immediately without transition
	// to avoid a flash of the header before the IO fires.
	if (window.scrollY > HIDE_THRESHOLD) {
		const noTransition = document.createElement('style')
		noTransition.textContent = '*{transition:none!important}'
		document.head.appendChild(noTransition)
		hideHeader()
		requestAnimationFrame(() => requestAnimationFrame(() => noTransition.remove()))
	}

	// IO handles the reliable initial hide (sentinel exits viewport top) and
	// the show when the user scrolls all the way back to the top.
	const sentinel = document.createElement('div')
	sentinel.setAttribute('aria-hidden', 'true')
	sentinel.style.cssText = `position:absolute;top:${HIDE_THRESHOLD}px;height:1px;left:0;right:0;pointer-events:none;`
	document.body.insertBefore(sentinel, document.body.firstChild)

	new IntersectionObserver(
		([entry]) => {
			if (root.dataset.mobileMenuOpen === 'true') return
			if (entry.isIntersecting) {
				showHeader()
			} else if (entry.boundingClientRect.top < 0) {
				hideHeader()
			}
		},
		{ threshold: 0 },
	).observe(sentinel)

	// Scroll event handles two cases the IO cannot:
	// 1. Showing mid-page when the user scrolls up SHOW_AFTER px from their peak.
	// 2. Re-hiding after a mid-page show — the IO won't fire again because the
	//    sentinel's intersection state hasn't changed (still above the viewport).
	window.addEventListener(
		'scroll',
		() => {
			if (root.dataset.mobileMenuOpen === 'true') return

			const scrollY = window.scrollY
			const delta = scrollY - lastScrollY
			lastScrollY = scrollY

			if (!headerHidden) {
				if (scrollY >= HIDE_THRESHOLD && delta > 0) {
					downAccumulator += delta
					if (downAccumulator >= HIDE_AFTER) hideHeader()
				} else {
					downAccumulator = 0
				}
			} else {
				downAccumulator = 0
				if (scrollY > peakScrollY) peakScrollY = scrollY
				if (scrollY <= peakScrollY - SHOW_AFTER) showHeader()
			}
		},
		{ passive: true },
	)

	window.addEventListener('load', syncOffsets)
	window.addEventListener('resize', syncOffsets)

	if ('ResizeObserver' in window) {
		new ResizeObserver(syncOffsets).observe(header)
	}
}
