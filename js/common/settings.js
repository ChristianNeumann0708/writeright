// settings.js – finale Version für Worttrainer + Vokabeltrainer

import { WortStorage } from "../worttrainer/worttrainer-storage.js";
import { downloadBackup, restoreBackup } from "./indexedBackup.js";
import { VokabelTrainerStorage } from "../vokabeltrainer/vokabeltrainer-storage.js";

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
  // Worttrainer – Backup herunterladen
  // ------------------------------------------------------
  const downloadBtn = document.getElementById("downloadBackup");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      downloadBackup();
      showStatus("Backup wurde heruntergeladen.");
    });
  }

  // ------------------------------------------------------
  // Worttrainer – Backup wiederherstellen
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
  // Worttrainer – Statistik zurücksetzen
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
  // Worttrainer – Wortliste löschen
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

  // ------------------------------------------------------
  // Vokabeltrainer – Backup herunterladen
  // ------------------------------------------------------
  const vtDownloadBtn = document.getElementById("vt-downloadBackup");
  if (vtDownloadBtn) {
    vtDownloadBtn.addEventListener("click", () => {
      VokabelTrainerStorage.downloadBackup();
      showStatus("Vokabeltrainer-Backup wurde heruntergeladen.");
    });
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Backup wiederherstellen
  // ------------------------------------------------------
  const vtRestoreInput = document.getElementById("vt-restoreFile");
  const vtRestoreButton = document.getElementById("vt-restoreButton");

  if (vtRestoreInput && vtRestoreButton) {
    vtRestoreInput.onchange = () => {
      const hasFile = vtRestoreInput.files?.length > 0;
      vtRestoreButton.style.display = hasFile ? "block" : "none";
    };

    vtRestoreButton.onclick = async () => {
      const file = vtRestoreInput.files[0];
      await VokabelTrainerStorage.restoreBackup(file);
      showStatus("Vokabeltrainer-Backup wurde importiert.");
    };
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Statistik zurücksetzen
  // ------------------------------------------------------
  const vtResetStatsBtn = document.getElementById("vt-resetStatsBtn");
  if (vtResetStatsBtn) {
    vtResetStatsBtn.addEventListener("click", () => {
      if (confirm("Möchtest du wirklich alle Statistikwerte zurücksetzen?")) {
        VokabelTrainerStorage.data.vokabeln.forEach(v => {
          v.correct = 0;
          v.wrong = 0;
          v.variants = {};
        });
        VokabelTrainerStorage._saveAndBackup();
        showStatus("Vokabeltrainer-Statistik wurde zurückgesetzt.");
      }
    });
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Wortliste löschen
  // ------------------------------------------------------
  const vtDeleteWordsBtn = document.getElementById("vt-deleteWordsBtn");
  if (vtDeleteWordsBtn) {
    vtDeleteWordsBtn.addEventListener("click", () => {
      if (confirm("Möchtest du wirklich alle Vokabeln löschen?")) {
        VokabelTrainerStorage.data.vokabeln = [];
        VokabelTrainerStorage._saveAndBackup();
        showStatus("Alle Vokabeln wurden gelöscht.");
      }
    });
  }
});
