export class Vokabel {
  constructor({
    id = crypto.randomUUID(),
    word = "",
    translation = "",
    languageFrom = "de",
    languageTo = "en",
    examples = [],
    tags = [],
    lesson = "",
    stats = null,
    variantsWrong = {}
  } = {}) {
    this.id = id;
    this.word = word.trim();
    this.translation = translation.trim();
    this.languageFrom = languageFrom;
    this.languageTo = languageTo;
    this.examples = Array.isArray(examples) ? examples : [];
    this.tags = Array.isArray(tags) ? tags : [];
    this.lesson = lesson;

    this.stats = stats || {
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

  markCorrect() {
    this.stats.correct++;
    this.stats.streak++;
    this.stats.lastAsked = new Date().toISOString();
  }

  markWrong(variant = "") {
    this.stats.wrong++;
    this.stats.streak = 0;
    this.stats.lastAsked = new Date().toISOString();

    if (variant.trim()) {
      this.variantsWrong[variant] =
        (this.variantsWrong[variant] || 0) + 1;
    }
  }

  // Fehlerbilanz (z. B. für Sortierung)
  get fehlerbilanz() {
    return this.stats.wrong - this.stats.correct;
  }

  // ---------------------------------------
  // Serialisierung
  // ---------------------------------------

  toJSON() {
    return {
      id: this.id,
      word: this.word,
      translation: this.translation,
      languageFrom: this.languageFrom,
      languageTo: this.languageTo,
      examples: this.examples,
      tags: this.tags,
      lesson: this.lesson,
      stats: this.stats,
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
      word: obj.word ?? obj.text ?? "",
      translation: obj.translation ?? obj.meaning ?? "",
      languageFrom: obj.languageFrom ?? "de",
      languageTo: obj.languageTo ?? "en",
      examples: obj.examples ?? [],
      tags: obj.tags ?? [],
      lesson: obj.lesson ?? "",
      stats: obj.stats ?? {
        correct: obj.correct ?? 0,
        wrong: obj.wrong ?? 0,
        streak: obj.streak ?? 0,
        lastAsked: obj.lastAsked ?? null
      },
      variantsWrong: obj.variantsWrong ?? {}
    });
  }
}
