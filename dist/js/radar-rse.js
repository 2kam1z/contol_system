const API_BASE = '/satellites';
const PAGE_SIZE = 6;
const RESULT_PLACEHOLDERS = [
  './dist/img/mkimg-01.jpg',
  './dist/img/mkimg-02.jpg',
  './dist/img/mkimg-03.jpg',
  './dist/img/mkimg-04.jpg',
];

const rseSearch = document.getElementById('rseSearch');
const rseResults = document.getElementById('rseResults');
const rseCount = document.getElementById('rseCount');
const rsePagination = document.getElementById('rseSearchPagination');
const newsResults = document.getElementById('newsResults');
const satTitle = document.getElementById('satTitle');
const satMeta = document.getElementById('satMeta');
const satImage = document.getElementById('satImage');
const satTableBody = document.getElementById('satTableBody');
const exportButtons = document.querySelectorAll('.export-btn');

let currentPage = 1;
let itemsById = {};
let activeSatelliteId = null;

// Зафиксировать высоту блоков, чтобы layout не плясал во время загрузки и при смене активного спутника.
// 2 ряда по 84px + gap (g-3 ≈ 16px) = 184px.
if (rseResults) rseResults.style.minHeight = '184px';
const satCard = document.querySelector('.og-soft-card');
if (satCard) satCard.style.minHeight = '380px';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

async function fetchAndRender() {
  const q = rseSearch?.value.trim() ?? '';
  const url = new URL(`${API_BASE}/search`, location.href);
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String((currentPage - 1) * PAGE_SIZE));

  if (rseResults) {
    rseResults.innerHTML = `
      <div class="col-12 text-body-secondary small">
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>Загрузка…
      </div>`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderResults(data.items ?? [], data.total ?? 0);
    renderPagination(data.total ?? 0);
  } catch (err) {
    console.error('[radar-rse] Ошибка загрузки:', err);
    if (rseResults) {
      rseResults.innerHTML = `<div class="col-12"><p class="text-danger">Не удалось загрузить данные с сервера.</p></div>`;
    }
    if (rsePagination) rsePagination.innerHTML = '';
  }
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

function getPlaceholderForId(id) {
  const ids = Object.keys(itemsById);
  const idx = ids.indexOf(String(id));
  return RESULT_PLACEHOLDERS[(idx < 0 ? 0 : idx) % RESULT_PLACEHOLDERS.length];
}

function renderSatelliteDetails(id) {
  const satellite = itemsById[id];
  if (!satellite || !satTitle) return;
  activeSatelliteId = id;
  satTitle.textContent = satellite.title_content ?? '';
  satMeta.textContent = satellite.small_content ?? '';
  satImage.src = getPlaceholderForId(id);
  satTableBody.innerHTML = getSatelliteRows(satellite).map(([key, value]) => {
    return `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`;
  }).join('');
}

function clearSatelliteDetails() {
  activeSatelliteId = null;
  if (!satTitle) return;
  satTitle.textContent = 'Объект не выбран';
  satMeta.textContent = 'Выберите спутник из списка, чтобы увидеть подробности.';
  satImage.removeAttribute('src');
  satTableBody.innerHTML = '';
}

function renderResults(items, total) {
  if (rseCount) {
    rseCount.textContent = total ? `${total} объектов` : '0 объектов';
  }

  itemsById = Object.fromEntries(items.map((item) => [String(item.id_page), item]));

  if (!rseResults) return;

  if (!items.length) {
    rseResults.innerHTML = `
      <div class="col-12">
        <p class="text-body-secondary">Ничего не найдено.</p>
      </div>`;
    clearSatelliteDetails();
    return;
  }

  if (!activeSatelliteId || !itemsById[activeSatelliteId]) {
    activeSatelliteId = String(items[0].id_page);
  }

  rseResults.innerHTML = items.map((item, idx) => {
    const subtitle = (item.country ?? []).join(', ');
    const img = RESULT_PLACEHOLDERS[idx % RESULT_PLACEHOLDERS.length];
    const id = String(item.id_page);
    const isActive = id === activeSatelliteId ? ' active' : '';
    return `
    <div class="col-lg-4 col-md-6">
      <button type="button" class="p-2 w-100 text-start rse-result-btn${isActive}" data-target="${escapeHtml(id)}" style="min-height:0;height:84px;border:1px solid var(--bs-border-color);border-radius:.5rem;overflow:hidden;">
        <div class="d-flex align-items-start gap-2" style="height:100%;">
          <img src="${escapeHtml(img)}" class="rounded flex-shrink-0" style="width:48px;height:48px;object-fit:cover" alt="">
          <div class="flex-grow-1" style="min-width:0;overflow:hidden;line-height:1.25;">
            <div class="mk-bold text-truncate" style="font-size:.875rem;">${escapeHtml(item.title_content ?? '')}</div>
            <div class="text-body-secondary text-truncate" style="font-size:.75rem;">${escapeHtml(subtitle) || '&nbsp;'}</div>
            <div class="text-truncate" style="font-size:.75rem;">${escapeHtml(item.small_content ?? '')}</div>
          </div>
        </div>
      </button>
    </div>
  `;
  }).join('');

  rseResults.querySelectorAll('.rse-result-btn').forEach((button) => {
    button.addEventListener('click', () => {
      rseResults.querySelectorAll('.rse-result-btn').forEach((el) => el.classList.remove('active'));
      button.classList.add('active');
      renderSatelliteDetails(button.dataset.target);
    });
  });

  renderSatelliteDetails(activeSatelliteId);
}

