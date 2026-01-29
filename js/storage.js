const STORAGE_KEY = "words";
const SETTINGS_KEY = "wt_settings";

export const Storage = {
  load() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  },

  save(words) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  },

  loadSettings() {
    const json = localStorage.getItem(SETTINGS_KEY);

    // ⭐ Default-Werte
    const defaults = {
      useFehlerbilanz: false
    };

    if (!json) return defaults;

    try {
      return { ...defaults, ...JSON.parse(json) };
    } catch {
      return defaults;
    }
  },

  saveSettings(obj) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  },

  clearWordsEverywhere() {
  // localStorage löschen
    localStorage.removeItem(STORAGE_KEY);

    // IndexedDB löschen
    return indexedBackup.clear("WriteRightDB", "WriteRightStore");
  },

  resetWordStats() {
    const words = Storage.load();

    const resetWords = words.map(w => ({
      ...w,
      anzRichtig: 0,
      anzFalsch: 0,
      falscheVarianten: {}
    }));
    Storage.save(resetWords);
  }
};
