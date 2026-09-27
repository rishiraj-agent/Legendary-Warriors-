import React, { useMemo } from 'react';
import { X, Zap, Shield, Flame, Target, Sparkles, User, Box } from 'lucide-react';
import { HEROES } from '../data/gameData';
import { HeroConfig } from '../types';
import { ModelViewer3D } from './ModelViewer3D';
import { createDetailedCharacterMesh } from '../game/Meshy3DGenerator';
import { soundEngine } from '../audio/soundEngine';

interface HeroSelectProps {
  currentHeroId: string;
  onSelectHero: (hero: HeroConfig) => void;
  onClose: () => void;
  onOpen3DStudio?: () => void;
}

export const HeroSelect: React.FC<HeroSelectProps> = ({
  currentHeroId,
  onSelectHero,
  onClose,
  onOpen3DStudio,
}) => {
  const heroList = Object.values(HEROES);
  const selectedHero = heroList.find(h => h.id === currentHeroId) || heroList[0];

  const { modelGroup, warrior } = useMemo(() => {
    const res = createDetailedCharacterMesh(selectedHero, 'default');
    return { modelGroup: res.group, warrior: res.warrior };
  }, [selectedHero]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md pointer-events-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#14181f] border border-yellow-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[600px] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d11] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                WARRIOR ROSTER <span className="text-yellow-400 text-xs font-bold tracking-normal not-italic">// 3D HERO MESHES</span>
              </h2>
              <p className="text-xs text-slate-400">Select combat operative and test 3D combat kinematics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpen3DStudio && (
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onOpen3DStudio();
                }}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D STUDIO</span>
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Hero Details & Selection */}
          <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-[#0e1217] border-r border-white/10 overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                  LEGENDARY OPERATIVE
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Lv. 15 MAX</span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase italic tracking-wide mt-1">{selectedHero.name}</h1>

              <div className="mt-4 p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/60 rounded-xl flex items-center justify-center shrink-0">
                    {selectedHero.id === 'alok' ? (
                      <Zap className="w-5 h-5 text-yellow-400" />
                    ) : selectedHero.id === 'chrono' ? (
                      <Shield className="w-5 h-5 text-yellow-400" />
                    ) : selectedHero.id === 'kelly' ? (
                      <Flame className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Target className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wider">{selectedHero.skillName}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{selectedHero.skillDescription}</div>
                  </div>
                </div>
              </div>

              {/* Combat Specs */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Skill Cooldown</div>
                  <div className="text-sm font-mono font-bold text-yellow-400">{selectedHero.skillCooldown}s</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Passive Aura</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">Active Tier 4</div>
                </div>
              </div>
            </div>

            {/* Character Selector Thumbnails */}
            <div className="mt-4">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">SELECT OPERATIVE</div>
              <div className="grid grid-cols-4 gap-2">
                {heroList.map(hero => {
                  const isSelected = hero.id === currentHeroId;
                  return (
                    <button
                      key={hero.id}
                      onClick={() => {
                        soundEngine.playUiClick();
                        onSelectHero(hero);
                      }}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <div className="text-base font-black uppercase">{hero.name.charAt(0)}</div>
                      <span className="text-[9px] font-bold tracking-tight truncate w-full px-1 text-center">
                        {hero.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive 3D Character Viewport */}
          <div className="flex-1 bg-[#0a0d11] p-4 flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden relative">
              <ModelViewer3D
                modelGroup={modelGroup}
                animatedWarrior={warrior}
                badge={selectedHero.name.toUpperCase()}
                subBadge="3D OPERATIVE MESH // ORBITAL DRAG"
                initialDistance={3.8}
                cameraTargetY={0.9}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
