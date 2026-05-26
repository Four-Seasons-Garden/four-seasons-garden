"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { formatTemperature, useBiomeWeather } from "@/app/components/useBiomeWeather";
import { BIOMES, DEFAULT_BIOME_ID, getBiome } from "@/lib/constants/biomes";

export default function GreenhousePage() {
  const [selectedId, setSelectedId] = useState(DEFAULT_BIOME_ID);
  const { weather } = useBiomeWeather();
  const biome = useMemo(() => getBiome(selectedId), [selectedId]);
  const selectedWeather = weather[selectedId];
  const paletteEntries = Object.entries(biome.theme.palette);
  const effectEntries = Object.entries(biome.effects).filter(([, value]) => Boolean(value));

  return (
    <AppShell title="Greenhouse" eyebrow="Biome Workshop">
      <section className="tool-grid">
        <aside className="tool-sidebar">
          <label className="field-label" htmlFor="greenhouse-biome">
            Biome
          </label>
          <select
            id="greenhouse-biome"
            className="field-select"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {BIOMES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="mini-stat">
            <span>Lighting</span>
            <strong>{biome.theme.lighting}</strong>
          </div>
          <div className="mini-stat">
            <span>Current</span>
            <strong>
              {selectedWeather
                ? `${formatTemperature(selectedWeather.current.temperatureF)} ${selectedWeather.current.weatherLabel}`
                : biome.theme.keyFeature}
            </strong>
          </div>
        </aside>

        <section className="tool-panel">
          <div className="weather-hero">
            <div>
              <p className="kicker">{biome.country}</p>
              <h2>{biome.name}</h2>
            </div>
            <strong>{biome.glyph}</strong>
          </div>
          <p className="panel-copy">{biome.blurb}</p>

          <div className="swatch-grid">
            {paletteEntries.map(([name, value]) => (
              <div key={name} className="swatch-row">
                <span className="swatch" style={{ background: value }} />
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="tool-panel">
          <h2>Effects</h2>
          <div className="effect-list">
            {effectEntries.map(([name, value]) => (
              <div key={name} className="effect-pill">
                <span>{name}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
          <div className="greenhouse-preview" style={{ background: biome.theme.palette["sky-low"] }}>
            <span style={{ background: biome.theme.palette["hill-near"] }} />
            <span style={{ background: biome.theme.palette["leaf-cottage"] }} />
            <span style={{ background: biome.theme.palette["sun-warm"] }} />
          </div>
        </section>
      </section>
    </AppShell>
  );
}
