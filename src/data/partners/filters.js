// Facet set for /partners/ — composed from data/taxonomies.js so the shared
// lists (products, solutions, industries, service areas, countries) stay in one
// place. Connectors use the same set with partner-type reworded.
import { countries, facet, industries, partnerTypes, products, serviceAreas, solutions } from '../taxonomies.js'

export const filters = [facet('partner-type', 'Partner type', partnerTypes), facet('product', 'Product', products), facet('solution', 'Solution', solutions), facet('industry', 'Industry', industries), facet('service-areas', 'Service areas', serviceAreas), facet('region', 'Region', countries)]

export default filters
