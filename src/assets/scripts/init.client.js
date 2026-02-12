import { initFlowbite } from 'flowbite'
import { Observer } from 'tailwindcss-intersect'

if (typeof window !== 'undefined') {
	Observer.start()

	window.addEventListener('load', () => {
		initFlowbite()
	})
}
