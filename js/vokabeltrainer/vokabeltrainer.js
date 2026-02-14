import { AppStorage } from "../core/StorageService.js";
import { VokabelTrainerStorage } from "./vokabeltrainer-storage.js";
import { VokabelUI } from "./vokabeltrainer-ui.js";
import { VokabelLogic } from "./vokabeltrainer-logic.js";

async function initVokabeltrainer() {
  try {
    // 0) AppStorage initialisieren
    await AppStorage.init();

    // 1) Storage initialisieren (lädt localStorage + Backup)
    await VokabelTrainerStorage.init();

    // 2) UI initialisieren (Listen laden, Events setzen)
    VokabelUI.init();

    // 3) Logic vorbereiten (Trainer kommt später)
    VokabelLogic.init();

    console.log("Vokabeltrainer erfolgreich gestartet.");
  } catch (err) {
    console.error("Fehler beim Initialisieren des Vokabeltrainers:", err);
  }
}

initVokabeltrainer();
