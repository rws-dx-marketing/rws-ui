// Counts down to the instant in `data-countdown` (any string Date can parse;
// an ISO string with an offset or Z is safest, since a bare date is read as
// local time and drifts between visitors' zones). The four cells are found
// by `data-countdown-unit`, so the markup owns the layout. Each cell only
// updates when its value changes, which keeps repaints to one a second and
// lets the digits sit still otherwise. Past the end the cells hold at zero
// and `data-countdown-done` is set on the host for any styling or copy swap.
// Each change also restarts `is-ticking` on the host, so a one-shot CSS
// animation can play per tick without the script knowing what it looks like.
// With `data-countdown-roll` on the host a cell is split into one
// `.countdown-digit` span per character, and only the digits that changed
// roll: for one animation the digit holds a `.countdown-roll` column of the
// old value over the new, which the CSS slides up. Toggling the attribute
// re-lays the cells out, so the split follows it either way.
export default function countdown() {
	const hosts = document.querySelectorAll('[data-countdown]')
	if (!hosts.length) return

	hosts.forEach((host) => {
		const end = new Date(host.dataset.countdown).getTime()
		if (Number.isNaN(end)) return
		const cells = {}
		host.querySelectorAll('[data-countdown-unit]').forEach((el) => (cells[el.dataset.countdownUnit] = el))
		const pad = (n) => String(n).padStart(2, '0')
		const shown = {}
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
		let timer

		const span = (className, text) => {
			const el = document.createElement('span')
			el.className = className
			el.textContent = text
			return el
		}

		const rollDigit = (digit, text, prev) => {
			const out = span('', prev)
			out.setAttribute('aria-hidden', 'true')
			const column = span('countdown-roll', '')
			column.append(out, span('', text))
			column.addEventListener('animationend', () => (digit.textContent = text))
			digit.replaceChildren(column)
		}

		const roll = (el, text, prev) => {
			// First fill, or a cell changing width (days dropping to one digit): lay the digits out fresh
			if (prev === undefined || text.length !== prev.length || el.children.length !== text.length) {
				el.replaceChildren(...[...text].map((ch) => span('countdown-digit', ch)))
				return
			}
			;[...text].forEach((ch, i) => {
				if (ch !== prev[i]) rollDigit(el.children[i], ch, prev[i])
			})
		}

		const values = () => {
			const left = Math.max(0, end - Date.now())
			const s = Math.floor(left / 1000)
			const parts = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 }
			return { left, text: (unit) => (unit === 'days' ? String(parts[unit]) : pad(parts[unit])) }
		}



		const tick = () => {
			const { left, text: textFor } = values()
			let changed = false
			for (const [unit, el] of Object.entries(cells)) {
				const text = textFor(unit)
				if (shown[unit] === text) continue
				if ('countdownRoll' in host.dataset && !reduceMotion.matches) roll(el, text, shown[unit])
				else el.textContent = text
				shown[unit] = text
				changed = true
			}
			if (changed) {
				host.classList.remove('is-ticking')
				void host.offsetWidth // reflow, so re-adding the class restarts the animation
				host.classList.add('is-ticking')
			}
			if (left === 0) {
				host.dataset.countdownDone = ''
				clearInterval(timer)
			}
		}
		tick()
		timer = setInterval(tick, 1000)

		new MutationObserver(() => {
			for (const unit in shown) shown[unit] = undefined
			tick()
		}).observe(host, { attributes: true, attributeFilter: ['data-countdown-roll'] })
	})
}
