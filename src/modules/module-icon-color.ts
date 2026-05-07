import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { IconColorModuleState } from '../types/index.js';
import { DEFAULT_ICON_COLOR } from '../parser/state-mapper.js';
import { moduleStyles } from './module-base.js';

export class IconColorModule extends LitElement {
  @property({ attribute: false }) state: IconColorModuleState = {
    ...DEFAULT_ICON_COLOR,
  };

  /** When false the card has no binary entity state (e.g. sensor cards). */
  @property({ type: Boolean, attribute: 'state-aware' }) stateAware = true;

  @state() private _open = false;

  static override styles = [moduleStyles];

  override firstUpdated() {
    this._open = this.state.enabled;
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('state')) {
      const prev = changed.get('state') as IconColorModuleState | undefined;
      if (this.state.enabled && prev && !prev.enabled) this._open = true;
    }
  }

  private _toggleOpen() {
    this._open = !this._open;
  }

  private _emit(changes: Partial<IconColorModuleState>) {
    this.dispatchEvent(
      new CustomEvent<IconColorModuleState>('state-changed', {
        detail: { ...this.state, ...changes },
      }),
    );
  }

  override render() {
    return html`
      <div class="module">
        <div class="module-header" @click=${this._toggleOpen}>
          <span class="module-chevron">${this._open ? '▼' : '▶'}</span>
          <span class="module-title">🎨 Icon Color</span>
          <ha-switch
            .checked=${this.state.enabled}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${(e: Event) =>
              this._emit({ enabled: (e.target as HTMLInputElement).checked })}
          ></ha-switch>
        </div>
        ${this._open ? this._renderBody() : nothing}
      </div>
    `;
  }

  private _renderBody() {
    const effectiveMode = !this.stateAware ? 'plain' : this.state.mode;

    return html`
      <div class="module-body">
        ${this.stateAware
          ? html`
              <div class="control-row">
                <span class="control-label">Mode</span>
                <div class="control-right">
                  <select
                    .value=${effectiveMode}
                    @change=${(e: Event) =>
                      this._emit({
                        mode: (e.target as HTMLSelectElement).value as
                          | 'plain'
                          | 'conditional',
                      })}
                  >
                    <option value="plain" ?selected=${effectiveMode === 'plain'}>
                      Single color
                    </option>
                    <option
                      value="conditional"
                      ?selected=${effectiveMode === 'conditional'}
                    >
                      ON / OFF colors
                    </option>
                  </select>
                </div>
              </div>
            `
          : nothing}

        ${effectiveMode === 'plain'
          ? html`
              <div class="control-row">
                <span class="control-label">Color</span>
                <div class="control-right">
                  <input
                    type="color"
                    .value=${this._toHex(this.state.color)}
                    @input=${(e: Event) =>
                      this._emit({ color: (e.target as HTMLInputElement).value })}
                  />
                  <span class="color-label">${this.state.color}</span>
                </div>
              </div>
            `
          : html`
              <div class="control-row">
                <span class="control-label">Color when ON</span>
                <div class="control-right">
                  <input
                    type="color"
                    .value=${this._toHex(this.state.colorOn)}
                    @input=${(e: Event) =>
                      this._emit({ colorOn: (e.target as HTMLInputElement).value })}
                  />
                  <span class="color-label">${this.state.colorOn}</span>
                </div>
              </div>
              <div class="control-row">
                <span class="control-label">Color when OFF</span>
                <div class="control-right">
                  <input
                    type="color"
                    .value=${this._toHex(this.state.colorOff)}
                    @input=${(e: Event) =>
                      this._emit({ colorOff: (e.target as HTMLInputElement).value })}
                  />
                  <span class="color-label">${this.state.colorOff}</span>
                </div>
              </div>
            `}
      </div>
    `;
  }

  /** Resolves any CSS color (named, rgb(), hex) to a 6-digit hex for <input type="color">. */
  private _toHex(value: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
      return DEFAULT_ICON_COLOR.colorOn;
    }
  }
}

customElements.define('cms-icon-color-module', IconColorModule);
