export type BiomeLighting = {
  skyGradient: string;
  mistColor: string;
  canopyColor: string;
  mountainColor: string;
  groundColor: string;
  accent: string;
  glow: string;
  particle: "none" | "snow" | "rain" | "petals" | "mist";
};

export type Biome = {
  id: string;
  name: string;
  location: string;
  flag: string;
  coordinates: { lat: number; lon: number };
  season: string;
  mood: string;
  lighting: BiomeLighting;
};

export const BIOMES: readonly Biome[] = [
  {
    id: "williamsburg",
    name: "Williamsburg",
    location: "Virginia, USA",
    flag: "🇺🇸",
    coordinates: { lat: 37.2695, lon: -76.7075 },
    season: "Four Seasons",
    mood: "Golden Hour Reverie",
    lighting: {
      skyGradient:
        "linear-gradient(180deg, #2d1a00 0%, #1a0f02 35%, #0a150a 70%, #050d05 100%)",
      mistColor: "#4a7c5e",
      canopyColor: "#1f3d1a",
      mountainColor: "#152810",
      groundColor: "#1a2e10",
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.18)",
      particle: "none",
    },
  },
  {
    id: "akureyri",
    name: "Akureyri",
    location: "Iceland",
    flag: "🇮🇸",
    coordinates: { lat: 65.6835, lon: -18.1105 },
    season: "Subarctic Winter",
    mood: "Aurora Stillness",
    lighting: {
      skyGradient:
        "linear-gradient(180deg, #020617 0%, #071a3e 35%, #051e2e 70%, #030f1a 100%)",
      mistColor: "#1a3d5c",
      canopyColor: "#0a1f30",
      mountainColor: "#0d2a3d",
      groundColor: "#142233",
      accent: "#67e8f9",
      glow: "rgba(103,232,249,0.14)",
      particle: "snow",
    },
  },
  {
    id: "hualien",
    name: "Hualien",
    location: "Taiwan",
    flag: "🇹🇼",
    coordinates: { lat: 23.977, lon: 121.607 },
    season: "Subtropical Storm",
    mood: "Monsoon Thunder",
    lighting: {
      skyGradient:
        "linear-gradient(180deg, #080c0a 0%, #111b14 35%, #0c1a0e 70%, #060f07 100%)",
      mistColor: "#2a4a38",
      canopyColor: "#142e1c",
      mountainColor: "#1a3a22",
      groundColor: "#1a3028",
      accent: "#6ee7b7",
      glow: "rgba(110,231,183,0.11)",
      particle: "rain",
    },
  },
  {
    id: "kyoto",
    name: "Kyoto",
    location: "Japan",
    flag: "🇯🇵",
    coordinates: { lat: 35.0116, lon: 135.7681 },
    season: "Sakura Season",
    mood: "Blossom Drift",
    lighting: {
      skyGradient:
        "linear-gradient(180deg, #1a0814 0%, #2d0f1e 35%, #1a0a15 70%, #0d050a 100%)",
      mistColor: "#5c2a3a",
      canopyColor: "#3d1530",
      mountainColor: "#2d1020",
      groundColor: "#2a0f1a",
      accent: "#f9a8d4",
      glow: "rgba(249,168,212,0.14)",
      particle: "petals",
    },
  },
  {
    id: "manoa",
    name: "Mānoa Falls",
    location: "Hawaiʻi, USA",
    flag: "🌺",
    coordinates: { lat: 21.3331, lon: -157.8009 },
    season: "Tropical Rainforest",
    mood: "Emerald Canopy",
    lighting: {
      skyGradient:
        "linear-gradient(180deg, #001408 0%, #002410 35%, #011c0d 70%, #000f06 100%)",
      mistColor: "#1a4d35",
      canopyColor: "#0a2d1a",
      mountainColor: "#0f3520",
      groundColor: "#0d2a18",
      accent: "#34d399",
      glow: "rgba(52,211,153,0.16)",
      particle: "mist",
    },
  },
] as const;

export const DEFAULT_BIOME = BIOMES[0];
