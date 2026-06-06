import { BaseSvgRenderer } from "./base-svg-renderer.js";
import { parseMetricLabels, sanitizeCustomText } from "../utils/custom-text.js";
import { escapeHtml, formatNumber } from "../utils/format.js";

export const customWidgetDefinitions = {
  stats: { label: "Summary", height: 126 },
  heatmap: { label: "Contribution Heatmap", height: 142 },
  weekly: { label: "Weekly Contributions", height: 142 },
  chart: { label: "Contribution Stats", height: 126 },
  languages: { label: "Languages", height: 150 },
  repos: { label: "Repository Stats", height: 126 },
  activity: { label: "Activity", height: 126 }
};

export const customWidgetMetricKeys = {
  stats: ["stars", "commits", "prs", "issues", "contributed"],
  chart: ["total", "current_streak", "longest_streak"],
  repos: ["public_repos", "forks", "stars", "followers", "following"],
  activity: ["commits", "prs", "issues"]
};

export const defaultCustomWidgets = ["stats", "heatmap", "weekly"];

const CUSTOM_CARD_FOOTER = "generated with ash310u stats";

const defaultCardCopy = {
  title: "",
  subtitle: "",
  badge: "github-stats"
};

export function parseCustomWidgets(value) {
  if (value === null) {
    return defaultCustomWidgets;
  }

  const widgets = value
    .split(",")
    .map((widget) => widget.trim())
    .filter((widget) => customWidgetDefinitions[widget]);

  return [...new Set(widgets)];
}

export function parseCardCustomization(searchParams) {
  const card = {
    title: sanitizeCustomText(searchParams.get("title")),
    subtitle: sanitizeCustomText(searchParams.get("subtitle")),
    badge: sanitizeCustomText(searchParams.get("badge")) || defaultCardCopy.badge
  };

  const widgets = {};

  for (const widgetId of Object.keys(customWidgetDefinitions)) {
    const title = sanitizeCustomText(searchParams.get(`label_${widgetId}`));
    const detail = sanitizeCustomText(searchParams.get(`detail_${widgetId}`));
    const metrics = parseMetricLabels(searchParams.get(`metrics_${widgetId}`));

    if (title || detail || Object.keys(metrics).length > 0) {
      widgets[widgetId] = { title, detail, metrics };
    }
  }

  return { card, widgets };
}

function renderMetric(theme, { label, value, x, y, width = 150, accent = false }) {
  const color = accent ? theme.accent : theme.text;
  const display = typeof value === "number" ? formatNumber(value) : value;

  return `
    <text x="${x}" y="${y}" fill="${theme.muted}" font-size="12" font-weight="600">${escapeHtml(label)}</text>
    <text x="${x}" y="${y + 28}" fill="${color}" font-size="23" font-weight="750">${escapeHtml(display)}</text>
    <line x1="${x + width}" y1="${y - 12}" x2="${x + width}" y2="${y + 36}" stroke="${theme.border}" opacity="0.65"/>`;
}

