// Prefix every id / class / keyframe name inside the SVG (and rewrite all
// references to them) so multiple SVGs on one page can't collide.
function scopeSvg(svg, prefix) {
	// Collect the names we own before renaming anything.
	const ids = new Set()
	svg.querySelectorAll('[id]').forEach((el) => ids.add(el.id))
	const classes = new Set()
	svg.querySelectorAll('[class]').forEach((el) => el.classList.forEach((c) => classes.add(c)))
	const keyframes = new Set()
	svg.querySelectorAll('style').forEach((el) => {
		for (const m of el.textContent.matchAll(/@keyframes\s+([\w-]+)/g)) keyframes.add(m[1])
	})

	// Rename id and class attributes on elements.
	svg.querySelectorAll('[id]').forEach((el) => (el.id = prefix + el.id))
	svg.querySelectorAll('[class]').forEach((el) => {
		el.setAttribute('class', [...el.classList].map((c) => (classes.has(c) ? prefix + c : c)).join(' '))
	})

	// Rename a keyframe reference wherever it appears in a CSS string.
	const prefixKeyframes = (css) => {
		keyframes.forEach((name) => {
			css = css.replace(new RegExp(`(^|[^\\w-])${name}(?![\\w-])`, 'g'), (m, before) => `${before}${prefix}${name}`)
		})
		return css
	}

	// Rewrite url(#id) and href="#id" references in every attribute.
	svg.querySelectorAll('*').forEach((el) => {
		for (const attr of el.attributes) {
			let v = attr.value
			if (v.includes('url(#')) {
				v = v.replace(/url\(#([\w-]+)\)/g, (m, id) => (ids.has(id) ? `url(#${prefix}${id})` : m))
			}
			if ((attr.name === 'href' || attr.name.endsWith(':href')) && v.startsWith('#') && ids.has(v.slice(1))) {
				v = `#${prefix}${v.slice(1)}`
			}
			// Minifiers (SVGO) hoist `#id { animation: kf_x }` rules into inline
			// style attributes, so keyframe names live out here too — not just in
			// the <style> block. Miss these and the renamed @keyframes go unmatched.
			if (attr.name === 'style' && v.includes('animation')) {
				v = prefixKeyframes(v)
			}
			if (v !== attr.value) attr.value = v
		}
	})

	// Warn about element/global selectors: an inline <style> is NOT scoped to
	// its SVG, so a bare `path {}` / `svg {}` rule leaks to every element on the
	// page. All current exports are #id-based; this catches a bad one early.
	// Heuristic: check the first token of each selector (rules always follow a
	// `}` or the start of the block); skip @-rules and keyframe steps.
	const keyframeStep = /^(from|to|-?[\d.]+%?)$/
	svg.querySelectorAll('style').forEach((el) => {
		for (const m of el.textContent.matchAll(/(?:^|})\s*([^{}@]+?)\s*\{/g)) {
			for (const sel of m[1].split(',')) {
				const first = sel.trim().split(/[\s>+~]/)[0]
				if (!first || keyframeStep.test(first) || first[0] === '#' || first[0] === '.') continue
				console.warn(`[inlineSvg] unscoped selector "${sel.trim()}" leaks globally; scope it to an #id or .class`, svg)
			}
		}
	})

	// Rewrite the <style> text: #id selectors/refs, .class selectors, keyframe names.
	svg.querySelectorAll('style').forEach((el) => {
		let css = el.textContent
		css = css.replace(/#([\w-]+)/g, (m, id) => (ids.has(id) ? `#${prefix}${id}` : m))
		css = css.replace(/\.([\w-]+)/g, (m, c) => (classes.has(c) ? `.${prefix}${c}` : m))
		el.textContent = prefixKeyframes(css)
	})
}

export default function animation() {
	let svgCounter = 0

	// Paused is the default state (see svg[data-animated] rule in _animation.css);
	// these observers add/remove data-svg-playing to gate it.
	// Play once the SVG rises to 25% up from the bottom of the viewport (the
	// bottom margin shrinks the root, so "intersecting" starts at that line).
	// SMIL (<animate> and friends) ignores animation-play-state, so it's gated
	// on the SVG's own timeline instead.
	const playObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue
				entry.target.setAttribute('data-svg-playing', '')
				entry.target.unpauseAnimations()
			}
		},
		{ rootMargin: '0px 0px -25% 0px' },
	)

	// Pause only once the SVG is completely out of the viewport.
	const outObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) continue
			entry.target.removeAttribute('data-svg-playing')
			entry.target.pauseAnimations()
		}
	})

	// Replace an <img data-animated> with the fetched inline <svg>, so the
	// SVG's markup lives in the DOM and its animations can run and be gated.
	async function inlineSvg(img) {
		try {
			const res = await fetch(img.src)
			if (!res.ok) return
			const markup = await res.text()
			const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('svg')
			if (!svg) return

			scopeSvg(svg, `svg${++svgCounter}-`)

			// Drop the SVG's intrinsic sizing so the img's classes control size.
			// viewBox stays, so aspect ratio is preserved and height follows width.
			svg.removeAttribute('width')
			svg.removeAttribute('height')
			svg.style.removeProperty('width')
			svg.style.removeProperty('height')
			if (!svg.getAttribute('style')) svg.removeAttribute('style')

			// Carry over the img's attributes (class, id, alt→aria-label, etc.).
			// data-animated rides along too — it's what the paused-by-default CSS
			// rule targets on the resulting <svg>.
			for (const { name, value } of img.attributes) {
				if (name === 'src') continue
				if (name === 'alt') {
					// Empty alt = decorative: hide from the a11y tree entirely.
					if (value.trim()) {
						svg.setAttribute('aria-label', value)
						svg.setAttribute('role', 'img')
					} else {
						svg.setAttribute('aria-hidden', 'true')
					}
					continue
				}
				if (name === 'class') {
					svg.classList.add(...value.split(/\s+/).filter(Boolean))
					continue
				}
				svg.setAttribute(name, value)
			}

			// playObserver adds data-svg-playing at the 25% line; outObserver
			// removes it again only once it's fully out of view.
			img.replaceWith(svg)

			// Reduced motion: the CSS rule parks the CSS animations; do the same
			// for SMIL by seeking past the end and freezing there.
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				svg.setCurrentTime(100000)
				svg.pauseAnimations()
				return
			}

			// Paused until the play line, matching the CSS default.
			svg.pauseAnimations()
			playObserver.observe(svg)
			outObserver.observe(svg)
		} catch {
			/* leave the <img> in place on failure */
		}
	}

	document.querySelectorAll('img[data-animated]').forEach(inlineSvg)
}
