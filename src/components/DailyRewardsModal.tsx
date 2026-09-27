import React, { useState } from 'react';
import { X, Gift, Check, Sparkles, Flame, Shield, Award, Crown } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface DailyRewardsModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [claimedDays, setClaimedDays] = useState<number[]>(() => {
    return userProfile.dailyRewardsClaimedDays || [1];
  });

  const rewards = [
    { day: 1, label: '500 Coins', icon: '💰', coins: 500, diamonds: 0 },
    { day: 2, label: '50 Diamonds', icon: '💎', coins: 0, diamonds: 50 },
    { day: 3, label: 'Sakura Katana Skin', icon: '⚔️', coins: 0, diamonds: 0, skinId: 'skin_katana_sakura' },
    { day: 4, label: '1,500 Coins', icon: '💰', coins: 1500, diamonds: 0 },
    { day: 5, label: '100 Diamonds', icon: '💎', coins: 0, diamonds: 100 },
    { day: 6, label: 'Cyber Gloo Wall', icon: '🛡️', coins: 0, diamonds: 0, skinId: 'gloo_cyber_shield' },
    { day: 7, label: 'AK-47 Dragon Skin + 5,000 Coins', icon: '👑', coins: 5000, diamonds: 150, skinId: 'skin_ak47_dragon' },
  ];

  const currentActiveDay = Math.min(7, (claimedDays.length || 0) + 1);

  const handleClaimToday = (reward: typeof rewards[0]) => {
    if (claimedDays.includes(reward.day)) return;

    soundEngine.playUiReward();
    const updatedDays = [...claimedDays, reward.day];
    setClaimedDays(updatedDays);

    const newOwned = reward.skinId && !userProfile.ownedSkins.includes(reward.skinId)
      ? [...userProfile.ownedSkins, reward.skinId]
      : userProfile.ownedSkins;

    onUpdateProfile({
      coins: userProfile.coins + reward.coins,
      diamonds: userProfile.diamonds + reward.diamonds,
      dailyRewardsClaimedDays: updatedDays,
      ownedSkins: newOwned,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#12161a] border border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-black border-b border-blue-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-500/20 border border-blue-500/60 flex items-center justify-center">
              <Gift className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                DAILY LOGIN REWARDS <span className="text-blue-400 text-sm font-bold tracking-normal not-italic">// 7-DAY STREAK</span>
              </h2>
              <p className="text-xs text-slate-400">Log in daily to claim free currencies, rare weapons, and skins</p>
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

        {/* Rewards Calendar */}
        <div className="p-6 bg-gradient-to-b from-[#14191f] to-[#0d1115]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {rewards.slice(0, 6).map(r => {
              const isClaimed = claimedDays.includes(r.day);
              const isReady = r.day === currentActiveDay;

              return (
                <div
                  key={r.day}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between items-center text-center transition ${
                    isClaimed
                      ? 'bg-black/30 border-white/5 opacity-60'
                      : isReady
                      ? 'bg-gradient-to-b from-blue-500/20 to-slate-900 border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>DAY {r.day}</span>
                    {isClaimed && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </div>

                  <div className="text-3xl my-2">{r.icon}</div>
                  <div className="text-xs font-bold text-white mb-2">{r.label}</div>

                  <button
                    disabled={!isReady || isClaimed}
                    onClick={() => handleClaimToday(r)}
                    className={`w-full py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition ${
                      isClaimed
                        ? 'bg-slate-800 text-slate-500'
                        : isReady
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:brightness-110 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] active:scale-95'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isClaimed ? 'CLAIMED' : isReady ? 'CLAIM' : 'LOCKED'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Day 7 Mega Reward Highlight */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-950/80 via-amber-900/60 to-black border border-yellow-500/60 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-yellow-500/20 border border-yellow-500/60 flex items-center justify-center text-3xl shrink-0">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded">DAY 7 GRAND REWARD</span>
                  <span className="text-xs text-yellow-300 font-bold">STREAK JACKPOT</span>
                </div>
                <h3 className="text-sm font-black text-white mt-1">AK-47 Dragon Flame FX + 5,000 Coins + 150 Diamonds</h3>
              </div>
            </div>

            <button
              disabled={currentActiveDay < 7 || claimedDays.includes(7)}
              onClick={() => handleClaimToday(rewards[6])}
              className={`px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition ${
                claimedDays.includes(7)
                  ? 'bg-slate-800 text-slate-500'
                  : currentActiveDay >= 7
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              {claimedDays.includes(7) ? 'CLAIMED' : currentActiveDay >= 7 ? 'CLAIM GRAND PRIZE' : 'DAY 7 UNLOCK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
