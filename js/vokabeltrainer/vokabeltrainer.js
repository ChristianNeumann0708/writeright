import { Vokabel } from "./vokabel.js";
import { VokabelStorage } from "./vokabeltrainer-storage.js";
import { VokabelLogic } from "./vokabeltrainer-logic.js";
import { VokabelUI } from "./vokabeltrainer-ui.js";

async function initVokabeltrainer() {
  try {
    // 1) Vokabeln laden
    const vokabeln = VokabelStorage.loadVokabeln();
    VokabelLogic.init(vokabeln);

    // 2) UI initialisieren (Platzhalter)
    VokabelUI.init();

    console.log("Vokabeltrainer erfolgreich gestartet.");
  } catch (err) {
    console.error("Fehler beim Initialisieren des Vokabeltrainers:", err);
  }
}

initVokabeltrainer();
