import { WortStorage } from "./worttrainer-storage.js";

export const WortLogic = {

  // NEU HIER EINSETZEN
  getScoreForWord(w, currentSort) {
    if (currentSort === "balance-asc") {
      return w.anzFalsch - w.anzRichtig;
    }
    return w.anzFalsch;
  },

  getListLabel(w, currentSort) {
    if (currentSort === "balance-asc") {
      const diff = w.anzFalsch - w.anzRichtig;
      const sign = diff > 0 ? "+" : "";
      const opacity = (w.anzFalsch === 0 && w.anzRichtig === 0) ? "0.4" : "1";
      return `<span style="font-size:0.8em;opacity:${opacity};">(⚖️ ${sign}${diff})</span>`;
    }
    if (currentSort === "errors-desc") {
      const opacity = w.anzFalsch === 0 ? "0.4" : "1";
      return `<span style="font-size:0.8em;opacity:${opacity};">(<span style="font-size: 0.9em;">❌</span> ${w.anzFalsch})</span>`;
    }
    return "";
  },
  // ENDE NEU

  wortListe: [],
  currentWord: null,
  currentIndex: -1,
  lastWord: null,
  lastIndex: -1,

  // NEU: Sperr-Puffer (Cooldown) gegen Doppelungen
  recentWords: [],
  recentLimit: 10,

  // ersetzt "ersterFehler"
  firstAttempt: true,

  // UI soll Buttons deaktivieren, wenn ein Fehler passiert
  disableButtons: false,

  autoDeleteEnabled: false,
  autoDeleteThreshold: 10,

  init(words) {
    this.wortListe = words;
    this.recentWords = []; // Cooldown reset bei Neustart

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

  computeWeight(w) {
    let wrong = w.anzFalsch || 0;
    let correct = w.anzRichtig || 0;
    
    // Unbekannte Wörter (nie geübt): mittlere Wichtigkeit als Kaltstart
    if (correct === 0 && wrong === 0) return 30;
    
    // Problemfälle: hohe Priorität je nach Fehler-Überschuss
    if (wrong > correct) return 100 + (wrong - correct) * 10;
    
    // Noch in der Lernphase (< 3 mal richtig): leicht erhöhte Priorität
    if (correct < 3) return 15;
    
    // Sitzt sehr sicher: kaum Priorität (nur noch für seltene Auffrischung)
    return 1;
  },

  weightedSampleSequence(items) {
    let pool = items.map(item => ({ item: item, weight: this.computeWeight(item) }));
    let result = [];
    
    while (pool.length > 0) {
        let totalWeight = pool.reduce((sum, el) => sum + el.weight, 0);
        let random = Math.random() * totalWeight;
        let current = 0;
        
        for (let j = 0; j < pool.length; j++) {
            current += pool[j].weight;
            if (current >= random) {
                result.push(pool[j].item);
                pool.splice(j, 1);
                break;
            }
        }
    }
    return result;
  },

  getNextWord(list) {
    this.firstAttempt = true;
    this.disableButtons = false;

    if (list.length === 0) return null;

    // Filter words that are currently in the cooldown list
    let available = list.filter(w => !this.recentWords.includes(w));
    
    // Fallback, falls die Originalliste kleiner ist als das Cooldown-Limit (Sicherheit)
    if (available.length === 0) {
       // Nimm alle, außer das absolut zuletzt getestete, damit sich nichts 2x hintereinander wiederholt
       let fallback = list.filter(w => w !== this.recentWords[this.recentWords.length - 1]);
       available = fallback.length > 0 ? fallback : list;
    }

    // Smarte Auswahl treffen
    const shuffled = this.weightedSampleSequence(available);
    const chosen = shuffled[0];

    // Ausgewähltes Wort in die Sperrliste legen und ggf. älteste Sperre aufheben
    this.recentWords.push(chosen);
    if (this.recentWords.length > this.recentLimit) {
        this.recentWords.shift();
    }

    return chosen;
  }
};
