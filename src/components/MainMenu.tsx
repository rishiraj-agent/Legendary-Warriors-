import React, { useState } from 'react';
import { Play, User, Crosshair, ShoppingCart, Target, Calendar, Trophy, Settings, Shield, Mail, Users, Wifi, MessageSquare, Map, Gift, Crown, Package, HelpCircle, Box, Sparkles, BatteryMedium } from 'lucide-react';
import { HeroConfig, LevelConfig, UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface MainMenuProps {
  selectedHero: HeroConfig;
  currentLevel: LevelConfig;
  userProfile: UserProfileData;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onOpenLevelSelect: () => void;
  onOpenHeroSelect: () => void;
  onOpenWeapons: () => void;
  onOpenStore: () => void;
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenLeaderboard: () => void;
  onOpenStarterPack: () => void;
  onOpenLegendPass: () => void;
  onOpenDailyRewards: () => void;
  onOpenProfile: () => void;
  onOpenGuild: () => void;
  onOpenChat: () => void;
  onOpenTopUp: () => void;
  onOpen3DStudio?: () => void;
}

export function MainMenu({
  selectedHero,
  currentLevel,
  userProfile,
  onStartGame,
  onOpenSettings,
  onOpenGuide,
  onOpenLevelSelect,
  onOpenHeroSelect,
  onOpenWeapons,
  onOpenStore,
  onOpenMissions,
  onOpenEvents,
  onOpenLeaderboard,
  onOpenStarterPack,
  onOpenLegendPass,
  onOpenDailyRewards,
  onOpenProfile,
  onOpenGuild,
  onOpenChat,
  onOpenTopUp,
  onOpen3DStudio,
}: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<string>('play');

  const handleAction = (cb?: () => void) => {
    soundEngine.playUiClick();
    cb?.();
  };

  return (
    <div className="absolute inset-0 z-40 flex bg-transparent pointer-events-none font-sans select-none overflow-hidden">
      {/* Left Main Navigation Column */}
      <div className="w-56 sm:w-60 bg-gradient-to-b from-[#14161b]/95 via-[#0e1014]/95 to-[#090a0d]/95 border-r border-[#262c36] flex flex-col pointer-events-auto backdrop-blur-md shadow-[5px_0_30px_rgba(0,0,0,0.8)] z-30">
        
        {/* Game Logo with Golden Wings Emblem */}
        <div className="p-4 pt-5 pb-3 flex flex-col items-center text-center border-b border-white/5">
          <div className="relative mb-1">
            {/* Golden Wings SVG Emblem */}
            <svg className="w-12 h-7 text-yellow-500 fill-current drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" viewBox="0 0 100 60">
              <path d="M50 45 L35 25 L10 20 L25 35 L5 40 L30 50 L50 58 L70 50 L95 40 L75 35 L90 20 L65 25 Z" fill="#eab308" />
              <path d="M50 15 L40 30 L50 45 L60 30 Z" fill="#fef08a" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight">
            LEGENDARY
            <br />
            <span className="tracking-widest text-lg sm:text-xl">WARRIORS</span>
          </h1>
        </div>

        {/* Sidebar Nav Buttons */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 px-2.5 custom-scrollbar">
          
          {/* PLAY Button (Golden Angled Pill) */}
          <button
            onClick={() => {
              setActiveTab('play');
              handleAction(onStartGame);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 my-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black italic tracking-wider text-sm rounded shadow-[0_0_15px_rgba(234,179,8,0.4)] transition transform active:scale-98"
          >
            <Play className="w-4 h-4 fill-black text-black" />
            <span>PLAY</span>
          </button>

          {/* 3D Asset Studio Shortcut */}
          {onOpen3DStudio && (
            <button
              onClick={() => handleAction(onOpen3DStudio)}
              className="flex items-center justify-between px-3.5 py-2 rounded bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition group"
            >
              <div className="flex items-center gap-2.5">
                <Box className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>3D STUDIO</span>
              </div>
              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-cyan-500 text-black">
                MESH
              </span>
            </button>
          )}

          {[
            { id: 'character', icon: User, label: 'CHARACTER', onClick: onOpenHeroSelect },
            { id: 'vault', icon: Package, label: 'VAULT', onClick: onOpenStore },
            { id: 'weapons', icon: Crosshair, label: 'WEAPONS', onClick: onOpenWeapons },
            { id: 'store', icon: ShoppingCart, label: 'STORE', onClick: onOpenStore },
            { id: 'missions', icon: Target, label: 'MISSIONS', onClick: onOpenMissions },
            { id: 'events', icon: Calendar, label: 'EVENTS', onClick: onOpenEvents, hasBadge: true },
            { id: 'leaderboard', icon: Trophy, label: 'LEADERBOARD', onClick: onOpenLeaderboard },
            { id: 'settings', icon: Settings, label: 'SETTINGS', onClick: onOpenSettings },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  handleAction(item.onClick);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded font-bold uppercase tracking-wider text-xs transition ${
                  isActive
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{item.label}</span>
                </div>
                {item.hasBadge && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tutorial / Help Link */}
        {onOpenGuide && (
          <div className="px-2.5 pb-2">
            <button
              onClick={() => handleAction(onOpenGuide)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-black/40 hover:bg-black/60 border border-white/10 text-slate-400 hover:text-yellow-400 text-[10px] font-bold uppercase transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>TUTORIAL / CONTROLS</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-56 sm:left-60 right-0 h-16 flex items-center justify-between px-5 pointer-events-auto bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20">
        
        {/* User Profile & Currencies */}
        <div className="flex items-center gap-3">
          {/* User Badge */}
          <button
            onClick={() => handleAction(onOpenProfile)}
            className="flex items-center gap-2.5 bg-[#14161b]/90 hover:bg-[#1a1d24] px-2.5 py-1 rounded border border-[#2b313d] hover:border-yellow-500/50 transition group"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-900 border border-yellow-500/50 flex items-center justify-center text-sm shadow-md">
              {userProfile.avatar || '⚔️'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white group-hover:text-yellow-300 transition leading-none">
                {userProfile.playerName || 'WarriorK'}
              </span>
              <span className="text-[9px] font-mono font-bold text-yellow-500/90 mt-0.5">
                Lv. {userProfile.level || 15}
              </span>
            </div>
          </button>

          {/* Gold Coins Badge */}
          <div className="flex items-center gap-1.5 bg-[#14161b]/90 border border-[#2b313d] px-3 py-1 rounded">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 flex items-center justify-center text-[9px] font-black text-black">
              🪙
            </div>
            <span className="text-xs font-mono font-bold text-yellow-400">
              {userProfile.coins.toLocaleString()}
            </span>
          </div>

          {/* Diamonds Badge with + Button */}
          <div className="flex items-center gap-1.5 bg-[#14161b]/90 border border-[#2b313d] pl-3 pr-1 py-1 rounded">
            <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-[9px] font-black text-black">
              💎
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {userProfile.diamonds.toLocaleString()}
            </span>
            <button
              onClick={() => handleAction(onOpenTopUp)}
              className="w-4 h-4 rounded bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black flex items-center justify-center ml-1 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Top Right Tactical Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleAction(onOpenGuild)}
            title="Squad / Friends"
            className="p-2 rounded bg-[#14161b]/80 hover:bg-[#1f232b] text-slate-300 hover:text-white border border-[#2b313d] transition"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAction(onOpenDailyRewards)}
            title="Mailbox"
            className="p-2 rounded bg-[#14161b]/80 hover:bg-[#1f232b] text-slate-300 hover:text-white border border-[#2b313d] transition relative"
          >
            <Mail className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={() => handleAction(onOpenSettings)}
            title="Settings"
            className="p-2 rounded bg-[#14161b]/80 hover:bg-[#1f232b] text-slate-300 hover:text-white border border-[#2b313d] transition"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 pl-2 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <BatteryMedium className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Bottom Center Bar: Pet, Guild, Rank & World Chat */}
      <div className="absolute bottom-5 left-64 right-80 flex items-center gap-4 pointer-events-auto z-20">
        {/* Quick Nav Chips */}
        <div className="flex items-center gap-1 bg-[#14161b]/80 border border-[#2b313d] p-1 rounded backdrop-blur-sm">
          <button
            onClick={() => handleAction(onOpenStore)}
            className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 text-slate-300 hover:text-yellow-400 text-xs font-bold transition uppercase"
          >
            <Shield className="w-3.5 h-3.5 text-yellow-500" />
            <span>PET</span>
          </button>
          <div className="w-[1px] h-3.5 bg-white/10" />
          <button
            onClick={() => handleAction(onOpenGuild)}
            className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 text-slate-300 hover:text-yellow-400 text-xs font-bold transition uppercase"
          >
            <Users className="w-3.5 h-3.5 text-yellow-500" />
            <span>GUILD</span>
          </button>
          <div className="w-[1px] h-3.5 bg-white/10" />
          <button
            onClick={() => handleAction(onOpenLeaderboard)}
            className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 text-slate-300 hover:text-yellow-400 text-xs font-bold transition uppercase"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>RANK</span>
          </button>
        </div>

        {/* World Chat Pill */}
        <button
          onClick={() => handleAction(onOpenChat)}
          className="flex-1 max-w-sm flex items-center gap-2 bg-[#14161b]/80 border border-[#2b313d] hover:border-yellow-500/50 px-3 py-1.5 rounded text-xs text-left transition backdrop-blur-sm group"
        >
          <MessageSquare className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="text-[11px] text-slate-300 truncate">
            <span className="text-yellow-500 font-bold">[World]</span> {userProfile.playerName || 'WarriorK'}: Let's go!
          </span>
        </button>
      </div>

      {/* Right Side Floating Event Panels & START Battle Launcher */}
      <div className="absolute right-6 top-20 bottom-5 w-64 flex flex-col justify-between items-end pointer-events-auto z-20">
        
        {/* Right Event Cards Stack */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Starter Pack Card */}
          <button
            onClick={() => handleAction(onOpenStarterPack)}
            className="w-full bg-gradient-to-r from-[#1b1e24]/90 via-[#262c36]/90 to-[#1b1e24]/90 border border-yellow-500/40 rounded p-2.5 flex items-center justify-between hover:border-yellow-400 transition group shadow-lg text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-black italic tracking-wide text-white uppercase group-hover:text-yellow-300">
                STARTER PACK
              </span>
              <span className="text-[10px] text-yellow-400/90 font-bold">90% OFF DEAL</span>
            </div>
            <div className="w-10 h-10 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-lg">
              📦
            </div>
          </button>

          {/* Legend Pass Card */}
          <button
            onClick={() => handleAction(onOpenLegendPass)}
            className="w-full bg-gradient-to-r from-[#1b1e24]/90 via-[#262c36]/90 to-[#1b1e24]/90 border border-yellow-500/40 rounded p-2.5 flex items-center justify-between hover:border-yellow-400 transition group shadow-lg text-left"
          >
            <div className="flex flex-col flex-1 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black italic tracking-wide text-white uppercase group-hover:text-yellow-300">
                  LEGEND PASS
                </span>
                <span className="text-[9px] font-mono text-yellow-400 font-bold">Lv. 20</span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full mt-1 overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 w-3/4 rounded-full" />
              </div>
              <span className="text-[8px] font-mono text-slate-400 mt-0.5">207 / 300 EXP</span>
            </div>
            <div className="w-10 h-10 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-lg shrink-0">
              👑
            </div>
          </button>

          {/* Daily Rewards Card */}
          <button
            onClick={() => handleAction(onOpenDailyRewards)}
            className="w-full bg-gradient-to-r from-[#1b1e24]/90 via-[#262c36]/90 to-[#1b1e24]/90 border border-yellow-500/40 rounded p-2.5 flex items-center justify-between hover:border-yellow-400 transition group shadow-lg text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-black italic tracking-wide text-white uppercase group-hover:text-yellow-300">
                DAILY REWARDS
              </span>
              <span className="text-[10px] text-cyan-300 font-bold">CLAIM CHEST</span>
            </div>
            <div className="w-10 h-10 rounded bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-lg">
              🎁
            </div>
          </button>
        </div>

        {/* Bottom Right: Battle Mode Box & START Button */}
        <div className="w-full flex flex-col gap-2">
          {/* Mode Selector Card */}
          <button
            onClick={() => handleAction(onOpenLevelSelect)}
            className="w-full bg-[#14161b]/90 border border-[#2b313d] hover:border-yellow-500/60 p-2.5 rounded flex items-center justify-between transition group backdrop-blur-sm"
          >
            <div className="text-left">
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">BATTLE ROYALE</div>
              <div className="text-xs font-black text-white group-hover:text-yellow-400 transition uppercase">
                {currentLevel.name || 'Bermuda'}
              </div>
            </div>
            <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-yellow-400">
              <Map className="w-4 h-4" />
            </div>
          </button>

          {/* START Button */}
          <button
            onClick={() => handleAction(onStartGame)}
            className="w-full py-3 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black italic text-xl uppercase tracking-widest rounded shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300 transition active:scale-95 flex items-center justify-center gap-2"
          >
            START
          </button>
        </div>

      </div>
    </div>
  );
}

