import { EinmaleinsLogic } from "./einmaleins-logic.js";
import { EinmaleinsStorage } from "./einmaleins-storage.js";

// DOM Elements - Left Column
const sortTrigger = document.getElementById("einmaleins-sort-trigger");
const sortOptions = document.getElementById("einmaleins-sort-options");
const sortLabel = document.getElementById("einmaleins-sort-label");
const listSelect = document.getElementById("einmaleins-list-select");
const listDisplay = document.getElementById("einmaleins-list-display");
const totalCount = document.getElementById("einmaleins-total-count");

// DOM Elements - Settings
const listDropdownToggle = document.getElementById("list-dropdown-toggle");
const listDropdownPanel = document.getElementById("list-dropdown-panel");
const selectAllBtn = document.getElementById("training-select-all-btn");
const selectNoneBtn = document.getElementById("training-select-none-btn");
const startBtn = document.getElementById("training-start-btn");
const previewDiv = document.getElementById("training-preview");

// DOM Elements - Training
const trainingPanel = document.getElementById("training-mode");
const settingsPanel = document.getElementById("training-settings-panel");
const stopBtn = document.getElementById("training-stop-btn");
const checkBtn = document.getElementById("training-check-btn");
const inputGroup = document.getElementById("training-input-group");
const answerInput = document.getElementById("training-answer");
const feedbackArea = document.getElementById("training-feedback");
const progressText = document.getElementById("training-progress-text");
const taskDisplay = document.getElementById("training-task");
const multipleChoiceContainer = document.getElementById("training-multiple-choice-container");
const summaryContainer = document.getElementById("training-summary-container");

// Session Info
const sessionInfo = document.getElementById("session-info");
const sessionTimerDisplay = document.getElementById("session-timer-display");
const sessionTimerVal = document.getElementById("session-timer-val");
const sessionCorrect = document.getElementById("session-correct");
const sessionWrong = document.getElementById("session-wrong");
const sessionTotal = document.getElementById("session-total");

// DOM Elements - Parent Mode
const parentModeGroup = document.getElementById("training-parent-mode-group");
const parentBtnCorrect = document.getElementById("parent-btn-correct");
const parentBtnWrong = document.getElementById("parent-btn-wrong");
const parentWrongInputArea = document.getElementById("parent-wrong-input-area");
const parentWrongInput = document.getElementById("parent-wrong-answer");
const parentBtnNext = document.getElementById("parent-btn-next");
const parentTranslation = document.getElementById("parent-translation");
const parentHistoricVariants = document.getElementById("parent-historic-variants");

