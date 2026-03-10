// indexedBackup.js – neue, modulare Version

import { WortStorage } from "../worttrainer/worttrainer-storage.js";
import { Wort } from "../models/Wort.js";
import { downloadJSON, readJSONFile } from "./fileHelpers.js";

// ------------------------------------------------------
// Status anzeigen
// ------------------------------------------------------
function showStatus(msg, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  const isErr = isError || msg.toLowerCase().includes("fehler");
  el.textContent = msg;
  if (isErr) {
    el.classList.add("error");
    el.classList.remove("success");
  } else {
    el.classList.add("success");
    el.classList.remove("error");
  }
  el.style.display = "block";
  const timeoutMs = isErr ? 8000 : 3000;
  if (el.dataset.tId) clearTimeout(Number(el.dataset.tId));
  el.dataset.tId = setTimeout(() => {
    el.style.display = "none";
  }, timeoutMs);
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

  downloadJSON(words, "worttrainer");
  showStatus("Backup wurde heruntergeladen.");
}

// ------------------------------------------------------
// Backup wiederherstellen
// ------------------------------------------------------
export async function restoreBackup(file) {
  try {
    let raw = await readJSONFile(file);

    // Verhindern, dass Vokabeltrainer-Backups hier importiert werden
    if (raw && typeof raw === "object" && !Array.isArray(raw) && "vokabeln" in raw && "lists" in raw) {
      throw new Error("wrong-format-vokabeltrainer");
    }

    // Verhindern, dass komplett fremde JSON-Dateien importiert werden
    let isWorttrainerFormat = false;
    if (Array.isArray(raw)) {
       isWorttrainerFormat = raw.length === 0 || raw.some(item => typeof item === "object" && item !== null && ("text" in item || "Text" in item || "Name" in item));
    } else if (typeof raw === "object" && raw !== null) {
       isWorttrainerFormat = ("text" in raw || "Text" in raw || "Name" in raw);
    }

    if (!isWorttrainerFormat) {
        throw new Error("invalid-format");
    }

    if (!Array.isArray(raw)) {
      raw = [raw];
    }

    const newList = raw
      .map(obj => {
        if (!obj || typeof obj !== "object") return null;

        // Text aus allen alten und neuen Formaten
        const text = obj.text ?? obj.Text ?? obj.Name ?? null;

        if (!text) return null;

        // Neues Wort-Objekt erzeugen
        const w = new Wort(text);

        // Richtig
        w.anzRichtig = obj.anzRichtig ?? obj.AnzRichtigGeschrieben ?? 0;

        // Falsch
        w.anzFalsch = obj.anzFalsch ?? obj.AnzFalschGeschrieben ?? 0;

        // Varianten
        w.falscheVarianten = obj.falscheVarianten ?? obj.DictFalscheWoerter ?? {};

        return w;
      })
      .filter(Boolean);

    await WortStorage.saveWords(newList);
    showStatus(`Backup wiederhergestellt. (${newList.length} Wörter)`);
    window.dispatchEvent(new Event('worttrainer-updated'));
  } catch (err) {
    console.error("Fehler beim Restore:", err);
    if (err.message === "wrong-format-vokabeltrainer") {
      showStatus("Fehler: Das ist ein Vokabeltrainer-Backup!");
    } else if (err.message === "invalid-format") {
      showStatus("Fehler: Unbekanntes Dateiformat!");
    } else if (err.message === "no-file") {
      showStatus("Keine Datei ausgewählt.");
    } else {
      showStatus("Fehler beim Einlesen der Datei.");
    }
  }
}
