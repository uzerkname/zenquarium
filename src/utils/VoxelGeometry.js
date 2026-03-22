import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VOXEL_SIZE, VOXEL_SUBDIVISION } from '../constants.js';

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
 * Core builder — takes voxels and builds a merged THREE.Group (no subdivision).
 */
function _buildGroup(voxels, voxelSize) {
  const group = new THREE.Group();

  const byColor = new Map();
  for (const [x, y, z, color] of voxels) {
    if (!byColor.has(color)) byColor.set(color, []);
    byColor.get(color).push([x, y, z]);
  }

  const unitBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

  for (const [color, positions] of byColor) {
    const geos = positions.map(([x, y, z]) => {
      const g = unitBox.clone();
      g.translate(x * voxelSize, y * voxelSize, z * voxelSize);
      return g;
    });

    const merged = geos.length > 1
      ? mergeGeometries(geos)
      : geos[0];

    const mat = new THREE.MeshPhongMaterial({ color, shininess: 25, specular: 0x222222 });
    group.add(new THREE.Mesh(merged, mat));
  }

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
  // Filter in original grid coordinates before subdivision
  const bodyVoxels = voxels.filter(([x]) => x > tailCutoff);
  const tailVoxels = voxels.filter(([x]) => x <= tailCutoff);

  const sub = VOXEL_SUBDIVISION;
  const effSize = sub > 1 ? voxelSize / sub : voxelSize;

  const group = new THREE.Group();

  // Body
  if (bodyVoxels.length) {
    const data = sub > 1 ? subdivideVoxels(bodyVoxels, sub) : bodyVoxels;
    group.add(_buildGroup(data, effSize));
  }

  // Tail pivot — position in world coordinates (unchanged by subdivision)
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
export function buildSwayGroup(voxels, numSegs = 4) {
  const sub = VOXEL_SUBDIVISION;
  if (sub > 1) {
    voxels = subdivideVoxels(voxels, sub);
  }
  const voxelSize = sub > 1 ? VOXEL_SIZE / sub : VOXEL_SIZE;

  const maxY = Math.max(...voxels.map(v => v[1]));
  const segH = (maxY + 1) / numSegs;

  const root = new THREE.Group();
  const segments = [];
  let parent = root;

  for (let i = 0; i < numSegs; i++) {
    const yMin = Math.floor(i * segH);
    const yMax = Math.floor((i + 1) * segH);

    const segVoxels = voxels.filter(([, y]) => y >= yMin && y < yMax);
    if (!segVoxels.length) continue;

    const pivot = new THREE.Group();
    pivot.position.y = (i === 0) ? 0 : segH * voxelSize;

    const adjusted = segVoxels.map(([x, y, z, c]) => [x, y - yMin, z, c]);
    const mesh = _buildGroup(adjusted, voxelSize);
    pivot.add(mesh);

    parent.add(pivot);
    segments.push(pivot);
    parent = pivot;
  }

  return { group: root, segments };
}
