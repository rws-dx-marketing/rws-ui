// The mark the blob is built on: a rounded "W" (three humps up, two down).
//
// The outline is the brand artwork's own path (public/icons/weava_w_white.svg,
// one closed run of cubic Béziers) sampled densely into a polyline, in a
// space where the mark is 2 units wide and centred on the origin, y up. A
// coarse point sample was used before; its vertices put slope breaks in the
// rim that anything hugging it, like the black-hole skin's beams, reproduced
// as wrinkles. Its sharp corners are rounded off (see `corner`), and the body
// is that outline extruded in z with a fully rounded edge, so its
// cross-section is a pill: flat-ish in the middle of a stroke, round at the
// edges. Everything downstream — the marched surface in the shaders, the
// hover proxy, the balls lattice clip, the metaball field — reads the same
// signed distance, sampled from a small grid rasterised here at mount.

// The path's `d` as authored: relative cubics in a space the SVG maps with
// translate(0,490) scale(0.1,-0.1). Only the shape matters here, so it is
// read as is and normalised by its own bounds.
const pathData = 'M910 4248 c-291 -103 -413 -378 -397 -898 6 -217 25 -370 73 -610 94 -472 272 -973 481 -1355 239 -435 499 -715 758 -817 143 -56 343 -50 505 15 121 49 171 87 360 277 102 102 205 202 230 222 180 143 400 143 580 0 25 -20 128 -120 230 -222 189 -190 239 -228 360 -277 102 -41 192 -55 315 -50 93 3 122 9 190 35 395 155 794 731 1071 1547 148 434 230 853 241 1235 11 363 -45 607 -172 748 -101 112 -247 179 -373 170 -188 -14 -355 -145 -643 -503 -162 -202 -257 -302 -311 -328 -113 -54 -212 11 -437 288 -253 311 -425 452 -608 500 -73 19 -233 19 -306 0 -183 -48 -355 -189 -608 -500 -223 -274 -325 -341 -437 -288 -54 26 -149 126 -311 328 -294 366 -458 492 -651 502 -59 3 -89 -1 -140 -19z'

// Samples the path's cubics (`samples` points each) into one closed polyline
// normalised to 2 units wide and centred, as a flat [x, y, x, y, …] array.
function samplePath(d, samples = 16) {
	const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g)
	const pts = []
	let i = 0
	let cmd = ''
	let x = 0
	let y = 0
	const num = () => parseFloat(tokens[i++])
	const cubic = (x1, y1, x2, y2, x3, y3) => {
		for (let k = 0; k < samples; k++) {
			const t = k / samples
			const u = 1 - t
			pts.push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3)
		}
		x = x3
		y = y3
	}
	while (i < tokens.length) {
		if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++]
		if (cmd === 'M') {
			x = num()
			y = num()
		} else if (cmd === 'c') {
			const x1 = x + num(),
				y1 = y + num(),
				x2 = x + num(),
				y2 = y + num()
			cubic(x1, y1, x2, y2, x + num(), y + num())
		} else if (cmd === 'C') {
			cubic(num(), num(), num(), num(), num(), num())
		} else if (cmd === 'l') {
			cubic(x, y, x, y, x + num(), y + num())
		} else if (cmd === 'z' || cmd === 'Z') {
			break
		} else {
			throw new Error(`blob-shape: unhandled path command ${cmd}`)
		}
	}
	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity
	for (let k = 0; k < pts.length; k += 2) {
		minX = Math.min(minX, pts[k])
		maxX = Math.max(maxX, pts[k])
		minY = Math.min(minY, pts[k + 1])
		maxY = Math.max(maxY, pts[k + 1])
	}
	const scale = 2 / (maxX - minX)
	const cx = (minX + maxX) / 2
	const cy = (minY + maxY) / 2
	const out = new Float32Array(pts.length)
	for (let k = 0; k < pts.length; k += 2) {
		out[k] = (pts[k] - cx) * scale
		out[k + 1] = (pts[k + 1] - cy) * scale
	}
	return out
}

export const outline = samplePath(pathData)

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
