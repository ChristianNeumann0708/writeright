// indexedBackup.js – neue, modulare Version

import { WortStorage } from "../worttrainer/worttrainer-storage.js";
import { Wort } from "../models/Wort.js";

// ------------------------------------------------------
// Status anzeigen
// ------------------------------------------------------
function showStatus(msg) {
  const el = document.getElementById("status");
  if (!el) return;

  el.textContent = msg;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

// ------------------------------------------------------
// Backup herunterladen
// ------------------------------------------------------
export async function downloadBackup() {
  const words = await WortStorage.loadWords();

  if (!words || words.length === 0) {
    showStatus("Keine Wörter vorhanden.");
    return;
  }

  const json = JSON.stringify(words, null, 2);

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const filename = `${stamp}_worttrainer-backup.json`;

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  showStatus("Backup wurde heruntergeladen.");
}

// ------------------------------------------------------
// Backup wiederherstellen
// ------------------------------------------------------
export function restoreBackup(file) {
  if (!file) {
    showStatus("Keine Datei ausgewählt.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const clean = reader.result.replace(/^\uFEFF/, "").trim();
      let raw = JSON.parse(clean);

      if (!Array.isArray(raw)) {
        raw = [raw];
      }

      const newList = raw
        .map(obj => {
          if (!obj || typeof obj !== "object") return null;

          // Text aus allen alten und neuen Formaten
          const text =
            obj.text ??
            obj.Text ??
            obj.Name ??
            null;

          if (!text) return null;

          // Neues Wort-Objekt erzeugen
          const w = new Wort(text);

          // Richtig
          w.anzRichtig =
            obj.anzRichtig ??
            obj.AnzRichtigGeschrieben ??
            0;

          // Falsch
          w.anzFalsch =
            obj.anzFalsch ??
            obj.AnzFalschGeschrieben ??
            0;

          // Varianten
          w.falscheVarianten =
            obj.falscheVarianten ??
            obj.DictFalscheWoerter ??
            {};

          return w;
        })
        .filter(Boolean);

      await WortStorage.saveWords(newList);
      showStatus(`Backup wiederhergestellt. (${newList.length} Wörter)`);
    } catch (err) {
      console.error("Fehler beim Restore:", err);
      showStatus("Fehler beim Einlesen der Datei.");
    }
  };

  reader.readAsText(file);
}
