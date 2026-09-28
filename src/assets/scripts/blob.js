// 3D blob lab — the brand mark as a noise-displaced body with swappable "skins".
// The shape itself (a rounded W) comes from blob-shape.js.
//
//   [data-blob-lab]              groups hosts with their controls. Every host
//                                inside shares one skin and one set of sliders;
//                                a host with no lab ancestor is a lab of its own.
//   [data-blob="water"]          a canvas host; the first host's value is the
//                                lab's initial skin
//   [data-blob-detail="7"]       sphere subdivisions (default 7 ≈ 168k verts;
//                                single-mesh skins use one level finer, ≈ 663k)
//   [data-blob-skin="balls"]     a button that switches skin
//   [data-blob-param="amp"]      a range input that drives a live parameter
//   [data-blob-controls]         panel for the active skin's own controls. Its
//                                <template> (label + range input) is cloned per
//                                control; the panel is emptied on every switch.
//   [data-blob-settings]         JSON on the lab (or host) overriding the shared
//                                params, plus a `controls` object applied to the
//                                active skin's own controls on every switch:
//                                {"amp":0.3,"controls":{"count":5,"goo":0.3}}
//
// Bleed: style the canvas larger than its host (absolute, centred, e.g. 140%)
// and skins that reach past the body — long hair, satellites — stay visible
// instead of clipping at the host's edge. The camera widens by the same ratio,
// so the body sits exactly where it would in a host-sized canvas. Give the
// canvas pointer-events: none so the overflow doesn't cover what's around it.
//
// The blob never turns away: it's a brand mark and reads front-on. It leans a
// few degrees toward the cursor wherever it is on the page (`tilt`), and scroll
// feeds a damped spring ("sway") that each skin interprets — liquid sloshes,
// hair streams, balls jostle — so the shape stays put while the surface reacts.
//
// Displacement runs in the vertex shader. Every material that shades the main
// mesh is patched via onBeforeCompile to march each vertex along its radius
// onto the body's distance field offset by 4D Perlin noise + the sway + the
// hover bulge, with the normal as that field's gradient (the same surface the
// goo skin raymarches). The geometry itself never changes, so vertex count is
// only bounded by the GPU. The instanced skins — balls and hair — sample the
// same field per instance, so nothing is rebuilt on the CPU per frame.
//
// three is imported dynamically so the shared init bundle doesn't carry ~700KB
// for pages that never show a blob.
import { reducedMotion } from './motion'
import { createShape } from './blob-shape'
import { syncRange } from './range'

const brand = {
	primary: 0x7c4dff,
	tertiary: 0x3b1466,
	water: 0xdff4ff,
}

export default function blob() {
	if (typeof window === 'undefined') return
	const hosts = document.querySelectorAll('[data-blob]')
	if (!hosts.length) return

	const labs = new Map()
	hosts.forEach((host) => {
		const lab = host.closest('[data-blob-lab]') ?? host
		labs.set(lab, [...(labs.get(lab) ?? []), host])
	})

	Promise.all([import('three'), import('three/examples/jsm/environments/RoomEnvironment.js'), import('three/examples/jsm/objects/MarchingCubes.js')]).then(([THREE, { RoomEnvironment }, { MarchingCubes }]) => {
		labs.forEach((hosts, lab) => mountLab(lab, hosts, THREE, RoomEnvironment, MarchingCubes))
	})
}

// ── lab: one set of controls, any number of hosts ────────────────────────────
function mountLab(lab, hosts, THREE, RoomEnvironment, MarchingCubes) {
	const still = reducedMotion()

	// Shared by every host in the lab; the inputs write straight into it.
	const params = {
		amp: 0, // displacement amplitude
		freq: 0, // noise frequency across the surface
		speed: 0.35, // noise scroll through time
		hover: 0.4, // bulge height under the pointer
		inertia: 1, // how hard scroll kicks the spring
		tilt: 1, // how far the mark leans toward the cursor (0 = none, 1 ≈ 3°, 2 ≈ 6°)
	}

	const settings = readSettings(lab) ?? readSettings(hosts[0]) ?? {}
	Object.keys(params).forEach((k) => {
		if (typeof settings[k] === 'number') params[k] = settings[k]
	})

	const instances = hosts.map((host) => mount(host, params, THREE, RoomEnvironment, MarchingCubes))
	const rerender = () => still && instances.forEach((i) => i.render())

	function setSkin(name) {
		if (!instances.map((i) => i.setSkin(name)).some(Boolean)) return
		// Page-supplied values for the skin's own controls; keys the skin
		// doesn't have are ignored, so one object can cover several skins.
		instances.forEach((i) =>
			Object.entries(settings.controls ?? {}).forEach(([key, v]) => {
				const c = i.active?.controls?.[key]
				if (!c || typeof v !== 'number') return
				c.value = v
				c.set(v)
			}),
		)
		rerender()
		lab.querySelectorAll('[data-blob-skin]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.blobSkin === name)))
		renderControls(instances[0].active?.controls)
	}

	// ── per-skin controls ────────────────────────────────────────────────────
	// The panel's <template> holds one label + range input; it's cloned per
	// control so the markup (and its classes) stays in the page, not here.
	// Ranges and defaults come from the first instance; every input drives
	// the control of the same key on all of them.
	const panel = lab.querySelector('[data-blob-controls]')
	const template = panel?.querySelector('template')
	function renderControls(controls = {}) {
		if (!panel) return
		panel.querySelectorAll(':scope > :not(template)').forEach((el) => el.remove())
		const entries = Object.entries(controls)
		panel.hidden = !entries.length
		entries.forEach(([key, c]) => {
			const node = template ? template.content.cloneNode(true) : fallbackControl()
			const label = node.querySelector('label') ?? node.firstElementChild
			const input = node.querySelector('input')
			const text = node.querySelector('[data-blob-control-label]') ?? label
			text.prepend(c.label)
			Object.assign(input, { type: 'range', min: c.min, max: c.max, step: c.step, value: c.value })
			input.dataset.blobControl = key
			showValue(input)
			input.addEventListener('input', () => {
				const v = parseFloat(input.value)
				instances.forEach((i) => i.active?.controls?.[key]?.set(v))
				showValue(input)
				rerender()
			})
			panel.append(node)
		})
	}
	// Prints the input's value into the [data-blob-value] readout in its label,
	// with as many decimals as the step has, so settings can be copied exactly.
	function showValue(input) {
		const out = input.closest('label')?.querySelector('[data-blob-value]')
		if (!out) return
		const decimals = (String(input.step).split('.')[1] || '').length
		out.textContent = parseFloat(input.value).toFixed(decimals)
	}
	function fallbackControl() {
		const frag = document.createDocumentFragment()
		const label = document.createElement('label')
		label.append(document.createElement('input'))
		frag.append(label)
		return frag
	}

	lab.querySelectorAll('[data-blob-skin]').forEach((b) => b.addEventListener('click', () => setSkin(b.dataset.blobSkin)))
	lab.querySelectorAll('[data-blob-param]').forEach((input) => {
		const key = input.dataset.blobParam
		if (!(key in params)) return
		input.value = params[key]
		syncRange(input)
		showValue(input)
		input.addEventListener('input', () => {
			params[key] = parseFloat(input.value)
			showValue(input)
			rerender()
		})
	})

	setSkin(hosts[0].dataset.blob || 'clay')
}

function readSettings(el) {
	const raw = el?.dataset.blobSettings
	if (!raw) return null
	try {
		return JSON.parse(raw)
	} catch {
		console.warn('[blob] data-blob-settings is not valid JSON', el)
		return null
	}
}

// ── noise ────────────────────────────────────────────────────────────────────
// 4D classic Perlin noise, after webgl-noise (Ian McEwan, Ashima Arts, MIT).
// Perlin rather than simplex on purpose: 4D simplex noise is only piecewise
// smooth across its cells, and once displacement is scaled up the seams show
// as straight creases and flat facets no amount of tessellation removes.
// Classic noise blends with a quintic fade, so it is C2 everywhere.

const noiseGLSL = /* glsl */ `
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 fade(vec4 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

// Gradient for four lattice points hashed in h: a unit-ish vec4 per component.
void grad4(vec4 h, out vec4 gx, out vec4 gy, out vec4 gz, out vec4 gw) {
	gx = h * (1.0 / 7.0);
	gy = floor(gx) * (1.0 / 7.0);
	gz = floor(gy) * (1.0 / 6.0);
	gx = fract(gx) - 0.5;
	gy = fract(gy) - 0.5;
	gz = fract(gz) - 0.5;
	gw = vec4(0.75) - abs(gx) - abs(gy) - abs(gz);
	vec4 sw = step(gw, vec4(0.0));
	gx -= sw * (step(0.0, gx) - 0.5);
	gy -= sw * (step(0.0, gy) - 0.5);
}

float noise4(vec4 P) {
	vec4 Pi0 = mod289(floor(P));
	vec4 Pi1 = mod289(Pi0 + 1.0);
	vec4 Pf0 = fract(P);
	vec4 Pf1 = Pf0 - 1.0;
	// Corner order in each vec4: (x0,y0) (x1,y0) (x0,y1) (x1,y1)
	vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
	vec4 iy = vec4(Pi0.yy, Pi1.yy);
	vec4 ixy = permute(permute(ix) + iy);
	vec4 ixy0 = permute(ixy + Pi0.zzzz);
	vec4 ixy1 = permute(ixy + Pi1.zzzz);
	vec4 h00 = permute(ixy0 + Pi0.wwww);
	vec4 h01 = permute(ixy0 + Pi1.wwww);
	vec4 h10 = permute(ixy1 + Pi0.wwww);
	vec4 h11 = permute(ixy1 + Pi1.wwww);

	vec4 gx00, gy00, gz00, gw00; grad4(h00, gx00, gy00, gz00, gw00);
	vec4 gx01, gy01, gz01, gw01; grad4(h01, gx01, gy01, gz01, gw01);
	vec4 gx10, gy10, gz10, gw10; grad4(h10, gx10, gy10, gz10, gw10);
	vec4 gx11, gy11, gz11, gw11; grad4(h11, gx11, gy11, gz11, gw11);

	vec4 g0000 = vec4(gx00.x, gy00.x, gz00.x, gw00.x);
	vec4 g1000 = vec4(gx00.y, gy00.y, gz00.y, gw00.y);
	vec4 g0100 = vec4(gx00.z, gy00.z, gz00.z, gw00.z);
	vec4 g1100 = vec4(gx00.w, gy00.w, gz00.w, gw00.w);
	vec4 g0010 = vec4(gx10.x, gy10.x, gz10.x, gw10.x);
	vec4 g1010 = vec4(gx10.y, gy10.y, gz10.y, gw10.y);
	vec4 g0110 = vec4(gx10.z, gy10.z, gz10.z, gw10.z);
	vec4 g1110 = vec4(gx10.w, gy10.w, gz10.w, gw10.w);
	vec4 g0001 = vec4(gx01.x, gy01.x, gz01.x, gw01.x);
	vec4 g1001 = vec4(gx01.y, gy01.y, gz01.y, gw01.y);
	vec4 g0101 = vec4(gx01.z, gy01.z, gz01.z, gw01.z);
	vec4 g1101 = vec4(gx01.w, gy01.w, gz01.w, gw01.w);
	vec4 g0011 = vec4(gx11.x, gy11.x, gz11.x, gw11.x);
	vec4 g1011 = vec4(gx11.y, gy11.y, gz11.y, gw11.y);
	vec4 g0111 = vec4(gx11.z, gy11.z, gz11.z, gw11.z);
	vec4 g1111 = vec4(gx11.w, gy11.w, gz11.w, gw11.w);

	vec4 n00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
	g0000 *= n00.x; g0100 *= n00.y; g1000 *= n00.z; g1100 *= n00.w;
	vec4 n10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
	g0010 *= n10.x; g0110 *= n10.y; g1010 *= n10.z; g1110 *= n10.w;
	vec4 n01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
	g0001 *= n01.x; g0101 *= n01.y; g1001 *= n01.z; g1101 *= n01.w;
	vec4 n11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
	g0011 *= n11.x; g0111 *= n11.y; g1011 *= n11.z; g1111 *= n11.w;

	float n0000 = dot(g0000, Pf0);
	float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
	float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
	float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
	float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
	float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
	float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
	float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
	float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
	float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
	float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
	float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
	float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
	float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
	float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
	float n1111 = dot(g1111, Pf1);

	vec4 f = fade(Pf0);
	vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), f.w);
	vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), f.w);
	vec4 n_zw = mix(n_0w, n_1w, f.z);
	vec2 n_yzw = mix(n_zw.xy, n_zw.zw, f.y);
	return 2.2 * mix(n_yzw.x, n_yzw.y, f.x);
}
`

// The body and the displacement field every skin samples.
//
// The body is the mark from blob-shape.js: its 2D signed distance lives in
// a small float texture, extruded here with a rounded edge. The geometry is
// still a unit sphere; each vertex's direction is marched from the centre to
// where it leaves the body, and the noise then pushes along the body's own
// normal, so it reads as bumps on the front face and not just on the rim.
const bodyGLSL = /* glsl */ `
uniform sampler2D uShape;
uniform vec4 uShapeInfo; // extent, resolution, depth, round
float sd2(vec2 q) {
	// The grid clamps at its edge, so add the distance to it: otherwise the
	// field goes flat past ±extent and anything inflated beyond it fills the
	// whole outside.
	float outside = length(max(abs(q) - uShapeInfo.x, 0.0));
	// Cubic B-spline read, matching cubic() in the black-hole shader and
	// cubicSample() on the CPU. A bilinear read is only piecewise linear, and
	// the slope breaks at every cell edge came through the march and the
	// finite-difference normals as facets along the rim.
	float r = uShapeInfo.y;
	vec2 g = (q / uShapeInfo.x * 0.5 + 0.5) * r - 0.5;
	vec2 i = floor(g), f = g - i, f2 = f * f, f3 = f2 * f;
	vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0, w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
	vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0, w3 = f3 / 6.0;
#ifdef BLOB_SHAPE_LINEAR
	// With hardware bilinear the 16 taps fold into 4: each pair of weights
	// becomes one fetch placed between the two texels.
	vec2 g0 = w0 + w1, g1 = w2 + w3;
	vec2 h0 = (i - 0.5 + w1 / g0) / r, h1 = (i + 1.5 + w3 / g1) / r;
	float a = texture2D(uShape, vec2(h0.x, h0.y)).r, b = texture2D(uShape, vec2(h1.x, h0.y)).r;
	float c = texture2D(uShape, vec2(h0.x, h1.y)).r, d = texture2D(uShape, vec2(h1.x, h1.y)).r;
	return mix(mix(a, b, g1.x), mix(c, d, g1.x), g1.y) + outside;
#else
	vec4 wx = vec4(w0.x, w1.x, w2.x, w3.x), wy = vec4(w0.y, w1.y, w2.y, w3.y);
	ivec2 o = ivec2(i) - 1, hi = ivec2(int(r) - 1);
	float v = 0.0;
	for (int y = 0; y < 4; y++) {
		float row = 0.0;
		for (int x = 0; x < 4; x++) row += wx[x] * texelFetch(uShape, clamp(o + ivec2(x, y), ivec2(0), hi), 0).r;
		v += wy[y] * row;
	}
	return v + outside;
#endif
}
float sdBody(vec3 p) {
	vec2 w = vec2(sd2(p.xy) + uShapeInfo.w, abs(p.z) - (uShapeInfo.z - uShapeInfo.w));
	return min(max(w.x, w.y), 0.0) + length(max(w, vec2(0.0))) - uShapeInfo.w;
}
`

const displaceGLSL = /* glsl */ `
uniform float uTime, uAmp, uFreq, uSway, uHover, uPointerStrength;
uniform vec3 uPointer;
// The mark isn't star-shaped from its centre: from there the inner sides of
// the outer humps are only grazed, so a plain radial mapping bunches its
// vertices and shows a horn at each tip. Instead each direction's ray sets
// out from a point that slides toward whichever hump or lobe it points at,
// which meets every part of the outline at a decent angle. Faded out toward
// the poles, where the in-plane direction is ill-defined and the front face
// is reached from anywhere.
vec3 rayOrigin(vec3 d) {
	float r = length(d.xy);
	vec2 u = d.xy / max(r, 1e-5);
	float k = mix(-0.8, 1.0, smoothstep(-0.2, 0.2, u.y)); // lobes below sit closer in than the humps above
	return vec3(u.x * u.y * 0.5 * k, u.y * 0.15, 0.0) * smoothstep(0.0, 0.3, r);
}
// Where the ray along d leaves the body: sphere-traced inward from beyond
// everything the body reaches, so it settles on the outermost crossing
// rather than stalling on a grazed edge.
vec3 bodyBase(vec3 d) {
	vec3 o = rayOrigin(d);
	float t = 2.0;
	for (int i = 0; i < 24; i++) {
		float sd = sdBody(o + d * t);
		t -= sd;
		if (abs(sd) < 1e-4) break;
	}
	return o + d * t;
}
// Body normal from taps e apart; wide taps smooth over the medial axis,
// where the exact gradient flips, for anything displaced from inside the body.
vec3 bodyNAt(vec3 p, float e) {
	const vec2 k = vec2(1.0, -1.0);
	return normalize(k.xyy * sdBody(p + k.xyy * e) + k.yyx * sdBody(p + k.yyx * e) + k.yxy * sdBody(p + k.yxy * e) + k.xxx * sdBody(p + k.xxx * e));
}
vec3 bodyN(vec3 p) { return bodyNAt(p, 0.008); }
// Displacement at a point on the body.
float blobD(vec3 p) {
	float s = uSway;
	float v = uAmp * noise4(vec4(p.x * uFreq, p.y * uFreq + s * 1.5, p.z * uFreq, uTime));
	v += s * (-p.y * 0.28 + 0.1 * sin(p.y * 5.0 + s * 4.0) * (1.0 - p.y * p.y));
	// The same bulge profile as the goo skin, so hover feels alike across skins.
	vec3 q = p - uPointer;
	v += uPointerStrength * uHover * 0.5 * exp(-dot(q, q) * 4.0);
	return v;
}
// The displaced surface is the zero set of sdBody(p) - blobD(p): the noise,
// slosh and hover bulge offset the body's distance field, which is what the
// goo skin raymarches. Pushing each vertex along the body normal by the bulge
// at its base was tried first, and at the humps' tips and the notches, where
// neighbouring normals diverge or cross, the bulge fanned out or folded. An
// offset field instead rounds a tip and fillets a notch on its own.
float sdBlob(vec3 p) { return sdBody(p) - blobD(p); }
// Refines the body hit along its ray onto the displaced field. The offset
// field isn't a true distance (the noise adds to its slope), so the steps are
// damped; from the body the surface is within the displacement, so a few
// steps settle. Tracing from outside in with the result held near the body
// hit was tried, to keep grazing rays from crossing a filled notch, but
// neighbouring rays then land on different crossings and the notch creases.
vec3 blobP(vec3 d) {
	vec3 o = rayOrigin(d);
	float t = dot(bodyBase(d) - o, d);
	for (int i = 0; i < 10; i++) {
		float sd = sdBlob(o + d * t);
		t -= sd * 0.6;
		if (abs(sd) < 1e-4) break;
	}
	return o + d * t;
}
// Normal as the field's gradient, the same tetrahedron taps as the body.
vec3 blobN(vec3 d, vec3 p) {
	const vec2 k = vec2(1.0, -1.0);
	const float e = 0.008;
	return normalize(k.xyy * sdBlob(p + k.xyy * e) + k.yyx * sdBlob(p + k.yyx * e) + k.yxy * sdBlob(p + k.yxy * e) + k.xxx * sdBlob(p + k.xxx * e));
}
`

// Vertex stage for the skins that shade with their own ShaderMaterial (toon,
// contours, wire): the same march as displaced(), with the object-space
// point, the height above the undisplaced body and an optional push along
// the normal (the toon outline) handed to the fragment stage.
const marchedVertexGLSL = /* glsl */ `
${noiseGLSL}
${bodyGLSL}
${displaceGLSL}
uniform float uInflate;
varying vec3 vN, vV, vP;
varying float vH;
void main() {
	vec3 d = normalize(position);
	vec3 p = blobP(d);
	vec3 n = blobN(d, p);
	vP = p;
	vH = sdBody(p);
	p += n * uInflate;
	vN = normalize(normalMatrix * n);
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	vV = -mv.xyz;
	gl_Position = projectionMatrix * mv;
}
`

// ── procedural texture ───────────────────────────────────────────────────────
// Drawn to a canvas at mount so there is no image asset to serve.

// Reads a brand token off the host as its raw CSS string (oklch() as written).
function token(host, name, fallback) {
	return getComputedStyle(host).getPropertyValue(name).trim() || fallback
}

// THREE.Color can't parse oklch(), so resolve a token through a 1px canvas:
// the browser does the colour-space conversion and hands back sRGB bytes.
function tokenColor(THREE, host, name, fallback) {
	const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
	ctx.canvas.width = ctx.canvas.height = 1
	ctx.fillStyle = token(host, name, fallback)
	ctx.fillRect(0, 0, 1, 1)
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
	return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}

// A matcap is a picture of a lit sphere; the material looks up the normal in
// it. Painted from the brand tokens on the host, so it follows the theme:
// secondary lights the top-left, primary carries the body, tertiary takes the
// shadow side and the rim. Canvas accepts the oklch() strings as they are.
// `rim` is how far in from the silhouette the shadow starts (0–1 of the
// radius), `highlight` the specular radius, `blend` where primary gives way
// to tertiary along the body gradient.
function matcapTexture(THREE, host, { rim = 0.4, highlight = 0.14, blend = 0.55 } = {}) {
	const primary = token(host, '--color-primary', '#7c4dff')
	const secondary = token(host, '--color-secondary', '#e6306e')
	const tertiary = token(host, '--color-tertiary', '#3b1466')

	const size = 256
	const c = document.createElement('canvas')
	c.width = c.height = size
	const ctx = c.getContext('2d')

	const body = ctx.createLinearGradient(size * 0.1, size * 0.05, size * 0.9, size * 0.95)
	body.addColorStop(0, secondary)
	body.addColorStop(Math.min(0.2, blend * 0.5), secondary)
	body.addColorStop(blend, primary)
	body.addColorStop(1, tertiary)
	ctx.fillStyle = body
	ctx.fillRect(0, 0, size, size)

	// Rim: normals near the silhouette fall to tertiary.
	const rimG = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.5 * (1 - rim), size * 0.5, size * 0.5, size * 0.5)
	rimG.addColorStop(0, 'transparent')
	rimG.addColorStop(1, tertiary)
	ctx.fillStyle = rimG
	ctx.fillRect(0, 0, size, size)

	// Soft specular where the secondary light sits.
	if (highlight > 0) {
		const spec = ctx.createRadialGradient(size * 0.33, size * 0.3, 0, size * 0.33, size * 0.3, size * highlight)
		spec.addColorStop(0, 'rgba(255,255,255,0.7)')
		spec.addColorStop(0.4, 'rgba(255,255,255,0.15)')
		spec.addColorStop(1, 'transparent')
		ctx.fillStyle = spec
		ctx.fillRect(0, 0, size, size)
	}

	const t = new THREE.CanvasTexture(c)
	t.colorSpace = THREE.SRGBColorSpace
	return t
}

