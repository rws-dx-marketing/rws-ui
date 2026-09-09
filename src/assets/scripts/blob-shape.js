// The mark the blob is built on: a rounded "W" (three humps up, two down).
//
// The outline is 128 points sampled radially from the brand artwork, in a
// space where the mark is 2 units wide and centred on the origin, y up. The
// body is that outline extruded in z with a fully rounded edge, so its
// cross-section is a pill: flat-ish in the middle of a stroke, round at the
// edges. Everything downstream — the marched surface in the shaders, the
// hover proxy, the balls lattice clip, the metaball field — reads the same
// signed distance, sampled from a small grid rasterised here at mount.

// prettier-ignore
export const outline = new Float32Array([
	0.941, 0, 0.953, 0.047, 0.964, 0.095, 0.975, 0.145, 0.982, 0.195, 0.99, 0.248, 0.997, 0.302, 1.001, 0.358,
	0.997, 0.413, 0.993, 0.47, 0.986, 0.527, 0.967, 0.58, 0.938, 0.626, 0.895, 0.664, 0.84, 0.69, 0.761, 0.69,
	0.387, 0.387, 0.363, 0.401, 0.344, 0.42, 0.325, 0.438, 0.307, 0.46, 0.289, 0.482, 0.27, 0.505, 0.25, 0.528,
	0.229, 0.553, 0.207, 0.578, 0.183, 0.604, 0.157, 0.626, 0.128, 0.645, 0.098, 0.661, 0.066, 0.675, 0.033, 0.682,
	0, 0.686, -0.033, 0.682, -0.066, 0.675, -0.098, 0.663, -0.128, 0.645, -0.157, 0.627, -0.183, 0.605, -0.208, 0.583,
	-0.23, 0.556, -0.251, 0.53, -0.272, 0.508, -0.29, 0.484, -0.309, 0.462, -0.327, 0.441, -0.346, 0.421, -0.364, 0.402,
	-0.387, 0.387, -0.757, 0.686, -0.84, 0.69, -0.897, 0.665, -0.938, 0.627, -0.967, 0.58, -0.986, 0.527, -0.997, 0.471,
	-1.001, 0.415, -1.001, 0.358, -1, 0.303, -0.993, 0.249, -0.985, 0.196, -0.978, 0.145, -0.968, 0.095, -0.956, 0.047,
	-0.945, 0, -0.93, -0.046, -0.915, -0.09, -0.9, -0.134, -0.886, -0.176, -0.871, -0.218, -0.852, -0.259, -0.834, -0.299,
	-0.815, -0.338, -0.794, -0.375, -0.775, -0.414, -0.75, -0.449, -0.727, -0.486, -0.701, -0.52, -0.675, -0.554, -0.646, -0.585,
	-0.616, -0.616, -0.581, -0.642, -0.545, -0.664, -0.505, -0.681, -0.461, -0.69, -0.413, -0.69, -0.367, -0.686, -0.316, -0.667,
	-0.263, -0.634, -0.211, -0.59, -0.163, -0.538, -0.125, -0.501, -0.095, -0.479, -0.068, -0.46, -0.045, -0.453, -0.022, -0.449,
	0, -0.445, 0.022, -0.449, 0.045, -0.453, 0.069, -0.464, 0.095, -0.479, 0.126, -0.504, 0.165, -0.545, 0.214, -0.598,
	0.266, -0.642, 0.318, -0.672, 0.367, -0.686, 0.416, -0.693, 0.461, -0.69, 0.503, -0.678, 0.542, -0.66, 0.579, -0.639,
	0.612, -0.612, 0.643, -0.583, 0.671, -0.551, 0.701, -0.52, 0.723, -0.483, 0.749, -0.449, 0.771, -0.412, 0.794, -0.375,
	0.812, -0.336, 0.83, -0.297, 0.849, -0.258, 0.867, -0.217, 0.882, -0.175, 0.897, -0.133, 0.911, -0.09, 0.927, -0.046,
])

const defaults = {
	depth: 0.4, // half thickness of the body at its thickest
	round: 0.4, // edge radius; near `depth` so the section is a pill, not a slab
	res: 256, // grid cells per side
	extent: 1.3, // grid covers ±extent in x and y
}

export function createShape(options = {}) {
	const { depth, round, res, extent } = { ...defaults, ...options }
	const n = outline.length / 2

	// Exact signed distance to the outline polygon: nearest segment, sign by
	// even-odd crossing.
	function polygonSD(x, y) {
		let d2 = Infinity
		let inside = false
		for (let i = 0, j = n - 1; i < n; j = i++) {
			const ax = outline[i * 2],
				ay = outline[i * 2 + 1]
			const bx = outline[j * 2],
				by = outline[j * 2 + 1]
			const ex = bx - ax,
				ey = by - ay
			const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)))
			const px = ax + ex * t - x,
				py = ay + ey * t - y
			d2 = Math.min(d2, px * px + py * py)
			if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside
		}
		return (inside ? -1 : 1) * Math.sqrt(d2)
	}

	// Cell centres: cell (i, j) sits at (-extent + (i + 0.5) * step, …).
	const step = (2 * extent) / res
	const grid = new Float32Array(res * res)
	for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) grid[j * res + i] = polygonSD(-extent + (i + 0.5) * step, -extent + (j + 0.5) * step)

	// Bilinear read of the grid; matches sd2() in the shaders.
	function sd2(x, y) {
		const gx = Math.max(0, Math.min(res - 1, (x + extent) / step - 0.5))
		const gy = Math.max(0, Math.min(res - 1, (y + extent) / step - 0.5))
		const i = Math.min(res - 2, Math.floor(gx)),
			j = Math.min(res - 2, Math.floor(gy))
		const fx = gx - i,
			fy = gy - j
		const a = grid[j * res + i],
			b = grid[j * res + i + 1],
			c = grid[(j + 1) * res + i],
			d = grid[(j + 1) * res + i + 1]
		return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
	}

	function sdBody(x, y, z) {
		const wx = sd2(x, y) + round
		const wy = Math.abs(z) - (depth - round)
		const mx = Math.max(wx, 0),
			my = Math.max(wy, 0)
		return Math.min(Math.max(wx, wy), 0) + Math.sqrt(mx * mx + my * my) - round
	}

	// Where the ray from the centre along (dx, dy, dz) leaves the body.
	function march(dx, dy, dz) {
		let t = 0
		for (let i = 0; i < 24; i++) t -= sdBody(dx * t, dy * t, dz * t)
		return t
	}

	return { depth, round, res, extent, grid, sd2, sdBody, march }
}
