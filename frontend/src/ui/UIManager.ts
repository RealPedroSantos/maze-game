export class UIManager {
    private static instance: UIManager;
    private rootElement: HTMLElement;
    private namePromiseResolver: ((name: string) => void) | null = null;

    private constructor() {
        this.rootElement = document.createElement('div');
        this.rootElement.id = 'ui-layer';
        document.body.appendChild(this.rootElement);
        this.buildSkeleton();
    }

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    private buildSkeleton() {
        this.rootElement.innerHTML = `
      <!-- Name Request Modal -->
      <div id="name-modal" class="modal-overlay">
        <div class="modal-content">
          <h2 class="modal-title">IDENTIFIQUE-SE</h2>
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Digite seu nome para entrar no labirinto.</p>
          <input type="text" id="player-name-input" class="modern-input" placeholder="Seu Nome (3-20 chars)" maxlength="20" />
          <button id="player-submit-btn" class="neon-btn">INICIAR</button>
        </div>
      </div>

      <!-- In-game HUD -->
      <div id="game-hud" class="hud-container">
        <div class="hud-box">
          <div class="hud-label">NÍVEL</div>
          <div id="hud-level" class="hud-value">1</div>
        </div>
        <div class="hud-box hud-coins">
          <div class="hud-label">MOEDAS</div>
          <div id="hud-coins" class="hud-value hud-coins-value">0</div>
        </div>
        <div class="hud-box hud-lives">
          <div id="hud-lives" class="hud-value hud-lives-value">❤️❤️❤️</div>
        </div>
        <div class="hud-box" style="text-align: right;">
          <div class="hud-label">RECORDE</div>
          <div id="hud-best" class="hud-value">--</div>
        </div>
      </div>
    `;

        // Bind event listeners
        const submitBtn = document.getElementById('player-submit-btn') as HTMLButtonElement;
        const input = document.getElementById('player-name-input') as HTMLInputElement;

        submitBtn.addEventListener('click', () => {
            this.handleNameSubmit(input.value);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleNameSubmit(input.value);
            }
        });
    }

    private handleNameSubmit(rawName: string) {
        const name = rawName.replace(/\\s+/g, ' ').trim();
        const isValid = /^[a-zA-Z0-9_ ]+$/.test(name) && name.length >= 3 && name.length <= 20;

        if (isValid && this.namePromiseResolver) {
            this.hideModal('name-modal');
            this.namePromiseResolver(name);
            this.namePromiseResolver = null;
        } else {
            const input = document.getElementById('player-name-input') as HTMLInputElement;
            input.style.borderColor = '#ff0033';
            setTimeout(() => input.style.borderColor = '', 1000);
        }
    }

    public showNamePrompt(): Promise<string> {
        return new Promise((resolve) => {
            this.namePromiseResolver = resolve;
            this.showModal('name-modal');
            const input = document.getElementById('player-name-input') as HTMLInputElement;
            input.value = '';
            input.focus();
        });
    }

    public showHUD() {
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.add('active');
    }

    public hideHUD() {
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.remove('active');
    }

    public updateHUD(level: number, best: number | string) {
        const levelEl = document.getElementById('hud-level');
        const bestEl = document.getElementById('hud-best');
        if (levelEl) levelEl.textContent = level.toString();
        if (bestEl) bestEl.textContent = best.toString();
    }

    public updateCoins(count: number) {
        const coinsEl = document.getElementById('hud-coins');
        if (coinsEl) coinsEl.textContent = count.toString();
    }

    public updateLives(lives: number) {
        const livesEl = document.getElementById('hud-lives');
        if (livesEl) {
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
        }
    }

    private showModal(id: string) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    private hideModal(id: string) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }
}
