"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, MapPin } from "lucide-react";
import { BIOMES, DEFAULT_BIOME, type Biome, type BiomeLighting } from "@/lib/constants/biomes";

// ── SVG Flower Primitives ──────────────────────────────────────────────────

function Tulip({
  x, y, scale = 1, color, stemColor, leafColor,
}: { x: number; y: number; scale?: number; color: string; stemColor: string; leafColor: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <line x1="0" y1="0" x2="0" y2="65" stroke={stemColor} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="-10" cy="38" rx="13" ry="6" fill={leafColor} transform="rotate(-35,-10,38)" />
      {/* Cup petals */}
      <path d="M-13 0 Q-16 -22 0 -30 Q16 -22 13 0 Q7 -4 0 -3 Q-7 -4 -13 0Z" fill={color} />
      <path d="M-7 0 Q-9 -20 0 -27 Q9 -20 7 0" fill={color} opacity="0.5" />
      {/* inner highlight */}
      <path d="M-4 -2 Q-5 -18 0 -24 Q5 -18 4 -2" fill="white" opacity="0.12" />
    </g>
  );
}

function Sunflower({
  x, y, scale = 1, petalColor, centerColor, stemColor, leafColor,
}: { x: number; y: number; scale?: number; petalColor: string; centerColor: string; stemColor: string; leafColor: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <line x1="0" y1="0" x2="0" y2="80" stroke={stemColor} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="12" cy="50" rx="14" ry="6" fill={leafColor} transform="rotate(30,12,50)" />
      <g transform="translate(0,-5)">
        {angles.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse cx="0" cy="-19" rx="7" ry="16" fill={petalColor} opacity="0.92" />
          </g>
        ))}
        {/* Darker inner petal ring */}
        {angles.map((a) => (
          <g key={`i${a}`} transform={`rotate(${a + 22.5})`}>
            <ellipse cx="0" cy="-15" rx="5" ry="12" fill={petalColor} opacity="0.5" />
          </g>
        ))}
        <circle r="14" fill={centerColor} />
        <circle r="10" fill={centerColor} opacity="0.6" style={{ filter: "brightness(0.7)" }} />
        {/* seed dots */}
        {[0,60,120,180,240,300].map((a) => (
          <circle key={a} cx={Math.cos((a*Math.PI)/180)*5} cy={Math.sin((a*Math.PI)/180)*5} r="1.8" fill="rgba(0,0,0,0.3)" />
        ))}
      </g>
    </g>
  );
}

function Rose({
  x, y, scale = 1, outerColor, innerColor, centerColor, stemColor, leafColor,
}: { x: number; y: number; scale?: number; outerColor: string; innerColor: string; centerColor: string; stemColor: string; leafColor: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <line x1="0" y1="0" x2="0" y2="60" stroke={stemColor} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="-10" cy="30" rx="12" ry="5" fill={leafColor} transform="rotate(-40,-10,30)" />
      <g transform="translate(0,-5)">
        {/* Outer petals */}
        <ellipse cx="0" cy="-14" rx="13" ry="10" fill={outerColor} opacity="0.85" />
        <ellipse cx="-10" cy="-10" rx="11" ry="9" fill={outerColor} opacity="0.8" />
        <ellipse cx="10" cy="-10" rx="11" ry="9" fill={outerColor} opacity="0.8" />
        <ellipse cx="-6" cy="-18" rx="10" ry="8" fill={innerColor} opacity="0.9" />
        <ellipse cx="6" cy="-18" rx="10" ry="8" fill={innerColor} opacity="0.9" />
        {/* Core */}
        <circle cx="0" cy="-18" r="8" fill={innerColor} />
        <circle cx="0" cy="-20" r="5" fill={centerColor} />
        <circle cx="0" cy="-21" r="3" fill={centerColor} opacity="0.7" style={{ filter: "brightness(0.8)" }} />
      </g>
    </g>
  );
}

