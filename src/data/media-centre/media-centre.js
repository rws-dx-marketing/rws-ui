// Media centre section config + the two small card sets that back
// /media-centre/media-resources/ and /media-centre/latest-reports/.
//
// `sections` drives the hub buttons and the MediaCentreNav page switcher — one
// entry per archive, mirroring the three tabs on the live site.
//
// `mediaResources` and `latestReports` are shaped for BentoGrid: three items
// resolve to one large hero plus two mediums, so no per-card positioning is
// needed. Titles and destinations are the real ones from rws.com.

export const sections = [
	{
		key: 'press-releases',
		label: 'Press releases',
		href: '/media-centre/press-releases/',
		description: 'Company announcements, financial results and product news, newest first.',
	},
	{
		key: 'media-resources',
		label: 'Media resources',
		href: '/media-centre/media-resources/',
		description: 'Where to go for commentary, expert bios and long-form thinking.',
	},
	{
		key: 'latest-reports',
		label: 'Latest reports',
		href: '/media-centre/latest-reports/',
		description: 'Original research on AI, language and intellectual property.',
	},
]

export const mediaResources = [
	{
		title: 'The RWS Blog',
		body: 'Analysis, opinion and practical guidance from the people building AI-powered language, content and IP solutions.',
		img: 'https://www.rws.com/media/dynamic/images/hallucinations_tcm228-295285.webp?original=.png&v=20260402100433',
		href: '/resources/',
	},
	{
		title: 'Executive team',
		body: 'Biographies and headshots for the RWS leadership team, available for media use.',
		img: '/images/placeholder-2.png',
		href: '/about/executive-team/',
	},
	{
		title: 'Globally Speaking Radio',
		body: 'Our sister podcast on the business of language — interviews with the people shaping the industry.',
		img: '/images/placeholder-3.png',
		href: 'https://www.globallyspeakingradio.com/',
		external: true,
	},
]

export const latestReports = [
	{
		title: 'Riding the AI shockwave',
		body: 'How organizations are absorbing generative AI into content and language operations — and what separates the teams seeing returns from the ones still experimenting.',
		img: 'https://www.rws.com/media/dynamic/images/hallucinations_tcm228-295285.webp?original=.png&v=20260402100433',
		href: '#',
	},
	{
		title: 'Time for IP to think bigger with AI',
		body: 'Research into how IP teams are applying AI across search, translation and filing.',
		img: '/images/placeholder-1.png',
		href: '#',
	},
	{
		title: 'Genuine intelligence report',
		body: 'What buyers across nine markets say about trust, provenance and human oversight in AI-generated content.',
		img: '/images/placeholder-2.png',
		href: '#',
	},
]
