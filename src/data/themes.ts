export const themes = [
	'default',
	'pale',
	'dots',
	// 'dots-enhanced',
	'primary',
	'secondary',
	'tertiary',
] as const

export type Theme = (typeof themes)[number]
