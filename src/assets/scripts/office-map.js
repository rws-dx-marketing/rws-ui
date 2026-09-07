// Mapbox maps for /about/offices/ — one script, two shapes:
//
//   [data-office-map]  a single office, centred on its own coordinates
//   [data-offices-map] the whole world, one pin per office, kept in sync with
//                      the archive's filters via the `cards:filtered` event
//
// The token is a public (pk.…) one, read at build time from PUBLIC_MAPBOX_TOKEN.
// Without it every map renders its own no-JS fallback rather than a broken tile
// grid, so the pages still work for anyone who clones without an .env.
//
// mapbox-gl and its stylesheet are imported dynamically, and only once a map
// element is on the page — statically imported they land in the shared
// init.client.js bundle and cost every page on the site ~1.5MB.
const token = import.meta.env.PUBLIC_MAPBOX_TOKEN

let mapboxgl

// Satellite imagery with streets, labels and transit overlaid. Standard Satellite
// is a variant of Standard rather than the older satellite-streets-v12, which
// matters: only the Standard family exposes configuration properties, so this is
// what makes `font` and `lightPreset` below possible at all.
const basemapStyle = 'mapbox://styles/mapbox/standard'

// The account that owns the uploaded font — must also be the account the token
// belongs to. Glyphs are served from whichever account owns the *style*, so
// loading mapbox://styles/mapbox/… asks mapbox's own font account for our brand
// font, doesn't find it, and silently resolves the stack to its Arial Unicode MS
// fallback. Hence the thin wrapper style below: it belongs to us, so `glyphs`
// points at our fonts, while `imports` still pulls in Standard Satellite whole.
const account = 'dxrws'

// Family name exactly as the Fonts API reports it. Mapbox composes per-weight
// stacks from this ('Articulat CF' → 'Articulat CF Regular' and so on).
const font = 'Articulat CF'

const isDark = () => document.documentElement.classList.contains('dark')
const lightPreset = () => (isDark() ? 'night' : 'day')
const basemap = () => ({ lightPreset: lightPreset(), font })

// Importing under the id 'basemap' keeps setConfigProperty('basemap', …) working
// exactly as it does against the stock style.
const style = () => ({
	version: 8,
	glyphs: `mapbox://fonts/${account}/{fontstack}/{range}.pbf`,
	sources: {},
	layers: [],
	imports: [{ id: 'basemap', url: basemapStyle, config: basemap() }],
})

// Config can only be set once the style is parsed, which is not guaranteed when
// a map is first constructed or when the toggle fires mid-load. Only the light
// preset is re-applied — the font never changes with the theme.
function applyLightPreset(map) {
	const set = () => map.setConfigProperty('basemap', 'lightPreset', lightPreset())
	if (map.isStyleLoaded()) set()
	else map.once('style.load', set)
}

