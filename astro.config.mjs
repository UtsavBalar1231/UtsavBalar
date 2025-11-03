import { defineConfig } from "astro/config";
import compress from "astro-compress";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  site: "https://utsavbalar.in",

  // Enable prefetching for faster navigation
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

  integrations: [
    sitemap(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "one-dark-pro",
        wrap: true,
      },
    }),
    compress(),
  ],

  // Vite configuration for build-time replacements and Tailwind v4
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Version based on build timestamp for cache busting
      __BUILD_VERSION__: JSON.stringify(Date.now().toString()),
    },
  },
});
