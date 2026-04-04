import { DECO_TYPES } from '../decorations/types/index.js';
import { generatePreviews } from './DecorationPreview.js';
import { eventBus } from '../core/EventBus.js';

export class DecorationPanel {
  constructor(placement, gameState, container) {
    this.placement = placement;
    this.gameState = gameState;
    this.container = container;
    this._selected = null;
    this._previews = {};

    eventBus.on('deco:added',   () => this._render());
    eventBus.on('deco:removed', () => this._render());

    this._render();
    this._loadPreviews();
  }

  _loadPreviews() {
    // Generate 3D previews after first paint to avoid blocking startup
    requestAnimationFrame(() => {
      this._previews = generatePreviews();
      this._render();
    });
  }

  _render() {
    const hasDecor = this.gameState.decorations.size > 0;
    this.container.innerHTML = `
      <div class="panel-title">Decor</div>
      <div class="card-grid">
        ${DECO_TYPES.map(d => this._card(d)).join('')}
      </div>
      ${this._selected ? `<div style="margin-top:10px;color:#ffb74d;font-size:11px;text-align:center;font-weight:500">Placing: ${this._selected}</div>` : ''}
      ${hasDecor ? `<button class="clear-btn" data-clear-deco>Clear All Decor</button>` : ''}`;

    for (const d of DECO_TYPES) {
      this.container.querySelector(`[data-deco="${d.key}"]`)
        ?.addEventListener('click', () => {
          this._selected = d.name;
          this.placement.beginPlacement(d.key);
          this._render();
        });
    }

    this.container.querySelector('[data-clear-deco]')
      ?.addEventListener('click', () => this.gameState.clearAllDecorations());
  }

  _card(type) {
    const active = this._selected === type.name;
    const preview = this._previews[type.key];
    const icon = preview
      ? `<img src="${preview}" class="card-preview" draggable="false" alt="${type.name}">`
      : `<span class="card-emoji">${type.emoji}</span>`;
    return `
      <div class="deco-card${active ? ' deco-active' : ''}" data-deco="${type.key}">
        ${icon}
        <div class="card-name">${type.name}</div>
      </div>`;
  }
}
