export type BiomeLighting = {
  skyGradient: string;
  atmosphericHaze: string;   // rgba for horizon depth fog
  mountainColor: string;
  treeFar: string;
  treeMid: string;
  grassBase: string;
  grassShadow: string;
  pathStone: string;
  pathStoneShadow: string;
  flowerPrimary: string;
  flowerSecondary: string;
  flowerTertiary: string;
  flowerCenter: string;
  stemColor: string;
  leafColor: string;
  foliageDark: string;
  mistOverlay: string;       // rgba for ground mist
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
        "linear-gradient(180deg, #1c3050 0%, #3a4870 16%, #b06828 36%, #d89038 50%, #c8a848 62%, #7a9030 74%, #3d6820 84%, #2a4818 100%)",
      atmosphericHaze: "rgba(200,150,60,0.22)",
      mountainColor: "#5a7838",
      treeFar: "#1a3010",
      treeMid: "#243e14",
      grassBase: "#3d6820",
      grassShadow: "#2a4a15",
      pathStone: "#d4c49c",
      pathStoneShadow: "#b8a878",
      flowerPrimary: "#d82020",
      flowerSecondary: "#f5c010",
      flowerTertiary: "#f07040",
      flowerCenter: "#7a3808",
      stemColor: "#3d7520",
      leafColor: "#4a8828",
      foliageDark: "#1a3810",
      mistOverlay: "rgba(200,160,70,0.12)",
      accent: "#f5c010",
      glow: "rgba(220,150,40,0.22)",
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
        "linear-gradient(180deg, #05080f 0%, #0a1428 18%, #081c38 38%, #0c2838 55%, #082028 72%, #040e12 100%)",
      atmosphericHaze: "rgba(60,160,200,0.20)",
      mountainColor: "#3a5878",
      treeFar: "#0c1610",
      treeMid: "#101c14",
      grassBase: "#c8d8e8",
      grassShadow: "#a0b8cc",
      pathStone: "#d0dce8",
      pathStoneShadow: "#a8bccc",
      flowerPrimary: "#40d090",
      flowerSecondary: "#8060e0",
      flowerTertiary: "#60a8e8",
      flowerCenter: "#e8f4ff",
      stemColor: "#304848",
      leafColor: "#283830",
      foliageDark: "#0a1008",
      mistOverlay: "rgba(40,100,150,0.22)",
      accent: "#67e8f9",
      glow: "rgba(60,200,180,0.18)",
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
        "linear-gradient(180deg, #08100a 0%, #101a10 20%, #182818 40%, #1c3020 58%, #142218 78%, #0c1810 100%)",
      atmosphericHaze: "rgba(60,120,80,0.22)",
      mountainColor: "#2a4a28",
      treeFar: "#0a2010",
      treeMid: "#102818",
      grassBase: "#2a5828",
      grassShadow: "#1a3c18",
      pathStone: "#584838",
      pathStoneShadow: "#3c3028",
      flowerPrimary: "#d040a0",
      flowerSecondary: "#f06028",
      flowerTertiary: "#38c060",
      flowerCenter: "#ffd080",
      stemColor: "#1a5020",
      leafColor: "#206828",
      foliageDark: "#082010",
      mistOverlay: "rgba(40,80,55,0.32)",
      accent: "#6ee7b7",
      glow: "rgba(60,200,120,0.14)",
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
        "linear-gradient(180deg, #b898d0 0%, #d8b0d4 20%, #f0c8e0 40%, #f8d8e8 55%, #e0c0c0 68%, #98b040 80%, #709030 100%)",
      atmosphericHaze: "rgba(240,180,210,0.25)",
      mountainColor: "#a07898",
      treeFar: "#5a3850",
      treeMid: "#7a5068",
      grassBase: "#88a838",
      grassShadow: "#6a8830",
      pathStone: "#c8a888",
      pathStoneShadow: "#a88868",
      flowerPrimary: "#f4a0c0",
      flowerSecondary: "#f8d8e8",
      flowerTertiary: "#e84880",
      flowerCenter: "#ffd8e8",
      stemColor: "#4a7818",
      leafColor: "#5a9028",
      foliageDark: "#382840",
      mistOverlay: "rgba(220,180,210,0.18)",
      accent: "#f9a8d4",
      glow: "rgba(249,168,212,0.22)",
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
        "linear-gradient(180deg, #081a0c 0%, #102418 18%, #183020 38%, #1a3820 58%, #102818 78%, #081808 100%)",
      atmosphericHaze: "rgba(40,120,70,0.22)",
      mountainColor: "#1a4c22",
      treeFar: "#0a2810",
      treeMid: "#103818",
      grassBase: "#1e5c28",
      grassShadow: "#143c18",
      pathStone: "#4a5840",
      pathStoneShadow: "#2e3828",
      flowerPrimary: "#e84830",
      flowerSecondary: "#c030a0",
      flowerTertiary: "#30d890",
      flowerCenter: "#ffd060",
      stemColor: "#186028",
      leafColor: "#207830",
      foliageDark: "#082010",
      mistOverlay: "rgba(30,80,50,0.35)",
      accent: "#34d399",
      glow: "rgba(52,211,153,0.18)",
      particle: "mist",
    },
  },
] as const;

export const DEFAULT_BIOME = BIOMES[0];
