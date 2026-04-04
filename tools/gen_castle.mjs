// Generate a high-detail castle voxel model
// Target: ~16x22x12 grid (2x the old 8x12x6)

const voxels = [];
const occupied = new Set();

const LIGHT    = 0x999999;
const MID      = 0x888888;
const DARK     = 0x777777;
const MOSSY    = 0x607060;
const DK_MOSSY = 0x506050;
const GATE     = 0x222222;
const ARCH     = 0x555555;
const WINDOW   = 0x111133;
const FLAG     = 0xcc2222;
const FLAG2    = 0xcc3333;
const POLE     = 0x444444;
const WOOD     = 0x6b4226;
const DK_WOOD  = 0x4a2e18;

function stone(x, y, z) {
  return ((x + y + z) % 2 === 0) ? LIGHT : MID;
}
function mossy(x, y, z) {
  return ((x + y + z) % 2 === 0) ? MOSSY : DK_MOSSY;
}

function add(x, y, z, color) {
  const k = `${x},${y},${z}`;
  if (occupied.has(k)) return; // no dupes
  occupied.add(k);
  voxels.push([x, y, z, color]);
}

const W = 15, D = 11;

// ── Perimeter walls (y=0..5, 1-thick shell) ──
for (let y = 0; y < 6; y++) {
  const c = y < 2 ? mossy : stone;

  // Front wall z=0
  for (let x = 0; x < W; x++) {
    // Gate opening: x=6..8, y=0..3
    if (x >= 6 && x <= 8 && y < 4) {
      if (y === 3) add(x, y, 0, ARCH);
      continue;
    }
    add(x, y, 0, c(x, y, 0));
  }
  // Back wall z=D-1
  for (let x = 0; x < W; x++) add(x, y, D - 1, c(x, y, D - 1));
  // Left wall x=0
  for (let z = 1; z < D - 1; z++) add(0, y, z, c(0, y, z));
  // Right wall x=W-1
  for (let z = 1; z < D - 1; z++) add(W - 1, y, z, c(W - 1, y, z));
}

// ── Wall battlements y=6 (alternating merlons) ──
for (let x = 0; x < W; x += 2) {
  if (!(x >= 6 && x <= 8)) add(x, 6, 0, DARK);
  add(x, 6, D - 1, DARK);
}
for (let z = 1; z < D - 1; z += 2) {
  add(0, 6, z, DARK);
  add(W - 1, 6, z, DARK);
}

// ── Arrow slits on walls (y=3) ──
[3, 11].forEach(x => { add(x, 3, 0, WINDOW); }); // front
[3, 7, 11].forEach(x => { add(x, 3, D - 1, WINDOW); }); // back
[3, 7].forEach(z => { add(0, 3, z, WINDOW); }); // left
[3, 7].forEach(z => { add(W - 1, 3, z, WINDOW); }); // right

// ── Corner towers (3x3 base, 12 high) ──
function buildTower(bx, bz, h) {
  for (let y = 0; y < h; y++) {
    const c = y < 2 ? mossy : stone;
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        const x = bx + dx, z = bz + dz;
        // Hollow interior above y=1
        const isShell = dx === 0 || dx === 2 || dz === 0 || dz === 2;
        if (!isShell && y >= 2) {
          // Window at y=5,8 on outer faces
          if (y === 5 || y === 8) add(x, y, z, WINDOW);
          continue;
        }
        add(x, y, z, c(x, y, z));
      }
    }
  }
  // Battlements
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      if ((dx + dz) % 2 === 0) add(bx + dx, h, bz + dz, DARK);
    }
  }
  // Flag pole + flag
  add(bx + 1, h + 1, bz + 1, POLE);
  add(bx + 1, h + 2, bz + 1, POLE);
  add(bx + 1, h + 3, bz + 1, FLAG);
  add(bx + 2, h + 3, bz + 1, FLAG2);
  add(bx + 1, h + 2, bz + 2, FLAG2);
}

