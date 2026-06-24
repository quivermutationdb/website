/* ============================================================
   QMD — Dataset download modal (shared by browse + search)

   Usage:
     <script src="/download.js"></script>
     QMDDownload.open(filters, count)   // filters: same keys as /search

   Opens a small modal that optionally collects an email / name and lets the
   user pick a format (CSV / Excel) and contents (distinct quivers vs. all
   labelings), then hands off to the API's /export endpoint (which streams the
   file and records the download server-side).
   ============================================================ */
(function () {
  const API = 'https://api.quivermutationdb.org';

  let _filters = {};
  let _counts = { distinct: null, labelings: null };

  function activeFilters(f) {
    return Object.entries(f || {}).filter(([, v]) => v !== '' && v != null);
  }

  function selected(group) {
    const el = document.querySelector(`.dl-seg[data-group="${group}"] .seg.active`);
    return el ? el.dataset.val : null;
  }

  function buildUrl(format, scope) {
    const params = new URLSearchParams({ format, scope });
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

        <div class="dl-choice">
          <span class="dl-choice-label">Contents</span>
          <div class="dl-seg" data-group="scope">
            <button type="button" class="seg active" data-val="distinct">Distinct quivers</button>
            <button type="button" class="seg" data-val="labelings">All labelings</button>
          </div>
        </div>
        <div class="dl-choice">
          <span class="dl-choice-label">Format</span>
          <div class="dl-seg" data-group="format">
            <button type="button" class="seg active" data-val="csv">CSV</button>
            <button type="button" class="seg" data-val="xlsx">Excel</button>
          </div>
        </div>

        <p class="dl-note">Email is optional — we use it only to understand who relies on the dataset.</p>

        <div class="dl-actions">
          <button class="btn btn-ghost" type="button" onclick="QMDDownload.close()">Cancel</button>
          <button class="btn" type="button" onclick="QMDDownload.go()">Download</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    el.addEventListener('click', e => {
      const seg = e.target.closest('.seg');
      if (seg && el.contains(seg)) {
        const group = seg.parentElement;
        group.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
        seg.classList.add('active');
        if (group.dataset.group === 'scope') updateSub();
        return;
      }
      if (e.target === el) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !el.hidden) close();
    });
  }

  function updateSub() {
    const n = activeFilters(_filters).length;
    const scope = selected('scope') || 'distinct';
    const c = _counts[scope];
    const noun = scope === 'labelings' ? 'labeled quiver' : 'quiver';
    const cntTxt = (c == null)
      ? (scope === 'labelings' ? 'labeled quivers' : 'quivers')
      : `<b>${Number(c).toLocaleString()}</b> ${noun}${c === 1 ? '' : 's'}`;
    const cut = n === 0 ? 'the full dataset (no filters)' : 'your current filter cut';
    document.getElementById('dl-sub').innerHTML = `Exporting ${cntTxt} — ${cut}.`;
  }

  // counts: a number (same for both) or { distinct, labelings }.
  function open(filters, counts, initialScope) {
    _filters = filters || {};
    if (counts == null) {
      _counts = { distinct: null, labelings: null };
    } else if (typeof counts === 'number') {
      _counts = { distinct: counts, labelings: counts };
    } else {
      _counts = {
        distinct:  counts.distinct  == null ? null : counts.distinct,
        labelings: counts.labelings == null ? null : counts.labelings,
      };
    }
    const scope = initialScope === 'labelings' ? 'labelings' : 'distinct';
    document.querySelectorAll('.dl-seg[data-group="scope"] .seg').forEach(b =>
      b.classList.toggle('active', b.dataset.val === scope));
    updateSub();
    document.getElementById('dl-overlay').hidden = false;
    document.getElementById('dl-email').focus();
  }

  function close() {
    const el = document.getElementById('dl-overlay');
    if (el) el.hidden = true;
  }

  function go() {
    const format = selected('format') || 'csv';
    const scope  = selected('scope')  || 'distinct';
    // Cross-origin attachment: the server's Content-Disposition supplies the
    // filename, so a plain link click downloads without navigating away.
    const a = document.createElement('a');
    a.href = buildUrl(format, scope);
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (window.gtag) {
      gtag('event', 'download', {
        format,
        scope,
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
