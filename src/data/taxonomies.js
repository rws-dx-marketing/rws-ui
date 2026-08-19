// Shared filter taxonomies — the single source for every option list that more
// than one archive uses. Domain files (data/<domain>/filters.js) compose facets
// from these lists instead of restating them, so a label fix lands everywhere.
//
// Facets are consumed by FilterDropdown/FilterOption in one of two shapes:
//   { id, label, inputType, options: [{ value, label }] }
//   { id, label, inputType, optionGroups: [{ label, options: [{ value, label }] }] }
// Build them with facet() below rather than by hand.
//
// The `value` strings are the contract with card-filters.js — every value in a
// record's `filters` object must exist in the facet of the same id. Change a
// value here and you must change it in the matching records.

// --- Option lists -----------------------------------------------------------

// Brand-level products. Used by partners, connectors and events.
export const products = [
	{ value: 'trados', label: 'Trados' },
	{ value: 'language-weaver', label: 'Language Weaver' },
	{ value: 'tridion', label: 'Tridion' },
	{ value: 'fonto', label: 'Fonto' },
	{ value: 'contenta', label: 'Contenta' },
	{ value: 'propylon', label: 'Propylon' },
	{ value: 'inovia', label: 'Inovia' },
	{ value: 'aop-connect', label: 'AOP Connect' },
	{ value: 'trainai', label: 'TrainAI' },
]

// Edition/version-level products. Separate axis from `products` — the FAQ
// archive filters by edition (Trados Studio vs Team vs Enterprise), not brand.
export const productEditions = [
	{
		label: 'Translation productivity',
		options: [
			{ value: 'trados-studio', label: 'Trados Studio' },
			{ value: 'trados-team', label: 'Trados Team' },
			{ value: 'trados-enterprise', label: 'Trados Enterprise' },
			{ value: 'trados-accelerate', label: 'Trados Accelerate' },
		],
	},
	{
		label: 'Language & content',
		options: [
			{ value: 'language-weaver', label: 'Language Weaver' },
			{ value: 'tridion', label: 'Tridion' },
			{ value: 'fonto', label: 'Fonto' },
		],
	},
]

// Supported release years, newest first.
export const versions = [
	{ value: '2026', label: '2026' },
	{ value: '2024', label: '2024' },
	{ value: '2022', label: '2022' },
]

export const solutions = [
	{ value: 'intelligent-knowledge-platforms', label: 'Intelligent Knowledge Platforms' },
	{ value: 'language-platforms', label: 'Language Platforms' },
	{ value: 'ip-platforms', label: 'IP Platforms' },
	{ value: 'ai-data-services', label: 'AI Data Services' },
	{ value: 'language-expert-services', label: 'Language Expert Services' },
	{ value: 'ip-services', label: 'IP Services' },
]

export const industries = [
	{ value: 'life-sciences', label: 'Life Sciences' },
	{ value: 'healthcare', label: 'Healthcare' },
	{ value: 'legal-financial-services', label: 'Legal & Financial Services' },
	{ value: 'government-public-sector', label: 'Government & Public Sector' },
	{ value: 'defence-intelligence', label: 'Defence & Intelligence' },
	{ value: 'technology-software', label: 'Technology & Software' },
	{ value: 'manufacturing-industrial', label: 'Manufacturing & Industrial' },
	{ value: 'automotive', label: 'Automotive' },
	{ value: 'aerospace-aviation', label: 'Aerospace & Aviation' },
	{ value: 'professional-services', label: 'Professional Services' },
	{ value: 'retail-e-commerce', label: 'Retail & E-commerce' },
	{ value: 'media-entertainment', label: 'Media & Entertainment' },
	{ value: 'publishing', label: 'Publishing' },
	{ value: 'gaming', label: 'Gaming' },
	{ value: 'travel-hospitality', label: 'Travel & Hospitality' },
	{ value: 'e-learning-training', label: 'E-learning & Training' },
	{ value: 'telecommunications-it-infrastructure', label: 'Telecommunications & IT Infrastructure' },
	{ value: 'ip-patent', label: 'IP & Patent' },
	{ value: 'energy-utilities', label: 'Energy & Utilities' },
	{ value: 'non-profit-ngo', label: 'Non-Profit & NGO' },
	{ value: 'other', label: 'Other' },
]

