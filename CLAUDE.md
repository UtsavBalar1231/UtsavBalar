# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (outputs to `./dist`)
- `npm run preview` - Preview production build locally

### Code Quality
- `npx tsc --noEmit` - Check TypeScript errors
- `npx prettier --write .` - Format code

## Project Overview

This is Utsav Balar's personal portfolio website built with Astro v5.4+. It's a single-page application with a tab-based interface showcasing personal information, projects, resume, and some Linux kernel tutorials.

## Architecture

**Tech Stack:**
- Astro v5.4+ (static site generation)
- TailwindCSS v3.4+ (styling with custom color system)
- MDX v3.1+ (content with embedded components)
- TypeScript (type safety)

**Key Design Features:**
- Zero JavaScript in production for fast loading
- 17 developer-focused themes (Gruvbox, Catppuccin, Nord, etc.)
- AdwaitaMono NerdFont for terminal aesthetic
- Vim keybindings for navigation (j/k, gg/G, gt/gT)
- Responsive design with mobile bottom navigation

**Content Structure:**
```
src/content/
├── about/       # Personal intro
├── projects/    # Portfolio projects  
├── resume/      # CV content
├── tutorials/   # Linux kernel tutorials
├── quotes/      # Favorite quotes
└── bookBits/    # Book excerpts
```

## File Organization

**Core Files:**
- `src/pages/index.astro` - Main page with tab system
- `src/layouts/Layout.astro` - Base layout with meta tags and fonts
- `src/content/config.ts` - Content collection schemas

**Styling:**
- `src/styles/global.scss` - Base styles and font loading
- `src/styles/theme.scss` - Theme definitions as CSS custom properties
- `tailwind.config.js` - Custom color mappings to CSS variables

**Data:**
- `src/data/siteMetadata.ts` - SEO and site information
- `src/data/themes.ts` - Theme definitions and helpers
- `src/data/profile.ts` - Personal information
- `src/data/socials.ts` - Social media links

## Content Management

**Adding Content:**
- Tutorials: Add MDX files to `src/content/tutorials/` with proper frontmatter
- Projects: Add to `src/content/projects/` with optional GitHub links
- Update personal info in `src/data/profile.ts`
- Social links in `src/data/socials.ts`

**Tutorial Frontmatter:**
```yaml
title: "Tutorial Title"
description: "Brief description"
date: 2025-01-01
difficulty: "beginner" | "intermediate" | "advanced" | "professional"
topics: ["kernel", "drivers", "c-programming"]
environment:
  hardware: "Raspberry Pi 5"
  kernel: "6.12"
  os: "Raspberry Pi OS"
prerequisites: ["Basic C knowledge"]
github: "https://github.com/..."
```

**Special MDX Components:**
- `<Terminal>` - Command-line examples with terminal styling
- `<Note>` - Information callouts
- `<Warning>` - Important warnings
- `<CodeBlock>` - Syntax-highlighted code
- `<DriverCodeBlock>` - Specialized for kernel code

## Theme System

**How Themes Work:**
- Themes stored in `src/data/themes.ts`
- CSS custom properties in `src/styles/theme.scss`
- Theme applied via `data-theme` attribute on `<html>`
- Persisted in localStorage

**Adding New Themes:**
1. Add theme definition to `themes.ts`
2. Add CSS custom properties to `theme.scss`
3. Test across all components

## Mobile vs Desktop

**Desktop:**
- Side-by-side layout (profile left, content right)
- Horizontal tab navigation
- Vim keybindings active

**Mobile:**
- Stacked layout with bottom navigation
- Home screen shows profile
- Content tabs accessible via bottom bar

## Development Notes

**Performance:**
- No JavaScript in production build
- Fonts preloaded for optimal loading
- Static site generation for fast delivery

**Accessibility:**
- Keyboard navigation with Vim bindings
- Semantic HTML structure
- Screen reader friendly

**Integration:**
- GitHub API for profile avatar (with fallbacks)
- Live kernel version from kernel.org
- Vercel Analytics for basic metrics