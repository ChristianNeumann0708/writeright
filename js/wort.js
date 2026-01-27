export class Wort {
  constructor(text) {
    this.text = text;
    this.anzRichtig = 0;
    this.anzFalsch = 0;
    this.falscheVarianten = {};
  }

  richtigGeschrieben() {
    this.anzRichtig++;
  }

  falschGeschrieben(variante) {
    this.anzFalsch++;
    if (!variante) return;
    this.falscheVarianten[variante] = (this.falscheVarianten[variante] || 0) + 1;
  }

static fromJSON(obj) {
  // Text aus allen möglichen alten Formaten holen
  const text =
    obj.text ??        // neues Format
    obj.Text ??        // Blazor Format B
    obj.Name ?? "";    // Blazor Format A

  const w = new Wort(text);

  // Werte aus allen Formaten übernehmen
  w.anzRichtig =
    obj.anzRichtig ??
    obj.AnzRichtigGeschrieben ??
    0;

  w.anzFalsch =
    obj.anzFalsch ??
    obj.AnzFalschGeschrieben ??
    0;

  w.falscheVarianten =
    obj.falscheVarianten ??
    obj.DictFalscheWoerter ??
    {};

  return w;
}
}
