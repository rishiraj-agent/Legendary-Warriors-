import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Flame,
  Volume2,
  VolumeX,
  Settings,
  RotateCw,
  Crosshair,
  Zap,
  ChevronUp,
  Smile,
  Target,
  Sparkles,
  Lock,
  Wrench,
  MapPin,
  Users,
  Wifi,
  AlertTriangle,
  HeartPulse,
  Activity,
  Radio,
  Clock,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  DamageNumber,
  HeroCharacter,
  KillFeedItem,
  LevelConfig,
  WeaponInventorySlot,
  ActiveEmoteEvent,
  SquadMember,
  TacticalPingWaypoint,
} from '../types';
import { soundEngine } from '../audio/soundEngine';

const WeaponTooltip: React.FC<{ slot: WeaponInventorySlot; isPrimary?: boolean }> = ({ slot, isPrimary }) => {
  if (!slot || !slot.weapon) return null;
  const { weapon } = slot;

  return (
    <div
      className={`absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/90 border border-white/20 p-3 w-48 shadow-2xl backdrop-blur-md ${
        isPrimary ? 'right-[105%] top-0' : 'bottom-[110%] left-1/2 -translate-x-1/2'
      }`}
    >
      <div className="text-xs font-black text-yellow-500 uppercase truncate">{weapon.displayName}</div>
      <div className="text-[9px] text-slate-400 uppercase mb-2">{weapon.type}</div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="text-[8px] text-slate-500 uppercase">Damage</div>
          <div className="text-[10px] text-white font-bold">
            {weapon.damage} <span className="text-red-400 text-[8px]">(x{weapon.headshotMultiplier})</span>
          </div>
        </div>
        <div>
          <div className="text-[8px] text-slate-500 uppercase">Effective</div>
          <div className="text-[10px] text-white font-bold">{weapon.effectiveRange || weapon.range}m</div>
        </div>
      </div>

      {weapon.damageFalloff && weapon.damageFalloff.length > 0 && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <div className="text-[8px] text-slate-500 uppercase mb-1">Damage Falloff</div>
          <div className="h-8 bg-slate-900 border border-white/10 relative flex items-end">
            {weapon.damageFalloff.map((pt, idx, arr) => {
              if (idx === 0) return null;
              const prev = arr[idx - 1];
              const maxDist = arr[arr.length - 1].distance;

              const left = (prev.distance / maxDist) * 100;
              const width = ((pt.distance - prev.distance) / maxDist) * 100;

              return (
                <div
                  key={idx}
                  className="absolute bottom-0 border-t-2 border-yellow-500 opacity-80"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    height: `${Math.max(1, pt.multiplier * 100)}%`,
                    borderTopColor: pt.multiplier > 0.8 ? '#eab308' : pt.multiplier > 0.4 ? '#f97316' : '#ef4444',
                    transition: 'all 0.3s',
                  }}
                />
              );
            })}

            {/* Range markers */}
            <div className="absolute -bottom-3 left-0 text-[6px] text-slate-500">0m</div>
            <div className="absolute -bottom-3 right-0 text-[6px] text-slate-500">
              {weapon.damageFalloff[weapon.damageFalloff.length - 1].distance}m
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SquadVoiceWaveform: React.FC<{
  isSpeaking?: boolean;
  intensity?: number;
  isMuted?: boolean;
  color?: string;
}> = ({ isSpeaking, intensity = 0.5, isMuted = false, color = '#22c55e' }) => {
  if (isMuted) {
    return (
      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-red-950/50 border border-red-500/30" title="Muted">
        <MicOff className="w-2.5 h-2.5 text-red-400" />
      </div>
    );
  }

  if (!isSpeaking) {
    return (
      <div className="flex items-center gap-[2px] h-3.5 px-1 rounded bg-black/40 border border-white/5" title="Voice Idle">
        <Mic className="w-2.5 h-2.5 text-slate-500" />
        <div className="flex items-end gap-[1.5px] h-2">
          <span className="w-[2px] h-1 rounded-full bg-slate-600/70" />
          <span className="w-[2px] h-1.5 rounded-full bg-slate-600/70" />
          <span className="w-[2px] h-1 rounded-full bg-slate-600/70" />
        </div>
      </div>
    );
  }

  // Active speaking waveform with dynamic animated visualizer bars
  const bar1Height = Math.max(3, Math.min(10, Math.round(4 + intensity * 6)));
  const bar2Height = Math.max(5, Math.min(14, Math.round(6 + intensity * 8)));
  const bar3Height = Math.max(7, Math.min(15, Math.round(8 + intensity * 7)));
  const bar4Height = Math.max(4, Math.min(11, Math.round(5 + intensity * 6)));

  return (
    <div
      className="flex items-center gap-1 h-3.5 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"
      title="Speaking in Voice Chat"
    >
      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-bounce" />
      <div className="flex items-end gap-[1.5px] h-3">
        <span
          className="w-[2px] bg-emerald-400 rounded-full transition-all duration-75 animate-[pulse_0.35s_ease-in-out_infinite]"
          style={{ height: `${bar1Height}px` }}
        />
        <span
          className="w-[2px] bg-emerald-300 rounded-full transition-all duration-75 animate-[pulse_0.25s_ease-in-out_infinite]"
          style={{ height: `${bar2Height}px`, animationDelay: '0.08s' }}
        />
        <span
          className="w-[2px] bg-emerald-200 rounded-full transition-all duration-75 animate-[pulse_0.4s_ease-in-out_infinite]"
          style={{ height: `${bar3Height}px`, animationDelay: '0.16s' }}
        />
        <span
          className="w-[2px] bg-emerald-400 rounded-full transition-all duration-75 animate-[pulse_0.3s_ease-in-out_infinite]"
          style={{ height: `${bar4Height}px`, animationDelay: '0.12s' }}
        />
      </div>
    </div>
  );
};

export interface HUDStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ep: number;
  activeSlotIndex: number;
  slots: WeaponInventorySlot[];
  glooWalls: number;
  medkits: number;
  aliveCount: number;
  kills: number;
  headshots: number;
  isAiming: boolean;
  isReloading: boolean;
  reloadProgress: number;
  skillCooldownRemaining: number;
  isSkillActive: boolean;
  safeZoneRadius: number;
  safeZoneTimer: number;
  // Squad & 100-Player Battle Royale Matchmaking
  squadMembers?: SquadMember[];
  totalCombatants?: number;
  matchmakingPing?: number;
  // Super Shield Barrier
  superShieldHp?: number;
  maxSuperShieldHp?: number;
  isSuperShieldActive?: boolean;
  superShieldCooldownRemaining?: number;
  // Bleed
  pendingDamageBleed?: number;
  // Downed & Reviving
  isPlayerDowned?: boolean;
  downedBleedTimer?: number;
  canReviveNear?: boolean;
  isReviving?: boolean;
  reviveProgress?: number;
  // Tactical Pings
  tacticalPingWaypoints?: TacticalPingWaypoint[];
}

