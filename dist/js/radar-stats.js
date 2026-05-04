const API_BASE = '/satellites';
const ID_TYPE = 1;

const COLUMNS = [
  { key: 'title_content', label: 'Название', render: (item) => renderText(item.title_content) },
  { key: 'country', label: 'Страна', render: (item) => renderText((item.country ?? []).join(', ')) },
  { key: 'mass', label: 'Масса', render: (item) => renderText(item.mass) },
  { key: 'frequency_range', label: 'Диапазон', render: (item) => renderText(item.frequency_range) },
  { key: 'resolution', label: 'Разрешение', render: (item) => renderText(item.resolution) },
  { key: 'radiometric_sensitivity', label: 'Радиометрическая чувствительность', render: (item) => renderText(item.radiometric_sensitivity) },
];

const statsTableHead = document.getElementById('statsTableHead');
const statsTableBody = document.getElementById('statsTableBody');
const columnControls = document.getElementById('columnControls');
const showAllRows = document.getElementById('showAllRows');
const modalEl = document.getElementById('satelliteModal');
const modalSatelliteTitle = document.getElementById('modalSatelliteTitle');
const modalSatelliteMeta = document.getElementById('modalSatelliteMeta');
const modalSatelliteTableBody = document.getElementById('modalSatelliteTableBody');
const exportButtons = document.querySelectorAll('.export-btn');

let tableItems = [];
let visibleColumns = new Set(COLUMNS.map((column) => column.key));
let hiddenRows = new Set();
let activeSatelliteId = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(value) {
  const text = String(value ?? '').trim();
  return text ? escapeHtml(text) : '—';
}

function getVisibleColumns() {
  return COLUMNS.filter((column) => visibleColumns.has(column.key));
}

function getRowKey(item, idx) {
  return String(item.id_page ?? idx);
}

function renderColumnControls() {
  if (!columnControls) return;

  columnControls.innerHTML = COLUMNS.map((column) => {
    const checked = visibleColumns.has(column.key) ? ' checked' : '';
    return `
      <label class="mk-toggle-chip">
        <input class="form-check-input" type="checkbox" data-column="${column.key}"${checked}>
        <span>${escapeHtml(column.label)}</span>
      </label>
    `;
  }).join('');

  columnControls.querySelectorAll('[data-column]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const key = checkbox.getAttribute('data-column');
      if (checkbox.checked) {
        visibleColumns.add(key);
      } else {
        visibleColumns.delete(key);
      }
      renderTable();
    });
  });
}

function renderTableHead() {
  if (!statsTableHead) return;

  const columns = getVisibleColumns();
  statsTableHead.innerHTML = `
    <tr>
      <th class="mk-row-check-cell">
        <span class="visually-hidden">Строка</span>
      </th>
      ${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
    </tr>
  `;
}

function renderTableBody() {
  if (!statsTableBody) return;

  const columns = getVisibleColumns();
  const visibleRows = tableItems
    .map((item, idx) => ({ item, rowKey: getRowKey(item, idx) }))
    .filter((row) => !hiddenRows.has(row.rowKey));
  const colspan = Math.max(columns.length + 1, 1);

  if (!tableItems.length) {
    statsTableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-body-secondary small">Данных нет</td></tr>`;
    return;
  }

  if (!visibleRows.length) {
    statsTableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-body-secondary small">Все строки скрыты</td></tr>`;
    return;
  }

  statsTableBody.innerHTML = visibleRows.map(({ item, rowKey }) => {
    return `
      <tr class="mk-click-row" data-satellite-id="${escapeHtml(item.id_page)}">
        <td class="mk-row-check-cell">
          <input class="form-check-input" type="checkbox" data-row="${escapeHtml(rowKey)}" checked>
        </td>
        ${columns.map((column) => `<td>${column.render(item)}</td>`).join('')}
      </tr>
    `;
  }).join('');

  statsTableBody.querySelectorAll('[data-row]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      event.stopPropagation();
      const rowKey = checkbox.getAttribute('data-row');
      if (!checkbox.checked) {
        hiddenRows.add(rowKey);
        renderTable();
      }
    });
  });

  statsTableBody.querySelectorAll('[data-satellite-id]').forEach((row) => {
    row.addEventListener('click', () => {
      openSatelliteModal(row.getAttribute('data-satellite-id'));
    });
  });
}

function renderTable() {
  renderTableHead();
  renderTableBody();
}

function openSatelliteModal(satelliteId) {
  const item = tableItems.find((entry) => String(entry.id_page) === String(satelliteId));
  if (!item || !modalEl) return;

  activeSatelliteId = item.id_page;
  const country = (item.country ?? []).join(', ');

  modalSatelliteTitle.textContent = item.title_content ?? 'Карточка объекта';
  modalSatelliteMeta.textContent = country;

  const rows = [
    ['Страна', country || '—'],
    ['Масса', item.mass ? `${item.mass} кг` : '—'],
    ['Диапазон', item.frequency_range ?? '—'],
    ['Разрешение', item.resolution ?? '—'],
    ['Радиометрическая чувствительность', item.radiometric_sensitivity ?? '—'],
    ['Описание', item.small_content ?? '—'],
    ['Подробнее', item.big_content ?? '—'],
  ];

  modalSatelliteTableBody.innerHTML = rows.map(([key, value]) => {
    return `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`;
  }).join('');

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function loadTable() {
  try {
    const response = await fetch(`${API_BASE}/groups?id_type=${ID_TYPE}&limit=1000&offset=0`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    tableItems = data.items ?? [];
    hiddenRows = new Set();
    renderColumnControls();
    renderTable();
  } catch (err) {
    console.error('[radar-stats] Ошибка загрузки:', err);
    if (statsTableBody) {
      statsTableBody.innerHTML = '<tr><td colspan="8" class="text-danger small">Ошибка загрузки данных</td></tr>';
    }
  }
}

const FORMAT_MAP = { PDF: 'pdf', Excel: 'excel', DOC: 'doc', HTML: 'html' };

exportButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!activeSatelliteId) return;
    const fmt = FORMAT_MAP[button.dataset.format];
    if (fmt) window.location = `/satellites/${activeSatelliteId}/export?format=${fmt}`;
  });
});

if (showAllRows) {
  showAllRows.addEventListener('click', () => {
    hiddenRows = new Set();
    renderTable();
  });
}

loadTable();
