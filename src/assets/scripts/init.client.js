import { initFlowbite } from 'flowbite'
import { Observer } from 'tailwindcss-intersect'

document.addEventListener('DOMContentLoaded', () => {
	initFlowbite()
	Observer.start()
})