function Daffodil({
  x, y, scale = 1, petalColor, trumpetColor, stemColor, leafColor,
}: { x: number; y: number; scale?: number; petalColor: string; trumpetColor: string; stemColor: string; leafColor: string }) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <line x1="0" y1="0" x2="0" y2="75" stroke={stemColor} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="-8" cy="40" rx="18" ry="5" fill={leafColor} transform="rotate(-20,-8,40)" />
      <g transform="translate(0,-5)">
        {angles.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse cx="0" cy="-16" rx="8" ry="14" fill={petalColor} opacity="0.9" />
          </g>
        ))}
        {/* Trumpet */}
        <circle r="10" fill={trumpetColor} />
        <circle r="7" fill={trumpetColor} opacity="0.7" style={{ filter: "brightness(0.85)" }} />
        <circle r="4" fill={trumpetColor} opacity="0.5" style={{ filter: "brightness(0.7)" }} />
      </g>
    </g>
  );
}

function Blossom({
  x, y, scale = 1, petalColor, centerColor,
}: { x: number; y: number; scale?: number; petalColor: string; centerColor: string }) {
  const angles = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {angles.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx="0" cy="-9" rx="6" ry="9" fill={petalColor} opacity="0.88" />
        </g>
      ))}
      <circle r="4" fill={centerColor} />
      <circle r="2" fill="white" opacity="0.5" />
    </g>
  );
}

// ── Scene Layers ───────────────────────────────────────────────────────────

function BackgroundLayer({ l }: { l: BiomeLighting }) {
  // Distant mountains and tree silhouettes
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      {/* Atmospheric horizon glow */}
      <defs>
        <radialGradient id="horizonGlow" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor={l.atmosphericHaze} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="blur4">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="blur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1440" height="900" fill="url(#horizonGlow)" />

      {/* Soft clouds */}
      <g opacity="0.55" filter="url(#blur4)">
        <ellipse cx="280" cy="110" rx="90" ry="38" fill="white" />
        <ellipse cx="340" cy="98"  rx="65" ry="30" fill="white" />
        <ellipse cx="220" cy="118" rx="55" ry="26" fill="white" />

        <ellipse cx="880" cy="75"  rx="100" ry="42" fill="white" />
        <ellipse cx="960" cy="64"  rx="70"  ry="32" fill="white" />
        <ellipse cx="820" cy="84"  rx="60"  ry="28" fill="white" />

        <ellipse cx="1280" cy="130" rx="78" ry="34" fill="white" />
        <ellipse cx="1340" cy="118" rx="55" ry="26" fill="white" />
      </g>

      {/* Far mountain range */}
      <motion.path
        d="M0 560 L100 490 L200 525 L330 440 L460 500 L580 420 L700 475 L820 400 L950 455 L1080 390 L1200 445 L1320 400 L1440 425 L1440 900 L0 900Z"
        animate={{ fill: l.mountainColor }}
        transition={{ duration: 2.5 }}
        opacity={0.5}
        filter="url(#blur4)"
      />
      {/* Near foothills */}
      <motion.path
        d="M0 640 Q180 590 330 620 Q480 580 640 610 Q800 580 960 605 Q1100 578 1260 608 Q1370 590 1440 610 L1440 900 L0 900Z"
        animate={{ fill: l.mountainColor }}
        transition={{ duration: 2.5 }}
        opacity={0.75}
      />

      {/* Background tree silhouettes — row 1 (far) */}
      {[80,190,310,450,590,730,870,1000,1130,1270,1380].map((tx, i) => {
        const h = 90 + (i % 3) * 22;
        return (
          <motion.g key={tx} transform={`translate(${tx}, ${596 - h})`}>
            <motion.ellipse cx="0" cy="0" rx={28 + (i%3)*6} ry={h/2} animate={{ fill: l.treeFar }} transition={{ duration: 2.5 }} opacity={0.9} />
            <motion.ellipse cx="0" cy={-h*0.15} rx={20 + (i%2)*4} ry={h/2.5} animate={{ fill: l.treeFar }} transition={{ duration: 2.5 }} />
          </motion.g>
        );
      })}

      {/* Near tree row */}
      {[40,160,290,430,570,710,850,980,1120,1260,1400].map((tx, i) => {
        const h = 120 + (i % 4) * 25;
        return (
          <motion.g key={tx} transform={`translate(${tx}, ${635 - h})`}>
            <motion.ellipse cx="0" cy="0" rx={35 + (i%3)*8} ry={h/2.2} animate={{ fill: l.treeMid }} transition={{ duration: 2.5 }} opacity={0.95} />
            <motion.ellipse cx="-12" cy={-h*0.12} rx={22 + (i%2)*5} ry={h/2.8} animate={{ fill: l.treeMid }} transition={{ duration: 2.5 }} opacity={0.8} />
            <motion.ellipse cx="14" cy={-h*0.10} rx={20 + (i%3)*4} ry={h/3} animate={{ fill: l.treeMid }} transition={{ duration: 2.5 }} opacity={0.7} />
          </motion.g>
        );
      })}

      {/* Ground base */}
      <motion.rect x="0" y="640" width="1440" height="260" animate={{ fill: l.grassBase }} transition={{ duration: 2.5 }} />
    </svg>
  );
}

