export const StorageCore = {
  getItem(key) {
    const json = localStorage.getItem(key);
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  },

  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  removeItem(key) {
    localStorage.removeItem(key);
  }
};
