// Facet set for /connectors/ — identical to the partners set except that the
// partner-type facet is worded as connectors. The option *values* are unchanged,
// so connector records and partner records share one vocabulary.
import { countries, facet, industries, partnerTypes, products, relabel, serviceAreas, solutions } from '../taxonomies.js'

const connectorTypes = relabel(partnerTypes, {
	'technology-partner': 'Technology connector',
	'solution-partner': 'Solution connector',
	'training-partner': 'Training connector',
})

export const filters = [facet('partner-type', 'Connector type', connectorTypes), facet('product', 'Product', products), facet('solution', 'Solution', solutions), facet('industry', 'Industry', industries), facet('service-areas', 'Service areas', serviceAreas), facet('region', 'Region', countries)]

export default filters
