import { BaseSvgRenderer } from "./base-svg-renderer.js";
import { buildHeatmapPalette, parseElementColors, sanitizeHexColor } from "../utils/color.js";
import { sanitizeCustomText } from "../utils/custom-text.js";
import { escapeHtml, formatNumber } from "../utils/format.js";

export const customElementDefinitions = {
  stars: { label: "Stars", type: "metric", source: "stats", valueKey: "totalStars", displayLabel: "Stars", accent: true },
  commits: { label: "Commits", type: "metric", source: "stats", valueKey: "totalCommits", displayLabel: "Commits" },
  prs: { label: "Pull Requests", type: "metric", source: "stats", valueKey: "totalPullRequests", displayLabel: "Pull Requests" },
  issues: { label: "Issues", type: "metric", source: "stats", valueKey: "totalIssues", displayLabel: "Issues" },
  contributed: { label: "Contributed To", type: "metric", source: "stats", valueKey: "contributedTo", displayLabel: "Contributed To" },
  total_contributions: {
    label: "Total Contributions",
    type: "metric",
    source: "chart",
    valueKey: "totalContributions",
    displayLabel: "Total Contributions",
    accent: true
  },
  current_streak: {
    label: "Current Streak",
    type: "metric",
    source: "chart",
    valueKey: "currentStreak",
    displayLabel: "Current Streak"
  },
  longest_streak: {
    label: "Longest Streak",
    type: "metric",
    source: "chart",
    valueKey: "longestStreak",
    displayLabel: "Longest Streak"
  },
  public_repos: { label: "Public Repos", type: "metric", source: "repos", valueKey: "publicRepos", displayLabel: "Public Repos" },
  forks: { label: "Forks", type: "metric", source: "repos", valueKey: "totalForks", displayLabel: "Forks" },
  repo_stars: { label: "Repo Stars", type: "metric", source: "repos", valueKey: "totalStars", displayLabel: "Stars", accent: true },
  followers: { label: "Followers", type: "metric", source: "repos", valueKey: "followers", displayLabel: "Followers" },
  following: { label: "Following", type: "metric", source: "repos", valueKey: "following", displayLabel: "Following" },
  heatmap: { label: "Contribution Heatmap", type: "block", source: "heatmap", height: 142 },
  weekly: { label: "Weekly Contributions", type: "block", source: "weekly", height: 142 },
  languages: { label: "Languages", type: "block", source: "languages", height: 162 },
  activity: { label: "Activity", type: "block", source: "activity", height: 126 }
};

const widgetElementMap = {
  stats: ["stars", "commits", "prs", "issues", "contributed"],
  chart: ["total_contributions", "current_streak", "longest_streak"],
  repos: ["public_repos", "forks", "repo_stars", "followers", "following"],
  heatmap: ["heatmap"],
  weekly: ["weekly"],
  languages: ["languages"],
  activity: ["activity"]
};

export const defaultCustomElements = ["stars", "commits", "prs", "issues", "contributed", "heatmap", "weekly"];

const METRIC_ROW_HEIGHT = 88;
const METRIC_SLOT_WIDTH = 170;
const METRICS_PER_ROW = 5;
const SECTION_TOP_GAP = 20;
const LANGUAGE_ROW_GAP = 26;
const CUSTOM_CARD_FOOTER = "generated with ash310u stats";

const defaultCardCopy = {
  title: "",
  subtitle: "",
  badge: "github-stats"
};

export function parseCustomWidgets(value) {
  if (value === null) {
    return Object.keys(widgetElementMap);
  }

  return value
    .split(",")
    .map((widget) => widget.trim())
    .filter((widget) => widgetElementMap[widget]);
}

function expandWidgetsToElements(widgets) {
  return [...new Set(widgets.flatMap((widget) => widgetElementMap[widget] || []))];
}

export function parseCustomElements(elementsValue, widgetsValue = null) {
  if (elementsValue !== null && elementsValue !== undefined) {
    const elements = elementsValue
      .split(",")
      .map((element) => element.trim())
      .filter((element) => customElementDefinitions[element]);

    return [...new Set(elements)];
  }

  if (widgetsValue !== null && widgetsValue !== undefined) {
    const widgets = parseCustomWidgets(widgetsValue);
    return expandWidgetsToElements(widgets);
  }

  return [...defaultCustomElements];
}

