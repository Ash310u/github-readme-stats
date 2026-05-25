export const themes = {
  github_light: {
    background: "#ffffff",
    border: "#d0d7de",
    title: "#0969da",
    text: "#24292f",
    muted: "#57606a",
    accent: "#0969da"
  },
  github_dark: {
    background: "#0d1117",
    border: "#30363d",
    title: "#58a6ff",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: "#58a6ff"
  }
};

const themeAliases = {
  light: "github_light",
  dark: "github_dark"
};

export function getTheme(themeName, fallback = "github_light") {
  const resolvedThemeName = themeAliases[themeName] || themeName;
  return themes[resolvedThemeName] || themes[fallback];
}
