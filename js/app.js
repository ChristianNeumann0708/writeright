import { Storage } from './storage.js';
import { Wort } from './wort.js';
import { addCorrect, addWrong, addTotal } from "./timer.js";
import { resetTimer } from "./timer.js";

// Service Worker Update Listener
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'UPDATED') {
      // Hinweis anzeigen
      showUpdateToast();

      // ⭐ Automatisches Reload nach kurzer Verzögerung
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  });
}


let lastWord = null;
let lastIndex = -1;

let autoDeleteEnabled = false;
let autoDeleteThreshold = 10;

let sortByMistakes;


// ------------------------------
// Globale Variablen
// ------------------------------
let wortListe = [];
let currentWord = null;
let currentIndex = -1;

// ------------------------------
// DOM-Elemente
// ------------------------------
const listEl = document.getElementById('word-list');
const inputNeu = document.getElementById('input-new');
const inputFalsch = document.getElementById('input-falsch');
const display = document.getElementById('word-display');
const stats = document.getElementById('stats');
const variants = document.getElementById('wrong-variants');

// Buttons
const btnCorrect = document.getElementById('btn-correct');
const btnWrong = document.getElementById('btn-wrong');
const btnDelete = document.getElementById('btn-delete');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnReset = document.getElementById("btn-reset");

const sortToggle = document.getElementById("sortByMistakes");

sortToggle.addEventListener("change", () => {
  sortByMistakes = sortToggle.checked;
  renderList();
});

sortByMistakes = sortToggle.checked;

// ------------------------------
// Event-Handler
// ------------------------------
btnCorrect.addEventListener("click", markCorrect);
btnWrong.addEventListener("click", markWrong);
btnDelete.addEventListener("click", deleteCurrent);
btnPrev.addEventListener("click", prevWord);
btnNext.addEventListener("click", nextWord);
//const btnReset = document.getElementById("btn-reset");
btnReset.addEventListener("click", resetTimer);


inputNeu.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});

inputFalsch.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleFalsch();
});

// ------------------------------
// Wort hinzufügen
// ------------------------------
function handleAdd() {
  const text = inputNeu.value.trim();
  if (!text) return;

  let existing = wortListe.find(w => w.text.toLowerCase() === text.toLowerCase());

  if (existing) {
    selectWord(existing);
  } else {
    const neu = new Wort(text);
    wortListe.push(neu);
    save();
    autoSaveToIndexedDB();

    selectWord(neu);
  }

  inputNeu.value = '';
  renderList();
  updateWordCount(wortListe);
}

// ------------------------------
// Falsch geschrieben
// ------------------------------
let ersterFehler = true; // ??????????

function handleFalsch() {
  if (!currentWord) return;

  const falsch = inputFalsch.value.trim();
  if (!falsch) return;

  currentWord.falschGeschrieben(falsch);

  // SESSION-STATISTIK 
  if (ersterFehler) {
    addWrong();
    addTotal();
    ersterFehler = false;
  }

  inputFalsch.value = '';
  save();
  autoSaveToIndexedDB();

  renderStats();
  btnCorrect.disabled = true;
  btnWrong.disabled = true;
}

// ------------------------------
// Wort auswählen
// ------------------------------
function selectWord(wort) {
  currentWord = wort;
  currentIndex = wortListe.indexOf(wort);
  renderCurrent();
  renderList();
  updateWordCount(wortListe);
  btnCorrect.disabled = false;
  btnWrong.disabled = false;
}

// ------------------------------
// Aktionen
// ------------------------------
function markCorrect() {
  if (!currentWord) return;
  currentWord.richtigGeschrieben();
  // ------------------------------
  // Automatisches Löschen
  // ------------------------------
if (autoDeleteEnabled && currentWord.anzRichtig >= autoDeleteThreshold) {
    console.log("Wort automatisch gelöscht:", currentWord.text);

    // Wort aus der Liste entfernen
    wortListe.splice(currentIndex, 1);
    save();
    autoSaveToIndexedDB();

    // Sofort weiter zum nächsten Wort
    nextWord();
    renderList();
    updateWordCount(wortListe);
    return; // WICHTIG: Rest der Funktion nicht mehr ausführen
  }
  save();
  autoSaveToIndexedDB();
  if (ersterFehler) {
    addCorrect();
    addTotal();
  }
  nextWord();
  renderList();
  updateWordCount(wortListe);
}

function markWrong() {
  if (!currentWord) return;
  currentWord.falschGeschrieben('');
  save();
  autoSaveToIndexedDB();

  if (ersterFehler) {
    addWrong();
    addTotal();
  }
  
  nextWord();
  renderList();
  updateWordCount(wortListe);
}

