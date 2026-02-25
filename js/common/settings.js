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
  setTimeout(() => { el.style.display = "none"; }, 3500);
}

function showVtStatus(msg) {
  const el = document.getElementById("vt-status");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3500);
}

// ------------------------------------------------------
// DOM geladen
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const settings = loadSettings();



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
  const restoreFileName = document.getElementById("restoreFileName");

  if (restoreInput && restoreButton) {
    restoreInput.onchange = () => {
      const hasFile = restoreInput.files?.length > 0;
      restoreButton.style.display = hasFile ? "block" : "none";
      if (restoreFileName) {
        restoreFileName.textContent = hasFile ? restoreInput.files[0].name : "Keine Datei ausgewählt";
      }
    };

    restoreButton.onclick = () => {
      const file = restoreInput.files[0];
      restoreBackup(file);
      showStatus("Backup wurde importiert.");
      
      // Zurücksetzen nach Import
      restoreInput.value = "";
      restoreButton.style.display = "none";
      if (restoreFileName) restoreFileName.textContent = "Keine Datei ausgewählt";
    };
  }

  // ------------------------------------------------------
  // Worttrainer – Statistik zurücksetzen
  // ------------------------------------------------------
  const resetStatsBtn = document.getElementById("resetStatsBtn");
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", async () => {
      if (confirm("Möchtest du wirklich alle Statistikwerte zurücksetzen?")) {
        await WortStorage.resetWordStats();
        showStatus("Statistik wurde zurückgesetzt.");
        window.dispatchEvent(new Event('worttrainer-updated'));
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
        window.dispatchEvent(new Event('worttrainer-updated'));
      }
    });
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Backup herunterladen
  // ------------------------------------------------------
  const vtDownloadBtn = document.getElementById("vt-downloadBackup");
  if (vtDownloadBtn) {
    vtDownloadBtn.addEventListener("click", async () => {
      // WICHTIG: Speicher erst laden, falls noch nicht geschehen
      await VokabelTrainerStorage.init();
      
      VokabelTrainerStorage.downloadBackup();
      showVtStatus("Vokabeltrainer-Backup wurde heruntergeladen.");
    });
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Backup wiederherstellen
  // ------------------------------------------------------
  const vtRestoreInput = document.getElementById("vt-restoreFile");
  const vtRestoreButton = document.getElementById("vt-restoreButton");
  const vtRestoreFileName = document.getElementById("vt-restoreFileName");

  if (vtRestoreInput && vtRestoreButton) {
    vtRestoreInput.onchange = () => {
      const hasFile = vtRestoreInput.files?.length > 0;
      vtRestoreButton.style.display = hasFile ? "block" : "none";
      if (vtRestoreFileName) {
        vtRestoreFileName.textContent = hasFile ? vtRestoreInput.files[0].name : "Keine Datei ausgewählt";
      }
    };

    vtRestoreButton.onclick = async () => {
      const file = vtRestoreInput.files[0];
      try {
        await VokabelTrainerStorage.restoreBackup(file);
        showVtStatus("Vokabeltrainer-Backup wurde importiert.");
        window.dispatchEvent(new Event('vokabeltrainer-updated'));
        
        // Zurücksetzen nach Import
        vtRestoreInput.value = "";
        vtRestoreButton.style.display = "none";
        if (vtRestoreFileName) vtRestoreFileName.textContent = "Keine Datei ausgewählt";
      } catch (err) {
        console.error("Backup Fehler:", err);
        if (err.message === "wrong-format-worttrainer") {
          showVtStatus("Fehler: Das ist ein Worttrainer-Backup!");
        } else {
          showVtStatus("Fehler: Falsches Format oder defekte Datei!");
        }
      }
    };
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Statistik zurücksetzen
  // ------------------------------------------------------
  const vtResetStatsBtn = document.getElementById("vt-resetStatsBtn");
  if (vtResetStatsBtn) {
    vtResetStatsBtn.addEventListener("click", async () => {
      if (confirm("Möchtest du wirklich alle Statistikwerte zurücksetzen?")) {
        // WICHTIG: Zuerst den Speicher laden, sonst ist data leer und wir überschreiben alles mit einem leeren Array!
        await VokabelTrainerStorage.init();
        
        VokabelTrainerStorage.data.vokabeln.forEach(v => {
          v.statsENtoDE = { correct: 0, wrong: 0, streak: 0, lastAsked: null };
          v.statsDEtoEN = { correct: 0, wrong: 0, streak: 0, lastAsked: null };
          v.variantsWrong = {};
        });
        VokabelTrainerStorage._saveAndBackup();
        showVtStatus("Vokabeltrainer-Statistik wurde zurückgesetzt.");
        window.dispatchEvent(new Event('vokabeltrainer-updated'));
      }
    });
  }

  // ------------------------------------------------------
  // Vokabeltrainer – Komplett löschen (Listen & Vokabeln)
  // ------------------------------------------------------
  const vtDeleteAllBtn = document.getElementById("vt-deleteAllBtn");
  if (vtDeleteAllBtn) {
    vtDeleteAllBtn.addEventListener("click", () => {
      if (confirm("⚠️ ACHTUNG ⚠️\n\nMöchtest du wirklich ALLE Vokabeln UND ALLE Listen aus dem Vokabeltrainer komplett löschen?\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!")) {
        VokabelTrainerStorage.data = {
          lists: [{ id: "default", name: "Allgemeine Liste" }],
          listOrder: ["default"],
          vokabeln: []
        };
        VokabelTrainerStorage._saveAndBackup();
        showVtStatus("Der Vokabeltrainer wurde komplett zurückgesetzt.");
        window.dispatchEvent(new Event('vokabeltrainer-updated'));
      }
    });
  }
});
