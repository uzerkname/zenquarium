import * as THREE from 'three';
import { VOXEL_SIZE, VOXEL_SUBDIVISION } from '../constants.js';

/* ── Face definitions for a unit voxel ─────────────────────────────────
 * Each face: direction to check for neighbor occlusion, 4 vertices in
 * CCW winding order. Each vertex carries AO neighbor offsets
 * [edgeA, edgeB, diagonal] for per-vertex ambient occlusion.          */
const FACES = [
  { dir: [ 1, 0, 0], corners: [
    { pos: [1,0,0], ao: [[0,-1,0],[0,0,-1],[0,-1,-1]] },
    { pos: [1,1,0], ao: [[0, 1,0],[0,0,-1],[0, 1,-1]] },
    { pos: [1,1,1], ao: [[0, 1,0],[0,0, 1],[0, 1, 1]] },
    { pos: [1,0,1], ao: [[0,-1,0],[0,0, 1],[0,-1, 1]] },
  ]},
  { dir: [-1, 0, 0], corners: [
    { pos: [0,0,1], ao: [[0,-1,0],[0,0, 1],[0,-1, 1]] },
    { pos: [0,1,1], ao: [[0, 1,0],[0,0, 1],[0, 1, 1]] },
    { pos: [0,1,0], ao: [[0, 1,0],[0,0,-1],[0, 1,-1]] },
    { pos: [0,0,0], ao: [[0,-1,0],[0,0,-1],[0,-1,-1]] },
  ]},
  { dir: [ 0, 1, 0], corners: [
    { pos: [0,1,1], ao: [[-1,0,0],[0,0, 1],[-1,0, 1]] },
    { pos: [1,1,1], ao: [[ 1,0,0],[0,0, 1],[ 1,0, 1]] },
    { pos: [1,1,0], ao: [[ 1,0,0],[0,0,-1],[ 1,0,-1]] },
    { pos: [0,1,0], ao: [[-1,0,0],[0,0,-1],[-1,0,-1]] },
  ]},
  { dir: [ 0,-1, 0], corners: [
    { pos: [0,0,0], ao: [[-1,0,0],[0,0,-1],[-1,0,-1]] },
    { pos: [1,0,0], ao: [[ 1,0,0],[0,0,-1],[ 1,0,-1]] },
    { pos: [1,0,1], ao: [[ 1,0,0],[0,0, 1],[ 1,0, 1]] },
    { pos: [0,0,1], ao: [[-1,0,0],[0,0, 1],[-1,0, 1]] },
  ]},
  { dir: [ 0, 0, 1], corners: [
    { pos: [1,0,1], ao: [[ 1,0,0],[0,-1,0],[ 1,-1,0]] },
    { pos: [1,1,1], ao: [[ 1,0,0],[0, 1,0],[ 1, 1,0]] },
    { pos: [0,1,1], ao: [[-1,0,0],[0, 1,0],[-1, 1,0]] },
    { pos: [0,0,1], ao: [[-1,0,0],[0,-1,0],[-1,-1,0]] },
  ]},
  { dir: [ 0, 0,-1], corners: [
    { pos: [0,0,0], ao: [[-1,0,0],[0,-1,0],[-1,-1,0]] },
    { pos: [0,1,0], ao: [[-1,0,0],[0, 1,0],[-1, 1,0]] },
    { pos: [1,1,0], ao: [[ 1,0,0],[0, 1,0],[ 1, 1,0]] },
    { pos: [1,0,0], ao: [[ 1,0,0],[0,-1,0],[ 1,-1,0]] },
  ]},
];

// AO brightness: 0 = fully occluded corner, 3 = fully exposed
const AO_CURVE = [0.5, 0.7, 0.85, 1.0];

/**
 * Subdivide each voxel into factor^3 smaller voxels.
 * Coordinates are scaled up, voxelSize should be divided by the same factor.
 */
function subdivideVoxels(voxels, factor) {
  const result = [];
  for (const [x, y, z, color] of voxels) {
    for (let dx = 0; dx < factor; dx++) {
      for (let dy = 0; dy < factor; dy++) {
        for (let dz = 0; dz < factor; dz++) {
          result.push([x * factor + dx, y * factor + dy, z * factor + dz, color]);
        }
      }
    }
  }
  return result;
}

/**
 * Core builder — face-culled mesh with per-vertex ambient occlusion.
 * Only emits quad faces where no adjacent neighbor exists, and darkens
 * vertices in corners/crevices so the blocky geometry reads as sculpted.
 * Returns a single Mesh with vertex colors (one draw call).
 */
