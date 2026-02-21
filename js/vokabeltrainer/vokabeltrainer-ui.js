// vokabeltrainer-ui.js
import { Vokabel } from "../models/Vokabel.js";
import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";
import { VokabelLogic } from "./vokabeltrainer-logic.js";

// --------------------------------------------------
// UI-Elemente
// --------------------------------------------------

const enInput = document.getElementById("vocab-en");
const deInput = document.getElementById("vocab-de");
const listSelect = document.getElementById("vocab-list");
const saveBtn = document.getElementById("vocab-save-btn");
const deleteBtn = document.getElementById("vocab-delete-btn");
const deleteListBtn = document.getElementById("vocab-delete-list-btn");
const newListBtn = document.getElementById("vocab-new-list-btn");
const newListInput = document.getElementById("vocab-new-list-name");
const statusBox = document.getElementById("vocab-status");
const vocabListDisplay = document.getElementById("vocab-list-display");
const totalCountBox = document.getElementById("vocab-total-count");

const inputPanel = document.getElementById("vocab-input-panel");
const togglePanelBtn = document.getElementById("vocab-toggle-btn");
const cancelBtn = document.getElementById("vocab-cancel-btn");
const closePanelBtn = document.getElementById("vocab-close-panel-btn");
const panelTitle = document.getElementById("vocab-panel-title");

// --------------------------------------------------
// Training UI Elemente
// --------------------------------------------------

const trainingToggleBtn = document.getElementById("training-toggle-btn");
const trainingPanel = document.getElementById("training-settings-panel");

const trainingListContainer = document.getElementById("training-list-selection");
const trainingSelectAllBtn = document.getElementById("training-select-all-btn");
const trainingSelectNoneBtn = document.getElementById("training-select-none-btn");

const trainingPreview = document.getElementById("training-preview");
const trainingStartBtn = document.getElementById("training-start-btn");

// --------------------------------------------------
// UI-Modul
// --------------------------------------------------

