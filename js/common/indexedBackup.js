// wwwroot/js/indexedBackup.js
(function () {
  function openDb(dbName, storeName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 4);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function save(dbName, storeName, json) {
    console.log("[indexedBackup] Starte Save-Vorgang…");

    // 1. DB öffnen
    let db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);

      req.onerror = () => {
        console.warn("[indexedBackup] Konnte DB nicht öffnen.");
      reject(req.error);
      };

      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const upgradeDb = e.target.result;
        if (!upgradeDb.objectStoreNames.contains(storeName)) {
          console.log(`[indexedBackup] Store '${storeName}' fehlte. Erstelle ihn…`);
          upgradeDb.createObjectStore(storeName);
          } 
      };
    });

    // 2. Prüfen, ob Store existiert
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`[indexedBackup] Store '${storeName}' fehlt. Erhöhe DB-Version…`);

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

    // 3. Speichern
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      const req = store.put(json, "backup");

      req.onsuccess = () => {
        // Timestamp aktualisieren
        const tsTx = db.transaction(storeName, "readwrite");
        tsTx.objectStore(storeName).put(Date.now().toString(), "backup_ts");

        console.log("[indexedBackup] Backup erfolgreich gespeichert.");
        resolve(true);
      };

      req.onerror = () => {
        console.warn("[indexedBackup] Fehler beim Speichern.");
        resolve(false);
      };
    });
  }

  async function load(dbName, storeName) {
    console.log("[indexedBackup] Starte Load-Vorgang…");

    // 1. DB öffnen
    let db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);

      req.onerror = () => {
        console.warn("[indexedBackup] Konnte DB nicht öffnen.");
      reject(req.error);
      };

      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const upgradeDb = e.target.result;
        if (!upgradeDb.objectStoreNames.contains(storeName)) {
          console.log(`[indexedBackup] Store '${storeName}' fehlte. Erstelle ihn…`);
          upgradeDb.createObjectStore(storeName);
        }
      };
    });

    // 2. Prüfen, ob Store existiert
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`[indexedBackup] Store '${storeName}' fehlt. Erhöhe DB-Version…`);

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

    // 3. Backup laden
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      const req = store.get("backup");

      req.onsuccess = () => {
        const result = req.result;
        if (result) {
          console.log("[indexedBackup] Backup erfolgreich geladen.");
          resolve(result);
        } else {
          console.log("[indexedBackup] Kein Backup gefunden.");
          resolve("");
        }
      };

      req.onerror = () => {
        console.warn("[indexedBackup] Fehler beim Laden.");
        resolve("");
      };
    });
  }


  const indexedBackup = {
  clear(dbName, storeName) {
    return new Promise((resolve) => {
      console.log("[indexedBackup] Starte Clear-Vorgang…");

      const req = indexedDB.open(dbName);

      req.onerror = () => {
        console.warn("[indexedBackup] Konnte DB nicht öffnen. Clear übersprungen.");
        resolve(false);
      };

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        console.log("[indexedBackup] onupgradeneeded ausgelöst.");

        if (!db.objectStoreNames.contains(storeName)) {
          console.log(`[indexedBackup] Store '${storeName}' existiert nicht. Erstelle ihn…`);
          db.createObjectStore(storeName);
        }
      };

      req.onsuccess = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
          console.warn(`[indexedBackup] Store '${storeName}' fehlt. Erstelle ihn dynamisch…`);

          // DB-Version erhöhen, um Store anzulegen
          const newVersion = db.version + 1;
          db.close();

          const upgradeReq = indexedDB.open(dbName, newVersion);

          upgradeReq.onupgradeneeded = (ev) => {
            const upgradedDB = ev.target.result;
            upgradedDB.createObjectStore(storeName);
          };

          upgradeReq.onsuccess = () => {
            console.log("[indexedBackup] Store erfolgreich angelegt. Clear abgeschlossen.");
            resolve(true);
          };

          return;
        }

        // Store existiert → jetzt leeren
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const clearReq = store.clear();

        clearReq.onsuccess = () => {
          console.log("[indexedBackup] Store erfolgreich geleert.");
          resolve(true);
        };

        clearReq.onerror = () => {
          console.warn("[indexedBackup] Fehler beim Leeren des Stores.");
          resolve(false);
        };
      };
    });
  }
};

  window.indexedBackup = {
  save,
  load,
  clear: indexedBackup.clear
};

})();
