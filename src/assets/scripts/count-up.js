export default function countUp() {
	const nodes = document.querySelectorAll('[data-countup]')
	if (!nodes.length) return

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const parseDelayMs = (element) => {
		const inlineDelay = element.dataset.delay
		if (inlineDelay) return Number(inlineDelay) || 0

		const rawDelay = getComputedStyle(element).getPropertyValue('--motion-delay').trim()
		if (!rawDelay) return 0
		if (rawDelay.endsWith('ms')) return Number.parseFloat(rawDelay) || 0
		if (rawDelay.endsWith('s')) return (Number.parseFloat(rawDelay) || 0) * 1000
		return Number.parseFloat(rawDelay) || 0
	}

	const animateNode = (element) => {
		const target = Number(element.dataset.target || 0)
		const duration = Number(element.dataset.duration || 1200)
		const prefix = element.dataset.prefix || ''
		const suffix = element.dataset.suffix || ''

		if (prefersReducedMotion) {
			element.textContent = `${prefix}${target}${suffix}`
			return
		}

		const startedAt = performance.now()

		const tick = (timestamp) => {
			const progress = Math.min((timestamp - startedAt) / duration, 1)
			const eased = 1 - (1 - progress) ** 3
			const value = Math.round(target * eased)
			element.textContent = `${prefix}${value}${suffix}`

			if (progress < 1) {
				requestAnimationFrame(tick)
			}
		}

		requestAnimationFrame(tick)
	}

	const observer = new IntersectionObserver(
		(entries, instance) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return
				const delayMs = parseDelayMs(entry.target)
				window.setTimeout(() => {
					animateNode(entry.target)
				}, delayMs)
				instance.unobserve(entry.target)
			})
		},
		{ threshold: 0.4 },
	)

	nodes.forEach((node) => observer.observe(node))
}
