// Pricing payload as produced by the CMS / backend.
//
// The backend emits pricing **segment-first**: an array of audience segments,
// each owning a self-contained `cardsCollection[0].productCards` list. Products
// that belong to more than one segment (Trados Team, Trados Business) are
// therefore authored *twice* — once per segment — with segment-specific copy.
//
// `pricingData` below is that payload verbatim. The page, however, renders a
// *merged* product model (each product once, tagged with the segments it lives
// in, carrying per-segment desc/features) so shared cards can morph between
// segments rather than being duplicated. `products`/`segments` at the bottom
// derive that model from the payload — see the mapping notes there.

export const pricingData = [
	{
		title: 'I translate',
		description: 'Freelancers',
		inlineSVG: { imageCode: '', alternateText: 'legal', id: '290783', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
		cardsCollection: [
			{
				productCards: [
					{
						productTitle: 'Trados Studio Go',
						productTagline: 'Browser CAT tool',
						pricingPlans: [
							{
								currency: { title: 'GBP', description: 'Pound sterling', key: '£', children: [], id: '', extendedProperties: {} },
								monthlyPrice: 27.0,
								annualPrice: 24.0,
								annualOfferPrice: 20.0,
								annualSaverPrice: 22.5,
								annualSaverBilledAnnuallyPrice: 20.0,
								billedPrice: 20.0,
								hasCurrency: true,
								hasMonthlyPrice: true,
								hasAnnualPrice: true,
								hasAnnualSaverPrice: true,
								hasMonthlyOfferPrice: false,
								hasAnnualOfferPrice: true,
								hasAnnualSaverOfferPrice: false,
								displayAnnualPrice: '20',
								displayMonthlyBasePrice: '27',
								displayAnnualBasePrice: '24',
								displayAnnualSaverBasePrice: '22.50',
								displayBilledPrice: '20',
								isEmpty: false,
							},
						],
						productDescription: 'Quick to set up and reach from anywhere. The browser CAT tool with everything you need to stay productive on the move.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Add secure, generative machine translation — 6M characters included to start.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualSaverCTA: [],
						monthlyRibbonText: '2 months free with code PLFY26*',
						annualRibbonText: '2 months free with code PLFY26*',
						features: [
							{ featureTitle: 'Browser-based — nothing to install', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: '1M cloud words per year', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Translation memory & terminology', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'AI Smart Help & guided tours', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: '10+ AppStore apps', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: true,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: true,
						hasAnnualCTA: true,
						hasMonthlyRibbonText: true,
						hasAnnualRibbonText: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293098',
					},
					{
						productTitle: 'Trados Studio Freelance',
						productTagline: 'Desktop + cloud',
						pricingPlans: [
							{
								currency: { title: 'GBP', description: 'Pound sterling', key: '£', children: [], id: '', extendedProperties: {} },
								monthlyPrice: 38.0,
								annualPrice: 28.33,
								annualSaverPrice: 31.5,
								annualSaverBilledAnnuallyPrice: 28.33,
								billedPrice: 28.33,
								hasCurrency: true,
								hasMonthlyPrice: true,
								hasAnnualPrice: true,
								hasAnnualSaverPrice: true,
								hasMonthlyOfferPrice: false,
								hasAnnualOfferPrice: false,
								hasAnnualSaverOfferPrice: false,
								displayMonthlyBasePrice: '38',
								displayAnnualBasePrice: '28.33',
								displayAnnualSaverBasePrice: '31.50',
								displayBilledPrice: '28.33',
								isEmpty: false,
							},
						],
						productDescription: 'Desktop and cloud in one. A complete professional environment with advanced features, flexibility and full control.',
						productBadgeLabel: 'Most popular',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Add secure, generative machine translation — 6M characters included to start.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualSaverCTA: [],
						monthlyRibbonText: '2 months free with code PLFY26*',
						annualRibbonText: '2 months free with code PLFY26*',
						features: [
							{ featureTitle: 'Desktop + browser working', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Unlimited desktop throughput', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'MultiTerm terminology management', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'AI Assistant in the desktop app', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: '150+ AppStore apps', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: true,
						hasProductBadgeLabel: true,
						hasMonthlyCTA: true,
						hasAnnualCTA: true,
						hasMonthlyRibbonText: true,
						hasAnnualRibbonText: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293102',
					},
				],
				footnoteText: '*New Trados subscriptions only. Get instant access to Studio 2024, plus Studio 2026 at launch. Applies to first-year annual plans. Prices exclude VAT.',
				currencyInfo: { id: 'GBP', priceFormat: '£{0}', currencyFormat: 'en-IE', currencySymbol: '£' },
				hasProductCards: true,
				hasFootnoteText: true,
				isEmpty: false,
				id: '293110',
				componentSettings: { theme: 'default', headingTag: 'H2', headingSize: 'md', bgImagePosition: 'unset', enableBranding: false, hasBgImage: false, renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
			},
		],
		hasInlineSvg: true,
		hasDescription: true,
	},
	{
		title: 'I sell translations',
		description: 'LSPs & teams',
		inlineSVG: { imageCode: '', alternateText: 'Finance', id: '290784', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
		cardsCollection: [
			{
				productCards: [
					{
						productTitle: 'Trados Team',
						productTagline: 'Cloud collaboration',
						pricingPlans: [],
						productDescription: 'Built for growing LSPs. Run client projects together in the cloud, protect quality with AI review, and keep small teams delivering on deadline.',
						productBadgeLabel: 'Most popular',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Secure generative MT across every project your team runs.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'Shared client projects in the cloud', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'AI-powered review to protect margins', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Assign roles across your team', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Reusable TMs & termbases per client', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Collaborate live on every delivery', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: true,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293104',
					},
					{
						productTitle: 'Trados Studio Pro',
						productTagline: 'Power-user desktop CAT',
						pricingPlans: [],
						productDescription: 'The power-user desktop CAT tool — maximum productivity, deep customization and 150+ apps for high-volume professionals.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Add secure generative MT to supercharge high-volume desktop productivity.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'Everything in Freelance', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Multi-user file handling', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Advanced project automation', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Full AppStore + API access', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Server & GroupShare projects', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293103',
					},
					{
						productTitle: 'Trados Business',
						productTagline: 'Out-of-the-box TMS',
						pricingPlans: [],
						productDescription: 'For language-service providers scaling up. An out-of-the-box TMS with vendor and freelancer management, automated client workflows and the reporting clients expect.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Enterprise-grade secure MT built into your workflows.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Speak to sales', isExternal: false, hasText: true, hasUrl: true, isVisible: true }],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'Out-of-the-box TMS for LSPs', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Manage vendors & freelance supply chain', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Automate repeatable client workflows', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Margin, cost & delivery dashboards', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Connect to client content sources', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293105',
					},
				],
				footnoteText: '*New Trados subscriptions only. Get instant access to Studio 2024, plus Studio 2026 at launch. Applies to first-year annual plans. Prices exclude VAT.',
				currencyInfo: { id: 'GBP', priceFormat: '£{0}', currencyFormat: 'en-IE', currencySymbol: '£' },
				hasProductCards: true,
				hasFootnoteText: true,
				isEmpty: false,
				id: '293111',
				componentSettings: { theme: 'default', headingTag: 'H2', headingSize: 'md', bgImagePosition: 'unset', enableBranding: false, hasBgImage: false, renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
			},
		],
		hasInlineSvg: true,
		hasDescription: true,
	},
	{
		title: 'I need translation',
		description: 'Businesses',
		inlineSVG: { imageCode: '', alternateText: 'Finance', id: '290784', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
		cardsCollection: [
			{
				productCards: [
					{
						productTitle: 'Trados Team',
						productTagline: 'Cloud collaboration',
						pricingPlans: [],
						productDescription: 'Built for in-house teams. Give everyone one place to translate company content together — shared memories and AI review, with no TMS to administer.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Secure generative MT across every project your team runs.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [
							{ url: '/artificial-intelligence/evolve/localization-evolved/', text: 'Start free trial', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
							{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Buy now', isExternal: false, hasText: true, hasUrl: true, isVisible: true },
						],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'One workspace for all company content', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'AI-powered review for brand consistency', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Simple roles for staff & reviewers', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Central TM & terminology for your brand', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Collaborate with zero IT overhead', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293106',
					},
					{
						productTitle: 'Trados Business',
						productTagline: 'Out-of-the-box TMS',
						pricingPlans: [],
						productDescription: 'For businesses bringing translation in-house. Automated workflows, dashboards and connectors plug Trados into the content your organization already produces.',
						productBadgeLabel: 'Most popular',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Enterprise-grade secure MT built into your workflows.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Speak to sales', isExternal: false, hasText: true, hasUrl: true, isVisible: true }],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'Out-of-the-box TMS for your business', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Automate internal translation requests', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Dashboards for cost & turnaround', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Connectors to your CMS & repositories', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Manage internal & external linguists', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: true,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293107',
					},
					{
						productTitle: 'Trados Enterprise',
						productTagline: 'Fully customizable TMS',
						pricingPlans: [],
						productDescription: 'A fully customizable TMS with SSO, advanced workflows and enterprise security for global content operations.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Pro',
								addonDescription: 'Secure, adaptive MT at enterprise scale — fully governed and customizable.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Speak to sales', isExternal: false, hasText: true, hasUrl: true, isVisible: true }],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'Everything in Business', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'SSO & advanced security', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Custom workflows & CPQ', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Dedicated success team', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Unlimited scale', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293108',
					},
					{
						productTitle: 'Trados Edge / GroupShare',
						productTagline: 'On-prem & private cloud',
						pricingPlans: [],
						productDescription: 'On-premises and private-cloud deployment for total data sovereignty and control.',
						productAddons: [
							{
								addonImage: { imageCode: '', alternateText: 'Feature 123', id: '290798', renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
								addonLabel: 'ADD-ON',
								addonTitle: '+ Language Weaver Edge',
								addonDescription: 'On-premises machine translation for fully air-gapped, sovereign environments.',
								hasAddonImage: true,
								hasAddonLabel: true,
								hasAddonTitle: true,
								hasAddonDescription: true,
								isEmpty: false,
								renderViewStyle: 0,
								hideOnMobile: false,
								hideOnDesktop: false,
							},
						],
						monthlyCTA: [],
						annualCTA: [{ url: '/artificial-intelligence/evolve/register-interest/', text: 'Speak to sales', isExternal: false, hasText: true, hasUrl: true, isVisible: true }],
						annualSaverCTA: [],
						features: [
							{ featureTitle: 'On-premises deployment', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Full data sovereignty', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Private-cloud option', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Server-based collaboration', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
							{ featureTitle: 'Air-gapped capable', hasFeatureTitle: true, hasFeatureInlineIcon: true, isEmpty: false },
						],
						hasPricingPlans: false,
						hasProductBadgeLabel: false,
						hasMonthlyCTA: false,
						hasAnnualCTA: true,
						hasFeatures: true,
						isEmpty: false,
						id: '293109',
					},
				],
				footnoteText: '*New Trados subscriptions only. Get instant access to Studio 2024, plus Studio 2026 at launch. Applies to first-year annual plans. Prices exclude VAT.',
				currencyInfo: { id: 'GBP', priceFormat: '£{0}', currencyFormat: 'en-IE', currencySymbol: '£' },
				hasProductCards: true,
				hasFootnoteText: true,
				isEmpty: false,
				id: '293112',
				componentSettings: { theme: 'default', headingTag: 'H2', headingSize: 'md', bgImagePosition: 'unset', enableBranding: false, hasBgImage: false, renderViewStyle: 0, hideOnMobile: false, hideOnDesktop: false },
			},
		],
		hasInlineSvg: true,
		hasDescription: true,
	},
]

// ── Restructuring the payload for the page ─────────────────────────────────
//
// The template reads CMS fields directly (`productTitle`, `pricingPlans[0]`,
// `features[].featureTitle`, …). The only job here is *structural*: give each
// segment and product a stable key, and fold the exploded per-segment cards
// back into one entry per product so shared cards render once and morph
// between segments.
//
// Both keys are *derived from the payload* so adding or renaming a segment or
// product can't leave a stale hand-maintained lookup behind:
//   • Segment key ← its sub-text, slugified ("LSPs & teams" → "lsps-and-teams").
//     Falls back to the index if a segment has no sub-text.
//   • Product id ← its title with the brand/tier words trimmed
//     ("Trados Studio Go" → "go"). The card `id` can't be used: it differs per
//     segment (Trados Team is 293104 here, 293106 there) and the morph needs
//     one identity per product across segments; the title is that identity.
// (The segment `inlineSVG.id`, e.g. 290783, is the icon image — not a segment
// identity, and not even unique: segments 2 & 3 both point at 290784.)

// "Trados Studio Go" → "go", "Trados Edge / GroupShare" → "edge".
export const productId = (title) =>
	title
		.replace(/^Trados\b/i, '')
		.replace(/\bStudio\b/i, '')
		.trim()
		.split(/[\s/]+/)[0]
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')

// "LSPs & teams" → "lsps-and-teams".
export const slugify = (s) =>
	(s || '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

// Presentational enrichment the CMS payload doesn't carry (its `inlineSVG` is
// an image reference, not a named icon). Optional and keyed by the derived
// segment key — a missing entry just renders no icon and falls back to the
// sub-text for the subtitle, so a new segment never breaks the page.
const SEGMENT_ENRICHMENT = {
	freelancers: { icon: 'user', subtitle: 'For individual translators. 14 day risk-free trial.' },
	'lsps-and-teams': { icon: 'users', subtitle: 'Built for language service providers and translation teams who deliver for clients.' },
	businesses: { icon: 'building', subtitle: 'For businesses and enterprises managing translation at scale, securely.' },
}

// The audience picker (radio group).
export const segments = pricingData.map((seg, i) => {
	const key = seg.hasDescription && seg.description ? slugify(seg.description) : String(i)
	const meta = SEGMENT_ENRICHMENT[key] ?? {}
	return { key, label: seg.title, sub: seg.description, icon: meta.icon ?? null, subtitle: meta.subtitle ?? seg.description }
})

// One entry per product. `base` is the first occurrence — the source for fields
// that don't vary across segments (title, tagline, price, CTAs, add-on).
// `cards[segment]` keeps each segment's own card for the fields that do
// (`productDescription`, `features`, `productBadgeLabel`). No field renaming —
// the template reads CMS keys straight off `base` and `cards[segment]`.
export const products = (() => {
	const out = {}

	pricingData.forEach((seg, i) => {
		const segKey = segments[i].key
		for (const card of seg.cardsCollection?.[0]?.productCards ?? []) {
			const id = productId(card.productTitle)
			if (!out[id]) out[id] = { id, segments: [], base: card, cards: {} }
			out[id].segments.push(segKey)
			out[id].cards[segKey] = card
		}
	})

	return out
})()
