// Canonical Trados pricing data — audience segments, products and the
// feature-comparison matrix. Consumed by src/blocks/PricingContent.astro
// (the live pricing block used by /pricing/new and /pricing/teams).

// ── Audience segments (the radio group) ───────────────────────────────────
export const segments = [
	{ key: 'freelancers', label: 'I translate', sub: 'Freelancers', icon: 'user', popular: 'freelance', subtitle: 'For individual translators. 14 day risk-free trial.' },
	{ key: 'teams', label: 'I sell translations', sub: 'LSPs & teams', icon: 'users', popular: 'team', subtitle: 'Built for language service providers and translation teams who deliver for clients.' },
	{ key: 'businesses', label: 'I need translation', sub: 'Businesses', icon: 'building', popular: 'business', subtitle: 'For businesses and enterprises managing translation at scale, securely.' },
]

// ── Products ───────────────────────────────────────────────────────────────
// `order` fixes the DOM order so each segment's products stay contiguous and in
// the right sequence once the others are hidden. Locked pages only render the
// products that belong to that segment.
export const fullOrder = ['go', 'freelance', 'pro', 'team', 'business', 'enterprise', 'edge']

export const products = {
	go: {
		name: 'Trados Studio Go',
		tag: 'Browser CAT tool',
		segments: ['freelancers'],
		priceType: 'billing',
		price: { monthlyGbp: 27, annualGbp: 20, annualMonthlyGbp: 22.5, wasGbp: 24 },
		desc: { freelancers: 'Quick to set up and reach from anywhere. The browser CAT tool with everything you need to stay productive on the move.' },
		features: { freelancers: ['Browser-based — nothing to install', '1M cloud words per year', 'Translation memory & terminology', 'AI Smart Help & guided tours', '10+ AppStore apps'] },
		ctas: [
			{ label: 'Start free trial', primary: true },
			{ label: 'Buy now', primary: false },
		],
		lw: { name: 'Language Weaver Pro', line: 'Add secure, generative machine translation — 6M characters included to start.' },
	},
	freelance: {
		name: 'Trados Studio Freelance',
		tag: 'Desktop + cloud',
		segments: ['freelancers'],
		priceType: 'billing',
		price: { monthlyGbp: 38, annualGbp: 28.33, annualMonthlyGbp: 31.5 },
		desc: { freelancers: 'Desktop and cloud in one. A complete professional environment with advanced features, flexibility and full control.' },
		features: { freelancers: ['Desktop + browser working', 'Unlimited desktop throughput', 'MultiTerm terminology management', 'AI Assistant in the desktop app', '150+ AppStore apps'] },
		ctas: [
			{ label: 'Start free trial', primary: true },
			{ label: 'Buy now', primary: false },
		],
		lw: { name: 'Language Weaver Pro', line: 'Add secure, generative machine translation — 6M characters included to start.' },
	},
	pro: {
		name: 'Trados Studio Pro',
		tag: 'Power-user desktop CAT',
		segments: ['teams'],
		priceType: 'none',
		desc: { teams: 'The power-user desktop CAT tool — maximum productivity, deep customization and 150+ apps for high-volume professionals.' },
		features: { teams: ['Everything in Freelance', 'Multi-user file handling', 'Advanced project automation', 'Full AppStore + API access', 'Server & GroupShare projects'] },
		ctas: [
			{ label: 'Start free trial', primary: true },
			{ label: 'Buy now', primary: false },
		],
		lw: { name: 'Language Weaver Pro', line: 'Add secure generative MT to supercharge high-volume desktop productivity.' },
	},
	team: {
		name: 'Trados Team',
		tag: 'Cloud collaboration',
		segments: ['teams', 'businesses'],
		priceType: 'none',
		desc: {
			teams: 'Built for growing LSPs. Run client projects together in the cloud, protect quality with AI review, and keep small teams delivering on deadline.',
			businesses: 'Built for in-house teams. Give everyone one place to translate company content together — shared memories and AI review, with no TMS to administer.',
		},
		features: {
			teams: ['Shared client projects in the cloud', 'AI-powered review to protect margins', 'Assign roles across your team', 'Reusable TMs & termbases per client', 'Collaborate live on every delivery'],
			businesses: ['One workspace for all company content', 'AI-powered review for brand consistency', 'Simple roles for staff & reviewers', 'Central TM & terminology for your brand', 'Collaborate with zero IT overhead'],
		},
		ctas: [
			{ label: 'Start free trial', primary: true },
			{ label: 'Buy now', primary: false },
		],
		lw: { name: 'Language Weaver Pro', line: 'Secure generative MT across every project your team runs.' },
	},
	business: {
		name: 'Trados Business',
		tag: 'Out-of-the-box TMS',
		segments: ['teams', 'businesses'],
		priceType: 'none',
		desc: {
			teams: 'For language-service providers scaling up. An out-of-the-box TMS with vendor and freelancer management, automated client workflows and the reporting clients expect.',
			businesses: 'For businesses bringing translation in-house. Automated workflows, dashboards and connectors plug Trados into the content your organization already produces.',
		},
		features: {
			teams: ['Out-of-the-box TMS for LSPs', 'Manage vendors & freelance supply chain', 'Automate repeatable client workflows', 'Margin, cost & delivery dashboards', 'Connect to client content sources'],
			businesses: ['Out-of-the-box TMS for your business', 'Automate internal translation requests', 'Dashboards for cost & turnaround', 'Connectors to your CMS & repositories', 'Manage internal & external linguists'],
		},
		ctas: [{ label: 'Speak to sales', primary: true }],
		lw: { name: 'Language Weaver Pro', line: 'Enterprise-grade secure MT built into your workflows.' },
	},
	enterprise: {
		name: 'Trados Enterprise',
		tag: 'Fully customizable TMS',
		segments: ['businesses'],
		priceType: 'none',
		desc: { businesses: 'A fully customizable TMS with SSO, advanced workflows and enterprise security for global content operations.' },
		features: { businesses: ['Everything in Business', 'SSO & advanced security', 'Custom workflows & CPQ', 'Dedicated success team', 'Unlimited scale'] },
		ctas: [{ label: 'Speak to sales', primary: true }],
		lw: { name: 'Language Weaver Pro', line: 'Secure, adaptive MT at enterprise scale — fully governed and customizable.' },
	},
	edge: {
		name: 'Trados Edge / GroupShare',
		tag: 'On-prem & private cloud',
		segments: ['businesses'],
		priceType: 'none',
		desc: { businesses: 'On-premises and private-cloud deployment for total data sovereignty and control.' },
		features: { businesses: ['On-premises deployment', 'Full data sovereignty', 'Private-cloud option', 'Server-based collaboration', 'Air-gapped capable'] },
		ctas: [{ label: 'Speak to sales', primary: true }],
		lw: { name: 'Language Weaver Edge', line: 'On-premises machine translation for fully air-gapped, sovereign environments.' },
	},
}