export const EinmaleinsUI = {
  currentSort: 'asc', // 'asc', 'errors-desc', 'balance-asc', 'diff-desc'
  
  training: {
    active: false,
    tasks: [],
    currentIndex: 0,
    stats: { correct: 0, wrong: 0, total: 0 },
    repeats: [],
    timerInterval: null,
    timeLeft: 5
  },

  init() {
    this.setupEventListeners();
    const divToggle = document.getElementById("global-division-toggle");
    if (divToggle) {
        divToggle.checked = localStorage.getItem("einmaleins-division-on") === "true";
    }
    this.applyDivisionToggleState();
    this.renderList();
    this.updatePreview();
  },

  applyDivisionToggleState() {
    const divToggle = document.getElementById("global-division-toggle");
    if (!divToggle) return;
    
    const isOn = divToggle.checked;
    const divRadio = document.querySelector('input[name="training-type"][value="div"]');
    const mixedRadio = document.querySelector('input[name="training-type"][value="mixed"]');
    const multRadio = document.querySelector('input[name="training-type"][value="mult"]');
    
    if (!isOn) {
      if (divRadio.checked || mixedRadio.checked) multRadio.checked = true;
      divRadio.disabled = true;
      mixedRadio.disabled = true;
      divRadio.parentElement.style.opacity = "0.4";
      mixedRadio.parentElement.style.opacity = "0.4";
    } else {
      divRadio.disabled = false;
      mixedRadio.disabled = false;
      divRadio.parentElement.style.opacity = "1";
      mixedRadio.parentElement.style.opacity = "1";
    }
  },

  setupEventListeners() {
    // Custom Sort Dropdown
    if (sortTrigger) {
      sortTrigger.addEventListener('click', (e) => {
        sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block';
        e.stopPropagation();
      });
      document.addEventListener('click', () => {
        if (sortOptions) sortOptions.style.display = 'none';
      });
      sortOptions.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', (e) => {
          this.currentSort = e.target.getAttribute('data-value');
          sortLabel.textContent = e.target.textContent;
          this.renderList();
        });
      });
    }

    if (listSelect) {
      listSelect.addEventListener('change', () => this.renderList());
    }

    // Dropdown replaced by permanent list

    const divToggle = document.getElementById("global-division-toggle");
    if (divToggle) {
      divToggle.addEventListener("change", () => {
        localStorage.setItem("einmaleins-division-on", divToggle.checked);
        this.applyDivisionToggleState();
        this.renderList();
        this.updatePreview();
      });
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.training-list-checkbox').forEach(cb => cb.checked = true);
        this.updatePreview();
      });
    }

    if (selectNoneBtn) {
      selectNoneBtn.addEventListener('click', () => {
        document.querySelectorAll('.training-list-checkbox').forEach(cb => cb.checked = false);
        this.updatePreview();
      });
    }

    // Preview updater
    document.querySelectorAll('input[name="training-type"], input[name="training-mode"], .training-list-checkbox, input[name="hard-mode-type"]').forEach(el => {
      el.addEventListener('change', () => this.updatePreview());
    });
    
    document.getElementById("training-count-input")?.addEventListener('input', () => this.updatePreview());
    document.getElementById("training-time-input")?.addEventListener('input', () => this.updatePreview());
    
    document.getElementById("training-only-hard").addEventListener("change", (e) => {
      document.getElementById("training-hard-options").style.display = e.target.checked ? "flex" : "none";
      this.updatePreview();
    });

    document.querySelectorAll("input[name='training-mode']").forEach(r => {
      r.addEventListener("change", () => {
        const mode = r.value;
        document.querySelectorAll(".training-mode-field").forEach(f => f.classList.remove("active"));
        if (mode === "count") {
          document.getElementById("training-mode-count").classList.add("active");
        } else if (mode === "time") {
          document.getElementById("training-mode-time").classList.add("active");
        } else if (mode === "once") {
          document.getElementById("training-mode-once").classList.add("active");
        } else if (mode === "all") {
          document.getElementById("training-mode-all").classList.add("active");
        }
        this.updatePreview();
      });
    });

    if (startBtn) startBtn.addEventListener('click', () => this.startTraining());
    if (stopBtn) stopBtn.addEventListener('click', () => {
        if (stopBtn.textContent === "Training beenden") {
            this.closeTraining();
        } else {
            this.finishTraining("Training vorzeitig beendet.");
        }
    });

    if (checkBtn) {
      checkBtn.addEventListener("click", () => this.checkSelectedAnswer());
    }
    
    if (answerInput) {
      answerInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.checkSelectedAnswer();
        }
      });
    }

    const skipBtn = document.getElementById("training-skip-btn");
    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        this.handleIncorrectAnswer(null); 
        this.nextTask();
      });
    }

    // PARENT MODE BUTTONS
    if (parentBtnCorrect) {
      parentBtnCorrect.addEventListener("click", () => {
        this.handleCorrectAnswer();
        this.nextTask();
      });
    }

    if (parentBtnWrong) {
      parentBtnWrong.addEventListener("click", () => {
        parentBtnCorrect.disabled = true;
        parentBtnCorrect.style.opacity = "0.5";
        parentBtnWrong.disabled = true;
        parentBtnWrong.style.opacity = "0.5";
        
        if (parentWrongInputArea) parentWrongInputArea.style.display = "flex";
        if (parentWrongInput) {
            parentWrongInput.value = "";
            parentWrongInput.focus();
        }
        this.handleIncorrectAnswer(""); // vorerst markieren
      });
    }

    if (parentWrongInput) {
      parentWrongInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          let val = parentWrongInput.value.trim();
          if (val) {
            const task = this.training.tasks[this.training.currentIndex];
            EinmaleinsStorage.recordAnswer(task.reihe, task.factor, task.taskType, false, val);
            parentWrongInput.value = "";
            parentWrongInput.placeholder = "Gespeichert!";
            setTimeout(() => { if(parentWrongInput) parentWrongInput.placeholder = ""; }, 1500);
            this.updateParentVariantsUI(task);
          }
        }
      });
    }

    if (parentBtnNext) {
       parentBtnNext.addEventListener("click", () => {
           this.nextTask();
       });
    }

  },

  getAllPossibleTasks() {
    let all = [];
    const divToggle = document.getElementById("global-division-toggle");
    const isDivOn = divToggle ? divToggle.checked : true;
    const type = isDivOn ? 'mixed' : 'mult';
    
    for(let r=1; r<=10; r++) {
      all = all.concat(EinmaleinsLogic.generateTasks([r], type));
    }
    return all;
  },

  renderList() {
    const filterReihe = listSelect.value;
    let allTasks = this.getAllPossibleTasks();

    if (filterReihe !== 'all') {
      const r = parseInt(filterReihe, 10);
      allTasks = allTasks.filter(t => t.reihe === r);
    }

    allTasks = allTasks.map(t => {
      const stats = EinmaleinsStorage.getStats(t.reihe, t.factor)[t.taskType];
      return { 
        ...t, 
        errs: stats.wrong, 
        corr: stats.correct,
        diff: stats.wrong - stats.correct 
      };
    });

    if (this.currentSort === 'errors-desc') {
      allTasks.sort((a,b) => b.errs - a.errs);
    } else if (this.currentSort === 'balance-asc') {
      allTasks.sort((a,b) => b.diff - a.diff);
    } else if (this.currentSort === 'diff-desc') {
      allTasks.sort((a,b) => b.diff - a.diff);
    } 

    totalCount.textContent = `${allTasks.length} Aufgaben gefunden`;
    
    if (this.currentSort === 'asc') {
      let html = '';
      for (let r=1; r<=10; r++) {
        const tasksOfReihe = allTasks.filter(t => t.reihe === r);
        if (tasksOfReihe.length === 0) continue;

        html += `<div class="vocab-group">
          <div class="vocab-group-header">${r}er Reihe</div>`;
        
        const multTasks = tasksOfReihe.filter(t => t.taskType === 'mult');
        const divTasks = tasksOfReihe.filter(t => t.taskType === 'div');
        
        for (let t of multTasks) {
          html += this.createTaskHTML(t);
        }
        
        if (multTasks.length > 0 && divTasks.length > 0) {
          html += `<div style="height: 1px; background: #ddd; margin: 8px 12px; border-radius: 1px;"></div>`;
        }
        
        for (let t of divTasks) {
          html += this.createTaskHTML(t);
        }
        
        html += `</div>`;
      }
      listDisplay.innerHTML = html;
    } else {
      let html = '<div class="vocab-group">';
      for (let t of allTasks) {
        html += this.createTaskHTML(t);
      }
      html += '</div>';
      listDisplay.innerHTML = html;
    }
  },

  createTaskHTML(t) {
    let typeIcon = t.taskType === 'mult' ? '✖' : '➗';
    let errColor = t.errs > 0 ? '#dc3545' : '#28a745';
    if(t.errs === 0 && t.corr === 0) errColor = '#6c757d';

    return `
      <div class="vocab-item" style="display:flex; justify-content:space-between; padding:8px 12px; border-bottom:1px solid #eee;">
        <span style="font-weight:bold; width:120px; display:inline-block;">${t.question}</span>
        <span style="color:#007bff; font-weight:bold;">${t.answer}</span>
        <span style="color:${errColor}; font-size:0.9em;">
          ${t.corr} R / ${t.errs} F
        </span>
      </div>
    `;
  },

  getSettings() {
    const reihen = Array.from(document.querySelectorAll('.training-list-checkbox:checked')).map(cb => parseInt(cb.value, 10));
    const type = document.querySelector('input[name="training-type"]:checked')?.value || 'mult';
    const mode = document.querySelector('input[name="training-mode"]:checked')?.value || 'once';
    const onlyHard = document.getElementById("training-only-hard")?.checked || false;
    const hardModeType = document.querySelector('input[name="hard-mode-type"]:checked')?.value || 'errors';
    const multipleChoice = document.getElementById("training-suggest-words")?.checked || false;
    const parentMode = document.getElementById("training-parent-mode")?.checked || false;
    const hideStats = document.getElementById("training-hide-stats")?.checked || false;
    const withRepeats = document.getElementById("training-with-repeats")?.checked || false;
    const withTimer = document.getElementById("training-with-timer")?.checked || false;
    const count = parseInt(document.getElementById("training-count-input")?.value || "20", 10);
    const time = parseInt(document.getElementById("training-time-input")?.value || "10", 10);

    return { reihen, type, mode, onlyHard, hardModeType, multipleChoice, parentMode, hideStats, withRepeats, withTimer, count, time };
  },

  updatePreview() {
    const settings = this.getSettings();
    if (settings.reihen.length === 0) {
       previewDiv.textContent = "Bitte wähle mindestens eine Zahlenreihe aus.";
       startBtn.disabled = true;
       return;
    }
    
    startBtn.disabled = false;
    const tempTasks = EinmaleinsLogic.generateTraining(settings);
    
    if (tempTasks.length === 0) {
       previewDiv.textContent = "Mit diesen Einstellungen wurden 0 Aufgaben gefunden (z.B. weil du 'Nur Schwierige' aktiviert hast, aber noch keine Fehler existieren).";
       startBtn.disabled = true;
       return;
    }
    
    if (settings.mode === 'once' || settings.mode === 'count') {
      previewDiv.textContent = `Es werden ${tempTasks.length} Aufgabe(n) trainiert.`;
    } else if (settings.mode === 'time') {
      previewDiv.textContent = `Es wird ${settings.time} Minute(n) lang trainiert (${tempTasks.length} mögliche Basis-Aufgabe(n)).`;
    } else {
      previewDiv.textContent = `Endlos-Training mit ${tempTasks.length} Aufgabe(n).`;
    }
  },

  startTraining() {
    const settings = this.getSettings();
    this.training.tasks = EinmaleinsLogic.generateTraining(settings);
    this.training.currentIndex = 0;
    this.training.stats = { correct: 0, wrong: 0, total: this.training.tasks.length };
    this.training.settings = settings;
    this.training.repeats = [];
    this.training.sessionHistory = [];
    this.training.active = true;

    if (settings.hideStats) {
      sessionInfo.style.display = "none";
    } else {
      sessionInfo.style.display = "block";
    }

    settingsPanel.style.display = "none";
    trainingPanel.style.display = "block";
    summaryContainer.style.display = "none";
    feedbackArea.textContent = "";

    stopBtn.textContent = "Auswerten & Beenden";
    stopBtn.style.backgroundColor = "#6c757d";
    stopBtn.style.borderColor = "#6c757d";

    window.isTrainingActive = true;
    
    if (settings.withTimer) {
      sessionTimerDisplay.style.display = "block";
    } else {
      sessionTimerDisplay.style.display = "none";
    }

    this.updateSessionStats();
    this.renderTask();
  },

  finishTraining(msg = "Training beendet.") {
    if (this.training.timerInterval) clearInterval(this.training.timerInterval);

    sessionInfo.style.display = "none";
    taskDisplay.textContent = msg;

    inputGroup.style.display = "none";
    multipleChoiceContainer.style.display = "none";
    parentModeGroup.style.display = "none";
    document.getElementById("training-check-btn").style.display = "none";
    document.getElementById("training-skip-btn").style.display = "none";
    feedbackArea.style.display = "none";

    stopBtn.textContent = "Training beenden";
    stopBtn.style.backgroundColor = "#28a745";
    stopBtn.style.borderColor = "#28a745";

    summaryContainer.style.display = "block";

    const s = this.training.stats;
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <h3 style="margin: 0;">Auswertung</h3>
        <div style="display: flex; gap: 8px; font-size: 0.9em; flex-wrap: wrap;">
          <span class="vocab-stat-badge stat-blue">📚 ${s.correct + s.wrong}</span>
          <span class="vocab-stat-badge stat-green">✅ ${s.correct}</span>
          <span class="vocab-stat-badge stat-red"><span style="font-size: 0.9em;">❌</span> ${s.wrong}</span>
        </div>
      </div>
    `;

    if (this.training.sessionHistory && this.training.sessionHistory.length > 0) {
       html += `<ul class="vocab-list-inner" style="background:#fff; border:1px solid #eee; border-radius:8px; padding:0; max-height: 400px; overflow-y: auto;">`;
       
       this.training.sessionHistory.forEach(item => {
          const t = item.task;
          const icon = item.isCorrect ? "✅" : '<span style="font-size: 0.9em;">❌</span>';
          const colorClass = item.isCorrect ? "stat-green" : "stat-red";
          let rightSideText = item.isCorrect ? "Richtig" : `Falsch: ${item.answer || "-"}`;
          
          if (item.answer && item.answer.trim().length === 0) {
              rightSideText = item.isCorrect ? "Richtig" : `Falsch (übersprungen)`;
          }

          const globalStats = EinmaleinsStorage.getStats(t.reihe, t.factor)[t.taskType];
          
          let variantsHtml = "";
          if (globalStats.history && globalStats.history.length > 0) {
             const uniqueErrors = [...new Set(globalStats.history)].join(", ");
             variantsHtml = `<div style="font-size: 0.85em; color: #888; margin-top: 4px;">Typische Fehler: ${uniqueErrors}</div>`;
          }

          html += `
            <li style="border-bottom: 1px solid #f0f0f0; padding: 10px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${t.question}</div>
                <div style="font-size: 0.9em; opacity: 0.8; margin-bottom: 4px;">Lösung: ${t.answer}</div>
                <div style="font-size: 0.8em; color: #666; display: flex; gap: 8px;">
                   <span title="Gesamt Richtig" style="color: #28a745;">✅ ${globalStats.correct}</span> 
                   <span title="Gesamt Falsch" style="color: #dc3545;">❌ ${globalStats.wrong}</span>
                </div>
                ${variantsHtml}
              </div>
              <div class="vocab-stat-badge ${colorClass}" style="flex-shrink: 0; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; align-self: center;">
                 ${icon} ${rightSideText}
              </div>
            </li>
          `;
       });
       html += `</ul>`;
    } else {
       html += `<p>Du hast keine Aufgaben bearbeitet.</p>`;
    }

    summaryContainer.innerHTML = html;
  },

  closeTraining() {
    this.training.active = false;
    window.isTrainingActive = false;
    
    if (this.training.timerInterval) clearInterval(this.training.timerInterval);

    trainingPanel.style.display = "none";
    summaryContainer.style.display = "none";
    settingsPanel.style.display = "block";

    this.renderList(); // Update statistics visually
  },

  updateSessionStats() {
    sessionCorrect.innerHTML = `Richtig 🟢 ${this.training.stats.correct}`;
    sessionWrong.innerHTML = `Falsch 🔴 ${this.training.stats.wrong}`;
    const done = this.training.stats.correct + this.training.stats.wrong;
    sessionTotal.innerHTML = `Gesamt 📚 ${done} / ${this.training.tasks.length}`;
  },

  renderTask() {
    if (this.training.currentIndex >= this.training.tasks.length) {
      if (this.training.settings.withRepeats && this.training.repeats.length > 0) {
         this.training.tasks = this.training.tasks.concat(this.training.repeats);
         this.training.repeats = [];
      } else if (this.training.settings.mode === 'all') {
         // Generate fresh infinite tasks
         let newTasks = EinmaleinsLogic.generateTraining(this.training.settings);
         this.training.tasks = this.training.tasks.concat(newTasks);
      } else {
         this.finishTraining("Training abgeschlossen!");
         return;
      }
    }

    const task = this.training.tasks[this.training.currentIndex];
    
    taskDisplay.textContent = task.question;
    progressText.textContent = `${this.training.currentIndex + 1} / ${this.training.tasks.length}`;

    // Reset UI state
    feedbackArea.textContent = "";
    feedbackArea.className = "training-feedback";
    
    if (this.training.settings.multipleChoice) {
      inputGroup.style.display = "none";
      multipleChoiceContainer.style.display = "flex";
      parentModeGroup.style.display = "none";
      
      const options = EinmaleinsLogic.generateMultipleChoiceOptions(task);
      multipleChoiceContainer.innerHTML = "";
      options.forEach(opt => {
         const btn = document.createElement("button");
         btn.textContent = opt;
         btn.className = "mc-option-btn";
         btn.onclick = () => {
             answerInput.value = opt;
             this.checkSelectedAnswer();
         };
         multipleChoiceContainer.appendChild(btn);
      });
      document.getElementById("training-check-btn").style.display = "none"; 
      document.getElementById("training-skip-btn").style.display = "inline-block"; 
    } else if (this.training.settings.parentMode) {
      inputGroup.style.display = "none";
      multipleChoiceContainer.style.display = "none";
      parentModeGroup.style.display = "block";
      document.getElementById("training-check-btn").style.display = "none";
      document.getElementById("training-skip-btn").style.display = "none";
      
      parentTranslation.textContent = task.answer;
      parentBtnCorrect.disabled = false;
      parentBtnCorrect.style.opacity = "1";
      parentBtnWrong.disabled = false;
      parentBtnWrong.style.opacity = "1";
      parentWrongInputArea.style.display = "none";
      
      this.updateParentVariantsUI(task);

    } else {
      // Normal Input mode
      inputGroup.style.display = "block";
      multipleChoiceContainer.style.display = "none";
      parentModeGroup.style.display = "none";
      answerInput.value = "";
      answerInput.focus();
      document.getElementById("training-check-btn").style.display = "inline-block";
      document.getElementById("training-skip-btn").style.display = "inline-block";
    }

    if (this.training.settings.withTimer) {
      this.training.timeLeft = 5;
      sessionTimerVal.textContent = this.training.timeLeft;
      if (this.training.timerInterval) clearInterval(this.training.timerInterval);
      this.training.timerInterval = setInterval(() => {
         this.training.timeLeft--;
         sessionTimerVal.textContent = this.training.timeLeft;
         if (this.training.timeLeft <= 0) {
            clearInterval(this.training.timerInterval);
            this.handleTimeOut();
         }
      }, 1000);
    }
  },

  updateParentVariantsUI(task) {
      const stats = EinmaleinsStorage.getStats(task.reihe, task.factor)[task.taskType];
      if (stats.history && stats.history.length > 0) {
          parentHistoricVariants.style.display = "block";
          parentHistoricVariants.innerHTML = 'Falsche Eingaben: <br>' + stats.history.map(h => `<span style="background:#fff; border:1px solid #dc3545; padding:2px 6px; border-radius:4px; font-size:0.9em; margin:2px; display:inline-block;">${h}</span>`).join(" ");
      } else {
          parentHistoricVariants.style.display = "none";
      }
  },

  handleTimeOut() {
     this.handleIncorrectAnswer(null);
     this.nextTask();
  },

  checkSelectedAnswer() {
    if (this.training.timerInterval) clearInterval(this.training.timerInterval);
    const task = this.training.tasks[this.training.currentIndex];
    const val = answerInput.value.trim();
    if (!val && !this.training.settings.multipleChoice) return; 

    // For division or multiplication, check exact int equality
    if (parseInt(val, 10) === parseInt(task.answer, 10)) {
        this.handleCorrectAnswer();
        setTimeout(() => this.nextTask(), 800);
    } else {
        this.handleIncorrectAnswer(val);
        // Show correct answer and pause
        feedbackArea.textContent = `Falsch. Richtig ist: ${task.answer}`;
        feedbackArea.style.color = "#dc3545";
        feedbackArea.className = "training-feedback error";
        feedbackArea.style.display = "block";
        
        setTimeout(() => {
           feedbackArea.style.display = "none";
           this.nextTask();
        }, 2000);
    }
  },

  handleCorrectAnswer() {
    const task = this.training.tasks[this.training.currentIndex];
    if (!task._isRepetition) {
       EinmaleinsStorage.recordAnswer(task.reihe, task.factor, task.taskType, true);
       this.training.stats.correct++;
       this.training.sessionHistory.push({task: task, isCorrect: true});
    }
    this.updateSessionStats();
    
    feedbackArea.textContent = "Richtig!";
    feedbackArea.style.color = "#28a745";
    feedbackArea.className = "training-feedback success";
    feedbackArea.style.display = "block";
  },

  handleIncorrectAnswer(wrongVal) {
    const task = this.training.tasks[this.training.currentIndex];
    if (!task._isRepetition) {
       EinmaleinsStorage.recordAnswer(task.reihe, task.factor, task.taskType, false, wrongVal);
       this.training.stats.wrong++;
       this.training.sessionHistory.push({task: task, isCorrect: false, answer: wrongVal});
       if (this.training.settings.withRepeats) {
          this.training.repeats.push({...task, _isRepetition: true});
       }
    }
    this.updateSessionStats();
  },

  nextTask() {
    if (this.training.timerInterval) clearInterval(this.training.timerInterval);
    feedbackArea.style.display = "none";
    this.training.currentIndex++;
    this.renderTask();
  }
};

// Make available globally for inline handlers if any
window.EinmaleinsUI = EinmaleinsUI;
