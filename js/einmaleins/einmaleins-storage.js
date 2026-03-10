import { AppStorage } from "../core/StorageService.js";
import { downloadJSON, readJSONFile } from "../common/fileHelpers.js";

const STORAGE_KEY = "einmaleins-data";

class EinmaleinsStorageClass {
  constructor() {
    this.data = {
      stats: {}
    };
  }

  async init() {
    await this.load();
  }

  async load() {
    let parsed = await AppStorage.getItem(STORAGE_KEY);
    if (!parsed || !parsed.stats) {
      parsed = { stats: {} };
    }
    this.data = parsed;
  }

  getStats(reihe, factor) {
    const key = `${reihe}_${factor}`;
    if (!this.data.stats[key]) {
      this.data.stats[key] = {
        mult: { correct: 0, wrong: 0, history: [] },
        div:  { correct: 0, wrong: 0, history: [] }
      };
    }
    return this.data.stats[key];
  }

  recordAnswer(reihe, factor, type, isCorrect, wrongAnswer = null) {
    const stats = this.getStats(reihe, factor);
    if (isCorrect) {
      stats[type].correct++;
    } else {
      stats[type].wrong++;
      if (wrongAnswer !== null && wrongAnswer !== "") {
        if (!stats[type].history.includes(wrongAnswer)) {
          stats[type].history.push(wrongAnswer);
        }
      }
    }
    this._save();
  }

  clearHistory(reihe, factor, type) {
    const stats = this.getStats(reihe, factor);
    stats[type].history = [];
    this._save();
  }

  resetStats() {
    this.data.stats = {};
    this._save();
  }

  downloadBackup() {
    downloadJSON(this.data, "einmaleins");
  }

  async restoreBackup(file) {
    try {
      const parsed = await readJSONFile(file);

      if (parsed && typeof parsed === "object" && "lists" in parsed && "vokabeln" in parsed) {
        throw new Error("wrong-format-vokabeltrainer");
      }

      let isWorttrainer = false;
      if (Array.isArray(parsed)) {
        isWorttrainer = parsed.length === 0 || parsed.some(item => typeof item === "object" && item !== null && ("text" in item || "Text" in item || "Name" in item));
      } else if (typeof parsed === "object" && parsed !== null) {
        isWorttrainer = ("text" in parsed || "Text" in parsed || "Name" in parsed);
      }

      if (isWorttrainer) {
        throw new Error("wrong-format-worttrainer");
      }

      if (!parsed || typeof parsed !== "object" || !("stats" in parsed)) {
        throw new Error("invalid-format");
      }

      this.data = parsed;
      this._save();
      return true;
    } catch (e) {
      throw e;
    }
  }

  _save() {
    AppStorage.setItem(STORAGE_KEY, this.data);
  }
}

export const EinmaleinsStorage = new EinmaleinsStorageClass();
