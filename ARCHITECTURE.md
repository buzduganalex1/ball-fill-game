# Ball Fill architecture

Ball Fill uses feature-first, domain-oriented modules behind a small app
bootstrap. The original runtime remains only as a compatibility/composition
facade while the extracted features own their rules, presentation, and
framework adapters.

## Dependency direction

```text
app/bootstrap
  -> application controllers + view models
      -> domains (pure rules and state)
  -> presentation components
  -> infrastructure adapters
```

Domains never access the DOM, Phaser, Capacitor, storage, clocks, or browser
globals. Application modules coordinate domain decisions through explicit
ports. Presentation modules own their DOM subtree, bindings, animation state,
and accessibility attributes. Infrastructure modules implement device,
rendering, persistence, and audio details.

## Source map

### Composition

- `src/main.ts`: imports styles and starts the application.
- `src/app/bootstrapApplication.ts`: application entry point.
- `src/legacy/runtime.js`: compatibility facade for remaining cross-feature
  orchestration and stable DOM contracts. New feature logic should not be
  added here.

### Domains

- `domains/campaign`: star requirements and performance evaluation.
- `domains/economy`: rewards, pack rolls, and purchase decisions.
- `domains/gameplay`: progress rules and the active-run state model.
- `domains/inventory`: ownership and equipped-ball invariants.
- `domains/onboarding`: first-run lesson decisions.
- `domains/profile`: persisted player profile and save serialization.

### Application

- `application/boosters`: booster input, unlock, cooldown, and run commands.
- `application/gameplay`: HUD view model and renderer-independent gameplay
  session orchestration.
- `application/home`: Home screen view model.
- `application/profile`: queued/flush save coordinator.
- `application/store`: Store screen view model.

### Presentation

- `presentation/assets`: canonical ball artwork mapping.
- `presentation/collection`: ordering, cards, equip interaction, and focus.
- `presentation/encounters`: boss/event warning overlay.
- `presentation/gameplay`: progress counter, growth token, bank/loss flights,
  checkpoint feedback, and coin HUD effects.
- `presentation/home`: Home screen rendering and navigation.
- `presentation/onboarding`: level guide and retained HUD coach.
- `presentation/pack`: pack reveal, equip status, transition, and effects.
- `presentation/results`: result requirements, wallet transfer, and confetti.
- `presentation/store`: store cards, purchase states, and portal transition.

### Infrastructure

- `infrastructure/audio`: procedural audio implementation.
- `infrastructure/rendering`: compatibility canvas renderer.
- `game/`: Phaser bridge, renderers, and focused geometry systems.
- `native/`: Capacitor lifecycle and haptic adapters.
- `state/`: save repository and migrations.

### Styles

`src/styles/legacy.css` is now an ordered import manifest. Its area files keep
the original cascade intact while allowing focused edits:

1. `00-foundation.css`
2. `10-gameplay.css`
3. `20-commerce-collection.css`
4. `30-responsive-layouts.css`
5. `40-theme-commerce.css`
6. `50-effects-home-results.css`

## Working rules

1. Put deterministic decisions in a domain module before wiring UI behavior.
2. Give each presenter its own DOM subtree or explicit shared HUD targets.
3. Pass cross-area behavior through callbacks/models rather than importing
   runtime globals.
4. Keep the save schema and public DOM selectors stable unless a migration and
   regression test intentionally change them.
5. Keep gameplay state renderer-independent; Phaser and canvas consume the
   same snapshot contract.
6. Add unit coverage for new rules and keep the mobile browser suite green.

## Verification

The refactor is guarded by TypeScript checking, 30 unit tests, a Vite
production build, and 16 Playwright mobile-browser scenarios. Android builds
are intentionally outside the fast browser iteration loop.

## Follow-up boundary

The compatibility runtime can be reduced further as navigation, result/run
settlement, admin tooling, and viewport composition receive dedicated owners.
Those are isolated follow-up slices; the current domain and feature modules do
not depend on completing them.
