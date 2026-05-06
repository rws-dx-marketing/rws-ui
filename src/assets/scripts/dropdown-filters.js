function getInputLabel(input) {
	const label = input.dataset.dropdownLabel
	if (label) return label.trim()

	const wrappedLabel = input.closest('label')
	if (wrappedLabel) {
		const labelClone = wrappedLabel.cloneNode(true)
		if (labelClone instanceof Element) {
			labelClone.querySelectorAll('input,select,textarea,button,svg').forEach((node) => node.remove())
			const wrappedLabelText = labelClone.textContent?.trim()
			if (wrappedLabelText) return wrappedLabelText
		}
	}

	if (!input.id) return ''

	const inputLabel = document.querySelector(`label[for="${input.id}"]`)
	return inputLabel?.childNodes?.[0]?.textContent?.trim() ?? inputLabel?.textContent?.trim() ?? ''
}

function getClearAllButton(selectionRow) {
	return selectionRow.querySelector('[data-filters-clear-all]')
}

function getChipTemplate(selectionRow) {
	return selectionRow.querySelector('[data-filters-chip-template]')
}

function getFilterClearControl(filter) {
	return filter.querySelector('[data-filter-clear]')
}

function getFilterClearButton(filter) {
	const clearControl = getFilterClearControl(filter)
	if (!clearControl) return null

	if (clearControl instanceof HTMLButtonElement) return clearControl
	return clearControl.querySelector('button')
}

function getSelectedInputs(filter) {
	return Array.from(filter.querySelectorAll('[data-filter-input]:checked'))
}

function getSearchInput(root) {
	const form = root.closest('form')
	if (!form) return null
	return form.querySelector('[data-filters-search]') ?? form.querySelector('input[name="q"]')
}

function getSearchControls(root) {
	const form = root.closest('form')
	if (!form) return { searchIcon: null, clearButton: null }

	return {
		searchIcon: form.querySelector('[data-search-icon]'),
		clearButton: form.querySelector('[data-search-clear]'),
	}
}

function updateSearchControls(searchInput, searchIcon, clearButton) {
	if (!(searchInput instanceof HTMLInputElement)) return

	const hasSearchValue = searchInput.value.trim().length > 0
	if (searchIcon instanceof Element) {
		searchIcon.hidden = hasSearchValue
	}

	if (clearButton instanceof Element) {
		clearButton.hidden = !hasSearchValue
	}
}

function getManagedFilterIds(root) {
	const filters = Array.from(root.querySelectorAll('[data-filter]'))
	return filters.map((filter) => filter.dataset.filterId).filter(Boolean)
}

function getSelectInitialValue(select) {
	const defaultOption = Array.from(select.options).find((option) => option.defaultSelected)
	if (defaultOption) return defaultOption.value
	return select.options[0]?.value ?? ''
}

function getPersistedSelects(root) {
	// These controls live outside the filters form on the partners page.
	return Array.from(document.querySelectorAll('select[name="sort-by"], select[name="items-per-page"]'))
		.filter((control) => control instanceof HTMLSelectElement)
		.map((select) => ({
			select,
			initialValue: getSelectInitialValue(select),
		}))
}

function syncFormStateToUrl(root, searchInput, persistedSelects) {
	if (typeof window === 'undefined') return

	const url = new URL(window.location.href)
	const managedFilterIds = getManagedFilterIds(root)

	url.searchParams.delete('q')
	persistedSelects.forEach(({ select }) => {
		url.searchParams.delete(select.name)
	})
	managedFilterIds.forEach((filterId) => {
		url.searchParams.delete(filterId)
	})

	const searchValue = searchInput instanceof HTMLInputElement ? searchInput.value.trim() : ''
	if (searchValue) {
		url.searchParams.set('q', searchValue)
	}

	persistedSelects.forEach(({ select, initialValue }) => {
		if (!select.name || !select.value) return
		if (select.value === initialValue) return
		url.searchParams.set(select.name, select.value)
	})

	const filters = root.querySelectorAll('[data-filter]')
	filters.forEach((filter) => {
		const filterId = filter.dataset.filterId
		if (!filterId) return
		getSelectedInputs(filter).forEach((input) => {
			url.searchParams.append(filterId, input.value)
		})
	})

	const nextQuery = url.searchParams.toString()
	const nextUrl = `${url.pathname}${nextQuery ? `?${nextQuery}` : ''}${url.hash}`
	const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
	if (nextUrl !== currentUrl) {
		window.history.replaceState(window.history.state, '', nextUrl)
	}
}

function applyUrlStateToForm(root, searchInput, persistedSelects) {
	if (typeof window === 'undefined') return

	const params = new URLSearchParams(window.location.search)
	if (searchInput instanceof HTMLInputElement) {
		searchInput.value = params.get('q') ?? ''
	}

	persistedSelects.forEach(({ select, initialValue }) => {
		if (!select.name) return
		const valueFromUrl = params.get(select.name)
		if (!valueFromUrl) {
			select.value = initialValue
			return
		}

		const optionExists = Array.from(select.options).some((option) => option.value === valueFromUrl)
		if (optionExists) {
			select.value = valueFromUrl
			return
		}

		select.value = initialValue
	})

	const filters = root.querySelectorAll('[data-filter]')
	filters.forEach((filter) => {
		const filterId = filter.dataset.filterId
		if (!filterId) return

		const selectedValues = new Set(params.getAll(filterId))
		const inputs = filter.querySelectorAll('[data-filter-input]')
		inputs.forEach((input) => {
			input.checked = selectedValues.has(input.value)
		})
	})
}

