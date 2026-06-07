const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;

export function sanitizeHexColor(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!HEX_COLOR_PATTERN.test(normalized)) {
    return null;
  }

  return `#${normalized.replace("#", "").toLowerCase()}`;
}

function parseHexChannel(hex) {
  return Number.parseInt(hex, 16);
}

function channelToHex(channel) {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, "0");
}

export function mixHexColors(left, right, ratio) {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const leftHex = sanitizeHexColor(left)?.slice(1);
  const rightHex = sanitizeHexColor(right)?.slice(1);

  if (!leftHex || !rightHex) {
    return sanitizeHexColor(left) || sanitizeHexColor(right);
  }

  const leftChannels = [leftHex.slice(0, 2), leftHex.slice(2, 4), leftHex.slice(4, 6)].map(parseHexChannel);
  const rightChannels = [rightHex.slice(0, 2), rightHex.slice(2, 4), rightHex.slice(4, 6)].map(parseHexChannel);

  return `#${leftChannels
    .map((channel, index) => channelToHex(channel + (rightChannels[index] - channel) * safeRatio))
    .join("")}`;
}

export function buildHeatmapPalette(peakColor, emptyColor) {
  const peak = sanitizeHexColor(peakColor);
  const empty = sanitizeHexColor(emptyColor);

  if (!peak || !empty) {
    return null;
  }

  return [
    empty,
    mixHexColors(empty, peak, 0.28),
    mixHexColors(empty, peak, 0.52),
    mixHexColors(empty, peak, 0.76),
    peak
  ];
}

export function parseElementColors(searchParams, elements) {
  const colors = {};

  for (const elementId of elements) {
    const sanitized = sanitizeHexColor(searchParams.get(`color_${elementId}`));
    if (sanitized) {
      colors[elementId] = sanitized;
    }
  }

  return colors;
}
