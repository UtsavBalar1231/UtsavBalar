/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--accent-primary)",
        secondary: "var(--accent-secondary)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        black: "var(--bg-primary)",
        "gray-600": "var(--border-color)",
        "gray-700": "rgba(var(--border-color-rgb), 0.8)",
        "gray-800": "var(--bg-secondary)",
        "gray-400": "var(--text-secondary)",
        "gray-100": "var(--text-primary)",
        // Extended colors
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        info: "var(--color-info)",
        // Neutral shades
        "neutral-50": "var(--color-neutral-50)",
        "neutral-100": "var(--color-neutral-100)",
        "neutral-200": "var(--color-neutral-200)",
        "neutral-300": "var(--color-neutral-300)",
        "neutral-400": "var(--color-neutral-400)",
        "neutral-500": "var(--color-neutral-500)",
        "neutral-600": "var(--color-neutral-600)",
        "neutral-700": "var(--color-neutral-700)",
        "neutral-800": "var(--color-neutral-800)",
        "neutral-900": "var(--color-neutral-900)",
        "neutral-950": "var(--color-neutral-950)",
        // Terminal glow colors
        "terminal-glow": "var(--terminal-glow)",
        "terminal-glow-intense": "var(--terminal-glow-intense)",
        // 16-color terminal palette
        "term-black": "var(--term-black)",
        "term-red": "var(--term-red)",
        "term-green": "var(--term-green)",
        "term-yellow": "var(--term-yellow)",
        "term-blue": "var(--term-blue)",
        "term-magenta": "var(--term-magenta)",
        "term-cyan": "var(--term-cyan)",
        "term-white": "var(--term-white)",
        "term-bright-black": "var(--term-bright-black)",
        "term-bright-red": "var(--term-bright-red)",
        "term-bright-green": "var(--term-bright-green)",
        "term-bright-yellow": "var(--term-bright-yellow)",
        "term-bright-blue": "var(--term-bright-blue)",
        "term-bright-magenta": "var(--term-bright-magenta)",
        "term-bright-cyan": "var(--term-bright-cyan)",
        "term-bright-white": "var(--term-bright-white)",
      },
      backgroundColor: {
        terminal: "var(--bg-primary)",
        "terminal-secondary": "var(--bg-secondary)",
        // Semantic backgrounds
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        info: "var(--color-info)",
      },
      textColor: {
        terminal: "var(--text-primary)",
        "terminal-secondary": "var(--text-secondary)",
        // Semantic text colors
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        info: "var(--color-info)",
      },
      borderColor: {
        terminal: "var(--border-color)",
        // Semantic border colors
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        info: "var(--color-info)",
      },
      opacity: {
        "crt-scanline": "var(--crt-scanline-opacity)",
        "crt-static": "var(--crt-static-opacity)",
      },
      fontFamily: {
        mono: ["AdwaitaMono", "monospace"],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        glitch: "glitch 0.5s infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        typing: "typing 2s steps(40, end)",
      },
      keyframes: {
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        glitch: {
          "0%, 100%": {
            textShadow:
              "0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), 0.025em 0.05em 0 rgba(0, 0, 255, 0.75)",
          },
          "15%": {
            textShadow:
              "-0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75)",
          },
          "50%": {
            textShadow:
              "0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75)",
          },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        terminal:
          "0 0 20px rgba(var(--border-color-rgb), 0.1), 0 0 40px rgba(var(--border-color-rgb), 0.05), inset 0 0 20px rgba(0, 0, 0, 0.5)",
        "terminal-hover":
          "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(var(--border-color-rgb), 0.1)",
        "terminal-glow": "0 0 20px var(--terminal-glow)",
        crt: "0 4px 16px rgba(0, 0, 0, 0.1)",
        "crt-hover": "0 6px 20px rgba(0, 0, 0, 0.15)",
      },
      backgroundImage: {
        scanline: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%)",
        "scanline-heavy": "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
        "matrix-rain":
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(var(--border-color-rgb), 0.03) 2px, rgba(var(--border-color-rgb), 0.03) 4px)",
        "terminal-gradient":
          "linear-gradient(135deg, transparent 0%, rgba(var(--border-color-rgb), 0.05) 100%)",
      },
      backgroundSize: {
        scanline: "100% 4px",
        "scanline-heavy": "100% 2px",
      },
    },
  },
  plugins: [
    function ({ addUtilities, addComponents }) {
      // Terminal text utilities
      addUtilities({
        ".terminal-text-glow": {
          textShadow: "0 0 5px var(--terminal-glow)",
        },
        ".terminal-text-glow-intense": {
          textShadow: "0 0 10px var(--terminal-glow-intense)",
        },
        // Color-specific glow utilities - subtle text glow
        ".glow-red": {
          textShadow: "0 0 3px var(--glow-red)",
        },
        ".glow-green": {
          textShadow: "0 0 3px var(--glow-green)",
        },
        ".glow-yellow": {
          textShadow: "0 0 3px var(--glow-yellow)",
        },
        ".glow-blue": {
          textShadow: "0 0 3px var(--glow-blue)",
        },
        ".glow-magenta": {
          textShadow: "0 0 3px var(--glow-magenta)",
        },
        ".glow-cyan": {
          textShadow: "0 0 3px var(--glow-cyan)",
        },
        ".glow-white": {
          textShadow: "0 0 3px var(--glow-white)",
        },
        // Bright color glows - subtle
        ".glow-bright-red": {
          textShadow: "0 0 4px var(--glow-bright-red)",
        },
        ".glow-bright-green": {
          textShadow: "0 0 4px var(--glow-bright-green)",
        },
        ".glow-bright-yellow": {
          textShadow: "0 0 4px var(--glow-bright-yellow)",
        },
        ".glow-bright-blue": {
          textShadow: "0 0 4px var(--glow-bright-blue)",
        },
        ".glow-bright-magenta": {
          textShadow: "0 0 4px var(--glow-bright-magenta)",
        },
        ".glow-bright-cyan": {
          textShadow: "0 0 4px var(--glow-bright-cyan)",
        },
        ".glow-bright-white": {
          textShadow: "0 0 4px var(--glow-bright-white)",
        },
        // Intense glow variants - still subtle
        ".glow-red-intense": {
          textShadow: "0 0 5px var(--glow-red), 0 0 10px var(--glow-red)",
        },
        ".glow-green-intense": {
          textShadow: "0 0 5px var(--glow-green), 0 0 10px var(--glow-green)",
        },
        ".glow-yellow-intense": {
          textShadow: "0 0 5px var(--glow-yellow), 0 0 10px var(--glow-yellow)",
        },
        ".glow-blue-intense": {
          textShadow: "0 0 5px var(--glow-blue), 0 0 10px var(--glow-blue)",
        },
        ".glow-magenta-intense": {
          textShadow: "0 0 5px var(--glow-magenta), 0 0 10px var(--glow-magenta)",
        },
        ".glow-cyan-intense": {
          textShadow: "0 0 5px var(--glow-cyan), 0 0 10px var(--glow-cyan)",
        },
        ".glow-bright-red-intense": {
          textShadow: "0 0 6px var(--glow-bright-red), 0 0 12px var(--glow-bright-red)",
        },
        ".glow-bright-green-intense": {
          textShadow: "0 0 6px var(--glow-bright-green), 0 0 12px var(--glow-bright-green)",
        },
        ".glow-bright-yellow-intense": {
          textShadow: "0 0 6px var(--glow-bright-yellow), 0 0 12px var(--glow-bright-yellow)",
        },
        ".glow-bright-cyan-intense": {
          textShadow: "0 0 6px var(--glow-bright-cyan), 0 0 12px var(--glow-bright-cyan)",
        },
        ".terminal-prompt": {
          "&::before": {
            content: '"$ "',
            color: "var(--accent-primary)",
            fontWeight: "bold",
          },
        },
        ".terminal-cursor": {
          "&::after": {
            content: '"_"',
            animation: "blink 1.2s step-end infinite",
            color: "var(--accent-primary)",
            fontWeight: "bold",
          },
        },
      });

      // Terminal components
      addComponents({
        ".terminal-card": {
          backgroundColor: "var(--bg-primary)",
          position: "relative",
          transition: "all 0.3s ease",
          // Border only on tablet/desktop
          "@media (min-width: 640px)": {
            border: "1px solid var(--border-color)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              background:
                "linear-gradient(135deg, transparent 0%, rgba(var(--border-color-rgb), 0.05) 100%)",
              pointerEvents: "none",
            },
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow:
                "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(var(--border-color-rgb), 0.1)",
              borderColor: "var(--accent-primary)",
            },
          },
        },
        ".terminal-button": {
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          border: "2px solid var(--border-color)",
          padding: "0.5rem 1rem",
          fontFamily: "monospace",
          position: "relative",
          transition: "all 0.2s",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          cursor: "pointer",
          "&::before": {
            content: '"[ "',
            color: "var(--accent-primary)",
          },
          "&::after": {
            content: '" ]"',
            color: "var(--accent-primary)",
          },
          "&:hover": {
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
            transform: "translateY(-2px)",
            boxShadow: "0 5px 0 var(--border-color), 0 10px 20px rgba(0, 0, 0, 0.3)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 2px 0 var(--border-color), 0 5px 10px rgba(0, 0, 0, 0.2)",
          },
        },
      });
    },
  ],
};
