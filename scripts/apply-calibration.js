'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calibrationPathCandidates = [
  path.resolve(__dirname, 'calibration-result.json'),
  path.resolve(__dirname, '..', 'calibration-result.json'),
  path.resolve(process.cwd(), 'calibration-result.json')
];

let calibrationPath = calibrationPathCandidates.find(p => fs.existsSync(p));
if (!calibrationPath) calibrationPath = calibrationPathCandidates[1]; // default to repo root if none exists
const configPath = path.resolve(__dirname, '..', 'src', 'config', 'routeConfig.ts');

if (!fs.existsSync(calibrationPath)) {
  console.error('Calibration file not found at', calibrationPath);
  console.error('Run `node scripts/calibrate-route-factor.js` first to generate it.');
  process.exit(2);
}

const raw = fs.readFileSync(calibrationPath, 'utf8');
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse calibration-result.json:', err.message || err);
  process.exit(3);
}

const { WALK_ROUTE_FACTOR, BIKE_ROUTE_FACTOR } = parsed;
if (typeof WALK_ROUTE_FACTOR !== 'number' && typeof BIKE_ROUTE_FACTOR !== 'number') {
  console.error('No numeric WALK_ROUTE_FACTOR or BIKE_ROUTE_FACTOR found in calibration-result.json');
  process.exit(4);
}

let cfg = fs.readFileSync(configPath, 'utf8');

// Replace the numeric literals for WALK_ROUTE_FACTOR and BIKE_ROUTE_FACTOR
if (typeof WALK_ROUTE_FACTOR === 'number') {
  cfg = cfg.replace(/(export let WALK_ROUTE_FACTOR\s*=\s*)([0-9]*\.?[0-9]+)/, `$1${WALK_ROUTE_FACTOR}`);
}
if (typeof BIKE_ROUTE_FACTOR === 'number') {
  cfg = cfg.replace(/(export let BIKE_ROUTE_FACTOR\s*=\s*)([0-9]*\.?[0-9]+)/, `$1${BIKE_ROUTE_FACTOR}`);
}

fs.writeFileSync(configPath, cfg, 'utf8');
console.log('Applied calibration to', configPath);
console.log('New values:', {
  WALK_ROUTE_FACTOR: typeof WALK_ROUTE_FACTOR === 'number' ? WALK_ROUTE_FACTOR : '(unchanged)',
  BIKE_ROUTE_FACTOR: typeof BIKE_ROUTE_FACTOR === 'number' ? BIKE_ROUTE_FACTOR : '(unchanged)'
});

// Optionally run git commit if available
try {
  execSync(`git add "${configPath}"`);
  execSync(`git commit -m "chore(nav): apply calibration factors from scripts/calibration-result.json"`);
  console.log('Committed updated config to git.');
} catch (err) {
  console.warn('Could not commit automatically. You can commit manually.');
}
