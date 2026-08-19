// Authors for /authors/ and the /authors/[slug]/ detail page.
//
// Placeholder people (avatars from the same flowbite set the blog cards use) —
// the one exception is Stacy Ayers, who already appears as the byline on
// /resources/blog-1/, so she gets the prototype detail page and keeps her photo.
//
// `filters` mirrors the shape of data/events/filters.js so the archive can feed
// FilterDropdown/FilterOption directly, and each author's `filters` object is
// serialised into data-card-filters for card-filters.js to match against.
import { authorTeams, facet, topics } from '../taxonomies.js'

export const filters = [facet('topic', 'Topic', topics), facet('team', 'Team', authorTeams)]

const avatar = (name) => `https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/${name}.png`

export const authors = [
	{
		slug: 'stacy-ayers',
		name: 'Stacy Ayers',
		role: 'Head of Quality, TrainAI',
		avatar: 'https://www.rws.com/media/dynamic/images/stacy-ayers_tcm228-286310.webp?original=.png&v=20260402100433',
		excerpt: 'Writes about training data quality, human-in-the-loop evaluation and what it takes to ship AI that behaves in every market.',
		bio: ['Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat consequat, pellentesque venenatis felis posuere. Nullam lectus orci, maximus vel nibh vel, congue sodales ex.', 'Integer auctor nulla vel leo, sed vestibulum ligula tempor id. Donec at neque vitae massa dictum tincidunt. Praesent efficitur, augue non tincidunt vulputate, sapien nisi tempus arcu, non facilisis lorem ipsum eu velit.'],
		articleCount: 9,
		social: {
			linkedin: '#',
			x: '#',
			email: 'mailto:#',
		},
		filters: { topic: ['ai-data'], team: ['services'] },
	},
	{
		slug: 'vanessa-green',
		name: 'Vanessa Green',
		role: 'Director of Linguistic AI Services',
		avatar: avatar('bonnie-green'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat consequat.',
		articleCount: 14,
		filters: { topic: ['ai-data', 'localization-translation'], team: ['leadership', 'research'] },
	},
	{
		slug: 'michael-gough',
		name: 'Michael Gough',
		role: 'VP Product, Trados',
		avatar: avatar('michael-gouch'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Nullam lectus orci, maximus vel nibh vel.',
		articleCount: 11,
		filters: { topic: ['localization-translation', 'content-management'], team: ['product', 'leadership'] },
	},
	{
		slug: 'roberta-casas',
		name: 'Roberta Casas',
		role: 'Principal Research Linguist',
		avatar: avatar('roberta-casas'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat.',
		articleCount: 8,
		filters: { topic: ['ai-data'], team: ['research'] },
	},
	{
		slug: 'helene-engels',
		name: 'Helene Engels',
		role: 'Head of Content Strategy',
		avatar: avatar('helene-engels'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Congue sodales ex, integer auctor nulla vel leo.',
		articleCount: 6,
		filters: { topic: ['content-management'], team: ['leadership'] },
	},
	{
		slug: 'neil-sims',
		name: 'Neil Sims',
		role: 'Director of IP Services',
		avatar: avatar('neil-sims'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Pellentesque venenatis felis posuere.',
		articleCount: 12,
		filters: { topic: ['intellectual-property'], team: ['leadership', 'services'] },
	},
	{
		slug: 'jese-leos',
		name: 'Jese Leos',
		role: 'Senior Solutions Architect',
		avatar: avatar('jese-leos'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Maximus vel nibh vel, congue sodales ex.',
		articleCount: 5,
		filters: { topic: ['content-management', 'localization-translation'], team: ['product'] },
	},
	{
		slug: 'sofia-mcguire',
		name: 'Sofia McGuire',
		role: 'Localization Programme Director',
		avatar: avatar('sofia-mcguire'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat consequat.',
		articleCount: 10,
		filters: { topic: ['localization-translation'], team: ['services'] },
	},
	{
		slug: 'lana-byrd',
		name: 'Lana Byrd',
		role: 'Regulatory Content Lead',
		avatar: avatar('lana-byrd'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Nullam lectus orci, maximus vel nibh.',
		articleCount: 7,
		filters: { topic: ['regulatory', 'content-management'], team: ['services'] },
	},
	{
		slug: 'thomas-lean',
		name: 'Thomas Lean',
		role: 'Machine Translation Specialist',
		avatar: avatar('thomas-lean'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Donec at neque vitae massa dictum tincidunt.',
		articleCount: 4,
		filters: { topic: ['ai-data', 'localization-translation'], team: ['research'] },
	},
	{
		slug: 'robert-brown',
		name: 'Robert Brown',
		role: 'Head of Data Operations',
		avatar: avatar('robert-brown'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Praesent efficitur, augue non tincidunt vulputate.',
		articleCount: 9,
		filters: { topic: ['ai-data'], team: ['services'] },
	},
	{
		slug: 'karen-nelson',
		name: 'Karen Nelson',
		role: 'Global Marketing Director',
		avatar: avatar('karen-nelson'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Sapien nisi tempus arcu, non facilisis lorem.',
		articleCount: 13,
		filters: { topic: ['content-management'], team: ['leadership'] },
	},
	{
		slug: 'leslie-livingston',
		name: 'Leslie Livingston',
		role: 'Patent Translation Manager',
		avatar: avatar('leslie-livingston'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat.',
		articleCount: 3,
		filters: { topic: ['intellectual-property', 'localization-translation'], team: ['services'] },
	},
	{
		slug: 'joseph-mcfall',
		name: 'Joseph McFall',
		role: 'Life Sciences Compliance Lead',
		avatar: avatar('joseph-mcfall'),
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Congue sodales ex, integer auctor nulla.',
		articleCount: 6,
		filters: { topic: ['regulatory'], team: ['research', 'services'] },
	},
]

// Placeholder article list for the author detail page. Nine cards so the
// "Load more" button has something to reveal at the default page size of six.
const blogImages = ['https://flowbite.s3.amazonaws.com/blocks/marketing-ui/blog/office-laptops.png', 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/blog/google-hq.png', 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/blog/office-laptops-2.png']

export const articles = [
	{ type: 'Article', title: 'This is an article title', date: 'Aug 15, 2026', readTime: '16 min read' },
	{ type: 'Blog', title: 'This is an article title that spans multiple lines', date: 'Jul 2, 2026', readTime: '8 min read' },
	{ type: 'Article', title: 'This is an article title', date: 'Jun 18, 2026', readTime: '12 min read' },
	{ type: 'Case study', title: 'This is a case study title', date: 'May 30, 2026', readTime: '6 min read' },
	{ type: 'Article', title: 'This is an article title that spans multiple lines', date: 'Apr 11, 2026', readTime: '10 min read' },
	{ type: 'Blog', title: 'This is an article title', date: 'Mar 24, 2026', readTime: '5 min read' },
	{ type: 'Article', title: 'This is an article title', date: 'Feb 9, 2026', readTime: '14 min read' },
	{ type: 'Blog', title: 'This is an article title that spans multiple lines', date: 'Jan 20, 2026', readTime: '7 min read' },
	{ type: 'Case study', title: 'This is a case study title', date: 'Dec 4, 2025', readTime: '9 min read' },
].map((article, index) => ({
	...article,
	image: blogImages[index % blogImages.length],
	href: '/resources/blog-1/',
	excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elitera. Suspendisse luctus tortor placerat erat consequat, pellentesque venenatis felis posuere.',
}))

export const getAuthor = (slug) => authors.find((author) => author.slug === slug)
