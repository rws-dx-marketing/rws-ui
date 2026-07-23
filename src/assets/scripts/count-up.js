import { reducedMotion } from './motion'

export default function countUp() {
	const nodes = document.querySelectorAll('[data-count-up]')
	if (!nodes.length) return

	const TOKEN_REGEX = /-?\d[\d,]*(?:\.\d+)?(?:[kKmMbB])?/g

	const formatNumber = (value, { decimals = 0, useGrouping = false } = {}) => {
		const normalized = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
		if (!useGrouping) return normalized

		const sign = normalized.startsWith('-') ? '-' : ''
		const unsigned = sign ? normalized.slice(1) : normalized
		const [whole, fraction] = unsigned.split('.')
		const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		return fraction !== undefined ? `${sign}${groupedWhole}.${fraction}` : `${sign}${groupedWhole}`
	}

	const TOKEN_PARSERS = [
		{
			name: 'compactNumber',
			match: (token) => /^-?\d[\d,]*(?:\.\d+)?[kKmMbB]$/.test(token),
			parse: (token) => {
				const suffix = token.slice(-1)
				const numericText = token.slice(0, -1)
				const decimals = (numericText.split('.')[1] || '').length
				const useGrouping = numericText.includes(',')
				const target = Number(numericText.replaceAll(',', ''))
				return {
					target,
					format: (value) => `${formatNumber(value, { decimals, useGrouping })}${suffix}`,
				}
			},
		},
		{
			name: 'plainNumber',
			match: (token) => /^-?\d[\d,]*(?:\.\d+)?$/.test(token),
			parse: (token) => {
				const decimals = (token.split('.')[1] || '').length
				const useGrouping = token.includes(',')
				const target = Number(token.replaceAll(',', ''))
				return {
					target,
					format: (value) => formatNumber(value, { decimals, useGrouping }),
				}
			},
		},
	]

	const parseTemplate = (text) => {
		const parts = []
		let cursor = 0

		for (const match of text.matchAll(TOKEN_REGEX)) {
			const [token] = match
			const index = match.index ?? 0
			if (!token) continue

			const parser = TOKEN_PARSERS.find((candidate) => candidate.match(token))
			if (!parser) continue

			const parsedToken = parser.parse(token)
			if (!Number.isFinite(parsedToken.target)) continue

			if (index > cursor) {
				parts.push({
					type: 'static',
					value: text.slice(cursor, index),
				})
			}

			parts.push({
				type: 'token',
				target: parsedToken.target,
				format: parsedToken.format,
			})
			cursor = index + token.length
		}

		if (cursor < text.length) {
			parts.push({
				type: 'static',
				value: text.slice(cursor),
			})
		}

		const hasNumericToken = parts.some((part) => part.type === 'token')
		return { parts, hasNumericToken }
	}

	const renderParts = (parts, easedProgress) =>
		parts
			.map((part) => {
				if (part.type === 'static') return part.value
				return part.format(part.target * easedProgress)
			})
			.join('')

	const prefersReducedMotion = reducedMotion()
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
		const template = element.dataset.countUpTemplate ?? element.textContent ?? ''
		const parsedTemplate = parseTemplate(template)
		if (!parsedTemplate.hasNumericToken) return

		const duration = Number(element.dataset.duration || 1200)
		const finalValue = renderParts(parsedTemplate.parts, 1)
		const initialValue = renderParts(parsedTemplate.parts, 0)

		if (prefersReducedMotion) {
			element.textContent = finalValue
			return
		}

		element.textContent = initialValue
		const startedAt = performance.now()

		const tick = (timestamp) => {
			const progress = Math.min((timestamp - startedAt) / duration, 1)
			const eased = 1 - (1 - progress) ** 3
			element.textContent = renderParts(parsedTemplate.parts, eased)

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

	nodes.forEach((node) => {
		const template = node.textContent ?? ''
		const parsedTemplate = parseTemplate(template)
		if (!parsedTemplate.hasNumericToken) return

		node.dataset.countUpTemplate = template
		node.textContent = renderParts(parsedTemplate.parts, 0)
		observer.observe(node)
	})
}
