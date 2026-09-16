// /tokens — resolves the theme cascade to hex in the browser and wires the
// copy / download buttons for each DTCG file.
//
// Semantic colours are color-mix() chains seeded per [data-theme], so the only
// faithful way to get literal values is to let the browser compute them. Each
// swatch on the page is its own probe: its background is `var(--x)` inside the
// themed block, and a 1×1 canvas turns the computed colour into sRGB hex.

const canvas = document.createElement('canvas')
canvas.width = canvas.height = 1
const ctx = canvas.getContext('2d', { willReadFrequently: true })

const toHex = (cssColor) => {
	ctx.clearRect(0, 0, 1, 1)
	ctx.fillStyle = cssColor
	ctx.fillRect(0, 0, 1, 1)
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
	return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

const rgbOf = (hex) => {
	const n = parseInt(hex.slice(1), 16)
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const colorToken = (hex, description) => {
	const components = rgbOf(hex).map((c) => Math.round((c / 255) * 10000) / 10000)
	return { $type: 'color', $value: { colorSpace: 'srgb', components, alpha: 1, hex }, $description: description }
}

const setDeep = (obj, path, value) => {
	const keys = path.split('/')
	let node = obj
	for (const key of keys.slice(0, -1)) node = node[key] ??= {}
	node[keys.at(-1)] = value
}

export default function tokens() {
	const root = document.getElementById('tokens')
	if (!root) return

	const files = JSON.parse(document.getElementById('tokens-static').textContent)

	// Theme modes are seeded from palette colours, so a match means the value *is*
	// that palette token; alias it rather than restate it. Both sides go through
	// the same canvas round-trip so the comparison can be exact — a tolerance
	// would false-match near-identical tints from different ramps.
	const paletteByHex = {}
	for (const probe of root.querySelectorAll('[data-palette-probe]')) {
		const hex = toHex(getComputedStyle(probe).backgroundColor)
		paletteByHex[hex] ??= probe.dataset.name
	}
	const paletteHexOf = (name) => name.split('/').reduce((node, key) => node[key], files.palette).$value.hex

	// Resolve every probe into its theme's file.
	for (const probe of root.querySelectorAll('[data-probe]')) {
		const { mode, path, css } = probe.dataset
		const out = probe.parentElement.querySelector('[data-hex]')
		const alias = paletteByHex[toHex(getComputedStyle(probe).backgroundColor)]
		// Aliased values take the palette file's hex so the fallback equals the target.
		const hex = alias ? paletteHexOf(alias) : toHex(getComputedStyle(probe).backgroundColor)
		let tok = colorToken(hex, css)
		if (alias) tok = { ...tok, $extensions: { 'com.figma.aliasData': { targetVariableSetName: root.dataset.paletteCollection, targetVariableName: alias } } }
		if (out) out.textContent = alias ? `${hex} → ${alias}` : hex
		files[`theme.${mode}`] ??= {}
		setDeep(files[`theme.${mode}`], path, tok)
	}

	const serialise = (name) => JSON.stringify(files[name], null, 2)

	for (const btn of root.querySelectorAll('[data-copy]')) {
		btn.disabled = false
		btn.addEventListener('click', async () => {
			await navigator.clipboard.writeText(serialise(btn.dataset.copy))
			const label = btn.textContent
			btn.textContent = 'Copied'
			setTimeout(() => (btn.textContent = label), 1200)
		})
	}

	for (const btn of root.querySelectorAll('[data-download]')) {
		btn.disabled = false
		btn.addEventListener('click', () => {
			const name = btn.dataset.download
			const blob = new Blob([serialise(name)], { type: 'application/json' })
			const a = document.createElement('a')
			a.href = URL.createObjectURL(blob)
			a.download = `${name}.tokens.json`
			a.click()
			URL.revokeObjectURL(a.href)
		})
	}
}
