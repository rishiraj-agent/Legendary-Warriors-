import React, { useState } from 'react';
import { X, Sparkles, Check, Gift, Crown, Zap, Shield } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface CurrencyModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [claimedFreeDrop, setClaimedFreeDrop] = useState(() => {
    return localStorage.getItem('lw_free_currency_drop') === 'true';
  });

  const handleClaimFreeDrop = () => {
    if (claimedFreeDrop) return;
    soundEngine.playUiReward();
    setClaimedFreeDrop(true);
    localStorage.setItem('lw_free_currency_drop', 'true');

    onUpdateProfile({
      coins: userProfile.coins + 5000,
      diamonds: userProfile.diamonds + 100,
      xp: userProfile.xp + 500,
    });
  };

  const handleClaimTopUp = (coins: number, diamonds: number) => {
    soundEngine.playUiPurchase();
    onUpdateProfile({
      coins: userProfile.coins + coins,
      diamonds: userProfile.diamonds + diamonds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-2xl bg-[#12161a] border border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-yellow-950/90 via-slate-900 to-black border-b border-yellow-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-yellow-500/20 border border-yellow-500/60 flex items-center justify-center font-bold text-yellow-400 text-lg">
              C/D
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                CURRENCY VAULT <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// REPLENISH</span>
              </h2>
              <p className="text-xs text-slate-400">Claim free tactical grants, coin crates & diamond bundles</p>
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
        <div className="p-6 bg-gradient-to-b from-[#14191f] to-[#0d1115] flex flex-col gap-4">
          {/* Free Airdrop Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-950/80 via-blue-900/40 to-black border border-cyan-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-2xl">
                🎁
              </div>
              <div>
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  DAILY HQ AIRDROP GRANT
                </div>
                <div className="text-sm font-black text-white mt-0.5">+5,000 Coins + 100 Diamonds</div>
              </div>
            </div>

            <button
              disabled={claimedFreeDrop}
              onClick={handleClaimFreeDrop}
              className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition ${
                claimedFreeDrop
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95'
              }`}
            >
              {claimedFreeDrop ? 'CLAIMED TODAY' : 'CLAIM AIRDROP'}
            </button>
          </div>

          {/* Currency Top-up Packs */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
              TACTICAL DIAMOND BUNDLES
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: 'SCOUT CRATE', diamonds: 100, coins: 2000, bonus: '+10%' },
                { title: 'WARRIOR PACK', diamonds: 310, coins: 6000, bonus: '+25%' },
                { title: 'ELITE SAFE', diamonds: 520, coins: 12000, bonus: '+40%' },
                { title: 'TITAN VAULT', diamonds: 1060, coins: 30000, bonus: '+65%' },
              ].map((pack, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-white/10 rounded-lg p-3 flex flex-col justify-between items-center text-center hover:border-yellow-500/50 transition"
                >
                  <span className="text-[9px] font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                    {pack.bonus} BONUS
                  </span>

                  <div className="my-2">
                    <div className="text-xl font-black text-blue-400 font-mono flex items-center justify-center gap-1">
                      <span>💎</span> {pack.diamonds}
                    </div>
                    <div className="text-[10px] text-yellow-400 font-bold mt-0.5">+{pack.coins.toLocaleString()} C</div>
                  </div>

                  <button
                    onClick={() => handleClaimTopUp(pack.coins, pack.diamonds)}
                    className="w-full py-1.5 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                  >
                    ACQUIRE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
