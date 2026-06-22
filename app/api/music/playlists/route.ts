import {
  groupTracksByBiome,
  isValidBiomeId,
  LOCATION_TRACK_SELECT,
  locationTrackFromRow,
  type LocationTrackRow,
} from "@/lib/music/tracks";
import { normalizeYouTubeUrl, parseYouTubeId } from "@/lib/music/youtube";
import { createSupabaseAdminClient, createSupabaseReadClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type TrackPayload = {
  biomeId?: string;
  title?: string;
  artist?: string;
  youtubeUrl?: string;
  sortOrder?: number;
  isEnabled?: boolean;
};

async function isAuthorized(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminEmails = (process.env.WEATHER_SYNC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!token || adminEmails.length === 0) return process.env.NODE_ENV !== "production";

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(token);
    const email = data.user?.email?.toLowerCase();
    return !error && Boolean(email && adminEmails.includes(email));
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseReadClient();
    const { data, error } = await supabase
      .from("location_music_tracks")
      .select(LOCATION_TRACK_SELECT)
      .order("biome_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const tracks = ((data ?? []) as LocationTrackRow[]).map(locationTrackFromRow);
    const byBiome = groupTracksByBiome(tracks);

    return Response.json({ tracks, byBiome });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load music playlists.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized music playlist write." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as TrackPayload;
    const title = payload.title?.trim();
    const artist = payload.artist?.trim() ?? "";
    const youtubeId = parseYouTubeId(payload.youtubeUrl ?? "");

    if (!isValidBiomeId(payload.biomeId)) {
      return Response.json({ error: "Choose a valid location." }, { status: 400 });
    }

    if (!title) {
      return Response.json({ error: "Song title is required." }, { status: 400 });
    }

    if (!youtubeId) {
      return Response.json({ error: "Use a valid YouTube URL or video ID." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("location_music_tracks")
      .insert({
        biome_id: payload.biomeId,
        title,
        artist,
        youtube_id: youtubeId,
        youtube_url: normalizeYouTubeUrl(youtubeId),
        sort_order: Number.isFinite(payload.sortOrder) ? payload.sortOrder : 100,
        is_enabled: payload.isEnabled ?? true,
      })
      .select(LOCATION_TRACK_SELECT)
      .single();

    if (error) throw new Error(error.message);

    return Response.json({ track: locationTrackFromRow(data as LocationTrackRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add music track.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized music playlist write." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { id?: string };
    if (!payload.id) {
      return Response.json({ error: "Track id is required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("location_music_tracks")
      .delete()
      .eq("id", payload.id);

    if (error) throw new Error(error.message);

    return Response.json({ deleted: payload.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete music track.";
    return Response.json({ error: message }, { status: 500 });
  }
}
