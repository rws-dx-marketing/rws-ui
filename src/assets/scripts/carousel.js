import EmblaCarousel from 'embla-carousel'
import { Observer } from 'tailwindcss-intersect'
// import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
// import AutoHeightPlugin from 'embla-carousel-auto-height'

function initCarousel(wrapperNode) {
	const viewportNode = wrapperNode.querySelector('[data-carousel="viewport"]')
	const prevButtonNode = wrapperNode.querySelector('[data-carousel="prev"]')
	const nextButtonNode = wrapperNode.querySelector('[data-carousel="next"]')
	const dotsNode = wrapperNode.querySelector('[data-carousel="dots"]')

	const emblaApi = EmblaCarousel(
		viewportNode,
		{
			loop: false,
			skipSnaps: true,
			draggable: wrapperNode.querySelectorAll('[data-carousel="slide"]').length <= 1 ? false : true,
		},
		[
			// WheelGesturesPlugin(),
			// AutoHeightPlugin(),
		],
	)

	emblaApi.on('scroll', (emblaApi, event) => {
		const { isDragging } = event.detail

		if (isDragging) {
			emblaApi.rootNode().classList.add('select-none')
		}
	})

	emblaApi.on('settle', (emblaApi, event) => {
		if (emblaApi.rootNode().classList.contains('select-none')) {
			emblaApi.rootNode().classList.remove('select-none')
		}
	})

	prevButtonNode.addEventListener('click', () => emblaApi.goToPrev(), false)
	nextButtonNode.addEventListener('click', () => emblaApi.goToNext(), false)

	const toggleButtonsDisabled = (emblaApi) => {
		const setButtonState = (button, enabled) => {
			button.toggleAttribute('disabled', !enabled)
		}
		setButtonState(prevButtonNode, emblaApi.canGoToPrev())
		setButtonState(nextButtonNode, emblaApi.canGoToNext())
	}

	toggleButtonsDisabled(emblaApi)
	emblaApi.on('select', toggleButtonsDisabled)
	emblaApi.on('reinit', toggleButtonsDisabled)

	let dotNodes = []

	const dotIconSources = Array.from(wrapperNode.querySelectorAll('[data-carousel="dot-icon-source"]'))

	const createDotButtonHtml = (emblaApi, dotsNode) => {
		const dotTemplate = wrapperNode.querySelector('[data-carousel="dot-template"]')
		const snapList = emblaApi.snapList()
		dotsNode.innerHTML = snapList.reduce((acc) => acc + dotTemplate.innerHTML, '')
		return Array.from(dotsNode.querySelectorAll('[data-carousel="dot"]'))
	}

	const setupDotIcons = (dotNodes) => {
		if (!dotIconSources.length) return
		dotNodes.forEach((dotNode, index) => {
			const slot = dotNode.querySelector('[data-carousel="dot-icon"]')
			const source = dotIconSources[index % dotIconSources.length]
			if (slot && source) slot.innerHTML = source.innerHTML
		})
	}

	const addDotButtonClickHandlers = (emblaApi, dotNodes) => {
		dotNodes.forEach((dotNode, index) => {
			dotNode.addEventListener('click', () => emblaApi.goTo(index), false)
		})
	}

	const setupDotDelays = (dotNodes) => {
		dotNodes.forEach((dotNode, index) => {
			const motionNode = dotNode.querySelector('.intersect-once')
			if (!motionNode) return
			motionNode.style.setProperty('--motion-delay', `${200 + index * 100}ms`)
			motionNode.setAttribute('no-intersect', '')
		})
	}

	const toggleDotButtonsActive = (emblaApi, dotNodes) => {
		if (!dotNodes.length) return
		const previous = emblaApi.previousSnap()
		const selected = emblaApi.selectedSnap()
		delete dotNodes[previous].dataset.selected
		dotNodes[selected].dataset.selected = ''
	}

	const createAndSetupDotButtons = (emblaApi, dotsNode) => {
		dotNodes = createDotButtonHtml(emblaApi, dotsNode)
		setupDotIcons(dotNodes)
		setupDotDelays(dotNodes)
		addDotButtonClickHandlers(emblaApi, dotNodes)
		toggleDotButtonsActive(emblaApi, dotNodes)
		Observer.observe()
	}

	createAndSetupDotButtons(emblaApi, dotsNode)
	emblaApi.on('reinit', () => createAndSetupDotButtons(emblaApi, dotsNode))
	emblaApi.on('select', (emblaApi) => toggleDotButtonsActive(emblaApi, dotNodes))
}

export default function carousel() {
	document.querySelectorAll('[data-carousel]:not([data-carousel] [data-carousel])').forEach(initCarousel)
}
