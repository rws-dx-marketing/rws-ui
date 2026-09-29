// Goo — brand-coloured gel spheres orbiting and merging, for the pre-launch
// teaser. One canvas, one shader, no options beyond the settings object below.
//
// Self-contained on purpose: the goo skin is copied from the 3D lab (blob.js)
// with its body switched off, so this file and `three` are all the production
// port needs. The lab keeps its own copy for trying other skins and the mark.
//
//   [data-goo]             the canvas host; the canvas is appended to it
//   [data-goo-settings]    JSON on the host overriding `defaults` below
//
// Bleed: style the canvas larger than its host (absolute, centred, e.g. 200%)
// so the spheres aren't clipped at the host's edge. The camera widens by the
// same ratio, so the scene sits where it would in a host-sized canvas. Give
// the canvas pointer-events: none so the overflow doesn't cover what's round it.
//
// The spheres are a signed-distance scene blended with a smooth minimum and
// sphere-traced per pixel on one quad; nothing per frame on the CPU beyond a
// handful of uniforms, and the merge is exact at any zoom. Shaded with a
// matcap painted from the brand tokens plus a fresnel rim and a key light.
// The scene leans a few degrees toward the cursor wherever it is on the page,
// and scroll kicks a damped spring the spheres trail behind.
//
// CMS build: no bundler, so three is loaded from jsDelivr, pinned to the
// version the prototype uses. Dynamic import() works in a plain <script>.

