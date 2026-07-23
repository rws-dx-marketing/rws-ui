// "View in my timezone" for the event detail page. Reconverts every element marked
// with [data-tz] (the Date + Time details and each agenda row) into a chosen
// fixed-offset timezone. No-ops on pages without a [data-tz-picker].
//
// Each [data-tz] element carries its start/end as UTC instants (data-tz-start /
// data-tz-end, ISO) plus a data-tz-format ("date" | "detail" | "agenda"). Because
// the instants are absolute UTC, the client never needs the event's own timezone —
// it just adds the picked offset. All formatting lives in ../../lib/event-time so
// converted values match the server-rendered defaults.
import { FORMATTERS } from '../../lib/event-time.js'

export default function timezoneSelect() {
	const picker = document.querySelector('[data-tz-picker]')
	if (!picker) return

	const popover = picker.querySelector('[popover]')
	const options = Array.from(picker.querySelectorAll('[data-tz-option]'))
	const targets = Array.from(document.querySelectorAll('[data-tz]'))
		.map((el) => ({
			el,
			startUTC: Date.parse(el.dataset.tzStart),
			endUTC: Date.parse(el.dataset.tzEnd),
			format: el.dataset.tzFormat ?? 'agenda',
		}))
		.filter(({ format, startUTC }) => FORMATTERS[format] && !Number.isNaN(startUTC))
	if (!targets.length) return

	options.forEach((option) => {
		option.addEventListener('click', () => {
			const offset = Number.parseInt(option.dataset.offset, 10)
			// The chosen zone reads off the Time row's own label, so the trigger stays
			// a plain action rather than echoing the selection.
			targets.forEach(({ el, startUTC, endUTC, format }) => {
				el.textContent = FORMATTERS[format](startUTC, endUTC, offset)
			})
			popover?.hidePopover?.()
		})
	})
}
