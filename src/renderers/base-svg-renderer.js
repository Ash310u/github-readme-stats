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
    <text x="${x}" y="${y + 26}" text-anchor="${anchor}" fill="${valueColor}" font-size="22" font-weight="700">${formatNumber(value)}</text>
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
}
