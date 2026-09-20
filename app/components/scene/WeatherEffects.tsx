"use client";
/* Four Seasons Garden — WeatherEffects.tsx
   Per-biome particle systems: rain, snow, cherry blossoms, mist, aurora,
   rainbow, lightning. Each renders only when its biome turns it on. */

import { useMemo } from "react";
import type { CSSProperties } from "react";

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

/* ─────────── Rain ─────────── */

export function Rain({ intensity = "mild" }: { intensity?: "mild" | "heavy" | "shower" }) {
  const drops = useMemo(() => {
    const rand = seededRandom({ mild: 1101, heavy: 1102, shower: 1103 }[intensity]);
    const count = intensity === "heavy" ? 110 : intensity === "shower" ? 40 : 70;
    return Array.from({ length: count }).map(() => ({
      left:  rand() * 100,
      top:   rand() * 100,
      dur:   (rand() * 0.4 + 0.6).toFixed(2),
      delay: (-rand() * 2).toFixed(2),
      len:   12 + rand() * 16,
      opacity: 0.25 + rand() * 0.35,
    }));
  }, [intensity]);
  return (
    <div className="fx fx-rain" data-intensity={intensity}>
      {drops.map((d, i) => (
        <span key={i} className="raindrop"
              style={{
                left: d.left + "%",
                top: d.top + "%",
                height: d.len + "px",
                opacity: d.opacity,
                animationDuration: d.dur + "s",
                animationDelay: d.delay + "s",
              }} />
      ))}
    </div>
  );
}

/* ─────────── Snow ─────────── */

export function Snow({ count = 70 }: { count?: number }) {
  const flakes = useMemo(() => {
    const rand = seededRandom(2200 + count);
    return Array.from({ length: count }).map(() => {
      return {
        left:  rand() * 100,
        r:     1 + rand() * 2.5,
        dur:   8 + rand() * 10,
        delay: -rand() * 12,
        drift: (rand() - 0.5) * 40,
        opacity: 0.5 + rand() * 0.45,
      };
    });
  }, [count]);
  return (
    <div className="fx fx-snow">
      {flakes.map((f, i) => (
        <span key={i} className="snowflake"
              style={{
                left: f.left + "%",
                width:  (f.r * 2) + "px",
                height: (f.r * 2) + "px",
                opacity: f.opacity,
                animationDuration: f.dur + "s",
                animationDelay: f.delay + "s",
                ["--drift" as string]: f.drift + "px",
              } as CSSProperties} />
      ))}
    </div>
  );
}

/* ─────────── Blossom petals (cherry / maple / plumeria) ─────────── */

export function Blossoms({
  kind = "cherry", count = 36,
}: { kind?: "cherry" | "maple" | "plumeria"; count?: number }) {
  const petals = useMemo(() => {
    const palettes = {
      maple: ["#d96b3c", "#e08858", "#c45438", "#f0a878"],
      plumeria: ["#fff4e0", "#ffd09a", "#ffbb70", "#fff1d4"],
      cherry: ["#fbd1d8", "#f6b0bc", "#e88da0", "#ffe4ea"],
    };
    const rand = seededRandom({ cherry: 3301, maple: 3302, plumeria: 3303 }[kind] + count);
    const palette = palettes[kind];
    return Array.from({ length: count }).map((_, i) => ({
      left:  rand() * 100,
      size:  6 + rand() * 7,
      dur:   10 + rand() * 10,
      delay: -rand() * 14,
      drift: (rand() - 0.5) * 80,
      rot:   rand() * 360,
      color: palette[i % palette.length],
      opacity: 0.65 + rand() * 0.3,
    }));
  }, [count, kind]);
  return (
    <div className="fx fx-blossoms" data-kind={kind}>
      {petals.map((p, i) => (
        <span key={i} className={`petal petal-${kind}`}
              style={{
                left: p.left + "%",
                width:  p.size + "px",
                height: p.size + "px",
                background: p.color,
                opacity: p.opacity,
                animationDuration: p.dur + "s",
                animationDelay: p.delay + "s",
                ["--drift" as string]: p.drift + "px",
                ["--rot"   as string]: p.rot + "deg",
              } as CSSProperties} />
      ))}
    </div>
  );
}

/* ─────────── Rolling mist ─────────── */

export function Mist({ density = "light" }: { density?: "light" | "heavy" }) {
  const heavy = density === "heavy";
  return (
    <div className="fx fx-mist" data-density={density}>
      <div className="mist-band band-a" />
      <div className="mist-band band-b" />
      {heavy && <div className="mist-band band-c" />}
      {heavy && <div className="mist-band band-d" />}
    </div>
  );
}

/* ─────────── Aurora ribbons ─────────── */

export function Aurora() {
  return (
    <svg className="fx fx-aurora" width="100%" height="55%"
         preserveAspectRatio="none" viewBox="0 0 1200 400">
      <defs>
        <linearGradient id="aur-a" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#7ce6b6" stopOpacity="0" />
          <stop offset="45%"  stopColor="#9affc8" stopOpacity=".7" />
          <stop offset="100%" stopColor="#5aa8f0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aur-b" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#c8a6ff" stopOpacity="0" />
          <stop offset="50%"  stopColor="#d2bfff" stopOpacity=".55" />
          <stop offset="100%" stopColor="#82d1ff" stopOpacity="0" />
        </linearGradient>
        <filter id="aur-blur"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <g filter="url(#aur-blur)" style={{ mixBlendMode: "screen" }}>
        <path d="M-50,180 Q200,80  480,160 Q740,240 1040,120 Q1280,40  1300,180 L1300,360 L-50,360 Z" fill="url(#aur-a)" />
        <path d="M-50,240 Q220,140 520,200 Q800,260 1080,180 Q1280,120 1300,240 L1300,380 L-50,380 Z" fill="url(#aur-b)" />
      </g>
    </svg>
  );
}

/* ─────────── Sun-shower rainbow ─────────── */

export function Rainbow() {
  return (
    <svg className="fx fx-rainbow" preserveAspectRatio="xMidYMid meet"
         viewBox="-100 -10 1320 700" width="100%" height="100%">
      <defs>
        <filter id="rb-blur"><feGaussianBlur stdDeviation="4.5" /></filter>
      </defs>
      <g style={{ mixBlendMode: "screen", opacity: 0.55 }} filter="url(#rb-blur)">
        {([
          ["#f08070", 460],
          ["#f3b06a", 446],
          ["#f5e08a", 432],
          ["#a8d68a", 418],
          ["#7ec0d6", 404],
          ["#8aa6d6", 390],
          ["#a896d6", 376],
        ] as Array<[string, number]>).map(([color, r], i) => (
          <path key={i}
                d={`M${-60} 600 A ${r} ${r * 0.95} 0 0 1 ${1260} 600`}
                stroke={color} strokeWidth="9" fill="none" opacity={0.6 - i * 0.03} />
        ))}
      </g>
    </svg>
  );
}

/* ─────────── Lightning flash ─────────── */

export function LightningFlash() {
  return <div className="fx fx-lightning" />;
}