buildTower(0, 0, 12);              // front-left
buildTower(W - 3, 0, 12);          // front-right
buildTower(0, D - 3, 12);          // back-left
buildTower(W - 3, D - 3, 12);      // back-right

// ── Central keep (4x4 base, 18 high) ──
const kx = Math.floor((W - 4) / 2); // 5
const kz = Math.floor((D - 4) / 2); // 3
for (let y = 0; y < 18; y++) {
  const c = y < 2 ? mossy : stone;
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = 0; dz < 4; dz++) {
      const x = kx + dx, z = kz + dz;
      const isShell = dx === 0 || dx === 3 || dz === 0 || dz === 3;
      if (!isShell && y >= 2) {
        // Windows at y=4,7,10,13
        if (y === 4 || y === 7 || y === 10 || y === 13) add(x, y, z, WINDOW);
        continue;
      }
      add(x, y, z, c(x, y, z));
    }
  }
}
// Keep battlements
for (let dx = 0; dx < 4; dx++) {
  for (let dz = 0; dz < 4; dz++) {
    if ((dx + dz) % 2 === 0) add(kx + dx, 18, kz + dz, DARK);
  }
}
// Keep flag (tall)
for (let fy = 19; fy <= 22; fy++) add(kx + 2, fy, kz + 2, POLE);
add(kx + 1, 22, kz + 2, FLAG);
add(kx + 1, 21, kz + 2, FLAG);
add(kx + 2, 22, kz + 3, FLAG2);
add(kx + 2, 21, kz + 3, FLAG2);
add(kx + 1, 22, kz + 3, FLAG);
add(kx + 2, 22, kz + 1, FLAG2);

// ── Gate details ──
// Wooden gate doors (y=0..2, x=6 and x=8, z=0)
for (let y = 0; y < 3; y++) {
  add(6, y, 0, WOOD);
  add(8, y, 0, DK_WOOD);
}
// Portcullis hints (iron bars at gate top)
add(7, 3, 0, DARK);

// ── Courtyard details ──
// Inner walkway along walls (y=4, one voxel wide inside)
for (let x = 3; x < W - 3; x++) {
  if (x >= kx && x < kx + 4) continue;
  add(x, 4, 1, DARK);
  add(x, 4, D - 2, DARK);
}
for (let z = 3; z < D - 3; z++) {
  if (z >= kz && z < kz + 4) continue;
  add(1, 4, z, DARK);
  add(W - 2, 4, z, DARK);
}

// ── Output ──
// Sort for readability
voxels.sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);

const xs = voxels.map(v => v[0]), ys = voxels.map(v => v[1]), zs = voxels.map(v => v[2]);
console.error(`Voxels: ${voxels.length}`);
console.error(`X: ${Math.min(...xs)}-${Math.max(...xs)} (${Math.max(...xs) - Math.min(...xs) + 1})`);
console.error(`Y: ${Math.min(...ys)}-${Math.max(...ys)} (${Math.max(...ys) - Math.min(...ys) + 1})`);
console.error(`Z: ${Math.min(...zs)}-${Math.max(...zs)} (${Math.max(...zs) - Math.min(...zs) + 1})`);

// Format as JS
function hex(n) {
  return '0x' + n.toString(16).padStart(6, '0');
}

let lines = [];
let line = '    ';
for (let i = 0; i < voxels.length; i++) {
  const [x, y, z, c] = voxels[i];
  const entry = `[${x},${y},${z},${hex(c)}]`;
  if (line.length + entry.length + 1 > 95) {
    lines.push(line);
    line = '    ' + entry + ',';
  } else {
    line += entry + ',';
  }
}
if (line.trim()) lines.push(line);

console.log(`export default {
  key: 'castle',
  name: 'Castle',
  emoji: '\\u{1F3F0}',
  footprint: { w: ${W}, d: ${D} },
  voxels: [
${lines.join('\n')}
  ],
};`);
