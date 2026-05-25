"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, Feather, Leaf, ScrollText } from "lucide-react";

const entries = [
  {
    glyph: "一",
    title: "On the Nature of Roots",
    excerpt:
      "Every plant that enters the garden carries a memory older than the soil it rests in. The AI sees what the eye forgets — lineage written in leaf-edge geometry.",
  },
  {
    glyph: "二",
    title: "The Language of Dormancy",
    excerpt:
      "A plant archived is not a plant forgotten. In the greenhouse the specimens sleep, holding their season still, waiting for the archivist's eye to return.",
  },
  {
    glyph: "三",
    title: "Weather as Witness",
    excerpt:
      "Rain falling on Hualien and snow settling on Akureyri speak to the same garden from opposite ends of the earth. The canvas listens to both.",
  },
];

export default function GardenSutraPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d0a06]">
      {/* Parchment texture gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(180,130,60,0.07) 0%, transparent 65%), radial-gradient(ellipse 40% 60% at 80% 100%, rgba(120,80,30,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between border-b border-amber-900/30 px-8 py-5"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-amber-900 transition-colors hover:text-amber-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-widest text-amber-900 uppercase">
              Canvas
            </span>
          </Link>
          <span className="text-amber-950">|</span>
          <span className="text-xs tracking-widest text-amber-700 uppercase">
            Garden Sūtra
          </span>
        </div>
        <Feather className="h-4 w-4 text-amber-900/60" />
      </motion.header>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-3xl px-8 py-20">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="mb-4 text-[9px] tracking-[0.35em] text-amber-900/70 uppercase">
            Botanical Journal · AI-Generated Lore
          </p>
          <h1
            className="mb-6 text-5xl font-light tracking-wide text-amber-200/90 md:text-6xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Garden Sūtra
          </h1>
          <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-amber-800/50 to-transparent" />
          <p className="mx-auto max-w-sm text-sm leading-loose text-amber-900/80">
            An ever-growing encyclopedia of every plant that has passed through
            the nursery. Lore, lineage, and living memory — written by the
            garden&apos;s own intelligence.
          </p>
        </motion.div>

        {/* Section icons */}
        <motion.div
          className="mb-14 flex justify-center gap-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {[
            { icon: Leaf, label: "Flora" },
            { icon: BookOpen, label: "Lore" },
            { icon: ScrollText, label: "History" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-900/30 bg-amber-950/30">
                <Icon className="h-4 w-4 text-amber-700/70" />
              </div>
              <span className="text-[9px] tracking-widest text-amber-900/50 uppercase">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Sample entries */}
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <motion.article
              key={entry.title}
              className="group border-b border-amber-900/20 py-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.12 }}
            >
              <div className="flex gap-6">
                <span
                  className="mt-0.5 shrink-0 text-3xl text-amber-900/30"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {entry.glyph}
                </span>
                <div>
                  <h2
                    className="mb-3 text-lg font-light text-amber-300/80 transition-colors group-hover:text-amber-200"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {entry.title}
                  </h2>
                  <p className="text-sm leading-loose text-amber-900/70">
                    {entry.excerpt}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.p
          className="mt-14 text-center text-[9px] tracking-widest text-amber-950 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          First entries will appear once plants are ingested via the Nursery
        </motion.p>
      </div>
    </main>
  );
}
