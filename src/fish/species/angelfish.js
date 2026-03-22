// Angelfish (Pterophyllum scalare) — tall diamond/disc body, long trailing fins, black vertical stripes
// High-resolution voxel design: voxelSize 0.5, ~350 voxels

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

  // ── Body — tall silver disc ──────────────────────────────
  // Short in x, very tall in y, thin in z (laterally compressed)
  // x: -4 (tail base) to 7 (snout), center at y=0

  ellipse(7,  0, 1, 0, 0xe0e0e0);   // snout tip
  ellipse(6,  0, 2, 1, 0xdadada);   // face
  ellipse(5,  0, 4, 2, 0xdadada);   // head
  ellipse(4,  0, 5, 2, 0xdadada);   // front body
  ellipse(3,  0, 5, 2, 0xd0d0d0);   // body
  ellipse(2,  0, 5, 2, 0xd0d0d0);   // body
  ellipse(1,  0, 5, 2, 0xd0d0d0);   // body
  ellipse(0,  0, 4, 2, 0xc8c8c8);   // rear body
  ellipse(-1, 0, 4, 1, 0xc8c8c8);   // rear body
  ellipse(-2, 0, 3, 1, 0xc8c8c8);   // tapering
  ellipse(-3, 0, 2, 1, 0xc0c0c0);   // tail transition
  ellipse(-4, 0, 2, 1, 0xc0c0c0);   // tail base

  // ── Eyes ─────────────────────────────────────────────────
  set(6, 2,  1, 0x111111);  // left pupil
  set(6, 2, -1, 0x111111);  // right pupil
  // Orange iris ring
  set(6, 3,  1, 0xff9900);
  set(6, 1,  1, 0xff9900);
  set(6, 3, -1, 0xff9900);
  set(6, 1, -1, 0xff9900);

  // ── Vertical Black Stripes (key angelfish feature) ───────
  // 3 bold vertical stripes on outermost z-faces at specific x columns
  const stripeColor = 0x1a1a1a;

  function paintStripe(xPos) {
    const yToMaxZ = new Map();
    for (const [key, voxel] of map) {
      if (voxel[0] === xPos) {
        const y = voxel[1];
        const az = Math.abs(voxel[2]);
        if (!yToMaxZ.has(y) || az > yToMaxZ.get(y)) {
          yToMaxZ.set(y, az);
        }
      }
    }
    for (const [y, maxZ] of yToMaxZ) {
      if (maxZ > 0) {
        set(xPos, y,  maxZ, stripeColor);
        set(xPos, y, -maxZ, stripeColor);
      }
    }
  }

  // Stripe 1: through the eye at x=5
  paintStripe(5);

  // Stripe 2: mid-body at x=2
  paintStripe(2);

  // Stripe 3: rear body at x=-1
  paintStripe(-1);

  // ── Dorsal Fin (very tall, triangular) ───────────────────
  // Rises above the body, z=0 only, triangular shape
  const dorsalFin = [
    [4, 6,  7],
    [3, 6,  9],
    [2, 6,  11],
    [1, 6,  12],   // tallest point
    [0, 5,  9],
  ];
  for (const [x, yStart, yEnd] of dorsalFin) {
    for (let y = yStart; y <= yEnd; y++) {
      const t = (y - yStart) / (yEnd - yStart);
      const color = t < 0.5 ? 0xcccccc : 0xc0c0c0;
      set(x, y, 0, color);
    }
  }

  // Stripe extensions into dorsal fin at x=2
  for (let y = 6; y <= 11; y++) {
    if (map.has(`2,${y},0`)) set(2, y, 0, stripeColor);
  }

  // ── Ventral/Anal Fin (very long, trailing downward) ──────
  const ventralFin = [
    [3, -7,  -6],
    [2, -10, -6],
    [1, -12, -6],   // longest trailing point
    [0, -9,  -5],
    [-1, -7, -5],
  ];
  for (const [x, yEnd, yStart] of ventralFin) {
    for (let y = yEnd; y <= yStart; y++) {
      const t = (yStart - y) / (yStart - yEnd);
      const color = t < 0.5 ? 0xcccccc : 0xc0c0c0;
      set(x, y, 0, color);
    }
  }

  // Stripe extensions into ventral fin at x=2
  for (let y = -10; y <= -6; y++) {
    if (map.has(`2,${y},0`)) set(2, y, 0, stripeColor);
  }
  // Stripe extensions into ventral fin at x=-1
  for (let y = -7; y <= -5; y++) {
    if (map.has(`-1,${y},0`)) set(-1, y, 0, stripeColor);
  }

  // ── Pelvic Fins (long trailing threads) ──────────────────
  // Thin single-voxel columns at z=±1, hanging from x=3
  for (let y = -6; y >= -13; y--) {
    set(3, y,  1, 0xcccccc);
    set(3, y, -1, 0xcccccc);
  }

  // ── Tail Fin (forked, x <= tailCutoff of -5) ─────────────
  // Two prongs spreading in y, gap at y=0 for fork effect
  for (let y = 1; y <= 3; y++) set(-5, y, 0, 0xc0c0c0);
  for (let y = -3; y <= -1; y++) set(-5, y, 0, 0xc0c0c0);
  set(-5, 1, 1, 0xc0c0c0); set(-5, 1, -1, 0xc0c0c0);
  set(-5, -1, 1, 0xc0c0c0); set(-5, -1, -1, 0xc0c0c0);

  for (let y = 2; y <= 4; y++) set(-6, y, 0, 0xb8b8b8);
  for (let y = -4; y <= -2; y++) set(-6, y, 0, 0xb8b8b8);
  set(-6, 2, 1, 0xb8b8b8); set(-6, 2, -1, 0xb8b8b8);
  set(-6, -2, 1, 0xb8b8b8); set(-6, -2, -1, 0xb8b8b8);

  set(-7, 3, 0, 0xb0b0b0); set(-7, 4, 0, 0xb0b0b0); set(-7, 5, 0, 0xb0b0b0);
  set(-7, -3, 0, 0xb0b0b0); set(-7, -4, 0, 0xb0b0b0); set(-7, -5, 0, 0xb0b0b0);

  // ── Pectoral Fins (small, on sides) ──────────────────────
  set(3, 0,  3, 0xcccccc); set(3, -1, 3, 0xcccccc);
  set(2, 0,  3, 0xc8c8c8); set(2, -1, 3, 0xc8c8c8);
  set(3, 0, -3, 0xcccccc); set(3, -1, -3, 0xcccccc);
  set(2, 0, -3, 0xc8c8c8); set(2, -1, -3, 0xc8c8c8);

  return [...map.values()];
}

export default {
  key: 'angelfish',
  name: 'Angelfish',
  emoji: '🐡',
  speed: 3.0,
  turnSpeed: 1.4,
  scale: 0.40,
  voxelSize: 0.5,
  tailCutoff: -5,
  voxels: generate(),
};
