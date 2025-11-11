# Personal Portfolio Website

Terminal-inspired portfolio website for Utsav Balar, Embedded Linux & BSP Engineer. Built with Astro featuring a cyberpunk terminal aesthetic with WebGL/Canvas visual effects.

**Live:** [https://utsavbalar.in](https://utsavbalar.in)

---

## Tech Stack

- **Framework:** Astro 5.15+ (Static Site Generator)
- **Content:** MDX with Shiki syntax highlighting (one-dark-pro theme)
- **Styling:** Tailwind CSS 4.1+ + CSS Variables for theming
- **Package Manager:** Bun
- **Font:** DepartureMono Nerd Font Mono
- **Visual Effects:** WebGL + Canvas 2D for theme-specific effects
- **TypeScript:** 5.9.3 with strict mode

---

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

---

## Development Commands

### Code Quality

```bash
bun run check          # Run all checks (typecheck + lint + format:check)
bun run lint           # Check for ESLint issues
bun run lint:fix       # Auto-fix linting issues
bun run format         # Format code with Prettier
bun run typecheck      # TypeScript type checking
```

**Run `bun run check` before committing.**

---

## Project Structure

```
/
├── public/                    # Static assets
│   ├── fonts/                 # DepartureMono Nerd Font Mono
│   ├── img/                   # Images, logos, avatars
│   ├── noise-textures/        # 4 noise textures for CRT effect
│   ├── media/                 # Cat assets, audio
│   └── downloads/             # Resume files
│
├── src/
│   ├── components/            # 25 Astro components
│   │   └── mdx/               # Terminal, Note, Warning
│   ├── content/               # Content collections (MDX)
│   │   ├── about/             # 2 MDX files
│   │   ├── projects/          # 1 MDX file
│   │   ├── tutorials/         # 5 MDX files
│   │   ├── quotes/            # 1 MDX file (parsed)
│   │   ├── bookBits/          # 1 MDX file (parsed)
│   │   └── resume/            # 1 MDX file
│   ├── data/                  # 7 TS configuration files
│   ├── layouts/               # Layout.astro
│   ├── pages/                 # 9 route pages
│   ├── utils/                 # 11 TS utilities (effects, theme)
│   └── styles/                # 11 modular CSS files
│
├── astro.config.mjs           # Astro configuration
├── tsconfig.json              # TypeScript config (strict mode)
├── package.json               # Dependencies and scripts
├── CLAUDE.md                  # AI assistant reference
└── README.md                  # This file
```

---

## Key Features

### Four Themes with Visual Effects

- **Green Phosphor** + Matrix Rain effect
- **Amber Phosphor** + Lightning Storm effect
- **Monochrome** (default) + Sakura Fall effect
- **DOOM Red** + WebGL Fire effect

### Terminal Aesthetic

- DepartureMono Nerd Font Mono throughout
- Glass morphism with backdrop filters
- CRT effects (noise, grunge, scanlines)
- Theme-aware colors via CSS variables

### Keyboard Navigation

- **Alt+1-7**: Navigate pages (Home, About, Projects, Quotes, BookBits, Resume, Tutorials)
- **Alt+T**: Cycle themes
- **Alt+P**: Toggle performance mode

### Performance & Accessibility

- **Performance mode**: Disables all animations/effects (Alt+P)
- **Reduced motion**: Automatic `prefers-reduced-motion` support
- **Screen reader support**: Semantic HTML, ARIA labels
- **Static generation**: No runtime JS for content

---

## Architecture

### Content Collections (Type-Safe, Zod Validated)

- **about**: Personal information
- **projects**: Portfolio projects with metadata
- **tutorials**: Technical tutorials with extensive frontmatter (difficulty, topics, environment, prerequisites)
- **quotes**: Favorite quotes (parsed from single MDX)
- **bookBits**: Book excerpts (parsed from single MDX)
- **resume**: Resume content

### Component Categories

- **Core UI (9)**: Nav, MobileNav, Footer, StatusLine, ThemeSelector, Profile, Socials, etc.
- **Cards (6)**: BaseCard, ProjectCard, TutorialCard, QuoteCard, BookBitCard, SkillsGrid
- **Visual Effects (4)**: DoomFire, MatrixRain, LightningStorm, SakuraFall
- **MDX (3)**: Terminal, Note, Warning

### Styling System

- **Modular CSS**: 11 files organized by layer (theme, z-index, effects, animations, etc.)
- **CSS Variables**: All colors, no hardcoded values
- **Tailwind 4**: Without base styles, custom configuration
- **Z-index hierarchy**: Managed via CSS variables (--z-background through --z-max)

### Visual Effects

- **Base classes**: `VisualEffect` (Canvas 2D), `WebGLEffect` (WebGL)
- **Theme-conditional**: Effects only render for their target theme
- **MutationObserver**: Auto-enable/disable on theme/performance changes
- **FPS limiting**: 24-30fps for optimal performance

---

## Development Workflows

### Adding Content

**New Tutorial:**

```bash
touch src/content/tutorials/tutorial-06-my-tutorial.mdx
```

Add frontmatter with all required fields (title, description, date, difficulty, topics, series, part, environment, etc.). See `src/content/config.ts` for complete schema.

**New Quote/BookBit:**
Edit `src/content/quotes/quotes.mdx` or `src/content/bookBits/bitsfrombooks.mdx` following the existing pattern.

### Creating Components

Always:

- Use CSS variables for colors (never hardcode)
- Support all 4 themes
- Add performance mode checks (`data-performance`)
- Support reduced-motion (`@media (prefers-reduced-motion: reduce)`)
- Use TypeScript for props
- Use path aliases (`@components/*`, `@utils/*`, etc.)

### Path Aliases

```typescript
import { profile } from "@data/profile";
import Nav from "@components/Nav.astro";
import Layout from "@layouts/Layout.astro";
import { formatDate } from "@utils/formatDate";
```

---

## Configuration

### TypeScript (Strict Mode)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "moduleResolution": "bundler"
  }
}
```

### Astro

```javascript
{
  output: 'static',
  trailingSlash: 'always',
  site: 'https://utsavbalar.in',
  prefetch: { prefetchAll: false }
}
```

---

## Build & Deployment

```bash
bun run build        # Output: dist/ (static files)
```

Deploy `dist/` to any static hosting:

- Vercel (recommended)
- Netlify
- Cloudflare Pages
- GitHub Pages

**Build optimizations:**

- Static HTML generation
- CSS/JS minification (astro-compress)
- Font preloading
- Sitemap generation

---

## Contributing

### Code Quality Standards

```bash
bun run check        # MUST pass before committing
```

### Testing Checklist

- [ ] All 4 themes tested
- [ ] Performance mode tested
- [ ] Reduced-motion tested
- [ ] Keyboard navigation (Alt+1-7) works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Visual effects perform well (30fps+)

### Style Conventions

- **Components**: PascalCase (`ComponentName.astro`)
- **Utilities**: camelCase (`utilityName.ts`)
- **CSS**: Use variables, layer-based organization
- **Git**: Conventional commit format

---

## Troubleshooting

**Build fails:**

```bash
bun run typecheck    # See detailed errors
```

**Styles not applying:**

- Check CSS variable usage
- Verify theme is set correctly
- Ensure Tailwind classes are valid for v4

**Effects not appearing:**

- Check theme-conditional rendering
- Verify performance mode is disabled
- Check browser console for errors

**Hot reload not working:**

```bash
rm -rf .astro node_modules/.astro
bun run dev
```

---

## Browser Support

**Tested:**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Requirements:**

- CSS Variables, Grid, Flexbox
- WebGL 1.0 (for WebGL effects)
- Canvas 2D API
- ES2020
- LocalStorage

---

## License

Personal portfolio code. Code structure and patterns available for reference and learning, but direct copying of personal content, design, or branding is not permitted.

---

## Contact

**Utsav Balar** - Embedded Linux & BSP Engineer

**Portfolio:** https://utsavbalar.in
