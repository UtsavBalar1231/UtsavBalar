export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "professional";

export type DifficultyCSSClass =
  | "difficulty-beginner"
  | "difficulty-intermediate"
  | "difficulty-advanced"
  | "difficulty-professional";

export interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  cssClass: DifficultyCSSClass;
}

export const difficultyLevels: readonly DifficultyConfig[] = [
  {
    level: "beginner",
    label: "Beginner",
    cssClass: "difficulty-beginner",
  },
  {
    level: "intermediate",
    label: "Intermediate",
    cssClass: "difficulty-intermediate",
  },
  {
    level: "advanced",
    label: "Advanced",
    cssClass: "difficulty-advanced",
  },
  {
    level: "professional",
    label: "Professional",
    cssClass: "difficulty-professional",
  },
] as const;

export const difficultyColorMap: Record<DifficultyLevel, DifficultyCSSClass> = {
  beginner: "difficulty-beginner",
  intermediate: "difficulty-intermediate",
  advanced: "difficulty-advanced",
  professional: "difficulty-professional",
} as const;

export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  const config = difficultyLevels.find((d) => d.level === level);
  if (!config) {
    throw new Error(`Invalid difficulty level: ${level}`);
  }
  return config;
}

export function getDifficultyCSSClass(level: DifficultyLevel): DifficultyCSSClass {
  return difficultyColorMap[level];
}
