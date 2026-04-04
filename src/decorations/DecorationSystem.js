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

  /** Check if any cell within margin of (x,z) world coords is occupied */
  isNearDecoration(x, z, margin = 2) {
    const gx = Math.round(x);
    const gz = Math.round(z);
    for (let dx = -margin; dx <= margin; dx++) {
      for (let dz = -margin; dz <= margin; dz++) {
        if (this._occupied.has(`${gx + dx},${gz + dz}`)) return true;
      }
    }
    return false;
  }

  /** Get repulsion vector pushing away from nearby decorations */
  decoRepulsion(x, z, radius = 4) {
    let fx = 0, fz = 0;
    const gx = Math.round(x);
    const gz = Math.round(z);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (!this._occupied.has(`${gx + dx},${gz + dz}`)) continue;
        const ox = x - (gx + dx);
        const oz = z - (gz + dz);
        const dist = Math.sqrt(ox * ox + oz * oz) + 0.1;
        if (dist < radius) {
          const strength = (radius - dist) / radius;
          fx += (ox / dist) * strength;
          fz += (oz / dist) * strength;
        }
      }
    }
    return { x: fx, y: 0, z: fz };
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
