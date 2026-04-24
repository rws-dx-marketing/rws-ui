function getCheckedInputs(dropdown) {
	return Array.from(dropdown.querySelectorAll('[data-dropdown-input]:checked'))
}

function getInputLabel(input) {
	const label = dropdownLabelFromAttribute(input) ?? dropdownLabelFromLabelTag(input)
	return label?.trim() ?? ''
}

function dropdownLabelFromAttribute(input) {
	return input.dataset.dropdownLabel
}

function dropdownLabelFromLabelTag(input) {
	const label = input.id ? document.querySelector(`label[for="${input.id}"]`) : null
	return label?.childNodes?.[0]?.textContent ?? label?.textContent
}

function getButtonLabel(dropdown, checkedInputs) {
	const mode = dropdown.dataset.dropdownMode
	const singularFallback = dropdown.dataset.dropdownFallbackLabel ?? 'Select an option'
	const pluralSuffix = dropdown.dataset.dropdownPluralSuffix ?? 'selected'

	if (checkedInputs.length === 0) {
		return singularFallback
	}

	if (mode === 'single' || checkedInputs.length === 1) {
		return getInputLabel(checkedInputs[0]) || singularFallback
	}

	return `${checkedInputs.length} ${pluralSuffix}`
}

function updateDropdownButtonLabel(dropdown) {
	const labelTarget = dropdown.querySelector('[data-dropdown-button-label]')
	if (!labelTarget) return

	const checkedInputs = getCheckedInputs(dropdown)
	labelTarget.textContent = getButtonLabel(dropdown, checkedInputs)
}

function setupDropdownLabel(dropdown) {
	const inputs = dropdown.querySelectorAll('[data-dropdown-input]')
	if (!inputs.length) return

	updateDropdownButtonLabel(dropdown)
	inputs.forEach((input) => {
		input.addEventListener('change', () => {
			updateDropdownButtonLabel(dropdown)
		})
	})
}

export default function dropdownLabels() {
	const dropdowns = document.querySelectorAll('[data-dropdown-select]')
	dropdowns.forEach(setupDropdownLabel)
}
