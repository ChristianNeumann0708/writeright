export function loadMenu() {
  const menu = `
    <nav class="main-menu">
      <h3>WriteRight</h3>
      <ul>
        <li><a href="index.html">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 3v18l15-9L5 3z" fill="currentColor"/>
          </svg>
          Trainer
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
  });
}
