"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Terminal, Database, Key, Activity, ArrowLeft } from "lucide-react";

const panels = [
  {
    icon: Terminal,
    label: "System Console",
    description: "Global state overrides & biome injection",
    status: "offline",
  },
  {
    icon: Key,
    label: "API Keys",
    description: "Weather, AI vision & Supabase credentials",
    status: "offline",
  },
  {
    icon: Database,
    label: "Database Metrics",
    description: "Raw Supabase table counts & storage usage",
    status: "offline",
  },
  {
    icon: Activity,
    label: "Pipeline Health",
    description: "AI classification queue & error rates",
    status: "offline",
  },
];

export default function MySecretGardenPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#030a05]">
      {/* Scan-line texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #00ff41 0px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(52,211,153,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between border-b border-emerald-900/40 px-8 py-5"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-emerald-700 transition-colors hover:text-emerald-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] tracking-widest uppercase">
              Canvas
            </span>
          </Link>
          <span className="text-emerald-900">|</span>
          <span className="font-mono text-xs tracking-widest text-emerald-500 uppercase">
            My Secret Garden
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="font-mono text-[9px] tracking-widest text-emerald-700 uppercase">
            Initialising
          </span>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-16">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          <p className="mb-3 font-mono text-[9px] tracking-[0.3em] text-emerald-700 uppercase">
            Private Command Centre
          </p>
          <h1 className="font-mono text-4xl font-bold tracking-tight text-emerald-400 md:text-5xl">
            my-secret-garden
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-800">
            Operational dashboard for managing global states, testing API keys,
            and monitoring raw database metrics.
          </p>
        </motion.div>

        {/* Panel grid */}
        <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
          {panels.map((panel, i) => (
            <motion.div
              key={panel.label}
              className="group rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-5 backdrop-blur-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
              whileHover={{ borderColor: "rgba(52,211,153,0.25)" }}
            >
              <div className="mb-3 flex items-start justify-between">
                <panel.icon className="h-4 w-4 text-emerald-700 transition-colors group-hover:text-emerald-500" />
                <span className="font-mono text-[8px] tracking-widest text-emerald-900 uppercase">
                  {panel.status}
                </span>
              </div>
              <p className="mb-1 text-xs font-medium text-emerald-500">
                {panel.label}
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                {panel.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-10 font-mono text-[9px] tracking-widest text-emerald-900 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Under Construction — Seeds Germinating
        </motion.p>
      </div>
    </main>
  );
}
