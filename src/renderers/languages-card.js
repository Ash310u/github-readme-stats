import { BaseSvgRenderer } from "./base-svg-renderer.js";

class LanguagesCardRenderer extends BaseSvgRenderer {
  render(stats) {
    const displayName = stats.name || stats.username;
    const items = stats.languages.map((language) => ({
      label: language.name,
      value: language.count,
      display: `${language.percentage}%`
    }));

    return this.svg({
      title: `${displayName} top languages`,
      description: `Top programming languages for ${stats.username}`,
      children: `
    ${this.header({ title: displayName, subtitle: `@${stats.username}` })}
    ${this.divider()}
    ${this.sectionLabel({ text: "Top Languages by Repository", x: this.padding, y: 118 })}
    ${items.length ? this.horizontalBars({ items, x: this.padding, y: 132, labelWidth: 72, maxBarWidth: 400, barHeight: 12, gap: 8 }) : `<text x="${this.padding}" y="160" fill="${this.theme.muted}" font-size="13">No language data available</text>`}
    ${this.footer(`github-stats · ${stats.totalRepos} repos`)}
  `
    });
  }
}

export function renderLanguagesCardSvg(stats, themeName) {
  return new LanguagesCardRenderer({
    width: 640,
    height: 270,
    themeName
  }).render(stats);
}
