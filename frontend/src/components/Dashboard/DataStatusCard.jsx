import React from 'react';
import { Database, CheckCircle2, Check } from 'lucide-react';
import { DATA_STATUS_ITEMS } from '../../data/mockMissionData';

export default function DataStatusCard() {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between select-none">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center font-mono">
          <Database className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> DATA STATUS
        </h3>
        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
          6/6 FEEDS ONLINE
        </span>
      </div>

      <div className="divide-y divide-slate-800/80 my-1 font-mono text-xs">
        {DATA_STATUS_ITEMS.map((item) => (
          <div key={item.name} className="py-1.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">{item.name}</span>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Check className="w-3 h-3 mr-1" />
                {item.status}
              </span>
              <span className="text-[10px] text-slate-500 w-20 text-right">{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Latency: &lt; 120ms</span>
        <span className="text-cyan-400">Sentinel-1 / SAR Active</span>
      </div>
    </div>
  );
}

