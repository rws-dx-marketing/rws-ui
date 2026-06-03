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

export default function accordion() {
	document.querySelectorAll('[data-accordion]').forEach((accordion) => {
		const items = Array.from(accordion.querySelectorAll('details'))
		items.forEach((item) => {
			if (item.open) item.setAttribute('data-open', '')
			item.querySelector('summary')?.addEventListener('click', (e) => {
				e.preventDefault()
				if (item.open) {
					closeItem(item)
				} else {
					items.forEach((other) => {
						if (other !== item && other.open) closeItem(other)
					})
					openItem(item)
				}
			})
		})
	})
}
