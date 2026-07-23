import { canViewTransition } from './motion'

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
	const canVT = canViewTransition
	const pill = root.querySelector('[data-tab-indicator]')
	const fieldset = pill?.parentElement
	// Scoped to the fieldset, not the whole root, so radios inside slotted panel content never get swept up.
	const radios = fieldset ? Array.from(fieldset.querySelectorAll('input[type="radio"]')) : []
	const tabOrder = (root.dataset.tabOrder || '').split(' ').filter(Boolean)
	const panels = Array.from(root.querySelectorAll(':scope > [data-tab-panel]'))

	const activeTab = () => root.getAttribute('data-active-tab')

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

	function setTab(tab) {
		const cur = activeTab()
		if (tab === cur || !tabOrder.includes(tab)) return
		if (!canVT()) {
			applyTab(tab)
			return
		}
		const el = document.documentElement
		el.dataset.tabsDirection = tabOrder.indexOf(tab) > tabOrder.indexOf(cur) ? 'forward' : 'back'

		const others = otherNamedElements(root)
		const restore = others.map((node) => {
			const prev = node.style.viewTransitionName
			node.style.viewTransitionName = 'none'
			return () => (node.style.viewTransitionName = prev)
		})

		const t = document.startViewTransition(() => applyTab(tab))
		// Restore as soon as the new state is captured (not after the animation
		// finishes) so a quick click on another group mid-transition still works.
		t.ready.finally(() => restore.forEach((fn) => fn()))
		t.finished.finally(() => delete el.dataset.tabsDirection)
	}

	radios.forEach((radio) => {
		radio.addEventListener('click', (e) => {
			if (radio.value === activeTab()) return
			e.preventDefault()
			setTab(radio.value)
		})
		radio.addEventListener('keyup', () => {
			if (radio.checked) setTab(radio.value)
		})
	})

	// Suppress the pill's transition so it doesn't animate in on first paint. Position it once now
	// (while transitions are off) and again next frame before re-enabling — re-enabling in the same
	// tick as the first real size change would still animate from the 0×0 CSS default.
	if (pill) pill.style.transition = 'none'
	positionIndicator()
	requestAnimationFrame(() => {
		positionIndicator()
		if (pill) pill.style.transition = ''
	})
	addEventListener('resize', positionIndicator)
}

export default function tabs() {
	document.querySelectorAll('[data-tabs]').forEach(initTabs)
}
