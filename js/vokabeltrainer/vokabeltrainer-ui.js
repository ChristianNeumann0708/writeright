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

const renameListBtn = document.getElementById("vocab-rename-list-btn");
const renameListInput = document.getElementById("vocab-rename-list-input");
const renameListSection = document.getElementById("vocab-rename-list-section");

const statusBox = document.getElementById("vocab-status");
const vocabListDisplay = document.getElementById("vocab-list-display");
const totalCountBox = document.getElementById("vocab-total-count");

const inputPanel = document.getElementById("vocab-input-panel");
const togglePanelBtn = document.getElementById("vocab-toggle-btn");
const cancelBtn = document.getElementById("vocab-cancel-btn");
const closePanelBtn = document.getElementById("vocab-close-panel-btn");
const panelTitle = document.getElementById("vocab-panel-title");
const importFile = document.getElementById("vocab-import-file");
const importBtn = document.getElementById("vocab-import-btn");
const searchInput = document.getElementById("vocab-search-input");
const searchClear = document.getElementById("vocab-search-clear");

const editStatsPanel = document.getElementById("vocab-edit-stats");
const statsEnDeCorrect = document.getElementById("stats-en-de-correct");
const statsEnDeWrong = document.getElementById("stats-en-de-wrong");
const statsDeEnCorrect = document.getElementById("stats-de-en-correct");
const statsDeEnWrong = document.getElementById("stats-de-en-wrong");

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
  selectedVocabVariantsWrong: null,
  currentSort: localStorage.getItem("vokabeltrainer_sort") || "alpha",
  currentSearch: "",
  trainingSettings: {
    direction: "de-en",
    lists: [],
    mode: "once",
    count: 20,
    time: 10,
    onlyHard: false,
    hardModeType: "errors",
    suggestWords: false,
    withRepeats: true,
    hideStats: false
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

    window.addEventListener('vokabeltrainer-updated', () => {
      this.collapseInputPanel();
      this.loadLists();
      this.renderVocabList();
      this.loadTrainingLists();
      this.updateTrainingPreview();
    });
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
    this.selectedVocabVariantsWrong = null;
    enInput.value = "";
    deInput.value = "";
    listSelect.value = "default";
    saveBtn.textContent = "Vokabel speichern";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
    
    if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";

    if (editStatsPanel) editStatsPanel.style.display = "none";
    const variantsContainer = document.getElementById("vocab-edit-variants-container");
    if (variantsContainer) variantsContainer.style.display = "none";

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
      if (renameListSection) renameListSection.style.display = "none";
    } else {
      deleteListBtn.style.display = "inline-block";
      if (renameListSection) renameListSection.style.display = "flex";
      const selectedOption = listSelect.options[listSelect.selectedIndex];
      if (selectedOption) {
         if (renameListInput) renameListInput.value = selectedOption.textContent;
      }
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
          
          // Reset fields but keep panel open
          this.selectedVocabId = null;
          enInput.value = "";
          deInput.value = "";
          listSelect.value = "default";
          saveBtn.textContent = "Vokabel speichern";
          deleteBtn.style.display = "none";
          cancelBtn.style.display = "none";
          
          if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";
          togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";

          if (editStatsPanel) editStatsPanel.style.display = "none";
          const variantsContainer = document.getElementById("vocab-edit-variants-container");
          if (variantsContainer) variantsContainer.style.display = "none";
          
          this.renderVocabList();
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

    newListInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        newListBtn.click();
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
      
      const event = new Event('change');
      listSelect.dispatchEvent(event);
    });

    if (renameListBtn) {
      renameListBtn.addEventListener("click", () => {
        const currentListId = listSelect.value;
        const newName = renameListInput.value.trim();
        if (currentListId === "default") return;
        if (!newName) {
           showStatus("Bitte einen neuen Namen eingeben");
           return;
        }
        
        const success = VokabelTrainerStorage.renameList(currentListId, newName);
        if (success) {
           showStatus("Liste erfolgreich umbenannt");
           renameListInput.value = "";
           this.loadLists();
           listSelect.value = currentListId;
           
           const event = new Event('change');
           listSelect.dispatchEvent(event);
           
           this.renderVocabList();
           this.loadTrainingLists();
        } else {
           showStatus("Fehler beim Umbenennen der Liste");
        }
      });
    }

    importFile.addEventListener("change", () => {
      const nameLabel = document.getElementById("vocab-import-file-name");
      const hasFile = importFile.files?.length > 0;
      if (importBtn) importBtn.style.display = hasFile ? "block" : "none";
      if (nameLabel) {
         nameLabel.textContent = hasFile ? importFile.files[0].name : "Keine Datei ausgewählt";
      }
    });

    importBtn.addEventListener("click", () => {
      if (!importFile.files || importFile.files.length === 0) {
        showStatus("Bitte wähle zuerst eine Textdatei aus!");
        return;
      }

      const file = importFile.files[0];

      if (!file.name.toLowerCase().endsWith(".txt")) {
        showStatus("Bitte wähle eine .txt-Datei aus!");
        return;
      }

      const reader = new FileReader();
      const targetListId = listSelect.value;

      reader.onload = (e) => {
        const text = e.target.result;
        
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          showStatus("Fehler: Falsches Format! Dies ist ein Backup, keine Text-Liste.");
          importFile.value = "";
          const nameLabel = document.getElementById("vocab-import-file-name");
          if (nameLabel) nameLabel.textContent = "Keine Datei ausgewählt";
          if (importBtn) importBtn.style.display = "none";
          return;
        }
        
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length === 0) {
          showStatus("Die Datei ist leer oder enthält keine gültigen Zeilen.");
          return;
        }

        // Format validation: look for commas. If no lines have commas, it's the wrong format
        const delimiterRegex = / , |,/ ;
        const validLines = lines.filter(l => delimiterRegex.test(l));
        
        if (validLines.length === 0) {
          showStatus("Fehler: Falsches Format! Trennzeichen (Komma) fehlt. (Wort-Datei?)");
          importFile.value = "";
          const nameLabel = document.getElementById("vocab-import-file-name");
          if (nameLabel) nameLabel.textContent = "Keine Datei ausgewählt";
          if (importBtn) importBtn.style.display = "none";
          return;
        }

        let imported = 0;
        let duplicates = 0;

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          
          // Wir suchen nach dem _ersten_ gültigen Trennzeichen zwischen Englisch und Deutsch
          // Erlaubt ist ab jetzt nur noch das Komma
          const delimiterRegex = / , |,/ ;
          const match = line.match(delimiterRegex);
          
          if (!match) continue; 
          
          const splitIndex = match.index;
          const delimiterLength = match[0].length;
          
          const enWord = line.substring(0, splitIndex).trim();
          const deWordsText = line.substring(splitIndex + delimiterLength).trim();
          
          if (!enWord || !deWordsText) continue;
          
          // Im deutschen Teil können mehrere Übersetzungen weiterhin durch Kommas getrennt sein
          const deTranslations = deWordsText.split(',').map(t => t.trim()).filter(t => t.length > 0);
          
          const vokabel = new Vokabel({
            word: enWord,
            translation: deTranslations,
            list: targetListId
          });
          
          const result = VokabelTrainerStorage.addVokabel(vokabel);
          if (result.success) {
            imported++;
          } else {
            duplicates++;
          }
        }
        
        importFile.value = "";
        const nameLabel = document.getElementById("vocab-import-file-name");
        if (nameLabel) nameLabel.textContent = "Keine Datei ausgewählt";
        if (importBtn) importBtn.style.display = "none";
        
        if (imported > 0) {
          showStatus(`${imported} Vokabeln importiert! ${duplicates > 0 ? '(' + duplicates + ' Duplikate übersprungen)' : ''}`);
          this.renderVocabList();
          this.loadTrainingLists();
        } else if (duplicates > 0) {
          showStatus(`Import fertig: Alle Vokabeln existierten bereits (${duplicates}).`);
        } else {
          showStatus("Fehler: Keine gültigen Vokabel-Paare (Trennzeichen?) in der Datei.");
        }
      };

      reader.readAsText(file);
    });

    listSelect.addEventListener("change", () => {
      if (listSelect.value === "default") {
        deleteListBtn.style.display = "none";
        if (renameListSection) renameListSection.style.display = "none";
      } else {
        deleteListBtn.style.display = "inline-block";
        if (renameListSection) renameListSection.style.display = "flex";
        
        const selectedOption = listSelect.options[listSelect.selectedIndex];
        if (selectedOption) {
           if (renameListInput) renameListInput.value = selectedOption.textContent;
        }
      }
    });

    const sortWrapper = document.getElementById("vokabel-sort-wrapper");
    const sortTrigger = document.getElementById("vokabel-sort-trigger");
    const sortLabel = document.getElementById("vokabel-sort-label");
    const sortOptions = document.querySelectorAll("#vokabel-sort-options li");

    if (sortWrapper && sortOptions.length > 0) {
      // Init label based on currentSort
      const activeOption = Array.from(sortOptions).find(o => o.dataset.value === this.currentSort) || sortOptions[0];
      sortLabel.textContent = activeOption.textContent;

      sortTrigger.addEventListener("click", (e) => {
        sortWrapper.classList.toggle("open");
        e.stopPropagation();
      });

      document.addEventListener("click", () => {
        sortWrapper.classList.remove("open");
      });

      sortOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
          this.currentSort = opt.dataset.value;
          sortLabel.textContent = opt.textContent;
          localStorage.setItem("vokabeltrainer_sort", this.currentSort);
          this.renderVocabList();
          sortWrapper.classList.remove("open");
          e.stopPropagation();
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentSearch = e.target.value.toLowerCase().trim();
        if (searchClear) {
          searchClear.style.display = this.currentSearch ? "block" : "none";
        }
        this.renderVocabList();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        this.currentSearch = "";
        searchClear.style.display = "none";
        this.renderVocabList();
        searchInput.focus();
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

      if (editStatsPanel) editStatsPanel.style.display = "none";
      const variantsContainer = document.getElementById("vocab-edit-variants-container");
      if (variantsContainer) variantsContainer.style.display = "none";
      
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
    if (mode === "once") {
      document.getElementById("training-mode-once").classList.add("active");
    }
    if (mode === "all") {
      document.getElementById("training-mode-all").classList.add("active");
    }

    // Wiederholungen-Checkbox anpassen
    const repeatCb = document.getElementById("training-with-repeats");
    const repeatLabel = repeatCb.parentElement;
    if (mode === "all") {
      repeatCb.disabled = true;
      repeatLabel.style.opacity = "0.5";
      repeatLabel.title = "Im Endlos-Modus sind Wiederholungen durch den smarten Algorithmus ohnehin immer aktiv.";
    } else {
      repeatCb.disabled = false;
      repeatLabel.style.opacity = "1";
      repeatLabel.title = "";
    }

    this.trainingSettings.mode = mode;
    this.updateTrainingPreview();
  });
});

    document.getElementById("training-count-input").addEventListener("input", () => {
      this.trainingSettings.count = Number(event.target.value);
      this.updateTrainingPreview();
    });

    document.getElementById("training-time-input").addEventListener("input", (event) => {
      this.trainingSettings.time = Number(event.target.value);
      this.updateTrainingPreview();
    });

    document.getElementById("training-only-hard").addEventListener("change", (e) => {
      this.trainingSettings.onlyHard = e.target.checked;
      const opts = document.getElementById("training-hard-options");
      if (opts) {
         opts.style.display = e.target.checked ? "flex" : "none";
      }
      this.updateTrainingPreview();
    });

    document.querySelectorAll("input[name='hard-mode-type']").forEach(r => {
      r.addEventListener("change", () => {
        this.trainingSettings.hardModeType = r.value;
        this.updateTrainingPreview();
      });
    });

    const suggestWordsCb = document.getElementById("training-suggest-words");
    const parentModeCb = document.getElementById("training-parent-mode");
    const hideStatsCb = document.getElementById("training-hide-stats");
    const repeatsCb = document.getElementById("training-with-repeats");

    const updateCheckboxExclusions = () => {
        if (!parentModeCb || !suggestWordsCb || !hideStatsCb || !repeatsCb) return;

        if (parentModeCb.checked) {
            // Wenn Eltern-Modus an ist => Multiple Choice & Fokus aus
            suggestWordsCb.checked = false;
            suggestWordsCb.disabled = true;
            this.trainingSettings.suggestWords = false;

            hideStatsCb.checked = false;
            hideStatsCb.disabled = true;
            this.trainingSettings.hideStats = false;
        } else {
            // Sonst sind Multiple Choice & Fokus wieder wählbar
            suggestWordsCb.disabled = false;
            hideStatsCb.disabled = false;

            // Aber wenn Multiple Choice oder Fokus an ist => Eltern-Modus aus
            if (suggestWordsCb.checked || hideStatsCb.checked) {
                parentModeCb.checked = false;
                parentModeCb.disabled = true;
                this.trainingSettings.parentMode = false;
            } else {
                parentModeCb.disabled = false;
            }
        }
    };

    if (suggestWordsCb) {
        this.trainingSettings.suggestWords = suggestWordsCb.checked;
        suggestWordsCb.addEventListener("change", (e) => {
            this.trainingSettings.suggestWords = e.target.checked;
            updateCheckboxExclusions();
        });
    }

    if (parentModeCb) {
        this.trainingSettings.parentMode = parentModeCb.checked;
        parentModeCb.addEventListener("change", (e) => {
            this.trainingSettings.parentMode = e.target.checked;
            updateCheckboxExclusions();
        });
    }

    if (hideStatsCb) {
        this.trainingSettings.hideStats = hideStatsCb.checked;
        hideStatsCb.addEventListener("change", (e) => {
            this.trainingSettings.hideStats = e.target.checked;
            updateCheckboxExclusions();
        });
    }

    if (repeatsCb) {
        this.trainingSettings.repeats = repeatsCb.checked;
        repeatsCb.addEventListener("change", (e) => {
            this.trainingSettings.repeats = e.target.checked;
        });
    }

    // Initiale Prüfung beim Laden
    updateCheckboxExclusions();

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
      filtered = filtered.filter(v => {
         const wrong = (v.statsENtoDE?.wrong || 0) + (v.statsDEtoEN?.wrong || 0);
         const correct = (v.statsENtoDE?.correct || 0) + (v.statsDEtoEN?.correct || 0);
         if (this.trainingSettings.hardModeType === "balance") {
             return wrong > correct;
         } else {
             return wrong > 0;
         }
      });
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
      let vocabOfList = allVocab.filter(v => v.list === list.id);

      if (this.currentSearch) {
        vocabOfList = vocabOfList.filter(v => 
          v.word.toLowerCase().includes(this.currentSearch) ||
          v.translation.join(" ").toLowerCase().includes(this.currentSearch)
        );
      }

      if (vocabOfList.length === 0 && this.currentSearch) {
        return; // Verstecke die Liste, wenn sie durch Suche leer ist
      }

      const group = document.createElement("div");
      group.className = "vocab-list-group";

      const ul = document.createElement("ul");
      ul.className = "vocab-list-inner";

      vocabOfList.sort((a, b) => {
        if (this.currentSort === "alpha") {
          return a.word.localeCompare(b.word);
        } else if (this.currentSort === "errors-desc") {
          const errorsA = (a.statsENtoDE?.wrong || 0) + (a.statsDEtoEN?.wrong || 0);
          const errorsB = (b.statsENtoDE?.wrong || 0) + (b.statsDEtoEN?.wrong || 0);
          return errorsB - errorsA; // Höchste Zahl zuerst
        } else if (this.currentSort === "balance-asc") {
          const balA = ((a.statsENtoDE?.wrong || 0) + (a.statsDEtoEN?.wrong || 0)) - ((a.statsENtoDE?.correct || 0) + (a.statsDEtoEN?.correct || 0));
          const balB = ((b.statsENtoDE?.wrong || 0) + (b.statsDEtoEN?.wrong || 0)) - ((b.statsENtoDE?.correct || 0) + (b.statsDEtoEN?.correct || 0));
          return balB - balA; // Stärkst negative Performance (größte Fehlerzahl) zuerst
        }
        return 0;
      });

      const count = vocabOfList.length;

      const title = document.createElement("h5");
      title.className = "vocab-list-title";
      title.textContent = `${list.name} (${count})`;
      title.style.cursor = "pointer";
      title.title = "Klicken, um die Liste auszuwählen";
      title.addEventListener("click", () => {
        VokabelUI.selectList(list);
      });
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
            <div style="font-size: 1.0em; opacity: 0.8;">${v.translation.join(", ")}</div>
          `;
          
          const statsSpan = document.createElement("span");
          statsSpan.className = "vocab-item-stats";
          
          const getStatsHtml = (stats, label) => {
             if (!stats) return `<div><span style="opacity: 0.6;">${label}</span> -</div>`;
             
             if (this.currentSort === "balance-asc") {
               const bal = stats.wrong - stats.correct;
               return `<div><span>${label}</span> ⚖️ ${bal > 0 ? '+'+bal : bal}</div>`;
             }

             if (stats.correct === 0 && stats.wrong === 0) return `<div style="opacity:0.4;"><span>${label}</span> ✅ 0 <span style="font-size: 0.9em;">❌</span> 0</div>`;
             return `<div><span>${label}</span> ✅ ${stats.correct} <span style="font-size: 0.9em;">❌</span> ${stats.wrong}</div>`;
          };
          
          statsSpan.innerHTML = `
            ${getStatsHtml(v.statsENtoDE, 'EN➝DE')}
            ${getStatsHtml(v.statsDEtoEN, 'DE➝EN')}
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

  selectList(list) {
    this.selectedVocabId = null;
    enInput.value = "";
    deInput.value = "";
    
    if (listSelect.querySelector(`option[value="${list.id}"]`)) {
      listSelect.value = list.id;
    } else {
      listSelect.value = "default";
    }
    
    const event = new Event('change');
    listSelect.dispatchEvent(event);
    
    saveBtn.textContent = "Vokabel speichern";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
    if (editStatsPanel) editStatsPanel.style.display = "none";
    if (panelTitle) panelTitle.textContent = "Neue Vokabel hinzufügen";
    
    this.expandInputPanel();
    togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";
    trainingPanel.style.display = "none"; 
    trainingToggleBtn.textContent = "▼ Training einstellen ▼";

    const managementSection = document.getElementById("listenverwaltung");
    if (managementSection) {
       const trainerMain = document.querySelector('.trainer-main');
       if (trainerMain) {
          // Scrollt explizit nur den rechten Scrollbereich,
          // um zu verhindern, dass Eltern-Container mit overflow:hidden verschoben werden.
          trainerMain.scrollTo({
             top: trainerMain.scrollHeight,
             behavior: 'smooth'
          });
       } else {
          managementSection.scrollIntoView({ behavior: 'smooth' });
       }
    }
    
    this.renderVocabList();
  },

  selectVocab(v) {
    this.selectedVocabId = v.id;
    this.selectedVocabVariantsWrong = Object.assign({}, v.variantsWrong || {});
    enInput.value = v.word;
    deInput.value = v.translation.join(", ");

    if (editStatsPanel) {
      editStatsPanel.style.display = "block";
      statsEnDeCorrect.value = v.statsENtoDE ? v.statsENtoDE.correct : 0;
      statsEnDeWrong.value = v.statsENtoDE ? v.statsENtoDE.wrong : 0;
      statsDeEnCorrect.value = v.statsDEtoEN ? v.statsDEtoEN.correct : 0;
      statsDeEnWrong.value = v.statsDEtoEN ? v.statsDEtoEN.wrong : 0;
    }

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
    
    this.renderEditVariants();

    this.expandInputPanel();
    togglePanelBtn.textContent = "▲ Vokabel bearbeiten ▲";
    
    enInput.focus();

    this.renderVocabList();
  },

  renderEditVariants() {
      const container = document.getElementById("vocab-edit-variants-container");
      const listElement = document.getElementById("vocab-edit-variants-list");
      
      if (!container || !listElement) return;

      if (!this.selectedVocabVariantsWrong || Object.keys(this.selectedVocabVariantsWrong).length === 0) {
          container.style.display = "none";
          return;
      }

      container.style.display = "block";
      listElement.innerHTML = "";

      Object.entries(this.selectedVocabVariantsWrong)
          .sort((a, b) => b[1] - a[1]) // Nach Fehlerhäufigkeit
          .forEach(([variantName, count]) => {
              const li = document.createElement("li");
              li.style.display = "flex";
              li.style.justifyContent = "space-between";
              li.style.alignItems = "center";
              li.style.padding = "4px 0";
              li.style.borderBottom = "1px solid #f0f0f0";
              
              const textSpan = document.createElement("span");
              textSpan.innerHTML = `${variantName} <span style="color:#888; font-size:0.85em;">(${count}x eingetippt)</span>`;
              
              const delBtn = document.createElement("button");
              delBtn.type = "button";
              delBtn.innerHTML = "🗑️";
              delBtn.title = `Diese Schreibweise ("${variantName}") aus der Fehler-Statistik löschen`;
              delBtn.style.background = "none";
              delBtn.style.border = "none";
              delBtn.style.cursor = "pointer";
              delBtn.style.fontSize = "0.9rem";
              delBtn.style.padding = "2px 6px";
              
              delBtn.addEventListener("click", () => {
                  delete this.selectedVocabVariantsWrong[variantName];
                  this.renderEditVariants(); // Neu rendern ohne dieses Item
              });
              
              li.appendChild(textSpan);
              li.appendChild(delBtn);
              listElement.appendChild(li);
          });
  }
};

