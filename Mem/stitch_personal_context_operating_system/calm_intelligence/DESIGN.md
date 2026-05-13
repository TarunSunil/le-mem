---
name: Calm Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c5c7c9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8f9194'
  outline-variant: '#44474a'
  surface-tint: '#c6c6c8'
  primary: '#ffffff'
  on-primary: '#2f3132'
  primary-container: '#e2e2e4'
  on-primary-container: '#636466'
  inverse-primary: '#5d5e60'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffffff'
  on-tertiary: '#490080'
  tertiary-container: '#f0dbff'
  on-tertiary-container: '#8a33d9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e4'
  primary-fixed-dim: '#c6c6c8'
  on-primary-fixed: '#1a1c1d'
  on-primary-fixed-variant: '#454749'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  element-gap: 16px
  section-margin: 40px
  safe-area: 32px
---

## Brand & Style

The design system is anchored in the concept of "Calm Intelligence"—a digital sanctuary for personal thought and memory. It balances the precision of artificial intelligence with the organic, fluid nature of human recollection. The aesthetic is deeply rooted in **Minimalism** and **Glassmorphism**, prioritizing focus through significant whitespace and soft, translucent layers.

The emotional goal is to reduce cognitive friction, making the act of documenting and retrieving memories feel effortless and meditative. The interface should feel "invisible," receding into the background to let the user's personal content emerge. The style is sophisticated, favoring high-contrast typography and ethereal depth over heavy borders or loud decorations.

## Colors

The palette is optimized for OLED displays and low-light environments, utilizing deep blacks (`#0A0A0A`) to create a sense of infinite depth. The primary typography provides a crisp, paper-like contrast in off-white (`#F5F5F7`), ensuring legibility without the harshness of pure white.

Accent colors are not applied as flat fills but as "ethereal glows" and muted gradients. Indigo and soft violet are used sparingly to signify intelligence and "active" memory states. Secondary text is rendered in soft grays to maintain a clear visual hierarchy and prevent the interface from feeling cluttered.

## Typography

This design system employs a dual-typeface strategy to distinguish between functional UI and personal narrative. 

**Newsreader** (Headings) provides an editorial, journal-like soul to the app. It should be used for titles, dates, and poignant quotes. Its high-contrast serifs evoke a feeling of timelessness.

**Inter** (Functional UI) handles the heavy lifting of navigation, input fields, and AI-generated metadata. It is chosen for its exceptional legibility at small sizes and its neutral, systematic character.

Avoid using bold weights for the serif typeface to maintain its refined elegance; use medium or semi-bold Inter for emphasis instead.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with an emphasis on "negative space as a feature." For mobile devices, a 4-column system is used with generous 24px side margins. 

Vertical spacing is intentionally loose. Elements should have room to "breathe," preventing the cognitive fatigue often associated with data-heavy AI apps. Content blocks should be separated by 40px margins to clearly demarcate different thoughts or memory clusters. Safe areas are strictly observed, ensuring the fluid, borderless components never feel cramped against the screen edges.

## Elevation & Depth

In place of traditional shadows, this design system uses **Tonal Layers** and **Glassmorphism** to convey hierarchy. 

1.  **Base Layer (#0A0A0A):** The infinite void. 
2.  **Surface Layer (#121212):** Used for primary containers, with a subtle 1px inner stroke of 10% opacity white to define edges without borders.
3.  **Floating Layer (Glass):** Elements like navigation bars or context menus use a backdrop blur (20px - 30px) and 60% translucent backgrounds.

Depth is further enhanced by "light leaks"—soft, blurred indigo or violet orbs placed behind glass containers to indicate the presence of AI activity or importance.

## Shapes

The shape language is organic and approachable. This design system utilizes **Pill-shaped** and highly rounded corners to mimic the "fluidity" of thought. 

Main content containers should use a 24px to 32px radius. Smaller interactive elements like chips or buttons should utilize a fully rounded (pill) style. Sharp corners are strictly avoided as they conflict with the "calm" brand attribute. The interplay between large radii and borderless containers creates a soft, modern silhouette that feels native to mobile touch interactions.

## Components

### Buttons
Primary actions use a high-contrast off-white fill with black text. Secondary actions should be "ghost" buttons with a subtle glass blur and no border, using only typography to signal interactivity.

### Cards & Memory Blocks
Cards are the primary vehicle for memories. They should have no visible border; instead, use a slightly lighter gray (`#121212`) than the background (`#0A0A0A`). The corners are rounded at 32px. Use a subtle inner-glow on the top edge for a tactile feel.

### Input Fields
Inputs should feel invisible until focused. Use a simple underline or a very soft, translucent background fill. The cursor should be the primary brand accent color.

### Chips & Tags
Used for "Memory Metadata." These are small, pill-shaped elements with a 10% opacity violet fill and 14px Inter typography.

### Progress & Loading
Instead of standard spinners, use "Fluid Orbs"—soft-edged gradients that pulse and shift shape slightly, representing the "thinking" state of the AI.

### Floating Action Button (FAB)
The FAB is the most prominent element, utilizing a vibrant indigo-to-violet gradient to represent the "Add Memory" function. It should sit above all layers with a soft, diffused glow (shadow) of the same color.