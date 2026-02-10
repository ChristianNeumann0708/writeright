import { StorageCore as Storage } from "./storage.js";
import { Wort } from "../worttrainer/wort.js";
import { WortStorage } from "../worttrainer/worttrainer-storage.js";

// ------------------------------------------------------
// DOM Elemente
// ------------------------------------------------------
const fileInput = document.getElementById("file-input");
const statusEl = document.getElementById("status");

const sammelInput = document.getElementById("sammelfehler-input");
const sammelBtn = document.getElementById("sammelfehler-btn");
const sammelStatus = document.getElementById("sammelfehler-status");

// ------------------------------------------------------
// TXT-Import (bestehende Funktion)
// ------------------------------------------------------
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) {
    statusEl.textContent = "Keine Datei ausgewählt.";
    return;
  }

  if (!file.name.toLowerCase().endsWith(".txt")) {
    statusEl.textContent = "Bitte eine .txt-Datei auswählen.";
    return;
  }

  const text = await file.text();

  if (!text.trim()) {
    statusEl.textContent = "Die Datei ist leer.";
    return;
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    statusEl.textContent = "Keine gültigen Wörter gefunden.";
    return;
  }

  const uniqueLines = [...new Set(lines)];

  const existing = Storage.load();
  const existingTexts = new Set(existing.map((w) => w.text.toLowerCase()));

  const newWords = uniqueLines
    .filter((l) => !existingTexts.has(l.toLowerCase()))
    .map((l) => new Wort(l));

  if (newWords.length > 0) {
    Storage.save([...existing, ...newWords]);
  }

  statusEl.textContent =
    `Neu importiert: ${newWords.length} Wörter, ` +
    `übersprungen: ${uniqueLines.length - newWords.length}`;
});

// ------------------------------------------------------
// Sammelfehler-Import
// ------------------------------------------------------
sammelBtn.addEventListener("click", () => {
  const raw = sammelInput.value.trim();

  if (!raw) {
    sammelStatus.textContent = "Bitte Wörter eingeben.";
    return;
  }

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    sammelStatus.textContent = "Keine gültigen Wörter gefunden.";
    return;
  }

  const list = WortStorage.loadWords();
  let added = 0;
  let updated = 0;

  for (const word of parts) {
    const existing = list.find(
      (w) => w.text.toLowerCase() === word.toLowerCase()
    );

    if (existing) {
      existing.anzFalsch += 1;
      updated++;
    } else {
      const neu = new Wort(word);
      neu.anzFalsch = 1;
      list.push(neu);
      added++;
    }
  }

  WortStorage.saveWords(list);

  sammelStatus.textContent =
    `Aktualisiert: ${updated}, neu hinzugefügt: ${added}`;

  sammelInput.value = "";
});
