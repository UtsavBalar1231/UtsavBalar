export interface Theme {
  value: string;
  label: string;
  shortLabel?: string;
}

export const themes: Theme[] = [
  { value: "green-phosphor", label: "Green Phosphor", shortLabel: "GREEN-PHOSPHOR" },
  { value: "amber-phosphor", label: "Amber Phosphor", shortLabel: "AMBER-PHOSPHOR" },
  { value: "monochrome", label: "Monochrome", shortLabel: "MONO" },
  { value: "doom-red", label: "DOOM Red", shortLabel: "DOOM-RED" },
] as const;

export type ThemeValue = (typeof themes)[number]["value"];
