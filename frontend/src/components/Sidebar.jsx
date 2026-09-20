import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Layers, 
  Navigation, 
  Mountain, 
  CloudSun, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Compass, 
  Power, 
  ShieldAlert, 
  ShieldCheck,
  Activity, 
  Sliders,
  Anchor
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function Sidebar({
  activeTab,
  setActiveTab,
  telemetry,
  radarActive,
  toggleRadar,
  onOpenWaypoints,
  onOpenOverride,
  toggleManualOverride,
  setHelm
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [tacticalOpen, setTacticalOpen] = useState(false);

  const isEmergency = telemetry.mode === 'MANUAL_OVERRIDE' || telemetry.defcon === 1;
  const isLandConflict = telemetry.geoStatus && !telemetry.geoStatus.isNavigableWater;

  const handleNavClick = (tab) => {
    playClickSound();
    setActiveTab(tab);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'layers', label: 'Layers', icon: Layers, isDropdown: true },
    { id: 'route-planning', label: 'Route Planning', icon: Navigation },
    { id: 'icebergs', label: 'Icebergs', icon: Mountain },
    { id: 'forecasts', label: 'Forecasts', icon: CloudSun },
    { id: 'data-status', label: 'Data Status', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className={`relative z-40 flex flex-col glass-panel transition-all duration-300 border-r border-cyan-500/20 shadow-2xl select-none font-mono ${
      collapsed ? 'w-16 p-2' : 'w-60 sm:w-64 p-3.5'
    }`}>
      
      {/* COLLAPSE / EXPAND TOGGLE */}
      <button
        onClick={() => { playClickSound(); setCollapsed(!collapsed); }}
        className="absolute -right-3.5 top-5 z-50 p-1 bg-slate-900 border border-cyan-500/40 rounded-full text-cyan-400 hover:text-cyan-200 hover:bg-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all active:scale-95"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isDropdown && !collapsed) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => { playClickSound(); setLayersOpen(!layersOpen); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                    layersOpen 
                      ? 'bg-slate-900/90 text-cyan-300 border border-cyan-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${layersOpen ? 'rotate-180' : ''}`} />
                </button>

                {layersOpen && (
                  <div className="pl-7 pr-2 py-1 space-y-1 text-[11px] text-slate-400 border-l border-cyan-500/20 ml-4 animate-fadeIn">
                    <div className="py-0.5 text-cyan-300 font-bold">Sea Ice Layer: Active</div>
                    <div className="py-0.5">Iceberg Vector Radar</div>
                    <div className="py-0.5">Bathymetry 3D Keels</div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-2.5 px-3'} py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 via-cyan-500/20 to-transparent text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* TACTICAL COMMANDS EXPANDABLE SECTION */}
        {!collapsed && (
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => { playClickSound(); setTacticalOpen(!tacticalOpen); }}
              className="w-full flex items-center justify-between text-[11px] font-bold text-cyan-400 px-2 py-1 uppercase tracking-wider"
            >
              <span className="flex items-center">
                <Compass className="w-3.5 h-3.5 mr-1.5" /> TACTICAL COMMANDS
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${tacticalOpen ? 'rotate-180' : ''}`} />
            </button>

            {tacticalOpen && (
              <div className="space-y-1.5 pt-1.5">
                <button
                  onClick={() => { playClickSound(); onOpenWaypoints(); }}
                  className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg text-[10px] border border-cyan-500/30 flex items-center space-x-1.5"
                >
                  <Compass className="w-3 h-3" />
                  <span>CALIBRATE WAYPOINTS</span>
                </button>

                <button
                  onClick={toggleRadar}
                  className={`w-full py-1.5 px-2 rounded-lg text-[10px] border flex items-center space-x-1.5 ${
                    radarActive 
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>{radarActive ? 'RADAR: ACTIVE (15NM)' : 'ENABLE RADAR'}</span>
                </button>

                <button
                  onClick={() => { playClickSound(); onOpenOverride(); }}
                  className={`w-full py-1.5 px-2 rounded-lg text-[10px] border flex items-center space-x-1.5 ${
                    isEmergency 
                      ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                      : 'bg-red-950/40 text-red-400 border-red-900/60'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{isEmergency ? 'OVERRIDE ACTIVE' : 'EMERGENCY OVERRIDE'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* GEOGRAPHIC VALIDATION STRIP */}
      {!collapsed && (
        <div className="py-2 px-2.5 my-1 bg-slate-950/90 rounded-xl border border-slate-800 text-[10px]">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-slate-400">Position Integrity:</span>
            {isLandConflict ? (
              <span className="text-red-400 font-bold flex items-center">
                <ShieldAlert className="w-3 h-3 mr-0.5" /> CONFLICT
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center">
                <ShieldCheck className="w-3 h-3 mr-0.5" /> VERIFIED
              </span>
            )}
          </div>
          <div className="text-[9px] text-slate-500 truncate">
            {isLandConflict ? 'Coordinates located on land' : (telemetry.waterBody || 'Open Channel')}
          </div>
        </div>
      )}

      {/* BOTTOM STATUS FOOTER */}
      <div className={`pt-2 border-t border-cyan-500/20 text-[10px] ${collapsed ? 'text-center' : 'space-y-1'}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>System Online</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Backend Connected</span>
            </div>
            <div className="text-slate-500 pt-0.5 flex justify-between text-[9px]">
              <span>Polaris GCS Core</span>
              <span className="text-cyan-500/80 font-bold">v1.0.0</span>
            </div>
          </>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#10b981]" title="System Online v1.0.0"></span>
        )}
      </div>

    </aside>
  );
}
