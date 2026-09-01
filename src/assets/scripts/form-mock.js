// Step navigation for components/FormMultiStepMock.astro.
//
// The mock has no validation or submit — the buttons exist so the step split can
// be clicked through when reviewing an arrangement. Delegated, so any number of
// mocks can sit on one page.

export default function formMock() {
	const mocks = [...document.querySelectorAll('[data-form-mock]')]
	if (!mocks.length) return

	mocks.forEach((mock) => {
		mock.addEventListener('click', (event) => {
			const button = event.target.closest('[data-form-mock-step-to]')
			if (!button) return

			const target = button.dataset.formMockStepTo

			mock.querySelectorAll('[data-form-mock-step]').forEach((step) => {
				step.hidden = step.dataset.formMockStep !== target
			})
		})
	})
}
