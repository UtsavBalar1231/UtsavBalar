import { defineConfig } from "astro/config";
import compress from "astro-compress";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  site: "https://utsavbalar.in",

  // Single page, no prefetch needed
  prefetch: false,

  integrations: [
    tailwind({
      applyBaseStyles: false, // Prevent Tailwind from applying its reset to avoid conflicts
    }),
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
});
