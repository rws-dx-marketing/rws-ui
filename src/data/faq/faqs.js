// FAQ content for /faq/ — one question per detail page, mirroring the live
// FAQDetails template. `summary` is the short answer used by the archive
// search index and by the accordion of related questions on a detail page;
// the full answer body is authored in the detail page itself.

export const categories = [
	{ value: 'security', label: 'Security & data protection' },
	{ value: 'licensing', label: 'Licensing & accounts' },
	{ value: 'billing', label: 'Billing & subscriptions' },
	{ value: 'product', label: 'Products & features' },
	{ value: 'support', label: 'Support & training' },
]

export const categoryLabel = (value) => categories.find((category) => category.value === value)?.label ?? value

export const faqs = [
	{
		question: 'As a Canadian customer, how can I protect my data when using Trados?',
		href: '/faq/faq-1/',
		category: 'security',
		summary: 'Store only the appropriate classification of data in the cloud, use customer-provided encryption keys, and add contract clauses that keep Protected B work inside Canada.',
		filters: {
			product: ['trados-studio', 'trados-enterprise'],
			version: ['2026', '2024'],
			topic: ['security', 'compliance', 'cloud'],
			audience: ['enterprise', 'administrator'],
			region: ['canada'],
		},
	},
	{
		question: 'In Canada, what is categorised as protected data and can this data be uploaded to the cloud?',
		category: 'security',
		summary: 'The Government of Canada classifies sensitive information as Protected A, B or C. Protected A can go to the cloud, Protected B depends on your IT policy, and Protected C should never leave your own infrastructure.',
		filters: {
			product: ['trados-enterprise', 'trados-team'],
			version: ['2026', '2024'],
			topic: ['security', 'compliance'],
			audience: ['enterprise', 'administrator'],
			region: ['canada'],
		},
	},
	{
		question: 'Where is my translation memory data physically stored?',
		category: 'security',
		summary: 'Cloud data is held in the region you select when your account is provisioned. Desktop translation memories stay on your own machine or network share until you choose to publish them.',
		filters: {
			product: ['trados-studio', 'trados-team', 'trados-enterprise'],
			version: ['2026', '2024', '2022'],
			topic: ['security', 'cloud'],
			audience: ['enterprise', 'administrator', 'lsp'],
			region: ['global', 'eu', 'uk'],
		},
	},
	{
		question: 'Is my content used to train machine translation or AI models?',
		category: 'security',
		summary: 'No. Customer content is never used to train shared or public models. Any adaptive engine trained on your data is private to your account and deleted with it.',
		filters: {
			product: ['language-weaver', 'trados-enterprise'],
			version: ['2026'],
			topic: ['ai', 'security', 'compliance'],
			audience: ['enterprise', 'lsp'],
			region: ['global'],
		},
	},
	{
		question: 'Which security certifications does RWS hold?',
		category: 'security',
		summary: 'RWS maintains ISO 27001 certification, and undergoes independent penetration testing and annual SOC 2 Type II audits. Reports are available under NDA.',
		filters: {
			product: ['trados-enterprise', 'tridion', 'fonto'],
			version: ['2026', '2024'],
			topic: ['security', 'compliance'],
			audience: ['enterprise', 'administrator'],
			region: ['global', 'eu', 'uk', 'us'],
		},
	},
	{
		question: 'Can I enforce single sign-on and multi-factor authentication for my team?',
		category: 'security',
		summary: 'Yes. SAML 2.0 single sign-on can be enabled for your tenant, and multi-factor authentication can be enforced for every user, including external linguists.',
		filters: {
			product: ['trados-team', 'trados-enterprise'],
			version: ['2026', '2024'],
			topic: ['security', 'integrations'],
			audience: ['administrator', 'enterprise'],
			region: ['global'],
		},
	},
	{
		question: 'How do I activate my licence on a new computer?',
		category: 'licensing',
		summary: 'Deactivate the licence on the old machine from the Account section, then sign in on the new one. If the old machine is unavailable, support can release the seat for you.',
		filters: {
			product: ['trados-studio'],
			version: ['2026', '2024', '2022'],
			topic: ['workflow'],
			audience: ['translator', 'lsp'],
			region: ['global'],
		},
	},
	{
		question: 'What is the difference between a single-user and a network licence?',
		category: 'licensing',
		summary: 'A single-user licence is tied to one named user. A network licence is served from your own licence server and can be checked out by any user in the pool, one at a time.',
		filters: {
			product: ['trados-studio'],
			version: ['2026', '2024', '2022'],
			topic: ['workflow'],
			audience: ['lsp', 'administrator'],
			region: ['global'],
		},
	},
	{
		question: 'Can I transfer my licence to another person in my organization?',
		category: 'licensing',
		summary: 'Yes. An account administrator can reassign a seat to another named user at any time from the user management screen. Reassignment does not affect the renewal date.',
		filters: {
			product: ['trados-team', 'trados-enterprise', 'trados-accelerate'],
			version: ['2026', '2024'],
			topic: ['workflow'],
			audience: ['administrator', 'enterprise'],
			region: ['global'],
		},
	},
	{
		question: 'How many devices can I install my licence on?',
		category: 'licensing',
		summary: 'A single-user licence may be installed on two devices — for example a desktop and a laptop — provided only one is in use at a time.',
		filters: {
			product: ['trados-studio'],
			version: ['2026', '2024', '2022'],
			topic: ['workflow'],
			audience: ['translator'],
			region: ['global'],
		},
	},
	{
		question: 'When will I be billed and how do I change my renewal date?',
		category: 'billing',
		summary: 'Subscriptions are billed on the anniversary of your first payment. Renewal dates can be aligned across seats by contacting your account manager.',
		filters: {
			product: ['trados-team', 'trados-accelerate'],
			version: ['2026', '2024'],
			topic: ['workflow'],
			audience: ['translator', 'lsp'],
			region: ['global'],
		},
	},
	{
		question: 'Can I change my plan part-way through a subscription term?',
		category: 'billing',
		summary: 'You can upgrade at any time and pay a pro-rated difference for the remainder of the term. Downgrades take effect at the next renewal.',
		filters: {
			product: ['trados-team', 'trados-enterprise', 'trados-accelerate'],
			version: ['2026', '2024'],
			topic: ['workflow'],
			audience: ['lsp', 'enterprise'],
			region: ['global'],
		},
	},
	{
		question: 'Which payment methods and currencies do you accept?',
		category: 'billing',
		summary: 'Card and bank transfer are accepted, with invoicing available for annual plans. Pricing is available in GBP, EUR, USD and a number of local currencies.',
		filters: {
			product: ['trados-studio', 'trados-team', 'trados-accelerate'],
			version: ['2026', '2024', '2022'],
			topic: ['compliance'],
			audience: ['translator', 'lsp'],
			region: ['global', 'eu', 'uk', 'us'],
		},
	},
	{
		question: 'How do I get a VAT invoice for my purchase?',
		category: 'billing',
		summary: 'Invoices are issued automatically and available to download from the Billing area of your account. Add your VAT number before purchase so it appears on the invoice.',
		filters: {
			product: ['trados-studio', 'trados-team'],
			version: ['2026', '2024', '2022'],
			topic: ['compliance'],
			audience: ['translator', 'lsp'],
			region: ['eu', 'uk'],
		},
	},
	{
		question: 'What file formats are supported out of the box?',
		category: 'product',
		summary: 'More than 50 formats are supported, including Office documents, XML, JSON, XLIFF, InDesign, FrameMaker and common subtitle formats. Custom file types can be added with a filter.',
		filters: {
			product: ['trados-studio', 'trados-enterprise'],
			version: ['2026', '2024', '2022'],
			topic: ['integrations', 'terminology'],
			audience: ['translator', 'lsp', 'enterprise'],
			region: ['global'],
		},
	},
	{
		question: 'Can I work offline and sync my changes later?',
		category: 'product',
		summary: 'Yes. Projects can be taken offline in the desktop application and synchronised back to the cloud when a connection is available.',
		filters: {
			product: ['trados-studio', 'trados-team'],
			version: ['2026', '2024'],
			topic: ['workflow', 'cloud'],
			audience: ['translator', 'lsp'],
			region: ['global'],
		},
	},
	{
		question: 'Does it integrate with my content management system?',
		category: 'product',
		summary: 'Connectors are available for the major content, commerce and marketing platforms, and a documented REST API covers anything without a ready-made connector.',
		filters: {
			product: ['trados-enterprise', 'tridion', 'language-weaver'],
			version: ['2026', '2024'],
			topic: ['integrations', 'ai'],
			audience: ['enterprise', 'administrator'],
			region: ['global'],
		},
	},
	{
		question: 'How do I report a bug or request a feature?',
		category: 'support',
		summary: 'Raise a case through the support portal with your account details and steps to reproduce. Feature requests are logged on the community ideas board where other users can vote.',
		filters: {
			product: ['trados-studio', 'trados-team', 'trados-enterprise'],
			version: ['2026', '2024', '2022'],
			topic: ['workflow'],
			audience: ['translator', 'lsp', 'enterprise'],
			region: ['global'],
		},
	},
	{
		question: 'What training is included with my subscription?',
		category: 'support',
		summary: 'Every subscription includes access to on-demand getting-started courses and the knowledge base. Instructor-led and certification training can be purchased separately.',
		filters: {
			product: ['trados-studio', 'trados-team', 'trados-accelerate'],
			version: ['2026', '2024'],
			topic: ['workflow', 'terminology'],
			audience: ['translator', 'lsp'],
			region: ['global'],
		},
	},
	{
		question: 'What are your support hours and response times?',
		category: 'support',
		summary: 'Standard support covers business hours in your region with a next-business-day target. Premium support adds extended hours and a four-hour response target for critical issues.',
		filters: {
			product: ['trados-studio', 'trados-team', 'trados-enterprise', 'language-weaver'],
			version: ['2026', '2024', '2022'],
			topic: ['workflow'],
			audience: ['lsp', 'enterprise', 'administrator'],
			region: ['global'],
		},
	},
]
