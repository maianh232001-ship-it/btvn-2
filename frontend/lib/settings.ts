"use client";

export type DRSettings = { drHigh: number; drMid: number };
export const DEFAULT_SETTINGS: DRSettings = { drHigh: 50, drMid: 20 };
const STORAGE_KEY = "btvn.settings";

export function loadSettings(): DRSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const high =
      typeof parsed.drHigh === "number" ? parsed.drHigh : DEFAULT_SETTINGS.drHigh;
    const mid =
      typeof parsed.drMid === "number" ? parsed.drMid : DEFAULT_SETTINGS.drMid;
    return { drHigh: high, drMid: mid };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: DRSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("btvn:settings", { detail: s }));
}

export function clearSettings() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("btvn:settings", { detail: DEFAULT_SETTINGS })
  );
}

export function drClass(dr: number, s: DRSettings) {
  const n = Number(dr) || 0;
  if (n >= s.drHigh) return "dr-high";
  if (n >= s.drMid) return "dr-mid";
  return "";
}
