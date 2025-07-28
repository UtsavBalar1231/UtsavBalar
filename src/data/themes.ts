export interface Theme {
  value: string;
  label: string;
  dotColor: string;
}

export const themes: Theme[] = [
  { value: "default", label: "Default (Dark)", dotColor: "var(--theme-dot-default, #3b82f6)" },
  { value: "vscode-dark", label: "VS Code Dark+", dotColor: "var(--theme-dot-vscode-dark, #007acc)" },
  { value: "gruvbox-dark-hard", label: "Gruvbox Dark Hard", dotColor: "var(--theme-dot-gruvbox-dark-hard, #b8bb26)" },
  { value: "gruvbox-light-hard", label: "Gruvbox Light Hard", dotColor: "var(--theme-dot-gruvbox-light-hard, #b57614)" },
  { value: "ayu-dark", label: "Ayu Dark", dotColor: "var(--theme-dot-ayu-dark, #ffb454)" },
  { value: "catppuccin", label: "Catppuccin (Mocha)", dotColor: "var(--theme-dot-catppuccin, #f5c2e7)" },
  { value: "catppuccin-frappe", label: "Catppuccin Frappé", dotColor: "var(--theme-dot-catppuccin-frappe, #c6d0f5)" },
  { value: "catppuccin-latte", label: "Catppuccin Latte", dotColor: "var(--theme-dot-catppuccin-latte, #4c4f69)" },
  { value: "catppuccin-macchiato", label: "Catppuccin Macchiato", dotColor: "var(--theme-dot-catppuccin-macchiato, #c6a0f6)" },
  { value: "dracula", label: "Dracula", dotColor: "var(--theme-dot-dracula, #ff79c6)" },
  { value: "everforest-dark", label: "Everforest Dark", dotColor: "var(--theme-dot-everforest-dark, #a7c080)" },
  { value: "everforest-light", label: "Everforest Light", dotColor: "var(--theme-dot-everforest-light, #8da101)" },
  { value: "kanagawa-dragon", label: "Kanagawa Dragon", dotColor: "var(--theme-dot-kanagawa-dragon, #c0a36e)" },
  { value: "material-theme-darker", label: "Material Theme Darker", dotColor: "var(--theme-dot-material-theme-darker, #ffcb6b)" },
  { value: "nord", label: "Nord", dotColor: "var(--theme-dot-nord, #88c0d0)" },
  { value: "one-dark-pro", label: "OneDark Pro", dotColor: "var(--theme-dot-one-dark-pro, #61afef)" },
  { value: "rose-pine", label: "Rosé Pine", dotColor: "var(--theme-dot-rose-pine, #ebbcba)" },
  { value: "tokyo-night", label: "Tokyo Night", dotColor: "var(--theme-dot-tokyo-night, #7aa2f7)" },
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