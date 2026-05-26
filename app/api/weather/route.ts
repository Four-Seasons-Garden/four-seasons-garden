import { fetchBiomeWeather } from "@/lib/weather/open-meteo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchBiomeWeather();
    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch weather.";

    return Response.json(
      {
        error: message,
        provider: "Open-Meteo",
        fetchedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}
