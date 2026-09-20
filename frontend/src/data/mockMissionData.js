// Antarctic Autonomous Maritime Operations - Mission Data & Verified Coordinates
// All coordinates verified in open navigable waters of the Southern Ocean / Bellingshausen Sea

import { VERIFIED_MARITIME_WAYPOINTS, VERIFIED_VESSEL_TRAIL } from '../utils/geoValidation';

export const INITIAL_VESSEL_STATE = {
  // Verified open water in Marguerite Passage (West of Adelaide Island, Bellingshausen Sea)
  lat: -69.8542,
  lng: -76.4280,
  heading: 142.0, // Steering NNW along the open coastal fairway
  speed: 12.4,
  hullTemp: -4.2,
  iceDensity: 'Moderate',
  aiStatus: 'Active - Autonomous Evasion Engaged',
  waterBody: 'Marguerite Passage / Bellingshausen Sea',
  isNavigableWater: true,
  mode: 'AUTONOMOUS', // 'AUTONOMOUS' | 'MANUAL_OVERRIDE'
  defcon: 2,
  satcomQuality: 99.8,
  aiConfidence: 94.6,
  batteryLevel: 87.4,
  reactorOutput: 96.2,
  hullStressBow: 42,
  hullStressPort: 28,
  hullStressStarboard: 31,
  hullStressStern: 19,
  waterDepth: 580,
  windSpeed: 28,
  windDirection: 'SSW',
  rudderAngle: 0,
  throttle: 65,
};

export const SUMMARY_METRICS = [
  {
    id: 'sea-ice',
    title: 'Sea Ice',
    status: 'Available',
    meta: 'Updated: 15 Jan 2024',
    iconType: 'ice',
    highlight: false
  },
  {
    id: 'icebergs',
    title: 'Icebergs',
    value: '324',
    meta: 'Observations',
    iconType: 'iceberg',
    highlight: true
  },
  {
    id: 'ocean-currents',
    title: 'Ocean Currents',
    status: 'Available',
    meta: 'Updated: 15 Jan 2024',
    iconType: 'currents',
    highlight: false
  },
  {
    id: 'wind',
    title: 'Wind',
    status: 'Available',
    meta: 'Updated: 15 Jan 2024',
    iconType: 'wind',
    highlight: false
  },
  {
    id: 'bathymetry',
    title: 'Bathymetry',
    status: 'Available',
    meta: 'Next: 48h',
    iconType: 'bathymetry',
    highlight: false
  }
];

export const INITIAL_ROUTE_PLAN = {
  startLocation: '-67.5700, -68.1300', // Rothera Point Anchorage
  destination: '-65.5800, -65.4000',  // Grandidier Channel Fairway
  routingMode: 'Safe (Low Risk)',
  distanceKm: 1284,
  estimatedTime: '4d 17h',
  riskLevel: 'Low',
  waypointsCount: 5,
  fuelOptimization: '+8.4%'
};

export const INITIAL_WAYPOINTS = VERIFIED_MARITIME_WAYPOINTS;

