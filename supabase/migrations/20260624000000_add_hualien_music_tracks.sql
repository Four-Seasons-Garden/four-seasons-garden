insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values
  (
    'hualien',
    '你抽的煙',
    '許美靜',
    'zePX5FhsKwE',
    'https://youtu.be/zePX5FhsKwE',
    30,
    true
  ),
  (
    'hualien',
    '真愛無敵 MV [VCD/原版MV字幕]',
    '許茹芸',
    'uzeIDQnOEwM',
    'https://youtu.be/uzeIDQnOEwM',
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
