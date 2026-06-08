import { createSupabaseReadClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();

  try {
    const supabase = createSupabaseReadClient();
    const { data, error } = await supabase
      .from("biome_hourly_weather")
      .select("biome_id")
      .limit(1);

    if (error) throw new Error(error.message);

    return Response.json(
      {
        ok: true,
        checkedAt,
        table: "biome_hourly_weather",
        rowsSeen: data?.length ?? 0,
        secured: Boolean(process.env.CRON_SECRET),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach Supabase.";

    return Response.json({ error: message, checkedAt }, { status: 500 });
  }
}
