import { WortStorage } from "./worttrainer-storage.js";

export const WortLogic = {

  // NEU HIER EINSETZEN
  getScoreForWord(w, settings) {
    if (settings.useFehlerbilanz) {
      return w.anzFalsch - w.anzRichtig;
    }
    return w.anzFalsch;
  },

  getListLabel(w, settings) {
    if (settings.useFehlerbilanz) {
      const diff = w.anzFalsch - w.anzRichtig;
      const sign = diff > 0 ? "+" : "";
      return `${w.text} (Δ ${sign}${diff})`;
    }
    return `${w.text} (${w.anzFalsch}× falsch)`;
  },
  // ENDE NEU

  wortListe: [],
  currentWord: null,
  currentIndex: -1,
  lastWord: null,
  lastIndex: -1,

  // ersetzt "ersterFehler"
  firstAttempt: true,

  // UI soll Buttons deaktivieren, wenn ein Fehler passiert
  disableButtons: false,

  autoDeleteEnabled: false,
  autoDeleteThreshold: 10,

  init(words) {
    this.wortListe = words;

    if (words.length > 0) {
      this.currentWord = this.getNextWord(words);
      this.currentIndex = words.indexOf(this.currentWord);
    }

    this.firstAttempt = true;
    this.disableButtons = false;
  },

  markCorrect() {
    if (!this.currentWord) return;

    this.currentWord.richtigGeschrieben();
    WortStorage.saveWords(this.wortListe);

    // Auto-Delete
    if (this.autoDeleteEnabled &&
        this.currentWord.anzRichtig >= this.autoDeleteThreshold) {

      this.wortListe.splice(this.currentIndex, 1);
      WortStorage.saveWords(this.wortListe);

      this.nextWord();
      return;
    }

    // Session-Statistik nur beim ersten Versuch
    if (this.firstAttempt) {
      this.firstAttempt = false;
      this.disableButtons = false; // richtiges Wort deaktiviert Buttons NICHT
    }

    this.nextWord();
  },

  markWrong() {
    if (!this.currentWord) return;

    this.currentWord.falschGeschrieben("");
    WortStorage.saveWords(this.wortListe);

    // Session-Statistik nur beim ersten Fehler
    if (this.firstAttempt) {
      this.firstAttempt = false;
      this.disableButtons = true; // Fehler → Buttons deaktivieren
    }

    this.nextWord();
  },

  deleteCurrent() {
    if (!this.currentWord) return;

    this.wortListe.splice(this.currentIndex, 1);
    WortStorage.saveWords(this.wortListe);

    if (this.wortListe.length > 0) {
      this.currentWord = this.getNextWord(this.wortListe);
      this.currentIndex = this.wortListe.indexOf(this.currentWord);
    } else {
      this.currentWord = null;
      this.currentIndex = -1;
    }

    // Löschen zählt NICHT zur Session-Statistik
    this.firstAttempt = true;
    this.disableButtons = false;
  },

  prevWord() {
    if (!this.lastWord) return;

    this.currentWord = this.lastWord;
    this.currentIndex = this.lastIndex;

    this.lastWord = null;
    this.lastIndex = -1;

    // neuer Versuch
    this.firstAttempt = true;
    this.disableButtons = false;
  },

  nextWord() {
    if (this.wortListe.length === 0) return;

    this.lastWord = this.currentWord;
    this.lastIndex = this.currentIndex;

    this.currentWord = this.getNextWord(this.wortListe);
    this.currentIndex = this.wortListe.indexOf(this.currentWord);

    // neuer Versuch
    this.firstAttempt = true;
    this.disableButtons = false;
  },

  getNextWord(list) {
    this.firstAttempt = true;
    this.disableButtons = false;

    if (list.length === 0) return null;

    if (Math.random() < 0.5) {
      return list[Math.floor(Math.random() * list.length)];
    }

    return this.getWeightedWord(list);
  },

  getWeightedWord(list) {
    const settings = WortStorage.loadSettings();

    const weighted = list.flatMap(w => {
      const score = this.getScoreForWord(w, settings);
      const weight = Math.max(1, 1 + score);
      return Array(weight).fill(w);
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
  },

};
