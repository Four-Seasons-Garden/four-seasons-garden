"use client";

import { BookOpen, FastForward, Pause, Play, Repeat, Repeat1, Rewind } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

/* One arrow-key tick, and one tap of the rewind/forward buttons. */
const SEEK_STEP_SECONDS = 3;

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

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
  const [duration, setDuration] = useState(0);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  /* A fresh seek is authoritative until the player reports the new position. */
  const seekGuardUntilRef = useRef(0);
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
    setDuration(0);
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
      setDuration(0);
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

  /* Runs while paused too: the seek bar needs a length before the first play. */
  useEffect(() => {
    /* The player is only partly wired up while an iframe loads, so every read
       is guarded rather than assumed callable. */
    const readNumber = (read: () => number | undefined) => {
      try {
        const value = read();
        return typeof value === "number" && Number.isFinite(value) ? value : null;
      } catch {
        return null;
      }
    };

    const interval = window.setInterval(() => {
      const player = youtubePlayerRef.current;
      const audio = audioRef.current;
      const time = readNumber(() => player?.getCurrentTime?.()) ?? (audio ? audio.currentTime : null);
      const total = readNumber(() => player?.getDuration?.())
        ?? (audio && Number.isFinite(audio.duration) ? audio.duration : null);

      if (total !== null && total > 0) {
        setDuration((current) => (Math.abs(current - total) > 0.5 ? total : current));
      }
      if (time === null || Date.now() < seekGuardUntilRef.current) return;
      setCurrentTime((current) => (Math.abs(current - time) > 0.2 ? time : current));
    }, 350);

    return () => window.clearInterval(interval);
  }, []);

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

  const songMenu = (
    <div className="music-song-menu" role="listbox" aria-label="Choose background song">
      {tracks.map((candidate) => {
        const key = locationTrackKey(candidate);
        const active = key === locationTrackKey(track);

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
              setDuration(0);
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
  );

  const seekPosition = scrubTime ?? currentTime;
  const canSeek = duration > 0;

  /* Both surfaces seek the one live player, whichever kind it is. */
  function seekTo(seconds: number) {
    const bounded = Math.min(Math.max(seconds, 0), duration > 0 ? duration : seconds);
    const player = youtubePlayerRef.current;

    if (track?.youtubeId) {
      if (typeof player?.seekTo !== "function") return;
      player.seekTo(bounded, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = bounded;
    } else {
      return;
    }

    seekGuardUntilRef.current = Date.now() + 700;
    setCurrentTime(bounded);
  }

  function nudge(deltaSeconds: number) {
    seekTo(seekPosition + deltaSeconds);
  }

  function commitScrub() {
    if (scrubTime === null) return;
    seekTo(scrubTime);
    setScrubTime(null);
  }

  const seekBar = (
    <div className="music-seek" data-disabled={!canSeek}>
      <button
        className="music-seek-step"
        type="button"
        onClick={() => nudge(-SEEK_STEP_SECONDS)}
        disabled={!canSeek}
        aria-label={`Rewind ${SEEK_STEP_SECONDS} seconds`}
        title={`Back ${SEEK_STEP_SECONDS}s`}
      >
        <Rewind size={13} />
      </button>
      <input
        className="music-seek-range"
        type="range"
        min={0}
        max={canSeek ? Math.round(duration) : 0}
        step={SEEK_STEP_SECONDS}
        value={Math.min(Math.round(seekPosition), canSeek ? Math.round(duration) : 0)}
        disabled={!canSeek}
        onChange={(event) => setScrubTime(Number(event.currentTarget.value))}
        onPointerUp={commitScrub}
        onLostPointerCapture={commitScrub}
        onPointerCancel={() => setScrubTime(null)}
        onKeyUp={commitScrub}
        onBlur={commitScrub}
        aria-label={`Seek within ${track.title}`}
        aria-valuetext={`${formatClock(seekPosition)} of ${formatClock(duration)}`}
        style={{
          "--seek-progress": `${canSeek ? Math.min(100, (seekPosition / duration) * 100) : 0}%`,
        } as CSSProperties}
      />
      <button
        className="music-seek-step"
        type="button"
        onClick={() => nudge(SEEK_STEP_SECONDS)}
        disabled={!canSeek}
        aria-label={`Skip ahead ${SEEK_STEP_SECONDS} seconds`}
        title={`Forward ${SEEK_STEP_SECONDS}s`}
      >
        <FastForward size={13} />
      </button>
      <span className="music-seek-clock">
        {formatClock(seekPosition)} / {canSeek ? formatClock(duration) : "--:--"}
      </span>
    </div>
  );

  const musicCard = (
    <div
      className="hud-music-card"
      data-playing={playing}
      data-expanded={expanded}
      data-learning-open={learningOpen}
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

      {songMenuOpen && songMenu}

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

  /* A separate control surface, not the card relocated: moving the card between
     a portal and its inline slot remounts it, which tears down the live player. */
  const floatingTransport = (
    <div className="hud-music-card is-learning-open" data-playing={playing}>
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
      {songMenuOpen && songMenu}
      {seekBar}
      {audioNote && <span className="music-note">{audioNote}</span>}
    </div>
  );

  return (
    <>
      {musicCard}
      {learningOpen && typeof document !== "undefined"
        ? createPortal(floatingTransport, document.body)
        : null}
      <JapaneseLearningModal
        open={learningOpen}
        track={track}
        lesson={learningLesson}
        onClose={() => setLearningOpen(false)}
      />
    </>
  );
}
