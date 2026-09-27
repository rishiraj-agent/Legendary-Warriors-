import React, { useState } from 'react';
import { X, Calendar, Zap, Sparkles, Check, Clock, Trophy, Gift, ArrowRight } from 'lucide-react';
import { GameEvent, UserProfileData } from '../types';
import { INITIAL_EVENTS } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface EventsModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
  onUpdateProfile: (profile: Partial<UserProfileData>) => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [events, setEvents] = useState<GameEvent[]>(() => {
    const saved = localStorage.getItem('lw_events_data');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');

  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  const handleClaimMilestone = (milestoneIndex: number) => {
    if (!activeEvent || activeEvent.milestones[milestoneIndex].isClaimed) return;
    if (activeEvent.currentScore < activeEvent.milestones[milestoneIndex].scoreNeeded) return;

    soundEngine.playUiReward();
    const updatedEvents = events.map(e => {
      if (e.id === activeEvent.id) {
        const newM = [...e.milestones];
        newM[milestoneIndex] = { ...newM[milestoneIndex], isClaimed: true };
        return { ...e, milestones: newM };
      }
      return e;
    });

    setEvents(updatedEvents);
    localStorage.setItem('lw_events_data', JSON.stringify(updatedEvents));

    // Grant bonus
    onUpdateProfile({
      coins: userProfile.coins + 1000,
      diamonds: userProfile.diamonds + 30,
      xp: userProfile.xp + 500,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-4xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[580px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                WARRIOR EVENTS <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// SEASONAL TOURNAMENTS</span>
              </h2>
              <p className="text-xs text-slate-400">Participate in limited-time combat operations for exclusive awards</p>
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
        <div className="flex-1 flex overflow-hidden">
          {/* Event Selector Column */}
          <div className="w-72 border-r border-slate-700/50 p-4 overflow-y-auto flex flex-col gap-2.5 bg-[#0d1115]">
            {events.map(ev => {
              const isSelected = ev.id === activeEvent.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setSelectedEventId(ev.id);
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500/20 to-slate-800 border-yellow-400/80 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                      : 'bg-black/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ENDS IN {ev.endsInDays} DAYS
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-black text-white">{ev.title}</h3>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    Event Score: <span className="text-white font-bold">{ev.currentScore} pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Event Detail */}
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115] flex flex-col justify-between">
            <div>
              {/* Event Hero Banner */}
              <div className={`p-5 rounded-lg border border-cyan-500/30 bg-gradient-to-r ${activeEvent.bannerColor} mb-5 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-1">
                    ACTIVE SPECIAL EVENT
                  </div>
                  <h1 className="text-2xl font-black italic tracking-wide text-white">{activeEvent.title}</h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">{activeEvent.description}</p>
                </div>
              </div>

              {/* Event Milestones */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> BATTLE POINT MILESTONES (YOUR SCORE: {activeEvent.currentScore} PTS)
                </h3>

                <div className="flex flex-col gap-2.5">
                  {activeEvent.milestones.map((ms, idx) => {
                    const isUnlocked = activeEvent.currentScore >= ms.scoreNeeded;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center justify-between transition ${
                          ms.isClaimed
                            ? 'bg-black/30 border-white/5 opacity-60'
                            : isUnlocked
                            ? 'bg-yellow-500/10 border-yellow-500/50'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            ms.isClaimed ? 'bg-green-600/30 text-green-400' : isUnlocked ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{ms.rewardLabel}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Requires {ms.scoreNeeded} Battle Points</div>
                          </div>
                        </div>

                        <button
                          disabled={!isUnlocked || ms.isClaimed}
                          onClick={() => handleClaimMilestone(idx)}
                          className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${
                            ms.isClaimed
                              ? 'bg-slate-800 text-slate-500'
                              : isUnlocked
                              ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                              : 'bg-white/5 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {ms.isClaimed ? 'CLAIMED' : isUnlocked ? 'CLAIM' : 'LOCKED'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 py-2 border-t border-white/10">
              Play Outpost Assault or Cyber Arena to earn more event points!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
