import { WortStorage } from "./worttrainer-storage.js";
import { WortLogic } from "./worttrainer-logic.js";
import { WortUI } from "./worttrainer-ui.js";

async function init() {
  const words = WortStorage.loadWords();
  WortLogic.init(words);

  const settings = WortStorage.loadSettings();
  WortLogic.autoDeleteEnabled = settings.autoDeleteEnabled;
  WortLogic.autoDeleteThreshold = settings.autoDeleteThreshold;

  WortUI.init();
  WortUI.renderAll();
}

init();
