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

    async function load(markLoading = false) {
      try {
        if (markLoading) setStatus("loading");
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

    load(true);
    const refresh = window.setInterval(() => load(false), 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [biomeId, range]);

  return { payload, status };
}

function fahrenheitToCelsius(value: number) {
  return (value - 32) * 5 / 9;
}

function inchesToMillimeters(value: number) {
  return value * 25.4;
}

function mphToKph(value: number) {
  return value * 1.609344;
}

function formatCelsius(valueF: number) {
  return `${Math.round(fahrenheitToCelsius(valueF))}°C`;
}

function formatMillimeters(valueIn: number) {
  const millimeters = inchesToMillimeters(valueIn);
  return `${millimeters.toFixed(millimeters >= 10 ? 1 : 2)} mm`;
}

function formatTemperaturePair(valueF: number) {
  return `${formatTemperature(valueF)} / ${formatCelsius(valueF)}`;
}

function formatInchesPair(valueIn: number) {
  return `${formatInches(valueIn)} / ${formatMillimeters(valueIn)}`;
}

function formatWindPair(valueMph: number) {
  return `${Math.round(valueMph)} mph / ${Math.round(mphToKph(valueMph))} km/h`;
}

function formatStatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AxisTick = {
  time: number;
  primary: string;
  secondary?: string;
};

function parseLocalTimestamp(value: string) {
  const [date = "", time = ""] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

function localParts(timestamp: number) {
  const date = new Date(timestamp);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    weekday: date.getUTCDay(),
  };
}

function formatAxisHour(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12} ${period}`;
}

function formatMonthDay(timestamp: number) {
  const parts = localParts(timestamp);
  return `${MONTH_LABELS[parts.month]} ${parts.day}`;
}

function formatAxisLabel(timestamp: number, range: RangeId): Omit<AxisTick, "time"> {
  const parts = localParts(timestamp);

  if (range === "day") {
    return {
      primary: formatAxisHour(parts.hour),
    };
  }

  if (range === "week") {
    return {
      primary: WEEKDAY_LABELS[parts.weekday],
      secondary: formatMonthDay(timestamp),
    };
  }

  if (range === "month") {
    return {
      primary: formatMonthDay(timestamp),
    };
  }

  return {
    primary: MONTH_LABELS[parts.month],
    secondary: `${parts.year}`,
  };
}

function startOfLocalDay(timestamp: number) {
  const parts = localParts(timestamp);
  return Date.UTC(parts.year, parts.month, parts.day, 0, 0, 0);
}

function addUniqueTick(ticks: number[], value: number, start: number, end: number) {
  if (value < start || value > end) return;
  if (!ticks.some((tick) => Math.abs(tick - value) < HOUR_MS)) ticks.push(value);
}

function buildRegularTicks(
  start: number,
  end: number,
  stepHours: number,
  options: { includeEdges?: boolean } = {},
) {
  const ticks: number[] = [];
  const step = stepHours * HOUR_MS;
  const first = Math.ceil(start / step) * step;

  if (options.includeEdges) addUniqueTick(ticks, start, start, end);
  for (let time = first; time <= end; time += step) {
    addUniqueTick(ticks, time, start, end);
  }
  if (options.includeEdges) addUniqueTick(ticks, end, start, end);

  return ticks.sort((a, b) => a - b);
}

function buildDayTicks(start: number, end: number) {
  const firstTick = Math.ceil(start / (6 * HOUR_MS)) * (6 * HOUR_MS);
  const ticks = buildRegularTicks(firstTick, end, 6);

  return ticks.length >= 2
    ? ticks
    : buildRegularTicks(start, end, 6, { includeEdges: true });
}

function buildDailyTicks(start: number, end: number) {
  const first = startOfLocalDay(start) + DAY_MS;
  const ticks = buildRegularTicks(first, end, 24);

  return ticks.length >= 2
    ? ticks
    : buildRegularTicks(start, end, 24, { includeEdges: true });
}

function buildWeeklyTicks(start: number, end: number) {
  const startParts = localParts(start);
  const daysUntilMonday = (8 - startParts.weekday) % 7 || 7;
  const first = startOfLocalDay(start) + daysUntilMonday * DAY_MS;
  const ticks = buildRegularTicks(first, end, 24 * 7);

  return ticks.length >= 2
    ? ticks
    : buildRegularTicks(start, end, 24 * 7, { includeEdges: true });
}

function buildMonthBoundaryTicks(start: number, end: number) {
  const ticks: number[] = [];
  const startParts = localParts(start);
  let time = Date.UTC(startParts.year, startParts.month, 1, 0, 0, 0);

  if (time < start) {
    time = Date.UTC(startParts.year, startParts.month + 1, 1, 0, 0, 0);
  }

  while (time <= end) {
    addUniqueTick(ticks, time, start, end);
    const parts = localParts(time);
    time = Date.UTC(parts.year, parts.month + 1, 1, 0, 0, 0);
  }

  return ticks.sort((a, b) => a - b);
}

function buildXAxisTicks(rows: HourlyPoint[], range: RangeId): AxisTick[] {
  if (rows.length === 0) return [];

  const start = parseLocalTimestamp(rows[0].time);
  const end = parseLocalTimestamp(rows.at(-1)?.time ?? rows[0].time);
  const durationHours = Math.max(1, (end - start) / HOUR_MS);
  let ticks: number[];
  let labelRange = range;

  if (range === "year") {
    if (durationHours > 24 * 62) {
      ticks = buildMonthBoundaryTicks(start, end);
    } else {
      ticks = buildWeeklyTicks(start, end);
      labelRange = "month";
    }
  } else if (range === "month") {
    ticks = buildWeeklyTicks(start, end);
  } else if (range === "week") {
    ticks = buildDailyTicks(start, end);
  } else {
    ticks = buildDayTicks(start, end);
  }

  return ticks.map((time) => ({
    time,
    ...formatAxisLabel(time, labelRange),
  }));
}

function buildMinorTicks(rows: HourlyPoint[], range: RangeId) {
  if (rows.length === 0) return [];

  const start = parseLocalTimestamp(rows[0].time);
  const end = parseLocalTimestamp(rows.at(-1)?.time ?? rows[0].time);
  const durationHours = Math.max(1, (end - start) / HOUR_MS);

  if (range === "year" && durationHours > 24 * 62) {
    return buildMonthBoundaryTicks(start, end).map((tick) => tick);
  }

  let stepHours = {
    day: 1,
    week: 6,
    month: 24,
    year: 168,
  }[range];

  while (durationHours / stepHours > 80) {
    stepHours *= 2;
  }

  return buildRegularTicks(start, end, stepHours);
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

function formatChartWindow(rows: HourlyPoint[]) {
  if (rows.length === 0) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(parseLocalTimestamp(rows[0].time)))} - ${formatter.format(new Date(parseLocalTimestamp(rows.at(-1)?.time ?? rows[0].time)))}`;
}

