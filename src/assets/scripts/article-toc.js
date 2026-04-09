;(function attachArticleToc(globalObj) {
	'use strict'

	const instances = new WeakMap()
	const DEFAULTS = {
		contentSelector: '[data-scrollspy-content]',
		navSelector: '[data-scrollspy-nav]',
		headingSelector: 'h2',
		offset: 0.5,
		completion: 0.66,
		slugPrefix: 'section',
		preserveExistingIds: true,
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
		if (globalObj.JSConfetti) return Promise.resolve(globalObj.JSConfetti)
		if (jsConfettiLoader) return jsConfettiLoader

		jsConfettiLoader = new Promise((resolve, reject) => {
			const existing = document.querySelector('script[src="' + jsConfettiSrc + '"]')
			if (existing) {
				existing.addEventListener('load', () => resolve(globalObj.JSConfetti), { once: true })
				existing.addEventListener('error', (event) => reject(event), { once: true })
				return
			}

			const script = document.createElement('script')
			script.src = jsConfettiSrc
			script.async = true
			script.onload = () => resolve(globalObj.JSConfetti)
			script.onerror = (event) => {
				jsConfettiLoader = null
				reject(event)
			}
			document.head.appendChild(script)
		})

		return jsConfettiLoader
	}

	function init(userOptions) {
		const options = Object.assign({}, DEFAULTS, userOptions || {})
		const nav = document.querySelector(options.navSelector)
		const article = document.querySelector(options.contentSelector)
		if (!nav || !article) return

		const existingInstance = instances.get(article)
		if (existingInstance) return existingInstance

		const headingNodes = Array.from(article.querySelectorAll(options.headingSelector))
		if (!headingNodes.length) return

		const usedIds = new Set()
		const headings = headingNodes.map((heading, idx) => {
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
			link.textContent = heading.textContent ? heading.textContent.trim() : heading.id
			if (endNode) {
				nav.insertBefore(link, endNode)
			} else {
				nav.appendChild(link)
			}
			linkById.set(heading.id, link)
			return link
		})

		const endIcon = nav.querySelector('[data-scrollspy-end-icon]')
		const endLabel = nav.querySelector('[data-scrollspy-end-label]')
		const cardRoot = nav.closest('[data-card]')
		const confettiCanvas = cardRoot ? cardRoot.querySelector('[data-scrollspy-confetti-canvas]') : null
		let jsConfetti = null
		let wasComplete = false
		let activeId = headings[0].id
		let activeLink = null
		let ticking = false

		function setActive(id, isComplete) {
			const nextActiveLink = linkById.get(id)
			if (!nextActiveLink) return

			if (isComplete) {
				if (activeLink) activeLink.dataset.tocActive = 'false'
			} else if (activeLink !== nextActiveLink) {
				if (activeLink) activeLink.dataset.tocActive = 'false'
				nextActiveLink.dataset.tocActive = 'true'
			}
			activeLink = nextActiveLink

			if (endLabel) endLabel.dataset.tocActive = isComplete ? 'true' : 'false'
			if (endIcon) endIcon.dataset.tocActive = isComplete ? 'true' : 'false'

			let activeHeight = nav.getBoundingClientRect().height
			if (!isComplete) {
				const navTop = nav.getBoundingClientRect().top
				const linkRect = nextActiveLink.getBoundingClientRect()
				activeHeight = Math.max(0, linkRect.top - navTop + linkRect.height / 2)
			}
			nav.style.setProperty('--toc-active-height', `${activeHeight}px`)
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

		function updateFromScroll() {
			const sectionMarker = globalObj.innerHeight * options.offset
			const completionMarker = globalObj.innerHeight * options.completion
			let current = headings[0]
			const articleBottom = article.getBoundingClientRect().bottom
			const isComplete = articleBottom <= completionMarker

			for (const heading of headings) {
				if (heading.getBoundingClientRect().top <= sectionMarker) {
					current = heading
				} else {
					break
				}
			}

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
			globalObj.requestAnimationFrame(() => {
				updateFromScroll()
				ticking = false
			})
		}

		article.dataset.scrollspyInitialized = 'true'
		for (const link of links) {
			link.dataset.tocActive = 'false'
		}
		nav.style.setProperty('--toc-active-height', '0px')
		setActive(activeId, false)
		updateFromScroll()
		globalObj.addEventListener('scroll', scheduleUpdate, { passive: true })
		globalObj.addEventListener('resize', scheduleUpdate, { passive: true })

		function destroy() {
			globalObj.removeEventListener('scroll', scheduleUpdate)
			globalObj.removeEventListener('resize', scheduleUpdate)
			article.dataset.scrollspyInitialized = 'false'
			instances.delete(article)
		}

		const instance = {
			destroy,
			refresh: updateFromScroll,
		}
		instances.set(article, instance)
		return instance
	}

	globalObj.ArticleToc = {
		init,
	}
})(window)
