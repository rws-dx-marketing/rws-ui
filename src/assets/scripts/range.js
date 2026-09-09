// Keeps --range-progress on every .input-range in step with its value, so the
// track can paint the filled portion (see _inputs.css). Inputs added later are
// picked up by the observer. Setting `.value` from script fires no event, so a
// script that does that after load calls syncRange itself.
export function syncRange(input) {
	const min = parseFloat(input.min) || 0
	const max = parseFloat(input.max) || 100
	const p = ((parseFloat(input.value) - min) / (max - min)) * 100
	input.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, p))}%`)
}

export default function range() {
	if (typeof window === 'undefined') return

	const sync = syncRange
	const syncAll = (root) => root.querySelectorAll?.('.input-range').forEach(sync)

	syncAll(document)
	document.addEventListener('input', (e) => e.target.matches?.('.input-range') && sync(e.target))
	new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(syncAll))).observe(document.body, { childList: true, subtree: true })
}
