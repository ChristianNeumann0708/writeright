import { WortStorage } from "./worttrainer-storage.js";

export const WortLogic = {
  wortListe: [],
  currentWord: null,
  currentIndex: -1,
  lastWord: null,
  lastIndex: -1,
  ersterFehler: true,
  autoDeleteEnabled: false,
  autoDeleteThreshold: 10,

  init(words) {
    this.wortListe = words;
    if (words.length > 0) {
      this.currentWord = this.getNextWord(words);
      this.currentIndex = words.indexOf(this.currentWord);
    }
  },

  markCorrect() {
    if (!this.currentWord) return;

    this.currentWord.richtigGeschrieben();

    if (this.autoDeleteEnabled &&
        this.currentWord.anzRichtig >= this.autoDeleteThreshold) {

      this.wortListe.splice(this.currentIndex, 1);
      WortStorage.saveWords(this.wortListe);

      this.nextWord();
      return;
    }

    WortStorage.saveWords(this.wortListe);

    if (this.ersterFehler) {
      this.ersterFehler = false;
    }

    this.nextWord();
  },

  markWrong() {
    if (!this.currentWord) return;

    this.currentWord.falschGeschrieben("");
    WortStorage.saveWords(this.wortListe);

    if (this.ersterFehler) {
      this.ersterFehler = false;
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
  },

  prevWord() {
    if (!this.lastWord) return;

    this.currentWord = this.lastWord;
    this.currentIndex = this.lastIndex;

    this.lastWord = null;
    this.lastIndex = -1;
  },

  nextWord() {
    if (this.wortListe.length === 0) return;

    this.lastWord = this.currentWord;
    this.lastIndex = this.currentIndex;

    this.currentWord = this.getNextWord(this.wortListe);
    this.currentIndex = this.wortListe.indexOf(this.currentWord);
  },

  getNextWord(list) {
    this.ersterFehler = true;

    if (list.length === 0) return null;

    if (Math.random() < 0.5) {
      return list[Math.floor(Math.random() * list.length)];
    }

    return this.getWeightedWord(list);
  },

  getWeightedWord(list) {
    const weighted = list.flatMap(w => {
      const score = this.getScoreForWord(w);
      const weight = Math.max(1, 1 + score);
      return Array(weight).fill(w);
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
  },

  getScoreForWord(w) {
    const settings = WortStorage.loadSettings();
    return settings.useFehlerbilanz
      ? w.anzFalsch - w.anzRichtig
      : w.anzFalsch;
  }
};
