export {}; // Make this a module

declare global {
  interface Window {
    refreshCatImage: () => void;
  }
}
