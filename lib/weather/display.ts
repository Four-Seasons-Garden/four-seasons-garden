import type { LiveBiomeWeather, TimeOfDay } from "@/lib/weather/open-meteo";
import { formatZonedClock, localTimeMinutes, zonedMinutes } from "@/lib/time/almanac";

/* Format a lat/lon decimal as "37.27° N" */
export function formatCoord(value: number, pos: string, neg: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? pos : neg}`;
}

export function formatTemperature(value: number) {
  return `${Math.round(value)}°F`;
}

export function formatInches(value: number) {
  return `${value.toFixed(3)} in`;
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ─────────── Metric equivalents ─────────── */

export function fahrenheitToCelsius(value: number) {
  return (value - 32) * 5 / 9;
}

export function inchesToMillimeters(value: number) {
  return value * 25.4;
}

export function mphToKph(value: number) {
  return value * 1.609344;
}

export function formatCelsius(valueF: number) {
  return `${Math.round(fahrenheitToCelsius(valueF))}°C`;
}

export function formatMillimeters(valueIn: number) {
  const millimeters = inchesToMillimeters(valueIn);
  return `${millimeters.toFixed(millimeters >= 10 ? 1 : 2)} mm`;
}

/* "72°F / 22°C" — the nursery stat readouts show both systems. */
export function formatTemperaturePair(valueF: number) {
  return `${formatTemperature(valueF)} / ${formatCelsius(valueF)}`;
}

export function formatInchesPair(valueIn: number) {
  return `${formatInches(valueIn)} / ${formatMillimeters(valueIn)}`;
}

export function formatWindPair(valueMph: number) {
  return `${Math.round(valueMph)} mph / ${Math.round(mphToKph(valueMph))} km/h`;
}

/* ─────────── Timestamps ─────────── */

/* Zoned clock with the placeholder the HUD shows before the first tick. */
export function formatClock(date: Date | null, timezone: string) {
  if (!date) return "--:--:--";
  return formatZonedClock(date, timezone);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/* Split the day using real sunrise/sunset, falling back to fixed hours
   when the sun never sets (or never rises) at this latitude. */
export function classifyTimeOfDayMinutes(now: number, sunrise: number, sunset: number): TimeOfDay {
  if (sunset <= sunrise) {
    if (now >= 5 * 60 && now < 7 * 60) return "dawn";
    if (now >= 7 * 60 && now < 11 * 60) return "morning";
    if (now >= 11 * 60 && now < 13 * 60) return "noon";
    if (now >= 13 * 60 && now < 17 * 60) return "afternoon";
    if (now >= 17 * 60 && now < 19 * 60) return "dusk";
    if (now >= 19 * 60 && now < 22 * 60) return "evening";
    return "night";
  }

  const dawnStart = sunrise - 45;
  const morningStart = sunrise + 45;
  const solarNoon = sunrise + (sunset - sunrise) / 2;
  const noonStart = solarNoon - 75;
  const noonEnd = solarNoon + 75;
  const duskStart = sunset - 60;
  const eveningStart = sunset + 45;
  const eveningEnd = Math.min(1439, sunset + 240);

  if (now >= dawnStart && now < morningStart) return "dawn";
  if (now >= morningStart && now < noonStart) return "morning";
  if (now >= noonStart && now < noonEnd) return "noon";
  if (now >= noonEnd && now < duskStart) return "afternoon";
  if (now >= duskStart && now < eveningStart) return "dusk";
  if (now >= eveningStart && now < eveningEnd) return "evening";
  return "night";
}

/* Which weather effects the current conditions call for. */
export function weatherSignal(weather?: LiveBiomeWeather) {
  const code = weather?.current.weatherCode;
  const rain = weather?.current.rainIn ?? 0;
  const showers = weather?.current.showersIn ?? 0;
  const snow = weather?.current.snowfallIn ?? 0;

  return {
    snow: snow > 0 || (code !== undefined && [71, 73, 75, 77, 85, 86].includes(code)),
    thunder: code !== undefined && [95, 96, 99].includes(code),
    rain: rain > 0 || showers > 0 || (code !== undefined && [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)),
    cloud: (weather?.current.cloudCover ?? 0) > 55 || (code !== undefined && [2, 3, 45, 48].includes(code)),
  };
}

export function weatherKind(weather?: LiveBiomeWeather) {
  const signal = weatherSignal(weather);
  if (signal.thunder) return "thunder";
  if (signal.snow) return "snow";
  if (signal.rain) return "rain";
  if (signal.cloud) return "cloud";
  return "clear";
}

export function liveRainIntensity(weather?: LiveBiomeWeather): "mild" | "heavy" | "shower" | undefined {
  if (!weatherSignal(weather).rain) return undefined;
  const code = weather?.current.weatherCode;
  const amount = (weather?.current.rainIn ?? 0) + (weather?.current.showersIn ?? 0);
  if (code !== undefined && [65, 81, 82, 95, 96, 99].includes(code)) return "heavy";
  if (code !== undefined && [80].includes(code)) return "shower";
  if (amount >= 0.08) return "heavy";
  return "mild";
}

export function liveTimeOfDay(weather?: LiveBiomeWeather, now?: Date | null): TimeOfDay {
  if (!weather || !now) return weather?.current.timeOfDay ?? "afternoon";
  const timezone = weather.resolvedLocation.timezone;
  return classifyTimeOfDayMinutes(
    zonedMinutes(now, timezone),
    localTimeMinutes(weather.current.sun.sunrise),
    localTimeMinutes(weather.current.sun.sunset),
  );
}
