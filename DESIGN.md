---
name: Lead Hunter
description: A dark, high-contrast prospecting console for Brazilian SMB lead generation
colors:
  bg: "#0e131b"
  surface: "#161d28"
  surface-2: "#1c2532"
  text: "#e7ecf3"
  divider: "#2a3441"
  signal-blue: "#4d8bff"
  signal-blue-100: "#15233d"
  signal-blue-200: "#1c2f52"
  signal-blue-400: "#6ea3ff"
  signal-blue-600: "#3b78f0"
  signal-blue-700: "#a9c6ff"
  signal-blue-800: "#c6d9ff"
  signal-blue-900: "#e6f0ff"
  ember-amber: "#f0a742"
  ember-amber-tag-bg: "#33260f"
  ember-amber-tag-text: "#f3c583"
  neutral-100: "#1a212c"
  neutral-200: "#222b37"
  neutral-300: "#2f3a47"
  neutral-400: "#465262"
  neutral-500: "#6a7683"
  neutral-600: "#8b95a2"
  neutral-700: "#a8b1bd"
  neutral-800: "#c6ccd5"
  neutral-900: "#e7ecf3"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "0.08em"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "#071023"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-600}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Lead Hunter

## Overview

**Creative North Star: "The Ops Console"**

Lead Hunter reads like an operator's console, not a marketing surface: a dark, high-contrast workspace built for someone scanning many leads fast and acting on them, not admiring the interface. Every visual decision serves legibility and status-at-a-glance over decoration — right angles, thick dividing lines, and a two-color temperature signal (quente/morno/frio — hot/warm/cold) that does real informational work rather than branding.

The system is confidently flat in its base layer — no rounded corners anywhere, borders instead of radius or shadow to separate content — but treats elevation as structural where it matters: floating panels (search card, legend, results drawer) and dialogs are real overlays sitting visibly above the map/document layer, marked by shadow, not just z-index.

**Key Characteristics:**
- Right-angle everything: 0px radius across buttons, cards, inputs, dialogs, tags
- Thick structural borders (1-2px, occasionally 3px for active state) as the primary content-separation device
- Heavy Archivo (weight 800) for every heading, label, and stat number — one voice, no secondary typeface
- Two-color signal system: Signal Blue for interactive/hot, Ember Amber for warm/secondary — never decorative, always tied to lead temperature or interactivity
- Shadows reserved for true overlays (dialogs, fixed floating panels); in-flow elements (kanban cards, lead cards) use borders only

## Colors

A restrained two-accent palette against a near-black base — color is a signal, not a mood.