function followTheme(map) {
	const observer = new MutationObserver(() => applyLightPreset(map))
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

// `reason` overrides the panel's default copy, which assumes a missing token.
// Without it an office that simply has no coordinates in the data tells the
// reader to go and set an env var that is already set.
function showFallback(container, reason) {
	const fallback = container.parentElement?.querySelector('[data-map-fallback]')
	if (fallback) {
		const message = reason && fallback.querySelector('[data-map-fallback-reason]')
		if (message) message.textContent = reason
		fallback.hidden = false
	}
	container.hidden = true
}

// A pin styled like the rest of the UI rather than Mapbox's default blue teardrop.
//
// `interactive` is false on a detail page, where the pin marks the one office the
// page is already about and opens nothing. That variant takes pointer-events-none,
// which drops the hover state with it and lets a drag pass straight through.
function marker(interactive = true) {
	const element = document.createElement('span')
	element.className = interactive ? 'office-map__pin' : 'office-map__pin office-map__pin--static'
	// The pin from public/shapes/marker.svg, inlined so fill can follow currentColor.
	// The white ring matches the cluster bubble's border: paint-order puts the stroke
	// under the fill so only its outer half shows, which at 30px wide is ~2px, and
	// overflow-visible stops that half being clipped at the viewBox edge.
	element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 192" overflow="visible" aria-hidden="true"><path fill="currentColor" stroke="white" stroke-width="21" stroke-linejoin="round" paint-order="stroke" d="M160 79.5499C160 35.6151 124.183 0 80 0C35.8167 0 0 35.6151 0 79.5499C0 102.369 9.66207 122.942 25.138 137.448L79.9985 192L134.859 137.448C150.337 122.944 159.997 102.369 159.997 79.5499H160Z"/></svg>'
	return element
}

function singleMap(container) {
	const lat = Number.parseFloat(container.dataset.lat)
	const lng = Number.parseFloat(container.dataset.lng)
	const zoom = Number.parseFloat(container.dataset.zoom) || 15
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return showFallback(container, 'This office has no coordinates in the data yet.')

	const map = new mapboxgl.Map({
		container,
		style: style(),
		center: [lng, lat],
		zoom,
		cooperativeGestures: true,
		attributionControl: false,
	})

	map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
	map.addControl(new mapboxgl.AttributionControl({ compact: true }))

	new mapboxgl.Marker({ element: marker(false), anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map)
	followTheme(map)
}

function archiveMap(container) {
	let offices = []
	try {
		offices = JSON.parse(container.dataset.offices ?? '[]').filter((office) => Number.isFinite(office.lat) && Number.isFinite(office.lng))
	} catch {
		return showFallback(container, 'Could not read the office coordinates.')
	}
	if (!offices.length) return showFallback(container, 'No offices have coordinates in the data yet.')

	const map = new mapboxgl.Map({
		container,
		style: style(),
		center: [10, 25],
		zoom: 1,
		cooperativeGestures: true,
		attributionControl: false,
	})

	map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
	map.addControl(new mapboxgl.AttributionControl({ compact: true }))

	let visible = offices

	// focusAfterOpen defaults to true: Mapbox focuses the first focusable element in
	// the popup as it opens, which drops a focus ring on the link after a plain mouse
	// click. Off here, so the ring only ever shows for someone tabbing to it.
	// The offset covers the 10px tip we hide in CSS as well as the pin, so the gap
	// between pin and panel stays what it was when the arrow was there.
	const popup = (office) => new mapboxgl.Popup({ offset: 38, closeButton: false, focusAfterOpen: false }).setHTML(`<a class="office-map__popup" href="${office.href}"><span class="office-map__popup__name">${office.name}</span><span class="office-map__popup__address">${office.address}</span></a>`)

	// Clustering is Mapbox's (supercluster under the hood) but the pins stay HTML
	// markers, so they keep the same styling, hover and popup as before. Each render
	// we ask the source what it currently shows — clusters or lone offices — and
	// reconcile the markers on screen against that.
	const sourceId = 'offices'
	const geojson = () => ({
		type: 'FeatureCollection',
		features: visible.map((office) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [office.lng, office.lat] }, properties: office })),
	})

	// Markers start hidden. Mapbox only works out whether a point is on the far side
	// of the globe ~60ms after a marker is added, and sets opacity then; added at
	// opacity 1, every pin behind the globe would show and then fade out on load.
	// Starting at 0 means the near side fades in and the far side never appears.
	const hidden = (element) => {
		element.style.opacity = '0'
		return element
	}

	const clusterMarker = (feature) => {
		const { cluster_id: id, point_count: count } = feature.properties
		const element = hidden(document.createElement('button'))
		element.type = 'button'
		element.className = 'office-map__cluster'
		element.textContent = count
		element.setAttribute('aria-label', `${count} offices, zoom in`)
		element.addEventListener('click', () => {
			map.getSource(sourceId).getClusterExpansionZoom(id, (error, zoom) => {
				if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom })
			})
		})
		return new mapboxgl.Marker({ element }).setLngLat(feature.geometry.coordinates)
	}

	const pinMarker = (feature) => new mapboxgl.Marker({ element: hidden(marker()), anchor: 'bottom' }).setLngLat(feature.geometry.coordinates).setPopup(popup(feature.properties))

	let markers = new Map()

	const clearMarkers = () => {
		markers.forEach((existing) => existing.remove())
		markers = new Map()
	}

	// querySourceFeatures returns a feature once per tile it touches, so the same
	// id can come back more than once — the `has` check dedupes.
	const syncMarkers = () => {
		if (!map.isSourceLoaded(sourceId)) return
		const next = new Map()
		for (const feature of map.querySourceFeatures(sourceId)) {
			const { cluster, cluster_id, slug } = feature.properties
			const id = cluster ? `cluster-${cluster_id}` : `office-${slug}`
			if (next.has(id)) continue
			const existing = markers.get(id) ?? (cluster ? clusterMarker(feature) : pinMarker(feature)).addTo(map)
			next.set(id, existing)
		}
		markers.forEach((existing, id) => {
			if (!next.has(id)) existing.remove()
		})
		markers = next
	}

	// The globe turns slowly on its own until the reader takes hold of it. Each
	// one-second ease is chained off the previous one's moveend, which is how
	// Mapbox's own example does it — a plain rAF loop would fight the map's camera.
	// Zoomed in past the globe there's nothing to spin, so it stops there too.
	let spinning = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const spinStep = () => {
		if (!spinning || map.getZoom() > 4) return
		const center = map.getCenter()
		center.lng -= 3
		map.easeTo({ center, duration: 1000, easing: (n) => n })
	}
	const stopSpinning = () => {
		spinning = false
	}

	// Not `wheel`: with cooperativeGestures a plain scroll over the map only shows
	// the "use ⌘ + scroll" hint, and someone scrolling past shouldn't lose the spin.
	// A real zoom, from ctrl+wheel or the +/- buttons, arrives as zoomstart.
	for (const event of ['mousedown', 'touchstart', 'dragstart', 'zoomstart']) map.on(event, stopSpinning)
	map.on('moveend', spinStep)

	// A source with no layer never loads its tiles, so nothing comes back from
	// querySourceFeatures. The circle layer is invisible; it only forces the load.
	map.on('load', () => {
		map.addSource(sourceId, { type: 'geojson', data: geojson(), cluster: true, clusterMaxZoom: 10, clusterRadius: 44 })
		map.addLayer({ id: sourceId, type: 'circle', source: sourceId, paint: { 'circle-radius': 0, 'circle-opacity': 0 } })
		map.on('render', syncMarkers)
		spinStep()
	})

	// Frame whatever is showing. A single pin has no extent to fit, so it gets a
	// flyTo at street zoom instead of a degenerate bounding box.
	const frame = () => {
		if (!visible.length) return
		if (visible.length === 1) {
			map.flyTo({ center: [visible[0].lng, visible[0].lat], zoom: 11 })
			return
		}

		const bounds = visible.reduce((box, office) => box.extend([office.lng, office.lat]), new mapboxgl.LngLatBounds())
		map.fitBounds(bounds, { padding: 64, maxZoom: 9, duration: 600 })
	}

	followTheme(map)

	document.addEventListener('cards:filtered', (event) => {
		const slugs = new Set(event.detail.cards.map((card) => card.dataset.cardSlug).filter(Boolean))
		visible = offices.filter((office) => slugs.has(office.slug))
		// Cluster ids are reassigned when the data changes, so an old marker's id can
		// now mean a different group. Start clean and let the next render redraw.
		clearMarkers()
		map.getSource(sourceId)?.setData(geojson())
		// Filtering is the reader steering the map too: framing the results while the
		// globe is still turning would have the two fighting over the camera.
		stopSpinning()
		frame()
	})
}

export default async function officeMap() {
	const single = document.querySelector('[data-office-map]')
	const archive = document.querySelector('[data-offices-map]')
	if (!single && !archive) return

	if (!token) {
		if (single) showFallback(single)
		if (archive) showFallback(archive)
		return
	}

	const [mapbox] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')])
	mapboxgl = mapbox.default

	mapboxgl.accessToken = token
	if (single) singleMap(single)
	if (archive) archiveMap(archive)
}
