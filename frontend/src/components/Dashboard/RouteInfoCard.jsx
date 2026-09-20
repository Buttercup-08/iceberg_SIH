import React from 'react';
import { Navigation, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export default function RouteInfoCard({ routePlan, onOpenRouteDetails }) {
  const handleClick = () => {
    playClickSound();
    if (onOpenRouteDetails) onOpenRouteDetails();
  };

  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between select-none">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center font-mono">
          <Navigation className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> ROUTE INFORMATION
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
          OPTIMIZED
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 my-2 font-mono">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Distance</span>
          <span className="text-base font-black text-cyan-300">{routePlan.distanceKm.toLocaleString()} km</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Est. Time</span>
          <span className="text-base font-black text-sky-300">{routePlan.estimatedTime}</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Risk Level</span>
          <span className="text-xs font-black text-emerald-400 flex items-center mt-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> {routePlan.riskLevel}
          </span>
        </div>
      </div>

      <button
        onClick={handleClick}
        className="w-full mt-3 py-2 btn-tactical rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1 transition"
      >
        <span>&gt;&gt; View Details</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