// A skin control: one range input in the [data-blob-controls] panel. `set`
// runs on every input event with the parsed value.
const ctl = (label, min, max, step, value, set) => ({ label, min, max, step, value, set })

// A unit geodesic sphere: each icosahedron face carved into an n×n
// triangle grid and pushed out to the sphere, indexed. three's own
// IcosahedronGeometry does the same but unindexed, and its `detail` is the
// grid size, not a subdivision count, so detail 8 is only 1,620 triangles;
// here n = 2^detail gives the counts a subdivision would. Vertices on face
// edges are duplicated, which the shaders don't mind: they place every
// vertex by its direction alone, so seams stay closed.
function geodesic(THREE, n) {
	const t = (1 + Math.sqrt(5)) / 2
	// prettier-ignore
	const v = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1]
	// prettier-ignore
	const f = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1]
	const perFace = ((n + 1) * (n + 2)) / 2
	const position = new Float32Array(20 * perFace * 3)
	const index = new Uint32Array(20 * n * n * 3)
	let pi = 0,
		ii = 0
	for (let face = 0; face < 20; face++) {
		const base = face * perFace
		const [a, b, c] = [0, 1, 2].map((k) => v.slice(f[face * 3 + k] * 3, f[face * 3 + k] * 3 + 3))
		// Row i has n + 1 - i vertices; `row(i)` is the index of its first.
		const row = (i) => base + i * (n + 1) - (i * (i - 1)) / 2
		for (let i = 0; i <= n; i++)
			for (let j = 0; j <= n - i; j++) {
				const x = a[0] + ((b[0] - a[0]) * j + (c[0] - a[0]) * i) / n
				const y = a[1] + ((b[1] - a[1]) * j + (c[1] - a[1]) * i) / n
				const z = a[2] + ((b[2] - a[2]) * j + (c[2] - a[2]) * i) / n
				const l = Math.hypot(x, y, z)
				position.set([x / l, y / l, z / l], pi)
				pi += 3
			}
		for (let i = 0; i < n; i++)
			for (let j = 0; j < n - i; j++) {
				const p = row(i) + j,
					q = row(i + 1) + j
				index.set([p, p + 1, q], ii)
				ii += 3
				if (j < n - i - 1) {
					index.set([p + 1, q + 1, q], ii)
					ii += 3
				}
			}
	}
	const geometry = new THREE.BufferGeometry()
	geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
	geometry.setIndex(new THREE.BufferAttribute(index, 1))
	// Directions are normals on a unit sphere; the displaced materials
	// replace them but the attribute needs to exist for the built-in chunks.
	geometry.setAttribute('normal', new THREE.BufferAttribute(position, 3))
	geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
	return geometry
}

// The distance grid and the spheres are the same for every canvas on the
// page (a geometry can be drawn by several renderers), so build them once.
const spheres = new Map()
const sphere = (THREE, n) => spheres.get(n) ?? spheres.set(n, geodesic(THREE, n)).get(n)

let sharedShape
let sharedHarmonic

// Cubic B-spline read of a square grid over ±extent, matching cubic() in
// the black-hole shader. Bilinear reads have slope breaks at every cell
// edge, and anything traced along the rim inherits them as wrinkles.
function cubicSample(grid, res, extent, x, y) {
	const gx = ((x / extent) * 0.5 + 0.5) * res - 0.5
	const gy = ((y / extent) * 0.5 + 0.5) * res - 0.5
	const ix = Math.floor(gx),
		iy = Math.floor(gy),
		fx = gx - ix,
		fy = gy - iy
	const weights = (f) => {
		const f2 = f * f,
			f3 = f2 * f
		return [(1 - 3 * f + 3 * f2 - f3) / 6, (4 - 6 * f2 + 3 * f3) / 6, (1 + 3 * f + 3 * f2 - 3 * f3) / 6, f3 / 6]
	}
	const wx = weights(fx),
		wy = weights(fy)
	const at = (i, j) => grid[Math.max(0, Math.min(res - 1, j)) * res + Math.max(0, Math.min(res - 1, i))]
	let v = 0
	for (let j = 0; j < 4; j++) {
		let row = 0
		for (let i = 0; i < 4; i++) row += wx[i] * at(ix - 1 + i, iy - 1 + j)
		v += wy[j] * row
	}
	return v
}

// The flow field for the black-hole skin: a smooth stand-in for distance
// from the mark. A distance field creases wherever the nearest edge switches
// and beams shaped by it kink there. This instead solves the screened
// Poisson equation (∇²c = c/L²) for a field that continues exp(-d/L) off the
// mark, so -L·ln(c) equals distance at the outline and inside it, yet is
// smooth everywhere outside. The grid is ±extent across; cells on and just
// inside the mark, and a ring just outside it, are fixed at the exact
// near-field value, and the far edge at 0. Full multigrid: the coarsest
// level is relaxed outright, each solution is lifted to start the next finer
// level, and V-cycles polish it; converged to about 1e-4 of the mark's
// size at the rim, where beams pack tightest. Solved once per page.
function harmonicField(shape, res = 384, extent = 2.5, L = 0.5, cycles = 6) {
	// The grid only clamps at its edge, so add the distance to it beyond.
	const shapeSD = (x, y) => {
		const ox = Math.max(Math.abs(x) - shape.extent, 0)
		const oy = Math.max(Math.abs(y) - shape.extent, 0)
		return cubicSample(shape.grid, shape.res, shape.extent, x, y) + Math.hypot(ox, oy)
	}
	const levels = []
	for (let n = res; n >= 16; n /= 2) {
		const step = (2 * extent) / n
		const fixed = new Uint8Array(n * n)
		const value = new Float32Array(n * n)
		const sd = new Float32Array(n * n)
		for (let j = 0; j < n; j++)
			for (let i = 0; i < n; i++) {
				const k = j * n + i
				sd[k] = shapeSD(-extent + (i + 0.5) * step, -extent + (j + 0.5) * step)
				if (sd[k] <= 0 || i === 0 || j === 0 || i === n - 1 || j === n - 1) {
					fixed[k] = 1
					// Inside, the exact near-field continuation, so the cubic read
					// across the rim sees no step; the rim value itself is 1.
					value[k] = sd[k] <= 0 ? Math.exp(-sd[k] / L) : 0
				}
			}
		levels.push({ n, step, fixed, value, sd, u: new Float32Array(n * n), f: new Float32Array(n * n), r: new Float32Array(n * n) })
	}
	// Stencils. Regular cells use the five-point screened Laplacian. On the
	// finest level, cells next to the outline are cut cells (Shortley–Weller):
	// each arm that crosses the outline is shortened to the crossing, where
	// the value is exactly 1. Fixing a ring of cells to the straight-edge
	// formula instead was measured to leave a band of ripple where the ring
	// ends, since that formula is wrong along a curved wall.
	for (const lv of levels) {
		const { n, step, fixed, sd } = lv
		const h2L = (step / L) ** 2
		const a = [new Float32Array(n * n), new Float32Array(n * n), new Float32Array(n * n), new Float32Array(n * n)] // E W N S
		const diag = new Float32Array(n * n)
		const rhs = new Float32Array(n * n)
		const cut = lv === levels[0]
		for (let j = 1; j < n - 1; j++)
			for (let i = 1; i < n - 1; i++) {
				const k = j * n + i
				if (fixed[k]) continue
				const nb = [k + 1, k - 1, k + n, k - n]
				let d = h2L
				for (let axis = 0; axis < 2; axis++) {
					const t = [1, 1]
					for (let side = 0; side < 2; side++) {
						const m = nb[axis * 2 + side]
						if (cut && sd[m] <= 0) t[side] = Math.max(0.1, sd[k] / (sd[k] - sd[m]))
					}
					const sum = t[0] + t[1]
					for (let side = 0; side < 2; side++) {
						const m = nb[axis * 2 + side]
						const coef = 2 / (t[side] * sum)
						if (cut && sd[m] <= 0)
							rhs[k] += coef // the outline's value, 1
						else a[axis * 2 + side][k] = coef
					}
					d += 2 / (t[0] * t[1])
				}
				diag[k] = d
			}
		Object.assign(lv, { a, diag, rhs })
	}
	const smooth = (lv, sweeps) => {
		const { n, fixed, u, f, a, diag, rhs } = lv
		for (let s = 0; s < sweeps; s++)
			for (let j = 1; j < n - 1; j++)
				for (let i = 1; i < n - 1; i++) {
					const k = j * n + i
					if (!fixed[k]) u[k] = (f[k] + rhs[k] + a[0][k] * u[k + 1] + a[1][k] * u[k - 1] + a[2][k] * u[k + n] + a[3][k] * u[k - n]) / diag[k]
				}
	}
	const residual = (lv) => {
		const { n, fixed, u, f, r, a, diag, rhs } = lv
		for (let j = 1; j < n - 1; j++)
			for (let i = 1; i < n - 1; i++) {
				const k = j * n + i
				r[k] = fixed[k] ? 0 : f[k] + rhs[k] - (diag[k] * u[k] - a[0][k] * u[k + 1] - a[1][k] * u[k - 1] - a[2][k] * u[k + n] - a[3][k] * u[k - n])
			}
	}
	// Bilinear prolongation of a coarse array onto a fine level's free cells.
	const lift = (lv, co, src, add) => {
		const n = lv.n,
			m = co.n
		for (let j = 0; j < n; j++)
			for (let i = 0; i < n; i++) {
				const k = j * n + i
				if (lv.fixed[k]) continue
				const gx = Math.max(0, Math.min(m - 1.001, (i + 0.5) / 2 - 0.5))
				const gy = Math.max(0, Math.min(m - 1.001, (j + 0.5) / 2 - 0.5))
				const i0 = Math.floor(gx),
					j0 = Math.floor(gy),
					fx = gx - i0,
					fy = gy - j0
				const v = (src[j0 * m + i0] * (1 - fx) + src[j0 * m + i0 + 1] * fx) * (1 - fy) + (src[(j0 + 1) * m + i0] * (1 - fx) + src[(j0 + 1) * m + i0 + 1] * fx) * fy
				if (add) lv.u[k] += v
				else lv.u[k] = v
			}
	}
	// One V-cycle from level l: smooth, restrict the residual (2×2 sum, which
	// is the coarser operator's scaling), solve the coarse error from zero,
	// lift it back, smooth again. Coarse levels run in correction mode, so
	// their rhs is dropped there.
	const vcycle = (l) => {
		const lv = levels[l]
		if (l === levels.length - 1) return smooth(lv, 200)
		smooth(lv, 3)
		residual(lv)
		const co = levels[l + 1]
		const n = lv.n,
			m = co.n
		for (let J = 0; J < m; J++)
			for (let I = 0; I < m; I++) {
				const K = J * m + I
				const k = 2 * J * n + 2 * I
				co.f[K] = co.fixed[K] ? 0 : lv.r[k] + lv.r[k + 1] + lv.r[k + n] + lv.r[k + n + 1]
				co.u[K] = 0
			}
		co.rhs.fill(0)
		vcycle(l + 1)
		lift(lv, co, co.u, true)
		smooth(lv, 3)
	}
	// Full multigrid: solve the coarsest level outright, then lift each
	// solution as the next finer level's start and polish with V-cycles. The
	// coarse levels' own rhs is only used while they are solved as starts.
	const rhsFull = levels.map((lv) => Float32Array.from(lv.rhs))
	for (let l = levels.length - 1; l >= 0; l--) {
		const lv = levels[l]
		lv.u.set(lv.value)
		lv.f.fill(0)
		lv.rhs.set(rhsFull[l])
		if (l === levels.length - 1) {
			smooth(lv, 400)
			continue
		}
		lift(lv, levels[l + 1], Float32Array.from(levels[l + 1].u), false)
		for (let c = 0; c < cycles; c++) {
			vcycle(l)
			lv.rhs.set(rhsFull[l])
		}
	}
	const top = levels[0]
	// Inside the mark the field is read too: the cubic sample straddles the
	// rim by two cells. Continue the solved field inward along the normal
	// with the slope it has one cell outside, so it is slope-continuous at
	// the rim; the straight-edge exponential used as the solve's start is
	// not, since the true slope depends on the rim's curvature.
	{
		const { n, step, u, sd } = top
		const read = (x, y) => {
			const gx = Math.max(0, Math.min(n - 1.001, ((x / extent) * 0.5 + 0.5) * n - 0.5))
			const gy = Math.max(0, Math.min(n - 1.001, ((y / extent) * 0.5 + 0.5) * n - 0.5))
			const i0 = Math.floor(gx),
				j0 = Math.floor(gy),
				fx = gx - i0,
				fy = gy - j0
			return (u[j0 * n + i0] * (1 - fx) + u[j0 * n + i0 + 1] * fx) * (1 - fy) + (u[(j0 + 1) * n + i0] * (1 - fx) + u[(j0 + 1) * n + i0 + 1] * fx) * fy
		}
		const out = Float32Array.from(u)
		for (let j = 1; j < n - 1; j++)
			for (let i = 1; i < n - 1; i++) {
				const k = j * n + i
				if (sd[k] > 0 || sd[k] < -5 * step) continue
				const x = -extent + (i + 0.5) * step
				const y = -extent + (j + 0.5) * step
				const e = step * 0.5
				let nx = shapeSD(x + e, y) - shapeSD(x - e, y)
				let ny = shapeSD(x, y + e) - shapeSD(x, y - e)
				const g = Math.hypot(nx, ny) || 1
				nx /= g
				ny /= g
				// The rim point, and the field one cell out from it.
				const rx = x - sd[k] * nx,
					ry = y - sd[k] * ny
				const slope = (1 - read(rx + nx * step, ry + ny * step)) / step
				out[k] = 1 + slope * -sd[k]
			}
		u.set(out)
	}
	// The grid's edge is pinned to zero, so the field is only trusted well
	// inside it; past that the shader hands over to the plain distance, which
	// runs forever. Far from the mark the smooth distance is the plain one
	// plus a near-constant; measure it on a ring where the hand-over begins
	// so the two agree there.
	let offset = 0
	const ring = 0.6 * extent
	for (let i = 0; i < 64; i++) {
		const a = (i / 64) * Math.PI * 2
		const x = Math.cos(a) * ring
		const y = Math.sin(a) * ring
		offset += -L * Math.log(Math.max(cubicSample(top.u, res, extent, x, y), 1e-6)) - shapeSD(x, y)
	}
	return { grid: top.u, res, extent, L, offset: offset / 64 }
}