// Countries grouped by sales region. Used wherever a facet needs country-level
// granularity (partners, connectors, events).
export const countries = [
	{
		label: 'Americas',
		options: [
			{ value: 'argentina', label: 'Argentina' },
			{ value: 'brazil', label: 'Brazil' },
			{ value: 'canada', label: 'Canada' },
			{ value: 'chile', label: 'Chile' },
			{ value: 'colombia', label: 'Colombia' },
			{ value: 'mexico', label: 'Mexico' },
			{ value: 'panama', label: 'Panama' },
			{ value: 'peru', label: 'Peru' },
			{ value: 'united-states', label: 'United States' },
		],
	},
	{
		label: 'EMEA',
		options: [
			{ value: 'austria', label: 'Austria' },
			{ value: 'belgium', label: 'Belgium' },
			{ value: 'czech-republic', label: 'Czech Republic' },
			{ value: 'denmark', label: 'Denmark' },
			{ value: 'finland', label: 'Finland' },
			{ value: 'france', label: 'France' },
			{ value: 'germany', label: 'Germany' },
			{ value: 'hungary', label: 'Hungary' },
			{ value: 'ireland', label: 'Ireland' },
			{ value: 'israel', label: 'Israel' },
			{ value: 'italy', label: 'Italy' },
			{ value: 'netherlands', label: 'Netherlands' },
			{ value: 'nigeria', label: 'Nigeria' },
			{ value: 'norway', label: 'Norway' },
			{ value: 'poland', label: 'Poland' },
			{ value: 'portugal', label: 'Portugal' },
			{ value: 'romania', label: 'Romania' },
			{ value: 'saudi-arabia', label: 'Saudi Arabia' },
			{ value: 'south-africa', label: 'South Africa' },
			{ value: 'spain', label: 'Spain' },
			{ value: 'sweden', label: 'Sweden' },
			{ value: 'switzerland', label: 'Switzerland' },
			{ value: 'turkey', label: 'Turkey' },
			{ value: 'uae', label: 'UAE' },
			{ value: 'ukraine', label: 'Ukraine' },
			{ value: 'united-kingdom', label: 'United Kingdom' },
		],
	},
	{
		label: 'APAC',
		options: [
			{ value: 'australia', label: 'Australia' },
			{ value: 'china', label: 'China' },
			{ value: 'india', label: 'India' },
			{ value: 'indonesia', label: 'Indonesia' },
			{ value: 'japan', label: 'Japan' },
			{ value: 'malaysia', label: 'Malaysia' },
			{ value: 'new-zealand', label: 'New Zealand' },
			{ value: 'philippines', label: 'Philippines' },
			{ value: 'singapore', label: 'Singapore' },
			{ value: 'south-korea', label: 'South Korea' },
			{ value: 'taiwan', label: 'Taiwan' },
			{ value: 'thailand', label: 'Thailand' },
			{ value: 'vietnam', label: 'Vietnam' },
		],
	},
]

// Coarse markets. Separate axis from `countries` — support content is scoped by
// legal jurisdiction, not by sales country.
export const markets = [
	{ value: 'global', label: 'Global' },
	{ value: 'canada', label: 'Canada' },
	{ value: 'eu', label: 'European Union' },
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'us', label: 'United States' },
]

export const partnerTypes = [
	{ value: 'technology-partner', label: 'Technology partner' },
	{ value: 'solution-partner', label: 'Solution partner' },
	{ value: 'reseller', label: 'Reseller' },
	{ value: 'training-partner', label: 'Training partner' },
]

