import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  Radio, 
  Navigation,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export default function MissionLogsView({ missionLogs, telemetry }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = missionLogs.filter(log => {
    const matchesCategory = filterCategory === 'ALL' || log.category === filterCategory;
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const handleExport = () => {
    playClickSound();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      mission: 'POLARIS-X // GCS ANTARCTIC DEPLOYMENT',
      exportedAt: new Date().toISOString(),
      currentTelemetry: telemetry,
      logs: missionLogs
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `polaris_x_blackbox_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'ALERT':
        return 'bg-red-500/20 text-red-300 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'ACTION':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'AI_CORE':
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'HAZARD':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'DEFCON':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
      case 'SATCOM':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Navigation className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 bg-slate-950/90 p-5 sm:p-7 overflow-y-auto font-mono text-slate-200 select-none cyber-grid">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-cyan-400 flex items-center space-x-2 tracking-wider">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>MISSION BLACKBOX & TACTICAL AUDIT STREAM</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-Resistant Cryptographic Telemetry Feed, Autonomous Decision Audit Log, & Incident Timeline
          </p>
        </div>

        <button
          onClick={handleExport}
          className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2.5 btn-tactical-primary rounded-xl text-xs font-mono font-black shadow-xl"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>EXPORT BLACKBOX JSON</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6 glass-panel p-4 rounded-2xl">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-950 text-xs text-slate-200 border border-cyan-500/20 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 whitespace-nowrap font-bold">CATEGORY:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-950 text-xs text-cyan-300 border border-cyan-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="AI_CORE">AI CORE</option>
            <option value="HAZARD">HAZARD SENSORS</option>
            <option value="DEFCON">DEFCON / DEFENSE</option>
            <option value="SATCOM">SATCOM TELEMETRY</option>
            <option value="WAYPOINT">WAYPOINTS</option>
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 whitespace-nowrap font-bold">SEVERITY:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full bg-slate-950 text-xs text-cyan-300 border border-cyan-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ACTION">ACTION</option>
            <option value="ALERT">ALERT</option>
          </select>
        </div>

      </div>

      {/* LOGS TABLE / STREAM */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-cyan-500/25">
        <div className="px-5 py-3 bg-slate-950/90 border-b border-cyan-500/20 flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-cyan-300">INCIDENT LOGS ({filteredLogs.length} RECORDS)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold">
            STATUS: REAL-TIME RECORDING
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[540px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No audit records match the selected parameters.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 hover:bg-slate-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-start sm:items-center space-x-3">
                  <span className="text-slate-500 text-[11px] min-w-[65px] font-bold">
                    {log.timestamp}
                  </span>

                  <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                    {getCategoryIcon(log.category)}
                    <span className="font-bold">{log.category}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-wider ${getLevelBadge(log.level)}`}>
                    {log.level}
                  </span>

                  <p className="text-slate-200 leading-relaxed text-xs">
                    {log.message}
                  </p>
                </div>

                <span className="text-[10px] text-slate-600 font-mono self-end sm:self-center">
                  {log.id}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
