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
				// Terminal glow colors
				'terminal-glow': 'var(--terminal-glow)',
				'terminal-glow-intense': 'var(--terminal-glow-intense)',
			},
			fontFamily: {
				'mono': ['AdwaitaMono', 'monospace'],
			},
			animation: {
				'cursor-blink': 'cursor-blink 1s step-end infinite',
				'blink': 'blink 1s step-end infinite',
				'typing': 'typing 2s steps(40, end)',
				'typing-cursor': 'typing-cursor 0.75s step-end infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'glitch': 'glitch 0.5s infinite',
				'scanlines': 'scanlines 8s linear infinite',
				'flicker': 'flicker 0.15s infinite',
				'loading-dots': 'loading-dots 1.5s infinite',
				'fade-in': 'fadeIn 0.5s ease-in',
				'slide-in': 'slideIn 0.5s ease-out',
				'chromatic': 'chromatic 0.5s ease-in-out infinite alternate',
			},
			keyframes: {
				'cursor-blink': {
					'0%, 49%': { opacity: '0' },
					'50%, 100%': { opacity: '0.8' },
				},
				'blink': {
					'0%, 50%': { opacity: '1' },
					'51%, 100%': { opacity: '0' },
				},
				'typing': {
					'from': { width: '0' },
					'to': { width: '100%' },
				},
				'typing-cursor': {
					'from, to': { borderColor: 'transparent' },
					'50%': { borderColor: 'var(--accent-primary)' },
				},
				'glow': {
					'0%, 100%': {
						textShadow: '0 0 5px var(--accent-primary), 0 0 10px var(--accent-primary), 0 0 15px var(--accent-primary)',
					},
					'50%': {
						textShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary), 0 0 30px var(--accent-primary)',
					},
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' },
				},
				'glitch': {
					'0%, 100%': {
						textShadow: '0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), 0.025em 0.05em 0 rgba(0, 0, 255, 0.75)',
					},
					'15%': {
						textShadow: '-0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75)',
					},
					'50%': {
						textShadow: '0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75)',
					},
				},
				'scanlines': {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(100vh)' },
				},
				'flicker': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.96' },
					'50.1%': { opacity: '0.98' },
					'50.2%': { opacity: '0.95' },
				},
				'chromatic': {
					'0%, 100%': {
						textShadow: '0.01em 0 0 rgba(255, 0, 0, 0.5), -0.01em 0 0 rgba(0, 255, 255, 0.5)',
					},
					'50%': {
						textShadow: '0.02em 0 0 rgba(255, 0, 0, 0.5), -0.02em 0 0 rgba(0, 255, 255, 0.5)',
					},
				},
				'loading-dots': {
					'0%': { content: '"."' },
					'33%': { content: '".."' },
					'66%': { content: '"..."' },
					'100%': { content: '"."' },
				},
				'fadeIn': {
					'from': { opacity: '0', transform: 'translateY(10px)' },
					'to': { opacity: '1', transform: 'translateY(0)' },
				},
				'slideIn': {
					'from': { transform: 'translateX(-100%)' },
					'to': { transform: 'translateX(0)' },
				},
			},
			boxShadow: {
				'terminal': '0 0 20px rgba(var(--border-color-rgb), 0.1), 0 0 40px rgba(var(--border-color-rgb), 0.05), inset 0 0 20px rgba(0, 0, 0, 0.5)',
				'terminal-hover': '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(var(--border-color-rgb), 0.1)',
				'terminal-glow': '0 0 20px var(--terminal-glow)',
				'crt': '0 4px 16px rgba(0, 0, 0, 0.1)',
				'crt-hover': '0 6px 20px rgba(0, 0, 0, 0.15)',
			},
			backgroundImage: {
				'scanline': 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%)',
				'scanline-heavy': 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
				'matrix-rain': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(var(--border-color-rgb), 0.03) 2px, rgba(var(--border-color-rgb), 0.03) 4px)',
				'terminal-gradient': 'linear-gradient(135deg, transparent 0%, rgba(var(--border-color-rgb), 0.05) 100%)',
			},
			backgroundSize: {
				'scanline': '100% 4px',
				'scanline-heavy': '100% 2px',
			},
		},
	},
	plugins: [
		function({ addUtilities, addComponents }) {
			// Terminal text utilities
			addUtilities({
				'.terminal-text-glow': {
					textShadow: '0 0 5px var(--terminal-glow)',
				},
				'.terminal-text-glow-intense': {
					textShadow: '0 0 10px var(--terminal-glow-intense)',
				},
				'.terminal-prompt': {
					'&::before': {
						content: '"$ "',
						color: 'var(--accent-primary)',
						fontWeight: 'bold',
					},
				},
				'.terminal-cursor': {
					'&::after': {
						content: '"_"',
						animation: 'blink 1s step-end infinite',
						color: 'var(--accent-primary)',
						fontWeight: 'bold',
					},
				},
			});

			// Terminal components
			addComponents({
				'.terminal-card': {
					backgroundColor: 'var(--bg-primary)',
					border: '1px solid var(--border-color)',
					position: 'relative',
					transition: 'all 0.3s ease',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: '0',
						left: '0',
						right: '0',
						bottom: '0',
						background: 'linear-gradient(135deg, transparent 0%, rgba(var(--border-color-rgb), 0.05) 100%)',
						pointerEvents: 'none',
					},
					'&:hover': {
						transform: 'translateY(-4px)',
						boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(var(--border-color-rgb), 0.1)',
						borderColor: 'var(--accent-primary)',
					},
				},
				'.terminal-button': {
					background: 'var(--bg-primary)',
					color: 'var(--text-primary)',
					border: '2px solid var(--border-color)',
					padding: '0.5rem 1rem',
					fontFamily: 'monospace',
					position: 'relative',
					transition: 'all 0.2s',
					textTransform: 'uppercase',
					letterSpacing: '0.1em',
					cursor: 'pointer',
					'&::before': {
						content: '"[ "',
						color: 'var(--accent-primary)',
					},
					'&::after': {
						content: '" ]"',
						color: 'var(--accent-primary)',
					},
					'&:hover': {
						background: 'var(--accent-primary)',
						color: 'var(--bg-primary)',
						transform: 'translateY(-2px)',
						boxShadow: '0 5px 0 var(--border-color), 0 10px 20px rgba(0, 0, 0, 0.3)',
					},
					'&:active': {
						transform: 'translateY(0)',
						boxShadow: '0 2px 0 var(--border-color), 0 5px 10px rgba(0, 0, 0, 0.2)',
					},
				},
				'.ascii-divider': {
					textAlign: 'center',
					margin: '2rem 0',
					color: 'var(--text-secondary)',
					fontFamily: 'monospace',
					position: 'relative',
					'&::before': {
						content: '"═══════════════════════════════════════════"',
					},
				},
				'.ascii-divider-dots': {
					'&::before': {
						content: '"• • • • • • • • • • • • • • • • • • • • • •"',
					},
				},
				'.ascii-divider-dashed': {
					'&::before': {
						content: '"- - - - - - - - - - - - - - - - - - - - - -"',
					},
				},
			});
		},
	],
}
