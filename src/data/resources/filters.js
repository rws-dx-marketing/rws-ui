// Facet set for /resources/ — composed from data/taxonomies.js. The live resource
// centre's type tabs (Blog, Case studies, …) are the resource-type facet here.
import { facet, industries, products, resourceTypes, topics } from '../taxonomies.js'

export const filters = [facet('resource-type', 'Type', resourceTypes), facet('topic', 'Topic', topics), facet('product', 'Product', products), facet('industry', 'Industry', industries)]

export default filters
