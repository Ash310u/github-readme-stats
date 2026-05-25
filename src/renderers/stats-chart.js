import { BaseSvgRenderer } from "./base-svg-renderer.js";

class StatsChartRenderer extends BaseSvgRenderer {
  constructor(options) {
    super({ width: 640, height: 270, fallbackTheme: "github_light", ...options });
  }

  render(stats) {
    const displayName = stats.name || stats.username;

    return this.svg({
      title: `${displayName} contribution chart`,
      description: `Contribution streak chart for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.metricWithCaption({
      label: "Total Contributions",
      value: stats.totalContributions,
      caption: stats.rangeLabel,
      x: 28,
      y: 128,
      accent: true
    })}
    ${this.metricWithCaption({
      label: "Current Streak",
      value: stats.currentStreak,
      caption: stats.currentStreakLabel,
      x: 228,
      y: 128
    })}
    ${this.metricWithCaption({
      label: "Longest Streak",
      value: stats.longestStreak,
      caption: stats.longestStreakRange,
      x: 428,
      y: 128
    })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderStatsChartSvg(stats, themeName) {
  return new StatsChartRenderer({ themeName }).render(stats);
}
