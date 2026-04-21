const API_BASE = '/satellites';
const PAGE_SIZE = 6;
const PARENT_ID = 148;
const PLACEHOLDERS = [
  './dist/img/mkimg-01.jpg',
  './dist/img/mkimg-02.jpg',
  './dist/img/mkimg-03.jpg',
  './dist/img/mkimg-04.jpg',
];

function getPlaceholder(satelliteId) {
  const ids = Object.keys(satellites);
  const idx = ids.indexOf(String(satelliteId));
  return PLACEHOLDERS[(idx < 0 ? 0 : idx) % PLACEHOLDERS.length];
}

const selectedParams = document.getElementById('selectedParams');
const exportButtons = document.querySelectorAll('.export-btn');
const satList = document.getElementById('satList');
const satPagination = document.getElementById('satPagination');
const satTitle = document.getElementById('satTitle');
const satMeta = document.getElementById('satMeta');
const satImage = document.getElementById('satImage');
const satTableBody = document.getElementById('satTableBody');
const satCount = document.getElementById('satCount');

let activeSatelliteId = null;
let satellites = {};
let currentPage = 1;
let selectedFilters = [];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateWords(str, maxWords) {
  const words = String(str ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + '…';
}

async function fetchSatellites() {
  try {
    const response = await fetch(`${API_BASE}/groups?parent_id=${PARENT_ID}&limit=1000&offset=0`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    satellites = Object.fromEntries(data.items.map((item) => [item.id_page, item]));
    currentPage = 1;
    activeSatelliteId = Object.keys(satellites)[0] ?? null;
  } catch (err) {
    console.error('[radar-groups] Ошибка загрузки:', err);
    satList.innerHTML = `
      <div class="col-12">
        <div class="sat-item w-100 text-start">
          <strong>Ошибка загрузки</strong>
          <div class="small text-body-secondary mt-1">Не удалось получить данные с сервера.</div>
        </div>
      </div>
    `;
    if (satPagination) satPagination.innerHTML = '';
    return;
  }
  renderTypeFilters();
  renderCountryFilters();
  updateView();
}

function renderPagination(totalFiltered) {
  if (!satPagination) return;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  if (totalPages <= 1) {
    satPagination.innerHTML = '';
    return;
  }

  satPagination.innerHTML =
    '<ul class="pagination align-items-center mb-0">' +
      '<li class="page-item' + (currentPage === 1 ? ' disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">&laquo;</a>' +
      '</li>' +
      '<li class="page-item disabled">' +
        '<span class="page-link border-0 bg-transparent">' + currentPage + ' / ' + totalPages + '</span>' +
      '</li>' +
      '<li class="page-item' + (currentPage === totalPages ? ' disabled' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">&raquo;</a>' +
      '</li>' +
    '</ul>';

  satPagination.querySelectorAll('[data-page]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const p = parseInt(el.getAttribute('data-page'));
      if (p >= 1 && p <= totalPages) {
        currentPage = p;
        updateView();
      }
    });
  });
}

function getSatelliteType(satellite) {
  const types = [];
  if (satellite.is_civ) types.push('Гражданский');
  if (satellite.is_com) types.push('Коммерческий');
  return types.join(', ') || '—';
}

function getSatelliteRows(satellite) {
  return [
    ['Тип', getSatelliteType(satellite)],
    ['Страна', (satellite.country ?? []).join(', ') || '—'],
    ['Описание', satellite.small_content ?? '—'],
    ['Подробнее', satellite.big_content ?? '—'],
    ['Источник', satellite.source ?? '—']
  ];
}

function renderSelectedParams() {
  if (!selectedFilters.length) {
    selectedParams.innerHTML = '<span class="text-body-secondary small">Пока параметры не выбраны</span>';
    return;
  }

  selectedParams.innerHTML = selectedFilters.map((item) => {
    const label = item.state === 'include' ? 'Включить' : 'Исключить';
    return `<span class="select-chip"><strong>${label}:</strong>${item.label}</span>`;
  }).join('');
}

function getFilterGroups() {
  const groups = {
    country: { include: [], exclude: [] },
    type: { include: [], exclude: [] }
  };

  selectedFilters.forEach((item) => {
    if (item.label.startsWith('Страна: ')) {
      groups.country[item.state].push(item.label.replace('Страна: ', ''));
    }
    if (item.label.startsWith('Тип: ') && item.key) {
      groups.type[item.state].push(item.key);
    }
  });

  return groups;
}

function satelliteMatchesFilters(satellite, groups) {
  const countries = satellite.country ?? [];

  if (groups.country.include.length) {
    if (!countries.some((c) => groups.country.include.includes(c))) return false;
  }
  if (groups.country.exclude.length) {
    if (countries.some((c) => groups.country.exclude.includes(c))) return false;
  }

  if (groups.type.include.length) {
    if (!groups.type.include.some((key) => satellite[key])) return false;
  }
  if (groups.type.exclude.length) {
    if (groups.type.exclude.some((key) => satellite[key])) return false;
  }

  return true;
}

function getFilteredSatelliteIds() {
  const groups = getFilterGroups();
  return Object.keys(satellites).filter((id) => satelliteMatchesFilters(satellites[id], groups));
}

// ---------------------------------------------------------------------------
// Рендер
// ---------------------------------------------------------------------------


function renderSatelliteDetails(satelliteId) {
  const satellite = satellites[satelliteId];
  if (!satellite) return;

  activeSatelliteId = satelliteId;
  satTitle.textContent = satellite.title_content;
  satMeta.textContent = satellite.small_content ?? '';
  satImage.src = getPlaceholder(satelliteId);
  satTableBody.innerHTML = getSatelliteRows(satellite).map(([key, value]) => {
    return `<tr><td>${key}</td><td>${value}</td></tr>`;
  }).join('');
}

function renderSatelliteList() {
  const filteredIds = getFilteredSatelliteIds();
  const totalFiltered = filteredIds.length;
  const totalAll = Object.keys(satellites).length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  satCount.textContent = totalFiltered === totalAll
    ? `${totalAll} спутников`
    : `${totalFiltered} из ${totalAll}`;

  if (!totalFiltered) {
    satList.innerHTML = `
      <div class="col-12">
        <div class="sat-item w-100 text-start">
          <strong>Совпадений не найдено</strong>
          <div class="small text-body-secondary mt-1">Измени выбранные фильтры по стране, массе или диапазону, чтобы получить доступные спутники.</div>
        </div>
      </div>
    `;
    satTitle.textContent = 'Совпадений не найдено';
    satMeta.textContent = 'Текущий набор фильтров не возвращает спутники.';
    satImage.src = PLACEHOLDERS[0];
    satTableBody.innerHTML = `
      <tr><td>Статус</td><td>Нет подходящих спутников</td></tr>
      <tr><td>Рекомендация</td><td>Сними часть ограничений или выбери другой диапазон</td></tr>
    `;
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageIds = filteredIds.slice(start, start + PAGE_SIZE);

  if (!pageIds.includes(activeSatelliteId)) {
    activeSatelliteId = pageIds[0];
  }

  satList.innerHTML = pageIds.map((id) => {
    const satellite = satellites[id];
    const isActive = id === activeSatelliteId ? ' active' : '';

    return `
      <div class="col-md-6 d-flex">
        <button type="button" class="sat-item w-100 text-start sat-btn${isActive}" data-target="${escapeHtml(id)}">
          <strong class="sat-item-title">${escapeHtml(truncateWords(satellite.title_content, 8))}</strong>
          <div class="small text-body-secondary mt-1 sat-item-desc">${escapeHtml(truncateWords(satellite.small_content, 20))}</div>
        </button>
      </div>
    `;
  }).join('');

  satList.querySelectorAll('.sat-btn').forEach((button) => {
    button.addEventListener('click', () => {
      satList.querySelectorAll('.sat-btn').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderSatelliteDetails(button.dataset.target);
    });
  });

  renderSatelliteDetails(activeSatelliteId);
  renderPagination(totalFiltered);
}

function renderTypeFilters() {
  const container = document.getElementById('typeFilters');
  if (!container) return;

  const types = [
    { key: 'is_civ', label: 'Гражданский' },
    { key: 'is_com', label: 'Коммерческий' }
  ];

  container.innerHTML = '';

  types.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sat-chip';
    btn.dataset.state = 'neutral';
    btn.innerHTML = `<span class="filter-marker"><i class="bi bi-dash-lg"></i></span><strong>${escapeHtml(label)}</strong>`;

    btn.addEventListener('click', () => {
      const nextState =
        btn.dataset.state === 'neutral' ? 'include' :
        btn.dataset.state === 'include' ? 'exclude' : 'neutral';

      btn.dataset.state = nextState;
      setControlState(btn.querySelector('.filter-marker'), nextState);

      const filterLabel = `Тип: ${label}`;
      const existing = selectedFilters.findIndex((item) => item.label === filterLabel);
      if (existing >= 0) selectedFilters.splice(existing, 1);
      if (nextState !== 'neutral') selectedFilters.push({ label: filterLabel, state: nextState, key });

      currentPage = 1;
      updateView();
    });

    container.appendChild(btn);
  });
}

