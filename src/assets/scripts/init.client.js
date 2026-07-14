import { Observer } from 'tailwindcss-intersect'

import cardFilters from './card-filters'
import countUp from './count-up'
import dots from './dots'
import dropdownFilters from './dropdown-filters'
import dropdownLabels from './dropdown-labels'
import accordion from './accordion'
import carousel from './carousel'
import primaryNav from './primary-nav'
import headerScroll from './header-scroll'
import postNav from './post-nav'
import invokerCommandsPolyfill from './invoker-commands-polyfill'
import pricingContent from './pricing-content'
import tabs from './tabs'
import animation from './animation'

if (typeof window !== 'undefined') {
	Observer.start()
	invokerCommandsPolyfill()

	const initCountUp = () => {
		countUp()
	}

	if (document.readyState === 'loading') {
		window.addEventListener('DOMContentLoaded', initCountUp, { once: true })
	} else {
		initCountUp()
	}

	window.addEventListener('load', () => {
		primaryNav()
		headerScroll()
		dots()
		dropdownFilters()
		cardFilters()
		dropdownLabels()
		accordion()
		carousel()
		postNav()
		pricingContent()
		tabs()
		animation()
	})
}
