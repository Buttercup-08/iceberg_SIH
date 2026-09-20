import React from 'react';
import { Activity, Mountain, Snowflake, Compass, CloudSun, Clock } from 'lucide-react';
import { RECENT_ACTIVITIES } from '../../data/mockMissionData';

export default function RecentActivityCard() {
  const getIcon = (type) => {
    switch (type) {
      case 'iceberg':
        return <Mountain className="w-3.5 h-3.5 text-red-400" />;
      case 'ice':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-400" />;
      case 'route':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'forecast':
        return <CloudSun className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between select-none">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center font-mono">
          <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> RECENT ACTIVITY
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">LIVE FEED</span>
      </div>

      <div className="divide-y divide-slate-800/80 my-1 font-mono text-xs">
        {RECENT_ACTIVITIES.map((act) => (
          <div key={act.id} className="py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="p-1 rounded-md bg-slate-950/80 border border-slate-800">
                {getIcon(act.icon)}
              </span>
              <span className="text-slate-200 text-xs font-medium">{act.text}</span>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {act.distanceTime}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Automatic Refresh</span>
        <span className="text-emerald-400">Sync: 10s</span>
      </div>
    </div>
  );
}