function MidgroundLayer({ l }: { l: BiomeLighting }) {
  // Stone stepping path, garden gate, mid-distance flower beds
  const stones = [
    { cx: 720, cy: 840, rx: 76, ry: 33, r: -3 },
    { cx: 704, cy: 786, rx: 63, ry: 27, r: 4 },
    { cx: 716, cy: 737, rx: 52, ry: 22, r: -2 },
    { cx: 706, cy: 693, rx: 43, ry: 18, r: 5 },
    { cx: 714, cy: 654, rx: 35, ry: 14, r: -3 },
    { cx: 710, cy: 620, rx: 27, ry: 11, r: 2 },
    { cx: 713, cy: 592, rx: 21, ry:  8, r: -2 },
    { cx: 715, cy: 570, rx: 16, ry:  6, r: 3 },
  ];

  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <filter id="softShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rich grass mid-ground */}
      <motion.path
        d="M0 660 Q360 640 720 650 Q1080 640 1440 660 L1440 900 L0 900Z"
        animate={{ fill: l.grassBase }}
        transition={{ duration: 2.5 }}
      />

      {/* Grass variation — shadow strip */}
      <motion.path
        d="M0 790 Q360 778 720 783 Q1080 778 1440 790 L1440 900 L0 900Z"
        animate={{ fill: l.grassShadow }}
        transition={{ duration: 2.5 }}
        opacity={0.5}
      />

      {/* Mid-distance flower beds — LEFT */}
      <motion.path
        d="M0 680 Q150 665 300 672 L300 730 Q150 722 0 735Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.9}
      />
      {/* Flowers on left bed */}
      <Tulip  x={60}  y={698} scale={0.55} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip  x={90}  y={692} scale={0.52} color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip  x={120} y={696} scale={0.54} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Rose   x={155} y={695} scale={0.48} outerColor={l.flowerSecondary} innerColor={l.flowerSecondary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip  x={195} y={694} scale={0.5}  color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip  x={230} y={698} scale={0.53} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Blossom x={260} y={689} scale={0.6} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} />

      {/* Mid-distance flower beds — RIGHT */}
      <motion.path
        d="M1140 680 Q1290 665 1440 672 L1440 735 Q1290 722 1140 730Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.9}
      />
      <Sunflower x={1190} y={688} scale={0.5} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={1240} y={694} scale={0.52} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Rose      x={1280} y={692} scale={0.48} outerColor={l.flowerPrimary} innerColor={l.flowerTertiary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Daffodil  x={1320} y={695} scale={0.5} petalColor={l.flowerSecondary} trumpetColor={l.flowerTertiary} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={1360} y={692} scale={0.53} color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />
      <Blossom   x={1395} y={688} scale={0.55} petalColor={l.flowerPrimary} centerColor={l.flowerCenter} />

      {/* Garden gate — mid distance */}
      <motion.g>
        {/* Gate posts */}
        <motion.rect x="614" y="496" width="22" height="165" rx="5" animate={{ fill: l.foliageDark }} transition={{ duration: 2.5 }} />
        <motion.rect x="804" y="496" width="22" height="165" rx="5" animate={{ fill: l.foliageDark }} transition={{ duration: 2.5 }} />
        {/* Arch curve */}
        <motion.path
          d="M614 518 Q720 454 826 518 L826 538 Q720 474 614 538Z"
          animate={{ fill: l.foliageDark }}
          transition={{ duration: 2.5 }}
        />
        {/* Vertical bars */}
        {[636,654,672,698,720,742,768,786].map((bx) => (
          <motion.rect key={bx} x={bx} y="524" width="5" height="137" rx="2" animate={{ fill: l.treeFar }} transition={{ duration: 2.5 }} opacity={0.85} />
        ))}
        {/* Horizontal crossbar */}
        <motion.rect x="614" y="584" width="214" height="5" rx="2" animate={{ fill: l.treeFar }} transition={{ duration: 2.5 }} opacity={0.7} />
      </motion.g>

      {/* Stepping stones path */}
      {stones.map(({ cx, cy, rx, ry, r }, i) => (
        <motion.g key={i} transform={`rotate(${r},${cx},${cy})`} filter="url(#softShadow)">
          <motion.ellipse cx={cx} cy={cy} rx={rx} ry={ry} animate={{ fill: l.pathStone }} transition={{ duration: 2.5 }} />
          {/* Stone shadow */}
          <motion.ellipse cx={cx+2} cy={cy+3} rx={rx*0.8} ry={ry*0.6} animate={{ fill: l.pathStoneShadow }} transition={{ duration: 2.5 }} opacity={0.35} />
          {/* Stone highlight */}
          <ellipse cx={cx-rx*0.2} cy={cy-ry*0.25} rx={rx*0.45} ry={ry*0.35} fill="white" opacity={0.14} />
        </motion.g>
      ))}

      {/* Atmospheric mist overlay */}
      <rect x="0" y="500" width="1440" height="200" fill={l.mistOverlay} />
    </svg>
  );
}

