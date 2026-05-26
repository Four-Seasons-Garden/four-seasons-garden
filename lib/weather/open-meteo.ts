import { BIOMES } from "@/lib/constants/biomes";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
].join(",");

const DAILY_VARIABLES = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "weather_code",
  "sunrise",
  "sunset",
].join(",");

export type TimeOfDay =
  | "dawn"
  | "morning"
  | "noon"
  | "afternoon"
  | "dusk"
  | "evening"
  | "night";

type OpenMeteoCurrent = {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: 0 | 1;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
};

type OpenMeteoDaily = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weather_code: number[];
  sunrise: string[];
  sunset: string[];
};

type OpenMeteoForecast = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
};

export type LiveBiomeWeather = {
  id: string;
  name: string;
  shortName: string;
  country: string;
  requestedLocation: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  resolvedLocation: {
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    timezoneAbbreviation: string;
  };
  current: {
    time: string;
    intervalSeconds: number;
    timeOfDay: TimeOfDay;
    timeOfDayLabel: string;
    temperatureF: number;
    apparentTemperatureF: number;
    relativeHumidity: number;
    isDay: boolean;
    precipitationIn: number;
    rainIn: number;
    showersIn: number;
    snowfallIn: number;
    weatherCode: number;
    weatherLabel: string;
    cloudCover: number;
    windSpeedMph: number;
    windDirectionDeg: number;
    sun: {
      sunrise: string;
      sunset: string;
      solarNoon: string;
      daylightMinutes: number;
    };
    moon: {
      phase: string;
      phaseKey: string;
      ageDays: number;
      illumination: number;
    };
  };
  daily: Array<{
    date: string;
    temperatureMaxF: number;
    temperatureMinF: number;
    precipitationSumIn: number;
    weatherCode: number;
    weatherLabel: string;
    sunrise: string;
    sunset: string;
  }>;
};

export type BiomeWeatherPayload = {
  provider: "Open-Meteo";
  fetchedAt: string;
  weather: Record<string, LiveBiomeWeather>;
};

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return code === 1 ? "Mainly clear" : "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([56, 57].includes(code)) return "Freezing drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather";
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseLocalTimeMinutes(value: string) {
  const time = value.split("T")[1] ?? value;
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function localDate(value: string) {
  return value.slice(0, 10);
}

function minutesToLocalIso(date: string, minutes: number) {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  const hours = Math.floor(normalized / 60).toString().padStart(2, "0");
  const mins = (normalized % 60).toString().padStart(2, "0");
  return `${date}T${hours}:${mins}`;
}

function classifyTimeOfDay(current: string, sunrise: string, sunset: string): TimeOfDay {
  const now = parseLocalTimeMinutes(current);
  const rise = parseLocalTimeMinutes(sunrise);
  const set = parseLocalTimeMinutes(sunset);

  if (set <= rise) {
    if (now >= 5 * 60 && now < 7 * 60) return "dawn";
    if (now >= 7 * 60 && now < 11 * 60) return "morning";
    if (now >= 11 * 60 && now < 13 * 60) return "noon";
    if (now >= 13 * 60 && now < 17 * 60) return "afternoon";
    if (now >= 17 * 60 && now < 19 * 60) return "dusk";
    if (now >= 19 * 60 && now < 22 * 60) return "evening";
    return "night";
  }

  const dawnStart = rise - 45;
  const morningStart = rise + 45;
  const solarNoon = rise + (set - rise) / 2;
  const noonStart = solarNoon - 75;
  const noonEnd = solarNoon + 75;
  const duskStart = set - 60;
  const eveningStart = set + 45;
  const eveningEnd = Math.min(1439, set + 240);

  if (now >= dawnStart && now < morningStart) return "dawn";
  if (now >= morningStart && now < noonStart) return "morning";
  if (now >= noonStart && now < noonEnd) return "noon";
  if (now >= noonEnd && now < duskStart) return "afternoon";
  if (now >= duskStart && now < eveningStart) return "dusk";
  if (now >= eveningStart && now < eveningEnd) return "evening";
  return "night";
}

function moonPhase(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day, 12);
  const julianDate = timestamp / 86400000 + 2440587.5;
  const cycleDays = 29.530588853;
  const knownNewMoon = 2451550.1;
  const ageDays = ((julianDate - knownNewMoon) % cycleDays + cycleDays) % cycleDays;
  const illumination = (1 - Math.cos((2 * Math.PI * ageDays) / cycleDays)) / 2;

  const phases = [
    { maxAge: 1.84566, key: "new", label: "New moon" },
    { maxAge: 5.53699, key: "waxing-crescent", label: "Waxing crescent" },
    { maxAge: 9.22831, key: "first-quarter", label: "First quarter" },
    { maxAge: 12.91963, key: "waxing-gibbous", label: "Waxing gibbous" },
    { maxAge: 16.61096, key: "full", label: "Full moon" },
    { maxAge: 20.30228, key: "waning-gibbous", label: "Waning gibbous" },
    { maxAge: 23.99361, key: "last-quarter", label: "Last quarter" },
    { maxAge: 27.68493, key: "waning-crescent", label: "Waning crescent" },
  ];
  const phase = phases.find((item) => ageDays < item.maxAge) ?? phases[0];

  return {
    phase: phase.label,
    phaseKey: phase.key,
    ageDays: Number(ageDays.toFixed(1)),
    illumination: Number(illumination.toFixed(2)),
  };
}

