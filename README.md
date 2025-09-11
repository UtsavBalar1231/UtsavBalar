# Personal Portfolio Website

Terminal-inspired portfolio website for Utsav Balar, Embedded Linux & BSP Engineer. Built with Astro for optimal performance.

**Live:** [https://utsavbalar.in](https://utsavbalar.in)

## Tech Stack

- **Framework:** Astro 5.13 (Static Site Generator)
- **UI:** React 19 + Astro Components
- **Styling:** Tailwind CSS + SCSS + CSS Variables
- **Content:** MDX with Shiki syntax highlighting
- **Package Manager:** Bun

## Quick Start

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Scripts

```bash
# Code quality
bun run lint         # Check linting
bun run lint:fix     # Auto-fix issues
bun run format       # Format code
bun run typecheck    # Check types
bun run check        # Run all checks

# Astro CLI
bun run astro
```

## Project Structure

```
src/
├── components/      # UI components & MDX components
├── content/         # MDX content collections
├── data/           # Site config & metadata
├── layouts/        # Page layouts
├── pages/          # Route pages
└── styles/         # Global styles
```

## Features

- Terminal/hacker aesthetic with AdwaitaMono font
- Keyboard navigation (Alt+1-5)
- Multiple theme options
- MDX content with custom components
- Static site generation with SEO optimization

## Deployment

Builds to `dist/` directory as static files. Deploy to any static hosting service.

## License

Personal portfolio code. Please respect the content and personal information.
