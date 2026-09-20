import React from 'react';
import { X, ShieldAlert, Power, Sliders, AlertTriangle } from 'lucide-react';
import { playClickSound, playAlertKlaxon } from '../../utils/audio';

export default function ManualOverrideModal({
  isOpen,
  onClose,
  telemetry,
  toggleManualOverride,
  setHelm
}) {
  if (!isOpen) return null;

  const isManual = telemetry.mode === 'MANUAL_OVERRIDE';

  const handleToggle = () => {
    toggleManualOverride();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono select-none">
      <div className={`glass-panel rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-300 ${
        isManual 
          ? 'border-red-600 shadow-[0_0_50px_rgba(239,68,68,0.35)]' 
          : 'border-amber-600/70 shadow-[0_0_40px_rgba(245,158,11,0.25)]'
      }`}>
        
        {/* HEADER */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isManual ? 'bg-red-950/50 border-red-900/60 text-red-400' : 'bg-amber-950/40 border-amber-900/40 text-amber-400'
        }`}>
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <h3 className="font-black text-sm tracking-wider">
              {isManual ? 'EMERGENCY MANUAL HELM ENGAGED' : 'OVERRIDE AUTONOMOUS AI PILOT'}
            </h3>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 text-xs text-slate-200">
          
          <div className={`p-4 rounded-xl border ${
            isManual 
              ? 'bg-red-950/40 border-red-800/60 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
              : 'bg-amber-950/30 border-amber-800/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>TACTICAL FLIGHT-DECK PROTOCOL: DEFCON {isManual ? '1' : '2'}</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-300">
              {isManual 
                ? 'Vessel is currently under manual operator command. Autonomous collision avoidance algorithms have been suspended. All rudder, propulsion, and waypoint tracking inputs are under manual helm control.'
                : 'Engaging emergency override will disengage the Polaris-X Autonomous Evasion Core and escalate DEFCON to Level 1. Operator takes immediate responsibility for ice keel collision avoidance.'}
            </p>
          </div>

          {/* MODE TOGGLE BUTTON */}
          <button
            onClick={handleToggle}
            className={`w-full py-3.5 px-4 font-black rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-2xl active:scale-95 ${
              isManual
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400'
                : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] border border-red-400 animate-pulse'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isManual ? 'RE-ENGAGE AUTONOMOUS AI NAVIGATION' : 'CONFIRM EMERGENCY MANUAL OVERRIDE'}</span>
          </button>

          {/* MANUAL HELM CONTROLS */}
          {isManual && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="font-bold text-slate-300 flex items-center">
                <Sliders className="w-4 h-4 mr-1.5 text-cyan-400" /> TACTICAL HELM CONTROLS
              </h4>

              {/* Rudder */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Rudder Bearing Command:</span>
                  <span className="font-black text-cyan-300">
                    {telemetry.rudderAngle > 0 ? `+${telemetry.rudderAngle}° PORT` : telemetry.rudderAngle < 0 ? `${telemetry.rudderAngle}° STBD` : '0° MIDSHIPS'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-35" 
                  max="35" 
                  value={telemetry.rudderAngle || 0}
                  onChange={(e) => setHelm(Number(e.target.value), telemetry.throttle)}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>35° STBD</span>
                  <span>0° MID</span>
                  <span>35° PORT</span>
                </div>
              </div>

              {/* Throttle */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Main Propulsion Throttle:</span>
                  <span className="font-black text-amber-300">{telemetry.throttle || 65}% DEMAND</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={telemetry.throttle || 65}
                  onChange={(e) => setHelm(telemetry.rudderAngle, Number(e.target.value))}
                  className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>ALL STOP (0%)</span>
                  <span>CRUISE (65%)</span>
                  <span>FLANK (100%)</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
