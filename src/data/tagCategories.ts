export type TagColorName = "green" | "cyan" | "red" | "magenta" | "yellow" | "blue";

export type TagCSSClass =
  | "tag-green"
  | "tag-cyan"
  | "tag-red"
  | "tag-magenta"
  | "tag-yellow"
  | "tag-blue";

export interface TagCategory {
  color: TagColorName;
  keywords: readonly string[];
  cssClass: TagCSSClass;
}

export const tagCategories: readonly TagCategory[] = [
  {
    color: "green",
    keywords: [
      "c",
      "rust",
      "python",
      "javascript",
      "typescript",
      "c++",
      "java",
      "go",
      "ruby",
      "swift",
    ],
    cssClass: "tag-green",
  },
  {
    color: "cyan",
    keywords: [
      "react",
      "vue",
      "angular",
      "next",
      "astro",
      "svelte",
      "django",
      "flask",
      "express",
      "qt",
    ],
    cssClass: "tag-cyan",
  },
  {
    color: "red",
    keywords: ["kernel", "driver", "embedded", "linux", "aosp", "rom", "bsp", "bootloader"],
    cssClass: "tag-red",
  },
  {
    color: "magenta",
    keywords: ["docker", "kubernetes", "git", "ci/cd", "jenkins", "qemu", "yocto", "buildroot"],
    cssClass: "tag-magenta",
  },
  {
    color: "yellow",
    keywords: ["mongodb", "postgres", "mysql", "redis", "sqlite", "database", "sql"],
    cssClass: "tag-yellow",
  },
  {
    color: "blue",
    keywords: [],
    cssClass: "tag-blue",
  },
] as const;

export function getTagColor(tag: string): TagCSSClass {
  const lowerTag = tag.toLowerCase();

  for (const category of tagCategories) {
    if (category.keywords.some((keyword) => lowerTag.includes(keyword))) {
      return category.cssClass;
    }
  }

  return "tag-blue";
}
