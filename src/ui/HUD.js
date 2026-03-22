import { eventBus } from '../core/EventBus.js';

export class HUD {
  constructor(gameState) {
    this._fishCountEl    = document.getElementById('fish-count');
    this._modeEl         = document.getElementById('mode-indicator');
    this._fishCount      = 0;

    eventBus.on('fish:added',   () => { this._fishCount++; this._render(); });
    eventBus.on('fish:removed', () => { this._fishCount--; this._render(); });
    eventBus.on('mode:changed', mode => {
      this._modeEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    });
  }

  _render() {
    this._fishCountEl.textContent = `${this._fishCount} fish`;
  }
}
