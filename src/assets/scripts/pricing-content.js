export default function pricingContent() {
	const root = document.querySelector('[data-pricing]')
	if (!root) return

	const params = new URLSearchParams(location.search)
	const SEGMENT_DEFAULT = root.getAttribute('data-active-segment') || 'teams'
	const canVT = typeof document.startViewTransition === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches
	const radios = Array.from(root.querySelectorAll('input[name="segment"]'))
	const segmentOrder = radios.map((r) => r.value)
	const isSegment = (segment) => segmentOrder.includes(segment)
	// Locked pages have no radios, so map ?popular=/?recommended= positions off the root's declared order.
	const paramSegmentOrder = (root.dataset.segmentOrder || '').split(' ').filter(Boolean)

	// billing = contract length; cadence = yearly-upfront vs monthly instalments on an annual contract.
	let currency = 'GBP'
	let billing = 'annual'
	let cadence = 'yearly'

	const activeSegment = () => root.getAttribute('data-active-segment') || SEGMENT_DEFAULT

	const pill = root.querySelector('[data-segment-indicator]')
	function positionIndicator() {
		if (!pill) return
		const fs = pill.parentElement
		const input = fs.querySelector('input[name="segment"][value="' + activeSegment() + '"]')
		const label = input && input.closest('label')
		if (!label) return
		pill.style.width = label.offsetWidth + 'px'
		pill.style.height = label.offsetHeight + 'px'
		pill.style.transform = 'translate(' + label.offsetLeft + 'px, ' + label.offsetTop + 'px)'
	}

	// The default popular card for a segment is owned by the card itself (data-popular-in),
	// not the tab control. ?popular=/?recommended= can still override it.
	const defaultPopular = (segment) => root.querySelector('[data-product][data-popular-in~="' + segment + '"]')?.dataset.product ?? null

	// ?popular=/?recommended= are comma lists mapped to paramSegmentOrder positions; a trailing
	// segment with no value inherits the last one given. "none" opts out entirely; any other
	// missing or not-currently-visible value falls back to the card's declared default.
	function resolveTarget(param, visible, segment, fallback) {
		const list = (params.get(param) || '').split(',').map((s) => s.trim())
		const idx = paramSegmentOrder.indexOf(segment)
		const want = idx >= 0 && idx < list.length ? list[idx] : list[list.length - 1]
		if (want === 'none') return null
		return want && visible.includes(want) ? want : fallback
	}

	function applyPopular() {
		const segment = activeSegment()
		const visible = Array.from(root.querySelectorAll('[data-product][data-segments~="' + segment + '"]')).map((c) => c.dataset.product)
		const fallback = defaultPopular(segment)
		// ?popular= drives the badge; ?recommended= drives the highlight, defaulting to mirror
		// ?popular= until it's explicitly set (so a campaign page can highlight a different card).
		const pop = params.has('popular') ? resolveTarget('popular', visible, segment, fallback) : fallback
		const recommended = params.has('recommended') ? resolveTarget('recommended', visible, segment, fallback) : pop
		root.querySelectorAll('[data-product]').forEach((wrap) => {
			const card = wrap.querySelector('[data-card]')
			if (!card) return
			card.toggleAttribute('data-popular', wrap.dataset.product === pop)
			card.toggleAttribute('data-highlighted', wrap.dataset.product === recommended)
		})
	}

	function applySegment(segment) {
		root.setAttribute('data-active-segment', segment)
		const r = radios.find((r) => r.value === segment)
		if (r) r.checked = true
		applyPopular()
		positionIndicator()
	}

	// A card that's in both segments morphs between its slots; one that only
	// exists on one side slides in/out.
	function tagCards(cur, next) {
		root.querySelectorAll('[data-product][data-segments]').forEach((el) => {
			const segments = el.getAttribute('data-segments').split(' ')
			const persists = segments.includes(cur) && segments.includes(next)
			el.style.setProperty('view-transition-class', persists ? 'card-morph' : 'card-move')
		})
	}

	function setSegment(segment) {
		const cur = activeSegment()
		if (segment === cur || !isSegment(segment)) return
		if (!canVT) {
			applySegment(segment)
			return
		}
		const el = document.documentElement
		el.dataset.segmentDirection = segmentOrder.indexOf(segment) > segmentOrder.indexOf(cur) ? 'forward' : 'back'
		tagCards(cur, segment)
		const t = document.startViewTransition(() => applySegment(segment))
		t.finished.finally(() => delete el.dataset.segmentDirection)
	}

	radios.forEach((radio) => {
		radio.addEventListener('click', (e) => {
			if (radio.value === activeSegment()) return
			e.preventDefault()
			setSegment(radio.value)
		})
		radio.addEventListener('keyup', () => {
			if (radio.checked) setSegment(radio.value)
		})
	})

	// Suppress the pill's transition so it doesn't animate in on first paint.
	if (pill) pill.style.transition = 'none'
	const initSegment = params.get('segment')
	applySegment(initSegment && isSegment(initSegment) ? initSegment : activeSegment())
	requestAnimationFrame(() => {
		positionIndicator()
		if (pill) pill.style.transition = ''
	})
	addEventListener('resize', positionIndicator)

	// ── Billing + currency (priced plans only) ──────────────────────────────
	const rates = { GBP: { sym: '£', rate: 1 }, USD: { sym: '$', rate: 1.27 }, EUR: { sym: '€', rate: 1.17 } }
	const initCurrency = (params.get('currency') || '').toUpperCase()
	if (initCurrency in rates) currency = initCurrency
	const money = (gbp) => {
		const c = rates[currency]
		if (currency === 'GBP') return c.sym + (Number.isInteger(gbp) ? gbp : gbp.toFixed(2))
		return c.sym + Math.round(gbp * c.rate).toLocaleString('en-US')
	}
	function perMonthGbp(el) {
		if (billing !== 'annual') return parseFloat(el.dataset.monthlyGbp)
		return parseFloat(cadence === 'monthly' ? el.dataset.annualMonthlyGbp : el.dataset.annualGbp)
	}
	function refreshPrices() {
		root.querySelectorAll('[data-price]').forEach((el) => {
			const gbp = perMonthGbp(el)
			if (!isNaN(gbp)) el.textContent = money(gbp)
		})
		// "Was" price mirrors the current cadence so the discount stays accurate when toggled.
		root.querySelectorAll('[data-was]').forEach((el) => {
			let gbp = NaN
			if (billing === 'annual') gbp = parseFloat(cadence === 'monthly' ? el.dataset.wasMonthly : el.dataset.wasYearly)
			el.hidden = isNaN(gbp)
			if (!isNaN(gbp)) el.textContent = money(gbp)
		})
		root.querySelectorAll('[data-billing-note]').forEach((note) => {
			const annual = billing === 'annual'
			note.querySelector('[data-note-rolling]')?.toggleAttribute('hidden', annual)
			const ann = note.querySelector('[data-note-annual]')
			if (ann) ann.toggleAttribute('hidden', !annual)
			if (annual && ann) {
				const priceEl = note.closest('[data-product]')?.querySelector('[data-price]')
				const perMonth = priceEl ? perMonthGbp(priceEl) : NaN
				ann.querySelector('[data-year-total]').textContent = cadence === 'monthly' || isNaN(perMonth) ? '' : money(Math.round(perMonth * 12)) + ' '
				ann.querySelector('[data-cadence-label]').textContent = cadence === 'monthly' ? 'monthly' : 'yearly'
			}
		})
	}
	// Billing state is shared across all cards. Switches instantly (no slide) — sliding looked
	// jarring since the surrounding price/note elements update at the same time anyway.
	function syncBilling() {
		root.querySelectorAll('[data-billing]').forEach((b) => {
			const on = b.dataset.billing === billing
			b.classList.toggle('bg-background', on)
			b.classList.toggle('shadow', on)
		})
		root.querySelectorAll('[data-annual-pill]').forEach((el) => el.toggleAttribute('hidden', billing !== 'annual'))
	}
	root.querySelectorAll('[data-billing]').forEach((btn) => {
		btn.addEventListener('click', () => {
			billing = btn.dataset.billing
			syncBilling()
			refreshPrices()
		})
	})

	function syncCurrency() {
		root.querySelectorAll('[data-currency-option]').forEach((i) => {
			i.checked = i.value === currency
		})
		root.querySelectorAll('[data-currency-label]').forEach((el) => {
			el.textContent = currency
		})
	}
	root.querySelectorAll('[data-currency-option]').forEach((input) => {
		input.addEventListener('change', () => {
			if (!input.checked) return
			currency = input.value
			syncCurrency()
			refreshPrices()
			params.set('currency', currency)
			history.replaceState(null, '', '?' + params.toString() + location.hash)
			input.closest('[popover]')?.hidePopover()
		})
	})

	function syncCadence() {
		root.querySelectorAll('[data-cadence-option]').forEach((i) => {
			i.checked = i.value === cadence
		})
	}
	root.querySelectorAll('[data-cadence-option]').forEach((input) => {
		input.addEventListener('change', () => {
			if (!input.checked) return
			cadence = input.value
			syncCadence()
			refreshPrices()
			input.closest('[popover]')?.hidePopover()
		})
	})

	syncBilling()
	syncCurrency()
	syncCadence()
	refreshPrices()
}
