import { state } from './state.js';
import { returnPartitionTabsTemplate, returnPartitionPickerTemplate } from './template.js';
import { renderPartieDropdownLabel } from './dropdown.js';
import { renderTempList } from './temperature.js';

/* ═══════════════════════════════════════════════
   PARTITIONS
═══════════════════════════════════════════════ */

/**
 * Saves the current partition's form state back into the editing partitions array.
 */
export function saveCurrentPartitionState() {
    const partition = state.editingPartitions[state.activePartitionIdx];
    if (!partition) return;
    partition.fruchtart    = document.getElementById('f-frucht').value.trim();
    partition.parties      = state.editingParties;
    partition.temperatures = state.tempEntries;
}

/**
 * Loads a partition's data into the modal form fields.
 * @param {number} idx - Index of the partition to load.
 */
export function loadPartitionContent(idx) {
    const partition = state.editingPartitions[idx];
    if (!partition) return;
    document.getElementById('f-frucht').value = partition.fruchtart || '';
    state.editingParties = partition.parties      ? partition.parties.map(party => ({ ...party }))        : [];
    state.tempEntries    = partition.temperatures ? [...partition.temperatures]                            : [];
    renderPartieDropdownLabel();
    renderTempList();
    document.getElementById('pn-new-row').style.display = 'none';
}

/**
 * Saves the current partition state and switches to a different partition.
 * @param {number} idx - Index of the partition to switch to.
 */
function switchPartition(idx) {
    saveCurrentPartitionState();
    state.activePartitionIdx = idx;
    loadPartitionContent(idx);
    renderPartitionTabs();
}

/**
 * Adds a new partition to the editing state and switches to it.
 */
export function addPartition() {
    saveCurrentPartitionState();
    const label = String.fromCharCode(65 + state.editingPartitions.length);
    state.editingPartitions.push({ label, fruchtart: '', parties: [], temperatures: [] });
    state.activePartitionIdx = state.editingPartitions.length - 1;
    loadPartitionContent(state.activePartitionIdx);
    renderPartitionTabs();
}

/**
 * Deletes a partition by index and re-labels the remaining partitions.
 * @param {number} idx - Index of the partition to delete.
 */
export function deletePartition(idx) {
    if (state.editingPartitions.length <= 1) return;
    state.editingPartitions.splice(idx, 1);
    state.editingPartitions.forEach((partition, index) => {
        partition.label = String.fromCharCode(65 + index);
    });
    let newIdx = idx;
    if (newIdx >= state.editingPartitions.length) {
        newIdx = state.editingPartitions.length - 1;
    }
    state.activePartitionIdx = newIdx;
    loadPartitionContent(newIdx);
    renderPartitionTabs();
}

/**
 * Renders the partition tab bar inside the modal.
 */
export function renderPartitionTabs() {
    const tabsEl = document.getElementById('partition-tabs');
    if (state.editingPartitions.length <= 1) {
        tabsEl.style.display = 'none';
        return;
    }
    tabsEl.style.display = 'flex';
    tabsEl.innerHTML = returnPartitionTabsTemplate(state.editingPartitions, state.activePartitionIdx);
    tabsEl.querySelectorAll('.partition-tab').forEach((button, idx) => {
        button.addEventListener('click', () => switchPartition(idx));
    });
}

/**
 * Selects a partition from the picker overlay and opens its form content.
 * @param {number} idx - Index of the selected partition.
 */
function selectPartitionFromPicker(idx) {
    state.activePartitionIdx = idx;
    loadPartitionContent(idx);
    renderPartitionTabs();
    document.getElementById('partition-picker').style.display = 'none';
    document.getElementById('modal-content').style.display    = 'block';
}

/**
 * Shows the partition picker overlay for slots with multiple partitions.
 */
export function showPartitionPicker() {
    const picker = document.getElementById('partition-picker');
    picker.innerHTML = returnPartitionPickerTemplate(state.editingPartitions);
    picker.style.display = 'flex';
    document.getElementById('modal-content').style.display = 'none';
    picker.querySelectorAll('.picker-card').forEach((button) => {
        const idx = parseInt(button.dataset.idx, 10);
        button.addEventListener('click', () => selectPartitionFromPicker(idx));
    });
}
