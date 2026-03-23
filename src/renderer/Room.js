import * as THREE from 'three';
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, FLOOR_Y, VOXEL_SIZE } from '../constants.js';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';

// ── Room voxel grid ────────────────────────────────────
const RV = 0.5;

// ── Real-world scale ───────────────────────────────────
// 1 world unit ≈ 1 inch.  Tank 50 wide ≈ 4 ft aquarium.
const ROOM_FLOOR_Y = -53;
const ROOM_W = 240;       // 20 ft
const ROOM_D = 216;       // 18 ft
const WALL_H = 108;       // 9 ft ceiling
const BACK_Z = -ROOM_D / 2;       // -108
const HALF_W = ROOM_W / 2;        // 120

const GW = Math.round(ROOM_W / RV);  // 480
const GD = Math.round(ROOM_D / RV);  // 432
const GH = Math.round(WALL_H / RV);  // 216
const MAX_GH = 186;

// ── Instanced voxel builder ────────────────────────────
class VoxelBuilder {
  constructor(vs, ox, oy, oz) {
    this.vs = vs; this.ox = ox; this.oy = oy; this.oz = oz;
    this.gx = []; this.gy = []; this.gz = [];
    this.cr = []; this.cg = []; this.cb = [];
    this.count = 0;
  }
  add(gx, gy, gz, color) {
    this.gx.push(gx); this.gy.push(gy); this.gz.push(gz);
    if (typeof color === 'number') {
      this.cr.push(((color >> 16) & 0xFF) / 255);
      this.cg.push(((color >> 8) & 0xFF) / 255);
      this.cb.push((color & 0xFF) / 255);
    } else { this.cr.push(color.r); this.cg.push(color.g); this.cb.push(color.b); }
    this.count++;
  }
  box(x0, y0, z0, w, h, d, colorOrFn) {
    for (let x = x0; x < x0 + w; x++)
      for (let y = y0; y < y0 + h; y++)
        for (let z = z0; z < z0 + d; z++) {
          const c = typeof colorOrFn === 'function' ? colorOrFn(x, y, z) : colorOrFn;
          if (c != null) this.add(x, y, z, c);
        }
  }
  // shell: only outer faces of a box
  shell(x0, y0, z0, w, h, d, colorOrFn) {
    for (let x = x0; x < x0 + w; x++)
      for (let y = y0; y < y0 + h; y++)
        for (let z = z0; z < z0 + d; z++) {
          if (x === x0 || x === x0+w-1 || y === y0 || y === y0+h-1 || z === z0 || z === z0+d-1) {
            const c = typeof colorOrFn === 'function' ? colorOrFn(x, y, z) : colorOrFn;
            if (c != null) this.add(x, y, z, c);
          }
        }
  }
  build(scene) {
    if (!this.count) return null;
    const vs = this.vs;
    const geo = new THREE.BoxGeometry(vs * 0.96, vs * 0.96, vs * 0.96);
    const mat = new THREE.MeshLambertMaterial();
    const mesh = new THREE.InstancedMesh(geo, mat, this.count);
    mesh.receiveShadow = true;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < this.count; i++) {
      m.makeTranslation(this.ox + this.gx[i] * vs + vs * 0.5, this.oy + this.gy[i] * vs + vs * 0.5, this.oz + this.gz[i] * vs + vs * 0.5);
      mesh.setMatrixAt(i, m);
      c.setRGB(this.cr[i], this.cg[i], this.cb[i]);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }
}

// ── Color helpers ──────────────────────────────────────
const _tc = new THREE.Color();
function noisyColor(base, amount) {
  _tc.set(base);
  const n = (Math.random() - 0.5) * amount;
  _tc.r = Math.min(1, Math.max(0, _tc.r + n));
  _tc.g = Math.min(1, Math.max(0, _tc.g + n * 0.9));
  _tc.b = Math.min(1, Math.max(0, _tc.b + n * 0.7));
  return { r: _tc.r, g: _tc.g, b: _tc.b };
}
function woodColor(base, gx, gz) {
  _tc.set(base);
  const grain = Math.sin(gx * 0.3 + gz * 0.07) * 0.03 + Math.sin(gx * 0.8) * 0.015;
  const n = (Math.random() - 0.5) * 0.02;
  _tc.r = Math.min(1, Math.max(0, _tc.r + grain + n));
  _tc.g = Math.min(1, Math.max(0, _tc.g + grain * 0.8 + n * 0.8));
  _tc.b = Math.min(1, Math.max(0, _tc.b + grain * 0.5 + n * 0.6));
  return { r: _tc.r, g: _tc.g, b: _tc.b };
}
function fabricColor(base, gx, gy) {
  _tc.set(base);
  const weave = ((gx + gy) % 2) * 0.012;
  const n = (Math.random() - 0.5) * 0.025;
  _tc.r = Math.min(1, Math.max(0, _tc.r + weave + n));
  _tc.g = Math.min(1, Math.max(0, _tc.g + weave * 0.8 + n * 0.9));
  _tc.b = Math.min(1, Math.max(0, _tc.b + weave * 0.6 + n * 0.8));
  return { r: _tc.r, g: _tc.g, b: _tc.b };
}

// ── Color palettes ─────────────────────────────────────
const PLANK_COLORS = [0xc4a574, 0xb89a6a, 0xc9a876, 0xbe9f70, 0xd1ab7a, 0xbf9e72, 0xc7a470];
const WALL_BASE = 0xe8e0d0;
const TRIM_COLOR = 0xf0ebe0;
const FRAME_COLOR = 0xf0ebe0;

const SKY_GRADIENT = [0x4477aa, 0x5588bb, 0x6699cc, 0x77aadd, 0x88bbdd, 0x99ccee, 0xaaddee, 0xbbddee];
const TREE_TRUNK = 0x5c3a1a;
const TREE_GREENS = [0x1a6b1a, 0x228b22, 0x2d8b2d, 0x3d8b3d, 0x4d9b4d];
const GROUND_GREEN = 0x4a8b3a;

// Sofa fabric — warm taupe/brown
const SOFA_BASE = 0x8b7b6b;
const SOFA_CUSHION = 0x9a8a7a;
const SOFA_DARK = 0x7a6a5a;
const SOFA_ARM = 0x8a7a6a;

// Cabinet dark wood
const CAB_BODY = 0x3a3028;
const CAB_TOP = 0x2e2620;
const CAB_FRONT = 0x352d25;
const CAB_PANEL = 0x2a2218;

// ── Furniture grid coords ──────────────────────────────
// Tank is at world (85, 0, -10), rotated 90°. Footprint: 25 wide (X) × 50 deep (Z).
// Grid origin is at world (-120, -53, -108).
// Tank center in grid: gx=(85+120)/0.5=410, gz=(-10+108)/0.5=196
// Cabinet under tank: ~30 units wide (X) = 60 grid, ~54 units deep (Z) = 108 grid

const CABINET = { x0: 382, x1: 440, z0: 142, z1: 250 };

// Sofa: 7 ft wide, 3 ft deep — against front wall (high-z), shifted left since tank moved right
const SOFA = { x0: 100, x1: 268, z0: 358, z1: 430 };

