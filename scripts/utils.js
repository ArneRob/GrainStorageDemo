/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */

if (localStorage.getItem('lager_auth') !== 'true') {
    window.location.href = 'index.html';
}

/**
 * Logs out the current user and redirects to the login page.
 */
export function logout() {
    localStorage.removeItem('lager_auth');
    localStorage.removeItem('lager_user');
    window.location.href = 'index.html';
}

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The raw string.
 * @returns {string} The escaped string.
 */
export function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Returns the current date and time as a formatted German locale string.
 * @returns {string} e.g. "19.03.2026 14:35"
 */
export function nowTimestamp() {
    const d = new Date();
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Displays a toast notification at the bottom of the screen.
 * @param {string} msg           - The message to display.
 * @param {number} [duration=2200] - Display duration in milliseconds.
 */
export function showToast(msg, duration = 2200) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}
