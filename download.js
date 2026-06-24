/* ============================================================
   QMD — Dataset download modal (shared by browse + search)

   Usage:
     <script src="/download.js"></script>
     QMDDownload.open(filters, count)   // filters: same keys as /search

   Opens a small modal that optionally collects an email / name, then
   hands off to the API's /export endpoint (which streams CSV or Excel
   and records the download server-side).
   ============================================================ */
(function () {
  const API = 'https://api.quivermutationdb.org';

  let _filters = {};
  let _count = null;

  function activeFilters(f) {
    return Object.entries(f || {}).filter(([, v]) => v !== '' && v != null);
  }

  function buildUrl(format) {
    const params = new URLSearchParams({ format });
    for (const [k, v] of activeFilters(_filters)) params.set(k, v);
    const email = document.getElementById('dl-email').value.trim();
    const name  = document.getElementById('dl-name').value.trim();
    if (email) params.set('email', email);
    if (name)  params.set('name', name);
    return `${API}/export?${params.toString()}`;
  }

  function injectModal() {
    const el = document.createElement('div');
    el.className = 'dl-overlay';
    el.id = 'dl-overlay';
    el.hidden = true;
    el.innerHTML = `
      <div class="dl-modal" role="dialog" aria-modal="true" aria-labelledby="dl-title">
        <div class="dl-head">
          <h2 id="dl-title">Download dataset</h2>
          <button class="dl-close" type="button" aria-label="Close" onclick="QMDDownload.close()">&times;</button>
        </div>
        <p class="dl-sub" id="dl-sub"></p>
        <div class="dl-field">
          <label for="dl-email">Email <span class="dl-opt">(optional)</span></label>
          <input type="email" id="dl-email" placeholder="you@university.edu" autocomplete="email">
        </div>
        <div class="dl-field">
          <label for="dl-name">Name / affiliation <span class="dl-opt">(optional)</span></label>
          <input type="text" id="dl-name" placeholder="Jane Doe, Some University" autocomplete="organization">
        </div>
        <p class="dl-note">Email is optional — we use it only to understand who relies on the dataset.</p>
        <div class="dl-actions">
          <button class="btn btn-ghost" type="button" onclick="QMDDownload.close()">Cancel</button>
          <button class="btn" type="button" onclick="QMDDownload.go('csv')">Download CSV</button>
          <button class="btn" type="button" onclick="QMDDownload.go('xlsx')">Download Excel</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !el.hidden) close();
    });
  }

  function open(filters, count) {
    _filters = filters || {};
    _count = (count == null ? null : count);
    const n = activeFilters(_filters).length;
    const cntTxt = _count == null
      ? 'quivers'
      : `<b>${Number(_count).toLocaleString()}</b> quiver${_count === 1 ? '' : 's'}`;
    const cut = n === 0 ? 'the full dataset (no filters)' : 'your current filter cut';
    document.getElementById('dl-sub').innerHTML = `Exporting ${cntTxt} — ${cut}.`;
    document.getElementById('dl-overlay').hidden = false;
    document.getElementById('dl-email').focus();
  }

  function close() {
    const el = document.getElementById('dl-overlay');
    if (el) el.hidden = true;
  }

  function go(format) {
    // Cross-origin attachment: the server's Content-Disposition supplies the
    // filename, so a plain link click downloads without navigating away.
    const a = document.createElement('a');
    a.href = buildUrl(format);
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (window.gtag) {
      gtag('event', 'download', {
        format,
        filtered: activeFilters(_filters).length > 0,
      });
    }
    close();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModal);
  } else {
    injectModal();
  }

  window.QMDDownload = { open, close, go };
})();
