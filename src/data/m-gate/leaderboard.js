// Sample grammar MCC scores for the leaderboard heatmap: one row per model, one
// column per language. Values are illustrative — the production page pulls the
// same shape from /api/trainai/benchmarks.

export const languages = [
	{ code: 'ar', name: 'Arabic' },
	{ code: 'cs', name: 'Czech' },
	{ code: 'de', name: 'German' },
	{ code: 'el', name: 'Greek' },
	{ code: 'es', name: 'Spanish' },
	{ code: 'fi', name: 'Finnish' },
	{ code: 'fr', name: 'French' },
	{ code: 'he', name: 'Hebrew' },
	{ code: 'hi', name: 'Hindi' },
	{ code: 'hu', name: 'Hungarian' },
	{ code: 'is', name: 'Icelandic' },
	{ code: 'ja', name: 'Japanese' },
	{ code: 'ko', name: 'Korean' },
	{ code: 'pl', name: 'Polish' },
	{ code: 'ru', name: 'Russian' },
	{ code: 'sw', name: 'Swahili' },
	{ code: 'th', name: 'Thai' },
	{ code: 'tr', name: 'Turkish' },
	{ code: 'vi', name: 'Vietnamese' },
	{ code: 'zh', name: 'Simplified Chinese' },
]

// Ordered by overall score, which is also the row order the heatmap renders.
export const models = [
	{
		name: 'Grok 4.20',
		company: 'xAI',
		color: 'rgb(17, 17, 17)',
		overall: 0.44,
		cells: { ar: 0.65, cs: 0.02, de: 0.86, el: 0.37, es: 0.68, fi: 0.32, fr: 0.75, he: 0.31, hi: 0.23, hu: 0.07, is: 0.51, ja: 0.26, ko: 0.35, pl: 0.68, ru: 0.68, sw: -0.05, th: 0.56, tr: 0.78, vi: 0.26, zh: -0.02 },
	},
	{
		name: 'Gemini 3.1 Pro Preview',
		company: 'Google',
		color: 'rgb(66, 133, 244)',
		overall: 0.23,
		cells: { ar: 0.11, cs: 0.02, de: 0.51, el: 0.53, es: 0.57, fi: 0.57, fr: 0.48, he: 0.62, hi: -0.11, hu: null, is: 0.32, ja: 0.66, ko: 0.42, pl: null, ru: 0.21, sw: 0.02, th: 0.34, tr: 0.48, vi: 0.06, zh: 0.13 },
	},
	{
		name: 'Gemini 3.5 Flash',
		company: 'Google',
		color: 'rgb(66, 133, 244)',
		overall: 0.05,
		cells: { ar: -0.27, cs: -0.17, de: 0.15, el: -0.33, es: 0.28, fi: -0.15, fr: -0.13, he: 0.06, hi: null, hu: 0.19, is: 0.22, ja: 0.16, ko: 0.18, pl: -0.35, ru: 0.31, sw: -0.26, th: 0.33, tr: -0.21, vi: 0.06, zh: -0.17 },
	},
	{
		name: 'Mistral Medium 3.1',
		company: 'Mistral',
		color: 'rgb(255, 112, 0)',
		overall: 0.05,
		cells: { ar: 0.11, cs: 0.27, de: 0.45, el: 0.15, es: -0.25, fi: -0.29, fr: -0.07, he: 0.09, hi: 0.09, hu: 0.06, is: null, ja: null, ko: 0.3, pl: -0.21, ru: -0.09, sw: 0.29, th: null, tr: 0.23, vi: 0.14, zh: 0.01 },
	},
	{
		name: 'Gemini 3 Flash Preview',
		company: 'Google',
		color: 'rgb(66, 133, 244)',
		overall: 0.04,
		cells: { ar: -0.21, cs: 0.31, de: 0.11, el: 0.09, es: 0.09, fi: -0.02, fr: -0.04, he: -0.3, hi: -0.19, hu: 0.05, is: 0.33, ja: 0.25, ko: 0.35, pl: 0.08, ru: 0.3, sw: -0.31, th: 0.01, tr: -0.06, vi: 0.1, zh: -0.17 },
	},
	{
		name: 'Claude Opus 4.5',
		company: 'Anthropic',
		color: 'rgb(217, 119, 87)',
		overall: 0.03,
		cells: { ar: -0.02, cs: -0.07, de: -0.23, el: -0.32, es: -0.21, fi: -0.41, fr: -0.12, he: -0.22, hi: 0.18, hu: 0.26, is: -0.28, ja: -0.38, ko: -0.32, pl: 0.19, ru: -0.15, sw: 0.06, th: -0.25, tr: -0.46, vi: null, zh: -0.23 },
	},
	{
		name: 'Gemma 4 31B',
		company: 'Google',
		color: 'rgb(66, 133, 244)',
		overall: 0.02,
		cells: { ar: -0.44, cs: 0.07, de: 0.31, el: 0.21, es: 0.28, fi: -0.08, fr: -0.13, he: 0.52, hi: 0.17, hu: null, is: 0.03, ja: 0.41, ko: -0.25, pl: 0.16, ru: 0.19, sw: 0.06, th: -0.07, tr: -0.4, vi: -0.14, zh: -0.44 },
	},
	{
		name: 'Mistral Medium 3.5',
		company: 'Mistral',
		color: 'rgb(255, 112, 0)',
		overall: 0.0,
		cells: { ar: -0.45, cs: null, de: -0.44, el: 0.23, es: 0.1, fi: -0.3, fr: 0.21, he: 0.07, hi: -0.28, hu: -0.15, is: 0.1, ja: 0.09, ko: 0.17, pl: 0.33, ru: null, sw: -0.27, th: 0.09, tr: -0.45, vi: -0.16, zh: -0.19 },
	},
	{
		name: 'GPT-5',
		company: 'OpenAI',
		color: 'rgb(16, 163, 127)',
		overall: -0.04,
		cells: { ar: -0.08, cs: -0.49, de: null, el: -0.38, es: -0.15, fi: 0.09, fr: -0.51, he: -0.26, hi: 0.04, hu: -0.13, is: -0.4, ja: 0.1, ko: -0.16, pl: 0.12, ru: 0.37, sw: -0.49, th: -0.02, tr: -0.22, vi: -0.21, zh: 0.03 },
	},
	{
		name: 'Command A Translate',
		company: 'Cohere',
		color: 'rgb(57, 89, 76)',
		overall: -0.05,
		cells: { ar: 0.27, cs: 0.15, de: 0.13, el: 0.44, es: 0.26, fi: -0.31, fr: -0.08, he: -0.08, hi: 0.21, hu: -0.08, is: -0.35, ja: -0.29, ko: 0.18, pl: -0.48, ru: -0.36, sw: -0.4, th: 0.15, tr: 0.1, vi: -0.48, zh: -0.25 },
	},
	{
		name: 'GLM 5.2',
		company: 'Zhipu',
		color: 'rgb(14, 165, 233)',
		overall: -0.33,
		cells: { ar: -0.27, cs: -0.26, de: -0.5, el: -0.11, es: -0.2, fi: -0.13, fr: -0.6, he: -0.12, hi: -0.72, hu: -0.18, is: -0.48, ja: -0.56, ko: -0.07, pl: -0.36, ru: null, sw: -0.65, th: -0.48, tr: 0.02, vi: -0.09, zh: -0.39 },
	},
]
