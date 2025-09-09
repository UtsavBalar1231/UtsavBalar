# Project Overview: Personal Portfolio Website

This document outlines the architecture, understanding, vision, and principles of this personal portfolio website project.

## 1. Understanding

This project is a personal portfolio website for Utsav Balar, an Embedded Linux & BSP Engineer. It serves as a digital resume, a place to showcase projects, and a platform for sharing knowledge through tutorials. The website is designed with a unique terminal-like interface, reflecting the owner's technical background and providing a memorable user experience.

The codebase is well-structured, using modern web technologies to create a performant and maintainable website. It is built as a static site, which means it is fast, secure, and easy to deploy.

## 2. Architecture

The website is built using the following technologies:

- **Framework:** [Astro](https://astro.build/) is used as the primary framework. It's a static site generator that allows building fast websites with a component-based architecture.
- **UI Components:** The UI is built using a combination of Astro components and [React](https://react.dev/) components. This allows for both static, content-focused components and interactive, stateful components.
- **Content:** Content is written in [MDX](https://mdxjs.com/), which allows for writing JSX-like syntax within Markdown files. This is ideal for creating rich content with embedded components. Data for the site, such as metadata and profile information, is stored in TypeScript files within the `src/data` directory.
- **Styling:** The project uses a combination of global CSS, SCSS, and [Tailwind CSS](https://tailwindcss.com/). This provides flexibility in styling, from global styles to utility-first classes.
- **Deployment:** The website is built as a static site, with the output generated in the `dist/` directory. This allows for easy deployment on any static hosting service.

## 3. Vision

The vision for this project is to create a personal website that is:

- **A professional showcase:** To effectively present Utsav Balar's skills, experience, and projects to potential employers and collaborators.
- **A platform for knowledge sharing:** To share expertise and insights through tutorials and articles, contributing to the tech community.
- **A reflection of personality:** To create a unique and memorable brand that reflects the owner's passion for technology and a terminal-based aesthetic.
- **A playground for experimentation:** To experiment with new web technologies and techniques, keeping the website modern and up-to-date.

## 4. UI/UX Principles

The user interface and experience are guided by the following principles:

- **Immersive Theming:** The website fully embraces a terminal/hacker aesthetic, providing an immersive experience. This is achieved through carefully selected color schemes, typography (AdwaitaMono), and component designs that mimic a command-line interface.
- **Keyboard-First Navigation:** To enhance the terminal-like feel and improve accessibility for power users, the website prioritizes keyboard shortcuts for navigation (e.g., Alt+1-5 for page navigation).
- **Interactive and Playful Elements:** The site incorporates interactive elements like a theme switcher and a random cat avatar to make the experience more engaging and memorable.
- **Clear Information Hierarchy:** Typography, color, and custom components like `Note` and `Warning` are used to establish a clear visual hierarchy, guiding the user's attention to important information.
- **Responsive and Accessible Design:** The website is designed to be fully responsive, ensuring a seamless experience on all devices. Accessibility is a priority, with features like keyboard navigation and semantic HTML.
- **Content-Focused Layout:** The design prioritizes content, making it easy to read and understand. The use of MDX, along with custom components for code blocks and notes, ensures that technical information is presented clearly and effectively.

## 5. Development Principles

The development of this project is guided by the following principles:

- **Performance First:** The website should be fast and responsive. This is achieved by using a static site generator (Astro) and optimizing assets.
- **Content is King:** The content should be high-quality, informative, and engaging. MDX is used to create rich and interactive content that is easy to write and maintain.
- **Maintainability:** The codebase is kept clean, organized, and well-documented to ensure it is easy to maintain and update in the future. The project structure separates pages, components, layouts, data, and content, which contributes to its maintainability.
