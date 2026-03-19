import { state } from './state.js';
import { showToast } from './utils.js';
import { returnPartieItemTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   STATUS DROPDOWN
═══════════════════════════════════════════════ */

/**
 * Toggles the status dropdown open or closed.
 * @param {MouseEvent} event - The click event.
 */
export function toggleDropdown(event) {
    event.stopPropagation();
    document.getElementById('status-dropdown').classList.toggle('open');
}

/**
 * Selects a status from the dropdown list.
 * @param {HTMLElement} listItem - The clicked list item element.
 */
export function selectStatus(listItem) {
    const value = listItem.dataset.value;
    document.getElementById('f-status').value = value;
    document.getElementById('cs-label').textContent = listItem.querySelector('.badge').textContent;
    document.querySelectorAll('.cs-item').forEach(item => item.classList.remove('selected'));
    listItem.classList.add('selected');
    document.getElementById('status-dropdown').classList.remove('open');
}

/**
 * Sets the status dropdown to a specific value.
 * @param {string} value - The status value to select.
 */
export function setDropdownValue(value) {
    const listItem = document.querySelector(`.cs-item[data-value="${value}"]`);
    if (listItem) selectStatus(listItem);
}

/**
 * Enables or disables the status dropdown trigger button.
 * @param {boolean} disabled - true to lock, false to enable.
 */
export function setStatusDropdownDisabled(disabled) {
    const trigger = document.getElementById('status-trigger');
    if (!trigger) return;
    trigger.disabled      = disabled;
    trigger.style.opacity = disabled ? '0.5' : '';
    trigger.style.cursor  = disabled ? 'not-allowed' : '';
}

/**
 * Shows or hides the "Voll" option in the status dropdown.
 * @param {boolean} hidden - true to hide, false to show.
 */
export function setVollOptionHidden(hidden) {
    const vollItem = document.querySelector('.cs-item[data-value="voll"]');
    if (!vollItem) return;
    vollItem.style.display = hidden ? 'none' : '';
}

/* ═══════════════════════════════════════════════
   PARTY DROPDOWN
═══════════════════════════════════════════════ */

/**
 * Updates the label of the party number dropdown.
 */
export function renderPartieDropdownLabel() {
    let last = 'Keine vorhanden';
    if (state.editingParties.length > 0) {
        last = state.editingParties[state.editingParties.length - 1].value;
    }
    document.getElementById('pn-label').textContent = last;
}

/**
 * Toggles the party number dropdown open or closed.
 * @param {MouseEvent} event - The click event.
 */
export function togglePartieDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('partie-dropdown');
    const opening  = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open');
    if (opening) populatePartieList();
    document.getElementById('pn-new-row').style.display = 'none';
}

/**
 * Fills the party list in the dropdown with current entries.
 */
function populatePartieList() {
    const list = document.getElementById('pn-list');
    if (state.editingParties.length === 0) {
        list.innerHTML = '<li class="pn-empty">Noch keine Partie-Nummern</li>';
        return;
    }
    const reversed = [...state.editingParties].reverse();
    list.innerHTML = reversed.map(party => returnPartieItemTemplate(party)).join('');
}

/**
 * Shows the input field for adding a new party number.
 */
export function openNewPartieInput() {
    document.getElementById('partie-dropdown').classList.remove('open');
    const row = document.getElementById('pn-new-row');
    row.style.display = 'flex';
    document.getElementById('pn-new-input').value = '';
    document.getElementById('pn-new-input').focus();
}

/**
 * Confirms and saves a new party number to the editing state.
 */
export function confirmNewPartie() {
    const value = document.getElementById('pn-new-input').value.trim();
    if (!value) { showToast('Bitte Partie-Nummer eingeben.'); return; }
    const now = new Date();
    state.editingParties.push({
        value,
        addedAt:   now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                 + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        addedAtMs: now.getTime(),
    });
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('pn-new-input').value = '';
    renderPartieDropdownLabel();
    showToast('✓ Partie-Nummer hinzugefügt');
}
