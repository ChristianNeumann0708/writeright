import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";

export const VokabelLogic = {
  trainingList: [],
  currentIndex: 0,
  settings: null,
  timerId: null,
  timerInterval: null,
  remainingSeconds: 0,

  init() {},

  startTraining(settings) {
    this.settings = settings;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

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

    const timerText = document.getElementById("training-timer-text");
    if (timerText) timerText.style.display = "none";

    if (settings.mode === "time") {
      this.remainingSeconds = settings.time * 60;
      this.timerId = setTimeout(() => {
        this.endTrainingByTime();
      }, this.remainingSeconds * 1000);

      if (timerText) {
        timerText.style.display = "inline-block";
        this.updateTimerUI(timerText, this.remainingSeconds);
        this.timerInterval = setInterval(() => {
          this.remainingSeconds--;
          if (this.remainingSeconds <= 0) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          } else {
            this.updateTimerUI(timerText, this.remainingSeconds);
          }
        }, 1000);
      }
    }

    // 2) UI umschalten
    // Vokabelliste ausblenden
    const wordlist = document.querySelector(".trainer-wordlist");
    if (wordlist) wordlist.style.display = "none";

    // Trainingseinstellungen ausblenden
    document.getElementById("training-settings-panel").style.display = "none";

    // Trainingsmodus anzeigen
    document.getElementById("training-mode").style.display = "block";
    
    // Toggle Button für Einstellungen ausblenden
    const toggleBtn = document.getElementById("training-toggle-btn");
    if (toggleBtn) toggleBtn.style.display = "none";

    const stopBtn = document.getElementById("training-stop-btn");
    if (stopBtn) {
        stopBtn.textContent = "Training abbrechen";
        stopBtn.style.backgroundColor = ""; // Reset Style (Rot aus CSS)
        stopBtn.style.borderColor = "";
    }

    const skipBtn = document.getElementById("training-skip-btn");
    if (skipBtn) skipBtn.style.display = "inline-block";
    
    const feedback = document.getElementById("training-feedback");
    if (feedback) feedback.textContent = "";

    // 3) erstes Wort anzeigen
    this.showCurrentWord();

    // Eingabefeld fokussieren
    const answerInput = document.getElementById("training-answer");
    if (answerInput) {
      answerInput.value = "";
      answerInput.focus();
    }
  },

  showCurrentWord() {
    const wordBox = document.getElementById("training-word");
    const progress = document.getElementById("training-progress-text");

    if (this.currentIndex >= this.trainingList.length) {
      this.finishTraining("Training abgeschlossen!");
      return;
    }

    const v = this.trainingList[this.currentIndex];
    progress.textContent = `${this.currentIndex + 1} / ${this.trainingList.length}`;

    // --- Mode Check ---
    const isMultipleChoice = this.settings.suggestWords;

    const inputGroup = document.getElementById("training-input-group");
    const mcContainer = document.getElementById("training-multiple-choice-container");
    const checkBtn = document.getElementById("training-check-btn");

    // Sprachrichtung bestimmen
    let currentDirection = this.settings.direction;
    if (currentDirection === "mixed") {
      currentDirection = Math.random() < 0.5 ? "de-en" : "en-de";
    }

    if (currentDirection === "de-en") {
      wordBox.textContent = v.translation.join(", ");
    } else {
      wordBox.textContent = v.word;
    }

    if (isMultipleChoice) {
      // Multiple Choice Mode
      inputGroup.style.display = "none";
      mcContainer.style.display = "flex"; // Flex für Zentrierung (Align-Items im CSS greift)
      checkBtn.style.display = "none"; // Hide "Check" button as clicking option checks immediately

      this.renderMultipleChoiceOptions(v, mcContainer, currentDirection);
    } else {
      // Standard Text Mode
      inputGroup.style.display = "block";
      mcContainer.style.display = "none";
      checkBtn.style.display = "inline-block";
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

  finishTraining(message) {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const wordBox = document.getElementById("training-word");
    const progress = document.getElementById("training-progress-text");

    if (wordBox) wordBox.textContent = message;
    if (progress) progress.textContent = `${Math.min(this.currentIndex, this.trainingList.length)} / ${this.trainingList.length}`;
    
    const stopBtn = document.getElementById("training-stop-btn");
    if (stopBtn) {
      stopBtn.textContent = "Training beenden";
      stopBtn.style.backgroundColor = "#28a745"; // Grün
      stopBtn.style.borderColor = "#28a745";
    }

    document.getElementById("training-input-group").style.display = "none";
    document.getElementById("training-multiple-choice-container").style.display = "none";
    document.getElementById("training-check-btn").style.display = "none";
    document.getElementById("training-skip-btn").style.display = "none";
    
    const feedback = document.getElementById("training-feedback");
    if (feedback) feedback.textContent = "";
  },

  endTrainingByTime() {
    this.currentIndex = this.trainingList.length; // Force progress end
    this.finishTraining("Zeit abgelaufen! Training beendet.");
  },

  updateTimerUI(element, seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const formatted = `${m}:${s.toString().padStart(2, "0")}`;
    element.textContent = `⏱ ${formatted}`;
  },

  stopTraining() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Trainingsmodus ausblenden
    document.getElementById("training-mode").style.display = "none";

    // Trainingseinstellungen wieder anzeigen
    document.getElementById("training-settings-panel").style.display = "block";

    // Toggle Button wieder anzeigen
    const toggleBtn = document.getElementById("training-toggle-btn");
    if (toggleBtn) toggleBtn.style.display = "";

    // Vokabelliste wieder einblenden
    const wordlist = document.querySelector(".trainer-wordlist");
    if (wordlist) wordlist.style.display = "block";

    // NICHT: vocab-input-panel öffnen!
  },

  // --------------------------------------------------
  // Multiple Choice Helpers
  // --------------------------------------------------

  renderMultipleChoiceOptions(currentVokabel, container, currentDirection) {
    container.innerHTML = "";

    // 1. Richtige Antwort(en) bestimmen
    let correctAnswer = "";
    let correctAnswersAll = [];
    if (currentDirection === "de-en") {
      correctAnswer = currentVokabel.word; // Englisches Wort gesucht
      correctAnswersAll = [currentVokabel.word];
    } else {
      // Deutsches Wort gesucht (oder eins davon) - Hier fügen wir alle Übersetzungen zusammen zu einer Antwortoption!
      correctAnswer = currentVokabel.translation.join(", "); 
      correctAnswersAll = [correctAnswer, ...currentVokabel.translation]; // Alle Variationen zum Herausfiltern beibehalten
    }

    // 2. Distraktoren (Falsche Antworten) suchen
    const distractors = this.getDistractors(currentVokabel, 4, currentDirection, correctAnswersAll);

    // 3. Mischen (Richtige Antwort + Distraktoren)
    let options = [correctAnswer, ...distractors];
    options = [...new Set(options)].sort(() => Math.random() - 0.5);

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

  getDistractors(currentVokabel, count, currentDirection, correctAnswersAll) {
    const all = VokabelTrainerStorage.getAllVokabeln();
    
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
      if (currentDirection === "de-en") {
        word = randomVocab.word; // Englisch
      } else {
        // Deutsch (Alle Übersetzungen zusammenfassen)
        if (randomVocab.translation.length > 0) {
           word = randomVocab.translation.join(", ");
        }
      }

      if (word && !selected.includes(word) && !correctAnswersAll.includes(word)) {
        selected.push(word);
      }
      
      tries++;
    }

    // Fallback: Falls nicht genug Wörter da sind, fülle mit Platzhaltern (sollte bei >5 Vokabeln nicht passieren)
    let placeholderCount = 1;
    while (selected.length < count) {
        selected.push(`— ${placeholderCount++} —`); 
    }

    return selected;
  }
};
