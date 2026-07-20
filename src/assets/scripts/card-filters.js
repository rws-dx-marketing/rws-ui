function getSelectedValuesByFilter(filtersRoot) {
	const selectedValuesByFilter = new Map()
	const filters = filtersRoot.querySelectorAll('[data-filter]')

	filters.forEach((filter) => {
		const filterId = filter.dataset.filterId
		if (!filterId) return

		const selectedValues = Array.from(filter.querySelectorAll('[data-filter-input]:checked')).map((input) => input.value)
		selectedValuesByFilter.set(filterId, selectedValues)
	})

	return selectedValuesByFilter
}

function parseCardFilters(card) {
	const raw = card.dataset.cardFilters
	if (!raw) return {}

	try {
		const parsed = JSON.parse(raw)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch {
		return {}
	}
}

function matchesFilters(cardFilters, selectedValuesByFilter) {
	for (const [filterId, selectedValues] of selectedValuesByFilter.entries()) {
		if (!selectedValues.length) continue

		const cardValues = Array.isArray(cardFilters[filterId]) ? cardFilters[filterId] : []
		const hasMatch = selectedValues.some((value) => cardValues.includes(value))
		if (!hasMatch) return false
	}

	return true
}

function matchesSearch(card, query) {
	if (!query) return true
	const searchTarget = card.dataset.cardSearch ?? card.textContent ?? ''
	return searchTarget.toLowerCase().includes(query)
}

function updateResultsCount(visibleCount) {
	const resultsCount = document.querySelector('[data-card-results-count]')
	if (!resultsCount) return

	const suffix = visibleCount === 1 ? 'result' : 'results'
	resultsCount.textContent = `${visibleCount} ${suffix}`
}

function updateEmptyState(visibleCount) {
	const emptyState = document.querySelector('[data-card-empty-state]')
	if (!emptyState) return

	emptyState.hidden = visibleCount !== 0
}

function getPageSize(pageSizeSelect) {
	if (!(pageSizeSelect instanceof HTMLSelectElement)) return null
	const parsedSize = Number.parseInt(pageSizeSelect.value, 10)
	return Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null
}

function updateLoadMoreButton(loadMoreButton, visibleLimit, totalMatchingCards) {
	if (!(loadMoreButton instanceof HTMLButtonElement)) return
	const canLoadMore = totalMatchingCards > visibleLimit
	loadMoreButton.hidden = !canLoadMore
	loadMoreButton.disabled = !canLoadMore
}

export default function cardFilters() {
	const filtersRoot = document.querySelector('[data-filters]')
	const cards = Array.from(document.querySelectorAll('[data-card-filters]'))
	if (!filtersRoot || !cards.length) return

	const searchInput = document.querySelector('[data-filters-search], input[name="q"]')
	const pageSizeSelect = document.querySelector('[data-card-page-size]')
	const loadMoreButton = document.querySelector('[data-card-load-more]')
	let currentPageSize = getPageSize(pageSizeSelect)
	let visibleLimit = currentPageSize ?? Number.POSITIVE_INFINITY

	// Segment toggle (e.g. upcoming / recorded). It's a single-select control that
	// behaves like a filter: we inject its value as a required `status` filter so
	// only cards tagged with the active segment show. Deliberately not synced to the
	// URL — switching segment just updates the pills and cards in place.
	// The active value is tracked here (not read from :checked) so keyboard selection
	// doesn't race the view transition — same reasoning as pricing-content.js.
	const segmentInputs = Array.from(document.querySelectorAll('[data-segment-input]'))
	const segmentIndicator = document.querySelector('[data-segment-indicator]')
	const defaultSegment = segmentInputs.find((input) => input.defaultChecked)?.value ?? segmentInputs[0]?.value ?? null
	const segmentOrder = segmentInputs.map((input) => input.value)
	const canVT = typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
	let activeSegment = defaultSegment

	const getActiveSegment = () => activeSegment

	// Slide the pill to the active label. Measured in JS (not pure CSS) so it stays
	// aligned regardless of the two labels' differing widths.
	const positionIndicator = () => {
		if (!segmentIndicator) return
		const label = segmentInputs.find((input) => input.value === activeSegment)?.closest('label')
		if (!label) return
		segmentIndicator.style.width = `${label.offsetWidth}px`
		segmentIndicator.style.height = `${label.offsetHeight}px`
		segmentIndicator.style.transform = `translate(${label.offsetLeft}px, ${label.offsetTop}px)`
	}

	// Commit a segment change and, unless reduced-motion, run it inside a view
	// transition so the outgoing cards slide off and the incoming ones slide in.
	// Reuses the .card-move keyframes + [data-segment-direction] rules from
	// _pricing-content.css (global) — every events card is a card-move since none
	// exists in both segments.
	const setSegment = (value) => {
		if (value === activeSegment || !segmentOrder.includes(value)) return
		const input = segmentInputs.find((item) => item.value === value)
		if (!input) return

		const commit = () => {
			input.checked = true
			activeSegment = value
			positionIndicator()
			applyFilters({ resetVisibleLimit: true })
		}

		if (!canVT) {
			commit()
			return
		}

		const root = document.documentElement
		root.dataset.segmentDirection = segmentOrder.indexOf(value) > segmentOrder.indexOf(activeSegment) ? 'forward' : 'back'
		const transition = document.startViewTransition(commit)
		transition.finished.finally(() => delete root.dataset.segmentDirection)
	}

	const applyFilters = ({ resetVisibleLimit = false } = {}) => {
		currentPageSize = getPageSize(pageSizeSelect)
		if (resetVisibleLimit) {
			visibleLimit = currentPageSize ?? Number.POSITIVE_INFINITY
		}

		const selectedValuesByFilter = getSelectedValuesByFilter(filtersRoot)
		if (activeSegment) {
			selectedValuesByFilter.set('status', [activeSegment])
		}
		const searchQuery = searchInput instanceof HTMLInputElement ? searchInput.value.trim().toLowerCase() : ''
		const matchingCards = []

		cards.forEach((card) => {
			const cardFilters = parseCardFilters(card)
			const matches = matchesFilters(cardFilters, selectedValuesByFilter) && matchesSearch(card, searchQuery)
			if (matches) {
				matchingCards.push(card)
				return
			}

			card.hidden = true
		})

		matchingCards.forEach((card, index) => {
			const isWithinVisibleLimit = index < visibleLimit
			card.hidden = !isWithinVisibleLimit
		})

		updateResultsCount(matchingCards.length)
		updateEmptyState(matchingCards.length)
		updateLoadMoreButton(loadMoreButton, visibleLimit, matchingCards.length)
	}

	filtersRoot.querySelectorAll('[data-filter-input]').forEach((input) => {
		input.addEventListener('change', () => applyFilters({ resetVisibleLimit: true }))
	})

	segmentInputs.forEach((input) => {
		// Intercept the click so the native check doesn't change the DOM before the
		// view transition captures the outgoing state.
		input.addEventListener('click', (event) => {
			if (input.value === activeSegment) return
			event.preventDefault()
			setSegment(input.value)
		})
		input.addEventListener('keyup', () => {
			if (input.value !== activeSegment) setSegment(input.value)
		})
	})

	if (searchInput instanceof HTMLInputElement) {
		let debounceId = null
		searchInput.addEventListener('input', () => {
			window.clearTimeout(debounceId)
			debounceId = window.setTimeout(() => applyFilters({ resetVisibleLimit: true }), 150)
		})
		searchInput.addEventListener('change', () => applyFilters({ resetVisibleLimit: true }))
	}

	if (pageSizeSelect instanceof HTMLSelectElement) {
		pageSizeSelect.addEventListener('change', () => {
			applyFilters({ resetVisibleLimit: true })
		})
	}

	if (loadMoreButton instanceof HTMLButtonElement) {
		loadMoreButton.addEventListener('click', () => {
			if (currentPageSize === null) return
			visibleLimit += currentPageSize
			applyFilters()
		})
	}

	window.addEventListener('popstate', () => {
		window.setTimeout(() => {
			positionIndicator()
			applyFilters({ resetVisibleLimit: true })
		}, 0)
	})

	applyFilters({ resetVisibleLimit: true })

	// Position the pill without animating it in from 0×0 on first paint.
	if (segmentIndicator) {
		segmentIndicator.style.transition = 'none'
		positionIndicator()
		requestAnimationFrame(() => {
			segmentIndicator.style.transition = ''
		})
		window.addEventListener('resize', positionIndicator)
	}
}
