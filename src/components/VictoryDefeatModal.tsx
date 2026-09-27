import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Share2,
  ChevronRight,
  UserPlus,
  ShieldAlert,
  Mic,
  Wifi,
  Trophy,
  Award,
  Crosshair,
  Flame,
  Heart,
  Sparkles,
  Lock,
  CheckCircle2,
  X,
  Volume2,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelConfig, PlayerStats, UserProfileData, HeroCharacter } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface VictoryDefeatModalProps {
  isVictory: boolean;
  stats: PlayerStats;
  levelConfig: LevelConfig;
  userProfile?: UserProfileData;
  selectedHero?: HeroCharacter;
  onNextLevel: () => void;
  onRestart: () => void;
  onSelectLevel: () => void;
  onOpenLegendPass?: () => void;
  onOpenEvents?: () => void;
}

interface SquadLeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  level: number;
  kills: number;
  assists: number;
  damage: number;
  headshots: number;
  survivalTime: string;
  ping: number;
  isUser: boolean;
  isMvp?: boolean;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  isVictory,
  stats,
  levelConfig,
  userProfile,
  selectedHero,
  onNextLevel,
  onRestart,
  onSelectLevel,
  onOpenLegendPass,
  onOpenEvents,
}) => {
  const [countdown, setCountdown] = useState(30);
  const [isLootChestClaimed, setIsLootChestClaimed] = useState(false);
  const [showChestRewardModal, setShowChestRewardModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState('Enemy Squad');
  const [reportReason, setReportReason] = useState('Aim Assist / Wallhack');
  const [reportedSuccess, setReportedSuccess] = useState(false);
  const [addedFriends, setAddedFriends] = useState<Record<string, boolean>>({});
  const [shareToast, setShareToast] = useState(false);

  // Auto-countdown for NEXT MATCH
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          isVictory ? onNextLevel() : onRestart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVictory, onNextLevel, onRestart]);

  // Victory Confetti
  useEffect(() => {
    if (isVictory) {
      soundEngine.playBooyah();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#eab308', '#06b6d4', '#ffffff', '#f97316'],
      });
      const timeout = setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.6 },
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.6 },
        });
      }, 450);
      return () => clearTimeout(timeout);
    } else {
      soundEngine.playDefeat();
    }
  }, [isVictory]);

  // Calculate formatted survival time
  const playerSurvivalFormatted = useMemo(() => {
    const mins = Math.floor(stats.survivalTimeSeconds / 60);
    const secs = stats.survivalTimeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [stats.survivalTimeSeconds]);

  // Dynamic Squad Data (matching image structure)
  const squadEntries: SquadLeaderboardEntry[] = useMemo(() => {
    const userKills = stats.kills;
    const userDmg = stats.damageDealt || 1900;
    const userHs = stats.headshots;

    const teammates: SquadLeaderboardEntry[] = [
      {
        id: 'tm_1',
        name: 'GHOST_01',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
        level: 24,
        kills: 0,
        assists: 0,
        damage: 1230,
        headshots: 0,
        survivalTime: '08:18',
        ping: 24,
        isUser: false,
      },
      {
        id: 'tm_2',
        name: 'CYBER_VIPER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        level: 31,
        kills: 4,
        assists: 0,
        damage: 1980,
        headshots: 1,
        survivalTime: '02:37',
        ping: 28,
        isUser: false,
      },
      {
        id: 'tm_user',
        name: userProfile?.playerName || 'PLAYER_NAME',
        avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        level: userProfile?.level || 19,
        kills: userKills,
        assists: 4,
        damage: userDmg,
        headshots: userHs,
        survivalTime: playerSurvivalFormatted,
        ping: 32,
        isUser: true,
      },
      {
        id: 'tm_3',
        name: 'SHADOW_BLADE',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        level: 19,
        kills: 4,
        assists: 0,
        damage: 1800,
        headshots: 0,
        survivalTime: '01:53',
        ping: 36,
        isUser: false,
      },
    ];

    // Find highest damage/kills for MVP
    let topEntry = teammates[0];
    for (const tm of teammates) {
      if (tm.damage + tm.kills * 200 > topEntry.damage + topEntry.kills * 200) {
        topEntry = tm;
      }
    }
    topEntry.isMvp = true;

    return teammates;
  }, [stats, playerSurvivalFormatted, userProfile]);

  const mvpMember = squadEntries.find(s => s.isMvp) || squadEntries[1];

  // Handle Share
  const handleShare = () => {
    soundEngine.playUiClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `🎮 LEGENDARY WARRIORS Match Results:\nOutcome: ${isVictory ? 'VICTORY' : 'DEFEAT'}\nKills: ${stats.kills}\nDamage: ${stats.damageDealt}\nSurvival: ${playerSurvivalFormatted}`
      );
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  // Handle Add Friend
  const handleAddFriend = (id: string, name: string) => {
    soundEngine.playUiClick();
    setAddedFriends(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md pointer-events-auto font-sans select-none overflow-y-auto">
      {/* Background Cyberpunk City Skyline & Holographic Neon Billboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {/* City Rooftop Silhouette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0b0e14]/80 to-transparent z-10" />
        
        {/* Skyscraper Windows & Neon Lights */}
        <div className="absolute -bottom-10 left-0 right-0 h-96 flex items-end justify-between px-8 gap-4 opacity-50">
          <div className="w-24 h-80 bg-slate-900 border-t-2 border-slate-700 relative">
            <div className="absolute inset-2 grid grid-cols-3 gap-1.5 opacity-30">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`h-2 ${i % 3 === 0 ? 'bg-yellow-400' : 'bg-cyan-400'}`} />
              ))}
            </div>
          </div>
          <div className="w-32 h-96 bg-slate-900 border-t-2 border-cyan-500/40 relative">
            <div className="absolute inset-2 grid grid-cols-4 gap-1.5 opacity-40">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className={`h-2 ${i % 4 === 0 ? 'bg-cyan-300' : 'bg-slate-700'}`} />
              ))}
            </div>
          </div>
          <div className="w-28 h-72 bg-slate-900 border-t-2 border-slate-700 relative">
            <div className="absolute inset-2 grid grid-cols-3 gap-1.5 opacity-30">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className={`h-2 ${i % 2 === 0 ? 'bg-amber-400' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Glowing Holographic Billboard on Right */}
        <div className="absolute right-12 top-24 w-80 h-44 rounded-lg border-2 border-cyan-500/60 bg-cyan-950/30 p-4 shadow-[0_0_50px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center transform rotate-2 animate-pulse">
          <div className="text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-1">
            /// BATTLE ROYALE SIMULATION ///
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-cyan-300 to-white drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            LEGENDARY
            <br />
            <span className="text-2xl text-cyan-400 tracking-widest">WARRIORS</span>
          </h2>
          <div className="mt-2 text-[9px] font-bold text-slate-400 tracking-widest uppercase">
            100 WARRIORS • 1 CHAMPION
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl bg-[#0e1117]/95 border border-slate-700/60 rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9)] p-4 sm:p-5 flex flex-col z-20">
        
        {/* Match Header: Status Banner & Verdict */}
        <div className="flex flex-col items-center justify-center mb-4 relative z-10">
          <div className="relative text-center">
            <h1
              className={`text-5xl sm:text-6xl font-black italic tracking-wider uppercase drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] ${
                isVictory
                  ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]'
                  : 'text-red-500'
              }`}
            >
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </h1>
            <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-[0.25em] -mt-1 drop-shadow-md">
              {isVictory ? 'BOOYAH! • SQUAD SURVIVOR' : 'MISSION FAILED'}
            </h2>
          </div>

          {/* Quick Match Sub-Header Telemetry */}
          <div className="flex items-center gap-6 mt-1 text-xs font-bold text-slate-400 tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>{isVictory ? '#1 / 25 Squads' : '#4 / 25 Squads'}</span>
            </span>
            <span>•</span>
            <span>MATCH TIME: {playerSurvivalFormatted}</span>
            <span>•</span>
            <span className={isVictory ? 'text-emerald-400' : 'text-amber-400'}>
              RANK RATING: {isVictory ? '+38 RP' : '-12 RP'}
            </span>
          </div>
        </div>

        {/* 3-Column Grid Layout (Matching Reference Screenshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          
          {/* =========================================================================
              LEFT COLUMN (Rewards, EXP Progress, Mission Quests, Loot Chest, Profile Card)
             ========================================================================= */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            {/* Currency & EXP Container */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black font-black text-xs flex items-center justify-center shadow-md">
                  C
                </div>
                <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                  COINS: <span className="text-white text-sm font-bold">1,200</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                  D
                </div>
                <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                  DIAMONDS: <span className="text-cyan-400 text-sm font-bold">50</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-[10px] font-black text-slate-300 uppercase">
                  EXP
                </div>
                <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                  EXP: <span className="text-white text-sm font-bold">+80</span>
                </span>
                <span className="ml-auto text-[10px] font-mono text-slate-400">20/50</span>
              </div>

              {/* EXP Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full w-[40%] rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
              </div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center">
                NEXT PLAYER LEVEL {(userProfile?.level || 19) + 1}
              </div>
            </div>

            {/* Mission Rewards Quests Container */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-2">
              <div className="text-xs font-black tracking-wider text-slate-300 uppercase flex items-center justify-between">
                <span>MISSION REWARDS</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </div>

              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Play 3 Matches [X]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 text-[8px] text-black font-bold flex items-center justify-center">C</div>
                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-[8px] text-white font-bold flex items-center justify-center">D</div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Eliminate 5 Enemies [X]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 text-[8px] text-black font-bold flex items-center justify-center">C</div>
                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-[8px] text-white font-bold flex items-center justify-center">D</div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Survive 15 Minutes [X]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing 3D Loot Chest Crate */}
            <div
              onClick={() => {
                soundEngine.playUiClick();
                setIsLootChestClaimed(true);
                setShowChestRewardModal(true);
              }}
              className="group relative bg-gradient-to-b from-[#162033] to-[#0c111a] border border-cyan-500/40 hover:border-cyan-400 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              {/* Sci-Fi Energy Crate Graphic */}
              <div className="relative w-20 h-16 my-1 flex items-center justify-center">
                {/* Outer Chest Body */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-cyan-950 rounded-lg border-2 border-cyan-400/80 shadow-inner flex items-center justify-center">
                  <div className="w-12 h-6 bg-cyan-500/30 rounded border border-cyan-300/60 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  </div>
                </div>
                {/* Gold Latch Trim */}
                <div className="absolute -top-1 w-8 h-2 bg-yellow-500 rounded-full shadow" />
                <div className="absolute -bottom-1 w-10 h-2 bg-yellow-600 rounded-full shadow" />
              </div>
              <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider group-hover:text-white transition">
                {isLootChestClaimed ? 'LOOT CRATE OPENED' : 'OPEN BATTLE CRATE'}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">CLICK TO CLAIM REWARDS</span>
            </div>

            {/* Bottom Left Player Profile Card */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-2.5 flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                <img
                  src={userProfile?.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-1 rounded-tl">
                  L2
                </div>
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate">
                    {userProfile?.playerName || 'Kael'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Lvl {userProfile?.level || 19}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-yellow-500 h-full w-[65%]" />
                </div>
                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-400">
                  <Shield className="w-3 h-3" />
                  <span>{userProfile?.tier || 'Bronze III'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              MIDDLE COLUMN (Squad Table, MVP Badge, Combat Analytics, Medal Rack, Graph)
             ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            
            {/* Top Squad Performance Table Container */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-3 flex flex-col">
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-1 pb-2 border-b border-slate-700/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span className="col-span-4">PLAYER_NAME</span>
                <span className="col-span-1 text-center">KILLS</span>
                <span className="col-span-1 text-center">ASSISTS</span>
                <span className="col-span-2 text-center">DAMAGE</span>
                <span className="col-span-1 text-center">HEADSHOTS</span>
                <span className="col-span-2 text-center">SURVIVAL_TIME</span>
                <span className="col-span-1 text-center">SQUAD PING</span>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col divide-y divide-white/5">
                {squadEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-1 items-center py-2 px-1 text-xs transition ${
                      entry.isUser
                        ? 'bg-yellow-500/10 border border-yellow-500/40 rounded my-0.5'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Player Info & Avatar */}
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <img
                        src={entry.avatar}
                        alt=""
                        className="w-6 h-6 rounded object-cover border border-slate-600 flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold truncate text-xs ${
                              entry.isUser ? 'text-yellow-400' : 'text-slate-200'
                            }`}
                          >
                            {entry.name}
                          </span>
                          {entry.isMvp && (
                            <span className="bg-yellow-500 text-black font-black text-[8px] px-1 rounded flex-shrink-0">
                              MVP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <span className="col-span-1 text-center font-mono font-bold text-slate-200">
                      {entry.kills}
                    </span>
                    <span className="col-span-1 text-center font-mono text-slate-400">
                      {entry.assists}
                    </span>
                    <span className="col-span-2 text-center font-mono font-bold text-cyan-400">
                      {entry.damage}
                    </span>
                    <span className="col-span-1 text-center font-mono text-slate-400">
                      {entry.headshots}
                    </span>
                    <span className="col-span-2 text-center font-mono text-slate-300">
                      {entry.survivalTime}
                    </span>

                    {/* Squad Ping / Comms & Add Friend */}
                    <div className="col-span-1 flex items-center justify-center gap-1 text-[10px]">
                      <div className="flex items-center text-emerald-400">
                        <Wifi className="w-3 h-3" />
                      </div>
                      <Mic className={`w-3 h-3 ${entry.isUser ? 'text-yellow-400' : 'text-cyan-400'}`} />
                      {!entry.isUser && (
                        <button
                          onClick={() => handleAddFriend(entry.id, entry.name)}
                          title="Add Teammate"
                          className="text-slate-400 hover:text-white ml-0.5"
                        >
                          <UserPlus
                            className={`w-3 h-3 ${addedFriends[entry.id] ? 'text-emerald-400' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-Table Damage Comparison Bar Chart & MVP Badge */}
              <div className="grid grid-cols-12 gap-3 mt-3 pt-2.5 border-t border-slate-700/50 items-center">
                {/* Mini Bar Chart */}
                <div className="col-span-7 flex flex-col gap-1">
                  <div className="flex items-end justify-between h-14 px-2 pt-2 bg-slate-900/60 rounded border border-slate-800">
                    {squadEntries.map((tm, idx) => {
                      const pct = Math.min(100, Math.max(15, (tm.damage / 2200) * 100));
                      return (
                        <div key={tm.id} className="flex flex-col items-center gap-1 w-6">
                          <div
                            className={`w-4 rounded-t transition-all ${
                              tm.isMvp
                                ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                                : tm.isUser
                                ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                                : 'bg-slate-600'
                            }`}
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-[8px] font-bold text-slate-400 truncate w-full text-center">
                            T{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                    {/* MVP Bar */}
                    <div className="flex flex-col items-center gap-1 w-6">
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-amber-600 to-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                        style={{ height: '90%' }}
                      />
                      <span className="text-[8px] font-black text-yellow-400">MVP</span>
                    </div>
                  </div>
                </div>

                {/* MVP Box */}
                <div className="col-span-5 flex items-center gap-3 bg-gradient-to-r from-amber-950/40 to-slate-900/40 border border-yellow-500/30 rounded p-2">
                  <div className="relative flex items-center justify-center">
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                    <Award className="w-4 h-4 text-black absolute" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
                      MATCH MVP
                    </span>
                    <span className="text-xs font-bold text-white truncate">{mvpMember.name}</span>
                    <span className="text-[10px] font-mono text-slate-300 font-bold">
                      {mvpMember.kills} KILLS | {mvpMember.damage} DMG
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Combat Analytics, Medal Rack & Graph Container */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden">
              
              {/* Star graphic watermark in background */}
              <div className="absolute left-10 top-4 opacity-5 pointer-events-none text-white">
                <Star className="w-36 h-36 fill-current" />
              </div>

              {/* Quick Stats & Medal Rack Row */}
              <div className="grid grid-cols-12 gap-3 relative z-10">
                {/* Left Quick Stats */}
                <div className="col-span-4 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase font-semibold">KILLS</span>
                    <span className="font-mono font-bold text-white text-sm">{stats.kills}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase font-semibold">DAMAGE</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">{stats.damageDealt}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase font-semibold">HEADSHOTS</span>
                    <span className="font-mono font-bold text-white">{stats.headshots}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase font-semibold">SURVIVAL TIME</span>
                    <span className="font-mono text-slate-300">{playerSurvivalFormatted}</span>
                  </div>
                </div>

                {/* Right Medal Rack */}
                <div className="col-span-8 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
                    MEDAL RACK
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    {/* Grenade Kill */}
                    <div className="flex flex-col items-center gap-1 group">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">
                        GRENADE
                      </span>
                    </div>

                    {/* First Blood */}
                    <div className="flex flex-col items-center gap-1 group">
                      <div className="w-8 h-8 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                        <Crosshair className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-[8px] font-bold text-red-400 text-center leading-tight">
                        FIRST BLOOD
                      </span>
                    </div>

                    {/* Survivor */}
                    <div className="flex flex-col items-center gap-1 group">
                      <div className="w-8 h-8 rounded-full bg-yellow-950/80 border border-yellow-500/60 flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-[8px] font-bold text-yellow-400 text-center leading-tight">
                        SURVIVOR
                      </span>
                    </div>

                    {/* Headshot King */}
                    <div className="flex flex-col items-center gap-1 group opacity-60">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 text-center leading-tight">
                        HEADSHOT
                      </span>
                    </div>

                    {/* Medic / Reviver */}
                    <div className="flex flex-col items-center gap-1 group opacity-60">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 text-center leading-tight">
                        MEDIC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat Performance Timeline Dual-Line Graph */}
              <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span className="uppercase tracking-wider">DAMAGE OVER TIME</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                      <span>Engagement Time</span>
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                      <span>DAMAGE</span>
                    </span>
                  </div>
                </div>

                {/* SVG Curve Graph */}
                <div className="relative h-16 w-full bg-slate-900/80 rounded border border-slate-800 overflow-hidden px-2 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cyanDmgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Background Grid Lines */}
                    <line x1="0" y1="15" x2="400" y2="15" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="45" x2="400" y2="45" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Damage Gradient Area */}
                    <path
                      d="M 0 55 Q 50 35, 100 45 T 200 30 T 300 25 T 400 10 L 400 60 L 0 60 Z"
                      fill="url(#cyanDmgGrad)"
                    />

                    {/* Yellow Engagement Curve */}
                    <path
                      d="M 0 50 Q 50 40, 100 42 T 200 35 T 300 28 T 400 15"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                    />

                    {/* Cyan Damage Curve */}
                    <path
                      d="M 0 55 Q 50 35, 100 45 T 200 30 T 300 25 T 400 10"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />

                    {/* Points on curve */}
                    <circle cx="100" cy="45" r="3" fill="#06b6d4" />
                    <circle cx="200" cy="30" r="3" fill="#06b6d4" />
                    <circle cx="300" cy="25" r="3" fill="#06b6d4" />
                    <circle cx="400" cy="10" r="3.5" fill="#38bdf8" />
                  </svg>
                </div>

                {/* Timeline axis marks */}
                <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1">
                  <span>0:00</span>
                  <span>1:00</span>
                  <span>2:00</span>
                  <span>3:00</span>
                  <span>4:00</span>
                  <span>05:00</span>
                  <span>06:00</span>
                  <span>07:00</span>
                  <span>08:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN (Promo Banners, Try Again Countdown, Action Buttons)
             ========================================================================= */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            {/* Promo Banner 1: Battle Pass */}
            <div
              onClick={() => {
                soundEngine.playUiClick();
                onOpenLegendPass?.();
              }}
              className="relative h-20 rounded-lg overflow-hidden border border-yellow-500/40 hover:border-yellow-400 cursor-pointer group shadow-[0_0_15px_rgba(234,179,8,0.2)] transition flex items-end p-2.5 bg-gradient-to-r from-amber-900/60 to-slate-900/80"
            >
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80"
                alt="Battle Pass"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition duration-500"
              />
              <div className="relative z-10 flex flex-col">
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                  LEGENDARY WARRIORS:
                </span>
                <span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-yellow-300">
                  GET THE BATTLE PASS
                </span>
              </div>
            </div>

            {/* Promo Banner 2: Cyber Assault Event */}
            <div
              onClick={() => {
                soundEngine.playUiClick();
                onOpenEvents?.();
              }}
              className="relative h-20 rounded-lg overflow-hidden border border-cyan-500/40 hover:border-cyan-400 cursor-pointer group shadow-[0_0_15px_rgba(6,182,212,0.2)] transition flex items-end p-2.5 bg-gradient-to-r from-cyan-950/60 to-slate-900/80"
            >
              <img
                src="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&auto=format&fit=crop&q=80"
                alt="Cyber Assault"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition duration-500"
              />
              <div className="relative z-10 flex flex-col">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  NEW EVENT:
                </span>
                <span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-cyan-300">
                  CYBER ASSAULT
                </span>
              </div>
            </div>

            {/* Try Again Countdown Widget */}
            <div className="bg-[#141822]/90 border border-slate-700/50 rounded-lg p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                {isVictory ? 'NEXT MATCH IN' : 'TRY AGAIN?'}
              </span>
              <span className="text-xl font-mono font-black text-yellow-400 mt-0.5">
                {countdown} <span className="text-xs font-bold text-slate-400">sec</span>
              </span>
            </div>

            {/* Action Buttons Strip */}
            <div className="flex flex-col gap-2 mt-auto">
              {/* Row 1: SHARE & NEXT MATCH */}
              <div className="grid grid-cols-12 gap-2">
                <button
                  onClick={handleShare}
                  className="col-span-5 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded border border-slate-600 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>SHARE</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    isVictory ? onNextLevel() : onRestart();
                  }}
                  className="col-span-7 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded shadow-[0_0_20px_rgba(234,179,8,0.4)] transition transform active:scale-98"
                >
                  <span>NEXT MATCH</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: REPORT PLAYER & ADD FRIEND */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setShowReportModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 font-bold text-[11px] uppercase tracking-wider rounded border border-slate-700 transition"
                >
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>REPORT PLAYER</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    squadEntries.forEach(tm => {
                      if (!tm.isUser) handleAddFriend(tm.id, tm.name);
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 font-bold text-[11px] uppercase tracking-wider rounded border border-slate-700 transition"
                >
                  <UserPlus className="w-3 h-3 text-cyan-400" />
                  <span>ADD SQUAD</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Share Toast Notification */}
        {shareToast && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50">
            <CheckCircle2 className="w-4 h-4" />
            <span>Match Results Copied to Clipboard!</span>
          </div>
        )}

        {/* Loot Crate Open Modal */}
        {showChestRewardModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#141824] border-2 border-yellow-500 rounded-xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-3 shadow-[0_0_40px_rgba(234,179,8,0.5)]">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center animate-bounce">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-black text-yellow-400 uppercase tracking-wide">
                BATTLE CRATE UNLOCKED!
              </h3>
              <p className="text-xs text-slate-300 font-semibold">
                Congratulations! You received post-match bonus spoils:
              </p>
              <div className="grid grid-cols-3 gap-2 w-full my-2">
                <div className="bg-slate-800 p-2 rounded border border-yellow-500/40 flex flex-col items-center">
                  <span className="text-yellow-400 font-black text-sm">+500</span>
                  <span className="text-[10px] text-slate-400 font-bold">GOLD</span>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-500/40 flex flex-col items-center">
                  <span className="text-cyan-400 font-black text-sm">+25</span>
                  <span className="text-[10px] text-slate-400 font-bold">GEMS</span>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-purple-500/40 flex flex-col items-center">
                  <span className="text-purple-400 font-black text-sm">+100</span>
                  <span className="text-[10px] text-slate-400 font-bold">PASS XP</span>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setShowChestRewardModal(false);
                }}
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded transition"
              >
                COLLECT SPOILS
              </button>
            </div>
          </div>
        )}

        {/* Report Player Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#141824] border border-red-500/60 rounded-xl p-5 max-w-md w-full flex flex-col gap-3 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>REPORT COMBATANT / SQUAD</span>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportedSuccess ? (
                <div className="py-6 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Report Submitted to Vanguard Anti-Cheat</span>
                  <span className="text-xs text-slate-400">Thank you for keeping Legendary Warriors fair.</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-bold">Select Target:</label>
                    <select
                      value={reportTarget}
                      onChange={e => setReportTarget(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white rounded p-2 text-xs font-semibold"
                    >
                      <option value="Enemy Squad #1">Enemy Squad #1 (Attacker)</option>
                      <option value="Enemy Sniper Alpha">Enemy Sniper Alpha</option>
                      <option value="Match Bot / Griefing">Griefing / AFK Teammate</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-bold">Infraction Category:</label>
                    <select
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white rounded p-2 text-xs font-semibold"
                    >
                      <option value="Aim Assist / Wallhack">Aim Assist / Wallhack Injection</option>
                      <option value="Speedhack / Teleportation">Movement Exploit / Speedhack</option>
                      <option value="Verbal Abuse / Toxicity">Toxic Comms / Harassment</option>
                      <option value="Intentional AFK">Intentional AFK / Throwing</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playUiClick();
                        setReportedSuccess(true);
                        setTimeout(() => {
                          setShowReportModal(false);
                          setReportedSuccess(false);
                        }, 2000);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded"
                    >
                      SUBMIT REPORT
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
