import { initFlowbite } from 'flowbite'
import { Observer } from 'tailwindcss-intersect'
import countUp from './count-up'
import dotsGrid from './dots-grid'
import postNav from './post-nav'

if (typeof window !== 'undefined') {
	Observer.start()

	window.addEventListener('load', () => {
		initFlowbite()
		countUp()
		dotsGrid()
		postNav()
	})
}
