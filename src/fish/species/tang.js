// Blue Tang (Paracanthurus hepatus) — realistic proportions
// Real tang: oval disc body, L:H ≈ 2:1, laterally compressed
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

  // ── Body — royal blue oval disc ──────────────────────────────
  // 14 units long (x=10 to x=-3), max yR=4, max zR=2
  // L:H:W = 14:8:4 ≈ 3.5:2:1 (laterally compressed disc)
  ellipse(10, 0, 1, 0, 0x2266dd);   // snout tip
  ellipse(9,  0, 2, 1, 0x1155cc);   // face
  ellipse(8,  0, 3, 1, 0x1155cc);   // head
  ellipse(7,  0, 4, 2, 0x1155cc);   // body front
  ellipse(6,  0, 4, 2, 0x1155cc);   // body
  ellipse(5,  0, 4, 2, 0x1155cc);   // body widest
  ellipse(4,  0, 4, 2, 0x1155cc);   // body widest
  ellipse(3,  0, 4, 2, 0x1044bb);   // body mid
  ellipse(2,  0, 3, 2, 0x1044bb);   // body rear
  ellipse(1,  0, 3, 1, 0x1044bb);   // body rear
  ellipse(0,  0, 2, 1, 0x0f3aaa);   // tapering
  ellipse(-1, 0, 2, 1, 0x0f3aaa);   // tapering
  ellipse(-2, 0, 1, 1, 0x0f3aaa);   // tail peduncle
  ellipse(-3, 0, 1, 0, 0x0f3aaa);   // tail base

  // ── Black "palette" marking ──────────────────────────────────
  function markBothSides(x, y, zOuter, color) {
    set(x, y, zOuter, color);
    set(x, y, -zOuter, color);
  }

  const BLACK = 0x111122;

  // x=8: thin start near eye (outer z=1)
  markBothSides(8, 0, 1, BLACK);

  // x=7: line at y=0 to y=1 (outer z=2)
  markBothSides(7, 0, 2, BLACK);
  markBothSides(7, 1, 2, BLACK);

  // x=6: palette widens y=-1 to y=2 (outer z=2)
  for (let y = -1; y <= 2; y++) markBothSides(6, y, 2, BLACK);

  // x=5: palette widest y=-1 to y=2 (outer z=2)
  for (let y = -1; y <= 2; y++) markBothSides(5, y, 2, BLACK);

  // x=4: palette y=0 to y=2 (outer z=2)
  for (let y = 0; y <= 2; y++) markBothSides(4, y, 2, BLACK);

  // x=3: upper curve y=1 to y=2 (outer z=2)
  for (let y = 1; y <= 2; y++) markBothSides(3, y, 2, BLACK);

  // x=2: curve ends y=2 (outer z=2)
  markBothSides(2, 2, 2, BLACK);

  // x=1: curve ends y=2 (outer z=1)
  markBothSides(1, 2, 1, BLACK);

  // ── Eyes ─────────────────────────────────────────────────────
  set(9, 2, 1, 0x111111);   // right pupil
  set(9, 2, -1, 0x111111);  // left pupil
  set(9, 3, 0, 0xffffff);   // highlight

  // ── Dorsal fin — dark blue, thin (z=0) ───────────────────────
  const dorsalDk = 0x0f3aaa;
  const dorsalMd = 0x1044bb;

  set(7, 5, 0, dorsalMd);

  set(6, 5, 0, dorsalDk);
  set(6, 6, 0, dorsalDk);

  set(5, 5, 0, dorsalDk);
  set(5, 6, 0, dorsalDk);
  set(5, 7, 0, dorsalMd);

  set(4, 5, 0, dorsalDk);
  set(4, 6, 0, dorsalDk);
  set(4, 7, 0, dorsalMd);

  set(3, 5, 0, dorsalDk);
  set(3, 6, 0, dorsalDk);

  set(2, 4, 0, dorsalMd);

  // ── Anal/ventral fin — dark blue, thin (z=0) ─────────────────
  set(6, -5, 0, dorsalMd);

  set(5, -5, 0, dorsalDk);
  set(5, -6, 0, dorsalDk);

  set(4, -5, 0, dorsalDk);
  set(4, -6, 0, dorsalDk);
  set(4, -7, 0, dorsalMd);

  set(3, -5, 0, dorsalDk);
  set(3, -6, 0, dorsalDk);

  set(2, -4, 0, dorsalMd);

  // ── Pectoral fins — small, blue ──────────────────────────────
  set(7, 0, 3, 0x1155cc);
  set(7, -1, 3, 0x1155cc);
  set(6, 0, 3, 0x1044bb);
  set(6, -1, 3, 0x1044bb);

  set(7, 0, -3, 0x1155cc);
  set(7, -1, -3, 0x1155cc);
  set(6, 0, -3, 0x1044bb);
  set(6, -1, -3, 0x1044bb);

  // ── Yellow tail (x <= -3) ────────────────────────────────────
  const YELLOW = 0xffcc00;
  const YELLOW_HI = 0xffdd00;
  const YELLOW_DK = 0xffbb00;

  // x=-3: transition
  set(-3, 0, 0, YELLOW_DK);

  // x=-4: yellow column y=-3 to 3
  for (let y = -3; y <= 3; y++) {
    set(-4, y, 0, y === 0 ? YELLOW_HI : YELLOW);
  }

  // x=-5: wider y=-4 to 4
  for (let y = -4; y <= 4; y++) {
    set(-5, y, 0, Math.abs(y) >= 4 ? YELLOW_DK : YELLOW);
  }

  // x=-6: fan with fork (skip y=0) y=-5 to 5
  for (let y = -5; y <= 5; y++) {
    if (y === 0) continue;
    const color = Math.abs(y) >= 5 ? YELLOW_DK : (Math.abs(y) <= 1 ? YELLOW_HI : YELLOW);
    set(-6, y, 0, color);
  }

  // x=-7: fork tips
  for (let y = -6; y <= -4; y++) {
    set(-7, y, 0, y === -6 ? YELLOW_DK : YELLOW);
  }
  for (let y = 4; y <= 6; y++) {
    set(-7, y, 0, y === 6 ? YELLOW_DK : YELLOW);
  }

  // ── Yellow accent on lower tail base ─────────────────────────
  set(-2, -1, 0, YELLOW_DK);
  set(-2, -1, 1, YELLOW_DK);
  set(-2, -1, -1, YELLOW_DK);
  set(-1, -2, 1, YELLOW_DK);
  set(-1, -2, -1, YELLOW_DK);

  return [...map.values()];
}

export default {
  key: 'tang',
  name: 'Blue Tang',
  emoji: '\uD83D\uDC99',
  speed: 12.0,
  turnSpeed: 2.2,
  scale: 0.42,
  voxelSize: 0.5,
  tailCutoff: -3,
  voxels: generate(),
};
