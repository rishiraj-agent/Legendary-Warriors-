import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  X,
  Sparkles,
  Shield,
  Crosshair,
  Map,
  User,
  Zap,
  Flame,
  Award,
  Layers,
  Box,
  Check,
  Palette,
  Eye,
  Info,
  Maximize2,
} from 'lucide-react';
import { ModelViewer3D } from './ModelViewer3D';
import {
  createDetailedMeleeMesh,
  createDetailedFirearmMesh,
  createDetailedCharacterMesh,
  createDetailedTacticalMapMesh,
  createDetailedGearMesh,
  MeshSkinType,
  Meshy3DModelMeta,
} from '../game/Meshy3DGenerator';
import { HEROES, WEAPONS, LEVELS } from '../data/gameData';
import { HeroConfig, LevelConfig, WeaponData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface Meshy3DStudioModalProps {
  onClose: () => void;
  onEquipHero?: (hero: HeroConfig) => void;
  onEquipWeapon?: (weaponId: string) => void;
  onSelectMap?: (level: LevelConfig) => void;
  initialCategory?: 'melee' | 'firearm' | 'character' | 'map' | 'gear';
}

export const Meshy3DStudioModal: React.FC<Meshy3DStudioModalProps> = ({
  onClose,
  onEquipHero,
  onEquipWeapon,
  onSelectMap,
  initialCategory = 'melee',
}) => {
  const [activeCategory, setActiveCategory] = useState<'melee' | 'firearm' | 'character' | 'map' | 'gear'>(
    initialCategory
  );
  const [activeSkin, setActiveSkin] = useState<MeshSkinType>('default');
  const [selectedItemId, setSelectedItemId] = useState<string>('katana_dragon');
  const [equippedNotification, setEquippedNotification] = useState<string | null>(null);

  // List of Available Items per category
  const meleeItems = useMemo(
    () => [
      { id: 'katana_dragon', name: 'Dragon Spirit Katana', rarity: 'legendary', icon: '🗡️' },
      { id: 'scythe_reaper', name: 'Void Reaper Scythe', rarity: 'mythic', icon: '⚡' },
      { id: 'cyber_blade', name: 'Cyber Edge Machete', rarity: 'epic', icon: '🔪' },
      { id: 'kukri_tactical', name: 'Tactical Combat Kukri', rarity: 'rare', icon: '⚔️' },
    ],
    []
  );

  const firearmItems = useMemo(
    () => [
      { id: 'ak47', name: 'AK47 Flame Dragon', rarity: 'legendary', icon: '💥' },
      { id: 'scar', name: 'SCAR-L Titan', rarity: 'epic', icon: '🔫' },
      { id: 'awm', name: 'AWM Void Hunter', rarity: 'mythic', icon: '🎯' },
      { id: 'mp40', name: 'MP40 Cobra Flurry', rarity: 'epic', icon: '⚡' },
      { id: 'm1887', name: 'M1887 Golden Era', rarity: 'legendary', icon: '🔥' },
      { id: 'launcher', name: 'Plasma Annihilator', rarity: 'mythic', icon: '🚀' },
      { id: 'pistol', name: 'Desert Falcon', rarity: 'rare', icon: '🎯' },
    ],
    []
  );

  const characterItems = useMemo(
    () => Object.values(HEROES).map(h => ({ id: h.id, name: h.name, rarity: 'legendary', icon: '👤' })),
    []
  );

  const mapItems = useMemo(
    () => LEVELS.map(l => ({ id: `lvl_${l.levelNumber}`, name: l.name, rarity: 'mythic', icon: '🗺️', level: l })),
    []
  );

  const gearItems = useMemo(
    () => [
      { id: 'gloo_wall_dragon', name: 'Dragon Crest Gloo Wall', rarity: 'legendary', icon: '🛡️' },
      { id: 'airdrop_crate', name: 'Airdrop Supply Beacon', rarity: 'mythic', icon: '📦' },
    ],
    []
  );

  // Generate the active 3D model Mesh & Meta on the fly
  const { modelGroup, animatedWarrior, meta } = useMemo(() => {
    if (activeCategory === 'melee') {
      const res = createDetailedMeleeMesh(selectedItemId, activeSkin);
      return { modelGroup: res.group, animatedWarrior: null, meta: res.meta };
    }

    if (activeCategory === 'firearm') {
      const wData = WEAPONS[selectedItemId] || WEAPONS['ak47'];
      const res = createDetailedFirearmMesh(wData, activeSkin);
      return { modelGroup: res.group, animatedWarrior: null, meta: res.meta };
    }

    if (activeCategory === 'character') {
      const hero = HEROES[selectedItemId] || HEROES['alok'];
      const res = createDetailedCharacterMesh(hero, activeSkin);
      return { modelGroup: res.group, animatedWarrior: res.warrior, meta: res.meta };
    }

    if (activeCategory === 'map') {
      const lvlNum = parseInt(selectedItemId.replace('lvl_', ''), 10) || 1;
      const level = LEVELS.find(l => l.levelNumber === lvlNum) || LEVELS[0];
      const res = createDetailedTacticalMapMesh(level);
      return { modelGroup: res.group, animatedWarrior: null, meta: res.meta };
    }

    // Gear
    const res = createDetailedGearMesh(selectedItemId, activeSkin);
    return { modelGroup: res.group, animatedWarrior: null, meta: res.meta };
  }, [activeCategory, selectedItemId, activeSkin]);

  // Handle Equipping item
  const handleEquip = () => {
    soundEngine.playUiEquip();
    if (activeCategory === 'character') {
      const hero = HEROES[selectedItemId];
      if (hero) onEquipHero?.(hero);
    } else if (activeCategory === 'firearm' || activeCategory === 'melee') {
      onEquipWeapon?.(selectedItemId);
    } else if (activeCategory === 'map') {
      const lvlNum = parseInt(selectedItemId.replace('lvl_', ''), 10) || 1;
      const level = LEVELS.find(l => l.levelNumber === lvlNum);
      if (level) onSelectMap?.(level);
    }

    setEquippedNotification(`Equipped ${meta.name} successfully!`);
    setTimeout(() => setEquippedNotification(null), 3000);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-gradient-to-r from-red-600 via-purple-600 to-amber-500 text-white border-amber-400';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg pointer-events-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-[#0e1217] border border-yellow-500/30 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col h-[90vh] max-h-[780px] rounded-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080b0f] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
              <Box className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black italic tracking-wide text-white">MESHY 3D STUDIO</h1>
                <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                  REAL-TIME 3D INSPECTOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect 3D characters, firearms, melee weapons, tactical gear, and holographic maps
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/60 border-b border-white/10 overflow-x-auto text-xs font-bold">
          {[
            { id: 'melee', label: 'MELEE BLADES', icon: Sparkles, defaultId: 'katana_dragon' },
            { id: 'firearm', label: 'FIREARMS & ARSENAL', icon: Crosshair, defaultId: 'ak47' },
            { id: 'character', label: '3D HEROES', icon: User, defaultId: 'alok' },
            { id: 'map', label: '3D BATTLE MAPS', icon: Map, defaultId: 'lvl_1' },
            { id: 'gear', label: 'TACTICAL GLOO & GEAR', icon: Shield, defaultId: 'gloo_wall_dragon' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveCategory(cat.id as any);
                setSelectedItemId(cat.defaultId);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition uppercase tracking-wider whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-yellow-500 text-black font-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Studio Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Item List */}
          <div className="w-72 sm:w-80 border-r border-white/10 p-3 bg-[#0a0d11] overflow-y-auto flex flex-col gap-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>AVAILABLE 3D ASSETS</span>
              <span className="text-yellow-400 font-mono">
                {activeCategory === 'melee'
                  ? meleeItems.length
                  : activeCategory === 'firearm'
                  ? firearmItems.length
                  : activeCategory === 'character'
                  ? characterItems.length
                  : activeCategory === 'map'
                  ? mapItems.length
                  : gearItems.length}{' '}
                MODELS
              </span>
            </div>

            {(activeCategory === 'melee'
              ? meleeItems
              : activeCategory === 'firearm'
              ? firearmItems
              : activeCategory === 'character'
              ? characterItems
              : activeCategory === 'map'
              ? mapItems
              : gearItems
            ).map(item => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setSelectedItemId(item.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500/20 to-slate-800/80 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                      : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-white tracking-wide">{item.name}</span>
                      <span
                        className={`mt-0.5 inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border w-fit ${getRarityBadge(
                          item.rarity
                        )}`}
                      >
                        {item.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Column: 3D Interactive WebGL Viewport */}
          <div className="flex-1 p-4 bg-[#080b0f] flex flex-col relative overflow-hidden">
            <div className="flex-1 relative rounded-xl overflow-hidden">
              <ModelViewer3D
                modelGroup={modelGroup}
                animatedWarrior={animatedWarrior}
                badge={meta.name.toUpperCase()}
                subBadge={`3D MESH ENGINE // ${meta.category.toUpperCase()}`}
                initialDistance={activeCategory === 'map' ? 9.5 : activeCategory === 'character' ? 4.2 : 2.5}
                cameraTargetY={activeCategory === 'map' ? 0.2 : activeCategory === 'character' ? 1.0 : 0.4}
              />
            </div>

            {/* Notification Toast */}
            {equippedNotification && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-green-500 text-black font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-in zoom-in-95 duration-150 z-30">
                <Check className="w-4 h-4" />
                <span>{equippedNotification}</span>
              </div>
            )}
          </div>

          {/* Right Column: Model Specs & Shader Customizer */}
          <div className="w-80 border-l border-white/10 p-5 bg-[#0a0d11] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Title & Description */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getRarityBadge(
                      meta.rarity
                    )}`}
                  >
                    {meta.rarity}
                  </span>
                  <span className="text-[10px] text-yellow-400 font-mono font-bold uppercase">{meta.category}</span>
                </div>
                <h2 className="text-xl font-black italic tracking-wide text-white">{meta.name}</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{meta.description}</p>
              </div>

              {/* Skin / Material Shader Presets */}
              <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-yellow-400" />
                  <span>MATERIAL SKIN SHADERS</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'default', label: 'ORIGINAL', color: 'bg-slate-700' },
                    { id: 'gold_obsidian', label: 'GOLD OBSIDIAN', color: 'bg-amber-500' },
                    { id: 'cyber_neon', label: 'CYBER NEON', color: 'bg-cyan-500' },
                    { id: 'crimson_flame', label: 'CRIMSON FLAME', color: 'bg-red-500' },
                    { id: 'glacial_ice', label: 'GLACIAL ICE', color: 'bg-sky-400' },
                  ].map(skin => (
                    <button
                      key={skin.id}
                      onClick={() => {
                        soundEngine.playUiClick();
                        setActiveSkin(skin.id as any);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1.5 transition border ${
                        activeSkin === skin.id
                          ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300'
                          : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${skin.color}`} />
                      <span className="truncate">{skin.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mesh Topology Specs Grid */}
              <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-yellow-400" />
                  <span>MESH TOPOLOGY METRICS</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/60 p-2 rounded border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase">Polygons</div>
                    <div className="font-mono font-bold text-yellow-400">{meta.polyCount.toLocaleString()} Triangles</div>
                  </div>
                  <div className="bg-black/60 p-2 rounded border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase">Vertices</div>
                    <div className="font-mono font-bold text-white">{meta.vertexCount.toLocaleString()} Verts</div>
                  </div>
                  <div className="bg-black/60 p-2 rounded border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase">Materials</div>
                    <div className="font-mono font-bold text-cyan-400">{meta.materialsCount} Shaders</div>
                  </div>
                  <div className="bg-black/60 p-2 rounded border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase">Bound Box</div>
                    <div className="font-mono font-bold text-emerald-400">
                      {meta.dimensions.x}×{meta.dimensions.y}×{meta.dimensions.z}m
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Features Bullet List */}
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  TACTICAL PROPERTIES
                </div>
                {meta.features.map((feat, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action: Equip / Deploy Button */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={handleEquip}
                className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>EQUIP AS ACTIVE {meta.category.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
