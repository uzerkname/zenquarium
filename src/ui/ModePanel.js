export class ModePanel {
  constructor(gameState, container) {
    this.gameState = gameState;
    this.container = container;
    this._render();
  }

  _render() {
    const modes = [
      { key: 'sandbox',    label: 'Sandbox',    soon: false },
      { key: 'simulation', label: 'Simulation', soon: true  },
      { key: 'easy',       label: 'Easy',       soon: true  },
      { key: 'challenge',  label: 'Challenge',  soon: true  },
    ];

    this.container.innerHTML = modes.map(m => `
      <button class="mode-btn${this.gameState.mode === m.key ? ' active' : ''}" data-mode="${m.key}">
        ${m.label}
        ${m.soon ? '<span class="soon">SOON</span>' : ''}
      </button>`).join('');

    this.container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.mode;
        if (key === 'sandbox') {
          this.gameState.setMode(key);
          this._render();
        }
      });
    });
  }
}
