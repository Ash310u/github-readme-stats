export const CUSTOM_TEXT_MAX_LENGTH = 60;

export function sanitizeCustomText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, CUSTOM_TEXT_MAX_LENGTH);
}
