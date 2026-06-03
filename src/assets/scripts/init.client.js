import { initFlowbite } from 'flowbite'
import { Observer } from 'tailwindcss-intersect'
import cardFilters from './card-filters'
import countUp from './count-up'
import dotsGrid from './dots-grid'
import dropdownFilters from './dropdown-filters'
import dropdownLabels from './dropdown-labels'
import primaryNav from './primary-nav'
import postNav from './post-nav'

if (typeof window !== 'undefined') {
	Observer.start()

	const initCountUp = () => {
		countUp()
	}

	if (document.readyState === 'loading') {
		window.addEventListener('DOMContentLoaded', initCountUp, { once: true })
	} else {
		initCountUp()
	}

	window.addEventListener('load', () => {
		initFlowbite()
		primaryNav()
		dotsGrid()
		dropdownFilters()
		cardFilters()
		dropdownLabels()
		postNav()
	})
}
