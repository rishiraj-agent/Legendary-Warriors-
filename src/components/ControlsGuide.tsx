import React from 'react';
import { X, ChevronLeft, Crosshair, Shield, Trophy, Heart, Sparkles, Navigation } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface ControlsGuideProps {
  onClose: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans select-none">
      <div className="relative w-full max-w-4xl bg-[#14161b] border border-[#2b313d] rounded-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#2b313d] bg-[#0e1014]">
          <div className="flex items-center gap-2 text-yellow-500 font-black tracking-widest text-sm uppercase">
            <span className="w-2 h-2 bg-yellow-500 rotate-45" />
            <span>TUTORIAL</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 4 Tutorial Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-[#111317]">
          
          {/* Card 1: MOVE */}
          <div className="bg-[#181b22] border border-[#2c3340] rounded p-3.5 flex flex-col hover:border-yellow-500/50 transition group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-black italic text-base">1</span>
              <span className="text-white font-black text-xs uppercase tracking-wider">MOVE</span>
            </div>
            
            <div className="h-32 bg-[#0c0e12] rounded border border-white/5 relative overflow-hidden flex items-center justify-center mb-3">
              {/* Virtual Joystick Visual */}
              <div className="relative w-20 h-20 rounded-full border-2 border-slate-600/60 bg-black/60 flex items-center justify-center shadow-inner">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)] transform -translate-x-1 -translate-y-1" />
                <div className="absolute top-1 text-[8px] font-bold text-slate-500">▲</div>
                <div className="absolute bottom-1 text-[8px] font-bold text-slate-500">▼</div>
                <div className="absolute left-1 text-[8px] font-bold text-slate-500">◀</div>
                <div className="absolute right-1 text-[8px] font-bold text-slate-500">▶</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-medium leading-tight">
              Use joystick or W,A,S,D to move
            </div>
          </div>

          {/* Card 2: AIM & SHOOT */}
          <div className="bg-[#181b22] border border-[#2c3340] rounded p-3.5 flex flex-col hover:border-yellow-500/50 transition group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-black italic text-base">2</span>
              <span className="text-white font-black text-xs uppercase tracking-wider">AIM & SHOOT</span>
            </div>
            
            <div className="h-32 bg-[#0c0e12] rounded border border-white/5 relative overflow-hidden flex items-center justify-center mb-3">
              <div className="relative flex items-center justify-center">
                <Crosshair className="w-12 h-12 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <div className="absolute w-4 h-4 rounded-full border border-yellow-400 animate-ping opacity-60" />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-medium leading-tight">
              Drag to look, tap or click to shoot
            </div>
          </div>

          {/* Card 3: USE ITEMS */}
          <div className="bg-[#181b22] border border-[#2c3340] rounded p-3.5 flex flex-col hover:border-yellow-500/50 transition group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-black italic text-base">3</span>
              <span className="text-white font-black text-xs uppercase tracking-wider">USE ITEMS</span>
            </div>
            
            <div className="h-32 bg-[#0c0e12] rounded border border-white/5 relative overflow-hidden flex items-center justify-center gap-2 mb-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded bg-green-950/80 border border-green-500/50 flex items-center justify-center text-green-400 text-sm">
                  ➕
                </div>
                <span className="text-[8px] font-bold text-green-400">MEDKIT [E]</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-sm">
                  🛡️
                </div>
                <span className="text-[8px] font-bold text-cyan-400">GLOO [G]</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-medium leading-tight">
              Tap to use medkit & tactical items
            </div>
          </div>

          {/* Card 4: WIN */}
          <div className="bg-[#181b22] border border-[#2c3340] rounded p-3.5 flex flex-col hover:border-yellow-500/50 transition group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-black italic text-base">4</span>
              <span className="text-white font-black text-xs uppercase tracking-wider">WIN</span>
            </div>
            
            <div className="h-32 bg-[#0c0e12] rounded border border-white/5 relative overflow-hidden flex flex-col items-center justify-center mb-3">
              <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.7)] mb-1" />
              <span className="text-[9px] font-black italic text-yellow-300 tracking-wider">BOOYAH!</span>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-medium leading-tight">
              Outlast enemies & be the last one standing
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="p-4 bg-[#0e1014] border-t border-[#2b313d] flex justify-center">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="w-full max-w-sm py-3 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black uppercase tracking-widest text-base rounded shadow-[0_0_20px_rgba(234,179,8,0.4)] border border-yellow-300 transition active:scale-95"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
