import { escapeHtml, formatNumber } from "../utils/format.js";
import { getTheme } from "./themes.js";

export class BaseSvgRenderer {
  constructor({ width, height, themeName, fallbackTheme = "github_light" }) {
    this.width = width;
    this.height = height;
    this.theme = getTheme(themeName, fallbackTheme);
    this.font = "Segoe UI, Ubuntu, sans-serif";
    this.padding = 28;
  }

  svg({ title, description, children }) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(title)}</title>
  <desc id="desc">${escapeHtml(description)}</desc>
  ${this.cardBackground()}
  <g font-family="${this.font}">
    ${children}
  </g>
</svg>`;
  }

  cardBackground() {
    return `<rect x="0.5" y="0.5" width="${this.width - 1}" height="${this.height - 1}" rx="8" fill="${this.theme.background}" stroke="${this.theme.border}"/>`;
  }

  header({ title, subtitle }) {
    return `
    <text x="${this.padding}" y="42" fill="${this.theme.title}" font-size="22" font-weight="700">${escapeHtml(title)}</text>
    <text x="${this.padding}" y="67" fill="${this.theme.muted}" font-size="14">${escapeHtml(subtitle)}</text>
  `;
  }

  divider(y = 92) {
    return `<line x1="${this.padding}" y1="${y}" x2="${this.width - this.padding}" y2="${y}" stroke="${this.theme.border}"/>`;
  }

  metric({ label, value, x, y, accent = false, anchor = "start" }) {
    const valueColor = accent ? this.theme.accent : this.theme.text;

    return `
    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="${this.theme.muted}" font-size="13">${escapeHtml(label)}</text>
    <text x="${x}" y="${y + 26}" text-anchor="${anchor}" fill="${valueColor}" font-size="22" font-weight="700">${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</text>
  `;
  }

  metricWithCaption({ label, value, caption, x, y, accent = false, anchor = "start" }) {
    const valueColor = accent ? this.theme.accent : this.theme.text;

    return `
    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="${this.theme.muted}" font-size="13">${escapeHtml(label)}</text>
    <text x="${x}" y="${y + 28}" text-anchor="${anchor}" fill="${valueColor}" font-size="26" font-weight="700">${formatNumber(value)}</text>
    <text x="${x}" y="${y + 56}" text-anchor="${anchor}" fill="${this.theme.muted}" font-size="13">${escapeHtml(caption)}</text>
  `;
  }

  footer(text) {
    return `<text x="${this.width - this.padding}" y="${this.height - 36}" text-anchor="end" fill="${this.theme.muted}" font-size="13">${escapeHtml(text)}</text>`;
  }

  horizontalBars({ items, x, y, labelWidth = 72, maxBarWidth = 380, barHeight = 14, gap = 18 }) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);

    return items
      .map((item, index) => {
        const barY = y + index * (barHeight + gap);
        const barWidth = Math.max((item.value / maxValue) * maxBarWidth, item.value > 0 ? 4 : 0);
        const color = item.color || this.theme.chart[index % this.theme.chart.length];
        const valueX = x + labelWidth + maxBarWidth + 12;

        return `
    <text x="${x}" y="${barY + barHeight - 2}" fill="${this.theme.text}" font-size="12" font-weight="600">${escapeHtml(item.label)}</text>
    <rect x="${x + labelWidth}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="3" fill="${color}"/>
    <text x="${valueX}" y="${barY + barHeight - 2}" fill="${this.theme.muted}" font-size="12">${escapeHtml(item.display ?? formatNumber(item.value))}</text>`;
      })
      .join("");
  }

  stackedBar({ segments, x, y, width, height }) {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
    let currentX = x;

    const bars = segments
      .map((segment) => {
        const segmentWidth = Math.max((segment.value / total) * width, segment.value > 0 ? 2 : 0);
        const rect = `<rect x="${currentX}" y="${y}" width="${segmentWidth}" height="${height}" rx="2" fill="${segment.color}"/>`;
        currentX += segmentWidth;
        return rect;
      })
      .join("");

    return bars;
  }

  legend({ items, x, y, gap = 16 }) {
    let currentX = x;

    return items
      .map((item) => {
        const entry = `
    <rect x="${currentX}" y="${y - 8}" width="10" height="10" rx="2" fill="${item.color}"/>
    <text x="${currentX + 14}" y="${y}" fill="${this.theme.muted}" font-size="11">${escapeHtml(item.label)}</text>`;
        currentX += 14 + item.label.length * 6.5 + gap;
        return entry;
      })
      .join("");
  }

  contributionHeatmap({ weeks, x, y, cellSize = 9, gap = 2 }) {
    const getLevel = (count) => {
      if (count === 0) {
        return 0;
      }

      if (count <= 3) {
        return 1;
      }

      if (count <= 6) {
        return 2;
      }

      if (count <= 9) {
        return 3;
      }

      return 4;
    };

    return weeks
      .map((week, weekIndex) =>
        week.contributionDays
          .map((day, dayIndex) => {
            const level = getLevel(day.contributionCount);
            const cx = x + weekIndex * (cellSize + gap);
            const cy = y + dayIndex * (cellSize + gap);

            return `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" rx="2" fill="${this.theme.heatmap[level]}"><title>${escapeHtml(day.date)}: ${day.contributionCount} contributions</title></rect>`;
          })
          .join("")
      )
      .join("");
  }

  heatmapLegend({ x, y, cellSize = 9, gap = 2 }) {
    const levels = [0, 1, 2, 3, 4];
    const cells = levels
      .map((level, index) => {
        const cx = x + index * (cellSize + gap);
        return `<rect x="${cx}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${this.theme.heatmap[level]}"/>`;
      })
      .join("");

    const labelX = x + levels.length * (cellSize + gap) + 8;

    return `
    ${cells}
    <text x="${labelX}" y="${y + cellSize - 1}" fill="${this.theme.muted}" font-size="11">Less</text>
    <text x="${labelX + 34}" y="${y + cellSize - 1}" fill="${this.theme.muted}" font-size="11">More</text>`;
  }

  verticalBars({ items, x, y, width, height, barWidth = 10, gap = 3 }) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const totalBarSpace = items.length * (barWidth + gap) - gap;
    const startX = x + (width - totalBarSpace) / 2;

    return items
      .map((item, index) => {
        const barHeight = (item.value / maxValue) * height;
        const bx = startX + index * (barWidth + gap);
        const by = y + height - barHeight;
        const label = item.label || `Week ${index + 1}`;

        return `<rect x="${bx}" y="${by}" width="${barWidth}" height="${Math.max(barHeight, item.value > 0 ? 2 : 0)}" rx="2" fill="${this.theme.accent}" opacity="0.9"><title>${escapeHtml(label)}: ${item.value} contributions</title></rect>`;
      })
      .join("");
  }

  sectionLabel({ text, x, y }) {
    return `<text x="${x}" y="${y}" fill="${this.theme.muted}" font-size="12" font-weight="600">${escapeHtml(text)}</text>`;
  }
}