interface HUDProps {
  stats: HUDStats;
  hero: HeroCharacter;
  levelConfig: LevelConfig;
  damageNumbers: DamageNumber[];
  killFeed: KillFeedItem[];
  crosshairHit: { active: boolean; isHeadshot: boolean };
  onSwitchWeapon: (index: number) => void;
  onReload: () => void;
  onDeployGlooWall: () => void;
  onUseMedkit: () => void;
  onActivateSkill: () => void;
  onAimToggle: (aiming: boolean) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onJump: () => void;
  onCrouchToggle: () => void;
  onProneToggle?: () => void;
  onSlide?: () => void;
  onTouchLook?: (deltaX: number, deltaY: number) => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenLevelSelect: () => void;
  onOpenEmoteWheel?: () => void;
  onOpenGunsmith?: () => void;
  onActivateSuperShield?: () => void;
  onTriggerPing?: () => void;
  onReviveTeammate?: () => void;
  onJoystickMove?: (dx: number, dy: number, isSprinting: boolean) => void;
  activeEmoteBanner?: ActiveEmoteEvent | null;
  leftFireButtonEnabled?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  hero,
  levelConfig,
  damageNumbers,
  killFeed,
  crosshairHit,
  onSwitchWeapon,
  onReload,
  onDeployGlooWall,
  onUseMedkit,
  onActivateSkill,
  onAimToggle,
  onFireStart,
  onFireEnd,
  onJump,
  onCrouchToggle,
  onProneToggle,
  onSlide,
  onTouchLook,
  onOpenSettings,
  onOpenGuide,
  onOpenLevelSelect,
  onOpenEmoteWheel,
  onOpenGunsmith,
  onActivateSuperShield,
  onTriggerPing,
  onReviveTeammate,
  onJoystickMove,
  activeEmoteBanner,
  leftFireButtonEnabled = true,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const activeSlot = stats.slots[stats.activeSlotIndex];
  const hpPercent = (stats.health / stats.maxHealth) * 100;
  const armorPercent = (stats.armor / stats.maxArmor) * 100;

  // Super Shield Calculation
  const superShieldHp = stats.superShieldHp ?? 1200;
  const maxSuperShieldHp = stats.maxSuperShieldHp ?? 1200;
  const superShieldPercent = (superShieldHp / maxSuperShieldHp) * 100;
  const isSuperShieldActive = stats.isSuperShieldActive ?? false;
  const superShieldCooldown = stats.superShieldCooldownRemaining ?? 0;

