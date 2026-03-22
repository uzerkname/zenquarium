import * as THREE from 'three';
import { buildVoxelGroup, buildSwayGroup } from '../utils/VoxelGeometry.js';
import { TANK_HEIGHT, DECO_SCALE, SAND_HEIGHT } from '../constants.js';

export class DecorationEntity {
  constructor(type, position, rotY = 0) {
    this.type = type;
    this.isAnimated = type.key === 'seaweed';
    this._segments = [];
    this._swayPhase = position.x * 0.7 + position.z * 0.3;

    if (this.isAnimated) {
      const { group, segments } = buildSwayGroup(type.voxels, 4);
      this.group = group;
      this._segments = segments;
    } else {
      this.group = buildVoxelGroup(type.voxels);
    }

    this.group.scale.setScalar(DECO_SCALE);

    // Enable shadow casting and receiving for decoration meshes
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Center the decoration footprint in world space
    const ox = -(type.footprint.w - 1) / 2;
    const oz = -(type.footprint.d - 1) / 2;
    this.group.position.set(
      position.x + ox * DECO_SCALE,
      -TANK_HEIGHT / 2 + SAND_HEIGHT,
      position.z + oz * DECO_SCALE
    );
    this.group.rotation.y = rotY;
  }

  update(delta, time) {
    if (!this.isAnimated || !this._segments.length) return;

    for (let i = 0; i < this._segments.length; i++) {
      const influence = (i + 1) * 0.04;
      this._segments[i].rotation.z = Math.sin(time * 0.5 + this._swayPhase + i * 0.7) * influence;
    }
  }

  dispose() {
    this.group.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
  }
}
