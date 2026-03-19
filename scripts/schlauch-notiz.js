import { showToast } from './utils.js';
import { state } from './state.js';
import { returnSchlauchNotizEntryTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   SCHLAUCH-NOTIZEN
═══════════════════════════════════════════════ */

/**
 * Prüft ob ein Notiz-Eintrag gesperrt ist (älter als 1 Minute).
 * @param {object} notiz - Der Notiz-Eintrag.
 * @returns {boolean} true wenn gesperrt.
 */
export function isNotizLocked(notiz) {
    return Date.now() - notiz.savedAtMs > 60000;
}

/**
 * Klappt einen Notiz-Eintrag auf oder zu.
 * @param {HTMLElement} entryEl - Das Eintragselement.
 */
export function toggleNotizEntry(entryEl) {
    entryEl.classList.toggle('open');
}

/**
 * Rendert die Notiz-Liste im Schlauch-Modal.
 */
export function renderSchlauchNotizList() {
    const listEl = document.getElementById('sc-notiz-list');
    if (!listEl) return;
    if (state.schlauchNotizEntries.length === 0) {
        listEl.innerHTML = '<div class="temp-empty">Noch keine Notizen</div>';
        return;
    }
    listEl.innerHTML = state.schlauchNotizEntries.map((notiz) => {
        let entryClass = 'temp-entry';
        if (isNotizLocked(notiz)) {
            entryClass += ' temp-locked';
        }
        return returnSchlauchNotizEntryTemplate(notiz, entryClass);
    }).join('');
}

/**
 * Öffnet das Notiz-Eingabe-Overlay.
 */
export function openNotizForm() {
    document.getElementById('sn-text').value = '';
    document.getElementById('schlauch-notiz-overlay').classList.add('open');
    document.getElementById('sn-text').focus();
}

/**
 * Schließt das Notiz-Eingabe-Overlay.
 */
export function closeNotizForm() {
    document.getElementById('schlauch-notiz-overlay').classList.remove('open');
}

/**
 * Speichert einen neuen Notiz-Eintrag in den State und aktualisiert die Liste.
 */
export function saveNotizEntry() {
    const text = document.getElementById('sn-text').value.trim();
    if (!text) {
        showToast('Bitte einen Notiztext eingeben.');
        return;
    }
    const now = new Date();
    state.schlauchNotizEntries.push({
        text,
        savedBy:        localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs:      now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    });
    closeNotizForm();
    renderSchlauchNotizList();
}
