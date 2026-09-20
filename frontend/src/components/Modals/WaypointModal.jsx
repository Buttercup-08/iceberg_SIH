import React, { useState } from 'react';
import { X, Navigation, Plus, Trash2, CheckCircle2, Crosshair, Compass } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export default function WaypointModal({
  isOpen,
  onClose,
  waypoints,
  onAddWaypoint,
  onRemoveWaypoint,
  isCalibrating,
  setIsCalibrating
}) {
  const [newLat, setNewLat] = useState('-66.5500');
  const [newLng, setNewLng] = useState('-68.1000');
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newLat || !newLng) return;
    const name = newName.trim() || `Tactical WP-${waypoints.length + 1}`;
    onAddWaypoint(parseFloat(newLat), parseFloat(newLng), name);
    setNewName('');
  };

  const toggleMapPlotting = () => {
    playClickSound();
    setIsCalibrating(!isCalibrating);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="glass-panel border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/70">
          <div className="flex items-center space-x-2.5 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <h3 className="font-black text-sm tracking-widest">TACTICAL WAYPOINT CALIBRATOR</h3>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAP CALIBRATION MODE BANNER */}
        <div className="px-6 py-3 bg-cyan-950/40 border-b border-cyan-800/40 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-300">
            <span className="text-cyan-400 font-bold">CLICK-TO-PLOT: </span>
            {isCalibrating 
              ? 'ACTIVE - Click on the tactical map to plot a new waypoint.' 
              : 'Standby. Enable click-to-plot or use manual coordinate entry.'}
          </div>
          <button
            onClick={toggleMapPlotting}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md ${
              isCalibrating 
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                : 'btn-tactical-primary'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isCalibrating ? 'PLOTTING ACTIVE' : 'ENABLE MAP PLOTTING'}</span>
          </button>
        </div>

        {/* WAYPOINT LIST */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Mission Waypoints ({waypoints.length})
          </h4>

          <div className="space-y-2">
            {waypoints.map((wp) => (
              <div 
                key={wp.id} 
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all text-xs"
              >
                <div className="flex items-center space-x-3.5">
                  <span className="font-black text-cyan-300 min-w-[55px] tracking-wide">{wp.id}</span>
                  <div>
                    <div className="font-bold text-slate-100">{wp.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Lat: {wp.lat.toFixed(4)}° S | Lng: {wp.lng.toFixed(4)}° W | Target: {wp.targetSpeed} kts
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    wp.status === 'PASSED' ? 'bg-slate-800 text-slate-400' :
                    wp.status === 'CURRENT' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]' :
                    wp.status === 'NEXT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {wp.status}
                  </span>

                  {wp.status !== 'PASSED' && wp.status !== 'CURRENT' && (
                    <button
                      onClick={() => onRemoveWaypoint(wp.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Purge Waypoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* MANUAL COORDINATE ENTRY FORM */}
          <form onSubmit={handleManualAdd} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Manual Coordinate Injection
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Waypoint Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-950 px-3.5 py-2 text-xs text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
              />
              <input
                type="text"
                placeholder="Latitude (e.g. -66.50)"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                className="bg-slate-950 px-3.5 py-2 text-xs text-cyan-300 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
              />
              <input
                type="text"
                placeholder="Longitude (e.g. -64.00)"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                className="bg-slate-950 px-3.5 py-2 text-xs text-cyan-300 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 btn-tactical rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>INJECT WAYPOINT INTO QUEUE</span>
            </button>
          </form>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
}
