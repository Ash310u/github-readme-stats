import { BaseSvgRenderer } from "./base-svg-renderer.js";
import { formatNumber } from "../utils/format.js";

class HeatmapCardRenderer extends BaseSvgRenderer {
  constructor(options) {
    super({ width: 720, height: 195, fallbackTheme: "github_light", ...options });
  }

  render(stats) {
    const displayName = stats.name || stats.username;
    const cellSize = 9;
    const gap = 2;
    const heatmapWidth = stats.weeks.length * (cellSize + gap) - gap;
    const heatmapX = this.width - this.padding - heatmapWidth;

    return this.svg({
      title: `${displayName} contribution heatmap`,
      description: `Contribution heatmap for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    <text x="${this.padding}" y="124" fill="${this.theme.accent}" font-size="28" font-weight="700">${formatNumber(stats.totalContributions)}</text>
    <text x="${this.padding}" y="148" fill="${this.theme.muted}" font-size="13">contributions · ${stats.rangeLabel}</text>
    ${this.contributionHeatmap({ weeks: stats.weeks, x: heatmapX, y: 108, cellSize, gap })}
    ${this.heatmapLegend({ x: heatmapX, y: 168, cellSize, gap })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderHeatmapCardSvg(stats, themeName) {
  return new HeatmapCardRenderer({ themeName }).render(stats);
}
