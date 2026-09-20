"use client";

/* Study settings for the Pond, kept in localStorage.

   This is an external store rather than component state so the server and the
   browser can disagree safely: the server renders DEFAULTS, hydration matches,
   and React swaps in the saved settings on the client's first read. Two tabs
   open on the page stay in step for free. */

import { CORE_FORMS, type FormId, type Politeness } from "@/lib/japanese/verbs";

export type VerbSettings = {
  politeness: Politeness;
  forms: FormId[];
  furigana: boolean;
  density: "study" | "compact";
};

export const DEFAULT_SETTINGS: VerbSettings = {
  politeness: "polite",
  forms: CORE_FORMS,
  furigana: true,
  density: "study",
};

const STORAGE_KEY = "four-seasons:pond-verbs:v1";

const listeners = new Set<() => void>();

/* getSnapshot must hand back a stable reference or React re-renders forever,
   so the parsed value is cached against the raw string it came from. */
let cachedRaw: string | null = null;
let cachedValue: VerbSettings = DEFAULT_SETTINGS;

function parse(raw: string | null): VerbSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<VerbSettings>;
    return {
      politeness: parsed.politeness === "plain" ? "plain" : "polite",
      forms: Array.isArray(parsed.forms) && parsed.forms.length > 0 ? parsed.forms : DEFAULT_SETTINGS.forms,
      furigana: parsed.furigana !== false,
      density: parsed.density === "compact" ? "compact" : "study",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeToSettings(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", notify);
  };
}

export function getSettingsSnapshot(): VerbSettings {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

export function getServerSettingsSnapshot(): VerbSettings {
  return DEFAULT_SETTINGS;
}

/* Takes an updater so callers never write a stale snapshot back: two changes
   in the same tick would otherwise see the same render's value and the second
   would undo the first. */
export function writeSettings(update: (current: VerbSettings) => VerbSettings) {
  const next = update(getSettingsSnapshot());
  const raw = JSON.stringify(next);
  cachedRaw = raw;
  cachedValue = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* Blocked storage just means the choice lasts for this visit only. */
  }
  notify();
}
