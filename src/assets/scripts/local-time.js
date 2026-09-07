// Renders the current time in each office's own timezone. Server-rendering it
// would bake the build time into a static page, so the markup ships a dash and
// this fills it in. `data-local-time` carries an IANA zone, which keeps the
// conversion DST-aware without a timezone table.
//
// The zone label is our own, because `timeZoneName: 'short'` is not what it
// sounds like: CLDR only carries real abbreviations for a handful of zones per
// locale, and everything else falls back to a numeric offset. Under en-GB that
// leaves Bangkok as "GMT+7" and New York as "GMT-4" — so the abbreviations come
// from the map below instead, matching what the live site shows.

// [standard, daylight]. A single string means the zone does not observe DST.
// Keyed by every zone in data/about/offices.js; anything unmapped falls back to
// whatever Intl offers rather than guessing.
const ABBREVIATIONS = {
	'Africa/Johannesburg': 'SAST',
	'America/Argentina/Buenos_Aires': 'ART',
	'America/Bogota': 'COT',
	'America/Chicago': ['CST', 'CDT'],
	'America/Denver': ['MST', 'MDT'],
	'America/Los_Angeles': ['PST', 'PDT'],
	'America/New_York': ['EST', 'EDT'],
	'America/Santiago': ['CLT', 'CLST'],
	'America/Sao_Paulo': 'BRT',
	'America/Toronto': ['EST', 'EDT'],
	'Asia/Bangkok': 'ICT',
	'Asia/Beirut': ['EET', 'EEST'],
	'Asia/Ho_Chi_Minh': 'ICT',
	'Asia/Hong_Kong': 'HKT',
	'Asia/Kolkata': 'IST',
	'Asia/Seoul': 'KST',
	'Asia/Shanghai': 'CST',
	'Asia/Taipei': 'CST',
	'Asia/Tokyo': 'JST',
	'Australia/Sydney': ['AEST', 'AEDT'],
	'Europe/Amsterdam': ['CET', 'CEST'],
	'Europe/Berlin': ['CET', 'CEST'],
	'Europe/Brussels': ['CET', 'CEST'],
	'Europe/Bucharest': ['EET', 'EEST'],
	'Europe/Dublin': ['GMT', 'IST'],
	'Europe/Helsinki': ['EET', 'EEST'],
	'Europe/Lisbon': ['WET', 'WEST'],
	'Europe/London': ['GMT', 'BST'],
	'Europe/Madrid': ['CET', 'CEST'],
	'Europe/Moscow': 'MSK',
	'Europe/Oslo': ['CET', 'CEST'],
	'Europe/Paris': ['CET', 'CEST'],
	'Europe/Prague': ['CET', 'CEST'],
	'Europe/Warsaw': ['CET', 'CEST'],
	'Europe/Zagreb': ['CET', 'CEST'],
	'Europe/Zurich': ['CET', 'CEST'],
}

const clock = (timezone) =>
	new Intl.DateTimeFormat('en-GB', {
		timeZone: timezone,
		hour: '2-digit',
		minute: '2-digit',
	})

const offsetFormat = (timezone) =>
	new Intl.DateTimeFormat('en-GB', {
		timeZone: timezone,
		timeZoneName: 'longOffset',
	})

// "GMT+05:30" → 330. Bare "GMT" is UTC.
const offsetAt = (formatter, date) => {
	const label = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')?.value ?? ''
	const [, sign, hours, minutes] = label.match(/GMT([+-])(\d{2}):(\d{2})/) ?? []
	if (!sign) return 0
	return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes))
}

// Daylight saving only ever adds to the offset, so the smaller of the two
// solstice offsets is the standard one — true in both hemispheres, which a
// "is it summer?" check is not.
const isDaylight = (formatter, date) => {
	const year = date.getUTCFullYear()
	const january = offsetAt(formatter, new Date(Date.UTC(year, 0, 1)))
	const july = offsetAt(formatter, new Date(Date.UTC(year, 6, 1)))
	return offsetAt(formatter, date) > Math.min(january, july)
}

// Falls back to Intl's own label so an office in an unmapped zone still reads
// as a time rather than losing its suffix entirely.
const fallbackZone = (timezone, date) => {
	try {
		return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value ?? ''
	} catch {
		return ''
	}
}

export default function localTime() {
	const elements = Array.from(document.querySelectorAll('[data-local-time]'))
	if (!elements.length) return

	const formatters = new Map()

	const formatterFor = (timezone) => {
		if (!formatters.has(timezone)) {
			try {
				formatters.set(timezone, { clock: clock(timezone), offset: offsetFormat(timezone) })
			} catch {
				// An unrecognised zone leaves the placeholder in place rather
				// than throwing and stopping every other clock on the page.
				formatters.set(timezone, null)
			}
		}
		return formatters.get(timezone)
	}

	const render = () => {
		const now = new Date()

		// Resolved once per zone per pass, not once per element — the archive
		// lists eight Shanghai offices, and the DST check costs three Intl calls.
		// Recomputed each pass rather than cached, so a clock left open across a
		// changeover picks the new abbreviation up.
		const zones = new Map()

		elements.forEach((element) => {
			const timezone = element.dataset.localTime
			if (!timezone) return

			const formatter = formatterFor(timezone)
			if (!formatter) return

			if (!zones.has(timezone)) {
				const abbreviation = ABBREVIATIONS[timezone]
				zones.set(timezone, Array.isArray(abbreviation) ? abbreviation[isDaylight(formatter.offset, now) ? 1 : 0] : (abbreviation ?? fallbackZone(timezone, now)))
			}

			element.textContent = [formatter.clock.format(now), zones.get(timezone)].filter(Boolean).join(' ')
		})
	}

	render()
	window.setInterval(render, 30_000)
}
