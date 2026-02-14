import { Vokabel } from "../models/Vokabel.js";
import { AppStorage } from "../core/StorageService.js";

const STORAGE_KEY = "vokabeltrainer-data";

class VokabelTrainerStorageClass {
  constructor() {
    this.data = {
      lists: [{ id: "default", name: "Allgemeine Liste" }],
      listOrder: ["default"],
      vokabeln: []
    };
  }

  // ---------------------------------------
  // Initialisierung
  // ---------------------------------------
  async init() {
    // AppStorage is initialized globally usually, but we can ensure it here or in main
    // We just load data here
    await this.load();
  }

  // ---------------------------------------
  // Laden (modern, robust)
  // ---------------------------------------
  async load() {
    let parsed = await AppStorage.getItem(STORAGE_KEY);

    // Falls nichts geladen wurde → Default-Struktur
    if (!parsed) {
      parsed = {
        lists: [{ id: "default", name: "Allgemeine Liste" }],
        listOrder: ["default"],
        vokabeln: []
      };
    }

    // Migration ausführen
    parsed = this._migrateStructure(parsed);

    // Daten übernehmen
    this.data = parsed;

    // Konsistenz sichern (falls Default erstellt wurde oder Migration lief)
    this._saveAndBackup();
  }

  // ---------------------------------------
  // Öffentliche API: Listen
  // ---------------------------------------
  getLists() {
    const order = this.data.listOrder;
    const map = new Map(this.data.lists.map(l => [l.id, l]));
    const orderedLists = [];

    for (const id of order) {
      if (map.has(id)) {
        orderedLists.push(map.get(id));
      }
    }

    for (const l of this.data.lists) {
      if (!order.includes(l.id)) {
        orderedLists.push(l);
      }
    }

    return orderedLists;
  }

  getListById(id) {
    return this.data.lists.find(l => l.id === id) || null;
  }

  createList(name) {
    const id = this._slugify(name);

    if (!this.data.lists.some(l => l.id === id)) {
      this.data.lists.push({ id, name });
      this.data.listOrder.push(id);
      this._saveAndBackup();
    }

    return id;
  }

  renameList(id, newName) {
    const list = this.getListById(id);
    if (!list) return false;

    list.name = newName;
    this._saveAndBackup();
    return true;
  }

  deleteList(id) {
    if (id === "default") return false;

    this.data.lists = this.data.lists.filter(l => l.id !== id);
    this.data.listOrder = this.data.listOrder.filter(x => x !== id);
    this.data.vokabeln = this.data.vokabeln.filter(v => v.list !== id);

    this._saveAndBackup();
    return true;
  }

  // ---------------------------------------
  // Öffentliche API: Vokabeln
  // ---------------------------------------
  getAllVokabeln() {
    return this.data.vokabeln.map(v => Vokabel.fromJSON(v));
  }

  getVokabelnByList(listId) {
    const targetList = this.data.lists.find(l => l.id === listId);
    if (!targetList) return [];

    return this.data.vokabeln
      .filter(v => v.list === listId)
      .map(v => Vokabel.fromJSON(v));
  }

  getVokabelById(id) {
    const v = this.data.vokabeln.find(v => v.id === id);
    return v ? Vokabel.fromJSON(v) : null;
  }

  addVokabel(vokabelInstance) {
    const v = vokabelInstance instanceof Vokabel
      ? vokabelInstance
      : new Vokabel(vokabelInstance);

    const targetList = this.data.lists.find(l => l.id === v.list);
    if (!targetList) {
      v.list = "default";
    }

    const duplicate = this.data.vokabeln.find(
      existing =>
        existing.word.toLowerCase() === v.word.toLowerCase() &&
        existing.list === v.list
    );

    if (duplicate) {
      return {
        success: false,
        reason: "duplicate",
        existing: Vokabel.fromJSON(duplicate)
      };
    }

    this.data.vokabeln.push(v.toJSON());
    this._saveAndBackup();

    return { success: true, vokabel: v };
  }

