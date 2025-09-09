# Personal Portfolio Website

A modern, terminal-inspired portfolio website for Utsav Balar, an Embedded Linux & BSP Engineer. Built with Astro for optimal performance and featuring a distinctive hacker aesthetic theme with keyboard navigation and interactive elements.

**Live Site:** [https://utsavbalar.in](https://utsavbalar.in)

## Features

- **Terminal/Hacker Aesthetic:** Immersive dark theme with AdwaitaMono font and command-line inspired UI
- **Keyboard Navigation:** Alt+1-5 shortcuts for quick page navigation
- **Theme Switching:** Multiple theme options with persistent user preference
- **Interactive Elements:** Dynamic cat avatar, terminal components, and engaging animations
- **MDX Content:** Rich content authoring with custom components (Terminal, Note, Warning)
- **Content Collections:** Organized tutorials, projects, quotes, book bits, and resume sections
- **Performance Optimized:** Static site generation with compression and SEO optimization

## Technology Stack

- **Framework:** [Astro](https://astro.build/) ^5.13.6 (Static Site Generator)
- **UI Components:** [React](https://react.dev/) ^19.1.1 + Astro Components
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) ^3.0 + SCSS + CSS Variables
- **Content:** [MDX](https://mdxjs.com/) ^3.1.1 with Shiki syntax highlighting
- **Package Manager:** [Bun](https://bun.sh/) 1.2.20
- **Build Tools:** TypeScript, ESLint, Prettier
- **Deployment:** Static hosting (generates to `dist/`)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd website

# Install dependencies
bun install

# Start development server
bun run dev
```

The site will be available at `http://localhost:4321`

## Available Scripts

### Development

```bash
bun run dev        # Start development server with hot reload
bun run build      # Build for production
bun run preview    # Preview production build locally
```

### Code Quality

```bash
bun run lint       # Check for linting issues
bun run lint:fix   # Auto-fix linting issues
bun run format     # Format all code files
bun run format:check # Check formatting without changes
bun run typecheck  # Check TypeScript types and Astro components
bun run check      # Run all checks (typecheck + lint + format:check)
```

### Astro CLI

```bash
bun run astro      # Access Astro CLI commands
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── mdx/            # Custom MDX components (Terminal, Note, Warning)
│   ├── Content*.astro  # Page-specific content components
│   └── Theme*.astro    # Theme management components
├── content/            # Content collections (MDX files)
│   ├── tutorials/      # Technical tutorials
│   ├── projects/       # Portfolio projects
│   ├── quotes/         # Favorite quotes
│   ├── bookBits/       # Book excerpts and notes
│   ├── about/          # About page content
│   └── resume/         # Resume content
├── data/               # Site configuration and metadata
│   ├── siteMetadata.ts # Site-wide metadata
│   ├── profile.ts      # Personal profile information
│   ├── themes.ts       # Theme configurations
│   └── socials.ts      # Social media links
├── layouts/            # Page layout components
├── pages/              # Route-based pages
└── styles/             # Global styles and CSS variables
```

## Content Management

### Content Collections

The site uses Astro's content collections for organized content management:

- **Tutorials:** Technical articles with difficulty levels, prerequisites, and topics
- **Projects:** Portfolio showcase with tags and links
- **Quotes:** Curated collection of favorite quotes
- **Book Bits:** Excerpts and notes from books
- **About:** Personal information and background
- **Resume:** Professional experience and skills

### Adding Content

1. **Tutorials:** Create MDX files in `src/content/tutorials/` with comprehensive frontmatter
2. **Projects:** Add MDX files to `src/content/projects/` with metadata and descriptions
3. **Other Content:** Use respective directories in `src/content/`

### Custom MDX Components

- `<Terminal>` - Terminal-style code blocks
- `<Note>` - Informational notes
- `<Warning>` - Warning callouts

## Theming System

The site features a comprehensive theming system:

- **CSS Variables:** All colors use CSS custom properties for easy theme switching
- **Theme Configurations:** Defined in `src/data/themes.ts`
- **Persistent Preferences:** User theme choice is saved and restored
- **Multiple Themes:** Various color schemes maintaining the terminal aesthetic

## Keyboard Navigation

- `Alt + 1` - Home
- `Alt + 2` - About
- `Alt + 3` - Projects
- `Alt + 4` - Skills
- `Alt + 5` - Resume

## Performance Features

- **Static Generation:** Pre-built HTML for optimal loading speed
- **Asset Optimization:** Automated compression with `astro-compress`
- **SEO Ready:** Automatic sitemap generation
- **Syntax Highlighting:** Shiki integration for code blocks
- **Responsive Design:** Mobile-first approach with smooth transitions

## Deployment

The site builds to static files in the `dist/` directory and can be deployed to any static hosting service:

```bash
bun run build
# Upload dist/ directory to your hosting provider
```

**Production URL:** [https://utsavbalar.in](https://utsavbalar.in)

## Development Guidelines

### Styling

- Use CSS variables for colors (defined in `src/styles/`)
- Maintain terminal/hacker aesthetic consistency
- Prefer Tailwind utilities mapped to CSS variables

### Components

- Follow existing component patterns
- Ensure theme compatibility
- Support keyboard navigation where applicable

### Content

- Write comprehensive frontmatter for content collections
- Use custom MDX components for enhanced presentation
- Test content rendering across different themes

## License

This project is personal portfolio code. Please respect the content and personal information contained within.