function ForegroundLayer({ l }: { l: BiomeLighting }) {
  // Large-scale close flowers + overhanging leaves + grass edge
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <filter id="leafBlur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* === FOREGROUND GRASS STRIP === */}
      <motion.path
        d="M0 858 Q360 845 720 850 Q1080 845 1440 858 L1440 900 L0 900Z"
        animate={{ fill: l.grassShadow }}
        transition={{ duration: 2.5 }}
      />
      {/* Grass blade row */}
      {Array.from({ length: 48 }, (_, i) => {
        const bx = i * 30 + 5;
        const by = 856;
        const h = 14 + (i % 4) * 6;
        const lean = (i % 5 - 2) * 4;
        return (
          <motion.path key={i} d={`M${bx} ${by} Q${bx + lean} ${by - h * 0.6} ${bx + lean * 0.4} ${by - h}`}
            stroke={l.grassBase} strokeWidth="2" fill="none" opacity={0.55}
          />
        );
      })}

      {/* === LEFT FLOWER BED — large foreground === */}
      {/* Dark soil/foliage base */}
      <motion.path
        d="M0 900 L380 900 L380 780 Q280 760 160 768 Q60 758 0 770Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.95}
      />
      {/* Leaf mass */}
      <motion.path
        d="M0 900 L360 900 L360 800 Q260 780 140 790 Q50 782 0 792Z"
        animate={{ fill: l.leafColor }}
        transition={{ duration: 2.5 }}
        opacity={0.85}
      />
      {/* Large flowers — left bed */}
      <Tulip     x={30}  y={790} scale={1.30} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={75}  y={782} scale={1.20} color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />
      <Rose      x={125} y={780} scale={1.10} outerColor={l.flowerPrimary} innerColor={l.flowerTertiary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={170} y={788} scale={1.25} color={l.flowerSecondary} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={215} y={775} scale={1.15} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Daffodil  x={258} y={780} scale={1.10} petalColor={l.flowerSecondary} trumpetColor={l.flowerTertiary} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Rose      x={300} y={785} scale={1.05} outerColor={l.flowerTertiary} innerColor={l.flowerPrimary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={338} y={792} scale={1.15} color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />

      {/* === RIGHT FLOWER BED — large foreground === */}
      <motion.path
        d="M1440 900 L1060 900 L1060 780 Q1160 760 1280 768 Q1380 758 1440 770Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.95}
      />
      <motion.path
        d="M1440 900 L1080 900 L1080 800 Q1180 780 1300 790 Q1390 782 1440 792Z"
        animate={{ fill: l.leafColor }}
        transition={{ duration: 2.5 }}
        opacity={0.85}
      />
      {/* Large flowers — right bed */}
      <Daffodil  x={1100} y={775} scale={1.20} petalColor={l.flowerSecondary} trumpetColor={l.flowerTertiary} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Sunflower x={1148} y={770} scale={1.10} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={1200} y={778} scale={1.25} color={l.flowerPrimary}   stemColor={l.stemColor} leafColor={l.leafColor} />
      <Rose      x={1248} y={775} scale={1.15} outerColor={l.flowerPrimary} innerColor={l.flowerTertiary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Daffodil  x={1295} y={780} scale={1.10} petalColor={l.flowerSecondary} trumpetColor={l.flowerTertiary} stemColor={l.stemColor} leafColor={l.leafColor} />
      <Tulip     x={1340} y={782} scale={1.20} color={l.flowerTertiary}  stemColor={l.stemColor} leafColor={l.leafColor} />
      <Sunflower x={1390} y={775} scale={1.05} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} stemColor={l.stemColor} leafColor={l.leafColor} />

      {/* === OVERHANGING FOLIAGE — top left corner === */}
      <motion.path
        d="M0 0 Q60 0 130 80 Q80 40 90 120 Q110 70 160 110 Q120 60 150 150 Q170 95 230 130 Q185 80 210 170 L240 160 L280 0Z"
        animate={{ fill: l.leafColor }}
        transition={{ duration: 2.5 }}
        opacity={0.88}
      />
      <motion.path
        d="M0 0 Q30 10 60 90 Q40 50 50 140 Q65 85 110 120 L130 80 Q80 20 0 0Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.7}
      />

      {/* === OVERHANGING FOLIAGE — top right corner === */}
      <motion.path
        d="M1440 0 Q1380 0 1310 80 Q1360 40 1350 120 Q1330 70 1280 110 Q1320 60 1290 150 Q1270 95 1210 130 Q1255 80 1230 170 L1200 160 L1160 0Z"
        animate={{ fill: l.leafColor }}
        transition={{ duration: 2.5 }}
        opacity={0.88}
      />
      <motion.path
        d="M1440 0 Q1410 10 1380 90 Q1400 50 1390 140 Q1375 85 1330 120 L1310 80 Q1360 20 1440 0Z"
        animate={{ fill: l.foliageDark }}
        transition={{ duration: 2.5 }}
        opacity={0.7}
      />

      {/* Scattered foreground blossoms on overhanging leaves */}
      <Blossom x={100} y={90}  scale={0.9} petalColor={l.flowerPrimary}   centerColor={l.flowerCenter} />
      <Blossom x={165} y={125} scale={0.8} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} />
      <Blossom x={55}  y={145} scale={0.7} petalColor={l.flowerTertiary}  centerColor={l.flowerCenter} />
      <Blossom x={1340} y={90}  scale={0.9} petalColor={l.flowerSecondary} centerColor={l.flowerCenter} />
      <Blossom x={1275} y={128} scale={0.8} petalColor={l.flowerPrimary}   centerColor={l.flowerCenter} />
      <Blossom x={1390} y={148} scale={0.7} petalColor={l.flowerTertiary}  centerColor={l.flowerCenter} />
    </svg>
  );
}

