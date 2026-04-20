const instancesByNav = new WeakMap()
const DEFAULTS = {
	contentSelector: '[data-scrollspy-content]',
	navSelector: '[data-scrollspy-nav]',
	headingSelector: 'h2',
	offset: 0.5,
	completion: 0.66,
	slugPrefix: 'section',
	preserveExistingIds: true,
	proximity: null,
	hoverProximity: null,
}

const jsConfettiSrc = 'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js'
let jsConfettiLoader = null

function slugify(text) {
	return String(text || '')
		.toLowerCase()
		.trim()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function uniqueId(base, usedIds, fallbackPrefix) {
	let candidate = base || fallbackPrefix
	let index = 2
	while (usedIds.has(candidate) || document.getElementById(candidate)) {
		candidate = `${base || fallbackPrefix}-${index}`
		index += 1
	}
	usedIds.add(candidate)
	return candidate
}

function ensureJsConfettiLoaded() {
	if (window.JSConfetti) return Promise.resolve(window.JSConfetti)
	if (jsConfettiLoader) return jsConfettiLoader

	jsConfettiLoader = new Promise((resolve, reject) => {
		const existing = document.querySelector('script[src="' + jsConfettiSrc + '"]')
		if (existing) {
			existing.addEventListener('load', () => resolve(window.JSConfetti), { once: true })
			existing.addEventListener('error', (event) => reject(event), { once: true })
			return
		}

		const script = document.createElement('script')
		script.src = jsConfettiSrc
		script.async = true
		script.onload = () => resolve(window.JSConfetti)
		script.onerror = (event) => {
			jsConfettiLoader = null
			reject(event)
		}
		document.head.appendChild(script)
	})

	return jsConfettiLoader
}

function resolveContentNodes(nav, options) {
	const group = nav.dataset.scrollspyGroup
	if (group) {
		return Array.from(document.querySelectorAll(`${options.contentSelector}[data-scrollspy-group="${group}"]`))
	}
	return Array.from(document.querySelectorAll(options.contentSelector))
}

function collectHeadings(contentNodes, options) {
	const headingNodes = contentNodes.flatMap((contentNode) => Array.from(contentNode.querySelectorAll(options.headingSelector)))
	if (!headingNodes.length) return []

	const usedIds = new Set()
	return headingNodes.map((heading, idx) => {
		const fallback = `${options.slugPrefix}-${idx + 1}`
		const base = slugify(heading.textContent) || fallback
		let id = heading.id

		if (!id) {
			id = uniqueId(base, usedIds, fallback)
		} else if (options.preserveExistingIds) {
			usedIds.add(id)
		} else {
			id = uniqueId(id, usedIds, fallback)
		}

		heading.id = id
		return heading
	})
}

function buildPostNavLinks(nav, headings) {
	Array.from(nav.querySelectorAll('[data-scrollspy-link]')).forEach((link) => link.remove())
	const linkTemplate = nav.querySelector('[data-scrollspy-link-template]')
	const endNode = nav.querySelector('[data-scrollspy-end]')
	const linkById = new Map()

	const links = headings.map((heading) => {
		const link = linkTemplate ? linkTemplate.cloneNode(true) : document.createElement('a')
		link.href = `#${heading.id}`
		link.removeAttribute('data-scrollspy-link-template')
		link.classList.remove('hidden')
		link.removeAttribute('aria-hidden')
		link.dataset.scrollspyLink = ''
		const labelText = heading.textContent ? heading.textContent.trim() : heading.id
		const labelNode = link.querySelector('[data-scrollspy-link-label]')
		if (labelNode) {
			labelNode.textContent = labelText
		} else {
			link.textContent = labelText
		}
		link.dataset.navLabel = labelText
		if (endNode) {
			nav.insertBefore(link, endNode)
		} else {
			nav.appendChild(link)
		}
		linkById.set(heading.id, link)
		return link
	})

	return { links, linkById }
}

function getNavConfig(nav, options) {
	const parsedProximity = Number.parseInt(nav.dataset.scrollspyProximity || '', 10)
	const parsedHoverProximity = Number.parseInt(nav.dataset.scrollspyHoverProximity || '', 10)
	const parsedRailOffset = Number.parseFloat(nav.dataset.scrollspyRailOffset || '')

	return {
		proximity: Number.isInteger(parsedProximity) && parsedProximity >= 0 ? parsedProximity : options.proximity,
		hoverProximity: Number.isInteger(parsedHoverProximity) && parsedHoverProximity >= 0 ? parsedHoverProximity : options.hoverProximity,
		railOffset: Number.isFinite(parsedRailOffset) && parsedRailOffset >= 0 ? parsedRailOffset : 0,
		useProgressDots: nav.hasAttribute('data-scrollspy-progress-dots'),
		useDirectionalDelay: nav.hasAttribute('data-scrollspy-directional-delay'),
	}
}

function createInstance(nav, options) {
	const contentNodes = resolveContentNodes(nav, options)
	if (!contentNodes.length) return null

	const headings = collectHeadings(contentNodes, options)
	if (!headings.length) return null

	const { links, linkById } = buildPostNavLinks(nav, headings)
	const headingIndexById = new Map(headings.map((heading, index) => [heading.id, index]))
	const navConfig = getNavConfig(nav, options)
	const endIcon = nav.querySelector('[data-scrollspy-end-icon]')
	const endLabel = nav.querySelector('[data-scrollspy-end-label]')
	const cardRoot = nav.closest('[data-card]')
	const confettiCanvas = cardRoot ? cardRoot.querySelector('[data-scrollspy-confetti-canvas]') : null
	const lastContentNode = contentNodes[contentNodes.length - 1]

	let jsConfetti = null
	let wasComplete = false
	let activeId = headings[0].id
	let activeLink = null
	let previousActiveIndex = headingIndexById.get(activeId) ?? 0
	let ticking = false

	function setActive(id, isComplete) {
		const nextActiveLink = linkById.get(id)
		if (!nextActiveLink) return

		const activeIndex = headingIndexById.get(id) ?? 0
		const isMovingForward = navConfig.useDirectionalDelay && activeIndex > previousActiveIndex

		if (isComplete) {
			if (activeLink) activeLink.dataset.navActive = 'false'
		} else {
			if (activeLink !== nextActiveLink && activeLink) activeLink.dataset.navActive = 'false'
			nextActiveLink.dataset.navActive = 'true'
		}
		activeLink = nextActiveLink

		for (let idx = 0; idx < links.length; idx += 1) {
			const link = links[idx]
			const distance = Math.abs(idx - activeIndex)
			link.dataset.navDistance = String(distance)

			if (navConfig.useProgressDots) {
				link.dataset.navPast = idx < activeIndex ? 'true' : 'false'
			} else {
				delete link.dataset.navPast
			}

			if (navConfig.useDirectionalDelay) {
				link.dataset.navDelay = idx === activeIndex && isMovingForward ? 'true' : 'false'
			} else {
				delete link.dataset.navDelay
			}

			if (Number.isInteger(navConfig.proximity)) {
				link.dataset.navInRange = distance <= navConfig.proximity ? 'true' : 'false'
			}
			if (Number.isInteger(navConfig.hoverProximity)) {
				link.dataset.navInHoverRange = distance <= navConfig.hoverProximity ? 'true' : 'false'
			}
		}

		if (endLabel) endLabel.dataset.navActive = isComplete ? 'true' : 'false'
		if (endIcon) endIcon.dataset.navActive = isComplete ? 'true' : 'false'

		const navRect = nav.getBoundingClientRect()
		let activeHeight = Math.max(0, navRect.height - navConfig.railOffset * 2)
		if (!isComplete) {
			const linkRect = nextActiveLink.getBoundingClientRect()
			activeHeight = Math.max(0, linkRect.top - navRect.top + linkRect.height / 2 - navConfig.railOffset)
		}
		nav.style.setProperty('--post-nav-active-height', `${activeHeight}px`)
		previousActiveIndex = activeIndex
	}

	async function getJsConfetti() {
		if (jsConfetti) return jsConfetti
		if (!confettiCanvas) return null
		const Ctor = await ensureJsConfettiLoaded()
		if (!Ctor) return null
		jsConfetti = new Ctor({ canvas: confettiCanvas })
		return jsConfetti
	}

	async function triggerEndConfetti() {
		const confetti = await getJsConfetti()
		if (!confetti || !endIcon || !confettiCanvas) return

		const iconRect = endIcon.getBoundingClientRect()
		const canvasRect = confettiCanvas.getBoundingClientRect()
		const x = iconRect.left + iconRect.width / 2 - canvasRect.left
		const y = iconRect.top + iconRect.height / 2 - canvasRect.top

		setTimeout(() => {
			confetti.addConfettiAtPosition({
				confettiColors: ['oklch(0.591 0.238 290.15)', 'oklch(0.589 0.235 12.88)', 'oklch(0.302 0.159 300.75)'],
				confettiNumber: 240,
				confettiRadius: 6,
				confettiDispatchPosition: { x, y },
			})
		}, 600)
	}

	function getCurrentHeading() {
		const sectionMarker = window.innerHeight * options.offset
		let current = headings[0]
		for (let idx = 0; idx < headings.length; idx += 1) {
			const heading = headings[idx]
			if (heading.getBoundingClientRect().top <= sectionMarker) {
				current = heading
			} else {
				break
			}
		}
		return current
	}

	function updateFromScroll() {
		const completionMarker = window.innerHeight * options.completion
		const contentBottom = lastContentNode.getBoundingClientRect().bottom
		const isComplete = contentBottom <= completionMarker
		const current = getCurrentHeading()
		if (!current || !current.id) return

		if (current.id !== activeId) activeId = current.id
		setActive(activeId, isComplete)

		if (isComplete && !wasComplete) {
			void triggerEndConfetti()
		}
		wasComplete = isComplete
	}

	function scheduleUpdate() {
		if (ticking) return
		ticking = true
		window.requestAnimationFrame(() => {
			updateFromScroll()
			ticking = false
		})
	}

	for (const contentNode of contentNodes) {
		contentNode.dataset.scrollspyInitialized = 'true'
	}
	for (const link of links) {
		link.dataset.navActive = 'false'
	}
	nav.style.setProperty('--post-nav-active-height', '0px')
	setActive(activeId, false)
	updateFromScroll()
	window.addEventListener('scroll', scheduleUpdate, { passive: true })
	window.addEventListener('resize', scheduleUpdate, { passive: true })

	return {
		refresh: updateFromScroll,
		destroy() {
			window.removeEventListener('scroll', scheduleUpdate)
			window.removeEventListener('resize', scheduleUpdate)
			for (const contentNode of contentNodes) {
				contentNode.dataset.scrollspyInitialized = 'false'
			}
			instancesByNav.delete(nav)
		},
	}
}

export default function postNav(userOptions) {
	const options = Object.assign({}, DEFAULTS, userOptions || {})
	const navNodes = Array.from(document.querySelectorAll(options.navSelector))
	if (!navNodes.length) return

	const instances = []
	for (const nav of navNodes) {
		const existingInstance = instancesByNav.get(nav)
		if (existingInstance) {
			instances.push(existingInstance)
			continue
		}

		const instance = createInstance(nav, options)
		if (!instance) continue
		instancesByNav.set(nav, instance)
		instances.push(instance)
	}

	if (!instances.length) return
	return instances.length === 1 ? instances[0] : instances
}
