// Blue Tang (Paracanthurus hepatus) — high-res voxel model
// Royal blue oval body, black "palette" marking, vivid yellow tail

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

  // ── Body — royal blue oval disc ──────────────────────────
  ellipse(9, 0, 1, 0, 0x2266dd);   // snout tip
  ellipse(8, 0, 2, 1, 0x1155cc);   // face
  ellipse(7, 0, 3, 1, 0x1155cc);   // head
  ellipse(6, 0, 4, 2, 0x1155cc);   // body front
  ellipse(5, 0, 5, 2, 0x1155cc);   // body widest
  ellipse(4, 0, 5, 2, 0x1155cc);   // body widest
  ellipse(3, 0, 5, 2, 0x1155cc);   // body mid
  ellipse(2, 0, 4, 2, 0x1044bb);   // body rear
  ellipse(1, 0, 4, 2, 0x1044bb);   // body rear
  ellipse(0, 0, 3, 1, 0x0f3aaa);   // tapering
  ellipse(-1, 0, 2, 1, 0x0f3aaa);  // tapering
  ellipse(-2, 0, 2, 1, 0x0f3aaa);  // tapering
  ellipse(-3, 0, 1, 1, 0x0f3aaa);  // tail base

  // ── Black "palette" marking ──────────────────────────────
  // Distinctive teardrop/comma shape on both sides.
  // Runs along outermost z-faces, starts near eye, curves upward toward tail.
  function markBothSides(x, y, zOuter, color) {
    set(x, y, zOuter, color);
    set(x, y, -zOuter, color);
  }

  const BLACK = 0x111122;

  // x=7: thin start near eye (outer z=1)
  markBothSides(7, 0, 1, BLACK);

  // x=6: line at y=0 to y=1 (outer z=2)
  markBothSides(6, 0, 2, BLACK);
  markBothSides(6, 1, 2, BLACK);

  // x=5: palette widens y=-1 to y=2 (outer z=2)
  for (let y = -1; y <= 2; y++) markBothSides(5, y, 2, BLACK);

  // x=4: palette widest y=-1 to y=3 (outer z=2)
  for (let y = -1; y <= 3; y++) markBothSides(4, y, 2, BLACK);

  // x=3: palette y=0 to y=3 (outer z=2)
  for (let y = 0; y <= 3; y++) markBothSides(3, y, 2, BLACK);

  // x=2: upper curve y=1 to y=3 (outer z=2)
  for (let y = 1; y <= 3; y++) markBothSides(2, y, 2, BLACK);

  // x=1: narrow curve y=2 to y=3 (outer z=2)
  markBothSides(1, 2, 2, BLACK);
  markBothSides(1, 3, 2, BLACK);

  // x=0: curve ends y=2 (outer z=1)
  markBothSides(0, 2, 1, BLACK);

  // ── Eyes ─────────────────────────────────────────────────
  set(8, 2, 1, 0x111111);   // right pupil
  set(8, 2, -1, 0x111111);  // left pupil
  set(8, 3, 0, 0xffffff);   // highlight

  // ── Snout ────────────────────────────────────────────────
  set(9, 0, 0, 0x2266dd);

  // ── Dorsal fin — dark blue, thin (z=0) ───────────────────
  const dorsalDk = 0x0f3aaa;
  const dorsalMd = 0x1044bb;

  // x=6: body top is y=4, add 1 above
  set(6, 5, 0, dorsalMd);

  // x=5: body top is y=5, add 2 above
  set(5, 6, 0, dorsalDk);
  set(5, 7, 0, dorsalDk);

  // x=4: body top is y=5, add 3 above (tallest)
  set(4, 6, 0, dorsalDk);
  set(4, 7, 0, dorsalDk);
  set(4, 8, 0, dorsalMd);

  // x=3: body top is y=5, add 3 above
  set(3, 6, 0, dorsalDk);
  set(3, 7, 0, dorsalDk);
  set(3, 8, 0, dorsalMd);

  // x=2: body top is y=4, add 2 above
  set(2, 5, 0, dorsalDk);
  set(2, 6, 0, dorsalDk);

  // x=1: body top is y=4, add 1 above
  set(1, 5, 0, dorsalMd);

  // ── Anal/ventral fin — dark blue, thin (z=0) ─────────────
  // x=5: body bottom is y=-5, drop 1
  set(5, -6, 0, dorsalMd);

  // x=4: body bottom is y=-5, drop 2
  set(4, -6, 0, dorsalDk);
  set(4, -7, 0, dorsalDk);

  // x=3: body bottom is y=-5, drop 3 (deepest)
  set(3, -6, 0, dorsalDk);
  set(3, -7, 0, dorsalDk);
  set(3, -8, 0, dorsalMd);

  // x=2: body bottom is y=-4, drop 2
  set(2, -5, 0, dorsalDk);
  set(2, -6, 0, dorsalDk);

  // x=1: body bottom is y=-4, drop 1
  set(1, -5, 0, dorsalMd);

  // ── Pectoral fins — small, blue ──────────────────────────
  set(6, 0, 3, 0x1155cc);
  set(6, -1, 3, 0x1155cc);
  set(5, 0, 3, 0x1044bb);
  set(5, -1, 3, 0x1044bb);

  set(6, 0, -3, 0x1155cc);
  set(6, -1, -3, 0x1155cc);
  set(5, 0, -3, 0x1044bb);
  set(5, -1, -3, 0x1044bb);

  // ── Yellow tail (x <= tailCutoff = -3) ───────────────────
  const YELLOW = 0xffcc00;
  const YELLOW_HI = 0xffdd00;
  const YELLOW_DK = 0xffbb00;

  // x=-3: transition zone — mix of blue/yellow
  set(-3, 0, 0, YELLOW_DK);
  set(-3, 0, 1, YELLOW_DK);
  set(-3, 0, -1, YELLOW_DK);

  // x=-4: yellow column y=-3 to 3
  for (let y = -3; y <= 3; y++) {
    set(-4, y, 0, y === 0 ? YELLOW_HI : YELLOW);
  }

  // x=-5: wider yellow y=-4 to 4
  for (let y = -4; y <= 4; y++) {
    set(-5, y, 0, Math.abs(y) >= 4 ? YELLOW_DK : YELLOW);
  }

  // x=-6: yellow fan with fork (skip y=0) y=-5 to 5
  for (let y = -5; y <= 5; y++) {
    if (y === 0) continue; // fork gap
    const color = Math.abs(y) >= 5 ? YELLOW_DK : (Math.abs(y) <= 1 ? YELLOW_HI : YELLOW);
    set(-6, y, 0, color);
  }

  // x=-7: fork tips only
  for (let y = -6; y <= -4; y++) {
    set(-7, y, 0, y === -6 ? YELLOW_DK : YELLOW);
  }
  for (let y = 4; y <= 6; y++) {
    set(-7, y, 0, y === 6 ? YELLOW_DK : YELLOW);
  }

  // ── Yellow accent on lower tail base ─────────────────────
  set(-2, -2, 0, YELLOW_DK);
  set(-2, -2, 1, YELLOW_DK);
  set(-2, -2, -1, YELLOW_DK);
  set(-1, -2, 1, YELLOW_DK);
  set(-1, -2, -1, YELLOW_DK);

  return [...map.values()];
}

export default {
  key: 'tang',
  name: 'Blue Tang',
  emoji: '\uD83D\uDC99',
  speed: 5.0,
  turnSpeed: 2.2,
  scale: 0.42,
  voxelSize: 0.5,
  tailCutoff: -3,
  voxels: generate(),
};
