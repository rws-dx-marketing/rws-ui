// Facet set for the events archives. EventsFeed narrows this by facet id, so
// keep the ids stable: 'event-type', 'product', 'solution', 'industry', 'region'.
import { countries, eventTypes, facet, industries, products, solutions } from '../taxonomies.js'

export const filters = [facet('event-type', 'Type', eventTypes), facet('product', 'Product', products), facet('solution', 'Solution', solutions), facet('industry', 'Industry', industries), facet('region', 'Region', countries)]

export default filters
