import { BIOMES, DEFAULT_BIOME_ID, getBiome } from "@/lib/constants/biomes";
import { createSupabaseReadClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const RANGE_LIMITS = {
  day: 24,
  week: 24 * 7,
  month: 24 * 31,
  year: 24 * 366,
} as const;

const HOUR_MS = 60 * 60 * 1000;

type RangeKey = keyof typeof RANGE_LIMITS;

type HourlyWeatherRow = {
  biome_id: string;
  location_name: string;
  timezone: string;
  forecast_time_local: string;
  temperature_f: number;
  precipitation_in: number;
  rain_in: number;
  showers_in: number;
  snowfall_in: number;
  weather_code: number | null;
  weather_label: string;
  fetched_at: string;
};

function parseRange(value: string | null): RangeKey {
  if (value === "day" || value === "week" || value === "month" || value === "year") {
    return value;
  }
  return "day";
}

function parseBiome(value: string | null): string {
  return value && BIOMES.some((biome) => biome.id === value) ? value : DEFAULT_BIOME_ID;
}

function currentLocalHour(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:00:00`;
}

function parseLocalTimestamp(value: string) {
  const [date = "", time = ""] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

function formatLocalTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (value: number) => value.toString().padStart(2, "0");

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-") + `T${pad(date.getUTCHours())}:00:00`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range"));
  const biomeId = parseBiome(url.searchParams.get("biome"));
  const biome = getBiome(biomeId);
  const limit = RANGE_LIMITS[range];
  const throughHour = currentLocalHour(biome.timezone);
  const fromHour = formatLocalTimestamp(parseLocalTimestamp(throughHour) - (limit - 1) * HOUR_MS);

  try {
    const supabase = createSupabaseReadClient();
    const { data, error } = await supabase
      .from("biome_hourly_weather")
      .select(
        "biome_id, location_name, timezone, forecast_time_local, temperature_f, precipitation_in, rain_in, showers_in, snowfall_in, weather_code, weather_label, fetched_at",
      )
      .eq("provider", "Open-Meteo")
      .eq("biome_id", biomeId)
      .gte("forecast_time_local", fromHour)
      .lte("forecast_time_local", throughHour)
      .order("forecast_time_local", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as HourlyWeatherRow[];

    return Response.json({
      provider: "Open-Meteo",
      biomeId,
      range,
      requestedHours: limit,
      availableHours: rows.length,
      fromHour,
      throughHour,
      firstHour: rows[0]?.forecast_time_local ?? null,
      lastHour: rows.at(-1)?.forecast_time_local ?? null,
      rows: rows.map((row) => ({
        time: row.forecast_time_local,
        temperatureF: row.temperature_f,
        precipitationIn: row.precipitation_in,
        rainIn: row.rain_in,
        showersIn: row.showers_in,
        snowfallIn: row.snowfall_in,
        weatherCode: row.weather_code,
        weatherLabel: row.weather_label,
        timezone: row.timezone,
        fetchedAt: row.fetched_at,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load hourly weather.";

    return Response.json({ error: message, biomeId, range }, { status: 500 });
  }
}
