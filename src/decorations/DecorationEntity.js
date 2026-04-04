import * as THREE from 'three';
import { buildVoxelGroup, buildSwayGroup, buildChestGroup } from '../utils/VoxelGeometry.js';
import { upscaleAndSmooth } from '../utils/VoxelUpscale.js';
import { TANK_HEIGHT, DECO_SCALE, SAND_HEIGHT } from '../constants.js';

const DECO_UPSCALE = 2;

// Chest animation constants
const CHEST_CLOSED_TIME = 10;
const CHEST_OPEN_TIME = 2.5;
const CHEST_OPEN_SPEED = 1.2;
const CHEST_CLOSE_SPEED = 1.8;
const CHEST_CLOSED_ANGLE = 0;
const CHEST_OPEN_ANGLE = 1.8;
const CHEST_LID_Y = 6 * DECO_UPSCALE;
const CHEST_HINGE_Y = 6 * DECO_UPSCALE;
const CHEST_HINGE_Z = 8 * DECO_UPSCALE; // back edge of lid

export class DecorationEntity {
  constructor(type, position, rotY = 0) {
    this.type = type;
    const SWAY_TYPES = new Set(['seaweed', 'kelp', 'grass', 'ludwigia', 'fern']);
    this.isAnimated = SWAY_TYPES.has(type.key);
    this.isChest = type.key === 'treasure_chest';
    this._segments = [];
    this._swayPhase = position.x * 0.7 + position.z * 0.3;

    const voxels = upscaleAndSmooth(type.voxels, DECO_UPSCALE);
    const voxelSize = 0.5;

    let content;
    if (this.isAnimated) {
      const result = buildSwayGroup(voxels, 4, voxelSize);
      content = result.group;
      this._segments = result.segments;
    } else if (this.isChest) {
      const result = buildChestGroup(
        voxels, CHEST_LID_Y, CHEST_HINGE_Y, CHEST_HINGE_Z, voxelSize
      );
      content = result.group;
      this._lidPivot = result.lidPivot;
      this._chestState = 0; // 0=closed, 1=opening, 2=open, 3=closing
      this._chestTimer = 3 + Math.random() * 5;
      this._lidAngle = 0;
      result.lidPivot.rotation.x = 0;
    } else {
      content = buildVoxelGroup(voxels, voxelSize);
    }

    // Center content at group origin so rotation pivots correctly
    const box = new THREE.Box3().setFromObject(content);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    content.position.set(-cx, 0, -cz);
    this._content = content;

    this.group = new THREE.Group();
    this.group.add(content);
    this.group.scale.setScalar(DECO_SCALE);

    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.group.position.set(
      position.x + cx * DECO_SCALE,
      -TANK_HEIGHT / 2 + SAND_HEIGHT,
      position.z + cz * DECO_SCALE
    );
    this.group.rotation.y = rotY;

    if (this.isChest) this._initBubbles();
  }

  /* ── Bubble pool for chest ── */

  _initBubbles() {
    this._bubbles = [];
    const sizes = [0.6, 0.8, 1.0, 1.2, 1.4, 0.7, 0.9, 1.1];
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.5,
      shininess: 80,
    });

    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(sizes[i], sizes[i], sizes[i]);
      const mesh = new THREE.Mesh(geo, baseMat.clone());
      mesh.visible = false;
      this._content.add(mesh);
      this._bubbles.push({
        mesh, geo, active: false, vy: 0, vx: 0, vz: 0,
        life: 0, maxLife: 0, baseScale: 1,
      });
    }
  }

  _spawnBubble() {
    for (const b of this._bubbles) {
      if (b.active) continue;
      b.active = true;
      b.mesh.visible = true;
      // Spawn near the top of the chest body interior
      b.mesh.position.set(
        6 + (Math.random() - 0.5) * 5,
        5 + Math.random() * 1.5,
        1 + Math.random() * 5
      );
      b.baseScale = 0.6 + Math.random() * 0.8;
      b.mesh.scale.setScalar(b.baseScale);
      b.vy = 8 + Math.random() * 4;
      b.vx = (Math.random() - 0.5) * 1.5;
      b.vz = (Math.random() - 0.5) * 1.5;
      b.life = 0;
      b.maxLife = 2 + Math.random() * 1.5;
      b.mesh.material.opacity = 0.5;
      return;
    }
  }

  _updateBubbles(delta) {
    for (const b of this._bubbles) {
      if (!b.active) continue;
      b.life += delta;
      if (b.life >= b.maxLife) {
        b.active = false;
        b.mesh.visible = false;
        continue;
      }
      b.mesh.position.x += b.vx * delta + Math.sin(b.life * 6) * 0.03;
      b.mesh.position.y += b.vy * delta;
      b.mesh.position.z += b.vz * delta;
      // Grow slightly as they rise, fade out near end
      const t = b.life / b.maxLife;
      const grow = 1 + t * 0.4;
      const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      b.mesh.scale.setScalar(b.baseScale * grow * fade);
      b.mesh.material.opacity = 0.5 * fade;
    }
  }

  /* ── Chest lid animation ── */

  _updateChest(delta) {
    switch (this._chestState) {
      case 0: // closed — wait
        this._chestTimer -= delta;
        if (this._chestTimer <= 0) {
          this._chestState = 1;
          this._spawnBubble();
          this._spawnBubble();
        }
        break;

      case 1: // opening
        this._lidAngle += CHEST_OPEN_SPEED * delta;
        if (this._lidAngle >= CHEST_OPEN_ANGLE) {
          this._lidAngle = CHEST_OPEN_ANGLE;
          this._chestState = 2;
          this._chestTimer = CHEST_OPEN_TIME;
        }
        if (Math.random() < delta * 4) this._spawnBubble();
        this._lidPivot.rotation.x = this._lidAngle;
        break;

      case 2: // open — hold
        this._chestTimer -= delta;
        if (this._chestTimer <= 0) this._chestState = 3;
        break;

      case 3: // closing
        this._lidAngle -= CHEST_CLOSE_SPEED * delta;
        if (this._lidAngle <= CHEST_CLOSED_ANGLE) {
          this._lidAngle = CHEST_CLOSED_ANGLE;
          this._chestState = 0;
          this._chestTimer = CHEST_CLOSED_TIME + Math.random() * 4;
        }
        this._lidPivot.rotation.x = this._lidAngle;
        break;
    }
  }

  /* ── Per-frame update ── */

  update(delta, time) {
    if (this.isAnimated && this._segments.length) {
      for (let i = 0; i < this._segments.length; i++) {
        const influence = (i + 1) / this._segments.length * 0.15;
        this._segments[i].rotation.z =
          Math.sin(time * 0.5 + this._swayPhase + i * 0.5) * influence;
      }
    }

    if (this.isChest) {
      this._updateChest(delta);
      this._updateBubbles(delta);
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
