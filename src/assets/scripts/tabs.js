import { segmentedControl } from './segmented-control'

// Every named element on the page (across all tab groups) gets pulled into any
// view transition, so without this a transition triggered by one group visibly
// reflows/animates every other group's panels too. Blanking their names before
// the transition starts excludes them from the snapshot entirely.
function otherNamedElements(root) {
	return Array.from(document.querySelectorAll('[data-tabs]'))
		.filter((r) => r !== root)
		.flatMap((r) => Array.from(r.querySelectorAll('[style*="view-transition-name"]')))
}

function initTabs(root) {
	const pill = root.querySelector('[data-tab-indicator]')
	const fieldset = pill?.parentElement
	// Scoped to the fieldset, not the whole root, so radios inside slotted panel content never get swept up.
	const radios = fieldset ? Array.from(fieldset.querySelectorAll('input[type="radio"]')) : []
	const tabOrder = (root.dataset.tabOrder || '').split(' ').filter(Boolean)
	const panels = Array.from(root.querySelectorAll(':scope > [data-tab-panel]'))

	const activeTab = () => root.getAttribute('data-active-tab')

	// ?tab= (legacy: ?segment=) opens a group on a named panel. Ignored unless the
	// value matches one of this group's keys, so it's harmless on other groups.
	const params = new URLSearchParams(location.search)
	const deepLink = params.get('tab') || params.get('segment')
	const wantsDeepLink = deepLink && panels.some((p) => p.dataset.tabKey === deepLink)

	function positionIndicator() {
		if (!pill || !fieldset) return
		const input = fieldset.querySelector('input[value="' + activeTab() + '"]')
		const labelEl = input && input.closest('label')
		if (!labelEl) return
		pill.style.width = labelEl.offsetWidth + 'px'
		if (getComputedStyle(fieldset).flexDirection === 'row') {
			// Height comes from CSS (inset-y-1.5, matching the fieldset's own padding) rather than a
			// per-label measurement, so it never has anything to interpolate — only width/position
			// animate, which stops the pill's rounded ends from visibly warping mid-transition when
			// tabs have very different label widths.
			pill.style.removeProperty('height')
			pill.style.removeProperty('top')
			pill.style.transform = 'translateX(' + labelEl.offsetLeft + 'px)'
		} else {
			// Stacked (mobile) layout: the indicator is a per-row highlight, so height genuinely
			// varies and needs the same JS-measured treatment as the horizontal position.
			pill.style.height = labelEl.offsetHeight + 'px'
			pill.style.top = '0px'
			pill.style.transform = 'translate(' + labelEl.offsetLeft + 'px, ' + labelEl.offsetTop + 'px)'
		}
	}

	function applyTab(tab) {
		root.setAttribute('data-active-tab', tab)
		const r = radios.find((r) => r.value === tab)
		if (r) r.checked = true
		panels.forEach((panel) => {
			panel.hidden = panel.dataset.tabKey !== tab
		})
		positionIndicator()
	}

	segmentedControl({
		inputs: radios,
		indicator: pill,
		directionAttr: 'tabsDirection',
		// Optional: without data-tab-order, fall back to the radios' own order.
		order: tabOrder.length ? tabOrder : undefined,
		getActive: activeTab,
		apply: applyTab,
		position: positionIndicator,
		// Applied under the same first-paint suppression as the pill's initial
		// placement, so a deep link lands with no visible switch on load.
		init: () => (wantsDeepLink ? applyTab(deepLink) : positionIndicator()),
		// Blank every other tab group's named elements before the transition so
		// they aren't swept into this group's snapshot; restore once captured.
		prepare: () => {
			const restore = otherNamedElements(root).map((node) => {
				const prev = node.style.viewTransitionName
				node.style.viewTransitionName = 'none'
				return () => (node.style.viewTransitionName = prev)
			})
			return () => restore.forEach((fn) => fn())
		},
	})
}

export default function tabs() {
	document.querySelectorAll('[data-tabs]').forEach(initTabs)
}
