// vokabeltrainer-ui.js
import { Vokabel } from "./vokabel.js";
import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";

// --------------------------------------------------
// UI-Elemente
// --------------------------------------------------

const enInput = document.getElementById("vocab-en");
const deInput = document.getElementById("vocab-de");
const listSelect = document.getElementById("vocab-list");
const saveBtn = document.getElementById("vocab-save-btn");
const newListBtn = document.getElementById("vocab-new-list-btn");
const newListInput = document.getElementById("vocab-new-list-name");
const statusBox = document.getElementById("vocab-status");
const vocabListDisplay = document.getElementById("vocab-list-display");
const totalCountBox = document.getElementById("vocab-total-count");

const inputPanel = document.getElementById("vocab-input-panel");
const togglePanelBtn = document.getElementById("vocab-toggle-btn");
const cancelBtn = document.getElementById("vocab-cancel-btn");
const closePanelBtn = document.getElementById("vocab-close-panel-btn");

// --------------------------------------------------
// UI-Modul
// --------------------------------------------------

export const VokabelUI = {
  selectedVocabId: null,

  init() {
    this.loadLists();
    this.bindEvents();
    this.expandInputPanel(); // beim Start sichtbar
    this.renderVocabList();
  },

  // --------------------------------------------------
  // Panel steuern (für Training etc. nutzbar)
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
    cancelBtn.style.display = "none";
    this.renderVocabList();
    togglePanelBtn.textContent = "▼ Neue Vokabel hinzufügen ▼";
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
  },

  // --------------------------------------------------
  // Events binden
  // --------------------------------------------------

  bindEvents() {
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
    });

    listSelect.addEventListener("change", () => {
      this.renderVocabList();
    });

    // Panel einblenden (wenn zu)
    togglePanelBtn.addEventListener("click", () => {
        const isCollapsed = inputPanel.classList.contains("collapsed");

        if (isCollapsed) {
          this.expandInputPanel();
          togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";

          enInput.focus();
        } else {
          this.collapseInputPanel();
          togglePanelBtn.textContent = "▼ Neue Vokabel hinzufügen ▼";
        }
    });

    // Abbrechen (Bearbeiten abbrechen)
    cancelBtn.addEventListener("click", () => {
      this.selectedVocabId = null;
      enInput.value = "";
      deInput.value = "";
      listSelect.value = "default";
      saveBtn.textContent = "Vokabel speichern";
      cancelBtn.style.display = "none";
      this.renderVocabList();
    });

    // Bereich schließen (Panel einklappen)
    closePanelBtn.addEventListener("click", () => {
      this.collapseInputPanel();
    });
  },

  // --------------------------------------------------
  // Vokabel auswählen
  // --------------------------------------------------

  selectVocab(v) {
    this.selectedVocabId = v.id;

    this.expandInputPanel();
    togglePanelBtn.textContent = "▲ Neue Vokabel hinzufügen ▲";

    enInput.value = v.word;
    deInput.value = v.translation.join(", ");
    listSelect.value = v.list;

    saveBtn.textContent = "Vokabel ändern";
    cancelBtn.style.display = "inline-block";

    this.renderVocabList();
  },

  // --------------------------------------------------
  // Gesamtanzahl aktualisieren
  // --------------------------------------------------

  updateTotalCount() {
    const total = VokabelTrainerStorage.getAllVokabeln().length;
    if (totalCountBox) {
      totalCountBox.textContent = `Gesamt: ${total} Vokabeln`;
    }
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

      const vocabOfList = allVocab
        .filter(v => v.list === list.id)
        .sort((a, b) => a.word.localeCompare(b.word));

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
          li.textContent = `${v.word} – ${v.translation.join(", ")}`;
          li.style.cursor = "pointer";

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
  }
};

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
    cancelBtn.style.display = "none";

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
