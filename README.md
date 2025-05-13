# Utsav Balar - Embedded Linux & BSP Engineer Portfolio

A modern, customized portfolio built with [Astro](https://astro.build/) and [TailwindCSS](https://tailwindcss.com/). This site uses zero JavaScript in the final build, providing excellent performance and speed.

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

## Tech Stack
- [Astro](https://astro.build/)
- [TailwindCSS](https://tailwindcss.com/)
- [MDX](https://mdxjs.com/)

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
- Update metadata in `src/layouts/Layout.astro`

### Theme Customization
- Use the built-in theme selector to choose from multiple themes
- Add custom themes in `src/styles/global.scss`
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
- `src/components/Socials.astro` – Update your social media links

## Features Added

### Theme System
- Multiple prebuilt themes with automatic switching
- Theme persistence using localStorage
- Theme-aware SVG icons and UI elements
- Dynamic avatar that changes color with theme

### Custom Font
- AdwaitaMono NerdFont for clean monospace typography
- Preloaded font files for optimal performance
- Fallback fonts configured for compatibility

### MDX Content System
- Content collections for structured data
- Inline MDX rendering capabilities
- Markdown processing with syntax highlighting
- Theme-aware content styling

### Dynamic Content
- Automatic fetching of latest Linux kernel version
- GitHub profile integration (avatar and information)
- Fallback to random cat images when GitHub API fails
- Theme-colored avatar when all fetches fail

### Responsive Design
- Works on all devices from mobile to desktop
- Hidden scrollbars for cleaner UI
- Smooth transitions between themes

## Credits
- Originally based on [astro-developer-portfolio-template](https://github.com/devidevio/astro-developer-portfolio)
- Refactored and enhanced by [Utsav Balar](https://github.com/UtsavBalar1231)
