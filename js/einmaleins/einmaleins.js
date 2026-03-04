import { EinmaleinsStorage } from "./einmaleins-storage.js";
import { EinmaleinsUI } from "./einmaleins-ui.js";

async function initEinmaleins() {
  await EinmaleinsStorage.init();
  EinmaleinsUI.init();
}

document.addEventListener("DOMContentLoaded", () => {
  initEinmaleins();
});
