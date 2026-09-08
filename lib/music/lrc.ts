export type TimedLyric = {
  time: number;
  text: string;
};

/* Parse an .lrc file. A line may carry several timestamps, which yields one
   entry per timestamp so repeated lines land at each of their times. */
export function parseLrcEntries(text: string): TimedLyric[] {
  const timestampPattern = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
  const entries = text
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = Array.from(line.matchAll(timestampPattern));
      const lyric = line.replace(timestampPattern, "").trim();
      if (matches.length === 0 || !lyric) return [];

      return matches.map((match) => {
        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const fraction = Number(`0.${match[3] ?? "0"}`);
        return {
          time: minutes * 60 + seconds + fraction,
          text: lyric,
        };
      });
    })
    .sort((a, b) => a.time - b.time);

  return entries;
}

/* Evenly spaced stand-in timings for tracks that ship plain lines. */
export function fallbackLyrics(lines: string[]): TimedLyric[] {
  return lines.map((line, index) => ({
    time: index * 8,
    text: line,
  }));
}

export function activeLyricIndex(entries: TimedLyric[], currentTime: number) {
  if (entries.length === 0) return -1;

  let index = 0;
  for (let next = 0; next < entries.length; next += 1) {
    if (entries[next].time > currentTime) break;
    index = next;
  }

  return index;
}

/* A four-line window around the active line, kept in range at both ends. */
export function visibleLyrics(entries: TimedLyric[], activeIndex: number) {
  if (entries.length === 0) return [];

  const clampedActive = Math.max(0, activeIndex);
  const start = Math.max(0, Math.min(clampedActive - 1, entries.length - 4));
  return entries.slice(start, start + 4).map((entry, offset) => ({
    entry,
    index: start + offset,
  }));
}
