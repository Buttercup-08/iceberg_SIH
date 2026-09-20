import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  INITIAL_VESSEL_STATE, 
  INITIAL_WAYPOINTS, 
  INITIAL_ICE_HAZARDS, 
  INITIAL_MISSION_LOGS,
  INITIAL_MAP_LAYERS,
  INITIAL_ROUTE_PLAN
} from '../data/mockMissionData';
import { VERIFIED_VESSEL_TRAIL, validateMarinePosition } from '../utils/geoValidation';
import { playAlertKlaxon, playClickSound, playSonarPing } from '../utils/audio';

export function useVesselSimulation() {
  // Initialized with verified open water coordinates in Bellingshausen Sea
  const [telemetry, setTelemetry] = useState(() => {
    const startLat = -68.5000;
    const startLng = -72.0000;
    const initialGeo = validateMarinePosition(startLat, startLng);
    return {
      ...INITIAL_VESSEL_STATE,
      lat: startLat,
      lng: startLng,
      geoStatus: initialGeo,
      isNavigableWater: initialGeo.isNavigableWater
    };
  });

  const [waypoints, setWaypoints] = useState(INITIAL_WAYPOINTS);
  const [hazards, setHazards] = useState(INITIAL_ICE_HAZARDS);
  const [missionLogs, setMissionLogs] = useState(INITIAL_MISSION_LOGS);
  const [radarActive, setRadarActive] = useState(true);
  const [layers, setLayers] = useState(INITIAL_MAP_LAYERS);
  const [routePlan, setRoutePlan] = useState(INITIAL_ROUTE_PLAN);
  const [selectedIceberg, setSelectedIceberg] = useState(INITIAL_ICE_HAZARDS[0]);
  
  // Historical breadcrumbs trail in verified navigable ocean waters
  const [trail, setTrail] = useState([
    [-68.5500, -71.8000],
    [-68.5200, -71.9000],
    [-68.5000, -72.0000]
  ]);

  const tickCountRef = useRef(0);

  // Add log helper
  const addLog = useCallback((category, level, message) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setMissionLogs(prev => [
      {
        id: `LOG-${Date.now()}`,
        timestamp: timeStr,
        category,
        level,
        message
      },
      ...prev.slice(0, 49)
    ]);
  }, []);

  // Calculate bearing between two coordinates so vessel faces path vector
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  };

  // Main simulation tick: dead-reckoning movement with continuous landmask & iceberg rerouting
  useEffect(() => {
    const interval = setInterval(() => {
      tickCountRef.current += 1;
      const count = tickCountRef.current;

      setTelemetry(prev => {
        let newHeading = prev.heading;
        let newSpeed = prev.speed;
        let currentLat = prev.lat;
        let currentLng = prev.lng;

        if (prev.mode === 'MANUAL_OVERRIDE') {
          newHeading = +((prev.heading + prev.rudderAngle * 0.15 + 360) % 360).toFixed(1);
          const targetSpeed = (prev.throttle / 100) * 18.0;
          newSpeed = +(prev.speed + (targetSpeed - prev.speed) * 0.1).toFixed(1);
        } else {
          // Autonomous Path Following: Face the active waypoint
          const activeWaypoint = waypoints.find(wp => wp.status === 'CURRENT') || waypoints[0];
          if (activeWaypoint) {
            const targetBearing = calculateBearing(currentLat, currentLng, activeWaypoint.lat, activeWaypoint.lng);
            let diff = targetBearing - prev.heading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            newHeading = +(prev.heading + diff * 0.2).toFixed(1);
          }
          newSpeed = +(Math.max(10, Math.min(15, prev.speed + (Math.random() * 0.2 - 0.1)))).toFixed(1);
        }

        // Check proximity to Ice Hazards for Autonomous Re-routing / Collision Avoidance
        hazards.forEach(haz => {
          const distanceToHazard = Math.sqrt(Math.pow(currentLat - haz.lat, 2) + Math.pow(currentLng - haz.lng, 2)) * 111000;
          if (distanceToHazard < (haz.radiusMeters || 3000) + 1200) {
            newHeading = +((newHeading + 50) % 360).toFixed(1); // Deflect vector safely around hazard
          }
        });

        // Calculate geographic dead-reckoning movement
        const distDeg = (newSpeed * 0.000025);
        const rad = (newHeading * Math.PI) / 180;
        currentLat = +(currentLat + Math.cos(rad) * distDeg).toFixed(6);
        currentLng = +(currentLng + Math.sin(rad) * distDeg / Math.cos((currentLat * Math.PI) / 180)).toFixed(6);

        // Continuous landmask check via validateMarinePosition
        const geoCheck = validateMarinePosition(currentLat, currentLng);

        if (!geoCheck.isNavigableWater) {
          newHeading = 310.0; // Steer NW into open water
          currentLat = prev.lat;
          currentLng = +(prev.lng - 0.0002).toFixed(6);
          addLog('TERRAIN', 'WARNING', `Autonomous terrain deflection engaged: Avoiding ${geoCheck.sector}.`);
        }

        const newHullTemp = +(-4.2 + Math.sin(count * 0.1) * 0.4).toFixed(1);
        const newSatcom = +(99.5 + Math.random() * 0.5).toFixed(1);

        if (count % 4 === 0) {
          setTrail(oldTrail => {
            const updated = [...oldTrail, [currentLat, currentLng]];
            return updated.slice(-100);
          });
        }

        return {
          ...prev,
          lat: currentLat,
          lng: currentLng,
          heading: newHeading,
          speed: newSpeed,
          hullTemp: newHullTemp,
          satcomQuality: newSatcom,
          hullStressBow: Math.min(100, Math.max(20, Math.round(40 + (newSpeed * 1.5)))),
          geoStatus: geoCheck,
          isNavigableWater: geoCheck.isNavigableWater
        };
      });

      if (count % 15 === 0) {
        playSonarPing();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [waypoints, hazards, addLog]);

  // Layer toggle handler
  const toggleLayer = useCallback((layerKey) => {
    playClickSound();
    setLayers(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  }, []);

  // Optimize route calculation
  const optimizeRoute = useCallback((start, dest, mode) => {
    playClickSound();
    addLog('ROUTE', 'ACTION', `Optimizing maritime passage from [${start}] to [${dest}] in ${mode} mode.`);
    setRoutePlan(prev => ({
      ...prev,
      startLocation: start || prev.startLocation,
      destination: dest || prev.destination,
      routingMode: mode || prev.routingMode,
      distanceKm: 1284,
      estimatedTime: '4d 17h',
      riskLevel: mode?.toLowerCase().includes('safe') ? 'Low' : 'Moderate'
    }));
  }, [addLog]);

  // Toggle Ice-Sheet Radar
  const toggleRadar = useCallback(() => {
    playClickSound();
    setRadarActive(prev => {
      const next = !prev;
      addLog('RADAR', 'INFO', `Ice-sheet synthetic aperture radar ${next ? 'ACTIVATED' : 'STANDBY'}.`);
      return next;
    });
  }, [addLog]);

  // Toggle Emergency Manual Override
  const toggleManualOverride = useCallback(() => {
    setTelemetry(prev => {
      const isManual = prev.mode === 'MANUAL_OVERRIDE';
      if (isManual) {
        playClickSound();
        addLog('NAV_MODE', 'INFO', 'Manual helm disengaged. Autonomous evasion AI re-engaged.');
        return {
          ...prev,
          mode: 'AUTONOMOUS',
          defcon: 2,
          aiStatus: 'Active - Autonomous Evasion Engaged'
        };
      } else {
        playAlertKlaxon();
        addLog('DEFCON', 'ALERT', 'EMERGENCY MANUAL OVERRIDE ENGAGED! DEFCON ELEVATED TO LEVEL 1.');
        return {
          ...prev,
          mode: 'MANUAL_OVERRIDE',
          defcon: 1,
          aiStatus: 'OVERRIDDEN - Manual Pilot Engaged'
        };
      }
    });
  }, [addLog]);

  const setHelm = useCallback((rudderAngle, throttle) => {
    setTelemetry(prev => ({
      ...prev,
      rudderAngle: typeof rudderAngle === 'number' ? rudderAngle : prev.rudderAngle,
      throttle: typeof throttle === 'number' ? throttle : prev.throttle,
    }));
  }, []);

  const addWaypoint = useCallback((lat, lng, name = 'Tactical Waypoint') => {
    playClickSound();
    const geo = validateMarinePosition(lat, lng);
    const newId = `WP-${String(waypoints.length + 1).padStart(2, '0')}`;
    
    const newWp = {
      id: newId,
      name,
      lat: +lat.toFixed(4),
      lng: +lng.toFixed(4),
      status: geo.isNavigableWater ? 'PLANNED' : 'TERRAIN_CONFLICT',
      targetSpeed: 12.0,
      isNavigableWater: geo.isNavigableWater,
      warning: geo.warning
    };

    setWaypoints(prev => [...prev, newWp]);

    if (!geo.isNavigableWater) {
      addLog('TERRAIN', 'WARNING', `Waypoint ${newId} plotted on unnavigable terrain: ${geo.sector}.`);
    } else {
      addLog('WAYPOINT', 'ACTION', `New marine waypoint ${newId} plotted at [${lat.toFixed(3)}, ${lng.toFixed(3)}].`);
    }

    return newWp;
  }, [waypoints.length, addLog]);

  const removeWaypoint = useCallback((id) => {
    playClickSound();
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    addLog('WAYPOINT', 'INFO', `Waypoint ${id} purged from navigation queue.`);
  }, [addLog]);

  return {
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
    removeWaypoint,
    addLog
  };
}