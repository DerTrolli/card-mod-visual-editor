import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { AccentColorModuleState } from '../types/index.js';
import { DEFAULT_ACCENT_COLOR } from '../parser/state-mapper.js';
import { moduleStyles } from './module-base.js';
import '../components/cms-color-picker.js';

export class AccentColorModule extends LitElement {
  @property({ attribute: false }) state: AccentColorModuleState = {
    ...DEFAULT_ACCENT_COLOR,
  };

  @state() private _open = false;

  static override styles = [moduleStyles];

  override firstUpdated() {
    this._open = this.state.enabled;
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('state')) {
      const prev = changed.get('state') as AccentColorModuleState | undefined;
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
    }
  }

  private _toggleOpen() {
    this._open = !this._open;
  }

  private _emit(changes: Partial<AccentColorModuleState>) {
    this.dispatchEvent(
      new CustomEvent<AccentColorModuleState>('state-changed', {
        detail: { ...this.state, ...changes },
      }),
    );
  }

  override render() {
    return html`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? '▼' : '▶'}</span>
          <span class="module-title">🌈 Accent Color</span>
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${(e: Event) =>
              this._emit({ enabled: (e.target as HTMLInputElement).checked })}
          ></ha-switch>
        </div>
        ${this._open
          ? html`
              <div class="module-body">
                <div class="control-row">
                  <span class="control-label">Color (--accent-color)</span>
                  <div class="control-right">
                    <cms-color-picker
                      .value=${this.state.color}
                      @color-changed=${(e: CustomEvent) =>
                        this._emit({ color: e.detail.value })}
                    ></cms-color-picker>
                  </div>
                </div>
                <p
                  style="margin:4px 0 0;font-size:11px;color:var(--secondary-text-color,#9e9e9e);"
                >
                  Sets <code>--accent-color</code> on ha-card. Affects graph line
                  color, highlighted borders, and other themed elements.
                </p>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define('cms-accent-color-module', AccentColorModule);
