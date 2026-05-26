"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import {
  formatClock,
  formatInches,
  formatTemperature,
  useBiomeWeather,
  useTicker,
} from "@/app/components/useBiomeWeather";
import { BIOMES, DEFAULT_BIOME_ID, getBiome } from "@/lib/constants/biomes";

export default function PondPage() {
  const [selectedId, setSelectedId] = useState(DEFAULT_BIOME_ID);
  const { weather, status } = useBiomeWeather();
  const now = useTicker();
  const biome = useMemo(() => getBiome(selectedId), [selectedId]);
  const selectedWeather = weather[selectedId];
  const timezone = selectedWeather?.resolvedLocation.timezone ?? biome.timezone;

  return (
    <AppShell title="Pond" eyebrow="Light, Rain, Moon">
      <section className="tool-grid pond-grid">
        <aside className="tool-sidebar">
          <label className="field-label" htmlFor="pond-biome">
            Location
          </label>
          <select
            id="pond-biome"
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
            <span>Local Time</span>
            <strong>{formatClock(now, timezone)}</strong>
          </div>
          <div className="mini-stat">
            <span>Biome</span>
            <strong>{biome.theme.label}</strong>
          </div>
        </aside>

        <section className="pond-stage">
          <div className="pond-orbit" data-phase={selectedWeather?.current.moon.phaseKey ?? "unknown"}>
            <span className="pond-moon" />
            <span className="pond-ripple ripple-a" />
            <span className="pond-ripple ripple-b" />
            <span className="pond-ripple ripple-c" />
          </div>
        </section>

        <section className="tool-panel pond-readout">
          {selectedWeather ? (
            <>
              <h2>{biome.name}</h2>
              <div className="weather-metrics">
                <div>
                  <span>Garden Phase</span>
                  <strong>{selectedWeather.current.timeOfDayLabel}</strong>
                </div>
                <div>
                  <span>Moon</span>
                  <strong>{selectedWeather.current.moon.phase}</strong>
                </div>
                <div>
                  <span>Illumination</span>
                  <strong>{Math.round(selectedWeather.current.moon.illumination * 100)}%</strong>
                </div>
                <div>
                  <span>Temperature</span>
                  <strong>{formatTemperature(selectedWeather.current.temperatureF)}</strong>
                </div>
                <div>
                  <span>Precipitation</span>
                  <strong>{formatInches(selectedWeather.current.precipitationIn)}</strong>
                </div>
                <div>
                  <span>Sunrise / Sunset</span>
                  <strong>
                    {selectedWeather.current.sun.sunrise.split("T")[1]} / {selectedWeather.current.sun.sunset.split("T")[1]}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>{status === "error" ? "Reflection unavailable" : "Reading the water"}</h2>
              <p>The pond will mirror the selected location when live weather arrives.</p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
