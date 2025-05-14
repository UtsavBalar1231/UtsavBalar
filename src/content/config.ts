import { defineCollection, z } from "astro:content";

// Define schema for about collection
const aboutCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updated: z.date().optional(),
  }),
});

// Define schema for projects collection
const projectsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    link: z.string().url().optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.date().optional(),
  }),
});

// Define schema for quotes collection
const quotesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Define schema for book bits collection
const bookBitsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Export collections
export const collections = {
  about: aboutCollection,
  projects: projectsCollection,
  quotes: quotesCollection,
  bookBits: bookBitsCollection,
};
