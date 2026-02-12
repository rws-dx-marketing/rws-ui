if (typeof window !== 'undefined') {
	var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon')
	var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon')

	const storedTheme = localStorage.getItem('color-theme')

	if (storedTheme === 'dark') {
		themeToggleLightIcon && themeToggleLightIcon.classList.remove('hidden')
	} else {
		themeToggleDarkIcon && themeToggleDarkIcon.classList.remove('hidden')
	}

	var themeToggleBtn = document.getElementById('theme-toggle')

	themeToggleBtn &&
		themeToggleBtn.addEventListener('click', function () {
			themeToggleDarkIcon && themeToggleDarkIcon.classList.toggle('hidden')
			themeToggleLightIcon && themeToggleLightIcon.classList.toggle('hidden')

			const currentStoredTheme = localStorage.getItem('color-theme')

			if (currentStoredTheme) {
				if (currentStoredTheme === 'light') {
					document.documentElement.classList.add('dark')
					localStorage.setItem('color-theme', 'dark')
				} else {
					document.documentElement.classList.remove('dark')
					localStorage.setItem('color-theme', 'light')
				}
			} else {
				if (document.documentElement.classList.contains('dark')) {
					document.documentElement.classList.remove('dark')
					localStorage.setItem('color-theme', 'light')
				} else {
					document.documentElement.classList.add('dark')
					localStorage.setItem('color-theme', 'dark')
				}
			}
		})
}
