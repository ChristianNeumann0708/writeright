import { Storage } from "./storage.js";

const WORDS_KEY = "words";

// ------------------------------------------------------
// Einstellungen laden
// ------------------------------------------------------
function loadSettings() {
  const settings = Storage.loadSettings();

  // Sortier-Einstellung (Trainer-Seite)
  const sortToggle = document.getElementById("sortByMistakes");
  if (sortToggle) {
    sortToggle.checked = settings.sortByMistakes ?? false;
  }

  // Fehlerbilanz-Umschalter (NEU)
  const fehlerbilanzToggle = document.getElementById("useFehlerbilanz");
  if (fehlerbilanzToggle) {
    fehlerbilanzToggle.checked = settings.useFehlerbilanz ?? false;
  }

  // AutoDelete
  const autoDeleteEnabledEl = document.getElementById("autoDeleteEnabled");
  const autoDeleteThresholdEl = document.getElementById("autoDeleteThreshold");

  if (autoDeleteEnabledEl) {
    autoDeleteEnabledEl.checked = settings.autoDeleteEnabled ?? false;
    autoDeleteEnabledEl.addEventListener("change", () => {
      const s = Storage.loadSettings();
      Storage.saveSettings({
        ...s,
        autoDeleteEnabled: autoDeleteEnabledEl.checked
      });
    });
  }

  if (autoDeleteThresholdEl) {
    autoDeleteThresholdEl.value = settings.autoDeleteThreshold ?? 10;
    autoDeleteThresholdEl.addEventListener("input", () => {
      const s = Storage.loadSettings();
      Storage.saveSettings({
        ...s,
        autoDeleteThreshold: parseInt(autoDeleteThresholdEl.value) || 10
      });
    });
  }

  const tabletModeEnabledEl = document.getElementById("tabletModeEnabled");

  if (tabletModeEnabledEl) {
    tabletModeEnabledEl.checked = settings.tabletModeEnabled ?? false;

    tabletModeEnabledEl.addEventListener("change", () => {
      const s = Storage.loadSettings();
      Storage.saveSettings({
        ...s,
        tabletModeEnabled: tabletModeEnabledEl.checked
      });
    });
  }

  // Ganze Wortliste löschen
  const deleteWordsBtn = document.getElementById("deleteWordsBtn");

  if (deleteWordsBtn) {
    deleteWordsBtn.addEventListener("click", async () => {
      if (confirm("Möchtest du wirklich die gesamte Wortliste löschen?")) {
        await Storage.clearWordsEverywhere();
        console.log("DEBUG: clearWordsEverywhere() abgeschlossen");
        alert("Wortliste wurde gelöscht.");
      }
    });
  }

  // Restore
  const restoreInput = document.getElementById("restoreFile");
  const restoreButton = document.getElementById("restoreButton");

  if (restoreInput && restoreButton) {
    restoreInput.onchange = () => {
      const hasFile = restoreInput.files && restoreInput.files.length > 0;
      restoreButton.style.display = hasFile ? "block" : "none";
    };

    restoreButton.onclick = () => restoreBackup({ target: restoreInput });
  }

  const resetStatsBtn = document.getElementById("resetStatsBtn");

  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", () => {
      if (confirm("Möchtest du wirklich alle Statistikwerte zurücksetzen?")) {
        Storage.resetWordStats();
        alert("Statistik wurde zurückgesetzt.");
      }
    });
  }

  console.log("loadSettings() erfolgreich ausgeführt.");
}

// ------------------------------------------------------
// Einstellungen speichern (nur für AutoDelete)
// ------------------------------------------------------
function saveSettings() {
  const settings = Storage.loadSettings();

  const updated = {
    ...settings,
    autoDeleteEnabled: document.getElementById("autoDeleteEnabled").checked,
    autoDeleteThreshold:
      parseInt(document.getElementById("autoDeleteThreshold").value) || 10
  };

  Storage.saveSettings(updated);
  showStatus("Einstellungen gespeichert.");
}

// ------------------------------------------------------
// Backup herunterladen
// ------------------------------------------------------
export function downloadBackup() {
  const raw = localStorage.getItem(WORDS_KEY);
  if (!raw) {
    showStatus("Keine Wörter vorhanden.");
    return;
  }

  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "writeRight-backup.json";
  a.click();

  URL.revokeObjectURL(url);
  showStatus("Backup wurde heruntergeladen.");
}

// ------------------------------------------------------
// Backup wiederherstellen
// ------------------------------------------------------
export function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) {
    showStatus("Keine Datei ausgewählt.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = reader.result;
      const oldList = JSON.parse(json);

      const newList = oldList
        .map(obj => {
          if (!obj) return null;

          const text = obj.text ?? obj.Text ?? obj.Name ?? null;
          if (!text) return null;

          return {
            text,
            anzRichtig: obj.anzRichtig ?? obj.AnzRichtigGeschrieben ?? 0,
            anzFalsch: obj.anzFalsch ?? obj.AnzFalschGeschrieben ?? 0,
            falscheVarianten:
              obj.falscheVarianten ?? obj.DictFalscheWoerter ?? {}
          };
        })
        .filter(x => x !== null);

      localStorage.setItem(WORDS_KEY, JSON.stringify(newList));
      showStatus(`Backup wiederhergestellt. (${newList.length} Wörter)`);
    } catch (err) {
      console.error("Fehler beim Restore:", err);
      showStatus("Fehler beim Einlesen der Datei.");
    }
  };

  reader.readAsText(file);
}

// ------------------------------------------------------
// Statusmeldung anzeigen
// ------------------------------------------------------
function showStatus(msg) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

// ------------------------------------------------------
// DOMContentLoaded – Buttons verbinden & Settings laden
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Speichern-Button
  const saveBtn = document.getElementById("saveSettings");
  if (saveBtn) {
    saveBtn.onclick = () => saveSettings();
  }

  // Backup-Button
  const downloadBtn = document.getElementById("downloadBackup");
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadBackup();
  }

  // Fehlerbilanz-Umschalter (automatisch speichern)
  const fehlerbilanzToggle = document.getElementById("useFehlerbilanz");
  if (fehlerbilanzToggle) {
    fehlerbilanzToggle.addEventListener("change", () => {
      const s = Storage.loadSettings();
      Storage.saveSettings({
        ...s,
        useFehlerbilanz: fehlerbilanzToggle.checked
      });
    });
  }

  // Einstellungen initial laden
  loadSettings();
});
