import * as THREE from 'three';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';
import { upscaleAndSmooth } from '../utils/VoxelUpscale.js';
import { DECO_MAP } from './types/index.js';
import { TANK_HEIGHT, TANK_WIDTH, TANK_DEPTH, GRID_SIZE, DECO_SCALE, SAND_HEIGHT } from '../constants.js';

const DECO_UPSCALE = 2;

export class PlacementController {
  constructor(renderer, sandMesh, decoSystem, gameState) {
    this.renderer    = renderer;
    this.sandMesh    = sandMesh;
    this.decoSystem  = decoSystem;
    this.gameState   = gameState;

    // The tankGroup is the parent of sandMesh — we need it for local coord conversion
    this._tankGroup  = sandMesh.parent;

    this._active   = false;
    this._typeKey  = null;
    this._rotY     = 0;
    this._ghost    = null;
    this._mouse    = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._snapped  = null; // {x, z} grid position
    this._canPlace = false;
    this._mouseDown = new THREE.Vector2();
    this._localPt   = new THREE.Vector3();

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
    this._active  = true;

    const type = DECO_MAP[typeKey];
    this._ghost = buildVoxelGroup(upscaleAndSmooth(type.voxels, DECO_UPSCALE), 0.5);
    this._ghost.scale.setScalar(DECO_SCALE);
    this._ghost.traverse(obj => {
      if (obj.isMesh) {
        obj.material = obj.material.clone();
        obj.material.transparent = true;
        obj.material.opacity = 0.55;
      }
    });
    // Add ghost to tankGroup so it's in tank-local space
    this._tankGroup.add(this._ghost);

    document.getElementById('placement-hint').classList.add('visible');
  }

  cancel() {
    if (!this._active) return;
    this._active = false;
    if (this._ghost) {
      this._tankGroup.remove(this._ghost);
      this._ghost.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
      this._ghost = null;
    }
    document.getElementById('placement-hint').classList.remove('visible');
  }

  _onMouseMove(e) {
    if (!this._active) return;
    this._mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this._dirty = true;
  }

  update() {
    if (!this._active || !this._dirty) return;
    this._dirty = false;

    this._raycaster.setFromCamera(this._mouse, this.renderer.camera);
    const hits = this._raycaster.intersectObject(this.sandMesh, false);
    if (!hits.length) return;

    // Convert world hit point to tankGroup local coordinates
    this._localPt.copy(hits[0].point);
    this._tankGroup.worldToLocal(this._localPt);

    const gx = Math.round(this._localPt.x / GRID_SIZE);
    const gz = Math.round(this._localPt.z / GRID_SIZE);
    this._snapped = { x: gx, z: gz };

    const type = DECO_MAP[this._typeKey];
    this._canPlace = this.decoSystem.isFootprintFree(gx, gz, type);

    // Position ghost in local tank space
    const ox = -(type.footprint.w - 1) * 0.5 * DECO_SCALE;
    const oz = -(type.footprint.d - 1) * 0.5 * DECO_SCALE;
    this._ghost.position.set(
      gx * GRID_SIZE + ox,
      -TANK_HEIGHT / 2 + SAND_HEIGHT,
      gz * GRID_SIZE + oz
    );
    this._ghost.rotation.y = this._rotY;

    // Tint ghost red if can't place
    this._ghost.traverse(obj => {
      if (obj.isMesh) {
        obj.material.color.set(this._canPlace ? 0xffffff : 0xff4444);
        obj.material.opacity = this._canPlace ? 0.55 : 0.4;
      }
    });
  }

  _onClick(e) {
    if (!this._active || !this._snapped || !this._canPlace) return;
    if (e.button !== 0) return;

    // Only place if the user didn't drag (allows orbit + placement to coexist)
    const dx = e.clientX - this._mouseDown.x;
    const dy = e.clientY - this._mouseDown.y;
    if (dx * dx + dy * dy > 25) return;

    e.preventDefault();

    const type = DECO_MAP[this._typeKey];
    const pos = { x: this._snapped.x * GRID_SIZE, z: this._snapped.z * GRID_SIZE };
    this.gameState.addDecoration(this._typeKey, pos, this._rotY);
    this._snapped = null;
  }

  _onRightClick(e) {
    if (!this._active) return;
    e.preventDefault();
    this._rotY = (this._rotY + Math.PI / 2) % (Math.PI * 2);
  }
}
