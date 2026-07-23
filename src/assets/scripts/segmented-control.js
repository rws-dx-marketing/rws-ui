import { canViewTransition } from './motion'

// Shared orchestration for the animated radio "segmented control" pill used by
// the tab switcher, the pricing audience segments and the events segment toggle.
//
// Each caller keeps its own `position()` (the pill measurement differs between
// horizontal tabs and both-axis toggles) and `apply()` (the DOM update differs).
// This centralises the parts that were copy-pasted three times: the radio
// click/keyup wiring, the view-transition + `[data-*Direction]` dance, and the
// first-paint transition suppression.
//
// Options:
//   inputs        — the radio inputs (in DOM order)
//   indicator     — the sliding pill element (may be null)
//   directionAttr — documentElement dataset key set to 'forward' | 'back'
//   getActive     — () => current active value
//   apply         — (value) => void, performs the DOM update (also repositions)
//   position      — () => void, positions the pill for the active value
//   order         — optional explicit value order (defaults to inputs' values)
//   prepare       — optional (cur, next) => (restoreFn | void), run before the
//                   transition; any returned fn runs once the new state is captured
//   init          — optional first-paint work run under transition suppression
//                   (defaults to position); use it to apply an initial value
export function segmentedControl({ inputs, indicator, directionAttr, getActive, apply, position, order, prepare, init }) {
	const values = order ?? inputs.map((i) => i.value)

	function setActive(value) {
		const cur = getActive()
		if (value === cur || !values.includes(value)) return
		if (!canViewTransition()) {
			apply(value)
			return
		}
		const el = document.documentElement
		el.dataset[directionAttr] = values.indexOf(value) > values.indexOf(cur) ? 'forward' : 'back'
		const restore = prepare && prepare(cur, value)
		const t = document.startViewTransition(() => apply(value))
		// Restore as soon as the new state is captured (not after the animation
		// finishes) so a quick click on another control mid-transition still works.
		if (restore) t.ready.finally(restore)
		t.finished.finally(() => delete el.dataset[directionAttr])
	}

	inputs.forEach((input) => {
		// Intercept the click so the native check doesn't change the DOM before the
		// view transition captures the outgoing state.
		input.addEventListener('click', (e) => {
			if (input.value === getActive()) return
			e.preventDefault()
			setActive(input.value)
		})
		input.addEventListener('keyup', () => {
			if (input.checked) setActive(input.value)
		})
	})

	// Suppress the pill's transition so it doesn't animate in from 0×0 on first
	// paint. Position it once now (while transitions are off) and again next frame
	// before re-enabling — re-enabling in the same tick as the first real size
	// change would still animate from the CSS default. `init`/`position` run even
	// without an indicator (a locked pricing page has no pill but still needs its
	// initial apply); only the transition suppression is gated on the pill.
	if (indicator) indicator.style.transition = 'none'
	;(init ?? position)()
	requestAnimationFrame(() => {
		position()
		if (indicator) indicator.style.transition = ''
	})
	addEventListener('resize', position)

	return { setActive, position }
}
