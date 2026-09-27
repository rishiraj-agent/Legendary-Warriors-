import React, { useState } from 'react';
import { X, Crown, Sparkles, Check, Lock, Gift, ChevronRight, Zap } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface LegendPassModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const LegendPassModal: React.FC<LegendPassModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [claimedTiers, setClaimedTiers] = useState<number[]>(() => {
    const saved = localStorage.getItem('lw_claimed_pass_tiers');
    return saved ? JSON.parse(saved) : [1, 2, 3];
  });

  const tiers = Array.from({ length: 15 }, (_, i) => i + 1);

  const handleUnlockElite = () => {
    if (userProfile.isElitePassUnlocked) return;
    if (userProfile.diamonds < 300) {
      soundEngine.playUiClick();
      alert('You need 300 Diamonds to unlock Elite Legend Pass!');
      return;
    }

    soundEngine.playUiPurchase();
    onUpdateProfile({
      diamonds: userProfile.diamonds - 300,
      isElitePassUnlocked: true,
    });
  };

  const handleClaimTier = (tierNum: number) => {
    if (claimedTiers.includes(tierNum)) return;
    if (tierNum > userProfile.passTier) return;

    soundEngine.playUiReward();
    const updated = [...claimedTiers, tierNum];
    setClaimedTiers(updated);
    localStorage.setItem('lw_claimed_pass_tiers', JSON.stringify(updated));

    // Reward
    const bonusCoins = 500 * tierNum;
    const bonusDiamonds = tierNum % 3 === 0 ? 30 : 0;
    onUpdateProfile({
      coins: userProfile.coins + bonusCoins,
      diamonds: userProfile.diamonds + bonusDiamonds,
      xp: userProfile.xp + 250,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-4xl bg-[#12161a] border border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col h-[580px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-yellow-950/80 via-slate-900 to-black border-b border-yellow-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-yellow-500/20 border border-yellow-500/60 flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                LEGEND PASS <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// SEASON 4</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-yellow-300 font-bold">Current Pass Tier: {userProfile.passTier}</span>
                <span className="text-[10px] text-slate-400 font-mono">180/300 Season EXP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!userProfile.isElitePassUnlocked && (
              <button
                onClick={handleUnlockElite}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> UNLOCK ELITE (300 💎)
              </button>
            )}

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
        </div>

        {/* Pass Tiers Slider / Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {tiers.map(t => {
              const isUnlocked = t <= userProfile.passTier;
              const isClaimed = claimedTiers.includes(t);

              return (
                <div
                  key={t}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between transition relative ${
                    isClaimed
                      ? 'bg-black/30 border-white/5 opacity-60'
                      : isUnlocked
                      ? 'bg-gradient-to-b from-yellow-500/15 to-slate-900 border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                      : 'bg-black/50 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black font-mono text-yellow-400">TIER {t}</span>
                    {isClaimed ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    )}
                  </div>

                  <div className="h-16 flex flex-col items-center justify-center my-1">
                    <span className="text-2xl">{t % 4 === 0 ? '👑' : t % 2 === 0 ? '💎' : '💰'}</span>
                    <span className="text-[10px] font-bold text-slate-300 mt-1">
                      {t % 4 === 0 ? 'Rare Weapon Skin' : t % 2 === 0 ? '+30 Diamonds' : `+${t * 500} Coins`}
                    </span>
                  </div>

                  <button
                    disabled={!isUnlocked || isClaimed}
                    onClick={() => handleClaimTier(t)}
                    className={`w-full py-1.5 rounded text-[10px] font-black uppercase tracking-wider mt-2 transition ${
                      isClaimed
                        ? 'bg-slate-800 text-slate-500'
                        : isUnlocked
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isClaimed ? 'CLAIMED' : isUnlocked ? 'CLAIM' : 'LOCKED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
