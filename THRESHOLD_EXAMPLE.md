# Threshold Colors Module - Example Usage

## Overview

The Threshold Colors module allows you to dynamically change colors based on numeric entity values using comparison operators. Unlike simple on/off states, you can create multiple rules that compare sensor values.

## Example: Temperature Sensor

### Configuration

**Entity:** `sensor.temperature`
**Property:** Icon Color
**Rules:**
1. If value < 18 → Blue (#2196F3)
2. If value >= 18 and < 24 → Green (#4CAF50)
3. If value >= 24 → Red (#F44336)

### Generated CSS

```css
ha-state-icon {
  color: {{ '#2196F3' if states('sensor.temperature') | float(0) < 18 else ('#4CAF50' if states('sensor.temperature') | float(0) < 24 else '#F44336') }} !important;
}
```

## Example: Battery Level

### Configuration

**Entity:** `sensor.phone_battery`
**Property:** Background
**Rules:**
1. If value <= 20 → Red (#F44336)
2. If value <= 50 → Orange (#FF9800)
3. If value > 50 → Green (#4CAF50)

### Generated CSS

```css
ha-card {
  background: {{ '#F44336' if states('sensor.phone_battery') | float(0) <= 20 else ('#FF9800' if states('sensor.phone_battery') | float(0) <= 50 else '#4CAF50') }};
}
```

## Supported Operators

- `<` - Less than
- `<=` - Less than or equal to
- `>` - Greater than
- `>=` - Greater than or equal to
- `==` - Equal to
- `!=` - Not equal to

## Supported Properties

1. **Icon Color** - Changes the color of `ha-state-icon`
2. **Background** - Changes the background color of `ha-card`
3. **Text Color** - Changes the text color of `ha-card`

## How Rules Work

Rules are evaluated from **top to bottom**. The first rule that matches is applied. If no rule matches, the **default color** is used.

### Example Flow:

For temperature value of 22°C with rules:
1. Check: 22 < 18? → No
2. Check: 22 < 24? → Yes → Apply Green (#4CAF50)
3. (Remaining rules not evaluated)

## Notes

- Entity values are automatically converted to float with `| float(0)` in the Jinja2 template
- If the entity is unavailable or non-numeric, it defaults to 0
- Rules are processed sequentially, so order matters
- More specific rules should be placed before more general ones