(function () {
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js'

const defaults = {
	count: 5, // number of spheres (0–9)
	roam: 0.65, // how far they orbit from the centre (0–0.8)
	size: 1, // sphere size (0.2–2.5)
	speed: 0.7, // orbit speed (0–3)
	goo: 0.9, // how readily they merge (0.02–1)
	rim: 0, // fresnel rim light (0–1.5)
	edge: 0.12, // width of the dark outer edge; its depth stays the same (0–0.6)
	light: 1, // how far the highlight follows the cursor (0–2)
	inertia: 1, // how hard scroll kicks the spring (0–3)
	tilt: 3, // how far the scene leans toward the cursor; 1 ≈ 3° (0–3)
}

function goo() {
	if (typeof window === 'undefined') return
	const hosts = document.querySelectorAll('[data-goo]')
	if (!hosts.length) return
	import(THREE_URL).then((THREE) => hosts.forEach((host) => mount(host, THREE)))
}

function readSettings(host) {
	const raw = host.dataset.gooSettings
	if (!raw) return {}
	try {
		return JSON.parse(raw)
	} catch {
		console.warn('[goo] data-goo-settings is not valid JSON', host)
		return {}
	}
}

// ── instance: one canvas ─────────────────────────────────────────────────────
function mount(host, THREE) {
	const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const p = { ...defaults }
	Object.entries(readSettings(host)).forEach(([k, v]) => {
		if (k in p && typeof v === 'number') p[k] = v
	})

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

	const group = new THREE.Group()
	scene.add(group)

	// ── scroll → spring ──────────────────────────────────────────────────────
	// Scroll velocity kicks a damped oscillator. Positive `sway.x` means the
	// page just moved up (scrolling down), so the spheres trail downward, then
	// overshoot and settle like liquid in a glass.
	const sway = { x: 0, v: 0 }
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
		sway.v += Math.max(-4, Math.min(4, kick * 0.008 * p.inertia))
		kick = 0
		sway.v += (-sway.x * stiffness - sway.v * damping) * dt
		sway.x = Math.max(-1, Math.min(1, sway.x + sway.v * dt))
	}

	// ── cursor → lean ────────────────────────────────────────────────────────
	// Where the pointer is relative to the host's centre, anywhere on the page,
	// in half-viewport units clamped to ±1. `lean` eases toward it each frame;
	// the group turns a few degrees that way and the key light follows it.
	// Nothing happens under reduced motion.
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

	// ── spheres ──────────────────────────────────────────────────────────────
	// Fixed orbits, each a Lissajous path with its own rates and phases.
	const sats = Array.from({ length: 9 }, (_, i) => ({
		a: 0.6 + (i % 3) * 0.35,
		b: 0.45 + ((i * 7) % 5) * 0.2,
		c: 0.5 + ((i * 3) % 4) * 0.25,
		p: i * 2.1,
		q: i * 1.3,
		s: 0.4 + (i % 4) * 0.09,
		r: 0.75 + ((i * 5) % 4) * 0.09,
	}))
	const balls = Array.from({ length: sats.length }, () => new THREE.Vector4())
	const camLocal = new THREE.Vector3()

	// Key light in view space, eased toward the cursor so the highlight glides.
	// The matcap has its light baked in at `keyDefault`, so the lookup normal
	// is rotated by the inverse of the rotation that takes keyDefault to the
	// current light, and the highlight moves with it. Kept small: a large swing
	// rolls the whole colour gradient, not just the light.
	const keyDefault = new THREE.Vector3(0.5, 0.7, 1).normalize()
	const light = { dir: keyDefault.clone(), target: keyDefault.clone(), rot: new THREE.Matrix3(), q: new THREE.Quaternion(), m4: new THREE.Matrix4() }

	// ── material ─────────────────────────────────────────────────────────────
	const material = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			uCam: { value: camLocal },
			uBalls: { value: balls },
			uCount: { value: p.count },
			uGoo: { value: p.goo },
			uRim: { value: p.rim },
			uPixel: { value: 0 },
			uLight: { value: light.dir },
			uLightRot: { value: light.rot },
			uMatcap: { value: matcapTexture(THREE, host, { rim: p.edge }) },
		},
		vertexShader: /* glsl */ `
			varying vec3 vPos;
			void main() {
				vPos = position;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform float uGoo, uRim;
			uniform float uPixel; // one pixel's width at unit distance
			uniform int uCount;
			uniform vec3 uCam, uLight;
			uniform mat3 normalMatrix; // vertex-stage built-in; Three still binds it here once declared
			uniform mat3 uLightRot;
			uniform vec4 uBalls[9]; // xyz centre, w radius
			uniform sampler2D uMatcap;
			varying vec3 vPos;

			float smin(float a, float b, float k) {
				float h = max(k - abs(a - b), 0.0) / k;
				return min(a, b) - h * h * k * 0.25;
			}
			float sdScene(vec3 p) {
				float d = 1e3;
				for (int i = 0; i < 9; i++) {
					if (i >= uCount) break;
					d = smin(d, length(p - uBalls[i].xyz) - uBalls[i].w, uGoo);
				}
				return d;
			}
			// Wide taps, so the smooth minimum doesn't show up as ridges in the normal.
			// Unnormalised: its length over 4e is the field's slope, used for the edge.
			const float e = 0.012;
			vec3 sceneG(vec3 p) {
				const vec2 k = vec2(1.0, -1.0);
				return k.xyy * sdScene(p + k.xyy * e) + k.yyx * sdScene(p + k.yyx * e) + k.yxy * sdScene(p + k.yxy * e) + k.xxx * sdScene(p + k.xxx * e);
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
				// Most rays finish in a few dozen steps; ones skimming past a front
				// sphere crawl along it, and a lower cap strands them short of the one
				// behind, a see-through wedge where the spheres overlap.
				for (int i = 0; i < 256; i++) {
					vec3 pos = ro + rd * t;
					float d = sdScene(pos);
					if (d < nearest) { nearest = d; tNear = t; }
					// A tenth of a pixel, or near misses count as hits and eat the edge fade.
					if (d < uPixel * t * 0.1) { hit = true; break; }
					t += d * 0.8;
					if (t > tFar) break;
				}
				// Near misses get the closest point's shading at a fading alpha,
				// which softens the silhouette without supersampling. The smooth
				// minimum shrinks the field where spheres blend, so the miss is
				// measured as field / slope, and faded over one pixel.
				if (!hit && nearest > 0.05) discard;
				vec3 pos = ro + rd * (hit ? t : tNear);
				vec3 g = sceneG(pos);
				vec3 n = normalize(g);
				float miss = nearest / max(length(g) / (4.0 * e), 0.1);
				float alpha = hit ? 1.0 : 1.0 - miss / (uPixel * tNear);
				if (alpha <= 0.0) discard;
				vec3 vn = normalize(normalMatrix * n);
				vec3 col = texture2D(uMatcap, (uLightRot * vn).xy * 0.495 + 0.5).rgb;
				// Fresnel rim and a tight highlight from the key light give it the gel look.
				float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
				col += fres * uRim * 0.35;
				float spec = pow(max(dot(reflect(-uLight, vn), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
				col += spec * 0.5;
				gl_FragColor = vec4(col, alpha);
				#include <tonemapping_fragment>
				#include <colorspace_fragment>
			}
		`,
	})
	// The offset is baked into the geometry, not the mesh, so vertex positions
	// (and so the rays) are in the group's space.
	const quad = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).translate(0, 0, 2.5), material)
	quad.frustumCulled = false
	group.add(quad)

	// ── sizing / visibility ──────────────────────────────────────────────────
	function resize() {
		const canvas = renderer.domElement
		const w = canvas.clientWidth || host.clientWidth
		const h = canvas.clientHeight || host.clientHeight
		if (!w || !h) return
		renderer.setSize(w, h, false)
		// Bleed (see header): a canvas taller than its host gets a proportionally
		// wider view, so the scene keeps its on-screen size and position.
		const bleed = h / (host.clientHeight || h)
		camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * bleed))
		camera.aspect = w / h
		camera.updateProjectionMatrix()
		material.uniforms.uPixel.value = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / renderer.domElement.height
		if (still) renderFrame(0)
	}
	new ResizeObserver(resize).observe(host)

	let visible = true
	// Entries can arrive batched (e.g. a scroll restore right after mount), so
	// read the newest one, not the first.
	new IntersectionObserver((entries) => (visible = entries[entries.length - 1].isIntersecting), { rootMargin: '10%' }).observe(host)

	// ── frame ────────────────────────────────────────────────────────────────
	const timer = new THREE.Timer()
	let time = 0

	function renderFrame(dt) {
		stepSway(dt, 35, 3)
		// A whisper of tilt with the spring keeps it alive without turning it away.
		lean.lerp(cursor, Math.min(1, dt * 4))
		const toward = 0.05 * p.tilt
		group.rotation.x = sway.x * 0.05 - lean.y * toward
		group.rotation.y = lean.x * toward
		group.rotation.z = -sway.v * 0.004

		camLocal.copy(camera.position)
		group.worldToLocal(camLocal)
		// The cursor is in half-viewport units; scale to host half-widths.
		const k = 0.18 * p.light * (window.innerWidth / host.clientWidth)
		light.target.set(keyDefault.x + cursor.x * k, keyDefault.y + cursor.y * k, keyDefault.z).normalize()
		light.dir.lerp(light.target, 0.08).normalize()
		light.q.setFromUnitVectors(keyDefault, light.dir)
		light.rot.setFromMatrix4(light.m4.makeRotationFromQuaternion(light.q)).transpose()

		const t = time * p.speed
		for (let i = 0; i < p.count; i++) {
			const o = sats[i]
			const rr = p.roam * o.r * 1.9
			// Spheres trail the scroll: further out, more lag and more shear.
			const x = Math.sin(t * o.a + o.p) * Math.cos(t * o.c + o.q) * rr - sway.v * 0.06 * o.r
			const y = Math.sin(t * o.b + o.q) * rr + sway.x * (0.3 + 0.25 * o.r)
			const z = Math.cos(t * o.a + o.p) * Math.sin(t * o.c + o.q) * rr * 0.6
			balls[i].set(x, y, z, o.s * p.size * 0.55)
		}

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
		// The orbits hurry a touch while the spring is swinging.
		time += dt * (1 + Math.abs(sway.x) * 0.6)
		renderFrame(dt)
	}

	resize()
	if (!still) loop()
}

