import { StorageCore } from "../common/storage.js";
import { indexedBackup } from "../common/backup.js";
import { Wort } from "./wort.js";

const STORAGE_KEY = "words";
const SETTINGS_KEY = "wt_settings";

export const WortStorage = {
  loadWords() {
    const raw = StorageCore.getItem(STORAGE_KEY) || [];
    return raw.map(obj => Wort.fromJSON(obj));
  },

  saveWords(words) {
    StorageCore.setItem(STORAGE_KEY, words.map(w => w.toJSON()));
    this.saveWordsToIndexedDB(words);
  },

  saveWordsToIndexedDB(words) {
    indexedBackup.save("WriteRightDB", "BackupStore", JSON.stringify(words));
  },

  loadSettings() {
    const defaults = {
      useFehlerbilanz: false,
      sortByMistakes: false,
      autoDeleteEnabled: false,
      autoDeleteThreshold: 10
    };
    const settings = StorageCore.getItem(SETTINGS_KEY);
    return { ...defaults, ...(settings || {}) };
  },

  saveSettings(obj) {
    StorageCore.setItem(SETTINGS_KEY, obj);
  },

  clearAll() {
    StorageCore.removeItem(STORAGE_KEY);
    StorageCore.removeItem(SETTINGS_KEY);
  },

  clearWordsEverywhere() {
    StorageCore.removeItem(STORAGE_KEY);
    return indexedBackup.clear("WriteRightDB", "BackupStore");
  }
};
