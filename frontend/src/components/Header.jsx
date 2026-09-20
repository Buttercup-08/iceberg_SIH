import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  Radio, 
  Cpu, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Bell,
  Settings,
  Search,
  User,
  Clock
} from 'lucide-react';
import { isAudioEnabled, toggleAudio, playClickSound } from '../utils/audio';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  telemetry 
}) {
  const [soundOn, setSoundOn] = useState(isAudioEnabled());
  const [utcTime, setUtcTime] = useState('15 Jan 2024  14:32 UTC');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toISOString().substring(11, 16) + ' UTC';
      setUtcTime(`${dateStr}  ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSoundToggle = () => {
    const next = toggleAudio();
    setSoundOn(next);
    if (next) playClickSound();
  };

  const isEmergency = telemetry.mode === 'MANUAL_OVERRIDE' || telemetry.defcon === 1;

  return (
    <header className={`relative z-50 flex items-center justify-between px-5 py-3 glass-header select-none transition-colors ${
      isEmergency ? 'border-b-red-600/50 bg-red-950/20' : 'border-b-cyan-500/20'
    }`}>
      
      {/* 1. BRAND IDENTITY (As in Image 1) */}
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl border transition-all ${
          isEmergency 
            ? 'bg-red-500/20 border-red-400/50 text-red-400 animate-pulse' 
            : 'bg-cyan-500/10 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
        }`}>
          <Anchor className="w-5 h-5 animate-pulse" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-cyan-300 font-mono">
              POLARIS-GCS
            </h1>
            {isEmergency && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-red-600 text-white rounded animate-pulse">
                OVERRIDE
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 tracking-wide hidden sm:block">
            Antarctic Autonomous Maritime Operations & AI Navigation
          </p>
        </div>
      </div>

      {/* 2. RIGHT TELEMETRY & SYSTEM ICONS (As in Image 1) */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        
        {/* DEFCON Status Pill */}
        <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
          isEmergency
            ? 'bg-red-950/60 border-red-500/60 text-red-300 animate-pulse'
            : 'bg-slate-950/70 border-cyan-500/30 text-amber-400'
        }`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">DEFCON {telemetry.defcon || 2}</span>
        </div>

        {/* SATCOM Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[10px] font-bold">{telemetry.satcomQuality || 99.8}%</span>
        </div>

        {/* Tactical Sound Toggle */}
        <button
          onClick={handleSoundToggle}
          title={soundOn ? 'Mute Audio' : 'Unmute Audio'}
          className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Notification Bell */}
        <button 
          onClick={() => playClickSound()}
          className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-cyan-500/20 text-slate-400 hover:text-cyan-300 transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        </button>

        {/* Timestamp */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950/70 px-3 py-1 rounded-lg border border-cyan-500/20 text-slate-300 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{utcTime}</span>
        </div>

        {/* User Profile Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)] border border-cyan-300">
          A
        </div>

      </div>
    </header>
  );
}
