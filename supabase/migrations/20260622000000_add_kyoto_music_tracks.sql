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
    'kyoto',
    '未聞花名-secret base(中文歌詞字幕內嵌)',
    'Min Xuan',
    'mIIb3Jf06AA',
    'https://youtu.be/mIIb3Jf06AA',
    10,
    true
  ),
  (
    'kyoto',
    'secret base - Kimi ga Kureta Mono - AnoHana ED [Piano]',
    'Animenz Piano Sheets',
    'jE0Ym96vmCA',
    'https://youtu.be/jE0Ym96vmCA',
    20,
    true
  )
on conflict (biome_id, youtube_id) do update
set
  title = excluded.title,
  artist = excluded.artist,
  youtube_url = excluded.youtube_url,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;