  // Bleed & Downed states
  const pendingBleed = stats.pendingDamageBleed ?? 0;
  const isPlayerDowned = stats.isPlayerDowned ?? false;
  const downedBleedTimer = stats.downedBleedTimer ?? 30;
  const canReviveNear = stats.canReviveNear ?? false;
  const isReviving = stats.isReviving ?? false;
  const reviveProgress = stats.reviveProgress ?? 0;

  // Matchmaking Telemetry
  const totalCombatants = stats.totalCombatants ?? 100;
  const ping = stats.matchmakingPing ?? 28;
  const squadsAlive = Math.ceil(totalCombatants / 4);

  // Squad Voice Chat State
  const [mutedTeammates, setMutedTeammates] = useState<Record<string, boolean>>({});
  const [isSquadVoiceEnabled, setIsSquadVoiceEnabled] = useState(true);

  const toggleTeammateMute = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedTeammates(prev => {
      const next = { ...prev, [memberId]: !prev[memberId] };
      soundEngine.playClickSound();
      return next;
    });
  };

  const toggleSquadVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSquadVoiceEnabled(prev => !prev);
    soundEngine.playClickSound();
  };

  // Virtual Joystick State
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);
  const [joystickTouchId, setJoystickTouchId] = useState<number | null>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSprintLocked, setIsSprintLocked] = useState(false);

  // Right-screen Touch Look Dragging
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleLookTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX > window.innerWidth * 0.35 && lookTouchIdRef.current === null) {
        lookTouchIdRef.current = touch.identifier;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookTouchMove = (e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        onTouchLook?.(dx, dy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  useEffect(() => {
    const onMove = (e: TouchEvent) => handleLookTouchMove(e);
    const onEnd = (e: TouchEvent) => handleLookTouchEnd(e);

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onTouchLook]);

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      setJoystickTouchId(touch.identifier);
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      setJoystickTouchId(-1);
    }
    updateJoystickPosition(clientX, clientY);
  };

  const handleJoystickMove = (e: TouchEvent | MouseEvent) => {
    if (joystickTouchId === null) return;
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      const touch = Array.from(e.touches).find(t => t.identifier === joystickTouchId);
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    updateJoystickPosition(clientX, clientY);
  };

  const handleJoystickEnd = () => {
    setJoystickTouchId(null);
    setJoystickPos({ x: 0, y: 0 });
    setIsSprintLocked(false);
    onJoystickMove?.(0, 0, false);
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    const normX = dx / maxRadius;
    const normY = dy / maxRadius;
    const isSprinting = normY < -0.65;
    setIsSprintLocked(isSprinting);

    setJoystickPos({ x: dx, y: dy });
    onJoystickMove?.(normX, -normY, isSprinting);
  };

  useEffect(() => {
    const onMove = (e: TouchEvent | MouseEvent) => handleJoystickMove(e);
    const onEnd = () => handleJoystickEnd();

    if (joystickTouchId !== null) {
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
    }
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [joystickTouchId]);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      onTouchStart={handleLookTouchStart}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans"
    >
      {/* 1. TEMPORAL DAMAGE BLEED VIGNETTE PULSE */}
      {pendingBleed > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10 border-[10px] sm:border-[16px] border-red-600/60 shadow-[inset_0_0_80px_rgba(220,38,38,0.7)] animate-pulse flex items-start justify-center pt-20">
          <div className="bg-red-950/90 border border-red-500/80 px-4 py-1 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce">
            <HeartPulse className="w-4 h-4 text-red-400 animate-spin" />
            <span className="text-[10px] sm:text-xs font-black text-red-200 tracking-wider uppercase">
              BLEEDING DAMAGE: -{Math.round(pendingBleed)} HP (MEDKIT CLEARS)
            </span>
          </div>
        </div>
      )}

      {/* 2. DOWNED STATE OVERLAY */}
      {isPlayerDowned && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-[2px]">
          <div className="p-6 rounded-2xl bg-black/90 border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)] flex flex-col items-center gap-3 text-center max-w-sm pointer-events-auto animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
            <h2 className="text-xl font-black text-red-400 tracking-wider uppercase">YOU ARE DOWNED!</h2>
            <p className="text-xs text-slate-300">
              Bleeding out in <span className="font-mono font-black text-red-400 text-base">{downedBleedTimer}s</span>. Your AI Squad
              Teammates are rushing to revive you!
            </p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-red-500/40">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(downedBleedTimer / 30) * 100}%` }}
              />
            </div>
            <button
              onClick={onTriggerPing}
              className="mt-2 px-5 py-2 rounded-xl bg-yellow-500 text-black font-black uppercase text-xs hover:bg-yellow-400 flex items-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <Radio className="w-4 h-4" /> CALL SQUAD HELP [P]
            </button>
          </div>
        </div>
      )}

      {/* 3. REVIVE TEAMMATE CHANNEL OVERLAY */}
      {canReviveNear && !isPlayerDowned && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2">
          <button
            onClick={onReviveTeammate}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.7)] flex items-center gap-3 active:scale-95 transition"
          >
            <HeartPulse className="w-6 h-6 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black uppercase tracking-wider">REVIVE TEAMMATE</span>
              <span className="text-[10px] text-emerald-100">Tap / Press [F] to Revive</span>
            </div>
          </button>
          {isReviving && (
            <div className="w-48 bg-black/80 p-1.5 rounded-xl border border-emerald-400/50 backdrop-blur-md">
              <div className="flex justify-between text-[9px] text-emerald-300 font-bold mb-1">
                <span>REVIVING...</span>
                <span>{Math.round(reviveProgress * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${reviveProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SQUAD ALPHA CARDS (Top-Left under Minimap) with Real-Time Voice Waveform */}
      <div className="absolute top-28 left-4 md:left-6 z-20 pointer-events-auto flex flex-col gap-1.5 w-48 sm:w-56">
        <div className="flex items-center justify-between px-2.5 py-1 rounded-t-lg bg-black/85 border-t border-x border-white/10 backdrop-blur-md text-[9px] font-black text-yellow-400 uppercase">
          <span className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-yellow-400" /> SQUAD ALPHA [4/4]
          </span>
          <button
            onClick={toggleSquadVoice}
            className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Squad Voice Comms"
          >
            {isSquadVoiceEnabled ? (
              <>
                <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">VOICE ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-2.5 h-2.5 text-red-400" />
                <span className="text-red-400">VOICE OFF</span>
              </>
            )}
          </button>
        </div>

        {stats.squadMembers?.map((member, idx) => {
          const isUser = member.isUser;
          const isDown = member.status === 'downed';
          const isDead = member.status === 'eliminated';
          const memberHp = member.hp ?? (member as any).health ?? 200;
          const memberMaxHp = member.maxHp ?? 200;
          const memberShield = member.shieldHp ?? (member as any).armor ?? 100;
          const memberMaxShield = member.maxShieldHp ?? 100;
          const memberHpPct = Math.min(100, Math.max(0, (memberHp / memberMaxHp) * 100));
          const memberArmorPct = Math.min(100, Math.max(0, (memberShield / memberMaxShield) * 100));

          const isMuted = !isSquadVoiceEnabled || !!mutedTeammates[member.id];
          const isSpeaking = !isDead && !isMuted && !!member.isSpeaking;
          const voiceIntensity = member.voiceIntensity ?? (isSpeaking ? 0.6 : 0);

          return (
            <div
              key={member.id}
              className={`p-1.5 rounded-lg border backdrop-blur-md flex flex-col gap-1 transition-all relative ${
                isUser
                  ? 'bg-yellow-950/40 border-yellow-500/50 shadow-sm'
                  : isDown
                  ? 'bg-red-950/60 border-red-500 animate-pulse'
                  : isDead
                  ? 'bg-black/60 border-white/5 opacity-40'
                  : isSpeaking
                  ? 'bg-black/80 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-black/70 border-white/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  {/* Squad ID badge with voice animation aura */}
                  <div className="relative flex items-center justify-center">
                    {isSpeaking && (
                      <span className="absolute -inset-0.5 rounded-full bg-emerald-400/50 animate-ping" />
                    )}
                    <span
                      className={`relative w-4 h-4 rounded text-[8px] font-black flex items-center justify-center transition-all ${
                        idx === 0
                          ? 'bg-yellow-500 text-black'
                          : idx === 1
                          ? 'bg-cyan-500 text-black'
                          : idx === 2
                          ? 'bg-purple-500 text-white'
                          : 'bg-emerald-500 text-black'
                      } ${isSpeaking ? 'ring-2 ring-emerald-400 scale-105' : ''}`}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  <span className="text-[10px] font-black text-white truncate max-w-[80px] sm:max-w-[95px]">
                    {member.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[8px] font-mono shrink-0">
                  {/* Real-Time Dynamic Voice Waveform Indicator */}
                  <button
                    onClick={(e) => toggleTeammateMute(member.id, e)}
                    className="focus:outline-none transition active:scale-90"
                    title={
                      isMuted
                        ? 'Unmute Voice Comms'
                        : isSpeaking
                        ? 'Speaking in Comms (Click to Mute)'
                        : 'Voice Ready (Click to Mute)'
                    }
                  >
                    <SquadVoiceWaveform
                      isSpeaking={isSpeaking}
                      intensity={voiceIntensity}
                      isMuted={isMuted}
                      color={member.color}
                    />
                  </button>

                  {member.isSuperShieldActive && (
                    <ShieldCheck className="w-3 h-3 text-cyan-400 animate-pulse" title="Super Shield Active" />
                  )}
                  <span
                    className={
                      isDown
                        ? 'text-red-400 font-black'
                        : isDead
                        ? 'text-slate-500'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {isDown ? 'DOWN' : isDead ? 'DEAD' : `${member.kills}K`}
                  </span>
                </div>
              </div>

              {/* Active Tactical Voice Comms Callout Bubble */}
              {isSpeaking && member.activeVoiceLine && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-[8px] text-emerald-200 font-mono italic animate-in fade-in slide-in-from-left-2 duration-150 truncate">
                  <span className="text-[9px]">💬</span>
                  <span className="truncate">{member.activeVoiceLine}</span>
                </div>
              )}

              {/* Mini HP & Armor Bars */}
              {!isDead && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-emerald-950">
                    <div
                      className={`h-full transition-all duration-200 ${
                        isDown ? 'bg-red-500' : memberHpPct > 35 ? 'bg-emerald-400' : 'bg-orange-500'
                      }`}
                      style={{ width: `${memberHpPct}%` }}
                    />
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-yellow-950">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-200"
                      style={{ width: `${memberArmorPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. TOP TELEMETRY BAR & 100-PLAYER MATCHMAKING HEADER */}
      <nav className="absolute top-0 inset-x-0 z-20 flex justify-between items-start p-3 sm:p-5 w-full pointer-events-none">
        {/* Top-Left: Space reserved for Minimap */}
        <div className="w-36 sm:w-48"></div>

        {/* Top-Center: 100-Player Battle Royale Match Status & Zone Alert */}
        <div className="flex flex-col items-center gap-1.5">
          {/* Matchmaking Lobby Telemetry */}
          <div className="flex items-center gap-2 bg-black/80 px-3.5 py-1 border border-white/20 rounded-full shadow-lg backdrop-blur-md pointer-events-auto">
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
              <Users className="w-3 h-3 text-yellow-400" />
              <span>
                COMBATANTS: <strong className="text-yellow-400 font-bold">{totalCombatants}</strong> / 100
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
              <span>
                SQUADS: <strong className="text-white font-bold">{squadsAlive}</strong> / 25
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <Wifi className="w-3 h-3" />
              <span>{ping}ms</span>
            </div>
          </div>

          {/* Safe Zone Alert */}
          <div className="bg-black/60 px-4 py-1.5 border border-yellow-500/30 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
            <span className="text-[11px] sm:text-xs font-black text-white tracking-wider uppercase">
              {stats.safeZoneTimer > 0
                ? `Safe Zone Shrinking in ${Math.floor(stats.safeZoneTimer / 60)
                    .toString()
                    .padStart(2, '0')}:${(stats.safeZoneTimer % 60).toString().padStart(2, '0')}`
                : 'Danger Zone Collapsing!'}
            </span>
          </div>

          {activeEmoteBanner && (
            <div
              className="mt-1 flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/90 border-2 shadow-2xl backdrop-blur-md animate-in zoom-in-95 slide-in-from-top-3 duration-200 pointer-events-auto"
              style={{ borderColor: activeEmoteBanner.emote.particleColor || '#fbbf24' }}
            >
              <span className="text-2xl animate-bounce drop-shadow">{activeEmoteBanner.emote.icon}</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white">{activeEmoteBanner.sender}</span>
                <span
                  className="text-xs font-black uppercase"
                  style={{ color: activeEmoteBanner.emote.particleColor || '#fbbf24' }}
                >
                  {activeEmoteBanner.emote.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Alive / Kills + Weapons Strip + Gunsmith Quick Button */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="flex bg-black/80 border border-white/20 rounded-lg overflow-hidden shadow-lg backdrop-blur-md">
              <div className="px-2.5 py-1 flex items-center gap-1.5 bg-black/50 border-r border-white/10">
                <span className="text-[9px] text-slate-400 uppercase font-black">Alive</span>
                <span className="text-xs sm:text-sm font-black text-yellow-400">{stats.aliveCount}</span>
              </div>
              <div className="px-2.5 py-1 flex items-center gap-1.5 bg-red-950/60">
                <span className="text-[9px] text-slate-400 uppercase font-black">Kill</span>
                <span className="text-xs sm:text-sm font-black text-red-400">{stats.kills}</span>
              </div>
            </div>

            {/* Gunsmith Button */}
            <button
              onClick={onOpenGunsmith}
              className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 flex items-center gap-1 shadow-md transition"
              title="Gunsmith Customization"
            >
              <Wrench className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase hidden sm:inline">GUNSMITH</span>
            </button>

            {/* Tactical Ping Button */}
            <button
              onClick={onTriggerPing}
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 shadow-md transition"
              title="Tactical Ping [P]"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase hidden sm:inline">PING [P]</span>
            </button>

            <button
              onClick={handleMuteToggle}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-slate-800 border border-white/15 text-slate-300 transition"
              title="Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-slate-800 border border-white/15 text-slate-300 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Primary & Secondary Weapon Bar */}
          <div className="bg-black/70 border border-white/15 p-2 rounded-xl backdrop-blur-md flex flex-col gap-1.5 w-56 sm:w-64 shadow-2xl">
            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10 group cursor-pointer hover:bg-white/10 transition relative">
              {activeSlot && <WeaponTooltip slot={activeSlot} isPrimary={true} />}
              <div>
                <div className="text-[9px] font-black text-yellow-400 uppercase">{activeSlot?.weapon.displayName}</div>
                <div className="text-xl sm:text-2xl font-black text-white leading-none mt-0.5">
                  {activeSlot?.weapon.type === 'katana' ? '∞' : activeSlot?.currentAmmo}
                  <span className="text-xs text-slate-400 font-bold ml-1">
                    {activeSlot?.weapon.type !== 'katana' && `/ ${activeSlot?.reserveAmmo}`}
                  </span>
                </div>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onReload();
                }}
                className={`p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 active:scale-95 transition ${
                  stats.isReloading ? 'animate-spin' : ''
                }`}
                title="Reload [R]"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Weapon Slots Selector */}
            <div className="grid grid-cols-4 gap-1">
              {stats.slots.map((slot, index) => {
                const isSelected = index === stats.activeSlotIndex;
                return (
                  <button
                    key={index}
                    onClick={() => onSwitchWeapon(index)}
                    className={`py-1 px-1 rounded flex flex-col items-center justify-center border transition ${
                      isSelected
                        ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300 font-black'
                        : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-[8px] font-mono font-bold leading-none">[{index + 1}]</span>
                    <span className="text-[9px] font-black uppercase truncate w-full text-center">
                      {slot.weapon.displayName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* 6. FLOATING CENTER HIT REACTIONS & ADS RETICLE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {stats.isAiming ? (
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-red-500/80 flex items-center justify-center backdrop-blur-[1px] shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <div className="absolute inset-x-0 h-[1px] bg-red-400/90"></div>
              <div className="absolute inset-y-0 w-[1px] bg-red-400/90"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
              <div className="absolute top-3 text-[9px] font-mono tracking-widest text-red-400 uppercase font-bold">
                ADS OPTICAL 4X
              </div>
            </div>
          ) : (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
              <div className="absolute -top-3 w-[2px] h-2 bg-white/80"></div>
              <div className="absolute -bottom-3 w-[2px] h-2 bg-white/80"></div>
              <div className="absolute -left-3 h-[2px] w-2 bg-white/80"></div>
              <div className="absolute -right-3 h-[2px] w-2 bg-white/80"></div>
            </div>
          )}

          {crosshairHit.active && (
            <div
              className={`absolute inset-0 flex items-center justify-center scale-150 animate-out fade-out duration-200 ${
                crosshairHit.isHeadshot ? 'text-yellow-400 font-extrabold' : 'text-red-500'
              }`}
            >
              <div className="text-3xl font-black font-mono">✕</div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Damage Numbers */}
      {damageNumbers.map(d => (
        <div
          key={d.id}
          style={{ left: `${d.x}px`, top: `${d.y}px` }}
          className={`absolute pointer-events-none font-mono font-black text-xl md:text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] animate-bounce ${
            d.isHeadshot ? 'text-yellow-400 scale-125' : d.isShieldHit ? 'text-cyan-400' : 'text-orange-400'
          }`}
        >
          {d.isHeadshot ? `💥 ${d.damage}` : d.isShieldHit ? `🛡️ ${d.damage}` : d.damage}
        </div>
      ))}

      {/* 7. LEFT MOBILE TOUCH JOYSTICK & LEFT FIRE TRIGGER */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col items-start gap-4">
        {/* Left Fire Trigger Button (for ADS Scope-Firing) */}
        {leftFireButtonEnabled && (
          <button
            onTouchStart={onFireStart}
            onTouchEnd={onFireEnd}
            onMouseDown={onFireStart}
            onMouseUp={onFireEnd}
            className="w-14 h-14 rounded-full bg-red-600/80 border-2 border-yellow-400 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 active:brightness-125 transition backdrop-blur-md cursor-pointer ml-4"
            title="Left Scope Fire Trigger"
          >
            <Flame className="w-6 h-6 fill-white" />
            <span className="text-[7px] font-black uppercase">FIRE</span>
          </button>
        )}

        <div className="flex flex-col items-center">
          {/* Sprint Lock Indicator */}
          <div
            className={`mb-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border transition-all ${
              isSprintLocked
                ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.5)] scale-105'
                : 'bg-black/60 text-slate-400 border-white/10'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>SPRINT LOCK</span>
          </div>

          <div
            ref={joystickContainerRef}
            onTouchStart={handleJoystickStart}
            onMouseDown={handleJoystickStart}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-md relative flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer active:border-yellow-500/50"
          >
            {/* Guide cross */}
            <div className="absolute inset-x-0 h-[1px] bg-white/10"></div>
            <div className="absolute inset-y-0 w-[1px] bg-white/10"></div>

            {/* Floating Joystick Thumb Knob */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-200 shadow-xl flex items-center justify-center absolute transition-transform"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-black/30 border border-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. CENTER-BOTTOM HEALTH, SUPER SHIELD & UTILITIES */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-2">
        {/* Quick Utility Slots (Medkit, Gloo Wall, Super Shield, Hero Skill, Emotes) */}
        <div className="flex items-center gap-2">
          {/* Super Shield 1,200 HP Barrier Button */}
          <button
            onClick={onActivateSuperShield}
            disabled={superShieldCooldown > 0 || isSuperShieldActive}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 shadow-lg backdrop-blur-md active:scale-95 transition ${
              isSuperShieldActive
                ? 'bg-cyan-500 border-cyan-300 text-black font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse'
                : superShieldCooldown <= 0
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 hover:bg-cyan-900/90 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-black/70 border-white/10 text-slate-500 opacity-60'
            }`}
            title="Super Shield Barrier [E] (1,200 HP / 85% Absorb)"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold">SUPER SHIELD [E]</span>
            <span className="text-xs font-mono font-black text-white">
              {isSuperShieldActive ? `${Math.round(superShieldHp)}` : superShieldCooldown > 0 ? `${Math.ceil(superShieldCooldown)}s` : '1.2k'}
            </span>
          </button>

          {/* Medkit Quick Heal */}
          <button
            onClick={onUseMedkit}
            disabled={stats.medkits <= 0 || stats.health >= stats.maxHealth}
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 shadow-lg backdrop-blur-md active:scale-95 transition ${
              stats.medkits > 0 && stats.health < stats.maxHealth
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-black/70 border-white/10 text-slate-500 opacity-60'
            }`}
            title="Medkit [H]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold">MED [H]</span>
            <span className="text-xs font-mono font-black text-white bg-black/60 px-1.5 py-0.5 rounded">
              {stats.medkits}
            </span>
          </button>

          {/* Gloo Wall Fast Deploy */}
          <button
            onClick={onDeployGlooWall}
            disabled={stats.glooWalls <= 0}
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 shadow-lg backdrop-blur-md active:scale-95 transition ${
              stats.glooWalls > 0
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 hover:bg-cyan-900/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-black/70 border-white/10 text-slate-500 opacity-60'
            }`}
            title="Gloo Wall [G]"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold">GLOO [G]</span>
            <span className="text-xs font-mono font-black text-white bg-black/60 px-1.5 py-0.5 rounded">
              {stats.glooWalls}
            </span>
          </button>

          {/* Active Hero Skill */}
          <button
            onClick={onActivateSkill}
            disabled={stats.skillCooldownRemaining > 0 || stats.isSkillActive}
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 shadow-lg backdrop-blur-md active:scale-95 transition ${
              stats.isSkillActive
                ? 'bg-yellow-500 border-yellow-300 text-black font-extrabold animate-pulse'
                : stats.skillCooldownRemaining <= 0
                ? 'bg-yellow-950/80 border-yellow-500 text-yellow-300 hover:bg-yellow-900/80'
                : 'bg-black/70 border-white/10 text-slate-500'
            }`}
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] font-mono font-bold">SKILL [Q]</span>
            <span className="text-xs font-mono font-black text-white">
              {stats.skillCooldownRemaining > 0 ? `${Math.ceil(stats.skillCooldownRemaining)}s` : 'READY'}
            </span>
          </button>

          {/* Social Emote Button */}
          <button
            onClick={onOpenEmoteWheel}
            className="p-2 rounded-xl border border-yellow-500/40 bg-black/80 hover:bg-yellow-950/40 text-yellow-400 flex items-center justify-center shadow-lg active:scale-95 transition"
            title="Emotes [T]"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* High Density HP, Armor & Super Shield Status Gauge */}
        <div className="w-80 sm:w-96 bg-black/85 border border-white/15 p-2.5 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-1.5">
          {/* Super Shield Bar (if active) */}
          {isSuperShieldActive && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1 w-14 shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-cyan-300">BARRIER</span>
              </div>
              <div className="flex-1 h-2 bg-slate-900 border border-cyan-500/60 overflow-hidden rounded">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100 shadow-[0_0_8px_#06b6d4]"
                  style={{ width: `${Math.max(0, Math.min(100, superShieldPercent))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300 w-20 text-right">
                {Math.round(superShieldHp)} / {maxSuperShieldHp}
              </span>
            </div>
          )}

          {/* Armor Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-14 shrink-0">
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[9px] font-mono font-bold text-yellow-400">ARMOR</span>
            </div>
            <div className="flex-1 h-2.5 bg-slate-900 border border-yellow-900/60 overflow-hidden rounded">
              <div
                className="h-full bg-yellow-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, armorPercent))}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono font-bold text-yellow-300 w-20 text-right">
              {Math.round(stats.armor)} / {stats.maxArmor}
            </span>
          </div>

          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-emerald-400 w-14">HEALTH</span>
            <div className="flex-1 h-4 bg-slate-900 border border-emerald-900 overflow-hidden rounded relative">
              <div
                className={`h-full transition-all duration-150 ${
                  hpPercent > 35 ? 'bg-emerald-500' : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
              ></div>
            </div>
            <span className="text-sm font-mono font-black text-white w-20 text-right">
              {stats.health} / {stats.maxHealth}
            </span>
          </div>

          {/* EP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono font-bold text-amber-400 w-14">EP BUFFER</span>
            <div className="flex-1 h-1.5 bg-slate-900 border border-amber-900/60 overflow-hidden rounded">
              <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${stats.ep}%` }}></div>
            </div>
            <span className="text-[9px] font-mono text-amber-300 w-20 text-right">{stats.ep} / 100</span>
          </div>
        </div>
      </div>

      {/* 9. RIGHT MOBILE ACTION CLUSTER */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col items-end gap-3">
        {/* Top auxiliary cluster: ADS Scope + Jump */}
        <div className="flex items-center gap-3">
          {/* Aim / Scope Button */}
          <button
            onTouchStart={() => onAimToggle(true)}
            onTouchEnd={() => onAimToggle(false)}
            onMouseDown={() => onAimToggle(!stats.isAiming)}
            className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition ${
              stats.isAiming
                ? 'bg-red-600 border-red-300 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                : 'bg-black/80 border-white/20 text-slate-300 hover:border-yellow-400'
            }`}
          >
            <Crosshair className="w-6 h-6" />
            <span className="text-[7px] font-black uppercase mt-0.5">SCOPE</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={onJump}
            className="w-14 h-14 rounded-full bg-black/80 border-2 border-white/20 hover:border-yellow-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
          >
            <ChevronUp className="w-6 h-6" />
            <span className="text-[7px] font-black uppercase mt-0.5">JUMP</span>
          </button>
        </div>

        {/* Bottom primary cluster: Slide + Crouch + Prone + Giant Shoot Button */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            {/* Slide Action Button */}
            <button
              onClick={onSlide || onCrouchToggle}
              className="w-12 h-12 rounded-full bg-blue-950/80 border border-blue-400/60 hover:border-blue-300 text-blue-200 flex items-center justify-center shadow-lg active:scale-95 font-mono text-[9px] font-black uppercase transition"
              title="Slide [C while sprinting]"
            >
              SLIDE
            </button>

            {/* Crouch Button */}
            <button
              onClick={onCrouchToggle}
              className="w-12 h-12 rounded-full bg-black/80 border border-white/20 hover:border-yellow-400 text-white flex items-center justify-center shadow-lg active:scale-95 font-mono text-[10px] font-black uppercase transition"
            >
              CRCH
            </button>

            {/* Prone Button */}
            <button
              onClick={onProneToggle || onCrouchToggle}
              className="w-12 h-12 rounded-full bg-black/80 border border-white/20 hover:border-yellow-400 text-white flex items-center justify-center shadow-lg active:scale-95 font-mono text-[10px] font-black uppercase transition"
            >
              PRNE
            </button>
          </div>

          {/* Giant Primary Fire / Shoot Button */}
          <button
            onTouchStart={onFireStart}
            onTouchEnd={onFireEnd}
            onMouseDown={onFireStart}
            onMouseUp={onFireEnd}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 border-4 border-yellow-300 text-white flex flex-col items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.7)] active:scale-90 active:brightness-125 transition-transform cursor-pointer"
          >
            <Flame className="w-9 h-9 sm:w-10 sm:h-10 fill-white drop-shadow-md animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
