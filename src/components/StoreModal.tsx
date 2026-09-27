import React, { useState } from 'react';
import { X, ShoppingCart, Sparkles, Check, Package, Flame, Zap, Shield, Crown, User, AlertCircle } from 'lucide-react';
import { StoreItem, UserProfileData } from '../types';
import { INITIAL_STORE_ITEMS } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface StoreModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
  onOpenTopUp: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
  onOpenTopUp,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapon_skin' | 'outfit' | 'gloowall_skin' | 'bundle' | 'crate'>('all');
  const [storeItems, setStoreItems] = useState<StoreItem[]>(() => {
    const saved = localStorage.getItem('lw_store_items');
    return saved ? JSON.parse(saved) : INITIAL_STORE_ITEMS;
  });
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredItems = storeItems.filter(item => activeTab === 'all' || item.category === activeTab);

  const showToast = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePurchase = (item: StoreItem) => {
    soundEngine.playUiClick();

    if (item.priceDiamonds) {
      if (userProfile.diamonds < item.priceDiamonds) {
        soundEngine.playUiClick();
        showToast('Insufficient Diamonds! Top up via the Diamond store.', 'error');
        return;
      }
      const newDiamonds = userProfile.diamonds - item.priceDiamonds;
      const newOwned = [...userProfile.ownedSkins, item.id];
      onUpdateProfile({ diamonds: newDiamonds, ownedSkins: newOwned });
      soundEngine.playUiPurchase();
      showToast(`Purchased ${item.name}!`, 'success');
    } else if (item.priceCoins) {
      if (userProfile.coins < item.priceCoins) {
        soundEngine.playUiClick();
        showToast('Insufficient Coins! Complete missions or level up to earn more.', 'error');
        return;
      }
      const newCoins = userProfile.coins - item.priceCoins;
      const newOwned = [...userProfile.ownedSkins, item.id];
      onUpdateProfile({ coins: newCoins, ownedSkins: newOwned });
      soundEngine.playUiPurchase();
      showToast(`Purchased ${item.name}!`, 'success');
    }
  };

  const handleEquip = (item: StoreItem) => {
    soundEngine.playUiEquip();
    if (item.weaponTargetId) {
      onUpdateProfile({
        equippedWeaponSkins: {
          ...userProfile.equippedWeaponSkins,
          [item.weaponTargetId]: item.id,
        },
      });
      showToast(`Equipped ${item.name}!`, 'success');
    } else {
      showToast(`Equipped ${item.name}!`, 'success');
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300';
      case 'epic':
        return 'bg-purple-900/80 text-purple-200 border-purple-500';
      case 'rare':
        return 'bg-blue-900/80 text-blue-200 border-blue-500';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[640px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                TACTICAL STORE <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// BLACK MARKET</span>
              </h2>
              <p className="text-xs text-slate-400">Acquire exclusive weapon blueprints, legendary skins & combat gear</p>
            </div>
          </div>

          {/* User Currency Balances in Store */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-500/30">
              <div className="w-4 h-4 rounded-full bg-yellow-500 text-black font-black text-[10px] flex items-center justify-center">C</div>
              <span className="font-mono font-bold text-xs text-white">{userProfile.coins.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-blue-500/30">
              <div className="w-4 h-4 rounded-full bg-blue-500 text-white font-black text-[10px] flex items-center justify-center">D</div>
              <span className="font-mono font-bold text-xs text-white">{userProfile.diamonds.toLocaleString()}</span>
              <button
                onClick={onOpenTopUp}
                className="w-4 h-4 rounded bg-blue-500/30 hover:bg-blue-500 text-white text-xs flex items-center justify-center transition font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded-lg ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/40 border-b border-white/5 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: 'FEATURED' },
            { id: 'weapon_skin', label: 'WEAPON SKINS' },
            { id: 'gloowall_skin', label: 'GLOO WALLS' },
            { id: 'outfit', label: 'OUTFITS' },
            { id: 'bundle', label: 'BUNDLES' },
            { id: 'crate', label: 'CRATES' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-6 py-2 text-xs font-bold flex items-center justify-between transition-all ${
              notification.type === 'success' ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'
            }`}
          >
            <span>{notification.text}</span>
            <X className="w-4 h-4 cursor-pointer" onClick={() => setNotification(null)} />
          </div>
        )}

        {/* Items Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const isOwned = userProfile.ownedSkins.includes(item.id);
              const isEquipped = item.weaponTargetId
                ? userProfile.equippedWeaponSkins[item.weaponTargetId] === item.id
                : false;

              return (
                <div
                  key={item.id}
                  className="bg-black/50 border border-slate-700/60 rounded-lg p-4 flex flex-col justify-between hover:border-yellow-400/60 transition group hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden"
                >
                  {/* Top rarity & category */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getRarityBadge(item.rarity)}`}>
                        {item.rarity}
                      </span>
                      {item.bonusStat && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30">
                          {item.bonusStat}
                        </span>
                      )}
                    </div>

                    {/* Preview Box */}
                    <div
                      className="h-28 rounded-lg mb-3 flex flex-col items-center justify-center relative overflow-hidden border border-white/5 group-hover:border-white/20 transition"
                      style={{
                        background: `radial-gradient(circle at center, ${item.previewColor}33 0%, rgba(10,15,20,0.8) 80%)`,
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${item.previewColor}44`, border: `2px solid ${item.previewColor}` }}
                      >
                        {item.category === 'weapon_skin' ? (
                          <Flame className="w-6 h-6" style={{ color: item.previewColor }} />
                        ) : item.category === 'gloowall_skin' ? (
                          <Shield className="w-6 h-6" style={{ color: item.previewColor }} />
                        ) : item.category === 'bundle' ? (
                          <Crown className="w-6 h-6" style={{ color: item.previewColor }} />
                        ) : item.category === 'crate' ? (
                          <Package className="w-6 h-6" style={{ color: item.previewColor }} />
                        ) : (
                          <User className="w-6 h-6" style={{ color: item.previewColor }} />
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Price / Action Button */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    {isOwned ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className={`w-full py-2 rounded font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                          isEquipped
                            ? 'bg-green-500/20 border border-green-500/60 text-green-400'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </>
                        ) : (
                          'EQUIP'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        className="w-full py-2 rounded font-black text-xs uppercase tracking-wider bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.3)] transition flex items-center justify-center gap-2 active:scale-95"
                      >
                        {item.priceDiamonds ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">D</div>
                            <span>{item.priceDiamonds} DIAMONDS</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full bg-black text-yellow-400 font-bold text-[9px] flex items-center justify-center">C</div>
                            <span>{item.priceCoins?.toLocaleString()} COINS</span>
                          </>
                        )}
                      </button>
                    )}
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
