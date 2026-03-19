import { state, loadFromStorage, loadSchlauchFromStorage } from './state.js';
import { logout } from './utils.js';
import { render, cycleLayout, setActiveView } from './render.js';
import { openAdd, openEdit, closeModal, saveSlot, clearSlot, deleteSlot } from './modal.js';
import { addPartition } from './partition.js';
import { toggleDropdown, selectStatus, togglePartieDropdown, openNewPartieInput, confirmNewPartie } from './dropdown.js';
import { openTempForm, closeTempForm, saveTempEntry, toggleTempEntry } from './temperature.js';
import {
    openSchlauchAdd,
    openSchlauchEdit,
    closeSchlauchModal,
    saveSchlauch,
    deleteSchlauch,
    toggleSchlauchPartieDropdown,
    openSchlauchNewPartieInput,
    confirmSchlauchNewPartie,
    toggleSchlauchStandortDropdown,
    setSchlauchStandortValue,
} from './schlauch-modal.js';
import { openNotizForm, closeNotizForm, saveNotizEntry, toggleNotizEntry } from './schlauch-notiz.js';

/* ═══════════════════════════════════════════════
   EVENT HANDLER & INIT
═══════════════════════════════════════════════ */

function init() {
    loadFromStorage();
    loadSchlauchFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${state.slots.length} Fächer geladen · Klicke auf ein Lager zum Bearbeiten`;

    // Topbar
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('layout-btn').addEventListener('click', cycleLayout);
    document.getElementById('add-btn').addEventListener('click', () => {
        if (state.activeView === 'schlauch') {
            openSchlauchAdd();
        } else {
            openAdd();
        }
    });

    // View-Tabs
    document.getElementById('tab-lager').addEventListener('click',    () => setActiveView('lager'));
    document.getElementById('tab-schlauch').addEventListener('click', () => setActiveView('schlauch'));

    // Grid – Event-Delegation für Lager- und Schlauch-Karten
    document.getElementById('grid').addEventListener('click', (event) => {
        const schlauchCard = event.target.closest('.schlauch-card');
        const schlauchAdd  = event.target.closest('[data-action="add-schlauch"]');
        const lagerCard    = event.target.closest('.slot');
        const lagerAdd     = event.target.closest('[data-action="add-slot"]');

        if (schlauchCard) { openSchlauchEdit(parseInt(schlauchCard.dataset.schlauchId, 10)); return; }
        if (schlauchAdd)  { openSchlauchAdd(); return; }
        if (lagerCard)    { openEdit(parseInt(lagerCard.dataset.id, 10)); return; }
        if (lagerAdd)     { openAdd(); }
    });

    // Lager Haupt-Overlay
    document.getElementById('overlay').addEventListener('click', (event) => {
        if (event.target.id === 'overlay') closeModal();
    });
    document.getElementById('del-btn').addEventListener('click', deleteSlot);
    document.getElementById('clear-btn').addEventListener('click', clearSlot);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveSlot);

    // Partition
    document.getElementById('add-partition-btn').addEventListener('click', addPartition);

    // Lager Status-Dropdown
    document.getElementById('status-trigger').addEventListener('click', toggleDropdown);
    document.querySelectorAll('.cs-item').forEach(listItem => {
        listItem.addEventListener('click', () => selectStatus(listItem));
    });

    // Lager Partie-Dropdown
    document.getElementById('partie-trigger').addEventListener('click', togglePartieDropdown);
    document.getElementById('partie-add-btn').addEventListener('click', openNewPartieInput);
    document.getElementById('pn-ok-btn').addEventListener('click', confirmNewPartie);
    document.getElementById('pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmNewPartie(); }
    });

    // Temperatur-Overlay
    document.getElementById('temp-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'temp-overlay') closeTempForm();
    });
    document.getElementById('temp-add-btn').addEventListener('click', openTempForm);
    document.getElementById('temp-cancel-btn').addEventListener('click', closeTempForm);
    document.getElementById('temp-save-btn').addEventListener('click', saveTempEntry);

    // Temperaturliste – Event-Delegation für dynamische Einträge
    document.getElementById('temp-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleTempEntry(entry);
    });

    // Schlauch Haupt-Overlay
    document.getElementById('schlauch-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'schlauch-overlay') closeSchlauchModal();
    });
    document.getElementById('sc-del-btn').addEventListener('click', deleteSchlauch);
    document.getElementById('sc-modal-cancel-btn').addEventListener('click', closeSchlauchModal);
    document.getElementById('sc-modal-save-btn').addEventListener('click', saveSchlauch);

    // Schlauch Partie-Dropdown
    document.getElementById('sc-partie-trigger').addEventListener('click', toggleSchlauchPartieDropdown);
    document.getElementById('sc-partie-add-btn').addEventListener('click', openSchlauchNewPartieInput);
    document.getElementById('sc-pn-ok-btn').addEventListener('click', confirmSchlauchNewPartie);
    document.getElementById('sc-pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmSchlauchNewPartie(); }
    });

    // Schlauch Standort-Dropdown
    document.getElementById('sc-standort-trigger').addEventListener('click', toggleSchlauchStandortDropdown);
    document.querySelectorAll('.sc-standort-item').forEach(item => {
        item.addEventListener('click', () => setSchlauchStandortValue(item.dataset.value));
    });

    // Schlauch Notiz-Overlay
    document.getElementById('schlauch-notiz-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'schlauch-notiz-overlay') closeNotizForm();
    });
    document.getElementById('sc-notiz-add-btn').addEventListener('click', openNotizForm);
    document.getElementById('sn-cancel-btn').addEventListener('click', closeNotizForm);
    document.getElementById('sn-save-btn').addEventListener('click', saveNotizEntry);

    // Schlauch Notiz-Liste – Event-Delegation für dynamische Einträge
    document.getElementById('sc-notiz-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleNotizEntry(entry);
    });

    // Tastatur
    document.addEventListener('keydown', (event) => {
        const lagerOffen   = document.getElementById('overlay').classList.contains('open');
        const schlauchOffen = document.getElementById('schlauch-overlay').classList.contains('open');

        if (lagerOffen) {
            if (event.key === 'Escape') { closeModal(); return; }
            if (event.key === 'Enter'
                && event.target.tagName !== 'TEXTAREA'
                && event.target.id !== 'pn-new-input'
                && event.target.id !== 'f-num') {
                event.preventDefault();
                saveSlot();
            }
        }
        if (schlauchOffen) {
            if (event.key === 'Escape') { closeSchlauchModal(); return; }
            if (event.key === 'Enter'
                && event.target.tagName !== 'TEXTAREA'
                && event.target.id !== 'sc-pn-new-input'
                && event.target.id !== 'sc-f-num') {
                event.preventDefault();
                saveSchlauch();
            }
        }
    });

    // Alle Dropdowns bei Klick außerhalb schließen
    document.addEventListener('click', () => {
        document.getElementById('status-dropdown')?.classList.remove('open');
        document.getElementById('partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-standort-dropdown')?.classList.remove('open');
    });
}

init();