export const serviceAreas = [
	{
		label: 'Translation & Language Services',
		options: [
			{ value: 'translation-localisation', label: 'Translation & Localisation' },
			{ value: 'interpretation', label: 'Interpretation' },
			{ value: 'transcreation', label: 'Transcreation' },
			{ value: 'subtitling-captioning', label: 'Subtitling & Captioning' },
			{ value: 'dubbing-voice-over', label: 'Dubbing & Voice-over' },
			{ value: 'machine-translation-post-editing', label: 'Machine Translation Post-Editing' },
		],
	},
	{
		label: 'Technology & Implementation',
		options: [
			{ value: 'system-integration', label: 'System Integration' },
			{ value: 'implementation-deployment', label: 'Implementation & Deployment' },
			{ value: 'managed-services', label: 'Managed Services' },
			{ value: 'custom-development', label: 'Custom Development' },
			{ value: 'app-plugin-development', label: 'App / Plugin Development' },
			{ value: 'on-premise-deployment', label: 'On-Premise Deployment' },
		],
	},
	{
		label: 'Consulting & Advisory',
		options: [
			{ value: 'strategy-consulting', label: 'Strategy Consulting' },
			{ value: 'localisation-programme-management', label: 'Localisation Programme Management' },
			{ value: 'government-specialist', label: 'Government Specialist' },
		],
	},
	{
		label: 'AI Data Services',
		options: [
			{ value: 'ai-training-data', label: 'AI Training Data' },
			{ value: 'data-annotation-labelling', label: 'Data Annotation & Labelling' },
		],
	},
	{
		label: 'Creative & Content',
		options: [
			{ value: 'creative-digital-content', label: 'Creative & Digital Content' },
			{ value: 'e-learning-content-development', label: 'E-learning Content Development' },
		],
	},
	{
		label: 'IP Services',
		options: [
			{ value: 'patent-translation-filing', label: 'Patent Translation & Filing' },
			{ value: 'regulatory-compliance-content', label: 'Regulatory & Compliance Content' },
		],
	},
	{
		label: 'Domain Expertise',
		options: [
			{ value: 'life-sciences', label: 'Life Sciences' },
			{ value: 'legal', label: 'Legal' },
			{ value: 'financial-services', label: 'Financial Services' },
			{ value: 'patent-ip', label: 'Patent & IP' },
			{ value: 'technical-documentation', label: 'Technical Documentation' },
			{ value: 'marketing-creative', label: 'Marketing & Creative' },
			{ value: 'digital-forensics', label: 'Digital Forensics' },
			{ value: 'ai-machine-learning', label: 'AI & Machine Learning' },
			{ value: 'game-localisation', label: 'Game Localisation' },
		],
	},
	{
		label: 'Platform Expertise',
		options: [
			{ value: 'trados-certified', label: 'Trados Certified' },
			{ value: 'tridion-certified', label: 'Tridion Certified' },
			{ value: 'dita-xml-authoring', label: 'DITA / XML Authoring' },
			{ value: 'cms-integration', label: 'CMS Integration' },
			{ value: 'api-connector-development', label: 'API / Connector Development' },
		],
	},
	{
		label: 'Training & Certification',
		options: [{ value: 'product-training-certification', label: 'Product Training & Certification' }],
	},
	{
		label: 'Channel Partner',
		options: [{ value: 'resale', label: 'Resale' }],
	},
]

export const eventTypes = [
	{ value: 'in-person-event', label: 'In-person event' },
	{ value: 'virtual-event', label: 'Virtual event' },
	{ value: 'webinar', label: 'Webinar' },
	{ value: 'conference', label: 'Conference' },
	{ value: 'trade-show', label: 'Trade show' },
]

// Editorial topics — the taxonomy behind the glossary and author archives.
export const topics = [
	{ value: 'ai-data', label: 'AI & data' },
	{ value: 'localization-translation', label: 'Localization & translation' },
	{ value: 'content-management', label: 'Content management' },
	{ value: 'intellectual-property', label: 'Intellectual property' },
	{ value: 'regulatory', label: 'Regulatory & life sciences' },
]

// Support topics. Separate axis from `topics` — these describe what a question
// is about, not what a piece of editorial content covers.
export const supportTopics = [
	{ value: 'ai', label: 'AI' },
	{ value: 'security', label: 'Security' },
	{ value: 'cloud', label: 'Cloud & hosting' },
	{ value: 'compliance', label: 'Compliance' },
	{ value: 'integrations', label: 'Integrations' },
	{ value: 'terminology', label: 'Terminology' },
	{ value: 'workflow', label: 'Workflow automation' },
]

export const audiences = [
	{ value: 'translator', label: 'Freelance translator' },
	{ value: 'lsp', label: 'Language service provider' },
	{ value: 'enterprise', label: 'Enterprise team' },
	{ value: 'administrator', label: 'IT & administrators' },
]

export const authorTeams = [
	{ value: 'leadership', label: 'Leadership' },
	{ value: 'product', label: 'Product' },
	{ value: 'research', label: 'Research & linguistics' },
	{ value: 'services', label: 'Services & delivery' },
]

export const faqCategories = [
	{ value: 'security', label: 'Security & data protection' },
	{ value: 'licensing', label: 'Licensing & accounts' },
	{ value: 'billing', label: 'Billing & subscriptions' },
	{ value: 'product', label: 'Products & features' },
	{ value: 'support', label: 'Support & training' },
]

// --- Helpers ----------------------------------------------------------------

// Builds a facet from an option list. Grouped lists (entries carrying their own
// `options`) become `optionGroups`; flat lists become `options`.
export const facet = (id, label, options, inputType = 'checkbox') => (options[0] && 'options' in options[0] ? { id, label, inputType, optionGroups: options } : { id, label, inputType, options })

// Same facet, different wording: pass { value: 'New label' } to override labels
// without forking the option list (connectors reuse the partner types verbatim
// but call them connectors).
export const relabel = (options, overrides) => options.map((option) => ({ ...option, label: overrides[option.value] ?? option.label }))

// Label lookup for a flat option list, falling back to the raw value.
export const labelFor = (options, value) => options.find((option) => option.value === value)?.label ?? value
