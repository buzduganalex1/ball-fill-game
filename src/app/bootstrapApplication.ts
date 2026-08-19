/**
 * Application composition root.
 *
 * New domains and presenters are assembled by the compatibility runtime while
 * the gameplay loop is migrated incrementally. Keeping that import here means
 * `main.ts` remains stable and the legacy boundary has one explicit entrance.
 */
export async function bootstrapApplication(): Promise<void> {
  await import('../legacy/runtime.js');
}