// ── Biome HUD ─────────────────────────────────────────────────────────────

function BiomeHUD({ active, onSelect }: { active: Biome; onSelect: (b: Biome) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative select-none">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 backdrop-blur-md"
        style={{ color: active.lighting.accent }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        <Globe className="h-3.5 w-3.5 opacity-60" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase">{active.name}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
          <ChevronDown className="h-3 w-3 opacity-40" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/8 bg-black/70 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="p-1.5">
              {BIOMES.map((biome) => (
                <motion.button
                  key={biome.id}
                  onClick={() => { onSelect(biome); setOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${biome.id === active.id ? "bg-white/10" : "hover:bg-white/5"}`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="text-base leading-none">{biome.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-stone-200">{biome.name}</div>
                    <div className="text-[10px] text-stone-500">{biome.mood}</div>
                  </div>
                  {biome.id === active.id && (
                    <motion.div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: biome.lighting.accent }} layoutId="active-dot" />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="border-t border-white/6 px-4 py-2.5">
              <p className="text-[9px] tracking-widest text-stone-600 uppercase">Live Weather · Coming Soon</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const [activeBiome, setActiveBiome] = useState<Biome>(DEFAULT_BIOME);

  function handleBiomeSelect(biome: Biome) {
    setActiveBiome(biome);
    console.log("[FourSeasonsGarden] Active biome →", {
      id: biome.id, name: biome.name,
      location: biome.location, coordinates: biome.coordinates,
      season: biome.season, mood: biome.mood,
    });
  }

  const { lighting: l } = activeBiome;
  const latDir = activeBiome.coordinates.lat >= 0 ? "N" : "S";
  const lonDir = activeBiome.coordinates.lon >= 0 ? "E" : "W";

  return (
    <main className="relative h-screen w-screen overflow-hidden">

      {/* ── LAYER 0: Sky ─────────────────────────────────────── z-0 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-sky"}
          className="absolute inset-0 z-0"
          style={{ background: l.skyGradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Ambient glow orb */}
      <motion.div
        className="pointer-events-none absolute z-0"
        style={{
          top: "10%", left: "25%", width: "50%", height: "35%",
          background: `radial-gradient(ellipse at center, ${l.glow} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{ opacity: [0.7, 1.1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── LAYER 1: Background ───────────────────────────────── z-10 */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <BackgroundLayer l={l} />
      </div>

      {/* ── LAYER 2: Mid-ground ───────────────────────────────── z-20 */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <MidgroundLayer l={l} />
      </div>

      {/* ── LAYER 3: Foreground ───────────────────────────────── z-30 */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <ForegroundLayer l={l} />
      </div>

      {/* ── LAYER 4: HUD ──────────────────────────────────────── z-50 */}
      <div className="absolute right-6 top-6 z-50">
        <BiomeHUD active={activeBiome} onSelect={handleBiomeSelect} />
      </div>

      {/* Coordinates — bottom left */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-coords"}
          className="absolute bottom-6 left-7 z-50 flex items-center gap-2"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6 }}
        >
          <MapPin className="h-3 w-3 shrink-0" style={{ color: l.accent }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: l.accent + "88" }}>
            {Math.abs(activeBiome.coordinates.lat).toFixed(4)}°{latDir}{"  "}{Math.abs(activeBiome.coordinates.lon).toFixed(4)}°{lonDir}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Season label — bottom right */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-season"}
          className="absolute bottom-6 right-7 z-50 text-right"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: l.accent + "55" }}>
            {activeBiome.season}
          </p>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
