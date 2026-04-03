// Betta (Betta splendens) — high-res ~400 voxels, voxelSize 0.5
// Dramatic flowing fins that dwarf the compact body
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

  // ── Main body (deep red, compact) ──────────────────────────────
  set(10, 0, 0, 0xcc3344);          // snout tip
  ellipse(9, 0, 1, 1, 0xbb1133);    // face
  ellipse(8, 0, 2, 1, 0xbb1133);    // head
  ellipse(7, 0, 3, 2, 0xbb1133);    // body
  ellipse(6, 0, 3, 2, 0xcc2244);    // body widest
  ellipse(5, 0, 3, 2, 0xcc2244);    // body
  ellipse(4, 0, 3, 2, 0xbb1133);    // body
  ellipse(3, 0, 2, 2, 0x991122);    // body tapering
  ellipse(2, 0, 2, 1, 0x991122);    // body tapering
  ellipse(1, 0, 1, 1, 0x991122);    // taper
  ellipse(0, 0, 1, 0, 0x991122);    // taper
  set(-1, 0, 0, 0x991122);          // tail base

  // ── Iridescent blue-green sheen on body sides ──────────────────
  for (let x = 8; x >= 3; x--) {
    let yR, zR;
    if (x === 8) { yR = 2; zR = 1; }
    else if (x >= 4 && x <= 7) { yR = 3; zR = 2; }
    else { yR = 2; zR = 2; }

    const color = x >= 7 ? 0x4477cc : x >= 5 ? 0x3366bb : 0x44aacc;

    for (let y = -yR; y <= yR; y++) {
      const yn = yR > 0 ? Math.abs(y) / yR : 0;
      const outerZ = Math.max(0, Math.round(zR * Math.sqrt(Math.max(0, 1 - yn * yn))));
      if (outerZ > 0) {
        set(x, y, outerZ, color);
        set(x, y, -outerZ, color);
      }
    }
  }

  // ── Eyes ────────────────────────────────────────────────────────
  set(9, 1, 1, 0x111111);    // left eye
  set(9, 1, -1, 0x111111);   // right eye

  // ── Snout / mouth ──────────────────────────────────────────────
  set(10, -1, 0, 0xcc3344);  // upturned mouth

  // ── Dorsal fin (MASSIVE flowing) z=0 only ──────────────────────
  const dorsalProfile = [
    // [x, bodyTop, finHeight]
    [7, 3, 1],
    [6, 3, 2],
    [5, 3, 4],
    [4, 3, 5],
    [3, 2, 6],
    [2, 2, 5],
    [1, 1, 4],
    [0, 1, 3],
    [-1, 0, 2],
  ];

  for (const [x, bodyTop, finHeight] of dorsalProfile) {
    for (let dy = 1; dy <= finHeight; dy++) {
      const t = dy / finHeight;
      let color;
      if (t < 0.3) color = 0xdd2299;
      else if (t < 0.5) color = 0xff44aa;
      else if (t < 0.7) color = 0xff55bb;
      else if (t < 0.85) color = 0xff66cc;
      else color = 0xff77dd;
      set(x, bodyTop + dy, 0, color);
    }
  }

  // ── Anal / ventral fin (MASSIVE flowing below body) z=0 only ───
  const analProfile = [
    // [x, bodyBottom, finDepth]
    [5, -3, 2],
    [4, -3, 3],
    [3, -2, 5],
    [2, -2, 6],
    [1, -1, 5],
    [0, -1, 4],
    [-1, 0, 3],
  ];

  for (const [x, bodyBottom, finDepth] of analProfile) {
    for (let dy = 1; dy <= finDepth; dy++) {
      const t = dy / finDepth;
      let color;
      if (t < 0.3) color = 0xdd2299;
      else if (t < 0.5) color = 0xff44aa;
      else if (t < 0.7) color = 0xff55bb;
      else if (t < 0.85) color = 0xff66cc;
      else color = 0xff77dd;
      set(x, bodyBottom - dy, 0, color);
    }
  }

  // ── Tail fan (HUGE halfmoon) — x <= -2 ─────────────────────────
  // Wispy lacy fan: z=0 spine always drawn, edges drawn, interior sparse
  const tailSlices = [
    // [x, yRange, zRange]
    [-2, 3, 1],
    [-3, 4, 2],
    [-4, 5, 3],
    [-5, 6, 3],
    [-6, 4, 2],
    [-7, 2, 1],
  ];

  for (const [x, yRange, zRange] of tailSlices) {
    const dist = Math.abs(x + 2); // 0 at base, 5 at tips
    for (let y = -yRange; y <= yRange; y++) {
      for (let z = -zRange; z <= zRange; z++) {
        const isEdgeY = Math.abs(y) >= yRange;
        const isEdgeZ = Math.abs(z) >= zRange;
        const isSpine = z === 0;

        // Lacy interior: keep edges, spine, and scattered voxels
        if (!isEdgeY && !isEdgeZ && !isSpine) {
          // Keep only ~1 in 4 interior voxels for wispy flowing look
          const hash = ((Math.abs(y) * 7 + Math.abs(z) * 13 + Math.abs(x) * 3) % 4);
          if (hash !== 0) continue;
        }

        // Color gradient
        const edgeness = Math.max(Math.abs(y) / yRange, zRange > 0 ? Math.abs(z) / zRange : 0);
        const t = Math.max(dist / 5, edgeness);
        let color;
        if (t < 0.2) color = 0xcc2244;
        else if (t < 0.4) color = 0xff44aa;
        else if (t < 0.55) color = 0xff55bb;
        else if (t < 0.75) color = 0xff66cc;
        else color = 0xff88ee;

        set(x, y, z, color);
      }
    }
  }

  // ── Pectoral fins (long, flowing, extend in z and droop) ───────
  // Right pectoral (positive z)
  set(6, 0, 3, 0xff44aa); set(6, -1, 3, 0xff44aa);
  set(5, -1, 3, 0xff55bb); set(5, -1, 4, 0xff55bb);
  set(5, -2, 3, 0xff55bb); set(5, -2, 4, 0xff55bb);
  set(4, -2, 4, 0xff66cc); set(4, -2, 5, 0xff66cc);
  set(4, -3, 4, 0xff66cc); set(4, -3, 5, 0xff66cc);
  set(3, -3, 5, 0xff88ee); set(3, -3, 6, 0xff88ee);

  // Left pectoral (negative z)
  set(6, 0, -3, 0xff44aa); set(6, -1, -3, 0xff44aa);
  set(5, -1, -3, 0xff55bb); set(5, -1, -4, 0xff55bb);
  set(5, -2, -3, 0xff55bb); set(5, -2, -4, 0xff55bb);
  set(4, -2, -4, 0xff66cc); set(4, -2, -5, 0xff66cc);
  set(4, -3, -4, 0xff66cc); set(4, -3, -5, 0xff66cc);
  set(3, -3, -5, 0xff88ee); set(3, -3, -6, 0xff88ee);

  return [...map.values()];
}

export default {
  key: 'betta',
  name: 'Betta',
  emoji: '\uD83D\uDD34',
  speed: 9.0,
  turnSpeed: 1.6,
  scale: 0.42,
  voxelSize: 0.5,
  tailCutoff: -2,
  voxels: generate(),
};