// ── instance: one canvas ─────────────────────────────────────────────────────
// Returns { setSkin, render, active }; the lab owns the controls.
function mount(host, params, THREE, RoomEnvironment, MarchingCubes) {
	const still = reducedMotion()
	const detail = parseInt(host.dataset.blobDetail, 10) || 7

	// ── renderer / scene ─────────────────────────────────────────────────────
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.outputColorSpace = THREE.SRGBColorSpace
	host.append(renderer.domElement)

	const scene = new THREE.Scene()
	const fov = 32
	const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50)
	camera.position.set(0, 0, 4.6)

	// A room environment gives physical materials (glass/water) something to
	// refract and reflect, and lifts everything else without hand-placed lights.
	const pmrem = new THREE.PMREMGenerator(renderer)
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
	pmrem.dispose()

	const key = new THREE.DirectionalLight(0xffffff, 1.6)
	key.position.set(3, 4, 5)
	scene.add(key, new THREE.HemisphereLight(0xffffff, 0x3b1466, 0.6))

	const group = new THREE.Group()
	scene.add(group)

	// ── scroll → spring ──────────────────────────────────────────────────────
	// Scroll velocity kicks a damped oscillator. `sway.x` is the value skins read:
	// positive means the page just moved up (scrolling down), so loose material
	// trails downward; it then overshoots and settles like liquid in a glass.
	const sway = { x: 0, v: 0, dir: 1, kicked: false } // dir: which way the last scroll went; kicked: a scroll arrived this frame
	let lastScroll = window.scrollY
	let kick = 0
	window.addEventListener(
		'scroll',
		() => {
			kick += window.scrollY - lastScroll
			lastScroll = window.scrollY
		},
		{ passive: true },
	)

	function stepSway(dt, stiffness, damping) {
		sway.v += Math.max(-4, Math.min(4, kick * 0.008 * params.inertia))
		if (kick) {
			sway.dir = Math.sign(kick)
			sway.kicked = true
		}
		kick = 0
		sway.v += (-sway.x * stiffness - sway.v * damping) * dt
		sway.x = Math.max(-1, Math.min(1, sway.x + sway.v * dt))
	}

	// ── cursor → lean ────────────────────────────────────────────────────────
	// Where the pointer is relative to the host's centre, anywhere on the page,
	// in half-viewport units clamped to ±1. `lean` eases toward it each frame
	// and the group turns a few degrees that way; skins can also read it (the
	// goo key light follows it). Nothing happens under reduced motion.
	const cursor = new THREE.Vector2()
	const lean = new THREE.Vector2()
	if (!still) {
		window.addEventListener(
			'pointermove',
			(e) => {
				const r = host.getBoundingClientRect()
				cursor.set((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -(e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)).clampScalar(-1, 1)
			},
			{ passive: true },
		)
	}

	// ── body ─────────────────────────────────────────────────────────────────
	const shape = (sharedShape ??= createShape())
	const shapeTexture = new THREE.DataTexture(shape.grid, shape.res, shape.res, THREE.RedFormat, THREE.FloatType)
	// Hardware bilinear on a float texture needs an extension; with it the
	// cubic read in sd2 needs four fetches instead of sixteen.
	const linear = renderer.extensions.has('OES_texture_float_linear')
	shapeTexture.minFilter = shapeTexture.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter
	shapeTexture.generateMipmaps = false
	shapeTexture.needsUpdate = true
	const shapeDefines = linear ? { BLOB_SHAPE_LINEAR: '' } : {}

	// ── displacement ─────────────────────────────────────────────────────────
	// The geometry stays a sphere: the vertex shader marches each direction
	// to the body surface, so the bounding sphere just has to cover the mark.
	const geometry = sphere(THREE, 2 ** detail)
	// One subdivision finer (4× the vertices) for skins that draw the mesh
	// once. Cores sit underneath other geometry, so a coarse one does.
	const fine = sphere(THREE, 2 ** (detail + 1))
	const coarse = sphere(THREE, 2 ** Math.min(detail, 5))
	// `vel` accumulates pointer movement across the surface and decays each
	// frame, so skins can react to a swipe, not just a position.
	const pointer = { local: new THREE.Vector3(0, 0, shape.depth), vel: new THREE.Vector3(), strength: 0, target: 0 }
	let time = 0
	let slosh = 0.5 // how much sway deforms the body (liquid 1, solids less)

	// Shared by every patched material; updated once per frame.
	const uniforms = {
		uShape: { value: shapeTexture },
		uShapeInfo: { value: new THREE.Vector4(shape.extent, shape.res, shape.depth, shape.round) },
		uTime: { value: 0 },
		uAmp: { value: params.amp },
		uFreq: { value: params.freq },
		uSway: { value: 0 },
		uHover: { value: params.hover },
		uPointerStrength: { value: 0 },
		uPointer: { value: pointer.local },
		uPointerVel: { value: pointer.vel },
		// Raw spring state and a rattle amount, for skins that read the spring
		// directly rather than through the body slosh.
		uSwayX: { value: 0 },
		uSwayV: { value: 0 },
		uJostle: { value: 0 },
	}

	// Patch a built-in material so its vertex stage lands each vertex on the
	// displaced body and rebuilds the normal. Works for any material whose
	// vertex shader uses the standard chunks — Standard, Physical, Matcap.
	function displaced(material) {
		material.defines = { ...material.defines, ...shapeDefines }
		material.onBeforeCompile = (shader) => {
			Object.assign(shader.uniforms, uniforms)
			shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${noiseGLSL}\n${bodyGLSL}\n${displaceGLSL}`).replace('#include <beginnormal_vertex>', 'vec3 blobDir = normalize(position); vec3 blobPos = blobP(blobDir); vec3 objectNormal = blobN(blobDir, blobPos);').replace('#include <begin_vertex>', 'vec3 transformed = blobPos;')
		}
		material.customProgramCacheKey = () => 'blob'
		return material
	}

	const core = (scale, color = brand.tertiary) => {
		const m = new THREE.Mesh(coarse, displaced(new THREE.MeshStandardMaterial({ color, roughness: 0.85 })))
		m.scale.setScalar(scale)
		return m
	}

	// ── backdrop: the page behind the canvas, for glass ──────────────────────
	// Transmission refracts what is in the scene, not what is on the page, so
	// the nearest ancestor's background image (cover, centred; a plain colour
	// if there is no image) is drawn on a screen-filling quad. It draws only in
	// the transmission pass, which renders to a target: in the main pass, to
	// the canvas, it writes nothing, and the real page shows through. Its UVs
	// are re-derived from the two rects each frame so it lines up with the CSS
	// image under the canvas. The colour is put through the inverse of the
	// renderer's tone mapping so the image seen through the glass comes out
	// as it is on the page. Skins opt in with `backdrop: true`.
	let backdrop = null
	function getBackdrop() {
		if (backdrop) return backdrop
		let el = host.parentElement
		let url = null
		for (; el; el = el.parentElement) {
			const cs = getComputedStyle(el)
			// Quoted or bare url(); a data: SVG can hold the other quote inside.
			url = cs.backgroundImage.match(/url\((["']?)(.*?)\1\)/)?.[2] ?? null
			if (url || (cs.backgroundColor !== 'transparent' && !cs.backgroundColor.startsWith('rgba(0, 0, 0, 0)'))) break
		}
		const material = new THREE.ShaderMaterial({
			depthTest: false,
			depthWrite: false,
			defines: renderer.toneMapping === THREE.ACESFilmicToneMapping ? { BACKDROP_ACES: '' } : {},
			uniforms: {
				uMap: { value: null },
				uColor: { value: el ? tokenColor(THREE, el, 'background-color', '#ffffff') : new THREE.Color(0xffffff) },
				uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
				uRepeat: { value: 0 },
				uExposure: { value: renderer.toneMappingExposure },
			},
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = vec4(position.xy, 0.9999, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				uniform sampler2D uMap;
				uniform vec3 uColor;
				uniform vec4 uRect;
				uniform float uRepeat;
				uniform float uExposure;
				varying vec2 vUv;
				#ifdef BACKDROP_ACES
					// Inverse of three's ACESFilmicToneMapping: the output matrix
					// undone, the rational RRT/ODT fit solved as a quadratic, the
					// input matrix undone, then the exposure and the 1/0.6 gain.
					vec3 acesInverse(vec3 c) {
						const mat3 outInv = mat3(vec3(0.64304, 0.05927, 0.00596), vec3(0.31119, 0.93144, 0.06393), vec3(0.04578, 0.00929, 0.93012));
						const mat3 inInv = mat3(vec3(1.76474, -0.14703, -0.03634), vec3(-0.67578, 1.16025, -0.16244), vec3(-0.08896, -0.01322, 1.19877));
						vec3 y = outInv * clamp(c, 0.0, 0.99);
						vec3 A = 1.0 - 0.983729 * y;
						vec3 B = 0.0245786 - 0.4329510 * y;
						vec3 C = -(0.000090537 + 0.238081 * y);
						vec3 v = (-B + sqrt(B * B - 4.0 * A * C)) / (2.0 * A);
						return inInv * v * 0.6 / uExposure;
					}
				#endif
				void main() {
					vec3 c = uColor;
					#ifdef USE_MAP
						// The image composited over the colour, as CSS draws it; a
						// non-repeating one only inside its own box.
						vec2 uv = uRect.xy + vUv * uRect.zw;
						vec4 t = texture2D(uMap, uv);
						if (uRepeat < 0.5 && (uv != clamp(uv, 0.0, 1.0))) t.a = 0.0;
						c = mix(c, t.rgb, t.a);
					#endif
					#ifdef BACKDROP_ACES
						c = acesInverse(c);
					#endif
					gl_FragColor = vec4(c, 1.0);
				}
			`,
		})
		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
		quad.frustumCulled = false
		quad.renderOrder = -1
		quad.onBeforeRender = (r) => (material.colorWrite = r.getRenderTarget() !== null)
		let image = null
		if (url) {
			new THREE.TextureLoader().load(url, (t) => {
				t.colorSpace = THREE.SRGBColorSpace
				if (getComputedStyle(el).backgroundRepeat.startsWith('repeat')) {
					t.wrapS = t.wrapT = THREE.RepeatWrapping
					material.uniforms.uRepeat.value = 1
				}
				material.uniforms.uMap.value = t
				material.defines.USE_MAP = ''
				material.needsUpdate = true
				image = t.image
				if (still) renderFrame(0)
			})
		}
		backdrop = {
			quad,
			// Canvas UV → image UV, laying the image out as CSS does: sized by
			// background-size (cover, contain, auto or lengths), placed by
			// background-position, and tiled from there if it repeats.
			sync() {
				if (!image) return
				const cs = getComputedStyle(el)
				const c = renderer.domElement.getBoundingClientRect()
				const e = el.getBoundingClientRect()
				const [sx, sy = 'auto'] = cs.backgroundSize.split(' ')
				let w, h
				if (sx === 'cover' || sx === 'contain') {
					const s = (sx === 'cover' ? Math.max : Math.min)(e.width / image.width, e.height / image.height)
					w = image.width * s
					h = image.height * s
				} else {
					w = sx === 'auto' ? image.width : parseFloat(sx)
					h = sy === 'auto' ? (w * image.height) / image.width : parseFloat(sy)
				}
				const [px, py] = cs.backgroundPosition.split(' ')
				const place = (v, room) => (v.endsWith('%') ? (room * parseFloat(v)) / 100 : parseFloat(v))
				const x0 = e.left + place(px, e.width - w)
				const y0 = e.top + place(py, e.height - h)
				material.uniforms.uRect.value.set((c.left - x0) / w, 1 - (c.top + c.height - y0) / h, c.width / w, c.height / h)
			},
		}
		return backdrop
	}

	// ── glyph skins: ascii and matrix ────────────────────────────────────────
	// The body is drawn with the brand matcap into an offscreen target, and a
	// quad in front of it then draws one glyph per screen cell from that image:
	// the cell's brightness picks a character from a density ramp (ascii), or
	// columns of code characters rain down inside the silhouette with the
	// shading underneath (matrix). The glyphs live in an atlas painted to a
	// canvas at mount; cells are in screen pixels, so the type never scales
	// with the body. The two skins are one function with different defaults.
	const glyphAtlas = (chars) => {
		const cw = 20
		const ch = 32
		const c = document.createElement('canvas')
		c.width = cw * chars.length
		c.height = ch
		const ctx = c.getContext('2d')
		ctx.font = `bold 26px ui-monospace, Menlo, Consolas, monospace`
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillStyle = '#fff'
		chars.forEach((ch2, i) => ctx.fillText(ch2, cw * (i + 0.5), ch * 0.52))
		const t = new THREE.CanvasTexture(c)
		t.minFilter = t.magFilter = THREE.LinearFilter
		t.generateMipmaps = false
		return t
	}
	function glyphs({ rain }) {
		// Density ramp first, then the code set the rain draws from.
		const ramp = [...' .:-=+*#%@']
		const code = [...'01{}[]<>/\\=+*#$%&;:ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ']
		const atlas = glyphAtlas([...ramp, ...code])
		const body = new THREE.Mesh(fine, displaced(new THREE.MeshMatcapMaterial({ matcap: matcapTexture(THREE, host, { rim: 0.5, highlight: 0.16, blend: 0.55 }) })))
		body.layers.set(1)
		const size = renderer.getDrawingBufferSize(new THREE.Vector2())
		const rt = new THREE.WebGLRenderTarget(size.x, size.y)
		const own = {
			uCell: { value: 9 },
			uSpeed: { value: 1 },
			uTrail: { value: 9 },
			uFlicker: { value: rain ? 8 : 0 },
			uMono: { value: rain ? 1 : 0.7 },
			uShade: { value: rain ? 0.6 : 0 },
			uAmbient: { value: rain ? 0.2 : 0.12 },
			uContrast: { value: 2.5 },
			uInvert: { value: 1 },
		}
		const material = new THREE.ShaderMaterial({
			defines: rain ? { GLYPH_RAIN: '' } : {},
			transparent: true,
			depthWrite: false,
			uniforms: {
				...own,
				uScene: { value: rt.texture },
				uAtlas: { value: atlas },
				uRes: { value: size },
				uPx: { value: renderer.getPixelRatio() },
				uTime: uniforms.uTime,
				uRampN: { value: ramp.length },
				uTotalN: { value: ramp.length + code.length },
				uColor: { value: tokenColor(THREE, host, '--color-primary', '#7c4dff') },
				uColor2: { value: tokenColor(THREE, host, '--color-secondary', '#e6306e') },
			},
			vertexShader: /* glsl */ `
				void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
			`,
			fragmentShader: /* glsl */ `
				uniform sampler2D uScene, uAtlas;
				uniform vec2 uRes;
				uniform float uCell, uPx, uTime, uSpeed, uTrail, uFlicker, uMono, uShade, uAmbient, uRampN, uTotalN, uContrast, uInvert;
				uniform vec3 uColor, uColor2;
				float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
				void main() {
					vec2 cellSz = vec2(uCell * 0.6, uCell) * uPx;
					vec2 cell = floor(gl_FragCoord.xy / cellSz);
					vec4 s = texture2D(uScene, (cell + 0.5) * cellSz / uRes);
					if (s.a < 0.5) discard;
					// The matcap's luminance sits in a narrow dark band; stretch it over
					// the ramp. Inverted, dense glyphs fall on the shadow side, which is
					// how shading reads on a light page.
					float l = clamp(0.5 + (dot(s.rgb, vec3(0.299, 0.587, 0.114)) - 0.25) * uContrast, 0.0, 1.0);
					l = mix(l, 1.0 - l, uInvert);
					float tick = floor(uTime * uFlicker);
					float r = hash(cell + tick);
					// Rain: two drops per column, each with its own pace and phase,
					// leaving a trail that fades over uTrail rows. Rows count from the top.
					float b = 1.0, hot = 0.0;
					vec2 inCell = fract(gl_FragCoord.xy / cellSz);
#ifdef GLYPH_RAIN
					float rows = uRes.y / cellSz.y;
					float row = rows - cell.y;
					float drop = 0.0;
					for (int k = 0; k < 2; k++) {
						float seed = hash(vec2(cell.x + 1.0, float(k) * 13.0));
						float head = mod(uTime * uSpeed * (5.0 + seed * 7.0) + seed * rows * 3.0, rows * 1.5) - rows * 0.25;
						float d = head - row;
						if (d >= 0.0) {
							float tr = exp(-d / uTrail);
							drop = max(drop, tr);
							hot = max(hot, smoothstep(0.75, 1.0, tr));
						}
					}
					b = max(drop, uAmbient);
					// A code character, reshuffled at uFlicker per second.
					float idx = uRampN + floor(r * (uTotalN - uRampN - 0.001));
#else
					// The density ramp by brightness; flicker jitters the pick a little.
					float idx = floor(clamp(l + (r - 0.5) * 0.15 * min(uFlicker, 1.0), 0.0, 0.999) * uRampN);
#endif
					float g = texture2D(uAtlas, vec2((idx + inCell.x) / uTotalN, inCell.y)).a;
					vec3 col = mix(s.rgb, uColor, uMono) * mix(1.0, 0.4 + l, uShade);
					col = mix(col, uColor2, hot);
					gl_FragColor = vec4(col * mix(1.0, b, 0.5), g * b);
					#include <colorspace_fragment>
				}
			`,
		})
		const quad = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).translate(0, 0, 2.5), material)
		quad.frustumCulled = false
		return {
			objects: [body, quad],
			spring: rain ? [40, 4] : [60, 7],
			slosh: 0.4,
			controls: {
				cell: ctl('Cell size', 6, 40, 1, own.uCell.value, (v) => (own.uCell.value = v)),
				...(rain
					? {
							speed: ctl('Rain speed', 0, 4, 0.05, own.uSpeed.value, (v) => (own.uSpeed.value = v)),
							trail: ctl('Trail', 1, 30, 0.5, own.uTrail.value, (v) => (own.uTrail.value = v)),
							ambient: ctl('Idle glow', 0, 0.6, 0.01, own.uAmbient.value, (v) => (own.uAmbient.value = v)),
						}
					: {
							contrast: ctl('Contrast', 0.5, 6, 0.1, own.uContrast.value, (v) => (own.uContrast.value = v)),
							invert: ctl('Invert', 0, 1, 1, own.uInvert.value, (v) => (own.uInvert.value = v)),
						}),
				flicker: ctl('Flicker', 0, 30, 0.5, own.uFlicker.value, (v) => (own.uFlicker.value = v)),
				mono: ctl('Brand → mono', 0, 1, 0.01, own.uMono.value, (v) => (own.uMono.value = v)),
				shade: ctl('Shading', 0, 1, 0.01, own.uShade.value, (v) => (own.uShade.value = v)),
			},
			// Runs before the main render: draw the body alone (layer 1) into
			// the target the quad reads. Sized to the drawing buffer.
			update() {
				renderer.getDrawingBufferSize(size)
				if (rt.width !== size.x || rt.height !== size.y) rt.setSize(size.x, size.y)
				material.uniforms.uPx.value = renderer.getPixelRatio()
				camera.layers.set(1)
				renderer.setRenderTarget(rt)
				renderer.render(scene, camera)
				renderer.setRenderTarget(null)
				camera.layers.set(0)
			},
			dispose: () => {
				rt.dispose()
				atlas.dispose()
				body.material.matcap.dispose()
				body.material.dispose()
				quad.geometry.dispose()
				material.dispose()
			},
		}
	}

	// ── skins ────────────────────────────────────────────────────────────────
	// Each skin returns { objects, spring?, slosh?, controls?, update?, dispose? }.
	//   spring   — [stiffness, damping] for the scroll oscillator
	//   slosh    — how much sway deforms the body itself
	//   controls — { key: ctl(...) } rendered into [data-blob-controls]
	//   update   — runs each frame after the spring has stepped
	const skins = {
		clay() {
			const material = displaced(new THREE.MeshStandardMaterial({ color: brand.primary, roughness: 0.55, metalness: 0.05 }))
			const mesh = new THREE.Mesh(fine, material)
			return {
				objects: [mesh],
				spring: [60, 7],
				slosh: 0.35,
				controls: {
					roughness: ctl('Roughness', 0, 1, 0.01, material.roughness, (v) => (material.roughness = v)),
					metalness: ctl('Metalness', 0, 1, 0.01, material.metalness, (v) => (material.metalness = v)),
					sheen: ctl('Sheen', 0, 3, 0.05, material.envMapIntensity, (v) => (material.envMapIntensity = v)),
				},
				dispose: () => material.dispose(),
			}
		},

		water() {
			const material = displaced(
				new THREE.MeshPhysicalMaterial({
					color: brand.water,
					transmission: 1,
					thickness: 1.4,
					roughness: 0.04,
					ior: 1.33,
					attenuationColor: new THREE.Color(0x8fd3ff),
					attenuationDistance: 1.2,
					clearcoat: 1,
					clearcoatRoughness: 0.05,
					envMapIntensity: 1.4,
				}),
			)
			const mesh = new THREE.Mesh(fine, material)
			// Transmission refracts whatever is behind the mesh; on a transparent
			// canvas that's just the environment map, so a coloured core gives the
			// refraction something to bend. The core lags the slosh, like a bubble.
			// Sized to sit inside the middle stroke, with room to lag up and down.
			const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 3), new THREE.MeshStandardMaterial({ color: brand.primary, roughness: 0.3 }))
			const p = { lag: 0.3, bubble: 1 }
			return {
				objects: [mesh, inner],
				spring: [30, 2.2],
				slosh: 1,
				controls: {
					depth: ctl('Depth', 0.1, 4, 0.05, material.thickness, (v) => (material.thickness = v)),
					refraction: ctl('Refraction', 1, 2.33, 0.01, material.ior, (v) => (material.ior = v)),
					tint: ctl('Tint', 0, 1, 0.01, 1 - material.attenuationDistance / 3, (v) => (material.attenuationDistance = 3 * (1 - v) + 0.05)),
					frost: ctl('Frost', 0, 0.5, 0.005, material.roughness, (v) => (material.roughness = v)),
					bubble: ctl('Bubble size', 0, 2, 0.05, p.bubble, (v) => inner.scale.setScalar(v)),
					lag: ctl('Bubble lag', 0, 1, 0.01, p.lag, (v) => (p.lag = v)),
				},
				update() {
					inner.position.y = sway.x * p.lag
				},
				dispose: () => {
					material.dispose()
					inner.geometry.dispose()
					inner.material.dispose()
				},
			}
		},

		iridescent() {
			// Thin-film physical material. With transparency up it turns to
			// glass: transmission refracts the backdrop (see getBackdrop) and the
			// film stays as a soap-bubble sheen on the surface.
			const material = displaced(
				new THREE.MeshPhysicalMaterial({
					color: 0xffffff,
					metalness: 0.25,
					roughness: 0.18,
					iridescence: 1,
					iridescenceIOR: 1.6,
					iridescenceThicknessRange: [120, 520],
					envMapIntensity: 1.2,
					transmission: 0,
					thickness: 1,
					ior: 1.5,
				}),
			)
			const mesh = new THREE.Mesh(fine, material)
			return {
				objects: [mesh],
				backdrop: true,
				spring: [45, 4],
				slosh: 0.6,
				controls: {
					film: ctl('Film thickness', 100, 1400, 10, material.iridescenceThicknessRange[1], (v) => (material.iridescenceThicknessRange = [Math.min(120, v), v])),
					shimmer: ctl('Shimmer', 0, 1, 0.01, material.iridescence, (v) => (material.iridescence = v)),
					metalness: ctl('Metalness', 0, 1, 0.01, material.metalness, (v) => (material.metalness = v)),
					roughness: ctl('Roughness', 0, 1, 0.01, material.roughness, (v) => (material.roughness = v)),
					glass: ctl('Transparency', 0, 1, 0.01, material.transmission, (v) => (material.transmission = v)),
					refraction: ctl('Refraction', 1, 2.33, 0.01, material.ior, (v) => (material.ior = v)),
					depth: ctl('Depth', 0.1, 4, 0.05, material.thickness, (v) => (material.thickness = v)),
				},
				dispose: () => material.dispose(),
			}
		},

		matcap() {
			// The lit-sphere image is repainted on each control change (256px
			// canvas, cheap) and swapped into the material.
			const p = { rim: 0.4, highlight: 0.14, blend: 0.55 }
			const material = displaced(new THREE.MeshMatcapMaterial({ matcap: matcapTexture(THREE, host, p) }))
			const mesh = new THREE.Mesh(fine, material)
			const repaint = (key) => (v) => {
				p[key] = v
				material.matcap.dispose()
				material.matcap = matcapTexture(THREE, host, p)
			}
			return {
				objects: [mesh],
				spring: [60, 7],
				slosh: 0.35,
				controls: {
					rim: ctl('Rim shadow', 0, 0.9, 0.01, p.rim, repaint('rim')),
					highlight: ctl('Highlight', 0, 0.4, 0.005, p.highlight, repaint('highlight')),
					blend: ctl('Colour blend', 0.2, 0.95, 0.01, p.blend, repaint('blend')),
				},
				dispose: () => {
					material.matcap.dispose()
					material.dispose()
				},
			}
		},

		mesh() {
			// The supplied Blender export: a glossy dielectric with a mesh
			// gradient baked into its texture, lit by its own soft key. Nothing
			// here is baked: the gradient is pools of the bake's own colours
			// (sampled from the texture, not the tokens: it is one fixed
			// artwork) as Gaussian blobs anchored in the mark's plane (it never
			// rotates, so object-space xy stands in for the UV map), drifting on
			// slow loops. Shaded by its own key light rather than the scene's:
			// a wrapped diffuse, a lavender highlight on the hump tops and a
			// fresnel that sinks the silhouette into navy. No tone mapping, so
			// the colours land as sampled.
			const rgb = (hex) => ({ value: new THREE.Color(hex) })
			const palette = {
				uNavy: rgb(0x14044a),
				uIndigo: rgb(0x2a0a95),
				uBlue: rgb(0x4b22c4),
				uViolet: rgb(0x9747f1),
				uPurple: rgb(0xc018d5),
				uMagenta: rgb(0xe61799),
				uCrimson: rgb(0xa8003e),
				uGleam: rgb(0xd8c8f8),
				uLightDir: { value: new THREE.Vector3(-0.35, 0.8, 0.65).normalize() },
			}
			const own = {
				uDrift: { value: 0.12 },
				uSpread: { value: 0.42 },
				uContrast: { value: 0.6 },
				uSpec: { value: 0.9 },
				uGloss: { value: 48 },
				uRimDark: { value: 0.9 },
			}
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				uniforms: { ...uniforms, ...palette, ...own, uInflate: { value: 0 } },
				vertexShader: marchedVertexGLSL,
				fragmentShader: /* glsl */ `
					uniform vec3 uNavy, uIndigo, uBlue, uViolet, uPurple, uMagenta, uCrimson, uGleam, uLightDir;
					uniform float uTime, uDrift, uSpread, uContrast, uSpec, uGloss, uRimDark;
					varying vec3 vN, vV, vP;
					// One pool: a Gaussian of the colour at the anchor, accumulated
					// into a weighted sum. \`size\` scales the radius per pool.
					void pool(inout vec3 sum, inout float wsum, vec2 p, vec2 at, float size, vec3 col, float k) {
						vec2 d = (p - at) / size;
						float w = exp(-dot(d, d) * k);
						sum += w * col;
						wsum += w;
					}
					// Anchors read off the bake's front face: navy and indigo on the
					// far left, violet across the top humps, a magenta band running
					// from centre-left down to crimson at the bottom-left, blue on
					// the right sinking to indigo in the lower-right corner.
					vec3 meshGradient(vec2 p) {
						float t = uTime * uDrift;
						float k = 1.0 / (uSpread * uSpread);
						vec2 w1 = vec2(sin(t), cos(t * 0.8)) * 0.1;
						vec2 w2 = vec2(cos(t * 0.6), sin(t * 1.1)) * 0.08;
						vec3 sum = vec3(0.0);
						float wsum = 0.0;
						pool(sum, wsum, p, vec2(-1.1, 0.1) + w2, 1.5, uNavy, k);
						pool(sum, wsum, p, vec2(-0.8, 0.3) + w1, 1.0, uIndigo, k);
						pool(sum, wsum, p, vec2(-0.6, 0.42) + w2.yx, 0.8, uBlue, k);
						pool(sum, wsum, p, vec2(0.0, 0.4) + w1, 1.0, uViolet, k);
						pool(sum, wsum, p, vec2(0.55, 0.3) - w2, 1.0, uViolet, k);
						pool(sum, wsum, p, vec2(1.0, 0.35) + w1.yx, 0.9, uViolet, k);
						pool(sum, wsum, p, vec2(0.1, 0.1) - w1, 0.8, uPurple, k);
						pool(sum, wsum, p, vec2(-0.35, 0.1) + w1, 0.9, uMagenta, k);
						pool(sum, wsum, p, vec2(-0.2, -0.15) + w2, 0.9, uMagenta, k);
						pool(sum, wsum, p, vec2(0.0, -0.42) - w2.yx, 0.9, uMagenta, k);
						pool(sum, wsum, p, vec2(-0.6, -0.4) - w1, 1.0, uCrimson, k);
						pool(sum, wsum, p, vec2(0.25, -0.4) + w1.yx, 0.7, uPurple, k);
						pool(sum, wsum, p, vec2(0.45, -0.1) + w2, 1.0, uBlue, k);
						pool(sum, wsum, p, vec2(0.8, -0.2) - w1.yx, 1.3, uBlue, k);
						pool(sum, wsum, p, vec2(1.0, -0.4) + w2.yx, 1.2, uIndigo, k);
						pool(sum, wsum, p, vec2(1.15, -0.5), 1.3, uNavy, k);
						return sum / max(wsum, 1e-4);
					}
					void main() {
						vec3 n = normalize(vN);
						vec3 v = normalize(vV);
						vec3 col = meshGradient(vP.xy);
						// Wrapped diffuse: the bake is lit softly from the upper left,
						// hump tops lifted, the undersides sunk.
						float d = dot(n, uLightDir) * 0.5 + 0.5;
						col *= mix(1.0 - uContrast * 0.8, 1.0 + uContrast * 0.35, d);
						// A tight lavender gleam plus a broad sheen under it.
						float nh = max(dot(n, normalize(uLightDir + v)), 0.0);
						col += uGleam * (pow(nh, uGloss) * 0.9 + pow(nh, uGloss * 0.12) * 0.12) * uSpec;
						float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0);
						col = mix(col, uNavy * 0.5, rim * uRimDark);
						gl_FragColor = vec4(col, 1.0);
						#include <colorspace_fragment>
					}
				`,
			})
			const mesh = new THREE.Mesh(fine, material)
			return {
				objects: [mesh],
				spring: [60, 7],
				slosh: 0.35,
				controls: {
					drift: ctl('Drift', 0, 0.5, 0.01, own.uDrift.value, (v) => (own.uDrift.value = v)),
					spread: ctl('Pool size', 0.2, 1, 0.01, own.uSpread.value, (v) => (own.uSpread.value = v)),
					contrast: ctl('Light', 0, 1, 0.01, own.uContrast.value, (v) => (own.uContrast.value = v)),
					spec: ctl('Highlight', 0, 2, 0.05, own.uSpec.value, (v) => (own.uSpec.value = v)),
					gloss: ctl('Gloss', 8, 160, 1, own.uGloss.value, (v) => (own.uGloss.value = v)),
					rim: ctl('Edge shade', 0, 1, 0.01, own.uRimDark.value, (v) => (own.uRimDark.value = v)),
				},
				dispose: () => material.dispose(),
			}
		},

		balls() {
			// The whole body is balls, not a shell of them: a face-centred cubic
			// lattice clipped to the body. Each instance carries its lattice
			// centre; the vertex shader marches the centre's direction to the
			// surface and moves the ball by that point's displacement, scaled by
			// how deep it sits, so the outer layer *is* the surface and the
			// interior stretches with it. Nothing is touched on the CPU.
			const spacing = 0.047
			const radius = spacing * 0.58 // nearest neighbours sit spacing·√2 apart
			const centres = []
			const seeds = []
			const n = Math.ceil(1.1 / spacing)
			const tilt = new THREE.Euler(0.45, 0.35, 0.2) // keep lattice planes off the view axis; the jitter below hides the rows
			const v = new THREE.Vector3()
			for (let i = -n; i <= n; i++)
				for (let j = -n; j <= n; j++)
					for (let k = -n; k <= n; k++) {
						if ((i + j + k) & 1) continue
						v.set(i + (Math.random() - 0.5) * 0.3, j + (Math.random() - 0.5) * 0.3, k + (Math.random() - 0.5) * 0.3)
							.multiplyScalar(spacing)
							.applyEuler(tilt)
						if (shape.sdBody(v.x, v.y, v.z) > -radius * 0.7) continue
						centres.push(v.x, v.y, v.z)
						seeds.push(Math.random())
					}
			const count = seeds.length
			const ballGeo = new THREE.SphereGeometry(radius, 8, 6)
			ballGeo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(new Float32Array(centres), 3))
			ballGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1))
			const material = new THREE.MeshStandardMaterial({ color: brand.primary, roughness: 0.35, metalness: 0.1 })
			const own = {
				uBallSize: { value: 1 },
				uSwell: { value: 1.6 },
				uRattle: { value: 1 },
				uVary: { value: 0.3 },
			}
			material.defines = { ...shapeDefines }
			material.onBeforeCompile = (shader) => {
				Object.assign(shader.uniforms, uniforms, own)
				shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${noiseGLSL}\n${bodyGLSL}\n${displaceGLSL}\nattribute vec3 aCenter; attribute float aSeed; uniform float uJostle, uBallSize, uSwell, uRattle, uVary;`).replace(
					'#include <begin_vertex>',
					/* glsl */ `
					vec3 blobDir = normalize(aCenter);
					vec3 surf = bodyBase(blobDir);
					// 0 at the ray's origin, 1 on the surface.
					vec3 blobO = rayOrigin(blobDir);
					float blobR = clamp(length(aCenter - blobO) / max(length(surf - blobO), 1e-4), 0.0, 1.0);
					// Each ball moves by the field offset at its own position, along a
					// smoothed body normal there, fading toward the centre. Riding the
					// ray to the displaced surface, as the mesh skins do, was tried:
					// a ray grazing a notch slides its ball a long way along the flank
					// when a bulge fills the notch, and a lattice shows that as a
					// cavity with a pile-up beyond it. Moving along the normal by the
					// offset at the ball keeps neighbours together and fills a notch
					// from below.
					float blobDisp = blobD(aCenter);
					vec3 c = aCenter + bodyNAt(aCenter, 0.12) * blobDisp * blobR;
					// Rattle sideways while the spring is moving fast.
					c.x += noise4(vec4(aSeed * 40.0, uTime * 9.0, 0.0, 0.0)) * uJostle * uRattle;
					// Outer balls swell where the surface pushes out; inner ones vary a little by seed.
					float sc = uBallSize * (1.0 - uVary * 0.5 + uVary * aSeed) * (1.0 + max(blobDisp, 0.0) * uSwell * smoothstep(0.5, 1.0, blobR));
					vec3 transformed = position * sc + c;`,
				)
			}
			material.customProgramCacheKey = () => 'blob-balls'
			// Instance matrices stay identity; the shader owns placement.
			const mesh = new THREE.InstancedMesh(ballGeo, material, count)
			mesh.frustumCulled = false
			return {
				objects: [mesh],
				spring: [70, 5],
				slosh: 0.5,
				controls: {
					size: ctl('Ball size', 0.3, 1.8, 0.01, own.uBallSize.value, (v) => (own.uBallSize.value = v)),
					vary: ctl('Size variety', 0, 1, 0.01, own.uVary.value, (v) => (own.uVary.value = v)),
					swell: ctl('Swell', 0, 4, 0.05, own.uSwell.value, (v) => (own.uSwell.value = v)),
					rattle: ctl('Rattle', 0, 4, 0.05, own.uRattle.value, (v) => (own.uRattle.value = v)),
					gloss: ctl('Gloss', 0, 1, 0.01, 1 - material.roughness, (v) => (material.roughness = 1 - v)),
				},
				dispose: () => {
					ballGeo.dispose()
					material.dispose()
				},
			}
		},

		hair() {
			// A full coat: tens of thousands of strands as one instanced draw. Each
			// strand is a camera-facing ribbon whose shape is a parabola evaluated
			// in the vertex shader — root on the displaced surface, launched along
			// the body normal, bent by a force that sums gravity, scroll drag, a
			// wind noise, and the pointer (strands part away from it and get
			// brushed along with its movement). No per-frame CPU work.
			const count = 80000
			const segments = 7
			const rows = segments + 1
			// `position` doubles as the strand parameter: x = t along the strand,
			// y = which side of the ribbon.
			const base = new Float32Array(rows * 2 * 3)
			const index = []
			for (let i = 0; i < rows; i++) {
				const t = i / segments
				base.set([t, -1, 0, t, 1, 0], i * 6)
				if (i < segments) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
			}
			// Roots are directions on a Fibonacci sphere, marched to the body in
			// the shader: even in angle, so a little denser on the flat faces.
			// The body never turns, so roots on the upper back can only ever be
			// occluded by it and are skipped. The lower back keeps its strands:
			// with enough length and droop they hang below the silhouette.
			const roots = []
			const seeds = []
			const golden = Math.PI * (3 - Math.sqrt(5))
			for (let i = 0; i < count; i++) {
				const y = 1 - (2 * (i + 0.5)) / count
				const r = Math.sqrt(1 - y * y)
				const a = golden * i
				const z = Math.sin(a) * r
				if (z < -0.55 && y > -0.2) continue
				roots.push(Math.cos(a) * r, y, z)
				seeds.push(Math.random())
			}
			const geo = new THREE.InstancedBufferGeometry()
			geo.instanceCount = seeds.length
			geo.setIndex(index)
			geo.setAttribute('position', new THREE.BufferAttribute(base, 3))
			geo.setAttribute('aRoot', new THREE.InstancedBufferAttribute(new Float32Array(roots), 3))
			geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1))
			geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)

			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				uniforms: {
					...uniforms,
					uLength: { value: 0.34 },
					uWidth: { value: 0.0035 },
					uDroop: { value: 0.7 }, // gravity: 0 stands the coat on end
					uWind: { value: 0.6 }, // strength of the noise breeze
					uComb: { value: 1 }, // pointer parts the strands (0 = none)
					uBrush: { value: 3.5 }, // a swipe drags strands along with it
					uCurl: { value: 0 }, // per-strand sideways kink, seeded
					// Root in the shadow tone, body in primary, tips catch secondary.
					uRoot: { value: tokenColor(THREE, host, '--color-tertiary', '#3b1466') },
					uMid: { value: tokenColor(THREE, host, '--color-primary', '#7c4dff') },
					uTip: { value: tokenColor(THREE, host, '--color-secondary', '#e6306e') },
				},
				vertexShader: /* glsl */ `
					${noiseGLSL}
					${bodyGLSL}
					${displaceGLSL}
					attribute vec3 aRoot;
					attribute float aSeed;
					uniform float uLength, uWidth, uSwayX, uSwayV, uDroop, uWind, uComb, uBrush, uCurl;
					uniform vec3 uPointerVel, uRoot, uMid, uTip;
					varying vec3 vColor;

					vec3 strand(vec3 base, vec3 n, vec3 force, float len, float t) {
						return base + n * len * t + force * len * t * t;
					}

					void main() {
						vec3 b = bodyBase(normalize(aRoot));
						vec3 n = bodyN(b);
						vec3 base = b + n * blobD(b);
						float len = uLength * (0.7 + 0.6 * aSeed);

						// Gravity plus scroll drag: strands stream against the direction
						// the page moved, then swing back as the spring settles.
						vec3 force = vec3(0.0, -(uDroop + uSwayX * 1.4), 0.0);
						force.x += noise4(vec4(b * 2.0 + vec3(uTime * 0.6, 0.0, 0.0), 0.0)) * uWind + uSwayV * 0.12;
						// Curl: each strand kinks off to its own side, scaled by seed.
						vec3 t1 = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
						force += t1 * (aSeed - 0.5) * 2.0 * uCurl;
						// Pointer: part away from it across the surface, and follow its drag.
						vec3 q = b - uPointer;
						float h = uPointerStrength * exp(-dot(q, q) * 4.0);
						vec3 away = q - n * dot(q, n);
						force += normalize(away + 1e-5) * h * 0.9 * uComb + uPointerVel * h * uBrush;

						float t = position.x;
						vec3 p = strand(base, n, force, len, t);
						vec3 p2 = strand(base, n, force, len, t + 0.05);
						vec4 mv = modelViewMatrix * vec4(p, 1.0);
						vec4 mv2 = modelViewMatrix * vec4(p2, 1.0);
						// Ribbon faces the camera and tapers to the tip.
						vec3 side = normalize(cross(normalize(mv2.xyz - mv.xyz), vec3(0.0, 0.0, 1.0)) + 1e-5);
						mv.xyz += side * position.y * uWidth * (1.0 - t * 0.85);
						gl_Position = projectionMatrix * mv;

						float lit = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.5, 0.8, 1.0))), 0.0);
						vec3 col = t < 0.5 ? mix(uRoot, uMid, t * 2.0) : mix(uMid, uTip, (t - 0.5) * 2.0);
						vColor = col * lit * (0.85 + 0.3 * aSeed);
					}
				`,
				fragmentShader: /* glsl */ `
					varying vec3 vColor;
					void main() {
						gl_FragColor = vec4(vColor, 1.0);
						#include <tonemapping_fragment>
						#include <colorspace_fragment>
					}
				`,
				side: THREE.DoubleSide,
			})
			const mesh = new THREE.Mesh(geo, material)
			mesh.frustumCulled = false
			// The coat adds up to ~0.45 to the radius, so shrink the body to keep
			// the silhouette inside the frame. Gravity hangs the coat below the
			// body, so lift it to keep the silhouette centred with the other skins.
			const body = core(0.77)
			// The dark core sits just under the coat's roots, so it follows the
			// body's scale; the coat is a fraction of the body's radius, so a
			// bigger body needs no other change.
			const size = (v) => {
				mesh.scale.setScalar(v)
				body.scale.setScalar(v * (0.77 / 0.78))
			}
			const lift = (v) => (mesh.position.y = body.position.y = v)
			size(0.78)
			lift(0.2)
			const u = material.uniforms
			const uni = (name) => (v) => (u[name].value = v)
			return {
				objects: [mesh, body],
				spring: [40, 3.5],
				slosh: 0.25,
				controls: {
					size: ctl('Body size', 0.3, 2.5, 0.01, mesh.scale.x, size),
					lift: ctl('Lift', -0.5, 0.5, 0.01, mesh.position.y, lift),
					length: ctl('Length', 0.05, 0.8, 0.01, u.uLength.value, uni('uLength')),
					thickness: ctl('Thickness', 0.001, 0.012, 0.0005, u.uWidth.value, uni('uWidth')),
					droop: ctl('Droop', 0, 2, 0.02, u.uDroop.value, uni('uDroop')),
					wind: ctl('Wind', 0, 2, 0.02, u.uWind.value, uni('uWind')),
					curl: ctl('Curl', 0, 2, 0.02, u.uCurl.value, uni('uCurl')),
					comb: ctl('Comb (parting)', 0, 3, 0.05, u.uComb.value, uni('uComb')),
					brush: ctl('Brush (drag)', 0, 10, 0.1, u.uBrush.value, uni('uBrush')),
				},
				dispose: () => {
					geo.dispose()
					material.dispose()
				},
			}
		},

		metaballs() {
			// Marching cubes over a scalar field: the mark as one heavy body plus
			// satellites on fixed orbits that merge into it, and the pointer as a
			// ball of its own. The one skin that polygonises on the CPU each
			// frame (resolution³ cells), so there is no vertex displacement: the
			// field is the shape. Amplitude and frequency don't apply; the skin's
			// own controls set the satellite count, orbit reach and so on.
			const resolution = 64
			// Glossy gel in the brand colour, so it doesn't read as the iridescent skin.
			const material = new THREE.MeshPhysicalMaterial({
				color: brand.primary,
				roughness: 0.22,
				clearcoat: 1,
				clearcoatRoughness: 0.08,
				envMapIntensity: 1,
			})
			const effect = new MarchingCubes(resolution, material, false, false, 200000)
			effect.isolation = 70
			effect.scale.setScalar(1.9)
			const sats = Array.from({ length: 9 }, (_, i) => ({
				a: 0.6 + (i % 3) * 0.35,
				b: 0.45 + ((i * 7) % 5) * 0.2,
				c: 0.5 + ((i * 3) % 4) * 0.25,
				p: i * 2.1,
				q: i * 1.3,
				s: 0.4 + (i % 4) * 0.09,
				r: 0.75 + ((i * 5) % 4) * 0.09,
			}))
			// Field space is 0..1 with the body at the centre; world = (field·2−1)·scale.
			// A ball's surface radius is sqrt(strength / (subtract + isolation)):
			// 0.07–0.09 for satellites. Orbits reach ~0.3 by default, so satellites
			// detach and re-merge.
			const c = (v) => 0.5 + v * 0.5
			const p = { count: 3, roam: 0.62, size: 0.7, speed: 3, core: 1 }
			// The body is written as a metaball whose "distance" is the signed
			// distance to the mark plus a pseudo-radius, so it falls off like the
			// satellites and merges with them. Squared distances are cached once;
			// per frame only the strength/subtract step runs, with the body
			// displaced through the grid for the slosh.
			const subtract = 12
			const pseudo = 0.08 // smaller = steeper falloff, so satellites merge closer in and the notches stay open
			const cells = resolution ** 3
			const bodyD = new Float32Array(cells)
			const toWorld = (i) => ((i / resolution) * 2 - 1) * effect.scale.x
			for (let z = 0; z < resolution; z++)
				for (let y = 0; y < resolution; y++)
					for (let x = 0; x < resolution; x++) {
						bodyD[(z * resolution + y) * resolution + x] = Math.max(0.02, shape.sdBody(toWorld(x), toWorld(y), toWorld(z)) / effect.scale.x / 2 + pseudo)
					}
			// Surface a shade inside sd = 0: marching cubes interpolates the 1/d²
			// field linearly across a cell, which bows the isosurface outward by
			// about a cell, and this pulls it back onto the mesh skins' outline.
			const strength = (effect.isolation + subtract) * (pseudo - 0.01) ** 2
			// Slosh: the body rides the spring, the top lagging the bottom so it
			// stretches on the kick and squashes on the rebound, and the spring's
			// velocity shears it sideways. Each cell gathers the *distance* from
			// where it has moved from, bilinearly, and applies the falloff after.
			// Distance is smooth so it interpolates cleanly; the 1/d² field does
			// not, and blending shifted copies of it ripples the surface.
			function writeBody() {
				const field = effect.field
				const s = strength * p.core
				const reach = Math.sqrt(s / subtract) // beyond this the body contributes nothing
				const mid = resolution / 2
				const slice = resolution * resolution
				const last = resolution - 1
				for (let z = 0; z < resolution; z++) {
					const z0 = z * slice
					for (let y = 0; y < resolution; y++) {
						const rel = (y - mid) / resolution // -0.5 at the bottom, 0.5 at the top
						const sy = y - sway.x * resolution * (0.1 + 0.12 * rel)
						const dx = sway.v * resolution * 0.012 * rel
						if (sy < 0 || sy > last) continue
						const y0 = Math.floor(sy)
						const fy = sy - y0
						const r0 = z0 + y0 * resolution
						const r1 = z0 + Math.min(y0 + 1, last) * resolution
						const row = z0 + y * resolution
						for (let x = 0; x < resolution; x++) {
							const sx = x + dx
							if (sx < 0 || sx > last) continue
							const x0 = Math.floor(sx)
							const x1 = Math.min(x0 + 1, last)
							const fx = sx - x0
							const d = (bodyD[r0 + x0] * (1 - fx) + bodyD[r0 + x1] * fx) * (1 - fy) + (bodyD[r1 + x0] * (1 - fx) + bodyD[r1 + x1] * fx) * fy
							if (d >= reach) continue
							field[row + x] += s / (d * d) - subtract
						}
					}
				}
			}
			return {
				objects: [effect],
				spring: [35, 3],
				slosh: 0,
				controls: {
					count: ctl('Satellites', 0, sats.length, 1, p.count, (v) => (p.count = v)),
					roam: ctl('Roam', 0, 0.8, 0.01, p.roam, (v) => (p.roam = v)),
					size: ctl('Satellite size', 0.2, 2.5, 0.05, p.size, (v) => (p.size = v)),
					core: ctl('Body size', 0.3, 2.5, 0.05, p.core, (v) => (p.core = v)),
					speed: ctl('Orbit speed', 0, 8, 0.1, p.speed, (v) => (p.speed = v)),
					goo: ctl('Gooeyness', 30, 150, 1, effect.isolation, (v) => (effect.isolation = v)),
				},
				update() {
					effect.reset()
					writeBody()
					const t = time * p.speed
					for (let i = 0; i < p.count; i++) {
						const o = sats[i]
						const rr = p.roam * o.r
						// Satellites trail the body: further out, more lag and more shear.
						const x = Math.sin(t * o.a + o.p) * Math.cos(t * o.c + o.q) * rr - sway.v * 0.03 * o.r
						const y = Math.sin(t * o.b + o.q) * rr + sway.x * (0.16 + 0.12 * o.r)
						const z = Math.cos(t * o.a + o.p) * Math.sin(t * o.c + o.q) * rr * 0.6
						effect.addBall(c(x), c(y), c(z), o.s * p.size, 12)
					}
					// The hover bulge is a ball riding the pointer just under the surface.
					if (pointer.strength > 0.01) {
						const r = 0.9 / effect.scale.x
						effect.addBall(c(pointer.local.x * r), c(pointer.local.y * r), c(pointer.local.z * r), pointer.strength * params.hover * 1.2, 12)
					}
					effect.update()
				},
				dispose: () => {
					effect.geometry.dispose()
					material.dispose()
				},
			}
		},

		goo() {
			// Metaballs again, but raymarched: the same body, satellites and
			// pointer ball as a signed-distance scene blended with a smooth
			// minimum, sphere-traced per pixel in a fragment shader. No field,
			// no polygonisation, nothing per frame on the CPU beyond a handful
			// of uniforms; the merge is exact at any zoom. Drawn on one quad
			// held in front of the body; rays start on the quad and are clipped
			// to a bounding sphere so misses stay cheap. Shaded with the same
			// brand matcap as the matcap skin plus a fresnel rim, since there
			// is no mesh for a built-in material to light.
			const sats = Array.from({ length: 9 }, (_, i) => ({
				a: 0.6 + (i % 3) * 0.35,
				b: 0.45 + ((i * 7) % 5) * 0.2,
				c: 0.5 + ((i * 3) % 4) * 0.25,
				p: i * 2.1,
				q: i * 1.3,
				s: 0.4 + (i % 4) * 0.09,
				r: 0.75 + ((i * 5) % 4) * 0.09,
			}))
			const p = { body: 1, count: 3, roam: 0.62, size: 0.7, core: 1, speed: 3, goo: 0.22, rim: 0.5, light: 1 }
			const balls = Array.from({ length: sats.length }, () => new THREE.Vector4())
			const camLocal = new THREE.Vector3()
			// Key light in view space. It follows the shared cursor (the pointer's
			// offset from the host's centre, anywhere on the page), eased so the
			// highlight glides. The matcap has
			// its light baked in at `keyDefault`, so the lookup normal is
			// rotated by the inverse of the rotation that takes keyDefault to
			// the current light, and the highlight moves with it. Kept small:
			// a large swing rolls the whole colour gradient, not just the light.
			const keyDefault = new THREE.Vector3(0.5, 0.7, 1).normalize()
			const light = { dir: keyDefault.clone(), target: keyDefault.clone(), rot: new THREE.Matrix3(), q: new THREE.Quaternion(), m4: new THREE.Matrix4() }
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				transparent: true,
				depthWrite: false,
				uniforms: {
					uShape: uniforms.uShape,
					uShapeInfo: uniforms.uShapeInfo,
					uPointer: uniforms.uPointer,
					uPointerStrength: uniforms.uPointerStrength,
					uHover: uniforms.uHover,
					uSwayX: uniforms.uSwayX,
					uSwayV: uniforms.uSwayV,
					uCam: { value: camLocal },
					uBalls: { value: balls },
					uCount: { value: p.count },
					uBody: { value: p.body },
					uCore: { value: 0 },
					uGoo: { value: p.goo },
					uRim: { value: p.rim },
					uLight: { value: light.dir },
					uLightRot: { value: light.rot },
					uMatcap: { value: matcapTexture(THREE, host, { rim: 0.3, highlight: 0.12, blend: 0.55 }) },
				},
				vertexShader: /* glsl */ `
					varying vec3 vPos;
					void main() {
						vPos = position;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`,
				fragmentShader: /* glsl */ `
					${bodyGLSL}
					uniform float uPointerStrength, uHover, uSwayX, uSwayV, uBody, uCore, uGoo, uRim;
					uniform int uCount;
					uniform vec3 uPointer, uCam, uLight;
					uniform mat3 normalMatrix; // vertex-stage built-in; Three still binds it here once declared
					uniform mat3 uLightRot;
					uniform vec4 uBalls[9]; // xyz centre, w radius
					uniform sampler2D uMatcap;
					varying vec3 vPos;

					float smin(float a, float b, float k) {
						float h = max(k - abs(a - b), 0.0) / k;
						return min(a, b) - h * h * k * 0.25;
					}
					// Slosh: the body rides the spring, the top lagging the bottom, and
					// the spring's velocity shears it sideways. Warping the sample
					// point stretches the field a little, so the march steps short.
					float sdScene(vec3 p) {
						vec3 q = p;
						q.y -= uSwayX * (0.3 + 0.25 * p.y);
						q.x -= uSwayV * 0.03 * p.y;
						// Body size is an offset, not a scale: inflating an SDF fills the
						// notches and rounds the mark, deflating thins it, which is what
						// the metaballs field does as its body strength changes.
						// With the body off, only the satellites are left to merge; the
						// hover bulge goes with it, as it only pushes the body's surface.
						float d = 1e3;
						if (uBody > 0.5) {
							d = sdBody(q) - uCore;
							// The hover bulge is the same Gaussian push the mesh skins use, so
							// it scales linearly with the pointer strength and fades without a
							// step. A ball unioned in with smin was tried first: it pops as it
							// sinks back under the surface.
							vec3 h = p - uPointer;
							d -= uPointerStrength * uHover * 0.5 * exp(-dot(h, h) * 4.0);
						}
						for (int i = 0; i < 9; i++) {
							if (i >= uCount) break;
							d = smin(d, length(p - uBalls[i].xyz) - uBalls[i].w, uGoo);
						}
						return d;
					}
					// Wider taps than the mesh skins use, so the satellites' smooth
					// minimum doesn't show up as ridges in the normal.
					vec3 sceneN(vec3 p) {
						const vec2 k = vec2(1.0, -1.0);
						const float e = 0.012;
						return normalize(k.xyy * sdScene(p + k.xyy * e) + k.yyx * sdScene(p + k.yyx * e) + k.yxy * sdScene(p + k.yxy * e) + k.xxx * sdScene(p + k.xxx * e));
					}
					void main() {
						vec3 ro = uCam;
						vec3 rd = normalize(vPos - ro);
						// Clip the ray to a sphere round everything the scene can reach.
						const float R = 2.4;
						float b = dot(ro, rd);
						float h = b * b - dot(ro, ro) + R * R;
						if (h < 0.0) discard;
						h = sqrt(h);
						float t = -b - h, tFar = -b + h;
						float nearest = 1e9, tNear = t;
						bool hit = false;
						// The bulge steepens the field, so step shorter while it is up.
						float safe = 0.8 / (1.0 + uPointerStrength * uHover * 1.5);
						for (int i = 0; i < 96; i++) {
							vec3 pos = ro + rd * t;
							float d = sdScene(pos);
							if (d < nearest) { nearest = d; tNear = t; }
							if (d < 0.0015) { hit = true; break; }
							t += d * safe;
							if (t > tFar) break;
						}
						// Near misses get the closest point's shading at a fading alpha,
						// which softens the silhouette without supersampling.
						const float aa = 0.006;
						if (!hit && nearest > aa) discard;
						vec3 pos = ro + rd * (hit ? t : tNear);
						vec3 n = sceneN(pos);
						vec3 vn = normalize(normalMatrix * n);
						vec3 col = texture2D(uMatcap, (uLightRot * vn).xy * 0.495 + 0.5).rgb;
						// Fresnel rim and a tight highlight from the key light give it the gel look.
						float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
						col += fres * uRim * 0.35;
						float spec = pow(max(dot(reflect(-uLight, vn), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
						col += spec * 0.5;
						gl_FragColor = vec4(col, hit ? 1.0 : 1.0 - nearest / aa);
						#include <tonemapping_fragment>
						#include <colorspace_fragment>
					}
				`,
			})
			// The offset is baked into the geometry, not the mesh, so vertex
			// positions (and so the rays) are in the group's space.
			const quad = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).translate(0, 0, 2.5), material)
			quad.frustumCulled = false
			return {
				objects: [quad],
				spring: [35, 3],
				slosh: 0,
				controls: {
					body: ctl('Body', 0, 1, 1, p.body, (v) => (material.uniforms.uBody.value = v)),
					count: ctl('Satellites', 0, sats.length, 1, p.count, (v) => (material.uniforms.uCount.value = p.count = v)),
					roam: ctl('Roam', 0, 0.8, 0.01, p.roam, (v) => (p.roam = v)),
					size: ctl('Satellite size', 0.2, 2.5, 0.05, p.size, (v) => (p.size = v)),
					core: ctl('Body size', 0.3, 2.5, 0.05, p.core, (v) => (material.uniforms.uCore.value = (v - 1) * 0.2)),
					speed: ctl('Orbit speed', 0, 8, 0.1, p.speed, (v) => (p.speed = v)),
					goo: ctl('Gooeyness', 0.02, 0.6, 0.01, p.goo, (v) => (material.uniforms.uGoo.value = v)),
					rim: ctl('Rim light', 0, 1.5, 0.01, p.rim, (v) => (material.uniforms.uRim.value = v)),
					light: ctl('Light follow', 0, 2, 0.05, p.light, (v) => (p.light = v)),
				},
				update() {
					camLocal.copy(camera.position)
					group.worldToLocal(camLocal)
					// The cursor is in half-viewport units; the light used host
					// half-widths before, so scale up to keep the same swing.
					const k = 0.18 * p.light * (window.innerWidth / host.clientWidth)
					light.target.set(keyDefault.x + cursor.x * k, keyDefault.y + cursor.y * k, keyDefault.z).normalize()
					light.dir.lerp(light.target, 0.08).normalize()
					light.q.setFromUnitVectors(keyDefault, light.dir)
					light.rot.setFromMatrix4(light.m4.makeRotationFromQuaternion(light.q)).transpose()
					const t = time * p.speed
					for (let i = 0; i < p.count; i++) {
						const o = sats[i]
						const rr = p.roam * o.r * 1.9
						// Satellites trail the body: further out, more lag and more shear.
						const x = Math.sin(t * o.a + o.p) * Math.cos(t * o.c + o.q) * rr - sway.v * 0.06 * o.r
						const y = Math.sin(t * o.b + o.q) * rr + sway.x * (0.3 + 0.25 * o.r)
						const z = Math.cos(t * o.a + o.p) * Math.sin(t * o.c + o.q) * rr * 0.6
						balls[i].set(x, y, z, o.s * p.size * 0.55)
					}
				},
				dispose: () => {
					quad.geometry.dispose()
					material.uniforms.uMatcap.value.dispose()
					material.dispose()
				},
			}
		},

		hole() {
			// The mark as a black hole: its interior is dark and a sheet of light
			// beams flows left to right round it, bending at the edges rather
			// than crossing them. Pure 2D on one quad in the body's plane. The
			// beams are level sets of a stream function: `y` far from the mark,
			// squeezed to zero at its boundary (like potential flow round a
			// cylinder, where the surface is itself a streamline), and flat
			// inside, so every line wraps the outline and the nearest ones pile
			// up against it as a bright rim. Line width is held in pixels with
			// screen-space derivatives, so the pile-up tightens without
			// thickening. Flow is a travelling pulse along x per line, phased by
			// a per-line hash so the beams don't move in lockstep.
			const p = { spacing: 0.13, width: 2.2, glow: 0.3, squeeze: 0.3, flow: 3, streak: 0.7, halo: 0.2, reach: 1.5, backdrop: 1, scale: 1, pull: 0.8, pullReach: 0.6, ripple: 1 }
			const harmonic = (sharedHarmonic ??= harmonicField(shape))
			const harmonicTexture = new THREE.DataTexture(harmonic.grid, harmonic.res, harmonic.res, THREE.RedFormat, THREE.FloatType)
			harmonicTexture.minFilter = harmonicTexture.magFilter = THREE.NearestFilter
			harmonicTexture.generateMipmaps = false
			harmonicTexture.needsUpdate = true
			// The pointer anywhere over the host, on the mark's plane, in group
			// space: a light the beams swell and brighten under; nothing moves. The lab's
			// own pointer only exists while it is over the mark.
			const lens = { pos: new THREE.Vector2(), target: 0, strength: 0, ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit: new THREE.Vector3() }
			const onLensMove = (e) => {
				const r = renderer.domElement.getBoundingClientRect()
				lens.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
				lens.ray.setFromCamera(lens.ndc, camera)
				if (lens.ray.ray.intersectPlane(lens.plane, lens.hit)) {
					lens.pos.set(lens.hit.x, lens.hit.y)
					lens.target = 1
				}
			}
			const onLensLeave = () => (lens.target = 0)
			host.addEventListener('pointermove', onLensMove)
			host.addEventListener('pointerleave', onLensLeave)
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				transparent: true,
				depthWrite: false,
				// Output is premultiplied so the beams add over the backdrop.
				premultipliedAlpha: true,
				uniforms: {
					uShape: uniforms.uShape,
					uShapeInfo: uniforms.uShapeInfo,
					uHarmonic: { value: harmonicTexture },
					uHarmonicInfo: { value: new THREE.Vector4(harmonic.extent, harmonic.res, harmonic.L, harmonic.offset) },
					uTime: uniforms.uTime,
					uAmp: uniforms.uAmp,
					uFreq: uniforms.uFreq,
					uHover: uniforms.uHover,
					uSwayX: uniforms.uSwayX,
					uSwayV: uniforms.uSwayV,
					uLens: { value: lens.pos },
					uLensStrength: { value: 0 },
					uReachH: { value: 0.3 },
					uRipple: { value: new THREE.Vector3(0, 0, p.ripple) }, // band centre y, envelope, strength
					uSpacing: { value: p.spacing },
					uWidth: { value: p.width },
					uGlow: { value: p.glow },
					uSqueeze: { value: p.squeeze },
					uFlow: { value: p.flow },
					uStreak: { value: p.streak },
					uHalo: { value: p.halo },
					uReach: { value: p.reach },
					uBackdrop: { value: p.backdrop },
					uScale: { value: 1 },
					uPixel: { value: 0.001 },
					uPull: { value: p.pull },
					uPullReach: { value: p.pullReach },
					uColA: { value: tokenColor(THREE, host, '--color-primary', '#7c4dff') },
					uColB: { value: tokenColor(THREE, host, '--color-secondary', '#e6306e') },
					uHole: { value: tokenColor(THREE, host, '--color-tertiary', '#3b1466').multiplyScalar(0.12) },
				},
				vertexShader: /* glsl */ `
					varying vec3 vPos;
					void main() {
						vPos = position;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`,
				fragmentShader: /* glsl */ `
					${noiseGLSL}
					${bodyGLSL}
					uniform sampler2D uHarmonic;
					uniform vec4 uHarmonicInfo; // extent, resolution, decay length, far-field offset
					uniform float uTime, uAmp, uFreq, uHover, uSwayX, uSwayV, uLensStrength, uReachH;
					uniform float uSpacing, uWidth, uGlow, uSqueeze, uFlow, uStreak, uHalo, uReach, uBackdrop, uScale, uPull, uPullReach, uPixel;
					uniform vec2 uLens;
					uniform vec3 uColA, uColB, uHole, uRipple;
					varying vec3 vPos;

					float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

					// Cubic B-spline read (16 texels) of a square grid over ±extent,
					// returning the value and its gradient per unit. Bilinear reads
					// have slope breaks at every texel edge; beams packed against the
					// rim sit a few texels apart and show them as wrinkles, and the rim
					// itself reads as faintly polygonal. The B-spline is C2 across
					// texels, and its analytic gradient is what sizes the beams: a
					// screen-space derivative is estimated per 2×2 pixel block and
					// jitters from block to block, which the packed band makes visible.
					vec3 cubic(sampler2D tex, float extent, float res, vec2 q) {
						vec2 g = (q / extent * 0.5 + 0.5) * res - 0.5;
						vec2 i = floor(g), f = g - i;
						vec2 f2 = f * f, f3 = f2 * f;
						vec4 wx = vec4(1.0 - 3.0 * f.x + 3.0 * f2.x - f3.x, 4.0 - 6.0 * f2.x + 3.0 * f3.x, 1.0 + 3.0 * f.x + 3.0 * f2.x - 3.0 * f3.x, f3.x) / 6.0;
						vec4 wy = vec4(1.0 - 3.0 * f.y + 3.0 * f2.y - f3.y, 4.0 - 6.0 * f2.y + 3.0 * f3.y, 1.0 + 3.0 * f.y + 3.0 * f2.y - 3.0 * f3.y, f3.y) / 6.0;
						vec4 dx = vec4(-3.0 + 6.0 * f.x - 3.0 * f2.x, -12.0 * f.x + 9.0 * f2.x, 3.0 + 6.0 * f.x - 9.0 * f2.x, 3.0 * f2.x) / 6.0;
						vec4 dy = vec4(-3.0 + 6.0 * f.y - 3.0 * f2.y, -12.0 * f.y + 9.0 * f2.y, 3.0 + 6.0 * f.y - 9.0 * f2.y, 3.0 * f2.y) / 6.0;
						ivec2 o = ivec2(i) - 1, hi = ivec2(int(res) - 1);
						vec3 v = vec3(0.0);
						for (int y = 0; y < 4; y++) {
							vec2 row = vec2(0.0);
							for (int x = 0; x < 4; x++) {
								float t = texelFetch(tex, clamp(o + ivec2(x, y), ivec2(0), hi), 0).r;
								row += vec2(wx[x], dx[x]) * t;
							}
							v += vec3(wy[y] * row.x, wy[y] * row.y, dy[y] * row.x);
						}
						return vec3(v.x, v.yz * res / (2.0 * extent));
					}
					// The mark's distance, read smoothly, with its gradient; past the
					// grid add the distance to it, so it runs to any width.
					vec3 sdMarkG(vec2 q) {
						vec2 o = max(abs(q) - uShapeInfo.x, 0.0);
						float ol = length(o);
						vec3 s = cubic(uShape, uShapeInfo.x, uShapeInfo.y, q);
						return vec3(s.x + ol, s.yz + (ol > 0.0 ? o / ol * sign(q) : vec2(0.0)));
					}
					float sdMark(vec2 q) { return sdMarkG(q).x; }
					// The screened field, above 1 inside the mark and decaying to 0 far
					// away, with its gradient.
					vec3 harm(vec2 q) {
						if (any(greaterThan(abs(q), vec2(uHarmonicInfo.x)))) return vec3(0.0);
						return cubic(uHarmonic, uHarmonicInfo.x, uHarmonicInfo.y, q);
					}
					void main() {
						// The mark holds still under scroll: the spring only rides the beams.
						vec2 p = vPos.xy;
						vec2 q = p;
						// Hover: light only. Beams under the pointer swell, brighten, surge
						// on their pulses and warm in colour; nothing moves, so the rim
						// and every beam centre are exactly where they are unhovered.
						// Moving beams was tried twice, as a bump and as a pull toward
						// the pointer's own beam: both break down at the tips, where the
						// beams split above and below the mark. The glow is stretched
						// along the flow so it reads as light streaming past the pointer.
						vec2 h = p - uLens / uScale; // the pointer is in group space; the quad is scaled
						vec2 hs = vec2(h.x * 0.6, h.y);
						// The light's radius grows with the setting as well as its strength,
						// so a high hover reads as a wide bright pool, not a hot spot.
						float rh = uReachH * (1.0 + uHover);
						float grav = exp(-dot(hs, hs) / (rh * rh));
						float amount = uHover * uLensStrength * 3.0 * grav;
						// Scroll: a band of the same light sweeps across the beams, top
						// to bottom on a scroll down, the other way on a scroll up.
						float band = uRipple.y * exp(-pow((p.y - uRipple.x) / 0.7, 2.0));
						amount += uRipple.z * 3.0 * band;
						// Edge wobble, confined to the outline. The rim is a distance
						// field, so its gradient is 1 and a pixel of it is uPixel.
						float d = sdMark(q);
						float wob = uAmp * 0.35 * noise4(vec4(p * uFreq, 0.0, uTime)) * exp(-max(d, 0.0) * 8.0);
						d += wob;
						float inside = 1.0 - smoothstep(-uPixel, uPixel, d);

						// Smooth distance from the field, with the wobble and lens
						// folded in the same way as the exact one, and its gradient
						// (the wobble's is left out: it only nudges beam widths).
						vec3 cm = harm(q);
						float c = max(cm.x, 1e-6);
						float ds = -uHarmonicInfo.z * log(c) + wob;
						vec2 dsG = -uHarmonicInfo.z * cm.yz / c;
						// The field's grid is pinned to zero at its edge, so beams still
						// bent there would snap flat, in a hero wide enough to show it.
						// Hand over to the plain distance before the edge: far out the two
						// differ by a measured constant, and any crease in the plain one
						// is too far from the mark to show.
						float far = max(abs(q.x), abs(q.y)) / uHarmonicInfo.x;
						float t = clamp((far - 0.6) / 0.25, 0.0, 1.0);
						if (t > 0.0) {
							vec3 sg = sdMarkG(q);
							float hand = t * t * (3.0 - 2.0 * t);
							float plain = sg.x + uHarmonicInfo.w + wob;
							// The ramp's own slope goes into the gradient too: the beam
							// width is sized from it, and leaving the ramp out fattens the
							// beams across the band.
							vec2 farG = abs(q.x) > abs(q.y) ? vec2(sign(q.x), 0.0) : vec2(0.0, sign(q.y));
							vec2 handG = farG * (6.0 * t * (1.0 - t) / (0.25 * uHarmonicInfo.x));
							dsG = mix(dsG, sg.yz, hand) + (plain - ds) * handG;
							ds = mix(ds, plain, hand);
						}

						// Stream function and its level sets, one beam per spacing,
						// offset by half so the flat interior (psi = 0) falls between two.
						// The squeeze pushes beams off the outline; the pull draws them
						// toward the mark's centre line first, so they funnel into the
						// tips and bunch against the edge, like light bent by a mass.
						float e1 = exp(-max(ds, 0.0) / uSqueeze), e2 = exp(-max(ds, 0.0) / uPullReach);
						float w = ds > 0.0 ? (1.0 - e1) * (1.0 + uPull * e2) : 0.0;
						float wD = ds > 0.0 ? (e1 / uSqueeze) * (1.0 + uPull * e2) - (1.0 - e1) * uPull * e2 / uPullReach : 0.0;
						w *= 1.0 - inside;
						wD *= 1.0 - inside;
						float psi = p.y * w;
						vec2 psiG = vec2(p.y * wD * dsG.x, w + p.y * wD * dsG.y);
						float n = psi / uSpacing;
						// Beams per unit from the analytic gradient, then per pixel.
						vec2 nG = psiG / uSpacing;
						float fw = max(length(nG) * uPixel, 1e-6);
						float idx = floor(n);
						float px = (fract(n) - 0.5) / fw; // pixels from the nearest beam
						// Sum the nearest beams rather than draw only the closest, and
						// weight each beam's colour and pulse into the same sum: where
						// beams pack tighter than their width, against the rim, both
						// the intensity and the colour then vary smoothly instead of
						// switching at each beam's midline and aliasing.
						float line = 0.0, core = 0.0;
						vec3 colAcc = vec3(0.0);
						for (int k = -2; k <= 2; k++) {
							float pk = px - float(k) / fw;
							float hk1 = hash(idx + float(k) + 1.0), hk2 = hash(idx + float(k) + 7.0);
							float wk = uWidth * (0.7 + 0.6 * hk1) * (1.0 + 0.7 * amount);
							float g = exp(-pk * pk / (wk * wk));
							// A pulse travelling left to right along this beam; more
							// pronounced under the pointer, so the flow seems to surge there.
							float sk = 0.5 + 0.5 * sin(p.x * 2.0 - uTime * uFlow * 4.0 + hk2 * 6.2832);
							float gi = g * mix(1.0, pow(sk, 3.0) * 2.2, min(1.0, uStreak + 0.4 * amount));
							line += gi;
							colAcc += gi * mix(uColA, uColB, hk1 * 0.6 + 0.4 * sk);
							core += gi * (0.25 + 0.3 * uStreak * pow(sk, 3.0));
						}
						// The light under the pointer, capped so a strong setting
						// brightens rather than bleaches.
						float lift = 1.0 + min(amount, 2.0);
						line *= lift;
						core *= lift;
						float lineN = max(line, 1e-6);
						vec3 beamCol = mix(colAcc / lineN, uColB, 0.5 * min(amount, 1.0));
						core /= lineN;
						line = min(line, 1.0);
						float glow = uGlow * 0.5 * exp(-abs(px) / 4.0) * (1.0 + amount);

						// Beams and ground fade with distance from the mark, in a rounded
						// square so they fill the host rather than a disc inside it. The
						// canvas bleeds past the host, so the default reach is the host's
						// half-width; raise it to spread across a hero.
						vec2 p4 = p * p * p * p;
						float fade = 1.0 - smoothstep(uReach * 0.75, uReach, pow(p4.x + p4.y, 0.25));
						float beams = (line + glow) * fade * (1.0 - inside);
						// A soft halo hugging the outline, like light caught at the horizon.
						float halo = uHalo * exp(-max(d, 0.0) * 12.0) * (1.0 - inside);

						// A pale core down the middle of each beam, hotter on the pulses.
						beamCol = mix(beamCol, vec3(1.0), line * core);
						vec3 haloCol = mix(uColA, uColB, 0.5);
						// Dark ground fading out with the beams, so they glow on any page;
						// invisible over a dark one.
						float ground = max(inside, uBackdrop * fade);
						float light = beams + halo;
						vec3 col = uHole * ground + beamCol * beams + haloCol * halo;
						gl_FragColor = vec4(col, clamp(ground + light, 0.0, 1.0));
						#include <colorspace_fragment>
					}
				`,
			})
			// Sits in the body's plane, so vPos.xy is the mark's own 2D space
			// and the tilt from the spring still reads. Oversized so it still
			// covers a wide hero-filling canvas once scaled down.
			const quad = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material)
			quad.frustumCulled = false
			const u = material.uniforms
			// Sizing. With a [data-blob-fit] element in the lab (copy set inside
			// the hole) the mark scales until the hole clears that element's box
			// by the attribute's value in pixels, so the gap holds across
			// viewports: bigger mark on a wide screen, smaller on a phone, tips
			// off the sides if need be. Without one the mark is sized to the
			// host's height, growing when the host is taller than wide so it
			// still reads as the mark. The pointer proxy scales with it so hover
			// still lands.
			// The gap is the attribute's value, or `--blob-gap` on the same element
			// when set, so a page can vary it by breakpoint with utility classes.
			// Read on every fit, since a resize can cross a breakpoint.
			const fitEl = (host.closest('[data-blob-lab]') ?? host.parentElement)?.querySelector('[data-blob-fit]')
			function contentScale() {
				const hr = host.getBoundingClientRect()
				const er = fitEl.getBoundingClientRect()
				if (!hr.height || !er.height) return 1
				const gapPx = parseFloat(getComputedStyle(fitEl).getPropertyValue('--blob-gap')) || parseFloat(fitEl.dataset.blobFit) || 40
				// World units per pixel at the mark's plane.
				const upp = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / hr.height
				const cx = (er.left + er.width / 2 - (hr.left + hr.width / 2)) * upp
				const cy = -(er.top + er.height / 2 - (hr.top + hr.height / 2)) * upp
				const hw = (er.width / 2) * upp
				const hh = (er.height / 2) * upp
				const pts = []
				for (let i = 0; i <= 8; i++) {
					const t = -1 + i / 4
					pts.push([cx + t * hw, cy + hh], [cx + t * hw, cy - hh], [cx + hw, cy + t * hh], [cx - hw, cy + t * hh])
				}
				// The box's perimeter must sit inside the outline by the gap plus
				// the edge wobble, both in world units; sd2 is in mark units.
				const fits = (s) => {
					const gap = gapPx * upp + params.amp * 0.35 * s
					return pts.every(([x, y]) => shape.sd2(x / s, y / s) * s <= -gap)
				}
				let lo = 0.2
				let hi = 8
				for (let i = 0; i < 24; i++) {
					const m = (lo + hi) / 2
					if (fits(m)) hi = m
					else lo = m
				}
				return hi
			}
			let fit = 1
			let dirty = true
			const ripple = { dir: 1, t: 1e9, speed: 0, glow: 0 } // the scroll band's direction, distance travelled, speed and brightness
			const refit = () => {
				if (!dirty) return
				dirty = false
				const next = (fitEl ? contentScale() : Math.max(1, 0.85 / camera.aspect)) * p.scale
				if (next === fit) return
				fit = next
				quad.scale.setScalar(fit)
				hitBody.scale.setScalar(fit)
				u.uScale.value = fit
				// Spacing is set in the mark's own units; keep it constant on screen.
				u.uSpacing.value = p.spacing / fit
			}
			const watch = new ResizeObserver(() => (dirty = true))
			watch.observe(host)
			if (fitEl) watch.observe(fitEl)
			return {
				objects: [quad],
				spring: [40, 4],
				slosh: 0,
				tilt: 0, // scroll sweeps a band of light across the beams instead of moving the mark
				hoverSpeed: 0, // the beams' pulses keep their pace under the pointer
				controls: {
					spacing: ctl('Beam spacing', 0.02, 0.3, 0.005, p.spacing, (v) => (u.uSpacing.value = (p.spacing = v) / fit)),
					width: ctl('Beam width', 0.3, 4, 0.05, p.width, (v) => (u.uWidth.value = v)),
					glow: ctl('Glow', 0, 1.5, 0.01, p.glow, (v) => (u.uGlow.value = v)),
					squeeze: ctl('Squeeze', 0.05, 1, 0.01, p.squeeze, (v) => (u.uSqueeze.value = v)),
					flow: ctl('Flow speed', 0, 10, 0.1, p.flow, (v) => (u.uFlow.value = v)),
					streak: ctl('Streaks', 0, 1, 0.01, p.streak, (v) => (u.uStreak.value = v)),
					halo: ctl('Halo', 0, 1.5, 0.01, p.halo, (v) => (u.uHalo.value = v)),
					reach: ctl('Reach', 1, 12, 0.05, p.reach, (v) => (u.uReach.value = v)),
					backdrop: ctl('Backdrop', 0, 1, 0.01, p.backdrop, (v) => (u.uBackdrop.value = v)),
					pull: ctl('Pull', 0, 3, 0.01, p.pull, (v) => (u.uPull.value = v)),
					pullReach: ctl('Pull reach', 0.05, 2, 0.01, p.pullReach, (v) => (u.uPullReach.value = v)),
					ripple: ctl('Scroll ripple', 0, 3, 0.01, p.ripple, (v) => (u.uRipple.value.z = v)),
					scale: ctl('Mark size', 0.3, 2, 0.01, p.scale, (v) => ((p.scale = v), (dirty = true))),
				},
				update(dt) {
					refit()
					// One device pixel in the quad's units, for beam widths and the rim's edge.
					const px = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / (renderer.domElement.height || 1)
					u.uPixel.value = px / fit
					lens.strength += (lens.target - lens.strength) * 0.1
					u.uLensStrength.value = lens.strength
					// The band enters at the edge the scroll came from and crosses at
					// a steady speed and brightness set by how hard the scroll kicked
					// the spring, so a hard scroll sends a bright band through fast
					// and a light one a dimmer band at a stroll. Reading the spring
					// live was tried: the band rushed the first half and dawdled the
					// rest, since the spring is fastest at the kick. A scroll the
					// other way, or one after the band has left, starts a fresh band;
					// one the same way makes this one brighter and quicker. Measured
					// in the quad's units so it spans the canvas whatever the fit.
					const half = (camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / fit + 0.7
					if (sway.kicked) {
						const v = Math.min(2, Math.abs(sway.v))
						if (ripple.dir !== sway.dir || ripple.t > 2 * half) {
							ripple.t = 0
							ripple.speed = 0
							ripple.glow = 0
						}
						ripple.dir = sway.dir
						ripple.speed = Math.max(ripple.speed, 2.5 + 2 * v)
						ripple.glow = Math.max(ripple.glow, Math.min(1, 0.5 + v * 0.5))
						sway.kicked = false
					}
					ripple.t += ripple.speed * dt
					u.uRipple.value.x = ripple.dir * (half - ripple.t)
					// Scaled by the inertia setting the way the hover light is by its
					// own, so equal settings light the beams equally.
					u.uRipple.value.y = ripple.t > 2 * half ? 0 : ripple.glow * params.inertia
				},
				dispose: () => {
					watch.disconnect()
					host.removeEventListener('pointermove', onLensMove)
					host.removeEventListener('pointerleave', onLensLeave)
					harmonicTexture.dispose()
					hitBody.scale.setScalar(1)
					quad.geometry.dispose()
					material.dispose()
				},
			}
		},

		toon() {
			// Cel shading in the brand's own flat colours: three hard bands
			// (tertiary shadow, primary body, secondary light) from the key
			// light, a hard specular dot, an ink rim, and a silhouette line
			// drawn as a back-face copy pushed out along the normal. No tone
			// mapping, so the bands are the tokens exactly.
			const own = {
				uShadow: { value: 0.42 },
				uLight: { value: 0.8 },
				uSoft: { value: 0.01 },
				uRim: { value: 0.22 },
				uSpec: { value: 0.7 },
			}
			const palette = {
				uLit: { value: tokenColor(THREE, host, '--color-secondary', '#e6306e') },
				uMid: { value: tokenColor(THREE, host, '--color-primary', '#7c4dff') },
				uShade: { value: tokenColor(THREE, host, '--color-tertiary', '#3b1466') },
				uInk: { value: new THREE.Color(0x140626) },
				uLightDir: { value: new THREE.Vector3(0.5, 0.7, 1).normalize() },
			}
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				uniforms: { ...uniforms, ...palette, ...own, uInflate: { value: 0 } },
				vertexShader: marchedVertexGLSL,
				fragmentShader: /* glsl */ `
					uniform vec3 uLit, uMid, uShade, uInk, uLightDir;
					uniform float uShadow, uLight, uSoft, uRim, uSpec;
					varying vec3 vN, vV;
					// A hard step, one pixel wide, softened further by uSoft.
					float band(float x, float edge) {
						float w = max(fwidth(x), uSoft);
						return smoothstep(edge - w, edge + w, x);
					}
					void main() {
						vec3 n = normalize(vN);
						vec3 v = normalize(vV);
						float l = dot(n, uLightDir) * 0.5 + 0.5;
						vec3 col = mix(uShade, uMid, band(l, uShadow));
						col = mix(col, uLit, band(l, uLight));
						float spec = pow(max(dot(reflect(-uLightDir, n), v), 0.0), 40.0) * uSpec;
						col = mix(col, vec3(1.0), band(spec, 0.5));
						float rim = 1.0 - dot(n, v);
						col = mix(col, uInk, band(rim, 1.0 - uRim));
						gl_FragColor = vec4(col, 1.0);
						#include <colorspace_fragment>
					}
				`,
			})
			const outline = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				side: THREE.BackSide,
				uniforms: { ...uniforms, uInk: palette.uInk, uInflate: { value: 0.018 } },
				vertexShader: marchedVertexGLSL,
				fragmentShader: /* glsl */ `
					uniform vec3 uInk;
					void main() {
						gl_FragColor = vec4(uInk, 1.0);
						#include <colorspace_fragment>
					}
				`,
			})
			const mesh = new THREE.Mesh(fine, material)
			const line = new THREE.Mesh(geometry, outline)
			return {
				objects: [mesh, line],
				spring: [60, 7],
				slosh: 0.35,
				controls: {
					shadow: ctl('Shadow edge', 0.1, 0.7, 0.01, own.uShadow.value, (v) => (own.uShadow.value = v)),
					light: ctl('Light edge', 0.5, 1, 0.01, own.uLight.value, (v) => (own.uLight.value = v)),
					soft: ctl('Softness', 0, 0.2, 0.005, own.uSoft.value, (v) => (own.uSoft.value = v)),
					spec: ctl('Highlight', 0, 2, 0.05, own.uSpec.value, (v) => (own.uSpec.value = v)),
					rim: ctl('Ink rim', 0, 0.6, 0.01, own.uRim.value, (v) => (own.uRim.value = v)),
					outline: ctl('Outline', 0, 0.05, 0.001, outline.uniforms.uInflate.value, (v) => (outline.uniforms.uInflate.value = v)),
				},
				dispose: () => {
					material.dispose()
					outline.dispose()
				},
			}
		},

		contours() {
			// A topographic map of the surface: level sets of either depth along
			// the view axis or of the displacement itself, drawn as lines held at
			// a pixel width with screen-space derivatives over a dim body. The
			// mark never rotates, so this is the skin where the noise and slosh
			// are most legible: the lines crawl and bunch as the surface moves.
			const own = {
				uDensity: { value: 14 },
				uWidth: { value: 1.2 },
				uSource: { value: 0 },
				uFill: { value: 0.35 },
				uGlow: { value: 1.2 },
			}
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				uniforms: {
					...uniforms,
					...own,
					uInflate: { value: 0 },
					uBase: { value: tokenColor(THREE, host, '--color-tertiary', '#3b1466') },
					uLine: { value: tokenColor(THREE, host, '--color-primary', '#7c4dff') },
					uLine2: { value: tokenColor(THREE, host, '--color-secondary', '#e6306e') },
					uLightDir: { value: new THREE.Vector3(0.5, 0.7, 1).normalize() },
				},
				vertexShader: marchedVertexGLSL,
				fragmentShader: /* glsl */ `
					uniform vec3 uBase, uLine, uLine2, uLightDir;
					uniform float uDensity, uWidth, uSource, uFill, uGlow;
					varying vec3 vN, vV, vP;
					varying float vH;
					void main() {
						vec3 n = normalize(vN);
						vec3 v = normalize(vV);
						float facing = dot(n, v);
						float ndl = dot(n, uLightDir) * 0.5 + 0.5;
						// vH is the height above the undisplaced body: small, so scaled up
						// to give the two sources a similar line count.
						float field = mix(vP.z, vH * 4.0, uSource) * uDensity;
						float d = abs(fract(field + 0.5) - 0.5) / max(fwidth(field), 1e-5);
						float line = 1.0 - smoothstep(uWidth - 0.5, uWidth + 0.5, d);
						// Lines pack into a solid at grazing angles; fade them out there.
						line *= smoothstep(0.0, 0.35, facing);
						vec3 base = uBase * uFill * (0.5 + 0.5 * ndl);
						vec3 ink = mix(uLine, uLine2, clamp(vH * 3.0 + 0.4, 0.0, 1.0)) * uGlow;
						vec3 col = mix(base, ink, line);
						col += pow(1.0 - facing, 4.0) * uBase * 0.5;
						gl_FragColor = vec4(col, 1.0);
						#include <tonemapping_fragment>
						#include <colorspace_fragment>
					}
				`,
			})
			const mesh = new THREE.Mesh(fine, material)
			return {
				objects: [mesh],
				spring: [50, 5],
				slosh: 0.6,
				controls: {
					density: ctl('Density', 2, 40, 0.5, own.uDensity.value, (v) => (own.uDensity.value = v)),
					width: ctl('Line width', 0.5, 3, 0.05, own.uWidth.value, (v) => (own.uWidth.value = v)),
					source: ctl('Depth → displacement', 0, 1, 0.01, own.uSource.value, (v) => (own.uSource.value = v)),
					fill: ctl('Fill', 0, 1, 0.01, own.uFill.value, (v) => (own.uFill.value = v)),
					glow: ctl('Line glow', 0.4, 2.5, 0.05, own.uGlow.value, (v) => (own.uGlow.value = v)),
				},
				dispose: () => material.dispose(),
			}
		},

		cloud() {
			// The mark as mist: the goo raymarcher again, but instead of stopping
			// at a surface the ray accumulates density from the body's distance
			// field offset by the same noise, puffed out, and composited front to
			// back. Each sample takes a second density read toward the light for
			// self-shadowing, so the bright side reads as lit. Slosh warps the
			// sample point as goo does; the pointer puffs the mist up. Per pixel
			// over the blob's area, so heavier than goo: two noise evaluations
			// per step, 40 steps.
			const camLocal = new THREE.Vector3()
			const own = {
				uDensity: { value: 16 },
				uSoft: { value: 0.16 },
				uPuff: { value: 0.12 },
				uDrift: { value: 1 },
				uGlow: { value: 1 },
			}
			const lit = tokenColor(THREE, host, '--color-primary', '#7c4dff').lerp(new THREE.Color(0xffffff), 0.35)
			const material = new THREE.ShaderMaterial({
				defines: { ...shapeDefines },
				transparent: true,
				depthWrite: false,
				uniforms: {
					uShape: uniforms.uShape,
					uShapeInfo: uniforms.uShapeInfo,
					uPointer: uniforms.uPointer,
					uPointerStrength: uniforms.uPointerStrength,
					uHover: uniforms.uHover,
					uSwayX: uniforms.uSwayX,
					uSwayV: uniforms.uSwayV,
					uTime: uniforms.uTime,
					uAmp: uniforms.uAmp,
					uFreq: uniforms.uFreq,
					uCam: { value: camLocal },
					uLit: { value: lit },
					uShade: { value: tokenColor(THREE, host, '--color-tertiary', '#3b1466') },
					uLightDir: { value: new THREE.Vector3(0.5, 0.7, 1).normalize() },
					...own,
				},
				vertexShader: /* glsl */ `
					varying vec3 vPos;
					void main() {
						vPos = position;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`,
				fragmentShader: /* glsl */ `
					${noiseGLSL}
					${bodyGLSL}
					uniform float uPointerStrength, uHover, uSwayX, uSwayV, uTime, uAmp, uFreq, uDensity, uSoft, uPuff, uDrift, uGlow;
					uniform vec3 uPointer, uCam, uLit, uShade, uLightDir;
					varying vec3 vPos;

					float density(vec3 p) {
						vec3 q = p;
						q.y -= uSwayX * (0.3 + 0.25 * p.y);
						q.x -= uSwayV * 0.03 * p.y;
						float sd = sdBody(q) - uPuff;
						vec3 h = p - uPointer;
						sd -= uPointerStrength * uHover * 0.5 * exp(-dot(h, h) * 4.0);
						// The mist rises: the noise scrolls downward through the body.
						sd -= (noise4(vec4(q * uFreq * 1.5 + vec3(0.0, -uTime * uDrift * 0.25, 0.0), uTime * 0.4)) * 0.5 + 0.15) * uAmp * 2.0;
						return clamp(-sd / uSoft, 0.0, 1.0);
					}
					float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
					void main() {
						vec3 ro = uCam;
						vec3 rd = normalize(vPos - ro);
						const float R = 1.7;
						float b = dot(ro, rd);
						float h = b * b - dot(ro, ro) + R * R;
						if (h < 0.0) discard;
						h = sqrt(h);
						float t = -b - h, tFar = -b + h;
						const int steps = 40;
						float dt = (tFar - t) / float(steps);
						// Jitter the start per pixel so the slices don't band.
						t += dt * hash(gl_FragCoord.xy);
						vec3 col = vec3(0.0);
						float T = 1.0;
						for (int i = 0; i < steps; i++) {
							vec3 pos = ro + rd * t;
							float dn = density(pos);
							if (dn > 0.002) {
								float a = 1.0 - exp(-dn * uDensity * dt);
								float shade = density(pos + uLightDir * 0.14);
								vec3 c = mix(uShade, uLit * uGlow, clamp(1.0 - shade * 1.3, 0.0, 1.0));
								col += T * a * c;
								T *= 1.0 - a;
								if (T < 0.02) break;
							}
							t += dt;
						}
						float alpha = 1.0 - T;
						if (alpha < 0.004) discard;
						gl_FragColor = vec4(col / alpha, alpha);
						#include <tonemapping_fragment>
						#include <colorspace_fragment>
					}
				`,
			})
			const quad = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).translate(0, 0, 2.5), material)
			quad.frustumCulled = false
			return {
				objects: [quad],
				spring: [30, 2.5],
				slosh: 0,
				controls: {
					density: ctl('Density', 1, 30, 0.5, own.uDensity.value, (v) => (own.uDensity.value = v)),
					soft: ctl('Softness', 0.05, 0.6, 0.01, own.uSoft.value, (v) => (own.uSoft.value = v)),
					puff: ctl('Puff', -0.1, 0.4, 0.01, own.uPuff.value, (v) => (own.uPuff.value = v)),
					drift: ctl('Drift', 0, 4, 0.05, own.uDrift.value, (v) => (own.uDrift.value = v)),
					glow: ctl('Glow', 0.4, 2, 0.05, own.uGlow.value, (v) => (own.uGlow.value = v)),
				},
				update() {
					camLocal.copy(camera.position)
					group.worldToLocal(camLocal)
				},
				dispose: () => {
					quad.geometry.dispose()
					material.dispose()
				},
			}
		},

		voxels() {
			// An axis-aligned cubic lattice, sized to cover the body plus the
			// reach of the displacement, and each cube shown only when its cell
			// centre is inside the displaced field the mesh skins march onto.
			// Cells switch on and off as the surface passes through them, so
			// the shape steps rather than flows; nothing moves. Moving each
			// cube by the displacement at its centre and snapping back to the
			// lattice was tried first: where the body normal flips, along the
			// mark's medial planes, neighbours part and a seam opens.
			const spacing = 0.06
			const centres = []
			const seeds = []
			const n = Math.ceil(1.5 / spacing)
			// A column of cubes sits centred on each axis: the camera looks
			// straight down the gap between two columns meeting at x = 0 or
			// y = 0 and sees the background through the whole body.
			for (let i = -n; i <= n; i++)
				for (let j = -n; j <= n; j++)
					for (let k = -n; k <= n; k++) {
						const x = i * spacing
						const y = j * spacing
						const z = k * spacing
						if (shape.sdBody(x, y, z) > 0.4) continue
						centres.push(x, y, z)
						seeds.push(Math.random())
					}
			const count = seeds.length
			const cube = new THREE.BoxGeometry(1, 1, 1)
			cube.setAttribute('aCenter', new THREE.InstancedBufferAttribute(new Float32Array(centres), 3))
			cube.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1))
			const material = new THREE.MeshStandardMaterial({ color: brand.primary, roughness: 0.55, metalness: 0.05 })
			const own = {
				uSpacing: { value: spacing },
				uFill: { value: 0.92 },
				uSnap: { value: 1 },
				uRattle: { value: 1 },
				uVary: { value: 0.25 },
			}
			material.defines = { ...shapeDefines }
			material.onBeforeCompile = (shader) => {
				Object.assign(shader.uniforms, uniforms, own)
				shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${noiseGLSL}\n${bodyGLSL}\n${displaceGLSL}\nattribute vec3 aCenter; attribute float aSeed; uniform float uJostle, uSpacing, uFill, uSnap, uRattle, uVary; varying float vTone;`).replace(
					'#include <begin_vertex>',
					/* glsl */ `
					vec3 c = aCenter;
					c.x += noise4(vec4(aSeed * 40.0, uTime * 9.0, 0.0, 0.0)) * uJostle * uRattle;
					// Inside the displaced field: a hard step at full snap, else the
					// cube grows in over a cell's width as the surface approaches.
					float inside = -sdBlob(aCenter);
					float w = mix(uSpacing, 0.0005, uSnap);
					float sc = smoothstep(-w, w, inside) * uSpacing * uFill;
					vTone = 1.0 - uVary * aSeed;
					vec3 transformed = position * sc + c;`,
				)
				shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vTone;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTone;')
			}
			material.customProgramCacheKey = () => 'blob-voxels'
			const mesh = new THREE.InstancedMesh(cube, material, count)
			mesh.frustumCulled = false
			return {
				objects: [mesh],
				spring: [70, 5],
				slosh: 0.5,
				controls: {
					fill: ctl('Cube fill', 0.4, 1, 0.01, own.uFill.value, (v) => (own.uFill.value = v)),
					snap: ctl('Snap', 0, 1, 0.01, own.uSnap.value, (v) => (own.uSnap.value = v)),
					vary: ctl('Tone variety', 0, 0.6, 0.01, own.uVary.value, (v) => (own.uVary.value = v)),
					rattle: ctl('Rattle', 0, 4, 0.05, own.uRattle.value, (v) => (own.uRattle.value = v)),
					gloss: ctl('Gloss', 0, 1, 0.01, 1 - material.roughness, (v) => (material.roughness = 1 - v)),
				},
				dispose: () => {
					cube.dispose()
					material.dispose()
				},
			}
		},
		ascii() {
			return glyphs({ rain: 0 })
		},

		matrix() {
			return glyphs({ rain: 1 })
		},
	}

	let active = null
	// Returns whether the skin changed, so the lab can skip unknown names.
	function setSkin(name) {
		if (!skins[name] || active?.name === name) return false
		if (active) {
			active.objects.forEach((o) => group.remove(o))
			active.dispose?.()
		}
		active = { name, ...skins[name]() }
		slosh = active.slosh ?? 0.5
		if (active.backdrop) active.objects.push(getBackdrop().quad)
		active.objects.forEach((o) => group.add(o))
		host.dataset.blob = name
		if (still) renderFrame(0)
		return true
	}

	// ── hover: raycast onto the body, bulge toward the pointer ───────────────
	const raycaster = new THREE.Raycaster()
	const ndc = new THREE.Vector2()
	// A coarse copy of the body, marched on the CPU, inflated a little so the
	// pointer still "sticks" on displaced peaks.
	const proxyGeo = geodesic(THREE, 16) // its own: the vertices are moved
	const pos = proxyGeo.attributes.position
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i),
			y = pos.getY(i),
			z = pos.getZ(i)
		const [px, py, pz] = shape.march(x, y, z)
		const n = 1 + 0.15 / Math.hypot(px, py, pz)
		pos.setXYZ(i, px * n, py * n, pz * n)
	}
	const hitBody = new THREE.Mesh(proxyGeo)
	hitBody.visible = false
	group.add(hitBody)

	host.addEventListener('pointermove', (e) => {
		const r = renderer.domElement.getBoundingClientRect()
		ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
		raycaster.setFromCamera(ndc, camera)
		const hit = raycaster.intersectObject(hitBody, false)[0]
		if (hit) {
			const next = group.worldToLocal(hit.point)
			if (pointer.target) pointer.vel.add(next).sub(pointer.local)
			pointer.local.copy(next)
			pointer.target = 1
		} else {
			pointer.target = 0
		}
	})
	// On touch the browser takes over a vertical drag as a scroll (the hosts
	// use touch-action: pan-y) and fires pointercancel, never pointerleave; a
	// lifted finger ends the hover too, where a released mouse button doesn't.
	const release = () => (pointer.target = 0)
	host.addEventListener('pointerleave', release)
	host.addEventListener('pointercancel', release)
	host.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && release())

	// ── sizing / visibility ──────────────────────────────────────────────────
	function resize() {
		const canvas = renderer.domElement
		const w = canvas.clientWidth || host.clientWidth
		const h = canvas.clientHeight || host.clientHeight
		if (!w || !h) return
		renderer.setSize(w, h, false)
		// Bleed (see header): a canvas taller than its host gets a proportionally
		// wider view, so the body keeps its on-screen size and position.
		const bleed = h / (host.clientHeight || h)
		camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * bleed))
		camera.aspect = w / h
		camera.updateProjectionMatrix()
		if (still) renderFrame(0)
	}
	new ResizeObserver(resize).observe(host)

	let visible = true
	// Entries can arrive batched (e.g. a scroll restore right after mount), so
	// read the newest one, not the first.
	new IntersectionObserver((entries) => (visible = entries[entries.length - 1].isIntersecting), { rootMargin: '10%' }).observe(host)

	// ── frame ────────────────────────────────────────────────────────────────
	const timer = new THREE.Timer()

	function renderFrame(dt) {
		pointer.strength += (pointer.target - pointer.strength) * Math.min(1, dt * 6)
		pointer.vel.multiplyScalar(Math.exp(-dt * 5)).clampLength(0, 0.3)
		const [stiffness, damping] = active?.spring ?? [50, 5]
		stepSway(dt, stiffness, damping)
		// A whisper of tilt with the spring keeps it alive without ever turning
		// the mark away from the viewer; a skin that holds still can turn it off.
		const tilt = active?.tilt ?? 1
		lean.lerp(cursor, Math.min(1, dt * 4))
		const toward = 0.05 * params.tilt * tilt
		group.rotation.x = sway.x * 0.05 * tilt - lean.y * toward
		group.rotation.y = lean.x * toward
		group.rotation.z = -sway.v * 0.004 * tilt

		uniforms.uTime.value = time
		uniforms.uAmp.value = params.amp
		uniforms.uFreq.value = params.freq
		uniforms.uHover.value = params.hover
		uniforms.uSway.value = sway.x * slosh
		uniforms.uSwayX.value = sway.x
		uniforms.uSwayV.value = sway.v
		uniforms.uJostle.value = Math.abs(sway.v) * 0.04
		uniforms.uPointerStrength.value = pointer.strength

		active?.update?.(dt)
		if (active?.backdrop) backdrop.sync()
		renderer.render(scene, camera)
	}

	function loop() {
		requestAnimationFrame(loop)
		if (!visible) {
			kick = 0
			lastScroll = window.scrollY
			return
		}
		timer.update()
		const dt = Math.min(timer.getDelta(), 0.05)
		// Hovering and sloshing speed the noise up a touch so the surface feels
		// reactive; a skin whose motion is a steady flow can turn the hover
		// part off, or the flow lurches every time the pointer crosses the mark.
		time += dt * params.speed * (1 + pointer.strength * (active?.hoverSpeed ?? 0.8) + Math.abs(sway.x) * 0.6)
		renderFrame(dt)
	}

	resize()
	if (!still) loop()

	return {
		setSkin,
		render: () => renderFrame(0),
		get active() {
			return active
		},
	}
}
