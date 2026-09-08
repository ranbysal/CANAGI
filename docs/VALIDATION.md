# Validation

Validated 2026-09-08. Source review was performed 2026-09-07.

## Automated checks

`node scripts/test-explorer.mjs` passes 27 checks against the actual application modules and refreshed records:

- All 516 unique NOC IDs, 485 employment values, 515 published wage values and 20,136,800 covered jobs.
- COPS category counts, missing value handling, inclusive filtering, AND/OR semantics, aliases, ties and sort directions.
- URL state, saved filters, selected careers, list position, explicit page destinations and legacy links.
- Full field partitions, shared denominators, pay quartiles and gap free decimal exposure bands.
- Three step scroll charge, upward discharge, timed nonoverlapping entry, return and reduced motion state sequences.
- Native wage unit preservation, per record annualization and verified software developer/nurse wage examples.
- All 516 evidence files, 900 original sub profiles, 39 activity inputs per profile, recomputed raw scores and sensitivity bounds.
- Tooltip panel geometry at all four viewport corners and a middle tile: inside viewport, clear of the hovered tile.
- Page and list/treemap transitions commit only after the completed exit; repeated activation, history cancellation, Escape, disposal and reduced motion are covered.
- Both treemaps use the approved reference palette and every base tile colour has at least 4.5:1 label contrast.

The production TypeScript and Vite build passed. No additional browser or physical device test was performed for this research redesign. The earlier release’s browser checks are not claimed as coverage for the new layout.

## Source and interaction review

Shared navigation supplies Visualizer, Career Explorer, Compare, divider, GitHub and EN on every screen. Home retains the approved return sequence. The Canadian art begins directly below the visualizer navigation with a gradual background fade. Tooltip dimensions are measured after rendering, movement follows the current pointer, and viewport/scroll changes dismiss stale hover state.

Filters dismiss on outside pointer interaction, focus leaving the control, or Escape. Evidence loads on demand and is cached by occupation. Errors provide an explicit message and preserve source links. No inference API, account feature, database or new dependency was added.

The new career directory wraps on small screens instead of using the former wide results table. Field plots share scales and responsive arrangements. Themes use shared variables; reduced motion overrides disable new chart animations.

The September 8 refinement adds restrained purple accents, the continuous teal, mint and pink map scale, a single navigation underline, and a raised artwork fade. The visualizer uses four headline metrics above three compact charts. Source dates and coverage are reflected on the launch page, visualizer and README. No newer observation period is implied by the redesign.

## Interpretation

The AI index is experimental and sensitive to its assumptions. Pay is annualized where hourly. Detailed employment remains based on 2023 observations. See `DATA_AUDIT.md` and `AI_EXPOSURE_METHOD.md` for the full limitations.
