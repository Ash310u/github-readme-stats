import { BaseSvgRenderer } from "./base-svg-renderer.js";

class ActivityCardRenderer extends BaseSvgRenderer {
  render(stats) {
    const displayName = stats.name || stats.username;
    const segments = [
      { label: "Commits", value: stats.totalCommits, color: this.theme.chart[0] },
      { label: "Pull Requests", value: stats.totalPullRequests, color: this.theme.chart[1] },
      { label: "Issues", value: stats.totalIssues, color: this.theme.chart[2] }
    ];
    const legendItems = [
      { label: `Commits · ${stats.totalCommits} (${stats.commitPercentage}%)`, color: this.theme.chart[0] },
      { label: `PRs · ${stats.totalPullRequests} (${stats.pullRequestPercentage}%)`, color: this.theme.chart[1] },
      { label: `Issues · ${stats.totalIssues} (${stats.issuePercentage}%)`, color: this.theme.chart[2] }
    ];

    return this.svg({
      title: `${displayName} activity breakdown`,
      description: `Activity breakdown for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.sectionLabel({ text: `Activity Breakdown · ${stats.total} total`, x: this.padding, y: 118 })}
    ${this.stackedBar({ segments, x: this.padding, y: 136, width: this.width - this.padding * 2, height: 28 })}
    ${this.legend({
      items: legendItems,
      x: this.padding,
      y: 188,
      gap: 12
    })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderActivityCardSvg(stats, themeName) {
  return new ActivityCardRenderer({
    width: 640,
    height: 270,
    themeName
  }).render(stats);
}
