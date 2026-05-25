"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, MapPin } from "lucide-react";
import { BIOMES, DEFAULT_BIOME, type Biome } from "@/lib/constants/biomes";

// ── Biome HUD ─────────────────────────────────────────────────────────────

function BiomeHUD({
  active,
  onSelect,
}: {
  active: Biome;
  onSelect: (b: Biome) => void;
}) {
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
        <span className="text-xs font-medium tracking-[0.15em] uppercase">
          {active.name}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
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
                  onClick={() => {
                    onSelect(biome);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    biome.id === active.id
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="text-base leading-none">{biome.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-stone-200">
                      {biome.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {biome.mood}
                    </div>
                  </div>
                  {biome.id === active.id && (
                    <motion.div
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: biome.lighting.accent }}
                      layoutId="active-dot"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="border-t border-white/6 px-4 py-2.5">
              <p className="text-[9px] tracking-widest text-stone-600 uppercase">
                Live Weather · Coming Soon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Depth Layer Helpers ────────────────────────────────────────────────────

function BackgroundLayer({ biome }: { biome: Biome }) {
  const { lighting } = biome;
  return (
    <svg
      viewBox="0 0 1440 900"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      {/* Distant mountains */}
      <motion.path
        d="M0 580 L120 480 L240 530 L380 420 L500 490 L640 390 L760 460 L880 380 L1000 440 L1140 360 L1280 430 L1380 380 L1440 410 L1440 900 L0 900 Z"
        animate={{ fill: lighting.mountainColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.55}
      />
      {/* Near hills */}
      <motion.path
        d="M0 640 L180 560 L320 610 L480 550 L640 580 L800 540 L960 570 L1120 545 L1300 580 L1440 555 L1440 900 L0 900 Z"
        animate={{ fill: lighting.mountainColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.8}
      />
      {/* Tree line silhouette */}
      <motion.path
        d="M0 700 Q60 670 80 695 Q120 665 160 690 Q200 668 240 692 Q280 670 320 693 Q360 670 400 694 Q440 672 480 695 Q520 672 560 694 Q600 671 640 694 Q680 671 720 693 Q760 670 800 694 Q840 671 880 694 Q920 670 960 694 Q1000 671 1040 694 Q1080 670 1120 693 Q1160 670 1200 692 Q1240 670 1280 693 Q1340 670 1380 693 Q1410 678 1440 700 L1440 900 L0 900 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.65}
      />
    </svg>
  );
}

function MidgroundLayer({ biome }: { biome: Biome }) {
  const { lighting } = biome;
  return (
    <>
      <svg
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        {/* Stone path vanishing into distance */}
        <motion.path
          d="M580 900 Q615 820 650 760 Q675 725 720 710 Q755 700 775 710 Q820 720 845 755 Q880 790 910 860 L940 900 Z"
          animate={{ fill: lighting.groundColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          opacity={0.9}
        />
        {/* Path highlight centre */}
        <motion.path
          d="M630 900 Q655 835 678 778 Q698 748 722 734 Q742 726 762 734 Q785 744 798 770 Q818 800 835 850 L850 900 Z"
          animate={{ fill: lighting.groundColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          opacity={0.45}
        />
        {/* Left garden trees */}
        <motion.path
          d="M0 760 Q60 690 90 730 Q100 645 145 708 Q155 625 195 700 Q215 655 250 715 Q275 680 310 735 Q335 715 370 765 Q400 745 440 795 L0 900 Z"
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        {/* Right garden trees */}
        <motion.path
          d="M1440 760 Q1380 690 1350 730 Q1340 645 1295 708 Q1285 625 1245 700 Q1225 655 1190 715 Q1165 680 1130 735 Q1105 715 1070 765 Q1040 745 1000 795 L1440 900 Z"
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        {/* Left mid bushes */}
        <motion.ellipse
          cx={220}
          cy={800}
          rx={130}
          ry={65}
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          opacity={0.9}
        />
        <motion.ellipse
          cx={90}
          cy={835}
          rx={95}
          ry={52}
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        {/* Right mid bushes */}
        <motion.ellipse
          cx={1220}
          cy={800}
          rx={130}
          ry={65}
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          opacity={0.9}
        />
        <motion.ellipse
          cx={1350}
          cy={835}
          rx={95}
          ry={52}
          animate={{ fill: lighting.canopyColor }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Breathing ground mist */}
      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{ height: "38%" }}
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="h-full w-full"
          style={{
            background: `linear-gradient(to top, ${biome.lighting.mistColor}90 0%, ${biome.lighting.mistColor}35 50%, transparent 100%)`,
          }}
          animate={{
            background: [
              `linear-gradient(to top, ${biome.lighting.mistColor}90 0%, ${biome.lighting.mistColor}35 50%, transparent 100%)`,
            ],
          }}
          transition={{ duration: 2.5 }}
        />
      </motion.div>
    </>
  );
}

function ForegroundLayer({ biome }: { biome: Biome }) {
  const { lighting } = biome;
  const dark = "#030705";
  return (
    <svg
      viewBox="0 0 1440 900"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      {/* Left pillar mass */}
      <rect x="0" y="0" width="280" height="900" fill={dark} />
      {/* Right pillar mass */}
      <rect x="1160" y="0" width="280" height="900" fill={dark} />
      {/* Top beam */}
      <rect x="0" y="0" width="1440" height="50" fill={dark} />

      {/* Left arch reveal — organic edge */}
      <motion.path
        d="M280 0 Q230 80 260 180 Q290 260 275 360 L275 900 L200 900 L200 340 Q215 240 185 150 Q155 50 220 0 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      {/* Right arch reveal */}
      <motion.path
        d="M1160 0 Q1210 80 1180 180 Q1150 260 1165 360 L1165 900 L1240 900 L1240 340 Q1225 240 1255 150 Q1285 50 1220 0 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />

      {/* Hanging foliage — top left */}
      <motion.path
        d="M0 0 L280 0 L280 50 Q220 30 170 70 Q130 40 90 80 Q60 50 30 90 Q10 60 0 100 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      {/* Hanging foliage droops left */}
      <motion.path
        d="M60 50 Q100 120 70 190 Q110 140 140 210 Q160 150 200 220 Q215 160 255 230 L280 220 L280 50 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.9}
      />

      {/* Hanging foliage — top right */}
      <motion.path
        d="M1440 0 L1160 0 L1160 50 Q1220 30 1270 70 Q1310 40 1350 80 Q1380 50 1410 90 Q1430 60 1440 100 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      {/* Hanging foliage droops right */}
      <motion.path
        d="M1380 50 Q1340 120 1370 190 Q1330 140 1300 210 Q1280 150 1240 220 Q1225 160 1185 230 L1160 220 L1160 50 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.9}
      />

      {/* Ground cover — bottom left corner */}
      <motion.path
        d="M0 900 L280 900 L280 830 Q210 810 150 845 Q90 825 30 860 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx={70}
        cy={878}
        rx={80}
        ry={38}
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx={200}
        cy={888}
        rx={65}
        ry={30}
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.8}
      />

      {/* Ground cover — bottom right corner */}
      <motion.path
        d="M1440 900 L1160 900 L1160 830 Q1230 810 1290 845 Q1350 825 1410 860 Z"
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx={1370}
        cy={878}
        rx={80}
        ry={38}
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx={1240}
        cy={888}
        rx={65}
        ry={30}
        animate={{ fill: lighting.canopyColor }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        opacity={0.8}
      />
    </svg>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const [activeBiome, setActiveBiome] = useState<Biome>(DEFAULT_BIOME);

  function handleBiomeSelect(biome: Biome) {
    setActiveBiome(biome);
    console.log("[FourSeasonsGarden] Active biome →", {
      id: biome.id,
      name: biome.name,
      location: biome.location,
      coordinates: biome.coordinates,
      season: biome.season,
      mood: biome.mood,
    });
  }

  const { lighting } = activeBiome;
  const latDir = activeBiome.coordinates.lat >= 0 ? "N" : "S";
  const lonDir = activeBiome.coordinates.lon >= 0 ? "E" : "W";

  return (
    <main className="relative h-screen w-screen overflow-hidden">

      {/* ── LAYER 0: Atmospheric Sky ─────────────────────── z-0 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-sky"}
          className="absolute inset-0 z-0"
          style={{ background: lighting.skyGradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Ambient glow orb — breathes with biome accent */}
      <motion.div
        className="pointer-events-none absolute z-0"
        style={{
          top: "8%",
          left: "28%",
          width: "44%",
          height: "32%",
          background: `radial-gradient(ellipse at center, ${lighting.glow} 0%, transparent 70%)`,
          filter: "blur(48px)",
        }}
        animate={{ opacity: [0.75, 1.1, 0.75], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── LAYER 1: Background — Mountain Range ─────────── z-10 */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <BackgroundLayer biome={activeBiome} />
      </div>

      {/* ── LAYER 2: Mid-ground — Garden Path & Mist ─────── z-20 */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <MidgroundLayer biome={activeBiome} />
      </div>

      {/* ── LAYER 3: Foreground — Threshold & Arch ───────── z-30 */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <ForegroundLayer biome={activeBiome} />
      </div>

      {/* ── LAYER 4: HUD ─────────────────────────────────── z-50 */}
      <div className="absolute right-6 top-6 z-50">
        <BiomeHUD active={activeBiome} onSelect={handleBiomeSelect} />
      </div>

      {/* Coordinates readout — bottom left */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-coords"}
          className="absolute bottom-6 left-7 z-50 flex items-center gap-2"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6 }}
        >
          <MapPin
            className="h-3 w-3 shrink-0"
            style={{ color: lighting.accent }}
          />
          <span
            className="font-mono text-[10px] tracking-widest"
            style={{ color: lighting.accent + "88" }}
          >
            {Math.abs(activeBiome.coordinates.lat).toFixed(4)}°{latDir}
            {"  "}
            {Math.abs(activeBiome.coordinates.lon).toFixed(4)}°{lonDir}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Season / mood label — bottom right */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBiome.id + "-mood"}
          className="absolute bottom-6 right-7 z-50 text-right"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p
            className="text-[9px] tracking-[0.2em] uppercase"
            style={{ color: lighting.accent + "55" }}
          >
            {activeBiome.season}
          </p>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
