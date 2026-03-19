import { state, COL_OPTIONS, STATUS_LABELS, saveToStorage } from './state.js';
import {
    returnStatsTemplate,
    returnSlotCardTemplate,
    returnSchlauchStatsTemplate,
    returnSchlauchCardTemplate,
} from './template.js';

/* ═══════════════════════════════════════════════
   VIEW-STEUERUNG
═══════════════════════════════════════════════ */

/**
 * Wechselt die aktive Ansicht und rendert neu.
 * @param {string} view - 'lager' oder 'schlauch'.
 */
export function setActiveView(view) {
    state.activeView = view;
    render();
}

/**
 * Aktualisiert alle view-abhängigen UI-Elemente (Buttons, Legende, Sub-Text, Tabs).
 */
function updateViewUI() {
    const isSchlauch = state.activeView === 'schlauch';

    if (isSchlauch) {
        document.querySelector('.legend').style.display = 'none';
        document.getElementById('add-btn').textContent  = '+ Schlauch hinzufügen';
        document.getElementById('sub').textContent      =
            `${state.schlauchSlots.length} Schläuche · Klicke auf einen Schlauch zum Bearbeiten`;
    } else {
        document.querySelector('.legend').style.display = '';
        document.getElementById('add-btn').textContent  = '+ Lager hinzufügen';
        document.getElementById('sub').textContent      =
            `${state.slots.length} Fächer geladen · Klicke auf ein Lager zum Bearbeiten`;
    }

    document.getElementById('tab-lager').classList.toggle('active', !isSchlauch);
    document.getElementById('tab-schlauch').classList.toggle('active', isSchlauch);
}

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */

/**
 * Rendert die Stats-Leiste passend zur aktiven Ansicht.
 */
function renderStats() {
    if (state.activeView === 'schlauch') {
        document.getElementById('stats').innerHTML = returnSchlauchStatsTemplate(state.schlauchSlots.length);
        return;
    }
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    state.slots.forEach(slot => counts[slot.status]++);
    document.getElementById('stats').innerHTML = returnStatsTemplate(state.slots.length, counts);
}

/* ═══════════════════════════════════════════════
   GRID – LAGER
═══════════════════════════════════════════════ */

/**
 * Rendert das Lager-Grid mit allen Slot-Karten.
 */
function renderLagerGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...state.slots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((slot) => {
        const card = document.createElement('div');
        card.className  = `slot ${slot.status}`;
        card.dataset.id = String(slot.id);

        const firstPartition = slot.partitions && slot.partitions[0];
        let lastPartie = '—';
        let fruchtart  = '';
        if (firstPartition) {
            fruchtart = firstPartition.fruchtart || '';
            if (firstPartition.parties && firstPartition.parties.length > 0) {
                lastPartie = firstPartition.parties[firstPartition.parties.length - 1].value;
            }
        }

        card.innerHTML = returnSlotCardTemplate(slot, lastPartie, STATUS_LABELS[slot.status], fruchtart, slot.partitions.length);
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className       = 'add-slot';
    addBtn.dataset.action  = 'add-slot';
    addBtn.innerHTML       = '<div class="plus">+</div><div>Lager hinzufügen</div>';
    grid.appendChild(addBtn);
}

/* ═══════════════════════════════════════════════
   GRID – SCHLÄUCHE
═══════════════════════════════════════════════ */

/**
 * Rendert das Schläuche-Grid mit allen Schlauch-Karten.
 */
function renderSchlauchGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...state.schlauchSlots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((schlauch) => {
        const card = document.createElement('div');
        card.className             = 'schlauch-card';
        card.dataset.schlauchId    = String(schlauch.id);

        let lastPartie = '—';
        if (schlauch.parties && schlauch.parties.length > 0) {
            lastPartie = schlauch.parties[schlauch.parties.length - 1].value;
        }

        card.innerHTML = returnSchlauchCardTemplate(schlauch, lastPartie);
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className       = 'add-slot';
    addBtn.dataset.action  = 'add-schlauch';
    addBtn.innerHTML       = '<div class="plus">+</div><div>Schlauch hinzufügen</div>';
    grid.appendChild(addBtn);
}

/**
 * Rendert das Grid passend zur aktiven Ansicht.
 */
function renderGrid() {
    if (state.activeView === 'schlauch') {
        renderSchlauchGrid();
        return;
    }
    renderLagerGrid();
}

/* ═══════════════════════════════════════════════
   HAUPT-RENDER
═══════════════════════════════════════════════ */

/**
 * Rendert Stats, Grid und UI-Elemente vollständig neu.
 */
export function render() {
    renderStats();
    renderGrid();
    updateViewUI();
}

/**
 * Wechselt das Grid-Layout und speichert den neuen Zustand.
 */
export function cycleLayout() {
    state.colIdx = (state.colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}
