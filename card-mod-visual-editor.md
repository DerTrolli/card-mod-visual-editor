# Card-Mod Studio — Full Project Plan
### A Visual Editor for card-mod Styles in Home Assistant
**Version:** 1.0 Draft  
**Author:** Trolli / Troll-IT  
**Date:** May 2026

---

## Table of Contents
1. [What is this project?](#1-what-is-this-project)
2. [Does anything like this already exist?](#2-does-anything-like-this-already-exist)
3. [How Home Assistant plugins work](#3-how-home-assistant-plugins-work)
4. [Technical foundation](#4-technical-foundation)
5. [Architecture overview](#5-architecture-overview)
6. [Feature scope — what we build and what we skip](#6-feature-scope)
7. [Full file structure](#7-full-file-structure)
8. [Implementation phases](#8-implementation-phases)
9. [The hardest problems and how to solve them](#9-the-hardest-problems)
10. [Pros and cons of the whole approach](#10-pros-and-cons)
11. [How to set up for local development and testing](#11-local-development-setup)
12. [How to publish to HACS](#12-publishing-to-hacs)
13. [Maintenance burden and long-term reality](#13-maintenance-and-long-term-reality)
14. [Realistic timeline](#14-realistic-timeline)

---

## 1. What is this project?

**Card-Mod Studio** is a HACS frontend plugin that adds a visual GUI editor for `card_mod` CSS styles directly inside the Home Assistant dashboard editor. Instead of hand-writing YAML + CSS + Jinja2 templates, users get a panel with color pickers, toggle switches, sliders, and animation presets — and the plugin generates the correct `card_mod` YAML automatically.

### The problem it solves

Right now the workflow for card-mod is:
1. Open card editor → switch to YAML mode
2. Write CSS from memory or copy examples from the internet
3. Save → hard refresh → see if it worked
4. Repeat 10 times until the shadow DOM selector is right
5. When HA updates, it might all break

Card-Mod Studio collapses steps 1–5 into: open editor → click a button → use sliders → done.

### What it does NOT try to do

- It does not replace card-mod itself — it generates card-mod YAML that card-mod then applies
- It does not support 100% of card-mod's capabilities — only the most common visual cases
- It does not have a live preview in v1 (that is a v2 feature)

---

## 2. Does anything like this already exist?

**Short answer: No.** This has been confirmed by searching the HACS repository list and the Home Assistant community forums.

What does exist:

| Tool | What it does | Why it's not the same |
|---|---|---|
| card-mod itself | Applies CSS via YAML | Requires manual CSS/YAML knowledge |
| HA Visual Editor | Edits standard card properties | Completely ignores `card_mod` blocks, shows warning |
| Browser DevTools | Live CSS editing in the DOM | Not saved, not integrated, requires technical knowledge |
| Mushroom Cards | Has its own styling system | Only works for Mushroom cards, not general |
| custom:button-card | Supports templates and styles | Replaces the card entirely, different ecosystem |

There is a known open community request for visual card-mod editing on the HA forums, but no one has built it yet. This is a real gap.

---

## 3. How Home Assistant plugins work

Understanding this is essential before writing a single line of code.

### 3.1 The two plugin types in HACS

**Integration** (Python, backend):
- Lives in `custom_components/`
- Runs server-side in Python
- Handles devices, sensors, automations
- NOT what we're building

**Frontend / Dashboard plugin** (JavaScript, frontend):
- A `.js` file loaded by the browser
- Registers custom HTML elements via the Web Components API
- Can be a card, an entity row, a panel, or a resource that patches existing behaviour
- THIS is what we're building

### 3.2 How HA loads frontend plugins

HA's frontend is a Single Page App built with **Lit** (a Google web components library) and compiled with **Rollup**. When HA loads:

1. The browser loads `app.js` (the main HA bundle)
2. Lovelace resources defined in Settings → Dashboards → Resources are loaded as ES modules
3. Each resource can register new custom elements with `customElements.define()`
4. HA's card picker scans `window.customCards` to show registered cards in the UI

Our plugin uses this mechanism but instead of registering a new card, it **patches the existing card editor dialog** to inject extra UI.

### 3.3 The Shadow DOM problem (why this is hard)

HA uses Shadow DOM extensively. Every component (ha-card, ha-icon, ha-state-icon etc.) has its own isolated style scope. CSS from outside cannot reach inside a shadow root without explicit piercing — which is exactly what card-mod does via its custom YAML selector syntax.

For our editor, this means:
- We cannot simply inject a `<div>` into the card editor dialog with `document.querySelector()`
- We need a `MutationObserver` that watches for the dialog appearing, then injects our element into its shadow root
- This is the same technique used by browser extensions and by card-mod itself

### 3.4 How card-mod works (what we're generating)

card-mod reads a `card_mod.style` key from a card's YAML config. The value is either:

- **A string** → injected as CSS into `ha-card`
- **A dictionary** → each key is a CSS selector (with `$` meaning "pierce shadow root"), each value is CSS injected at that level

Jinja2 templates inside the CSS strings are evaluated by HA's template engine, with access to `states()`, `is_state()`, `config.entity`, and all standard HA template functions.

Example of what we generate:
```yaml
card_mod:
  style: |
    ha-card {
      filter: {{ 'grayscale(100%)' if is_state(config.entity, 'off') else 'none' }};
      transition: filter 0.3s ease;
    }
```

---

## 4. Technical foundation

### 4.1 Language: TypeScript

**Why TypeScript over plain JavaScript:**
- HA's own frontend is TypeScript — using it means your code patterns match the ecosystem
- Type safety catches errors at build time instead of runtime
- Better IDE support (autocomplete, refactoring)
- The `@home-assistant/types` package provides typed interfaces for `HomeAssistant`, `HassEntity`, `LovelaceCardConfig` etc.

**Cons of TypeScript:**
- Needs a build step (Vite)
- Slightly more boilerplate for simple things
- HA's internal types are not always exported, sometimes you have to declare your own

### 4.2 UI framework: Lit

**Why Lit:**
- HA's entire frontend is Lit — any element we inject will be compatible
- Lit handles reactive state, templating, and Shadow DOM natively
- Small bundle size (~5kb gzipped)
- Official support for Web Components standard

**Cons of Lit:**
- Less community learning material than React/Vue
- Decorators require specific TypeScript config
- Shadow DOM can complicate styling our own UI elements

### 4.3 Build tool: Vite

**Why Vite:**
- Fast hot-module replacement during development
- Simple config for building a single JS bundle
- First-class TypeScript support with no extra config
- Used by many modern HA custom cards

**Dev loop with Vite:**
```
edit .ts file → Vite rebuilds in ~200ms → copy to /config/www/ → hard refresh browser
```

This can be automated with a simple watch script.

### 4.4 YAML handling: js-yaml

card-mod config is YAML. We need to parse existing `card_mod` blocks and serialize back to YAML. `js-yaml` is the standard library for this in the browser — it's also what HA uses internally.

### 4.5 Code editor: CodeMirror 6

For the "Advanced" raw CSS editing section. CodeMirror is already bundled in HA's frontend (it's used in the YAML card editor), so we may be able to import it without adding bundle size. Provides syntax highlighting for CSS and Jinja2.

---

## 5. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Home Assistant Frontend                   │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │  Card Editor Dialog  │    │  Card Preview Pane       │   │
│  │  (hui-dialog-edit-  │    │  (existing HA component) │   │
│  │   card)             │    │                          │   │
│  │                     │    │  [renders the card live] │   │
│  │  [existing editors] │    └──────────────────────────┘   │
│  │                     │                                   │
│  │  ┌───────────────┐  │                                   │
│  │  │ 🎨 Style Tab  │  │ ← injected by Card-Mod Studio    │
│  │  │               │  │                                   │
│  │  │ ┌───────────┐ │  │                                   │
│  │  │ │Filter     │ │  │                                   │
│  │  │ │module     │ │  │                                   │
│  │  │ └───────────┘ │  │                                   │
│  │  │ ┌───────────┐ │  │                                   │
│  │  │ │Background │ │  │                                   │
│  │  │ │module     │ │  │                                   │
│  │  │ └───────────┘ │  │                                   │
│  │  │ ┌───────────┐ │  │                                   │
│  │  │ │Animation  │ │  │                                   │
│  │  │ │module     │ │  │                                   │
│  │  │ └───────────┘ │  │                                   │
│  │  │ ┌───────────┐ │  │                                   │
│  │  │ │Advanced   │ │  │                                   │
│  │  │ │(raw CSS)  │ │  │                                   │
│  │  │ └───────────┘ │  │                                   │
│  │  │               │  │                                   │
│  │  │ [Copy YAML]   │  │                                   │
│  │  └───────────────┘  │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘

Data flow:
  User adjusts UI control
       ↓
  Module generates CSS string
       ↓
  YAML serializer builds card_mod block
       ↓
  Emits config-changed event to HA editor
       ↓
  HA saves card config (including card_mod)
       ↓
  card-mod picks it up and applies styles
```

---

## 6. Feature scope

### In scope for v1 (simple version)

These cover 90% of real-world card-mod use cases:

| Feature | What it does | Generated CSS |
|---|---|---|
| **Grayscale when off** | Toggle: desaturate icon/card when entity is off | `filter: grayscale(100%)` with Jinja2 condition |
| **Brightness** | Slider 0–100% affecting whole card | `filter: brightness(X%)` |
| **Icon color** | Color picker for on-state and off-state | `color` on `ha-state-icon` |
| **Background color** | Solid color picker | `background` on `ha-card` |
| **Background gradient** | 2-color picker + angle slider | `linear-gradient(...)` on `ha-card` |
| **Animation presets** | Dropdown: pulse, fade, gradient shift, breathe | `@keyframes` + `animation` |
| **Animation condition** | When to run: always / when on / when off | Jinja2 `{% if %}` wrapper |
| **Border radius** | Slider 0–50px | `border-radius` on `ha-card` |
| **Transition speed** | Slider for filter/color transitions | `transition` |
| **Raw CSS editor** | CodeMirror textarea for anything else | Direct passthrough |

### Out of scope for v1

| Feature | Reason skipped |
|---|---|
| Live preview | Requires sandboxed iframe + HA card renderer — too complex for v1 |
| Shadow DOM path picker | Too card-type-specific, breaks with HA updates |
| Custom Jinja2 logic builder | Would be a full visual programming tool |
| Support for custom cards (Mushroom, Bubble) | DOM paths change too often |
| Theme-level card-mod | Different injection point, separate problem |
| Import/export style presets | Nice to have, v2 |

---

## 7. Full file structure

```
card-mod-studio/
│
├── src/
│   ├── card-mod-studio.ts          # Entry point, registers everything
│   │
│   ├── editor/
│   │   ├── cms-injector.ts         # MutationObserver that finds and patches
│   │   │                           # the HA card editor dialog
│   │   ├── cms-panel.ts            # The main style panel Lit component
│   │   └── cms-tab.ts              # The tab button that appears in editor
│   │
│   ├── modules/
│   │   ├── module-base.ts          # Abstract base class all modules extend
│   │   ├── module-filter.ts        # Grayscale + brightness controls
│   │   ├── module-icon-color.ts    # Icon color on/off pickers
│   │   ├── module-background.ts    # Solid + gradient background
│   │   ├── module-animation.ts     # Preset animations + condition
│   │   ├── module-border.ts        # Border radius + optional border
│   │   └── module-advanced.ts      # Raw CSS CodeMirror editor
│   │
│   ├── generator/
│   │   ├── css-generator.ts        # Takes module state → CSS string
│   │   ├── yaml-generator.ts       # Takes CSS string → card_mod YAML
│   │   └── jinja-helpers.ts        # Builds Jinja2 template strings
│   │
│   ├── parser/
│   │   ├── yaml-parser.ts          # Reads existing card_mod YAML → state
│   │   └── css-parser.ts           # Reads CSS string → property map
│   │
│   ├── utils/
│   │   ├── dom-helpers.ts          # Shadow DOM traversal utilities
│   │   ├── hass-helpers.ts         # Entity state helpers
│   │   └── debounce.ts             # Debounce for rapid UI changes
│   │
│   └── types/
│       ├── index.ts                # All shared TypeScript interfaces
│       └── card-mod.d.ts           # card-mod specific type declarations
│
├── styles/
│   └── panel.css                   # Styles for the editor panel itself
│
├── dist/
│   └── card-mod-studio.js          # Built output (what HACS distributes)
│
├── test/
│   ├── generator.test.ts           # Unit tests for CSS/YAML generation
│   └── parser.test.ts              # Unit tests for YAML/CSS parsing
│
├── .github/
│   └── workflows/
│       ├── validate.yml            # Runs on every PR: lint + test + build
│       └── release.yml             # On tag push: build + attach to release
│
├── hacs.json                       # HACS metadata
├── package.json                    
├── tsconfig.json                   
├── vite.config.ts                  
├── .eslintrc.json                  
└── README.md                       
```

---

## 8. Implementation phases

### Phase 1 — Project scaffold and HA injection (Est. 2 weeks)

**Goal:** A button appears in the card editor. Clicking it opens a blank panel. Nothing else works yet, but the injection mechanism is proven.

**Tasks:**
1. Set up Vite + TypeScript + Lit project from the custom-cards boilerplate
2. Register the plugin as a Lovelace resource
3. Write the `MutationObserver` in `cms-injector.ts` that detects when `hui-dialog-edit-card` opens
4. Inject a tab button element into the editor's tab bar
5. Render an empty `cms-panel` when the tab is clicked
6. Verify it works across card types (light, button, sensor, tile)

**Key challenge:** The card editor is a shadow DOM element. To inject into it you need:
```typescript
// Simplified concept
const observer = new MutationObserver(() => {
  const dialog = document.querySelector('hui-dialog-edit-card');
  if (!dialog) return;
  const root = dialog.shadowRoot;
  if (!root || root.querySelector('cms-tab')) return; // already injected
  // find the tab bar and append our tab
  const tabBar = root.querySelector('.tab-bar');
  if (tabBar) {
    const tab = document.createElement('cms-tab');
    tabBar.appendChild(tab);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

**Pros of MutationObserver approach:**
- No HA internal API needed
- Works across HA versions as long as the dialog element name doesn't change
- Same technique card-mod uses successfully

**Cons:**
- `hui-dialog-edit-card` is an internal element name that COULD change in a HA update
- Timing issues: the shadow root may not be populated when the element first appears
- Needs retry/debounce logic

**Milestone output:** A "Style" tab appears in the light card editor. Clicking it shows an empty panel with the text "Card-Mod Studio v0.1".

---

### Phase 2 — YAML parser (Est. 1 week)

**Goal:** When you open the style panel on a card that already has a `card_mod` block, the panel reflects the current state.

**Tasks:**
1. Read the card config object from the editor (HA passes this as a property)
2. Extract the `card_mod.style` value
3. Parse it from YAML string to a property map
4. Handle both string styles and dictionary styles (shadow DOM hierarchy)
5. Detect Jinja2 templates and flag them as conditional

**Example of what the parser does:**
```
Input (YAML string):
  "ha-card {\n  filter: {{ 'grayscale(100%)' if is_state(config.entity, 'off') else 'none' }};\n}"

Output (internal state object):
  {
    target: 'ha-card',
    properties: [{
      property: 'filter',
      hasCondition: true,
      offValue: 'grayscale(100%)',
      onValue: 'none',
      conditionType: 'entity-state'
    }]
  }
```

**Pros:**
- Means the editor is non-destructive — existing hand-written card-mod is preserved
- Users can mix visual editing and raw CSS

**Cons:**
- CSS parsing in JavaScript is fragile — edge cases will exist
- Jinja2 template parsing is especially tricky; the parser needs to recognise common patterns without being a full Jinja2 interpreter
- Arbitrary CSS that doesn't match known patterns just gets pushed to the Advanced raw editor

---

### Phase 3 — Visual modules (Est. 3 weeks)

**Goal:** All the UI controls from the feature scope table work correctly and generate valid card-mod YAML.

This is the most straightforward phase — it's mostly building Lit UI components.

#### Module: Filter (Week 1 of phase)

```
┌──────────────────────────────────┐
│ 🔲 Visual Filters                │
│                                  │
│ Grayscale when off    [●——————]  │ ← toggle
│                                  │
│ Brightness            [——●————]  │ ← slider (85%)
│                                  │
│ Blur                  [●——————]  │ ← slider (0px, disabled)
│                                  │
│ Transition speed      [———●———]  │ ← slider (300ms)
└──────────────────────────────────┘
```

Generated YAML:
```yaml
card_mod:
  style: |
    ha-card {
      filter: {{ 'grayscale(100%) brightness(85%)' if is_state(config.entity, 'off') else 'brightness(85%)' }};
      transition: filter 0.3s ease;
    }
```

#### Module: Icon Color (Week 1 of phase)

```
┌──────────────────────────────────┐
│ 🎨 Icon Color                    │
│                                  │
│ Color when ON    [████] #2196F3  │ ← color picker
│ Color when OFF   [░░░░] #6b6b6b  │ ← color picker
└──────────────────────────────────┘
```

**Important:** Icon color requires shadow DOM piercing for light cards. The generator must emit the right selector:
```yaml
card_mod:
  style: |
    ha-state-icon {
      color: {{ '#2196F3' if is_state(config.entity, 'on') else '#6b6b6b' }} !important;
    }
```

#### Module: Background (Week 2 of phase)

```
┌──────────────────────────────────┐
│ 🖼 Background                    │
│                                  │
│ Type    ○ Solid  ● Gradient      │
│                                  │
│ Color 1  [████] #2196F3          │
│ Color 2  [████] #FF8C00          │
│ Angle    [———●———] 135°           │
│                                  │
│ Apply when  ○ Always             │
│             ● State: ON          │
│             ○ State: OFF         │
└──────────────────────────────────┘
```

#### Module: Animation (Week 2 of phase)

```
┌──────────────────────────────────┐
│ ✨ Animation                     │
│                                  │
│ Preset   [Gradient Shift ▼]      │
│                                  │
│ Speed    [———●———] 3s             │
│                                  │
│ Trigger  ○ Always                │
│          ● When ON               │
│          ○ Custom entity         │
│          [input_boolean.xxx    ] │
└──────────────────────────────────┘
```

**Animation presets:**
- **Pulse** — scales card up/down gently
- **Breathe** — opacity fades in/out
- **Gradient Shift** — animates background-position across a wide gradient
- **Color Fade** — fades icon color between two colors
- **Blink** — quick opacity pulse, useful for alerts

#### Module: Advanced Raw Editor (Week 3 of phase)

A CodeMirror editor that shows the full generated CSS and allows direct editing. Changes in the visual modules update the raw editor, and changes in the raw editor update the module state where possible. If the raw editor contains CSS that modules can't parse, it's preserved as-is alongside the generated parts.

---

### Phase 4 — Output and config integration (Est. 1 week)

**Goal:** Changes from the style panel actually save to the card config.

**Tasks:**
1. Serialize internal state → CSS string → YAML string
2. Merge with the existing card config object
3. Fire `config-changed` custom event with the updated config
4. HA's editor picks this up and marks the card as modified (same mechanism any card editor uses)
5. When the user clicks Save in the HA editor, everything saves normally
6. Add a "Copy card_mod YAML" button for users who prefer to paste manually

**Why firing `config-changed` is the right approach:**

HA's Lovelace editor already has a well-defined contract for this. Every built-in card editor uses it:
```typescript
this.dispatchEvent(new CustomEvent('config-changed', {
  detail: { config: updatedConfig },
  bubbles: true,
  composed: true,
}));
```

This means we don't need to call any HA internal APIs — we just pretend to be a normal card editor and speak the same language.

---

### Phase 5 — Polish and HACS publish (Est. 1 week)

**Tasks:**
1. Write `hacs.json`
2. Write README with screenshots and installation instructions
3. Set up GitHub Actions: lint + test on PR, build + release on tag
4. Add version to resource URL for cache busting
5. Create first GitHub release with built `.js` file attached
6. Add to HACS custom repository (for personal use)
7. Optionally submit PR to HACS default repo for public listing

---

## 9. The hardest problems

### Problem 1: MutationObserver timing

The card editor dialog renders asynchronously. By the time the MutationObserver fires, the shadow root might not be fully populated yet.

**Solution:** Use a retry loop with exponential backoff:
```typescript
function tryInject(element: Element, attempts = 0) {
  const root = element.shadowRoot;
  const tabBar = root?.querySelector('.tab-bar, mwc-tab-bar');
  if (!tabBar) {
    if (attempts < 10) setTimeout(() => tryInject(element, attempts + 1), 100 * attempts);
    return;
  }
  // inject our tab
}
```

### Problem 2: Internal HA element names change

`hui-dialog-edit-card` is an internal name. HA could rename it in any release.

**Solution:**
- Add a version compatibility check on startup
- Log a clear warning to the browser console if the injection point isn't found
- Keep the element name as a config constant so updating it is a one-line fix
- Watch HA release notes and card-mod release notes for breaking changes

### Problem 3: CSS parsing is imperfect

Parsing arbitrary hand-written CSS + Jinja2 back into a structured state object is fundamentally lossy. Not all patterns can be reverse-engineered.

**Solution:**
- Be explicit about this: if a CSS property can't be parsed into a known module, it goes to the Advanced raw editor
- The raw editor content is always preserved verbatim — we never throw away CSS we don't understand
- Parse only the patterns we generate ourselves (which are deterministic)

### Problem 4: `config.entity` in Jinja2 templates

card-mod templates use `config.entity` to reference the card's entity. This is only available at render time in HA's template engine, not in our editor. We can't evaluate the template ourselves.

**Solution:**
- For visual display in the editor, always show the current entity state from `hass.states`
- Use `config.entity` in generated templates exactly as card-mod expects — don't try to resolve it

### Problem 5: Different card types need different CSS selectors

`ha-state-icon` works for button cards but not light cards (which use a different shadow DOM structure). The light card's icon is deeper in the tree.

**Solution for v1:** Start with the three most common patterns only:
1. `ha-card` — works on all cards, safe for filter/background/border
2. `ha-state-icon` — works on button cards
3. Document clearly which module works with which card type

Add card-specific paths in a lookup table that can be extended over time:
```typescript
const SAFE_SELECTORS: Record<string, string> = {
  'light': 'ha-card',        // icon color via filter only
  'button': 'ha-state-icon', // direct icon color works
  'sensor': 'ha-card',
  'tile': 'ha-card',
};
```

---

## 10. Pros and cons

### Pros

**For users:**
- No CSS knowledge required for common styling tasks
- No more hunting forum posts for the right shadow DOM selector
- Stays in the HA editor workflow — no external tools
- Generated YAML is correct and readable — you can still see and edit what was created
- Works alongside hand-written card-mod styles (Advanced tab preserves them)

**For the ecosystem:**
- Genuinely fills a gap that no existing tool fills
- Could significantly lower the barrier to entry for card-mod
- Open source — community can contribute new modules and card-type mappings
- Good HACS project — useful enough that people will install it

**For you (Troll-IT):**
- Real-world TypeScript + Lit + Web Components experience
- Understanding of HA internals that transfers to other HA projects
- Portfolio project with genuine community value
- Could gain HACS traction fairly quickly given how often people ask about card-mod visual editing

### Cons

**Technical:**
- MutationObserver injection is inherently fragile — HA UI changes can break it at any time
- Cannot offer live preview in v1 (significant UX limitation)
- CSS parsing is lossy — hand-written card-mod styles may not reverse-engineer cleanly
- Shadow DOM paths differ per card type — impossible to support all cards equally
- Jinja2 templates cannot be evaluated in the browser — conditional logic is pattern-matched, not executed

**Maintenance:**
- HA releases every month — each release is a potential breaking change for the injection mechanism
- card-mod itself also breaks with HA releases (has a documented compatibility table going back 3 years)
- Requires active maintenance to stay useful — not a "build it and forget" project
- As a solo project, release lag could frustrate users when HA updates break things

**Scope creep risk:**
- Once v1 is out, users will immediately request: live preview, Mushroom card support, Bubble card support, theme-level editing, style presets, import/export — managing expectations requires discipline

**Not possible at all:**
- True gradient fill on SVG icons (browser limitation — `fill` only accepts single colors)
- Perfect round-trip parsing of arbitrary hand-written card-mod CSS
- Working completely without card-mod installed (we generate YAML that card-mod executes)

---

## 11. Local development setup

### Step 1: Prerequisites

```bash
node --version   # Need 18+
npm --version    # Comes with Node
git --version
```

### Step 2: Create project

```bash
# Clone the official custom card boilerplate as a starting point
git clone https://github.com/custom-cards/boilerplate-card.git card-mod-studio
cd card-mod-studio

# Install dependencies
npm install

# Add our specific dependencies
npm install lit js-yaml
npm install -D typescript @types/js-yaml vite
```

### Step 3: Vite config for a single-file output

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/card-mod-studio.ts',
      formats: ['es'],
      fileName: () => 'card-mod-studio.js',
    },
    rollupOptions: {
      external: [],  // bundle everything — HA doesn't expose Lit as a shared module
    },
  },
});
```

### Step 4: Build and copy to HA

```bash
# Build once
npm run build

# Copy to your HA config/www folder (adjust path to your HA setup)
cp dist/card-mod-studio.js /path/to/ha/config/www/
```

Or automate with a watch script in `package.json`:
```json
{
  "scripts": {
    "dev": "vite build --watch",
    "copy": "cp dist/card-mod-studio.js /path/to/ha/config/www/",
    "dev:ha": "npm run dev & fswatch dist/card-mod-studio.js | xargs -I{} npm run copy"
  }
}
```

### Step 5: Register in Home Assistant

Go to **Settings → Dashboards → top-right menu (⋮) → Resources → Add Resource:**

```
URL:  /local/card-mod-studio.js?v=0.0.1
Type: JavaScript Module
```

Update the `?v=` query string each time you rebuild to bust the browser cache.

### Step 6: Development workflow

1. Edit a `.ts` file in `src/`
2. Vite rebuilds automatically (in watch mode)
3. The copy script pushes to HA's www folder
4. In HA browser: `Ctrl+Shift+R` (hard refresh, bypasses cache)
5. Open a card editor and check if your change appears

**Tip:** Keep browser DevTools open on the Console tab. Any errors in your plugin appear there. Use `console.log()` liberally during development.

---

## 12. Publishing to HACS

### Required files

**`hacs.json`** (in repository root):
```json
{
  "name": "Card-Mod Studio",
  "content_in_root": true,
  "filename": "card-mod-studio.js",
  "render_readme": true,
  "homeassistant": "2024.4.0"
}
```

**GitHub release:**
- Each release must have the built `card-mod-studio.js` attached as a release asset
- HACS downloads this file, not the source TypeScript
- GitHub Actions automates this (see below)

**GitHub Actions release workflow:**
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/card-mod-studio.js
```

### Adding as a personal custom repo in HACS

In HACS: **Menu (⋮) → Custom Repositories:**
- URL: `https://github.com/yourusername/card-mod-studio`
- Category: **Dashboard**
- Click Add

It then appears in HACS like any other dashboard plugin and updates when you push new releases.

### Submitting to HACS default (public listing)

When the project is stable (v1.0+):
1. Make sure your repo meets all HACS requirements (README, hacs.json, releases, license)
2. Submit a PR to `https://github.com/hacs/default` adding your repo to `plugin` category
3. Maintainers review it — usually takes 1-4 weeks
4. Once merged, it appears in HACS search for everyone

Requirements checklist for public HACS listing:
- [ ] Public GitHub repo
- [ ] Valid `hacs.json`
- [ ] At least one GitHub release with built file attached
- [ ] README with description, installation steps, and screenshot
- [ ] OSI-approved open source license (MIT recommended)
- [ ] No malicious code (reviewed by HACS team)

---

## 13. Maintenance and long-term reality

This is the section most project plans skip. It's the most important one.

### HA release cycle

Home Assistant releases a new version **every single month**, consistently. Each release can potentially:
- Rename internal elements (breaking injection)
- Change shadow DOM structure (breaking CSS selectors)
- Update card-mod compatibility (may or may not affect us)
- Change the Lovelace editor UI structure (breaking tab injection)

**Realistic maintenance expectation:** 1-3 hours per month just to track HA releases and check compatibility. Roughly every 3-6 months there will be a breaking change that needs a fix release.

### card-mod compatibility

card-mod itself has a documented history of breaking with HA updates. Our plugin depends on card-mod being installed and working. If card-mod breaks, our generated YAML stops working too — even if our editor still opens fine. We should show a warning if card-mod isn't detected.

Detecting card-mod:
```typescript
function isCardModInstalled(): boolean {
  return customElements.get('card-mod') !== undefined;
}
```

### Versioning strategy

Use semantic versioning clearly tied to HA compatibility:
```
card-mod-studio 1.2.0 — tested with HA 2026.4, card-mod 4.1+
```

Keep a compatibility table in the README, same as card-mod does.

### Community management

Once on HACS public, you will get:
- Bug reports for things that work fine (user has outdated HA or card-mod)
- Feature requests (live preview, Mushroom cards, etc.)
- Questions better suited for the HA community forum

Establish clearly in the README: "This plugin generates card-mod YAML. If the style doesn't apply, verify card-mod is installed and working first."

---

## 14. Realistic timeline

Assuming ~5-8 hours per week of work:

| Phase | Duration | Output |
|---|---|---|
| 1. Scaffold + Injection | 2 weeks | Tab button appears in card editor |
| 2. YAML Parser | 1 week | Existing card-mod config reads into editor |
| 3. Visual modules | 3 weeks | Filter, icon color, background, animation, border all work |
| 4. Config integration | 1 week | Changes actually save to card config |
| 5. Polish + HACS | 1 week | Published to your custom HACS repo |
| **Total to personal v1** | **~8 weeks** | |
| Testing + bug fixes | 2 weeks | Solid enough for public HACS listing |
| Public HACS submission | 1 week | Submitted PR to hacs/default |
| **Total to public** | **~11 weeks** | |

### What would slow this down

- Shadow DOM injection not working as expected (Phase 1) — could add 1-2 weeks of debugging
- HA update breaking things mid-development — adds 1 week
- Scope creep (adding live preview before v1 is stable) — adds 4+ weeks

### What would speed this up

- Using an existing card as a base (e.g. forking power-flow-card-plus which already has a good editor pattern)
- Finding that card-mod already exposes a hook for editor integration (unlikely but possible)
- Having an n8n automation that auto-copies dist files to HA on build (you have n8n set up already)

---

## Quick reference: Key links

| Resource | URL |
|---|---|
| HA Custom Card docs | https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/ |
| card-mod GitHub | https://github.com/thomasloven/lovelace-card-mod |
| Custom cards boilerplate | https://github.com/custom-cards/boilerplate-card |
| HACS publish guide | https://www.hacs.xyz/docs/publish/plugin/ |
| Lit documentation | https://lit.dev/docs/ |
| js-yaml | https://github.com/nodeca/js-yaml |
| HA types package | https://github.com/home-assistant/frontend (types folder) |
| HACS default repo | https://github.com/hacs/default |

---

*Document generated May 2026. Verify HA and HACS documentation links for current requirements before starting development.*
