export default function invokerCommandsPolyfill() {
	if (typeof window === 'undefined') return
	if ('command' in HTMLButtonElement.prototype) return

	document.addEventListener('click', (event) => {
		const button = event.target instanceof Element ? event.target.closest('button[commandfor]') : null
		if (!(button instanceof HTMLButtonElement) || button.disabled) return
		const target = document.getElementById(button.getAttribute('commandfor') ?? '')
		if (!(target instanceof HTMLDialogElement)) return
		const command = button.getAttribute('command')
		if (command === 'show-modal') target.showModal()
		else if (command === 'show') target.show()
		else if (command === 'close') target.close()
	})
}
