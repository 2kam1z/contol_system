const filterButtons = document.querySelectorAll('.filter-btn');
const futureSearchInput = document.getElementById('futureSearchInput');
const searchInfoText = document.getElementById('searchInfoText');
const activeFilters = [];

function renderFilters() {
  if (!activeFilters.length) {
    futureSearchInput.placeholder = 'Выберите пункты выше, затем используйте поиск';
    searchInfoText.textContent = 'Сейчас это интерфейс-заглушка. Позже здесь будет поиск по статистике, группировкам и связанным материалам с учетом выбранных пунктов.';
    return;
  }

  const values = activeFilters.map((item) => item.value).join(', ');
  futureSearchInput.placeholder = `Поиск по выбранным пунктам: ${values}`;
  searchInfoText.textContent = `Подготовлен маршрут поиска по выбранным пунктам: ${values}. После подключения базы данных здесь будет выводиться результат.`;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.group;
    const value = button.dataset.value;
    const existingIndex = activeFilters.findIndex((item) => item.group === group && item.value === value);

    if (existingIndex >= 0) {
      activeFilters.splice(existingIndex, 1);
      button.classList.remove('active');
    } else {
      activeFilters.push({ group, value });
      button.classList.add('active');
    }

    renderFilters();
  });
});

renderFilters();
