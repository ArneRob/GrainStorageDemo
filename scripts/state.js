import { showToast } from './utils.js';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */

export const STORAGE_KEY = 'lager_slots';
export const COL_KEY = 'lager_col_idx';
export const ARCHIVE_KEY = 'lager_archiv';
export const HOSE_KEY = 'lager_schlauch_slots';
export const COL_OPTIONS = [2, 3];

export const STATUS_LABELS = {
    leer: 'Ungereinigt',
    voll: 'Voll',
    gereinigt: 'Gereinigt',
    reserviert: 'Reserviert',
};

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */

export const state = {
    slots: [],
    nextId: 1,
    editingId: null,
    editingPartitions: [],
    activePartitionIdx: 0,
    tempEntries: [],
    editingParties: [],
    colIdx: 0,

    activeView: 'lager',
    hoseSlots: [],
    hoseNextId: 1,
    editingHoseId: null,
    hoseEditingParties: [],
    weightNoteEntries: [],
};

/* ═══════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════ */

/**
 * Migrates a single slot from an older data format to the current format.
 * Adds a fallback slotNumber and wraps legacy fields into a partitions array if needed.
 * @param {Object} slot - The slot object to migrate.
 * @param {number} index - The index of the slot in the array (used as slotNumber fallback).
 */
function migrateLegacySlot(slot, index) {
    if (slot.slotNumber == null) {
        slot.slotNumber = index + 5;
    }
    if (!slot.partitions) {
        slot.partitions = [{
            label: 'A',
            fruchtart: slot.fruchtart || '',
            parties: slot.parties || [],
            temperatures: slot.temperatures || [],
        }];
    }
}

/**
 * Loads slot data from localStorage into state.slots and state.nextId.
 * Falls back to defaultSlots() if no data exists or parsing fails.
 */
function loadSlotsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            state.slots = JSON.parse(raw);
            state.slots.forEach((slot, index) => migrateLegacySlot(slot, index));
            state.nextId = state.slots.reduce((max, slot) => Math.max(max, slot.id), 0) + 1;
        } else {
            state.slots = defaultSlots();
            state.nextId = state.slots.length + 1;
        }
    } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        state.slots = defaultSlots();
        state.nextId = state.slots.length + 1;
    }
}

/**
 * Loads the column index setting from localStorage into state.colIdx.
 */
function loadColIdxFromStorage() {
    try {
        const colIndex = localStorage.getItem(COL_KEY);
        if (colIndex !== null) state.colIdx = parseInt(colIndex, 10);
    } catch (_) { }
}

/**
 * Loads all persistent state from localStorage (slots and column index).
 */
export function loadFromStorage() {
    loadSlotsFromStorage();
    loadColIdxFromStorage();
}

/**
 * Reads and parses the archive object from localStorage.
 * @returns {Object} The parsed archive, or an empty object if none exists.
 */
export function loadArchive() {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) {
        return JSON.parse(raw);
    }
    return {};
}

/**
 * Writes the archive object back to localStorage.
 * @param {Object} archive - The archive object to persist.
 */
function saveArchive(archive) {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
}

/**
 * Builds a German-formatted date/time string used as the archive entry key.
 * @returns {string} e.g. "20.03.2026 14:05"
 */
function buildArchiveDateKey() {
    const now = new Date();
    const date = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

/**
 * Writes a partition's data into the archive under the given compartment and grain key.
 * @param {string} compartmentKey - e.g. "Lager 5"
 * @param {string} grainKey - e.g. "Hafer"
 * @param {string[]} partyValues - List of party numbers.
 * @param {Object[]} temperatures - List of temperature entries.
 */
function writeToArchive(compartmentKey, grainKey, partyValues, temperatures) {
    const archive = loadArchive();
    const dateKey = buildArchiveDateKey();

    if (!archive[compartmentKey]) archive[compartmentKey] = {};
    if (!archive[compartmentKey][dateKey]) archive[compartmentKey][dateKey] = {};

    archive[compartmentKey][dateKey][grainKey] = {
        partien: partyValues,
        temperaturen: temperatures,
    };

    saveArchive(archive);
}

export function archiveSlotData(slot) {
    try {
        const compartmentKey = `Lager ${slot.slotNumber}`;
        slot.partitions.forEach(partition => {
            const grainKey = partition.fruchtart || 'Unbekannt';
            writeToArchive(compartmentKey, grainKey, partition.parties.map(party => party.value), partition.temperatures);
        });
    } catch (error) {
        console.warn('Archiving failed:', error);
    }
}

export function archivePartitionData(slot, partition) {
    try {
        const compartmentKey = `Lager ${slot.slotNumber}`;
        const grainKey = partition.fruchtart || 'Unbekannt';
        writeToArchive(compartmentKey, grainKey, partition.parties.map(party => party.value), partition.temperatures);
    } catch (error) {
        console.warn('Archiving failed:', error);
    }
}

export function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.slots));
        localStorage.setItem(COL_KEY, String(state.colIdx));
    } catch (error) {
        console.warn('Failed to write to localStorage:', error);
        showToast('⚠ Speichern fehlgeschlagen – localStorage voll?');
    }
}

