(function () {
  const LIST_EL = document.getElementById('news-list');
  const PAGINATION_EL = document.getElementById('news-pagination');
  const PAGE_SIZE = 10;

  const placeholders = [
    './dist/img/mkimg-01.jpg',
    './dist/img/mkimg-02.jpg',
    './dist/img/mkimg-03.jpg',
    './dist/img/mkimg-04.jpg',
  ];

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { time: hh + ':' + mm, date: dd + '.' + mo + '.' + yyyy };
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderItems(items) {
    if (!items.length) {
      LIST_EL.innerHTML = '<div class="text-center text-body-tertiary py-3">Нет новостей</div>';
      return;
    }
    LIST_EL.innerHTML = items.map(function (n, idx) {
      const fmt = formatDate(n.dte);
      const img = placeholders[idx % placeholders.length];
      return '<div class="border mk-back4 mb-2">' +
        '<div class="card border rounded-3 h-100 px-3 py-1 bg-body-tertiary">' +
          '<div class="row">' +
            '<div class="col-lg-3 col-md-5">' +
              '<div class="row"><div class="col-xl-12 p-3">' +
                '<div class="p-2 rounded-3 border card">' +
                  '<img class="img-fluid rounded" src="' + escapeHtml(img) + '" alt="" style="min-width:100%">' +
                '</div>' +
              '</div></div>' +
            '</div>' +
            '<div class="col-lg-9 col-md-7 p-3">' +
              '<h2 class="mk-bold fs-3">' +
                '<a href="01.html?id=' + n.id_page + '" class="link-body-emphasis link-offset-2 link-underline-opacity-10 link-underline-opacity-75-hover">' +
                  escapeHtml(n.title_content) +
                '</a>' +
              '</h2>' +
              (n.small_content ? '<p class="mb-1">' + escapeHtml(n.small_content) + '</p>' : '') +
              '<a href="01.html?id=' + n.id_page + '" class="icon-link icon-link-hover small pb-2">Подробнее<i class="bi-chevron-right"></i></a>' +
              '<div class="mk-data-2 text-body-tertiary pe-2 mt-1">' +
                '<span class="me-2"><i class="bi bi-clock-fill pe-2"></i>' + fmt.time + '</span>' +
                '<span class="me-2"><i class="bi bi-calendar2-event-fill pe-2"></i>' + fmt.date + '</span>' +
                (n.source ? '<span class="me-4"><i class="bi bi-globe2 pe-2"></i>' + escapeHtml(n.source) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderPagination(total, currentPage) {
    if (!PAGINATION_EL) return;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) {
      PAGINATION_EL.innerHTML = '';
      return;
    }

    PAGINATION_EL.innerHTML =
      '<ul class="pagination align-items-center">' +
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

    PAGINATION_EL.querySelectorAll('[data-page]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const p = parseInt(el.getAttribute('data-page'));
        if (p >= 1 && p <= totalPages) loadPage(p);
      });
    });
  }

  function loadPage(page) {
    const offset = (page - 1) * PAGE_SIZE;
    LIST_EL.innerHTML = '<div class="text-center text-body-tertiary py-3">Загрузка...</div>';
    fetch('/news?limit=' + PAGE_SIZE + '&offset=' + offset)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderItems(data.items);
        renderPagination(data.total, page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function () {
        LIST_EL.innerHTML = '<div class="text-center text-body-tertiary py-3">Не удалось загрузить новости</div>';
      });
  }

  loadPage(1);
})();