export function getElementSources(elements) {
  return [...new Set(elements.map((element) => customElementDefinitions[element].source))];
}

export function parseCardCustomization(searchParams, elements = []) {
  return {
    card: {
      title: sanitizeCustomText(searchParams.get("title")),
      subtitle: sanitizeCustomText(searchParams.get("subtitle")),
      badge: sanitizeCustomText(searchParams.get("badge")) || defaultCardCopy.badge
    },
    colors: parseElementColors(searchParams, elements)
  };
}

function getDefaultElementColor(theme, elementId) {
  const definition = customElementDefinitions[elementId];

  if (definition?.accent) {
    return theme.accent;
  }

  if (definition?.type === "metric") {
    return theme.text;
  }

  if (elementId === "weekly") {
    return theme.accent;
  }

  if (elementId === "heatmap") {
    return theme.heatmap[4];
  }

  if (elementId === "languages" || elementId === "activity") {
    return theme.chart[0];
  }

  return theme.text;
}

function renderMetric(theme, { label, value, x, y, width = 150, valueColor }) {
  const display = typeof value === "number" ? formatNumber(value) : value;

  return `
    <text x="${x}" y="${y}" fill="${theme.muted}" font-size="12" font-weight="600">${escapeHtml(label)}</text>
    <text x="${x}" y="${y + 28}" fill="${valueColor}" font-size="23" font-weight="750">${escapeHtml(display)}</text>
    <line x1="${x + width}" y1="${y - 12}" x2="${x + width}" y2="${y + 36}" stroke="${theme.border}" opacity="0.65"/>`;
}

