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
  'Joe Hisaishi - One Summer''s Day',
  'JoeHisaishiVEVO',
  'TK1Ij_-mank',
  'https://youtu.be/TK1Ij_-mank',
  30,
  true
)
on conflict (biome_id, youtube_id) do update
set
  title = excluded.title,
  artist = excluded.artist,
  youtube_url = excluded.youtube_url,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;
