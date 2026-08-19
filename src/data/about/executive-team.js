// Executive team for /about/executive-team/ and its detail pages.
//
// A near-copy of data/authors/index.js — same `filters` + records shape so the
// archive can feed FilterDropdown/FilterOption and card-filters.js unchanged.
// The difference: executives are not bylines, so there is no articleCount and no
// articles list; the detail page is bio-only.
//
// Names, roles and headshots are the real RWS executive team. Bios are
// placeholder except Benjamin Faes, who gets the hand-authored detail page.

export const filters = [
	{
		id: 'division',
		label: 'Division',
		inputType: 'checkbox',
		options: [
			{ value: 'group', label: 'Group' },
			{ value: 'generate', label: 'Generate' },
			{ value: 'transform', label: 'Transform' },
			{ value: 'protect', label: 'Protect' },
		],
	},
	{
		id: 'function',
		label: 'Function',
		inputType: 'checkbox',
		options: [
			{ value: 'leadership', label: 'Leadership' },
			{ value: 'finance', label: 'Finance & strategy' },
			{ value: 'legal', label: 'Legal & governance' },
			{ value: 'product-technology', label: 'Product & technology' },
			{ value: 'people', label: 'People' },
			{ value: 'language', label: 'Language' },
		],
	},
]

const headshot = (path) => `https://www.rws.com${path}?v=20260729092253`

const placeholderBio = ['Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat consequat, pellentesque venenatis felis posuere. Nullam lectus orci, maximus vel nibh vel, congue sodales ex.', 'Integer auctor nulla vel leo, sed vestibulum ligula tempor id. Donec at neque vitae massa dictum tincidunt. Praesent efficitur, augue non tincidunt vulputate, sapien nisi tempus arcu, non facilisis lorem ipsum eu velit.']

const social = { linkedin: '#', x: '#', email: 'mailto:#' }

export const executives = [
	{
		slug: 'benjamin-faes',
		name: 'Benjamin Faes',
		role: 'Group Chief Executive Officer',
		avatar: headshot('/media/images/Ben_tcm228-263769.png'),
		excerpt: 'More than 25 years leading digital transformation and scaling technology-driven businesses across EMEA.',
		bio: ['Ben Faes is Group Chief Executive Officer of RWS. He brings more than 25 years of experience in leading digital transformation and scaling technology-driven businesses, with a strong track record of driving profitable growth, building innovative go-to-market models, and developing high-performing international teams.', 'Before joining RWS, Ben held senior leadership roles across the technology and business services sectors. At AOL he rose to Managing Director for France, before moving to Alphabet in 2008 where he pioneered YouTube’s monetization in Europe and later led multiple Google businesses across the EMEA region, culminating as Managing Director of Google Cloud for Southern Europe and Emerging Markets.', 'Beyond his executive career, Ben is passionate about the arts and culture, actively supporting leading museums and cultural initiatives. Based in London, he balances a busy professional life with running, cycling, and traveling.'],
		social,
		filters: { division: ['group'], function: ['leadership'] },
	},
	{
		slug: 'stephen-lamb',
		name: 'Stephen Lamb',
		role: 'Chief Financial Officer',
		avatar: headshot('/media/images/stephen-240x240-3_tcm228-293017.png'),
		excerpt: 'Leads the Group’s global finance strategy and operations, from reporting and planning to cash generation and governance.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['finance'] },
	},
	{
		slug: 'joseph-ayala',
		name: 'Joseph Ayala',
		role: 'Executive Vice President of Strategy and Corporate Affairs',
		avatar: headshot('/media/images/joseph_tcm228-272709.png'),
		excerpt: 'Responsible for strategy, investor relations and the company’s global M&A activity.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['finance'] },
	},
	{
		slug: 'jerome-grateau',
		name: 'Jérôme Grateau',
		role: 'Executive Vice President, Go-to-Market',
		avatar: headshot('/media/images/jerome-grateau-240x240_tcm228-283166.png'),
		excerpt: 'Brings the RWS portfolio to market across regions, aligning sales, marketing and partner strategy.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['leadership'] },
	},
	{
		slug: 'jane-hyde',
		name: 'Jane Hyde',
		role: 'General Counsel and Company Secretary',
		avatar: headshot('/media/fallback/images/executive-group-240x240-rws-Jane-Hyde_tcm228-209910.png'),
		excerpt: 'Oversees legal, risk and corporate governance for the Group and supports the Board.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['legal'] },
	},
	{
		slug: 'brajesh-jha',
		name: 'Brajesh Jha',
		role: 'CEO, Americas (Transform)',
		avatar: headshot('/media/images/brajesh-jha-240x240_tcm228-296715.png'),
		excerpt: 'Leads the Transform business across the Americas, helping clients localize content at global scale.',
		bio: placeholderBio,
		social,
		filters: { division: ['transform'], function: ['leadership'] },
	},
	{
		slug: 'vasagi-kothandapani',
		name: 'Vasagi Kothandapani',
		role: 'CEO, TrainAI (Generate)',
		avatar: headshot('/media/images/Vasagi-240x240_tcm228-235348.png'),
		excerpt: 'Leads TrainAI, the RWS business building the human-curated data that trains and evaluates AI models.',
		bio: placeholderBio,
		social,
		filters: { division: ['generate'], function: ['leadership'] },
	},
	{
		slug: 'james-lacey',
		name: 'James Lacey',
		role: 'CEO, Protect',
		avatar: headshot('/media/images/james-lacey-240x240_tcm228-283165.png'),
		excerpt: 'Leads the Protect division, covering patent translation, filing and IP research services.',
		bio: placeholderBio,
		social,
		filters: { division: ['protect'], function: ['leadership'] },
	},
	{
		slug: 'amanda-newton',
		name: 'Amanda Newton',
		role: 'CEO, EMEA & APAC (Transform)',
		avatar: headshot('/media/images/Amanda-Newton-192-192_tcm228-234648.png'),
		excerpt: 'Leads the Transform business across EMEA and APAC, working with clients on multilingual content operations.',
		bio: placeholderBio,
		social,
		filters: { division: ['transform'], function: ['leadership'] },
	},
	{
		slug: 'maria-schnell',
		name: 'Maria Schnell',
		role: 'Chief Language Officer',
		avatar: headshot('/media/fallback/images/executive-group-240x240-rws-Maria-Schnell_tcm228-197638.png'),
		excerpt: 'Champions linguistic quality across the Group and the 43,000-strong language expert community.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['language'] },
	},
	{
		slug: 'christina-scott',
		name: 'Christina Scott',
		role: 'Chief Product and Technology Officer',
		avatar: headshot('/media/images/christina-240x240.png_tcm228-274907.png'),
		excerpt: 'Owns the product and technology roadmap, from Trados and Language Weaver to the AI platforms behind them.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['product-technology'] },
	},
	{
		slug: 'jacqui-taylor',
		name: 'Jacqui Taylor',
		role: 'Chief People Officer',
		avatar: headshot('/media/images/j-taylor-2_tcm228-259742.png'),
		excerpt: 'Leads people strategy, culture and talent development for colleagues in more than 40 countries.',
		bio: placeholderBio,
		social,
		filters: { division: ['group'], function: ['people'] },
	},
]

export const getExecutive = (slug) => executives.find((executive) => executive.slug === slug)
