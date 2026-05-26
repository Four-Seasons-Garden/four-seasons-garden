"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "@/app/components/AppShell";
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

export default function GardenSutraPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "running">("idle");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

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
      </section>
    </AppShell>
  );
}
