// Timezone formatting for the event detail page, shared by the build (event.astro
// frontmatter renders the default view) and the client picker (timezone-select.js
// reconverts on selection) so the two never drift.
//
// Event wall-clock times are authored in the event's own zone (its source offset,
// passed in). They render in that same zone by default; the picker reconverts them
// to any fixed GMT offset. Offsets are fixed GMT minutes (not DST/IANA aware) to
// match the legacy site's picker list.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// "2026-09-14T08:30" (wall time in the source zone) → true UTC milliseconds.
export function wallToUTC(wall, sourceOffset) {
	const [date, time] = wall.split('T')
	const [y, mo, d] = date.split('-').map(Number)
	const [h, mi] = time.split(':').map(Number)
	return Date.UTC(y, mo - 1, d, h, mi) - sourceOffset * 60000
}

export function gmtLabel(offset) {
	if (offset === 0) return 'GMT'
	const sign = offset > 0 ? '+' : '-'
	const abs = Math.abs(offset)
	return `GMT${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

function clock(date) {
	let hours = date.getUTCHours()
	const minutes = date.getUTCMinutes()
	const meridiem = hours >= 12 ? 'pm' : 'am'
	hours = hours % 12 || 12
	return { text: `${hours}:${String(minutes).padStart(2, '0')}`, meridiem }
}

// "9:00 am – 6:30 pm" — collapses a shared meridiem the way the source strings do.
function timeRange(startUTC, endUTC, offset) {
	const s = clock(new Date(startUTC + offset * 60000))
	const e = clock(new Date(endUTC + offset * 60000))
	return s.meridiem === e.meridiem ? `${s.text} – ${e.text} ${e.meridiem}` : `${s.text} ${s.meridiem} – ${e.text} ${e.meridiem}`
}

// "9:00 am – 6:30 pm EDT" — sidebar Time row. `label` names the zone (e.g. the
// event's own "EDT"); when omitted the GMT offset is used, as for picker choices.
export function formatDetail(startUTC, endUTC, offset, label) {
	return `${timeRange(startUTC, endUTC, offset)} ${label ?? gmtLabel(offset)}`
}

// "9:00 am – 6:30 pm" — hero Time chip, whose zone sits in the picker segment beside it.
export function formatTime(startUTC, endUTC, offset) {
	return timeRange(startUTC, endUTC, offset)
}

// "14 Sep · 8:30 – 9:30 am" — agenda rows.
export function formatAgenda(startUTC, endUTC, offset) {
	const start = new Date(startUTC + offset * 60000)
	return `${start.getUTCDate()} ${MONTHS_SHORT[start.getUTCMonth()]} · ${timeRange(startUTC, endUTC, offset)}`
}

// "14–16 September 2026" — sidebar Date row. Widens to spell months/years when a
// timezone shift pushes the span across a boundary.
export function formatDateRange(startUTC, endUTC, offset) {
	const s = new Date(startUTC + offset * 60000)
	const e = new Date(endUTC + offset * 60000)
	const [sd, sm, sy] = [s.getUTCDate(), s.getUTCMonth(), s.getUTCFullYear()]
	const [ed, em, ey] = [e.getUTCDate(), e.getUTCMonth(), e.getUTCFullYear()]

	if (sm === em && sy === ey) return `${sd}–${ed} ${MONTHS_LONG[sm]} ${sy}`
	if (sy === ey) return `${sd} ${MONTHS_SHORT[sm]} – ${ed} ${MONTHS_SHORT[em]} ${sy}`
	return `${sd} ${MONTHS_SHORT[sm]} ${sy} – ${ed} ${MONTHS_SHORT[em]} ${ey}`
}

export const FORMATTERS = { time: formatTime, detail: formatDetail, agenda: formatAgenda, date: formatDateRange }
