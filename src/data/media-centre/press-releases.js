// Press releases for /media-centre/press-releases/.
//
// Same shape as data/events/index.js so the archive can reuse the events feed
// markup verbatim: `filters` drives FilterDropdown/FilterOption, and each
// record's `filters` object is serialised into data-card-filters for
// card-filters.js to match against.
//
// Every card points at the single hand-authored prototype detail page — in the
// real build this becomes a [slug] route.

export const filters = [
	{
		id: 'release-type',
		label: 'Type',
		inputType: 'checkbox',
		options: [
			{ value: 'company-news', label: 'Company news' },
			{ value: 'financial-results', label: 'Financial results' },
			{ value: 'product-news', label: 'Product news' },
			{ value: 'partnership', label: 'Partnership' },
			{ value: 'awards', label: 'Awards & recognition' },
		],
	},
	{
		id: 'topic',
		label: 'Topic',
		inputType: 'checkbox',
		options: [
			{ value: 'ai-data', label: 'AI & data' },
			{ value: 'localization-translation', label: 'Localization & translation' },
			{ value: 'content-management', label: 'Content management' },
			{ value: 'intellectual-property', label: 'Intellectual property' },
			{ value: 'sustainability', label: 'Sustainability' },
		],
	},
	{
		id: 'year',
		label: 'Year',
		inputType: 'checkbox',
		options: [
			{ value: '2026', label: '2026' },
			{ value: '2025', label: '2025' },
			{ value: '2024', label: '2024' },
		],
	},
]

const detail = '/media-centre/press-releases/press-release-1/'
const featureImage = 'https://www.rws.com/media/dynamic/images/hallucinations_tcm228-295285.webp?original=.png&v=20260402100433'

export const pressReleases = [
	{
		image: featureImage,
		type: 'Company news',
		href: detail,
		date: '14 July 2026',
		name: 'RWS opens AI language research hub in Lisbon',
		description: '<p>The new facility brings together linguists, data specialists and engineers to advance evaluation methods for multilingual AI.</p>',
		filters: { 'release-type': ['company-news'], 'topic': ['ai-data'], 'year': ['2026'] },
	},
	{
		image: 'https://www.rws.com/media/images/1_tcm228-300487.png?v=20260729092253',
		type: 'Financial results',
		href: detail,
		date: '30 June 2026',
		name: 'RWS reports half-year results for the period ended 31 March 2026',
		description: '<p>Group revenue and adjusted operating profit ahead of the prior year, with continued growth in AI and data services.</p>',
		filters: { 'release-type': ['financial-results'], 'topic': ['ai-data'], 'year': ['2026'] },
	},
	{
		image: 'https://www.rws.com/media/images/index-page-img_tcm228-299876.png?v=20260729092253',
		type: 'Product news',
		href: detail,
		date: '9 June 2026',
		name: 'Trados adds agentic review to its cloud translation platform',
		description: '<p>The release introduces automated quality checks that flag terminology drift and regulatory risk before human review.</p>',
		filters: { 'release-type': ['product-news'], 'topic': ['localization-translation'], 'year': ['2026'] },
	},
	{
		image: 'https://www.rws.com/media/fallback/images/Press-release-2-1000x500-news_tcm228-296801.png?v=20260729092253',
		type: 'Partnership',
		href: detail,
		date: '21 May 2026',
		name: 'RWS and Congree partner on GenAI content quality',
		description: '<p>The partnership pairs authoring assistance with RWS language technology to keep source content clear and consistent.</p>',
		filters: { 'release-type': ['partnership'], 'topic': ['content-management'], 'year': ['2026'] },
	},
	{
		image: featureImage,
		type: 'Awards & recognition',
		href: detail,
		date: '28 April 2026',
		name: 'RWS named a Leader in multilingual AI data services',
		description: '<p>Independent analysts recognized TrainAI for the scale and quality of its human-in-the-loop data programmes.</p>',
		filters: { 'release-type': ['awards'], 'topic': ['ai-data'], 'year': ['2026'] },
	},
	{
		image: '/images/placeholder-1.png',
		type: 'Product news',
		href: detail,
		date: '17 March 2026',
		name: 'Language Weaver extends secure machine translation to 12 new languages',
		description: '<p>Public sector and regulated customers gain coverage for additional low-resource languages within their own environment.</p>',
		filters: { 'release-type': ['product-news'], 'topic': ['localization-translation'], 'year': ['2026'] },
	},
	{
		image: featureImage,
		type: 'Company news',
		href: detail,
		date: '5 February 2026',
		name: 'RWS publishes Genuine Intelligence report on trust in AI content',
		description: '<p>Research across nine markets finds that provenance and human oversight remain decisive for buyer confidence.</p>',
		filters: { 'release-type': ['company-news'], 'topic': ['ai-data'], 'year': ['2026'] },
	},
	{
		image: '/images/placeholder-2.png',
		type: 'Financial results',
		href: detail,
		date: '11 December 2025',
		name: 'RWS announces full-year results for the year ended 30 September 2025',
		description: '<p>The Group delivered growth in recurring technology revenue alongside disciplined cost management.</p>',
		filters: { 'release-type': ['financial-results'], 'topic': ['ai-data'], 'year': ['2025'] },
	},
	{
		image: '/images/placeholder-3.png',
		type: 'Product news',
		href: detail,
		date: '23 October 2025',
		name: 'Tridion introduces AI-assisted structured authoring for regulated industries',
		description: '<p>New capabilities help life sciences and manufacturing teams reuse approved content without losing traceability.</p>',
		filters: { 'release-type': ['product-news'], 'topic': ['content-management'], 'year': ['2025'] },
	},
	{
		image: featureImage,
		type: 'Partnership',
		href: detail,
		date: '2 September 2025',
		name: 'RWS joins forces with leading IP firms on patent translation standards',
		description: '<p>The initiative sets shared quality benchmarks for machine-assisted patent translation across major filing jurisdictions.</p>',
		filters: { 'release-type': ['partnership'], 'topic': ['intellectual-property'], 'year': ['2025'] },
	},
	{
		image: '/images/placeholder-1.png',
		type: 'Company news',
		href: detail,
		date: '18 June 2025',
		name: 'RWS sets science-based targets for emissions reduction',
		description: '<p>The Group commits to validated near-term targets covering its own operations and its global supply chain.</p>',
		filters: { 'release-type': ['company-news'], 'topic': ['sustainability'], 'year': ['2025'] },
	},
	{
		image: '/images/placeholder-2.png',
		type: 'Awards & recognition',
		href: detail,
		date: '14 November 2024',
		name: 'RWS recognized for innovation in AI-powered localization',
		description: '<p>Industry judges highlighted the combination of language expertise and applied AI across the Trados product line.</p>',
		filters: { 'release-type': ['awards'], 'topic': ['localization-translation'], 'year': ['2024'] },
	},
]
