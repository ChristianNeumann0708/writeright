import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";

export const VokabelLogic = {
  trainingList: [],
  currentIndex: 0,
  settings: null,

  init() {},

  startTraining(settings) {
    this.settings = settings;

    // 1) Vokabeln filtern
    const all = VokabelTrainerStorage.getAllVokabeln();
    let selected = all.filter(v => settings.lists.includes(v.list));

    if (settings.onlyHard) {
      selected = selected.filter(v => v.errors && v.errors > 0);
    }

    // Zufällige Reihenfolge (immer aktiv)
    selected = selected.sort(() => Math.random() - 0.5);

    // Modus: Anzahl
    if (settings.mode === "count") {
      selected = selected.slice(0, settings.count);
    }

    this.trainingList = selected;
    this.currentIndex = 0;

    // 2) UI umschalten
    // Vokabelliste ausblenden
    const wordlist = document.querySelector(".trainer-wordlist");
    if (wordlist) wordlist.style.display = "none";

    // Trainingseinstellungen ausblenden
    document.getElementById("training-settings-panel").style.display = "none";

    // Trainingsmodus anzeigen
    document.getElementById("training-mode").style.display = "block";

    // 3) erstes Wort anzeigen
    this.showCurrentWord();

    // Eingabefeld fokussieren
    const answerInput = document.getElementById("training-answer");
    if (answerInput) answerInput.focus();
  },

  showCurrentWord() {
    const wordBox = document.getElementById("training-word");
    const progress = document.getElementById("training-progress-text");

    if (this.currentIndex >= this.trainingList.length) {
      wordBox.textContent = "Training abgeschlossen!";
      progress.textContent = `${this.trainingList.length} / ${this.trainingList.length}`;
      return;
    }

    const v = this.trainingList[this.currentIndex];
    progress.textContent = `${this.currentIndex + 1} / ${this.trainingList.length}`;

    // Sprachrichtung
    if (this.settings.direction === "de-en") {
      wordBox.textContent = v.translation.join(", ");
    } else if (this.settings.direction === "en-de") {
      wordBox.textContent = v.word;
    } else {
      const random = Math.random() < 0.5;
      wordBox.textContent = random ? v.word : v.translation.join(", ");
    }
  },

  checkAnswer(answer) {
    const v = this.trainingList[this.currentIndex];
    const feedback = document.getElementById("training-feedback");

    const correctAnswers = [
      v.word.toLowerCase(),
      ...v.translation.map(t => t.toLowerCase())
    ];

    if (correctAnswers.includes(answer.toLowerCase())) {
      feedback.textContent = "Richtig!";
      feedback.style.color = "green";
    } else {
      feedback.textContent = `Falsch! Richtig wäre: ${v.word} – ${v.translation.join(", ")}`;
      feedback.style.color = "red";
    }

    this.currentIndex++;
    document.getElementById("training-answer").value = "";
    this.showCurrentWord();
  },

  skip() {
    this.currentIndex++;
    this.showCurrentWord();
  },

  stopTraining() {
    // Trainingsmodus ausblenden
    document.getElementById("training-mode").style.display = "none";

    // Trainingseinstellungen wieder anzeigen
    document.getElementById("training-settings-panel").style.display = "block";

    // Vokabelliste wieder einblenden
    const wordlist = document.querySelector(".trainer-wordlist");
    if (wordlist) wordlist.style.display = "block";

    // NICHT: vocab-input-panel öffnen!
  }
};