function deleteCurrent() {
  if (!currentWord) return;

  wortListe.splice(currentIndex, 1);

  if (wortListe.length > 0) {

    //addTotal();
    currentWord = getNextWord(wortListe);
    currentIndex = wortListe.indexOf(currentWord);
  } else {
    currentWord = null;
    currentIndex = -1;
  }

  save();
  autoSaveToIndexedDB();

  renderList();
  updateWordCount(wortListe);
  renderCurrent();
}

// ------------------------------
// Navigation
// ------------------------------
function prevWord() {
  btnCorrect.disabled = false;
  btnWrong.disabled = false;

  if (!lastWord) return; // kein Zurück möglich

  currentWord = lastWord;
  currentIndex = lastIndex;

  renderCurrent();
  renderList();
  updateWordCount(wortListe);

  // Zurück nur einmal möglich → danach deaktivieren
  lastWord = null;
  lastIndex = -1;
}

function nextWord() {
  btnCorrect.disabled = false;
  btnWrong.disabled = false;

  if (wortListe.length === 0) return;

  // letztes Wort merken für Zurück
  lastWord = currentWord;
  lastIndex = currentIndex;

  currentWord = getNextWord(wortListe);
  currentIndex = wortListe.indexOf(currentWord);
  renderCurrent();
  renderList();
  updateWordCount(wortListe);
}

// ------------------------------
// Rendering
// ------------------------------
function getScoreForWord(w) {
  const settings = Storage.loadSettings();

  if (settings.useFehlerbilanz) {
    // Fehlerbilanz: mehr falsch → höherer Score
    return w.anzFalsch - w.anzRichtig;
  }
  // Standard: absolute Fehler
  return w.anzFalsch;
}

function getListLabel(w) {
  const settings = Storage.loadSettings();

  if (settings.useFehlerbilanz) {
    const diff = w.anzFalsch - w.anzRichtig;
    const sign = diff > 0 ? "+" : "";
    return `${w.text} (Δ ${sign}${diff})`;
  }

  // Standard: absolute Fehler
  return `${w.text} (${w.anzFalsch}× falsch)`;
}


function renderList() {
  listEl.innerHTML = '';

  // Sortierung abhängig vom Toggle
  wortListe
    .sort((a, b) => {
      if (sortByMistakes) {
        return getScoreForWord(b) - getScoreForWord(a);
      }
      return a.text.localeCompare(b.text);
    })
    
    .forEach(w => {
      const li = document.createElement('li');

      // Anzeige abhängig vom Sortiermodus
      li.textContent = sortByMistakes
        ? getListLabel(w)
        : w.text;


      li.className = 'wordlist-item' + (w === currentWord ? ' active' : '');
      li.onclick = () => selectWord(w);

      listEl.appendChild(li);
    });
}

function updateWordCount(words) {
  const el = document.getElementById("wordCount");
  if (!el) return;

  const count = words.length;
  el.textContent = `– ${count} Wörter`;
}


function renderCurrent() {
  if (!currentWord) {
    display.innerHTML = '<span>Bitte ein Wort auswählen oder eingeben.</span>';
    stats.textContent = 'Richtig: 0 | Falsch: 0';
    variants.innerHTML = '';
    return;
  }

  display.textContent = currentWord.text;
  renderStats();

  const settings = Storage.loadSettings();
  if (!settings.tabletModeEnabled) {
    inputFalsch.focus();
  }
}

function renderStats() {
  // Werte setzen
  const correct = currentWord.anzRichtig;
  const wrong = currentWord.anzFalsch;
  const diff = wrong - correct;

  document.getElementById("stats-correct").textContent = correct;
  document.getElementById("stats-wrong").textContent = wrong;

  const diffEl = document.getElementById("stats-diff");
  diffEl.textContent = diff;

  // Klassen zurücksetzen
  diffEl.classList.remove("pos", "neg", "neutral");

  // Farbe setzen
  if (diff > 0) {
    diffEl.classList.add("neg");      // mehr Fehler → rot
  } else if (diff < 0) {
    diffEl.classList.add("pos");      // mehr richtig → grün
  } else {
    diffEl.classList.add("neutral");  // ausgeglichen → grau
  }

  // Varianten wie gehabt
  const dict = currentWord.falscheVarianten;
  if (Object.keys(dict).length > 0) {
    variants.innerHTML =
      '<h4>Falsch geschriebene Varianten</h4><ul>' +
      Object.entries(dict)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `<li>${k} — ${v}</li>`)
        .join('') +
      '</ul>';
  } else {
    variants.innerHTML = '';
  }
}

function showUpdateToast() {
  const el = document.getElementById('updateToast');
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}


// ------------------------------
// Speicher
// ------------------------------
function save() {
  Storage.save(wortListe);
}

let autoSaveTimeout = null;

