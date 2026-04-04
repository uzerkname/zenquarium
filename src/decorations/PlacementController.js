import * as THREE from 'three';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';
import { upscaleAndSmooth } from '../utils/VoxelUpscale.js';
import { DECO_MAP } from './types/index.js';
import { TANK_HEIGHT, TANK_WIDTH, TANK_DEPTH, GRID_SIZE, DECO_SCALE, SAND_HEIGHT } from '../constants.js';

const DECO_UPSCALE = 2;
const _proj = new THREE.Vector3();
const DEG = Math.PI / 180;

// Arrow voxel constants
const ARROW_VOXEL  = 0.7;
const ARROW_HEIGHT = 0.18;
const ARROW_COLOR  = 0x64b5f6;
const ARROW_OPACITY = 0.5;
const ARC_STEPS    = 20;

// States: 'idle' → 'positioning' → 'adjusting' → 'idle'
export class PlacementController {
  constructor(renderer, sandMesh, decoSystem, gameState) {
    this.renderer    = renderer;
    this.sandMesh    = sandMesh;
    this.decoSystem  = decoSystem;
    this.gameState   = gameState;

    this._tankGroup  = sandMesh.parent;

    this._state    = 'idle';
    this._typeKey  = null;
    this._rotY     = 0;
    this._ghost    = null;
    this._mouse    = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._snapped  = null;
    this._canPlace = false;
    this._mouseDown = new THREE.Vector2();
    this._localPt   = new THREE.Vector3();

    // 3D arrow groups
    this._arrowsGroup = null;
    this._arrowCCW    = null;
    this._arrowCW     = null;

    // UI elements
    this._btnConfirm = document.getElementById('confirm-place');
    this._hint       = document.getElementById('placement-hint');

    this._btnConfirm.addEventListener('pointerdown', e => e.stopPropagation());
    this._btnConfirm.addEventListener('pointerup', e => { e.stopPropagation(); this._confirm(); });

    window.addEventListener('mousemove', e => this._onMouseMove(e));
    window.addEventListener('pointerdown', e => this._mouseDown.set(e.clientX, e.clientY));
    window.addEventListener('pointerup', e => this._onClick(e));
    window.addEventListener('contextmenu', e => this._onRightClick(e));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') this.cancel(); });
  }

  beginPlacement(typeKey) {
    this.cancel();
    this._typeKey = typeKey;
    this._rotY    = 0;
    this._state   = 'positioning';

    const type = DECO_MAP[typeKey];
    const content = buildVoxelGroup(upscaleAndSmooth(type.voxels, DECO_UPSCALE), 0.5);

    // Center mesh at group origin so rotation pivots around the center
    const mesh = content.children[0];
    if (mesh?.geometry) {
      mesh.geometry.computeBoundingBox();
      const b = mesh.geometry.boundingBox;
      this._pivotX = (b.min.x + b.max.x) / 2;
      this._pivotZ = (b.min.z + b.max.z) / 2;
      mesh.position.set(-this._pivotX, 0, -this._pivotZ);
    } else {
      this._pivotX = 0;
      this._pivotZ = 0;
    }

    this._ghost = content;
    this._ghost.scale.setScalar(DECO_SCALE);

    this._ghost.traverse(obj => {
      if (obj.isMesh) {
        obj.material = obj.material.clone();
        obj.material.transparent = true;
        obj.material.opacity = 0.55;
      }
    });
    this._tankGroup.add(this._ghost);
    this._hint.textContent = 'Click to place \u00B7 Esc to cancel';
    this._hint.classList.add('visible');
  }

  cancel() {
    if (this._state === 'idle') return;
    this._state = 'idle';
    if (this._ghost) {
      this._tankGroup.remove(this._ghost);
      this._ghost.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
      this._ghost = null;
    }
    this._hint.classList.remove('visible');
    this._hideAdjustUI();
  }

  _applyGhostTransform() {
    this._ghost.position.set(
      this._snapped.x * GRID_SIZE + this._pivotX * DECO_SCALE,
      -TANK_HEIGHT / 2 + SAND_HEIGHT,
      this._snapped.z * GRID_SIZE + this._pivotZ * DECO_SCALE
    );
    this._ghost.rotation.y = this._rotY;
  }

  _rotate(dir) {
    if (this._state !== 'adjusting') return;
    this._rotY = (this._rotY + dir * Math.PI / 2 + Math.PI * 4) % (Math.PI * 2);
    this._applyGhostTransform();
  }

  _confirm() {
    if (this._state !== 'adjusting' || !this._snapped) return;
    const pos = { x: this._snapped.x * GRID_SIZE, z: this._snapped.z * GRID_SIZE };
    this.gameState.addDecoration(this._typeKey, pos, this._rotY);

    this._state = 'idle';
    this._tankGroup.remove(this._ghost);
    this._ghost.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
    this._ghost = null;
    this._hint.classList.remove('visible');
    this._hideAdjustUI();
    this._snapped = null;
  }

  // ── 3D voxel arrows ──────────────────────────────────

  _createArrows(type) {
    const hw = type.footprint.w * 0.5 * DECO_SCALE;
    const hd = type.footprint.d * 0.5 * DECO_SCALE;
    const radius = Math.max(hw, hd) + 2.5;

    const geo = new THREE.BoxGeometry(ARROW_VOXEL, ARROW_HEIGHT, ARROW_VOXEL);
    const mat = new THREE.MeshStandardMaterial({
      color: ARROW_COLOR,
      emissive: ARROW_COLOR,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: ARROW_OPACITY,
      depthWrite: false,
    });

    this._arrowsGroup = new THREE.Group();
    this._arrowCCW = this._buildArc(geo, mat, radius, 110, 250, 1);   // left side, CCW
    this._arrowCW  = this._buildArc(geo, mat, radius, 70, -70, -1);   // right side, CW
    this._arrowsGroup.add(this._arrowCCW);
    this._arrowsGroup.add(this._arrowCW);

    // Position at ghost XZ, just above sand
    this._arrowsGroup.position.set(
      this._ghost.position.x,
      this._ghost.position.y + 0.05,
      this._ghost.position.z
    );
    this._tankGroup.add(this._arrowsGroup);
    this._arrowGeo = geo;
    this._arrowMat = mat;
  }

