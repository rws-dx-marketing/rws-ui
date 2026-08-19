// Facet set for /faqs/. Note two facets deliberately differ from the partner and
// event archives despite sharing an id: 'product' is edition-level here (Trados
// Studio vs Team vs Enterprise) and 'region' is jurisdiction-level, not country.
import { audiences, facet, faqCategories, markets, productEditions, supportTopics, versions } from '../taxonomies.js'

export const filters = [facet('category', 'Category', faqCategories), facet('product', 'Product / service', productEditions), facet('version', 'Version', versions), facet('topic', 'Topic', supportTopics), facet('audience', 'Audience', audiences), facet('region', 'Region', markets)]

export default filters