// ── Comparison matrix ──────────────────────────────────────────────────────
export const matrix = [
	{
		title: 'Capacity',
		rows: [
			{ label: 'Languages', vals: { go: 'Unlimited', freelance: 'Unlimited', pro: 'Unlimited', team: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited', edge: 'Unlimited' } },
			{ label: 'Cloud throughput (words / yr)', id: 'cloud-throughput', tooltip: 'Cloud translation throughput is the total number of target words that can be processed through Trados cloud per year.', vals: { go: '1M', freelance: '1M', pro: '5M', team: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited', edge: 'Unlimited' } },
			{ label: 'Desktop throughput', id: 'desktop-throughput', tooltip: 'Desktop translation throughput is the total number of target words that can be processed through the Trados desktop application per year.', vals: { go: false, freelance: 'Unlimited', pro: 'Unlimited', team: false, business: 'Unlimited', enterprise: 'Unlimited', edge: 'Unlimited' } },
			{ label: 'Users included', vals: { go: '1', freelance: '1', pro: '1', team: 'Up to 10', business: 'Custom', enterprise: 'Unlimited', edge: 'Custom' } },
		],
	},
	{
		title: 'Translation features',
		rows: [
			{ label: 'Online (browser) editor', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Desktop editor (Trados Studio)', vals: { go: false, freelance: true, pro: true, team: 'Add-on', business: true, enterprise: true, edge: true } },
			{ label: 'Translation memory & engines', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{
				label: 'Terminology management',
				id: 'terminology-management',
				valueTooltip: {
					match: 'MultiTerm',
					text: '<a href="https://www.trados.com/product/multiterm/" target="_blank">MultiTerm</a> provides a central location to store and manage multilingual terminology, helping you to deliver consistent, high-quality content from source through to translation. MultiTerm is included with all Trados Freelance subscription packages, and is available to download and install from your <a href="http://account.rws.com/" target="_blank">Trados subscription account</a>. In addition, terminology management is available in the browser giving you the flexibility to choose how you want to work.',
				},
				vals: { go: 'Browser', freelance: 'MultiTerm', pro: 'MultiTerm', team: 'Browser', business: true, enterprise: true, edge: true },
			},
			{ label: 'Quality assurance checks', vals: { go: false, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Customize with AppStore apps', vals: { go: '10+', freelance: '150+', pro: '150+', team: '50+', business: '150+', enterprise: '150+', edge: '150+' } },
		],
	},
	{
		title: 'Linguistic AI',
		rows: [
			{ label: 'Smart Help (AI assistant)', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'AI Assistant in desktop', vals: { go: false, freelance: true, pro: true, team: false, business: true, enterprise: true, edge: true } },
			{ label: 'Language Weaver generative MT', lw: true, vals: { go: 'Add-on', freelance: 'Add-on', pro: 'Add-on', team: 'Add-on', business: 'Included', enterprise: 'Included', edge: 'Edge' } },
			{ label: '3rd-party MT & LLM providers', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
		],
	},
	{
		title: 'Collaboration & workflow',
		rows: [
			{ label: 'Cloud projects', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Real-time collaboration', vals: { go: false, freelance: false, pro: false, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Workflow automation', vals: { go: false, freelance: false, pro: 'Basic', team: 'Basic', business: true, enterprise: 'Advanced', edge: true } },
			{
				label: 'Vendor & supply-chain management',
				id: 'vendor-supply-chain',
				valueTooltip: {
					match: true,
					products: ['business'],
					text: 'Placeholder tooltip copy describing vendor and supply-chain management for Trados Business.',
				},
				vals: { go: false, freelance: false, pro: false, team: false, business: true, enterprise: true, edge: true },
			},
			{ label: 'Roles & permissions', vals: { go: false, freelance: false, pro: false, team: 'Basic', business: true, enterprise: 'Advanced', edge: true } },
		],
	},
	{
		title: 'Integrations & security',
		rows: [
			{ label: 'API access', vals: { go: false, freelance: false, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Built-in cloud connectors', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'CMS & content connectors', vals: { go: false, freelance: false, pro: false, team: false, business: true, enterprise: true, edge: true } },
			{ label: 'SSO & advanced security', vals: { go: false, freelance: false, pro: false, team: false, business: false, enterprise: true, edge: true } },
			{ label: 'On-premise / private cloud', vals: { go: false, freelance: false, pro: false, team: false, business: false, enterprise: 'Option', edge: true } },
		],
	},
	{
		title: 'Support & onboarding',
		rows: [
			{ label: 'Community & Knowledge Base', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Standard support', vals: { go: 'Add-on', freelance: 'Add-on', pro: true, team: true, business: true, enterprise: true, edge: true } },
			{ label: 'Dedicated success manager', vals: { go: false, freelance: false, pro: false, team: false, business: 'Option', enterprise: true, edge: true } },
			{ label: 'Guided onboarding & tours', vals: { go: true, freelance: true, pro: true, team: true, business: true, enterprise: true, edge: true } },
		],
	},
]
