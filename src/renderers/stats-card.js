import { BaseSvgRenderer } from "./base-svg-renderer.js";

class StatsCardRenderer extends BaseSvgRenderer {
  render(stats) {
    const displayName = stats.name || stats.username;

    return this.svg({
      title: `${displayName} GitHub stats`,
      description: `GitHub profile statistics for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.metric({ label: "Total Stars", value: stats.totalStars, x: 28, y: 128 })}
    ${this.metric({ label: "Total Commits", value: stats.totalCommits, x: 228, y: 128 })}
    ${this.metric({ label: "Total PRs", value: stats.totalPullRequests, x: 428, y: 128 })}
    ${this.metric({ label: "Total Issues", value: stats.totalIssues, x: 28, y: 202 })}
    ${this.metric({ label: "Contributed To", value: stats.contributedTo, x: 228, y: 202 })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderStatsCardSvg(stats, themeName) {
  return new StatsCardRenderer({
    width: 640,
    height: 270,
    themeName
  }).render(stats);
}
