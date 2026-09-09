// The mark the blob is built on: a rounded "W" (three humps up, two down).
//
// The outline is 128 points sampled radially from the brand artwork, in a
// space where the mark is 2 units wide and centred on the origin, y up. Its
// sharp corners are rounded off (see `corner`), and the body is that outline
// extruded in z with a fully rounded edge, so its cross-section is a pill:
// flat-ish in the middle of a stroke, round at the edges. Everything downstream — the marched surface in the shaders, the
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
	corner: 0.14, // in-plane corner radius: convex tips rounded off, notches filled to this radius
	soften: 0.05, // blur (world units) applied to the distance deep inside the mark; 0 keeps the medial ridge
	res: 256, // grid cells per side
	extent: 1.3, // grid covers ±extent in x and y
}

// The level set `grid = level` as line segments (world units), by marching
// squares with linear interpolation along cell edges, so it sits between
// cell centres rather than on them.
function levelSet(grid, res, step, extent, level) {
	const segs = []
	const x = (i) => -extent + (i + 0.5) * step
	for (let j = 0; j < res - 1; j++)
		for (let i = 0; i < res - 1; i++) {
			const a = grid[j * res + i] - level,
				b = grid[j * res + i + 1] - level,
				c = grid[(j + 1) * res + i + 1] - level,
				d = grid[(j + 1) * res + i] - level
			const code = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0)
			if (code === 0 || code === 15) continue
			// Crossing points on the bottom, right, top and left edges.
			const pts = []
			if (a < 0 !== b < 0) pts.push([x(i) + (step * a) / (a - b), x(j)])
			if (b < 0 !== c < 0) pts.push([x(i + 1), x(j) + (step * b) / (b - c)])
			if (c < 0 !== d < 0) pts.push([x(i + 1) - (step * c) / (c - d), x(j + 1)])
			if (d < 0 !== a < 0) pts.push([x(i), x(j + 1) - (step * d) / (d - a)])
			// Two crossings make one segment; four (a saddle) make two, paired
			// either way — the shape has no saddles at the radii used here.
			for (let k = 0; k + 1 < pts.length; k += 2) segs.push(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1])
		}
	return segs
}

// Distance from every cell centre to the nearest segment, via a coarse
// bucket grid so each cell only tests segments nearby.
function distanceToSegments(segs, res, step, extent) {
	const bucketCells = 8
	const nb = Math.ceil(res / bucketCells)
	const buckets = Array.from({ length: nb * nb }, () => [])
	const bx = (v) => Math.max(0, Math.min(nb - 1, Math.floor((v + extent) / step / bucketCells)))
	for (let k = 0; k < segs.length; k += 4) {
		const i0 = bx(Math.min(segs[k], segs[k + 2])),
			i1 = bx(Math.max(segs[k], segs[k + 2]))
		const j0 = bx(Math.min(segs[k + 1], segs[k + 3])),
			j1 = bx(Math.max(segs[k + 1], segs[k + 3]))
		for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) buckets[j * nb + i].push(k)
	}
	const out = new Float32Array(res * res)
	const bucketSize = bucketCells * step
	for (let j = 0; j < res; j++)
		for (let i = 0; i < res; i++) {
			const px = -extent + (i + 0.5) * step,
				py = -extent + (j + 0.5) * step
			const bi = Math.floor(i / bucketCells),
				bj = Math.floor(j / bucketCells)
			let best = Infinity
			// Rings of buckets outward; a ring can't beat `best` once its
			// nearest possible edge is further than that.
			for (let ring = 0; ring < nb; ring++) {
				if ((ring - 1) * bucketSize > Math.sqrt(best)) break
				for (let dj = -ring; dj <= ring; dj++)
					for (let di = -ring; di <= ring; di++) {
						if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue
						const ii = bi + di,
							jj = bj + dj
						if (ii < 0 || jj < 0 || ii >= nb || jj >= nb) continue
						for (const k of buckets[jj * nb + ii]) {
							const ax = segs[k],
								ay = segs[k + 1]
							const ex = segs[k + 2] - ax,
								ey = segs[k + 3] - ay
							const l2 = ex * ex + ey * ey
							const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / l2)) : 0
							const qx = ax + ex * t - px,
								qy = ay + ey * t - py
							best = Math.min(best, qx * qx + qy * qy)
						}
					}
			}
			out[j * res + i] = Math.sqrt(best)
		}
	return out
}

// Signed distance to the level set `grid = level`, negative where grid is
// below it. Offsetting a level set of an exact SDF is exact, so this is how
// each morphological step below is built.
function signedDistanceToLevel(grid, res, step, extent, level) {
	const d = distanceToSegments(levelSet(grid, res, step, extent, level), res, step, extent)
	const sd = new Float32Array(res * res)
	for (let i = 0; i < sd.length; i++) sd[i] = grid[i] < level ? -d[i] : d[i]
	return sd
}

