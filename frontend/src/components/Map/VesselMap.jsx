import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Crosshair, 
  Layers, 
  Navigation, 
  AlertTriangle, 
  Compass, 
  Eye, 
  Satellite, 
  Radio,
  Plus,
  Minus,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  Anchor
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import MapLayerControls from './MapLayerControls';
import IceConcentrationBar from './IceConcentrationBar';

// Fix Leaflet default marker icon paths in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Rotated Directional Naval Drone Icon
function createVesselIcon(heading, isEmergency, isLandConflict) {
  const accentColor = isLandConflict ? '#dc2626' : isEmergency ? '#ef4444' : '#06b6d4';
  const pulseColor = isLandConflict ? 'rgba(220, 38, 38, 0.6)' : isEmergency ? 'rgba(239, 68, 68, 0.45)' : 'rgba(6, 182, 212, 0.35)';

  const html = `
    <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
      <!-- Sonar pulse aura -->
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${pulseColor};
        border: 1.5px solid ${accentColor};
        animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      
      <!-- Directional Rotated Hull -->
      <div style="
        transform: rotate(${heading}deg);
        transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        filter: drop-shadow(0 0 10px ${accentColor});
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L19 19L12 15.5L5 19L12 2Z" fill="${accentColor}" stroke="#020617" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 5L16 16L12 14L8 16L12 5Z" fill="#ffffff" opacity="0.3" />
          <circle cx="12" cy="11" r="2.2" fill="#ffffff" />
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'vessel-marker-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

// Custom Tactical Waypoint Node Icon
function createWaypointIcon(wp) {
  const isConflict = wp.status === 'TERRAIN_CONFLICT';
  const isPassed = wp.status === 'PASSED';
  const isCurrent = wp.status === 'CURRENT';
  const borderColor = isConflict ? '#ef4444' : isPassed ? '#64748b' : isCurrent ? '#06b6d4' : '#10b981';
  const glowColor = isConflict ? 'rgba(239, 68, 68, 0.6)' : isPassed ? 'rgba(100, 116, 139, 0.3)' : isCurrent ? 'rgba(6, 182, 212, 0.6)' : 'rgba(16, 185, 129, 0.5)';
  
  const html = `
    <div style="
      background: rgba(2, 6, 23, 0.9);
      border: 1.5px solid ${borderColor};
      color: ${borderColor};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      font-weight: 800;
      border-radius: 6px;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 0 12px ${glowColor};
      white-space: nowrap;
      backdrop-filter: blur(8px);
    ">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${borderColor};"></span>
      ${wp.id}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-wp-icon',
    iconSize: [56, 22],
    iconAnchor: [28, 11]
  });
}

