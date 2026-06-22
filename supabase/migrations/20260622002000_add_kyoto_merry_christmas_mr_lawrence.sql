insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values (
  'kyoto',
  'Merry Christmas Mr. Lawrence - From Ryuichi Sakamoto: Playing the Piano 2022',
  'Ryuichi Sakamoto',
  'ELJf83TelA0',
  'https://youtu.be/ELJf83TelA0',
  40,
  true
)
on conflict (biome_id, youtube_id) do update
set
  title = excluded.title,
  artist = excluded.artist,
  youtube_url = excluded.youtube_url,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;
