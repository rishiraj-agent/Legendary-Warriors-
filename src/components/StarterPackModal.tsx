import React, { useState } from 'react';
import { X, Package, Sparkles, Flame, Shield, Check, Crown, Zap } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface StarterPackModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const StarterPackModal: React.FC<StarterPackModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [claimed, setClaimed] = useState<boolean>(() => {
    return localStorage.getItem('lw_starter_pack_claimed') === 'true';
  });

  const handleClaim = () => {
    if (claimed) return;
    soundEngine.playUiReward();

    localStorage.setItem('lw_starter_pack_claimed', 'true');
    setClaimed(true);

    onUpdateProfile({
      coins: userProfile.coins + 10000,
      diamonds: userProfile.diamonds + 300,
      xp: userProfile.xp + 1500,
      ownedSkins: [...userProfile.ownedSkins, 'skin_katana_sakura'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-lg bg-[#12161a] border border-orange-500/60 shadow-[0_0_50px_rgba(249,115,22,0.3)] flex flex-col rounded-lg overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-orange-900 via-amber-900 to-black relative border-b border-orange-500/40">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-orange-500 text-black">
              SPECIAL 90% DISCOUNT
            </div>
            <span className="text-xs text-orange-300 font-mono">LIMITED TIME EXCLUSIVE</span>
          </div>

          <h1 className="text-2xl font-black italic text-white tracking-wide flex items-center gap-2">
            WARRIOR STARTER BUNDLE
          </h1>
          <p className="text-xs text-slate-300 mt-1">Supercharge your tactical arsenal with premium currency & weapons!</p>
        </div>

        {/* Content Items */}
        <div className="p-6 bg-[#0f1317] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '💰', title: '10,000 COINS', desc: 'Unlock weapon upgrades & crates', tag: 'INSTANT' },
              { icon: '💎', title: '300 DIAMONDS', desc: 'Shop premium black market skins', tag: 'PREMIUM' },
              { icon: '⚔️', title: 'SAKURA KATANA', desc: 'Epic Melee weapon skin blueprint', tag: 'EPIC SKIN' },
              { icon: '🛡️', title: 'TACTICAL EXP BOOST', desc: '+1,500 Profile Experience Points', tag: 'LEVEL UP' },
            ].map((item, idx) => (
              <div key={idx} className="bg-black/50 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
                    {item.tag}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-black text-white">{item.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              disabled={claimed}
              onClick={handleClaim}
              className={`w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                claimed
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 hover:brightness-110 text-black shadow-[0_0_20px_rgba(249,115,22,0.6)] active:scale-95'
              }`}
            >
              {claimed ? (
                <>
                  <Check className="w-5 h-5 text-green-400" /> STARTER PACK ALREADY CLAIMED
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> CLAIM FREE STARTER BUNDLE
                </>
              )}
            </button>
            <div className="text-center text-[10px] text-slate-400">
              One-time new warrior starter gift grant. Enjoy your match!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
