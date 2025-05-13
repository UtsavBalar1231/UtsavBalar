/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: 'var(--accent-primary)',
				secondary: 'var(--accent-secondary)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
				black: 'var(--bg-primary)',
				'gray-600': 'var(--border-color)',
				'gray-700': 'rgba(var(--border-color-rgb), 0.8)',
				'gray-800': 'var(--bg-secondary)',
				'gray-400': 'var(--text-secondary)',
				'gray-100': 'var(--text-primary)',
			},
			fontFamily: {
				'mono': ['AdwaitaMono', 'monospace'],
			},
		},
	},
	plugins: [],
}
