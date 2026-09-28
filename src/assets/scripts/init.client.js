import { Observer } from 'tailwindcss-intersect/observer'

import cardFilters from './card-filters'
import countUp from './count-up'
import countdown from './countdown'
import dots from './dots'
import dropdownFilters from './dropdown-filters'
import formMock from './form-mock'
import accordion from './accordion'
import carousel from './carousel'
import primaryNav from './primary-nav'
import headerScroll from './header-scroll'
import localTime from './local-time'
import officeMap from './office-map'
import phoneReveal from './phone-reveal'
import postNav from './post-nav'
import invokerCommandsPolyfill from './invoker-commands-polyfill'
import anchorPolyfill from './anchor-polyfill'
// import pricingContent from './pricing-content'
import pricingRefactor from './pricing-refactor'
import pronounce from './pronounce'
import tabs from './tabs'
import themePicker from './theme-picker'
import variantPicker from './variant-picker'
import timezoneSelect from './timezone-select'
import animation from './animation'
import blob from './blob'
import blackHole from './black-hole'
import goo from './goo'
import range from './range'
import growler from './growler'

if (typeof window !== 'undefined') {
	Observer.start()
	invokerCommandsPolyfill()
	anchorPolyfill()

	const initEarly = () => {
		countUp()
		countdown()
		themePicker()
		variantPicker()
		blackHole()
		growler()
	}

	if (document.readyState === 'loading') {
		window.addEventListener('DOMContentLoaded', initEarly, { once: true })
	} else {
		initEarly()
	}

	window.addEventListener('load', () => {
		primaryNav()
		headerScroll()
		dots()
		dropdownFilters()
		cardFilters()
		formMock()
		accordion()
		carousel()
		postNav()
		officeMap()
		localTime()
		phoneReveal()
		// pricingContent()
		pricingRefactor()
		pronounce()
		tabs()
		timezoneSelect()
		animation()
		blob()
		goo()
		range()
	})
}
