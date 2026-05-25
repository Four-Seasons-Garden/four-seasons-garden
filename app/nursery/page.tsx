"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Cpu,
  ImagePlus,
  FlaskConical,
  Sprout,
} from "lucide-react";

const pipelineSteps = [
  {
    icon: ImagePlus,
    step: "01",
    title: "Upload",
    description: "Drop a photo of any plant. Stored to Supabase Storage.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Classify",
    description: "AI vision pipeline identifies species, genus, and family.",
  },
  {
    icon: FlaskConical,
    step: "03",
    title: "Enrich",
    description: "Lore, growing conditions, and seasonal metadata generated.",
  },
  {
    icon: Sprout,
    step: "04",
    title: "Plant",
    description: "Specimen enters the garden — live in Greenhouse & Sūtra.",
  },
];

export default function NurseryPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b07]">
      {/* Warm soil gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(90,55,20,0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 30% at 20% 10%, rgba(60,100,40,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between border-b border-stone-800/40 px-8 py-5"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-stone-700 transition-colors hover:text-stone-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-widest uppercase">
              Canvas
            </span>
          </Link>
          <span className="text-stone-800">|</span>
          <span className="text-xs tracking-widest text-stone-500 uppercase">
            Nursery
          </span>
        </div>
        <Sprout className="h-4 w-4 text-stone-700/60" />
      </motion.header>

      <div className="relative z-10 mx-auto max-w-2xl px-8 py-20">
        {/* Hero */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <p className="mb-4 text-[9px] tracking-[0.35em] text-stone-700 uppercase">
            Ingestion Engine · AI Vision Pipeline
          </p>
          <h1 className="mb-5 text-5xl font-light tracking-tight text-stone-300/90 md:text-6xl">
            The Nursery
          </h1>
          <div className="mx-auto mb-6 h-px w-20 bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-stone-600">
            A cozy potting bench. Upload a plant photo and watch the garden&apos;s
            intelligence classify, name, and lore-wrap every specimen before
            planting it into the archive.
          </p>
        </motion.div>

        {/* Upload drop-zone placeholder */}
        <motion.div
          className="mb-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-800/60 bg-stone-950/30 px-8 py-14 text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          whileHover={{ borderColor: "rgba(120,100,70,0.5)" }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Upload className="mx-auto mb-4 h-8 w-8 text-stone-700" />
          </motion.div>
          <p className="mb-1 text-sm text-stone-500">
            Drop a plant photo here
          </p>
          <p className="text-[10px] text-stone-800">
            PNG, JPG, HEIC · Coming soon
          </p>
        </motion.div>

        {/* Pipeline steps */}
        <div className="grid gap-3 sm:grid-cols-2">
          {pipelineSteps.map((s, i) => (
            <motion.div
              key={s.step}
              className="group rounded-xl border border-stone-900/60 bg-stone-950/20 p-5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 + i * 0.08 }}
              whileHover={{ borderColor: "rgba(120,100,60,0.3)" }}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] text-stone-800">
                  {s.step}
                </span>
                <s.icon className="h-3.5 w-3.5 text-stone-700 transition-colors group-hover:text-stone-500" />
              </div>
              <p className="mb-1 text-xs font-medium text-stone-400">
                {s.title}
              </p>
              <p className="text-[11px] leading-relaxed text-stone-700">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-12 text-center text-[9px] tracking-widest text-stone-900 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Awaiting first seed · Pipeline offline
        </motion.p>
      </div>
    </main>
  );
}
