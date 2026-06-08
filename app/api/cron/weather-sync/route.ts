import { fetchBiomeHourlyWeather } from "@/lib/weather/open-meteo";
import { createSupabaseAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

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

async function upsertInBatches(rows: WeatherRow[]) {
  const supabase = createSupabaseAdminClient();
  const batchSize = 500;
  let saved = 0;

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await supabase
      .from("biome_hourly_weather")
      .upsert(batch, { onConflict: "provider,biome_id,forecast_time_local" });

    if (error) throw new Error(error.message);
    saved += batch.length;
  }

  return saved;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  try {
    const payload = await fetchBiomeHourlyWeather();

    const rows: WeatherRow[] = payload.rows.map((row) => ({
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
    }));

    const savedRows = await upsertInBatches(rows);

    return Response.json(
      {
        ok: true,
        startedAt,
        provider: payload.provider,
        fetchedAt: payload.fetchedAt,
        fetchedRows: rows.length,
        savedRows,
        hoursPerBiome: payload.hoursPerBiome,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync hourly weather.";

    return Response.json({ error: message, startedAt }, { status: 500 });
  }
}