// ── colour tokens ────────────────────────────────────────────────────────────
// Reads a brand token off the host as its raw CSS string (oklch() as written).
function token(host, name, fallback) {
	return getComputedStyle(host).getPropertyValue(name).trim() || fallback
}

// A matcap is a picture of a lit sphere; the shader looks up the normal in it.
// Painted from the brand tokens on the host, so it follows the theme:
// secondary lights the top-left, primary carries the body, tertiary takes the
// shadow side and the rim. Canvas accepts the oklch() strings as they are.
function matcapTexture(THREE, host, { rim = 0.3, highlight = 0.12, blend = 0.55 } = {}) {
	const primary = token(host, '--color-primary', '#7c4dff')
	const secondary = token(host, '--color-secondary', '#e6306e')
	const tertiary = token(host, '--color-tertiary', '#3b1466')

	const size = 96
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
	const spec = ctx.createRadialGradient(size * 0.33, size * 0.3, 0, size * 0.33, size * 0.3, size * highlight)
	spec.addColorStop(0, 'rgba(255,255,255,0.7)')
	spec.addColorStop(0.4, 'rgba(255,255,255,0.15)')
	spec.addColorStop(1, 'transparent')
	ctx.fillStyle = spec
	ctx.fillRect(0, 0, size, size)

	const t = new THREE.CanvasTexture(c)
	t.colorSpace = THREE.SRGBColorSpace
	return t
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', goo, { once: true })
else goo()
})()
