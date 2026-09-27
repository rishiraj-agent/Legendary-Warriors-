import React, { useState, useMemo } from 'react';
import { ChevronLeft, Star, MapPin, Box, Shield, Users, Radio, Compass } from 'lucide-react';
import { LEVELS } from '../data/gameData';
import { LevelConfig } from '../types';
import { ModelViewer3D } from './ModelViewer3D';
import { createDetailedTacticalMapMesh } from '../game/Meshy3DGenerator';
import { soundEngine } from '../audio/soundEngine';

interface LevelSelectProps {
  currentLevel: number;
  unlockedLevelMax: number;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
  onOpen3DStudio?: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  currentLevel,
  unlockedLevelMax,
  onSelectLevel,
  onClose,
  onOpen3DStudio,
}) => {
  const [selectedPreviewLevel, setSelectedPreviewLevel] = useState<number>(currentLevel);
  const [difficulty, setDifficulty] = useState<'normal' | 'hard' | 'extreme'>('normal');
  const currentLvlConfig = LEVELS.find(l => l.levelNumber === selectedPreviewLevel) || LEVELS[0];

  const { modelGroup, meta } = useMemo(() => {
    const res = createDetailedTacticalMapMesh(currentLvlConfig);
    return { modelGroup: res.group, meta: res.meta };
  }, [currentLvlConfig]);

  const difficultyMultiplier = difficulty === 'extreme' ? 2.0 : difficulty === 'hard' ? 1.5 : 1.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md font-sans pointer-events-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#0d1117] border-2 border-yellow-500/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[660px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#090d12] border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                CAMPAIGN STAGES <span className="text-yellow-400 text-xs font-bold tracking-normal not-italic">// CHAPTER 1</span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">Select combat sector, configure difficulty & deploy</p>
            </div>
          </div>

          {/* Difficulty Modifier Selector */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
            {(['normal', 'hard', 'extreme'] as const).map(d => (
              <button
                key={d}
                onClick={() => {
                  soundEngine.playUiClick();
                  setDifficulty(d);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase transition ${
                  difficulty === d
                    ? d === 'extreme'
                      ? 'bg-red-600 text-white shadow-lg'
                      : d === 'hard'
                      ? 'bg-amber-500 text-black shadow-lg'
                      : 'bg-yellow-400 text-black shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Split between 3D Map Viewport and Level Detail */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: 3D Holographic Map Viewport */}
          <div className="flex-1 bg-[#070a0e] p-3 sm:p-4 flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/10">
              <ModelViewer3D
                modelGroup={modelGroup}
                badge={currentLvlConfig.name.toUpperCase()}
                subBadge={`TACTICAL TOPOGRAPHY // ${difficulty.toUpperCase()} MODE`}
                initialDistance={7.5}
                cameraTargetY={0.5}
              />
            </div>
          </div>

          {/* Right: Map Telemetry & Level Selector */}
          <div className="w-full md:w-80 bg-[#0c1017] border-t md:border-t-0 md:border-l border-white/10 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                    STAGE {currentLvlConfig.levelNumber}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                    {currentLvlConfig.environmentTheme}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map(s => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-wide mt-1">{currentLvlConfig.name}</h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{currentLvlConfig.subtitle}</p>

              {/* Map Telemetry Stats */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-yellow-400" /> TARGET KILLS
                  </div>
                  <div className="text-sm font-mono font-black text-yellow-400 mt-0.5">
                    {Math.round(currentLvlConfig.targetKills * difficultyMultiplier)} TARGETS
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Compass className="w-3 h-3 text-cyan-400" /> BOT SQUADS
                  </div>
                  <div className="text-sm font-mono font-black text-cyan-400 mt-0.5">
                    {currentLvlConfig.botCount} SQUADS
                  </div>
                </div>
              </div>

              {/* Reward Clearance Preview */}
              <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>VICTORY REWARDS</span>
                  <span className="text-yellow-400 font-mono">x{difficultyMultiplier} Bonus</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-500/30 px-2 py-1.5 rounded-lg">
                    <span className="text-lg">🪙</span>
                    <div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Gold Coins</div>
                      <div className="text-xs font-black text-yellow-400 font-mono">+{Math.round(300 * difficultyMultiplier)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-500/30 px-2 py-1.5 rounded-lg">
                    <span className="text-lg">💎</span>
                    <div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Diamonds</div>
                      <div className="text-xs font-black text-cyan-400 font-mono">+{Math.round(10 * difficultyMultiplier)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch / Select Button */}
            <div className="mt-3">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectLevel(currentLvlConfig);
                  onClose();
                }}
                className="w-full py-3 sm:py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_25px_rgba(234,179,8,0.5)] active:scale-98 transition cursor-pointer"
              >
                DEPLOY MISSION // STAGE {currentLvlConfig.levelNumber}
              </button>
            </div>
          </div>
        </div>

        {/* Level List - Bottom Gallery */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#06090d] border-t border-white/10 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {LEVELS.map(lvl => {
            const isUnlocked = lvl.levelNumber <= unlockedLevelMax;
            const isSelected = lvl.levelNumber === selectedPreviewLevel;

            return (
              <button
                key={lvl.levelNumber}
                onClick={() => {
                  soundEngine.playUiClick();
                  setSelectedPreviewLevel(lvl.levelNumber);
                }}
                className={`relative flex-none w-32 sm:w-36 h-18 sm:h-20 rounded-xl border p-2 flex flex-col justify-between transition-all text-left ${
                  !isUnlocked
                    ? 'border-white/5 bg-black/40 opacity-40 cursor-not-allowed'
                    : isSelected
                    ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105'
                    : 'border-white/10 bg-black/30 hover:border-white/30 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase">STAGE 0{lvl.levelNumber}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(starIdx => (
                      <Star
                        key={starIdx}
                        className={`w-2.5 h-2.5 ${
                          isUnlocked && starIdx <= lvl.levelNumber
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-[11px] sm:text-xs font-black uppercase tracking-tight truncate w-full text-white">
                  {lvl.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
