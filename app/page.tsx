"use client";
/* Four Seasons Garden — app/page.tsx
   Watercolor cottage scene composed of layered SVG primitives, re-skinned
   per biome via CSS variables, plus per-biome weather particle effects.

   Supporting logic lives outside this file: the music player and lyric-study
   modal in ./components, and the pure helpers in @/lib (time, weather display,
   drag persistence). */

import Link from "next/link";
import { Move } from "lucide-react";
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
  DEFAULT_MUSIC_BY_BIOME,
  type LocationTrack,
  type MusicByBiome,
} from "@/lib/music/tracks";
import { buildAlmanac, formatZonedClock } from "@/lib/time/almanac";
import {
  formatCoord,
  formatTemperature,
  liveRainIntensity,
  liveTimeOfDay,
  titleCase,
  weatherKind,
  weatherSignal,
} from "@/lib/weather/display";
import { usePreciseClock } from "@/lib/ui/usePreciseClock";
import { useSceneDraggable } from "@/lib/ui/useSceneDraggable";
import { LocationMusic } from "./components/LocationMusic";
import {
  SkyHills, Cottage, StonePath, Greenhouse, WildflowerDrift,
  VegetablePatch, PicketFence, PaperGrain,
  IconSun, IconCloudSun, IconCloudRain, IconCloudLightning, IconSnowflake,
} from "./components/SceneArt";
import {
  Rain, Snow, Blossoms, Mist, Aurora, Rainbow, LightningFlash,
} from "./components/WeatherEffects";

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
    ? `${formatTemperature(weather.current.temperatureF)} · ${weather.current.weatherLabel}`
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
              ? `${formatTemperature(candidateWeather.current.temperatureF)} · ${candidateWeather.current.weatherLabel}`
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
        {formatCoord(biome.coords.lat, "N", "S")} · {formatCoord(biome.coords.lon, "E", "W")}
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
  const [musicByBiome, setMusicByBiome] = useState<MusicByBiome>({});
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "error">("loading");
  const now = usePreciseClock();
  const biome = useMemo(() => getBiome(biomeId), [biomeId]);
  const weather = weatherByBiome[biome.id];
  const activeMusicTracks = musicByBiome[biome.id] ?? DEFAULT_MUSIC_BY_BIOME[biome.id] ?? [];
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
        const payload = (await response.json()) as { byBiome?: MusicByBiome };
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
