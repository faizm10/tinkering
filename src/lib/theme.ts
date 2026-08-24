export type Theme = "light" | "dark";

export const themeStorageKey = "sonae-theme";

export const themeColors: Record<Theme, string> = {
  light: "#f7f7f4",
  dark: "#171713",
};

export function themeScript() {
  return `
    (function() {
      try {
        var stored = localStorage.getItem("${themeStorageKey}");
        var theme = stored === "dark" || stored === "light" ? stored : "light";
        var root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", ${JSON.stringify(themeColors)}[theme]);
      } catch (_) {}
    })();
  `;
}
