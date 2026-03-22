import { eventBus } from '../core/EventBus.js';
import { DecorationEntity } from './DecorationEntity.js';
import { DECO_MAP } from './types/index.js';

export class DecorationSystem {
  constructor(scene) {
    this.scene = scene;
    this._entities = new Map(); // id → DecorationEntity
    this._occupied = new Set(); // "x,z" grid cell strings

    eventBus.on('deco:added',   data => this._onAdded(data));
    eventBus.on('deco:removed', data => this._onRemoved(data));
  }

  _onAdded({ id, typeKey, position, rotY }) {
    const type = DECO_MAP[typeKey];
    if (!type) return;
    const entity = new DecorationEntity(type, position, rotY);
    this.scene.add(entity.group);
    this._entities.set(id, entity);
    this._markOccupied(position, type, true);
  }

  _onRemoved({ id, typeKey, position }) {
    const entity = this._entities.get(id);
    if (!entity) return;
    const type = DECO_MAP[typeKey];
    this.scene.remove(entity.group);
    entity.dispose();
    this._entities.delete(id);
    if (type) this._markOccupied(position, type, false);
  }

  _markOccupied(position, type, occupied) {
    const gx = Math.round(position.x);
    const gz = Math.round(position.z);
    for (let dx = 0; dx < type.footprint.w; dx++) {
      for (let dz = 0; dz < type.footprint.d; dz++) {
        const key = `${gx + dx},${gz + dz}`;
        if (occupied) this._occupied.add(key);
        else          this._occupied.delete(key);
      }
    }
  }

  isCellOccupied(gx, gz) {
    return this._occupied.has(`${gx},${gz}`);
  }

  isFootprintFree(gx, gz, type) {
    for (let dx = 0; dx < type.footprint.w; dx++) {
      for (let dz = 0; dz < type.footprint.d; dz++) {
        if (this._occupied.has(`${gx + dx},${gz + dz}`)) return false;
      }
    }
    return true;
  }

  update(delta, time) {
    for (const entity of this._entities.values()) {
      entity.update(delta, time);
    }
  }
}
