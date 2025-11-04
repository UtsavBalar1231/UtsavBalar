import { defineCollection, z } from "astro:content";

const aboutCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters")
      .optional(),
    updated: z.date().optional(),
  }),
});

const projectsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters")
      .optional(),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, "At least one tag required")
      .max(10, "Maximum 10 tags allowed")
      .optional(),
    image: z.string().min(1).max(500).optional(),
    link: z.string().url().optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    date: z.date().optional(),
  }),
});

const quotesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters")
      .optional(),
    date: z.date().optional(),
    author: z.string().min(1).max(100).optional(),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, "At least one tag required")
      .max(10, "Maximum 10 tags allowed")
      .optional(),
  }),
});

const bookBitsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters")
      .optional(),
    date: z.date().optional(),
    author: z.string().min(1).max(100).optional(),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, "At least one tag required")
      .max(10, "Maximum 10 tags allowed")
      .optional(),
  }),
});

const resumeCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters")
      .optional(),
    date: z.date().optional(),
    author: z.string().min(1).max(100).optional(),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, "At least one tag required")
      .max(10, "Maximum 10 tags allowed")
      .optional(),
  }),
});

const tutorialsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description must be under 500 characters"),
    date: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().min(1).max(100).default("Utsav Balar"),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "professional"], {
      errorMap: () => ({
        message: "Difficulty must be: beginner, intermediate, advanced, or professional",
      }),
    }),
    estimatedTime: z.string().min(1).max(20).optional(),
    topics: z
      .array(z.string().min(1).max(30))
      .min(1, "At least one topic required")
      .max(8, "Maximum 8 topics allowed"),
    series: z
      .enum(["Linux Kernel Device Driver", "Embedded Systems", "BSP Development"], {
        errorMap: () => ({ message: "Invalid series value" }),
      })
      .default("Linux Kernel Device Driver"),
    part: z.number().int().positive(),
    environment: z.object({
      hardware: z.string().min(1).max(100),
      kernel: z
        .string()
        .regex(/^\d+\.\d+(\.\d+)?$/, "Kernel version must be in format X.Y or X.Y.Z"),
      os: z.string().min(1).max(100),
    }),
    prerequisites: z
      .array(z.string().min(1).max(100))
      .max(10, "Maximum 10 prerequisites allowed")
      .optional(),
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
