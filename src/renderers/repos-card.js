import { BaseSvgRenderer } from "./base-svg-renderer.js";

class ReposCardRenderer extends BaseSvgRenderer {
  render(stats) {
    const displayName = stats.name || stats.username;

    return this.svg({
      title: `${displayName} repository stats`,
      description: `Repository statistics for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.metric({ label: "Public Repos", value: stats.publicRepos, x: 28, y: 128 })}
    ${this.metric({ label: "Total Forks", value: stats.totalForks, x: 228, y: 128 })}
    ${this.metric({ label: "Total Stars", value: stats.totalStars, x: 428, y: 128, accent: true })}
    ${this.metric({ label: "Avg Stars/Repo", value: stats.avgStars, x: 28, y: 202 })}
    ${this.metric({ label: "Followers", value: stats.followers, x: 228, y: 202 })}
    ${this.metric({ label: "Following", value: stats.following, x: 428, y: 202 })}
    ${this.footer("github-stats")}
  `
    });
  }
}

export function renderReposCardSvg(stats, themeName) {
  return new ReposCardRenderer({
    width: 640,
    height: 270,
    themeName
  }).render(stats);
}
