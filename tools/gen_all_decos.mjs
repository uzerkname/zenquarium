#!/usr/bin/env node
// Generate high-detail voxel models for all aquarium decorations.
// Run: node tools/gen_all_decos.mjs
// Writes files to src/decorations/types/

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'decorations', 'types');

// ─── Shared helpers ──────────────────────────────────────────────────────────

class VoxelBuilder {
  constructor() {
    this.set = new Set();
    this.voxels = [];
  }
  add(x, y, z, color) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    const k = `${x},${y},${z}`;
    if (this.set.has(k)) return;
    this.set.add(k);
    this.voxels.push([x, y, z, color]);
  }
  /** Fill a solid box */
  box(x0, y0, z0, x1, y1, z1, colorFn) {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          this.add(x, y, z, typeof colorFn === 'function' ? colorFn(x, y, z) : colorFn);
  }
  /** Fill a hollow box shell */
  shell(x0, y0, z0, x1, y1, z1, colorFn) {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          if (x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1) continue;
          this.add(x, y, z, typeof colorFn === 'function' ? colorFn(x, y, z) : colorFn);
        }
  }
  /** Test if (x,z) is inside a voxel-circle of given radius centered at (cx,cz) */
  inCircle(x, z, cx, cz, r) {
    const dx = x - cx, dz = z - cz;
    return dx * dx + dz * dz <= r * r + 0.5;
  }
  /** Disc at given y */
  disc(cx, cz, r, y, colorFn) {
    const lo = Math.floor(cx - r - 1), hi = Math.ceil(cx + r + 1);
    const loz = Math.floor(cz - r - 1), hiz = Math.ceil(cz + r + 1);
    for (let z = loz; z <= hiz; z++)
      for (let x = lo; x <= hi; x++)
        if (this.inCircle(x, z, cx, cz, r))
          this.add(x, y, z, typeof colorFn === 'function' ? colorFn(x, y, z) : colorFn);
  }
  /** Ring at given y (filled disc minus inner disc) */
  ring(cx, cz, rOuter, rInner, y, colorFn) {
    const lo = Math.floor(cx - rOuter - 1), hi = Math.ceil(cx + rOuter + 1);
    const loz = Math.floor(cz - rOuter - 1), hiz = Math.ceil(cz + rOuter + 1);
    for (let z = loz; z <= hiz; z++)
      for (let x = lo; x <= hi; x++)
        if (this.inCircle(x, z, cx, cz, rOuter) && !this.inCircle(x, z, cx, cz, rInner))
          this.add(x, y, z, typeof colorFn === 'function' ? colorFn(x, y, z) : colorFn);
  }
  /** Sphere centered at (cx,cy,cz) */
  sphere(cx, cy, cz, r, colorFn) {
    const lo = Math.floor(-r - 1), hi = Math.ceil(r + 1);
    for (let dy = lo; dy <= hi; dy++)
      for (let dz = lo; dz <= hi; dz++)
        for (let dx = lo; dx <= hi; dx++)
          if (dx * dx + dy * dy + dz * dz <= r * r + 0.5)
            this.add(cx + dx, cy + dy, cz + dz,
              typeof colorFn === 'function' ? colorFn(cx + dx, cy + dy, cz + dz) : colorFn);
  }
  /** Normalize coords so minimum is 0, sort by y,z,x, return results */
  finalize() {
    if (this.voxels.length === 0) return { voxels: [], footprint: { w: 0, d: 0 } };
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxZ = -Infinity;
    for (const [x, y, z] of this.voxels) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
    }
    const shifted = this.voxels.map(([x, y, z, c]) => [x - minX, y - minY, z - minZ, c]);
    for (const [x, , z] of shifted) {
      if (x > maxX) maxX = x;
      if (z > maxZ) maxZ = z;
    }
    shifted.sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
    return {
      voxels: shifted,
      footprint: { w: maxX + 1, d: maxZ + 1 },
    };
  }
}

/** Simple seeded PRNG for deterministic "random" */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function hexStr(n) {
  return '0x' + n.toString(16).padStart(6, '0');
}

