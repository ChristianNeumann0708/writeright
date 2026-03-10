/**
 * Ladet ein JavaScript-Objekt als JSON-Datei herunter.
 * 
 * @param {Object|Array} data - Die zu speichernden Daten
 * @param {string} prefix - Das Präfix für den Dateinamen (z.B. "vokabeltrainer")
 */
export function downloadJSON(data, prefix) {
  const json = JSON.stringify(data, null, 2);
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const filename = `${stamp}_${prefix}-backup.json`;

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Liest eine ausgewählte JSON-Datei asynchron ein und gibt das geparste Objekt zurück.
 *
 * @param {File} file - Das File-Objekt aus dem <input type="file">
 * @returns {Promise<any>} - Das geparste JSON-Resultat
 */
export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("no-file"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const clean = reader.result.replace(/^\uFEFF/, "").trim();
        const parsed = JSON.parse(clean);
        resolve(parsed);
      } catch (e) {
        reject(new Error("invalid-json"));
      }
    };

    reader.onerror = () => reject(new Error("file-read-error"));
    reader.readAsText(file);
  });
}
