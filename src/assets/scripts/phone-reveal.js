// Phone numbers that stay obscured until a click, so the reveal can be tracked
// as an intent signal (a rendered `tel:` link gives you nothing on desktop —
// the click leaves the page before any handler is worth trusting).
//
// One module serves every variant: the markup decides how the number is hidden
// and what moves on reveal (Tailwind `group-data-[revealed]:*` on the root),
// the script only assembles the number, flips the flag and fires the event.
//
// Markup contract:
//   [data-phone-reveal="<variant>"]  root, also the `group`
//   [data-phone-number]              base64 number on the root, for the variants
//                                    that keep it out of the page source entirely
//   [data-phone-trigger]             button/link that reveals
//   [data-phone-output]              where the tel: link is written; its text
//                                    content is the number when there is no
//                                    data-phone-number
//   [data-phone-copy]                optional copy-to-clipboard button
//   [data-phone-office]              label sent with the event

// Base64 rather than plain text so the number is not in the HTML a scraper
// downloads. It is not encryption — anything the browser can render, a headless
// browser can read — it just raises the cost above `curl | grep`.
const decode = (value) => {
	try {
		return atob(value)
	} catch {
		return ''
	}
}

const telHref = (number) => `tel:${number.replace(/[^+\d]/g, '')}`

function track(root, action) {
	const detail = {
		action, // 'reveal' | 'call' | 'copy'
		variant: root.dataset.phoneReveal || '',
		office: root.dataset.phoneOffice || '',
	}

	// GTM if it is on the page, plus a DOM event so anything else (or the demo
	// page's log) can listen without knowing about the tag manager.
	window.dataLayer?.push({ event: 'phone_number', ...detail })
	root.dispatchEvent(new CustomEvent('phone:reveal', { detail, bubbles: true }))
}

function numberFor(root, output) {
	const encoded = root.dataset.phoneNumber
	return encoded ? decode(encoded) : output.textContent.trim()
}

function reveal(root) {
	if (root.hasAttribute('data-revealed')) return

	const output = root.querySelector('[data-phone-output]')
	if (!output) return

	const number = numberFor(root, output)
	if (!number) return

	const link = document.createElement('a')
	link.href = telHref(number)
	link.textContent = number
	link.className = 'transition-colors hover:text-accent'
	// The reveal is intent; the call is the conversion. Tracked separately so the
	// two are not conflated in reporting.
	link.addEventListener('click', () => track(root, 'call'))

	output.replaceChildren(link)
	root.setAttribute('data-revealed', '')

	// Reveal is the click's whole purpose, so move focus to the number rather
	// than leaving it on a button that has just been hidden.
	link.setAttribute('tabindex', '-1')
	link.focus({ preventScroll: true })

	track(root, 'reveal')
}

async function copy(root, button) {
	const output = root.querySelector('[data-phone-output]')
	if (!output) return

	try {
		await navigator.clipboard.writeText(numberFor(root, output))
	} catch {
		return // Clipboard denied (insecure context, permissions) — say nothing.
	}

	const label = button.querySelector('[data-phone-copy-label]') || button
	const original = label.textContent
	label.textContent = 'Copied'
	window.setTimeout(() => {
		label.textContent = original
	}, 2000)

	track(root, 'copy')
}

export default function phoneReveal() {
	const roots = Array.from(document.querySelectorAll('[data-phone-reveal]'))
	if (!roots.length) return

	roots.forEach((root) => {
		// <details> needs no JS to reveal — it only needs the tracking, and its
		// number is server-rendered inside the disclosure.
		if (root.tagName === 'DETAILS') {
			root.addEventListener('toggle', () => {
				if (root.open) track(root, 'reveal')
			})
			return
		}

		root.querySelectorAll('[data-phone-trigger]').forEach((trigger) => {
			trigger.addEventListener('click', (event) => {
				event.preventDefault()
				reveal(root)
			})
		})

		root.querySelectorAll('[data-phone-copy]').forEach((button) => {
			button.addEventListener('click', () => copy(root, button))
		})
	})
}
