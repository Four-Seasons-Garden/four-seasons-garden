"use client";

import { BookOpen, Pause, Play, Repeat, Repeat1 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getJapaneseLearningLesson } from "@/lib/music/learning";
import type { LocationTrack } from "@/lib/music/tracks";
import {
  activeLyricIndex,
  fallbackLyrics,
  parseLrcEntries,
  visibleLyrics,
  type TimedLyric,
} from "@/lib/music/lrc";
import { loadYouTubeIframeApi, type YouTubePlayer } from "@/lib/music/youtube";
import { JapaneseLearningModal } from "./JapaneseLearningModal";

type LoopMode = "playlist" | "track";

export function locationTrackKey(track: LocationTrack) {
  return track.id ?? track.youtubeId ?? track.title;
}

export function LocationMusic({ tracks }: { tracks: LocationTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeMountRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const currentYoutubeVideoIdRef = useRef<string | null>(null);
  const currentYoutubeQueueKeyRef = useRef<string | null>(null);
  const pendingYoutubePlayRef = useRef(false);
  const pendingAudioPlayRef = useRef(false);
  const loopModeRef = useRef<LoopMode>("playlist");
  const playNextTrackRef = useRef<(autoplay: boolean) => void>(() => undefined);
  const tracksRef = useRef(tracks);
  const tracksLengthRef = useRef(tracks.length);
  const playingRef = useRef(false);
  const selectedTrackIdRef = useRef<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [songMenuOpen, setSongMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>("playlist");
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedLyrics, setLoadedLyrics] = useState<{ url: string; entries: TimedLyric[] } | null>(null);
  const youtubePlaylistIds = useMemo(
    () => tracks.map((item) => item.youtubeId).filter((id): id is string => Boolean(id)),
    [tracks],
  );
  const youtubePlaylistKey = youtubePlaylistIds.join(",");
  const track = tracks.find((item) => locationTrackKey(item) === selectedTrackId) ?? tracks[0];

  const playNextTrack = useCallback((autoplay: boolean) => {
    if (tracks.length === 0) return;

    const currentKey = track ? locationTrackKey(track) : selectedTrackId;
    const currentIndex = tracks.findIndex((item) => locationTrackKey(item) === currentKey);
    const nextTrack = tracks[currentIndex >= 0 ? (currentIndex + 1) % tracks.length : 0];
    if (!nextTrack) return;

    pendingYoutubePlayRef.current = autoplay && Boolean(nextTrack.youtubeId);
    pendingAudioPlayRef.current = autoplay && Boolean(nextTrack.src && !nextTrack.youtubeId);
    setSelectedTrackId(locationTrackKey(nextTrack));
    setSongMenuOpen(false);
    setCurrentTime(0);
    setLoadedLyrics(null);
    setPlaying(false);
    setAudioNote(autoplay && nextTrack.youtubeId ? "Loading player" : null);
    if (autoplay && nextTrack.youtubeId) setExpanded(true);
  }, [selectedTrackId, track, tracks]);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  useEffect(() => {
    playNextTrackRef.current = playNextTrack;
    tracksRef.current = tracks;
    tracksLengthRef.current = tracks.length;
  }, [playNextTrack, tracks]);

  useEffect(() => {
    selectedTrackIdRef.current = selectedTrackId;
  }, [selectedTrackId]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      audio?.pause();
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      currentYoutubeVideoIdRef.current = null;
      currentYoutubeQueueKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const lyricsUrl = track?.lyricsUrl;

    if (!lyricsUrl) return;

    fetch(lyricsUrl)
      .then((response) => response.ok ? response.text() : "")
      .then((text) => {
        if (!active || !text) return;
        const parsed = parseLrcEntries(text);
        if (parsed.length > 0) {
          setLoadedLyrics({ url: lyricsUrl, entries: parsed });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [track?.lyricsUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.src || track.youtubeId || !pendingAudioPlayRef.current) return;

    pendingAudioPlayRef.current = false;
    audio.volume = 0.28;
    audio.play()
      .then(() => {
        setPlaying(true);
        setAudioNote(null);
      })
      .catch(() => {
        setPlaying(false);
        setAudioNote("Add licensed audio");
      });
  }, [track?.src, track?.youtubeId]);

  useEffect(() => {
    const videoId = track?.youtubeId;
    const mount = youtubeMountRef.current;
    if (!videoId || !expanded || !mount) return;

    let active = true;
    const currentVideoId = videoId;
    const queueIds = loopMode === "playlist" && youtubePlaylistIds.length > 0
      ? youtubePlaylistIds
      : [currentVideoId];
    const queueKey = `${loopMode}:${loopMode === "playlist" ? youtubePlaylistKey : currentVideoId}`;
    const queueIndex = Math.max(0, queueIds.indexOf(currentVideoId));

    function syncSelectedTrackFromPlayer(player: YouTubePlayer) {
      const playlist = player.getPlaylist();
      const playlistIndex = player.getPlaylistIndex();
      const activeVideoId = playlist[playlistIndex] ?? currentYoutubeVideoIdRef.current;
      if (!activeVideoId) return;

      currentYoutubeVideoIdRef.current = activeVideoId;
      const activeTrack = tracksRef.current.find((item) => item.youtubeId === activeVideoId);
      if (!activeTrack) return;

      const key = locationTrackKey(activeTrack);
      if (key === selectedTrackIdRef.current) return;

      selectedTrackIdRef.current = key;
      setSelectedTrackId(key);
      setCurrentTime(0);
      setLoadedLyrics(null);
    }

    function loadYoutubeQueue(player: YouTubePlayer, autoplay: boolean) {
      currentYoutubeVideoIdRef.current = currentVideoId;
      currentYoutubeQueueKeyRef.current = queueKey;
      setAudioNote(null);

      if (loopMode === "playlist") {
        if (autoplay) {
          player.loadPlaylist(queueIds, queueIndex, 0);
        } else {
          player.cuePlaylist(queueIds, queueIndex, 0);
        }
        player.setLoop(true);
        return;
      }

      player.setLoop(false);
      if (autoplay) {
        player.loadVideoById(currentVideoId);
      } else {
        player.cueVideoById(currentVideoId);
      }
    }

    loadYouTubeIframeApi().then(() => {
      if (!active || !window.YT?.Player || !youtubeMountRef.current) return;

      const existingPlayer = youtubePlayerRef.current;
      if (existingPlayer) {
        if (currentYoutubeQueueKeyRef.current !== queueKey || currentYoutubeVideoIdRef.current !== videoId) {
          const shouldAutoplay = pendingYoutubePlayRef.current || playingRef.current;
          pendingYoutubePlayRef.current = false;
          loadYoutubeQueue(existingPlayer, shouldAutoplay);
        } else if (pendingYoutubePlayRef.current) {
          pendingYoutubePlayRef.current = false;
          existingPlayer.setLoop(loopMode === "playlist");
          existingPlayer.playVideo();
          setAudioNote(null);
        }
        return;
      }

      currentYoutubeVideoIdRef.current = currentVideoId;
      currentYoutubeQueueKeyRef.current = queueKey;
      youtubePlayerRef.current = new window.YT.Player(youtubeMountRef.current, {
        videoId: currentVideoId,
        width: "100%",
        height: 200,
        playerVars: {
          controls: 1,
          ...(loopMode === "playlist" ? { loop: 1, playlist: queueIds.join(",") } : {}),
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (!active) return;
            youtubePlayerRef.current = event.target;
            const shouldAutoplay = pendingYoutubePlayRef.current;
            pendingYoutubePlayRef.current = false;
            loadYoutubeQueue(event.target, shouldAutoplay);
          },
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.PLAYING) {
              syncSelectedTrackFromPlayer(event.target);
              setPlaying(true);
            }
            if (event.data === state.PAUSED || event.data === state.CUED) setPlaying(false);
            if (event.data === state.ENDED) {
              if (loopModeRef.current === "track" || tracksLengthRef.current === 1) {
                event.target.playVideo();
                return;
              }

              const playlist = event.target.getPlaylist();
              const playlistIndex = event.target.getPlaylistIndex();
              if (playlist.length > 1 && playlistIndex >= playlist.length - 1) {
                event.target.loadPlaylist(playlist, 0, 0);
                event.target.setLoop(true);
              } else if (playlist.length <= 1) {
                playNextTrackRef.current(true);
              }
            }
          },
          onError: () => {
            setAudioNote("Open on YouTube");
            setPlaying(false);
          },
        },
      });
    });

    return () => {
      active = false;
    };
  }, [track?.youtubeId, expanded, loopMode, youtubePlaylistIds, youtubePlaylistKey]);

  useEffect(() => {
    if (expanded && track?.youtubeId) return;

    const player = youtubePlayerRef.current;
    youtubePlayerRef.current = null;
    currentYoutubeVideoIdRef.current = null;
    currentYoutubeQueueKeyRef.current = null;
    if (!track?.youtubeId) pendingYoutubePlayRef.current = false;
    player?.destroy();
  }, [expanded, track?.youtubeId]);

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(() => {
      const youtubeTime = youtubePlayerRef.current?.getCurrentTime();
      if (typeof youtubeTime === "number") {
        setCurrentTime(youtubeTime);
        return;
      }

      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    }, 350);

    return () => window.clearInterval(interval);
  }, [playing]);

  if (!track) return null;
  const lyricEntries =
    loadedLyrics && loadedLyrics.url === track.lyricsUrl
      ? loadedLyrics.entries
      : fallbackLyrics(track.lines ?? []);
  const activeIndex = activeLyricIndex(lyricEntries, currentTime);
  const lyricWindow = visibleLyrics(lyricEntries, activeIndex);
  const learningLesson = getJapaneseLearningLesson(track);

  async function toggleMusic() {
    if (track?.youtubeId) {
      if (!expanded) setExpanded(true);

      const player = youtubePlayerRef.current;
      if (!player) {
        pendingYoutubePlayRef.current = true;
        setAudioNote("Loading player");
        return;
      }

      if (playing) {
        player.pauseVideo();
        playingRef.current = false;
      } else {
        player.playVideo();
      }
      setAudioNote(null);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      setAudioNote(null);
      return;
    }

    try {
      audio.volume = 0.28;
      await audio.play();
      setPlaying(true);
      setAudioNote(null);
    } catch {
      setPlaying(false);
      setAudioNote("Add licensed audio");
    }
  }

  const musicCard = (
    <div
      className={`hud-music-card ${learningOpen ? "is-learning-open" : ""}`}
      data-playing={playing}
      data-expanded={expanded}
    >
      {track.src && !track.youtubeId && (
        <audio
          ref={audioRef}
          src={track.src}
          loop={loopMode === "track" || tracks.length === 1}
          preload="none"
          onEnded={() => {
            if (loopMode === "playlist" && tracks.length > 1) playNextTrack(true);
          }}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onError={() => {
            setPlaying(false);
            setAudioNote("Add licensed audio");
          }}
        />
      )}
      <div className="hud-trackline">
        <button
          className="music-title-button"
          type="button"
          onClick={() => setSongMenuOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={songMenuOpen}
          title="Choose song"
        >
          <b>{track.title}</b>
          {track.artist && <small>{track.artist}</small>}
        </button>
        <div className="music-actions">
          <button
            className="music-toggle music-picker-toggle"
            type="button"
            onClick={() => setSongMenuOpen((current) => !current)}
            aria-label="Choose song"
            aria-expanded={songMenuOpen}
            title="Choose song"
          >
            ♪
          </button>
          <button
            className="music-toggle"
            type="button"
            onClick={() => setLoopMode((current) => current === "playlist" ? "track" : "playlist")}
            aria-label={loopMode === "playlist" ? "Switch to current song loop" : "Switch to playlist loop"}
            aria-pressed={loopMode === "track"}
            title={loopMode === "playlist" ? "Loop playlist" : "Loop current song"}
          >
            {loopMode === "playlist" ? <Repeat size={14} /> : <Repeat1 size={14} />}
          </button>
          <button
            className="music-toggle music-learning-toggle"
            type="button"
            onClick={() => setLearningOpen(true)}
            aria-label="Open language learning notes"
            title="Learn from this playlist"
          >
            <BookOpen size={14} />
          </button>
          <button
            className="music-toggle music-fold"
            type="button"
            onClick={() => {
              if (expanded) {
                youtubePlayerRef.current?.pauseVideo();
                pendingYoutubePlayRef.current = false;
                playingRef.current = false;
                setPlaying(false);
              }
              setExpanded(!expanded);
            }}
            aria-label={expanded ? "Collapse music details" : "Expand music details"}
            aria-expanded={expanded}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
          <button
            className="music-toggle"
            type="button"
            onClick={toggleMusic}
            aria-label={playing ? "Pause background music" : "Play background music"}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {songMenuOpen && (
        <div className="music-song-menu" role="listbox" aria-label="Choose background song">
          {tracks.map((candidate) => {
            const key = candidate.id ?? candidate.youtubeId ?? candidate.title;
            const active = key === (track.id ?? track.youtubeId ?? track.title);

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  youtubePlayerRef.current?.pauseVideo();
                  pendingYoutubePlayRef.current = false;
                  pendingAudioPlayRef.current = false;
                  playingRef.current = false;
                  selectedTrackIdRef.current = key;
                  setSelectedTrackId(key);
                  setSongMenuOpen(false);
                  setCurrentTime(0);
                  setPlaying(false);
                  setAudioNote(null);
                }}
              >
                <span>{candidate.title}</span>
                <small>{candidate.artist || "YouTube"}</small>
              </button>
            );
          })}
        </div>
      )}

      <div className="music-details" aria-hidden={!expanded}>
        {!track.youtubeId && (
          <div className="lyric-rain" aria-label={`${track.title} lyric rain`}>
            <div className="synced-lyrics">
              {lyricWindow.map(({ entry, index }) => (
                <span
                  key={`${entry.time}-${entry.text}`}
                  className={index === activeIndex ? "is-current" : ""}
                >
                  {entry.text}
                </span>
              ))}
            </div>
          </div>
        )}
        {track.youtubeUrl && (
          <a className="youtube-link" href={track.youtubeUrl} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        )}
        {audioNote && <span className="music-note">{audioNote}</span>}
      </div>

      {track.youtubeId && expanded && (
        <div className="youtube-loop-player" aria-label={`${track.title} YouTube player`}>
          <div ref={youtubeMountRef} />
        </div>
      )}
    </div>
  );

  return (
    <>
    {learningOpen && typeof document !== "undefined"
      ? createPortal(musicCard, document.body)
      : musicCard}
    <JapaneseLearningModal
      open={learningOpen}
      track={track}
      lesson={learningLesson}
      onClose={() => setLearningOpen(false)}
    />
    </>
  );
}
