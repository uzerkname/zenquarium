// Clownfish (Amphiprion ocellaris) — realistic proportions
// Real clownfish: elongated oval body, L:H ≈ 2.5:1, moderately compressed
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

  // ── Main body (orange) ────────────────────────────────────────
  // 16 units long (x=13 to x=-2), max yR=3, max zR=2
  // L:H:W = 16:6:4 ≈ 4:1.5:1
  ellipse(13, 0, 0, 0, 0xff8855);  // snout tip
  ellipse(12, 0, 1, 0, 0xff8855);  // snout
  ellipse(11, 0, 1, 1, 0xff6b35);  // face
  ellipse(10, 0, 2, 1, 0xff6b35);  // head
  ellipse(9,  0, 2, 2, 0xff6b35);  // head widening
  ellipse(8,  0, 3, 2, 0xff6b35);  // body front
  ellipse(7,  0, 3, 2, 0xff6b35);  // body
  ellipse(6,  0, 3, 2, 0xff6b35);  // body widest
  ellipse(5,  0, 3, 2, 0xff6b35);  // body widest
  ellipse(4,  0, 3, 2, 0xff6b35);  // body widest
  ellipse(3,  0, 3, 2, 0xff6b35);  // body
  ellipse(2,  0, 3, 2, 0xff6b35);  // body
  ellipse(1,  0, 2, 2, 0xff6b35);  // tapering
  ellipse(0,  0, 2, 1, 0xff6b35);  // tapering
  ellipse(-1, 0, 1, 1, 0xff6b35);  // peduncle
  ellipse(-2, 0, 1, 0, 0xff6b35);  // peduncle

  // ── Belly lighter accent ──────────────────────────────────────
  for (let x = 2; x <= 8; x++) {
    set(x, -3, 0, 0xff8040);
    if (x >= 5 && x <= 7) {
      set(x, -2, -1, 0xff8040);
      set(x, -2, 1, 0xff8040);
    }
  }

  // ── Darker back accent ────────────────────────────────────────
  for (let x = 2; x <= 8; x++) {
    set(x, 3, 0, 0xe55a2b);
  }

  // ── White band 1: Head band x=10,11 with black edges ─────────
  ellipse(11, 0, 1, 1, 0xffffff);
  ellipse(10, 0, 2, 1, 0xffffff);

  // Black edge at x=12 (front)
  set(12, 0, 0, 0x222222);
  set(12, 1, 0, 0x222222);
  set(12, -1, 0, 0x222222);

  // Black edge at x=9 (back)
  for (let y = -2; y <= 2; y++) {
    const yn = 2 > 0 ? Math.abs(y) / 2 : 0;
    const zr = Math.max(0, Math.round(2 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(9, y, zr, 0x222222);
      set(9, y, -zr, 0x222222);
    }
  }

  // ── White band 2: Mid band x=5,6 with black edges ────────────
  ellipse(6, 0, 3, 2, 0xffffff);
  ellipse(5, 0, 3, 2, 0xffffff);

  // Black edges at x=7
  for (let y = -3; y <= 3; y++) {
    const yn = 3 > 0 ? Math.abs(y) / 3 : 0;
    const zr = Math.max(0, Math.round(2 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(7, y, zr, 0x222222);
      set(7, y, -zr, 0x222222);
    }
  }
  // Black edges at x=4
  for (let y = -3; y <= 3; y++) {
    const yn = 3 > 0 ? Math.abs(y) / 3 : 0;
    const zr = Math.max(0, Math.round(2 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(4, y, zr, 0x222222);
      set(4, y, -zr, 0x222222);
    }
  }

  // ── White band 3: Rear band x=0,1 with black edges ───────────
  ellipse(1, 0, 2, 2, 0xffffff);
  ellipse(0, 0, 2, 1, 0xffffff);

  // Black edge at x=2
  for (let y = -3; y <= 3; y++) {
    const yn = 3 > 0 ? Math.abs(y) / 3 : 0;
    const zr = Math.max(0, Math.round(2 * Math.sqrt(Math.max(0, 1 - yn * yn))));
    if (zr > 0) {
      set(2, y, zr, 0x222222);
      set(2, y, -zr, 0x222222);
    }
  }
  // Black edge at x=-1
  for (let y = -1; y <= 1; y++) {
    set(-1, y, 1, 0x222222);
    set(-1, y, -1, 0x222222);
  }

  // ── Dorsal fin (above body, z=0, black tips) ──────────────────
  for (let x = 2; x <= 10; x++) {
    const bodyTop = x >= 8 ? 3 : (x >= 2 ? 3 : 2);
    set(x, bodyTop + 1, 0, 0xe55a2b);
    if (x >= 4 && x <= 8) {
      set(x, bodyTop + 2, 0, 0xe55a2b);
    }
    if (x >= 5 && x <= 7) {
      set(x, bodyTop + 3, 0, 0x222222);
    }
  }

  // ── Pectoral fins ─────────────────────────────────────────────
  for (let x = 6; x <= 8; x++) {
    set(x, 0, 3, 0xff8855);
    set(x, 0, -3, 0xff8855);
    set(x, -1, 3, 0xff8855);
    set(x, -1, -3, 0xff8855);
  }
  set(7, 0, 4, 0xffaa77);
  set(7, 0, -4, 0xffaa77);
  set(7, -1, 4, 0xffaa77);
  set(7, -1, -4, 0xffaa77);

  // ── Anal fin (below body, z=0) ────────────────────────────────
  for (let x = 4; x <= 7; x++) {
    set(x, -4, 0, 0xff6b35);
  }
  set(5, -5, 0, 0xff8855);
  set(6, -5, 0, 0xff8855);

  // ── Tail fin (x <= -3, fan shape) ─────────────────────────────
  for (let y = -2; y <= 2; y++) {
    set(-3, y, 0, 0xff6b35);
    if (Math.abs(y) <= 1) {
      set(-3, y, 1, 0xff6b35);
      set(-3, y, -1, 0xff6b35);
    }
  }
  for (let y = -3; y <= 3; y++) {
    set(-4, y, 0, 0xff6b35);
  }
  for (let y = -4; y <= 4; y++) {
    set(-5, y, 0, Math.abs(y) >= 3 ? 0xff8040 : 0xff6b35);
  }
  for (let y = -3; y <= 3; y++) {
    set(-6, y, 0, Math.abs(y) >= 2 ? 0xffaa77 : 0xff8040);
  }

  // ── Eyes ──────────────────────────────────────────────────────
  set(11, 1, 1, 0x111111);
  set(11, 1, -1, 0x111111);
  set(11, 2, 1, 0xffffff);
  set(11, 2, -1, 0xffffff);

  // ── Mouth ─────────────────────────────────────────────────────
  set(13, -1, 0, 0xe55a2b);

  return [...map.values()];
}

export default {
  key: 'clownfish',
  name: 'Clownfish',
  emoji: '\uD83D\uDC20',
  speed: 10.0,
  turnSpeed: 2.0,
  scale: 0.45,
  voxelSize: 0.5,
  tailCutoff: -3,
  voxels: generate(),
};
