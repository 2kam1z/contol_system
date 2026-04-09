const selectedParams = document.getElementById('selectedParams');
const modeButtons = document.querySelectorAll('.mode-btn');
const satButtons = document.querySelectorAll('.sat-btn');
const exportButtons = document.querySelectorAll('.export-btn');
const satTitle = document.getElementById('satTitle');
const satMeta = document.getElementById('satMeta');
const satImage = document.getElementById('satImage');
const satTableBody = document.getElementById('satTableBody');
const exportMessage = document.getElementById('exportMessage');
const orbitSatellites = document.getElementById('orbitSatellites');
const orbitCaption = document.getElementById('orbitCaption');

const selectedFilters = [];
let activeMode = 'Низкая орбита';

const satellites = {
  'sat-1': {
    title: 'SAR Observer A1',
    meta: 'США / Канада, крупногабаритные, диапазоны X/C/S/L',
    image: './dist/img/mkimg-01.jpg',
    orbit: { rx: 150, ry: 88, angle: -25, color: '#0d6efd' },
    rows: [
      ['Страна', 'США / Канада'],
      ['Класс массы', 'Крупногабаритные свыше 1000 кг'],
      ['Диапазоны', 'X, C, S, L'],
      ['Орбита', activeMode],
      ['Назначение', 'Радиолокационное наблюдение поверхности']
    ]
  },
  'sat-2': {
    title: 'Europe Radar Node',
    meta: 'Европа, малые, диапазоны X/C/S',
    image: './dist/img/mkimg-02.jpg',
    orbit: { rx: 200, ry: 118, angle: 18, color: '#198754' },
    rows: [
      ['Страна', 'Европа'],
      ['Класс массы', 'Малые до 2000 кг'],
      ['Диапазоны', 'X, C, S'],
      ['Орбита', activeMode],
      ['Назначение', 'Мониторинг инфраструктуры и картография']
    ]
  },
  'sat-3': {
    title: 'Dragon SAR Cluster',
    meta: 'Китай, крупногабаритные, диапазоны X/C/L',
    image: './dist/img/mkimg-03.jpg',
    orbit: { rx: 250, ry: 148, angle: -8, color: '#ffc107' },
    rows: [
      ['Страна', 'Китай'],
      ['Класс массы', 'Крупногабаритные свыше 1000 кг'],
      ['Диапазоны', 'X, C, L'],
      ['Орбита', activeMode],
      ['Назначение', 'Наблюдение поверхности и погодонезависимая съемка']
    ]
  },
  'sat-4': {
    title: 'Indo Scan Mini',
    meta: 'Индия, мини, диапазоны X/S',
    image: './dist/img/mkimg-04.jpg',
    orbit: { rx: 200, ry: 118, angle: 140, color: '#dc3545' },
    rows: [
      ['Страна', 'Индия'],
      ['Класс массы', 'Мини до 100 кг'],
      ['Диапазоны', 'X, S'],
      ['Орбита', activeMode],
      ['Назначение', 'Оперативное наблюдение и тестовая группировка']
    ]
  }
};

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

