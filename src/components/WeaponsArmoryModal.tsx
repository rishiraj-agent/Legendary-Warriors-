import React, { useState, useMemo } from 'react';
import { X, Crosshair, Zap, Flame, Shield, Award, Sparkles, Check, ChevronRight, Box, Layers, Eye } from 'lucide-react';
import { WEAPONS } from '../data/gameData';
import { WeaponData } from '../types';
import { ModelViewer3D } from './ModelViewer3D';
import { createDetailedFirearmMesh, createDetailedMeleeMesh, MeshSkinType } from '../game/Meshy3DGenerator';
import { soundEngine } from '../audio/soundEngine';

interface WeaponsArmoryModalProps {
  onClose: () => void;
  selectedWeaponId?: string;
  onSelectPrimaryWeapon?: (weaponId: string) => void;
  onOpen3DStudio?: () => void;
}

export const WeaponsArmoryModal: React.FC<WeaponsArmoryModalProps> = ({
  onClose,
  selectedWeaponId = 'ak47',
  onSelectPrimaryWeapon,
  onOpen3DStudio,
}) => {
  const weaponList = Object.values(WEAPONS);
  const [activeWeaponId, setActiveWeaponId] = useState<string>(selectedWeaponId);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [equippedPrimary, setEquippedPrimary] = useState<string>(selectedWeaponId);
  const [viewMode, setViewMode] = useState<'3d_mesh' | 'stats'>('3d_mesh');
  const [activeSkin, setActiveSkin] = useState<MeshSkinType>('default');

  const activeWeapon: WeaponData = WEAPONS[activeWeaponId] || weaponList[0];

  const filteredWeapons = weaponList.filter(w => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'ar') return w.type === 'ar';
    if (activeCategory === 'smg') return w.type === 'smg';
    if (activeCategory === 'sniper') return w.type === 'sniper';
    if (activeCategory === 'shotgun') return w.type === 'shotgun';
    if (activeCategory === 'melee') return w.type === 'katana';
    if (activeCategory === 'heavy') return w.type === 'launcher' || w.type === 'pistol';
    return true;
  });

  // Generate 3D Mesh
  const { modelGroup, meta } = useMemo(() => {
    if (activeWeapon.type === 'katana') {
      const res = createDetailedMeleeMesh('katana_dragon', activeSkin);
      return { modelGroup: res.group, meta: res.meta };
    }
    const res = createDetailedFirearmMesh(activeWeapon, activeSkin);
    return { modelGroup: res.group, meta: res.meta };
  }, [activeWeapon, activeSkin]);

  const handleEquip = (weaponId: string) => {
    setEquippedPrimary(weaponId);
    soundEngine.playUiEquip();
    onSelectPrimaryWeapon?.(weaponId);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300';
      case 'epic':
        return 'bg-purple-900/80 text-purple-200 border-purple-500';
      case 'rare':
        return 'bg-blue-900/80 text-blue-200 border-blue-500';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md pointer-events-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[660px] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                ARMORY <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// 3D WEAPON ARSENAL</span>
              </h2>
              <p className="text-xs text-slate-400">Inspect 3D firearms, damage falloff curves, and loadouts</p>
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

        {/* Category Filter Bar & Mode Toggle */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-black/40 border-b border-white/5 overflow-x-auto text-xs font-bold gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'ALL ARSENAL' },
              { id: 'ar', label: 'ASSAULT RIFLES' },
              { id: 'smg', label: 'SMGS' },
              { id: 'sniper', label: 'SNIPERS' },
              { id: 'shotgun', label: 'SHOTGUNS' },
              { id: 'melee', label: 'MELEE' },
              { id: 'heavy', label: 'HEAVY / SIDEARM' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-yellow-500 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 shrink-0">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setViewMode('3d_mesh');
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 transition ${
                viewMode === '3d_mesh' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> 3D MESH
            </button>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setViewMode('stats');
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 transition ${
                viewMode === 'stats' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> BALLISTICS
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Weapon List Column */}
          <div className="w-72 sm:w-80 border-r border-slate-700/50 p-4 overflow-y-auto flex flex-col gap-2 bg-[#0d1115]">
            {filteredWeapons.map(w => {
              const isSelected = w.id === activeWeapon.id;
              const isEquipped = equippedPrimary === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveWeaponId(w.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500/20 to-slate-800 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                      : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-wide">{w.displayName}</span>
                      {isEquipped && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-green-500/20 border border-green-500/60 text-green-400">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getRarityBadge(w.rarity)}`}>
                        {w.rarity}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{w.ammoType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-yellow-400">{w.damage} DMG</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weapon Detail & 3D Mesh / Stats Inspector */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between bg-gradient-to-b from-[#14191f] to-[#0d1115]">
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getRarityBadge(activeWeapon.rarity)}`}>
                      {activeWeapon.rarity}
                    </span>
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">{activeWeapon.type}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white">{activeWeapon.displayName}</h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">{activeWeapon.description}</p>
                </div>

                <button
                  onClick={() => handleEquip(activeWeapon.id)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                    equippedPrimary === activeWeapon.id
                      ? 'bg-green-600/30 border border-green-500 text-green-300'
                      : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                  }`}
                >
                  {equippedPrimary === activeWeapon.id ? (
                    <>
                      <Check className="w-4 h-4" /> PRIMARY LOADOUT
                    </>
                  ) : (
                    'EQUIP PRIMARY'
                  )}
                </button>
              </div>

              {/* Viewport Content: 3D Mesh OR Ballistics Curve */}
              {viewMode === '3d_mesh' ? (
                <div className="h-[240px] rounded-xl overflow-hidden relative mb-4 border border-white/10 shadow-2xl">
                  <ModelViewer3D
                    modelGroup={modelGroup}
                    badge={activeWeapon.displayName.toUpperCase()}
                    subBadge="REAL-TIME 3D FIREARM MODEL // ROTATE 360°"
                    initialDistance={2.4}
                    cameraTargetY={0.1}
                  />
                </div>
              ) : (
                <>
                  {/* Damage Falloff Distance Visualizer */}
                  {activeWeapon.damageFalloff && activeWeapon.damageFalloff.length > 0 && (
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> DYNAMIC DAMAGE FALLOFF CURVE
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Simulated 3D ballistic raycast falloff
                        </div>
                      </div>

                      <div className="h-16 bg-slate-950 border border-slate-800 rounded p-2 relative flex items-end">
                        <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-20">
                          <div className="border-r border-slate-600 h-full"></div>
                          <div className="border-r border-slate-600 h-full"></div>
                          <div className="border-r border-slate-600 h-full"></div>
                        </div>

                        {activeWeapon.damageFalloff.map((node, i, arr) => {
                          if (i === 0) return null;
                          const prev = arr[i - 1];
                          const maxDist = arr[arr.length - 1].distance;
                          const left = (prev.distance / maxDist) * 100;
                          const width = ((node.distance - prev.distance) / maxDist) * 100;
                          const heightPercent = Math.max(10, node.multiplier * 100);

                          return (
                            <div
                              key={i}
                              className="absolute bottom-2 rounded-t transition-all duration-300 border-t-2 border-yellow-400"
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                height: `${heightPercent}%`,
                                backgroundColor: node.multiplier > 0.8 ? 'rgba(234, 179, 8, 0.15)' : node.multiplier > 0.4 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                borderColor: node.multiplier > 0.8 ? '#eab308' : node.multiplier > 0.4 ? '#f97316' : '#ef4444',
                              }}
                            >
                              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-white">
                                {Math.round(node.multiplier * 100)}%
                              </span>
                            </div>
                          );
                        })}

                        <div className="absolute -bottom-4 left-2 text-[8px] font-mono text-slate-500">0m (Point Blank)</div>
                        <div className="absolute -bottom-4 right-2 text-[8px] font-mono text-slate-500">
                          {activeWeapon.damageFalloff[activeWeapon.damageFalloff.length - 1].distance}m (Max Range)
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Weapon Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2">
                {[
                  { label: 'BASE DAMAGE', val: `${activeWeapon.damage} pts`, fill: (activeWeapon.damage / 180) * 100, color: 'bg-red-500' },
                  { label: 'HEADSHOT MULTIPLIER', val: `${activeWeapon.headshotMultiplier}x`, fill: (activeWeapon.headshotMultiplier / 4) * 100, color: 'bg-amber-400' },
                  { label: 'FIRE RATE', val: `${activeWeapon.fireRate}/s`, fill: (activeWeapon.fireRate / 15) * 100, color: 'bg-yellow-400' },
                  { label: 'EFFECTIVE RANGE', val: `${activeWeapon.effectiveRange || activeWeapon.range}m`, fill: ((activeWeapon.effectiveRange || activeWeapon.range) / 150) * 100, color: 'bg-cyan-400' },
                  { label: 'MAGAZINE CAPACITY', val: activeWeapon.magazineSize === 1 ? '1 Cleave' : `${activeWeapon.magazineSize} Rds`, fill: (activeWeapon.magazineSize / 35) * 100, color: 'bg-blue-400' },
                  { label: 'RELOAD SPEED', val: `${activeWeapon.reloadTime}s`, fill: Math.max(10, (1 - activeWeapon.reloadTime / 3) * 100), color: 'bg-emerald-400' },
                  { label: 'ACCURACY / SPREAD', val: activeWeapon.spread === 0 ? 'Pinpoint' : `${(1 - activeWeapon.spread * 10).toFixed(1)}/1.0`, fill: Math.max(20, (1 - activeWeapon.spread * 10) * 100), color: 'bg-purple-400' },
                  { label: 'AMMO CLASS', val: activeWeapon.ammoType, fill: 100, color: 'bg-slate-400' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col justify-between">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-sm font-black text-white font-mono my-0.5">{stat.val}</div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stat.color} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(8, stat.fill))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Tip Footer */}
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between text-xs text-yellow-200 mt-2">
              <span className="font-semibold text-[11px]">
                Tip: Equipping this firearm sets it as your primary spawn weapon in Battle Royale and Outpost Assault modes!
              </span>
              <span className="text-[10px] text-yellow-400/80 font-mono">LW_MESHY_v4.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