  _buildArc(geo, mat, radius, startDeg, endDeg, dir) {
    const group = new THREE.Group();
    const sweepDeg = Math.abs(endDeg - startDeg);

    // Arc voxels
    for (let i = 0; i <= ARC_STEPS; i++) {
      const angleDeg = startDeg + dir * sweepDeg * (i / ARC_STEPS);
      const angle = angleDeg * DEG;
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      group.add(cube);
    }

    // Arrowhead barbs
    const endAngleDeg = startDeg + dir * sweepDeg;
    const barbBackDeg = 14;
    const barbSpread  = ARROW_VOXEL * 1.8;
    const bAngle = (endAngleDeg - dir * barbBackDeg) * DEG;

    const b1 = new THREE.Mesh(geo, mat);
    b1.position.set(Math.cos(bAngle) * (radius - barbSpread), 0, Math.sin(bAngle) * (radius - barbSpread));
    group.add(b1);

    const b2 = new THREE.Mesh(geo, mat);
    b2.position.set(Math.cos(bAngle) * (radius + barbSpread), 0, Math.sin(bAngle) * (radius + barbSpread));
    group.add(b2);

    return group;
  }

  _destroyArrows() {
    if (!this._arrowsGroup) return;
    this._tankGroup.remove(this._arrowsGroup);
    if (this._arrowGeo) { this._arrowGeo.dispose(); this._arrowGeo = null; }
    if (this._arrowMat) { this._arrowMat.dispose(); this._arrowMat = null; }
    this._arrowsGroup = null;
    this._arrowCCW = null;
    this._arrowCW = null;
  }

  // ── UI show/hide ──────────────────────────────────────

  _showAdjustUI(type) {
    this._createArrows(type);
    this._positionConfirm();
    this._btnConfirm.classList.add('visible');
    this._hint.textContent = 'Rotate and confirm \u00B7 Esc to cancel';
  }

  _hideAdjustUI() {
    this._destroyArrows();
    this._btnConfirm.classList.remove('visible');
  }

  _positionConfirm() {
    const cam = this.renderer.camera;
    const w = window.innerWidth;
    const h = window.innerHeight;
    _proj.set(this._ghost.position.x, this._ghost.position.y, this._ghost.position.z);
    this._tankGroup.localToWorld(_proj);
    _proj.project(cam);
    this._btnConfirm.style.left = ((_proj.x * 0.5 + 0.5) * w) + 'px';
    this._btnConfirm.style.top  = ((-_proj.y * 0.5 + 0.5) * h + 30) + 'px';
  }

  // ── Input handling ────────────────────────────────────

  _onMouseMove(e) {
    if (this._state !== 'positioning') return;
    this._mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this._dirty = true;
  }

  update() {
    if (this._state === 'adjusting') {
      this._positionConfirm();
      return;
    }
    if (this._state !== 'positioning' || !this._dirty) return;
    this._dirty = false;

    this._raycaster.setFromCamera(this._mouse, this.renderer.camera);
    const hits = this._raycaster.intersectObject(this.sandMesh, false);
    if (!hits.length) return;

    this._localPt.copy(hits[0].point);
    this._tankGroup.worldToLocal(this._localPt);

    const gx = Math.round(this._localPt.x / GRID_SIZE);
    const gz = Math.round(this._localPt.z / GRID_SIZE);
    this._snapped = { x: gx, z: gz };

    const type = DECO_MAP[this._typeKey];
    this._canPlace = this.decoSystem.isFootprintFree(gx, gz, type);

    this._applyGhostTransform();

    this._ghost.traverse(obj => {
      if (obj.isMesh) {
        obj.material.color.set(this._canPlace ? 0xffffff : 0xff4444);
        obj.material.opacity = this._canPlace ? 0.55 : 0.4;
      }
    });
  }

  _onClick(e) {
    if (e.button !== 0) return;
    const dx = e.clientX - this._mouseDown.x;
    const dy = e.clientY - this._mouseDown.y;
    if (dx * dx + dy * dy > 25) return;

    if (this._state === 'adjusting') {
      this._onArrowClick(e);
      return;
    }
    if (this._state !== 'positioning' || !this._snapped || !this._canPlace) return;

    e.preventDefault();

    this._state = 'adjusting';
    this._ghost.traverse(obj => {
      if (obj.isMesh) {
        obj.material.color.set(0xffffff);
        obj.material.opacity = 0.7;
      }
    });
    this._showAdjustUI(DECO_MAP[this._typeKey]);
  }

  _onArrowClick(e) {
    this._mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this.renderer.camera);

    if (this._raycaster.intersectObjects(this._arrowCCW.children).length) {
      this._rotate(-1);
      return;
    }
    if (this._raycaster.intersectObjects(this._arrowCW.children).length) {
      this._rotate(1);
    }
  }

  _onRightClick(e) {
    if (this._state === 'idle') return;
    e.preventDefault();
    if (this._state === 'adjusting') {
      this._rotate(1);
    } else {
      this._rotY = (this._rotY + Math.PI / 2) % (Math.PI * 2);
    }
  }
}
