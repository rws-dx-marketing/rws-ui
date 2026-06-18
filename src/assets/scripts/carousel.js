import EmblaCarousel from 'embla-carousel'
// import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

export default function carousel() {
	const wrapperNode = document.querySelector('[data-carousel]')
	const viewportNode = wrapperNode.querySelector('[data-carousel="viewport"]')
	const prevButtonNode = wrapperNode.querySelector('[data-carousel="prev"]')
	const nextButtonNode = wrapperNode.querySelector('[data-carousel="next"]')
	const dotsNode = wrapperNode.querySelector('[data-carousel="dots"]')

	const emblaApi = EmblaCarousel(
		viewportNode,
		{
			loop: false,
			skipSnaps: true,
		},
		// [WheelGesturesPlugin()],
	)

	// console.log('emblaApi', emblaApi)

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

	const createDotButtonHtml = (emblaApi, dotsNode) => {
		const dotTemplate = document.getElementById('dot-template')
		const snapList = emblaApi.snapList()
		dotsNode.innerHTML = snapList.reduce((acc) => acc + dotTemplate.innerHTML, '')
		return Array.from(dotsNode.querySelectorAll('[data-carousel="dot"]'))
	}

	const addDotButtonClickHandlers = (emblaApi, dotNodes) => {
		dotNodes.forEach((dotNode, index) => {
			dotNode.addEventListener('click', () => emblaApi.goTo(index), false)
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
		addDotButtonClickHandlers(emblaApi, dotNodes)
		toggleDotButtonsActive(emblaApi, dotNodes)
	}

	createAndSetupDotButtons(emblaApi, dotsNode)
	emblaApi.on('reinit', () => createAndSetupDotButtons(emblaApi, dotsNode))
	emblaApi.on('select', (emblaApi) => toggleDotButtonsActive(emblaApi, dotNodes))
}
