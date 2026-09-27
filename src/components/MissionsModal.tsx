import React, { useState } from 'react';
import { X, Target, CheckCircle2, Gift, Sparkles, Flame, Trophy, Crown, Crosshair, Shield, Award, Check } from 'lucide-react';
import { MissionItem, UserProfileData } from '../types';
import { INITIAL_MISSIONS } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface MissionsModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'achievement'>('daily');
  const [missions, setMissions] = useState<MissionItem[]>(() => {
    const saved = localStorage.getItem('lw_missions_data');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  const filteredMissions = missions.filter(m => m.category === activeTab);
  const completedUnclaimed = missions.filter(m => m.currentProgress >= m.targetProgress && !m.isClaimed);
  const totalCompletedCount = missions.filter(m => m.currentProgress >= m.targetProgress).length;
  const allCompleted = totalCompletedCount === missions.length;

  const handleClaim = (mission: MissionItem) => {
    if (mission.isClaimed || mission.currentProgress < mission.targetProgress) return;

    soundEngine.playUiReward();
    const updated = missions.map(m => (m.id === mission.id ? { ...m, isClaimed: true } : m));
    setMissions(updated);
    localStorage.setItem('lw_missions_data', JSON.stringify(updated));

    onUpdateProfile({
      coins: userProfile.coins + mission.rewardCoins,
      diamonds: userProfile.diamonds + mission.rewardDiamonds,
      xp: userProfile.xp + mission.rewardExp,
    });
  };

  const handleClaimAll = () => {
    if (completedUnclaimed.length === 0) return;
    soundEngine.playUiReward();

    let addCoins = 0;
    let addDiamonds = 0;
    let addExp = 0;

    const updated = missions.map(m => {
      if (m.currentProgress >= m.targetProgress && !m.isClaimed) {
        addCoins += m.rewardCoins;
        addDiamonds += m.rewardDiamonds;
        addExp += m.rewardExp;
        return { ...m, isClaimed: true };
      }
      return m;
    });

    setMissions(updated);
    localStorage.setItem('lw_missions_data', JSON.stringify(updated));

    onUpdateProfile({
      coins: userProfile.coins + addCoins,
      diamonds: userProfile.diamonds + addDiamonds,
      xp: userProfile.xp + addExp,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md pointer-events-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0e1319] border-2 border-yellow-500/50 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col h-[90vh] sm:h-[620px] rounded-2xl overflow-hidden">
        {/* Header with Golden Wings Banner */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a140b] via-[#2a1d0d] to-[#1a140b] border-b border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎖️</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic tracking-wider text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]">
                MISSION REWARDS
              </h2>
              <p className="text-xs text-yellow-200/70 font-semibold">Complete combat tasks to earn gold & diamonds</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 hover:bg-white/10 text-slate-400 hover:text-white transition rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/50 border-b border-white/5 text-xs font-black">
          {[
            { id: 'daily', label: 'DAILY TASKS' },
            { id: 'weekly', label: 'WEEKLY MISSIONS' },
            { id: 'achievement', label: 'ACHIEVEMENTS' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl transition uppercase tracking-wider ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body: Split Missions List & Chest */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Missions List */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-gradient-to-b from-[#111720] to-[#0a0e14] flex flex-col gap-3">
            {filteredMissions.map(m => {
              const isCompleted = m.currentProgress >= m.targetProgress;
              const progressPercent = Math.min(100, Math.round((m.currentProgress / m.targetProgress) * 100));

              return (
                <div
                  key={m.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition flex items-center justify-between gap-3 ${
                    m.isClaimed
                      ? 'bg-black/30 border-white/5 opacity-50'
                      : isCompleted
                      ? 'bg-gradient-to-r from-yellow-950/40 via-amber-950/20 to-slate-900 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 text-xl">
                      {m.icon === 'Crosshair' ? '🎯' : m.icon === 'Shield' ? '🛡️' : m.icon === 'Flame' ? '🔥' : '🏆'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black text-white truncate">{m.title}</h3>
                        {m.isClaimed && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            DONE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.description}</p>

                      {/* Progress */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300 shrink-0">
                          {m.currentProgress} / {m.targetProgress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-black text-yellow-400">+{m.rewardCoins} 🪙</span>
                      {m.rewardDiamonds > 0 && (
                        <span className="text-[11px] font-mono font-black text-cyan-400">+{m.rewardDiamonds} 💎</span>
                      )}
                    </div>

                    <button
                      disabled={!isCompleted || m.isClaimed}
                      onClick={() => handleClaim(m)}
                      className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 ${
                        m.isClaimed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                          : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {m.isClaimed ? 'CLAIMED' : isCompleted ? 'CLAIM' : 'LOCKED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Grand Reward Chest */}
          <div className="w-full md:w-72 bg-[#0a0e14] border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col items-center justify-between text-center">
            <div className="w-full flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                DAILY CHEST
              </span>

              <div className="my-4 relative">
                <div className="text-6xl sm:text-7xl animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                  🎁
                </div>
                <div className="absolute -inset-2 bg-yellow-400/10 rounded-full blur-xl pointer-events-none"></div>
              </div>

              <h4 className="text-sm font-black text-white uppercase">All Missions Bonus</h4>
              <p className="text-xs text-slate-400 mt-1">
                Completed ({totalCompletedCount}/{missions.length})
              </p>

              <div className="w-full h-2 bg-slate-900 rounded-full mt-3 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
                  style={{ width: `${(totalCompletedCount / Math.max(1, missions.length)) * 100}%` }}
                ></div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/10 w-full text-left">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Chest Contains:</div>
                <div className="flex items-center justify-between mt-1 text-xs font-mono font-black text-yellow-400">
                  <span>+500 Gold Coins</span>
                  <span>🪙</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-black text-cyan-400">
                  <span>+50 Diamonds</span>
                  <span>💎</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Claim All Action Bar */}
        <div className="px-6 py-3.5 bg-[#080b0f] border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span className="font-bold text-white">{completedUnclaimed.length}</span> unclaimed reward{completedUnclaimed.length !== 1 ? 's' : ''} available
          </div>

          <button
            disabled={completedUnclaimed.length === 0}
            onClick={handleClaimAll}
            className={`px-8 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition ${
              completedUnclaimed.length > 0
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-[0_0_25px_rgba(234,179,8,0.6)] active:scale-95 cursor-pointer'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            CLAIM ALL REWARDS
          </button>
        </div>
      </div>
    </div>
  );
};
