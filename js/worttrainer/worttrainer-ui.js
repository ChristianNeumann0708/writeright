import { WortLogic } from "./worttrainer-logic.js";
import { WortStorage } from "./worttrainer-storage.js";
import { Wort } from "./wort.js";

export const WortUI = {
  init() {
    this.cacheDom();
    this.registerEvents();
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

    this.sortToggle = document.getElementById("sortByMistakes");
  },

  registerEvents() {
    this.btnCorrect.addEventListener("click", () => {
      WortLogic.markCorrect();
      this.renderAll();
    });

    this.btnWrong.addEventListener("click", () => {
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

    this.sortToggle.addEventListener("change", () => {
      const settings = WortStorage.loadSettings();
      WortStorage.saveSettings({
        ...settings,
        sortByMistakes: this.sortToggle.checked
      });
      this.renderList();
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

    WortLogic.currentWord.falschGeschrieben(falsch);
    WortStorage.saveWords(WortLogic.wortListe);

    this.inputFalsch.value = "";
    this.renderAll();
  },

  renderAll() {
    this.renderList();
    this.renderCurrent();
    this.updateWordCount();
  },

  renderList() {
    const list = WortLogic.wortListe;
    const sortByMistakes = WortStorage.loadSettings().sortByMistakes;

    this.listEl.innerHTML = "";

    list
      .sort((a, b) => {
        if (sortByMistakes) {
          return WortLogic.getScoreForWord(b) - WortLogic.getScoreForWord(a);
        }
        return a.text.localeCompare(b.text);
      })
      .forEach(w => {
        const li = document.createElement("li");
        li.textContent = sortByMistakes
          ? `${w.text} (Δ ${w.fehlerbilanz})`
          : w.text;

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
      this.stats.textContent = "Richtig: 0 | Falsch: 0";
      this.variants.innerHTML = "";
      return;
    }

    this.display.textContent = w.text;
    this.renderStats(w);
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
  }
};
