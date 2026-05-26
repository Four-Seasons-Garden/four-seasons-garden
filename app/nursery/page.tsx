"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import {
  formatClock,
  formatInches,
  formatTemperature,
  useBiomeWeather,
  useTicker,
} from "@/app/components/useBiomeWeather";
import { BIOMES, DEFAULT_BIOME_ID, getBiome } from "@/lib/constants/biomes";

const RANGES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

type HourlyPoint = {
  time: string;
  temperatureF: number;
  precipitationIn: number;
  rainIn: number;
  showersIn: number;
  snowfallIn: number;
  weatherCode: number | null;
  weatherLabel: string;
  timezone: string;
  fetchedAt: string;
};

type HourlyPayload = {
  biomeId: string;
  range: RangeId;
  requestedHours: number;
  availableHours: number;
  firstHour: string | null;
  lastHour: string | null;
  rows: HourlyPoint[];
  error?: string;
};

type ChartPoint = {
  time: string;
  temperatureF: number;
  precipitationIn: number;
  weatherLabel: string;
};

function useHourlyWeather(biomeId: string, range: RangeId) {
  const [payload, setPayload] = useState<HourlyPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setStatus("loading");
        const response = await fetch(`/api/weather/hourly?biome=${biomeId}&range=${range}`);
        const result = (await response.json()) as HourlyPayload;
        if (!response.ok) throw new Error(result.error ?? "Unable to load hourly weather.");
        if (!active) return;
        setPayload(result);
        setStatus("ready");
      } catch {
        if (!active) return;
        setPayload(null);
        setStatus("error");
      }
    }

    load();
    const refresh = window.setInterval(load, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [biomeId, range]);

  return { payload, status };
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(value));
}

function downsample(points: HourlyPoint[], maxPoints = 150): ChartPoint[] {
  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  const sampled: ChartPoint[] = [];

  for (let index = 0; index < points.length; index += step) {
    const chunk = points.slice(index, index + step);
    const temperatureF =
      chunk.reduce((sum, point) => sum + point.temperatureF, 0) / chunk.length;
    const precipitationIn = chunk.reduce(
      (sum, point) => sum + point.precipitationIn,
      0,
    );
    sampled.push({
      time: chunk[Math.floor(chunk.length / 2)].time,
      temperatureF,
      precipitationIn,
      weatherLabel: chunk[chunk.length - 1].weatherLabel,
    });
  }

  return sampled;
}

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function WeatherDiagram({
  rows,
  range,
}: {
  rows: HourlyPoint[];
  range: RangeId;
}) {
  const chart = useMemo(() => downsample(rows), [rows]);
  const width = 920;
  const height = 360;
  const pad = { top: 34, right: 34, bottom: 48, left: 48 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const temps = chart.map((point) => point.temperatureF);
  const minTemp = Math.floor(Math.min(...temps, 32) / 5) * 5;
  const maxTemp = Math.ceil(Math.max(...temps, 90) / 5) * 5;
  const maxPrecip = Math.max(...chart.map((point) => point.precipitationIn), 0.02);
  const xFor = (index: number) =>
    pad.left + (chart.length <= 1 ? 0 : (index / (chart.length - 1)) * innerWidth);
  const yForTemp = (temp: number) =>
    pad.top + ((maxTemp - temp) / Math.max(1, maxTemp - minTemp)) * innerHeight;
  const linePoints = chart.map((point, index) => ({
    x: xFor(index),
    y: yForTemp(point.temperatureF),
  }));
  const path = buildPath(linePoints);
  const latest = rows.at(-1);

  if (chart.length === 0) {
    return (
      <div className="nursery-diagram empty-diagram">
        <p>No hourly weather rows yet for this range.</p>
      </div>
    );
  }

  return (
    <div className="nursery-diagram">
      <div className="diagram-header">
        <div>
          <p className="kicker">Live Diagram</p>
          <h2>{range} weather rhythm</h2>
        </div>
        {latest && (
          <strong>
            {formatTemperature(latest.temperatureF)} · {latest.weatherLabel}
          </strong>
        )}
      </div>

      <svg className="weather-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Hourly temperature and precipitation chart">
        <defs>
          <linearGradient id="tempLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9d5c44" />
            <stop offset="48%" stopColor="#c49447" />
            <stop offset="100%" stopColor="#4f8a78" />
          </linearGradient>
          <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d89859" stopOpacity=".32" />
            <stop offset="100%" stopColor="#d89859" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pad.top + tick * innerHeight;
          const temp = maxTemp - tick * (maxTemp - minTemp);
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid" />
              <text x={pad.left - 12} y={y + 4} className="chart-axis" textAnchor="end">
                {Math.round(temp)}°
              </text>
            </g>
          );
        })}

        {chart.map((point, index) => {
          const barWidth = Math.max(2, innerWidth / chart.length * 0.48);
          const barHeight = (point.precipitationIn / maxPrecip) * (innerHeight * 0.46);
          const x = xFor(index) - barWidth / 2;
          const y = pad.top + innerHeight - barHeight;
          return (
            <rect
              key={`${point.time}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="2"
              className="precip-bar"
            />
          );
        })}

        <path
          d={`${path} L ${xFor(chart.length - 1)} ${pad.top + innerHeight} L ${pad.left} ${pad.top + innerHeight} Z`}
          fill="url(#tempFill)"
        />
        <path d={path} fill="none" stroke="url(#tempLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {linePoints.map((point, index) => (
          index % Math.ceil(linePoints.length / 12) === 0 || index === linePoints.length - 1 ? (
            <circle key={index} cx={point.x} cy={point.y} r="4" className="chart-dot" />
          ) : null
        ))}

        {chart.length > 1 && (
          <>
            <text x={pad.left} y={height - 16} className="chart-axis">
              {formatHour(chart[0].time)}
            </text>
            <text x={width - pad.right} y={height - 16} className="chart-axis" textAnchor="end">
              {formatHour(chart.at(-1)?.time ?? chart[0].time)}
            </text>
          </>
        )}
      </svg>

      <div className="diagram-legend">
        <span><i className="legend-temp" /> Temperature</span>
        <span><i className="legend-rain" /> Precipitation</span>
        <span>{rows.length} hourly rows · {chart.length} drawn points</span>
      </div>
    </div>
  );
}

export default function NurseryPage() {
  const [selectedId, setSelectedId] = useState(DEFAULT_BIOME_ID);
  const [range, setRange] = useState<RangeId>("day");
  const { weather, status, error } = useBiomeWeather();
  const { payload, status: hourlyStatus } = useHourlyWeather(selectedId, range);
  const now = useTicker();
  const biome = useMemo(() => getBiome(selectedId), [selectedId]);
  const selectedWeather = weather[selectedId];
  const timezone = selectedWeather?.resolvedLocation.timezone ?? biome.timezone;
  const rows = payload?.rows ?? [];
  const availableNote = payload && payload.availableHours < payload.requestedHours
    ? `${payload.availableHours} archived hours available for this ${range}.`
    : `${payload?.availableHours ?? 0} archived hours loaded.`;

  return (
    <AppShell title="Nursery" eyebrow="Live Weather Bench">
      <section className="tool-grid nursery-grid">
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

          <div className="range-control" aria-label="Weather range">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={range === item.id}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mini-stat">
            <span>Local Time</span>
            <strong>{formatClock(now, timezone)}</strong>
          </div>
          <div className="mini-stat">
            <span>Data</span>
            <strong>{hourlyStatus === "ready" ? availableNote : hourlyStatus}</strong>
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

              <WeatherDiagram rows={rows} range={range} />

              <div className="weather-metrics nursery-metrics">
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
