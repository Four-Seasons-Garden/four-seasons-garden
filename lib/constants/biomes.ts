/* Four Seasons Garden — biome configuration.
   Each biome defines a CSS-variable palette that re-skins the whole watercolor
   scene, plus an `effects` block that toggles per-biome weather particle
   layers (rain, snow, aurora, blossoms, mist, rainbow, fireflies). */

export type BiomePalette = Partial<{
  "sky-top": string;
  "sky-mid": string;
  "sky-low": string;
  "cloud": string;
  "sun-warm": string;
  "hill-far": string;
  "hill-mid": string;
  "hill-near": string;
  "tree-far": string;
  "wall": string;
  "wall-wash": string;
  "thatch": string;
  "thatch-wash": string;
  "thatch-shadow": string;
  "brick": string;
  "brick-dark": string;
  "beam": string;
  "door-warm": string;
  "window-glow": string;
  "leaf-deep": string;
  "leaf-cottage": string;
  "leaf-fresh": string;
  "leaf-sage": string;
  "moss": string;
  "rose-deep": string;
  "rose-pale": string;
  "lavender-deep": string;
  "lavender-pale": string;
  "butter": string;
  "center-deep": string;
  "poppy": string;
  "poppy-light": string;
  "earth": string;
  "earth-dark": string;
  "tomato-deep": string;
  "tomato-light": string;
  "lettuce": string;
  "lettuce-deep": string;
  "lettuce-light": string;
  "pumpkin": string;
  "pumpkin-deep": string;
  "pumpkin-light": string;
  "carrot-tops": string;
  "stone": string;
  "stone-light": string;
  "dirt": string;
  "door-wash": string;
  "door-deep": string;
  "step": string;
  "step-shadow": string;
  "step-crack": string;
  "picket": string;
  "pot-light": string;
  "pot-deep": string;
  "pot-soil": string;
  "brass": string;
  "hud-text": string;
  "hud-tint": string;
}>;

export type BiomeEffects = {
  sun?: "golden" | "pale" | "diffuse" | "tropical";
  rain?: "mild" | "heavy" | "shower";
  snow?: boolean;
  aurora?: boolean;
  rainbow?: boolean;
  mist?: "light" | "heavy";
  blossoms?: "cherry" | "maple" | "plumeria";
  fireflies?: boolean;
};

export type Biome = {
  id: string;
  name: string;          // full "Williamsburg, VA"
  shortName: string;     // dropdown label
  country: string;
  coords: { lat: number; lon: number };
  timezone: string;
  blurb: string;
  glyph: string;         // single letter shown in the HUD chip
  theme: {
    label: string;       // category label e.g. "Subarctic frost"
    lighting: string;    // free-form name, useful for analytics
    keyFeature: string;  // weather-chip text
    palette: BiomePalette;
  };
  effects: BiomeEffects;
};