// Coffee table: 4.5 ft × 2.5 ft — in front of sofa
const COFFEE_TABLE = { x0: 126, x1: 242, z0: 290, z1: 340 };

// TV Console: 5 ft wide — against back wall, left side
const TVCONSOLE = { x0: 30, x1: 150, z0: 2, z1: 38 };

// Side table: 2 ft × 2 ft — right side of sofa
const SIDETABLE = { x0: 280, x1: 320, z0: 370, z1: 410 };

// Door: 3 ft wide × 6'10" tall — on back wall, center-left
const DOOR = { x0: 200, x1: 272, y1: 164 };

// Windows on left wall
const LW_WINS = [
  { z0: 60,  z1: 156, y0: 72, y1: 168 },
  { z0: 240, z1: 336, y0: 72, y1: 168 },
];

// Rug: 8 ft × 5 ft — in front of sofa area
const RUG = { x0: 94, x1: 274, z0: 230, z1: 350 };

// ════════════════════════════════════════════════════════
export class Room {
  constructor(scene, camera, renderer, lighting) {
    this.scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    this._lighting = lighting;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._doorknobClicks = 0;
    this._doorknob = null;
    this._catGroup = null;
    this._catState = 'hidden';
    this._catTimer = 0;
    this._lightswitch = null;
    this._switchToggle = null;

    this._buildVoxelRoom();
    this._buildSeparateElements();
    renderer.domElement.addEventListener('pointerup', (e) => this._onClick(e));
  }

  _buildVoxelRoom() {
    const bFloorL = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bFloorR = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bBack   = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bLeft   = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bRight  = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bFront  = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);
    const bFurn   = new VoxelBuilder(RV, -HALF_W, ROOM_FLOOR_Y, BACK_Z);

    this._addFloor(bFloorL, 0, Math.floor(GW / 2));
    this._addFloor(bFloorR, Math.floor(GW / 2), GW);

    this._addBackWall(bBack);
    this._addLeftWall(bLeft);
    this._addRightWall(bRight);
    this._addFrontWall(bFront);
    this._addBaseboards(bFurn);
    this._addWindowScenes(bFurn);
    this._addCabinet(bFurn);
    this._addSofa(bFurn);
    this._addCoffeeTable(bFurn);
    this._addTVConsole(bFurn);
    this._addTV(bFurn);
    this._addDoorVoxels(bFurn);
    this._addSideTable(bFurn);
    this._addWallArt(bFurn);

    bFloorL.build(this.scene);
    bFloorR.build(this.scene);
    bBack.build(this.scene);
    bLeft.build(this.scene);
    bRight.build(this.scene);
    bFront.build(this.scene);
    bFurn.build(this.scene);

