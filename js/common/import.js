
import { Wort } from "../models/Wort.js";
import { WortStorage } from "../worttrainer/worttrainer-storage.js";

// ------------------------------------------------------
// DOM Elemente
// ------------------------------------------------------
const fileInput = document.getElementById("file-input");
const importFileBtn = document.getElementById("importFileBtn");
const importFileName = document.getElementById("importFileName");
const statusEl = document.getElementById("status");

const sammelInput = document.getElementById("sammelfehler-input");
const sammelBtn = document.getElementById("sammelfehler-btn");
const sammelStatus = document.getElementById("sammelfehler-status");

function showStatusMsg(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg;
  if (isError) {
    el.classList.add("error");
    el.classList.remove("success");
  } else {
    el.classList.add("success");
    el.classList.remove("error");
  }
  el.style.display = "block";

  // Error messages stay for 8 seconds, normal ones for 3.5 seconds
  const timeoutMs = isError ? 8000 : 3500;
  
  // Clear any existing timeout for this element
  if (el.dataset.timeoutId) {
    clearTimeout(Number(el.dataset.timeoutId));
  }
  
  const timeoutId = setTimeout(() => {
    el.style.display = "none";
  }, timeoutMs);
  
  el.dataset.timeoutId = timeoutId;
}

// ------------------------------------------------------
// TXT-Import (bestehende Funktion)
// ------------------------------------------------------
// Update File Name and show Import button
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const hasFile = fileInput.files?.length > 0;
    if (importFileBtn) importFileBtn.style.display = hasFile ? "block" : "none";
    if (importFileName) {
      importFileName.textContent = hasFile ? fileInput.files[0].name : "Keine Datei ausgewählt";
    }
  });
}

if (importFileBtn) {
  importFileBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
      showStatusMsg(statusEl, "Keine Datei ausgewählt.", true);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      showStatusMsg(statusEl, "Bitte eine .txt-Datei auswählen.", true);
      return;
    }

    const text = await file.text();

    if (!text.trim()) {
      showStatusMsg(statusEl, "Die Datei ist leer.", true);
      return;
    }

    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      showStatusMsg(statusEl, "Fehler: Falsches Format! Dies ist ein Backup, keine Text-Liste.", true);
      fileInput.value = "";
      if (importFileBtn) importFileBtn.style.display = "none";
      if (importFileName) importFileName.textContent = "Keine Datei ausgewählt";
      return;
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showStatusMsg(statusEl, "Keine gültigen Wörter gefunden.", true);
      return;
    }

    // Format validation: check for commas (Vokabeltrainer format usually uses commas)
    const linesWithCommas = lines.filter(l => l.includes(','));
    if (linesWithCommas.length > 0) {
      showStatusMsg(statusEl, "Fehler: Falsches Format! Dies scheint eine Vokabel-Datei zu sein (Kommas gefunden).", true);
      fileInput.value = "";
      if (importFileBtn) importFileBtn.style.display = "none";
      if (importFileName) importFileName.textContent = "Keine Datei ausgewählt";
      return;
    }

    const uniqueLines = [...new Set(lines)];

    const existing = await WortStorage.loadWords();
    const existingTexts = new Set(existing.map((w) => w.text.toLowerCase()));

    const newWords = uniqueLines
      .filter((l) => !existingTexts.has(l.toLowerCase()))
      .map((l) => new Wort(l));

    if (newWords.length > 0) {
      await WortStorage.saveWords([...existing, ...newWords]);
    }

    showStatusMsg(statusEl, `Neu importiert: ${newWords.length} Wörter, übersprungen: ${uniqueLines.length - newWords.length}`);

    // Zurücksetzen
    fileInput.value = "";
    if (importFileBtn) importFileBtn.style.display = "none";
    if (importFileName) importFileName.textContent = "Keine Datei ausgewählt";
  });
}

// ------------------------------------------------------
// Sammelfehler-Import
// ------------------------------------------------------
sammelBtn.addEventListener("click", async () => {
  const raw = sammelInput.value.trim();

  if (!raw) {
    showStatusMsg(sammelStatus, "Bitte Wörter eingeben.", true);
    return;
  }

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    showStatusMsg(sammelStatus, "Keine gültigen Wörter gefunden.", true);
    return;
  }

  const list = await WortStorage.loadWords();
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

  await WortStorage.saveWords(list);

  showStatusMsg(sammelStatus, `Aktualisiert: ${updated}, neu hinzugefügt: ${added}`);

  sammelInput.value = "";
});
