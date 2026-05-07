# Card-Mod Studio — Per-Card-Type Adaptation Plan

## Overview

Card-Mod Studio must adapt its UI to the card type being edited.
Different cards support different CSS targets. Some cards are containers
(style child cards, not the container itself). Some have unique internal
elements that need dedicated modules.

---

## Card Categories

### Category A — Container / Layout Cards
Card-mod on the container itself is mostly useless. Style child cards.
Show a banner: "This is a layout card — open individual child cards to style them."
Keep: Border & Radius, Advanced CSS. Disable: Icon Color, Filters, Animation, Accent Color, Background.

| Type | Notes |
|---|---|
| `grid` | Child cards styled independently; columns/gap via Advanced |
| `vertical-stack` | Child cards styled independently |
| `horizontal-stack` | Child cards styled independently |
| `sections` | HA 2024.x sections layout; child cards styled independently |
| `conditional` | Logic wrapper; style the child card instead |

### Category B — Standard Action Cards (Full Studio)
ha-card + ha-state-icon both present. All modules apply.

| Type | Icon Color | Accent Color | Notes |
|---|---|---|---|
| `button` | ✅ ha-state-icon | ✅ | State-aware conditional colors ideal |
| `tile` | ✅ ha-state-icon | ✅ affects features | Modern card; --accent-color colors feature buttons |
| `entity` | ✅ ha-state-icon | ✅ | Single entity control |
| `glance` | ✅ ha-icon per entity | ❌ | Multiple icons; icon color is card-level |

### Category C — Heading Card (Special Module Needed)
Heading uses completely different selectors. Needs a dedicated **Heading Style** module.
Disable: Icon Color (wrong selector), Accent Color. Keep: Background, Border, Advanced.

```
ha-card .title p        → text styling (font-size, color, font-weight)
ha-card .title ha-icon  → icon (--mdc-icon-size, color !important)
.container              → alignment (justify-content: center)
```

**New module: Heading Style**
- Font size slider (12–48px → `ha-card .title p { font-size: Xpx; }`)
- Text color picker
- Icon size slider (--mdc-icon-size)
- Icon color picker (color !important on ha-card .title ha-icon)
- Alignment select: left / center / right (justify-content on .container)

### Category D — Entities Card (Sub-row styling, future phase)
Standard card-level modules work. Icon Color applies to the card header toggle only.
Individual entity rows need separate per-row styling (Phase 6).

| Type | Icon Color | Notes |
|---|---|---|
| `entities` | ⚠️ header toggle only | Rows styled individually via Advanced for now |
| `entity-filter` | ⚠️ same as entities | Filters entities; styling identical to entities |

### Category E — Data Visualization Cards
No ha-state-icon. Accent color affects chart elements. Icon Color disabled.

| Type | Accent Color | Filters | Notes |
|---|---|---|---|
| `sensor` | ✅ sparkline color | ✅ | Simple value + optional sparkline |
| `gauge` | ✅ arc color | ❌ | SVG-based; accent affects arc fill |
| `history-graph` | ✅ line color | ❌ | Chart-base; height via Advanced |
| `statistics-graph` | ✅ line/bar color | ❌ | Same as history-graph |
| `energy-distribution` | ✅ | ❌ | SVG; limited deep styling |
| `energy-usage-graph` | ✅ | ❌ | Chart-base; height via Advanced |

### Category F — Climate / Device Control Cards
Full module support. Accent color has strong visual impact.

| Type | Icon Color | Accent Color | Notes |
|---|---|---|---|
| `thermostat` | ❌ (no ha-state-icon) | ✅ target temp ring | Feature-based card |
| `humidifier` | ❌ | ✅ | Similar to thermostat |
| `light` | ❌ | ✅ brightness slider | Feature buttons colored by accent |
| `alarm-panel` | ❌ | ✅ arm button | Keypad via Advanced |

### Category G — Media / Map / Complex Cards
Limited styling. Background and border work. Icon Color and Accent mostly not applicable.

| Type | Keep | Notes |
|---|---|---|
| `media-control` | Background, Border, Filters | Album art background; player-specific |
| `weather-forecast` | Background, Border | CSS vars for font sizes (Advanced) |
| `calendar` | Background, Border | Complex internal structure |
| `logbook` / `activity` | Background, Border | Entry rows; timestamps |
| `map` | Border only | iframe-like; no internal CSS access |

### Category H — Picture Cards
Picture fills the card visually. Background module irrelevant but border/radius still useful.

| Type | Icon Color | Notes |
|---|---|---|
| `picture` | ❌ | Image + tap area; border/radius only |
| `picture-entity` | ❌ | Image + entity overlay; border/radius + Filters |
| `picture-glance` | ✅ glance icons | Icons in the glance row support color |
| `picture-elements` | ⚠️ per element | Each element styled separately via Advanced |

