# Threshold Colors Module - UI Mockup

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ 🎯 Threshold Colors                          [Toggle ON]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Entity ID                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ sensor.temperature                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Apply to                             [Icon Color ▼]          │
│                                                               │
│ Rules (evaluated top to bottom):                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ If value [<▼] [18    ] → [🎨 #2196F3] [×]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ If value [>=▼] [18    ] → [🎨 #4CAF50] [×]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ If value [>=▼] [24    ] → [🎨 #F44336] [×]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                    + Add Rule                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Default color                 [🎨 #888888] #888888          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Interactive Elements

### Header
- **Chevron (▼/▶)**: Click to collapse/expand module
- **Title**: "🎯 Threshold Colors" - identifies the module
- **Toggle Switch**: Enable/disable the entire module

### Entity ID Input
- Text input with monospace font
- Placeholder: "sensor.temperature"
- Full width input field
- Accepts any Home Assistant entity ID

### Apply To Dropdown
Options:
- Icon Color (affects `ha-state-icon`)
- Background (affects `ha-card` background)
- Text Color (affects `ha-card` text color)

### Rules Section

Each rule contains:
1. **Label**: "If value" (11px gray text)
2. **Operator Dropdown**:
   - `<` (less than)
   - `<=` (less than or equal)
   - `>` (greater than)
   - `>=` (greater than or equal)
   - `==` (equal)
   - `!=` (not equal)
3. **Number Input**: Threshold value (70px width)
4. **Arrow**: "→" (visual separator)
5. **Color Picker**: 32×24px color input
6. **Delete Button**: "×" (red background, removes rule)

### Add Rule Button
- Full width button
- Blue background (#2196F3 with 15% opacity)
- Text: "+ Add Rule"
- Adds new rule with defaults (< 0 → #2196F3)

### Default Color
- Color picker with label
- Shows hex value next to picker
- Applied when no rules match

## States

### Collapsed (Default when disabled)
```
┌─────────────────────────────────────────────────────────────┐
│ ▶ 🎯 Threshold Colors                          [Toggle OFF] │
└─────────────────────────────────────────────────────────────┘
```

### Expanded but Empty
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ 🎯 Threshold Colors                          [Toggle ON]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Entity ID                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Apply to                             [Icon Color ▼]          │
│                                                               │
│ Rules (evaluated top to bottom):                             │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                    + Add Rule                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Default color                 [🎨 #888888] #888888          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Theme Integration

The module uses Card-Mod Studio's shared styles:
- Background: `rgba(255, 255, 255, 0.04)` on hover
- Border: `var(--divider-color, #383838)`
- Text: `var(--primary-text-color, #e1e1e1)`
- Labels: `var(--secondary-text-color, #9e9e9e)`
- Inputs: Dark theme compatible with HA colors

## Positioning in Module List

The Threshold Colors module appears in this order:
1. Heading Style (heading cards only)
2. Visual Filters
3. Accent Color
4. Icon Color
5. **→ Threshold Colors ←** (NEW)
6. Background
7. Animation
8. Border
9. Advanced CSS

This placement makes sense because:
- Appears after Icon Color (similar functionality but more advanced)
- Appears before Background (can also affect background)
- Logically grouped with other color-related modules
