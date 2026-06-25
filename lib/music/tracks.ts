import { BIOMES } from "@/lib/constants/biomes";
import { normalizeYouTubeUrl } from "@/lib/music/youtube";

export type LocationTrack = {
  id?: string;
  biomeId: string;
  title: string;
  artist: string;
  src?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  lyricsUrl?: string;
  lines?: string[];
  sortOrder?: number;
  isEnabled?: boolean;
  createdAt?: string;
};

export type StoredLocationTrack = LocationTrack & {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  sortOrder: number;
};

export type LocationTrackRow = {
  id: string;
  biome_id: string;
  title: string;
  artist: string;
  youtube_id: string;
  youtube_url: string;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
};

export type MusicByBiome<T extends LocationTrack = LocationTrack> = Record<string, T[]>;

export const LOCATION_TRACK_SELECT =
  "id, biome_id, title, artist, youtube_id, youtube_url, sort_order, is_enabled, created_at";

export const DEFAULT_LOCATION_TRACKS: LocationTrack[] = [
  {
    id: "akureyri-bing-yu",
    biomeId: "akureyri",
    title: "冰雨",
    artist: "刘德华",
    src: "/audio/akureyri-bing-yu.mp3",
    youtubeId: "90zAJ4tFSy8",
    lyricsUrl: "/audio/akureyri-bing-yu.lrc",
    lines: [
      "冰色的雨落进北方花园",
      "极光把夜色轻轻照亮",
      "玻璃温室听见雪的回声",
      "一行一行，像雨慢慢往下",
    ],
  },
  {
    id: "akureyri-yi-nian",
    biomeId: "akureyri",
    title: "一念 完整版",
    artist: "张紫宁 / 李鑫一",
    youtubeId: "IsZHPjmVM3E",
  },
  {
    id: "hualien-deng-ai-jiang-luo",
    biomeId: "hualien",
    title: "等愛降落",
    artist: "李玟 CoCo Lee",
    youtubeId: "f2wiVabzsN8",
  },
  {
    id: "hualien-wang-ri-qing",
    biomeId: "hualien",
    title: "往日情",
    artist: "李玟 CoCo Lee",
    youtubeId: "qna0SwJtoU4",
  },
  {
    id: "hualien-ni-chou-de-yan",
    biomeId: "hualien",
    title: "你抽的煙",
    artist: "許美靜",
    youtubeId: "zePX5FhsKwE",
  },
  {
    id: "hualien-zhen-ai-wu-di",
    biomeId: "hualien",
    title: "真愛無敵 MV [VCD/原版MV字幕]",
    artist: "許茹芸",
    youtubeId: "uzeIDQnOEwM",
  },
  {
    id: "kyoto-secret-base-lyrics",
    biomeId: "kyoto",
    title: "未聞花名-secret base(中文歌詞字幕內嵌)",
    artist: "Min Xuan",
    youtubeId: "mIIb3Jf06AA",
  },
  {
    id: "kyoto-secret-base-piano",
    biomeId: "kyoto",
    title: "secret base - Kimi ga Kureta Mono - AnoHana ED [Piano]",
    artist: "Animenz Piano Sheets",
    youtubeId: "jE0Ym96vmCA",
  },
  {
    id: "kyoto-one-summers-day",
    biomeId: "kyoto",
    title: "Joe Hisaishi - One Summer's Day",
    artist: "JoeHisaishiVEVO",
    youtubeId: "TK1Ij_-mank",
  },
  {
    id: "kyoto-merry-christmas-mr-lawrence",
    biomeId: "kyoto",
    title: "Merry Christmas Mr. Lawrence - From Ryuichi Sakamoto: Playing the Piano 2022",
    artist: "Ryuichi Sakamoto",
    youtubeId: "ELJf83TelA0",
  },
].map(withNormalizedYouTubeUrl);

export const DEFAULT_MUSIC_BY_BIOME = groupTracksByBiome(DEFAULT_LOCATION_TRACKS);

export function withNormalizedYouTubeUrl<T extends LocationTrack>(track: T): T {
  if (!track.youtubeId || track.youtubeUrl) return track;
  return {
    ...track,
    youtubeUrl: normalizeYouTubeUrl(track.youtubeId),
  };
}

export function groupTracksByBiome<T extends LocationTrack>(tracks: T[]): MusicByBiome<T> {
  const byBiome = Object.fromEntries(BIOMES.map((biome) => [biome.id, [] as T[]])) as MusicByBiome<T>;

  for (const track of tracks) {
    if (!byBiome[track.biomeId]) byBiome[track.biomeId] = [];
    byBiome[track.biomeId].push(track);
  }

  return byBiome;
}

export function locationTrackFromRow(row: LocationTrackRow): StoredLocationTrack {
  return {
    id: row.id,
    biomeId: row.biome_id,
    title: row.title,
    artist: row.artist,
    youtubeId: row.youtube_id,
    youtubeUrl: row.youtube_url || normalizeYouTubeUrl(row.youtube_id),
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
  };
}

export function isValidBiomeId(value: string | undefined) {
  return Boolean(value && BIOMES.some((biome) => biome.id === value));
}
