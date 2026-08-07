// The pricing page's own concerns: which card is flagged, and the currency /
// contract / cadence controls. Nothing here knows about tabs — it anchors on the
// pricing markup itself, so the page can sit in the shared tabs component, in an
// accordion, or on its own and behave identically. (Tab switching and ?tab= deep
// links are tabs.js; the panels only matter here as a way to group cards.)
export default function pricingRefactor() {
	const products = Array.from(document.querySelectorAll('[data-product]'))
	if (!products.length) return

	const params = new URLSearchParams(location.search)

	// ── Popular / recommended card ──────────────────────────────────────────
	// ?popular=/?recommended= are comma lists mapped to the card groups in
	// document order; a trailing group with no value inherits the last one given.
	// "none" opts out entirely; any other missing or unknown value falls back to
	// whichever card the markup already flags.
	if (params.has('popular') || params.has('recommended')) {
		// One group per tab panel — or a single group when there are no panels,
		// since a card outside one has no closest() match and lands under `null`.
		const groups = new Map()
		products.forEach((wrap) => {
			const key = wrap.closest('[data-tab-panel]')
			if (!groups.has(key)) groups.set(key, [])
			groups.get(key).push(wrap)
		})

		const resolve = (param, available, index, fallback) => {
			const list = (params.get(param) || '').split(',').map((v) => v.trim())
			const want = index < list.length ? list[index] : list[list.length - 1]
			if (want === 'none') return null
			return available.includes(want) ? want : fallback
		}

		Array.from(groups.values()).forEach((wraps, index) => {
			const available = wraps.map((w) => w.dataset.product)
			// Read the default before anything is toggled, so it survives the rewrite.
			const fallback = wraps.find((w) => w.querySelector('[data-card][data-popular]'))?.dataset.product ?? null
			const popular = resolve('popular', available, index, fallback)
			const recommended = params.has('recommended') ? resolve('recommended', available, index, fallback) : popular
			wraps.forEach((wrap) => {
				const card = wrap.querySelector('[data-card]')
				if (!card) return
				card.toggleAttribute('data-popular', wrap.dataset.product === popular)
				card.toggleAttribute('data-highlighted', wrap.dataset.product === recommended)
			})
		})
	}

	// ── Pricing controls ────────────────────────────────────────────────────
	// billing = contract length; cadence = yearly-upfront vs monthly instalments on an annual contract.
	let currency = 'GBP'
	let billing = 'annual'
	let cadence = 'yearly'

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
		document.querySelectorAll('[data-price]').forEach((el) => {
			const gbp = perMonthGbp(el)
			if (!isNaN(gbp)) el.textContent = money(gbp)
		})
		// "Was" price mirrors the current cadence so the discount stays accurate when toggled.
		document.querySelectorAll('[data-was]').forEach((el) => {
			let gbp = NaN
			if (billing === 'annual') gbp = parseFloat(cadence === 'monthly' ? el.dataset.wasMonthly : el.dataset.wasYearly)
			el.hidden = isNaN(gbp)
			if (!isNaN(gbp)) el.textContent = money(gbp)
		})
		document.querySelectorAll('[data-billing-note]').forEach((note) => {
			const annual = billing === 'annual'
			note.querySelector('[data-note-rolling]')?.toggleAttribute('hidden', annual)
			const ann = note.querySelector('[data-note-annual]')
			if (!ann) return
			ann.toggleAttribute('hidden', !annual)
			if (!annual) return
			const priceEl = note.closest('[data-product]')?.querySelector('[data-price]')
			const perMonth = priceEl ? perMonthGbp(priceEl) : NaN
			ann.querySelector('[data-year-total]').textContent = cadence === 'monthly' || isNaN(perMonth) ? '' : money(Math.round(perMonth * 12)) + ' '
			ann.querySelector('[data-cadence-label]').textContent = cadence === 'monthly' ? 'monthly' : 'yearly'
		})
	}

	function syncBilling() {
		document.querySelectorAll('[data-billing]').forEach((b) => {
			const on = b.dataset.billing === billing
			b.classList.toggle('bg-background', on)
			b.classList.toggle('shadow', on)
		})
		document.querySelectorAll('[data-annual-pill]').forEach((el) => el.toggleAttribute('hidden', billing !== 'annual'))
	}
	document.querySelectorAll('[data-billing]').forEach((btn) => {
		btn.addEventListener('click', () => {
			billing = btn.dataset.billing
			syncBilling()
			refreshPrices()
		})
	})

	function syncCurrency() {
		document.querySelectorAll('[data-currency-option]').forEach((i) => {
			i.checked = i.value === currency
		})
		document.querySelectorAll('[data-currency-label]').forEach((el) => {
			el.textContent = currency
		})
	}
	document.querySelectorAll('[data-currency-option]').forEach((input) => {
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
		document.querySelectorAll('[data-cadence-option]').forEach((i) => {
			i.checked = i.value === cadence
		})
	}
	document.querySelectorAll('[data-cadence-option]').forEach((input) => {
		input.addEventListener('change', () => {
			if (!input.checked) return
			cadence = input.value
			syncCadence()
			refreshPrices()
			input.closest('[popover]')?.hidePopover()
		})
	})

	// ── Init ────────────────────────────────────────────────────────────────
	syncBilling()
	syncCurrency()
	syncCadence()
	refreshPrices()
}
