# Utsav Balar - Embedded Linux & BSP Engineer Portfolio

A modern, customized portfolio built with [Astro](https://astro.build/) v5.4+ and [TailwindCSS](https://tailwindcss.com/) v3.4+. This site uses zero JavaScript in the final build, providing excellent performance and speed.

## Live Demo
Visit the live site: [utsavbalar.in](https://utsavbalar.in)

## Features
- **No JavaScript** – optimized for performance and speed
- **Fully responsive** – mobile-friendly and adaptable across all devices
- **Theme Selector** – multiple themes including Gruvbox, Catppuccin, Nord, and more
- **Custom Font** – uses AdwaitaMono NerdFont for a clean terminal aesthetic
- **Theme-Aware UI** – avatar and icons adapt colors to match the selected theme
- **Live Data** – automatically fetches latest Linux kernel version from kernel.org
- **GitHub Integration** – pulls profile picture and info from GitHub
- **SEO & Social Media Ready** – includes OpenGraph and Twitter metadata
- **MDX Content** – clean formatting using MDX and content collections
- **Inline MDX Rendering** – render markdown content directly in components
- **Code Editor-Inspired Design** – developer-friendly aesthetics
- **Tab-Based Navigation** – code editor style tab switching for content
- **Mobile Optimized** – bottom tab bar on mobile for easy navigation
- **Syntax Highlighting** – using Prism.js for code snippets with theme-aware styling
- **React Integration** – with Astro React integration for interactive components
- **Analytics** – Vercel Analytics integration for visitor tracking
- **Vim-Style Keybindings** – keyboard navigation with Vim-inspired shortcuts

## Tech Stack
- [Astro](https://astro.build/) v5.4+
- [TailwindCSS](https://tailwindcss.com/) v3.4+
- [MDX](https://mdxjs.com/) v3.1+
- [React](https://react.dev/) v19+
- [Prism.js](https://prismjs.com/) v1.29+

## Content Types
- **Projects** – Showcase of development projects
- **Tutorials** – In-depth Linux kernel device driver tutorials
- **Resume** – Professional experience and skills
- **Quotes** – Collection of favorite quotes
- **Book Bits** – Insights and snippets from books
- **About** – Personal introduction and background

## Getting Started

```sh
# 1. Clone the repository
git clone https://github.com/UtsavBalar1231/portfolio .

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev

# 4. Build for production
npm run build

# Deploy the contents of the `./dist` folder
```

## Customization
### Site & Domain Configuration
- Modify `astro.config.mjs` to update your `site` settings
- Update metadata in `src/data/siteMetadata.ts` for SEO and social media tags

### Theme Customization
- Use the built-in theme selector to choose from multiple themes
- Themes include: Default, Gruvbox (Dark/Light), Ayu Dark, Catppuccin (Mocha/Frappé/Latte/Macchiato), Dracula, Everforest (Dark/Light), Kanagawa Dragon, Material Theme Darker, Nord, One Dark Pro, Rose Pine, and Tokyo Night
- Add custom themes in `src/styles/theme.scss`
- Avatar and UI elements automatically adapt to theme colors

### Font Customization
- The site uses AdwaitaMono NerdFont by default
- Font files are stored in `public/fonts/AdwaitaMono/`
- Font declarations are in `src/styles/global.scss`

### Content Management
- Create markdown content in `src/content/` directories
- Use the content collections API for structured content
- Render markdown inline with the provided components:
  - `MDXRenderer` - For inline markdown strings
  - `MDXContent` - For content from collections
  - `MDXFile` - For importing MDX files directly

### Updating Content
Edit these files to customize your content:
- `src/components/Profile.astro` – Personal profile information
- `src/content/about/intro.mdx` – About section content (MDX format)
- `src/content/projects/` – Projects/portfolio section
- `src/content/tutorials/` – Linux kernel device driver tutorials
- `src/content/quotes/` – Favorite quotes collection
- `src/content/bookBits/` – Book insights and excerpts
- `src/content/resume/` – Professional experience and skills
- `src/components/Socials.astro` – Update your social media links

## Features Added

### Advanced Theme System
- 15+ prebuilt themes including various color schemes
- Theme persistence using localStorage
- Theme-aware SVG icons and UI elements
- Dynamic avatar that changes color with theme
- Theme dots for visual selection

### Modern UI Components
- Tab-based navigation inspired by code editors
- Mobile-optimized bottom navigation bar
- Responsive design with adaptive layouts
- Smooth transitions and animations
- Hidden scrollbars for cleaner UI

### Performance Optimizations
- Preloaded font files for optimal performance
- Static site generation for fast page loads
- Minimal/zero client-side JavaScript
- Image optimization and lazy loading
- Integrated compression for assets

### MDX Content System
- Content collections for structured data
- Inline MDX rendering capabilities
- Markdown processing with syntax highlighting
- Theme-aware content styling
- Code blocks with syntax highlighting

### Tutorial System
- Complete Linux kernel device driver tutorial series
- Difficulty-based filtering (beginner to professional)
- Topic-based filtering and organization
- Specialized components for driver code and terminal examples
- Note and warning callouts for important information
- Structured environment details for reproducibility
- Cross-referencing and related tutorial suggestions

### Dynamic Content
- Automatic fetching of latest Linux kernel version
- GitHub profile integration (avatar and information)
- Fallback to random cat images when GitHub API fails
- Theme-colored avatar when all fetches fail

### SEO & Analytics
- Comprehensive SEO metadata
- OpenGraph and Twitter card support
- Sitemap generation
- Dublin Core metadata
- Vercel Analytics integration

### Accessibility & UX
- Keyboard navigation with Vim-style keybindings
- Screen reader friendly content structure
- Mobile-first responsive design
- Smooth scrolling behavior

## Credits
- Originally based on [astro-developer-portfolio-template](https://github.com/devidevio/astro-developer-portfolio)
- Refactored and enhanced by [Utsav Balar](https://github.com/UtsavBalar1231)
