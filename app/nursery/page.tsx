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

export default function NurseryPage() {
  const [selectedId, setSelectedId] = useState(DEFAULT_BIOME_ID);
  const { weather, status, error } = useBiomeWeather();
  const now = useTicker();
  const biome = useMemo(() => getBiome(selectedId), [selectedId]);
  const selectedWeather = weather[selectedId];
  const timezone = selectedWeather?.resolvedLocation.timezone ?? biome.timezone;

  return (
    <AppShell title="Nursery" eyebrow="Live Weather Bench">
      <section className="tool-grid">
        <aside className="tool-sidebar">
          <label className="field-label" htmlFor="nursery-biome">
            Location
          </label>
          <select
            id="nursery-biome"
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
            <span>Source</span>
            <strong>{status === "ready" ? "Open-Meteo" : status}</strong>
          </div>
        </aside>

        <section className="tool-panel weather-live-panel">
          {selectedWeather ? (
            <>
              <div className="weather-hero">
                <div>
                  <p className="kicker">{biome.country}</p>
                  <h2>{biome.name}</h2>
                </div>
                <strong>{formatTemperature(selectedWeather.current.temperatureF)}</strong>
              </div>

              <div className="weather-metrics">
                <div>
                  <span>Condition</span>
                  <strong>{selectedWeather.current.weatherLabel}</strong>
                </div>
                <div>
                  <span>Feels Like</span>
                  <strong>{formatTemperature(selectedWeather.current.apparentTemperatureF)}</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{selectedWeather.current.relativeHumidity}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{Math.round(selectedWeather.current.windSpeedMph)} mph</strong>
                </div>
                <div>
                  <span>Precipitation</span>
                  <strong>{formatInches(selectedWeather.current.precipitationIn)}</strong>
                </div>
                <div>
                  <span>Cloud Cover</span>
                  <strong>{selectedWeather.current.cloudCover}%</strong>
                </div>
              </div>

              <div className="weather-days">
                {selectedWeather.daily.map((day) => (
                  <div key={day.date} className="day-row">
                    <span>{day.date}</span>
                    <strong>{day.weatherLabel}</strong>
                    <span>
                      {formatTemperature(day.temperatureMinF)} / {formatTemperature(day.temperatureMaxF)}
                    </span>
                    <span>{formatInches(day.precipitationSumIn)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>{status === "error" ? "Weather unavailable" : "Weather syncing"}</h2>
              <p>{error ?? "The selected location will appear here as soon as the garden receives live data."}</p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