// Morphological rounding of a distance grid: erode then dilate by `r` to
// round off convex corners (opening), then dilate then erode to fill concave
// ones (closing).
function roundCorners(grid, res, step, extent, r) {
	const opened = signedDistanceToLevel(grid, res, step, extent, -r)
	for (let i = 0; i < opened.length; i++) opened[i] -= r
	const closed = signedDistanceToLevel(opened, res, step, extent, r)
	for (let i = 0; i < closed.length; i++) closed[i] += r
	return closed
}

// Separable Gaussian blur, sigma in cells, edge-clamped.
function blur(grid, res, sigma) {
	const radius = Math.ceil(sigma * 3)
	const kernel = []
	let sum = 0
	for (let k = -radius; k <= radius; k++) sum += kernel[k + radius] = Math.exp(-(k * k) / (2 * sigma * sigma))
	for (let k = 0; k < kernel.length; k++) kernel[k] /= sum
	const tmp = new Float32Array(res * res),
		out = new Float32Array(res * res)
	for (let j = 0; j < res; j++)
		for (let i = 0; i < res; i++) {
			let v = 0
			for (let k = -radius; k <= radius; k++) v += kernel[k + radius] * grid[j * res + Math.max(0, Math.min(res - 1, i + k))]
			tmp[j * res + i] = v
		}
	for (let j = 0; j < res; j++)
		for (let i = 0; i < res; i++) {
			let v = 0
			for (let k = -radius; k <= radius; k++) v += kernel[k + radius] * tmp[Math.max(0, Math.min(res - 1, j + k)) * res + i]
			out[j * res + i] = v
		}
	return out
}

export function createShape(options = {}) {
	const { depth, round, corner, soften, res, extent } = { ...defaults, ...options }
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
	const exact = new Float32Array(res * res)
	for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) exact[j * res + i] = polygonSD(-extent + (i + 0.5) * step, -extent + (j + 0.5) * step)
	// The artwork has hard corners (the outer hump tips, the notches) that
	// read as horns and creases once extruded; every skin shares the rounded
	// version so they agree on the silhouette.
	const rounded = corner > 0 ? roundCorners(exact, res, step, extent, corner) : exact
	// The z profile below is driven by this distance, and a true distance has
	// a ridge along the stroke's medial axis where the nearest edge switches
	// sides. Where the stroke is thin — the hump tips — that ridge is steep
	// enough to shade as a crease, so deep inside the mark the distance is
	// blended toward a blurred copy. Near the surface it stays exact, so the
	// outline doesn't move; blurring only ever makes the inside shallower,
	// which the marches tolerate.
	let grid = rounded
	if (soften > 0) {
		const soft = blur(rounded, res, soften / step)
		grid = new Float32Array(res * res)
		for (let i = 0; i < grid.length; i++) {
			const t = Math.max(0, Math.min(1, (-rounded[i] - 0.04) / 0.1))
			grid[i] = rounded[i] + (soft[i] - rounded[i]) * t * t * (3 - 2 * t)
		}
	}

	// Bilinear read of the grid; matches sd2() in the shaders.
	function sd2(x, y) {
		// Past the grid's edge the clamped read goes flat; add the distance to
		// the grid so the field keeps growing.
		const ox = Math.max(Math.abs(x) - extent, 0),
			oy = Math.max(Math.abs(y) - extent, 0)
		const outside = Math.sqrt(ox * ox + oy * oy)
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
		return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy + outside
	}

	function sdBody(x, y, z) {
		const wx = sd2(x, y) + round
		const wy = Math.abs(z) - (depth - round)
		const mx = Math.max(wx, 0),
			my = Math.max(wy, 0)
		return Math.min(Math.max(wx, wy), 0) + Math.sqrt(mx * mx + my * my) - round
	}

	// Mirrors rayOrigin() / bodyBase() in blob.js: where the ray along
	// (dx, dy, dz) leaves the body, as [x, y, z].
	function march(dx, dy, dz) {
		const r = Math.hypot(dx, dy)
		const ux = dx / Math.max(r, 1e-5),
			uy = dy / Math.max(r, 1e-5)
		const smooth = (a, b, x) => {
			const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
			return t * t * (3 - 2 * t)
		}
		const k = -0.8 + 1.8 * smooth(-0.2, 0.2, uy)
		const fade = smooth(0, 0.3, r)
		const ox = ux * uy * 0.5 * k * fade,
			oy = uy * 0.15 * fade
		let t = 2
		for (let i = 0; i < 24; i++) t -= sdBody(ox + dx * t, oy + dy * t, dz * t)
		return [ox + dx * t, oy + dy * t, dz * t]
	}

	return { depth, round, res, extent, grid, sd2, sdBody, march }
}
