import { validateMarinePosition, VERIFIED_VESSEL_TRAIL, VERIFIED_MARITIME_WAYPOINTS } from './src/utils/geoValidation.js';

const INITIAL_VESSEL_STATE = {
  lat: -67.2200,
  lng: -69.1500,
  heading: 335.0,
  speed: 12.4,
};

console.log('=== INITIAL VESSEL STATE ===');
console.log(INITIAL_VESSEL_STATE.lat, INITIAL_VESSEL_STATE.lng);
console.log('validate:', JSON.stringify(validateMarinePosition(INITIAL_VESSEL_STATE.lat, INITIAL_VESSEL_STATE.lng)));

console.log('\n=== VERIFIED TRAIL ===');
VERIFIED_VESSEL_TRAIL.forEach((p, i) => {
  const r = validateMarinePosition(p[0], p[1]);
  console.log(i, p, '->', r.isNavigableWater ? 'WATER' : 'LAND', '|', r.sector, '|', r.warning);
});

console.log('\n=== WAYPOINTS ===');
VERIFIED_MARITIME_WAYPOINTS.forEach((wp) => {
  const r = validateMarinePosition(wp.lat, wp.lng);
  console.log(wp.id, wp.lat, wp.lng, '->', r.isNavigableWater ? 'WATER' : 'LAND', '|', r.sector, '|', r.warning);
});

console.log('\n=== SIMULATION TRACE (200 ticks, no random fluctuation) ===');
let lat = INITIAL_VESSEL_STATE.lat;
let lng = INITIAL_VESSEL_STATE.lng;
let heading = INITIAL_VESSEL_STATE.heading;
let speed = INITIAL_VESSEL_STATE.speed;
let landHits = 0;

for (let i = 0; i < 200; i++) {
  const distDeg = speed * 0.00002;
  const rad = (heading * Math.PI) / 180;
  let candidateLat = +(lat + Math.cos(rad) * distDeg).toFixed(6);
  let candidateLng = +(lng + Math.sin(rad) * distDeg / Math.cos((lat * Math.PI) / 180)).toFixed(6);

  const geoCheck = validateMarinePosition(candidateLat, candidateLng);
  if (!geoCheck.isNavigableWater) {
    landHits++;
    if (landHits <= 5) {
      console.log(`TICK ${i}: LAND HIT at candidate [${candidateLat}, ${candidateLng}] -> ${geoCheck.warning}`);
      console.log(`  prev was [${lat}, ${lng}]`);
    }
    // fallback (westward, NOT re-validated)
    heading = 310.0;
    candidateLat = lat;
    candidateLng = +(lng - 0.0002).toFixed(6);
    const fbCheck = validateMarinePosition(candidateLat, candidateLng);
    if (!fbCheck.isNavigableWater && landHits <= 5) {
      console.log(`  FALLBACK [${candidateLat}, ${candidateLng}] is ALSO LAND: ${fbCheck.warning}`);
    }
  }
  lat = candidateLat;
  lng = candidateLng;
}
console.log('Total land hits:', landHits);
console.log('Final position after 200 ticks:', lat, lng);
console.log('Final validation:', JSON.stringify(validateMarinePosition(lat, lng)));