window.VokabelUI = VokabelUI;

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
      list,
      variantsWrong: VokabelUI.selectedVocabVariantsWrong || {}
    });

    if (editStatsPanel) {
      vokabel.statsENtoDE.correct = parseInt(statsEnDeCorrect.value, 10) || 0;
      vokabel.statsENtoDE.wrong = parseInt(statsEnDeWrong.value, 10) || 0;
      vokabel.statsDEtoEN.correct = parseInt(statsDeEnCorrect.value, 10) || 0;
      vokabel.statsDEtoEN.wrong = parseInt(statsDeEnWrong.value, 10) || 0;
    }

    const ok = VokabelTrainerStorage.updateVokabel(vokabel);

    if (ok) {
      showStatus("Vokabel aktualisiert");
    } else {
      showStatus("Fehler beim Aktualisieren");
    }

    VokabelUI.selectedVocabId = null;
    VokabelUI.selectedVocabVariantsWrong = null;
    enInput.value = "";
    deInput.value = "";
    listSelect.value = "default";

    saveBtn.textContent = "Vokabel speichern";
    deleteBtn.style.display = "none";
    cancelBtn.style.display = "none";
    if (editStatsPanel) editStatsPanel.style.display = "none";
    const variantsContainer = document.getElementById("vocab-edit-variants-container");
    if (variantsContainer) variantsContainer.style.display = "none";
    
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