### Category I — Content Cards
Text/data display. Limited styling hooks.

| Type | Keep | Notes |
|---|---|---|
| `markdown` | Background, Border, Filters | Content styled via Advanced (`.card-content h1` etc.) |
| `shopping-list` | Background, Border | Checkbox rows; limited hooks |
| `todo-list` | Background, Border | Same as shopping-list |
| `iframe` / `webpage` | Border only | Cross-origin prevents inner styling |
| `plant-status` | Background, Border, Accent | Domain card; limited hooks |
| `area` | Full (treat as tile-like) | Modern area card; ha-card + icons |

---

## Module Visibility Matrix

```
Module           | button tile entity glance heading entities sensor gauge h-graph thermostat media picture grid
─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────
Filters          |  ✅    ✅    ✅     ✅      ✅      ✅      ✅     ✅    ✅       ✅       ✅     ✅    ❌
Accent Color     |  ✅    ✅    ✅     ❌      ❌      ❌      ✅     ✅    ✅       ✅       ❌     ❌    ❌
Icon Color       |  ✅    ✅    ✅     ✅      ❌      ❌      ❌     ❌    ❌       ❌       ❌    ⚠️    ❌
Background       |  ✅    ✅    ✅     ✅      ✅      ✅      ✅     ✅    ✅       ✅       ✅     ❌    ❌
Animation        |  ✅    ✅    ✅     ✅      ❌      ✅      ✅     ❌    ❌       ❌       ❌     ❌    ❌
Border & Radius  |  ✅    ✅    ✅     ✅      ✅      ✅      ✅     ✅    ✅       ✅       ✅     ✅    ✅
Heading Style    |  ❌    ❌    ❌     ❌      ✅      ❌      ❌     ❌    ❌       ❌       ❌     ❌    ❌
Advanced CSS     |  ✅    ✅    ✅     ✅      ✅      ✅      ✅     ✅    ✅       ✅       ✅     ✅    ✅
Container Banner |  ❌    ❌    ❌     ❌      ❌      ❌      ❌     ❌    ❌       ❌       ❌     ❌    ✅
```

---

## Implementation Phases

### Phase 4 — Card-Type Awareness (Next)
**Goal:** Show/hide modules based on `config.type`. No new modules yet.

1. Add card type → module visibility lookup table in `cms-panel.ts`
2. Pass visibility flags down to each module as props
3. Modules that are hidden for this card type get `hidden` attribute (no render)
4. Show container-card banner for grid/stack/sections/conditional
5. Detect unknown card types → fall back to "show all" (safe default)

Effort: ~1 day. No new modules, just conditional rendering in `cms-panel.ts`.

### Phase 5 — Heading Card Module
**Goal:** Dedicated module replacing Icon Color for `heading` cards.

1. New `module-heading-style.ts`:
   - Font size slider → `ha-card .title p { font-size: Xpx; }`
   - Text color → `ha-card .title p { color: X; }`
   - Icon size → `ha-card .title ha-icon { --mdc-icon-size: Xpx; }`
   - Icon color → `ha-card .title ha-icon { color: X !important; }`
   - Alignment → `.container { justify-content: X !important; }`
2. New `HeadingModuleState` type
3. Generator: `headingStyleBlock()` function
4. Parser: detect `.title p` selector to round-trip

Effort: ~1 day.

### Phase 6 — Entities Card Row Styling (Complex)
**Goal:** Style individual entity rows within an `entities` card.

Challenge: Each row is a separate element. card-mod on the entities card
can target `.entity-row` but you need to address rows by index or entity.

Options:
- A) Per-row color list: user picks a color per entity in the list
- B) State-conditional row highlighting (enabled/on = color X)
- C) Just document in Advanced CSS with helpful selector hints

Recommendation: Start with option C (hints in Advanced), promote to A later.

### Phase 7 — Grid Card Child Picker (Complex)
**Goal:** Style cards inside a grid without manually navigating to each child.

Challenge: When editing a grid card, the Studio panel appears for the grid
(container). User needs to reach child cards.

Options:
- A) Show list of child card types; clicking one opens sub-Studio for that child
- B) Just show the container banner with clear instructions
- C) Detect when HA opens a child-card editor and attach there automatically

Recommendation: Start with option B (clear banner), research option C.

---

## Unknown/Custom Card Types
- If `config.type` is not in the known list, show all modules (safe default)
- Show a subtle info note: "Unknown card type — all modules shown. Some may not apply."
- Log the type to help us expand coverage

---

## Card Types NOT Worth Supporting
| Type | Reason |
|---|---|
| `iframe` / `webpage` | Cross-origin; only border/radius applies |
| `map` | Leaflet iframe; no CSS access to markers |
| `plant-status` | Deprecated; very few users |
| `energy-*` | SVG deep-DOM; Advanced CSS is the only real option |