function getHeatmapLevel(count) {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

class CustomCardRenderer extends BaseSvgRenderer {
  constructor({ widgets, themeName, customization = { card: defaultCardCopy, widgets: {} } }) {
    const height =
      112 + widgets.reduce((sum, widget) => sum + customWidgetDefinitions[widget].height, 0) + 42;

    super({
      width: 860,
      height,
      themeName,
      fallbackTheme: "github_dark"
    });

    this.widgets = widgets;
    this.customization = customization;
    this.padding = 32;
  }

  widgetCopy(widgetId) {
    return this.customization.widgets[widgetId] || { title: "", detail: "", metrics: {} };
  }

  metricLabel(widgetId, key, fallback) {
    return this.widgetCopy(widgetId).metrics[key] || fallback;
  }

  render(payload) {
    const profile = payload.stats || payload.heatmap || payload.weekly || payload.chart;
    const displayName = this.customization.card.title || profile?.name || profile?.username || payload.username;
    const defaultSubtitle = `@${profile?.username || payload.username} · custom GitHub profile card`;
    const subtitle = this.customization.card.subtitle || defaultSubtitle;
    let y = 106;

    const sections = this.widgets
      .map((widget) => {
        const markup = this.renderWidget(widget, payload[widget], y);
        y += customWidgetDefinitions[widget].height;
        return markup;
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
    ${sections}
    ${this.footer(CUSTOM_CARD_FOOTER)}
  `
    });
  }

  renderWidget(widget, stats, y) {
    if (!stats) {
      return this.emptySection(widget, y);
    }

    const renderers = {
      stats: () => this.summary(stats, y),
      chart: () => this.contributionStats(stats, y),
      repos: () => this.repos(stats, y),
      activity: () => this.activity(stats, y),
      languages: () => this.languages(stats, y),
      heatmap: () => this.heatmap(stats, y),
      weekly: () => this.weekly(stats, y)
    };

    return renderers[widget]();
  }

  sectionTitle(widgetId, y, fallbackLabel, fallbackDetail = "") {
    const copy = this.widgetCopy(widgetId);
    const label = copy.title || fallbackLabel;
    const detail = copy.detail || fallbackDetail;

    return `
    <text x="${this.padding}" y="${y}" fill="${this.theme.text}" font-size="15" font-weight="750">${escapeHtml(label)}</text>
    <text x="${this.width - this.padding}" y="${y}" text-anchor="end" fill="${this.theme.muted}" font-size="12">${escapeHtml(detail)}</text>`;
  }

  emptySection(widget, y) {
    return `
    ${this.sectionTitle(widget, y, customWidgetDefinitions[widget].label)}
    <text x="${this.padding}" y="${y + 36}" fill="${this.theme.muted}" font-size="13">No data available.</text>`;
  }

  summary(stats, y) {
    return `
    ${this.sectionTitle("stats", y, "Summary")}
    ${renderMetric(this.theme, { label: this.metricLabel("stats", "stars", "Stars"), value: stats.totalStars, x: 32, y: y + 38, accent: true })}
    ${renderMetric(this.theme, { label: this.metricLabel("stats", "commits", "Commits"), value: stats.totalCommits, x: 202, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("stats", "prs", "Pull Requests"), value: stats.totalPullRequests, x: 372, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("stats", "issues", "Issues"), value: stats.totalIssues, x: 542, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("stats", "contributed", "Contributed To"), value: stats.contributedTo, x: 712, y: y + 38, width: 0 })}`;
  }

  contributionStats(stats, y) {
    return `
    ${this.sectionTitle("chart", y, "Contribution Stats", stats.rangeLabel)}
    ${renderMetric(this.theme, { label: this.metricLabel("chart", "total", "Total Contributions"), value: stats.totalContributions, x: 32, y: y + 38, width: 210, accent: true })}
    ${renderMetric(this.theme, { label: this.metricLabel("chart", "current_streak", "Current Streak"), value: stats.currentStreak, x: 282, y: y + 38, width: 210 })}
    ${renderMetric(this.theme, { label: this.metricLabel("chart", "longest_streak", "Longest Streak"), value: stats.longestStreak, x: 532, y: y + 38, width: 0 })}`;
  }

  repos(stats, y) {
    return `
    ${this.sectionTitle("repos", y, "Repository Stats")}
    ${renderMetric(this.theme, { label: this.metricLabel("repos", "public_repos", "Public Repos"), value: stats.publicRepos, x: 32, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("repos", "forks", "Forks"), value: stats.totalForks, x: 202, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("repos", "stars", "Stars"), value: stats.totalStars, x: 372, y: y + 38, accent: true })}
    ${renderMetric(this.theme, { label: this.metricLabel("repos", "followers", "Followers"), value: stats.followers, x: 542, y: y + 38 })}
    ${renderMetric(this.theme, { label: this.metricLabel("repos", "following", "Following"), value: stats.following, x: 712, y: y + 38, width: 0 })}`;
  }

  activity(stats, y) {
    const total = stats.total || 1;
    const segments = [
      { key: "commits", label: this.metricLabel("activity", "commits", "Commits"), value: stats.totalCommits, color: this.theme.chart[0] },
      { key: "prs", label: this.metricLabel("activity", "prs", "PRs"), value: stats.totalPullRequests, color: this.theme.chart[1] },
      { key: "issues", label: this.metricLabel("activity", "issues", "Issues"), value: stats.totalIssues, color: this.theme.chart[2] }
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
    ${this.sectionTitle("activity", y, "Activity", `${formatNumber(stats.total)} total`)}
    ${bars}
    ${legend}`;
  }

  languages(stats, y) {
    const maxCount = Math.max(...stats.languages.map((language) => language.count), 1);
    const rows = stats.languages
      .map((language, index) => {
        const rowY = y + 38 + index * 22;
        const width = Math.max((language.count / maxCount) * 420, 4);
        const color = this.theme.chart[index % this.theme.chart.length];

        return `
    <text x="${this.padding}" y="${rowY + 11}" fill="${this.theme.text}" font-size="12" font-weight="650">${escapeHtml(language.name)}</text>
    <rect x="${this.padding + 120}" y="${rowY}" width="${width}" height="12" rx="3" fill="${color}"/>
    <text x="${this.padding + 558}" y="${rowY + 11}" fill="${this.theme.muted}" font-size="12">${language.percentage}%</text>`;
      })
      .join("");

    return `
    ${this.sectionTitle("languages", y, "Languages", `${formatNumber(stats.totalRepos)} repos`)}
    ${rows || `<text x="${this.padding}" y="${y + 52}" fill="${this.theme.muted}" font-size="13">No language data available.</text>`}`;
  }

  heatmap(stats, y) {
    const cellSize = 9;
    const gap = 2;
    const maxWeeks = Math.min(stats.weeks.length, 52);
    const weeks = stats.weeks.slice(-maxWeeks);
    const heatmap = weeks
      .map((week, weekIndex) =>
        week.contributionDays
          .map((day, dayIndex) => {
            const x = this.padding + weekIndex * (cellSize + gap);
            const cy = y + 40 + dayIndex * (cellSize + gap);
            const level = getHeatmapLevel(day.contributionCount);
            return `<rect x="${x}" y="${cy}" width="${cellSize}" height="${cellSize}" rx="2" fill="${this.theme.heatmap[level]}"><title>${escapeHtml(day.date)}: ${day.contributionCount} contributions</title></rect>`;
          })
          .join("")
      )
      .join("");

    const defaultDetail = `${formatNumber(stats.totalContributions)} contributions · ${stats.rangeLabel}`;

    return `
    ${this.sectionTitle("heatmap", y, "Contribution Heatmap", defaultDetail)}
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
        return `<rect x="${x}" y="${by}" width="12" height="${barHeight}" rx="3" fill="${this.theme.accent}"><title>${escapeHtml(week.label)}: ${week.value} contributions</title></rect>`;
      })
      .join("");

    const defaultDetail = `${formatNumber(stats.totalContributions)} contributions · ${stats.rangeLabel}`;

    return `
    ${this.sectionTitle("weekly", y, "Weekly Contributions", defaultDetail)}
    ${bars}`;
  }
}

export function renderCustomCardSvg(payload, themeName, widgets, customization) {
  return new CustomCardRenderer({ widgets, themeName, customization }).render(payload);
}
