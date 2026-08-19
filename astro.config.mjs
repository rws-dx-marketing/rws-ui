import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	redirects: {
		'/faq': '/faqs',
		'/faq/faq-1': '/faqs/faq-1',
	},
	devToolbar: {
		enabled: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},
})
