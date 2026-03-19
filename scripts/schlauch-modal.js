import { showToast, nowTimestamp } from './utils.js';
import { state, saveSchlauchToStorage } from './state.js';
import { render } from './render.js';
import { renderSchlauchNotizList } from './schlauch-notiz.js';
import { returnPartieItemTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   MODAL – ÖFFNEN / SCHLIEßEN
═══════════════════════════════════════════════ */

/**
 * Schließt das Schlauch-Modal.
 */
export function closeSchlauchModal() {
    document.getElementById('schlauch-overlay').classList.remove('open');
}

/**
 * Befüllt alle Modal-Felder anhand eines vorhandenen Schlauch-Datensatzes
 * oder setzt sie auf Leer-Zustand für ein neues Objekt.
 * @param {object|null} schlauch - Vorhandener Datensatz oder null für neu.
 */
function loadSchlauchModalContent(schlauch) {
    if (schlauch) {
        document.getElementById('sc-modal-title').textContent = `Schlauch ${schlauch.slotNumber}`;
        document.getElementById('sc-f-frucht').value          = schlauch.fruchtart || '';
        if (schlauch.parties) {
            state.schlauchEditingParties = schlauch.parties.map(partie => ({ ...partie }));
        } else {
            state.schlauchEditingParties = [];
        }
        if (schlauch.notizen) {
            state.schlauchNotizEntries = [...schlauch.notizen];
        } else {
            state.schlauchNotizEntries = [];
        }
        setSchlauchStandortValue(schlauch.standort || 'wiese');
        document.getElementById('sc-f-date').value            = schlauch.updated;
        document.getElementById('sc-del-btn').style.display   = 'inline-block';
    } else {
        document.getElementById('sc-modal-title').innerHTML =
            'Schlauch <input id="sc-f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
        document.getElementById('sc-f-frucht').value         = '';
        state.schlauchEditingParties                         = [];
        state.schlauchNotizEntries                           = [];
        setSchlauchStandortValue('wiese');
        document.getElementById('sc-f-date').value           = nowTimestamp();
        document.getElementById('sc-del-btn').style.display  = 'none';
    }
    renderSchlauchPartieDropdownLabel();
    renderSchlauchNotizList();
    document.getElementById('sc-pn-new-row').style.display = 'none';
}

/**
 * Öffnet das Modal zum Anlegen eines neuen Schlauchs.
 */
export function openSchlauchAdd() {
    state.editingSchlauchId = null;
    loadSchlauchModalContent(null);
    document.getElementById('schlauch-overlay').classList.add('open');
    document.getElementById('sc-f-num')?.focus();
}

/**
 * Öffnet das Modal zum Bearbeiten eines vorhandenen Schlauchs.
 * @param {number} id - Die ID des Schlauchs.
 */
export function openSchlauchEdit(id) {
    const schlauch = state.schlauchSlots.find(schlauchEintrag => schlauchEintrag.id === id);
    if (!schlauch) return;
    state.editingSchlauchId = id;
    loadSchlauchModalContent(schlauch);
    document.getElementById('schlauch-overlay').classList.add('open');
}

/* ═══════════════════════════════════════════════
   SPEICHERN / LÖSCHEN
═══════════════════════════════════════════════ */

/**
 * Ermittelt die Schlauch-Nummer – beim Bearbeiten aus dem Datensatz,
 * beim Anlegen aus dem Eingabefeld.
 * @returns {number} Die Schlauch-Nummer.
 */
function resolveSchlauchNumber() {
    if (state.editingSchlauchId !== null) {
        return state.schlauchSlots.find(schlauchEintrag => schlauchEintrag.id === state.editingSchlauchId)?.slotNumber;
    }
    return parseInt(document.getElementById('sc-f-num')?.value, 10) || state.schlauchNextId;
}

/**
 * Speichert den aktuellen Schlauch (neu oder bearbeitet).
 */
export function saveSchlauch() {
    if (state.schlauchEditingParties.length === 0) {
        showToast('Bitte mindestens eine Partie-Nummer hinzufügen.');
        return;
    }

    const slotNumber = resolveSchlauchNumber();
    const fruchtart  = document.getElementById('sc-f-frucht').value.trim();
    const standort   = document.getElementById('sc-f-standort').value;
    const updated    = nowTimestamp();
    const isNew      = state.editingSchlauchId === null;

    if (isNew) {
        state.schlauchSlots.push({
            id:        state.schlauchNextId++,
            slotNumber,
            fruchtart,
            parties:   state.schlauchEditingParties,
            standort,
            notizen:   state.schlauchNotizEntries,
            updated,
        });
    } else {
        const schlauch = state.schlauchSlots.find(schlauchEintrag => schlauchEintrag.id === state.editingSchlauchId);
        if (schlauch) {
            schlauch.fruchtart = fruchtart;
            schlauch.parties   = state.schlauchEditingParties;
            schlauch.standort  = standort;
            schlauch.notizen   = state.schlauchNotizEntries;
            schlauch.updated   = updated;
        }
    }

    saveSchlauchToStorage();
    closeSchlauchModal();
    render();

    if (isNew) {
        showToast('✓ Schlauch hinzugefügt');
    } else {
        showToast('✓ Schlauch gespeichert');
    }
}

/**
 * Löscht den aktuellen Schlauch nach Bestätigung.
 */
export function deleteSchlauch() {
    if (state.editingSchlauchId === null) return;
    const schlauch = state.schlauchSlots.find(schlauchEintrag => schlauchEintrag.id === state.editingSchlauchId);
    if (!confirm(`Schlauch ${schlauch.slotNumber} wirklich löschen?`)) return;
    state.schlauchSlots = state.schlauchSlots.filter(schlauchEintrag => schlauchEintrag.id !== state.editingSchlauchId);
    saveSchlauchToStorage();
    closeSchlauchModal();
    render();
    showToast('Schlauch gelöscht');
}

/* ═══════════════════════════════════════════════
   PARTIE-DROPDOWN
═══════════════════════════════════════════════ */

/**
 * Aktualisiert die Beschriftung des Partie-Dropdowns.
 */
export function renderSchlauchPartieDropdownLabel() {
    let last = 'Keine vorhanden';
    if (state.schlauchEditingParties.length > 0) {
        last = state.schlauchEditingParties[state.schlauchEditingParties.length - 1].value;
    }
    document.getElementById('sc-pn-label').textContent = last;
}

/**
 * Öffnet oder schließt das Partie-Dropdown.
 * @param {MouseEvent} event - Das Klick-Event.
 */
export function toggleSchlauchPartieDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('sc-partie-dropdown');
    const opening  = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open');
    if (opening) {
        populateSchlauchPartieList();
    }
    document.getElementById('sc-pn-new-row').style.display = 'none';
}

