import { AppStorage } from "../core/StorageService.js";
import { Wort } from "../models/Wort.js";

const STORAGE_KEY = "words";
const SETTINGS_KEY = "wt_settings";

export const WortStorage = {
  async loadWords() {
    const raw = await AppStorage.getItem(STORAGE_KEY) || [];
    return raw.map(obj => Wort.fromJSON(obj));
  },

  async saveWords(words) {
    await AppStorage.setItem(STORAGE_KEY, words.map(w => w.toJSON()));
  },

  loadSettings() {
    const defaults = {
      useFehlerbilanz: false,
      sortByMistakes: false,
      autoDeleteEnabled: false,
      autoDeleteThreshold: 10,
      tabletMode: false
    };
    const settings = AppStorage.getItemSync(SETTINGS_KEY);
    return { ...defaults, ...(settings || {}) };
  },

  saveSettings(obj) {
    AppStorage.setItem(SETTINGS_KEY, obj);
  },

  clearAll() {
    AppStorage.removeItem(STORAGE_KEY);
    AppStorage.removeItem(SETTINGS_KEY);
  },

  clearWordsEverywhere() {
    return AppStorage.removeItem(STORAGE_KEY);
  },

  async resetWordStats() {
    const words = await this.loadWords();

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