function autoSaveToIndexedDB() {
  // Debounce: nur 1x alle 2 Sekunden speichern
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    try {
      const json = localStorage.getItem("words");
      if (!json) return;

      await indexedBackup.save("WriteRightDB", "BackupStore", json);
      console.log("Backup gespeichert:", new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fehler beim automatischen Backup:", err);
    }
  }, 2000);
}


// ------------------------------
// Gewichtete Auswahl (wie Blazor)
// ------------------------------
function getNextWord(list) {
    ersterFehler = true;

  if (list.length === 0) return null;

  const zufallsQuote = 0.5;

  if (Math.random() < zufallsQuote) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  return getWeightedWord(list);
}

function getWeightedWord(list) {
  const weighted = list.flatMap(w => {
    const score = getScoreForWord(w);

    // Gewichtung: Score darf nie negativ sein
    const weight = Math.max(1, 1 + score);

    return Array(weight).fill(w);
  });

  const index = Math.floor(Math.random() * weighted.length);
  return weighted[index];
}


// async load mit defensiven Checks
async function load() {
  // 1) Versuche zuerst die schnellen localStorage-Daten zu laden
  let raw = Storage.load(); // evtl. [] oder null

  // Normalisiere raw
  if (!raw) raw = [];

  // 2) Wenn localStorage leer ist, versuche IndexedDB (async)
  if (!Array.isArray(raw) || raw.length === 0) {
    try {
      const json = await window.indexedBackup.load("WordTrainerBackup", "Words");
      if (json && json.length > 0) {
        try {
          raw = JSON.parse(json);
          if (!Array.isArray(raw)) raw = [];
          // optional: cache wieder in localStorage
          Storage.save(raw);
          showToast("Backup aus lokalem Speicher geladen");
        } catch (parseErr) {
          console.warn("IndexedDB Backup konnte nicht geparst werden", parseErr);
          raw = [];
        }
      } else {
        raw = []; // keine Daten vorhanden
      }
    } catch (err) {
      console.warn("IndexedDB Restore fehlgeschlagen", err);
      raw = []; // defensiv weiterarbeiten
    }
  }

  // 3) Normal weiter mit den geladenen Rohdaten
  wortListe = raw.map(obj => Wort.fromJSON(obj));

  if (wortListe.length > 0) {
    currentWord = getNextWord(wortListe);
    currentIndex = wortListe.indexOf(currentWord);
  } else {
    currentWord = null;
    currentIndex = -1;
  }

  renderList();
  updateWordCount(wortListe);
  renderCurrent();
  updateWordCount(wortListe);
}

async function restoreIfLocalEmpty() {
  const local = localStorage.getItem("words");

  // Normalfall: localStorage hat Daten → nichts tun
  if (local && local !== "[]") {
    return;
  }

  // Fehlerfall: localStorage ist leer → Backup laden
  const backup = await indexedBackup.load("WriteRightDB", "BackupStore");

  if (backup) {
    localStorage.setItem("words", JSON.stringify(backup));
  }

  // Worst Case: backup ist auch leer → App startet leer (korrekt)
}


// ------------------------------
// Start
// ------------------------------
(async () => {
  await restoreIfLocalEmpty();

  await load();
  loadAutoDeleteSettings();

  // sortByMistakes aus Settings laden
  const settings = Storage.loadSettings();
  sortByMistakes = !!settings.sortByMistakes;
  renderList();
  updateWordCount(wortListe);

  const toggle = document.getElementById("sortByMistakes");
  if (toggle) {
    toggle.checked = sortByMistakes;

    toggle.addEventListener("change", () => {
      sortByMistakes = toggle.checked;

      // Settings frisch laden, damit nichts überschrieben wird
      const newSettings = Storage.loadSettings();
      Storage.saveSettings({
        ...newSettings,
        sortByMistakes
      });

      renderList();
      updateWordCount(wortListe);
    });
  }
})();

//const btnReset = document.getElementById("btn-reset");
if (btnReset) {
  btnReset.onclick = resetTimer;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(reg => {
        console.log("Service Worker registriert:", reg.scope);

        // sofort nach neuer Version suchen
        reg.update();

        // optional: auf Update reagieren (z. B. neu laden, wenn aktiv)
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'activated') {
              console.log('Neue Service Worker Version aktiviert');
              // optional: Seite neu laden, falls du sofort die neuen Assets willst
              // window.location.reload();
            }
          });
        });
      })
      .catch(err => {
        console.error("Service Worker Registrierung fehlgeschlagen:", err);
      });
  });
}


function loadAutoDeleteSettings() {
  const settings = Storage.loadSettings();

  autoDeleteEnabled = !!settings.autoDeleteEnabled;
  autoDeleteThreshold = parseInt(settings.autoDeleteThreshold) || 10;

  console.log("AutoDelete Settings geladen:", {
    autoDeleteEnabled,
    autoDeleteThreshold
  });
}


