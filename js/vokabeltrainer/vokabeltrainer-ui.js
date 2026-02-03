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

// --------------------------------------------------
// UI-Modul
// --------------------------------------------------

export const VokabelUI = {
  init() {
    this.loadLists();
    this.bindEvents();
    this.renderVocabList();
  },

  // --------------------------------------------------
  // Listen laden
  // --------------------------------------------------

  loadLists() {
    const lists = VokabelTrainerStorage.getLists();
    listSelect.innerHTML = "";

    for (const list of lists) {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name;
      listSelect.appendChild(option);
    }

    listSelect.value = "default";
  },

  // --------------------------------------------------
  // Events binden
  // --------------------------------------------------

  bindEvents() {
    // ENTER in Englisch → springt zu Deutsch
    enInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        deInput.focus();
      }
    });

    // ENTER in Deutsch → speichert
    deInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveVocab();
      }
    });

    // Speichern-Button
    saveBtn.addEventListener("click", saveVocab);

    // Neue Liste anlegen
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

    // Beim Wechsel der Liste → Liste neu rendern
    listSelect.addEventListener("change", () => {
      this.renderVocabList();
    });
  },

  // --------------------------------------------------
  // Vokabelliste rendern
  // --------------------------------------------------

  renderVocabList() {
    const container = document.getElementById("vocab-list-display");
    container.innerHTML = "";

  const lists = VokabelTrainerStorage.getLists(); 
  const allVocab = VokabelTrainerStorage.getAllVokabeln();

  // Listen NICHT alphabetisch sortieren → Reihenfolge der Erstellung bleibt erhalten

  lists.forEach((list, index) => {
    // Block-Container
    const group = document.createElement("div");
    group.className = "vocab-list-group";

    // Überschrift
    const title = document.createElement("h5");
    title.className = "vocab-list-title";
    title.textContent = list.name;
    group.appendChild(title);

    // UL für Vokabeln
    const ul = document.createElement("ul");
    ul.className = "vocab-list-inner";

    // Vokabeln dieser Liste filtern
    const vocabOfList = allVocab
      .filter(v => v.list === list.id)
      .sort((a, b) => a.word.localeCompare(b.word)); // alphabetisch

      if (vocabOfList.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Keine Vokabeln";
        li.className = "vocab-empty";
        ul.appendChild(li);
      } else {
        vocabOfList.forEach(v => {
          const li = document.createElement("li");
          li.textContent = `${v.word} – ${v.translation.join(", ")}`;
          ul.appendChild(li);
        });
      }

     group.appendChild(ul);
      container.appendChild(group);
    });
  }
};

// --------------------------------------------------
// Vokabel speichern
// --------------------------------------------------

function saveVocab() {
  const en = enInput.value.trim();
  const de = deInput.value.trim();
  const list = listSelect.value;

  if (!en || !de) {
    showStatus("Bitte beide Felder ausfüllen");
    return;
  }

  // Übersetzungen als Array
  const translationArray = de
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

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

  // Liste aktualisieren
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
