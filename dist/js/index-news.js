(function () {
  const container = document.getElementById('main-news-list');
  if (!container) return;

  const PLACEHOLDERS = [
    './dist/img/mkimg-01.jpg',
    './dist/img/mkimg-02.jpg',
    './dist/img/mkimg-03.jpg',
    './dist/img/mkimg-04.jpg',
  ];

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { time: hh + ':' + mm, date: dd + '.' + mo + '.' + yyyy };
  }

  function renderNews(items) {
    if (!items.length) {
      container.innerHTML = '<div class="text-center text-body-tertiary py-3">Нет новостей</div>';
      return;
    }
    container.innerHTML = items.map(function (n, idx) {
      const fmt = formatDate(n.dte);
      const img = PLACEHOLDERS[idx % PLACEHOLDERS.length];
      const href = '01.html?id=' + n.id_page;
      return '<div class="d-flex justify-content-between rounded-2 border pe-2 mb-1 bg-body">' +
        '<div class="d-flex flex-fill align-items-center">' +
          '<div class="p-2">' +
            '<a href="' + href + '"><img class="rounded" src="' + escapeHtml(img) + '" alt="" style="width:90px;height:90px;object-fit:cover"></a>' +
          '</div>' +
          '<div class="d-flex flex-fill align-items-center">' +
            '<div class="d-flex text-truncate flex-column ms-2">' +
              '<div class="mk-data-2 text-body-tertiary pe-2">' +
                '<span class="me-2"><i class="bi bi-clock-fill pe-2"></i>' + escapeHtml(fmt.time) + '</span>' +
                '<span class="me-4"><i class="bi bi-calendar2-event-fill pe-2"></i>' + escapeHtml(fmt.date) + '</span>' +
              '</div>' +
              '<a class="flex-fill text-truncate link-body-emphasis link-offset-2 link-underline-opacity-0 link-underline-opacity-75-hover" href="' + href + '">' +
                escapeHtml(n.title_content) +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  fetch('/news?limit=5')
    .then(function (r) { return r.json(); })
    .then(function (data) { renderNews(data.items); })
    .catch(function () {
      container.innerHTML = '<div class="text-center text-body-tertiary py-3">Не удалось загрузить новости</div>';
    });
})();
