import { BaseSvgRenderer } from "./base-svg-renderer.js";
import { formatNumber } from "../utils/format.js";

class WeeklyChartRenderer extends BaseSvgRenderer {
  render(stats) {
    const displayName = stats.name || stats.username;
    const chartHeight = 90;
    const chartY = 130;

    return this.svg({
      title: `${displayName} weekly contributions`,
      description: `Weekly contribution chart for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.sectionLabel({
      text: `Last ${stats.weeks.length} weeks · ${formatNumber(stats.totalContributions)} contributions · ${stats.rangeLabel}`,
      x: this.padding,
      y: 118
    })}
    ${this.verticalBars({
      items: stats.weeks,
      x: this.padding,
      y: chartY,
      width: this.width - this.padding * 2,
      height: chartHeight,
      barWidth: stats.weeks.length > 20 ? 10 : 14,
      gap: stats.weeks.length > 20 ? 3 : 5
    })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderWeeklyChartSvg(stats, themeName) {
  return new WeeklyChartRenderer({
    width: 640,
    height: 270,
    themeName
  }).render(stats);
}
