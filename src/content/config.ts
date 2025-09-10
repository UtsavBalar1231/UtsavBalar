import { defineCollection, z } from "astro:content";

const aboutCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updated: z.date().optional(),
  }),
});

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

const resumeCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const tutorialsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default("Utsav Balar"),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "professional"]),
    estimatedTime: z.string().optional(),
    topics: z.array(z.string()),
    series: z.string().default("Linux Kernel Device Driver"),
    part: z.number().int().positive(),
    environment: z.object({
      hardware: z.string(),
      kernel: z.string(),
      os: z.string(),
    }),
    prerequisites: z.array(z.string()).optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  about: aboutCollection,
  projects: projectsCollection,
  quotes: quotesCollection,
  bookBits: bookBitsCollection,
  tutorials: tutorialsCollection,
  resume: resumeCollection,
};