export const VokabelUI = {
  selectedVocabId: null,
  currentSort: "alpha",
  trainingSettings: {
    direction: "de-en",
    lists: [],
    mode: "count",
    count: 20,
    time: 10,
    count: 20,
    time: 10,
    onlyHard: false,
    suggestWords: false,
    withRepeats: true
  },

  init() {
    this.loadLists();
    this.bindEvents();
    this.collapseInputPanel();
    trainingPanel.style.display = "block";
    trainingToggleBtn.textContent = "▲ Training einstellen ▲";

    this.renderVocabList();

    this.loadTrainingLists();
    this.updateTrainingPreview();

    // Standardmäßig Listen-Dropdown ausklappen
    const dropdownToggle = document.getElementById("list-dropdown-toggle");
    const dropdownPanel = document.getElementById("list-dropdown-panel");
    if (dropdownToggle && dropdownPanel) {
      dropdownPanel.classList.add("open");
      dropdownToggle.textContent = "▲ Listen auswählen ▲";
    }
  },

  // --------------------------------------------------
  // Panel steuern
  // --------------------------------------------------

  expandInputPanel() {
    inputPanel.classList.remove("collapsed");
  },

  collapseInputPanel() {
    inputPanel.classList.add("collapsed");
    this.selectedVocabId = null;
    enInput.value = "";
    deInput.value = "";
    listSelect.value = "default";
    saveBtn.textContent = "Vokabel speichern";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
    
    if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";

    this.renderVocabList();
    togglePanelBtn.textContent = "▼ Neue Vokabel hinzufügen ▼";
  },

  toggleTrainingPanel() {
    const isHidden = trainingPanel.style.display === "none";

    if (isHidden) {
      trainingPanel.style.display = "block";
      trainingToggleBtn.textContent = "▲ Training einstellen ▲";
    } else {
      trainingPanel.style.display = "none";
      trainingToggleBtn.textContent = "▼ Training einstellen ▼";
    }
  },

  // --------------------------------------------------
  // Listen laden
  // --------------------------------------------------

  loadLists() {
    const lists = VokabelTrainerStorage.getLists();
    listSelect.innerHTML = "";

    lists.forEach(list => {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name;
      listSelect.appendChild(option);
    });

    if (!lists.some(l => l.id === listSelect.value)) {
      listSelect.value = "default";
    }

    if (listSelect.value === "default") {
      deleteListBtn.style.display = "none";
    } else {
      deleteListBtn.style.display = "inline-block";
    }
  },

  // --------------------------------------------------
  // Training: Listen laden
  // --------------------------------------------------

  loadTrainingLists() {
    const lists = VokabelTrainerStorage.getLists();
    const allVocab = VokabelTrainerStorage.getAllVokabeln();

    trainingListContainer.innerHTML = "";

    lists.forEach(list => {
      const count = allVocab.filter(v => v.list === list.id).length;

      const label = document.createElement("label");
      label.className = "training-list-item";

      label.innerHTML = `
        <input type="checkbox" class="training-list-checkbox" value="${list.id}">
        ${list.name} (${count})
      `;

      trainingListContainer.appendChild(label);
    });

    // Session Restore
    this.trainingSettings.lists.forEach(id => {
      const cb = trainingListContainer.querySelector(`input[value="${id}"]`);
      if (cb) cb.checked = true;
    });
  },

  // --------------------------------------------------
  // Events
  // --------------------------------------------------

  bindEvents() {
    // Eingabe
    enInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        deInput.focus();
      }
    });

    deInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveVocab();
      }
    });

    saveBtn.addEventListener("click", saveVocab);

    deleteBtn.addEventListener("click", () => {
      if (this.selectedVocabId) {
        const confirmDelete = confirm("Möchtest du diese Vokabel wirklich löschen?");
        if (confirmDelete) {
          VokabelTrainerStorage.deleteVokabel(this.selectedVocabId);
          showStatus("Vokabel gelöscht");
          this.collapseInputPanel(); // Reset all UI to default insert mode
        }
      }
    });

    deleteListBtn.addEventListener("click", () => {
      const currentListId = listSelect.value;
      if (currentListId === "default") return;

      const confirmDelete = confirm("Möchtest du diese Liste inklusive aller Vokabeln darin wirklich löschen?");
      if (confirmDelete) {
        VokabelTrainerStorage.deleteList(currentListId);
        showStatus("Liste gelöscht");
        this.loadLists();
        this.renderVocabList();
        this.loadTrainingLists();
      }
    });

    newListBtn.addEventListener("click", () => {
      const name = newListInput.value.trim();

      if (!name) {
        showStatus("Bitte einen Namen für die neue Liste eingeben");
        return;
      }

      const id = VokabelTrainerStorage.createList(name);

      this.loadLists();
      listSelect.value = id;

      showStatus(`Liste „${name}“ wurde angelegt`);
      newListInput.value = "";

      this.renderVocabList();
      this.loadTrainingLists();
    });

    listSelect.addEventListener("change", () => {
      if (listSelect.value === "default") {
        deleteListBtn.style.display = "none";
      } else {
        deleteListBtn.style.display = "inline-block";
      }
    });

    const sortSelect = document.getElementById("vocab-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.renderVocabList();
      });
    }

    // Panel ein/aus
    togglePanelBtn.addEventListener("click", () => {
      const isCollapsed = inputPanel.classList.contains("collapsed");

      if (isCollapsed) {
        // Neue Vokabel öffnen → Training automatisch einklappen 
        trainingPanel.style.display = "none"; 
        trainingToggleBtn.textContent = "▼ Training einstellen ▼";

        this.expandInputPanel();
        togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";
        enInput.focus();
      } else {
        this.collapseInputPanel();
      }
    });

    closePanelBtn.addEventListener("click", () => {
      this.collapseInputPanel();
    });

    cancelBtn.addEventListener("click", () => {
      this.selectedVocabId = null;
      enInput.value = "";
      deInput.value = "";
      listSelect.value = "default";
      saveBtn.textContent = "Vokabel speichern";
      deleteBtn.style.display = "none";
      cancelBtn.style.display = "none";
      
      if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";
      togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";
      
      this.renderVocabList();
    });

    // --------------------------------------------------
    // Training Events
    // --------------------------------------------------

    trainingToggleBtn.addEventListener("click", () => {
        const isHidden = trainingPanel.style.display === "none";

        if (isHidden) {
            // Training wird geöffnet → Vokabelbereich einklappen
            this.collapseInputPanel();
        }

        this.toggleTrainingPanel();
    });

    trainingSelectAllBtn.addEventListener("click", () => {
      trainingListContainer.querySelectorAll("input").forEach(cb => cb.checked = true);
      this.updateTrainingPreview();
    });

    trainingSelectNoneBtn.addEventListener("click", () => {
      trainingListContainer.querySelectorAll("input").forEach(cb => cb.checked = false);
      this.updateTrainingPreview();
    });

    trainingListContainer.addEventListener("change", () => {
      this.updateTrainingPreview();
    });

    document.querySelectorAll("input[name='training-direction']").forEach(r => {
      r.addEventListener("change", () => {
        this.trainingSettings.direction = r.value;
      });
    });

