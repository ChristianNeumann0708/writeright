// settings.js
// KORRIGIERTE VERSION – kompatibel mit StorageCore

import { StorageCore as Storage } from "./storage.js";

// ---------------------------------------------
// SETTINGS – Laden & Speichern
// ---------------------------------------------

export function loadSettings() {
  const settings = Storage.getItem("settings");
  return settings || {
    sortByMistakes: false,
    autoDeleteEnabled: false,
    autoDeleteThreshold: 5
  };
}

export function saveSettings(newSettings) {
  Storage.setItem("settings", newSettings);
}

// ---------------------------------------------
// UI-Initialisierung (nur wenn Elemente existieren)
// ---------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const settings = loadSettings();

  // Checkboxen nur setzen, wenn sie existieren
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
});
