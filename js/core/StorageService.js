
export class StorageService {
  constructor(dbName = "WriteRightDB", storeName = "data") {
    this.dbName = dbName;
    this.storeName = storeName;
    this._db = null;
  }

  async init() {
    try {
      this._db = await this._openDB();
    } catch (e) {
      console.error("StorageService: Failed to open IndexedDB", e);
    }
  }

  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async setItem(key, value) {
    // 1. LocalStorage (Primary sync cache)
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("StorageService: LocalStorage error (quota full?)", e);
    }

    // 2. IndexedDB (Async backup)
    if (this._db) {
      try {
        const tx = this._db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).put(value, key);
        // await tx.complete; // transaction.commit() is optional/automatic in many cases
      } catch (e) {
        console.error("StorageService: IndexedDB write error", e);
      }
    }
  }

  getItemSync(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("StorageService: LocalStorage read error", e);
    }
    return null;
  }

  async getItem(key) {
    // 1. Try LocalStorage
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("StorageService: LocalStorage read error", e);
    }

    // 2. Fallback: IndexedDB
    if (this._db) {
      try {
        return new Promise((resolve) => {
          const tx = this._db.transaction(this.storeName, "readonly");
          const req = tx.objectStore(this.storeName).get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      } catch (e) {
        console.error("StorageService: IndexedDB read error", e);
      }
    }

    return null;
  }

  async removeItem(key) {
    localStorage.removeItem(key);

    if (this._db) {
      try {
        const tx = this._db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).delete(key);
      } catch (e) {
        console.error("StorageService: IndexedDB delete error", e);
      }
    }
  }

  async clear() {
    localStorage.clear();

    if (this._db) {
      try {
        const tx = this._db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).clear();
      } catch (e) {
        console.error("StorageService: IndexedDB clear error", e);
      }
    }
  }
}

export const AppStorage = new StorageService();
