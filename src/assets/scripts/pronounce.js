// Dictionary-style "listen" buttons on glossary detail pages. Speaks the headword
// with the Web Speech API, so no audio assets are needed – each [data-pronounce]
// holds the text to read out (spelled for the synthesiser, not for the page).
// Buttons remove themselves where the API is missing, and carry data-speaking
// while talking so the icon can animate.
export default function pronounce() {
	const buttons = Array.from(document.querySelectorAll('[data-pronounce]'))
	if (!buttons.length) return

	const synth = window.speechSynthesis

	if (!synth) {
		buttons.forEach((button) => button.remove())
		return
	}

	buttons.forEach((button) => {
		button.addEventListener('click', () => {
			synth.cancel()

			const utterance = new SpeechSynthesisUtterance(button.dataset.pronounce)
			utterance.lang = button.dataset.pronounceLang ?? 'en-GB'
			utterance.rate = 0.9

			const clear = () => button.removeAttribute('data-speaking')
			utterance.addEventListener('start', () => button.setAttribute('data-speaking', ''))
			utterance.addEventListener('end', clear)
			utterance.addEventListener('error', clear)

			synth.speak(utterance)
		})
	})
}
