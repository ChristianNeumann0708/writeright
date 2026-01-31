import { WortStorage } from "./worttrainer-storage.js";
import { WortLogic } from "./worttrainer-logic.js";
import { WortUI } from "./worttrainer-ui.js";

async function initWorttrainer() {
  try {
    // 1) Wörter laden
    const words = WortStorage.loadWords();
    WortLogic.init(words);

    // 2) Einstellungen laden
    const settings = WortStorage.loadSettings();
    WortLogic.autoDeleteEnabled = settings.autoDeleteEnabled;
    WortLogic.autoDeleteThreshold = settings.autoDeleteThreshold;

    // 3) UI initialisieren
    WortUI.init();
    WortUI.renderAll();

    console.log("Worttrainer erfolgreich gestartet.");
  } catch (err) {
    console.error("Fehler beim Initialisieren des Worttrainers:", err);
  }
}

// Starten
initWorttrainer();
