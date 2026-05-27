"use client";
/* Four Seasons Garden — app/page.tsx
   Watercolor cottage scene composed of layered SVG primitives, re-skinned
   per biome via CSS variables, plus per-biome weather particle effects. */

import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { Solar } from "lunar-typescript";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

type LocationTrack = {
  title: string;
  artist: string;
  src?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  lyricsUrl?: string;
  lines: string[];
};

const LOCATION_TRACKS: Partial<Record<string, LocationTrack>> = {
  akureyri: {
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
  },
};

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

function youtubeEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    rel: "0",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function parseLrcLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\[\d{2}:\d{2}(?:\.\d{2})?\]/, "").trim())
    .filter(Boolean);
}

function LocationMusic({ track }: { track?: LocationTrack }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [loadedLyrics, setLoadedLyrics] = useState<{ url: string; lines: string[] } | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  useEffect(() => {
    let active = true;

    if (!track?.lyricsUrl) return;

    fetch(track.lyricsUrl)
      .then((response) => response.ok ? response.text() : "")
      .then((text) => {
        if (!active || !text) return;
        const parsed = parseLrcLines(text);
        if (parsed.length > 0 && track.lyricsUrl) {
          setLoadedLyrics({ url: track.lyricsUrl, lines: parsed });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [track]);

  if (!track) return null;
  const displayLines =
    loadedLyrics && loadedLyrics.url === track.lyricsUrl
      ? loadedLyrics.lines
      : track.lines;

  async function toggleMusic() {
    if (track?.youtubeId) {
      setPlaying((current) => !current);
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
    <div className="hud-music-card" data-playing={playing}>
      {track.src && !track.youtubeId && (
        <audio
          ref={audioRef}
          src={track.src}
          loop
          preload="none"
          onEnded={() => setPlaying(false)}
          onError={() => {
            setPlaying(false);
            setAudioNote("Add licensed audio");
          }}
        />
      )}
      <div className="hud-trackline">
        <div>
          <small>Background music</small>
          <b>{track.title} · {track.artist}</b>
        </div>
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
      <div className="lyric-rain" aria-label={`${track.title} lyric rain`}>
        <div className="lyric-rain-track">
          {[...displayLines, ...displayLines].map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </div>
      </div>
      {playing && track.youtubeId && (
        <iframe
          className="youtube-loop-player"
          src={youtubeEmbedUrl(track.youtubeId)}
          title={`${track.title} - ${track.artist}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
      {track.youtubeUrl && (
        <a className="youtube-link" href={track.youtubeUrl} target="_blank" rel="noreferrer">
          Open on YouTube
        </a>
      )}
      {audioNote && <span className="music-note">{audioNote}</span>}
    </div>
  );
}

/* ─────────── HUD chips ─────────── */

function HudWeather({
  biome,
  weather,
  weatherByBiome,
  status,
  now,
  timeOfDay,
  onChange,
}: {
  biome: Biome;
  weather?: LiveBiomeWeather;
  weatherByBiome: Record<string, LiveBiomeWeather>;
  status: "loading" | "ready" | "error";
  now: Date | null;
  timeOfDay: TimeOfDay;
  onChange: (id: string) => void;
}) {
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
  const track = LOCATION_TRACKS[biome.id];
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

  return (
    <div className="hud-weather-panel" ref={ref}>
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

      <LocationMusic key={track?.src ?? "silent"} track={track} />
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

function GardenHotspots() {
  return (
    <nav className="garden-hotspots" aria-label="Garden places">
      {GARDEN_PLACES.map((place) => (
        <Link
          key={place.href}
          href={place.href}
          className={`garden-hotspot ${place.className}`}
        >
          <span className="pulse" />
          <span className="hotspot-label">{place.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ─────────── Page ─────────── */

export default function Page() {
  const [biomeId, setBiomeId] = useState<string>(DEFAULT_BIOME_ID);
  const [weatherByBiome, setWeatherByBiome] = useState<Record<string, LiveBiomeWeather>>({});
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "error">("loading");
  const now = usePreciseClock();
  const biome = useMemo(() => getBiome(biomeId), [biomeId]);
  const weather = weatherByBiome[biome.id];
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
          <div className="hud-mark">
            <span className="wm">Four Seasons <em>Garden</em></span>
            <span className="rule" />
            <span className="tag">
              {fmtCoord(biome.coords.lat, "N", "S")} · {fmtCoord(biome.coords.lon, "E", "W")}
            </span>
          </div>
          <HudWeather
            biome={biome}
            weather={weather}
            weatherByBiome={weatherByBiome}
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