function showStatus(msg, isError = false) {
  const isErr = isError || msg.toLowerCase().includes("fehler") || msg.toLowerCase().includes("bitte");
  statusBox.textContent = msg;
  
  if (isErr) {
    statusBox.classList.add("error");
    statusBox.classList.remove("success");
  } else {
    statusBox.classList.add("success");
    statusBox.classList.remove("error");
  }
  
  statusBox.style.display = "block";

  const timeoutMs = isErr ? 8000 : 3500;
  
  if (statusBox.dataset.timeoutId) {
    clearTimeout(Number(statusBox.dataset.timeoutId));
  }
  
  const timeoutId = setTimeout(() => {
    statusBox.style.display = "none";
  }, timeoutMs);
  
  statusBox.dataset.timeoutId = timeoutId;
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
  VokabelLogic.handleStopClick();
});

// PARENT MODE BUTTONS
const btnParentCorrect = document.getElementById("parent-btn-correct");
const btnParentWrong = document.getElementById("parent-btn-wrong");
const parentWrongInputArea = document.getElementById("parent-wrong-input-area");
const parentWrongInput = document.getElementById("parent-wrong-answer");
const btnParentNext = document.getElementById("parent-btn-next");

if (btnParentCorrect) {
    btnParentCorrect.addEventListener("click", () => {
        // Richtig gedrückt => Check Answer aufrufen mit künstlichem Erfolgs-Flag
        VokabelLogic.checkAnswer("", true);
    });
}

