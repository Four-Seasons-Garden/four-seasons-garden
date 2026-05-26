create table if not exists public.biome_hourly_weather (
  id bigint generated always as identity primary key,
  biome_id text not null,
  location_name text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  forecast_time_local timestamp without time zone not null,
  temperature_f double precision not null,
  precipitation_in double precision not null default 0,
  rain_in double precision not null default 0,
  showers_in double precision not null default 0,
  snowfall_in double precision not null default 0,
  weather_code integer,
  weather_label text not null,
  provider text not null default 'Open-Meteo',
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, biome_id, forecast_time_local)
);

create index if not exists biome_hourly_weather_biome_time_idx
  on public.biome_hourly_weather (biome_id, forecast_time_local desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_biome_hourly_weather_updated_at
  on public.biome_hourly_weather;

create trigger set_biome_hourly_weather_updated_at
before update on public.biome_hourly_weather
for each row
execute function public.set_updated_at();

alter table public.biome_hourly_weather enable row level security;
