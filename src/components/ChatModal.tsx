import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send, Users, Shield, Globe, Radio } from 'lucide-react';
import { UserProfileData } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface ChatModalProps {
  onClose: () => void;
  userProfile: UserProfileData;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  channel: 'world' | 'squad' | 'guild';
  time: string;
  isMe?: boolean;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  onClose,
  userProfile,
}) => {
  const [channel, setChannel] = useState<'world' | 'squad' | 'guild'>('world');
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Vortex_Prime', avatar: '👑', text: 'Anyone ready for Stage 3 High-Tech Fortress raid?', channel: 'world', time: '14:20' },
    { id: '2', sender: 'Ghost_Wolf', avatar: '🐺', text: 'Got the Cyber AWM sniper equipped, count me in!', channel: 'world', time: '14:21' },
    { id: '3', sender: 'Shadow_Ninja_99', avatar: '🥷', text: 'Guild check-ins are live, remember to claim bonus coins today.', channel: 'guild', time: '14:15' },
    { id: '4', sender: 'CyberQueen', avatar: '⚡', text: 'Watch out for enemy marksmen on the watchtowers!', channel: 'squad', time: '14:22' },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channel]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    soundEngine.playUiClick();

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: userProfile.playerName,
      avatar: userProfile.avatar || '⚔️',
      text: inputVal.trim(),
      channel: channel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');
  };

  const handleQuickCallout = (callout: string) => {
    soundEngine.playUiClick();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: userProfile.playerName,
      avatar: userProfile.avatar || '⚔️',
      text: `[TACTICAL CALLOUT] ${callout}`,
      channel: channel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const filteredMessages = messages.filter(m => m.channel === channel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-2xl bg-[#12161a] border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[560px] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d10] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                COMMS TRANSMITTER <span className="text-yellow-400 text-sm font-bold tracking-normal not-italic">// TACTICAL CHAT</span>
              </h2>
              <p className="text-xs text-slate-400">Live multi-channel squad and world combat communications</p>
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

        {/* Channel Selector */}
        <div className="flex items-center gap-2 px-6 py-2 bg-black/40 border-b border-white/5 text-xs font-bold">
          {[
            { id: 'world', label: 'WORLD', icon: Globe },
            { id: 'squad', label: 'SQUAD COMMS', icon: Radio },
            { id: 'guild', label: 'GUILD COMMS', icon: Shield },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => {
                soundEngine.playUiClick();
                setChannel(c.id as any);
              }}
              className={`px-3 py-1.5 rounded transition uppercase tracking-wider flex items-center gap-1.5 ${
                channel === c.id
                  ? 'bg-yellow-500 text-black font-black'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <c.icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          ))}
        </div>

        {/* Quick Callouts */}
        <div className="px-6 py-2 bg-black/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-[10px] font-bold">
          <span className="text-slate-400 whitespace-nowrap">QUICK CALLOUTS:</span>
          {['Enemies Spotted!', 'Need Medkit & Armor!', 'Deploying Gloo Wall!', 'Cover Me, Reloading!', 'Rush the Objective!'].map((co, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCallout(co)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-yellow-500/20 text-slate-300 hover:text-yellow-400 border border-white/10 hover:border-yellow-500/40 whitespace-nowrap transition"
            >
              {co}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#14191f] to-[#0d1115] flex flex-col gap-3">
          {filteredMessages.map(m => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm shrink-0">
                {m.avatar}
              </div>

              <div className={`max-w-[75%] rounded-lg p-3 ${
                m.isMe
                  ? 'bg-gradient-to-r from-yellow-600/80 to-yellow-500/90 text-black font-semibold'
                  : 'bg-black/60 border border-white/10 text-white'
              }`}>
                <div className={`flex items-center gap-2 text-[10px] mb-1 ${m.isMe ? 'text-black/70 justify-end' : 'text-slate-400'}`}>
                  <span className="font-bold">{m.sender}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div className="text-xs leading-relaxed break-words">{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0a0d10] border-t border-slate-700/60 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Broadcast message to ${channel.toUpperCase()} channel...`}
            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-400 transition"
          />
          <button
            onClick={handleSend}
            className="px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
          >
            <Send className="w-4 h-4" /> SEND
          </button>
        </div>
      </div>
    </div>
  );
};