    this._addWindowLights();
    this._addCurtains();
  }

  // ── Floor ────────────────────────────────────────────
  _addFloor(b, gxStart, gxEnd) {
    for (let gx = gxStart; gx < gxEnd; gx++) {
      for (let gz = 0; gz < GD; gz++) {
        // Skip under large furniture
        if (gx >= CABINET.x0 && gx <= CABINET.x1 && gz >= CABINET.z0 && gz <= CABINET.z1) continue;
        if (gx >= TVCONSOLE.x0 && gx <= TVCONSOLE.x1 && gz >= TVCONSOLE.z0 && gz <= TVCONSOLE.z1) continue;
        if (gx >= SOFA.x0 && gx <= SOFA.x1 && gz >= SOFA.z0 && gz <= SOFA.z1) continue;

        if (gx >= RUG.x0 && gx <= RUG.x1 && gz >= RUG.z0 && gz <= RUG.z1) {
          b.add(gx, 0, gz, this._rugColor(gx - RUG.x0, gz - RUG.z0, RUG.x1 - RUG.x0 + 1, RUG.z1 - RUG.z0 + 1));
        } else {
          // Hardwood with plank grain
          const plankIdx = Math.floor(gx / 14);
          const baseColor = PLANK_COLORS[plankIdx % PLANK_COLORS.length];
          _tc.set(baseColor);
          // Grain along z
          const grain = Math.sin(gz * 0.15 + plankIdx * 4.7) * 0.025 + Math.sin(gz * 0.4 + plankIdx * 2.1) * 0.012;
          // Plank edge darkening
          const plankLocal = gx % 14;
          const edgeDark = (plankLocal === 0 || plankLocal === 13) ? -0.04 : 0;
          // Knot holes (rare)
          const knot = (Math.sin(gx * 3.7 + gz * 2.3) > 0.97) ? -0.06 : 0;
          const n = (Math.random() - 0.5) * 0.015;
          _tc.r = Math.min(1, Math.max(0, _tc.r + grain + edgeDark + knot + n));
          _tc.g = Math.min(1, Math.max(0, _tc.g + (grain + edgeDark + knot) * 0.85 + n * 0.85));
          _tc.b = Math.min(1, Math.max(0, _tc.b + (grain + edgeDark + knot) * 0.6 + n * 0.6));
          b.add(gx, 0, gz, _tc);
        }
      }
    }
  }

  // ── Rug: warm Persian-inspired pattern ────────────────
  _rugColor(lx, lz, w, d) {
    const ex = Math.min(lx, w - 1 - lx);
    const ez = Math.min(lz, d - 1 - lz);
    const e = Math.min(ex, ez);

    // Deep red border
    if (e < 5) { return noisyColor(0x8b2020, 0.03); }
    // Gold inner border
    if (e < 9) { return noisyColor(0xc4956a, 0.025); }
    // Dark red inner frame
    if (e < 12) { return noisyColor(0x6b1818, 0.03); }

    // Center field: Persian medallion pattern
    const cx = (lx - w / 2) / (w / 2);
    const cz = (lz - d / 2) / (d / 2);
    const dist = Math.sqrt(cx * cx + cz * cz);
    const angle = Math.atan2(cz, cx);

    // Central medallion
    if (dist < 0.2) { return noisyColor(0xc4956a, 0.03); }
    if (dist < 0.25) { return noisyColor(0x8b2020, 0.025); }

    // Radiating pattern
    const radial = Math.sin(angle * 8 + dist * 12) * 0.5 + 0.5;
    const ring = Math.sin(dist * 18) * 0.5 + 0.5;

    if (radial > 0.7 && ring > 0.4) return noisyColor(0xc4956a, 0.03);
    if (ring > 0.7) return noisyColor(0x6b1818, 0.025);
    if (radial > 0.5) return noisyColor(0x9b3030, 0.025);
    return noisyColor(0x7b2828, 0.03);
  }

  // ── Back wall (gz=0, with door cutout) ────────────────
  _addBackWall(b) {
    const renderH = Math.min(GH, MAX_GH);
    for (let gx = 0; gx < GW; gx++) {
      for (let gy = 1; gy < renderH; gy++) {
        if (gx >= DOOR.x0 && gx <= DOOR.x1 && gy <= DOOR.y1) continue;
        // Subtle vertical streaking for texture
        const streak = Math.sin(gx * 0.5 + gy * 0.02) * 0.008;
        b.add(gx, gy, 0, noisyColor(WALL_BASE, 0.015 + streak));
      }
    }
  }

  // ── Left wall (gx=0, with window cutouts) ─────────────
  _addLeftWall(b) {
    const renderH = Math.min(GH, MAX_GH);
    for (let gz = 0; gz < GD; gz++) {
      for (let gy = 1; gy < renderH; gy++) {
        let skip = false;
        for (const w of LW_WINS) {
          if (gz >= w.z0 && gz <= w.z1 && gy >= w.y0 && gy <= w.y1) { skip = true; break; }
        }
        if (skip) continue;
        const streak = Math.sin(gz * 0.5 + gy * 0.02) * 0.008;
        b.add(0, gy, gz, noisyColor(WALL_BASE, 0.015 + streak));
      }
    }
  }

  // ── Right wall (gx=GW-1) ─────────────────────────────
  _addRightWall(b) {
    const renderH = Math.min(GH, MAX_GH);
    for (let gz = 0; gz < GD; gz++) {
      for (let gy = 1; gy < renderH; gy++) {
        const streak = Math.sin(gz * 0.5 + gy * 0.02) * 0.008;
        b.add(GW - 1, gy, gz, noisyColor(WALL_BASE, 0.015 + streak));
      }
    }
  }

  // ── Front wall (gz=GD-1, behind camera/sofa) ─────────
  _addFrontWall(b) {
    const renderH = Math.min(GH, MAX_GH);
    for (let gx = 0; gx < GW; gx++) {
      for (let gy = 1; gy < renderH; gy++) {
        const streak = Math.sin(gx * 0.5 + gy * 0.02) * 0.008;
        b.add(gx, gy, GD - 1, noisyColor(WALL_BASE, 0.015 + streak));
      }
    }
  }

  // ── Baseboards ───────────────────────────────────────
  _addBaseboards(b) {
    for (let gx = 0; gx < GW; gx++) {
      if (gx >= DOOR.x0 && gx <= DOOR.x1) continue;
      for (let dy = 1; dy <= 4; dy++) b.add(gx, dy, 1, noisyColor(TRIM_COLOR, 0.01));
    }
    for (let gz = 1; gz < GD; gz++) {
      for (let dy = 1; dy <= 4; dy++) { b.add(1, dy, gz, noisyColor(TRIM_COLOR, 0.01)); b.add(GW - 2, dy, gz, noisyColor(TRIM_COLOR, 0.01)); }
    }
    for (let gx = 0; gx < GW; gx++) {
      for (let dy = 1; dy <= 4; dy++) b.add(gx, dy, GD - 2, noisyColor(TRIM_COLOR, 0.01));
    }
  }

  // ── Window scenes ────────────────────────────────────
  _addWindowScenes(b) {
    for (const w of LW_WINS) {
      this._addLeftWindowFrame(b, w);
      this._addLeftWindowOutdoor(b, w);
    }
  }

  _addLeftWindowFrame(b, w) {
    const { z0, z1, y0, y1 } = w;
    for (let gz = z0 - 3; gz <= z1 + 3; gz++) { b.add(0, y1 + 1, gz, FRAME_COLOR); b.add(0, y1 + 2, gz, FRAME_COLOR); b.add(0, y1 + 3, gz, FRAME_COLOR); }
    for (let gz = z0 - 3; gz <= z1 + 3; gz++) {
      for (let depth = 0; depth < 6; depth++) { b.add(depth, y0 - 1, gz, FRAME_COLOR); b.add(depth, y0 - 2, gz, FRAME_COLOR); b.add(depth, y0 - 3, gz, FRAME_COLOR); }
    }
    for (let gy = y0; gy <= y1; gy++) { b.add(0, gy, z0 - 1, FRAME_COLOR); b.add(0, gy, z0 - 2, FRAME_COLOR); b.add(0, gy, z0 - 3, FRAME_COLOR); }
    for (let gy = y0; gy <= y1; gy++) { b.add(0, gy, z1 + 1, FRAME_COLOR); b.add(0, gy, z1 + 2, FRAME_COLOR); b.add(0, gy, z1 + 3, FRAME_COLOR); }
    const seg = Math.floor((z1 - z0) / 3);
    const m1z = z0 + seg, m2z = z0 + seg * 2;
    for (let gy = y0; gy <= y1; gy++) { b.add(0, gy, m1z, FRAME_COLOR); b.add(0, gy, m2z, FRAME_COLOR); }
    const midY = Math.floor((y0 + y1) / 2);
    for (let gz = z0; gz <= z1; gz++) b.add(0, midY, gz, FRAME_COLOR);
  }

  _addLeftWindowOutdoor(b, w) {
    const { z0, z1, y0, y1 } = w;
    const wh = y1 - y0 + 1;
    const seg = Math.floor((z1 - z0) / 3);
    const m1z = z0 + seg, m2z = z0 + seg * 2;
    const midY = Math.floor((y0 + y1) / 2);

    for (let gz = z0; gz <= z1; gz++) {
      for (let gy = y0; gy <= y1; gy++) {
        if (gz === m1z || gz === m2z || gy === midY) continue;
        const t = (gy - y0) / wh;
        let color;
        if (t < 0.1) color = GROUND_GREEN;
        else if (t < 0.18) color = 0x6bab5a;
        else { const si = Math.min(SKY_GRADIENT.length - 1, Math.floor((1 - t) * SKY_GRADIENT.length * 0.8)); color = SKY_GRADIENT[si]; }
        b.add(-1, gy, gz, color);
      }
    }

    const treePositions = [
      { gz: z0 + 12, h: 24, cr: 8 }, { gz: z0 + 36, h: 20, cr: 7 },
      { gz: z1 - 12, h: 28, cr: 9 }, { gz: z1 - 32, h: 22, cr: 8 },
    ];
    for (const tp of treePositions) {
      for (let y = 0; y < tp.h; y++) b.add(-2, y0 + 2 + y, tp.gz, TREE_TRUNK);
      const cy = y0 + 2 + tp.h;
      for (let dy = -tp.cr; dy <= tp.cr; dy++)
        for (let dz = -tp.cr; dz <= tp.cr; dz++)
          if (dy * dy + dz * dz <= tp.cr * tp.cr + 1) {
            const gi = (Math.abs(dy) + Math.abs(dz)) % TREE_GREENS.length;
            const fy = cy + dy, fz = tp.gz + dz;
            if (fy >= y0 && fy <= y1 && fz >= z0 && fz <= z1) {
              b.add(-2, fy, fz, TREE_GREENS[gi]);
              if (Math.abs(dz) <= tp.cr - 2 && Math.abs(dy) <= tp.cr - 2) b.add(-3, fy, fz, TREE_GREENS[(gi + 2) % TREE_GREENS.length]);
            }
          }
    }
  }

  // ── Cabinet (fish tank stand) ────────────────────────
  _addCabinet(b) {
    const { x0, x1, z0, z1 } = CABINET;
    const cTop = 72;

    // Top surface with overhang — dark polished wood
    for (let x = x0 - 3; x < x1 + 4; x++)
      for (let z = z0 - 3; z < z1 + 4; z++)
        b.add(x, cTop, z, woodColor(CAB_TOP, x, z));

    // Front face with panel detail
    for (let x = x0; x <= x1; x++)
      for (let y = 4; y < cTop; y++) {
        const midX = Math.floor((x0 + x1) / 2);
        const inset = (x > x0 + 6 && x < midX - 3 && y > 12 && y < cTop - 6) ||
                      (x > midX + 3 && x < x1 - 6 && y > 12 && y < cTop - 6);
        b.add(x, y, z1, woodColor(inset ? CAB_PANEL : CAB_FRONT, x, y));
      }

    // Back face
    for (let x = x0; x <= x1; x++)
      for (let y = 4; y < cTop; y++)
        b.add(x, y, z0, woodColor(CAB_BODY, x, y));

    // Side faces
    for (let z = z0; z <= z1; z++)
      for (let y = 4; y < cTop; y++) {
        b.add(x0, y, z, woodColor(CAB_BODY, x0, z));
        b.add(x1, y, z, woodColor(CAB_BODY, x1, z));
      }

    // Bottom shelf
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++)
        b.add(x, 4, z, woodColor(CAB_BODY, x, z));

    // Door divider
    const midX = Math.floor((x0 + x1) / 2);
    for (let y = 4; y < cTop; y++) b.add(midX, y, z1, woodColor(0x2a2018, midX, y));

    // Knobs (metal)
    b.box(midX - 8, 38, z1 + 1, 4, 4, 1, 0x999999);
    b.box(midX + 5, 38, z1 + 1, 4, 4, 1, 0x999999);

    // Legs — tapered
    const legColor = 0x1a1a1a;
    for (const [lx, lz] of [[x0+2, z0+2], [x0+2, z1-2], [x1-2, z0+2], [x1-2, z1-2]]) {
      b.box(lx, 0, lz, 4, 4, 4, legColor);
    }
  }

  // ── Sofa — against front wall ────────────────────────
  _addSofa(b) {
    const sx0 = SOFA.x0, sx1 = SOFA.x1, sz0 = SOFA.z0, sz1 = SOFA.z1;
    // sz1 = back (against wall), sz0 = front (toward camera/tank)

    // Legs (dark wood)
    for (const [lx, lz] of [[sx0+4, sz0+2], [sx0+4, sz1-2], [sx1-4, sz0+2], [sx1-4, sz1-2]]) {
      for (let y = 0; y < 6; y++) { b.add(lx, y, lz, 0x5a4a3a); b.add(lx+1, y, lz, 0x5a4a3a); b.add(lx, y, lz+1, 0x5a4a3a); b.add(lx+1, y, lz+1, 0x5a4a3a); }
    }

    // Seat base/frame (hidden, darker)
    b.box(sx0, 6, sz0, sx1-sx0+1, 4, sz1-sz0+1, (x,y,z) => fabricColor(SOFA_DARK, x, y));

    // Seat cushions — 3 sections with gaps
    const cushW = Math.floor((sx1 - sx0 - 8) / 3);
    for (let ci = 0; ci < 3; ci++) {
      const cx0 = sx0 + 3 + ci * (cushW + 2);
      const cx1 = cx0 + cushW;
      for (let x = cx0; x < cx1; x++)
        for (let y = 10; y < 22; y++)
          for (let z = sz0 + 4; z < sz1 - 16; z++) {
            // Rounded top: skip corners at top
            const atTop = y >= 20;
            const atEdgeX = x <= cx0 + 1 || x >= cx1 - 2;
            const atEdgeZ = z <= sz0 + 5 || z >= sz1 - 18;
            if (atTop && atEdgeX && atEdgeZ) continue;
            b.add(x, y, z, fabricColor(SOFA_CUSHION, x, y));
          }
    }

    // Back cushions — 3 sections, taller, against wall
    for (let ci = 0; ci < 3; ci++) {
      const cx0 = sx0 + 3 + ci * (cushW + 2);
      const cx1 = cx0 + cushW;
      for (let x = cx0; x < cx1; x++)
        for (let y = 10; y < 50; y++)
          for (let z = sz1 - 16; z < sz1 - 2; z++) {
            const atTop = y >= 47;
            const atEdgeX = x <= cx0 + 1 || x >= cx1 - 2;
            if (atTop && atEdgeX) continue;
            // Slight gradient: lighter at top
            const t = (y - 10) / 40;
            const shade = t > 0.7 ? SOFA_CUSHION : SOFA_BASE;
            b.add(x, y, z, fabricColor(shade, x, y));
          }
    }

    // Armrests — chunky, rolled shape
    for (let side = 0; side < 2; side++) {
      const ax0 = side === 0 ? sx0 - 2 : sx1 - 12;
      const ax1 = side === 0 ? sx0 + 14 : sx1 + 3;
      for (let x = ax0; x < ax1; x++)
        for (let y = 6; y < 30; y++)
          for (let z = sz0 + 2; z < sz1 - 2; z++) {
            // Rounded top
            const armMidY = 24;
            const armR = 8;
            const localX = x - (ax0 + ax1) / 2;
            const localY = y - armMidY;
            if (y > armMidY && (localX * localX + localY * localY) > armR * armR * 1.5) continue;
            b.add(x, y, z, fabricColor(SOFA_ARM, x, y));
          }
    }

    // Throw pillows with different colors
    const pillows = [
      { x: sx0 + 20, color: 0xc17a4a },   // burnt orange
      { x: sx0 + cushW + 10, color: 0x5a7a6a }, // sage green
      { x: sx1 - 30, color: 0x8a5a4a },    // terracotta
    ];
    for (const p of pillows) {
      for (let x = p.x; x < p.x + 14; x++)
        for (let y = 22; y < 36; y++)
          for (let z = sz1 - 22; z < sz1 - 14; z++) {
            // Diamond/rounded shape
            const cx = (x - p.x - 7);
            const cy = (y - 29);
            if (Math.abs(cx) + Math.abs(cy) > 9) continue;
            b.add(x, y, z, fabricColor(p.color, x, y));
          }
    }

    // Throw blanket draped over right arm
    for (let x = sx1 - 6; x < sx1 + 4; x++)
      for (let y = 18; y < 34; y++)
        for (let z = sz1 - 30; z < sz1 - 16; z++) {
          if (Math.random() > 0.85) continue; // Irregular edge
          b.add(x, y, z, fabricColor(0x4a6a8a, x, y));
        }
  }

  // ── Coffee Table ─────────────────────────────────────
  _addCoffeeTable(b) {
    const { x0, x1, z0, z1 } = COFFEE_TABLE;
    const topY = 34;

    // Legs (black metal, square tube)
    for (const [lx, lz] of [[x0+2, z0+2], [x0+2, z1-2], [x1-2, z0+2], [x1-2, z1-2]]) {
      for (let y = 1; y <= topY; y++) {
        b.add(lx, y, lz, 0x2a2a2a); b.add(lx+1, y, lz, 0x2a2a2a);
        b.add(lx, y, lz+1, 0x2a2a2a); b.add(lx+1, y, lz+1, 0x2a2a2a);
      }
    }

    // Cross bars between legs (low)
    for (let x = x0 + 4; x < x1 - 2; x++) { b.add(x, 8, z0 + 3, 0x2a2a2a); b.add(x, 8, z1 - 2, 0x2a2a2a); }
    for (let z = z0 + 4; z < z1 - 2; z++) { b.add(x0 + 3, 8, z, 0x2a2a2a); b.add(x1 - 2, 8, z, 0x2a2a2a); }

    // Lower shelf (lighter wood)
    for (let x = x0 + 4; x < x1 - 3; x++)
      for (let z = z0 + 4; z < z1 - 3; z++)
        b.add(x, 9, z, woodColor(0x9a7a5a, x, z));

    // Table top (rich dark wood, thick)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++)
        for (let y = topY; y <= topY + 3; y++)
          b.add(x, y, z, woodColor(0x5a3a1a, x, z));

    // Books stack
    b.box(x1 - 22, topY + 4, z0 + 6, 16, 3, 12, (x,y,z) => noisyColor(0x8b2500, 0.02));
    b.box(x1 - 20, topY + 7, z0 + 7, 14, 3, 11, (x,y,z) => noisyColor(0x2d4a6f, 0.02));
    b.box(x1 - 18, topY + 10, z0 + 8, 11, 2, 9, (x,y,z) => noisyColor(0x4a6b3d, 0.02));

    // Small potted succulent
    b.box(x0 + 6, topY + 4, z0 + 6, 8, 6, 8, (x,y,z) => noisyColor(0xd4a574, 0.03));
    b.box(x0 + 7, topY + 10, z0 + 7, 6, 4, 6, (x,y,z) => noisyColor(0x3a8a3a, 0.04));
    b.box(x0 + 8, topY + 14, z0 + 8, 4, 3, 4, (x,y,z) => noisyColor(0x2a7a2a, 0.04));

    // Candle
    b.box(x0 + 20, topY + 4, z1 - 12, 5, 8, 5, (x,y,z) => noisyColor(0xf5f0e8, 0.015));
    b.add(x0 + 22, topY + 12, z1 - 10, 0xffcc44);

    // Coaster
    b.box(x0 + 32, topY + 4, z1 - 12, 8, 1, 8, (x,y,z) => noisyColor(0x7a5a3a, 0.02));
  }

  // ── TV Console ───────────────────────────────────────
  _addTVConsole(b) {
    const tx0 = TVCONSOLE.x0, tx1 = TVCONSOLE.x1;
    const tz0 = TVCONSOLE.z0, tz1 = TVCONSOLE.z1;
    const topY = 48;

    // Legs
    for (const [lx, lz] of [[tx0+2, tz0+2], [tx0+2, tz1-2], [tx1-2, tz0+2], [tx1-2, tz1-2]]) {
      b.box(lx, 0, lz, 3, 5, 3, 0x333333);
    }

    // Body shell (warm walnut wood)
    for (let x = tx0; x <= tx1; x++)
      for (let y = 5; y <= topY; y++)
        for (let z = tz0; z <= tz1; z++) {
          if (x === tx0 || x === tx1 || y === 5 || y === topY || z === tz0 || z === tz1)
            b.add(x, y, z, woodColor(y === topY ? 0x6b4a2a : 0x7a5a3a, x, z));
        }

    // Top overhang
    for (let x = tx0 - 3; x <= tx1 + 3; x++)
      for (let z = tz0 - 3; z <= tz1 + 3; z++)
        b.add(x, topY + 1, z, woodColor(0x6b4a2a, x, z));

    // Cabinet door dividers
    const seg = Math.floor((tx1 - tx0) / 3);
    for (let i = 1; i < 3; i++) {
      const dx = tx0 + seg * i;
      for (let y = 5; y <= topY; y++) b.add(dx, y, tz1, woodColor(0x5a3a1a, dx, y));
    }

    // Photo frame on top
    b.box(tx0 + 8, topY + 2, tz0 + 6, 4, 16, 2, 0x333333);
    b.box(tx0 + 9, topY + 4, tz0 + 7, 2, 12, 1, 0xddc9a5);

    // Plant on top
    b.box(tx1 - 14, topY + 2, tz0 + 6, 10, 6, 10, (x,y,z) => noisyColor(0xe8e0d0, 0.02));
    b.box(tx1 - 12, topY + 8, tz0 + 7, 7, 6, 7, (x,y,z) => noisyColor(0x2d8b2d, 0.04));
    b.box(tx1 - 10, topY + 14, tz0 + 8, 5, 4, 5, (x,y,z) => noisyColor(0x1a6b1a, 0.04));
  }

  // ── TV (55 inch, on console) ─────────────────────────
  _addTV(b) {
    const midX = Math.floor((TVCONSOLE.x0 + TVCONSOLE.x1) / 2);
    const tw = 110, th = 62;
    const tx0 = midX - Math.floor(tw / 2);
    const ty0 = 55;

    // Stand base
    b.box(midX - 12, 49, 8, 25, 4, 14, 0x222222);
    // Stand neck
    b.box(midX - 3, 49, 12, 7, 6, 6, 0x222222);

    // TV bezel
    for (let x = tx0; x < tx0 + tw; x++)
      for (let y = ty0; y < ty0 + th; y++) {
        if (x === tx0 || x === tx0 + tw - 1 || y === ty0 || y === ty0 + th - 1)
          b.add(x, y, 10, 0x111111);
      }

    // Screen — subtle off-black with slight blue
    for (let x = tx0 + 1; x < tx0 + tw - 1; x++)
      for (let y = ty0 + 1; y < ty0 + th - 1; y++) {
        const t = (y - ty0) / th;
        const screenBase = t < 0.5 ? 0x1a1a2e : 0x161626;
        b.add(x, y, 10, noisyColor(screenBase, 0.008));
      }
  }

  // ── Door ─────────────────────────────────────────────
  _addDoorVoxels(b) {
    const { x0, x1, y1 } = DOOR;

    // Door frame (dark wood)
    for (let gy = 1; gy <= y1 + 4; gy++) {
      for (let d = 1; d <= 4; d++) { b.add(x0 - d, gy, 0, woodColor(0x5c3a1a, x0-d, gy)); b.add(x1 + d, gy, 0, woodColor(0x5c3a1a, x1+d, gy)); }
    }
    for (let gx = x0 - 4; gx <= x1 + 4; gx++) {
      for (let dy = 1; dy <= 4; dy++) b.add(gx, y1 + dy, 0, woodColor(0x5c3a1a, gx, y1+dy));
    }

    // Door panel with inset details
    for (let gx = x0; gx <= x1; gx++)
      for (let gy = 1; gy <= y1; gy++) {
        const insetTop = gx > x0 + 8 && gx < x1 - 8 && gy > y1 - 40 && gy < y1 - 8;
        const insetBot = gx > x0 + 8 && gx < x1 - 8 && gy > 14 && gy < 70;
        const base = (insetTop || insetBot) ? 0x6b4226 : 0x7a5230;
        b.add(gx, gy, 2, woodColor(base, gx, gy));
      }

    // Doorknob plate
    b.box(x1 - 12, 70, 2, 6, 10, 1, 0xb8a060);
  }

  // ── Side Table (bigger, next to sofa) ────────────────
  _addSideTable(b) {
    const { x0, x1, z0, z1 } = SIDETABLE;
    const topY = 36;

    // Legs (4 legs, dark metal)
    for (const [lx, lz] of [[x0+2, z0+2], [x0+2, z1-2], [x1-2, z0+2], [x1-2, z1-2]]) {
      for (let y = 1; y <= topY; y++) { b.add(lx, y, lz, 0x2a2a2a); b.add(lx+1, y, lz, 0x2a2a2a); }
    }

    // Table top (round-ish, dark wood)
    for (let x = x0 - 4; x <= x1 + 4; x++)
      for (let z = z0 - 4; z <= z1 + 4; z++) {
        const cx = (x - (x0 + x1) / 2);
        const cz = (z - (z0 + z1) / 2);
        const r = ((x1 - x0) / 2) + 4;
        if (cx * cx + cz * cz <= r * r)
          for (let y = topY; y <= topY + 2; y++)
            b.add(x, y, z, woodColor(0x5a3a1a, x, z));
      }

    // Vase with flowers
    b.box(x0 + 8, topY + 3, z0 + 8, 8, 12, 8, (x,y,z) => noisyColor(0x4a7aaa, 0.03));
    // Stems
    for (let y = topY + 15; y < topY + 24; y++) {
      b.add(x0 + 11, y, z0 + 11, 0x3a7a3a);
      b.add(x0 + 13, y, z0 + 12, 0x3a7a3a);
      b.add(x0 + 10, y, z0 + 13, 0x3a7a3a);
    }
    // Flower heads
    b.box(x0 + 9, topY + 24, z0 + 9, 5, 4, 5, (x,y,z) => noisyColor(0xff6666, 0.05));
    b.box(x0 + 11, topY + 23, z0 + 11, 5, 4, 5, (x,y,z) => noisyColor(0xffcc44, 0.05));
    b.box(x0 + 8, topY + 22, z0 + 12, 4, 3, 4, (x,y,z) => noisyColor(0xff88aa, 0.05));

    // Small lamp
    b.box(x0 + 20, topY + 3, z0 + 10, 6, 4, 6, 0x2a2a2a); // base
    for (let y = topY + 7; y < topY + 18; y++) { b.add(x0 + 22, y, z0 + 12, 0x3a3a3a); b.add(x0 + 23, y, z0 + 13, 0x3a3a3a); } // stem
    // Shade
    b.box(x0 + 18, topY + 18, z0 + 8, 12, 10, 12, (x,y,z) => {
      const isSurface = x === x0+18 || x === x0+29 || z === z0+8 || z === z0+19 || y === x0+27;
      return isSurface ? noisyColor(0xe8dcc8, 0.02) : null;
    });
  }

  // ── Wall Art ─────────────────────────────────────────
  _addWallArt(b) {
    // Large landscape painting — right of door (door is gx 200-272, art starts at 290)
    const ax0 = 290, ax1 = 370, ay0 = 88, ay1 = 148;
    // Frame
    for (let x = ax0 - 3; x <= ax1 + 3; x++) { b.add(x, ay0 - 3, 1, 0x3a3028); b.add(x, ay0 - 2, 1, 0x3a3028); b.add(x, ay0 - 1, 1, 0x3a3028); b.add(x, ay1 + 1, 1, 0x3a3028); b.add(x, ay1 + 2, 1, 0x3a3028); b.add(x, ay1 + 3, 1, 0x3a3028); }
    for (let y = ay0; y <= ay1; y++) { b.add(ax0 - 1, y, 1, 0x3a3028); b.add(ax0 - 2, y, 1, 0x3a3028); b.add(ax0 - 3, y, 1, 0x3a3028); b.add(ax1 + 1, y, 1, 0x3a3028); b.add(ax1 + 2, y, 1, 0x3a3028); b.add(ax1 + 3, y, 1, 0x3a3028); }

    // Canvas: sunset landscape
    for (let x = ax0; x <= ax1; x++)
      for (let y = ay0; y <= ay1; y++) {
        const t = (y - ay0) / (ay1 - ay0);
        const s = (x - ax0) / (ax1 - ax0);
        let color;
        if (t < 0.15) { // Ground
          const grass = Math.sin(s * 20 + t * 5) * 0.03;
          _tc.set(0x3a5a2a); _tc.r += grass; _tc.g += grass * 1.5;
          color = { r: _tc.r, g: _tc.g, b: _tc.b };
        } else if (t < 0.25) { // Treeline/hills
          const hill = Math.sin(s * 8) * 0.1;
          color = t < 0.20 + hill ? noisyColor(0x2a4a1a, 0.03) : noisyColor(0xdda060, 0.03);
        } else if (t < 0.45) { // Golden/orange sky
          color = noisyColor(0xe8a050, 0.04);
        } else if (t < 0.6) { // Pink/red sky
          color = noisyColor(0xd07060, 0.04);
        } else { // Blue/purple sky
          const blend = (t - 0.6) / 0.4;
          _tc.set(0x8060a0); const end = new THREE.Color(0x4a3a6a);
          _tc.lerp(end, blend);
          _tc.r += (Math.random() - 0.5) * 0.03;
          _tc.g += (Math.random() - 0.5) * 0.03;
          _tc.b += (Math.random() - 0.5) * 0.03;
          color = { r: _tc.r, g: _tc.g, b: _tc.b };
        }
        b.add(x, y, 1, color);
      }

    // Small square photos cluster — above TV console area
    // Photo 1
    b.box(60, 104, 1, 22, 22, 1, 0x3a3028); // frame
    b.box(62, 106, 1, 18, 18, 1, (x,y,z) => noisyColor(0xa0b8c8, 0.04)); // beach scene
    // Photo 2
    b.box(90, 110, 1, 16, 16, 1, 0x3a3028);
    b.box(92, 112, 1, 12, 12, 1, (x,y,z) => noisyColor(0xc0a880, 0.04)); // sepia
  }

  // ── Window lights ────────────────────────────────────
  _addWindowLights() {
    for (const w of LW_WINS) {
      const centerZ = BACK_Z + ((w.z0 + w.z1) / 2) * RV + RV / 2;
      const centerY = ROOM_FLOOR_Y + ((w.y0 + w.y1) / 2) * RV + RV / 2;
      const light = new THREE.PointLight(0xfff5e0, 1.2, 160);
      light.position.set(-HALF_W + 8, centerY, centerZ);
      this.scene.add(light);
    }
  }

  _addCurtains() {
    const curtainMat = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0.12, transparent: true, side: THREE.DoubleSide });
    for (const w of LW_WINS) {
      const winZ0 = BACK_Z + w.z0 * RV;
      const winZ1 = BACK_Z + (w.z1 + 1) * RV;
      const winH = (w.y1 - w.y0 + 1) * RV;
      const winCenterY = ROOM_FLOOR_Y + ((w.y0 + w.y1) / 2) * RV + RV / 2;
      const cl = new THREE.Mesh(new THREE.PlaneGeometry(7, winH), curtainMat.clone());
      cl.rotation.y = Math.PI / 2; cl.position.set(-HALF_W + RV * 3, winCenterY, winZ0 + 2);
      this.scene.add(cl);
      const cr = new THREE.Mesh(new THREE.PlaneGeometry(7, winH), curtainMat.clone());
      cr.rotation.y = Math.PI / 2; cr.position.set(-HALF_W + RV * 3, winCenterY, winZ1 - 2);
      this.scene.add(cr);
    }
  }

  // ── Separate elements ────────────────────────────────
  _buildSeparateElements() {
    this._buildFloorPlants();
    this._buildFloorLamp();
    this._buildCat();
    this._buildInteractiveElements();
  }

  // ── Floor Plants — BIGGER with proper detail ─────────
  _buildFloorPlants() {
    // Large monstera — left of cabinet
    const monsteraVoxels = [];
    // Terracotta pot (bigger)
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++) {
        if (x*x + z*z > 12) continue;
        for (let y = 0; y <= 5; y++) {
          const isRim = y >= 4;
          const isInner = x*x + z*z < 5 && y >= 2;
          if (isInner && !isRim) continue;
          monsteraVoxels.push([x, y, z, isRim ? 0xc47040 : 0xb06030]);
        }
      }
    // Soil
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++)
        if (x*x + z*z < 6) monsteraVoxels.push([x, 5, z, 0x3d2b1f]);

    // Main stems + leaves
    const stems = [[0,0], [1,1], [-1,0]];
    for (const [sx, sz] of stems) {
      for (let y = 6; y <= 16; y++) monsteraVoxels.push([sx, y, sz, 0x2a6a2a]);
      // Large leaves at top
      const ly = 14 + Math.floor(Math.random() * 3);
      for (let dx = -4; dx <= 4; dx++)
        for (let dz = -3; dz <= 3; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > 5) continue;
          const leafY = ly + Math.floor(Math.abs(dx) * 0.3);
          const shade = (Math.abs(dx) + Math.abs(dz)) % 2 === 0 ? 0x228b22 : 0x2d8b2d;
          monsteraVoxels.push([sx + dx, leafY, sz + dz, shade]);
          // Leaf holes (monstera characteristic)
          if (Math.abs(dx) > 2 && Math.abs(dz) > 1 && Math.random() > 0.5) monsteraVoxels.pop();
        }
    }
    // Extra drooping leaves
    for (let dx = -5; dx <= 5; dx++) {
      const dy = 12 - Math.abs(dx) * 0.5;
      monsteraVoxels.push([dx, Math.floor(dy), dx > 0 ? 2 : -2, 0x1a7a1a]);
      monsteraVoxels.push([dx, Math.floor(dy) - 1, dx > 0 ? 3 : -3, 0x1a6b1a]);
    }

    const p1 = buildVoxelGroup(monsteraVoxels);
    p1.scale.setScalar(2.2);
    // Monstera: left rear corner (near TV console and left wall)
    p1.position.set(-95, ROOM_FLOOR_Y, -70);
    this.scene.add(p1);

    // Fiddle-leaf fig — right of cabinet (tall, dramatic)
    const fiddleVoxels = [];
    // White ceramic pot
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++) {
        if (x*x + z*z > 12) continue;
        for (let y = 0; y <= 5; y++) {
          const isInner = x*x + z*z < 5 && y >= 2;
          if (isInner) continue;
          fiddleVoxels.push([x, y, z, 0xe8e0d8]);
        }
      }
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++)
        if (x*x + z*z < 6) fiddleVoxels.push([x, 5, z, 0x3d2b1f]);
    // Tall trunk
    for (let y = 6; y <= 20; y++) {
      fiddleVoxels.push([0, y, 0, 0x5c4033]);
      if (y > 12) fiddleVoxels.push([0, y, 1, 0x5c4033]);
    }
    // Big fiddle leaves
    const leafCenters = [[0, 18], [-2, 16], [2, 17], [0, 14], [-1, 12]];
    for (const [lx, ly] of leafCenters) {
      for (let dx = -3; dx <= 3; dx++)
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > 4) continue;
          const shade = (dx + dz) % 2 === 0 ? 0x2d8b2d : 0x228b22;
          fiddleVoxels.push([lx + dx, ly + 1, dz, shade]);
          if (Math.abs(dx) < 2) fiddleVoxels.push([lx + dx, ly + 2, dz, 0x1a7a1a]);
        }
    }

    const p2 = buildVoxelGroup(fiddleVoxels);
    p2.scale.setScalar(2.2);
    // Fiddle-leaf fig: next to sofa on the left side
    p2.position.set(-75, ROOM_FLOOR_Y, 60);
    this.scene.add(p2);

    // Snake plant — corner near right wall
    const snakeVoxels = [];
    // Short round pot
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++) {
        if (x*x + z*z > 6) continue;
        for (let y = 0; y <= 3; y++) snakeVoxels.push([x, y, z, 0x8b4513]);
      }
    for (let x = -1; x <= 1; x++)
      for (let z = -1; z <= 1; z++) snakeVoxels.push([x, 3, z, 0x3d2b1f]);
    // Tall sword leaves
    const leaves = [[-1, 0], [0, 0], [1, 0], [0, -1], [0, 1]];
    for (const [lx, lz] of leaves) {
      const h = 10 + Math.floor(Math.random() * 6);
      for (let y = 4; y < 4 + h; y++) {
        const t = (y - 4) / h;
        const dark = t < 0.3 ? 0x2d6b2d : t < 0.6 ? 0x3d8b3d : 0x4d9b4d;
        snakeVoxels.push([lx, y, lz, dark]);
        // Yellow edges
        if (Math.random() > 0.6) snakeVoxels.push([lx + (lx === 0 ? 1 : 0), y, lz, 0x8bab3d]);
      }
    }

    const p3 = buildVoxelGroup(snakeVoxels);
    p3.scale.setScalar(2.4);
    // Snake plant: right rear corner, between cabinet and right wall
    p3.position.set(105, ROOM_FLOOR_Y, -80);
    this.scene.add(p3);
  }

  // ── Floor Lamp ───────────────────────────────────────
  _buildFloorLamp() {
    const lampVoxels = [
      [-1,0,-1,0x2a2a2a],[0,0,-1,0x2a2a2a],[1,0,-1,0x2a2a2a],
      [-1,0,0,0x2a2a2a],[0,0,0,0x2a2a2a],[1,0,0,0x2a2a2a],
      [-1,0,1,0x2a2a2a],[0,0,1,0x2a2a2a],[1,0,1,0x2a2a2a],
    ];
    // Tall pole
    for (let y = 1; y <= 24; y++) lampVoxels.push([0, y, 0, 0x333333]);
    // Shade (drum shade)
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++)
        for (let y = 25; y <= 29; y++) {
          if (x*x + z*z > 12) continue;
          const isSurface = x*x + z*z > 7 || y === 25 || y === 29;
          if (isSurface) lampVoxels.push([x, y, z, 0xd4c5a9]);
        }
    // Warm glow inside
    lampVoxels.push([0, 26, 0, 0xffe8c0]);
    lampVoxels.push([0, 27, 0, 0xffe8c0]);
    lampVoxels.push([0, 28, 0, 0xffe8c0]);

    const lamp = buildVoxelGroup(lampVoxels);
    lamp.scale.setScalar(1.8);
    // Floor lamp: right of sofa, near front wall
    const lampX = 60;
    const lampZ = 75;
    lamp.position.set(lampX, ROOM_FLOOR_Y, lampZ);
    this.scene.add(lamp);

    const lampLight = new THREE.PointLight(0xffe8c0, 1.0, 100);
    lampLight.position.set(lampX, ROOM_FLOOR_Y + 52, lampZ);
    this.scene.add(lampLight);
  }

  // ── Interactive elements ─────────────────────────────
  _buildInteractiveElements() {
    const doorCenterX = -HALF_W + ((DOOR.x0 + DOOR.x1) / 2) * RV + RV / 2;
    const doorCenterY = ROOM_FLOOR_Y + 72 * RV + RV / 2;
    const knobGeo = new THREE.SphereGeometry(1.0, 8, 8);
    const knobMat = new THREE.MeshLambertMaterial({ color: 0xc9a84c });
    this._doorknob = new THREE.Mesh(knobGeo, knobMat);
    this._doorknob.name = 'doorknob';
    this._doorknob.position.set(-HALF_W + DOOR.x1 * RV + RV * 0.5, doorCenterY, BACK_Z + 3 * RV);
    this.scene.add(this._doorknob);
    this._doorX = doorCenterX;
    this._doorZ = BACK_Z;
    this._doorCenterY = doorCenterY;

    const switchX = -HALF_W + (DOOR.x1 + 14) * RV + RV / 2;
    const switchY = ROOM_FLOOR_Y + 96 * RV;
    const switchZ = BACK_Z + 0.5;
    const plateMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.4), plateMat);
    plate.position.set(switchX, switchY, switchZ);
    this.scene.add(plate);
    const borderMat = new THREE.MeshLambertMaterial({ color: 0xddd8cc });
    const border = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.4, 0.3), borderMat);
    border.position.set(switchX, switchY, switchZ - 0.05);
    this.scene.add(border);
    const toggleMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
    this._switchToggle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.5), toggleMat);
    this._switchToggle.position.set(switchX, switchY, switchZ + 0.3);
    this._switchToggle.name = 'lightswitch';
    this.scene.add(this._switchToggle);
    this._lightswitch = this._switchToggle;
  }

  // ── Cat easter egg ───────────────────────────────────
  _buildCat() {
    const catVoxels = [
      [1,0,0,0xff8c00],[2,0,0,0xff8c00],[3,0,0,0xff8c00],[4,0,0,0xff8c00],
      [0,1,0,0xff8c00],[1,1,0,0xff8c00],[2,1,0,0xffb6c1],[3,1,0,0xffb6c1],[4,1,0,0xff8c00],[5,1,0,0xff8c00],
      [0,2,0,0xff8c00],[1,2,0,0xff8c00],[2,2,0,0xff8c00],[3,2,0,0xffb6c1],[4,2,0,0xff8c00],[5,2,0,0xff8c00],
      [0,3,0,0xff8c00],[1,3,0,0x2d2d2d],[2,3,0,0xff8c00],[3,3,0,0xff8c00],[4,3,0,0x2d2d2d],[5,3,0,0xff8c00],
      [0,4,0,0xff8c00],[1,4,0,0xff8c00],[2,4,0,0xff8c00],[3,4,0,0xff8c00],[4,4,0,0xff8c00],[5,4,0,0xff8c00],
      [0,5,0,0xff6600],[1,5,0,0xffb6c1],[4,5,0,0xffb6c1],[5,5,0,0xff6600],
      [0,6,0,0xff6600],[5,6,0,0xff6600],
      [0,1,-1,0xff8c00],[0,2,-1,0xff8c00],[0,3,-1,0xff8c00],[0,4,-1,0xff8c00],
      [5,1,-1,0xff8c00],[5,2,-1,0xff8c00],[5,3,-1,0xff8c00],[5,4,-1,0xff8c00],
      [1,1,-1,0xff8c00],[2,1,-1,0xff8c00],[3,1,-1,0xff8c00],[4,1,-1,0xff8c00],
      [1,2,-1,0xff8c00],[2,2,-1,0xff8c00],[3,2,-1,0xff8c00],[4,2,-1,0xff8c00],
      [1,3,-1,0xff8c00],[2,3,-1,0xff8c00],[3,3,-1,0xff8c00],[4,3,-1,0xff8c00],
      [1,4,-1,0xff8c00],[2,4,-1,0xff8c00],[3,4,-1,0xff8c00],[4,4,-1,0xff8c00],
    ];
    this._catGroup = buildVoxelGroup(catVoxels);
    this._catGroup.scale.setScalar(1.0);
    const peekX = this._doorX + 10;
    const hiddenX = this._doorX + 22;
    this._catPeekX = peekX;
    this._catHiddenX = hiddenX;
    this._catGroup.position.set(hiddenX, this._doorCenterY - 6, this._doorZ + 0.5);
    this._catGroup.visible = false;
    this.scene.add(this._catGroup);
  }

  // ── Click handler ────────────────────────────────────
  _onClick(e) {
    this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    if (this._lightswitch) {
      const switchHits = this._raycaster.intersectObject(this._lightswitch);
      if (switchHits.length > 0) {
        const isOn = this._lighting.toggleRoomLights();
        this._switchToggle.rotation.x = isOn ? 0 : 0.4;
        return;
      }
    }
    const hits = this._raycaster.intersectObject(this._doorknob);
    if (hits.length > 0) {
      this._doorknobClicks++;
      if (this._doorknobClicks >= 3 && this._catState === 'hidden') {
        this._catState = 'peeking'; this._catTimer = 0;
        this._catGroup.visible = true; this._catGroup.position.x = this._catHiddenX;
        this._doorknobClicks = 0;
      }
    }
  }

  // ── Animation ────────────────────────────────────────
  update(delta) {
    if (this._catState === 'hidden') return;
    this._catTimer += delta;
    if (this._catState === 'peeking') {
      const t = Math.min(this._catTimer / 1.0, 1);
      const ease = t * (2 - t);
      this._catGroup.position.x = this._catHiddenX + (this._catPeekX - this._catHiddenX) * ease;
      if (t >= 1) { this._catState = 'visible'; this._catTimer = 0; }
    } else if (this._catState === 'visible') {
      this._catGroup.rotation.z = Math.sin(this._catTimer * 2) * 0.08;
      if (this._catTimer >= 3) { this._catState = 'hiding'; this._catTimer = 0; }
    } else if (this._catState === 'hiding') {
      const t = Math.min(this._catTimer / 0.8, 1);
      const ease = t * t;
      this._catGroup.position.x = this._catPeekX + (this._catHiddenX - this._catPeekX) * ease;
      this._catGroup.rotation.z *= (1 - t);
      if (t >= 1) { this._catState = 'hidden'; this._catGroup.visible = false; this._catGroup.rotation.z = 0; }
    }
  }
}