document.querySelectorAll("input[name='training-mode']").forEach(r => {
  r.addEventListener("change", () => {
    const mode = r.value;

    // alle Felder ausblenden
    document.querySelectorAll(".training-mode-field").forEach(f => f.classList.remove("active"));

    // aktives Feld einblenden
    if (mode === "count") {
      document.getElementById("training-mode-count").classList.add("active");
    }
    if (mode === "time") {
      document.getElementById("training-mode-time").classList.add("active");
    }
    if (mode === "all") {
      document.getElementById("training-mode-all").classList.add("active");
    }

    this.trainingSettings.mode = mode;
    this.updateTrainingPreview();
  });
});

    document.getElementById("training-count-input").addEventListener("input", () => {
      this.trainingSettings.count = Number(event.target.value);
      this.updateTrainingPreview();
    });

    document.getElementById("training-time-input").addEventListener("input", () => {
      this.trainingSettings.time = Number(event.target.value);
    });

    document.getElementById("training-only-hard").addEventListener("change", (e) => {
      this.trainingSettings.onlyHard = e.target.checked;
      this.updateTrainingPreview();
    });

    document.getElementById("training-suggest-words").addEventListener("change", (e) => {
      this.trainingSettings.suggestWords = e.target.checked;
    });

    document.getElementById("training-with-repeats").addEventListener("change", (e) => {
      this.trainingSettings.withRepeats = e.target.checked;
    });

    trainingStartBtn.addEventListener("click", () => {
      VokabelLogic.startTraining(this.trainingSettings);
    });
  },

  // --------------------------------------------------
  // Vorschau
  // --------------------------------------------------

  updateTrainingPreview() {
    const selectedLists = [...trainingListContainer.querySelectorAll("input:checked")]
      .map(cb => cb.value);

    this.trainingSettings.lists = selectedLists;

    // Start-Button Validierung
    const startBtn = document.getElementById("training-start-btn");
    if (selectedLists.length === 0) {
      startBtn.disabled = true;
      startBtn.textContent = "Bitte mindestens eine Liste auswählen";
      startBtn.style.opacity = "0.6";
      startBtn.style.cursor = "not-allowed";
      trainingPreview.textContent = "";
      return;
    } else {
      startBtn.disabled = false;
      startBtn.textContent = "Training starten";
      startBtn.style.opacity = "1";
      startBtn.style.cursor = "pointer";
    }

    const all = VokabelTrainerStorage.getAllVokabeln();

    let filtered = all.filter(v => selectedLists.includes(v.list));

    if (this.trainingSettings.onlyHard) {
      filtered = filtered.filter(v => v.errors && v.errors > 0);
    }

    const count = filtered.length;

    trainingPreview.textContent = `Es werden ${count} Vokabeln trainiert.`;
  },

  // --------------------------------------------------
  // Vokabelliste rendern
  // --------------------------------------------------

  renderVocabList() {
    const container = vocabListDisplay;
    container.innerHTML = "";

    const lists = VokabelTrainerStorage.getLists();
    const allVocab = VokabelTrainerStorage.getAllVokabeln();

    lists.forEach(list => {
      const group = document.createElement("div");
      group.className = "vocab-list-group";

      const ul = document.createElement("ul");
      ul.className = "vocab-list-inner";

      let vocabOfList = allVocab.filter(v => v.list === list.id);

      vocabOfList.sort((a, b) => {
        if (this.currentSort === "alpha") {
          return a.word.localeCompare(b.word);
        } else if (this.currentSort === "errors-desc") {
          const errorsA = (a.statsENtoDE?.wrong || 0) + (a.statsDEtoEN?.wrong || 0);
          const errorsB = (b.statsENtoDE?.wrong || 0) + (b.statsDEtoEN?.wrong || 0);
          return errorsB - errorsA; // Höchste Zahl zuerst
        } else if (this.currentSort === "balance-asc") {
          const balA = ((a.statsENtoDE?.correct || 0) + (a.statsDEtoEN?.correct || 0)) - ((a.statsENtoDE?.wrong || 0) + (a.statsDEtoEN?.wrong || 0));
          const balB = ((b.statsENtoDE?.correct || 0) + (b.statsDEtoEN?.correct || 0)) - ((b.statsENtoDE?.wrong || 0) + (b.statsDEtoEN?.wrong || 0));
          return balA - balB; // Niedrigste/stärkst negative Bilanz zuerst
        }
        return 0;
      });

      const count = vocabOfList.length;

      const title = document.createElement("h5");
      title.className = "vocab-list-title";
      title.textContent = `${list.name} (${count})`;
      group.appendChild(title);

      if (vocabOfList.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Keine Vokabeln";
        li.className = "vocab-empty";
        ul.appendChild(li);
      } else {
        vocabOfList.forEach(v => {
          const li = document.createElement("li");
          
          const textSpan = document.createElement("span");
          textSpan.className = "vocab-item-text";
          textSpan.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 2px;">${v.word}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">${v.translation.join(", ")}</div>
          `;
          
          const statsSpan = document.createElement("span");
          statsSpan.className = "vocab-item-stats";
          
          const getStatsHtml = (stats, label) => {
             if (!stats) return `<div><span style="opacity: 0.6;">${label}</span> -</div>`;
             if (stats.correct === 0 && stats.wrong === 0) return `<div style="opacity:0.4;"><span>${label}</span> 🟢 0 🔴 0</div>`;
             return `<div><span>${label}</span> 🟢 ${stats.correct} 🔴 ${stats.wrong}</div>`;
          };
          
          statsSpan.innerHTML = `
            ${getStatsHtml(v.statsDEtoEN, 'DE➝EN')}
            ${getStatsHtml(v.statsENtoDE, 'EN➝DE')}
          `;

          li.appendChild(textSpan);
          li.appendChild(statsSpan);

          li.addEventListener("click", () => {
            VokabelUI.selectVocab(v);
          });

          if (this.selectedVocabId === v.id) {
            li.classList.add("vocab-selected");
          }

          ul.appendChild(li);
        });
      }

      group.appendChild(ul);
      container.appendChild(group);
    });

    this.updateTotalCount();
  },

  updateTotalCount() {
    const total = VokabelTrainerStorage.getAllVokabeln().length;
    if (totalCountBox) {
      totalCountBox.textContent = `Gesamt: ${total} Vokabeln`;
    }
  },

  selectVocab(v) {
    this.selectedVocabId = v.id;
    enInput.value = v.word;
    deInput.value = v.translation.join(", ");

    if (listSelect.querySelector(`option[value="${v.list}"]`)) {
      listSelect.value = v.list;
    } else {
      listSelect.value = "default";
    }
    
    // Trigger change check for list delete btn
    const event = new Event('change');
    listSelect.dispatchEvent(event);

    saveBtn.textContent = "Vokabel aktualisieren";
    deleteBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";

    // Training-Einstellungen einklappen, damit der Fokus auf der Bearbeitung liegt
    trainingPanel.style.display = "none";
    trainingToggleBtn.textContent = "▼ Training einstellen ▼";

    if (panelTitle) panelTitle.textContent = "Vokabel bearbeiten";

    this.expandInputPanel();
    togglePanelBtn.textContent = "▲ Vokabel bearbeiten ▲";
    
    enInput.focus();

    this.renderVocabList();
  }
};

    // Dropdown öffnen/schließen
    const dropdownToggle = document.getElementById("list-dropdown-toggle");
    const dropdownPanel = document.getElementById("list-dropdown-panel");

    dropdownToggle.addEventListener("click", () => {
    const isOpen = dropdownPanel.classList.toggle("open"); 
    if (isOpen) { 
        dropdownToggle.textContent = "▲ Listen auswählen ▲"; 
    } else { 
        dropdownToggle.textContent = "▼ Listen auswählen ▼";    
    }
    });


// --------------------------------------------------
// Vokabel speichern / aktualisieren
// --------------------------------------------------

function saveVocab() {
  const en = enInput.value.trim();
  const de = deInput.value.trim();
  const list = listSelect.value;

  if (!en || !de) {
    showStatus("Bitte beide Felder ausfüllen");
    return;
  }

  const translationArray = de
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // UPDATE
  if (VokabelUI.selectedVocabId) {
    const vokabel = new Vokabel({
      id: VokabelUI.selectedVocabId,
      word: en,
      translation: translationArray,
      list
    });

    const ok = VokabelTrainerStorage.updateVokabel(vokabel);

    if (ok) {
      showStatus("Vokabel aktualisiert");
    } else {
      showStatus("Fehler beim Aktualisieren");
    }

    VokabelUI.selectedVocabId = null;
    enInput.value = "";
    deInput.value = "";
    listSelect.value = "default";

    saveBtn.textContent = "Vokabel speichern";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
    
    if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";
    togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";

    VokabelUI.renderVocabList();
    return;
  }

  // NEU
  const vokabel = new Vokabel({
    word: en,
    translation: translationArray,
    list
  });

  const result = VokabelTrainerStorage.addVokabel(vokabel);

  if (!result.success) {
    showStatus(`Vokabel existiert bereits in dieser Liste`);
    return;
  }

  showStatus(`„${en} – ${de}“ gespeichert`);

  enInput.value = "";
  deInput.value = "";
  enInput.focus();

  VokabelUI.renderVocabList();
}

// --------------------------------------------------
// Statusmeldung
// --------------------------------------------------

function showStatus(msg) {
  statusBox.textContent = msg;
  statusBox.style.display = "block";

  setTimeout(() => {
    statusBox.style.display = "none";
  }, 1500);
}

// TRAINING BUTTONS
document.getElementById("training-check-btn").addEventListener("click", () => {
  const answer = document.getElementById("training-answer").value.trim();
  VokabelLogic.checkAnswer(answer);
});

const trainingAnswerInput = document.getElementById("training-answer");
if (trainingAnswerInput) {
  trainingAnswerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const answer = trainingAnswerInput.value.trim();
      VokabelLogic.checkAnswer(answer);
    }
  });
}

document.getElementById("training-skip-btn").addEventListener("click", () => {
  VokabelLogic.skip();
});

document.getElementById("training-stop-btn").addEventListener("click", () => {
  VokabelLogic.stopTraining();
  VokabelUI.renderVocabList();
});
