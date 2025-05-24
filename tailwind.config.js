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
				// Extended colors
				error: 'var(--color-error)',
				warning: 'var(--color-warning)',
				success: 'var(--color-success)',
				info: 'var(--color-info)',
				// Neutral shades
				'neutral-50': 'var(--color-neutral-50)',
				'neutral-100': 'var(--color-neutral-100)',
				'neutral-200': 'var(--color-neutral-200)',
				'neutral-300': 'var(--color-neutral-300)',
				'neutral-400': 'var(--color-neutral-400)',
				'neutral-500': 'var(--color-neutral-500)',
				'neutral-600': 'var(--color-neutral-600)',
				'neutral-700': 'var(--color-neutral-700)',
				'neutral-800': 'var(--color-neutral-800)',
				'neutral-900': 'var(--color-neutral-900)',
				'neutral-950': 'var(--color-neutral-950)',
			},
			fontFamily: {
				'mono': ['AdwaitaMono', 'monospace'],
			},
		},
	},
	plugins: [],
}
