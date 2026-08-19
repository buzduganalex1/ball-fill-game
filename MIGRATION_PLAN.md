# Ball Fill Game: Phaser + Capacitor Migration Plan

## Goal

Move the game from a 12,000+ line single HTML file to a maintainable Vite +
TypeScript project, render gameplay with Phaser 4/WebGL, keep the existing DOM
menus and visual style, and package the same build for web and Android with
Capacitor 8.

## Implementation Status (2026-08-19)

- Vite, TypeScript, Vitest and Playwright now provide the web build and test
  pipeline.
- CSS and runtime JavaScript have been extracted from `index.html`; balls,
  boosters, economy, encounters, persistence, growth-fit and coverage rules are
  separate typed modules.
- Phaser is the default arena renderer and is loaded only when gameplay is
  needed. Menus remain responsive DOM UI, and `?renderer=legacy` retains the
  known-good canvas renderer as a rollback path.
- Every ball uses one canonical PNG asset across gameplay, HUD, Store,
  Collection and Pack Opening. SVG source files remain beside them.
- Versioned progress is stored with Capacitor Preferences, including migration
  and malformed-save recovery tests.
- Android is configured with safe areas, portrait orientation, status/splash
  handling, background persistence, back-button navigation and native haptics.
  A debug APK builds successfully from the same `dist/` assets as the web app.
- Automated Pixel 7 flows cover first launch, touch gameplay, menu sleep,
  renderer rollback, save persistence, purchase, reveal, equip and return to
  play. Real-device FPS, heat and long-run memory profiling remain release
  validation because browser automation cannot reproduce device GPU/thermal
  behavior.

The compatibility runtime still owns the proven gameplay simulation while
Phaser owns rendering. This keeps all current levels, bosses, store and reward
flows working during rollout. Moving simulation ownership fully into Phaser
entities/scenes and deleting the rollback runtime is intentionally the final
cleanup after real-device parity measurements, as described in Phase 10.

The migration must remain playable after every phase. The current production
version stays available until the Phaser implementation reaches feature and
visual parity.

## Decisions

- Use **Vite + TypeScript** for the application and build pipeline.
- Use **Phaser 4.2** for the gameplay arena only.
- Keep Home, Store, Collection, Pack Opening, Results, Admin and navigation as
  HTML/CSS UI. This preserves their responsive layout and avoids drawing large
  amounts of text in the game canvas.
- Keep the current custom growth, coverage and collision rules initially. Do not
  switch to Arcade or Matter physics during the renderer migration because that
  would change game feel and add a second source of risk.
- Use one canonical asset per ball in `public/assets/balls/`, shared by Phaser
  and the DOM UI.
- Use Capacitor Preferences for lightweight progression storage on Android and
  its localStorage fallback on web.
- Use a temporary renderer switch (`legacy` / `phaser`) until parity is proven.

## Current-State Audit

- `index.html` contains about 7,600 lines of CSS, the complete UI markup, and
  about 5,200 lines of JavaScript.
- The canvas code owns input, growth, collision, enemies, bosses, coins,
  boosters, effects, audio, level completion and rendering.
- The DOM code owns Home, Store, Collection, Pack Opening, Results, Admin and
  navigation.
- Eleven canonical ball SVG assets already exist under `assets/balls/`.
- The game has 200 levels, an event every 5 levels, a mini-boss every 10 levels,
  and a world boss every 20 levels.
- Wallet, current level, owned balls, equipped ball, starter-pack state and
  unlocked boosters currently live only in memory. Only the tutorial flag is
  saved to localStorage. A versioned save system is therefore a required early
  migration step.
- `ball_fill_3_screen_demo_v36.html` remains a visual reference for the older
  boss presentation and must not become runtime code.

## Target Structure

