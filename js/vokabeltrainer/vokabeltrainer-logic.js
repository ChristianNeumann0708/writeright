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

    // --- Mode Check ---
    const isMultipleChoice = this.settings.suggestWords;

    const inputGroup = document.getElementById("training-input-group");
    const mcContainer = document.getElementById("training-multiple-choice-container");
    const checkBtn = document.getElementById("training-check-btn");

    if (isMultipleChoice) {
      // Multiple Choice Mode
      inputGroup.style.display = "none";
      mcContainer.style.display = "grid"; // or flex
      checkBtn.style.display = "none"; // Hide "Check" button as clicking option checks immediately

      this.renderMultipleChoiceOptions(v, mcContainer);
    } else {
      // Standard Text Mode
      inputGroup.style.display = "block";
      mcContainer.style.display = "none";
      checkBtn.style.display = "inline-block";
    }

    // Sprachrichtung

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
  },

  // --------------------------------------------------
  // Multiple Choice Helpers
  // --------------------------------------------------

  renderMultipleChoiceOptions(currentVokabel, container) {
    container.innerHTML = "";

    // 1. Richtige Antwort(en) bestimmen
    let correctAnswer = "";
    if (this.settings.direction === "de-en") {
      correctAnswer = currentVokabel.word; // Englisches Wort gesucht
    } else {
      // Deutsches Wort gesucht (oder eins davon)
      correctAnswer = currentVokabel.translation[0]; 
    }

    // 2. Distraktoren (Falsche Antworten) suchen
    const distractors = this.getDistractors(currentVokabel, 4);

    // 3. Mischen (Richtige Antwort + Distraktoren)
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    // 4. Buttons erstellen
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "mc-option-btn";
      btn.textContent = opt;
      
      btn.onclick = () => {
        // Sofort prüfen
        this.checkAnswer(opt);
      };

      container.appendChild(btn);
    });
  },

  getDistractors(currentVokabel, count) {
    const all = VokabelTrainerStorage.getAllVokabeln();
    const direction = this.settings.direction;
    
    // Potentielle Kandidaten filtern
    const candidates = all.filter(v => v.id !== currentVokabel.id);

    // Zufällig auswählen
    const selected = [];
    const maxTries = 50; // Schutz vor Endlosschleife
    let tries = 0;

    while (selected.length < count && tries < maxTries) {
      if (candidates.length === 0) break;

      const randomIndex = Math.floor(Math.random() * candidates.length);
      const randomVocab = candidates[randomIndex];
      
      // Wort holen passend zur Richtung
      let word = "";
      if (direction === "de-en") {
        word = randomVocab.word; // Englisch
      } else {
        // Deutsch (zufällige Übersetzung nehmen)
        if (randomVocab.translation.length > 0) {
           word = randomVocab.translation[Math.floor(Math.random() * randomVocab.translation.length)];
        }
      }

      if (word && !selected.includes(word)) {
        selected.push(word);
      }
      
      tries++;
    }

    // Fallback: Falls nicht genug Wörter da sind, fülle mit Platzhaltern (sollte bei >5 Vokabeln nicht passieren)
    while (selected.length < count) {
        selected.push("???"); 
    }

    return selected;
  }
};
