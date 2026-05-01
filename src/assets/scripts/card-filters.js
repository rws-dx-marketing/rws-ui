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
	const resultsCount = document.querySelector('[data-partners-results-count]')
	if (!resultsCount) return

	const suffix = visibleCount === 1 ? 'result' : 'results'
	resultsCount.textContent = `${visibleCount} ${suffix}`
}

function updateEmptyState(visibleCount) {
	const emptyState = document.querySelector('[data-card-empty-state]')
	if (!emptyState) return

	emptyState.hidden = visibleCount !== 0
}

export default function cardFilters() {
	const filtersRoot = document.querySelector('[data-filters]')
	const cards = Array.from(document.querySelectorAll('[data-card-filters]'))
	if (!filtersRoot || !cards.length) return

	const searchInput = document.querySelector('[data-filters-search], input[name="q"]')

	const applyFilters = () => {
		const selectedValuesByFilter = getSelectedValuesByFilter(filtersRoot)
		const searchQuery = searchInput instanceof HTMLInputElement ? searchInput.value.trim().toLowerCase() : ''
		let visibleCount = 0

		cards.forEach((card) => {
			const cardFilters = parseCardFilters(card)
			const visible = matchesFilters(cardFilters, selectedValuesByFilter) && matchesSearch(card, searchQuery)
			card.hidden = !visible
			if (visible) visibleCount += 1
		})

		updateResultsCount(visibleCount)
		updateEmptyState(visibleCount)
	}

	filtersRoot.querySelectorAll('[data-filter-input]').forEach((input) => {
		input.addEventListener('change', applyFilters)
	})

	if (searchInput instanceof HTMLInputElement) {
		let debounceId = null
		searchInput.addEventListener('input', () => {
			window.clearTimeout(debounceId)
			debounceId = window.setTimeout(applyFilters, 150)
		})
		searchInput.addEventListener('change', applyFilters)
	}

	window.addEventListener('popstate', () => {
		window.setTimeout(applyFilters, 0)
	})

	applyFilters()
}
