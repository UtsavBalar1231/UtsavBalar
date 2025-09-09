export interface Theme {
  value: string;
  label: string;
}

export const themes: Theme[] = [
  { value: "green", label: "Green Phosphor" },
  { value: "amber", label: "Amber Phosphor" },
  { value: "monochrome", label: "Monochrome" },
  { value: "doom", label: "DOOM Red" },
];

// Helper functions
export function getTheme(value: string): Theme {
  return themes.find((theme) => theme.value === value) || themes[0];
}

export function getCurrentTheme(): string {
  // This function can only be used client-side due to localStorage
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("theme") || "monochrome";
  }
  return "monochrome";
}

export function applyTheme(theme: string): void {
  // This function can only be used client-side
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }
}
