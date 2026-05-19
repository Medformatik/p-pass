/**
 * Returns the current accent color resolved from CSS custom properties.
 * Falls back to a sensible default if window/style not available (SSR/tests).
 */
export function getAccentColor(fallback = "#33b3a5"): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim();
  return v || fallback;
}

export function getCorrectColor(fallback = "#5fb389"): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue("--brand-correct").trim() || fallback;
}

export function getWrongColor(fallback = "#c44e3e"): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue("--brand-wrong").trim() || fallback;
}

export function getInkColor(fallback = "#222"): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue("--brand-ink").trim() || fallback;
}
