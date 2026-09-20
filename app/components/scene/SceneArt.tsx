"use client";
/* Four Seasons Garden — SceneArt.tsx
   Hand-painted cottage garden built from layered SVG washes + displacement
   filters. Every primitive carries its own filter id (useId) so the wobble
   doesn't look uniform. Re-skinned via CSS variables set on the .scene root. */

import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";

/* ─────────── Shared filter helpers ─────────── */

function WatercolorDefs({
  id, seed = 3, scale = 6, freq = 0.018,
}: { id: string; seed?: number; scale?: number; freq?: number }) {
  return (
    <defs>
      <filter
        id={id}
        x="-15%" y="-15%" width="130%" height="130%"
        filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse"
      >
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}

function Washed({
  wash, blur = 5, children,
}: { wash: string; blur?: number; children: ReactNode }) {
  return (
    <g>
      <g style={{ filter: `blur(${blur}px)`, opacity: 0.55, mixBlendMode: "multiply" }}>
        <g style={{ color: wash }}>{children}</g>
      </g>
      {children}
    </g>
  );
}

/* ─────────── Z-10 Sky / hills ─────────── */

export function SkyHills() {
  const fid = useId();
  const cloud = useId();
  const sun = useId();
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         width="100%" height="100%" style={{ display: "block" }}>
      <WatercolorDefs id={fid} seed={11} scale={14} freq={0.012} />
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="var(--sky-top)" />
          <stop offset="55%" stopColor="var(--sky-mid)" />
          <stop offset="100%" stopColor="var(--sky-low)" />
        </linearGradient>
        <radialGradient id={sun} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="var(--sun-warm)" stopOpacity=".95" />
          <stop offset="60%" stopColor="var(--sun-warm)" stopOpacity=".25" />
          <stop offset="100%" stopColor="var(--sun-warm)" stopOpacity="0" />
        </radialGradient>
        <filter id={cloud} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />
      <circle cx="1180" cy="320" r="280" fill={`url(#${sun})`} />

      <g filter={`url(#${cloud})`} fill="var(--cloud)" opacity=".85">
        <ellipse cx="280"  cy="180" rx="170" ry="32" />
        <ellipse cx="380"  cy="160" rx="120" ry="22" />
        <ellipse cx="950"  cy="140" rx="200" ry="28" />
        <ellipse cx="1050" cy="170" rx="120" ry="20" />
        <ellipse cx="640"  cy="220" rx="100" ry="14" opacity=".7" />
      </g>

      <g filter={`url(#${fid})`}>
        <g style={{ mixBlendMode: "multiply" }}>
          <path d="M-50,640 Q160,560 360,600 Q540,620 720,560 Q900,500 1120,560 Q1320,620 1660,580 L1660,900 L-50,900 Z"
                fill="var(--hill-far)"  opacity=".4" style={{ filter: "blur(12px)" }} />
          <path d="M-50,700 Q200,640 420,660 Q620,680 820,620 Q1020,560 1220,620 Q1420,680 1660,640 L1660,900 L-50,900 Z"
                fill="var(--hill-mid)"  opacity=".45" style={{ filter: "blur(10px)" }} />
          <path d="M-50,760 Q260,700 520,720 Q780,740 1040,700 Q1300,660 1660,710 L1660,900 L-50,900 Z"
                fill="var(--hill-near)" opacity=".5"  style={{ filter: "blur(8px)" }} />
        </g>
        <path d="M-50,640 Q160,560 360,600 Q540,620 720,560 Q900,500 1120,560 Q1320,620 1660,580 L1660,900 L-50,900 Z"
              fill="var(--hill-far)" opacity=".82" />
        <path d="M-50,700 Q200,640 420,660 Q620,680 820,620 Q1020,560 1220,620 Q1420,680 1660,640 L1660,900 L-50,900 Z"
              fill="var(--hill-mid)" opacity=".88" />
        <path d="M-50,760 Q260,700 520,720 Q780,740 1040,700 Q1300,660 1660,710 L1660,900 L-50,900 Z"
              fill="var(--hill-near)" opacity=".94" />
        <path d="M-50,768 Q260,710 520,730 Q780,750 1040,710 Q1300,672 1660,720 L1660,778 Q1300,720 1040,758 Q780,792 520,768 Q260,752 -50,810 Z"
              fill="#3a4030" opacity=".12" style={{ filter: "blur(6px)" }} />
      </g>

      <g filter={`url(#${fid})`} fill="var(--tree-far)" opacity=".55">
        {Array.from({ length: 28 }).map((_, i) => {
          const x = -40 + i * 60 + (i % 3) * 12;
          const h = 22 + (i % 5) * 6;
          return <ellipse key={i} cx={x} cy={702 - h * 0.35} rx={14 + (i % 3) * 3} ry={h} />;
        })}
      </g>
    </svg>
  );
}

/* ─────────── Cottage ─────────── */

