import React, { useState } from 'react';
import { X, User, Trophy, Award, Shield, Target, Flame, Edit2, Check, Sparkles } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface ProfileModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfile.playerName);
  const avatars = ['⚔️', '👑', '🥷', '⚡', '🎯', '🐺', '🔥', '🛡️', '💀', '🤖'];

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateProfile({ playerName: tempName.trim() });
      soundEngine.playUiClick();
    }
    setIsEditingName(false);
  };

  const handleSelectAvatar = (av: string) => {
    onUpdateProfile({ avatar: av });
    soundEngine.playUiClick();
  };

  const winRate = userProfile.matchesPlayed > 0
    ? ((userProfile.victories / userProfile.matchesPlayed) * 100).toFixed(1)
    : '0.0';

  const kdRatio = userProfile.matchesPlayed > 0
    ? (userProfile.totalKills / Math.max(1, userProfile.matchesPlayed - userProfile.victories)).toFixed(2)
    : '0.00';

  const headshotPct = userProfile.totalKills > 0
    ? ((userProfile.headshots / userProfile.totalKills) * 100).toFixed(1)
    : '0.0';

  const xpPercent = Math.min(100, Math.round((userProfile.xp / userProfile.xpToNext) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                WARRIOR PROFILE <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// CAREER STATS</span>
              </h2>
              <p className="text-xs text-slate-400">Battle records, combat tier classification & customization</p>
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

        {/* Profile Card & Customization */}
        <div className="p-6 bg-gradient-to-b from-[#14191f] to-[#0d1115] flex flex-col gap-5">
          {/* Identity Bar */}
          <div className="p-4 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                {userProfile.avatar || '⚔️'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        className="bg-slate-900 border border-yellow-400 text-white font-bold text-sm px-2.5 py-1 rounded outline-none"
                        maxLength={16}
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 rounded bg-yellow-500 text-black hover:bg-yellow-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-white tracking-wide">{userProfile.playerName}</h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-slate-400 hover:text-yellow-400 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/50 uppercase">
                    {userProfile.tier || 'Diamond II'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300 font-mono">
                  <span className="text-yellow-400 font-bold">LEVEL {userProfile.level}</span>
                  <span className="text-slate-500">•</span>
                  <span>XP: {userProfile.xp} / {userProfile.xpToNext}</span>
                </div>

                {/* Level Progress */}
                <div className="w-64 h-1.5 bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Avatar</span>
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/5">
                {avatars.slice(0, 5).map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAvatar(av)}
                    className={`w-7 h-7 rounded flex items-center justify-center text-sm transition ${
                      userProfile.avatar === av ? 'bg-yellow-500/30 border border-yellow-400' : 'hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Career Combat Statistics */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> BATTLE ROYALE COMBAT DOSSIER
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'TOTAL MATCHES', val: userProfile.matchesPlayed || 12, color: 'text-white' },
                { label: 'VICTORIES', val: userProfile.victories || 5, color: 'text-yellow-400' },
                { label: 'WIN RATE', val: `${winRate}%`, color: 'text-green-400' },
                { label: 'K/D RATIO', val: `${kdRatio}`, color: 'text-amber-400' },
                { label: 'TOTAL ELIMINATIONS', val: userProfile.totalKills || 48, color: 'text-red-400' },
                { label: 'HEADSHOT RATIO', val: `${headshotPct}%`, color: 'text-cyan-400' },
                { label: 'DAMAGE DEALT', val: (userProfile.damageDealt || 12450).toLocaleString(), color: 'text-orange-400' },
                { label: 'GLOO WALLS DEPLOYED', val: userProfile.glooWallsPlaced || 34, color: 'text-blue-400' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-black/40 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                  <div className={`text-xl font-black font-mono mt-1 ${stat.color}`}>{stat.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
