export default function headerScroll() {
	if (typeof window === 'undefined') return

	const root = document.documentElement
	const header = document.getElementById('site-header')
	if (!header) return

	let lastScrollY = 0
	let headerHidden = false
	const HIDE_THRESHOLD = 100
	const SCROLL_DELTA = 8

	const hideHeader = () => {
		headerHidden = true
		root.style.setProperty('--header-top', `-${header.offsetHeight}px`)
		root.style.setProperty('--secondary-nav-top', '0px')
	}
	const showHeader = () => {
		headerHidden = false
		root.style.setProperty('--header-top', '0px')
		root.style.setProperty('--secondary-nav-top', `${header.offsetHeight}px`)
	}
	const initStickyOffsets = () => {
		root.style.setProperty('--header-top', '0px')
		root.style.setProperty('--secondary-nav-top', `${header.offsetHeight}px`)
	}

	window.addEventListener('scroll', () => {
		const scrollY = window.scrollY
		const delta = scrollY - lastScrollY
		if (scrollY < HIDE_THRESHOLD) {
			if (headerHidden) showHeader()
		} else if (delta > SCROLL_DELTA && !headerHidden) {
			hideHeader()
		} else if (delta < -SCROLL_DELTA && headerHidden) {
			showHeader()
		}
		lastScrollY = scrollY
	}, { passive: true })

	window.addEventListener('load', initStickyOffsets)
	window.addEventListener('resize', initStickyOffsets)

	if ('ResizeObserver' in window) {
		const resizeObserver = new ResizeObserver(initStickyOffsets)
		resizeObserver.observe(header)
	}
}