export function Cottage({ wisteria = true }: { wisteria?: boolean }) {
  const fid = useId();
  const win = useId();
  return (
    <svg viewBox="0 0 360 280" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={23} scale={8} freq={0.022} />
      <defs>
        <radialGradient id={win} cx="50%" cy="50%" r="55%">
          <stop offset="0%"  stopColor="var(--window-glow)" stopOpacity=".98" />
          <stop offset="70%" stopColor="var(--window-glow)" stopOpacity=".75" />
          <stop offset="100%" stopColor="var(--window-glow)" stopOpacity=".4" />
        </radialGradient>
      </defs>

      <ellipse cx="180" cy="170" rx="200" ry="80"
               fill="var(--window-glow)" opacity=".25"
               style={{ filter: "blur(28px)" }} />

      <g filter={`url(#${fid})`}>
        <g fill="var(--cloud)" opacity=".75" style={{ filter: "blur(6px)" }}>
          <ellipse cx="245" cy="44" rx="14" ry="8" />
          <ellipse cx="258" cy="22" rx="20" ry="9" />
          <ellipse cx="240" cy="8"  rx="26" ry="9" />
        </g>

        <Washed wash="var(--wall-wash)" blur={6}>
          <path d="M70,265 L70,150 Q70,142 78,140 L282,140 Q290,142 290,150 L290,265 Z" fill="var(--wall)" />
        </Washed>

        <g stroke="var(--beam)" strokeWidth="0.5" opacity=".22" strokeLinecap="round">
          {[160, 174, 188, 202, 218, 234, 250].map((y, i) => (
            <line key={`h${i}`} x1="74" y1={y} x2="288" y2={y + (i % 2 ? -1 : 1)} />
          ))}
          {Array.from({ length: 9 }).map((_, i) => {
            const baseX = 90 + i * 22 + (i % 2) * 11;
            return [148, 178, 208, 238].map((y, j) => (
              <line key={`v${i}-${j}`}
                    x1={baseX + (j % 2) * 11} y1={y}
                    x2={baseX + (j % 2) * 11} y2={y + 14} />
            ));
          })}
        </g>
        <g opacity=".18" fill="var(--beam)">
          {[
            [98, 164, 18, 7], [148, 192, 22, 7], [232, 158, 16, 6],
            [104, 220, 14, 6], [258, 226, 18, 7], [196, 250, 24, 7],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="1.5" />
          ))}
        </g>

        <Washed wash="var(--thatch-wash)" blur={7}>
          <path d="M48,158 Q60,118 100,98 Q180,52 260,98 Q300,118 312,158 Q300,164 280,160 Q180,148 80,160 Q60,164 48,158 Z"
                fill="var(--thatch)" />
        </Washed>

        <g stroke="var(--thatch-shadow)" strokeWidth="1.2" fill="none" opacity=".55" strokeLinecap="round">
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 60 + i * 12;
            const y0 = 158 - Math.sin((i / 22) * Math.PI) * 60;
            return <path key={i} d={`M${x},${y0} Q${x + 2},${y0 + 14} ${x - 1},${y0 + 28}`} />;
          })}
        </g>

        <rect x="232" y="60" width="22" height="44" fill="var(--brick)" />
        <rect x="228" y="56" width="30" height="8"  fill="var(--brick-dark)" />

        <g>
          <rect x="148" y="180" width="64" height="60" rx="3" fill={`url(#${win})`} />
          <rect x="148" y="180" width="64" height="60" rx="3" fill="none"
                stroke="var(--beam)" strokeWidth="2.2" />
          <line x1="180" y1="180" x2="180" y2="240" stroke="var(--beam)" strokeWidth="1.6" />
          <line x1="148" y1="210" x2="212" y2="210" stroke="var(--beam)" strokeWidth="1.6" />
          <circle cx="158" cy="240" r="4" fill="var(--leaf-deep)" />
          <circle cx="170" cy="240" r="3" fill="var(--leaf-deep)" />
          <circle cx="202" cy="240" r="5" fill="var(--leaf-deep)" />
        </g>

        <rect x="98"  y="200" width="34" height="65" rx="2" fill="var(--beam)" />
        <rect x="100" y="202" width="30" height="61" rx="2" fill="var(--door-warm)" />
        <circle cx="124" cy="234" r="1.6" fill="var(--brass)" />

        <g>
          {[[82,250],[88,235],[78,222],[86,208],[80,194],[88,180],[82,168],[90,156]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3.6" fill="var(--rose-deep)" />
              <circle cx={cx - 1.5} cy={cy - 1.2} r="1.8" fill="var(--rose-pale)" opacity=".9" />
            </g>
          ))}
          {[[78,245],[92,230],[76,215],[90,200],[78,184],[92,170]].map(([cx, cy], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx="3" ry="1.6" fill="var(--leaf-cottage)" opacity=".9"
                     transform={`rotate(${i % 2 ? -28 : 28} ${cx} ${cy})`} />
          ))}
        </g>

        {wisteria && (
          <g>
            <path d="M276,160 Q260,164 244,176 Q228,194 218,212 Q210,228 212,244"
                  stroke="#4a3a2c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".75" />
            <path d="M280,160 Q288,170 286,184 Q280,200 270,212"
                  stroke="#4a3a2c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".75" />
            {[[260,168],[248,176],[236,188],[224,200],[218,220],[216,240],
              [284,170],[282,186],[276,200],[270,214]].map(([cx, cy], i) => (
              <g key={`wl${i}`}>
                <ellipse cx={cx} cy={cy} rx="5" ry="2.4" fill="var(--leaf-cottage)"
                         transform={`rotate(${(i * 47) % 90 - 45} ${cx} ${cy})`} />
                <ellipse cx={cx + 4} cy={cy + 2} rx="3.5" ry="1.6" fill="var(--leaf-fresh)" opacity=".9"
                         transform={`rotate(${(i * 31) % 90 - 45} ${cx + 4} ${cy + 2})`} />
              </g>
            ))}
            {[[252,178],[232,200],[216,222],[266,196],[280,184]].map(([rx, ry], i) => (
              <g key={`wr${i}`} className="sway-2"
                 style={{
                   transformOrigin: `${rx}px ${ry}px`,
                   animationDuration: `${4 + i * 0.6}s`,
                   animationDelay: `${-i * 0.7}s`,
                 }}>
                {Array.from({ length: 7 + (i % 3) }).map((_, k) => {
                  const dy = k * 4.5;
                  const r  = 2.5 - k * 0.18;
                  const hue = k > 3 ? "#7a6aa0" : "#a18ec4";
                  return (
                    <g key={k}>
                      <circle cx={rx + (k % 2 ? 1 : -1)} cy={ry + dy} r={r} fill={hue} />
                      <circle cx={rx + (k % 2 ? 1 : -1) - 0.5} cy={ry + dy - 0.5} r={r * 0.5}
                              fill="#cbb8e2" opacity=".85" />
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        )}

        <path d="M62,267 Q120,260 180,265 Q240,260 298,267 L298,275 L62,275 Z"
              fill="var(--leaf-cottage)" opacity=".85" />
      </g>
    </svg>
  );
}

/* ─────────── Stone path ─────────── */

export function StonePath() {
  const fid = useId();
  const stones: Array<[number, number, number, number]> = [
    [300,  20,  9,  6], [314,  44, 10, 6], [298,  68, 12, 7], [312,  94, 14, 8],
    [294, 122, 16, 9], [310, 154, 19, 10], [292, 188, 22, 12], [314, 224, 26, 14],
    [296, 264, 30, 16], [314, 308, 36, 18], [294, 354, 42, 20], [318, 402, 48, 22],
  ];
  return (
    <svg viewBox="0 0 600 440" preserveAspectRatio="none" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={47} scale={6.5} freq={0.035} />
      <path d="M310,420 Q320,330 305,250 Q288,170 308,90 Q320,40 305,10"
            stroke="var(--dirt)" strokeWidth="56" fill="none" strokeLinecap="round"
            opacity=".35" style={{ filter: "blur(8px)" }} />

      <g filter={`url(#${fid})`}>
        {stones.map(([cx, cy, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={cx + 1.5} cy={cy + 3} rx={rx * 1.05} ry={ry * 1.1}
                     fill="rgba(72,52,32,.35)" style={{ filter: "blur(2px)" }} />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--stone)" />
            <ellipse cx={cx - rx * 0.25} cy={cy - ry * 0.3} rx={rx * 0.5} ry={ry * 0.35}
                     fill="var(--stone-light)" opacity=".75" />
            {i % 3 === 1 && (
              <ellipse cx={cx + rx * 0.5} cy={cy + ry * 0.4} rx={rx * 0.4} ry={ry * 0.3}
                       fill="var(--moss)" opacity=".75" />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─────────── Greenhouse ─────────── */

export function Greenhouse() {
  const fid = useId();
  const win = useId();
  return (
    <svg viewBox="0 0 240 320" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={37} scale={6} freq={0.028} />
      <defs>
        <linearGradient id={win} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="var(--window-glow)"   stopOpacity=".95" />
          <stop offset="55%" stopColor="var(--window-glow)"   stopOpacity=".75" />
          <stop offset="100%" stopColor="var(--leaf-cottage)" stopOpacity=".4" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="200" rx="170" ry="100"
               fill="var(--window-glow)" opacity=".32"
               style={{ filter: "blur(28px)" }} />

      <g filter={`url(#${fid})`}>
        <Washed wash="var(--step-shadow)" blur={4}>
          <rect x="34" y="280" width="172" height="28" fill="var(--step)" rx="2" />
        </Washed>
        <line x1="40" y1="294" x2="200" y2="295" stroke="var(--step-crack)" strokeWidth="0.8" opacity=".6" />
        <line x1="34" y1="305" x2="206" y2="304" stroke="var(--step-crack)" strokeWidth="0.6" opacity=".5" />

        <Washed wash="var(--window-glow)" blur={10}>
          <path d="M40,280 L40,90 L120,32 L200,90 L200,280 Z" fill={`url(#${win})`} opacity=".92" />
        </Washed>

        <g stroke="var(--beam)" strokeWidth="1.6" fill="none" opacity=".85" strokeLinecap="round">
          <line x1="80"  y1="62" x2="80"  y2="280" />
          <line x1="120" y1="32" x2="120" y2="280" />
          <line x1="160" y1="62" x2="160" y2="280" />
          <line x1="40" y1="160" x2="200" y2="160" />
          <line x1="40" y1="222" x2="200" y2="222" />
          <path d="M40,90 L120,32 L200,90" />
          <line x1="78"  y1="61" x2="78"  y2="90" />
          <line x1="162" y1="61" x2="162" y2="90" />
        </g>

        <path d="M40,280 L40,90 L120,32 L200,90 L200,280 Z"
              fill="none" stroke="var(--beam)" strokeWidth="2.4" opacity=".95" />

        <circle cx="120" cy="30" r="3.2" fill="var(--brass)" opacity=".85" />
        <line x1="120" y1="26" x2="120" y2="14" stroke="var(--brass)" strokeWidth="1.4" />

        <rect x="102" y="220" width="36" height="60" rx="1" fill="var(--door-warm)" opacity=".75" />
        <rect x="102" y="220" width="36" height="60" rx="1" fill="none" stroke="var(--beam)" strokeWidth="1.6" />
        <path d="M102,222 L120,228 L138,222" stroke="var(--beam)" strokeWidth="1" fill="none" opacity=".7" />
        <circle cx="132" cy="252" r="1.5" fill="var(--brass)" />

        <g opacity=".7">
          <ellipse cx="56"  cy="232" rx="9"  ry="38" fill="var(--leaf-deep)" />
          <ellipse cx="72"  cy="246" rx="7"  ry="28" fill="var(--leaf-cottage)" />
          <ellipse cx="184" cy="234" rx="8"  ry="36" fill="var(--leaf-deep)" />
          <ellipse cx="170" cy="248" rx="7"  ry="26" fill="var(--leaf-cottage)" />
        </g>
        <g>
          <circle cx="58"  cy="208" r="2.5" fill="var(--rose-deep)" opacity=".85" />
          <circle cx="72"  cy="222" r="2"   fill="var(--butter)"    opacity=".85" />
          <circle cx="182" cy="212" r="2.5" fill="var(--butter)"    opacity=".85" />
          <circle cx="170" cy="226" r="2"   fill="var(--rose-pale)" opacity=".85" />
        </g>
        <g>
          <rect x="44"  y="270" width="14" height="10" fill="var(--pot-deep)" />
          <ellipse cx="51" cy="266" rx="9" ry="5" fill="var(--leaf-cottage)" />
          <rect x="184" y="270" width="14" height="10" fill="var(--pot-deep)" />
          <ellipse cx="191" cy="266" rx="9" ry="5" fill="var(--leaf-cottage)" />
        </g>

        <g>
          <path d="M40,280 Q30,250 36,220 Q26,196 38,170 Q30,148 42,128"
                stroke="#4a3a2c" strokeWidth="1.4" fill="none" opacity=".7" />
          {[[40,268],[38,244],[34,218],[38,196],[32,174],[40,152],[36,132]].map(([cx, cy], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx="5" ry="2.4" fill="var(--leaf-cottage)" opacity=".95"
                     transform={`rotate(${i % 2 ? -30 : 30} ${cx} ${cy})`} />
          ))}
          {[[34,230],[30,200],[38,178]].map(([rx, ry], i) => (
            <g key={`wr${i}`}>
              {Array.from({ length: 6 }).map((_, k) => {
                const dy = k * 4;
                const r = 2.2 - k * 0.16;
                return <circle key={k} cx={rx - (k % 2 ? 1 : -1)} cy={ry + dy} r={r}
                               fill={k > 2 ? "#7a6aa0" : "#a18ec4"} opacity=".9" />;
              })}
            </g>
          ))}
        </g>

        <g>
          {[[196,282],[208,286],[184,286]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3.4" fill={i === 1 ? "var(--butter)" : "var(--rose-pale)"} />
              <circle cx={cx} cy={cy} r="1.4" fill="var(--center-deep)" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

/* ─────────── Wildflower drift ─────────── */

export function WildflowerDrift({ variant = "left" }: { variant?: "left" | "right" }) {
  const fid = useId();
  const seedShift = variant === "left" ? 0 : 1.7;

  const foxgloves: Array<[number, number, "rose" | "lavender" | "cream"]> =
    variant === "left"
      ? [[40, 320, "rose"], [120, 290, "lavender"], [220, 330, "rose"], [340, 295, "cream"]]
      : [[60, 300, "lavender"], [160, 280, "rose"], [260, 320, "cream"], [350, 290, "rose"], [420, 330, "lavender"]];

  type HeadKind = "daisy" | "butter" | "cosmos-pink" | "cosmos-white";
  const heads: Array<[number, number, HeadKind]> =
    variant === "left"
      ? [
          [70,  395, "daisy"], [110, 410, "cosmos-pink"], [150, 395, "butter"],
          [200, 410, "daisy"], [250, 400, "cosmos-pink"], [285, 415, "butter"],
          [310, 400, "daisy"], [365, 410, "cosmos-white"],
          [55,  430, "butter"], [125, 430, "daisy"], [190, 430, "cosmos-pink"],
          [255, 432, "butter"], [320, 435, "daisy"], [380, 432, "cosmos-white"],
        ]
      : [
          [40,  395, "daisy"], [85,  410, "butter"], [130, 395, "cosmos-pink"],
          [185, 412, "daisy"], [230, 400, "cosmos-white"], [280, 415, "butter"],
          [325, 398, "cosmos-pink"], [380, 408, "daisy"], [430, 400, "butter"],
          [60,  435, "butter"], [115, 432, "daisy"], [180, 435, "cosmos-pink"],
          [240, 430, "butter"], [300, 438, "daisy"], [355, 432, "cosmos-white"], [410, 435, "butter"],
        ];

  const headFill = (k: HeadKind) => ({
    "daisy":        "#fbf3df",
    "butter":       "var(--butter)",
    "cosmos-pink":  "var(--rose-pale)",
    "cosmos-white": "#f4ecd8",
  })[k];

  type FoxgloveKind = "rose" | "lavender" | "cream";
  const foxgloveColors: Record<FoxgloveKind, [string, string]> = {
    rose:     ["var(--rose-deep)",     "var(--rose-pale)"],
    lavender: ["var(--lavender-deep)", "var(--lavender-pale)"],
    cream:    ["#e8d4b0",              "#f4ecd8"],
  };
  const fox = (k: FoxgloveKind): [string, string] => foxgloveColors[k];

  return (
    <svg viewBox="0 0 480 480" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={31 + (variant === "left" ? 0 : 7)} scale={7} freq={0.05} />

      <g filter={`url(#${fid})`}>
        <path d="M-20,470 Q60,430 140,448 Q220,465 300,440 Q380,420 500,448 L500,490 L-20,490 Z"
              fill="var(--leaf-deep)" opacity=".9" />
        <path d="M-20,478 Q70,448 150,462 Q230,476 310,456 Q390,438 500,462 L500,490 L-20,490 Z"
              fill="var(--leaf-cottage)" opacity=".9" />
      </g>

      <g stroke="var(--leaf-sage)" strokeWidth="1.6" strokeLinecap="round" opacity=".85" filter={`url(#${fid})`}>
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 20 + i * 22 + ((i * 13 + seedShift * 10) % 14);
          const y = 460 - ((i * 7) % 30);
          return <line key={i} x1={x} y1={y} x2={x + (i % 2 ? 2 : -2)} y2={y - 28 - (i % 3) * 6} />;
        })}
      </g>
      <g filter={`url(#${fid})`}>
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 30 + i * 32 + ((i * 19) % 14);
          const y = 422 - ((i * 5) % 16);
          return (
            <g key={i}>
              {[0, 4, 8, 12, 16].map((d, k) => (
                <circle key={k} cx={x + (k % 2 ? 1 : -1)} cy={y - d} r={2.2}
                        fill="var(--lavender-deep)" opacity={1 - k * 0.12} />
              ))}
            </g>
          );
        })}
      </g>

      <g filter={`url(#${fid})`}>
        {foxgloves.map(([x, y, kind], i) => {
          const [dark, light] = fox(kind);
          return (
            <g key={i} className="sway"
               style={{
                 transformOrigin: `${x}px ${y + 100}px`,
                 animationDuration: `${5 + (i % 3)}s`,
                 animationDelay: `${-i * 0.9 - seedShift}s`,
               }}>
              <path d={`M${x},${y + 110} Q${x + 2},${y + 60} ${x - 1},${y - 60}`}
                    stroke="var(--leaf-sage)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <ellipse cx={x - 6} cy={y + 90} rx="9" ry="4" fill="var(--leaf-cottage)"
                       transform={`rotate(-30 ${x - 6} ${y + 90})`} />
              <ellipse cx={x + 7} cy={y + 60} rx="8" ry="3.6" fill="var(--leaf-cottage)"
                       transform={`rotate(30 ${x + 7} ${y + 60})`} />
              {Array.from({ length: 10 }).map((_, k) => {
                const by = y + 50 - k * 14;
                const bx = x + (k % 2 ? -3 : 3);
                const r  = 7 - k * 0.5;
                return (
                  <g key={k}>
                    <ellipse cx={bx} cy={by} rx={r} ry={r * 0.8} fill={light} opacity=".95" />
                    <ellipse cx={bx} cy={by + r * 0.2} rx={r * 0.6} ry={r * 0.5} fill={dark} opacity=".7" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>

      <g filter={`url(#${fid})`}>
        {heads.map(([x, y, kind], i) => {
          const fill = headFill(kind);
          const petals = kind === "daisy" ? 8 : kind.startsWith("cosmos") ? 6 : 7;
          const r = kind === "butter" ? 5.5 : 7;
          return (
            <g key={i} className={i % 2 ? "sway-2" : "sway"}
               style={{
                 transformOrigin: `${x}px ${y + 12}px`,
                 animationDuration: `${4 + (i % 4) * 0.6}s`,
                 animationDelay:    `${-i * 0.4 - seedShift}s`,
               }}>
              <line x1={x} y1={y + 18} x2={x} y2={y + 4} stroke="var(--leaf-sage)" strokeWidth="1.4" strokeLinecap="round" />
              {Array.from({ length: petals }).map((_, p) => {
                const a = (p / petals) * Math.PI * 2;
                return (
                  <ellipse key={p}
                           cx={x + Math.cos(a) * r * 0.7}
                           cy={y + Math.sin(a) * r * 0.7}
                           rx={r * 0.55} ry={r * 0.35}
                           fill={fill} opacity=".95"
                           transform={`rotate(${(p / petals) * 360} ${x + Math.cos(a) * r * 0.7} ${y + Math.sin(a) * r * 0.7})`} />
                );
              })}
              <circle cx={x} cy={y} r={r * 0.32}
                      fill={kind.startsWith("cosmos") ? "var(--butter)" : "var(--center-deep)"} />
            </g>
          );
        })}
      </g>

      <g filter={`url(#${fid})`}>
        {(variant === "left"
          ? [[170, 380], [340, 388]]
          : [[120, 388], [290, 378]]
        ).map(([x, y], i) => (
          <g key={i} className="sway-3"
             style={{
               transformOrigin: `${x}px ${y + 20}px`,
               animationDuration: `${6 + i}s`,
               animationDelay: `${-i * 1.2}s`,
             }}>
            <line x1={x} y1={y + 22} x2={x + 1} y2={y + 4} stroke="var(--leaf-sage)" strokeWidth="1.6" strokeLinecap="round" />
            <path d={`M${x - 11},${y + 2} Q${x},${y - 16} ${x + 11},${y + 2} Q${x + 6},${y + 6} ${x},${y + 5} Q${x - 6},${y + 6} ${x - 11},${y + 2} Z`}
                  fill="var(--poppy)" />
            <path d={`M${x - 8},${y + 1} Q${x},${y - 12} ${x + 8},${y + 1}`}
                  fill="var(--poppy-light)" opacity=".7" />
            <circle cx={x} cy={y + 1} r="2" fill="#241510" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─────────── Vegetable patch ─────────── */

export function VegetablePatch() {
  const fid = useId();
  return (
    <svg viewBox="0 0 480 320" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={71} scale={7.5} freq={0.04} />

      <g filter={`url(#${fid})`}>
        <path d="M-10,260 Q120,240 240,250 Q360,260 490,242 L490,320 L-10,320 Z" fill="var(--earth)" />
        <path d="M-10,272 Q120,254 240,262 Q360,272 490,256 L490,320 L-10,320 Z" fill="var(--earth-dark)" opacity=".7" />

        {Array.from({ length: 8 }).map((_, i) => {
          const x = 30 + i * 56;
          const y = 232;
          return (
            <g key={`c${i}`} className="sway"
               style={{
                 transformOrigin: `${x}px ${y + 8}px`,
                 animationDuration: `${4.5 + (i % 3)}s`,
                 animationDelay: `${-i * 0.6}s`,
               }}>
              {[-8, -4, 0, 4, 8].map((dx, k) => (
                <path key={k} d={`M${x + dx},${y + 10} Q${x + dx * 1.4},${y - 6} ${x + dx * 2},${y - 20 - (k % 2 ? 4 : 0)}`}
                      stroke="var(--carrot-tops)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              ))}
              <ellipse cx={x} cy={y + 12} rx="3" ry="2" fill="var(--pumpkin)" opacity=".5" />
            </g>
          );
        })}

        {Array.from({ length: 6 }).map((_, i) => {
          const x = 40 + i * 76 + (i % 2 ? 6 : 0);
          const y = 270;
          return (
            <g key={`l${i}`}>
              <ellipse cx={x} cy={y + 4} rx="20" ry="9" fill="var(--lettuce-deep)" />
              <path d={`M${x - 18},${y + 4} Q${x - 14},${y - 6} ${x - 6},${y - 4} Q${x},${y - 10} ${x + 6},${y - 4} Q${x + 14},${y - 6} ${x + 18},${y + 4} Q${x + 12},${y + 6} ${x},${y + 6} Q${x - 12},${y + 6} ${x - 18},${y + 4} Z`}
                    fill="var(--lettuce)" />
              <ellipse cx={x - 4} cy={y - 2} rx="6" ry="3" fill="var(--lettuce-light)" opacity=".6" />
            </g>
          );
        })}

        <g>
          <ellipse cx="380" cy="300" rx="42" ry="22" fill="var(--pumpkin-deep)" />
          <ellipse cx="380" cy="298" rx="40" ry="20" fill="var(--pumpkin)" />
          {[-26, -12, 0, 12, 26].map((dx, k) => (
            <path key={k} d={`M${380 + dx},${280} Q${380 + dx * 0.8},${298} ${380 + dx},${316}`}
                  stroke="var(--pumpkin-deep)" strokeWidth="1.4" fill="none" opacity=".7" />
          ))}
          <ellipse cx="376" cy="288" rx="14" ry="5" fill="var(--pumpkin-light)" opacity=".55" />
          <path d="M378,278 Q380,266 386,262" stroke="var(--leaf-deep)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M386,262 Q396,254 406,260 Q400,268 388,266 Z" fill="var(--leaf-deep)" />
        </g>

        {[[80,290],[150,286],[220,290],[290,286]].map(([x, y], i) => (
          <g key={`t${i}`}>
            <line x1={x} y1={y + 30} x2={x} y2={y - 90} stroke="var(--beam)" strokeWidth="2" />
            <ellipse cx={x} cy={y - 30} rx="20" ry="38" fill="var(--leaf-cottage)" opacity=".95" />
            <ellipse cx={x - 6} cy={y - 50} rx="12" ry="20" fill="var(--leaf-deep)" opacity=".7" />
            {[[-6,-10],[8,-22],[-2,-36],[10,-52],[-8,-64],[4,-76]].map(([dx, dy], k) => (
              <g key={k}>
                <circle cx={x + dx} cy={y + dy} r={4.6} fill="var(--tomato-deep)" />
                <circle cx={x + dx - 1.2} cy={y + dy - 1.4} r={1.8} fill="var(--tomato-light)" opacity=".8" />
              </g>
            ))}
          </g>
        ))}

        {[40, 320, 440].map((x, i) => (
          <g key={`b${i}`}>
            <ellipse cx={x} cy={302} rx="14" ry="8" fill="var(--leaf-deep)" />
            <ellipse cx={x - 3} cy={300} rx="8" ry="4" fill="var(--leaf-cottage)" opacity=".7" />
          </g>
        ))}
      </g>

      <g filter={`url(#${fid})`} opacity=".95">
        <line x1="420" y1="232" x2="420" y2="252" stroke="var(--beam)" strokeWidth="1.6" />
        <rect x="408" y="218" width="28" height="14" fill="#f6ecd6" stroke="var(--beam)" strokeWidth="1" />
      </g>
    </svg>
  );
}

/* ─────────── Picket fence ─────────── */

export function PicketFence() {
  const fid = useId();
  return (
    <svg viewBox="0 0 320 60" width="100%" height="100%" preserveAspectRatio="none"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={59} scale={2.5} freq={0.08} />
      <g filter={`url(#${fid})`}>
        <rect x="0" y="22" width="320" height="3" fill="var(--picket)" />
        <rect x="0" y="44" width="320" height="3" fill="var(--picket)" />
        {Array.from({ length: 22 }).map((_, i) => {
          const x = i * 14 + 4;
          const top = 6 + (i % 3) * 2;
          return (
            <path key={i}
                  d={`M${x},${60} L${x},${top + 4} L${x + 4},${top} L${x + 8},${top + 4} L${x + 8},${60} Z`}
                  fill="var(--picket)" />
          );
        })}
      </g>
    </svg>
  );
}

/* ─────────── Door frame, step, seedling (threshold) ─────────── */

export function DoorFrame() {
  const fid = useId();
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={83} scale={6} freq={0.035} />
      <g filter={`url(#${fid})`}>
        <rect x="0" y="0" width="100" height="11" fill="var(--door-wash)" />
        <rect x="0" y="0" width="100" height="9"  fill="var(--door-warm)" />
        <rect x="0" y="9" width="100" height="2"  fill="var(--door-deep)" />
        <rect x="0" y="0" width="9" height="100" fill="var(--door-warm)" />
        <rect x="9" y="0" width="1.5" height="100" fill="var(--door-deep)" />
        <rect x="91"   y="0" width="9"   height="100" fill="var(--door-warm)" />
        <rect x="89.5" y="0" width="1.5" height="100" fill="var(--door-deep)" />

        {Array.from({ length: 10 }).map((_, i) => (
          <ellipse key={`vl${i}`} cx="10" cy={5 + i * 10} rx="1.4" ry="0.8" fill="var(--leaf-deep)" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <ellipse key={`vr${i}`} cx="90" cy={5 + i * 10} rx="1.4" ry="0.8" fill="var(--leaf-deep)" />
        ))}
      </g>
    </svg>
  );
}

export function Doorstep() {
  const fid = useId();
  return (
    <svg viewBox="0 0 1600 120" preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block" }}>
      <WatercolorDefs id={fid} seed={97} scale={7} freq={0.025} />
      <g filter={`url(#${fid})`}>
        <rect x="0" y="0"   width="1600" height="120" fill="var(--step)" />
        <rect x="0" y="0"   width="1600" height="14"  fill="var(--step-shadow)" opacity=".6" />
        <rect x="0" y="108" width="1600" height="12"  fill="var(--step-shadow)" opacity=".75" />

        {[120, 320, 460, 620, 820, 980, 1180, 1360].map((x, i) => (
          <path key={i}
                d={`M${x},14 Q${x + (i % 2 ? 6 : -8)},60 ${x + (i % 2 ? -4 : 6)},108`}
                stroke="var(--step-crack)" strokeWidth="1.5" fill="none" opacity=".55" />
        ))}
        {[80, 380, 720, 1080, 1440].map((x, i) => (
          <ellipse key={i} cx={x} cy={100 - (i % 2) * 6} rx="22" ry="6" fill="var(--moss)" opacity=".75" />
        ))}
      </g>
    </svg>
  );
}

export function Seedling() {
  const fid = useId();
  return (
    <svg viewBox="0 0 110 130" width="100%" height="100%"
         style={{ display: "block", overflow: "visible" }}>
      <WatercolorDefs id={fid} seed={113} scale={3} freq={0.06} />
      <defs>
        <linearGradient id="pot-grad-v2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="var(--pot-light)" />
          <stop offset="100%" stopColor="var(--pot-deep)" />
        </linearGradient>
      </defs>
      <g filter={`url(#${fid})`}>
        <ellipse cx="55" cy="122" rx="36" ry="6" fill="#000" opacity=".45" style={{ filter: "blur(3px)" }} />
        <path d="M28,80 L82,80 L74,122 L36,122 Z" fill="url(#pot-grad-v2)" />
        <ellipse cx="55" cy="80" rx="27" ry="5"   fill="var(--pot-deep)" />
        <ellipse cx="55" cy="80" rx="24" ry="3.6" fill="var(--pot-soil)" />
        <ellipse cx="55" cy="81" rx="22" ry="2.6" fill="#2a160b" />
        <rect x="34" y="92"  width="42" height="1.4" fill="var(--pot-deep)" opacity=".6" />
        <rect x="36" y="104" width="38" height="1.2" fill="var(--pot-deep)" opacity=".5" />

        <path d="M55,80 Q53,60 56,42 Q58,28 55,16"
              stroke="var(--leaf-cottage)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M56,46 Q70,40 76,28 Q66,34 55,42 Z" fill="var(--leaf-cottage)" />
        <path d="M54,58 Q40,52 34,40 Q44,46 54,52 Z" fill="var(--leaf-cottage)" />
        <path d="M55,28 Q62,22 66,12 Q58,18 55,22 Z" fill="var(--leaf-fresh)" />
        <path d="M55,16 Q48,10 44,2 Q52,8 55,14 Z" fill="var(--leaf-fresh)" />

        <circle cx="55" cy="6" r="3.4" fill="#fff5c8" />
        <circle cx="55" cy="6" r="7"   fill="#fff5c8" opacity=".4" />
      </g>
    </svg>
  );
}

/* ─────────── Paper grain overlay ─────────── */

export function PaperGrain() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="none"
         style={{
           position: "absolute", inset: 0, mixBlendMode: "multiply",
           opacity: 0.42, pointerEvents: "none", zIndex: 60,
         }}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={2} />
        <feColorMatrix values="
          0 0 0 0  0.38
          0 0 0 0  0.28
          0 0 0 0  0.18
          0 0 0 0.72 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  );
}

/* ─────────── Inline icons (lucide-ish) ─────────── */

type IconProps = { size?: number };

export function IconPlus({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5"  x2="12" y2="19" />
      <line x1="5"  y1="12" x2="19" y2="12" />
    </svg>
  );
}
export function IconSun({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
export function IconCloudSun({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M5.22 5.22l1.42 1.42M2 12h2M20 12h2M17.36 6.64l1.42-1.42" />
      <path d="M15.5 12a4 4 0 1 0-7.85 1.2A3.5 3.5 0 1 0 7 20h11a3 3 0 0 0 0-6 3 3 0 0 0-2.5-2z" />
    </svg>
  );
}
export function IconCloudRain({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13a4 4 0 1 0-7.85-1.2A3.5 3.5 0 1 0 7 18h11a3 3 0 0 0 0-6 3 3 0 0 0-2-1z" />
      <line x1="8"  y1="19" x2="7"  y2="22" />
      <line x1="12" y1="19" x2="11" y2="22" />
      <line x1="16" y1="19" x2="15" y2="22" />
    </svg>
  );
}
export function IconCloudLightning({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13a4 4 0 1 0-7.85-1.2A3.5 3.5 0 1 0 7 18h11a3 3 0 0 0 0-6 3 3 0 0 0-2-1z" />
      <polyline points="11 16 9.5 19.5 13 19.5 11 23" />
    </svg>
  );
}
export function IconSnowflake({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="9 5  12 2  15 5"  />
      <polyline points="9 19 12 22 15 19" />
      <polyline points="5 9  2 12  5 15" />
      <polyline points="19 9 22 12 19 15" />
    </svg>
  );
}

// silence unused-type warning if you import in strict tsconfig
export type { CSSProperties };
