import { escHtml } from './utils.js';

/* ═══════════════════════════════════════════════
   SCHLAUCH TEMPLATES
═══════════════════════════════════════════════ */

/**
 * Gibt das Stats-Template für die Schläuche-Ansicht zurück.
 * Zeigt nur "Gelegt" mit der echten Anzahl, die restlichen 5 Felder zeigen "---".
 * @param {number} count - Anzahl der Schläuche.
 * @returns {string} HTML-String.
 */
export function returnSchlauchStatsTemplate(count) {
    return `
      <div class="stat">
        <div class="stat-val">${count}</div>
        <div class="stat-lbl">Gelegt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>`;
}

/**
 * Gibt das Karten-Template für einen Schlauch zurück.
 * Kein Status-Badge – stattdessen Standort (Wiese/Acker).
 * @param {object} schlauch   - Der Schlauch-Datensatz.
 * @param {string} lastPartie - Die zuletzt hinzugefügte Partie-Nummer.
 * @returns {string} HTML-String.
 */
export function returnSchlauchCardTemplate(schlauch, lastPartie) {
    let fruchtDisplay = 'Leer';
    if (schlauch.fruchtart) {
        fruchtDisplay = escHtml(schlauch.fruchtart);
    }
    let standortLabel = '—';
    if (schlauch.standort === 'wiese') {
        standortLabel = 'Wiese';
    } else if (schlauch.standort === 'acker') {
        standortLabel = 'Acker';
    }
    return `
      <div class="slot-num">
        <p class="slot-fach">Schlauch ${schlauch.slotNumber}</p>
        <div class="slot-fruchtart">${fruchtDisplay}</div>
      </div>
      <div class="slot-name">${escHtml(lastPartie)}</div>
      <div class="badge schlauch-standort">${standortLabel}</div>
      <div class="slot-info">${escHtml(schlauch.updated)}</div>`;
}

/**
 * Gibt das Template für einen einzelnen Schlauch-Notiz-Eintrag zurück.
 * @param {object} notiz      - Der Notiz-Datensatz.
 * @param {string} entryClass - CSS-Klassen des Eintrags.
 * @returns {string} HTML-String.
 */
export function returnSchlauchNotizEntryTemplate(notiz, entryClass) {
    return `
      <div class="${entryClass}">
        <div class="temp-entry-preview">
          <span class="temp-preview-range notiz-preview-text">${escHtml(notiz.text)}</span>
          <span class="temp-preview-date">${escHtml(notiz.savedAtDisplay)}</span>
        </div>
        <div class="temp-entry-details">
          <div class="temp-entry-meta">
            <span>${escHtml(notiz.savedAtDisplay)}</span>
            <span>${escHtml(notiz.savedBy)}</span>
          </div>
        </div>
      </div>`;
}

/* ═══════════════════════════════════════════════
   TEMPLATES
═══════════════════════════════════════════════ */

export function returnTempEntryTemplate(e, entryClass) {
    return `
      <div class="${entryClass}">
        <div class="temp-entry-preview">
          <span class="temp-preview-range">${e.von}°C – ${e.bis}°C</span>
          <span class="temp-preview-date">${escHtml(e.savedAtDisplay)}</span>
        </div>
        <div class="temp-entry-details">
          <div class="temp-detail-row"><span class="temp-detail-lbl">Sichtkontrolle</span><span>${escHtml(e.sicht)}</span></div>
          <div class="temp-detail-row"><span class="temp-detail-lbl">Maßnahmen</span><span>${escHtml(e.massnahmen)}</span></div>
          <div class="temp-entry-meta">
            <span>${escHtml(e.savedAtDisplay)}</span>
            <span>${escHtml(e.savedBy)}</span>
          </div>
        </div>
      </div>`;
}

export function returnStatsTemplate(slotsLength, counts) {
    return `
      <div class="stat">
        <div class="stat-val">${slotsLength}</div>
        <div class="stat-lbl">Gesamt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-voll-txt)">${counts.voll}</div>
        <div class="stat-lbl">Voll</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-reserviert-txt)">${counts.reserviert}</div>
        <div class="stat-lbl">Reserviert</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer + counts.gereinigt}</div>
        <div class="stat-lbl">Leer</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-gereinigt-txt)">${counts.gereinigt}</div>
        <div class="stat-lbl">Gereinigt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer}</div>
        <div class="stat-lbl">Ungereinigt</div>
      </div>`;
}

export function returnSlotCardTemplate(sl, lastPartie, statusLabel, fruchtart, partitionCount) {
    let fruchtDisplay = 'Leer';
    if (fruchtart) fruchtDisplay = escHtml(fruchtart);
    let multiIndicator = '';
    if (partitionCount > 1) multiIndicator = '<span class="slot-multi">+</span>';
    return `
      <div class="slot-num">
        <p class="slot-fach">Lager ${sl.slotNumber}</p>
        <div class="slot-fruchtart">${fruchtDisplay}${multiIndicator}</div>
      </div>
      <div class="slot-name">${escHtml(lastPartie)}</div>
      <div class="badge ${sl.status}">${statusLabel}</div>
      <div class="slot-info">${escHtml(sl.updated)}</div>`;
}

export function returnPartieItemTemplate(p) {
    return `<li class="pn-item">${escHtml(p.value)}<span class="pn-item-date">${escHtml(p.addedAt)}</span></li>`;
}

export function returnPartitionPickerTemplate(partitions) {
    const items = partitions.map((p, i) => {
        let fruchtDisplay = 'Keine Fruchtart';
        if (p.fruchtart) fruchtDisplay = escHtml(p.fruchtart);
        let lastPartie = '—';
        if (p.parties && p.parties.length > 0) {
            lastPartie = escHtml(p.parties[p.parties.length - 1].value);
        }
        return `
          <button class="picker-card" data-idx="${i}">
            <div class="picker-label">${escHtml(p.label)}</div>
            <div class="picker-frucht">${fruchtDisplay}</div>
            <div class="picker-partie">${lastPartie}</div>
          </button>`;
    }).join('');
    return `<div class="picker-title">Welche Teilung möchtest du bearbeiten?</div><div class="picker-cards">${items}</div>`;
}

export function returnPartitionTabsTemplate(partitions, activeIdx) {
    return partitions.map((p, i) => {
        let cls = 'partition-tab';
        if (i === activeIdx) cls += ' active';
        return `<button class="${cls}" type="button">${escHtml(p.label)}</button>`;
    }).join('');
}