if (btnParentWrong) {
    btnParentWrong.addEventListener("click", () => {
        // Falsch gedrückt => Nur UI sperren und Eingabefeld anzeigen
        btnParentCorrect.disabled = true;
        btnParentCorrect.style.opacity = "0.5";
        btnParentWrong.disabled = true;
        btnParentWrong.style.opacity = "0.5";
        
        window.parentModeVariantAdded = false;

        // Variante anzeigen, falls Englisch gefragt ist, sonst direkt abhandeln
        if (VokabelLogic.currentWordDirection === "de-en") {
            if (parentWrongInputArea) parentWrongInputArea.style.display = "flex";
            if (parentWrongInput) {
                parentWrongInput.value = "";
                parentWrongInput.focus();
            }
        } else {
            // Wenn die Zielsprache Deutsch ist, verlangen wir keine Schreibweise (wie du sagtest)
            // also rufen wir direkt falsch auf
            VokabelLogic.checkAnswer("", false);
        }
    });
}

// Falsche Variante eintragen und speichern mit ENTER
if (parentWrongInput) {
    parentWrongInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const variantEntry = parentWrongInput.value.trim();
            if (variantEntry) {
                // Wir speichern die falschen Varianten, indem wir hier direkt am Objekt rumspielen,
                // das ist am einfachsten, bevor wir den regulären Flow aufrufen.
                const v = VokabelLogic.trainingList[VokabelLogic.currentIndex];
                const vocabInstanz = typeof v.markWrong === 'function' ? v : new Vokabel(v);
                const statDirection = VokabelLogic.currentWordDirection === "de-en" ? "DEtoEN" : "ENtoDE";
                const isRepetition = !!v._isRepetition;
                if (!isRepetition) {
                    // Falls noch gar nicht als falsch gewertet, jetzt erst eintragen lassen
                    vocabInstanz.markWrong(statDirection, variantEntry);
                    // Den Fehler-Zähler hier korrigieren, damit nicht unnötig 1x pro Variante gezählt wird
                    if (!window.parentModeVariantAdded) {
                        window.parentModeVariantAdded = true;
                    } else {
                        // Zähler wieder abziehen, da markWrong immer beides macht (Variante + Zähler)
                        const stats = statDirection === "DEtoEN" ? vocabInstanz.statsDEtoEN : vocabInstanz.statsENtoDE;
                        stats.wrong = Math.max(0, stats.wrong - 1);
                    }
                    VokabelTrainerStorage.updateVokabel(vocabInstanz);
                    
                    // UI Liste der Varianten updaten
                    if (window.VokabelLogic && window.VokabelLogic.updateParentVariantsUI) {
                        window.VokabelLogic.updateParentVariantsUI(vocabInstanz);
                    }
                }
                
                // Kurzes Feedback, dass das Wort gespeichert wurde
                parentWrongInput.value = "";
                parentWrongInput.placeholder = "Gespeichert! Noch eins?";
                setTimeout(() => { if(parentWrongInput) parentWrongInput.placeholder = ""; }, 1500);
            }
        }
    });
}

// Weiter zum nächsten Wort nach Falsch
if (btnParentNext) {
    btnParentNext.addEventListener("click", () => {
        // Übergeben wir ein künstliches Falsch und lassen checkAnswer den Rest machen (Zähler erhöhen etc.)
        VokabelLogic.checkAnswer("", false);
    });
}
