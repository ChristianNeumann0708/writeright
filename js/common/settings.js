// settings.js – perfekte modulare Version

import { WortStorage } from "../worttrainer/worttrainer-storage.js";
import { downloadBackup, restoreBackup } from "./indexedBackup.js";

// ------------------------------------------------------
// Settings laden & speichern
// ------------------------------------------------------

function loadSettings() {
  return WortStorage.loadSettings();
}

function saveSettings(newSettings) {
  WortStorage.saveSettings(newSettings);
}

// ------------------------------------------------------
// Statusmeldung
// ------------------------------------------------------

function showStatus(msg) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

// ------------------------------------------------------
// DOM geladen
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const settings = loadSettings();

  // ------------------------------------------------------
  // Fehlerbilanz
  // ------------------------------------------------------
  const fehlerbilanzToggle = document.getElementById("useFehlerbilanz");
  if (fehlerbilanzToggle) {
    fehlerbilanzToggle.checked = settings.useFehlerbilanz;
    fehlerbilanzToggle.addEventListener("change", () => {
      saveSettings({
        ...settings,
        useFehlerbilanz: fehlerbilanzToggle.checked
      });
    });
  }

  // ------------------------------------------------------
  // Auto Delete
  // ------------------------------------------------------
  const autoDeleteToggle = document.getElementById("autoDeleteEnabled");
  if (autoDeleteToggle) {
    autoDeleteToggle.checked = settings.autoDeleteEnabled;
    autoDeleteToggle.addEventListener("change", () => {
      saveSettings({
        ...settings,
        autoDeleteEnabled: autoDeleteToggle.checked
      });
    });
  }

  const autoDeleteThreshold = document.getElementById("autoDeleteThreshold");
  if (autoDeleteThreshold) {
    autoDeleteThreshold.value = settings.autoDeleteThreshold;
    autoDeleteThreshold.addEventListener("input", () => {
      saveSettings({
        ...settings,
        autoDeleteThreshold: Number(autoDeleteThreshold.value)
      });
    });
  }

  // ------------------------------------------------------
  // Tablet Mode
  // ------------------------------------------------------
  const tabletToggle = document.getElementById("tabletMode");
  if (tabletToggle) {
    tabletToggle.checked = settings.tabletMode;
    tabletToggle.addEventListener("change", () => {
      saveSettings({
        ...settings,
        tabletMode: tabletToggle.checked
      });
    });
  }

  // ------------------------------------------------------
  // Backup herunterladen
  // ------------------------------------------------------
  const downloadBtn = document.getElementById("downloadBackup");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      downloadBackup();
      showStatus("Backup wurde heruntergeladen.");
    });
  }

  // ------------------------------------------------------
  // Backup wiederherstellen
  // ------------------------------------------------------
  const restoreInput = document.getElementById("restoreFile");
  const restoreButton = document.getElementById("restoreButton");

  if (restoreInput && restoreButton) {
    restoreInput.onchange = () => {
      const hasFile = restoreInput.files?.length > 0;
      restoreButton.style.display = hasFile ? "block" : "none";
    };

    restoreButton.onclick = () => {
      const file = restoreInput.files[0];
      restoreBackup(file);
      showStatus("Backup wurde importiert.");
    };
  }

  // ------------------------------------------------------
  // Statistik zurücksetzen
  // ------------------------------------------------------
  const resetStatsBtn = document.getElementById("resetStatsBtn");
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", () => {
      if (confirm("Möchtest du wirklich alle Statistikwerte zurücksetzen?")) {
        WortStorage.resetWordStats();
        showStatus("Statistik wurde zurückgesetzt.");
      }
    });
  }

  // ------------------------------------------------------
  // Wortliste löschen
  // ------------------------------------------------------
  const deleteWordsBtn = document.getElementById("deleteWordsBtn");
  if (deleteWordsBtn) {
    deleteWordsBtn.addEventListener("click", async () => {
      if (confirm("Möchtest du wirklich die gesamte Wortliste löschen?")) {
        await WortStorage.clearWordsEverywhere();
        showStatus("Wortliste wurde gelöscht.");
      }
    });
  }
});