// Map Click Listener
function MapEventsHandler({ isCalibrating, onMapClick }) {
  useMapEvents({
    click(e) {
      if (isCalibrating && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Controller to smoothly pan/zoom
function MapController({ centerTrigger, coords, zoomTrigger }) {
  const map = useMap();
  useEffect(() => {
    if (centerTrigger > 0) {
      map.flyTo(coords, map.getZoom(), { duration: 1.2 });
    }
  }, [centerTrigger, coords, map]);

  useEffect(() => {
    if (zoomTrigger === 'in') map.zoomIn();
    if (zoomTrigger === 'out') map.zoomOut();
  }, [zoomTrigger, map]);

  return null;
}

export default function VesselMap({
  telemetry,
  trail,
  waypoints,
  hazards,
  radarActive,
  layers,
  onToggleLayer,
  onSelectIceberg,
  isCalibrating,
  onAddWaypoint,
  standalone = false
}) {
  const isEmergency = telemetry.mode === 'MANUAL_OVERRIDE' || telemetry.defcon === 1;
  const isLandConflict = telemetry.geoStatus && !telemetry.geoStatus.isNavigableWater;
  
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [zoomTrigger, setZoomTrigger] = useState(null);
  const vesselCoords = [telemetry.lat, telemetry.lng];

  const handleCenter = () => {
    playClickSound();
    setCenterTrigger(prev => prev + 1);
  };

  const handleZoom = (dir) => {
    playClickSound();
    setZoomTrigger(dir);
    setTimeout(() => setZoomTrigger(null), 100);
  };

  // Planned route coordinates
  const plannedRouteCoords = [
    vesselCoords,
    ...waypoints
      .filter(wp => wp.status !== 'PASSED')
      .map(wp => [wp.lat, wp.lng])
  ];

  const showRoute = layers ? layers.route : true;
  const showHazards = layers ? layers.icebergs : true;
  const showTrajectories = layers ? layers.trajectories : true;

  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden select-none ${
      standalone ? '' : 'rounded-2xl border border-cyan-500/30 shadow-2xl'
    }`}>
      
      {/* 1. TOP-LEFT QUICK CONTROLS (+ / - / Recenter) */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-1.5 font-mono">
        <button
          onClick={() => handleZoom('in')}
          className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-lg transition active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-lg transition active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleCenter}
          className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-lg transition active:scale-95"
          title="Center on Vessel"
        >
          <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-slow" />
        </button>
      </div>

      {/* 2. TOP-RIGHT FLOATING LAYER CONTROLS */}
      <MapLayerControls 
        layers={layers || {}} 
        onToggleLayer={onToggleLayer || (() => {})} 
      />

      {/* 3. BOTTOM-LEFT ICE CONCENTRATION SPECTRUM */}
      <IceConcentrationBar />

      {/* 4. GEOGRAPHIC INTEGRITY STATUS BADGE (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] font-mono text-xs select-none">
        {isLandConflict ? (
          <div className="px-4 py-2 bg-red-950/95 border border-red-500 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.5)] backdrop-blur-md text-red-300 flex items-center space-x-2 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="font-bold">TERRESTRIAL CONFLICT: VESSEL COORDINATES ON LAND</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 bg-slate-950/85 border border-emerald-500/40 rounded-xl shadow-lg backdrop-blur-md text-emerald-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NAVIGABLE WATERWAY: {telemetry.waterBody || 'VERIFIED MARITIME CORRIDOR'}</span>
          </div>
        )}
      </div>

      {/* 5. CALIBRATION PROMPT (When plotting waypoints) */}
      {isCalibrating && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] px-3.5 py-2 bg-emerald-950/90 border border-emerald-500/70 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md text-xs font-mono text-emerald-300 flex items-center space-x-2 animate-pulse">
          <Navigation className="w-4 h-4" />
          <span className="font-bold">CLICK MAP TO PLOT WAYPOINT</span>
        </div>
      )}

      {/* 6. TACTICAL LEAFLET MAP */}
      <MapContainer 
        center={vesselCoords} 
        zoom={7} 
        zoomControl={false}
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', background: '#020617' }}
      >
        <MapController centerTrigger={centerTrigger} coords={vesselCoords} zoomTrigger={zoomTrigger} />
        <MapEventsHandler isCalibrating={isCalibrating} onMapClick={onAddWaypoint} />

        {/* TILE LAYER (Esri World Dark Gray Canvas: Crisp, dark, zero watermarks) */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* 1. HISTORICAL BREADCRUMB TRAIL (Open water transit) */}
        {showTrajectories && trail && trail.length > 1 && (
          <Polyline 
            positions={trail} 
            pathOptions={{ 
              color: '#06b6d4', 
              weight: 3.5, 
              opacity: 0.75,
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        )}

        {/* 2. PROTECTED ROUTE PATH (Golden Line as shown in Image 1) */}
        {showRoute && plannedRouteCoords.length > 1 && (
          <>
            <Polyline 
              positions={plannedRouteCoords} 
              pathOptions={{ 
                color: '#facc15', 
                weight: 4, 
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }} 
            />
            <Polyline 
              positions={plannedRouteCoords} 
              pathOptions={{ 
                color: '#eab308', 
                weight: 8, 
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }} 
            />
          </>
        )}

        {/* 3. RADAR RANGE RINGS */}
        {radarActive && (
          <>
            <Circle 
              center={vesselCoords} 
              radius={9260} 
              pathOptions={{ 
                color: '#06b6d4', 
                weight: 1.5, 
                fillColor: '#06b6d4', 
                fillOpacity: 0.04, 
                dashArray: '4, 8' 
              }} 
            />
            <Circle 
              center={vesselCoords} 
              radius={27780} 
              pathOptions={{ 
                color: '#0891b2', 
                weight: 1.2, 
                fillColor: '#0891b2', 
                fillOpacity: 0.02, 
                dashArray: '6, 12' 
              }} 
            />
          </>
        )}

        {/* 4. ICE HAZARDS / CALVING ZONES IN OPEN WATERWAY */}
        {showHazards && hazards.map((haz) => {
          const isCritical = haz.severity === 'CRITICAL';
          const hazardColor = isCritical ? '#ef4444' : '#f59e0b';

          return (
            <React.Fragment key={haz.id}>
              <Circle
                center={[haz.lat, haz.lng]}
                radius={haz.radiusMeters}
                pathOptions={{
                  color: hazardColor,
                  weight: 2,
                  fillColor: hazardColor,
                  fillOpacity: isCritical ? 0.22 : 0.14,
                  dashArray: '6, 6'
                }}
                eventHandlers={{
                  click: () => {
                    playClickSound();
                    if (onSelectIceberg) onSelectIceberg(haz);
                  }
                }}
              >
                <Popup>
                  <div className="font-mono text-xs min-w-[210px] text-slate-100">
                    <div className="flex items-center space-x-1.5 font-bold border-b border-red-500/30 pb-1.5 mb-1.5 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{haz.severity} HAZARD: {haz.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{haz.description}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div><strong className="text-slate-400">Drift:</strong> {haz.driftSpeedKts} kts</div>
                      <div><strong className="text-slate-400">Bearing:</strong> {haz.driftBearing}°</div>
                      <div><strong className="text-slate-400">Radius:</strong> {(haz.radiusMeters / 1000).toFixed(1)} km</div>
                      <div><strong className="text-slate-400">Type:</strong> {haz.type}</div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}

        {/* 5. WAYPOINTS (VERIFIED IN WATERWAYS) */}
        {showRoute && waypoints.map((wp) => (
          <Marker 
            key={wp.id} 
            position={[wp.lat, wp.lng]}
            icon={createWaypointIcon(wp)}
          >
            <Popup>
              <div className="font-mono text-xs min-w-[200px] text-slate-100">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-1.5">
                  <strong className="text-cyan-300">{wp.id} - {wp.name}</strong>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    wp.status === 'TERRAIN_CONFLICT' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                    wp.status === 'PASSED' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {wp.status}
                  </span>
                </div>
                <div className="text-[11px] space-y-1 text-slate-300">
                  <div><span className="text-slate-500">Water Body:</span> {wp.waterBody || 'Antarctic Fairway'}</div>
                  <div><span className="text-slate-500">Position:</span> {wp.lat.toFixed(4)}° S, {Math.abs(wp.lng).toFixed(4)}° W</div>
                  <div><span className="text-slate-500">Target Speed:</span> {wp.targetSpeed} kts</div>
                  {wp.warning && (
                    <div className="text-red-400 text-[10px] font-bold mt-1 bg-red-950/60 p-1 rounded border border-red-500/40">
                      {wp.warning}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. PRIMARY VESSEL MARKER */}
        <Marker 
          position={vesselCoords}
          icon={createVesselIcon(telemetry.heading, isEmergency, isLandConflict)}
        >
          <Popup>
            <div className="text-slate-100 font-mono text-xs min-w-[230px]">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
                <strong className="text-cyan-300 font-bold">POLARIS-X VESSEL</strong>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isLandConflict ? 'bg-red-600 text-white animate-pulse' :
                  isEmergency ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 
                  'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                }`}>
                  {isLandConflict ? 'TERRAIN CONFLICT' : telemetry.mode}
                </span>
              </div>
              
              <div className="text-[11px] space-y-1.5 text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position:</span>
                  <span className="font-bold">{telemetry.lat.toFixed(4)}° S, {Math.abs(telemetry.lng).toFixed(4)}° W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-emerald-400 font-bold text-[10px]">{telemetry.waterBody || 'Open Channel'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading:</span>
                  <span className="text-cyan-300 font-bold">{telemetry.heading}° TRUE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed:</span>
                  <span className="text-cyan-300 font-bold">{telemetry.speed} kts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Depth / Clearance:</span>
                  <span className="text-blue-300 font-bold">{telemetry.waterDepth || 580}m (Deepwater)</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Marine Verification:</span>
                  <span className={isLandConflict ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold flex items-center'}>
                    <ShieldCheck className="w-3 h-3 mr-0.5" /> VERIFIED OCEAN
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}
