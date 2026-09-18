// Counts down to the instant in `data-countdown` (any string Date can parse;
// an ISO string with an offset or Z is safest, since a bare date is read as
// local time and drifts between visitors' zones). The four cells are found
// by `data-countdown-unit`, so the markup owns the layout. Each cell only
// updates when its value changes, which keeps repaints to one a second and
// lets the digits sit still otherwise. Past the end the cells hold at zero
// and `data-countdown-done` is set on the host for any styling or copy swap.
export default function countdown() {
	const hosts = document.querySelectorAll('[data-countdown]')
	if (!hosts.length) return

	hosts.forEach((host) => {
		const end = new Date(host.dataset.countdown).getTime()
		if (Number.isNaN(end)) return
		const cells = {}
		host.querySelectorAll('[data-countdown-unit]').forEach((el) => (cells[el.dataset.countdownUnit] = el))
		const pad = (n) => String(n).padStart(2, '0')
		let timer

		const tick = () => {
			const left = Math.max(0, end - Date.now())
			const s = Math.floor(left / 1000)
			const parts = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 }
			for (const [unit, el] of Object.entries(cells)) {
				const text = unit === 'days' ? String(parts[unit]) : pad(parts[unit])
				if (el.textContent !== text) el.textContent = text
			}
			if (left === 0) {
				host.dataset.countdownDone = ''
				clearInterval(timer)
			}
		}
		tick()
		timer = setInterval(tick, 1000)
	})
}
