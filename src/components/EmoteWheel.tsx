import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Flame, Award, Heart, MessageSquare, Zap } from 'lucide-react';
import { EmoteData } from '../types';
import { EMOTES } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface EmoteWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmote: (emote: EmoteData) => void;
  isHoldKeyMode?: boolean;
}

export const EmoteWheel: React.FC<EmoteWheelProps> = ({
  isOpen,
  onClose,
  onSelectEmote,
  isHoldKeyMode = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSelectedIndexRef = useRef<number | null>(null);

  // Sound cue when hovered slice changes
  const updateSelectedIndex = useCallback((index: number | null) => {
    if (index !== lastSelectedIndexRef.current) {
      if (index !== null) {
        soundEngine.playEmoteHover();
      }
      lastSelectedIndexRef.current = index;
      setSelectedIndex(index);
    }
  }, []);

  // Handle number keys (1-8) and Escape
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
      lastSelectedIndexRef.current = null;
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const num = parseInt(key, 10);
      if (num >= 1 && num <= EMOTES.length) {
        const emote = EMOTES[num - 1];
        if (emote) {
          e.preventDefault();
          e.stopPropagation();
          onSelectEmote(emote);
          onClose();
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, onSelectEmote, onClose]);

  // Track mouse coordinates relative to center
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // Dead zone in center
    if (dist < 48) {
      updateSelectedIndex(null);
      return;
    }

    // Radial angle (0 at top, going clockwise)
    const angleRad = Math.atan2(dy, dx);
    let deg = (angleRad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    const sliceAngle = 360 / EMOTES.length;
    // Offset by half slice so slices are centered on cardinal/ordinal directions
    const normalizedDeg = (deg + sliceAngle / 2) % 360;
    const index = Math.floor(normalizedDeg / sliceAngle) % EMOTES.length;

    updateSelectedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 48) {
      updateSelectedIndex(null);
      return;
    }

    const angleRad = Math.atan2(dy, dx);
    let deg = (angleRad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    const sliceAngle = 360 / EMOTES.length;
    const normalizedDeg = (deg + sliceAngle / 2) % 360;
    const index = Math.floor(normalizedDeg / sliceAngle) % EMOTES.length;

    updateSelectedIndex(index);
  };

  const handleTriggerCurrent = () => {
    if (selectedIndex !== null && EMOTES[selectedIndex]) {
      onSelectEmote(EMOTES[selectedIndex]);
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentEmote = selectedIndex !== null ? EMOTES[selectedIndex] : null;

  return (
    <div
      id="emote-wheel-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none animate-in fade-in zoom-in-95 duration-150"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={handleTriggerCurrent}
    >
      {/* Top Banner / Keybind Instructions */}
      <div className="absolute top-8 flex flex-col items-center gap-1 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-yellow-500/40 text-yellow-400 font-bold text-xs uppercase tracking-widest shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          <span>TACTICAL EMOTE WHEEL</span>
          <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-black">HOLD [T]</span>
        </div>
        <span className="text-[11px] text-slate-300 font-medium tracking-wide drop-shadow">
          {isHoldKeyMode ? 'Release [T] to trigger hovered emote • Press [1-8] for fast select' : 'Click slice or press [1-8] to trigger'}
        </span>
      </div>

      {/* Radial Wheel Container */}
      <div
        ref={containerRef}
        className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Outer Circular Ring Guide */}
        <div className="absolute inset-0 rounded-full border border-white/10 bg-radial from-slate-900/40 via-black/80 to-black/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Decorative Compass Lines */}
        <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-dashed border-white/15 pointer-events-none" />

        {/* Radial Emote Slices */}
        {EMOTES.map((emote, idx) => {
          const isSelected = selectedIndex === idx;
          const sliceAngle = (360 / EMOTES.length) * idx;
          // Radius from center to petal center
          const radius = 135; // px in default, scales well
          const angleRad = ((sliceAngle - 90) * Math.PI) / 180;
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;

          return (
            <div
              key={emote.id}
              id={`emote-slice-${emote.id}`}
              onMouseEnter={() => updateSelectedIndex(idx)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEmote(emote);
                onClose();
              }}
              className={`absolute cursor-pointer transition-all duration-150 flex flex-col items-center justify-center p-2 rounded-2xl ${
                isSelected
                  ? 'z-30 shadow-[0_0_25px_rgba(251,191,36,0.6)] border-2'
                  : 'z-10 hover:scale-105 border border-white/20'
              }`}
              style={{
                transform: `translate(${x}px, ${y}px) ${isSelected ? 'scale(1.15)' : 'scale(1)'}`,
                borderColor: isSelected ? emote.particleColor || '#fbbf24' : 'rgba(255,255,255,0.15)',
                backgroundColor: isSelected
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(10, 15, 30, 0.85)',
              }}
            >
              {/* Shortcut Key Badge */}
              <div
                className={`absolute -top-2.5 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                  isSelected
                    ? 'bg-yellow-400 text-black border border-yellow-200'
                    : 'bg-black/80 text-slate-300 border border-white/20'
                }`}
              >
                {idx + 1}
              </div>

              {/* Emote Icon */}
              <span className={`text-2xl sm:text-3xl transition-transform ${isSelected ? 'animate-bounce' : ''}`}>
                {emote.icon}
              </span>

              {/* Emote Name Tag */}
              <span
                className={`mt-1 text-[10px] sm:text-[11px] font-bold text-center tracking-tight whitespace-nowrap px-1.5 py-0.5 rounded ${
                  isSelected
                    ? 'text-white bg-black/60 shadow'
                    : 'text-slate-300'
                }`}
              >
                {emote.name}
              </span>
            </div>
          );
        })}

        {/* Center Core HUD / Selected Preview */}
        <div
          id="emote-wheel-center-hub"
          className={`relative z-20 w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center text-center p-2.5 transition-all duration-200 border-2 shadow-2xl backdrop-blur-md cursor-pointer ${
            currentEmote
              ? 'bg-slate-950/95 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
              : 'bg-black/90 border-white/20 hover:border-red-500/50'
          }`}
          style={{
            borderColor: currentEmote ? currentEmote.particleColor || '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
          }}
          onClick={handleTriggerCurrent}
        >
          {currentEmote ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-90 duration-150">
              <span className="text-3xl sm:text-4xl drop-shadow-md mb-0.5">{currentEmote.icon}</span>
              <span className="text-white font-black text-xs uppercase tracking-wider line-clamp-1">
                {currentEmote.name}
              </span>
              <span
                className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5"
                style={{
                  color: currentEmote.particleColor || '#fbbf24',
                  backgroundColor: `${currentEmote.particleColor || '#fbbf24'}22`,
                }}
              >
                {currentEmote.category}
              </span>
              <span className="text-[9px] text-yellow-400 font-bold mt-1 tracking-tight">
                {isHoldKeyMode ? 'RELEASE [T]' : 'CLICK TO FIRE'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center mb-1 text-slate-400">
                <X className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">CANCEL</span>
              <span className="text-[8px] text-slate-400">HOVER TO SELECT</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Details Box (when an emote is hovered) */}
      {currentEmote && (
        <div className="absolute bottom-10 max-w-md px-5 py-2.5 rounded-xl bg-black/85 border border-yellow-500/30 text-center shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <div className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-0.5">
            {currentEmote.name} • {currentEmote.category.toUpperCase()}
          </div>
          <div className="text-slate-300 text-xs font-normal leading-relaxed">
            {currentEmote.description}
          </div>
        </div>
      )}
    </div>
  );
};
