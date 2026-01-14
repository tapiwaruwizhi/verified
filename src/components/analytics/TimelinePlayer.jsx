import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function TimelinePlayer({ events, onTimeUpdate, sessionDuration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(10); // 10x speed

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (100 * playbackSpeed); // milliseconds
        if (next >= sessionDuration) {
          setIsPlaying(false);
          return sessionDuration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, sessionDuration]);

  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime]);

  const getSegmentColor = (event) => {
    switch (event.event_type) {
      case 'paste':
        return 'bg-rose-500';
      case 'focus_lost':
        return 'bg-amber-500';
      case 'idle_start':
        return 'bg-slate-400';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (value) => {
    setCurrentTime(value[0]);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      {/* Timeline Scrubber */}
      <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
        {/* Event Markers */}
        {events.map((event, idx) => {
          const position = (event.timestamp / sessionDuration) * 100;
          return (
            <div
              key={idx}
              className={cn(
                'absolute top-0 h-full w-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer',
                getSegmentColor(event)
              )}
              style={{ left: `${position}%` }}
              title={`${event.event_type} at ${formatTime(event.timestamp)}`}
              onClick={() => {
                setCurrentTime(event.timestamp);
                setIsPlaying(false);
              }}
            />
          );
        })}

        {/* Current Position Indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-slate-900 z-10"
          style={{ left: `${(currentTime / sessionDuration) * 100}%` }}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 bg-slate-900 rounded-full" />
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={[currentTime]}
        min={0}
        max={sessionDuration}
        step={100}
        onValueChange={handleSliderChange}
        className="w-full"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="h-9 w-9"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-9 w-9"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-slate-600">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="text-sm border border-slate-300 rounded px-2 py-1"
            >
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
              <option value={20}>20x</option>
            </select>
          </div>
        </div>

        <div className="text-sm font-medium text-slate-700">
          {formatTime(currentTime)} / {formatTime(sessionDuration)}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Typing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-400 rounded" />
          <span>Idle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-500 rounded" />
          <span>Focus Lost</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-500 rounded" />
          <span>Paste</span>
        </div>
      </div>
    </div>
  );
}