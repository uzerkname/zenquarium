import { eventBus } from '../core/EventBus.js';
import { SPECIES } from '../fish/species/index.js';
import { renderSpeciesThumbnail } from './ThumbnailRenderer.js';

export class FishPanel {
  constructor(gameState, container) {
    this.gameState = gameState;
    this.container = container;
    this._inTank = Object.fromEntries(SPECIES.map(s => [s.key, []]));

    // Pre-render all thumbnails once
    this._thumbs = {};
    for (const s of SPECIES) {
      this._thumbs[s.key] = renderSpeciesThumbnail(s);
    }

    eventBus.on('fish:added',   data => { this._inTank[data.speciesKey]?.push(data.id); this._render(); });
    eventBus.on('fish:removed', data => {
      const arr = this._inTank[data.speciesKey];
      if (arr) {
        const idx = arr.indexOf(data.id);
        if (idx !== -1) arr.splice(idx, 1);
      }
      this._render();
    });

    this._render();
  }

  _render() {
    const totalFish = Object.values(this._inTank).reduce((s, a) => s + a.length, 0);
    this.container.innerHTML = `
      <div class="panel-title">Fish</div>
      <div class="card-grid">
        ${SPECIES.map(s => this._card(s)).join('')}
      </div>
      ${totalFish > 0 ? `<button class="clear-btn" data-clear-fish>Clear All Fish</button>` : ''}`;

    // Insert pre-rendered canvas thumbnails into placeholders
    for (const s of SPECIES) {
      const placeholder = this.container.querySelector(`[data-thumb="${s.key}"]`);
      if (placeholder && this._thumbs[s.key]) {
        const canvas = this._thumbs[s.key];
        canvas.style.cssText = 'width:48px;height:48px;image-rendering:pixelated;display:block;margin:0 auto 3px';
        placeholder.appendChild(canvas);
      }
    }

    for (const s of SPECIES) {
      const addBtn = this.container.querySelector(`[data-add="${s.key}"]`);
      const remBtn = this.container.querySelector(`[data-rem="${s.key}"]`);
      addBtn?.addEventListener('click', () => this.gameState.addFish(s.key));
      remBtn?.addEventListener('click', () => {
        const ids = this._inTank[s.key];
        if (ids.length) this.gameState.removeFish(ids[ids.length - 1]);
      });
    }

    this.container.querySelector('[data-clear-fish]')
      ?.addEventListener('click', () => this.gameState.clearAllFish());
  }

  _card(species) {
    const count = this._inTank[species.key]?.length ?? 0;
    return `
      <div class="species-card">
        <div data-thumb="${species.key}"></div>
        <div class="card-name">${species.name}</div>
        ${count > 0 ? `<span class="card-count">${count}</span>` : ''}
        <div style="margin-top:6px;display:flex;gap:4px;justify-content:center">
          <button data-add="${species.key}" class="card-btn add">+</button>
          ${count > 0 ? `<button data-rem="${species.key}" class="card-btn remove">&minus;</button>` : ''}
        </div>
      </div>`;
  }
}
