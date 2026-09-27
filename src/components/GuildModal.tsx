import React, { useState } from 'react';
import { X, Shield, Users, Trophy, Award, Check, Sparkles, Plus, Crown } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface GuildModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const GuildModal: React.FC<GuildModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [checkedIn, setCheckedIn] = useState(() => {
    return localStorage.getItem('lw_guild_checked_in') === 'true';
  });

  const guildMembers = [
    { name: 'Vortex_Prime', role: 'Guild Leader', level: 68, power: 9850, status: 'Online' },
    { name: 'Shadow_Ninja_99', role: 'Officer', level: 62, power: 9240, status: 'In Match' },
    { name: userProfile.playerName, role: 'Veteran', level: userProfile.level, power: 4850, status: 'Online (You)', isMe: true },
    { name: 'CyberQueen', role: 'Member', level: 59, power: 8750, status: 'Online' },
    { name: 'Apex_Sniper', role: 'Member', level: 54, power: 8120, status: 'Offline' },
  ];

  const handleCheckIn = () => {
    if (checkedIn) return;
    soundEngine.playUiReward();
    setCheckedIn(true);
    localStorage.setItem('lw_guild_checked_in', 'true');

    onUpdateProfile({
      coins: userProfile.coins + 1500,
      diamonds: userProfile.diamonds + 20,
      xp: userProfile.xp + 300,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[560px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                GUILD HEADQUARTERS <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// CYBER WARRIORS</span>
              </h2>
              <p className="text-xs text-slate-400">Level 8 Syndicate • 28/30 Members • Global Rank #14</p>
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115] flex flex-col justify-between">
          <div>
            {/* Guild Daily Check-in Banner */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-950/60 via-slate-900 to-black border border-yellow-500/40 flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> DAILY GUILD CHECK-IN BONUS
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Claim +1,500 Guild Coins & +20 Diamonds every 24 hours.</p>
              </div>

              <button
                disabled={checkedIn}
                onClick={handleCheckIn}
                className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition ${
                  checkedIn
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] active:scale-95'
                }`}
              >
                {checkedIn ? 'CHECKED IN' : 'CHECK IN (+1,500 C)'}
              </button>
            </div>

            {/* Guild Roster */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yellow-400" /> ACTIVE GUILD ROSTER
              </h3>

              <div className="flex flex-col gap-2">
                {guildMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between transition ${
                      m.isMe ? 'bg-yellow-500/15 border-yellow-500/60' : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {m.name}
                          {m.role === 'Guild Leader' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.role} • Lv. {m.level}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="font-mono text-xs font-bold text-yellow-400">{m.power} PTS</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          m.status.includes('Online')
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : m.status.includes('In Match')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-3 border-t border-white/10">
            Guild Perk Active: +15% Experience & +10% Coin multiplier from Battle Royale matches!
          </div>
        </div>
      </div>
    </div>
  );
};