type WeatherStat = {
  label: string;
  english: string;
  metric: string;
  detail?: string;
};

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function maxBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((best, item) => getValue(item) > getValue(best) ? item : best);
}

function minBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((best, item) => getValue(item) < getValue(best) ? item : best);
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

function buildWeatherStats(rows: HourlyPoint[]): WeatherStat[] {
  if (rows.length === 0) return [];

  const highTemp = maxBy(rows, (row) => row.temperatureF);
  const lowTemp = minBy(rows, (row) => row.temperatureF);
  const wettestHour = maxBy(rows, (row) => row.precipitationIn);
  const averageTemp = average(rows.map((row) => row.temperatureF));
  const totalPrecip = sumBy(rows, (row) => row.precipitationIn);
  const totalRain = sumBy(rows, (row) => row.rainIn);
  const totalShowers = sumBy(rows, (row) => row.showersIn);
  const totalSnowfall = sumBy(rows, (row) => row.snowfallIn);
  const wetHours = rows.filter((row) => row.precipitationIn > 0).length;

  return [
    {
      label: "Average temperature",
      english: formatTemperature(averageTemp),
      metric: formatCelsius(averageTemp),
    },
    {
      label: "High temperature",
      english: formatTemperature(highTemp.temperatureF),
      metric: formatCelsius(highTemp.temperatureF),
      detail: formatStatDate(highTemp.time),
    },
    {
      label: "Low temperature",
      english: formatTemperature(lowTemp.temperatureF),
      metric: formatCelsius(lowTemp.temperatureF),
      detail: formatStatDate(lowTemp.time),
    },
    {
      label: "Total precipitation",
      english: formatInches(totalPrecip),
      metric: formatMillimeters(totalPrecip),
    },
    {
      label: "Average precipitation / hour",
      english: formatInches(totalPrecip / rows.length),
      metric: formatMillimeters(totalPrecip / rows.length),
    },
    {
      label: "Wettest hour",
      english: formatInches(wettestHour.precipitationIn),
      metric: formatMillimeters(wettestHour.precipitationIn),
      detail: formatStatDate(wettestHour.time),
    },
    {
      label: "Rain total",
      english: formatInches(totalRain),
      metric: formatMillimeters(totalRain),
    },
    {
      label: "Showers total",
      english: formatInches(totalShowers),
      metric: formatMillimeters(totalShowers),
    },
    {
      label: "Snowfall total",
      english: formatInches(totalSnowfall),
      metric: formatMillimeters(totalSnowfall),
    },
    {
      label: "Wet hours",
      english: `${wetHours} of ${rows.length} hours`,
      metric: `${Math.round((wetHours / rows.length) * 100)}% of archive`,
    },
  ];
}

