# My Learners — AISG red and navy art direction
*2 November 2026 · UI-only visual change*

## Principle

Build a recognisable **AISG red + navy** identity, not a uniformly navy reporting tool and not an indiscriminate red recolour. This is a design review and implementation using professional art-direction principles; it is **not** presented as work commissioned from a named external designer.

The composition deliberately uses red for **branding and active navigation**: right-hand panel of the Board hero, selected role, selected Board tab, featured editorial achievement tile, and selected comparison switches. Navy remains the foundation for body text, page structure and charted AISG data. White and warm neutral cards preserve reading clarity.

| Token | Colour | Purpose |
|---|---|---|
| AISG navy | `#10324E` | Structure, headings, primary canvas |
| Deep navy | `#0B263E` | Masthead and hero depth |
| AISG red | `#A71F35` | Brand hero, CTA, navigation selected |
| Deep red | `#88182D` | Red gradient and hover |
| Soft rose | `#FFF4F4` | Gentle editorial tint, not a data status |

## Important distinctions

- The four **performance indicator bands** have their own red/orange/sage/green palette, which is **not** changed by this theme.
- Red on the Board's editorial cards refers to **AISG**, not weak outcomes, wellbeing risk, or student need.
- AISG and worldwide IB Diploma chart lines keep their established data-series colours and numerical values. No result or scoring logic is modified.
- SSS and student-case markers are neutral and retain their existing semantics. Brand red is not used as a safeguarding category.
- Focus outlines remain a distinct, accessible blue to help keyboard users locate controls.

## Review criteria

1. Balance large areas of the AISG navy and crimson in the navigation and Board introduction, so red is unmistakably present on first view.
2. Preserve strong contrast on branded red surfaces (white on AISG red > 7:1).
3. Keep responsive Board, Student, Faculty, SSS and Leader layouts and all underlying table/cell semantics intact.
4. Preserve print legibility and reduced-motion settings.
5. Verify the new brand styles are loaded **after** the existing layout and evidence styles, with browser screenshot tests and regression checks.

## Delivery

New final CSS layer: `src/aisg-brand-duotone.css`. The colour system is self-contained, auditable and reversible. The existing `src/vision-ui.css` layout architecture remains unchanged.