/**
 * Befüllt die Partie-Liste im Dropdown mit den aktuellen Einträgen.
 */
function populateSchlauchPartieList() {
    const listEl = document.getElementById('sc-pn-list');
    if (state.schlauchEditingParties.length === 0) {
        listEl.innerHTML = '<li class="pn-empty">Noch keine Partie-Nummern</li>';
        return;
    }
    const reversed = [...state.schlauchEditingParties].reverse();
    listEl.innerHTML = reversed.map(partie => returnPartieItemTemplate(partie)).join('');
}

/**
 * Zeigt das Eingabefeld für eine neue Partie-Nummer an.
 */
export function openSchlauchNewPartieInput() {
    document.getElementById('sc-partie-dropdown').classList.remove('open');
    const row = document.getElementById('sc-pn-new-row');
    row.style.display = 'flex';
    document.getElementById('sc-pn-new-input').value = '';
    document.getElementById('sc-pn-new-input').focus();
}

/**
 * Bestätigt und speichert eine neue Partie-Nummer im State.
 */
export function confirmSchlauchNewPartie() {
    const value = document.getElementById('sc-pn-new-input').value.trim();
    if (!value) {
        showToast('Bitte Partie-Nummer eingeben.');
        return;
    }
    const now = new Date();
    state.schlauchEditingParties.push({
        value,
        addedAt:   now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                 + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        addedAtMs: now.getTime(),
    });
    document.getElementById('sc-pn-new-row').style.display  = 'none';
    document.getElementById('sc-pn-new-input').value        = '';
    renderSchlauchPartieDropdownLabel();
    showToast('✓ Partie-Nummer hinzugefügt');
}

/* ═══════════════════════════════════════════════
   STANDORT-DROPDOWN (WIESE / ACKER)
═══════════════════════════════════════════════ */

/**
 * Öffnet oder schließt das Standort-Dropdown.
 * @param {MouseEvent} event - Das Klick-Event.
 */
export function toggleSchlauchStandortDropdown(event) {
    event.stopPropagation();
    document.getElementById('sc-standort-dropdown').classList.toggle('open');
}

/**
 * Setzt den Wert des Standort-Dropdowns und aktualisiert die Anzeige.
 * @param {string} value - 'wiese' oder 'acker'.
 */
export function setSchlauchStandortValue(value) {
    let label = 'Wiese';
    if (value === 'acker') {
        label = 'Acker';
    }
    document.getElementById('sc-standort-label').textContent = label;
    document.getElementById('sc-f-standort').value           = value;
    document.querySelectorAll('.sc-standort-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.value === value);
    });
    document.getElementById('sc-standort-dropdown').classList.remove('open');
}