function renderCountryFilters() {
  const container = document.getElementById('countryFilters');
  if (!container) return;

  const allCountries = new Set();
  Object.values(satellites).forEach((sat) => {
    (sat.country ?? []).forEach((c) => allCountries.add(c));
  });

  const sorted = [...allCountries].sort();
  container.innerHTML = '';

  sorted.forEach((country) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sat-chip';
    btn.dataset.state = 'neutral';
    btn.innerHTML = `<span class="filter-marker"><i class="bi bi-dash-lg"></i></span><strong>${escapeHtml(country)}</strong>`;

    btn.addEventListener('click', () => {
      const nextState =
        btn.dataset.state === 'neutral' ? 'include' :
        btn.dataset.state === 'include' ? 'exclude' : 'neutral';

      btn.dataset.state = nextState;
      setControlState(btn.querySelector('.filter-marker'), nextState);

      const label = `Страна: ${country}`;
      const existing = selectedFilters.findIndex((item) => item.label === label);
      if (existing >= 0) selectedFilters.splice(existing, 1);
      if (nextState !== 'neutral') selectedFilters.push({ label, state: nextState });

      currentPage = 1;
      updateView();
    });

    container.appendChild(btn);
  });
}

function updateView() {
  renderSelectedParams();
  renderSatelliteList();
}

// ---------------------------------------------------------------------------
// Управление фильтрами
// ---------------------------------------------------------------------------

function setControlState(button, state) {
  button.classList.remove('include', 'exclude');
  const icon = button.querySelector('i');
  if (state === 'include') {
    button.classList.add('include');
    icon.className = 'bi bi-check-lg';
  } else if (state === 'exclude') {
    button.classList.add('exclude');
    icon.className = 'bi bi-x-lg';
  } else {
    icon.className = 'bi bi-dash-lg';
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

// Начальная загрузка
fetchSatellites();
