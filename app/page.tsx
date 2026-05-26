"use client";
/* Four Seasons Garden — app/page.tsx
   Watercolor cottage scene composed of layered SVG primitives, re-skinned
   per biome via CSS variables, plus per-biome weather particle effects. */

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

/* ─────────── Biome dropdown ─────────── */

function BiomeHud({
  activeId, onChange,
}: { activeId: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = getBiome(activeId);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hud-biomes" ref={ref}>
      <button className="biome-trigger" aria-haspopup="listbox" aria-expanded={open}
              onClick={() => setOpen((o) => !o)} title={active.blurb}>
        <span className="glyph">{active.glyph}</span>
        <span className="label">
          <span className="name">{active.shortName}</span>
          <span className="feature">{active.theme.label}</span>
        </span>
        <svg className={`chev ${open ? "open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="biome-menu" role="listbox" aria-label="Choose biome">
          {BIOMES.map((b) => {
            const isActive = b.id === activeId;
            return (
              <button key={b.id} className="biome-option" role="option"
                      aria-selected={isActive}
                      onClick={() => { onChange(b.id); setOpen(false); }}
                      title={b.blurb}>
                <span className="glyph">{b.glyph}</span>
                <span className="label">
                  <span className="name">{b.shortName}</span>
                  <span className="feature">{b.theme.label}</span>
                </span>
                {isActive && (
                  <svg className="tick" width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4.5 L4.5 8 L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── HUD chips ─────────── */

function HudWeather({
  biome,
  weather,
  status,
  now,
  timeOfDay,
}: {
  biome: Biome;
  weather?: LiveBiomeWeather;
  status: "loading" | "ready" | "error";
  now: Date | null;
  timeOfDay: TimeOfDay;
}) {
  const signal = weatherSignal(weather);
  const Icon =
    signal.snow || biome.effects.snow ? IconSnowflake :
    signal.thunder || biome.effects.rain === "heavy" ? IconCloudLightning :
    signal.rain || biome.effects.rain ? IconCloudRain :
    signal.cloud || biome.effects.sun === "pale" || biome.effects.sun === "tropical" ? IconCloudSun :
    IconSun;
  const timezone = weather?.resolvedLocation.timezone ?? biome.timezone;
  const localClock = now ? formatZonedClock(now, timezone) : "--:--:--";
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

  return (
    <div className="hud-weather">
      <div className="ico"><Icon size={18} /></div>
      <div className="meta">
        <span className="label">{label}</span>
        <span className="val">{value}</span>
        <span className="detail">{detail}</span>
      </div>
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
            status={weatherStatus}
            now={now}
            timeOfDay={timeOfDay}
          />
          <BiomeHud activeId={biome.id} onChange={setBiomeId} />
        </div>
      </div>
    </div>
  );
}
