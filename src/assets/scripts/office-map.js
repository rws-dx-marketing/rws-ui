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
	element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>'
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

	let markers = []
	let visible = offices

	// focusAfterOpen defaults to true: Mapbox focuses the first focusable element in
	// the popup as it opens, which drops a focus ring on the link after a plain mouse
	// click. Off here, so the ring only ever shows for someone tabbing to it.
	// The offset covers the 10px tip we hide in CSS as well as the pin, so the gap
	// between pin and panel stays what it was when the arrow was there.
	const popup = (office) => new mapboxgl.Popup({ offset: 38, closeButton: false, focusAfterOpen: false }).setHTML(`<a class="office-map__popup" href="${office.href}"><span class="office-map__popup__name">${office.name}</span><span class="office-map__popup__address">${office.address}</span></a>`)

	const drawPins = () => {
		markers.forEach((existing) => existing.remove())
		markers = visible.map((office) => new mapboxgl.Marker({ element: marker(), anchor: 'bottom' }).setLngLat([office.lng, office.lat]).setPopup(popup(office)).addTo(map))
	}

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

	map.on('load', drawPins)
	followTheme(map)

	document.addEventListener('cards:filtered', (event) => {
		const slugs = new Set(event.detail.cards.map((card) => card.dataset.cardSlug).filter(Boolean))
		visible = offices.filter((office) => slugs.has(office.slug))
		drawPins()
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
