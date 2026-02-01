// settings.js – final, vollständige Version

import { WortStorage } from "../worttrainer/worttrainer-storage.js";

// ---------------------------------------------
// SETTINGS – Laden & Speichern
// ---------------------------------------------

export function loadSettings() {
  return WortStorage.loadSettings();
}

export function saveSettings(newSettings) {
  WortStorage.saveSettings(newSettings);
}

// ---------------------------------------------
// UI-Initialisierung
// ---------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const settings = loadSettings();

  // ---------------------------------------------
  // Sortierung nach Fehlern
  // ---------------------------------------------
  const sortToggle = document.getElementById("sortByMistakes");
  if (sortToggle) {
    sortToggle.checked = settings.sortByMistakes;
    sortToggle.addEventListener("change", () => {
      saveSettings({
        ...settings,
        sortByMistakes: sortToggle.checked
      });
    });
  }

  // ---------------------------------------------
  // Fehlerbilanz statt Fehlerhäufigkeit
  // ---------------------------------------------
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

  // ---------------------------------------------
  // Auto-Delete aktivieren
  // ---------------------------------------------
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

  // Auto-Delete Schwelle
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

  // ---------------------------------------------
  // Tablet-Modus
  // ---------------------------------------------
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
});