function getHeatmapLevel(count) {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

function calculateCardHeight(elements) {
  let height = 112;
  let metricCount = 0;

  for (const elementId of elements) {
    const definition = customElementDefinitions[elementId];

    if (definition.type === "metric") {
      metricCount += 1;
      continue;
    }

    if (metricCount > 0) {
      height += Math.ceil(metricCount / METRICS_PER_ROW) * METRIC_ROW_HEIGHT + 8;
      metricCount = 0;
    }

    height += definition.height + SECTION_TOP_GAP;
  }

  if (metricCount > 0) {
    height += Math.ceil(metricCount / METRICS_PER_ROW) * METRIC_ROW_HEIGHT + 8;
  }

  return height + 42;
}

class CustomCardRenderer extends BaseSvgRenderer {
  constructor({ elements, themeName, customization = { card: defaultCardCopy, colors: {} } }) {
    super({
      width: 860,
      height: calculateCardHeight(elements),
      themeName,
      fallbackTheme: "github_dark"
    });

    this.elements = elements;
    this.customization = {
      card: customization.card || defaultCardCopy,
      colors: customization.colors || {}
    };
    this.padding = 32;
  }

  elementColor(elementId) {
    const customColor = sanitizeHexColor(this.customization.colors?.[elementId]);
    return customColor || getDefaultElementColor(this.theme, elementId);
  }

  heatmapPalette() {
    const customColor = sanitizeHexColor(this.customization.colors?.heatmap);
    if (!customColor) {
      return this.theme.heatmap;
    }

    return buildHeatmapPalette(customColor, this.theme.heatmap[0]) || this.theme.heatmap;
  }

  render(payload) {
    this.payload = payload;
    const profile =
      payload.stats || payload.heatmap || payload.weekly || payload.chart || payload.repos || payload.activity;
    const displayName = this.customization.card.title || profile?.name || profile?.username || payload.username;
    const defaultSubtitle = `@${profile?.username || payload.username} · custom GitHub profile card`;
    const subtitle = this.customization.card.subtitle || defaultSubtitle;
    let y = 106;
    let metricBuffer = [];

    const flushMetrics = () => {
      if (metricBuffer.length === 0) {
        return "";
      }

      const markup = this.renderMetricGroup(metricBuffer, y);
      const rows = Math.ceil(metricBuffer.length / METRICS_PER_ROW);
      y += rows * METRIC_ROW_HEIGHT + 8;
      metricBuffer = [];
      return markup;
    };

    const sections = this.elements
      .map((elementId) => {
        const definition = customElementDefinitions[elementId];

        if (definition.type === "metric") {
          metricBuffer.push({ elementId, definition });
          return "";
        }

        const metricsMarkup = flushMetrics();
        const blockY = y + SECTION_TOP_GAP;
        const blockMarkup = this.renderBlock(elementId, payload[definition.source], blockY);
        y += definition.height + SECTION_TOP_GAP;
        return metricsMarkup + blockMarkup;
      })
      .join("");

    return this.svg({
      title: `${displayName} custom GitHub stats`,
      description: `Custom GitHub stats card for ${profile?.username || payload.username}`,
      children: `
    <text x="${this.padding}" y="44" fill="${this.theme.title}" font-size="25" font-weight="800">${escapeHtml(displayName)}</text>
    <text x="${this.padding}" y="70" fill="${this.theme.muted}" font-size="14">${escapeHtml(subtitle)}</text>
    <text x="${this.width - this.padding}" y="56" text-anchor="end" fill="${this.theme.accent}" font-size="13" font-weight="700">${escapeHtml(this.customization.card.badge)}</text>
    <line x1="${this.padding}" y1="88" x2="${this.width - this.padding}" y2="88" stroke="${this.theme.border}"/>
    ${sections}${flushMetrics()}
    ${this.footer(CUSTOM_CARD_FOOTER)}
  `
    });
  }

  renderMetricGroup(metrics, y) {
    return metrics
      .map((metric, index) => {
        const row = Math.floor(index / METRICS_PER_ROW);
        const column = index % METRICS_PER_ROW;
        const x = this.padding + column * METRIC_SLOT_WIDTH;
        const rowY = y + row * METRIC_ROW_HEIGHT + 38;
        const data = metric.definition;
        const stats = this.payload?.[data.source];
        const value = stats?.[data.valueKey] ?? 0;
        const isLastInRow = column === METRICS_PER_ROW - 1 || index === metrics.length - 1;

        return renderMetric(this.theme, {
          label: data.displayLabel,
          value,
          x,
          y: rowY,
          width: isLastInRow ? 0 : 150,
          valueColor: this.elementColor(metric.elementId)
        });
      })
      .join("");
  }

  renderBlock(elementId, stats, y) {
    if (!stats) {
      return this.emptyBlock(elementId, y);
    }

    const renderers = {
      heatmap: () => this.heatmap(stats, y),
      weekly: () => this.weekly(stats, y),
      languages: () => this.languages(stats, y),
      activity: () => this.activity(stats, y)
    };

    return renderers[elementId]();
  }

  sectionTitle(label, y, detail = "") {
    return `
    <text x="${this.padding}" y="${y}" fill="${this.theme.text}" font-size="15" font-weight="750">${escapeHtml(label)}</text>
    <text x="${this.width - this.padding}" y="${y}" text-anchor="end" fill="${this.theme.muted}" font-size="12">${escapeHtml(detail)}</text>`;
  }

  emptyBlock(elementId, y) {
    const definition = customElementDefinitions[elementId];

    return `
    ${this.sectionTitle(definition.label, y)}
    <text x="${this.padding}" y="${y + 36}" fill="${this.theme.muted}" font-size="13">No data available.</text>`;
  }

  activity(stats, y) {
    const total = stats.total || 1;
    const customActivityColor = sanitizeHexColor(this.customization.colors?.activity);
    const segments = customActivityColor
      ? [
          { label: "Commits", value: stats.totalCommits, color: customActivityColor },
          { label: "PRs", value: stats.totalPullRequests, color: customActivityColor },
          { label: "Issues", value: stats.totalIssues, color: customActivityColor }
        ]
      : [
          { label: "Commits", value: stats.totalCommits, color: this.theme.chart[0] },
          { label: "PRs", value: stats.totalPullRequests, color: this.theme.chart[1] },
          { label: "Issues", value: stats.totalIssues, color: this.theme.chart[2] }
        ];
    let x = this.padding;
    const bars = segments
      .map((segment) => {
        const width = Math.max((segment.value / total) * 540, segment.value > 0 ? 3 : 0);
        const rect = `<rect x="${x}" y="${y + 44}" width="${width}" height="24" rx="4" fill="${segment.color}"/>`;
        x += width;
        return rect;
      })
      .join("");
    const legend = segments
      .map(
        (segment, index) => `
    <rect x="${this.padding + index * 190}" y="${y + 88}" width="10" height="10" rx="2" fill="${segment.color}"/>
    <text x="${this.padding + 16 + index * 190}" y="${y + 98}" fill="${this.theme.muted}" font-size="12">${escapeHtml(segment.label)} · ${formatNumber(segment.value)}</text>`
      )
      .join("");

    return `
    ${this.sectionTitle("Activity", y, `${formatNumber(stats.total)} total`)}
    ${bars}
    ${legend}`;
  }

  languages(stats, y) {
    const maxCount = Math.max(...stats.languages.map((language) => language.count), 1);
    const rows = stats.languages
      .map((language, index) => {
        const rowY = y + 38 + index * LANGUAGE_ROW_GAP;
        const width = Math.max((language.count / maxCount) * 420, 4);
        const color = this.customization.colors?.languages
          ? this.elementColor("languages")
          : this.theme.chart[index % this.theme.chart.length];

        return `
    <text x="${this.padding}" y="${rowY + 11}" fill="${this.theme.text}" font-size="12" font-weight="650">${escapeHtml(language.name)}</text>
    <rect x="${this.padding + 120}" y="${rowY}" width="${width}" height="12" rx="3" fill="${color}"/>
    <text x="${this.padding + 558}" y="${rowY + 11}" fill="${this.theme.muted}" font-size="12">${language.percentage}%</text>`;
      })
      .join("");

    return `
    ${this.sectionTitle("Languages", y, `${formatNumber(stats.totalRepos)} repos`)}
    ${rows || `<text x="${this.padding}" y="${y + 52}" fill="${this.theme.muted}" font-size="13">No language data available.</text>`}`;
  }

  heatmap(stats, y) {
    const cellSize = 9;
    const gap = 2;
    const maxWeeks = Math.min(stats.weeks.length, 52);
    const weeks = stats.weeks.slice(-maxWeeks);
    const palette = this.heatmapPalette();
    const heatmap = weeks
      .map((week, weekIndex) =>
        week.contributionDays
          .map((day, dayIndex) => {
            const x = this.padding + weekIndex * (cellSize + gap);
            const cy = y + 40 + dayIndex * (cellSize + gap);
            const level = getHeatmapLevel(day.contributionCount);
            return `<rect x="${x}" y="${cy}" width="${cellSize}" height="${cellSize}" rx="2" fill="${palette[level]}"><title>${escapeHtml(day.date)}: ${day.contributionCount} contributions</title></rect>`;
          })
          .join("")
      )
      .join("");

    const detail = `${formatNumber(stats.totalContributions)} contributions · ${stats.rangeLabel}`;

    return `
    ${this.sectionTitle("Contribution Heatmap", y, detail)}
    ${heatmap}`;
  }

  weekly(stats, y) {
    const maxValue = Math.max(...stats.weeks.map((week) => week.value), 1);
    const chartY = y + 40;
    const chartHeight = 70;
    const bars = stats.weeks
      .map((week, index) => {
        const barHeight = Math.max((week.value / maxValue) * chartHeight, week.value > 0 ? 2 : 0);
        const x = this.padding + index * 19;
        const by = chartY + chartHeight - barHeight;
        return `<rect x="${x}" y="${by}" width="12" height="${barHeight}" rx="3" fill="${this.elementColor("weekly")}"><title>${escapeHtml(week.label)}: ${week.value} contributions</title></rect>`;
      })
      .join("");

    const detail = `${formatNumber(stats.totalContributions)} contributions · ${stats.rangeLabel}`;

    return `
    ${this.sectionTitle("Weekly Contributions", y, detail)}
    ${bars}`;
  }
}

export function renderCustomCardSvg(payload, themeName, elements, customization) {
  return new CustomCardRenderer({ elements, themeName, customization }).render(payload);
}
