import { eventBus } from './EventBus.js';

let _nextId = 1;

export class GameState {
  constructor() {
    this.mode = 'sandbox';
    this.fish = new Map();        // id → { id, speciesKey }
    this.decorations = new Map(); // id → { id, typeKey, position, rotY }
  }

  addFish(speciesKey) {
    const id = _nextId++;
    const data = { id, speciesKey };
    this.fish.set(id, data);
    eventBus.emit('fish:added', data);
    return id;
  }

  removeFish(id) {
    if (!this.fish.has(id)) return;
    const data = this.fish.get(id);
    this.fish.delete(id);
    eventBus.emit('fish:removed', data);
  }

  clearAllFish() {
    for (const id of [...this.fish.keys()]) this.removeFish(id);
  }

  addDecoration(typeKey, position, rotY = 0) {
    const id = _nextId++;
    const data = { id, typeKey, position: { ...position }, rotY };
    this.decorations.set(id, data);
    eventBus.emit('deco:added', data);
    return id;
  }

  removeDecoration(id) {
    if (!this.decorations.has(id)) return;
    const data = this.decorations.get(id);
    this.decorations.delete(id);
    eventBus.emit('deco:removed', data);
  }

  clearAllDecorations() {
    for (const id of [...this.decorations.keys()]) this.removeDecoration(id);
  }

  setMode(mode) {
    this.mode = mode;
    eventBus.emit('mode:changed', mode);
  }
}
