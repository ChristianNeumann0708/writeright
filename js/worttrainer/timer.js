// ------------------------------------------------------
// Globaler Session-Timer für WriteRight
// Läuft nur auf der Trainerseite (worttrainer.html)
// Wird NICHT dauerhaft gespeichert – startet neu beim App-Neustart
// ------------------------------------------------------

// Werte aus sessionStorage laden oder 0 setzen
let sessionSeconds = Number(sessionStorage.getItem("sessionSeconds")) || 0;
let sessionCorrect = Number(sessionStorage.getItem("sessionCorrect")) || 0;
let sessionWrong = Number(sessionStorage.getItem("sessionWrong")) || 0;
let sessionTotal = Number(sessionStorage.getItem("sessionTotal")) || 0;

let timerInterval = null;

// ------------------------------------------------------
// Timer starten (nur wenn nicht bereits aktiv)
// ------------------------------------------------------
export function startTimer() {
  if (timerInterval !== null) return;

  timerInterval = setInterval(() => {
    sessionSeconds++;
    sessionStorage.setItem("sessionSeconds", sessionSeconds);
    updateTimerUI();
  }, 1000);
}

// ------------------------------------------------------
// Timer pausieren
// ------------------------------------------------------
export function pauseTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ------------------------------------------------------
// Timer komplett zurücksetzen
// ------------------------------------------------------
export function resetTimer() {
  sessionSeconds = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionTotal = 0;

  sessionStorage.setItem("sessionSeconds", 0);
  sessionStorage.setItem("sessionCorrect", 0);
  sessionStorage.setItem("sessionWrong", 0);
  sessionStorage.setItem("sessionTotal", 0);

  updateTimerUI();
  updateSessionStatsUI();
}

// ------------------------------------------------------
// Zugriffsfunktionen für andere Module
// ------------------------------------------------------
export function addCorrect() {
  sessionCorrect++;
  sessionTotal++;

  sessionStorage.setItem("sessionCorrect", sessionCorrect);
  sessionStorage.setItem("sessionTotal", sessionTotal);

  updateSessionStatsUI();
}

export function addWrong() {
  sessionWrong++;
  sessionTotal++;

  sessionStorage.setItem("sessionWrong", sessionWrong);
  sessionStorage.setItem("sessionTotal", sessionTotal);

  updateSessionStatsUI();
}

// ------------------------------------------------------
// UI aktualisieren (Zeit)
// ------------------------------------------------------
function updateTimerUI() {
  const el = document.getElementById("session-timer");
  if (!el) return;

  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  el.textContent = `Zeit: ${mm}:${ss}`;
}

// ------------------------------------------------------
// UI aktualisieren (Richtig/Falsch/Gesamt)
// ------------------------------------------------------
function updateSessionStatsUI() {
  const c = document.getElementById("session-correct");
  const w = document.getElementById("session-wrong");
  const t = document.getElementById("session-total");

  if (c) c.textContent = `Richtig: ${sessionCorrect}`;
  if (w) w.textContent = `Falsch: ${sessionWrong}`;
  if (t) t.textContent = `Gesamt: ${sessionTotal}`;
}

// ------------------------------------------------------
// Beim Laden direkt UI aktualisieren
// ------------------------------------------------------
updateTimerUI();
updateSessionStatsUI();

// ------------------------------------------------------
// Automatische Steuerung je nach Seite
// ------------------------------------------------------
const currentPage = window.location.pathname.split("/").pop();

if (currentPage === "worttrainer.html" || currentPage === "") {
  startTimer();
} else {
  pauseTimer();
}