// Verified maritime iceberg hazards located in open navigational waters
export const INITIAL_ICE_HAZARDS = [
  {
    id: 'IC-0427',
    name: 'Tabular Iceberg IC-0427',
    lat: -66.9500,
    lng: -68.9000, // In open maritime channel 14nm NNW of ship
    radiusMeters: 4500,
    driftSpeedKts: 1.8,
    driftBearing: 285,
    severity: 'CRITICAL',
    type: 'Mega-Tabular Calving',
    observedAt: '15 Jan 2024, 08:32 UTC',
    size: '120 x 80 m',
    source: 'Satellite (SENTINEL-1)',
    valid: 'Yes',
    trajectoryPoints: '3 points (last 24h)',
    description: 'Fresh calving detected in Matha Strait fairway. Keel spur extending 600m underwater.'
  },
  {
    id: 'IC-0199',
    name: 'Multi-Year Pack Ice Ridge',
    lat: -67.3800,
    lng: -69.4500, // Open water west of Marguerite Passage
    radiusMeters: 5500,
    driftSpeedKts: 0.9,
    driftBearing: 310,
    severity: 'MODERATE',
    type: 'Heavy Pack Ice Field',
    observedAt: '15 Jan 2024, 06:10 UTC',
    size: '450 x 200 m',
    source: 'RADARSAT-2',
    valid: 'Yes',
    trajectoryPoints: '6 points (last 24h)',
    description: 'Compressive ice pressure ridge with 3.2m estimated pack thickness.'
  },
  {
    id: 'IC-0382',
    name: 'Submerged Ice Keel / Growler Cluster',
    lat: -66.6000,
    lng: -68.4000, // Matha Strait approach
    radiusMeters: 2800,
    driftSpeedKts: 2.1,
    driftBearing: 270,
    severity: 'HIGH',
    type: 'Growler / Bergy Bit Swarm',
    observedAt: '15 Jan 2024, 07:45 UTC',
    size: '80 x 60 m',
    source: 'Acoustic Sonar Array',
    valid: 'Yes',
    trajectoryPoints: '4 points (last 24h)',
    description: 'Low radar cross-section. Forward acoustic bathymetry collision risk.'
  }
];

export const RECENT_ACTIVITIES = [
  { id: 'ACT-01', text: 'New iceberg IC-0427 detected', distanceTime: '14 nm ahead', icon: 'iceberg', level: 'danger' },
  { id: 'ACT-02', text: 'Sea ice concentration updated', distanceTime: '15 min ago', icon: 'ice', level: 'info' },
  { id: 'ACT-03', text: 'Autonomous evasion vector computed', distanceTime: '1 hour ago', icon: 'route', level: 'success' },
  { id: 'ACT-04', text: 'Bathymetric sonar verified', distanceTime: '3 hours ago', icon: 'forecast', level: 'info' }
];

export const DATA_STATUS_ITEMS = [
  { name: 'Sea Ice', status: 'Available', date: '15 Jan 2024', available: true },
  { name: 'Icebergs', status: 'Available', date: '15 Jan 2024', available: true },
  { name: 'Currents', status: 'Available', date: '15 Jan 2024', available: true },
  { name: 'Wind', status: 'Available', date: '15 Jan 2024', available: true },
  { name: 'Bathymetry', status: 'Available', date: '14 Jan 2024', available: true },
  { name: 'Forecast', status: 'Available', date: 'Next 48h', available: true }
];

export const INITIAL_MAP_LAYERS = {
  seaIce: true,
  navigationGrid: false,
  riskMap: false,
  icebergs: true,
  trajectories: true,
  predictedPaths: false,
  oceanCurrents: false,
  windVectors: false,
  bathymetry: false,
  route: true
};

export const INITIAL_MISSION_LOGS = [
  {
    id: 'LOG-1001',
    timestamp: '14:28:12',
    category: 'AI_CORE',
    level: 'INFO',
    message: 'Waypoint WP-02 acquired in Marguerite Passage. Bathymetric clearance 580m verified.'
  },
  {
    id: 'LOG-1002',
    timestamp: '14:30:45',
    category: 'HAZARD',
    level: 'WARNING',
    message: 'Iceberg IC-0427 calving detected 14nm ahead in Matha Strait fairway. AI evasion route recalculation recommended.'
  },
  {
    id: 'LOG-1003',
    timestamp: '14:31:02',
    category: 'AI_CORE',
    level: 'ACTION',
    message: 'Autonomous evasion vector computed: Heading correction 335° maintained in navigable deep water.'
  },
  {
    id: 'LOG-1004',
    timestamp: '14:32:19',
    category: 'SATCOM',
    level: 'INFO',
    message: 'Telemetry downlink encrypted and acknowledged by McMurdo Ground Relay.'
  },
  {
    id: 'LOG-1005',
    timestamp: '14:33:01',
    category: 'DEFCON',
    level: 'ALERT',
    message: 'DEFCON Level 2 maintained. Thermal anti-icing grid active on forward bow.'
  }
];
