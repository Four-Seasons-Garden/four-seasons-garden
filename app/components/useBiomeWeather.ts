"use client";

import { useEffect, useState } from "react";
import type {
  BiomeWeatherPayload,
  LiveBiomeWeather,
} from "@/lib/weather/open-meteo";

export function useBiomeWeather() {
  const [weather, setWeather] = useState<Record<string, LiveBiomeWeather>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        setStatus((current) => current === "ready" ? current : "loading");
        const response = await fetch("/api/weather");
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        const payload = (await response.json()) as BiomeWeatherPayload;
        if (!active) return;
        setWeather(payload.weather);
        setStatus("ready");
        setError(null);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unable to load weather.");
      }
    }

    loadWeather();
    const refresh = window.setInterval(loadWeather, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  return { weather, status, error };
}

export function useTicker() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const firstTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, []);

  return now;
}

export function formatTemperature(value: number) {
  return `${Math.round(value)}°F`;
}

export function formatClock(date: Date | null, timezone: string) {
  if (!date) return "--:--:--";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatInches(value: number) {
  return `${value.toFixed(3)} in`;
}
