'use client';

import { useRef, useState, useEffect } from 'react';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  duration_seconds: number | null;
  week_start: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PodcastPlayer({ episode }: { episode: PodcastEpisode | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [episode]);

  if (!episode) {
    return (
      <div className="border border-border rounded-lg p-10 bg-card-bg text-center">
        <p className="text-2xl mb-3">🎙️</p>
        <p className="font-bold mb-1">No podcast episodes yet</p>
        <p className="text-sm text-muted">The first episode will be generated this Sunday.</p>
      </div>
    );
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border border-border rounded-lg p-6 bg-card-bg">
      <audio ref={audioRef} src={episode.audio_url} preload="metadata" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-widest font-mono text-muted">🎙️ Weekly Podcast</span>
      </div>
      <h4 className="font-bold text-sm mb-1">{episode.title}</h4>
      {episode.description && (
        <p className="text-sm text-muted mb-4 line-clamp-2">{episode.description}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 border border-fg rounded-full flex items-center justify-center hover:bg-fg hover:text-bg transition-colors shrink-0"
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-mono text-muted w-10 text-right">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-border rounded-full cursor-pointer relative"
            onClick={seek}
          >
            <div
              className="h-full bg-fg rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted w-10">{formatTime(duration || episode.duration_seconds || 0)}</span>
        </div>
      </div>
    </div>
  );
}
