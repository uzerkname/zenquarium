import { eventBus } from '../core/EventBus.js';
import { FishEntity } from './FishEntity.js';
import { SPECIES_MAP } from './species/index.js';

export class FishSystem {
  constructor(scene) {
    this.scene = scene;
    this._entities = new Map(); // id → FishEntity

    eventBus.on('fish:added',   data => this._onAdded(data));
    eventBus.on('fish:removed', data => this._onRemoved(data));
  }

  _onAdded({ id, speciesKey }) {
    const species = SPECIES_MAP[speciesKey];
    if (!species) return;
    const entity = new FishEntity(species);
    this.scene.add(entity.group);
    this._entities.set(id, entity);
  }

  _onRemoved({ id }) {
    const entity = this._entities.get(id);
    if (!entity) return;
    this.scene.remove(entity.group);
    entity.dispose();
    this._entities.delete(id);
  }

  update(delta, time) {
    for (const entity of this._entities.values()) {
      entity.update(delta, time);
    }
  }

  getCount() {
    return this._entities.size;
  }
}
