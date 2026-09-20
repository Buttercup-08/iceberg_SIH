import React, { useState } from 'react';
import { 
  Layers, 
  List, 
  Snowflake, 
  Grid, 
  ShieldAlert, 
  Mountain, 
  TrendingUp, 
  Share2, 
  Waves, 
  Wind, 
  Database, 
  Navigation
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export default function MapLayerControls({ layers, onToggleLayer }) {
  const [activeTab, setActiveTab] = useState('layers'); // 'layers' | 'legend'

  const layerItems = [
    { key: 'seaIce', label: 'Sea Ice', icon: Snowflake },
    { key: 'navigationGrid', label: 'Navigation Grid', icon: Grid },
    { key: 'riskMap', label: 'Risk Map', icon: ShieldAlert },
    { key: 'icebergs', label: 'Icebergs', icon: Mountain },
    { key: 'trajectories', label: 'Trajectories', icon: TrendingUp },
    { key: 'predictedPaths', label: 'Predicted Paths', icon: Share2 },
    { key: 'oceanCurrents', label: 'Ocean Currents', icon: Waves },
    { key: 'windVectors', label: 'Wind Vectors', icon: Wind },
    { key: 'bathymetry', label: 'Bathymetry', icon: Database },
    { key: 'route', label: 'Route', icon: Navigation }
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] w-64 glass-panel rounded-2xl shadow-2xl overflow-hidden select-none font-mono text-xs border border-cyan-500/30">
      
      {/* TABS: Layers vs Legend */}
      <div className="flex border-b border-cyan-500/20 bg-slate-950/70">
        <button
          onClick={() => { playClickSound(); setActiveTab('layers'); }}
          className={`flex-1 py-2 text-center text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'layers'
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('legend'); }}
          className={`flex-1 py-2 text-center text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'legend'
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Legend</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'layers' ? (
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          {layerItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = !!layers[item.key];

            return (
              <div 
                key={item.key}
                onClick={() => onToggleLayer(item.key)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900/80 cursor-pointer transition"
              >
                <div className="flex items-center space-x-2 text-slate-300">
                  <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className={`text-[11px] ${isEnabled ? 'text-slate-200 font-semibold' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>

                {/* IOS-style toggle switch */}
                <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 shadow-md transform transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-3.5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LEGEND TAB */
        <div className="p-3.5 space-y-2.5 text-[11px] text-slate-300 max-h-72 overflow-y-auto">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]"></span>
            <span>Protected Route Path</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-1 border-t-2 border-dashed border-cyan-400"></span>
            <span>Autonomous Evasion Vector</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
            <span>Critical Iceberg Calving Zone</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
            <span>Moderate Pack Ice Hazard</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <span>POLARIS-X Drone Vessel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-400 text-[8px] flex items-center justify-center font-bold text-emerald-300">WP</span>
            <span>Tactical Waypoint Node</span>
          </div>
        </div>
      )}

    </div>
  );
}

