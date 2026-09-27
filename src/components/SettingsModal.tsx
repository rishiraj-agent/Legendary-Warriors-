import React, { useState } from 'react';
import { X } from 'lucide-react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'graphics' | 'sensitivity' | 'gyro' | 'audio' | 'controls'>('graphics');

  const tabs = [
    { id: 'graphics', label: 'Graphics' },
    { id: 'sensitivity', label: 'Sensitivity' },
    { id: 'gyro', label: 'Gyroscope & Haptics' },
    { id: 'audio', label: 'Sound & Audio' },
    { id: 'controls', label: 'Controls / HUD' },
  ] as const;

  const renderToggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <div className="text-xs font-bold text-slate-300 uppercase">{label}</div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`w-16 py-1.5 text-[10px] font-black uppercase transition ${
            value ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/50 text-slate-500 hover:text-slate-300 border border-white/10'
          }`}
        >
          ON
        </button>
        <button
          onClick={() => onChange(false)}
          className={`w-16 py-1.5 text-[10px] font-black uppercase transition ${
            !value ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/50 text-slate-500 hover:text-slate-300 border border-white/10'
          }`}
        >
          OFF
        </button>
      </div>
    </div>
  );

  const renderMultiSelect = (label: string, value: any, options: {label: string, val: any}[], onChange: (v: any) => void) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 gap-2">
      <div className="text-xs font-bold text-slate-300 uppercase">{label}</div>
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.val)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase transition whitespace-nowrap ${
              value === opt.val ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/50 text-slate-500 hover:text-slate-300 border border-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSlider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, displayMultiplier = 100) => (
    <div className="py-3 border-b border-white/5">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-300 uppercase">{label}</div>
        <div className="text-xs font-mono font-bold text-yellow-500">{Math.round(value * displayMultiplier)}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:rotate-45 cursor-pointer"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto font-sans">
      <div className="relative w-full max-w-4xl bg-[#111] border border-white/10 flex flex-col md:flex-row h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Close Button (Absolute Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-[#141415] border-r border-white/5 flex flex-col">
          <div className="p-6">
            <h2 className="text-xl font-black text-white tracking-widest uppercase italic">
              SETTINGS
            </h2>
            <div className="h-1 w-12 bg-yellow-500 mt-2"></div>
          </div>
          <div className="flex md:flex-col gap-1 px-4 pb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-4 py-3 font-bold uppercase tracking-wider text-xs transition ${
                  activeTab === tab.id 
                    ? 'bg-yellow-500/10 text-yellow-500 border-l-2 border-yellow-500' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-white/5 flex flex-col gap-2">
            <button
              onClick={() => alert('Customer Support: support@legendarywarriors.tactical')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold uppercase rounded border border-white/10 transition"
            >
              Customer Support
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset local progress & session?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-[11px] font-bold uppercase rounded border border-red-500/30 transition"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0f0f11]">
          {activeTab === 'graphics' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-white/10 pb-2">Graphics Settings</h3>
              
              {renderMultiSelect('Quality Preset', settings.graphicsQuality, [
                { label: 'Smooth', val: 'low' },
                { label: 'Standard', val: 'medium' },
                { label: 'Ultra', val: 'high' },
                { label: 'Extreme UE5', val: 'ultra' },
              ], v => onUpdateSettings({ graphicsQuality: v }))}
              
              {renderMultiSelect('FPS Cap', settings.fpsCap, [
                { label: '30 FPS', val: 30 },
                { label: '60 FPS', val: 60 },
                { label: '120 FPS', val: 120 },
                { label: 'Uncapped', val: 'uncapped' },
              ], v => onUpdateSettings({ fpsCap: v }))}

              {renderMultiSelect('Shadows', settings.shadows, [
                { label: 'Low', val: 'low' },
                { label: 'High', val: 'high' },
                { label: 'Cinematic', val: 'cinematic' },
              ], v => onUpdateSettings({ shadows: v }))}

              {renderMultiSelect('Anti-Aliasing', settings.antiAliasing, [
                { label: 'None', val: 'none' },
                { label: 'FXAA', val: 'fxaa' },
                { label: 'TAA', val: 'taa' },
              ], v => onUpdateSettings({ antiAliasing: v }))}
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-white/10 pb-2">Sensitivity</h3>
              {renderSlider('General / Camera', settings.mouseSensitivity, 0.0005, 0.01, 0.0005, v => onUpdateSettings({ mouseSensitivity: v }), 10000)}
              {renderSlider('Red Dot', settings.redDotSensitivity, 0.0005, 0.01, 0.0005, v => onUpdateSettings({ redDotSensitivity: v }), 10000)}
              {renderSlider('2x Scope', settings.scope2xSensitivity, 0.0001, 0.005, 0.0001, v => onUpdateSettings({ scope2xSensitivity: v }), 10000)}
              {renderSlider('4x Scope', settings.scope4xSensitivity, 0.0001, 0.005, 0.0001, v => onUpdateSettings({ scope4xSensitivity: v }), 10000)}
              {renderSlider('Sniper Scope', settings.sniperSensitivity, 0.0001, 0.003, 0.0001, v => onUpdateSettings({ sniperSensitivity: v }), 10000)}
              {renderSlider('Free Look (360°)', settings.freeLookSensitivity, 0.001, 0.015, 0.001, v => onUpdateSettings({ freeLookSensitivity: v }), 10000)}
            </div>
          )}

          {activeTab === 'gyro' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-white/10 pb-2">Gyroscope & Haptics</h3>
              
              {renderMultiSelect('Gyroscope Aiming Mode', settings.gyroscopeMode, [
                { label: 'Disabled', val: 'disabled' },
                { label: 'Scope Only', val: 'scope_only' },
                { label: 'Always On', val: 'always_on' },
              ], v => onUpdateSettings({ gyroscopeMode: v }))}

              {renderSlider('Gyro Pitch Sensitivity (Vertical)', settings.gyroPitchSensitivity ?? 0.0035, 0.0005, 0.01, 0.0005, v => onUpdateSettings({ gyroPitchSensitivity: v }), 10000)}
              {renderSlider('Gyro Roll Sensitivity (Horizontal)', settings.gyroRollSensitivity ?? 0.0035, 0.0005, 0.01, 0.0005, v => onUpdateSettings({ gyroRollSensitivity: v }), 10000)}

              <div className="pt-4 pb-2 border-t border-white/10 mt-4">
                <h4 className="text-xs font-black uppercase text-yellow-400 mb-2">Haptic Vibration System</h4>
                {renderToggle('Haptic Feedback (Firing / Damage)', settings.hapticFeedback ?? true, v => onUpdateSettings({ hapticFeedback: v }))}
                {renderMultiSelect('Haptic Pulse Intensity', settings.hapticIntensity ?? 'medium', [
                  { label: 'Soft (Light)', val: 'soft' },
                  { label: 'Medium (Standard)', val: 'medium' },
                  { label: 'Heavy (Tactile)', val: 'heavy' },
                ], v => onUpdateSettings({ hapticIntensity: v }))}
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-white/10 pb-2">Sound & Audio</h3>
              {renderSlider('Master Volume', settings.soundVolume, 0, 1, 0.05, v => onUpdateSettings({ soundVolume: v }))}
              {renderSlider('Music Volume', settings.musicVolume, 0, 1, 0.05, v => onUpdateSettings({ musicVolume: v }))}
              {renderSlider('SFX (Guns / Impacts)', settings.soundVolume, 0, 1, 0.05, v => onUpdateSettings({ soundVolume: v }))}
              {renderToggle('Voice Chat', settings.voiceChat, v => onUpdateSettings({ voiceChat: v }))}
              {renderToggle('Spatial 3D Audio', settings.spatialAudio, v => onUpdateSettings({ spatialAudio: v }))}
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-white/10 pb-2">Controls / HUD</h3>
              
              <div className="py-4 flex items-center justify-between bg-white/5 px-4 border border-white/10 mb-4">
                <div>
                  <div className="text-sm font-bold text-white uppercase">Custom HUD</div>
                  <div className="text-[10px] text-slate-400">Edit layout, resize buttons and opacity</div>
                </div>
                <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase text-white transition border border-white/20">
                  Edit Layout
                </button>
              </div>

              {renderToggle('Left Fire Button (Fixed Scope Trigger)', settings.leftFireButtonEnabled ?? true, v => onUpdateSettings({ leftFireButtonEnabled: v }))}
              {renderToggle('Floating Dynamic Joystick', settings.floatingJoystickEnabled ?? true, v => onUpdateSettings({ floatingJoystickEnabled: v }))}
              {renderToggle('Auto Shoot (Accessibility)', settings.autoShoot, v => onUpdateSettings({ autoShoot: v }))}
              {renderToggle('Aim Assist', settings.aimAssist, v => onUpdateSettings({ aimAssist: v }))}
              {renderToggle('Drag-to-Aim (Mobile Touch Camera)', settings.dragToAim, v => onUpdateSettings({ dragToAim: v }))}
              {renderToggle('Auto Pickup Items', settings.autoPickup, v => onUpdateSettings({ autoPickup: v }))}
              {renderToggle('Quick Weapon Switch', settings.quickWeaponSwitch, v => onUpdateSettings({ quickWeaponSwitch: v }))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