function renderOrbit(activeSatelliteId) {
  const activeButtons = [...document.querySelectorAll('.sat-btn.active')];
  const ids = activeButtons.length ? activeButtons.map((button) => button.dataset.target) : [activeSatelliteId];
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  orbitSatellites.innerHTML = uniqueIds.map((id) => {
    const sat = satellites[id];
    if (!sat) return '';
    const rad = sat.orbit.angle * Math.PI / 180;
    const cx = 230 + sat.orbit.rx * Math.cos(rad);
    const cy = 210 + sat.orbit.ry * Math.sin(rad);
    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="9" fill="${sat.orbit.color}" stroke="white" stroke-width="2"/>
        <text x="${cx + 14}" y="${cy + 4}" class="orbit-label">${sat.title}</text>
      </g>
    `;
  }).join('');

  orbitCaption.textContent = uniqueIds.length > 1
    ? `Схема орбит для выбранных спутников: ${uniqueIds.length}`
    : `Схема полета: ${satellites[uniqueIds[0]]?.title || 'спутник не выбран'}`;
}

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

function bindFilterControl(control, label) {
  control.dataset.state = 'neutral';
  const wrapper = document.createElement('div');
  wrapper.className = 'toggle-row';
  control.parentNode.insertBefore(wrapper, control);
  wrapper.appendChild(control);

  const marker = document.createElement('span');
  marker.className = 'filter-marker';
  marker.innerHTML = '<i class="bi bi-dash-lg"></i>';
  marker.setAttribute('role', 'button');
  marker.setAttribute('tabindex', '0');
  marker.setAttribute('aria-label', `Переключить фильтр ${label}`);
  wrapper.insertBefore(marker, control);

  const toggleFilterState = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextState =
      control.dataset.state === 'neutral' ? 'include' :
      control.dataset.state === 'include' ? 'exclude' : 'neutral';

    control.dataset.state = nextState;
    setControlState(marker, nextState);

    const existing = selectedFilters.findIndex((item) => item.label === label);
    if (existing >= 0) selectedFilters.splice(existing, 1);
    if (nextState !== 'neutral') selectedFilters.push({ label, state: nextState });

    renderSelectedParams();
  };

  marker.addEventListener('click', toggleFilterState);
  marker.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      toggleFilterState(event);
    }
  });
}

document.querySelectorAll('.group-toggle').forEach((control) => {
  const label = control.querySelector('strong')?.textContent?.trim() || control.textContent.trim();
  bindFilterControl(control, `Страна: ${label}`);
});

document.querySelectorAll('.mass-toggle').forEach((control) => {
  const label = control.textContent.trim().replace(/\s+/g, ' ');
  bindFilterControl(control, `Масса: ${label.replace(/^[^\\wА-Яа-я]*/, '')}`);
});

document.querySelectorAll('.range-toggle').forEach((button) => {
  const text = button.textContent.replace('Диапазоны:', '').trim();
  const ranges = text.split(',').map((item) => item.trim()).filter(Boolean);
  const wrapper = document.createElement('div');
  wrapper.className = 'range-list';

  ranges.forEach((range) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'range-toggle range-item';
    item.dataset.state = 'neutral';
    item.innerHTML = `<span>${range}</span><span class="filter-marker"><i class="bi bi-dash-lg"></i></span>`;

    item.addEventListener('click', () => {
      const nextState =
        item.dataset.state === 'neutral' ? 'include' :
        item.dataset.state === 'include' ? 'exclude' : 'neutral';

      item.dataset.state = nextState;
      setControlState(item, nextState);
      setControlState(item.querySelector('.filter-marker'), nextState);

      const label = `Диапазон: ${range}`;
      const existing = selectedFilters.findIndex((entry) => entry.label === label);
      if (existing >= 0) selectedFilters.splice(existing, 1);
      if (nextState !== 'neutral') selectedFilters.push({ label, state: nextState });

      renderSelectedParams();
    });

    wrapper.appendChild(item);
  });

  button.replaceWith(wrapper);
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    activeMode = button.dataset.mode;
    const activeSat = document.querySelector('.sat-btn.active');
    if (activeSat) activeSat.click();
  });
});

satButtons.forEach((button) => {
  button.addEventListener('click', () => {
    satButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const data = satellites[button.dataset.target];
    satTitle.textContent = data.title;
    satMeta.textContent = `${data.meta}. Текущий режим: ${activeMode}.`;
    satImage.src = data.image;
    satTableBody.innerHTML = data.rows.map(([k, v]) => {
      const value = k === 'Орбита' ? activeMode : v;
      return `<tr><td>${k}</td><td>${value}</td></tr>`;
    }).join('');
    renderOrbit(button.dataset.target);
  });
});

exportButtons.forEach((button) => {
  button.addEventListener('click', () => {
    exportMessage.textContent = `Подготовлен интерфейс экспорта в формате ${button.dataset.format}. После подключения базы данных и файлов характеристик здесь будет формироваться реальный документ.`;
  });
});

renderSelectedParams();
renderOrbit('sat-1');
