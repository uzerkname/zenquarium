// Pufferfish (Tetraodon — Green Spotted Puffer) — high-res ~420 voxels, voxelSize 0.5
// x = forward (nose at high x), y = up/down, z = left/right
// Nearly spherical body with white belly, dark spots, large bulging eyes, beak mouth

function generate() {
  const map = new Map();

  function set(x, y, z, color) {
    map.set(`${x},${y},${z}`, [x, y, z, color]);
  }

  // Fill an elliptical cross-section at given x position
  function ellipse(x, yCenter, yRadius, zRadius, color) {
    for (let y = Math.ceil(yCenter - yRadius); y <= Math.floor(yCenter + yRadius); y++) {
      const yn = yRadius > 0 ? Math.abs(y - yCenter) / yRadius : 0;
      const zr = Math.max(0, Math.round(zRadius * Math.sqrt(Math.max(0, 1 - yn * yn))));
      for (let z = -zr; z <= zr; z++) {
        set(x, y, z, color);
      }
    }
  }

  // Body profile lookup: returns [yRadius, zRadius] for each x slice
  function bodyProfile(x) {
    if (x === 7) return [1, 1];
    if (x === 6) return [2, 2];
    if (x === 5) return [3, 3];
    if (x === 4) return [4, 4];
    if (x === 3) return [4, 4];
    if (x === 2) return [4, 4];
    if (x === 1) return [4, 4];
    if (x === 0) return [4, 4];
    if (x === -1) return [3, 3];
    if (x === -2) return [3, 3];
    if (x === -3) return [2, 2];
    if (x === -4) return [1, 1];
    return null;
  }

  // ── Main body cross-sections (yellow-olive) ──────────────────────
  // Nearly spherical: z-radius equals y-radius (round, not flat)
  ellipse(7, 0, 1, 1, 0xccbb22);   // mouth/beak area
  ellipse(6, 0, 2, 2, 0xccbb22);   // face
  ellipse(5, 0, 3, 3, 0xccbb22);   // head
  ellipse(4, 0, 4, 4, 0xccbb22);   // body front
  ellipse(3, 0, 4, 4, 0xbbaa11);   // body widest
  ellipse(2, 0, 4, 4, 0xbbaa11);   // body widest
  ellipse(1, 0, 4, 4, 0xbbaa11);   // body widest
  ellipse(0, 0, 4, 4, 0xbbaa11);   // body rear
  ellipse(-1, 0, 3, 3, 0xbbaa11);  // tapering
  ellipse(-2, 0, 3, 3, 0xbbaa11);  // tapering
  ellipse(-3, 0, 2, 2, 0xbbaa11);  // tapering
  ellipse(-4, 0, 1, 1, 0xbbaa11);  // tail base

  // ── Brighter olive accents on front slices ─────────────────────────
  for (let x = 4; x <= 6; x++) {
    const p = bodyProfile(x);
    if (!p) continue;
    set(x, p[0], 0, 0xccbb22);
    if (p[0] > 1) set(x, p[0] - 1, 0, 0xccbb22);
  }

  // ── White belly (key feature: two-tone coloring) ─────────────────
  // Overwrite lower portion with white/cream belly
  // y = -1: transition off-white; y <= -2: full white
  for (let x = -3; x <= 6; x++) {
    const p = bodyProfile(x);
    if (!p) continue;
    const [yr, zr] = p;

    // Transition row: y = -1, off-white
    {
      const y = -1;
      if (y >= -yr) {
        const yn = yr > 0 ? Math.abs(y) / yr : 0;
        const zrAtY = Math.max(0, Math.round(zr * Math.sqrt(Math.max(0, 1 - yn * yn))));
        for (let z = -zrAtY; z <= zrAtY; z++) {
          set(x, y, z, 0xddddcc);
        }
      }
    }

    // Full white belly: y <= -2
    for (let y = -2; y >= -yr; y--) {
      const yn = yr > 0 ? Math.abs(y) / yr : 0;
      const zrAtY = Math.max(0, Math.round(zr * Math.sqrt(Math.max(0, 1 - yn * yn))));
      for (let z = -zrAtY; z <= zrAtY; z++) {
        const isEdge = Math.abs(z) === zrAtY && zrAtY > 0;
        set(x, y, z, isEdge ? 0xddddcc : 0xeeeedd);
      }
    }
  }

  // ── Dark spots on upper body surface ─────────────────────────────
  // Placed on outermost voxels (max |z|) on the upper half (y >= 0)
  const spotPositions = [
    [5, 2], [3, 3], [1, 3], [4, 1], [0, 3],
    [2, 3], [-1, 2], [-2, 2], [3, 2], [1, 1],
    [5, 0], [-1, 0], [4, 2], [2, 1],
  ];

  for (const [sx, sy] of spotPositions) {
    const p = bodyProfile(sx);
    if (!p) continue;
    const [yr, zr] = p;
    if (sy > yr || sy < 0) continue;

    const yn = yr > 0 ? Math.abs(sy) / yr : 0;
    const maxZ = Math.max(0, Math.round(zr * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (maxZ > 0) {
      set(sx, sy, maxZ, 0x444400);
      set(sx, sy, -maxZ, 0x444400);
      // Some spots get a second darker voxel
      if (maxZ > 1 && (sx + sy) % 3 === 0) {
        set(sx, sy, maxZ - 1, 0x333300);
        set(sx, sy, -(maxZ - 1), 0x333300);
      }
    }
  }

  // Spots on top surface (max y)
  set(3, 4, 0, 0x444400);
  set(1, 4, 1, 0x444400);
  set(1, 4, -1, 0x444400);
  set(2, 4, 0, 0x333300);
  set(0, 4, 0, 0x444400);
  set(-1, 3, 1, 0x444400);
  set(-1, 3, -1, 0x444400);

  // ── Spine bumps (protrusions beyond body surface) ────────────────
  // Top spines (extending +y beyond body)
  set(4, 5, 0, 0xddcc33);
  set(2, 5, 0, 0xddcc33);
  set(0, 5, 0, 0xddcc33);
  set(-1, 4, 0, 0xddcc33);

  // Side spines (extending +-z beyond body)
  set(3, 1, 5, 0xddcc33);
  set(3, 1, -5, 0xddcc33);
  set(1, 2, 5, 0xddcc33);
  set(1, 2, -5, 0xddcc33);
  set(4, 0, 5, 0xddcc33);
  set(4, 0, -5, 0xddcc33);

  // ── Eyes (large and bulging!) ────────────────────────────────────
  // Right eye — centered at x=6, y=1-2, z=2-4
  // White sclera
  set(6, 2, 2, 0xffffff);
  set(6, 1, 2, 0xffffff);
  set(6, 2, 3, 0xffffff);
  set(6, 1, 3, 0xffffff);
  // Black pupil (outermost, facing outward)
  set(6, 2, 4, 0x111111);
  set(6, 1, 4, 0x111111);
  // Upper highlight
  set(5, 3, 3, 0xffffff);
  set(5, 3, 4, 0x111111);

  // Left eye — mirror on -z
  set(6, 2, -2, 0xffffff);
  set(6, 1, -2, 0xffffff);
  set(6, 2, -3, 0xffffff);
  set(6, 1, -3, 0xffffff);
  // Black pupil
  set(6, 2, -4, 0x111111);
  set(6, 1, -4, 0x111111);
  // Upper highlight
  set(5, 3, -3, 0xffffff);
  set(5, 3, -4, 0x111111);

  // ── Mouth / Beak ─────────────────────────────────────────────────
  set(7, 0, 0, 0xeecc44);    // center beak
  set(7, -1, 0, 0xeecc44);   // lower beak
  set(7, 1, 0, 0xeecc44);    // upper beak
  set(8, 0, 0, 0xddbb33);    // beak tip (extends slightly forward)

  // ── Tail fin (x <= -4, small and round) ──────────────────────────
  // x=-4 already placed as tail base

  // x=-5: narrow tail
  ellipse(-5, 0, 2, 1, 0xbbaa11);

  // x=-6: fan shape, thin in z
  for (let y = -3; y <= 3; y++) {
    set(-6, y, 0, 0xccbb22);
  }

  // x=-7: tips
  for (let y = -2; y <= 2; y++) {
    set(-7, y, 0, 0xccbb22);
  }

  // ── Pectoral fins (very small, stubby) ───────────────────────────
  // Right fin
  set(3, 0, 5, 0xbbaa11);
  set(2, 0, 5, 0xbbaa11);
  set(2, -1, 5, 0xbbaa11);

  // Left fin
  set(3, 0, -5, 0xbbaa11);
  set(2, 0, -5, 0xbbaa11);
  set(2, -1, -5, 0xbbaa11);

  // ── Dorsal fin (tiny, on top of body) ────────────────────────────
  set(2, 5, 0, 0xbbaa11);
  set(1, 5, 0, 0xbbaa11);
  set(0, 5, 0, 0xbbaa11);

  return [...map.values()];
}

export default {
  key: 'pufferfish',
  name: 'Pufferfish',
  emoji: '\uD83D\uDC21',
  speed: 2.5,
  turnSpeed: 1.0,
  scale: 0.50,
  voxelSize: 0.5,
  tailCutoff: -4,
  voxels: generate(),
};
