import React, { useState } from 'react';
import { X, Trophy, Crown, Medal, Award, Flame, Users, Globe, Shield } from 'lucide-react';
import { LeaderboardUser, UserProfileData } from '../types';
import { INITIAL_LEADERBOARD } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface LeaderboardModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  userProfile,
}) => {
  const [tab, setTab] = useState<'global' | 'regional' | 'guild'>('global');

  // Include real user stats dynamically in leaderboard
  const list: LeaderboardUser[] = INITIAL_LEADERBOARD.map(u => {
    if (u.isCurrentUser) {
      return {
        ...u,
        name: userProfile.playerName,
        level: userProfile.level,
        kills: userProfile.totalKills > 0 ? userProfile.totalKills : u.kills,
        winRate: userProfile.matchesPlayed > 0 ? `${((userProfile.victories / userProfile.matchesPlayed) * 100).toFixed(1)}%` : u.winRate,
        kdRatio: userProfile.matchesPlayed > 0 ? Number(((userProfile.totalKills || 10) / Math.max(1, userProfile.matchesPlayed - userProfile.victories)).toFixed(2)) : u.kdRatio,
      };
    }
    return u;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Grandmaster':
        return 'text-amber-300 bg-amber-950/80 border-amber-400';
      case 'Heroic':
        return 'text-red-400 bg-red-950/80 border-red-500';
      case 'Master':
        return 'text-purple-300 bg-purple-950/80 border-purple-500';
      case 'Diamond':
        return 'text-cyan-300 bg-cyan-950/80 border-cyan-500';
      default:
        return 'text-yellow-300 bg-yellow-950/80 border-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-4xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[580px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                RANKED LEADERBOARD <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// SEASON RANKINGS</span>
              </h2>
              <p className="text-xs text-slate-400">Battle Royale Grandmaster elite warriors rankings</p>
            </div>
          </div>

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

        {/* Tab Filters */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/40 border-b border-white/5 text-xs font-bold">
          {[
            { id: 'global', label: 'GLOBAL ELITE', icon: Globe },
            { id: 'regional', label: 'REGIONAL SERVER', icon: Award },
            { id: 'guild', label: 'GUILD ROSTER', icon: Shield },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playUiClick();
                setTab(item.id as any);
              }}
              className={`px-4 py-2 rounded transition uppercase tracking-wider flex items-center gap-1.5 ${
                tab === item.id
                  ? 'bg-yellow-500 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115]">
          <div className="w-full flex flex-col gap-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black uppercase text-slate-400 border-b border-white/10 tracking-wider">
              <div className="col-span-1">RANK</div>
              <div className="col-span-4">WARRIOR / LEVEL</div>
              <div className="col-span-2 text-center">TIER</div>
              <div className="col-span-2 text-right">SCORE</div>
              <div className="col-span-1 text-right">KILLS</div>
              <div className="col-span-2 text-right">WIN RATE / K/D</div>
            </div>

            {/* User Rows */}
            {list.map((player, idx) => {
              const isTop3 = player.rank <= 3;
              return (
                <div
                  key={idx}
                  className={`grid grid-cols-12 items-center px-4 py-3 rounded-lg border transition ${
                    player.isCurrentUser
                      ? 'bg-gradient-to-r from-yellow-500/20 via-slate-800 to-slate-900 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-black/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center gap-1">
                    {player.rank === 1 ? (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    ) : player.rank === 2 ? (
                      <Medal className="w-5 h-5 text-slate-300" />
                    ) : player.rank === 3 ? (
                      <Medal className="w-5 h-5 text-amber-600" />
                    ) : (
                      <span className="font-mono font-bold text-sm text-slate-400">#{player.rank}</span>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        {player.name}
                        {player.isCurrentUser && (
                          <span className="text-[9px] bg-yellow-500 text-black px-1.5 rounded font-bold">YOU</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Lv. {player.level}</div>
                    </div>
                  </div>

                  {/* Tier */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getTierColor(player.tier)}`}>
                      {player.tier}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right font-mono font-bold text-xs text-yellow-400">
                    {player.score.toLocaleString()} PTS
                  </div>

                  {/* Kills */}
                  <div className="col-span-1 text-right font-mono font-bold text-xs text-white">
                    {player.kills}
                  </div>

                  {/* Win Rate & K/D */}
                  <div className="col-span-2 text-right font-mono text-xs">
                    <div className="text-white font-bold">{player.winRate}</div>
                    <div className="text-[10px] text-slate-400">{player.kdRatio} K/D</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
