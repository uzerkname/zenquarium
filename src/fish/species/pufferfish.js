// Pufferfish (Tetraodon — Green Spotted Puffer) — realistic proportions
// Real puffer: oblong/boxy body, L:H ≈ 2:1, not perfectly spherical
// x = forward (nose at high x), y = up/down, z = left/right

function generate() {
  const map = new Map();

  function set(x, y, z, color) {
    map.set(`${x},${y},${z}`, [x, y, z, color]);
  }

  function ellipse(x, yCenter, yRadius, zRadius, color) {
    for (let y = Math.ceil(yCenter - yRadius); y <= Math.floor(yCenter + yRadius); y++) {
      const yn = yRadius > 0 ? Math.abs(y - yCenter) / yRadius : 0;
      const zr = Math.max(0, Math.round(zRadius * Math.sqrt(Math.max(0, 1 - yn * yn))));
      for (let z = -zr; z <= zr; z++) {
        set(x, y, z, color);
      }
    }
  }

  // Body profile: [yRadius, zRadius] for each x slice
  function bodyProfile(x) {
    if (x === 8) return [0, 0];
    if (x === 7) return [1, 1];
    if (x === 6) return [2, 2];
    if (x === 5) return [3, 3];
    if (x === 4) return [3, 3];
    if (x === 3) return [3, 3];
    if (x === 2) return [3, 3];
    if (x === 1) return [3, 3];
    if (x === 0) return [3, 3];
    if (x === -1) return [3, 2];
    if (x === -2) return [2, 2];
    if (x === -3) return [1, 1];
    if (x === -4) return [1, 0];
    return null;
  }

  // ── Main body (yellow-olive, oblong) ─────────────────────────────
  // 13 units long (x=8 to x=-4), max yR=3, max zR=3
  // L:H:W = 13:6:6 ≈ 2.2:1:1
  set(8, 0, 0, 0xddbb33);           // beak tip
  ellipse(7, 0, 1, 1, 0xccbb22);    // beak/mouth
  ellipse(6, 0, 2, 2, 0xccbb22);    // face
  ellipse(5, 0, 3, 3, 0xccbb22);    // head
  ellipse(4, 0, 3, 3, 0xccbb22);    // body front
  ellipse(3, 0, 3, 3, 0xbbaa11);    // body widest
  ellipse(2, 0, 3, 3, 0xbbaa11);    // body widest
  ellipse(1, 0, 3, 3, 0xbbaa11);    // body
  ellipse(0, 0, 3, 3, 0xbbaa11);    // body rear
  ellipse(-1, 0, 3, 2, 0xbbaa11);   // tapering
  ellipse(-2, 0, 2, 2, 0xbbaa11);   // tapering
  ellipse(-3, 0, 1, 1, 0xbbaa11);   // tail peduncle
  ellipse(-4, 0, 1, 0, 0xbbaa11);   // tail base

  // ── White belly (two-tone coloring) ──────────────────────────────
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
  const spotPositions = [
    [5, 2], [3, 2], [1, 2], [4, 1], [0, 2],
    [2, 2], [-1, 2], [3, 1], [1, 1],
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
      if (maxZ > 1 && (sx + sy) % 3 === 0) {
        set(sx, sy, maxZ - 1, 0x333300);
        set(sx, sy, -(maxZ - 1), 0x333300);
      }
    }
  }

  // Spots on top surface
  set(3, 3, 0, 0x444400);
  set(1, 3, 1, 0x444400);
  set(1, 3, -1, 0x444400);
  set(2, 3, 0, 0x333300);
  set(0, 3, 0, 0x444400);

  // ── Spine bumps ──────────────────────────────────────────────────
  set(4, 4, 0, 0xddcc33);
  set(2, 4, 0, 0xddcc33);
  set(0, 4, 0, 0xddcc33);

  set(3, 1, 4, 0xddcc33);
  set(3, 1, -4, 0xddcc33);
  set(1, 2, 4, 0xddcc33);
  set(1, 2, -4, 0xddcc33);
  set(4, 0, 4, 0xddcc33);
  set(4, 0, -4, 0xddcc33);

  // ── Eyes (large and bulging) ─────────────────────────────────────
  // Right eye
  set(6, 1, 2, 0xffffff);
  set(6, 0, 2, 0xffffff);
  set(6, 1, 3, 0xffffff);
  set(6, 0, 3, 0xffffff);
  set(6, 1, 4, 0x111111);  // pupil
  set(6, 0, 4, 0x111111);
  set(5, 2, 3, 0xffffff);
  set(5, 2, 4, 0x111111);

  // Left eye
  set(6, 1, -2, 0xffffff);
  set(6, 0, -2, 0xffffff);
  set(6, 1, -3, 0xffffff);
  set(6, 0, -3, 0xffffff);
  set(6, 1, -4, 0x111111);
  set(6, 0, -4, 0x111111);
  set(5, 2, -3, 0xffffff);
  set(5, 2, -4, 0x111111);

  // ── Mouth / Beak ─────────────────────────────────────────────────
  set(7, 0, 0, 0xeecc44);
  set(7, -1, 0, 0xeecc44);
  set(7, 1, 0, 0xeecc44);

  // ── Tail fin (small and round) ───────────────────────────────────
  ellipse(-5, 0, 2, 1, 0xbbaa11);

  for (let y = -3; y <= 3; y++) {
    set(-6, y, 0, 0xccbb22);
  }

  for (let y = -2; y <= 2; y++) {
    set(-7, y, 0, 0xccbb22);
  }

  // ── Pectoral fins (small, stubby) ────────────────────────────────
  set(3, 0, 4, 0xbbaa11);
  set(2, 0, 4, 0xbbaa11);
  set(2, -1, 4, 0xbbaa11);

  set(3, 0, -4, 0xbbaa11);
  set(2, 0, -4, 0xbbaa11);
  set(2, -1, -4, 0xbbaa11);

  // ── Dorsal fin (tiny) ────────────────────────────────────────────
  set(2, 4, 0, 0xbbaa11);
  set(1, 4, 0, 0xbbaa11);
  set(0, 4, 0, 0xbbaa11);

  return [...map.values()];
}

export default {
  key: 'pufferfish',
  name: 'Pufferfish',
  emoji: '\uD83D\uDC21',
  speed: 6.0,
  turnSpeed: 1.0,
  scale: 0.48,
  voxelSize: 0.5,
  tailCutoff: -4,
  voxels: generate(),
};
