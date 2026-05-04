const API_BASE = '/satellites';
const PAGE_SIZE = 6;
const ID_TYPE = 1;
const PLACEHOLDERS = [
  './dist/img/mkimg-01.jpg',
  './dist/img/mkimg-02.jpg',
  './dist/img/mkimg-03.jpg',
  './dist/img/mkimg-04.jpg',
];
const MASS_FILTERS = [
  { key: 'gt1000', label: 'Больше 1000 кг' },
  { key: 'lt1000', label: 'Меньше 1000 кг' },
  { key: 'lte100', label: 'До 100 кг' },
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

function parseMass(value) {
  if (value == null) return null;

  const normalized = String(value)
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function massMatchesRange(mass, rangeKey) {
  if (mass === null) return false;
  if (rangeKey === 'gt1000') return mass > 1000;
  if (rangeKey === 'lt1000') return mass < 1000;
  if (rangeKey === 'lte100') return mass <= 100;
  return true;
}

async function fetchSatellites() {
  try {
    const response = await fetch(`${API_BASE}/groups?id_type=${ID_TYPE}&limit=1000&offset=0`);
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
        '<button type="button" class="page-link" data-page="' + (currentPage - 1) + '"' + (currentPage === 1 ? ' disabled' : '') + '>&laquo;</button>' +
      '</li>' +
      '<li class="page-item disabled">' +
        '<span class="page-link border-0 bg-transparent">' + currentPage + ' / ' + totalPages + '</span>' +
      '</li>' +
      '<li class="page-item' + (currentPage === totalPages ? ' disabled' : '') + '">' +
        '<button type="button" class="page-link" data-page="' + (currentPage + 1) + '"' + (currentPage === totalPages ? ' disabled' : '') + '>&raquo;</button>' +
      '</li>' +
    '</ul>';

  satPagination.querySelectorAll('[data-page]:not([disabled])').forEach((el) => {
    el.addEventListener('click', () => {
      const p = parseInt(el.getAttribute('data-page'));
      if (p >= 1 && p <= totalPages) {
        currentPage = p;
        updateView();
        satList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function getSatelliteRows(satellite) {
  return [
    ['Страна', (satellite.country ?? []).join(', ') || '—'],
    ['Масса', satellite.mass ? `${satellite.mass} кг` : '—'],
    ['Диапазон', satellite.frequency_range ?? '—'],
    ['Разрешение', satellite.resolution ?? '—'],
    ['Радиометрическая чувствительность', satellite.radiometric_sensitivity ?? '—'],
    ['Описание', satellite.small_content ?? '—'],
    ['Подробнее', satellite.big_content ?? '—']
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
    countryMass: []
  };

  selectedFilters.forEach((item) => {
    if (item.type === 'countryMass') {
      groups.countryMass.push(item);
    } else if (item.label.startsWith('Страна: ')) {
      groups.country[item.state].push(item.label.replace('Страна: ', ''));
    }
  });

  return groups;
}

function satelliteMatchesFilters(satellite, groups) {
  const countries = satellite.country ?? [];
  const massFilteredCountries = groups.countryMass.map((filter) => filter.country);
  const hasIncludeFilters = groups.country.include.length || groups.countryMass.length;

  if (groups.country.exclude.length) {
    if (countries.some((c) => groups.country.exclude.includes(c))) return false;
  }

  if (hasIncludeFilters) {
    const mass = parseMass(satellite.mass);
    const matchesCountry = countries.some((country) => {
      const massFilter = groups.countryMass.find((filter) => filter.country === country);

      if (massFilter) {
        return massMatchesRange(mass, massFilter.range);
      }

      return groups.country.include.includes(country) && !massFilteredCountries.includes(country);
    });

    if (!matchesCountry) return false;
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
    const wrapper = document.createElement('div');
    wrapper.className = 'country-filter';
    const countryFilter = selectedFilters.find((item) => item.label === `Страна: ${country}`);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sat-chip';
    btn.dataset.state = countryFilter?.state ?? 'neutral';
    btn.innerHTML = `<span class="filter-marker"><i class="bi bi-dash-lg"></i></span><strong>${escapeHtml(country)}</strong>`;
    setControlState(btn.querySelector('.filter-marker'), btn.dataset.state);

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
      if (nextState !== 'include') {
        const massExisting = selectedFilters.findIndex((item) => item.type === 'countryMass' && item.country === country);
        if (massExisting >= 0) selectedFilters.splice(massExisting, 1);
      }

      currentPage = 1;
      updateView();
      renderCountryFilters();
    });

    const menuToggle = document.createElement('button');
    menuToggle.type = 'button';
    menuToggle.className = 'sat-chip country-mass-toggle';
    menuToggle.setAttribute('aria-label', `Фильтры массы: ${country}`);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<i class="bi bi-chevron-down"></i>';
    if (btn.dataset.state !== 'include') {
      menuToggle.disabled = true;
    }

    const menu = document.createElement('div');
    menu.className = 'country-mass-menu d-none';
    menu.innerHTML = MASS_FILTERS.map((filter) => {
      return `
        <button type="button" class="country-mass-option" data-range="${filter.key}">
          ${escapeHtml(filter.label)}
        </button>
      `;
    }).join('');

    menuToggle.addEventListener('click', () => {
      if (menuToggle.disabled) return;

      const isOpen = !menu.classList.contains('d-none');
      document.querySelectorAll('.country-mass-menu').forEach((item) => item.classList.add('d-none'));
      document.querySelectorAll('.country-mass-toggle').forEach((item) => item.setAttribute('aria-expanded', 'false'));

      if (!isOpen) {
        menu.classList.remove('d-none');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.country-mass-option').forEach((option) => {
      option.addEventListener('click', () => {
        const range = option.dataset.range;
        const rangeLabel = MASS_FILTERS.find((item) => item.key === range)?.label ?? '';
        const existing = selectedFilters.findIndex((item) => item.type === 'countryMass' && item.country === country);

        if (existing >= 0 && selectedFilters[existing].range === range) {
          selectedFilters.splice(existing, 1);
        } else {
          if (existing >= 0) selectedFilters.splice(existing, 1);
          selectedFilters.push({
            type: 'countryMass',
            label: `${country}: ${rangeLabel}`,
            state: 'include',
            country,
            range,
          });
        }

        currentPage = 1;
        menu.classList.add('d-none');
        menuToggle.setAttribute('aria-expanded', 'false');
        updateView();
        renderCountryFilters();
      });
    });

    const activeMassFilter = selectedFilters.find((item) => item.type === 'countryMass' && item.country === country);
    if (activeMassFilter) {
      menuToggle.dataset.state = 'include';
      const activeOption = menu.querySelector(`[data-range="${activeMassFilter.range}"]`);
      if (activeOption) activeOption.classList.add('active');
    }

    wrapper.appendChild(btn);
    wrapper.appendChild(menuToggle);
    wrapper.appendChild(menu);
    container.appendChild(wrapper);
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
