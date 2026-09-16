// Helpers that shape values into DTCG (Design Tokens Community Group, 2025.10)
// tokens. Figma's native "import mode" reads this format directly, with one
// JSON file per mode, so we only emit resolved values — no aliases.

export const color = (hex, description) => {
	const n = parseInt(hex.slice(1), 16)
	const components = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round((c / 255) * 10000) / 10000)
	return token('color', { colorSpace: 'srgb', components, alpha: 1, hex }, description)
}

// Figma only accepts px dimensions.
export const px = (value, description) => token('dimension', { value, unit: 'px' }, description)

// Figma only accepts seconds.
export const seconds = (ms, description) => token('duration', { value: ms / 1000, unit: 's' }, description)

export const number = (value, description) => token('number', value, description)
export const string = (value, description) => token('string', value, description)
export const fontFamily = (value, description) => token('fontFamily', value, description)

// Cross-collection alias for Figma's importer. `collection` must match the
// collection name as typed in Figma; `name` is the slash-joined variable path.
// The resolved $value stays as a fallback for tools that ignore the extension.
export const aliasTo = (tok, collection, name) => ({
	...tok,
	$extensions: { 'com.figma.aliasData': { targetVariableSetName: collection, targetVariableName: name } },
})

export const token = ($type, $value, $description) => ($description ? { $type, $value, $description } : { $type, $value })

export const remToPx = (rem) => Math.round(parseFloat(rem) * 16 * 100) / 100