```text
ball-fill-game/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ capacitor.config.ts
├─ public/
│  └─ assets/
│     ├─ balls/
│     ├─ enemies/
│     ├─ ui/
│     └─ audio/
├─ src/
│  ├─ main.ts
│  ├─ app/
│  │  ├─ AppController.ts
│  │  ├─ AppEvents.ts
│  │  └─ navigation.ts
│  ├─ data/
│  │  ├─ balls.ts
│  │  ├─ boosters.ts
│  │  ├─ encounters.ts
│  │  ├─ levels.ts
│  │  └─ economy.ts
│  ├─ state/
│  │  ├─ AppState.ts
│  │  ├─ SaveData.ts
│  │  ├─ SaveRepository.ts
│  │  └─ migrations.ts
│  ├─ game/
│  │  ├─ createGame.ts
│  │  ├─ GameBridge.ts
│  │  ├─ config.ts
│  │  ├─ scenes/
│  │  │  ├─ BootScene.ts
│  │  │  └─ PlayScene.ts
│  │  ├─ entities/
│  │  │  ├─ PlayerBall.ts
│  │  │  ├─ Enemy.ts
│  │  │  └─ Coin.ts
│  │  ├─ systems/
│  │  │  ├─ GrowthSystem.ts
│  │  │  ├─ CollisionSystem.ts
│  │  │  ├─ CoverageSystem.ts
│  │  │  ├─ EnemySystem.ts
│  │  │  ├─ BossSystem.ts
│  │  │  └─ BoosterSystem.ts
│  │  ├─ effects/
│  │  └─ audio/
│  ├─ ui/
│  │  ├─ dom.ts
│  │  ├─ screens/
│  │  │  ├─ HomeScreen.ts
│  │  │  ├─ StoreScreen.ts
│  │  │  ├─ CollectionScreen.ts
│  │  │  ├─ PackOpeningScreen.ts
│  │  │  ├─ ResultScreen.ts
│  │  │  └─ AdminScreen.ts
│  │  └─ components/
│  └─ styles/
│     ├─ tokens.css
│     ├─ base.css
│     ├─ game.css
│     ├─ screens.css
│     └─ effects.css
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ android/                 # Generated and maintained by Capacitor
```

## Ownership Boundary

The persistent application state and the active gameplay run must be separate.

### Application state owns

- Current level and highest completed level
- Wallet balance
- Owned and equipped balls
- Unlocked boosters
- Starter-pack and tutorial status
- Sound, reduced-motion and other settings

### Phaser PlayScene owns

- Time and balls remaining in the active run
- Placed and growing balls
- Enemies, bosses and coins
- Coverage and stars for the current run
- Active booster cooldowns and temporary effects

### Communication

The UI sends typed commands such as `startLevel`, `pauseGame`, `resumeGame` and
`useBooster`. Phaser emits typed events such as `coverageChanged`,
`coinCollected`, `runFinished` and `boosterUnlocked`. UI modules must not reach
inside a Scene to change entities directly.

## Save Format

Start with one JSON value under `ballFillSave`:

```ts
interface SaveDataV1 {
  version: 1;
  currentLevel: number;
  highestCompletedLevel: number;
  walletCoins: number;
  ownedBallIds: string[];
  equippedBallId: string;
  unlockedBoosterIds: string[];
  starterPackOpened: boolean;
  tutorialSeen: boolean;
  firstPackMilestoneSeen: boolean;
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
  };
}
```

On first launch, import `ballFillTutorialSeenV2` if it exists, create valid
defaults for everything else, and save V1. Every future schema change must add
a migration function and tests. Save after purchases, equipment changes, level
completion, booster unlocks and settings changes—not every animation frame.

## Step-by-Step Migration

### Phase 0 — Baseline and safety net

1. Keep the current deployment untouched and create a migration branch.
2. Capture reference screenshots for Home, Level 1, a rush level, a mini-boss,
   a world boss, Store, Collection, Pack Opening, win and defeat.
3. Add Playwright smoke tests for starter pack → Level 1, win/lose, navigation,
   buying a pack, equipping a ball and returning to play.
4. Record a real Android baseline: cold start, time to playable, average FPS,
   slow-frame count, memory after ten level restarts and touch latency.

