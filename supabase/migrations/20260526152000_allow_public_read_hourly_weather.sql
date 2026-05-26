create policy "biome hourly weather is publicly readable"
on public.biome_hourly_weather
for select
using (true);
