export interface Theme {
  value: string;
  label: string;
}

export const themes: Theme[] = [
  { value: "default", label: "Default (Dark)" },
  { value: "gruvbox-dark-hard", label: "Gruvbox Dark Hard" },
  { value: "gruvbox-light-hard", label: "Gruvbox Light Hard" },
  { value: "ayu-dark", label: "Ayu Dark" },
  { value: "catppuccin", label: "Catppuccin (Mocha)" },
  { value: "catppuccin-frappe", label: "Catppuccin Frappé" },
  { value: "catppuccin-latte", label: "Catppuccin Latte" },
  { value: "catppuccin-macchiato", label: "Catppuccin Macchiato" },
  { value: "dracula", label: "Dracula" },
  { value: "everforest-dark", label: "Everforest Dark" },
  { value: "everforest-light", label: "Everforest Light" },
  { value: "kanagawa-dragon", label: "Kanagawa Dragon" },
  { value: "material-theme-darker", label: "Material Theme Darker" },
  { value: "nord", label: "Nord" },
  { value: "one-dark-pro", label: "OneDark Pro" },
  { value: "rose-pine", label: "Rosé Pine" },
  { value: "tokyo-night", label: "Tokyo Night" },
];

// Helper functions
export function getTheme(value: string): Theme {
  return themes.find(theme => theme.value === value) || themes[0];
}

export function getCurrentTheme(): string {
  // This function can only be used client-side due to localStorage
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('theme') || 'default';
  }
  return 'default';
}

export function applyTheme(theme: string): void {
  // This function can only be used client-side
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
} 