function formatFile(key, name, emoji, footprint, voxels) {
  let lines = [];
  lines.push('export default {');
  lines.push(`  key: '${key}',`);
  lines.push(`  name: '${name}',`);
  lines.push(`  emoji: '${emoji}',`);
  lines.push(`  footprint: { w: ${footprint.w}, d: ${footprint.d} },`);
  lines.push('  voxels: [');

  // Format voxels into lines, keeping under ~100 chars
  let cur = '    ';
  for (let i = 0; i < voxels.length; i++) {
    const [x, y, z, c] = voxels[i];
    const entry = `[${x},${y},${z},${hexStr(c)}]`;
    const sep = i < voxels.length - 1 ? ',' : '';
    if (cur.length + entry.length + sep.length > 98) {
      lines.push(cur);
      cur = '    ' + entry + sep;
    } else {
      cur += entry + sep;
    }
  }
  if (cur.trim()) lines.push(cur);
  lines.push('  ],');
  lines.push('};');
  return lines.join('\n') + '\n';
}

function writeDecoration(key, name, emoji, builder) {
  const { voxels, footprint } = builder.finalize();
  const content = formatFile(key, name, emoji, footprint, voxels);
  const path = join(OUT, `${key}.js`);
  writeFileSync(path, content);
  process.stderr.write(`  ${key}.js : ${voxels.length} voxels, footprint ${footprint.w}x${footprint.d}\n`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 1. BARREL  (~7w x 14h x 7d)
// ═══════════════════════════════════════════════════════════════════════════════
function genBarrel() {
  const b = new VoxelBuilder();
  const rng = mulberry32(42);
  const cx = 3, cz = 3;
  const WOOD = [0x8b5e3c, 0x6b4226, 0x7a5230];
  const IRON = [0x555555, 0x444444];
  const RIM  = 0x666666;
  const HEIGHT = 13; // y 0..12

  // Barrel profile: slightly bulging in middle
  function radius(y) {
    const mid = HEIGHT / 2;
    const t = Math.abs(y - mid) / mid; // 0 at middle, 1 at ends
    return 3.0 - 0.5 * t; // 3.0 at middle, 2.5 at ends
  }

  const hoopYs = new Set([1, 3, 9, 11]);

  for (let y = 0; y <= HEIGHT; y++) {
    const r = radius(y);
    const isHoop = hoopYs.has(y);
    const isRim = y === 0 || y === HEIGHT;

    for (let z = 0; z <= 6; z++) {
      for (let x = 0; x <= 6; x++) {
        const dx = x - cx, dz = z - cz;
        const dist2 = dx * dx + dz * dz;
        const rr = r * r;

        // Fill top and bottom caps
        if ((y === 0 || y === HEIGHT) && dist2 <= rr + 0.5) {
          b.add(x, y, z, isRim ? RIM : pick(rng, WOOD));
          continue;
        }

        // Shell only for body
        const isShell = dist2 <= rr + 0.5 && dist2 > (r - 1.1) * (r - 1.1);
        if (isShell) {
          if (isHoop) {
            b.add(x, y, z, pick(rng, IRON));
          } else {
            b.add(x, y, z, pick(rng, WOOD));
          }
        }
      }
    }
  }

  writeDecoration('barrel', 'Barrel', '\u{1F6E2}\uFE0F', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 2. ANCHOR  (~8w x 22h x 4d)
// ═══════════════════════════════════════════════════════════════════════════════
function genAnchor() {
  const b = new VoxelBuilder();
  const IRON  = [0x555555, 0x444444, 0x666666];
  const CHAIN = 0x777777;
  const rng = mulberry32(99);

  // Ring at top (y=19..21), centered at x=4, z=2
  const ringCx = 4, ringCz = 2;
  for (let y = 19; y <= 21; y++) {
    for (let x = 2; x <= 6; x++) {
      for (let z = 0; z <= 3; z++) {
        const dx = x - ringCx, dz = z - ringCz;
        const d2 = dx * dx + dz * dz;
        if (d2 <= 4.5 && d2 > 1.0) {
          b.add(x, y, z, CHAIN);
        }
      }
    }
  }

  // Vertical shaft (y=2..18) at x=3..4, z=1..2
  for (let y = 2; y <= 18; y++) {
    b.add(3, y, 1, pick(rng, IRON));
    b.add(4, y, 1, pick(rng, IRON));
    b.add(3, y, 2, pick(rng, IRON));
    b.add(4, y, 2, pick(rng, IRON));
  }

  // Cross-bar / stock (y=16..17), x=0..7, z=1..2
  for (let y = 16; y <= 17; y++) {
    for (let x = 0; x <= 7; x++) {
      b.add(x, y, 1, pick(rng, IRON));
      b.add(x, y, 2, pick(rng, IRON));
    }
  }

  // Crown (top of shaft, y=18), widen slightly x=2..5
  for (let x = 2; x <= 5; x++) {
    b.add(x, 18, 1, pick(rng, IRON));
    b.add(x, 18, 2, pick(rng, IRON));
  }

  // Bottom plate (y=1..2) x=1..6
  for (let x = 1; x <= 6; x++) {
    b.add(x, 1, 1, pick(rng, IRON));
    b.add(x, 1, 2, pick(rng, IRON));
    b.add(x, 2, 1, pick(rng, IRON));
    b.add(x, 2, 2, pick(rng, IRON));
  }

  // Left fluke (curved arm going left and down), y=0..4
  // Fluke tip at x=0, curving up to shaft
  for (let y = 0; y <= 1; y++) {
    b.add(0, y, 1, pick(rng, IRON));
    b.add(0, y, 2, pick(rng, IRON));
    b.add(1, y, 1, pick(rng, IRON));
    b.add(1, y, 2, pick(rng, IRON));
  }
  // Left arm curve up
  for (let y = 2; y <= 4; y++) {
    const xOff = Math.min(y - 1, 2);
    b.add(xOff, y, 1, pick(rng, IRON));
    b.add(xOff, y, 2, pick(rng, IRON));
    if (xOff > 0) {
      b.add(xOff - 1, y, 1, pick(rng, IRON));
      b.add(xOff - 1, y, 2, pick(rng, IRON));
    }
  }

  // Right fluke (curved arm going right and down)
  for (let y = 0; y <= 1; y++) {
    b.add(7, y, 1, pick(rng, IRON));
    b.add(7, y, 2, pick(rng, IRON));
    b.add(6, y, 1, pick(rng, IRON));
    b.add(6, y, 2, pick(rng, IRON));
  }
  // Right arm curve up
  for (let y = 2; y <= 4; y++) {
    const xOff = 7 - Math.min(y - 1, 2);
    b.add(xOff, y, 1, pick(rng, IRON));
    b.add(xOff, y, 2, pick(rng, IRON));
    if (xOff < 7) {
      b.add(xOff + 1, y, 1, pick(rng, IRON));
      b.add(xOff + 1, y, 2, pick(rng, IRON));
    }
  }

  // Pointed fluke tips (y=0)
  b.add(0, 0, 0, pick(rng, IRON));
  b.add(7, 0, 0, pick(rng, IRON));
  b.add(0, 0, 3, pick(rng, IRON));
  b.add(7, 0, 3, pick(rng, IRON));

  writeDecoration('anchor', 'Anchor', '\u2693', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. ANEMONE  (~10w x 10h x 10d)
// ═══════════════════════════════════════════════════════════════════════════════
function genAnemone() {
  const b = new VoxelBuilder();
  const rng = mulberry32(77);
  const BASE  = [0xcc6699, 0xaa5577];
  const TENT  = [0xff88bb, 0xff6699, 0xee7799];
  const TIPS  = 0xffaacc;
  const cx = 4.5, cz = 4.5;

  // Bulbous base (y=0..3), radius tapering
  const baseR = [5.0, 4.5, 3.5, 2.5];
  for (let y = 0; y <= 3; y++) {
    const r = baseR[y];
    for (let z = 0; z <= 9; z++)
      for (let x = 0; x <= 9; x++)
        if (b.inCircle(x, z, cx, cz, r))
          b.add(x, y, z, pick(rng, BASE));
  }

  // Stalk (y=4..5)
  for (let y = 4; y <= 5; y++) {
    for (let z = 2; z <= 7; z++)
      for (let x = 2; x <= 7; x++)
        if (b.inCircle(x, z, cx, cz, 2.5))
          b.add(x, y, z, pick(rng, BASE));
  }

  // Tentacle disc base (y=6), wide ring
  for (let z = 0; z <= 9; z++)
    for (let x = 0; x <= 9; x++)
      if (b.inCircle(x, z, cx, cz, 5.0))
        b.add(x, 6, z, pick(rng, TENT));

  // Tentacles radiating upward (y=7..9)
  // Create tentacle positions around center
  const tentacles = [];
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 7) {
    for (let r = 2.0; r <= 4.8; r += 1.0) {
      tentacles.push({
        x: Math.round(cx + Math.cos(angle) * r),
        z: Math.round(cz + Math.sin(angle) * r),
        h: Math.round(7 + rng() * 3), // height 7..9
      });
    }
  }

  for (const t of tentacles) {
    for (let y = 7; y <= t.h; y++) {
      const c = y === t.h ? TIPS : pick(rng, TENT);
      b.add(t.x, y, t.z, c);
    }
  }

  // Inner tentacles (shorter, near center)
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 5) {
    const tx = Math.round(cx + Math.cos(angle) * 1.5);
    const tz = Math.round(cz + Math.sin(angle) * 1.5);
    for (let y = 7; y <= 8; y++)
      b.add(tx, y, tz, pick(rng, TENT));
    b.add(tx, 9, tz, TIPS);
  }

  writeDecoration('anemone', 'Sea Anemone', '\u{1F33A}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 4. CORAL_BRAIN  (~8w x 8h x 8d)
// ═══════════════════════════════════════════════════════════════════════════════
function genCoralBrain() {
  const b = new VoxelBuilder();
  const rng = mulberry32(123);
  const PINKS = [0xff8888, 0xdd6666, 0xcc5555, 0xee7777];
  const RIDGES = [0xff9999, 0xffaaaa];
  const GROOVES = [0xbb4444, 0xaa3333];
  const cx = 3.5, cy = 3.5, cz = 3.5;

  // Build a roughly spherical blob
  for (let y = 0; y <= 7; y++) {
    for (let z = 0; z <= 7; z++) {
      for (let x = 0; x <= 7; x++) {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        const dist2 = dx * dx + dy * dy * 0.85 + dz * dz; // slightly squashed vertically
        // Radius ~4.0 but irregular
        const noise = Math.sin(x * 2.1 + z * 1.7) * 0.5 + Math.cos(y * 1.9 + x * 0.8) * 0.4;
        const maxR = 4.0 + noise;
        if (dist2 <= maxR * maxR) {
          // Brain-like ridge pattern: alternating ridges/grooves based on position
          const wave = Math.sin(x * 1.5 + z * 0.7) + Math.sin(z * 1.5 + y * 0.5);
          let color;
          if (wave > 0.5) {
            color = pick(rng, RIDGES);
          } else if (wave < -0.5) {
            color = pick(rng, GROOVES);
          } else {
            color = pick(rng, PINKS);
          }
          b.add(x, y, z, color);
        }
      }
    }
  }

  writeDecoration('coral_brain', 'Brain Coral', '\u{1FAB8}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. CORAL_TUBE  (~6w x 22h x 5d)
// ═══════════════════════════════════════════════════════════════════════════════
function genCoralTube() {
  const b = new VoxelBuilder();
  const rng = mulberry32(456);
  const ORANGES = [0xff7733, 0xee6622, 0xdd5511, 0xff8844];
  const TIPS = [0xffaa66, 0xffbb77];

  // Define tube positions: {cx, cz, height, radius}
  const tubes = [
    { cx: 1, cz: 1, h: 21, r: 1.2 },
    { cx: 3, cz: 2, h: 17, r: 1.0 },
    { cx: 5, cz: 1, h: 19, r: 1.1 },
    { cx: 2, cz: 3, h: 14, r: 0.9 },
    { cx: 4, cz: 4, h: 16, r: 1.0 },
    { cx: 0, cz: 3, h: 12, r: 0.8 },
  ];

  // Shared base (y=0..2)
  for (let y = 0; y <= 2; y++) {
    for (let z = 0; z <= 4; z++)
      for (let x = 0; x <= 5; x++) {
        // Only near tube bases
        let near = false;
        for (const t of tubes) {
          const dx = x - t.cx, dz = z - t.cz;
          if (dx * dx + dz * dz <= (t.r + 1.2) * (t.r + 1.2)) { near = true; break; }
        }
        if (near) b.add(x, y, z, pick(rng, ORANGES));
      }
  }

  // Individual tubes
  for (const t of tubes) {
    for (let y = 3; y <= t.h; y++) {
      const isTop = y >= t.h - 1;
      for (let z = Math.floor(t.cz - t.r - 0.5); z <= Math.ceil(t.cz + t.r + 0.5); z++) {
        for (let x = Math.floor(t.cx - t.r - 0.5); x <= Math.ceil(t.cx + t.r + 0.5); x++) {
          const dx = x - t.cx, dz = z - t.cz;
          const d2 = dx * dx + dz * dz;
          // Shell for tube body, filled at top
          const isShell = d2 <= (t.r + 0.5) * (t.r + 0.5) && d2 > (t.r - 0.6) * (t.r - 0.6);
          const isFill = d2 <= (t.r + 0.5) * (t.r + 0.5);
          if (isTop ? isFill : isShell) {
            b.add(x, y, z, isTop ? pick(rng, TIPS) : pick(rng, ORANGES));
          }
        }
      }
    }
  }

  writeDecoration('coral_tube', 'Tube Coral', '\u{1FAB8}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 6. DIVER_HELMET  (~8w x 12h x 8d)
// ═══════════════════════════════════════════════════════════════════════════════
function genDiverHelmet() {
  const b = new VoxelBuilder();
  const rng = mulberry32(789);
  const BRASS  = [0xccaa44, 0xbb9933, 0xddbb55];
  const WINDOW = [0x334455, 0x223344];
  const BOLT   = 0x888888;
  const cx = 3.5, cz = 3.5;

  // Base plate/collar (y=0..1)
  for (let y = 0; y <= 1; y++) {
    for (let z = 0; z <= 7; z++)
      for (let x = 0; x <= 7; x++)
        if (b.inCircle(x, z, cx, cz, 4.2))
          b.add(x, y, z, pick(rng, BRASS));
  }

  // Bolts on collar (y=1)
  const boltPositions = [
    [1, 1, 1], [1, 1, 6], [6, 1, 1], [6, 1, 6],
    [2, 1, 0], [5, 1, 0], [2, 1, 7], [5, 1, 7],
    [0, 1, 3], [0, 1, 4], [7, 1, 3], [7, 1, 4],
  ];
  for (const [bx, by, bz] of boltPositions) {
    b.add(bx, by, bz, BOLT);
  }

  // Dome body (y=2..10), cylindrical lower, dome upper
  for (let y = 2; y <= 10; y++) {
    let r;
    if (y <= 6) {
      r = 3.8; // straight cylinder
    } else {
      // Dome taper
      const t = (y - 6) / 4;
      r = 3.8 * (1 - t * t * 0.7);
    }

    for (let z = 0; z <= 7; z++) {
      for (let x = 0; x <= 7; x++) {
        const dx = x - cx, dz = z - cz;
        const d2 = dx * dx + dz * dz;
        const isShell = d2 <= r * r + 0.5 && d2 > (r - 1.2) * (r - 1.2);
        const isFill = d2 <= r * r + 0.5;

        // Front window: z=0..1, x=2..5, y=4..8
        if (z <= 1 && x >= 2 && x <= 5 && y >= 4 && y <= 8 && isFill) {
          if (z === 0 && x >= 2 && x <= 5 && y >= 5 && y <= 7) {
            b.add(x, y, z, pick(rng, WINDOW));
          } else if (isShell || z === 1) {
            // Window frame
            b.add(x, y, z, pick(rng, BRASS));
          }
          continue;
        }

        // Side viewports: small windows y=5..6
        if (y >= 5 && y <= 6) {
          if (x === 0 && z >= 3 && z <= 4 && isFill) {
            b.add(x, y, z, pick(rng, WINDOW));
            continue;
          }
          if (x === 7 && z >= 3 && z <= 4 && isFill) {
            b.add(x, y, z, pick(rng, WINDOW));
            continue;
          }
        }

        if (isShell) {
          b.add(x, y, z, pick(rng, BRASS));
        }
      }
    }
  }

  // Top cap (y=11)
  for (let z = 2; z <= 5; z++)
    for (let x = 2; x <= 5; x++)
      b.add(x, 11, z, pick(rng, BRASS));

  // Top valve knob
  b.add(3, 12, 3, BOLT);
  b.add(4, 12, 4, BOLT);

  // Bolts around front window
  b.add(2, 4, 0, BOLT); b.add(5, 4, 0, BOLT);
  b.add(2, 8, 0, BOLT); b.add(5, 8, 0, BOLT);

  writeDecoration('diver_helmet', 'Diver Helmet', '\u{1F93F}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 7. ROCK_LARGE  (~10w x 10h x 8d)
// ═══════════════════════════════════════════════════════════════════════════════
function genRockLarge() {
  const b = new VoxelBuilder();
  const rng = mulberry32(333);
  const GRAYS = [0x888888, 0x777777, 0x666666, 0x999999];
  const MOSS  = [0x556644, 0x667755];

  // Irregular blobby rock using layered circles with noise
  const cx = 5, cz = 4;
  for (let y = 0; y <= 9; y++) {
    // Base radius varies by height - wide base, narrower top
    let baseR;
    if (y <= 2) baseR = 4.8 - y * 0.3;
    else if (y <= 6) baseR = 4.0 - (y - 3) * 0.2;
    else baseR = 3.0 - (y - 6) * 0.7;

    if (baseR < 0.5) baseR = 0.5;

    for (let z = 0; z <= 7; z++) {
      for (let x = 0; x <= 9; x++) {
        const dx = x - cx, dz = z - cz;
        // Add irregular noise
        const noise = Math.sin(x * 1.3 + y * 0.7 + z * 2.1) * 0.8
                    + Math.cos(z * 1.8 + x * 0.5) * 0.6
                    + Math.sin(y * 2.3 + z * 1.1) * 0.4;
        const effR = baseR + noise * 0.6;
        const d2 = dx * dx + dz * dz;

        if (d2 <= effR * effR) {
          // Moss on top and sunny-side
          let color;
          if (y >= 7 || (y >= 5 && z <= 2 && rng() > 0.4)) {
            color = pick(rng, MOSS);
          } else {
            color = pick(rng, GRAYS);
          }
          b.add(x, y, z, color);
        }
      }
    }
  }

  writeDecoration('rock_large', 'Large Rock', '\u{1FAA8}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 8. ROCK_SMALL  (~7w x 6h x 6d)
// ═══════════════════════════════════════════════════════════════════════════════
function genRockSmall() {
  const b = new VoxelBuilder();
  const rng = mulberry32(444);
  const GRAYS = [0x888888, 0x777777, 0x666666, 0x999999, 0x8a8a8a];
  const MOSS  = [0x556644, 0x667755];

  const cx = 3, cz = 3;
  for (let y = 0; y <= 5; y++) {
    let baseR;
    if (y <= 1) baseR = 3.2 - y * 0.2;
    else if (y <= 3) baseR = 2.8 - (y - 2) * 0.3;
    else baseR = 2.0 - (y - 3) * 0.6;

    if (baseR < 0.5) baseR = 0.5;

    for (let z = 0; z <= 5; z++) {
      for (let x = 0; x <= 6; x++) {
        const dx = x - cx, dz = z - cz;
        const noise = Math.sin(x * 1.5 + y * 0.9 + z * 1.3) * 0.4
                    + Math.cos(z * 2.0 + x * 0.7) * 0.3;
        const effR = baseR + noise * 0.4;
        if (dx * dx + dz * dz <= effR * effR) {
          const color = (y >= 4 && rng() > 0.5) ? pick(rng, MOSS) : pick(rng, GRAYS);
          b.add(x, y, z, color);
        }
      }
    }
  }

  writeDecoration('rock_small', 'Small Rock', '\u{1FAA8}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 9. TREASURE_CHEST  (~12w x 10h x 8d)
// ═══════════════════════════════════════════════════════════════════════════════
function genTreasureChest() {
  const b = new VoxelBuilder();
  const rng = mulberry32(555);
  const WOOD  = [0x6b4226, 0x7a5230, 0x8b5e3c];
  const TRIM  = [0xddaa22, 0xccaa44];
  const GOLD  = [0xffcc00, 0xeebc00, 0xddaa00];
  const HINGE = 0x888888;
  const LOCK  = 0xddaa22;

  // Chest base / box (y=0..5, x=0..11, z=0..7)
  // Bottom
  b.box(0, 0, 0, 11, 0, 7, (x, y, z) => pick(rng, WOOD));

  // Walls (y=1..5)
  for (let y = 1; y <= 5; y++) {
    // Front wall z=0
    for (let x = 0; x <= 11; x++) b.add(x, y, 0, pick(rng, WOOD));
    // Back wall z=7
    for (let x = 0; x <= 11; x++) b.add(x, y, 7, pick(rng, WOOD));
    // Left wall x=0
    for (let z = 1; z <= 6; z++) b.add(0, y, z, pick(rng, WOOD));
    // Right wall x=11
    for (let z = 1; z <= 6; z++) b.add(11, y, z, pick(rng, WOOD));
  }

  // Gold trim edges on base
  for (let x = 0; x <= 11; x++) {
    b.add(x, 5, 0, pick(rng, TRIM));
    b.add(x, 5, 7, pick(rng, TRIM));
  }
  for (let z = 0; z <= 7; z++) {
    b.add(0, 5, z, pick(rng, TRIM));
    b.add(11, 5, z, pick(rng, TRIM));
  }

  // Corner trim vertical
  for (let y = 0; y <= 5; y++) {
    b.add(0, y, 0, pick(rng, TRIM));
    b.add(11, y, 0, pick(rng, TRIM));
    b.add(0, y, 7, pick(rng, TRIM));
    b.add(11, y, 7, pick(rng, TRIM));
  }

  // Gold coins inside (y=1..3, interior)
  for (let y = 1; y <= 3; y++) {
    for (let z = 1; z <= 6; z++) {
      for (let x = 1; x <= 10; x++) {
        // Fill up the chest with gold, higher in middle
        const maxY = 1 + Math.round(2 * (1 - Math.abs(x - 5.5) / 5.5) * (1 - Math.abs(z - 3.5) / 3.5));
        if (y <= maxY) {
          b.add(x, y, z, pick(rng, GOLD));
        }
      }
    }
  }

  // Overflowing gold on top
  for (let z = 2; z <= 5; z++) {
    for (let x = 3; x <= 8; x++) {
      if (rng() > 0.3)
        b.add(x, 4, z, pick(rng, GOLD));
    }
  }
  // A few gold coins on very top
  b.add(5, 5, 3, pick(rng, GOLD));
  b.add(6, 5, 4, pick(rng, GOLD));
  b.add(4, 5, 4, pick(rng, GOLD));

  // Lock/clasp on front
  b.add(5, 3, 0, LOCK);
  b.add(6, 3, 0, LOCK);
  b.add(5, 4, 0, LOCK);
  b.add(6, 4, 0, LOCK);

  // ── Open Lid (tilted back at ~45 degrees) ──
  // Lid is attached at back (z=7), opening upward and forward
  // At y=5 (hinge level), lid goes from z=7 back/up
  // Simulated 45-degree tilt: each step up also goes +1 in z

  const lidThickness = 1;
  for (let step = 0; step <= 5; step++) {
    const ly = 6 + step;  // goes up
    const lz = 7 + step;  // goes backward
    for (let x = 0; x <= 11; x++) {
      const isEdge = x === 0 || x === 11 || step === 0 || step === 5;
      b.add(x, ly, lz, isEdge ? pick(rng, TRIM) : pick(rng, WOOD));
      // Lid has some depth - add second layer
      if (step < 5) {
        b.add(x, ly + 1, lz, isEdge ? pick(rng, TRIM) : pick(rng, WOOD));
      }
    }
  }

  // Hinges on back
  b.add(2, 5, 7, HINGE);
  b.add(9, 5, 7, HINGE);
  b.add(2, 6, 8, HINGE);
  b.add(9, 6, 8, HINGE);

  // Rounded top of lid (add a slight curve at the top end)
  for (let x = 1; x <= 10; x++) {
    b.add(x, 12, 12, pick(rng, TRIM));
  }

  writeDecoration('treasure_chest', 'Treasure Chest', '\u{1F4B0}', b);
}


// ═══════════════════════════════════════════════════════════════════════════════
// Run all generators
// ═══════════════════════════════════════════════════════════════════════════════
process.stderr.write('Generating decorations...\n');
genBarrel();
genAnchor();
genAnemone();
genCoralBrain();
genCoralTube();
genDiverHelmet();
genRockLarge();
genRockSmall();
genTreasureChest();
process.stderr.write('Done!\n');
