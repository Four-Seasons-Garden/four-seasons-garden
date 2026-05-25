"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0d1117]">
      {/* Starfield backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a2a1a_0%,_#0d1117_70%)]" />

      {/* Floating mist layers */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 80%, #2d5a27 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Title */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        </motion.div>

        <h1 className="font-serif text-5xl font-bold tracking-wide text-stone-100 drop-shadow-[0_2px_24px_rgba(52,211,153,0.3)] md:text-7xl">
          The Secret Garden
        </h1>

        <p className="max-w-md text-lg text-stone-400 md:text-xl">
          A living world beyond the threshold — step through when you're ready.
        </p>
      </motion.div>

      {/* The Threshold — glowing garden door */}
      <motion.div
        className="relative z-10 mt-16"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 1.0, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* SVG door / threshold */}
        <svg
          width="160"
          height="220"
          viewBox="0 0 160 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_0_32px_rgba(52,211,153,0.6)]"
        >
          {/* Door frame */}
          <rect x="10" y="20" width="140" height="190" rx="70" fill="#1a2e1a" stroke="#34d399" strokeWidth="3" />

          {/* Glowing garden light through the door */}
          <ellipse cx="80" cy="115" rx="55" ry="80" fill="url(#gardenGlow)" />

          {/* Door handle */}
          <circle cx="105" cy="120" r="6" fill="#34d399" opacity="0.8" />

          {/* Hint of foliage silhouette */}
          <path
            d="M30 180 Q45 150 60 165 Q55 140 75 148 Q70 125 90 138 Q100 115 115 135 Q125 118 138 140 L138 210 L22 210 Z"
            fill="#0d2b0d"
            opacity="0.7"
          />

          <defs>
            <radialGradient id="gardenGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#4ade80" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Enter CTA */}
      <motion.button
        className="relative z-10 mt-10 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-8 py-3 text-sm font-medium tracking-widest text-emerald-300 uppercase backdrop-blur-sm transition-colors hover:bg-emerald-900/60 hover:text-emerald-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        Enter the Garden
      </motion.button>
    </main>
  );
}
