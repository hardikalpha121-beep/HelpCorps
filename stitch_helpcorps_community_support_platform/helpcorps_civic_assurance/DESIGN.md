---
name: HelpCorps Civic Assurance
colors:
  surface: '#f7f9ff'
  surface-dim: '#bfddff'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3efff'
  surface-container-high: '#d9eaff'
  surface-container-highest: '#cfe5ff'
  on-surface: '#001d33'
  on-surface-variant: '#454557'
  inverse-surface: '#003354'
  inverse-on-surface: '#e8f1ff'
  outline: '#757589'
  outline-variant: '#c5c4da'
  surface-tint: '#333dff'
  primary: '#0003c1'
  on-primary: '#ffffff'
  primary-container: '#1119fa'
  on-primary-container: '#b7bbff'
  inverse-primary: '#bec2ff'
  secondary: '#0040cb'
  on-secondary: '#ffffff'
  secondary-container: '#0e56fe'
  on-secondary-container: '#e4e7ff'
  tertiary: '#003a67'
  on-tertiary: '#ffffff'
  tertiary-container: '#00518d'
  on-tertiary-container: '#96c4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00016d'
  on-primary-fixed-variant: '#0005ed'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b5'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#a0c9ff'
  on-tertiary-fixed: '#001c37'
  on-tertiary-fixed-variant: '#00487f'
  background: '#f7f9ff'
  on-background: '#001d33'
  surface-variant: '#cfe5ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for an emergency mutual-aid, community response, and civic resilience network. The experience balances urgency with psychological calm. It avoids anxiety-inducing clutter and instead instills immediate clarity, institutional competence, and warm human solidarity.

The design movement synthesizes **High-Contrast Utilitarianism** with **Modern Tactile Accessible UI**:
- High-contrast, crystal-clear typography enables swift scannability during stress and accessibility under harsh sunlight or low-vision conditions.
- Precise structural containers, defined bounding strokes, and distinct physical hit-targets eliminate ambiguous click interactions.
- A controlled blue chromatic tier ranges from urgent electric engagement to grounding marine slate, reinforced by crisp white and slate neutrals.

## Colors

The palette delivers strict WCAG AAA / AA compliance, high contrast ratios, and purposeful semantic states:

- **Primary Brand (`#1119fa` - Electric Blue):** Reserved for primary emergency activations, critical action triggers, active tabs, and dominant focus boundaries. Delivers undeniable visual priority.
- **Secondary Accent (`#0553fc` - Deep Cobalt):** Used for interactive hovers, persistent navigational chrome, and structured section anchors.
- **Bright Accent / State (`#0595fc` - Sky Azure):** Applied to real-time status pulses, in-progress tasks, active telemetry, and informational badges.
- **Structural Slate (`#1d5f91` - Marine Teal Slate):** Grounding neutral for structural cards, non-urgent iconography, divider accents, and metadata labels.
- **Surface Scale:**
  - `canvas`: `#ffffff` (Pure Crisp White)
  - `surface-subtle`: `#f8fafc` (Off-White Slate canvas backdrop)
  - `surface-elevated`: `#ffffff` with `#e2e8f0` edge boundary
  - `border-default`: `#e2e8f0` (Crisp separation)
  - `border-strong`: `#cbd5e1`
- **Text & Foreground:**
  - `text-primary`: `#0f172a` (Deep Slate, ratio > 12:1 against light surfaces)
  - `text-secondary`: `#334155` (Mid Slate, ratio > 7:1)
  - `text-inverse`: `#ffffff`

## Typography

Typography prioritizes instantaneous reading comprehension under duress:
- **Display and Headers (`Plus Jakarta Sans`):** Geometrically firm with humanized apertures; provides authority without appearing cold or bureaucratic.
- **Body and Labels (`Inter`):** Renowned for x-height balance, distinct glyph disambiguation (e.g., distinguishing `1`, `l`, and `I`), and clarity at small resolutions.
- Numerical statistics (distance to help, ETA, kindness metrics, emergency radio frequencies) must consistently set `font-variant-numeric: tabular-nums` to prevent layout shift during live updates.

## Layout & Spacing

A 12-column responsive grid structures desktop interactions with a max-width container cap of 1280px to prevent visual detachment across ultra-wide monitors.

