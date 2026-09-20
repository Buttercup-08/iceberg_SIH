import React from 'react';

export default function IceConcentrationBar() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-panel px-3.5 py-2.5 rounded-xl border border-cyan-500/30 shadow-2xl select-none font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-1.5">
        <span>Ice Concentration</span>
        <span className="text-[10px] text-cyan-400">AMSR2 / MODIS</span>
      </div>

      {/* Gradient Bar (Navy -> Cyan -> Magenta/White) */}
      <div className="w-48 sm:w-56 h-2 rounded-full overflow-hidden bg-slate-950 border border-slate-700/60 shadow-inner">
        <div 
          className="h-full w-full"
          style={{
            background: 'linear-gradient(to right, #0284c7 0%, #06b6d4 30%, #38bdf8 60%, #ec4899 85%, #f8fafc 100%)'
          }}
        />
      </div>

      {/* Ticks */}
      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

