export class Vokabel {
  constructor({
    id = crypto.randomUUID(),
    word = "",
    translation = [],
    list = "default",

    statsENtoDE = null,
    statsDEtoEN = null,

    variantsWrong = {}
  } = {}) {

    this.id = id;
    this.word = word.trim();

    // Übersetzungen immer als Array speichern
    if (Array.isArray(translation)) {
      this.translation = translation.map(t => t.trim()).filter(t => t.length > 0);
    } else if (typeof translation === "string") {
      this.translation = translation
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);
    } else {
      this.translation = [];
    }

    this.list = list;

    // Statistik für EN → DE
    this.statsENtoDE = statsENtoDE || {
      correct: 0,
      wrong: 0,
      streak: 0,
      lastAsked: null
    };

    // Statistik für DE → EN
    this.statsDEtoEN = statsDEtoEN || {
      correct: 0,
      wrong: 0,
      streak: 0,
      lastAsked: null
    };

    this.variantsWrong = variantsWrong || {};
  }

  // ---------------------------------------
  // Lernlogik
  // ---------------------------------------

  markCorrect(direction = "ENtoDE") {
    const stats = direction === "DEtoEN" ? this.statsDEtoEN : this.statsENtoDE;
    stats.correct++;
    stats.streak++;
    stats.lastAsked = new Date().toISOString();
  }

  markWrong(direction = "ENtoDE", variant = "") {
    const stats = direction === "DEtoEN" ? this.statsDEtoEN : this.statsENtoDE;
    stats.wrong++;
    stats.streak = 0;
    stats.lastAsked = new Date().toISOString();

    if (variant.trim()) {
      this.variantsWrong[variant] = (this.variantsWrong[variant] || 0) + 1;
    }
  }

  // ---------------------------------------
  // Serialisierung
  // ---------------------------------------

  toJSON() {
    return {
      id: this.id,
      word: this.word,
      translation: this.translation,
      list: this.list,
      statsENtoDE: this.statsENtoDE,
      statsDEtoEN: this.statsDEtoEN,
      variantsWrong: this.variantsWrong
    };
  }

  // ---------------------------------------
  // Migration / Laden aus JSON
  // ---------------------------------------

  static fromJSON(obj) {
    if (!obj) return new Vokabel();

    return new Vokabel({
      id: obj.id ?? crypto.randomUUID(),
      word: obj.word ?? "",
      translation: obj.translation ?? [],
      list: obj.list ?? "default",

      statsENtoDE: obj.statsENtoDE ?? {
        correct: obj.correctENtoDE ?? 0,
        wrong: obj.wrongENtoDE ?? 0,
        streak: obj.streakENtoDE ?? 0,
        lastAsked: obj.lastAskedENtoDE ?? null
      },

      statsDEtoEN: obj.statsDEtoEN ?? {
        correct: obj.correctDEtoEN ?? 0,
        wrong: obj.wrongDEtoEN ?? 0,
        streak: obj.streakDEtoEN ?? 0,
        lastAsked: obj.lastAskedDEtoEN ?? null
      },

      variantsWrong: obj.variantsWrong ?? {}
    });
  }
}