export const BIOMES: readonly Biome[] = [
  {
    id: "williamsburg",
    name: "Williamsburg, VA",
    shortName: "Williamsburg",
    country: "United States",
    coords: { lat: 37.2695, lon: -76.7075 },
    timezone: "America/New_York",
    blurb: "Four-season cottage garden, golden-hour glow",
    glyph: "W",
    theme: {
      label: "Classic four seasons",
      lighting: "golden-hour",
      keyFeature: "Mild rain & black-eyed susans",
      palette: {
        "sky-top": "#e9d6c2",
        "sky-mid": "#f4dcb6",
        "sky-low": "#fbe9c5",
        "cloud":   "#fbf3df",
        "sun-warm":"#fbd58a",
        "hill-far":"#c9c1bc",
        "hill-mid":"#a4ad94",
        "hill-near":"#8b9e78",
        "wall":    "#e6c895",
        "thatch":  "#a4624a",
        "window-glow": "#ffd989",
      },
    },
    effects: { sun: "golden", rain: "mild", fireflies: false },
  },
  {
    id: "akureyri",
    name: "Akureyri, Iceland",
    shortName: "Akureyri",
    country: "Iceland",
    coords: { lat: 65.6835, lon: -18.1105 },
    timezone: "Atlantic/Reykjavik",
    blurb: "Subarctic stillness, auroras over frozen meadow",
    glyph: "A",
    theme: {
      label: "Subarctic frost",
      lighting: "pale-arctic",
      keyFeature: "Snow drift & aurora",
      palette: {
        "sky-top": "#1f2a44",
        "sky-mid": "#3a4d6e",
        "sky-low": "#6f8aa6",
        "cloud":   "#cad8e0",
        "sun-warm":"#cdd4dc",
        "hill-far":"#7c8a98",
        "hill-mid":"#a5b1bd",
        "hill-near":"#cad5dc",
        "tree-far":"#46586a",
        "wall":    "#d8d4c8",
        "thatch":  "#7c6a52",
        "window-glow": "#fff1bd",
        "leaf-deep": "#2f3e3b",
        "leaf-cottage": "#5a7068",
        "hud-text": "#f4eee0",
        "hud-tint": "#1a2236",
      },
    },
    effects: { sun: "pale", snow: true, aurora: true, mist: "light" },
  },
  {
    id: "hualien",
    name: "Hualien, Taiwan",
    shortName: "Hualien",
    country: "Taiwan",
    coords: { lat: 23.977, lon: 121.607 },
    timezone: "Asia/Taipei",
    blurb: "Subtropical thunder, mist climbing the mountainside",
    glyph: "H",
    theme: {
      label: "Subtropical monsoon",
      lighting: "storm-bright",
      keyFeature: "Thunderhead & thick mist",
      palette: {
        "sky-top": "#34384a",
        "sky-mid": "#566576",
        "sky-low": "#8d9aa4",
        "cloud":   "#b8c0c8",
        "sun-warm":"#c9d1d8",
        "hill-far":"#5e6f6c",
        "hill-mid":"#6a8074",
        "hill-near":"#5a7268",
        "tree-far":"#3a4a40",
        "wall":    "#dcc8a0",
        "thatch":  "#7a4a32",
        "window-glow": "#ffd989",
        "leaf-deep": "#2e3e2c",
        "leaf-cottage": "#577c4a",
        "leaf-fresh": "#7a9c5a",
        "hud-text": "#f4eee0",
        "hud-tint": "#1c2a2c",
      },
    },
    effects: { sun: "diffuse", rain: "heavy", mist: "heavy" },
  },
  {
    id: "kyoto",
    name: "Kyoto, Japan",
    shortName: "Kyoto",
    country: "Japan",
    coords: { lat: 35.0116, lon: 135.7681 },
    timezone: "Asia/Tokyo",
    blurb: "Pink cosmos & drifting petals against dusk-pink roofs",
    glyph: "K",
    theme: {
      label: "Seasonal poetics",
      lighting: "soft-pastel",
      keyFeature: "Cherry blossoms / maple leaves",
      palette: {
        "sky-top": "#e0c2c4",
        "sky-mid": "#f1d2c8",
        "sky-low": "#f8e4d2",
        "cloud":   "#f7e8e4",
        "sun-warm":"#f6c8b0",
        "hill-far":"#a89fa0",
        "hill-mid":"#8e9988",
        "hill-near":"#788c7a",
        "wall":    "#f4ecdf",
        "thatch":  "#5a4e4a",
        "window-glow": "#ffd989",
        "leaf-deep": "#445242",
        "leaf-cottage": "#7c9472",
      },
    },
    effects: { sun: "golden", blossoms: "cherry", mist: "light" },
  },
  {
    id: "manoa",
    name: "Mānoa Falls, HI",
    shortName: "Mānoa",
    country: "United States",
    coords: { lat: 21.3331, lon: -157.8009 },
    timezone: "Pacific/Honolulu",
    blurb: "Emerald rainforest, sun-shower rainbows over the falls",
    glyph: "M",
    theme: {
      label: "Deep tropical rainforest",
      lighting: "emerald-canopy",
      keyFeature: "Mist, canopy light & sun-shower rainbow",
      palette: {
        "sky-top": "#5a8a8e",
        "sky-mid": "#a8c5b4",
        "sky-low": "#d8e6c8",
        "cloud":   "#e8efd8",
        "sun-warm":"#f6e0a4",
        "hill-far":"#3e6a52",
        "hill-mid":"#2e5840",
        "hill-near":"#1f4630",
        "tree-far":"#173626",
        "wall":    "#d4c290",
        "thatch":  "#5a3a26",
        "window-glow": "#ffe78a",
        "leaf-deep": "#1d3a22",
        "leaf-cottage": "#3a6240",
        "leaf-fresh": "#5a8a4a",
        "leaf-sage": "#4a7858",
      },
    },
    effects: { sun: "tropical", rain: "shower", rainbow: true, mist: "heavy" },
  },
] as const;

export const DEFAULT_BIOME_ID = "williamsburg";

export function getBiome(id: string): Biome {
  return BIOMES.find((b) => b.id === id) ?? BIOMES[0];
}
