import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, WALL_MARGIN, SAND_MARGIN } from '../constants.js';

const HW = TANK_WIDTH  / 2;
const HH = TANK_HEIGHT / 2;
const HD = TANK_DEPTH  / 2;

export function randomTarget() {
  const margin = WALL_MARGIN + 0.5;
  return {
    x: (Math.random() - 0.5) * (TANK_WIDTH  - margin * 2),
    y: -HH + SAND_MARGIN + Math.random() * (TANK_HEIGHT - SAND_MARGIN - 1.5),
    z: (Math.random() - 0.5) * (TANK_DEPTH  - margin * 2),
  };
}

export function reached(pos, target, threshold = 2.5) {
  const dx = pos.x - target.x;
  const dy = pos.y - target.y;
  const dz = pos.z - target.z;
  return dx * dx + dy * dy + dz * dz < threshold * threshold;
}

/**
 * Returns a wall-avoidance force vector (scaled by proximity).
 */
export function wallRepulsion(pos) {
  let fx = 0, fy = 0, fz = 0;
  const M = WALL_MARGIN;

  const distLeft  = pos.x - (-HW); if (distLeft  < M) fx += (M - distLeft)  / M;
  const distRight = HW - pos.x;    if (distRight < M) fx -= (M - distRight) / M;
  const distBot   = pos.y - (-HH + SAND_MARGIN); if (distBot < M) fy += (M - distBot) / M;
  const distTop   = HH - pos.y;   if (distTop   < M) fy -= (M - distTop)   / M;
  const distFront = HD - pos.z;    if (distFront < M) fz -= (M - distFront) / M;
  const distBack  = pos.z - (-HD); if (distBack  < M) fz += (M - distBack)  / M;

  return { x: fx, y: fy, z: fz };
}

export function clampToBounds(pos) {
  const margin = 0.3;
  pos.x = Math.max(-HW + margin, Math.min(HW - margin, pos.x));
  pos.y = Math.max(-HH + SAND_MARGIN, Math.min(HH - 0.8, pos.y));
  pos.z = Math.max(-HD + margin, Math.min(HD - margin, pos.z));
}