/* ═══════════════════════════════════════════════
   HOSE STORAGE
═══════════════════════════════════════════════ */

/**
 * Loads hose data from localStorage into the state.
 */
export function loadHoseFromStorage() {
    try {
        const raw = localStorage.getItem(HOSE_KEY);
        if (raw) {
            state.hoseSlots = JSON.parse(raw);
            state.hoseNextId = state.hoseSlots.reduce((max, hose) => Math.max(max, hose.id), 0) + 1;
        } else {
            state.hoseSlots = [];
            state.hoseNextId = 1;
        }
    } catch (error) {
        console.warn('Failed to read hose data from localStorage:', error);
        state.hoseSlots = [];
        state.hoseNextId = 1;
    }
}

/**
 * Saves hose data from the state into localStorage.
 */
export function saveHoseToStorage() {
    try {
        localStorage.setItem(HOSE_KEY, JSON.stringify(state.hoseSlots));
    } catch (error) {
        console.warn('Failed to write hose data to localStorage:', error);
        showToast('⚠ Speichern fehlgeschlagen – localStorage voll?');
    }
}

function defaultSlots() {
    const p = (value, dateDisplay, ms) => ({ value, addedAt: dateDisplay, addedAtMs: ms });
    const tmp = (von, bis, sicht, massnahmen, savedBy, dateDisplay2y, ms) => ({
        von, bis, sicht, massnahmen, savedBy, savedAtMs: ms, savedAtDisplay: dateDisplay2y,
    });

    return [
        // Lager 1 – Weizen, 2 Partien, 3 Temperatureinträge
        {
            id: 1, slotNumber: 1, status: 'voll', updated: '15.01.2026 09:30',
            partitions: [{
                label: 'A', fruchtart: 'Weizen',
                parties: [
                    p('66-2501', '12.10.2025', 1760227200000),
                    p('66-2502', '05.11.2025', 1762300800000),
                ],
                temperatures: [
                    tmp(10.4, 12.1, 'o.B.', 'Keine Maßnahmen erforderlich', 'Klaus Müller', '12.10.25', 1760227200000),
                    tmp(11.2, 13.0, 'Geruch unauffällig', 'Belüftung 1h aktiviert', 'Sarah Bauer', '05.11.25', 1762300800000),
                    tmp(11.8, 13.4, 'o.B.', 'Keine Maßnahmen erforderlich', 'Thomas Schneider', '15.01.26', 1768435200000),
                ],
            }],
        },
        // Lager 2 – Dinkel im Sp., 1 Partie, 2 Temperatureinträge
        {
            id: 2, slotNumber: 2, status: 'voll', updated: '08.02.2026 11:15',
            partitions: [{
                label: 'A', fruchtart: 'Dinkel im Sp.',
                parties: [
                    p('23-1102', '20.10.2025', 1760918400000),
                ],
                temperatures: [
                    tmp(9.8, 11.5, 'o.B., keine Schädlinge', 'Keine Maßnahmen erforderlich', 'Anna Weber', '20.10.25', 1760918400000),
                    tmp(10.1, 11.9, 'Feuchtigkeit i.O.', 'Belüftungsanlage 2h aktiviert', 'Michael Fischer', '08.02.26', 1770508800000),
                ],
            }],
        },
        // Lager 3 – leer
        {
            id: 3, slotNumber: 3, status: 'leer', updated: '03.12.2025 08:00',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 4 – Roggen, 3 Partien, 2 Temperatureinträge
        {
            id: 4, slotNumber: 4, status: 'voll', updated: '12.11.2025 08:15',
            partitions: [{
                label: 'A', fruchtart: 'Roggen',
                parties: [
                    p('66-3301', '01.09.2025', 1756684800000),
                    p('66-3302', '16.09.2025', 1757980800000),
                    p('66-3303', '12.11.2025', 1762905600000),
                ],
                temperatures: [
                    tmp(12.3, 14.6, 'leichte Erwärmung festgestellt', 'Belüftungsanlage 3h aktiviert', 'Julia Hoffmann', '16.09.25', 1757980800000),
                    tmp(11.5, 13.2, 'o.B.', 'Keine Maßnahmen erforderlich', 'Peter Wagner', '12.11.25', 1762905600000),
                ],
            }],
        },
        // Lager 5 – Triticale, 1 Partie, 1 Temperatureintrag
        {
            id: 5, slotNumber: 5, status: 'voll', updated: '03.12.2025 14:30',
            partitions: [{
                label: 'A', fruchtart: 'Triticale',
                parties: [
                    p('25-0581', '03.12.2025', 1764720000000),
                ],
                temperatures: [
                    tmp(10.9, 12.7, 'o.B., Probe entnommen', 'Probe ans Labor geschickt', 'Maria Braun', '03.12.25', 1764720000000),
                ],
            }],
        },
        // Lager 6 – gereinigt
        {
            id: 6, slotNumber: 6, status: 'gereinigt', updated: '20.03.2026 07:45',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 7 – Gerste, 2 Partien, 3 Temperatureinträge
        {
            id: 7, slotNumber: 7, status: 'voll', updated: '08.02.2026 11:20',
            partitions: [{
                label: 'A', fruchtart: 'Gerste',
                parties: [
                    p('66-4401', '20.09.2025', 1758326400000),
                    p('23-4402', '15.10.2025', 1760572800000),
                ],
                temperatures: [
                    tmp(13.1, 15.3, 'leichte Staubentwicklung beim Öffnen', 'Belüftung eingeschaltet, Kontrolle in 3 Tagen', 'Stefan Koch', '20.09.25', 1758326400000),
                    tmp(12.4, 14.1, 'o.B.', 'Keine Maßnahmen erforderlich', 'Lena Richter', '03.12.25', 1764720000000),
                    tmp(11.8, 13.5, 'Geruch unauffällig', 'Temperaturkontrolle engmaschiger', 'Hans Schäfer', '08.02.26', 1770508800000),
                ],
            }],
        },
        // Lager 9 – reserviert
        {
            id: 8, slotNumber: 9, status: 'reserviert', updated: '20.03.2026 09:00',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 10 – Emmer, 1 Partie, 2 Temperatureinträge
        {
            id: 9, slotNumber: 10, status: 'voll', updated: '15.01.2026 10:00',
            partitions: [{
                label: 'A', fruchtart: 'Emmer',
                parties: [
                    p('25-0620', '15.01.2026', 1768435200000),
                ],
                temperatures: [
                    tmp(9.2, 11.0, 'o.B.', 'Keine Maßnahmen erforderlich', 'Monika Klein', '15.01.26', 1768435200000),
                    tmp(9.6, 11.4, 'Feuchtigkeit i.O., keine Schädlinge', 'Keine Maßnahmen erforderlich', 'Klaus Müller', '20.03.26', 1773964800000),
                ],
            }],
        },
        // Lager 11 – leer
        {
            id: 10, slotNumber: 11, status: 'leer', updated: '03.12.2025 08:00',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 12 – Hafer, 2 Partien, 2 Temperatureinträge
        {
            id: 11, slotNumber: 12, status: 'voll', updated: '12.11.2025 14:00',
            partitions: [{
                label: 'A', fruchtart: 'Hafer',
                parties: [
                    p('66-5501', '10.10.2025', 1760054400000),
                    p('66-5502', '12.11.2025', 1762905600000),
                ],
                temperatures: [
                    tmp(11.7, 13.9, 'o.B.', 'Keine Maßnahmen erforderlich', 'Anna Weber', '10.10.25', 1760054400000),
                    tmp(12.1, 14.3, 'leichte Erwärmung', 'Belüftung 2h, Kontrolle in 3 Tagen', 'Thomas Schneider', '12.11.25', 1762905600000),
                ],
            }],
        },
        // Lager 13 – gereinigt
        {
            id: 12, slotNumber: 13, status: 'gereinigt', updated: '15.01.2026 07:30',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 14 – 2 Abschnitte: Weizen br. (A) + SBK (B)
        {
            id: 13, slotNumber: 14, status: 'voll', updated: '05.11.2025 09:10',
            partitions: [
                {
                    label: 'A', fruchtart: 'Weizen br.',
                    parties: [
                        p('23-6601', '02.10.2025', 1759449600000),
                        p('23-6602', '05.11.2025', 1762300800000),
                    ],
                    temperatures: [
                        tmp(10.5, 12.2, 'o.B.', 'Keine Maßnahmen erforderlich', 'Julia Hoffmann', '02.10.25', 1759449600000),
                        tmp(10.9, 12.7, 'Probe entnommen', 'Probe ans Labor geschickt', 'Peter Wagner', '05.11.25', 1762300800000),
                    ],
                },
                {
                    label: 'B', fruchtart: 'SBK',
                    parties: [
                        p('23-6610', '05.11.2025', 1762300800000),
                    ],
                    temperatures: [
                        tmp(9.8, 11.6, 'o.B.', 'Keine Maßnahmen erforderlich', 'Maria Braun', '05.11.25', 1762300800000),
                    ],
                },
            ],
        },
        // Lager 15 – reserviert
        {
            id: 14, slotNumber: 15, status: 'reserviert', updated: '20.03.2026 08:30',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 16 – Raps, 1 Partie, 2 Temperatureinträge
        {
            id: 15, slotNumber: 16, status: 'voll', updated: '20.10.2025 10:30',
            partitions: [{
                label: 'A', fruchtart: 'Raps',
                parties: [
                    p('66-7701', '20.10.2025', 1760918400000),
                ],
                temperatures: [
                    tmp(8.4, 10.2, 'o.B., keine Schädlinge', 'Keine Maßnahmen erforderlich', 'Stefan Koch', '20.10.25', 1760918400000),
                    tmp(8.9, 10.8, 'Geruch unauffällig', 'Keine Maßnahmen erforderlich', 'Lena Richter', '15.01.26', 1768435200000),
                ],
            }],
        },
        // Lager 19 – Soja, 2 Partien, 1 Temperatureintrag
        {
            id: 16, slotNumber: 19, status: 'voll', updated: '03.12.2025 11:00',
            partitions: [{
                label: 'A', fruchtart: 'Soja',
                parties: [
                    p('25-0819', '12.11.2025', 1762905600000),
                    p('25-0820', '03.12.2025', 1764720000000),
                ],
                temperatures: [
                    tmp(11.3, 13.1, 'o.B.', 'Keine Maßnahmen erforderlich', 'Hans Schäfer', '03.12.25', 1764720000000),
                ],
            }],
        },
        // Lager 20 – 2 Abschnitte: Raps (A) + SBK (B)
        {
            id: 17, slotNumber: 20, status: 'voll', updated: '20.10.2025 13:00',
            partitions: [
                {
                    label: 'A', fruchtart: 'Raps',
                    parties: [
                        p('66-9901', '16.09.2025', 1757980800000),
                    ],
                    temperatures: [
                        tmp(9.1, 10.9, 'o.B.', 'Keine Maßnahmen erforderlich', 'Monika Klein', '16.09.25', 1757980800000),
                        tmp(9.5, 11.3, 'Feuchtigkeit i.O.', 'Belüftung 1h aktiviert', 'Klaus Müller', '12.11.25', 1762905600000),
                    ],
                },
                {
                    label: 'B', fruchtart: 'SBK',
                    parties: [
                        p('66-9910', '16.09.2025', 1757980800000),
                        p('66-9911', '20.10.2025', 1760918400000),
                    ],
                    temperatures: [
                        tmp(10.2, 12.0, 'o.B., Probe entnommen', 'Probe ans Labor geschickt', 'Sarah Bauer', '20.10.25', 1760918400000),
                    ],
                },
            ],
        },
        // Lager 21 – leer
        {
            id: 18, slotNumber: 21, status: 'leer', updated: '08.02.2026 08:00',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 22 – Dinkel, 3 Partien, 2 Temperatureinträge
        {
            id: 19, slotNumber: 22, status: 'voll', updated: '03.12.2025 16:00',
            partitions: [{
                label: 'A', fruchtart: 'Dinkel',
                parties: [
                    p('23-2201', '01.09.2025', 1756684800000),
                    p('23-2202', '20.10.2025', 1760918400000),
                    p('23-2203', '03.12.2025', 1764720000000),
                ],
                temperatures: [
                    tmp(10.6, 12.4, 'o.B.', 'Keine Maßnahmen erforderlich', 'Thomas Schneider', '20.10.25', 1760918400000),
                    tmp(11.0, 12.8, 'leichte Staubentwicklung beim Öffnen', 'Umschichtung für nächste Woche geplant', 'Anna Weber', '03.12.25', 1764720000000),
                ],
            }],
        },
        // Lager 23 – gereinigt
        {
            id: 20, slotNumber: 23, status: 'gereinigt', updated: '08.02.2026 07:00',
            partitions: [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }],
        },
        // Lager 24 – Weizen, 1 Partie, 3 Temperatureinträge
        {
            id: 21, slotNumber: 24, status: 'voll', updated: '20.03.2026 14:45',
            partitions: [{
                label: 'A', fruchtart: 'Weizen',
                parties: [
                    p('66-2401', '15.01.2026', 1768435200000),
                ],
                temperatures: [
                    tmp(12.5, 14.8, 'leichte Erwärmung, Geruch unauffällig', 'Belüftungsanlage 3h aktiviert', 'Julia Hoffmann', '15.01.26', 1768435200000),
                    tmp(11.9, 13.7, 'o.B.', 'Belüftung 1h, Kontrolle in 5 Tagen', 'Peter Wagner', '08.02.26', 1770508800000),
                    tmp(11.3, 13.1, 'o.B.', 'Keine Maßnahmen erforderlich', 'Lena Richter', '20.03.26', 1773964800000),
                ],
            }],
        },
        // Lager 25 – SBK, 2 Partien, 1 Temperatureintrag
        {
            id: 22, slotNumber: 25, status: 'voll', updated: '08.02.2026 15:30',
            partitions: [{
                label: 'A', fruchtart: 'SBK',
                parties: [
                    p('25-2501', '05.11.2025', 1762300800000),
                    p('25-2502', '08.02.2026', 1770508800000),
                ],
                temperatures: [
                    tmp(10.3, 12.1, 'o.B., keine Schädlinge', 'Keine Maßnahmen erforderlich', 'Stefan Koch', '08.02.26', 1770508800000),
                ],
            }],
        },
    ];
}



/**
 * Writes a single partition entry into the currentSlots archive object.
 * Mutates currentSlots directly via object reference.
 * @param {string} compartmentKey - e.g. "Lager 1"
 * @param {string} grainKey - Grain type of the partition
 * @param {string[]} partyValues - Array of party numbers
 * @param {object[]} temperatures - Array of temperature entries
 * @param {object} currentSlots - The accumulated archive object
 */
function buildArchiveEntry(compartmentKey, grainKey, partyValues, temperatures, currentSlots) {
    const dateKey = buildArchiveDateKey();

    if (!currentSlots[compartmentKey]) currentSlots[compartmentKey] = {};
    if (!currentSlots[compartmentKey][dateKey]) currentSlots[compartmentKey][dateKey] = {};

    currentSlots[compartmentKey][dateKey][grainKey] = {
        partien: partyValues,
        temperaturen: temperatures,
    };
}

/**
 * Adds all relevant partitions of a slot into the currentSlots archive object.
 * Partitions without a grain type or without parties are skipped.
 * @param {object} slot - A slot from state.slots
 * @param {object} currentSlots - The accumulated archive object
 */
function addSlotToCurrentSlots(slot, currentSlots) {
    const compartmentKey = `Lager ${slot.slotNumber}`;

    slot.partitions.forEach(partition => {
        const grainKey = partition.fruchtart || 'Unbekannt';
        if (grainKey == "Unbekannt" || partition.parties.length == 0) { return; }
        buildArchiveEntry(compartmentKey, grainKey, partition.parties.map(party => party.value), partition.temperatures, currentSlots);
    });
}

/**
 * Converts all slots in state to a structured archive object.
 * @returns {object} Archive object grouped by compartment, date, and grain type
 */
export function convertSlotDataToArchiveDataFormat() {
    const currentSlots = {};
    state.slots.forEach(slot => {
        addSlotToCurrentSlots(slot, currentSlots);
    });
    return currentSlots;
}
