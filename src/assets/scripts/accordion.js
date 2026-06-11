const DURATION = 300
const EASING = 'ease-in-out'

async function slide(el, from, to) {
	const anim = el.animate(
		[
			{ height: from, overflow: 'hidden' },
			{ height: to, overflow: 'hidden' },
		],
		{
			duration: DURATION,
			easing: EASING,
			fill: 'forwards',
		},
	)
	await anim.finished
	anim.commitStyles()
	anim.cancel()
}

async function closeItem(item) {
	const body = item.querySelector(':scope > div')
	item.removeAttribute('data-open')
	if (!body) {
		item.open = false
		return
	}
	await slide(body, `${body.scrollHeight}px`, '0px')
	item.open = false
	body.style.height = ''
}

async function openItem(item) {
	item.setAttribute('data-open', '')
	item.open = true
	const body = item.querySelector(':scope > div')
	if (!body) return
	await slide(body, '0px', `${body.scrollHeight}px`)
	body.style.height = ''
}

function updateLockedState(items, persist) {
	const openItems = items.filter((i) => i.open)
	items.forEach((item) => {
		if (persist && openItems.length <= 1 && item.open) {
			item.setAttribute('data-accordion-locked', '')
		} else {
			item.removeAttribute('data-accordion-locked')
		}
	})
}

export default function accordion() {
	accordionImageSwap()
	document.querySelectorAll('[data-accordion]').forEach((accordion) => {
		const items = Array.from(accordion.querySelectorAll('details'))
		const multi = accordion.hasAttribute('data-accordion-multi')
		const persist = accordion.hasAttribute('data-accordion-persist')

		items.forEach((item) => {
			if (item.open) item.setAttribute('data-open', '')
		})
		updateLockedState(items, persist)

		items.forEach((item) => {
			item.querySelector('summary')?.addEventListener('click', async (e) => {
				e.preventDefault()
				if (item.open) {
					if (persist && items.filter((i) => i.open).length <= 1) return
					await closeItem(item)
				} else {
					const toClose = multi ? [] : items.filter((other) => other !== item && other.open)
					await Promise.all([...toClose.map(closeItem), openItem(item)])
				}
				updateLockedState(items, persist)
			})
		})
	})
}

function accordionImageSwap() {
	document.querySelectorAll('[data-image-swap]').forEach((section) => {
		const img = section.querySelector('[data-image-target]')
		if (!img) return
		section.querySelectorAll('details[data-image]').forEach((details) => {
			details.querySelector('summary')?.addEventListener('click', () => {
				if (!details.open && details.dataset.image) {
					img.setAttribute('data-swapping', '')
					setTimeout(() => {
						img.src = details.dataset.image
						img.removeAttribute('data-swapping')
					}, DURATION)
				}
			})
		})
	})
}
