// Clownfish (Amphiprion ocellaris) — high-res ~350 voxels, voxelSize 0.5
// x = forward (nose at high x), y = up/down, z = left/right

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

  // ── Main body cross-sections (orange) ─────────────────────────
  // Snout
  ellipse(11, 1, 1, 0, 0xff8855);  // snout tip, single point

  // Face
  ellipse(10, 1, 2, 1, 0xff6b35);

  // Head
  ellipse(9, 1, 3, 2, 0xff6b35);
  ellipse(8, 1, 4, 2, 0xff6b35);

  // Body — widest section
  ellipse(7, 1, 5, 3, 0xff6b35);
  ellipse(6, 1, 5, 3, 0xff6b35);
  ellipse(5, 1, 5, 3, 0xff6b35);
  ellipse(4, 1, 5, 3, 0xff6b35);
  ellipse(3, 1, 5, 3, 0xff6b35);

  // Tapering toward tail
  ellipse(2, 1, 4, 3, 0xff6b35);
  ellipse(1, 1, 4, 2, 0xff6b35);
  ellipse(0, 1, 3, 2, 0xff6b35);
  ellipse(-1, 1, 3, 2, 0xff6b35);
  ellipse(-2, 1, 2, 1, 0xff6b35);
  ellipse(-3, 1, 1, 1, 0xff6b35);

  // ── Belly lighter orange accent ───────────────────────────────
  // Add lighter belly voxels along the bottom of the wider body sections
  for (let x = 3; x <= 7; x++) {
    set(x, -4, 0, 0xff8040);
    if (x >= 4 && x <= 6) {
      set(x, -3, -1, 0xff8040);
      set(x, -3, 1, 0xff8040);
    }
  }

  // ── Darker back accent ────────────────────────────────────────
  for (let x = 2; x <= 7; x++) {
    set(x, 6, 0, 0xe55a2b);
    if (x >= 4 && x <= 6) {
      set(x, 5, 0, 0xe55a2b);
    }
  }

  // ── White band 1: Head band at x=8,9 with black edges ────────
  // White: overwrite all voxels at x=8 and x=9
  ellipse(9, 1, 3, 2, 0xffffff);
  ellipse(8, 1, 4, 2, 0xffffff);

  // Black edges at x=10 (front edge) — outer z-faces only
  for (let y = Math.ceil(1 - 2); y <= Math.floor(1 + 2); y++) {
    const yn = 2 > 0 ? Math.abs(y - 1) / 2 : 0;
    const zr = Math.max(0, Math.round(1 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(10, y, zr, 0x222222);
      set(10, y, -zr, 0x222222);
    }
  }
  // Black edges at x=7 (back edge) — outer z-faces only
  for (let y = Math.ceil(1 - 5); y <= Math.floor(1 + 5); y++) {
    const yn = 5 > 0 ? Math.abs(y - 1) / 5 : 0;
    const zr = Math.max(0, Math.round(3 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(7, y, zr, 0x222222);
      set(7, y, -zr, 0x222222);
    }
  }

  // ── White band 2: Mid band at x=3,4 with black edges ─────────
  ellipse(4, 1, 5, 3, 0xffffff);
  ellipse(3, 1, 5, 3, 0xffffff);

  // Black edges at x=5 — outer z-faces only
  for (let y = Math.ceil(1 - 5); y <= Math.floor(1 + 5); y++) {
    const yn = 5 > 0 ? Math.abs(y - 1) / 5 : 0;
    const zr = Math.max(0, Math.round(3 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(5, y, zr, 0x222222);
      set(5, y, -zr, 0x222222);
    }
  }
  // Black edges at x=2 — outer z-faces only
  for (let y = Math.ceil(1 - 4); y <= Math.floor(1 + 4); y++) {
    const yn = 4 > 0 ? Math.abs(y - 1) / 4 : 0;
    const zr = Math.max(0, Math.round(3 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(2, y, zr, 0x222222);
      set(2, y, -zr, 0x222222);
    }
  }

  // ── White band 3: Rear band at x=-1 with black edges ─────────
  ellipse(-1, 1, 3, 2, 0xffffff);

  // Black edge at x=0 — outer z-faces
  for (let y = Math.ceil(1 - 3); y <= Math.floor(1 + 3); y++) {
    const yn = 3 > 0 ? Math.abs(y - 1) / 3 : 0;
    const zr = Math.max(0, Math.round(2 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(0, y, zr, 0x222222);
      set(0, y, -zr, 0x222222);
    }
  }
  // Black edge at x=-2 — outer z-faces
  for (let y = Math.ceil(1 - 2); y <= Math.floor(1 + 2); y++) {
    const yn = 2 > 0 ? Math.abs(y - 1) / 2 : 0;
    const zr = Math.max(0, Math.round(1 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(-2, y, zr, 0x222222);
      set(-2, y, -zr, 0x222222);
    }
  }

  // ── Dorsal fin (above body, z=0, darker orange with black tips) ──
  for (let x = 2; x <= 8; x++) {
    // Find the top of the body at this x to place fin above it
    let bodyTop;
    if (x >= 7) bodyTop = 6;
    else if (x >= 2) bodyTop = 6;
    else bodyTop = 5;

    set(x, bodyTop + 1, 0, 0xe55a2b);
    if (x >= 3 && x <= 7) {
      set(x, bodyTop + 2, 0, 0xe55a2b);
    }
    if (x >= 4 && x <= 6) {
      set(x, bodyTop + 3, 0, 0x222222); // black tips
    }
  }

  // ── Pectoral fins (extend in z, at mid-body) ─────────────────
  for (let x = 5; x <= 7; x++) {
    set(x, 0, 4, 0xff8855);
    set(x, 0, -4, 0xff8855);
    set(x, 1, 4, 0xff8855);
    set(x, 1, -4, 0xff8855);
  }
  // Fin tips
  set(6, 0, 5, 0xffaa77);
  set(6, 0, -5, 0xffaa77);
  set(6, 1, 5, 0xffaa77);
  set(6, 1, -5, 0xffaa77);

  // ── Anal fin (below body, z=0) ────────────────────────────────
  for (let x = 3; x <= 5; x++) {
    set(x, -5, 0, 0xff6b35);
  }
  set(4, -6, 0, 0xff8855);

  // ── Tail fin (x <= -4, fan shape in y, thin in z) ─────────────
  // x = -4: tail base
  for (let y = -2; y <= 4; y++) {
    set(-4, y, 0, 0xff6b35);
    if (y >= -1 && y <= 3) {
      set(-4, y, 1, 0xff6b35);
      set(-4, y, -1, 0xff6b35);
    }
  }

  // x = -5: wider fan
  for (let y = -3; y <= 5; y++) {
    set(-5, y, 0, 0xff6b35);
  }

  // x = -6: widest spread
  for (let y = -4; y <= 6; y++) {
    const isEdge = y <= -3 || y >= 5;
    set(-6, y, 0, isEdge ? 0xff8040 : 0xff6b35);
  }

  // x = -7: tips
  for (let y = -3; y <= 5; y++) {
    const isEdge = y <= -2 || y >= 4;
    set(-7, y, 0, isEdge ? 0xffaa77 : 0xff8040);
  }

  // ── Eyes ──────────────────────────────────────────────────────
  // Black pupils
  set(10, 2, 1, 0x111111);
  set(10, 2, -1, 0x111111);
  // White eye highlights (above pupil)
  set(10, 3, 1, 0xffffff);
  set(10, 3, -1, 0xffffff);

  // ── Mouth line ────────────────────────────────────────────────
  set(11, 0, 0, 0xe55a2b);

  return [...map.values()];
}

export default {
  key: 'clownfish',
  name: 'Clownfish',
  emoji: '\uD83D\uDC20',
  speed: 4.0,
  turnSpeed: 2.0,
  scale: 0.45,
  voxelSize: 0.5,
  tailCutoff: -4,
  voxels: generate(),
};
