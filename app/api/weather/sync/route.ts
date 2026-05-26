import { fetchBiomeHourlyWeather } from "@/lib/weather/open-meteo";
import { createSupabaseAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type WeatherRow = {
  biome_id: string;
  location_name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  forecast_time_local: string;
  temperature_f: number;
  precipitation_in: number;
  rain_in: number;
  showers_in: number;
  snowfall_in: number;
  weather_code: number;
  weather_label: string;
  provider: "Open-Meteo";
  fetched_at: string;
};

async function isAuthorized(request: Request) {
  const secret = process.env.WEATHER_SYNC_SECRET;
  if (secret && request.headers.get("x-sync-secret") === secret) return true;

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminEmails = (process.env.WEATHER_SYNC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (token && adminEmails.length > 0) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase.auth.getUser(token);
      const email = data.user?.email?.toLowerCase();
      if (!error && email && adminEmails.includes(email)) return true;
    } catch {
      return false;
    }
  }

  return !secret && process.env.NODE_ENV !== "production";
}

function toDatabaseRow(row: Awaited<ReturnType<typeof fetchBiomeHourlyWeather>>["rows"][number]): WeatherRow {
  return {
    biome_id: row.biomeId,
    location_name: row.locationName,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    forecast_time_local: row.forecastTimeLocal,
    temperature_f: row.temperatureF,
    precipitation_in: row.precipitationIn,
    rain_in: row.rainIn,
    showers_in: row.showersIn,
    snowfall_in: row.snowfallIn,
    weather_code: row.weatherCode,
    weather_label: row.weatherLabel,
    provider: row.provider,
    fetched_at: row.fetchedAt,
  };
}

async function upsertInBatches(rows: WeatherRow[]) {
  const supabase = createSupabaseAdminClient();
  const batchSize = 500;
  let saved = 0;

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await supabase
      .from("biome_hourly_weather")
      .upsert(batch, {
        onConflict: "provider,biome_id,forecast_time_local",
      });

    if (error) throw new Error(error.message);
    saved += batch.length;
  }

  return saved;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized weather sync." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun") === "1";
    const payload = await fetchBiomeHourlyWeather();
    const rows = payload.rows.map(toDatabaseRow);
    const savedRows = dryRun ? 0 : await upsertInBatches(rows);

    return Response.json({
      provider: payload.provider,
      fetchedAt: payload.fetchedAt,
      dryRun,
      fetchedRows: rows.length,
      savedRows,
      hoursPerBiome: payload.hoursPerBiome,
      biomes: Array.from(new Set(rows.map((row) => row.biome_id))),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync hourly weather.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: "POST to this route to sync hourly weather into Supabase.",
    rowsPerSync: "5 biomes x 192 hours = 960 rows",
    requires:
      "SUPABASE_SERVICE_ROLE_KEY plus either WEATHER_SYNC_SECRET or WEATHER_SYNC_ADMIN_EMAILS in production.",
  });
}
