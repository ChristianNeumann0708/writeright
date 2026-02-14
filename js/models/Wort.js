export class Wort {
  constructor(text) {
    this.text = text.trim();
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

  get fehlerbilanz() {
    return this.anzFalsch - this.anzRichtig;
  }

  toJSON() {
    return {
      text: this.text,
      anzRichtig: this.anzRichtig,
      anzFalsch: this.anzFalsch,
      falscheVarianten: this.falscheVarianten
    };
  }

  static fromJSON(obj) {
    const text =
      obj.text ??
      obj.Text ??
      obj.Name ??
      "";

    const w = new Wort(text);

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
