import { StorageCore } from "../common/storage.js";
import { Wort } from "./wort.js";
import { indexedBackup } from "../common/indexedBackup-global.js";

const STORAGE_KEY = "words";
const SETTINGS_KEY = "wt_settings";

export const WortStorage = {
  loadWords() {
    const raw = StorageCore.getItem(STORAGE_KEY) || [];
    return raw.map(obj => Wort.fromJSON(obj));
  },

  saveWords(words) {
    // 1. localStorage speichern
    StorageCore.setItem(STORAGE_KEY, words.map(w => w.toJSON()));

    // 2. IndexedDB speichern (zweite Sicherung)
    indexedBackup.save("WriteRightDB", "BackupStore", JSON.stringify(words));
  },

  saveWordsToIndexedDB(words) {
    // bleibt für Kompatibilität bestehen
    indexedBackup.save("WriteRightDB", "BackupStore", JSON.stringify(words));
  },

  loadSettings() {
    const defaults = {
      useFehlerbilanz: false,
      sortByMistakes: false,
      autoDeleteEnabled: false,
      autoDeleteThreshold: 10,
      tabletMode: false
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
  },

  resetWordStats() {
  const words = this.loadWords();

  const updated = words.map(w => {
    return new Wort(
      w.text,
      0, // anzRichtig
      0, // anzFalsch
      {} // falscheVarianten
    );
  });

  this.saveWords(updated);
}

};
