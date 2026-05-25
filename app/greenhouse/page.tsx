"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Archive, Grid3X3, Layers } from "lucide-react";

const placeholderCells = Array.from({ length: 12 }, (_, i) => i);

export default function GreenhousePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050c0d]">
      {/* Glass-light refraction gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% -10%, rgba(100,200,220,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 90% 90%, rgba(60,160,180,0.04) 0%, transparent 55%)",
        }}
      />

      {/* Subtle grid lines — glass-pane effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(140,220,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(140,220,230,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between border-b border-cyan-900/30 px-8 py-5"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-cyan-900 transition-colors hover:text-cyan-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-widest text-cyan-900 uppercase">
              Canvas
            </span>
          </Link>
          <span className="text-cyan-950">|</span>
          <span className="text-xs tracking-widest text-cyan-700/80 uppercase">
            Greenhouse
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Grid3X3 className="h-3.5 w-3.5 text-cyan-900/50" />
          <Layers className="h-3.5 w-3.5 text-cyan-900/50" />
        </div>
      </motion.header>

      <div className="relative z-10 mx-auto max-w-5xl px-8 py-16">
        {/* Hero */}
        <motion.div
          className="mb-14 flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <p className="mb-3 text-[9px] tracking-[0.35em] text-cyan-900/70 uppercase">
              Glass-Walled Conservatory · Specimen Archive
            </p>
            <h1 className="text-5xl font-light tracking-tight text-cyan-200/80 md:text-6xl">
              The Greenhouse
            </h1>
          </div>
          <Archive className="mb-1 h-8 w-8 shrink-0 text-cyan-900/30" />
        </motion.div>

        <motion.div
          className="mb-12 h-px bg-gradient-to-r from-cyan-900/40 via-cyan-700/20 to-transparent"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        <motion.p
          className="mb-12 max-w-sm text-sm leading-relaxed text-cyan-900/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Every specimen ever ingested through the Nursery rests here —
          dormant, catalogued, and waiting. A gallery of the garden&apos;s full
          botanical memory.
        </motion.p>

        {/* Specimen grid — placeholder cells */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {placeholderCells.map((i) => (
            <motion.div
              key={i}
              className="group aspect-square rounded-xl border border-cyan-900/25 bg-cyan-950/15 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.04 }}
              whileHover={{
                borderColor: "rgba(103,232,249,0.18)",
                backgroundColor: "rgba(8,60,70,0.3)",
              }}
            >
              {/* Empty specimen slot */}
              <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
                <div className="h-8 w-8 rounded-full border border-cyan-900/30 bg-cyan-950/30" />
                <div className="h-1.5 w-12 rounded-full bg-cyan-950/40" />
                <div className="h-1 w-8 rounded-full bg-cyan-950/25" />
              </div>
            </motion.div>
          ))}

          {/* "Add first" prompt cell */}
          <motion.div
            className="aspect-square rounded-xl border border-dashed border-cyan-900/30 bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            whileHover={{ borderColor: "rgba(103,232,249,0.25)" }}
          >
            <Link
              href="/nursery"
              className="flex h-full flex-col items-center justify-center gap-2 text-cyan-900 transition-colors hover:text-cyan-700"
            >
              <span className="text-2xl font-light">+</span>
              <span className="text-[9px] tracking-widest uppercase">
                Plant first
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.p
          className="mt-12 text-center text-[9px] tracking-widest text-cyan-950/80 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          0 specimens archived · Awaiting nursery intake
        </motion.p>
      </div>
    </main>
  );
}
