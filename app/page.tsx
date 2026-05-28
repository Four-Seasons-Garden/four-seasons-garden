"use client";
/* Four Seasons Garden — app/page.tsx
   Watercolor cottage scene composed of layered SVG primitives, re-skinned
   per biome via CSS variables, plus per-biome weather particle effects. */

import Link from "next/link";
import { Move, Volume2, VolumeX } from "lucide-react";
import { Solar } from "lunar-typescript";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  BIOMES,
  DEFAULT_BIOME_ID,
  getBiome,
  type Biome,
} from "@/lib/constants/biomes";
import type {
  BiomeWeatherPayload,
  LiveBiomeWeather,
  TimeOfDay,
} from "@/lib/weather/open-meteo";
import {
  SkyHills, Cottage, StonePath, Greenhouse, WildflowerDrift,
  VegetablePatch, PicketFence, PaperGrain,
  IconSun, IconCloudSun, IconCloudRain, IconCloudLightning, IconSnowflake,
} from "./components/SceneArt";
import {
  Rain, Snow, Blossoms, Mist, Aurora, Rainbow, LightningFlash,
} from "./components/WeatherEffects";

/* Format a lat/lon decimal as "37.27° N" */
function fmtCoord(value: number, pos: string, neg: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? pos : neg}`;
}

/* Convert biome.theme.palette → inline style with CSS vars on .scene root */
function paletteStyle(biome: Biome): CSSProperties {
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(biome.theme.palette)) {
    if (v) style[`--${k}`] = v as string;
  }
  return style as CSSProperties;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const fireflyRandom = seededRandom(4401);
const FIREFLIES = Array.from({ length: 16 }).map(() => ({
    left: (fireflyRandom() * 80 + 10) + "%",
    top: (fireflyRandom() * 45 + 40) + "%",
    dx: (fireflyRandom() * 80 - 40) + "px",
    dy: (-fireflyRandom() * 80 - 30) + "px",
    dur: (fireflyRandom() * 6 + 6) + "s",
    delay: (-fireflyRandom() * 8) + "s",
}));

const GARDEN_PLACES = [
  { href: "/greenhouse", label: "Greenhouse", className: "hotspot-greenhouse" },
  { href: "/nursery", label: "Nursery", className: "hotspot-nursery" },
  { href: "/pond", label: "Pond", className: "hotspot-pond" },
  { href: "/garden-sutra", label: "Garden Sutra", className: "hotspot-sutra" },
];

type GardenPlace = (typeof GARDEN_PLACES)[number];

type LocationTrack = {
  id?: string;
  biomeId?: string;
  title: string;
  artist: string;
  src?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  lyricsUrl?: string;
  lines?: string[];
};

type TimedLyric = {
  time: number;
  text: string;
};

type DragPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  baseLeft: number;
  baseTop: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  moved: boolean;
};

type YouTubePlayerState = {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
  BUFFERING: number;
  CUED: number;
};

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  getCurrentTime: () => number;
};

type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubePlayerOptions = {
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

type YouTubePlayerConstructor = new (
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

const FALLBACK_LOCATION_TRACKS: Partial<Record<string, LocationTrack[]>> = {
  akureyri: [{
    id: "akureyri-bing-yu",
    biomeId: "akureyri",
    title: "冰雨",
    artist: "刘德华",
    src: "/audio/akureyri-bing-yu.mp3",
    youtubeId: "90zAJ4tFSy8",
    youtubeUrl: "https://youtu.be/90zAJ4tFSy8",
    lyricsUrl: "/audio/akureyri-bing-yu.lrc",
    lines: [
      "冰色的雨落进北方花园",
      "极光把夜色轻轻照亮",
      "玻璃温室听见雪的回声",
      "一行一行，像雨慢慢往下",
    ],
  }],
};

const DRAG_STORAGE_PREFIX = "four-seasons:front-page-drag:v2";
const DRAG_THRESHOLD = 4;

function clamp(value: number, min: number, max: number) {
  if (min > max) return value;
  return Math.min(max, Math.max(min, value));
}

function dragStorageKey(key: string) {
  if (typeof window === "undefined") return `${DRAG_STORAGE_PREFIX}:desktop:${key}`;
  const scope = window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";
  return `${DRAG_STORAGE_PREFIX}:${scope}:${key}`;
}

function readStoredDragPosition(key: string): DragPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(dragStorageKey(key)) ?? "");
    if (
      typeof parsed?.x === "number" &&
      Number.isFinite(parsed.x) &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    return { x: 0, y: 0 };
  }

  return { x: 0, y: 0 };
}

function writeStoredDragPosition(key: string, position: DragPosition) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(dragStorageKey(key), JSON.stringify(position));
  } catch {
    // Dragging should still work even if the browser blocks localStorage.
  }
}

function useSceneDraggable(key: string) {
  const [position, setPosition] = useState<DragPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const dragRef = useRef<DragState | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStoredDragPosition(key);
      positionRef.current = stored;
      setPosition(stored);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [key]);

  function commitPosition(next: DragPosition) {
    positionRef.current = next;
    setPosition(next);
  }

  function setDragElement(element: HTMLElement | null) {
    dragElementRef.current = element;
  }

  function onHandlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const element = dragElementRef.current;
    if (!element) return;

    const parent = element.offsetParent instanceof HTMLElement
      ? element.offsetParent
      : element.parentElement;
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const origin = positionRef.current;
    const baseLeft = elementRect.left - origin.x;
    const baseTop = elementRect.top - origin.y;
    const margin = 8;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      baseLeft,
      baseTop,
      minX: parentRect.left + margin - baseLeft,
      maxX: parentRect.right - margin - elementRect.width - baseLeft,
      minY: parentRect.top + margin - baseTop,
      maxY: parentRect.bottom - margin - elementRect.height - baseTop,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

    drag.moved = true;
    setDragging(true);
    event.preventDefault();

    commitPosition({
      x: clamp(drag.originX + deltaX, drag.minX, drag.maxX),
      y: clamp(drag.originY + deltaY, drag.minY, drag.maxY),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);
    if (drag.moved) writeStoredDragPosition(key, positionRef.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onHandleClick(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    className: "draggable-scene-item",
    dataDragging: dragging ? "true" : undefined,
    setDragElement,
    style: {
      "--drag-x": `${position.x}px`,
      "--drag-y": `${position.y}px`,
    } as CSSProperties,
    handleProps: {
      "data-dragging": dragging ? "true" : undefined,
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClick: onHandleClick,
    },
  };
}

function fmtTemperature(value: number) {
  return `${Math.round(value)}°F`;
}

function formatZonedClock(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "gregory",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: read("weekday"),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
  };
}

function formatMonthName(month: number) {
  const date = new Date(Date.UTC(2020, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
}

function buildAlmanac(date: Date | null, timezone: string) {
  if (!date) return null;

  const parts = zonedParts(date, timezone);
  const lunar = Solar
    .fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second)
    .getLunar();
  const pillars = [
    `${lunar.getYearInGanZhiExact()}年`,
    `${lunar.getMonthInGanZhiExact()}月`,
    `${lunar.getDayInGanZhiExact()}日`,
    `${lunar.getTimeInGanZhi()}时`,
  ];

  return {
    gregorian: {
      year: `${parts.year}`,
      month: formatMonthName(parts.month),
      day: `${parts.day}`,
      weekday: parts.weekday,
    },
    lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    zodiac: lunar.getYearShengXiaoExact(),
    pillars,
    timePillar: `${lunar.getTimeInGanZhi()}时`,
    jieQi: lunar.getJieQi() || "—",
  };
}

function zonedMinutes(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function localTimeMinutes(value: string) {
  const time = value.split("T")[1] ?? value;
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function classifyTimeOfDayMinutes(now: number, sunrise: number, sunset: number): TimeOfDay {
  if (sunset <= sunrise) {
    if (now >= 5 * 60 && now < 7 * 60) return "dawn";
    if (now >= 7 * 60 && now < 11 * 60) return "morning";
    if (now >= 11 * 60 && now < 13 * 60) return "noon";
    if (now >= 13 * 60 && now < 17 * 60) return "afternoon";
    if (now >= 17 * 60 && now < 19 * 60) return "dusk";
    if (now >= 19 * 60 && now < 22 * 60) return "evening";
    return "night";
  }

  const dawnStart = sunrise - 45;
  const morningStart = sunrise + 45;
  const solarNoon = sunrise + (sunset - sunrise) / 2;
  const noonStart = solarNoon - 75;
  const noonEnd = solarNoon + 75;
  const duskStart = sunset - 60;
  const eveningStart = sunset + 45;
  const eveningEnd = Math.min(1439, sunset + 240);

  if (now >= dawnStart && now < morningStart) return "dawn";
  if (now >= morningStart && now < noonStart) return "morning";
  if (now >= noonStart && now < noonEnd) return "noon";
  if (now >= noonEnd && now < duskStart) return "afternoon";
  if (now >= duskStart && now < eveningStart) return "dusk";
  if (now >= eveningStart && now < eveningEnd) return "evening";
  return "night";
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function usePreciseClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const firstTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, []);

  return now;
}

function weatherSignal(weather?: LiveBiomeWeather) {
  const code = weather?.current.weatherCode;
  const rain = weather?.current.rainIn ?? 0;
  const showers = weather?.current.showersIn ?? 0;
  const snow = weather?.current.snowfallIn ?? 0;

  return {
    snow: snow > 0 || (code !== undefined && [71, 73, 75, 77, 85, 86].includes(code)),
    thunder: code !== undefined && [95, 96, 99].includes(code),
    rain: rain > 0 || showers > 0 || (code !== undefined && [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)),
    cloud: (weather?.current.cloudCover ?? 0) > 55 || (code !== undefined && [2, 3, 45, 48].includes(code)),
  };
}

function weatherKind(weather?: LiveBiomeWeather) {
  const signal = weatherSignal(weather);
  if (signal.thunder) return "thunder";
  if (signal.snow) return "snow";
  if (signal.rain) return "rain";
  if (signal.cloud) return "cloud";
  return "clear";
}

function liveRainIntensity(weather?: LiveBiomeWeather): "mild" | "heavy" | "shower" | undefined {
  if (!weatherSignal(weather).rain) return undefined;
  const code = weather?.current.weatherCode;
  const amount = (weather?.current.rainIn ?? 0) + (weather?.current.showersIn ?? 0);
  if (code !== undefined && [65, 81, 82, 95, 96, 99].includes(code)) return "heavy";
  if (code !== undefined && [80].includes(code)) return "shower";
  if (amount >= 0.08) return "heavy";
  return "mild";
}

function liveTimeOfDay(weather?: LiveBiomeWeather, now?: Date | null): TimeOfDay {
  if (!weather || !now) return weather?.current.timeOfDay ?? "afternoon";
  const timezone = weather.resolvedLocation.timezone;
  return classifyTimeOfDayMinutes(
    zonedMinutes(now, timezone),
    localTimeMinutes(weather.current.sun.sunrise),
    localTimeMinutes(weather.current.sun.sunset),
  );
}

function loadYouTubeIframeApi() {
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

function parseLrcEntries(text: string): TimedLyric[] {
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

function fallbackLyrics(lines: string[]): TimedLyric[] {
  return lines.map((line, index) => ({
    time: index * 8,
    text: line,
  }));
}

function activeLyricIndex(entries: TimedLyric[], currentTime: number) {
  if (entries.length === 0) return -1;

  let index = 0;
  for (let next = 0; next < entries.length; next += 1) {
    if (entries[next].time > currentTime) break;
    index = next;
  }

  return index;
}

function visibleLyrics(entries: TimedLyric[], activeIndex: number) {
  if (entries.length === 0) return [];

  const clampedActive = Math.max(0, activeIndex);
  const start = Math.max(0, Math.min(clampedActive - 1, entries.length - 4));
  return entries.slice(start, start + 4).map((entry, offset) => ({
    entry,
    index: start + offset,
  }));
}

function LocationMusic({ tracks }: { tracks: LocationTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeMountRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const pendingYoutubePlayRef = useRef(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [songMenuOpen, setSongMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedLyrics, setLoadedLyrics] = useState<{ url: string; entries: TimedLyric[] } | null>(null);
  const track = tracks.find((item) => (item.id ?? item.youtubeId ?? item.title) === selectedTrackId) ?? tracks[0];

  useEffect(() => {
    const audio = audioRef.current;
    const youtubePlayer = youtubePlayerRef.current;
    return () => {
      audio?.pause();
      youtubePlayer?.destroy();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const lyricsUrl = track?.lyricsUrl;

    if (!lyricsUrl) return;

    fetch(lyricsUrl)
      .then((response) => response.ok ? response.text() : "")
      .then((text) => {
        if (!active || !text) return;
        const parsed = parseLrcEntries(text);
        if (parsed.length > 0) {
          setLoadedLyrics({ url: lyricsUrl, entries: parsed });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [track?.lyricsUrl]);

  useEffect(() => {
    const videoId = track?.youtubeId;
    const mount = youtubeMountRef.current;
    if (!videoId || !expanded || !mount) return;

    let active = true;

    loadYouTubeIframeApi().then(() => {
      if (!active || !window.YT?.Player || !youtubeMountRef.current) return;

      youtubePlayerRef.current = new window.YT.Player(youtubeMountRef.current, {
        videoId,
        width: "100%",
        height: 200,
        playerVars: {
          controls: 1,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (!active) return;
            youtubePlayerRef.current = event.target;
            setAudioNote(null);
            if (pendingYoutubePlayRef.current) {
              pendingYoutubePlayRef.current = false;
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.PLAYING) setPlaying(true);
            if (event.data === state.PAUSED || event.data === state.CUED) setPlaying(false);
            if (event.data === state.ENDED) {
              event.target.playVideo();
            }
          },
          onError: () => {
            setAudioNote("Open on YouTube");
            setPlaying(false);
          },
        },
      });
    });

    return () => {
      active = false;
      pendingYoutubePlayRef.current = false;
      const player = youtubePlayerRef.current;
      youtubePlayerRef.current = null;
      player?.destroy();
    };
  }, [track?.youtubeId, expanded]);

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(() => {
      const youtubeTime = youtubePlayerRef.current?.getCurrentTime();
      if (typeof youtubeTime === "number") {
        setCurrentTime(youtubeTime);
        return;
      }

      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    }, 350);

    return () => window.clearInterval(interval);
  }, [playing]);

  if (!track) return null;
  const lyricEntries =
    loadedLyrics && loadedLyrics.url === track.lyricsUrl
      ? loadedLyrics.entries
      : fallbackLyrics(track.lines ?? []);
  const activeIndex = activeLyricIndex(lyricEntries, currentTime);
  const lyricWindow = visibleLyrics(lyricEntries, activeIndex);

  async function toggleMusic() {
    if (track?.youtubeId) {
      if (!expanded) setExpanded(true);

      const player = youtubePlayerRef.current;
      if (!player) {
        pendingYoutubePlayRef.current = true;
        setAudioNote("Loading player");
        return;
      }

      if (playing) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setAudioNote(null);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      setAudioNote(null);
      return;
    }

    try {
      audio.volume = 0.28;
      await audio.play();
      setPlaying(true);
      setAudioNote(null);
    } catch {
      setPlaying(false);
      setAudioNote("Add licensed audio");
    }
  }

  return (
    <div className="hud-music-card" data-playing={playing} data-expanded={expanded}>
      {track.src && !track.youtubeId && (
        <audio
          ref={audioRef}
          src={track.src}
          loop
          preload="none"
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onError={() => {
            setPlaying(false);
            setAudioNote("Add licensed audio");
          }}
        />
      )}
      <div className="hud-trackline">
        <button
          className="music-title-button"
          type="button"
          onClick={() => setSongMenuOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={songMenuOpen}
          title="Choose song"
        >
          <b>{track.title}</b>
          {track.artist && <small>{track.artist}</small>}
        </button>
        <div className="music-actions">
          <button
            className="music-toggle music-picker-toggle"
            type="button"
            onClick={() => setSongMenuOpen((current) => !current)}
            aria-label="Choose song"
            aria-expanded={songMenuOpen}
            title="Choose song"
          >
            ♪
          </button>
          <button
            className="music-toggle music-fold"
            type="button"
            onClick={() => {
              if (expanded) {
                youtubePlayerRef.current?.pauseVideo();
                pendingYoutubePlayRef.current = false;
                setPlaying(false);
              }
              setExpanded(!expanded);
            }}
            aria-label={expanded ? "Collapse music details" : "Expand music details"}
            aria-expanded={expanded}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
          <button
            className="music-toggle"
            type="button"
            onClick={toggleMusic}
            aria-label={playing ? "Mute background music" : "Play background music"}
            title={playing ? "Mute" : "Play"}
          >
            {playing ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {songMenuOpen && (
        <div className="music-song-menu" role="listbox" aria-label="Choose background song">
          {tracks.map((candidate) => {
            const key = candidate.id ?? candidate.youtubeId ?? candidate.title;
            const active = key === (track.id ?? track.youtubeId ?? track.title);

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  youtubePlayerRef.current?.pauseVideo();
                  setSelectedTrackId(key);
                  setSongMenuOpen(false);
                  setCurrentTime(0);
                  setPlaying(false);
                  setAudioNote(null);
                }}
              >
                <span>{candidate.title}</span>
                <small>{candidate.artist || "YouTube"}</small>
              </button>
            );
          })}
        </div>
      )}

      <div className="music-details" aria-hidden={!expanded}>
        {!track.youtubeId && (
          <div className="lyric-rain" aria-label={`${track.title} lyric rain`}>
            <div className="synced-lyrics">
              {lyricWindow.map(({ entry, index }) => (
                <span
                  key={`${entry.time}-${entry.text}`}
                  className={index === activeIndex ? "is-current" : ""}
                >
                  {entry.text}
                </span>
              ))}
            </div>
          </div>
        )}
        {track.youtubeUrl && (
          <a className="youtube-link" href={track.youtubeUrl} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        )}
        {audioNote && <span className="music-note">{audioNote}</span>}
      </div>

      {track.youtubeId && expanded && (
        <div className="youtube-loop-player" aria-label={`${track.title} YouTube player`}>
          <div ref={youtubeMountRef} />
        </div>
      )}
    </div>
  );
}

/* ─────────── HUD chips ─────────── */

function HudWeather({
  biome,
  weather,
  weatherByBiome,
  musicTracks,
  status,
  now,
  timeOfDay,
  onChange,
}: {
  biome: Biome;
  weather?: LiveBiomeWeather;
  weatherByBiome: Record<string, LiveBiomeWeather>;
  musicTracks: LocationTrack[];
  status: "loading" | "ready" | "error";
  now: Date | null;
  timeOfDay: TimeOfDay;
  onChange: (id: string) => void;
}) {
  const {
    className: dragClassName,
    dataDragging,
    setDragElement,
    style: dragStyle,
    handleProps,
  } = useSceneDraggable("weather-panel");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signal = weatherSignal(weather);
  const Icon =
    signal.snow || biome.effects.snow ? IconSnowflake :
    signal.thunder || biome.effects.rain === "heavy" ? IconCloudLightning :
    signal.rain || biome.effects.rain ? IconCloudRain :
    signal.cloud || biome.effects.sun === "pale" || biome.effects.sun === "tropical" ? IconCloudSun :
    IconSun;
  const timezone = weather?.resolvedLocation.timezone ?? biome.timezone;
  const localClock = now ? formatZonedClock(now, timezone) : "--:--:--";
  const almanac = buildAlmanac(now, timezone);
  const label =
    weather ? `${biome.shortName} · ${localClock}` :
    status === "error" ? "Live · unavailable" :
    "Live · syncing";
  const value = weather
    ? `${fmtTemperature(weather.current.temperatureF)} · ${weather.current.weatherLabel}`
    : biome.theme.keyFeature;
  const detail = weather
    ? `${titleCase(timeOfDay)} · ${weather.current.moon.phase} · Wind ${Math.round(weather.current.windSpeedMph)} mph`
    : "Open-Meteo";

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function setPanelRef(element: HTMLDivElement | null) {
    ref.current = element;
    setDragElement(element);
  }

  return (
    <div
      className={`hud-weather-panel ${dragClassName}`}
      data-dragging={dataDragging}
      ref={setPanelRef}
      style={dragStyle}
    >
      <button
        className="drag-handle panel-drag-handle"
        type="button"
        aria-label="Move weather panel"
        title="Move panel"
        {...handleProps}
      >
        <Move size={14} />
      </button>
      <button
        className="hud-weather"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        title={biome.blurb}
        type="button"
      >
        <span className="ico"><Icon size={18} /></span>
        <span className="meta">
          <span className="label">{label}</span>
          <span className="val">{value}</span>
          <span className="detail">{detail}</span>
        </span>
        <svg className={`chev ${open ? "open" : ""}`} width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
          <path d="M1 1.5 L6 6.5 L11 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="hud-date-parts" aria-label="Gregorian date">
        <span><b>{almanac?.gregorian.year ?? "----"}</b><small>Year</small></span>
        <span><b>{almanac?.gregorian.month ?? "---"}</b><small>Month</small></span>
        <span><b>{almanac?.gregorian.day ?? "--"}</b><small>Day</small></span>
        <span><b>{almanac?.gregorian.weekday ?? "---"}</b><small>Weekday</small></span>
      </div>

      <div className="hud-almanac" aria-label="Chinese lunar almanac">
        <span>
          <small>农历</small>
          <b>{almanac ? `${almanac.lunarDate} · ${almanac.zodiac}` : "同步中"}</b>
        </span>
        <span>
          <small>八字</small>
          <b>{almanac?.pillars.join(" ") ?? "---- -- -- --"}</b>
        </span>
      </div>

      {open && (
        <div className="biome-menu hud-weather-menu" role="listbox" aria-label="Choose location">
          {BIOMES.map((candidate) => {
            const isActive = candidate.id === biome.id;
            const candidateWeather = weatherByBiome[candidate.id];
            const optionLabel = candidateWeather
              ? `${fmtTemperature(candidateWeather.current.temperatureF)} · ${candidateWeather.current.weatherLabel}`
              : candidate.theme.label;

            return (
              <button
                key={candidate.id}
                className="biome-option"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(candidate.id);
                  setOpen(false);
                }}
                title={candidate.blurb}
                type="button"
              >
                <span className="glyph">{candidate.glyph}</span>
                <span className="label">
                  <span className="name">{candidate.shortName}</span>
                  <span className="feature">{optionLabel}</span>
                </span>
                {isActive && (
                  <svg className="tick" width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                    <path d="M1 4.5 L4.5 8 L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      <LocationMusic key={biome.id} tracks={musicTracks} />
    </div>
  );
}

function HudMark({ biome }: { biome: Biome }) {
  const {
    className: dragClassName,
    dataDragging,
    setDragElement,
    style: dragStyle,
    handleProps,
  } = useSceneDraggable("garden-mark");

  return (
    <div
      className={`hud-mark ${dragClassName}`}
      data-dragging={dataDragging}
      ref={setDragElement}
      style={dragStyle}
    >
      <button
        className="drag-handle mark-drag-handle"
        type="button"
        aria-label="Move title panel"
        title="Move panel"
        {...handleProps}
      >
        <Move size={13} />
      </button>
      <span className="wm">Four Seasons <em>Garden</em></span>
      <span className="rule" />
      <span className="tag">
        {fmtCoord(biome.coords.lat, "N", "S")} · {fmtCoord(biome.coords.lon, "E", "W")}
      </span>
    </div>
  );
}

function BiomeEffects({
  biome,
  weather,
}: {
  biome: Biome;
  weather?: LiveBiomeWeather;
}) {
  const e = biome.effects;
  const signal = weatherSignal(weather);
  const rainIntensity = liveRainIntensity(weather) ?? e.rain;
  const mistDensity =
    weather?.current.weatherCode !== undefined && [45, 48].includes(weather.current.weatherCode)
      ? "heavy"
      : e.mist;
  return (
    <>
      {e.aurora && <Aurora />}
      {e.rainbow && <Rainbow />}
      {mistDensity && <Mist density={mistDensity} />}
      {rainIntensity && <Rain intensity={rainIntensity} />}
      {(signal.snow || e.snow) && <Snow />}
      {e.blossoms && <Blossoms kind={e.blossoms} />}
      {(signal.thunder || biome.id === "hualien") && <LightningFlash />}
    </>
  );
}

function GardenHotspot({ place }: { place: GardenPlace }) {
  const {
    className: dragClassName,
    dataDragging,
    setDragElement,
    style: dragStyle,
    handleProps,
  } = useSceneDraggable(`place-link:${place.href}`);

  return (
    <div
      className={`garden-hotspot ${place.className} ${dragClassName}`}
      data-dragging={dataDragging}
      ref={setDragElement}
      style={dragStyle}
    >
      <Link href={place.href} className="garden-hotspot-link">
        <span className="pulse" />
        <span className="hotspot-label">{place.label}</span>
      </Link>
      <button
        className="drag-handle hotspot-drag-handle"
        type="button"
        aria-label={`Move ${place.label} link`}
        title="Move link"
        {...handleProps}
      >
        <Move size={12} />
      </button>
    </div>
  );
}

function GardenHotspots() {
  return (
    <nav className="garden-hotspots" aria-label="Garden places">
      {GARDEN_PLACES.map((place) => (
        <GardenHotspot key={place.href} place={place} />
      ))}
    </nav>
  );
}

/* ─────────── Page ─────────── */

export default function Page() {
  const [biomeId, setBiomeId] = useState<string>(DEFAULT_BIOME_ID);
  const [weatherByBiome, setWeatherByBiome] = useState<Record<string, LiveBiomeWeather>>({});
  const [musicByBiome, setMusicByBiome] = useState<Record<string, LocationTrack[]>>({});
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "error">("loading");
  const now = usePreciseClock();
  const biome = useMemo(() => getBiome(biomeId), [biomeId]);
  const weather = weatherByBiome[biome.id];
  const activeMusicTracks = musicByBiome[biome.id] ?? FALLBACK_LOCATION_TRACKS[biome.id] ?? [];
  const timeOfDay = liveTimeOfDay(weather, now);
  const currentWeatherKind = weatherKind(weather);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        setWeatherStatus((current) => current === "ready" ? current : "loading");
        const response = await fetch("/api/weather");
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        const payload = (await response.json()) as BiomeWeatherPayload;
        if (!active) return;
        setWeatherByBiome(payload.weather);
        setWeatherStatus("ready");
      } catch (error) {
        if (!active) return;
        console.error("[Four Seasons Garden] weather unavailable", error);
        setWeatherStatus("error");
      }
    }

    loadWeather();
    const refresh = window.setInterval(loadWeather, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMusic() {
      try {
        const response = await fetch("/api/music/playlists");
        if (!response.ok) throw new Error(`Music request failed: ${response.status}`);
        const payload = (await response.json()) as { byBiome?: Record<string, LocationTrack[]> };
        if (active && payload.byBiome) setMusicByBiome(payload.byBiome);
      } catch (error) {
        console.error("[Four Seasons Garden] music playlists unavailable", error);
      }
    }

    loadMusic();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Per the brief: log active biome on change
    console.log("[Four Seasons Garden] biome →", biome.id, biome);
  }, [biome]);

  const showPond = biome.id === "williamsburg" || biome.id === "akureyri";
  const showFireflies =
    biome.effects.fireflies ||
    timeOfDay === "dusk" ||
    timeOfDay === "evening" ||
    timeOfDay === "night";

  return (
    <div
      className="scene"
      style={paletteStyle(biome)}
      data-biome={biome.id}
      data-time={timeOfDay}
      data-weather={currentWeatherKind}
      data-moon={weather?.current.moon.phaseKey ?? "unknown"}
    >
      <div className="canvas">

        {/* Z-10 Background */}
        <div className="layer-bg background-dof">
          <div className="skyhills-wrap"><SkyHills /></div>
        </div>
        <div className="haze" />
        <div className="time-wash" />
        <div className="moon-glow" />

        {/* Z-20 Midground */}
        <div className="layer-mid midground-dof">
          <div className="cottage-wrap">
            <Cottage wisteria />
            <span className="smoke-puff" style={{ left: "64%", top: "4%", animationDelay: "0s"  }} />
            <span className="smoke-puff" style={{ left: "66%", top: "4%", animationDelay: "-2s" }} />
            <span className="smoke-puff" style={{ left: "62%", top: "4%", animationDelay: "-4s" }} />
          </div>

          <div className="fence-wrap"><PicketFence /></div>
          <div className="path-wrap"><StonePath /></div>
          <div className="greenhouse-wrap right"><Greenhouse /></div>
          <div className="veggies-wrap"><VegetablePatch /></div>
          <div className="wildflowers-wrap left"><WildflowerDrift variant="left" /></div>
          <div className="wildflowers-wrap mid"><WildflowerDrift variant="right" /></div>
        </div>

        {showPond && <div className="pond-band" />}

        {showFireflies && (
          <div className="fireflies" style={{ opacity: 1 }}>
            {FIREFLIES.map((firefly, i) => (
              <span key={i} className="firefly"
                    style={{
                      left: firefly.left,
                      top: firefly.top,
                      ["--dx" as string]: firefly.dx,
                      ["--dy" as string]: firefly.dy,
                      ["--dur" as string]: firefly.dur,
                      ["--delay" as string]: firefly.delay,
                    } as CSSProperties} />
            ))}
          </div>
        )}

        {/* Per-biome weather */}
        <BiomeEffects biome={biome} weather={weather} />

        {/* Vignette + paper grain */}
        <div className="vignette" />
        <PaperGrain />

        {/* Z-70 HUD */}
        <div className="layer-hud">
          <GardenHotspots />
          <HudMark biome={biome} />
          <HudWeather
            biome={biome}
            weather={weather}
            weatherByBiome={weatherByBiome}
            musicTracks={activeMusicTracks}
            status={weatherStatus}
            now={now}
            timeOfDay={timeOfDay}
            onChange={setBiomeId}
          />
        </div>
      </div>
    </div>
  );
}
