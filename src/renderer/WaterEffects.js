import * as THREE from 'three';
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, BUBBLE_COUNT } from '../constants.js';

export class WaterEffects {
  constructor(tankGroup, rootScene) {
    this.scene = tankGroup;
    this._bubbleData = null;
    this._bubbleMesh = null;

    // Fog and background belong on the root scene, not the tankGroup
    const rs = rootScene || tankGroup;
    rs.fog = new THREE.FogExp2(0x003050, 0.00015);
    rs.background = new THREE.Color(0x1a1a28);

    this._createBubbles();
  }

  _createBubbles() {
    const positions = new Float32Array(BUBBLE_COUNT * 3);
    const speeds    = new Float32Array(BUBBLE_COUNT);
    const drifts    = new Float32Array(BUBBLE_COUNT * 2); // x, z drift per bubble

    const hw = TANK_WIDTH  / 2 - 1;
    const hd = TANK_DEPTH  / 2 - 1;
    const floor = -TANK_HEIGHT / 2 + 0.5;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * hw * 2;
      positions[i * 3 + 1] = floor + Math.random() * TANK_HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * hd * 2;
      speeds[i]  = 0.8 + Math.random() * 1.4;
      drifts[i * 2]     = (Math.random() - 0.5) * 0.3;
      drifts[i * 2 + 1] = (Math.random() - 0.5) * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.usage = THREE.DynamicDrawUsage;

    const mat = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });

    this._bubbleMesh = new THREE.Points(geo, mat);
    this.scene.add(this._bubbleMesh);
    this._bubbleData = { positions, speeds, drifts, floor };
  }

  update(delta) {
    const { positions, speeds, drifts, floor } = this._bubbleData;
    const ceiling = TANK_HEIGHT / 2 - 0.3;
    const hw = TANK_WIDTH  / 2 - 0.5;
    const hd = TANK_DEPTH  / 2 - 0.5;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      positions[i * 3 + 1] += speeds[i] * delta;
      positions[i * 3]     += drifts[i * 2]     * delta;
      positions[i * 3 + 2] += drifts[i * 2 + 1] * delta;

      // Clamp horizontal drift to tank bounds
      positions[i * 3]     = Math.max(-hw, Math.min(hw, positions[i * 3]));
      positions[i * 3 + 2] = Math.max(-hd, Math.min(hd, positions[i * 3 + 2]));

      // Reset bubble when it reaches the surface
      if (positions[i * 3 + 1] > ceiling) {
        positions[i * 3]     = (Math.random() - 0.5) * hw * 2;
        positions[i * 3 + 1] = floor;
        positions[i * 3 + 2] = (Math.random() - 0.5) * hd * 2;
      }
    }

    this._bubbleMesh.geometry.attributes.position.needsUpdate = true;
  }
}
