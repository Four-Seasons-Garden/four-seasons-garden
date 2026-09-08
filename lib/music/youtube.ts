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

/* ─────────── IFrame Player API ─────────── */

export type YouTubePlayerState = {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
  BUFFERING: number;
  CUED: number;
};

export type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  loadPlaylist: (playlist: string[], index?: number, startSeconds?: number) => void;
  cuePlaylist: (playlist: string[], index?: number, startSeconds?: number) => void;
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  setLoop: (loopPlaylists: boolean) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

export type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

export type YouTubePlayerOptions = {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    onError?: () => void;
  };
};

export type YouTubePlayerConstructor = new (
  element: HTMLElement | string,
  options: YouTubePlayerOptions,
) => YouTubePlayer;

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor;
      PlayerState: YouTubePlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

/* Loads the IFrame API once per page and resolves when YT.Player is ready. */
export function loadYouTubeIframeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve();
      };

      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (existing) return;

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }

  return youtubeApiPromise;
}
