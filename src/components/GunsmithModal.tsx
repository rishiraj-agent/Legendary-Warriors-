import React, { useState, useMemo } from 'react';
import { X, Wrench, Shield, Crosshair, Sparkles, Check, Zap, Flame, Box, ChevronRight, Sliders } from 'lucide-react';
import { ATTACHMENT_SPECS, DEFAULT_WEAPONS, WEAPONS } from '../data/gameData';
import {
  MuzzleAttachment,
  OpticsAttachment,
  MagazineAttachment,
  UnderbarrelAttachment,
  StockAttachment,
  WeaponAttachments,
  WeaponData,
  UserProfileData,
} from '../types';
import { ModelViewer3D } from './ModelViewer3D';
import { createDetailedFirearmMesh } from '../game/Meshy3DGenerator';
import { soundEngine } from '../audio/soundEngine';

interface GunsmithModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
  selectedWeaponId?: string;
  customAttachments: Record<string, WeaponAttachments>;
  onUpdateAttachments: (attachments: Record<string, WeaponAttachments>) => void;
  onOpen3DStudio?: () => void;
}

export const GunsmithModal: React.FC<GunsmithModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
  selectedWeaponId = 'ak47',
  customAttachments,
  onUpdateAttachments,
  onOpen3DStudio,
}) => {
  const [activeWeaponId, setActiveWeaponId] = useState<string>(selectedWeaponId);
  const [activeTab, setActiveTab] = useState<'attachments' | 'chip_upgrade'>('attachments');
  const [selectedSlot, setSelectedSlot] = useState<'muzzle' | 'optics' | 'magazine' | 'underbarrel' | 'stock'>('optics');

  const activeWeapon: WeaponData = WEAPONS[activeWeaponId] || WEAPONS.ak47;
  const currentAttachments: WeaponAttachments = customAttachments[activeWeaponId] || {
    muzzle: 'compensator',
    optics: 'red_dot',
    magazine: 'extended_mag_lvl3',
    underbarrel: 'angled_foregrip',
    stock: 'carbon_fiber_stock',
    chipLevel: 3,
  };

  const handleSelectAttachment = (slot: keyof WeaponAttachments, value: any) => {
    soundEngine.playUiEquip();
    const updated = {
      ...customAttachments,
      [activeWeaponId]: {
        ...currentAttachments,
        [slot]: value,
      },
    };
    onUpdateAttachments(updated);
    localStorage.setItem('lw_gunsmith_attachments', JSON.stringify(updated));
  };

  const handleUpgradeChip = (targetLevel: 1 | 2 | 3 | 4 | 5) => {
    const cost = targetLevel * 1200;
    if (userProfile.coins < cost) {
      soundEngine.playUiClick();
      return;
    }

    soundEngine.playUiReward();
    onUpdateProfile({ coins: userProfile.coins - cost });

    const updated = {
      ...customAttachments,
      [activeWeaponId]: {
        ...currentAttachments,
        chipLevel: targetLevel,
      },
    };
    onUpdateAttachments(updated);
    localStorage.setItem('lw_gunsmith_attachments', JSON.stringify(updated));
  };

  // Calculate modified stats
  const chipMultiplier = 1 + (currentAttachments.chipLevel - 1) * 0.15;
  const effectiveDamage = Math.round(activeWeapon.damage * chipMultiplier);
  const effectiveCapacity =
    currentAttachments.magazine === 'drum_mag'
      ? activeWeapon.magazineSize + 30
      : currentAttachments.magazine === 'extended_mag_lvl3'
      ? activeWeapon.magazineSize + 20
      : activeWeapon.magazineSize;
  const effectiveReload = (
    activeWeapon.reloadTime *
    (currentAttachments.magazine === 'quick_reload_mag' ? 0.65 : 1.0) *
    (1 - (currentAttachments.chipLevel - 1) * 0.08)
  ).toFixed(1);

  // 3D Mesh
  const { modelGroup, meta } = useMemo(() => {
    const res = createDetailedFirearmMesh(
      activeWeapon,
      currentAttachments.stock === 'dragon_animated_skin' ? 'crimson_flame' : 'default'
    );
    return { modelGroup: res.group, meta: res.meta };
  }, [activeWeapon, currentAttachments.stock]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md pointer-events-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0e1319] border-2 border-yellow-500/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col h-[90vh] sm:h-[660px] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#090d12] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-xl">
              🔧
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic tracking-wide text-white flex items-center gap-2">
                GUNSMITH <span className="text-yellow-400 text-xs font-bold tracking-normal not-italic">// WEAPON BENCH & CHIP UPGRADES</span>
              </h2>
              <p className="text-xs text-slate-400">Modular attachments, kinetic caliber chips & custom optics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 mr-2">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-mono font-black text-yellow-400">{userProfile.coins.toLocaleString()}</span>
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
        </div>

        {/* Weapons Quick Picker Tab */}
        <div className="flex items-center gap-2 px-6 py-2 bg-[#06090d] border-b border-white/5 overflow-x-auto text-xs font-bold">
          {Object.values(WEAPONS)
            .filter(w => w.type !== 'katana')
            .map(w => {
              const isSelected = w.id === activeWeaponId;
              const chip = customAttachments[w.id]?.chipLevel || 1;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveWeaponId(w.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition uppercase tracking-wider flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{w.displayName}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded font-mono font-black ${isSelected ? 'bg-black/30 text-black' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    LV.{chip}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: 3D Gunsmith Viewport */}
          <div className="flex-1 bg-[#070a0e] p-3 sm:p-4 flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/10">
              <ModelViewer3D
                modelGroup={modelGroup}
                badgeTitle={`GUNSMITH // ${activeWeapon.displayName.toUpperCase()}`}
                subBadge={`CHIP LEVEL ${currentAttachments.chipLevel} // ${currentAttachments.optics.toUpperCase()}`}
                initialDistance={3.8}
                cameraTargetY={0.1}
              />
            </div>

            {/* In-Bench Stats readout */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="p-2 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Kinetic Damage</div>
                <div className="text-sm font-mono font-black text-yellow-400 mt-0.5">
                  {effectiveDamage} <span className="text-[9px] text-green-400">({effectiveDamage - activeWeapon.damage > 0 ? `+${effectiveDamage - activeWeapon.damage}` : 'Base'})</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Mag Capacity</div>
                <div className="text-sm font-mono font-black text-cyan-400 mt-0.5">
                  {effectiveCapacity} RNDS
                </div>
              </div>
              <div className="p-2 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Reload Latency</div>
                <div className="text-sm font-mono font-black text-amber-400 mt-0.5">
                  {effectiveReload}s
                </div>
              </div>
              <div className="p-2 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Headshot Multiplier</div>
                <div className="text-sm font-mono font-black text-red-400 mt-0.5">
                  x{activeWeapon.headshotMultiplier}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Attachment Slots & Chip Upgrades */}
          <div className="w-full md:w-88 bg-[#0c1017] border-t md:border-t-0 md:border-l border-white/10 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Tab Switcher */}
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 mb-4">
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('attachments');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                    activeTab === 'attachments' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MODULAR SLOTS (5)
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('chip_upgrade');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                    activeTab === 'chip_upgrade' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CALIBER CHIPS (LV 1-5)
                </button>
              </div>

              {activeTab === 'attachments' ? (
                <>
                  {/* Slot selector chips */}
                  <div className="grid grid-cols-5 gap-1.5 mb-4">
                    {(['muzzle', 'optics', 'magazine', 'underbarrel', 'stock'] as const).map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          soundEngine.playUiClick();
                          setSelectedSlot(slot);
                        }}
                        className={`p-2 rounded-xl border text-center transition ${
                          selectedSlot === slot
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                            : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[8px] font-black uppercase tracking-tight truncate">{slot}</div>
                        <div className="text-[10px] font-bold text-white truncate mt-0.5">
                          {ATTACHMENT_SPECS[slot][currentAttachments[slot] as string]?.name || 'Equipped'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Options for selected slot */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <span>SELECT {selectedSlot.toUpperCase()} ATTACHMENT</span>
                    </div>

                    {Object.entries(ATTACHMENT_SPECS[selectedSlot]).map(([key, spec]: [string, any]) => {
                      const isEquipped = currentAttachments[selectedSlot] === key;
                      return (
                        <div
                          key={key}
                          onClick={() => handleSelectAttachment(selectedSlot, key)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isEquipped
                              ? 'bg-gradient-to-r from-yellow-950/40 to-slate-900 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                              : 'bg-black/40 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{spec.name}</span>
                              {spec.zoom && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                                  {spec.zoom}
                                </span>
                              )}
                              {isEquipped && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 font-mono">
                                  EQUIPPED
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{spec.bonus}</p>
                          </div>

                          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                            {isEquipped && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Chip upgrades */
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CALIBER CHIP OVERCLOCK SYSTEM
                  </div>

                  {([1, 2, 3, 4, 5] as const).map(lvl => {
                    const info = ATTACHMENT_SPECS.chipLevels[lvl];
                    const isCurrent = currentAttachments.chipLevel === lvl;
                    const isUnlocked = currentAttachments.chipLevel >= lvl;
                    const upgradeCost = lvl * 1200;

                    return (
                      <div
                        key={lvl}
                        className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-yellow-950/40 to-slate-900 border-yellow-500'
                            : isUnlocked
                            ? 'bg-black/30 border-white/10 opacity-70'
                            : 'bg-black/40 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                            isCurrent ? 'bg-yellow-500 text-black' : isUnlocked ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            LV.{lvl}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">{info.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-yellow-400 font-bold">Velocity {info.damageBuff}</span>
                              <span className="text-cyan-400 font-bold">Reload {info.reloadBuff}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span className="text-[10px] font-black px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                              ACTIVE
                            </span>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => handleSelectAttachment('chipLevel', lvl)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase cursor-pointer"
                            >
                              EQUIP
                            </button>
                          ) : (
                            <button
                              disabled={userProfile.coins < upgradeCost}
                              onClick={() => handleUpgradeChip(lvl)}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer ${
                                userProfile.coins >= upgradeCost
                                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg active:scale-95'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <span>{upgradeCost.toLocaleString()}</span>
                              <span>🪙</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom action */}
            <div className="mt-4">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onClose();
                }}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] transition cursor-pointer"
              >
                SAVE & APPLY ATTACHMENTS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
