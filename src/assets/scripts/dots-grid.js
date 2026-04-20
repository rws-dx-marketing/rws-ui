export default function dotsGrid() {
	if (typeof window === 'undefined') return

	const sections = document.querySelectorAll('[data-theme="dots-enhanced"]')
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

	if (sections.length > 0 && !prefersReducedMotion) {
		const SVG_NS = 'http://www.w3.org/2000/svg'

		const createGrid = (section) => {
			const state = {
				section,
				svg: document.createElementNS(SVG_NS, 'svg'),
				dots: [],
				pointer: { x: 0, y: 0, active: false },
				rafId: null,
				width: 0,
				height: 0,
			}

			state.svg.setAttribute('aria-hidden', 'true')
			state.svg.classList.add('dots-svg')
			section.prepend(state.svg)

			const readNumber = (value, fallback) => {
				const parsed = Number.parseFloat(value)
				return Number.isFinite(parsed) ? parsed : fallback
			}

			const getConfig = () => {
				const styles = getComputedStyle(section)
				return {
					spacing: readNumber(styles.getPropertyValue('--dots-spacing').trim(), 36),
					radius: readNumber(styles.getPropertyValue('--dots-radius').trim(), 1.5),
					influence: readNumber(styles.getPropertyValue('--dots-influence').trim(), 120),
					maxPush: readNumber(styles.getPropertyValue('--dots-max-push').trim(), 14),
					ease: readNumber(styles.getPropertyValue('--dots-ease').trim(), 0.14),
				}
			}

			const createDots = () => {
				const rect = section.getBoundingClientRect()
				// Keep sub-pixel precision to match CSS background positioning.
				state.width = Math.max(1, rect.width)
				state.height = Math.max(1, rect.height)
				state.svg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`)

				const config = getConfig()
				// Match static background math:
				// - bg-top => y anchored to top
				// - background-position-x center => x anchored to center
				const baseOffset = config.spacing * (23.5 / 48)
				const offsetY = baseOffset
				const centeredAnchorX = state.width * 0.5 - config.spacing * 0.5 + baseOffset
				const offsetX = ((centeredAnchorX % config.spacing) + config.spacing) % config.spacing
				const fragment = document.createDocumentFragment()
				const dots = []

				state.svg.innerHTML = ''

				for (let y = offsetY; y <= state.height + config.spacing; y += config.spacing) {
					for (let x = offsetX; x <= state.width + config.spacing; x += config.spacing) {
						const circle = document.createElementNS(SVG_NS, 'circle')
						circle.classList.add('dots-dot')
						circle.setAttribute('r', String(config.radius))
						circle.setAttribute('cx', String(x))
						circle.setAttribute('cy', String(y))
						fragment.appendChild(circle)

						dots.push({
							el: circle,
							originX: x,
							originY: y,
							x,
							y,
						})
					}
				}

				state.svg.appendChild(fragment)
				state.dots = dots
			}

			const animate = () => {
				const config = getConfig()
				let hasMotion = false

				for (const dot of state.dots) {
					let targetX = dot.originX
					let targetY = dot.originY

					if (state.pointer.active) {
						const dx = dot.originX - state.pointer.x
						const dy = dot.originY - state.pointer.y
						const distance = Math.hypot(dx, dy)

						if (distance > 0 && distance < config.influence) {
							const normalized = 1 - distance / config.influence
							const push = config.maxPush * normalized * normalized
							targetX = dot.originX + (dx / distance) * push
							targetY = dot.originY + (dy / distance) * push
						}
					}

					dot.x += (targetX - dot.x) * config.ease
					dot.y += (targetY - dot.y) * config.ease

					if (Math.abs(dot.x - dot.originX) > 0.05 || Math.abs(dot.y - dot.originY) > 0.05 || state.pointer.active) {
						hasMotion = true
					}

					dot.el.setAttribute('cx', String(dot.x))
					dot.el.setAttribute('cy', String(dot.y))
				}

				if (hasMotion) {
					state.rafId = requestAnimationFrame(animate)
				} else {
					state.rafId = null
				}
			}

			const ensureAnimation = () => {
				if (state.rafId === null) {
					state.rafId = requestAnimationFrame(animate)
				}
			}

			const updatePointer = (event) => {
				const rect = section.getBoundingClientRect()
				state.pointer.x = event.clientX - rect.left
				state.pointer.y = event.clientY - rect.top
				state.pointer.active = true
				ensureAnimation()
			}

			section.addEventListener('pointermove', updatePointer)
			section.addEventListener('pointerenter', updatePointer)
			section.addEventListener('pointerleave', () => {
				state.pointer.active = false
				ensureAnimation()
			})

			const resizeObserver = new ResizeObserver(() => {
				createDots()
				ensureAnimation()
			})

			resizeObserver.observe(section)
			createDots()
		}

		sections.forEach((section) => createGrid(section))
	}
}