function getSelectionKey(input) {
	const filter = input.closest('[data-filter]')
	const filterId = filter?.dataset.filterId ?? 'filter'
	const value = input.value || input.id || getInputLabel(input)
	return `${filterId}::${value}`
}

function updateCountBadge(filter) {
	const count = getSelectedInputs(filter).length
	const countBadge = filter.querySelector('[data-filter-count]')
	if (!countBadge) return

	countBadge.textContent = String(count)
	countBadge.hidden = count === 0

	const clearControl = getFilterClearControl(filter)
	if (clearControl) {
		clearControl.hidden = count === 0
	}

	const clearButton = getFilterClearButton(filter)
	if (clearButton instanceof HTMLButtonElement) {
		clearButton.disabled = count === 0
	}
}

function updateClearAllButtonState(selectionRow) {
	const clearAllButton = getClearAllButton(selectionRow)
	if (!(clearAllButton instanceof HTMLButtonElement)) return

	const selectedCount = selectionRow.querySelectorAll('[data-selection-key]').length
	const hasSelections = selectedCount > 0
	selectionRow.hidden = !hasSelections
	clearAllButton.disabled = !hasSelections
	selectionRow.append(clearAllButton)
}

function removeSelectionChip(selectionRow, key) {
	const chip = selectionRow.querySelector(`[data-selection-key="${CSS.escape(key)}"]`)
	if (chip) chip.remove()
}

function addSelectionChip(selectionRow, input) {
	const key = getSelectionKey(input)
	const existingChip = selectionRow.querySelector(`[data-selection-key="${CSS.escape(key)}"]`)
	if (existingChip instanceof HTMLButtonElement) {
		existingChip.dataset.selectionInputId = input.id
		const existingLabelTarget = existingChip.querySelector('[data-filters-chip-label]')
		if (existingLabelTarget) {
			existingLabelTarget.textContent = getInputLabel(input)
		}
		return
	}

	const label = getInputLabel(input)
	if (!label) return

	const chipTemplate = getChipTemplate(selectionRow)
	const button = chipTemplate?.cloneNode(true)
	if (!(button instanceof HTMLButtonElement)) return

	button.dataset.selectionKey = key
	button.dataset.selectionInputId = input.id
	delete button.dataset.filtersChipTemplate
	button.hidden = false

	const labelTarget = button.querySelector('[data-filters-chip-label]')
	if (labelTarget) {
		labelTarget.textContent = label
	}

	const clearAllButton = getClearAllButton(selectionRow)
	if (clearAllButton) {
		selectionRow.insertBefore(button, clearAllButton)
		return
	}

	selectionRow.append(button)
}

function syncFilterChips(selectionRow, filter) {
	const inputs = filter.querySelectorAll('[data-filter-input]')
	inputs.forEach((input) => {
		const key = getSelectionKey(input)
		if (input.checked) {
			addSelectionChip(selectionRow, input)
			return
		}

		removeSelectionChip(selectionRow, key)
	})

	updateCountBadge(filter)
	updateClearAllButtonState(selectionRow)
}

function clearCheckedInputs(inputs) {
	inputs.forEach((input) => {
		input.checked = false
		input.dispatchEvent(new Event('change', { bubbles: true }))
	})
}

function setupFilter(filter, selectionRow, onStateChange) {
	const inputs = filter.querySelectorAll('[data-filter-input]')
	if (!inputs.length) return

	syncFilterChips(selectionRow, filter)

	inputs.forEach((input) => {
		input.addEventListener('change', () => {
			syncFilterChips(selectionRow, filter)
			if (typeof onStateChange === 'function') {
				onStateChange()
			}
		})
	})

	const clearControl = getFilterClearControl(filter)
	if (!clearControl) return

	clearControl.addEventListener('click', (event) => {
		const target = event.target
		if (!(target instanceof Element)) return

		const clearButton = getFilterClearButton(filter)
		if (clearButton && !target.closest('button')) return

		const checkedInputs = getSelectedInputs(filter)
		clearCheckedInputs(checkedInputs)
	})
}

function setupSelectionRow(root, selectionRow) {
	selectionRow.addEventListener('click', (event) => {
		const target = event.target
		if (!(target instanceof Element)) return

		const clearAllButton = target.closest('button[data-filters-clear-all]')
		if (clearAllButton) {
			const checkedInputs = root.querySelectorAll('[data-filter-input]:checked')
			clearCheckedInputs(Array.from(checkedInputs))
			return
		}

		const button = target.closest('button[data-selection-input-id]')
		if (!button) return

		const inputId = button.dataset.selectionInputId
		if (!inputId) return

		const input = root.querySelector(`#${CSS.escape(inputId)}`)
		if (!(input instanceof HTMLInputElement)) {
			button.remove()
			updateClearAllButtonState(selectionRow)
			return
		}

		input.checked = false
		input.dispatchEvent(new Event('change', { bubbles: true }))
	})
}

