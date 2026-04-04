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
  constructor(species, decoSystem) {
    this.species = species;
    this._decoSystem = decoSystem;

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
    const t = this._safeTarget();
    this.group.position.set(t.x, t.y, t.z);

    // Heading-based movement (fish always swims forward)
    this.heading = Math.random() * Math.PI * 2;     // yaw in radians
    this.pitch   = 0;
    this.currentSpeed = species.speed * 0.5;
    this.vel = new THREE.Vector3();

    this.target  = this._safeTarget();
    this.idleTimer = 0;
    this._stuckTimer = 0;
    this.state = 'wander'; // 'wander' | 'idle'
    this._phase = Math.random() * Math.PI * 2;
  }

  /** Pick a random target that isn't inside a decoration cluster */
  _safeTarget() {
    for (let i = 0; i < 8; i++) {
      const t = randomTarget();
      if (!this._decoSystem?.isNearDecoration(t.x, t.z, 2)) return t;
    }
    return randomTarget(); // fallback if all attempts fail
  }

  update(delta, time) {
    const pos = this.group.position;
    const sp  = this.species;

    let desiredYaw   = this.heading;
    let desiredPitch = 0;
    let desiredSpeed = sp.speed;

    if (this.state === 'idle') {
      this.idleTimer -= delta;
      desiredSpeed = 0;
      if (this.idleTimer <= 0) {
        this.state = 'wander';
        this.target = this._safeTarget();
      }
    } else {
      this._stuckTimer += delta;

      if (reached(pos, this.target)) {
        this._stuckTimer = 0;
        if (Math.random() < 0.2) {
          this.state = 'idle';
          this.idleTimer = 0.4 + Math.random() * 1.2;
        } else {
          this.target = this._safeTarget();
        }
      } else if (this._stuckTimer > 4) {
        // Stuck too long — pick a new target
        this._stuckTimer = 0;
        this.target = this._safeTarget();
      }

      const dx = this.target.x - pos.x;
      const dy = this.target.y - pos.y;
      const dz = this.target.z - pos.z;

      const wall = wallRepulsion(pos);

      // Decoration repulsion (only near the sand floor)
      let decoFx = 0, decoFz = 0;
      const sandY = -25; // approx sand surface
      if (this._decoSystem && pos.y < sandY + 12) {
        const deco = this._decoSystem.decoRepulsion(pos.x, pos.z, 4);
        const yFade = Math.max(0, 1 - (pos.y - sandY) / 12);
        decoFx = deco.x * 3 * yFade;
        decoFz = deco.z * 3 * yFade;
      }

      const wx = dx + wall.x * 5 + decoFx;
      const wz = dz + wall.z * 5 + decoFz;
      const wy = dy * 0.35 + wall.y * 5;

      desiredYaw = Math.atan2(wz, wx);

      const hDist = Math.sqrt(wx * wx + wz * wz);
      const rawPitch = Math.atan2(wy, Math.max(hDist, 0.001));
      desiredPitch = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, rawPitch));
    }

    // --- Gradually turn heading toward desired yaw (max turn rate) ---
    let yawDiff = desiredYaw - this.heading;
    if (yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
    if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    const maxTurn = sp.turnSpeed * 2 * delta;
    this.heading += Math.sign(yawDiff) * Math.min(Math.abs(yawDiff), maxTurn);
    if (this.heading >  Math.PI) this.heading -= Math.PI * 2;
    if (this.heading < -Math.PI) this.heading += Math.PI * 2;

    // Smooth pitch
    this.pitch += (desiredPitch - this.pitch) * Math.min(1, sp.turnSpeed * delta * 2);

    // --- Smooth speed, slow down during sharp turns ---
    const turnSharpness = Math.abs(yawDiff) / Math.PI;
    const turnBrake = 1 - turnSharpness * 0.4;
    this.currentSpeed += (desiredSpeed * turnBrake - this.currentSpeed) * Math.min(1, 3 * delta);

    // --- Velocity always follows heading (never backwards) ---
    const cp = Math.cos(this.pitch);
    this.vel.x = Math.cos(this.heading) * cp * this.currentSpeed;
    this.vel.z = Math.sin(this.heading) * cp * this.currentSpeed;
    this.vel.y = Math.sin(this.pitch)       * this.currentSpeed;

    // Move
    pos.x += this.vel.x * delta;
    pos.y += this.vel.y * delta;
    pos.z += this.vel.z * delta;
    clampToBounds(pos);

    // --- Orientation follows heading directly ---
    const speed = this.currentSpeed;
    if (speed > 0.05) {
      _yawQ.setFromAxisAngle(_up, this.heading);
      _pitchQ.setFromAxisAngle(_zAxis, this.pitch);
      _quat.copy(_yawQ).multiply(_pitchQ);
      this.group.quaternion.slerp(_quat, Math.min(1, 8 * delta));
    }

    // --- Tail fin animation ---
    if (this.tailPivot) {
      const swimFactor = Math.min(speed / sp.speed, 1.5);
      const freq = 2 + swimFactor * 5.3;
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
