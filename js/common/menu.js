export function loadMenu() {
  const menu = `
    <nav class="main-menu">
      <h3>WriteRight</h3>
      <ul>
        <li><a href="index.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12l9-9 9 9-9 9-9-9z" fill="currentColor"/>
          </svg>
          Start
        </a></li>

        <li><a href="worttrainer.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 3v18l15-9L5 3z" fill="currentColor"/>
          </svg>
          Worttrainer
        </a></li>

        <li><a href="vokabeltrainer.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16v16H4z" fill="currentColor"/>
          </svg>
          Vokabeltrainer
        </a></li>

        <li><a href="einmaleins.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          Einmaleins
        </a></li>

        <li><a href="import.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4m-9 5v4h10v-4" 
              stroke="currentColor" stroke-width="2" 
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Import
        </a></li>

        <li><a href="settings.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" 
              stroke="currentColor" stroke-width="2" 
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Einstellungen
        </a></li>

        <li><a href="info.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="10" x2="12" y2="16" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="7" r="1" fill="currentColor"/>
          </svg>
          Info
        </a></li>
      </ul>
    </nav>
  `;

  document.getElementById("main-menu").innerHTML = menu;

  const current = window.location.pathname.split("/").pop();
  document.querySelectorAll(".main-menu a").forEach(a => {
    if (a.getAttribute("href") === current) {
      a.classList.add("active");
    }

    a.addEventListener("click", (e) => {
      if (window.isTrainingActive) {
        // Mache ein kleines Popup auf, falls jemand während des Trainings wegklickt
        if (!confirm("Ein Training läuft gerade! Möchtest du wirklich abbrechen und die Seite verlassen?")) {
          e.preventDefault(); // Verhindert, dass der Link den Browser neu lädt
        }
      }
    });
  });
}

// Globale PWA Registrierung & Update Notification
// Wird ausgeführt, sobald dieses Modul geladen wird
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registriere den Service Worker relativ zum aktuellen Pfad
    // Da unsere HTML-Dateien im Hauptverzeichnis liegen, reicht './service-worker.js' in der Regel aus.
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registriert. Scope:', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker Registrierung fehlgeschlagen:', error);
      });

    // Auf Update-Nachrichten vom "activate"-Event des neuen Service Workers warten
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'UPDATED') {
        const updateToast = document.getElementById('updateToast');
        if (updateToast) {
          updateToast.classList.add('show');
          setTimeout(() => {
            updateToast.classList.remove('show');
          }, 3500); // Popup nach 3.5 Sekunden ausblenden
        } else {
          console.log('App Update verfügbar! (Toast UI Element fehlt)');
        }
      }
    });
  });
}
