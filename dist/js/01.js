(async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;

  try {
    const res = await fetch(`/news/${id}`);
    if (!res.ok) return;
    const n = await res.json();

    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (n.title_content) {
      document.title = n.title_content;
      const el = document.getElementById('newsTitle');
      if (el) el.textContent = n.title_content;
      const bc = document.getElementById('newsBreadcrumb');
      if (bc) bc.textContent = n.title_content;
    }

    const body = document.getElementById('newsBody');
    if (body) {
      body.innerHTML = [n.small_content, n.big_content]
        .filter(Boolean)
        .map((p) => `<p>${esc(p)}</p>`)
        .join('');
    }

    const meta = document.getElementById('newsMeta');
    if (meta && n.dte) {
      const d = new Date(n.dte);
      const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      meta.innerHTML = `
        <span class="me-2"><i class="bi-clock-fill pe-2"></i>${esc(time)}</span>
        <span class="me-2"><i class="bi-calendar2-event-fill pe-2"></i>${esc(date)}</span>
        ${n.source ? `<span class="me-4"><i class="bi-globe2 pe-2"></i>${esc(n.source)}</span>` : ''}
      `;
    }
  } catch (e) {
    console.error('[01.html] Ошибка загрузки новости:', e);
  }
})();
