// `id` is the localStorage key for dismissal — change it to resurface a
// growler after its content changes. First growler whose `paths` includes the
// current pathname wins.
export default [
	{
		id: 'launch-2026-09',
		paths: ['/'],
		message: 'We just launched the most amazing thing.',
		cta: { label: 'Check it out', href: '#' },
		theme: 'secondary',
	},
	{
		id: 'careers-2026-09',
		paths: ['/about'],
		message: 'We’re hiring across engineering, linguistics and AI.',
		cta: { label: 'See open roles', href: '#' },
		theme: 'tertiary',
	},
]