**Gate:** No migration work starts until the smoke flow runs reliably against
the current game and baseline measurements are recorded.

### Phase 1 — Add Vite and TypeScript without changing gameplay

1. Add Vite, TypeScript, scripts for `dev`, `build`, `preview`, `test` and
   `test:e2e`.
2. Make Vite serve the existing HTML and assets with no visual changes.
3. Add strict TypeScript gradually; initially allow the extracted legacy module
   to remain JavaScript.
4. Verify Vercel serves the Vite `dist/` output.

**Gate:** Production and Vite builds produce the same screens and all legacy
smoke tests pass.

### Phase 2 — Mechanical file extraction

1. Move CSS from the inline `<style>` block into ordered stylesheet files.
2. Move the inline script into `src/legacy/legacyGame.ts` with the smallest
   possible compatibility changes.
3. Extract ball, booster, economy, boss and level configuration into typed data
   modules.
4. Extract pure math functions—distance, growth-fit, coverage and level
   configuration—without changing their formulas.
5. Replace the large element lookup object with small per-screen DOM modules.

**Gate:** Screenshot comparisons show no unintended changes and all gameplay
values match the legacy baseline.

### Phase 3 — Introduce application state and persistence

1. Create `AppState`, `SaveDataV1`, validation and migration functions.
2. Add `SaveRepository` backed by Capacitor Preferences, which falls back to
   localStorage on the web.
3. Move wallet, inventory, selected ball, current level, booster unlocks and
   settings out of module globals.
4. Make Store, Collection, Home and Results render from application state.
5. Add corrupted-save recovery and a developer-only reset-save command.

**Gate:** Progress survives browser refresh and Android app restart; malformed
saves recover safely; purchases cannot be applied twice.

### Phase 4 — Create the Phaser shell

1. Install Phaser 4.2 and create `BootScene` and an empty `PlayScene`.
2. Mount Phaser only inside the existing arena container.
3. Reproduce the current portrait canvas sizing and safe-area behavior.
4. Load the eleven canonical SVG ball assets once through the texture manager.
5. Sleep the PlayScene while Home, Store or Collection is active; pause it for
   modals that must leave gameplay visible.
6. Add a temporary renderer switch so tests can run the legacy and Phaser
   arenas from the same UI.

**Gate:** Phaser produces the correctly sized empty arena on mobile, rotates or
resizes safely, and performs zero gameplay updates while asleep.

### Phase 5 — Level 1 vertical slice

1. Port pointer/finger tracking and smooth following.
2. Port ball placement, growth, nearby-fit pushing and locking.
3. Port one normal enemy, collision, popping and enemy trail.
4. Port coins, timer, remaining balls, coverage and Level 1 completion.
5. Keep the existing DOM HUD and update it through `GameBridge` events.
6. Reuse the existing pure collision and coverage tests for both renderers.

**Gate:** Level 1 feels and scores the same in both renderers. Touch coordinates
must remain correct at all supported portrait sizes.

### Phase 6 — Complete balls, enemies and effects

1. Port all eleven ball abilities and their shared assets.
2. Port one- and two-layer shields, shield-hit dispersion and shield boundaries.
3. Port every enemy movement behavior, coin magnet behavior and frenzy.
4. Port screen shake, flashes, impact rings, trails and particles using pooled
   Phaser objects.
5. Generate or atlas small repeated visual elements so they batch efficiently.

**Gate:** A test matrix confirms each ball ability, enemy collision and booster
interaction. Repeated runs show no continuous entity or texture growth.

### Phase 7 — Events, mini-bosses, bosses and boosters

1. Port 5-level rush events and their reward multiplier.
2. Port 10-level mini-bosses and crowned presentation.
3. Port all 20-level world bosses and unique boss mechanics.
4. Port booster use, cooldowns, unlock rewards and visual feedback.
5. Verify levels 1–10 closely, then representative levels 20, 40, 100 and 200.

**Gate:** Boss warnings, abilities, rewards and unlocks match current behavior;
the first ten levels retain their tuned pacing.

