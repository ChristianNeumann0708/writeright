import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";
import { Vokabel } from "../models/Vokabel.js";

export const VokabelLogic = {
  trainingList: [],
  currentIndex: 0,
  settings: null,
  timerId: null,
  timerInterval: null,
  remainingSeconds: 0,
  elapsedSeconds: 0,
  currentWordDirection: "de-en",
  sessionStats: { correct: 0, wrong: 0 },
  sessionHistory: [],

  init() {},

  computeWeight(v, direction) {
    let wrong = 0;
    let correct = 0;
    
    // Auswertung je nach gewählter Richtung
    if (direction === "de-en" || direction === "mixed") {
        wrong += (v.statsDEtoEN?.wrong || 0);
        correct += (v.statsDEtoEN?.correct || 0);
    }
    if (direction === "en-de" || direction === "mixed") {
        wrong += (v.statsENtoDE?.wrong || 0);
        correct += (v.statsENtoDE?.correct || 0);
    }
    
    // Unbekannte Wörter (nie geübt): mittlere bis hohe Wichtigkeit
    if (correct === 0 && wrong === 0) return 30;
    
    // Problemfälle: hohe Priorität je nach Fehler-Überschuss
    if (wrong > correct) return 100 + (wrong - correct) * 10;
    
    // Noch in der Lernphase (< 3 mal richtig): leicht erhöhte Priorität
    if (correct < 3) return 15;
    
    // Sitzt sehr sicher: kaum Priorität (nur noch für seltene Auffrischung)
    return 1;
  },

  weightedSampleSequence(items, direction) {
    let pool = items.map(item => ({ item: item, weight: this.computeWeight(item, direction) }));
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

  handleStopClick() {
    const summaryContainer = document.getElementById("training-summary-container");
    if (summaryContainer && summaryContainer.style.display === "block") {
        // Zusammenfassung wird gerade angezeigt -> Wir wollen jetzt endgültig ins Hauptmenü
        this.stopTraining();
        // VokabelUI hier sicherheitshalber asynchron oder gar nicht, aber wir updaten die Liste im Wrapper
        if (window.VokabelUI) window.VokabelUI.renderVocabList();
    } else {
        // Mitten im Training abgebrochen -> Wir wollen zur Auswertung
        this.endTrainingEarly();
    }
  },

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

    this.sessionStats = { correct: 0, wrong: 0 };
    this.sessionHistory = [];

    // 1) Vokabeln filtern
    const all = VokabelTrainerStorage.getAllVokabeln();
    let selected = all.filter(v => settings.lists.includes(v.list));

    if (settings.onlyHard) {
      selected = selected.filter(v => {
         const wrong = (v.statsENtoDE?.wrong || 0) + (v.statsDEtoEN?.wrong || 0);
         const correct = (v.statsENtoDE?.correct || 0) + (v.statsDEtoEN?.correct || 0);
         if (settings.hardModeType === "balance") {
             return wrong > correct;
         } else {
             return wrong > 0;
         }
      });
    }

    // Sortierung je nach Modus
    if (settings.mode === "once") {
        // Einmaliger Durchlauf: Einfach gut mischen, aber jedes Wort exakt 1x!
        selected = selected.sort(() => Math.random() - 0.5);
    } else {
        // count, time, all (Endlos): Smarte Sortierung (gewichtet)
        selected = this.weightedSampleSequence(selected, settings.direction);
        // Nach der smarten Auswahl noch einmal mischen, damit die vielen gezogenen "schweren" Wörter
        // sich schön verteilen und man nicht am Anfang erschlagen wird:
        selected = selected.sort(() => Math.random() - 0.5);
    }

    // Modus: Anzahl
    if (settings.mode === "count") {
      selected = selected.slice(0, settings.count);
    }

    this.trainingList = selected;
    this.currentIndex = 0;
    this.elapsedSeconds = 0;

    const timerText = document.getElementById("training-timer-text");
    if (timerText) timerText.style.display = "none";
    
    // Reset session UI immediately
    const sessionInfo = document.getElementById("session-info");
    if (sessionInfo) {
      sessionInfo.style.display = settings.hideStats ? "none" : "flex";
      this.updateSessionStatsUI();
    }

    if (settings.mode === "time") {
      this.remainingSeconds = settings.time * 60;
      this.timerId = setTimeout(() => {
        this.endTrainingByTime();
      }, this.remainingSeconds * 1000);

      if (timerText) {
        timerText.style.display = "inline-block";
        this.updateTimerUI(timerText, this.remainingSeconds);
      }
    }
    
    // Always start interval to count elapsed seconds
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateSessionStatsUI();
      
      if (settings.mode === "time") {
        this.remainingSeconds--;
        if (timerText) this.updateTimerUI(timerText, this.remainingSeconds);
        
        if (this.remainingSeconds <= 0 && this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
    }, 1000);

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
        stopBtn.textContent = "Auswerten & Beenden";
        stopBtn.style.backgroundColor = "#6c757d"; // Grau für Auswerten
        stopBtn.style.borderColor = "#6c757d";
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
    this.currentWordDirection = currentDirection;

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

    // Statistiken der Vokabel anzeigen
    const statsContainer = document.getElementById("training-word-stats");
    if (statsContainer) {
      if (this.settings.hideStats) {
        statsContainer.style.display = "none";
      } else {
        statsContainer.style.display = "flex";
        const stats = currentDirection === "de-en" ? v.statsDEtoEN : v.statsENtoDE;
        const balance = stats.correct - stats.wrong;
        statsContainer.innerHTML = `
          <span class="vocab-stat-badge stat-green">✅ ${stats.correct}</span>
          <span class="vocab-stat-badge stat-red"><span style="font-size: 0.9em;">❌</span> ${stats.wrong}</span>
          <span class="vocab-stat-badge stat-blue">⚖️ ${balance > 0 ? '+'+balance : balance}</span>
        `;
      }
    }
  },

  checkAnswer(answer) {
    const v = this.trainingList[this.currentIndex];
    const feedback = document.getElementById("training-feedback");

    const correctAnswers = [
      v.word.toLowerCase(),
      ...v.translation.map(t => t.toLowerCase())
    ];

    // Das Model Vokabel bringt Methoden wie `markCorrect` / `markWrong` mit.
    // Falls das Objekt im Array nur das pure JSON war, bauen wir hier eine echte Klasse:
    const vocabInstanz = typeof v.markCorrect === 'function' ? v : new Vokabel(v);
    
    // Richtige Logik-Richtung für Model ("ENtoDE" / "DEtoEN")
    const statDirection = this.currentWordDirection === "de-en" ? "DEtoEN" : "ENtoDE";
    const isRepetition = !!v._isRepetition;

    const isCorrect = correctAnswers.includes(answer.toLowerCase());

    if (!isRepetition) {
      this.sessionHistory.push({
        vokabel: v,
        direction: this.currentWordDirection,
        answer: answer,
        isCorrect: isCorrect
      });
    }

    if (isCorrect) {
      if (!this.settings.hideStats) {
        feedback.textContent = isRepetition ? "Richtig! (Wiederholung)" : "Richtig!";
        feedback.style.color = "green";
      } else {
        feedback.textContent = "";
      }
      
      if (vocabInstanz && typeof vocabInstanz.markCorrect === 'function' && !isRepetition) {
         vocabInstanz.markCorrect(statDirection);
      }
      if (!isRepetition) this.sessionStats.correct++;
    } else {
      if (!this.settings.hideStats) {
        feedback.textContent = `Falsch! Richtig wäre: ${v.word} – ${v.translation.join(", ")}`;
        feedback.style.color = "red";
      } else {
        feedback.textContent = "";
      }
      
      if (vocabInstanz && typeof vocabInstanz.markWrong === 'function' && !isRepetition) {
         vocabInstanz.markWrong(statDirection, answer);
      }
      if (!isRepetition) this.sessionStats.wrong++;
      
      // Fehlerhafte Vokabel wiederholen (ans Ende der Liste hängen)
      // Aber nur, wenn sie nicht schon eine Wiederholung IST (keine Endlosschleife)
      if (this.settings && this.settings.withRepeats && !isRepetition && this.settings.mode !== 'all') {
        v._isRepetition = true;
        this.trainingList.push(v);
      }
    }
    
    // Speichern (wir übergeben die aktualisierte oder neu erstellte Vokabel nur beim ersten Versuch)
    if (vocabInstanz && !isRepetition) {
      VokabelTrainerStorage.updateVokabel(vocabInstanz);
    }

    this.updateSessionStatsUI();

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

    const sessionInfo = document.getElementById("session-info");
    if (sessionInfo) sessionInfo.style.display = "none";

    const wordBox = document.getElementById("training-word");
    const progress = document.getElementById("training-progress-text");

    if (wordBox) wordBox.textContent = message;
    if (progress) progress.textContent = `${Math.min(this.currentIndex, this.trainingList.length)} / ${this.trainingList.length}`;
    
    const statsContainer = document.getElementById("training-word-stats");
    if (statsContainer) {
      const totalAttempted = this.sessionStats.correct + this.sessionStats.wrong;
      statsContainer.innerHTML = `
        <span class="vocab-stat-badge stat-blue">📚 ${totalAttempted} Vokabeln</span>
        <span class="vocab-stat-badge stat-green">✅ ${this.sessionStats.correct} Richtig</span>
        <span class="vocab-stat-badge stat-red"><span style="font-size: 0.9em;">❌</span> ${this.sessionStats.wrong} Falsch</span>
      `;
    }

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

    const summaryContainer = document.getElementById("training-summary-container");
    if (summaryContainer) {
      if (this.sessionHistory.length === 0) {
        summaryContainer.style.display = "none";
      } else {
        summaryContainer.style.display = "block";
        
        const min = Math.floor(this.elapsedSeconds / 60);
        const sec = this.elapsedSeconds % 60;
        const timeStr = `${min}:${sec.toString().padStart(2, "0")}`;
        const total = this.sessionStats.correct + this.sessionStats.wrong;

        let html = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin: 0;">Zusammenfassung</h3>
            <div style="display: flex; gap: 8px; font-size: 0.9em; flex-wrap: wrap;">
              <span class="vocab-stat-badge" style="background: #f0f0f0; border: 1px solid #ddd; color: #333;">⏱ ${timeStr}</span>
              <span class="vocab-stat-badge stat-blue">📚 ${total}</span>
              <span class="vocab-stat-badge stat-green">✅ ${this.sessionStats.correct}</span>
              <span class="vocab-stat-badge stat-red"><span style="font-size: 0.9em;">❌</span> ${this.sessionStats.wrong}</span>
            </div>
          </div>
          <ul class="vocab-list-inner" style="background:#fff; border:1px solid #eee; border-radius:8px; padding:0; max-height: 400px; overflow-y: auto;">
        `;
        
        this.sessionHistory.forEach(item => {
          const v = item.vokabel;
          const q = item.direction === "de-en" ? v.translation.join(", ") : v.word;
          const correctAns = item.direction === "de-en" ? v.word : v.translation.join(", ");
          
          const icon = item.isCorrect ? "✅" : '<span style="font-size: 0.9em;">❌</span>';
          const colorClass = item.isCorrect ? "stat-green" : "stat-red";
          
          let rightSideText = item.isCorrect ? "Richtig" : `Falsch: ${item.answer || "-"}`;
          if (item.answer && item.answer.trim().length === 0) {
              rightSideText = item.isCorrect ? "Richtig" : `Falsch (übersprungen)`;
          }

          html += `
            <li style="border-bottom: 1px solid #f0f0f0; padding: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${q}</div>
                <div style="font-size: 0.9em; opacity: 0.8;">${correctAns}</div>
              </div>
              <div class="vocab-stat-badge ${colorClass}" style="flex-shrink: 0; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                 ${icon} ${rightSideText}
              </div>
            </li>
          `;
        });
        html += `</ul>`;
        summaryContainer.innerHTML = html;
      }
    }
  },

  endTrainingByTime() {
    this.currentIndex = this.trainingList.length; // Force progress end
    this.finishTraining("Zeit abgelaufen! Training beendet.");
  },

  endTrainingEarly() {
    this.currentIndex = this.trainingList.length; // Force progress end
    this.finishTraining("Training vorzeitig beendet.");
  },

  updateTimerUI(element, seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const formatted = `${m}:${s.toString().padStart(2, "0")}`;
    element.textContent = `⏱ ${formatted} noch`;
  },

  updateSessionStatsUI() {
    const min = Math.floor(this.elapsedSeconds / 60);
    const sec = this.elapsedSeconds % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, "0")}`;
    
    const timeEl = document.getElementById("session-timer");
    if (timeEl) timeEl.textContent = `⏱ ${timeStr}`;
    
    const correctEl = document.getElementById("session-correct");
    if (correctEl) correctEl.textContent = `Richtig ✅ ${this.sessionStats.correct}`;
    
    const wrongEl = document.getElementById("session-wrong");
    if (wrongEl) wrongEl.innerHTML = `Falsch <span style="font-size: 0.9em;">❌</span> ${this.sessionStats.wrong}`;
    
    const totalEl = document.getElementById("session-total");
    const total = this.sessionStats.correct + this.sessionStats.wrong;
    if (totalEl) totalEl.textContent = `Gesamt 📚 ${total}`;
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
    
    // Session Info verstecken
    const sessionInfo = document.getElementById("session-info");
    if (sessionInfo) sessionInfo.style.display = "none";

    const feedback = document.getElementById("training-feedback");
    if (feedback) feedback.textContent = "";

    const summaryContainer = document.getElementById("training-summary-container");
    if (summaryContainer) {
       summaryContainer.style.display = "none";
       summaryContainer.innerHTML = "";
    }

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