function buildForecastUrl() {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", BIOMES.map((biome) => biome.coords.lat).join(","));
  url.searchParams.set("longitude", BIOMES.map((biome) => biome.coords.lon).join(","));
  url.searchParams.set("current", CURRENT_VARIABLES);
  url.searchParams.set("daily", DAILY_VARIABLES);
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "3");
  return url;
}

function normalizeWeather(
  forecast: OpenMeteoForecast,
  biome: (typeof BIOMES)[number],
): LiveBiomeWeather {
  const todayIndex = Math.max(0, forecast.daily.time.indexOf(localDate(forecast.current.time)));
  const sunrise = forecast.daily.sunrise[todayIndex];
  const sunset = forecast.daily.sunset[todayIndex];
  const riseMinutes = parseLocalTimeMinutes(sunrise);
  const setMinutes = parseLocalTimeMinutes(sunset);
  const solarNoonMinutes = riseMinutes + (setMinutes - riseMinutes) / 2;
  const timeOfDay = classifyTimeOfDay(forecast.current.time, sunrise, sunset);
  const moon = moonPhase(localDate(forecast.current.time));

  return {
    id: biome.id,
    name: biome.name,
    shortName: biome.shortName,
    country: biome.country,
    requestedLocation: {
      latitude: biome.coords.lat,
      longitude: biome.coords.lon,
      timezone: biome.timezone,
    },
    resolvedLocation: {
      latitude: forecast.latitude,
      longitude: forecast.longitude,
      elevation: forecast.elevation,
      timezone: forecast.timezone,
      timezoneAbbreviation: forecast.timezone_abbreviation,
    },
    current: {
      time: forecast.current.time,
      intervalSeconds: forecast.current.interval,
      timeOfDay,
      timeOfDayLabel: titleCase(timeOfDay),
      temperatureF: forecast.current.temperature_2m,
      apparentTemperatureF: forecast.current.apparent_temperature,
      relativeHumidity: forecast.current.relative_humidity_2m,
      isDay: forecast.current.is_day === 1,
      precipitationIn: forecast.current.precipitation,
      rainIn: forecast.current.rain,
      showersIn: forecast.current.showers,
      snowfallIn: forecast.current.snowfall,
      weatherCode: forecast.current.weather_code,
      weatherLabel: weatherLabel(forecast.current.weather_code),
      cloudCover: forecast.current.cloud_cover,
      windSpeedMph: forecast.current.wind_speed_10m,
      windDirectionDeg: forecast.current.wind_direction_10m,
      sun: {
        sunrise,
        sunset,
        solarNoon: minutesToLocalIso(localDate(forecast.current.time), solarNoonMinutes),
        daylightMinutes: Math.round(setMinutes - riseMinutes),
      },
      moon,
    },
    daily: forecast.daily.time.map((date, index) => ({
      date,
      temperatureMaxF: forecast.daily.temperature_2m_max[index],
      temperatureMinF: forecast.daily.temperature_2m_min[index],
      precipitationSumIn: forecast.daily.precipitation_sum[index],
      weatherCode: forecast.daily.weather_code[index],
      weatherLabel: weatherLabel(forecast.daily.weather_code[index]),
      sunrise: forecast.daily.sunrise[index],
      sunset: forecast.daily.sunset[index],
    })),
  };
}

export async function fetchBiomeWeather(): Promise<BiomeWeatherPayload> {
  const response = await fetch(buildForecastUrl(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const forecasts = (await response.json()) as OpenMeteoForecast[];
  if (!Array.isArray(forecasts) || forecasts.length !== BIOMES.length) {
    throw new Error("Open-Meteo returned an unexpected forecast payload.");
  }

  const weather = Object.fromEntries(
    BIOMES.map((biome, index) => [
      biome.id,
      normalizeWeather(forecasts[index], biome),
    ]),
  );

  return {
    provider: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
    weather,
  };
}