  updateVokabel(vokabelInstance) {
    const v = vokabelInstance instanceof Vokabel
      ? vokabelInstance
      : new Vokabel(vokabelInstance);

    const targetList = this.data.lists.find(l => l.id === v.list);
    if (!targetList) {
      v.list = "default";
    }

    const index = this.data.vokabeln.findIndex(e => e.id === v.id);
    if (index === -1) return false;

    this.data.vokabeln[index] = v.toJSON();
    this._saveAndBackup();
    return true;
  }

  moveVokabelToList(vokabelId, newListId) {
    const targetList = this.data.lists.find(l => l.id === newListId);
    if (!targetList) return false;

    const v = this.data.vokabeln.find(v => v.id === vokabelId);
    if (!v) return false;

    v.list = newListId;
    this._saveAndBackup();
    return true;
  }

  deleteVokabel(id) {
    const before = this.data.vokabeln.length;
    this.data.vokabeln = this.data.vokabeln.filter(v => v.id !== id);
    const changed = this.data.vokabeln.length !== before;

    if (changed) {
      this._saveAndBackup();
    }

    return changed;
  }

  // ---------------------------------------
  // Duplikatprüfung
  // ---------------------------------------
  findDuplicate(word, listId) {
    const w = word.trim().toLowerCase();
    const targetList = this.data.lists.find(l => l.id === listId);
    if (!targetList) return null;

    const found = this.data.vokabeln.find(
      v =>
        v.list === listId &&
        v.word.trim().toLowerCase() === w
    );

    return found ? Vokabel.fromJSON(found) : null;
  }

  // ---------------------------------------
  // Backup herunterladen
  // ---------------------------------------
  downloadBackup() {
    const json = JSON.stringify(this.data, null, 2);

    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const filename = `${stamp}_vokabeltrainer-backup.json`;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  // ---------------------------------------
  // Backup wiederherstellen
  // ---------------------------------------
  async restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result);

          const migrated = this._migrateStructure(parsed);

          this.data = migrated;

          this._saveAndBackup();

          resolve(true);
        } catch (e) {
          reject(e);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // ---------------------------------------
  // Gemeinsames Speichern
  // ---------------------------------------
  _saveAndBackup() {
    AppStorage.setItem(STORAGE_KEY, this.data);

    if (typeof this._autoBackup === "function") {
      try {
        this._autoBackup();
      } catch (e) {
        console.error("Fehler beim automatischen Backup:", e);
      }
    }
  }

  // ---------------------------------------
  // Migration
  // ---------------------------------------
  _migrateStructure(parsed) {
    if (!parsed || typeof parsed !== "object") {
      parsed = {
        lists: [{ id: "default", name: "Allgemeine Liste" }],
        listOrder: ["default"],
        vokabeln: []
      };
    }

    if (!Array.isArray(parsed.lists)) {
      parsed.lists = [{ id: "default", name: "Allgemeine Liste" }];
    }

    if (!Array.isArray(parsed.listOrder)) {
      parsed.listOrder = parsed.lists.map(l => l.id);
    }

    if (!Array.isArray(parsed.vokabeln)) {
      parsed.vokabeln = [];
    } else {
      parsed.vokabeln = parsed.vokabeln.map(v => {
        const vok = Vokabel.fromJSON(v);
        return vok.toJSON();
      });
    }

    if (parsed.lists.length === 0) {
      parsed.lists.push({ id: "default", name: "Allgemeine Liste" });
    }

    const listIds = new Set(parsed.lists.map(l => l.id));
    for (const v of parsed.vokabeln) {
      if (!v.list || !listIds.has(v.list)) {
        v.list = "default";
      }
    }

    return parsed;
  }

  // ---------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------
  _slugify(name) {
    return (
      name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-") || "liste"
    );
  }
}

export const VokabelTrainerStorage = new VokabelTrainerStorageClass();