function hasHiddenAncestor(element) {
	let current = element.parentElement
	while (current) {
		if (current.hasAttribute('hidden')) return true
		current = current.parentElement
	}
	return false
}

function findSelectionRow(root) {
	const localSelectionRow = root.parentElement?.querySelector('[data-filters-selected]')
	if (localSelectionRow && !hasHiddenAncestor(localSelectionRow)) {
		return localSelectionRow
	}

	const formSelectionRow = root.closest('form')?.querySelector('[data-filters-selected]')
	if (formSelectionRow && !hasHiddenAncestor(formSelectionRow)) {
		return formSelectionRow
	}

	const visibleSelectionRows = Array.from(document.querySelectorAll('[data-filters-selected]')).filter((row) => !hasHiddenAncestor(row))
	return visibleSelectionRows[0] ?? null
}

function updatePopoverToggleButtonIcon(button, popover) {
	const isOpen = popover.matches(':popover-open')
	const closedIcon = button.querySelector('[data-icon-closed]')
	const openIcon = button.querySelector('[data-icon-open]')

	button.dataset.popoverOpen = String(isOpen)
	if (closedIcon instanceof Element) {
		closedIcon.toggleAttribute('hidden', isOpen)
	}
	if (openIcon instanceof Element) {
		openIcon.toggleAttribute('hidden', !isOpen)
	}
}

function setupPopoverToggleButton(button) {
	const popoverId = button.getAttribute('popovertarget')
	if (!popoverId) return

	const popover = document.getElementById(popoverId)
	if (!(popover instanceof HTMLElement)) return

	updatePopoverToggleButtonIcon(button, popover)
	popover.addEventListener('toggle', () => {
		updatePopoverToggleButtonIcon(button, popover)
	})
}

export default function dropdownFilters() {
	const popoverToggleButtons = document.querySelectorAll('[data-popover-toggle-icon]')
	popoverToggleButtons.forEach((button) => setupPopoverToggleButton(button))

	const roots = document.querySelectorAll('[data-filters]')
	roots.forEach((root) => {
		if (hasHiddenAncestor(root)) return

		const selectionRow = findSelectionRow(root)
		if (!selectionRow) return

		const searchInput = getSearchInput(root)
		const { searchIcon, clearButton } = getSearchControls(root)
		const persistedSelects = getPersistedSelects(root)
		const syncUrl = () => syncFormStateToUrl(root, searchInput, persistedSelects)
		applyUrlStateToForm(root, searchInput, persistedSelects)

		setupSelectionRow(root, selectionRow)
		const filters = root.querySelectorAll('[data-filter]')
		filters.forEach((filter) => setupFilter(filter, selectionRow, syncUrl))
		persistedSelects.forEach(({ select }) => {
			select.addEventListener('change', syncUrl)
		})

		if (searchInput instanceof HTMLInputElement) {
			updateSearchControls(searchInput, searchIcon, clearButton)

			let searchDebounceId = null
			searchInput.addEventListener('input', () => {
				window.clearTimeout(searchDebounceId)
				searchDebounceId = window.setTimeout(() => {
					syncUrl()
				}, 150)
				updateSearchControls(searchInput, searchIcon, clearButton)
			})
			searchInput.addEventListener('change', () => {
				syncUrl()
				updateSearchControls(searchInput, searchIcon, clearButton)
			})

			if (clearButton instanceof HTMLButtonElement) {
				const clearSearch = (shouldPreserveFocus) => {
					searchInput.value = ''
					searchInput.dispatchEvent(new Event('input', { bubbles: true }))
					searchInput.dispatchEvent(new Event('change', { bubbles: true }))
					if (shouldPreserveFocus) {
						searchInput.focus({ preventScroll: true })
					}
				}

				let clearedViaMouseDown = false
				clearButton.addEventListener('mousedown', (event) => {
					const shouldPreserveFocus = document.activeElement === searchInput
					event.preventDefault()
					event.stopPropagation()
					clearedViaMouseDown = true
					clearSearch(shouldPreserveFocus)
				})

				clearButton.addEventListener('click', (event) => {
					// Mouse users are handled on mousedown to avoid focus flicker.
					if (clearedViaMouseDown) {
						clearedViaMouseDown = false
						return
					}

					event.preventDefault()
					const shouldPreserveFocus = document.activeElement === searchInput
					clearSearch(shouldPreserveFocus)
				})
			}

			const form = root.closest('form')
			if (form) {
				form.addEventListener('submit', (event) => {
					event.preventDefault()
					syncUrl()
				})
			}
		}

		window.addEventListener('popstate', () => {
			applyUrlStateToForm(root, searchInput, persistedSelects)
			filters.forEach((filter) => syncFilterChips(selectionRow, filter))
			updateSearchControls(searchInput, searchIcon, clearButton)
		})

		syncUrl()
	})
}