### Phase 8 — Results, store and pack-flow integration

1. Connect win/defeat events to the existing result overlays.
2. Preserve win celebration, defeat slowdown/red treatment and coin cleanup.
3. Connect pack purchases and direct-ball purchases to the new state store.
4. Preserve pack-opening anticipation, reveal, equip and play-with-new-ball flow.
5. Confirm first-25-gold prompting happens exactly once and at the correct time.

**Gate:** Full loop passes: play → reward → store → open → equip → next level,
including insufficient-gold and duplicate cases.

### Phase 9 — Capacitor integration

1. Configure Capacitor 8 with `webDir: 'dist'` and add Android.
2. Install Preferences and required native configuration.
3. Add app lifecycle handling: pause/sleep on background, restore audio only
   after interaction, and save before backgrounding.
4. Apply Android safe-area, system-bar, orientation and back-button behavior.
5. Build a debug APK and test on at least one low/mid-range and one high-range
   Android device.

**Gate:** The same built assets work on Vercel and in the APK; app backgrounding
does not advance a level or lose progress.

### Phase 10 — Performance pass and cutover

1. Profile CPU, GPU, memory and garbage collection on real Android hardware.
2. Pool enemies, coins, particles and transient effects.
3. Cap effective device pixel ratio where higher resolution adds heat without a
   visible quality benefit.
4. Use texture atlases for repeated effects and avoid per-frame texture or text
   creation.
5. Remove renderer-switch overhead only after Phaser passes every gate.
6. Keep the last legacy deployment available as a rollback release, then remove
   legacy runtime code in a separate cleanup change.

**Gate:** Phaser is not released unless it matches functionality and meets or
beats the recorded Android baseline.

## Performance Acceptance Budget

- Target 60 FPS during normal play on the selected mid-range Android baseline.
- No sustained section below 50 FPS during first-ten-level gameplay or pack
  opening.
- No memory growth after ten level restart cycles once garbage collection has
  settled.
- No gameplay updates or canvas rendering while the PlayScene is sleeping.
- No repeated texture creation during gameplay.
- Touch-to-ball response must feel immediate and remain correctly aligned after
  resize, app resume and device rotation attempts.
- Phaser startup must not regress time-to-playable by more than 10% without an
  explicitly accepted visual or stability benefit.

## Test Matrix

- Portrait sizes: 360×800, 390×844, 412×915 and a tablet portrait viewport.
- Inputs: mouse, single-finger touch, interrupted touch and rapid taps.
- Flows: first launch, returning player, starter pack, insufficient gold,
  paid pack, duplicate, equip, win, defeat, replay and next level.
- Gameplay: normal level, rush, mini-boss, all world-boss mechanics and each
  booster.
- Lifecycle: refresh, background/resume, process restart, offline launch and
  corrupted save.
- Accessibility: reduced motion, readable mobile text, touch target size and
  clear disabled/equipped states.

## Release Strategy

1. Every phase gets its own reviewable commit and Vercel preview.
2. The legacy deployment remains the production rollback while Phaser is behind
   the renderer switch.
3. Internal APK builds begin after the Level 1 vertical slice, but store-ready
   APK work waits for full feature parity.
4. Final release is staged: internal testers, small external group, then full
   rollout after crash, performance and progression data are clean.

## Definition of Done

- No single source file acts as the whole application.
- Web and Android use the same `dist/` build.
- All current screens, balls, levels, bosses, boosters and purchase flows work.
- Player progression is versioned and persistent.
- Phaser gameplay meets the performance budget on real Android hardware.
- Legacy runtime code can be removed without changing user-visible behavior.

## Technical References

- [Phaser documentation](https://docs.phaser.io/)
- [Phaser scenes and lifecycle](https://docs.phaser.io/phaser/concepts/scenes)
- [Phaser Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager)
- [Phaser textures and atlases](https://docs.phaser.io/phaser/concepts/textures)
- [Capacitor documentation](https://capacitorjs.com/docs)
- [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
