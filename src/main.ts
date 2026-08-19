// The compatibility runtime still owns the proven simulation and DOM flows.
// Typed state/data modules and the Phaser renderer are imported from there while
// the renderer switch remains available for release rollback.
import './legacy/runtime.js';
