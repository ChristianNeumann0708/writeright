import { AppStorage } from "../core/StorageService.js";

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
    const json = JSON.stringify(this.data, null, 2);
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const filename = `${stamp}_einmaleins-backup.json`;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  async restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result);

          if (parsed && typeof parsed === "object" && "lists" in parsed && "vokabeln" in parsed) {
             reject(new Error("wrong-format-vokabeltrainer"));
             return;
          }

          let isWorttrainer = false;
          if (Array.isArray(parsed)) {
             isWorttrainer = parsed.length === 0 || parsed.some(item => typeof item === "object" && item !== null && ("text" in item || "Text" in item || "Name" in item));
          } else if (typeof parsed === "object" && parsed !== null) {
             isWorttrainer = ("text" in parsed || "Text" in parsed || "Name" in parsed);
          }

          if (isWorttrainer) {
             reject(new Error("wrong-format-worttrainer"));
             return;
          }

          if (!parsed || typeof parsed !== "object" || !("stats" in parsed)) {
             reject(new Error("invalid-format"));
             return;
          }

          this.data = parsed;
          this._save();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  _save() {
    AppStorage.setItem(STORAGE_KEY, this.data);
  }
}

export const EinmaleinsStorage = new EinmaleinsStorageClass();
