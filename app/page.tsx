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

function HudWeather({ biome }: { biome: Biome }) {
  const Icon =
    biome.effects.snow ? IconSnowflake :
    biome.effects.rain === "heavy" ? IconCloudLightning :
    biome.effects.rain ? IconCloudRain :
    biome.effects.sun === "pale" ? IconCloudSun :
    biome.effects.sun === "tropical" ? IconCloudSun :
    IconSun;
  return (
    <div className="hud-weather">
      <div className="ico"><Icon size={18} /></div>
      <div className="meta">
        <span className="label">The garden · live</span>
        <span className="val">{biome.theme.keyFeature}</span>
      </div>
    </div>
  );
}

function BiomeEffects({ biome }: { biome: Biome }) {
  const e = biome.effects;
  return (
    <>
      {e.aurora && <Aurora />}
      {e.rainbow && <Rainbow />}
      {e.mist && <Mist density={e.mist} />}
      {e.rain && <Rain intensity={e.rain} />}
      {e.snow && <Snow />}
      {e.blossoms && <Blossoms kind={e.blossoms} />}
      {biome.id === "hualien" && <LightningFlash />}
    </>
  );
}

/* ─────────── Page ─────────── */

export default function Page() {
  const [biomeId, setBiomeId] = useState<string>(DEFAULT_BIOME_ID);
  const biome = useMemo(() => getBiome(biomeId), [biomeId]);

  useEffect(() => {
    // Per the brief: log active biome on change
    console.log("[Four Seasons Garden] biome →", biome.id, biome);
  }, [biome]);

  const showPond = biome.id === "williamsburg" || biome.id === "akureyri";
  const showFireflies = biome.effects.fireflies;

  return (
    <div className="scene" style={paletteStyle(biome)} data-biome={biome.id}>
      <div className="canvas">

        {/* Z-10 Background */}
        <div className="layer-bg background-dof">
          <div className="skyhills-wrap"><SkyHills /></div>
        </div>
        <div className="haze" />

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
        <BiomeEffects biome={biome} />

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
          <HudWeather biome={biome} />
          <BiomeHud activeId={biome.id} onChange={setBiomeId} />
        </div>
      </div>
    </div>
  );
}
