import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  Gauge, 
  Compass, 
  ShieldAlert, 
  Zap, 
  Waves, 
  Eye, 
  Disc, 
  Mountain,
  AlertTriangle,
  Sliders
} from 'lucide-react';

export default function AIDiagnosticsView({ telemetry, hazards }) {
  const [sonarAngle, setSonarAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSonarAngle(prev => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const bowStress = telemetry.hullStressBow || 42;
  const portStress = telemetry.hullStressPort || 28;
  const stbdStress = telemetry.hullStressStarboard || 31;
  const sternStress = telemetry.hullStressStern || 19;

  const getStressColor = (val) => {
    if (val > 75) return { text: 'text-red-400', bar: 'bg-gradient-to-r from-red-600 to-red-400' };
    if (val > 45) return { text: 'text-amber-400', bar: 'bg-gradient-to-r from-amber-600 to-amber-400' };
    return { text: 'text-emerald-400', bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400' };
  };

  return (
    <div className="flex-1 bg-slate-950/90 p-5 sm:p-7 overflow-y-auto font-mono text-slate-200 select-none cyber-grid">
      
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-cyan-400 flex items-center space-x-2 tracking-wider">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>3D HOLOGRAPHIC ICEBERG EVASION SIMULATOR & SONAR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time 3D Wireframe Ice Keel Bathymetry, Acoustic Sonar Scan, & Autonomous Avoidance Trajectories
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-3 sm:mt-0">
          <span className="px-3 py-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            AI EVASION CORE: ENGAGED
          </span>
          <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            PROXIMITY BUFFER: 5 NM
          </span>
        </div>
      </div>

      {/* 1. 3D HOLOGRAPHIC SIMULATION DISPLAY (Inspired by Image 2) */}
      <div className="glass-panel rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-cyan-500/20 pb-2">
          <span className="font-bold text-cyan-300 flex items-center">
            <Mountain className="w-4 h-4 mr-1.5 text-cyan-400" /> 3D ICE KEEL SUB-SURFACE TOPOLOGY & EVASION VECTOR
          </span>
          <span className="text-amber-400 font-bold flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" /> Proximity Radius 5 NM
          </span>
        </div>

        {/* 3D Isometric / Wireframe Canvas */}
        <div className="relative w-full h-80 rounded-xl bg-gradient-to-b from-[#031026] via-[#020917] to-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-2xl">
          
          {/* Concentric 3D Elliptical Sonar Radar Ground Rings */}
          <div className="absolute w-[680px] h-[340px] rounded-[50%] border border-cyan-500/20 pointer-events-none transform -rotate-12"></div>
          <div className="absolute w-[480px] h-[240px] rounded-[50%] border border-cyan-500/25 pointer-events-none transform -rotate-12"></div>
          <div className="absolute w-[280px] h-[140px] rounded-[50%] border border-cyan-500/30 pointer-events-none transform -rotate-12"></div>

          {/* Holographic Wireframe Iceberg Models (As in Image 2) */}
          <svg viewBox="0 0 700 320" className="w-full h-full">
            <defs>
              <linearGradient id="iceGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="70%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>

            {/* Submerged Keel Bathymetry Depth Lines */}
            <path d="M100 240 Q 250 290, 420 250 T 650 270" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <path d="M80 200 Q 240 250, 440 210 T 630 220" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />

            {/* PRIMARY LARGE ICEBERG WIREFRAME (Center-Left) */}
            <g transform="translate(180, 70)">
              {/* Facets */}
              <polygon points="100,20 40,90 80,170 140,170 180,90" fill="url(#iceGlow)" stroke="#38bdf8" strokeWidth="1.6" />
              <polygon points="100,20 140,170 180,90" fill="rgba(14, 116, 144, 0.3)" stroke="#7dd3fc" strokeWidth="1.2" />
              <polygon points="100,20 40,90 80,170" fill="rgba(6, 182, 212, 0.25)" stroke="#0284c7" strokeWidth="1.2" />
              <polygon points="100,20 80,170 140,170" fill="rgba(2, 132, 199, 0.35)" stroke="#38bdf8" strokeWidth="1.4" />
              {/* Internal wireframe vertices */}
              <line x1="100" y1="20" x2="110" y2="100" stroke="#bae6fd" strokeWidth="1" />
              <line x1="40" y1="90" x2="110" y2="100" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="180" y1="90" x2="110" y2="100" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="80" y1="170" x2="110" y2="100" stroke="#38bdf8" strokeWidth="1" />
              <line x1="140" y1="170" x2="110" y2="100" stroke="#38bdf8" strokeWidth="1" />
              {/* Vertices Nodes */}
              <circle cx="100" cy="20" r="3.5" fill="#e0f2fe" filter="drop-shadow(0 0 6px #38bdf8)" />
              <circle cx="40" cy="90" r="3" fill="#38bdf8" />
              <circle cx="180" cy="90" r="3" fill="#38bdf8" />
              <circle cx="110" cy="100" r="3.5" fill="#bae6fd" />
              <circle cx="80" cy="170" r="3" fill="#0284c7" />
              <circle cx="140" cy="170" r="3" fill="#0284c7" />
            </g>

            {/* SECONDARY ICEBERG (Upper-Right) */}
            <g transform="translate(420, 100)">
              <polygon points="60,10 20,55 45,100 85,100 110,55" fill="url(#iceGlow)" stroke="#38bdf8" strokeWidth="1.4" />
              <line x1="60" y1="10" x2="65" y2="60" stroke="#bae6fd" strokeWidth="1" />
              <line x1="20" y1="55" x2="65" y2="60" stroke="#7dd3fc" strokeWidth="1" />
              <line x1="110" y1="55" x2="65" y2="60" stroke="#7dd3fc" strokeWidth="1" />
              <circle cx="60" cy="10" r="3" fill="#e0f2fe" />
            </g>

            {/* GOLDEN AUTONOMOUS EVASION PATH (Curving around the iceberg as shown in Image 2) */}
            <path 
              d="M 60 260 Q 220 260, 260 220 T 360 170 Q 420 180, 480 150" 
              fill="none" 
              stroke="#facc15" 
              strokeWidth="4" 
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #facc15)"
            />
            {/* Evasion Vector Arrowhead */}
            <polygon points="480,150 465,142 468,155" fill="#facc15" />

            {/* DRONE VESSEL POSITION */}
            <circle cx="360" cy="170" r="6" fill="#06b6d4" filter="drop-shadow(0 0 10px #06b6d4)" />
            <circle cx="360" cy="170" r="14" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin-slow" />

            {/* Proximity Radius Badge Tag */}
            <g transform="translate(360, 130)">
              <rect x="-10" y="-14" width="130" height="22" rx="6" fill="rgba(239, 68, 68, 0.85)" stroke="#f87171" strokeWidth="1" />
              <text x="6" y="1" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">Proximity Radius 5 NM</text>
            </g>
          </svg>

          {/* Mini Real-Time Sonar Scope (Right Overlay as seen in Image 2) */}
          <div className="absolute right-4 bottom-4 w-28 h-28 rounded-full border border-cyan-500/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl">
            <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
            <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left bg-gradient-to-r from-cyan-400 to-transparent"
              style={{ transform: `rotate(${sonarAngle}deg)` }}
            ></div>
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
          </div>
        </div>
      </div>

      {/* 2. TOP GRID: ACOUSTIC SONAR + HULL STRAIN MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* LEFT: 360° FORWARD ACOUSTIC SONAR */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="flex items-center font-bold text-cyan-400">
              <Disc className="w-4 h-4 mr-1.5 animate-spin-slow" /> FORWARD ACOUSTIC SONAR (PULSE 12.5 kHz)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-cyan-500/20 text-cyan-300">
              RANGE: 3,000 METERS
            </span>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-cyan-500/40 bg-slate-950/90 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.2)] overflow-hidden my-2">
            <div className="absolute w-4/5 h-4/5 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-3/5 h-3/5 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-2/5 h-2/5 rounded-full border border-cyan-500/25"></div>
            <div className="absolute w-1/5 h-1/5 rounded-full border border-cyan-500/30"></div>

            <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
            <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
            <div className="absolute w-full h-[1px] bg-cyan-500/10 rotate-45"></div>
            <div className="absolute w-full h-[1px] bg-cyan-500/10 -rotate-45"></div>

            <div className="absolute top-[28%] left-[62%] w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping"></div>
            <div className="absolute top-[28%] left-[62%] w-2 h-2 rounded-full bg-red-400"></div>

            <div className="absolute bottom-[35%] left-[22%] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></div>
            <div className="absolute top-[48%] right-[18%] w-1.5 h-1.5 rounded-full bg-cyan-400"></div>

            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-sky-300 to-transparent"
              style={{
                transform: `rotate(${sonarAngle}deg)`,
                boxShadow: '0 0 14px #22d3ee'
              }}
            ></div>

            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] z-10 border border-slate-950"></div>
          </div>

          <div className="w-full flex items-center justify-around mt-4 text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div>TARGETS: <span className="text-red-400 font-bold">1 CRITICAL</span></div>
            <div>BEARING: <span className="text-cyan-300 font-bold">{telemetry.heading}°</span></div>
            <div>WATER DEPTH: <span className="text-blue-300 font-bold">{telemetry.waterDepth || 480}m</span></div>
          </div>
        </div>

        {/* RIGHT: HULL STRUCTURAL STRAIN SENSORS */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center font-bold text-cyan-400">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> HULL STRESS DYNAMICS & ICE IMPACT SENSORS
            </span>
            <span className="text-emerald-400 font-bold">HULL INTEGRITY: 98.4%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto py-2">
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">BOW ICE KNIFE</span>
                <span className={`font-bold ${getStressColor(bowStress).text}`}>{bowStress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${getStressColor(bowStress).bar}`} 
                  style={{ width: `${bowStress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5 block">Anti-Icing Thermal Coil: ACTIVE</span>
            </div>

            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">STERN / POD THRUSTERS</span>
                <span className={`font-bold ${getStressColor(sternStress).text}`}>{sternStress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${getStressColor(sternStress).bar}`} 
                  style={{ width: `${sternStress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5 block">Kort Nozzle Clearance: NOMINAL</span>
            </div>

            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">PORT BELT (ICE ARMOR)</span>
                <span className={`font-bold ${getStressColor(portStress).text}`}>{portStress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${getStressColor(portStress).bar}`} 
                  style={{ width: `${portStress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5 block">Strain Transducer: NOMINAL</span>
            </div>

            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">STARBOARD BELT</span>
                <span className={`font-bold ${getStressColor(stbdStress).text}`}>{stbdStress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${getStressColor(stbdStress).bar}`} 
                  style={{ width: `${stbdStress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5 block">Strain Transducer: NOMINAL</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div>HULL TEMP: <span className="text-blue-300 font-bold">{telemetry.hullTemp}°C</span></div>
            <div>WIND: <span className="text-cyan-300 font-bold">28 kts SSW</span></div>
            <div>ICE PACK: <span className="text-amber-300 font-bold">6/10ths</span></div>
          </div>
        </div>

      </div>

    </div>
  );
}
