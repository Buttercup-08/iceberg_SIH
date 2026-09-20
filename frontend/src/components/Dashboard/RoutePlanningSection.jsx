import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Sparkles, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Sliders,
  Compass,
  Mountain
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export default function RoutePlanningSection({
  routePlan,
  onOptimizeRoute,
  selectedIceberg,
  onShowIcebergOnMap
}) {
  const [step, setStep] = useState(1);
  const [startLoc, setStartLoc] = useState(routePlan.startLocation || '-67.5700, -68.1300');
  const [destLoc, setDestLoc] = useState(routePlan.destination || '-65.5800, -65.4000');
  const [mode, setMode] = useState(routePlan.routingMode || 'Safe (Low Risk)');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = (e) => {
    e.preventDefault();
    playClickSound();
    setIsOptimizing(true);
    setTimeout(() => {
      onOptimizeRoute(startLoc, destLoc, mode);
      setIsOptimizing(false);
      setStep(3);
    }, 600);
  };

  const handleClear = () => {
    playClickSound();
    setStartLoc('-67.5700, -68.1300');
    setDestLoc('-65.5800, -65.4000');
    setStep(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 select-none font-mono">
      
      {/* 1. ROUTE PLANNING INPUT CONSOLE (4 cols) */}
      <div className="lg:col-span-4 glass-panel p-4 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> ROUTE PLANNING
            </h3>
            <span className="text-[10px] text-slate-500">AI TRAJECTORY</span>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mb-4 text-[10px]">
            <button
              onClick={() => setStep(1)}
              className={`py-1 rounded-lg border text-center transition ${
                step === 1 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              1. Set Route
            </button>
            <button
              onClick={() => setStep(2)}
              className={`py-1 rounded-lg border text-center transition ${
                step === 2 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              2. Parameters
            </button>
            <button
              onClick={() => setStep(3)}
              className={`py-1 rounded-lg border text-center transition ${
                step === 3 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              3. Results
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleOptimize} className="space-y-3 text-xs">
            {/* Start Location */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Start Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={startLoc}
                  onChange={(e) => setStartLoc(e.target.value)}
                  className="w-full bg-slate-950 pl-3 pr-8 py-2 text-xs text-cyan-300 border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400"
                />
                <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Destination
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destLoc}
                  onChange={(e) => setDestLoc(e.target.value)}
                  className="w-full bg-slate-950 pl-3 pr-8 py-2 text-xs text-cyan-300 border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400"
                />
                <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Routing Mode */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Routing Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs text-cyan-300 border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400"
              >
                <option value="Safe (Low Risk)">Safe (Low Risk)</option>
                <option value="Fastest Transit">Fastest Transit</option>
                <option value="Iceberg Evasion Direct">Iceberg Evasion Direct</option>
                <option value="Fuel Optimized">Fuel Optimized</option>
              </select>
            </div>

            {/* Optimize Button */}
            <button
              type="submit"
              disabled={isOptimizing}
              className="w-full mt-3 py-2.5 btn-tactical-primary rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className={`w-4 h-4 text-slate-950 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'COMPUTING ROUTE...' : '✨ Optimize Route'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. ROUTE RESULTS CARD (4 cols) */}
      <div className="lg:col-span-4 glass-panel p-4 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
              <Navigation className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> ROUTE RESULTS
            </h3>
            <button 
              onClick={handleClear}
              className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Distance</span>
              <span className="text-sm font-black text-cyan-300">{routePlan.distanceKm.toLocaleString()} km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Estimated Time</span>
              <span className="text-sm font-black text-sky-300">{routePlan.estimatedTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Total Risk</span>
              <span className="text-xs font-black text-emerald-400 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" /> {routePlan.riskLevel}
              </span>
            </div>
          </div>

          {/* Mini Antarctic Route Risk Graphic */}
          <div className="relative w-full h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Stylized continent outline */}
            <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
              <path 
                d="M30 60 Q 50 20, 100 30 T 170 50 Q 180 90, 130 100 T 50 90 Z" 
                fill="#0f172a" 
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              {/* Risk paths */}
              <path d="M40 75 Q 80 50, 120 40 T 165 30" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M40 75 Q 90 70, 130 55 T 165 30" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M40 75 Q 70 85, 110 65 T 165 30" fill="none" stroke="#eab308" strokeWidth="2.5" />
              
              {/* Waypoint nodes */}
              <circle cx="40" cy="75" r="3" fill="#06b6d4" />
              <circle cx="165" cy="30" r="3" fill="#10b981" />
            </svg>

            {/* Mini Legend Overlay */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-[9px] bg-slate-950/90 px-2 py-1 rounded-md border border-slate-800">
              <span className="flex items-center"><span className="w-2 h-0.5 bg-yellow-400 mr-1"></span> Route</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span> High</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1"></span> Med</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span> Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ICEBERG DETAILS PANEL (4 cols) */}
      <div className="lg:col-span-4 glass-panel p-4 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
              <Mountain className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> ICEBERG DETAILS
            </h3>
            <span className="text-[10px] text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
              {selectedIceberg?.id || 'IC-0427'}
            </span>
          </div>

          {/* Iceberg Graphic / 3D Hologram Preview */}
          <div className="relative w-full h-24 rounded-xl bg-gradient-to-b from-cyan-950/40 to-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center my-2 shadow-inner">
            <svg viewBox="0 0 160 80" className="w-40 h-20">
              {/* Stylized Iceberg Wireframe (similar to Image 2) */}
              <polygon points="80,10 50,45 65,70 95,70 115,45" fill="rgba(6, 182, 212, 0.2)" stroke="#22d3ee" strokeWidth="1.2" />
              <polygon points="80,10 65,70 95,70" fill="rgba(14, 116, 144, 0.3)" stroke="#38bdf8" strokeWidth="0.8" />
              <line x1="80" y1="10" x2="65" y2="70" stroke="#a5f3fc" strokeWidth="1" />
              <line x1="80" y1="10" x2="95" y2="70" stroke="#38bdf8" strokeWidth="1" />
              <line x1="50" y1="45" x2="115" y2="45" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
              {/* Sea Waterline */}
              <line x1="10" y1="45" x2="150" y2="45" stroke="#0ea5e9" strokeWidth="1" opacity="0.6" />
            </svg>
            <div className="absolute top-1.5 right-2 text-[9px] text-cyan-400 font-bold">
              3D RADAR RETURN
            </div>
          </div>

          {/* Spec details table */}
          <div className="divide-y divide-slate-800/80 text-[11px]">
            <div className="py-1 flex justify-between">
              <span className="text-slate-400">Observed:</span>
              <span className="text-slate-200">{selectedIceberg?.observedAt || '15 Jan 2024, 08:32 UTC'}</span>
            </div>
            <div className="py-1 flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="text-cyan-300 font-bold">{selectedIceberg?.displayCoords || '-66.85, -65.20'}</span>
            </div>
            <div className="py-1 flex justify-between">
              <span className="text-slate-400">Size:</span>
              <span className="text-slate-200">{selectedIceberg?.size || '120 x 80 m'}</span>
            </div>
            <div className="py-1 flex justify-between">
              <span className="text-slate-400">Source:</span>
              <span className="text-slate-200">{selectedIceberg?.source || 'Satellite (SENTINEL-1)'}</span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-400">Valid / Confirmed:</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Yes
              </span>
            </div>
            <div className="py-1 flex justify-between">
              <span className="text-slate-400">Trajectory:</span>
              <span className="text-slate-200">{selectedIceberg?.trajectoryPoints || '3 points (last 24h)'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { playClickSound(); if (onShowIcebergOnMap) onShowIcebergOnMap(selectedIceberg); }}
          className="w-full mt-3 py-2 btn-tactical rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
        >
          <span>&gt;&gt; Show on Map</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}

