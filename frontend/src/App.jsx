import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VesselMap from './components/Map/VesselMap';
import SummaryCards from './components/Dashboard/SummaryCards';
import RouteInfoCard from './components/Dashboard/RouteInfoCard';
import RecentActivityCard from './components/Dashboard/RecentActivityCard';
import DataStatusCard from './components/Dashboard/DataStatusCard';
import RoutePlanningSection from './components/Dashboard/RoutePlanningSection';
import AIDiagnosticsView from './components/Views/AIDiagnosticsView';
import MissionLogsView from './components/Views/MissionLogsView';
import WaypointModal from './components/Modals/WaypointModal';
import ManualOverrideModal from './components/Modals/ManualOverrideModal';
import { useVesselSimulation } from './hooks/useVesselSimulation';

export default function App() {
  // Navigation tab state (Default to 'dashboard' as in Image 1)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal display states
  const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Vessel Simulation & State management hook
  const {
    telemetry,
    trail,
    waypoints,
    hazards,
    missionLogs,
    radarActive,
    layers,
    routePlan,
    selectedIceberg,
    toggleLayer,
    optimizeRoute,
    setSelectedIceberg,
    toggleRadar,
    toggleManualOverride,
    setHelm,
    addWaypoint,
    removeWaypoint
  } = useVesselSimulation();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 font-mono overflow-hidden relative select-none">
      
      {/* AMBIENT LIGHTING GLOWS */}
      <div className="pointer-events-none absolute -top-40 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] z-0"></div>
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[180px] z-0"></div>

      {/* TOP HEADER: POLARIS-GCS Command Bar (As in Image 1) */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        telemetry={telemetry} 
      />

      {/* MAIN CONTENT GRID */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* LEFT SIDEBAR: Nav Items (Dashboard, Map, Layers, Route Planning, etc.) */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          telemetry={telemetry}
          radarActive={radarActive}
          toggleRadar={toggleRadar}
          onOpenWaypoints={() => setIsWaypointModalOpen(true)}
          onOpenOverride={() => setIsOverrideModalOpen(true)}
          toggleManualOverride={toggleManualOverride}
          setHelm={setHelm}
        />

        {/* MAIN VIEWPORT */}
        <main className="flex-1 relative bg-slate-950/80 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: DASHBOARD (Exact layout and widgets from Image 1) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Top Row: 5 Summary Metrics Cards */}
              <SummaryCards />

              {/* Main Interactive Map Section */}
              <div className="w-full h-[420px] lg:h-[480px] rounded-2xl overflow-hidden relative border border-cyan-500/30 shadow-2xl">
                <VesselMap 
                  telemetry={telemetry}
                  trail={trail}
                  waypoints={waypoints}
                  hazards={hazards}
                  radarActive={radarActive}
                  layers={layers}
                  onToggleLayer={toggleLayer}
                  onSelectIceberg={(iceberg) => setSelectedIceberg(iceberg)}
                  isCalibrating={isCalibrating}
                  onAddWaypoint={addWaypoint}
                />
              </div>

              {/* Middle Row: Route Information + Recent Activity + Data Status (3 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RouteInfoCard 
                  routePlan={routePlan} 
                  onOpenRouteDetails={() => setActiveTab('route-planning')} 
                />
                <RecentActivityCard />
                <DataStatusCard />
              </div>

              {/* Bottom Row: Route Planning + Route Results + Iceberg Details (3 columns) */}
              <RoutePlanningSection 
                routePlan={routePlan}
                onOptimizeRoute={optimizeRoute}
                selectedIceberg={selectedIceberg}
                onShowIcebergOnMap={() => {
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* TAB 2: FULLSCREEN MAP VIEW */}
          {activeTab === 'map' && (
            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-cyan-500/30 shadow-2xl">
              <VesselMap 
                telemetry={telemetry}
                trail={trail}
                waypoints={waypoints}
                hazards={hazards}
                radarActive={radarActive}
                layers={layers}
                onToggleLayer={toggleLayer}
                onSelectIceberg={(iceberg) => setSelectedIceberg(iceberg)}
                isCalibrating={isCalibrating}
                onAddWaypoint={addWaypoint}
                standalone={true}
              />
            </div>
          )}

          {/* TAB 3: ROUTE PLANNING VIEW */}
          {activeTab === 'route-planning' && (
            <div className="space-y-4 max-w-7xl mx-auto w-full">
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30">
                <h2 className="text-base font-bold text-cyan-400 mb-1">TACTICAL ROUTE PLANNING & BATHYMETRIC OPTIMIZATION</h2>
                <p className="text-xs text-slate-400">Autonomous Antarctic Iceberg Evasion Route Generation</p>
              </div>
              <RoutePlanningSection 
                routePlan={routePlan}
                onOptimizeRoute={optimizeRoute}
                selectedIceberg={selectedIceberg}
                onShowIcebergOnMap={() => setActiveTab('map')}
              />
              <div className="w-full h-96 rounded-2xl overflow-hidden border border-cyan-500/30">
                <VesselMap 
                  telemetry={telemetry}
                  trail={trail}
                  waypoints={waypoints}
                  hazards={hazards}
                  radarActive={radarActive}
                  layers={layers}
                  onToggleLayer={toggleLayer}
                  onSelectIceberg={(iceberg) => setSelectedIceberg(iceberg)}
                  isCalibrating={isCalibrating}
                  onAddWaypoint={addWaypoint}
                />
              </div>
            </div>
          )}

          {/* TAB 4: ICEBERGS / FORECASTS / 3D SIMULATOR (Image 2) */}
          {(activeTab === 'icebergs' || activeTab === 'forecasts') && (
            <AIDiagnosticsView 
              telemetry={telemetry}
              hazards={hazards}
            />
          )}

          {/* TAB 5: DATA STATUS / MISSION BLACKBOX */}
          {activeTab === 'data-status' && (
            <MissionLogsView 
              missionLogs={missionLogs}
              telemetry={telemetry}
            />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-2xl max-w-3xl mx-auto w-full space-y-4">
              <h2 className="text-base font-bold text-cyan-400 border-b border-cyan-500/20 pb-2">
                POLARIS-GCS SYSTEM CONFIGURATION
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">SATCOM Downlink Relay:</span>
                  <span className="text-emerald-400 font-bold">McMurdo Antarctic Relay (Active)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Acoustic Sonar Frequency:</span>
                  <span className="text-cyan-300 font-bold">12.5 kHz Multi-Beam</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Autonomous Evasion Threshold:</span>
                  <span className="text-amber-300 font-bold">5.0 NM Proximity Safety Buffer</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Synthetic Aperture Radar Feed:</span>
                  <span className="text-cyan-300 font-bold">Sentinel-1 / RADARSAT-2 Synchronized</span>
                </div>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* MODALS */}
      <WaypointModal
        isOpen={isWaypointModalOpen}
        onClose={() => setIsWaypointModalOpen(false)}
        waypoints={waypoints}
        onAddWaypoint={addWaypoint}
        onRemoveWaypoint={removeWaypoint}
        isCalibrating={isCalibrating}
        setIsCalibrating={setIsCalibrating}
      />

      <ManualOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        telemetry={telemetry}
        toggleManualOverride={toggleManualOverride}
        setHelm={setHelm}
      />

    </div>
  );
}