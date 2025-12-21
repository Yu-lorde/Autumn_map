'use strict';
const fetch = require('node-fetch');
const fs = require('fs');

// samples: pairs of coords [lat, lng]
// Default: use plants sample points from project if available; otherwise use a small hardcoded list.
const samplePairs = require('./route-samples.json');

function haversine(a, b) {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

(async () => {
  const speeds = { walk: 80, bike: 250 }; // m/min
  const factors = { walk: [], bike: [] };

  for (const pair of samplePairs) {
    const { a, b } = pair;
    const urlWalk = `https://router.project-osrm.org/route/v1/walking/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;
    const urlBike = `https://router.project-osrm.org/route/v1/cycling/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;

    try {
      const [rw, rb] = await Promise.all([fetch(urlWalk), fetch(urlBike)]);
      const dw = await rw.json();
      const db = await rb.json();

      if (dw && dw.code === 'Ok' && Array.isArray(dw.routes) && dw.routes.length > 0) {
        const durationMin = Math.max(1, Math.round(dw.routes[0].duration / 60));
        const dist = haversine(a, b);
        const factor = (durationMin * speeds.walk) / dist;
        factors.walk.push(factor);
      }

      if (db && db.code === 'Ok' && Array.isArray(db.routes) && db.routes.length > 0) {
        const durationMin = Math.max(1, Math.round(db.routes[0].duration / 60));
        const dist = haversine(a, b);
        const factor = (durationMin * speeds.bike) / dist;
        factors.bike.push(factor);
      }
    } catch (err) {
      console.warn('Sample failed:', pair, err.message || err);
    }
  }

  function summarize(arr) {
    if (!arr.length) return null;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const sorted = arr.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { mean, median, count: arr.length };
  }

  const report = { walk: summarize(factors.walk), bike: summarize(factors.bike) };
  console.log('Calibration report:', JSON.stringify(report, null, 2));

  // Optionally write suggested config to file
  const suggested = {
    WALK_ROUTE_FACTOR: report.walk ? report.walk.median : undefined,
    BIKE_ROUTE_FACTOR: report.bike ? report.bike.median : undefined
  };

  fs.writeFileSync('./calibration-result.json', JSON.stringify(suggested, null, 2));
  console.log('Wrote ./calibration-result.json with suggested medians');
})();