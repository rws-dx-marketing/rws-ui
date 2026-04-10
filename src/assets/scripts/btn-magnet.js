if (typeof window !== 'undefined') {
	const magnets = document.querySelectorAll('.btn-magnet')
	const maxDistance = 120
	const strength = 0.25

	if (magnets.length > 0) {
		document.addEventListener('mousemove', (event) => {
			magnets.forEach((magnetic) => {
				const rect = magnetic.getBoundingClientRect()
				const centerX = rect.left + rect.width / 2
				const centerY = rect.top + rect.height / 2
				const deltaX = event.clientX - centerX
				const deltaY = event.clientY - centerY
				const distance = Math.hypot(deltaX, deltaY)

				if (distance < maxDistance) {
					magnetic.style.transform = `translate(${deltaX * strength}px, ${deltaY * strength}px)`
				} else {
					magnetic.style.transform = 'translate(0, 0)'
				}
			})
		})
	}
}
