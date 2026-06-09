export default function primaryNav() {
	if (typeof window === 'undefined') return

	const root = document.documentElement
	const growler = document.getElementById('growler')
	const header = document.getElementById('site-header')
	const menuToggle = document.getElementById('mobile-menu-toggle')
	const menuPanel = document.getElementById('mobile-menu-panel')
	const shellCloseHitarea = document.getElementById('mobile-shell-close-hitarea')
	const menuClosedIcon = menuToggle?.querySelector('[data-icon-closed]')
	const menuOpenIcon = menuToggle?.querySelector('[data-icon-open]')
	const desktopLanguageMenu = document.getElementById('desktop-language-menu')
	const desktopLanguageOptions = desktopLanguageMenu ? Array.from(desktopLanguageMenu.querySelectorAll('a[role="menuitem"]')) : []
	const languageChangeDialog = document.getElementById('language-change-dialog')
	const mobileMenuViews = menuPanel ? Array.from(menuPanel.querySelectorAll('[data-mobile-menu-view]')) : []
	const panelInner = menuPanel?.querySelector(':scope > div')
	if (panelInner instanceof HTMLElement) {
		mobileMenuViews.forEach((view) => {
			if (!(view instanceof HTMLElement)) return
			if (view.dataset.mobileMenuView === 'root') return
			panelInner.appendChild(view)
		})
	}
	const desktopMenuButtons = header ? Array.from(header.querySelectorAll('button[popovertarget]')) : []
	const desktopPopoverPairs = desktopMenuButtons
		.map((button, index) => {
			if (!(button instanceof HTMLElement)) return null
			const popoverId = button.getAttribute('popovertarget')
			if (!popoverId) return null
			const popover = document.getElementById(popoverId)
			if (!(popover instanceof HTMLElement)) return null
			return { button, popover, index }
		})
		.filter((pair) => pair !== null)
	let currentDesktopOpenIndex = -1
	let lastFocusedElement = null
	let closeCleanupTimer = null
	let currentMobileView = 'root'
	let scrollLocked = false
	const getShellTarget = () => document.getElementById('page-shell') ?? document.querySelector('main')
	const mobileViewForwardOffscreenClass = 'translate-x-[calc(100%+2rem)]'
	const mobileViewBackOffscreenClass = '-translate-x-[calc(100%+2rem)]'
	const shellMotionClasses = ['translate-x-[calc(var(--mobile-menu-width)-10vw)]', 'scale-90', 'rounded-2xl']
	const shellLockClasses = []
	const getTransitionDurationMs = () => {
		const rawDuration = getComputedStyle(root).getPropertyValue('--default-transition-duration').trim()
		if (!rawDuration) return 400
		if (rawDuration.endsWith('ms')) return Number.parseFloat(rawDuration) || 400
		if (rawDuration.endsWith('s')) return (Number.parseFloat(rawDuration) || 0.4) * 1000
		return Number.parseFloat(rawDuration) || 400
	}

	const updateHeaderHeight = () => {
		if (!root || !header) return
		root.style.setProperty('--mobile-menu-top', `${Math.max(0, header.getBoundingClientRect().bottom)}px`)
	}

	const getMobileMenuView = (viewId) => mobileMenuViews.find((view) => view instanceof HTMLElement && view.dataset.mobileMenuView === viewId)
	const resetMobileMenuViews = () => {
		mobileMenuViews.forEach((view) => {
			if (!(view instanceof HTMLElement)) return
			const isRoot = view.dataset.mobileMenuView === 'root'
			view.classList.toggle('translate-x-0', isRoot)
			view.classList.toggle(mobileViewBackOffscreenClass, false)
			view.classList.toggle(mobileViewForwardOffscreenClass, !isRoot)
			view.classList.toggle('pointer-events-auto', isRoot)
			view.classList.toggle('pointer-events-none', !isRoot)
		})
		currentMobileView = 'root'
	}
	const setMobileMenuView = (nextViewId) => {
		console.log('[primary-nav] mobile view', currentMobileView, '→', nextViewId)
		const currentView = getMobileMenuView(currentMobileView)
		const nextView = getMobileMenuView(nextViewId)
		if (!(currentView instanceof HTMLElement) || !(nextView instanceof HTMLElement)) return
		if (currentMobileView === nextViewId) return
		currentView.classList.remove('translate-x-0', mobileViewForwardOffscreenClass, mobileViewBackOffscreenClass)
		nextView.classList.remove('translate-x-0', mobileViewForwardOffscreenClass, mobileViewBackOffscreenClass)
		if (nextViewId === 'root') {
			currentView.classList.add(mobileViewForwardOffscreenClass)
			nextView.classList.add('translate-x-0')
		} else {
			currentView.classList.add(mobileViewBackOffscreenClass)
			nextView.classList.add('translate-x-0')
		}
		currentView.classList.add('pointer-events-none')
		nextView.classList.remove('pointer-events-none')
		nextView.classList.add('pointer-events-auto')
		currentMobileView = nextViewId
	}

	const setMenuState = (isOpen) => {
		console.log('[primary-nav] mobile menu', isOpen ? 'open' : 'close')
		if (!menuToggle || !menuPanel || !shellCloseHitarea) return
		const shellTarget = getShellTarget()
		const transitionDurationMs = getTransitionDurationMs()
		if (closeCleanupTimer) {
			window.clearTimeout(closeCleanupTimer)
			closeCleanupTimer = null
		}
		root.dataset.mobileMenuOpen = isOpen ? 'true' : 'false'
		if (isOpen) {
			updateHeaderHeight()
			lockDocumentScroll()
		}
		menuToggle.setAttribute('aria-expanded', String(isOpen))
		menuPanel.setAttribute('aria-hidden', String(!isOpen))
		menuPanel.style.translate = isOpen ? '0' : '-100%'
		shellCloseHitarea.style.pointerEvents = isOpen ? 'auto' : 'none'
		if (menuClosedIcon instanceof HTMLElement) menuClosedIcon.hidden = isOpen
		if (menuOpenIcon instanceof HTMLElement) menuOpenIcon.hidden = !isOpen
		if (shellTarget instanceof HTMLElement) {
			if (isOpen) {
				const shellRect = shellTarget.getBoundingClientRect()
				const shellDocTop = shellRect.top + window.scrollY
				const menuTop = parseFloat(getComputedStyle(root).getPropertyValue('--mobile-menu-top')) || 0
				const topClip = Math.max(0, menuTop - shellRect.top)
				const bottomClip = Math.max(0, shellRect.bottom - window.innerHeight)
				const originY = window.scrollY + window.innerHeight / 2 - shellDocTop
				shellTarget.style.transformOrigin = `right ${originY}px`
				shellTarget.style.clipPath = `inset(${topClip}px 0 ${bottomClip}px 0 round 1rem)`
				shellMotionClasses.forEach((className) => {
					shellTarget.classList.add(className)
				})
				shellLockClasses.forEach((className) => {
					shellTarget.classList.add(className)
				})
			} else {
				shellMotionClasses.forEach((className) => {
					shellTarget.classList.remove(className)
				})
			}
		}

		if (isOpen) {
			document.body.style.backgroundColor = '#000'
		} else {
			closeCleanupTimer = window.setTimeout(() => {
				resetMobileMenuViews()
				if (shellTarget instanceof HTMLElement) {
					shellLockClasses.forEach((className) => {
						shellTarget.classList.remove(className)
					})
					shellTarget.style.transformOrigin = ''
					shellTarget.style.clipPath = ''
				}
				unlockDocumentScroll()
				document.body.style.backgroundColor = ''
			}, transitionDurationMs)
		}

		if (isOpen) {
			lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
			const shouldMoveFocusIntoMenu = menuToggle.matches(':focus-visible')
			if (shouldMoveFocusIntoMenu) {
				const firstMenuFocusable = menuPanel.querySelector('[data-mobile-focus], button, a')
				if (firstMenuFocusable instanceof HTMLElement) firstMenuFocusable.focus({ preventScroll: true })
			}
		} else if (lastFocusedElement instanceof HTMLElement) {
			lastFocusedElement.focus()
		}
	}

	const closeMenu = () => setMenuState(false)
	const toggleMenu = () => {
		const isOpen = root.dataset.mobileMenuOpen === 'true'
		setMenuState(!isOpen)
	}
	const syncDesktopMenuTriggerState = () => {
		desktopMenuButtons.forEach((button) => {
			if (!(button instanceof HTMLElement)) return
			const popoverId = button.getAttribute('popovertarget')
			if (!popoverId) return
			const popover = document.getElementById(popoverId)
			const isOpen = popover instanceof HTMLElement ? popover.matches(':popover-open') : false
			button.setAttribute('aria-expanded', String(isOpen))
		})
	}
	const preventScroll = (e) => {
		if (e.target instanceof Node && menuPanel?.contains(e.target)) return
		e.preventDefault()
	}
	const lockDocumentScroll = () => {
		if (scrollLocked) return
		scrollLocked = true
		document.documentElement.style.overflow = 'hidden'
		document.addEventListener('wheel', preventScroll, { passive: false })
		document.addEventListener('touchmove', preventScroll, { passive: false })
	}
	const unlockDocumentScroll = () => {
		if (!scrollLocked) return
		scrollLocked = false
		document.documentElement.style.overflow = ''
		document.removeEventListener('wheel', preventScroll)
		document.removeEventListener('touchmove', preventScroll)
	}
	menuToggle?.addEventListener('click', toggleMenu)
	shellCloseHitarea?.addEventListener('click', closeMenu)
	menuPanel?.addEventListener('click', (event) => {
		const target = event.target instanceof Element ? event.target.closest('[data-mobile-menu-target], [data-mobile-menu-back]') : null
		if (!(target instanceof HTMLElement)) return
		if (target.hasAttribute('data-mobile-menu-target')) {
			const nextViewId = target.getAttribute('data-mobile-menu-target')
			if (nextViewId) setMobileMenuView(nextViewId)
		}
		if (target.hasAttribute('data-mobile-menu-back')) {
			setMobileMenuView('root')
		}
	})
	desktopMenuButtons.forEach((button) => {
		if (!(button instanceof HTMLElement)) return
		const popoverId = button.getAttribute('popovertarget')
		if (!popoverId) return
		const popover = document.getElementById(popoverId)
		if (!(popover instanceof HTMLElement)) return
		const popoverPair = desktopPopoverPairs.find((pair) => pair.popover === popover)
		if (!popoverPair) return
		popover.addEventListener('beforetoggle', (event) => {
			if (event.newState !== 'open') return
			if (currentDesktopOpenIndex === -1 || currentDesktopOpenIndex === popoverPair.index) {
				popover.dataset.motion = 'initial'
			} else {
				popover.dataset.motion = popoverPair.index > currentDesktopOpenIndex ? 'from-right' : 'from-left'
			}
		})
		popover.addEventListener('toggle', (event) => {
			const nextState = event.newState ?? (popover.matches(':popover-open') ? 'open' : 'closed')
			console.log('[primary-nav] desktop popover', popover.id, nextState)
			if (nextState === 'open') {
				currentDesktopOpenIndex = popoverPair.index
			} else if (currentDesktopOpenIndex === popoverPair.index) {
				currentDesktopOpenIndex = -1
			}
			syncDesktopMenuTriggerState()
		})
	})
	if (languageChangeDialog instanceof HTMLDialogElement) {
		languageChangeDialog.addEventListener('click', (event) => {
			if (event.target === languageChangeDialog) languageChangeDialog.close()
		})
		languageChangeDialog.addEventListener('toggle', (event) => {
			console.log('[primary-nav] language dialog', event.newState)
			if (event.newState === 'open') {
				lockDocumentScroll()
			} else if (event.newState === 'closed') {
				unlockDocumentScroll()
			}
		})
	}
	desktopLanguageOptions.forEach((option) => {
		if (!(option instanceof HTMLAnchorElement)) return
		option.addEventListener('click', (event) => {
			event.preventDefault()
			desktopLanguageMenu?.hidePopover?.()
			if (!(languageChangeDialog instanceof HTMLDialogElement)) return
			if (!languageChangeDialog.open) languageChangeDialog.showModal()
		})
	})

	window.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return
		if (root.dataset.mobileMenuOpen !== 'true') return
		closeMenu()
	})

	window.addEventListener('resize', () => {
		if (window.matchMedia('(min-width: 64rem)').matches && root.dataset.mobileMenuOpen === 'true') {
			closeMenu()
		}
	})

	setMenuState(false)
	resetMobileMenuViews()
	syncDesktopMenuTriggerState()
	requestAnimationFrame(() => {
		menuPanel?.classList.add('transition-transform')
	})

	const searchToggle = document.getElementById('search-toggle')
	const searchDialog = document.getElementById('search-dialog')
	const searchInput = document.getElementById('search-input')
	const searchChat = document.getElementById('search-chat')
	const searchMessages = document.getElementById('search-messages')
	const searchDivider = document.getElementById('search-divider')
	const searchForm = document.getElementById('search-form')

	const DUMMY_RESPONSE = 'I’m Ask RWS – here to help you quickly find the most relevant and accurate information on RWS technologies, services, solutions and insights. What would you like to know?'
	const MAX_MESSAGES_HEIGHT = Math.floor(window.innerHeight * 0.45)

	function syncHeight() {
		if (!(searchChat instanceof HTMLElement)) return
		const target = Math.min(searchChat.scrollHeight, MAX_MESSAGES_HEIGHT)
		searchChat.style.height = target + 'px'
		if (searchChat.scrollHeight >= MAX_MESSAGES_HEIGHT) {
			searchChat.scrollTop = searchChat.scrollHeight
		}
	}

	function appendMessage(text, role) {
		if (!(searchMessages instanceof HTMLElement)) return null
		const el = document.createElement('div')
		el.className = role === 'user' ? 'self-end max-w-[80%] rounded-2xl rounded-br-sm bg-foreground/5 px-4 py-3 text-sm font-medium text-foreground' : 'self-start max-w-[80%] rounded-2xl rounded-bl-sm bg-accent/10 px-4 py-3 text-sm font-medium text-foreground'
		el.textContent = text
		searchMessages.appendChild(el)
		syncHeight()
		return el
	}

	function appendPageCard({ href, image, alt, title, excerpt }) {
		if (!(searchMessages instanceof HTMLElement)) return null
		const el = document.createElement('a')
		el.href = href
		el.className = 'flex w-full max-w-[75%] items-center overflow-clip rounded bg-linear-to-r from-transparent from-[0.5rem] via-tertiary via-[0.5rem] to-tertiary text-white no-underline transition-opacity hover:opacity-90'
		el.innerHTML = `
				<div class="shrink-0">
					<img src="${image}" alt="${alt}" class="size-24 object-cover" />
				</div>
				<div class="min-w-0 p-5">
					<p class="truncate text-sm font-semibold">${title}</p>
					<p class="mt-0.5 line-clamp-2 font-medium text-xs text-white/80">${excerpt}</p>
				</div>
			`
		searchMessages.appendChild(el)
		syncHeight()
		return el
	}

	function appendLoading() {
		if (!(searchMessages instanceof HTMLElement)) return null
		const el = document.createElement('div')
		el.className = 'self-start flex gap-1 rounded-2xl rounded-bl-sm bg-accent/10 px-4 py-3'
		el.innerHTML = `
			<span class="size-1 rounded-full bg-foreground/40 animate-bounce" style="animation-delay:0ms"></span>
			<span class="size-1 rounded-full bg-foreground/40 animate-bounce" style="animation-delay:150ms"></span>
			<span class="size-1 rounded-full bg-foreground/40 animate-bounce" style="animation-delay:300ms"></span>
		`
		searchMessages.appendChild(el)
		syncHeight()
		return el
	}

	function resetSearch() {
		if (searchMessages instanceof HTMLElement) {
			searchMessages.innerHTML = ''
			searchMessages.classList.remove('p-6')
		}
		if (searchChat instanceof HTMLElement) {
			searchChat.style.height = ''
			searchChat.classList.add('h-0')
		}
		if (searchDivider) searchDivider.hidden = true
		if (searchInput instanceof HTMLInputElement) searchInput.value = ''
	}

	if (searchDialog instanceof HTMLDialogElement) {
		searchDialog.addEventListener('click', (event) => {
			if (event.target === searchDialog) searchDialog.close()
		})
		searchDialog.addEventListener('beforetoggle', (event) => {
			if (event.newState === 'open') resetSearch()
		})
		searchDialog.addEventListener('toggle', (event) => {
			console.log('[primary-nav] search dialog', event.newState)
			if (event.newState === 'open') {
				lockDocumentScroll()
				searchInput?.focus()
			} else if (event.newState === 'closed') {
				unlockDocumentScroll()
				searchToggle?.focus()
			}
		})
	}

	if (searchForm instanceof HTMLFormElement) {
		searchForm.addEventListener('submit', (event) => {
			event.preventDefault()
			if (!(searchInput instanceof HTMLInputElement)) return
			const value = searchInput.value.trim()
			if (!value) return

			if (searchChat instanceof HTMLElement && !searchChat.style.height) {
				searchMessages?.classList.add('p-6')
				if (searchDivider) searchDivider.hidden = false
				void searchChat.offsetHeight
			}

			searchInput.value = ''
			appendMessage(value, 'user')
			const loader = appendLoading()

			setTimeout(() => {
				loader?.remove()
				appendMessage(DUMMY_RESPONSE, 'assistant')
				appendPageCard({
					href: '#',
					image: 'https://placehold.co/512',
					alt: 'Placeholder',
					title: 'Translation Services',
					excerpt: 'Expert human translation across 200+ languages, combining specialist linguists with cutting-edge technology to deliver accuracy at scale.',
				})
			}, 2000)
		})
	}

	searchToggle?.addEventListener('click', () => {
		console.log('[primary-nav] search toggle clicked')
		if (searchDialog instanceof HTMLDialogElement && !searchDialog.open) searchDialog.showModal()
	})
}
