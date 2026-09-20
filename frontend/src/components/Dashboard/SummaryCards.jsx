import React from 'react';
import { Shield, Anchor, Wind, Compass, Activity } from 'lucide-react';

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Sea Ice</span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-cyan-300">Available</p>
          <span className="text-[10px] text-slate-500">Updated: Today</span>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Icebergs</span>
          <Anchor className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-amber-300">324</p>
          <span className="text-[10px] text-slate-500">Observations</span>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Ocean Currents</span>
          <Compass className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-blue-300">Available</p>
          <span className="text-[10px] text-slate-500">Speed: 2.4 kts</span>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Wind Vector</span>
          <Wind className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-emerald-300">18.5 kt</p>
          <span className="text-[10px] text-slate-500">Direction: SSE</span>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Bathymetry</span>
          <Shield className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-cyan-300">580m</p>
          <span className="text-[10px] text-slate-500">Deepwater Floor</span>
        </div>
      </div>
    </div>
  );
}