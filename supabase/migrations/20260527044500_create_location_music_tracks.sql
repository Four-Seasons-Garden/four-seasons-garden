create table if not exists public.location_music_tracks (
  id uuid primary key default gen_random_uuid(),
  biome_id text not null,
  title text not null,
  artist text not null default '',
  youtube_id text not null,
  youtube_url text not null,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (biome_id, youtube_id)
);

create index if not exists location_music_tracks_biome_sort_idx
  on public.location_music_tracks (biome_id, sort_order, created_at);

drop trigger if exists set_location_music_tracks_updated_at
  on public.location_music_tracks;

create trigger set_location_music_tracks_updated_at
before update on public.location_music_tracks
for each row
execute function public.set_updated_at();

alter table public.location_music_tracks enable row level security;

drop policy if exists "location music tracks are publicly readable"
  on public.location_music_tracks;

create policy "location music tracks are publicly readable"
on public.location_music_tracks
for select
using (is_enabled = true);

insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values (
  'akureyri',
  '冰雨',
  '刘德华',
  '90zAJ4tFSy8',
  'https://youtu.be/90zAJ4tFSy8',
  10,
  true
)
on conflict (biome_id, youtube_id) do update
set
  title = excluded.title,
  artist = excluded.artist,
  youtube_url = excluded.youtube_url,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;

insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values (
  'hualien',
  '等愛降落',
  '李玟 CoCo Lee',
  'f2wiVabzsN8',
  'https://youtu.be/f2wiVabzsN8',
  10,
  true
)
on conflict (biome_id, youtube_id) do update
set
  title = excluded.title,
  artist = excluded.artist,
  youtube_url = excluded.youtube_url,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;

insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values (
  'hualien',
  '往日情',
  '李玟 CoCo Lee',
  'qna0SwJtoU4',
  'https://youtu.be/qna0SwJtoU4',
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

delete from public.location_music_tracks
where biome_id = 'akureyri'
  and youtube_id = 'EI_1ey4WSC4';

insert into public.location_music_tracks (
  biome_id,
  title,
  artist,
  youtube_id,
  youtube_url,
  sort_order,
  is_enabled
) values (
  'akureyri',
  '一念 完整版',
  '张紫宁 / 李鑫一',
  'IsZHPjmVM3E',
  'https://youtu.be/IsZHPjmVM3E',
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