function WeatherStatsTable({
  rows,
  range,
  status,
}: {
  rows: HourlyPoint[];
  range: RangeId;
  status: "loading" | "ready" | "error";
}) {
  const stats = useMemo(() => buildWeatherStats(rows), [rows]);

  return (
    <section className="range-stats">
      <div className="stats-header">
        <div>
          <p className="kicker">Range Statistics</p>
          <h2>{range} archive table</h2>
        </div>
        <strong>{status === "ready" ? `${rows.length} hours` : status}</strong>
      </div>

      {stats.length > 0 ? (
        <div className="stats-table" role="table" aria-label={`${range} weather statistics`}>
          <div className="stats-row stats-row-head" role="row">
            <span role="columnheader">Statistic</span>
            <span role="columnheader">English</span>
            <span role="columnheader">Metric</span>
            <span role="columnheader">Detail</span>
          </div>
          {stats.map((stat) => (
            <div className="stats-row" role="row" key={stat.label}>
              <span role="cell">{stat.label}</span>
              <strong role="cell">{stat.english}</strong>
              <strong role="cell">{stat.metric}</strong>
              <span role="cell">{stat.detail ?? "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="stats-empty">
          {status === "error"
            ? "Archive statistics are unavailable for this selection."
            : "Archive statistics will appear once hourly rows load."}
        </p>
      )}
    </section>
  );
}

function WeatherDiagram({
  rows,
  range,
}: {
  rows: HourlyPoint[];
  range: RangeId;
}) {
  const chart = useMemo(() => downsample(rows), [rows]);
  const xAxisTicks = useMemo(() => buildXAxisTicks(rows, range), [rows, range]);
  const minorTicks = useMemo(() => buildMinorTicks(rows, range), [rows, range]);
  const width = 920;
  const height = 390;
  const pad = { top: 34, right: 112, bottom: 74, left: 78 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const temps = chart.map((point) => point.temperatureF);
  const minTemp = Math.floor(Math.min(...temps, 32) / 5) * 5;
  const maxTemp = Math.ceil(Math.max(...temps, 90) / 5) * 5;
  const maxPrecip = Math.max(...chart.map((point) => point.precipitationIn), 0.02);
  const precipAxisHeight = innerHeight * 0.46;
  const precipBaseline = pad.top + innerHeight;
  const precipAxisTop = precipBaseline - precipAxisHeight;
  const precipTicks = [0, 0.5, 1];
  const domainStart = rows[0] ? parseLocalTimestamp(rows[0].time) : 0;
  const domainEnd = rows.at(-1) ? parseLocalTimestamp(rows.at(-1)?.time ?? rows[0].time) : domainStart;
  const xForTime = (time: number) =>
    pad.left + ((time - domainStart) / Math.max(1, domainEnd - domainStart)) * innerWidth;
  const yForTemp = (temp: number) =>
    pad.top + ((maxTemp - temp) / Math.max(1, maxTemp - minTemp)) * innerHeight;
  const yForPrecip = (precip: number) =>
    precipBaseline - (precip / maxPrecip) * precipAxisHeight;
  const linePoints = chart.map((point) => ({
    x: xForTime(parseLocalTimestamp(point.time)),
    y: yForTemp(point.temperatureF),
  }));
  const path = buildPath(linePoints);
  const firstLinePoint = linePoints[0];
  const lastLinePoint = linePoints.at(-1);
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
            {formatTemperaturePair(latest.temperatureF)} · {latest.weatherLabel}
          </strong>
        )}
      </div>

      <div className="weather-chart-frame">
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
                  <tspan x={pad.left - 12}>{Math.round(temp)}°F</tspan>
                  <tspan x={pad.left - 12} dy="12">{formatCelsius(temp)}</tspan>
                </text>
              </g>
            );
          })}

          {chart.map((point, index) => {
            const barWidth = Math.max(2, innerWidth / chart.length * 0.48);
            const barHeight = precipBaseline - yForPrecip(point.precipitationIn);
            const x = xForTime(parseLocalTimestamp(point.time)) - barWidth / 2;
            const y = precipBaseline - barHeight;
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

          <g aria-hidden="true">
            <line
              x1={width - pad.right}
              x2={width - pad.right}
              y1={precipAxisTop}
              y2={precipBaseline}
              className="chart-axis-line"
            />
            {precipTicks.map((tick) => {
              const value = tick * maxPrecip;
              const y = yForPrecip(value);
              return (
                <g key={tick}>
                  <line
                    x1={width - pad.right}
                    x2={width - pad.right + 7}
                    y1={y}
                    y2={y}
                    className="chart-axis-line"
                  />
                  <text x={width - pad.right + 13} y={y + 4} className="chart-axis chart-axis-right">
                    <tspan x={width - pad.right + 13}>{value.toFixed(value >= 0.1 ? 2 : 3)} in</tspan>
                    <tspan x={width - pad.right + 13} dy="12">{formatMillimeters(value)}</tspan>
                  </text>
                </g>
              );
            })}
            <text x={width - pad.right + 13} y={precipAxisTop - 10} className="chart-axis chart-axis-right chart-axis-title">
              precip
            </text>
          </g>

          <line x1={pad.left} x2={width - pad.right} y1={precipBaseline} y2={precipBaseline} className="chart-axis-base" />
          {minorTicks.map((tick) => {
            const x = xForTime(tick);
            return (
              <line
                key={`minor-${tick}`}
                x1={x}
                x2={x}
                y1={precipBaseline}
                y2={precipBaseline + 5}
                className="chart-x-minor"
              />
            );
          })}
          {xAxisTicks.map((tick) => {
            const x = xForTime(tick.time);
            const anchor = x < pad.left + 30 ? "start" : x > width - pad.right - 30 ? "end" : "middle";
            return (
              <g key={`x-${tick.time}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={precipBaseline}
                  y2={precipBaseline + 9}
                  className="chart-x-major"
                />
                <text x={x} y={height - 34} className="chart-axis chart-x-label" textAnchor={anchor}>
                  <tspan x={x}>{tick.primary}</tspan>
                  {tick.secondary && <tspan x={x} dy="13">{tick.secondary}</tspan>}
                </text>
              </g>
            );
          })}

          {firstLinePoint && lastLinePoint && (
            <path
              d={`${path} L ${lastLinePoint.x} ${precipBaseline} L ${firstLinePoint.x} ${precipBaseline} Z`}
              fill="url(#tempFill)"
            />
          )}
          <path d={path} fill="none" stroke="url(#tempLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {linePoints.map((point, index) => (
            index % Math.ceil(linePoints.length / 12) === 0 || index === linePoints.length - 1 ? (
              <circle key={index} cx={point.x} cy={point.y} r="4" className="chart-dot" />
            ) : null
          ))}

        </svg>
      </div>

      <div className="diagram-legend">
        <span><i className="legend-temp" /> Temperature</span>
        <span><i className="legend-rain" /> Precipitation</span>
        <span>{formatChartWindow(rows)}</span>
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
  const currentPayload = payload?.biomeId === selectedId && payload.range === range ? payload : null;
  const rows = currentPayload?.rows ?? [];
  const availableNote = currentPayload && currentPayload.availableHours < currentPayload.requestedHours
    ? `${currentPayload.availableHours} archived hours available for this ${range}.`
    : `${currentPayload?.availableHours ?? 0} archived hours loaded.`;

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
                <strong>
                  <span>{formatTemperature(selectedWeather.current.temperatureF)}</span>
                  <small>{formatCelsius(selectedWeather.current.temperatureF)}</small>
                </strong>
              </div>

              <WeatherDiagram rows={rows} range={range} />

              <div className="weather-metrics nursery-metrics">
                <div>
                  <span>Condition</span>
                  <strong>{selectedWeather.current.weatherLabel}</strong>
                </div>
                <div>
                  <span>Feels Like</span>
                  <strong>{formatTemperaturePair(selectedWeather.current.apparentTemperatureF)}</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{selectedWeather.current.relativeHumidity}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{formatWindPair(selectedWeather.current.windSpeedMph)}</strong>
                </div>
                <div>
                  <span>Precipitation</span>
                  <strong>{formatInchesPair(selectedWeather.current.precipitationIn)}</strong>
                </div>
                <div>
                  <span>Cloud Cover</span>
                  <strong>{selectedWeather.current.cloudCover}%</strong>
                </div>
              </div>

              <WeatherStatsTable rows={rows} range={range} status={hourlyStatus} />
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
