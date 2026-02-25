import { WortLogic } from "./worttrainer-logic.js";
import { WortStorage } from "./worttrainer-storage.js";
import { Wort } from "../models/Wort.js";
import { addCorrect, addWrong, resetTimer } from "./timer.js";

export const WortUI = {
  init() {
    this.cacheDom();

    const settings = WortStorage.loadSettings();
    this.currentSort = settings.currentSort || "alpha";

    this.registerEvents();
    this.renderAll();
  },

  cacheDom() {
    this.listEl = document.getElementById("word-list");
    this.inputNeu = document.getElementById("input-new");
    this.inputFalsch = document.getElementById("input-falsch");
    this.display = document.getElementById("word-display");
    this.stats = document.getElementById("stats");
    this.variants = document.getElementById("wrong-variants");

    this.btnCorrect = document.getElementById("btn-correct");
    this.btnWrong = document.getElementById("btn-wrong");
    this.btnDelete = document.getElementById("btn-delete");
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.btnReset = document.getElementById("btn-reset");

    this.editCorrectInput = document.getElementById("wt-edit-correct");
    this.editWrongInput = document.getElementById("wt-edit-wrong");
    this.btnSaveStats = document.getElementById("wt-save-stats");

    this.sortWrapper = document.getElementById("wort-sort-wrapper");
    this.sortTrigger = document.getElementById("wort-sort-trigger");
    this.sortLabel = document.getElementById("wort-sort-label");
    this.sortOptionsList = document.querySelectorAll("#wort-sort-options li");
  },

  registerEvents() {
    this.btnCorrect.addEventListener("click", () => {
      if (WortLogic.firstAttempt) addCorrect();
      WortLogic.markCorrect();
      this.renderAll();
    });

    this.btnWrong.addEventListener("click", () => {
      if (WortLogic.firstAttempt) addWrong();
      WortLogic.markWrong();
      this.renderAll();
    });

    this.btnDelete.addEventListener("click", () => {
      WortLogic.deleteCurrent();
      this.renderAll();
    });

    this.btnPrev.addEventListener("click", () => {
      WortLogic.prevWord();
      this.renderAll();
    });

    this.btnNext.addEventListener("click", () => {
      WortLogic.nextWord();
      this.renderAll();
    });

    this.inputNeu.addEventListener("keydown", e => {
      if (e.key === "Enter") this.handleAdd();
    });

    this.inputFalsch.addEventListener("keydown", e => {
      if (e.key === "Enter") this.handleFalsch();
    });

    if (this.sortWrapper && this.sortOptionsList.length > 0) {
      const activeOption = Array.from(this.sortOptionsList).find(o => o.dataset.value === this.currentSort) || this.sortOptionsList[0];
      this.sortLabel.textContent = activeOption.textContent;

      this.sortTrigger.addEventListener("click", (e) => {
        this.sortWrapper.classList.toggle("open");
        e.stopPropagation();
      });

      document.addEventListener("click", () => {
        this.sortWrapper.classList.remove("open");
      });

      this.sortOptionsList.forEach(opt => {
        opt.addEventListener("click", (e) => {
          this.currentSort = opt.dataset.value;
          this.sortLabel.textContent = opt.textContent;
          const settings = WortStorage.loadSettings();
          WortStorage.saveSettings({
            ...settings,
            currentSort: this.currentSort
          });
          this.renderList();
          this.sortWrapper.classList.remove("open");
          e.stopPropagation();
        });
      });
    }

    this.btnReset.addEventListener("click", () => {
      resetTimer();
      WortLogic.firstAttempt = true;
      WortLogic.disableButtons = false;
      this.renderAll();
    });

    if (this.btnSaveStats) {
      this.btnSaveStats.addEventListener("click", () => {
        if (!WortLogic.currentWord) return;
        WortLogic.currentWord.anzRichtig = parseInt(this.editCorrectInput.value, 10) || 0;
        WortLogic.currentWord.anzFalsch = parseInt(this.editWrongInput.value, 10) || 0;
        WortStorage.saveWords(WortLogic.wortListe);
        this.renderAll();
      });
    }

    window.addEventListener('worttrainer-updated', async () => {
      const currentWords = await WortStorage.loadWords();
      WortLogic.init(currentWords);
      this.renderAll();
    });
  },

  handleAdd() {
    const text = this.inputNeu.value.trim();
    if (!text) return;

    let existing = WortLogic.wortListe.find(
      w => w.text.toLowerCase() === text.toLowerCase()
    );

    if (existing) {
      WortLogic.currentWord = existing;
      WortLogic.currentIndex = WortLogic.wortListe.indexOf(existing);
    } else {
      const neu = new Wort(text);
      WortLogic.wortListe.push(neu);
      WortStorage.saveWords(WortLogic.wortListe);

      WortLogic.currentWord = neu;
      WortLogic.currentIndex = WortLogic.wortListe.indexOf(neu);
    }

    this.inputNeu.value = "";
    this.renderAll();
  },

  handleFalsch() {
    const falsch = this.inputFalsch.value.trim();
    if (!falsch || !WortLogic.currentWord) return;

    if (WortLogic.firstAttempt) addWrong();

    WortLogic.currentWord.falschGeschrieben(falsch);
    WortLogic.firstAttempt = false;
    WortLogic.disableButtons = true;

    WortStorage.saveWords(WortLogic.wortListe);

    this.inputFalsch.value = "";
    this.renderAll();
  },

  renderAll() {
    this.renderList();
    this.renderCurrent();
    this.updateWordCount();

    this.btnCorrect.disabled = WortLogic.disableButtons;
    this.btnWrong.disabled = WortLogic.disableButtons;
  },

  renderList() {
    const list = WortLogic.wortListe;
    const settings = WortStorage.loadSettings();

    this.listEl.innerHTML = "";

    const currentSort = this.currentSort || "alpha";

    list
      .sort((a, b) => {
        if (currentSort !== "alpha") {
          return WortLogic.getScoreForWord(b, currentSort) -
                 WortLogic.getScoreForWord(a, currentSort);
        }
        return a.text.localeCompare(b.text);
      })
      .forEach(w => {
        const li = document.createElement("li");

        const extraHtml = currentSort !== "alpha"
          ? WortLogic.getListLabel(w, currentSort)
          : "";

        li.innerHTML = this.colorizeWord(w.text, w, currentSort) + " " + extraHtml;

        li.className =
          "wordlist-item" + (w === WortLogic.currentWord ? " active" : "");

        li.onclick = () => {
          WortLogic.currentWord = w;
          WortLogic.currentIndex = list.indexOf(w);
          this.renderAll();
        };

        this.listEl.appendChild(li);
      });
  },

  renderCurrent() {
    const w = WortLogic.currentWord;

    if (!w) {
      this.display.innerHTML =
        "<span>Bitte ein Wort auswählen oder eingeben.</span>";

      document.getElementById("stats-correct").textContent = 0;
      document.getElementById("stats-wrong").textContent = 0;
      document.getElementById("stats-diff").textContent = 0;

      this.variants.innerHTML = "";
      return;
    }

    const settings = WortStorage.loadSettings();

    this.display.innerHTML = this.colorizeWord(w.text, w, this.currentSort || "alpha");

    this.renderStats(w);

    if (!settings.tabletMode) {
      this.inputFalsch.focus();
    }
  },

  renderStats(w) {
    document.getElementById("stats-correct").textContent = w.anzRichtig;
    document.getElementById("stats-wrong").textContent = w.anzFalsch;

    const diff = w.fehlerbilanz;
    const diffEl = document.getElementById("stats-diff");
    diffEl.textContent = diff;

    diffEl.classList.remove("pos", "neg", "neutral");
    diffEl.classList.add(
      diff > 0 ? "neg" : diff < 0 ? "pos" : "neutral"
    );

    if (this.editCorrectInput) this.editCorrectInput.value = w.anzRichtig;
    if (this.editWrongInput) this.editWrongInput.value = w.anzFalsch;

    const dict = w.falscheVarianten;
    if (Object.keys(dict).length > 0) {
      this.variants.innerHTML =
        "<h4>Falsch geschriebene Varianten</h4><ul>" +
        Object.entries(dict)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `<li>${k} — ${v}</li>`)
          .join("") +
        "</ul>";
    } else {
      this.variants.innerHTML = "";
    }
  },

  updateWordCount() {
    const el = document.getElementById("wordCount");
    if (!el) return;
    el.textContent = `– ${WortLogic.wortListe.length} Wörter`;
  },

  colorizeWord(text, w, currentSort) {
    const value = currentSort === "balance-asc"
      ? w.fehlerbilanz
      : w.anzFalsch;

    if (value === 0) return text;

    const count = Math.min(Math.abs(value), text.length);
    const color = value > 0 ? "red" : "green";

    return text
      .split("")
      .map((ch, i) =>
        i < count ? `<span style="color:${color}">${ch}</span>` : ch
      )
      .join("");
  }
};