- **Breakpoints:**
  - Mobile: `< 640px` (4-column grid, `margin-mobile: 1rem`, `gutter-mobile: 1rem`)
  - Tablet: `640px - 1024px` (8-column grid, `margin: 1.5rem`, `gutter: 1.25rem`)
  - Desktop: `> 1024px` (12-column grid, `margin: 2rem`, `gutter: 1.5rem`)
- **Touch Target & Rhythm Rule:** Mobile actions require a minimum interactive target box of 48×48px. Stacking rhythm between form sections strictly follows `space-lg` to prevent accidental tapping during stress.

## Elevation & Depth

Visual hierarchy rejects fuzzy, low-contrast shadows in favor of **Crisp Structural Layering with Focused Directional Depth**:

- **Ground Level (Canvas):** `#f8fafc` background with zero elevation.
- **Level 1 (Cards, Modules, Feeds):** Pure `#ffffff` surface bordered by a crisp `1px solid #e2e8f0` line and an ambient settle: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Active Help Requests, Volunteers Nearby, Floating Navigation):** `1px solid #cbd5e1` with `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Emergency Modals, Evacuation Alerts):** `0 20px 25px -5px rgba(17, 25, 250, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.1)`, bounded by a `2px solid #1119fa` accent header.
- **Focus Rings:** Accessibility focus indicators utilize a solid `3px` offset stroke in `#1119fa` with `2px` white padding.

## Shapes

The design system maintains a balanced `0.5rem` (`roundedness: 2`) baseline radius for functional cards, inputs, and modular panels:
- **Cards and Panels:** `0.5rem` (`rounded-md` / `rounded-lg`) promotes structural stability without sharp hazardous edges.
- **Interactive Controls (Buttons, Inputs):** `0.5rem` corners deliver defined tactile affordance.
- **Badges, Status Indicators & Chips:** Pill styling (`rounded-full`) separates informational statuses and micro-data from actionable square-cornered containers.

## Components

### Buttons
- **Primary Action (SOS / Request Help):** Solid `#1119fa` background, `#ffffff` text, minimum height 48px, bold font (`label-lg`), subtle tactile inset shadow on active press. In high-threat context, transitions to pulsating outer perimeter.
- **Secondary Action (Volunteer / Offer Aid):** `#ffffff` background with `2px solid #0553fc`, text in `#0553fc`. Active hover fills with `rgba(5, 83, 252, 0.06)`.
- **Destructive / Cancellation:** Solid `#dc2626` or `#ffffff` with `2px solid #dc2626` and `#dc2626` text.

### Chips & Badges
- **Status Pills (Emergency & Safety):**
  - *Active Alert:* Light red fill (`#fef2f2`), `#b91c1c` text, `1px solid #fecaca`, with a solid `#ef4444` dot.
  - *Assistance En Route:* Light blue fill (`#eff6ff`), `#0553fc` text, `1px solid #bfdbfe`, animated pulse icon.
  - *Resolved / Safe:* Light emerald fill (`#ecfdf5`), `#047857` text, `1px solid #a7f3d0`.
- **Volunteer Badges:** Slate-tinted fill (`#f1f5f9`), `#1d5f91` typography, accompanied by a verified safety shield icon.
- **Kindness Score Chips:** Soft Azure backdrop (`#f0f9ff`), `#0595fc` perimeter, `#0c4a6e` bold numerical score, featuring an integrated icon indicator.

### Input Fields
- White background (`#ffffff`), `1.5px solid #cbd5e1`, `0.5rem` border radius, 48px height.
- Dynamic floating label or sticky top label in `#0f172a`.
- Focus state: border shifts to `#1119fa` with an accessible `3px` halo of `rgba(17, 25, 250, 0.2)`.

### Checkboxes & Radios
- Size: 24×24px hit targets with 44×44px click boundaries.
- Checked state: `#1119fa` solid fill with high-contrast `#ffffff` checkmark.
- Radio indicators retain a distinct 3px inner gap when selected.

### Cards & Dispatch Units
- White surface, `1px solid #e2e8f0`, separated into modular zones: header (urgency & time stamp), body (description & location radius), and bottom tactile action drawer.
- High-priority request cards display an edge-accentuated 4px solid `#1119fa` left border.

### Live Telemetry Bar
- Anchored bottom or top banner utilizing `#1d5f91` or `#0f172a` with white text, providing persistent offline-mode readiness, network connection health, and one-tap emergency call override.