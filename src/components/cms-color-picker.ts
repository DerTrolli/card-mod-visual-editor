import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface ColorPreset {
  name: string;
  variable: string;  // e.g., 'var(--red-color)'
  hex: string;       // for preview swatch
}

export const HA_COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', variable: 'var(--red-color)', hex: '#F44336' },
  { name: 'Pink', variable: 'var(--pink-color)', hex: '#E91E63' },
  { name: 'Purple', variable: 'var(--purple-color)', hex: '#9C27B0' },
  { name: 'Blue', variable: 'var(--blue-color)', hex: '#2196F3' },
  { name: 'Cyan', variable: 'var(--cyan-color)', hex: '#00BCD4' },
  { name: 'Teal', variable: 'var(--teal-color)', hex: '#009688' },
  { name: 'Green', variable: 'var(--green-color)', hex: '#4CAF50' },
  { name: 'Yellow', variable: 'var(--yellow-color)', hex: '#FFEB3B' },
  { name: 'Orange', variable: 'var(--orange-color)', hex: '#FF9800' },
  { name: 'Grey', variable: 'var(--grey-color)', hex: '#9E9E9E' },
];

@customElement('cms-color-picker')
export class CmsColorPicker extends LitElement {
  @property() value = '#ffffff';

  static styles = css`
    :host { display: block; }
    .container { display: flex; flex-direction: column; gap: 8px; }
    .presets { display: flex; flex-wrap: wrap; gap: 4px; }
    .preset {
      width: 24px; height: 24px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
    }
    .preset:hover { border-color: var(--primary-color, #03a9f4); }
    .preset.selected { border-color: var(--primary-color, #03a9f4); }
    .custom { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .custom input[type="color"] { width: 32px; height: 24px; padding: 0; border: none; }
    .custom input[type="text"] { flex: 1; padding: 4px; font-size: 12px; }
  `;

  render() {
    return html`
      <div class="container">
        <div class="presets">
          ${HA_COLOR_PRESETS.map(p => html`
            <div
              class="preset ${this.value === p.variable ? 'selected' : ''}"
              style="background: ${p.hex}"
              title="${p.name} (${p.variable})"
              @click=${() => this._selectPreset(p)}
            ></div>
          `)}
        </div>
        <div class="custom">
          <input type="color" .value=${this._toHex(this.value)} @input=${this._onColorInput} />
          <input type="text" .value=${this.value} @change=${this._onTextChange} placeholder="Color or var(--name)" />
        </div>
      </div>
    `;
  }

  private _selectPreset(preset: ColorPreset) {
    this.value = preset.variable;
    this._emit();
  }

  private _onColorInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this._emit();
  }

  private _onTextChange(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this._emit();
  }

  private _toHex(val: string): string {
    // If it's a var(), return a fallback color for the picker
    if (val.startsWith('var(')) {
      const preset = HA_COLOR_PRESETS.find(p => p.variable === val);
      return preset?.hex || '#888888';
    }
    return val;
  }

  private _emit() {
    this.dispatchEvent(new CustomEvent('color-changed', {
      detail: { value: this.value },
      bubbles: true, composed: true
    }));
  }
}
