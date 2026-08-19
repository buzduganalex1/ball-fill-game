import { Preferences } from '@capacitor/preferences';
import { DEFAULT_SAVE_DATA, SAVE_KEY, type SaveData } from './SaveData';
import { normalizeSaveData } from './migrations';

const LEGACY_TUTORIAL_KEY = 'ballFillTutorialSeenV2';

function legacyTutorialSeen(): boolean {
  try {
    return localStorage.getItem(LEGACY_TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

export async function loadSaveData(): Promise<SaveData> {
  try {
    const { value } = await Preferences.get({ key: SAVE_KEY });
    const parsed: unknown = value ? JSON.parse(value) : DEFAULT_SAVE_DATA;
    const normalized = normalizeSaveData(parsed, legacyTutorialSeen());
    await saveSaveData(normalized);
    return normalized;
  } catch (error) {
    console.warn('Save data could not be loaded; using safe defaults.', error);
    return normalizeSaveData(DEFAULT_SAVE_DATA, legacyTutorialSeen());
  }
}

export async function saveSaveData(save: SaveData): Promise<void> {
  const normalized = normalizeSaveData(save);
  try {
    await Preferences.set({ key: SAVE_KEY, value: JSON.stringify(normalized) });
  } catch (error) {
    console.warn('Save data could not be persisted.', error);
  }
}