### Primary
- **Signal Blue** (#4d8bff): The one interactive/hot color — primary buttons, active nav tabs, focus rings, links, and "quente" (hot lead) temperature tags. Has a full tonal ramp (100–900) for tag backgrounds and hover states.

### Secondary
- **Ember Amber** (#f0a742): Warm/moderate signal — "morno" (warm lead) temperature tags and Mensagens-view accents. Never used for primary actions.

### Neutral
- **Void** (#0e131b) — app background, the darkest surface.
- **Panel** (#161d28) — card/dialog/drawer surfaces, one step up from Void.
- **Panel Raised** (#1c2532) — input fields, one step up again.
- **Paper** (#e7ecf3) — primary text color and, inverted, the lightest neutral step (neutral-900).
- **Divider** (#2a3441) — the standard hairline/border color for non-emphasized separators.
- Neutral ramp (100→900, dark to light) backs tags, chart tracks, and muted text at varying opacity.

### Named Rules
**The Temperature Rule.** Color signals lead heat and nothing else. Signal Blue = quente, Ember Amber = morno, a neutral gray = frio. No other UI state borrows these hues for decoration.

## Typography

**Display/Body Font:** Archivo (with system-ui, sans-serif fallback) — a single typeface for the entire system, no secondary face.

**Character:** Heavy, confident, all-business. Weight 800 on every heading, label, and stat number reads as assertive and dashboard-like; body text stays at a comfortable 400-weight 15px for scanability during long lead-review sessions.

### Hierarchy
- **Display** (800, 38px, line-height 1): Painel view's big stat numbers (lead counts).
- **Headline** (800, 20px, line-height 1.12, -0.015em): Dialog titles, h4-level headings.
- **Title** (800, 16px, line-height 1.12, -0.015em): Section headers, h5-level headings.
- **Body** (400, 15px, line-height 1.55): All running text and copy.
- **Label** (800, 13px, letter-spacing 0.08em, uppercase): Kanban column headers, stat labels, small all-caps tags — the "control panel" register.

### Named Rules
**The One Voice Rule.** Every heading and label is Archivo 800, no exceptions — hierarchy comes from size, not from mixing weights or families.

## Layout

Full-bleed content area under a fixed 56px top nav (2px bottom border). The Mapa view treats the map as a canvas with fixed-position panels floating over it (search card top-left, legend bottom-left, results drawer full-height right) rather than a conventional scrolling page. Kanban and Painel views use bordered grid layouts (4-column kanban board, 4-column stat row) framed by a 2px outer border, with 2px dividers between cells/columns instead of gaps or cards-on-background.

Spacing scale is tight and consistent: 4 / 8 / 12 / 16 / 24 / 32px steps, used directly as padding/gap — no ad hoc values outside the scale.

## Elevation & Depth

**Structural.** Shadows are a real hierarchy signal, not ambient decoration: any element that floats above the base document layer — the search/legend cards on the map, the results drawer, all dialogs — carries `shadow-md` or `shadow-lg` to read as physically raised. Elements that live in-flow within a bordered grid (kanban cards, lead cards, stat cells) never use shadow; borders alone communicate their boundaries.

### Shadow Vocabulary
- **shadow-sm** (`0 1px 2px rgba(0,0,0,0.5)`): Smallest lift — WhatsApp preview bubble.
- **shadow-md** (`0 3px 10px rgba(0,0,0,0.55)`): Standard floating panel (legend card).
- **shadow-lg** (`0 8px 28px rgba(0,0,0,0.6)`): Highest layer — dialogs, the search card, the results drawer.

### Named Rules
**The Overlay Rule.** Shadow is earned by floating above the base layer, not applied by default. If it's in the document flow, it gets a border, not a shadow.

## Shapes

Right angles everywhere: `--radius-sm/md/lg` are all `0px`, with zero exceptions across buttons, inputs, cards, tags, and dialogs. Borders do the shaping work instead — most content uses a 1-2px `divider`-colored border; emphasis states (dialog frame, search card, results drawer, selected topnav tab) step up to a 2-3px border in the brighter `text` color or `accent` color.

### Named Rules
**The Right-Angle Rule.** No border-radius, anywhere, ever. Roundness would read as soft/consumer-friendly, which contradicts the console character.

## Components

### Buttons
- **Shape:** Right angles (0px radius), 1px border on secondary/icon variants.
- **Primary:** Signal Blue background, near-black (#071023) text, Archivo 800, 8px/14px padding.
- **Hover:** Primary darkens to signal-blue-600; secondary gets a faint white-alpha wash; ghost gets a faint blue-alpha wash.
- **Secondary / Ghost / Icon:** Secondary = transparent with divider border; Ghost = no border, blue text, used for low-emphasis inline actions; Icon = fixed 32x32px square, divider border.
- **Disabled:** 0.45 opacity (0.25–0.3 for icon/move buttons), no hover response.

### Tags (temperature chips)
- **Style:** Small (11px), no radius, 3px/10px padding, background+text pulled from the relevant temperature's tonal ramp (never a flat saturated fill).
- **Variants:** `tag-quente` (blue-100 bg / blue-700 text), `tag-morno` (amber-tag-bg / amber-tag-text), `tag-frio` (neutral-200 bg / neutral-700 text), `tag-outline` (transparent, blue border+text).

### Cards / Containers
- **Corner Style:** 0px radius, always.
- **Background:** `surface` (#161d28), one step above the page background.
- **Shadow Strategy:** None for in-flow cards (kanban-card, lead-card) — border only. Elevated only when the card is a floating overlay (see Elevation & Depth).
- **Border:** 1px divider-colored by default; lead-card gains a 3px accent-colored left border when selected.
- **Internal Padding:** 12px (space-3) standard.

### Inputs / Fields
- **Style:** `surface-2` background, 2px divider border, 0px radius, 36px min-height.
- **Hover:** Border brightens to a higher-opacity white.
- **Focus:** Border becomes Signal Blue, background drops one step darker to `surface`.

### Navigation
- **Style:** Top nav tabs are text-only (Archivo 800, 14px), full-height clickable area, no background change on active — a 3px bottom border in Signal Blue plus blue text color marks the active tab. Inactive tabs lighten slightly on hover, no border.

### Dialog (signature component)
- Centered overlay, dark 60%-opacity scrim behind it. The dialog itself breaks the "border = divider color" default: it takes a 2px border in the brightest text color (not divider), signaling it's the highest-priority element on screen, plus `shadow-lg`.

## Do's and Don'ts

### Do:
- **Do** keep 0px radius on every new component, including anything built for per-lead demo sites or client work under this system.
- **Do** reserve Signal Blue and Ember Amber strictly for interactivity and lead-temperature signaling — never as generic decoration.
- **Do** use borders (not shadow) to separate in-flow/document-level elements; reserve shadow for genuine overlays.
- **Do** set headings and labels in Archivo 800 — never mix in a lighter weight or second typeface for hierarchy.
- **Do** use the 4/8/12/16/24/32px spacing scale for all new spacing; don't introduce arbitrary values.

### Don't:
- **Don't** add rounded corners anywhere, at any radius, for any reason.
- **Don't** introduce a third accent hue — the temperature system is exactly two colors plus neutral for "frio".
- **Don't** apply shadow to elements that live inside a bordered grid or list (kanban cards, lead cards, stat cells).
- **Don't** use decorative motion or transitions beyond simple color/background changes on hover/focus — the console character is about legibility, not liveliness.
