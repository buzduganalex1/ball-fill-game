import type { SaveData } from '../../state/SaveData';

export type SaveSnapshotProvider = () => SaveData;
export type SaveWriter = (save: SaveData) => Promise<void>;

export interface SaveCoordinator {
  flush(): Promise<void>;
  queue(): void;
}

export function createSaveCoordinator(
  snapshot: SaveSnapshotProvider,
  write: SaveWriter,
): SaveCoordinator {
  let queued = false;

  async function flush(): Promise<void> {
    await write(snapshot());
  }

  function queue(): void {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      void flush();
    });
  }

  return { flush, queue };
}
