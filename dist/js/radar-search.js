const API_BASE = '/satellites';
const ID_TYPE = 1;
const PAGE_SIZE = 12;
const PLACEHOLDERS = [
  './dist/img/mkimg-01.jpg',
  './dist/img/mkimg-02.jpg',
  './dist/img/mkimg-03.jpg',
  './dist/img/mkimg-04.jpg',
];

const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const sortDir = document.getElementById('sortDir');
const searchResults = document.getElementById('searchResults');
const searchChips = document.querySelectorAll('#searchChips [data-chip]');
const countryChips = document.querySelectorAll('#searchChips [data-country]');

const modalSatelliteTitle = document.getElementById('modalSatelliteTitle');
const modalSatelliteMeta = document.getElementById('modalSatelliteMeta');
const modalSatelliteImage = document.getElementById('modalSatelliteImage');
const modalSatelliteTableBody = document.getElementById('modalSatelliteTableBody');

let cachedItems = [];
let currentPage = 0;
let totalItems = 0;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function sortItems(items) {
  const key = sortBy?.value || 'title';
  const dir = sortDir?.value === 'desc' ? -1 : 1;
  const getField = (item) => {
    if (key === 'country') return (item.country ?? []).join(', ').toLowerCase();
    return String(item.title_content ?? '').toLowerCase();
  };
  return [...items].sort((a, b) => {
    const av = getField(a);
    const bv = getField(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

async function fetchAndRender() {
  const q = searchInput.value.trim();
  const url = new URL(`${API_BASE}/search`, location.href);
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('id_type', String(ID_TYPE));
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(currentPage * PAGE_SIZE));

  searchResults.innerHTML = `
    <div class="col-12">
      <div class="search-card w-100 text-start p-4 text-body-secondary">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Загрузка…
      </div>
    </div>
  `;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    cachedItems = data.items ?? [];
    totalItems = data.total ?? 0;
    renderResults(sortItems(cachedItems));
    renderPagination();
  } catch (err) {
    console.error('[radar-search] Ошибка загрузки:', err);
    searchResults.innerHTML = `
      <div class="col-12">
        <div class="search-card w-100 text-start p-4">
          <h3 class="mk-bold fs-5 mb-2 text-danger">Ошибка</h3>
          <p class="mb-0 text-body-secondary">Не удалось получить данные с сервера.</p>
        </div>
      </div>
    `;
  }
}

function renderPagination() {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  let el = document.getElementById('searchPagination');
  if (!el) {
    el = document.createElement('div');
    el.id = 'searchPagination';
    el.className = 'col-12 mt-3 d-flex justify-content-center align-items-center gap-2';
    searchResults.parentElement.appendChild(el);
  }
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  el.innerHTML =
    '<button class="btn btn-sm btn-outline-secondary page-btn" data-page="' + (currentPage - 1) + '"' + (currentPage === 0 ? ' disabled' : '') + '>&laquo;</button>' +
    '<span class="small text-body-secondary">' + (currentPage + 1) + ' / ' + totalPages + '</span>' +
    '<button class="btn btn-sm btn-outline-secondary page-btn" data-page="' + (currentPage + 1) + '"' + (currentPage >= totalPages - 1 ? ' disabled' : '') + '>&raquo;</button>';

  el.querySelectorAll('.page-btn:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      fetchAndRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderResults(items) {
  if (!items.length) {
    searchResults.innerHTML = `
      <div class="col-12">
        <div class="search-card w-100 text-start p-4">
          <h3 class="mk-bold fs-5 mb-2">Ничего не найдено</h3>
          <p class="mb-1 text-body-secondary">Попробуй изменить строку поиска или убрать часть слов.</p>
        </div>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = items.map((item, idx) => {
    const country = (item.country ?? []).join(', ');
    const img = PLACEHOLDERS[idx % PLACEHOLDERS.length];
    return `
      <div class="col-lg-6">
        <button type="button" class="search-card w-100 text-start p-3 result-btn" data-id="${escapeHtml(item.id_page)}" data-bs-toggle="modal" data-bs-target="#satelliteModal">
          <div class="row g-3 align-items-center">
            <div class="col-4">
              <img src="${escapeHtml(img)}" class="img-fluid rounded-3" alt="">
            </div>
            <div class="col-8">
              <h3 class="mk-bold fs-5 mb-2">${escapeHtml(item.title_content ?? '')}</h3>
              ${country ? `<p class="mb-1 text-body-secondary">${escapeHtml(country)}</p>` : ''}
              <div class="small text-body-secondary">${escapeHtml(item.small_content ?? '')}</div>
            </div>
          </div>
        </button>
      </div>
    `;
  }).join('');
}

function fillModal(itemId) {
  const item = cachedItems.find((entry) => String(entry.id_page) === String(itemId));
  if (!item) return;

  const country = (item.country ?? []).join(', ');

  modalSatelliteTitle.textContent = item.title_content ?? '';
  modalSatelliteMeta.textContent = country;
  modalSatelliteImage.src = PLACEHOLDERS[0];

  const rows = [
    ['Страна', country || '—'],
    ['Масса', item.mass ? `${item.mass} кг` : '—'],
    ['Диапазон', item.frequency_range ?? '—'],
    ['Разрешение', item.resolution ?? '—'],
    ['Радиометрическая чувствительность', item.radiometric_sensitivity ?? '—'],
    ['Описание', item.small_content ?? '—'],
    ['Подробнее', item.big_content ?? '—'],
  ];
  modalSatelliteTableBody.innerHTML = rows.map(([k, v]) =>
    `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('');
}

function resetAndFetch() {
  currentPage = 0;
  fetchAndRender();
}

const debouncedFetch = debounce(resetAndFetch, 300);
searchInput.addEventListener('input', debouncedFetch);

searchChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.dataset.chip;
    countryChips.forEach((c) => c.classList.remove('active'));
    resetAndFetch();
  });
});

countryChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const val = chip.dataset.country;
    const activate = !chip.classList.contains('active');
    countryChips.forEach((c) => c.classList.remove('active'));
    if (activate) {
      chip.classList.add('active');
      searchInput.value = val;
    } else {
      searchInput.value = '';
    }
    resetAndFetch();
  });
});

if (sortBy) sortBy.addEventListener('change', () => renderResults(sortItems(cachedItems)));
if (sortDir) sortDir.addEventListener('change', () => renderResults(sortItems(cachedItems)));

document.getElementById('satelliteModal').addEventListener('show.bs.modal', (event) => {
  fillModal(event.relatedTarget?.dataset.id);
});

fetchAndRender();
