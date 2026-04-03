import * as THREE from 'three';
import { buildVoxelGroup, buildFishGroup } from '../utils/VoxelGeometry.js';
import { upscaleAndSmooth } from '../utils/VoxelUpscale.js';
import { randomTarget, reached, wallRepulsion, clampToBounds } from './FishAI.js';

const _up    = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _quat  = new THREE.Quaternion();
const _yawQ  = new THREE.Quaternion();
const _pitchQ = new THREE.Quaternion();

const FISH_UPSCALE = 2;

export class FishEntity {
  constructor(species) {
    this.species = species;

    const voxels = upscaleAndSmooth(species.voxels, FISH_UPSCALE);
    const voxelSize = species.voxelSize;

    // Build body + tail as separate groups for fin animation
    if (species.tailCutoff !== undefined) {
      const { group, tailPivot } = buildFishGroup(voxels, species.tailCutoff * FISH_UPSCALE, voxelSize);
      this.group = group;
      this.tailPivot = tailPivot;
    } else {
      this.group = buildVoxelGroup(voxels, voxelSize);
      this.tailPivot = null;
    }

    this.group.scale.setScalar(species.scale);

    // Enable shadow casting for all fish meshes
    this.group.traverse(child => {
      if (child.isMesh) child.castShadow = true;
    });

    // Start at a random position
    const t = randomTarget();
    this.group.position.set(t.x, t.y, t.z);

    // Velocity
    this.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.5
    );

    this.target  = randomTarget();
    this.idleTimer = 0;
    this.state = 'wander'; // 'wander' | 'idle'
    this._phase = Math.random() * Math.PI * 2;
  }

  update(delta, time) {
    const pos = this.group.position;
    const sp  = this.species;

    // Idle state — pause briefly
    if (this.state === 'idle') {
      this.idleTimer -= delta;
      this.vel.multiplyScalar(0.92);
      if (this.idleTimer <= 0) {
        this.state = 'wander';
        this.target = randomTarget();
      }
    } else {
      // Check if reached target
      if (reached(pos, this.target)) {
        if (Math.random() < 0.2) {
          this.state = 'idle';
          this.idleTimer = 0.4 + Math.random() * 1.2;
        } else {
          this.target = randomTarget();
        }
      }

      // Desired direction toward target
      const dx = this.target.x - pos.x;
      const dy = this.target.y - pos.y;
      const dz = this.target.z - pos.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      // Wall repulsion
      const wall = wallRepulsion(pos);

      const desiredX = dx / len + wall.x * 2.5;
      // Dampen vertical so fish mostly swim horizontally — more natural
      const desiredY = (dy / len) * 0.35 + wall.y * 2.5;
      const desiredZ = dz / len + wall.z * 2.5;

      // Smoothly steer velocity
      const steer = sp.turnSpeed * delta;
      this.vel.x += (desiredX * sp.speed - this.vel.x) * steer;
      this.vel.y += (desiredY * sp.speed - this.vel.y) * steer;
      this.vel.z += (desiredZ * sp.speed - this.vel.z) * steer;

      // Limit speed
      const speed = this.vel.length();
      if (speed > sp.speed * 1.5) this.vel.multiplyScalar(sp.speed * 1.5 / speed);
    }

    // Move
    pos.x += this.vel.x * delta;
    pos.y += this.vel.y * delta;
    pos.z += this.vel.z * delta;
    clampToBounds(pos);

    // --- Orientation: yaw + clamped pitch, never roll ---
    const hx = this.vel.x, hy = this.vel.y, hz = this.vel.z;
    const hSpeed = Math.sqrt(hx * hx + hz * hz);
    const speed  = Math.sqrt(hx * hx + hy * hy + hz * hz);

    if (speed > 0.05) {
      // Yaw: angle of horizontal velocity from +X axis (fish nose is at +X)
      const yaw = Math.atan2(hz, hx);

      // Pitch: elevation angle, hard-clamped to ±30° — prevents any flipping
      const rawPitch = Math.atan2(hy, Math.max(hSpeed, 0.001));
      const pitch = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, rawPitch));

      // Build quaternion: apply pitchQ first (tilts nose), then yawQ (faces direction)
      _yawQ.setFromAxisAngle(_up,    yaw);
      _pitchQ.setFromAxisAngle(_zAxis, pitch);
      _quat.copy(_yawQ).multiply(_pitchQ);
      this.group.quaternion.slerp(_quat, sp.turnSpeed * delta * 3);
    }

    // --- Tail fin animation ---
    if (this.tailPivot) {
      const swimFactor = Math.min(speed / sp.speed, 1.5);
      const freq = 2 + swimFactor * 5.3;  // idle ~2 Hz, max ~10
      const amp  = 0.08 + swimFactor * 0.3;
      this.tailPivot.rotation.y = Math.sin(time * freq + this._phase) * amp;
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
