"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "@/app/components/AppShell";
import { BIOMES, DEFAULT_BIOME_ID } from "@/lib/constants/biomes";
import type { MusicByBiome, StoredLocationTrack } from "@/lib/music/tracks";
import { supabase } from "@/utils/supabase/client";

const ADMIN_EMAIL = "rxyan2@wm.edu";

type SyncResult = {
  dryRun?: boolean;
  fetchedRows?: number;
  savedRows?: number;
  hoursPerBiome?: number;
  biomes?: string[];
  error?: string;
};

type MusicPayload = {
  tracks?: StoredLocationTrack[];
  byBiome?: MusicByBiome<StoredLocationTrack>;
  track?: StoredLocationTrack;
  deleted?: string;
  error?: string;
};

export default function GardenSutraPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "running">("idle");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [musicByBiome, setMusicByBiome] = useState<MusicByBiome<StoredLocationTrack>>({});
  const [musicStatus, setMusicStatus] = useState<"idle" | "loading" | "saving">("loading");
  const [musicMessage, setMusicMessage] = useState<string | null>(null);
  const [musicBiomeId, setMusicBiomeId] = useState(DEFAULT_BIOME_ID);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicUrl, setMusicUrl] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadMusic(showLoading = true) {
    if (showLoading) {
      setMusicStatus("loading");
      setMusicMessage(null);
    }

    try {
      const response = await fetch("/api/music/playlists");
      const result = (await response.json()) as MusicPayload;
      if (!response.ok) throw new Error(result.error ?? "Unable to load playlists.");
      setMusicByBiome(result.byBiome ?? {});
    } catch (error) {
      setMusicMessage(error instanceof Error ? error.message : "Unable to load playlists.");
    } finally {
      setMusicStatus("idle");
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialMusic() {
      try {
        const response = await fetch("/api/music/playlists");
        const result = (await response.json()) as MusicPayload;
        if (!response.ok) throw new Error(result.error ?? "Unable to load playlists.");
        if (!active) return;
        setMusicByBiome(result.byBiome ?? {});
        setMusicMessage(null);
      } catch (error) {
        if (active) setMusicMessage(error instanceof Error ? error.message : "Unable to load playlists.");
      } finally {
        if (active) setMusicStatus("idle");
      }
    }

    loadInitialMusic();

    return () => {
      active = false;
    };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function runSync(dryRun: boolean) {
    setSyncStatus("running");
    setSyncResult(null);

    try {
      const response = await fetch(`/api/weather/sync${dryRun ? "?dryRun=1" : ""}`, {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      const result = (await response.json()) as SyncResult;
      setSyncResult(response.ok ? result : { error: result.error ?? "Sync failed." });
    } catch (error) {
      setSyncResult({ error: error instanceof Error ? error.message : "Sync failed." });
    } finally {
      setSyncStatus("idle");
    }
  }

  async function addMusicTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setMusicStatus("saving");
    setMusicMessage(null);

    try {
      const response = await fetch("/api/music/playlists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          biomeId: musicBiomeId,
          title: musicTitle,
          artist: musicArtist,
          youtubeUrl: musicUrl,
          sortOrder: (musicByBiome[musicBiomeId]?.length ?? 0) * 10 + 10,
        }),
      });
      const result = (await response.json()) as MusicPayload;
      if (!response.ok) throw new Error(result.error ?? "Unable to add song.");

      setMusicTitle("");
      setMusicArtist("");
      setMusicUrl("");
      setMusicMessage("Song added.");
      await loadMusic();
    } catch (error) {
      setMusicMessage(error instanceof Error ? error.message : "Unable to add song.");
    } finally {
      setMusicStatus("idle");
    }
  }

  async function deleteMusicTrack(id: string) {
    if (!session) return;

    setMusicStatus("saving");
    setMusicMessage(null);

    try {
      const response = await fetch("/api/music/playlists", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as MusicPayload;
      if (!response.ok) throw new Error(result.error ?? "Unable to delete song.");

      setMusicMessage("Song deleted.");
      await loadMusic();
    } catch (error) {
      setMusicMessage(error instanceof Error ? error.message : "Unable to delete song.");
    } finally {
      setMusicStatus("idle");
    }
  }

  return (
    <AppShell title="Garden Sutra" eyebrow="Site Stewardship">
      <section className="admin-grid">
        <section className="tool-panel admin-auth">
          {session ? (
            <>
              <p className="kicker">Signed In</p>
              <h2>{session.user.email}</h2>
              <button className="command-button" type="button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <form onSubmit={signIn} className="auth-form">
              <label>
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
              </label>
              <label>
                <span>Password</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
              </label>
              <button className="command-button" type="submit">
                Sign in
              </button>
              {authMessage && <p className="form-error">{authMessage}</p>}
            </form>
          )}
        </section>

        <section className="tool-panel">
          <div className="weather-hero">
            <div>
              <p className="kicker">Weather Archive</p>
              <h2>Hourly Sync</h2>
            </div>
            <strong>{syncStatus === "running" ? "..." : "960"}</strong>
          </div>
          <div className="button-row">
            <button className="command-button" type="button" disabled={!session || syncStatus === "running"} onClick={() => runSync(true)}>
              Dry run
            </button>
            <button className="command-button" type="button" disabled={!session || syncStatus === "running"} onClick={() => runSync(false)}>
              Save archive
            </button>
          </div>
          {syncResult && (
            <div className="sync-result">
              {syncResult.error ? (
                <p>{syncResult.error}</p>
              ) : (
                <p>
                  {syncResult.dryRun ? "Fetched" : "Saved"} {syncResult.dryRun ? syncResult.fetchedRows : syncResult.savedRows} rows across{" "}
                  {syncResult.biomes?.length ?? 0} biomes.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="tool-panel music-manager">
          <div className="weather-hero">
            <div>
              <p className="kicker">Location Music</p>
              <h2>Playlists</h2>
            </div>
            <strong>{musicByBiome[musicBiomeId]?.length ?? 0}</strong>
          </div>

          <label className="field-label" htmlFor="music-biome">
            Location
          </label>
          <select
            id="music-biome"
            className="field-select"
            value={musicBiomeId}
            onChange={(event) => setMusicBiomeId(event.target.value)}
          >
            {BIOMES.map((biome) => (
              <option key={biome.id} value={biome.id}>
                {biome.name}
              </option>
            ))}
          </select>

          <form className="auth-form music-form" onSubmit={addMusicTrack}>
            <label>
              <span>Song Title</span>
              <input value={musicTitle} onChange={(event) => setMusicTitle(event.target.value)} required />
            </label>
            <label>
              <span>Artist</span>
              <input value={musicArtist} onChange={(event) => setMusicArtist(event.target.value)} />
            </label>
            <label>
              <span>YouTube URL</span>
              <input value={musicUrl} onChange={(event) => setMusicUrl(event.target.value)} required />
            </label>
            <button className="command-button" type="submit" disabled={!session || musicStatus === "saving"}>
              Add song
            </button>
          </form>

          <div className="music-track-list">
            {(musicByBiome[musicBiomeId] ?? []).map((track) => (
              <div className="music-track-row" key={track.id}>
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist || "YouTube"} · {track.youtubeId}</span>
                </div>
                <button
                  className="text-danger-button"
                  type="button"
                  disabled={!session || musicStatus === "saving"}
                  onClick={() => deleteMusicTrack(track.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {musicMessage && <p className="form-error">{musicMessage}</p>}
        </section>
      </section>
    </AppShell>
  );
}
