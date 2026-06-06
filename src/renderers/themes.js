export const themes = {
  github_light: {
    background: "#ffffff",
    border: "#d0d7de",
    title: "#0969da",
    text: "#24292f",
    muted: "#57606a",
    accent: "#0969da",
    heatmap: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    chart: ["#0969da", "#8250df", "#bf3989", "#bc4c00", "#1b7c83", "#cf222e"]
  },
  github_dark: {
    background: "#0d1117",
    border: "#30363d",
    title: "#58a6ff",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: "#58a6ff",
    heatmap: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    chart: ["#58a6ff", "#bc8cff", "#f778ba", "#ffa657", "#3fb950", "#ff7b72"]
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
