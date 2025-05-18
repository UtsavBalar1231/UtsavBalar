import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  site: "https://utsavbalar.in",

  // Single page, no prefetch needed
  prefetch: false,

  integrations: [
    tailwind(),
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
