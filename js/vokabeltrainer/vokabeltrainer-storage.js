// vokabeltrainer-storage.js
import { Vokabel } from "./vokabel.js";

const LOCAL_STORAGE_KEY = "vokabeltrainer-data";
const IDB_DB_NAME = "vokabeltrainer-db";
const IDB_STORE_NAME = "backup";
const IDB_KEY = "vokabeltrainer-backup";

class VokabelTrainerStorageClass {
  constructor() {
    this.data = {
      lists: [
        { id: "default", name: "Allgemeine Liste" }
      ],
      vokabeln: []
    };
    this._idb = null;
  }

  // ---------------------------------------
  // Initialisierung
  // ---------------------------------------

  async init() {
    const loaded = this._loadFromLocalStorage();
    if (!loaded) {
      const backupLoaded = await this._loadFromIndexedDB();
      if (!backupLoaded) {
        this._saveToLocalStorage();
        await this._saveToIndexedDB();
      }
    }
  }

  // ---------------------------------------
  // Öffentliche API: Listen
  // ---------------------------------------

  getLists() {
    return [...this.data.lists];
  }

  getListById(id) {
    return this.data.lists.find(l => l.id === id) || null;
  }

  createList(name) {
    const id = this._slugify(name);
    if (!this.data.lists.some(l => l.id === id)) {
      this.data.lists.push({ id, name });
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
    if (id === "default") return false; // Default-Liste nicht löschen

    this.data.lists = this.data.lists.filter(l => l.id !== id);
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
    return this.data.vokabeln
      .filter(v => v.list === listId)
      .map(v => Vokabel.fromJSON(v));
  }

  getVokabelById(id) {
    const raw = this.data.vokabeln.find(v => v.id === id);
    return raw ? Vokabel.fromJSON(raw) : null;
  }

  addVokabel(vokabelInstance) {
    const v = vokabelInstance instanceof Vokabel
      ? vokabelInstance
      : new Vokabel(vokabelInstance);

    // Duplikatprüfung: gleiches Wort + gleiche Liste
    const duplicate = this.data.vokabeln.find(
      existing =>
        existing.word.toLowerCase() === v.word.toLowerCase() &&
        existing.list === v.list
    );
    if (duplicate) {
      return { success: false, reason: "duplicate", existing: Vokabel.fromJSON(duplicate) };
    }

    this.data.vokabeln.push(v.toJSON());
    this._saveAndBackup();
    return { success: true, vokabel: v };
  }

  updateVokabel(vokabelInstance) {
    const v = vokabelInstance instanceof Vokabel
      ? vokabelInstance
      : new Vokabel(vokabelInstance);

    const index = this.data.vokabeln.findIndex(e => e.id === v.id);
    if (index === -1) return false;

    this.data.vokabeln[index] = v.toJSON();
    this._saveAndBackup();
    return true;
  }

  deleteVokabel(id) {
    const before = this.data.vokabeln.length;
    this.data.vokabeln = this.data.vokabeln.filter(v => v.id !== id);
    const changed = this.data.vokabeln.length !== before;
    if (changed) this._saveAndBackup();
    return changed;
  }

  moveVokabelToList(vokabelId, newListId) {
    const v = this.data.vokabeln.find(v => v.id === vokabelId);
    if (!v) return false;
    v.list = newListId;
    this._saveAndBackup();
    return true;
  }

  // ---------------------------------------
  // Duplikatprüfung
  // ---------------------------------------

  findDuplicate(word, listId) {
    const w = word.trim().toLowerCase();
    const found = this.data.vokabeln.find(
      v => v.list === listId && v.word.trim().toLowerCase() === w
    );
    return found ? Vokabel.fromJSON(found) : null;
  }

  // ---------------------------------------
  // LocalStorage
  // ---------------------------------------

  _loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      this._migrateStructure(parsed);
      this.data = parsed;
      return true;
    } catch (e) {
      console.error("Fehler beim Laden aus localStorage:", e);
      return false;
    }
  }

  _saveToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error("Fehler beim Speichern in localStorage:", e);
      return false;
    }
  }

  // ---------------------------------------
  // IndexedDB (Backup)
  // ---------------------------------------

  async _getIDB() {
    if (this._idb) return this._idb;

    this._idb = await new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = event => resolve(event.target.result);
      request.onerror = event => reject(event.target.error);
    });

    return this._idb;
  }

  async _saveToIndexedDB() {
    try {
      const db = await this._getIDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, "readwrite");
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.put(this.data, IDB_KEY);

        req.onsuccess = () => resolve();
        req.onerror = e => reject(e.target.error);
      });
      return true;
    } catch (e) {
      console.error("Fehler beim Speichern in IndexedDB:", e);
      return false;
    }
  }

  async _loadFromIndexedDB() {
    try {
      const db = await this._getIDB();
      const data = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, "readonly");
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(IDB_KEY);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = e => reject(e.target.error);
      });

      if (!data) return false;

      this._migrateStructure(data);
      this.data = data;
      this._saveToLocalStorage(); // nachladen in localStorage
      return true;
    } catch (e) {
      console.error("Fehler beim Laden aus IndexedDB:", e);
      return false;
    }
  }

  // ---------------------------------------
  // Gemeinsames Speichern
  // ---------------------------------------

  _saveAndBackup() {
    this._saveToLocalStorage();
    this._saveToIndexedDB();
  }

  // ---------------------------------------
  // Migration / Struktur absichern
  // ---------------------------------------

  _migrateStructure(parsed) {
    if (!parsed || typeof parsed !== "object") {
      parsed = {
        lists: [{ id: "default", name: "Allgemeine Liste" }],
        vokabeln: []
      };
    }

    if (!Array.isArray(parsed.lists)) {
      parsed.lists = [{ id: "default", name: "Allgemeine Liste" }];
    }

    if (!Array.isArray(parsed.vokabeln)) {
      // alte Struktur: lists mit eingebetteten vokabeln?
      if (Array.isArray(parsed.lists)) {
        const collected = [];
        for (const list of parsed.lists) {
          if (Array.isArray(list.vokabeln)) {
            for (const v of list.vokabeln) {
              const vok = Vokabel.fromJSON({
                ...v,
                list: list.id || "default"
              });
              collected.push(vok.toJSON());
            }
          }
        }
        parsed.vokabeln = collected;
      } else {
        parsed.vokabeln = [];
      }
    } else {
      // sicherstellen, dass jede Vokabel der neuen Struktur entspricht
      parsed.vokabeln = parsed.vokabeln.map(v => {
        const vok = Vokabel.fromJSON(v);
        return vok.toJSON();
      });
    }

    // sicherstellen, dass es mindestens eine Liste gibt
    if (parsed.lists.length === 0) {
      parsed.lists.push({ id: "default", name: "Allgemeine Liste" });
    }

    // sicherstellen, dass alle Vokabeln eine gültige Liste haben
    const listIds = new Set(parsed.lists.map(l => l.id));
    for (const v of parsed.vokabeln) {
      if (!v.list || !listIds.has(v.list)) {
        v.list = "default";
      }
    }
  }

  // ---------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------

  _slugify(name) {
    return name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/\-+/g, "-")
      || "liste";
  }
}

export const VokabelTrainerStorage = new VokabelTrainerStorageClass();
