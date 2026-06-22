const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeId(value: string) {
  const trimmed = value.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
    if (marker >= 0) return parts[marker + 1] ?? null;
  } catch {
    return null;
  }

  return null;
}

export function normalizeYouTubeUrl(youtubeId: string) {
  return `https://youtu.be/${youtubeId}`;
}