function renderPagination(total) {
  if (!rsePagination) return;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) {
    rsePagination.innerHTML = '';
    return;
  }

  rsePagination.innerHTML =
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

  rsePagination.querySelectorAll('[data-page]:not([disabled])').forEach((el) => {
    el.addEventListener('click', () => {
      const p = parseInt(el.getAttribute('data-page'));
      if (p >= 1 && p <= totalPages) {
        currentPage = p;
        fetchAndRender();
      }
    });
  });
}

if (rseSearch) {
  rseSearch.addEventListener('input', debounce(() => {
    currentPage = 1;
    fetchAndRender();
  }, 300));
}

// ---------------------------------------------------------------------------
// Новости
// ---------------------------------------------------------------------------

async function fetchNews() {
  try {
    const response = await fetch(`/news?limit=5`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderNews(data.items);
  } catch (err) {
    console.error('[radar-rse] Ошибка загрузки новостей:', err);
    if (newsResults) {
      newsResults.innerHTML = `<p class="text-danger small">Не удалось загрузить новости.</p>`;
    }
  }
}

function formatNewsDate(dtStr) {
  if (!dtStr) return { time: '', date: '' };
  const d = new Date(dtStr);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
}

function renderNews(items) {
  if (!newsResults) return;

  if (!items.length) {
    newsResults.innerHTML = `<p class="text-body-secondary small">Новостей пока нет.</p>`;
    return;
  }

  newsResults.innerHTML = items.map((item, idx) => {
    const { time, date } = formatNewsDate(item.dte);
    const imgSrc = RESULT_PLACEHOLDERS[idx % RESULT_PLACEHOLDERS.length];
    return `
      <div class="d-flex justify-content-between rounded-2 border pe-2 mb-1 bg-body">
        <div class="d-flex flex-fill align-items-center">
          <div class="p-2">
            <img class="rounded" src="${escapeHtml(imgSrc)}" alt="" style="width:90px;height:90px;object-fit:cover">
          </div>
          <div class="d-flex flex-fill align-items-center">
            <div class="d-flex text-truncate flex-column ms-2">
              <div class="mk-data-2 text-body-tertiary pe-2">
                <span class="me-2"><i class="bi bi-clock-fill pe-2"></i>${escapeHtml(time)}</span>
                <span class="me-4"><i class="bi bi-calendar2-event-fill pe-2"></i>${escapeHtml(date)}</span>
              </div>
              <a class="flex-fill text-truncate link-body-emphasis link-offset-2 link-underline-opacity-0 link-underline-opacity-75-hover" href="01.html?id=${item.id_page}">${escapeHtml(item.title_content || '')}</a>
              ${item.source ? `<div class="mk-data-3 text-truncate text-body-secondary">${escapeHtml(item.source)}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// Экспорт
// ---------------------------------------------------------------------------

const FORMAT_MAP = { PDF: 'pdf', Excel: 'excel', DOC: 'doc', HTML: 'html' };

exportButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!activeSatelliteId) return;
    const fmt = FORMAT_MAP[button.dataset.format];
    if (fmt) window.location = `/satellites/${activeSatelliteId}/export?format=${fmt}`;
  });
});

// Начальная загрузка
fetchAndRender();
fetchNews();
