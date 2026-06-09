export default function headerScroll() {
	if (typeof window === 'undefined') return

	const root = document.documentElement
	const header = document.getElementById('site-header')
	if (!header) return

	let lastScrollY = 0
	let headerHidden = false
	let isTouching = false
	let touchEndTime = 0
	let lastTouchY = 0
	const HIDE_THRESHOLD = 100
	const SCROLL_DELTA = 8
	const TOUCH_DELTA = 5
	const MOMENTUM_GRACE_MS = 400

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

	const applyDirection = (scrollY, delta) => {
		if (scrollY < HIDE_THRESHOLD) {
			if (headerHidden) showHeader()
		} else if (delta > 0 && !headerHidden) {
			hideHeader()
		} else if (delta < 0 && headerHidden) {
			showHeader()
		}
	}

	// Touch: use finger movement delta — fires only during active drag, never during momentum
	window.addEventListener('touchstart', (e) => {
		isTouching = true
		lastTouchY = e.touches[0].clientY
	}, { passive: true })

	window.addEventListener('touchend', () => {
		isTouching = false
		touchEndTime = Date.now()
	}, { passive: true })

	window.addEventListener('touchcancel', () => {
		isTouching = false
		touchEndTime = Date.now()
	}, { passive: true })

	window.addEventListener('touchmove', (e) => {
		const touchY = e.touches[0].clientY
		const delta = lastTouchY - touchY // positive = finger moving up = scrolling down
		lastTouchY = touchY
		if (Math.abs(delta) < TOUCH_DELTA) return
		applyDirection(window.scrollY, delta)
	}, { passive: true })

	// Non-touch scroll: mouse wheel, keyboard, scrollbar drag
	window.addEventListener('scroll', () => {
		const scrollY = window.scrollY
		const delta = scrollY - lastScrollY
		lastScrollY = scrollY

		if (isTouching) return // direction handled by touchmove

		// Near the top: always safe to show header regardless of momentum phase
		if (scrollY < HIDE_THRESHOLD) {
			if (headerHidden) showHeader()
			return
		}

		// Ignore directional changes during momentum deceleration after touch
		if (Date.now() - touchEndTime < MOMENTUM_GRACE_MS) return

		if (Math.abs(delta) < SCROLL_DELTA) return
		applyDirection(scrollY, delta)
	}, { passive: true })

	window.addEventListener('load', initStickyOffsets)
	window.addEventListener('resize', initStickyOffsets)

	if ('ResizeObserver' in window) {
		const resizeObserver = new ResizeObserver(initStickyOffsets)
		resizeObserver.observe(header)
	}
}