function _buildGroup(voxels, voxelSize) {
  const group = new THREE.Group();
  if (!voxels.length) return group;

  const occupied = new Set();
  for (const [x, y, z] of voxels) occupied.add(`${x},${y},${z}`);

  const positions = [];
  const normals   = [];
  const colors    = [];
  const indices   = [];
  let vi = 0;

  for (const [vx, vy, vz, color] of voxels) {
    const cr = ((color >> 16) & 0xFF) / 255;
    const cg = ((color >>  8) & 0xFF) / 255;
    const cb = ( color        & 0xFF) / 255;

    for (const face of FACES) {
      const [nx, ny, nz] = face.dir;
      if (occupied.has(`${vx+nx},${vy+ny},${vz+nz}`)) continue;

      const ao = [];
      for (const corner of face.corners) {
        const [e1, e2, diag] = corner.ao;
        const s1 = occupied.has(`${vx+e1[0]},${vy+e1[1]},${vz+e1[2]}`) ? 1 : 0;
        const s2 = occupied.has(`${vx+e2[0]},${vy+e2[1]},${vz+e2[2]}`) ? 1 : 0;
        const sc = occupied.has(`${vx+diag[0]},${vy+diag[1]},${vz+diag[2]}`) ? 1 : 0;
        ao.push((s1 && s2) ? 0 : 3 - (s1 + s2 + sc));
      }

      for (let i = 0; i < 4; i++) {
        const [px, py, pz] = face.corners[i].pos;
        positions.push((vx+px) * voxelSize, (vy+py) * voxelSize, (vz+pz) * voxelSize);
        normals.push(nx, ny, nz);
        const bright = AO_CURVE[ao[i]];
        colors.push(cr * bright, cg * bright, cb * bright);
      }

      // Flip quad diagonal to minimize AO interpolation artifacts
      if (ao[0] + ao[2] > ao[1] + ao[3]) {
        indices.push(vi, vi+1, vi+3, vi+1, vi+2, vi+3);
      } else {
        indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
      }
      vi += 4;
    }
  }

  if (vi === 0) return group;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    shininess: 25,
    specular: 0x222222,
  });
  group.add(new THREE.Mesh(geo, mat));

  return group;
}

/**
 * Build a THREE.Group from a voxel array [[x,y,z,color], ...]
 * Automatically subdivides for higher detail.
 */
export function buildVoxelGroup(voxels, voxelSize = VOXEL_SIZE) {
  const sub = VOXEL_SUBDIVISION;
  if (sub > 1) {
    voxels = subdivideVoxels(voxels, sub);
    voxelSize = voxelSize / sub;
  }
  return _buildGroup(voxels, voxelSize);
}

/**
 * Build a fish with separate body and tail groups for fin animation.
 * Filters in original grid space first, then subdivides each part.
 */
export function buildFishGroup(voxels, tailCutoff, voxelSize = VOXEL_SIZE) {
  const bodyVoxels = voxels.filter(([x]) => x > tailCutoff);
  const tailVoxels = voxels.filter(([x]) => x <= tailCutoff);

  const sub = VOXEL_SUBDIVISION;
  const effSize = sub > 1 ? voxelSize / sub : voxelSize;

  const group = new THREE.Group();

  if (bodyVoxels.length) {
    const data = sub > 1 ? subdivideVoxels(bodyVoxels, sub) : bodyVoxels;
    group.add(_buildGroup(data, effSize));
  }

  const gridPivotX = tailCutoff + 0.5;
  const tailPivot = new THREE.Group();
  tailPivot.position.x = gridPivotX * voxelSize;

  if (tailVoxels.length) {
    const adjusted = tailVoxels.map(([x, y, z, c]) => [x - gridPivotX, y, z, c]);
    const data = sub > 1 ? subdivideVoxels(adjusted, sub) : adjusted;
    tailPivot.add(_buildGroup(data, effSize));
  }
  group.add(tailPivot);

  return { group, tailPivot };
}

/**
 * Build a swaying decoration (seaweed) with nested height segments for bending.
 */
export function buildSwayGroup(voxels, numSegs = 4, baseVoxelSize = VOXEL_SIZE) {
  const sub = VOXEL_SUBDIVISION;
  if (sub > 1) {
    voxels = subdivideVoxels(voxels, sub);
  }
  const voxelSize = sub > 1 ? baseVoxelSize / sub : baseVoxelSize;

  const maxY = Math.max(...voxels.map(v => v[1]));
  const totalH = maxY + 1;
  const segH = totalH / numSegs;

  const root = new THREE.Group();
  const segments = [];
  let parent = root;
  let prevYMin = 0;

  for (let i = 0; i < numSegs; i++) {
    const yMin = i === 0 ? 0 : Math.round(i * segH);
    const yMax = i === numSegs - 1 ? totalH : Math.round((i + 1) * segH);

    const segVoxels = voxels.filter(([, y]) => y >= yMin && y < yMax);
    if (!segVoxels.length) continue;

    const pivot = new THREE.Group();
    pivot.position.y = (yMin - prevYMin) * voxelSize;

    const adjusted = segVoxels.map(([x, y, z, c]) => [x, y - yMin, z, c]);
    pivot.add(_buildGroup(adjusted, voxelSize));

    parent.add(pivot);
    segments.push(pivot);
    parent = pivot;
    prevYMin = yMin;
  }

  return { group: root, segments };
}

/**
 * Build a treasure chest with a separate lid pivot for open/close animation.
 * Splits voxels at lidYThreshold; lid rotates around hinge at (hingeY, hingeZ).
 */
export function buildChestGroup(voxels, lidYThreshold, hingeY, hingeZ, voxelSize = VOXEL_SIZE) {
  const sub = VOXEL_SUBDIVISION;
  if (sub > 1) {
    voxels = subdivideVoxels(voxels, sub);
    voxelSize /= sub;
    lidYThreshold *= sub;
    hingeY *= sub;
    hingeZ *= sub;
  }

  const bodyVoxels = voxels.filter(([, y]) => y < lidYThreshold);
  const lidVoxels = voxels.filter(([, y]) => y >= lidYThreshold);

  const group = new THREE.Group();
  group.add(_buildGroup(bodyVoxels, voxelSize));

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY * voxelSize, hingeZ * voxelSize);

  const adjustedLid = lidVoxels.map(([x, y, z, c]) => [x, y - hingeY, z - hingeZ, c]);
  lidPivot.add(_buildGroup(adjustedLid, voxelSize));

  group.add(lidPivot);

  return { group, lidPivot };
}
