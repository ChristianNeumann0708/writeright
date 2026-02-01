// indexedBackup-global.js – alte IndexedDB-Logik, aber als ES-Modul

async function save(dbName, storeName, json) {
  console.log("[indexedBackup] Starte Save-Vorgang…");

  let db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const upgradeDb = e.target.result;
      if (!upgradeDb.objectStoreNames.contains(storeName)) {
        upgradeDb.createObjectStore(storeName);
      }
    };
  });

  if (!db.objectStoreNames.contains(storeName)) {
    const newVersion = db.version + 1;
    db.close();

    db = await new Promise((resolve, reject) => {
      const upgradeReq = indexedDB.open(dbName, newVersion);

      upgradeReq.onerror = () => reject(upgradeReq.error);
      upgradeReq.onupgradeneeded = (e) => {
        const upgradeDb = e.target.result;
        upgradeDb.createObjectStore(storeName);
      };
      upgradeReq.onsuccess = () => resolve(upgradeReq.result);
    });
  }

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    const req = store.put(json, "backup");

    req.onsuccess = () => {
      const tsTx = db.transaction(storeName, "readwrite");
      tsTx.objectStore(storeName).put(Date.now().toString(), "backup_ts");
      resolve(true);
    };

    req.onerror = () => resolve(false);
  });
}

async function load(dbName, storeName) {
  console.log("[indexedBackup] Starte Load-Vorgang…");

  let db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const upgradeDb = e.target.result;
      if (!upgradeDb.objectStoreNames.contains(storeName)) {
        upgradeDb.createObjectStore(storeName);
      }
    };
  });

  if (!db.objectStoreNames.contains(storeName)) {
    const newVersion = db.version + 1;
    db.close();

    db = await new Promise((resolve, reject) => {
      const upgradeReq = indexedDB.open(dbName, newVersion);

      upgradeReq.onerror = () => reject(upgradeReq.error);
      upgradeReq.onupgradeneeded = (e) => {
        const upgradeDb = e.target.result;
        upgradeDb.createObjectStore(storeName);
      };
      upgradeReq.onsuccess = () => resolve(upgradeReq.result);
    });
  }

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    const req = store.get("backup");

    req.onsuccess = () => resolve(req.result || "");
    req.onerror = () => resolve("");
  });
}

async function clear(dbName, storeName) {
  return new Promise((resolve) => {
    const req = indexedDB.open(dbName);

    req.onerror = () => resolve(false);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    req.onsuccess = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(storeName)) {
        const newVersion = db.version + 1;
        db.close();

        const upgradeReq = indexedDB.open(dbName, newVersion);

        upgradeReq.onupgradeneeded = (ev) => {
          const upgradedDB = ev.target.result;
          upgradedDB.createObjectStore(storeName);
        };

        upgradeReq.onsuccess = () => resolve(true);
        return;
      }

      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      const clearReq = store.clear();

      clearReq.onsuccess = () => resolve(true);
      clearReq.onerror = () => resolve(false);
    };
  });
}

export const indexedBackup = { save, load, clear };
