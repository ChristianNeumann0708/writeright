import { Storage } from './storage.js';
import { Wort } from '../worttrainer/wort.js';

const fileInput = document.getElementById('file-input');
const statusEl = document.getElementById('status');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];

  // Fehler: keine Datei
  if (!file) {
    statusEl.textContent = "Keine Datei ausgewählt.";
    return;
  }

  // Fehler: falscher Dateityp
  if (!file.name.toLowerCase().endsWith(".txt")) {
    statusEl.textContent = "Bitte eine .txt-Datei auswählen.";
    return;
  }

  const text = await file.text();

  // Fehler: Datei leer
  if (!text.trim()) {
    statusEl.textContent = "Die Datei ist leer.";
    return;
  }

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Fehler: keine gültigen Wörter
  if (lines.length === 0) {
    statusEl.textContent = "Keine gültigen Wörter gefunden.";
    return;
  }

  const uniqueLines = [...new Set(lines)];

  const existing = Storage.load();
  const existingTexts = new Set(existing.map(w => w.text.toLowerCase()));

  const newWords = uniqueLines
    .filter(l => !existingTexts.has(l.toLowerCase()))
    .map(l => new Wort(l));

  if (newWords.length > 0) {
    Storage.save([...existing, ...newWords]);
  }

  statusEl.textContent =
    `Neu importiert: ${newWords.length} Wörter, ` +
    `übersprungen: ${uniqueLines.length - newWords.length}`;
});
