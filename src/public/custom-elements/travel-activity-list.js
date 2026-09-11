// ============================================================
// travel-activity-list.js  —  <travel-activity-list>
// ------------------------------------------------------------
// TravelVlog /experiences-all liste sayfasının gövdesi.
// Destinations liste sayfasıyla (destination-list.js) aynı desen:
// arama kutusu + bölge filtresi + kart ızgarası, hepsi istemci
// tarafında (tüm liste bir kerede gelir, filtreleme JS'te yapılır).
//
// Veri girişi (ikisi de desteklenir):
//   1) data-activities  attribute'u  → JSON string (aktivite dizisi)
//   2) postMessage / 'message' event → { type: 'ACTIVITIES_UPDATE', payload }
//
// Beklenen aktivite nesnesi:
//   { title, slug, link, heroImage, fiyat, sure,
//     destinationTitle, ulke, bolge }
// ============================================================

class TravelActivityList extends HTMLElement {
  static get observedAttributes() {
    return ['data-activities'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || oldVal === newVal) return;
    if (!this._built) { this._pending = newVal; return; }
    if (name === 'data-activities') this._applyActivities(newVal);
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap');

  :host {
    display: block;
    --paper:  #e9e8e4;
    --card:   #ffffff;
    --ink:    #141414;
    --ink-60: rgba(20,20,20,0.60);
    --ink-40: rgba(20,20,20,0.40);
    --rule:   rgba(20,20,20,0.12);
    --mark:   #16514C;

    --ui:    'Inter', system-ui, sans-serif;
    --prose: 'Newsreader', Georgia, serif;

    background: var(--paper);
    color: var(--ink);
    font-family: var(--ui);
  }
  * { box-sizing: border-box; }

  .wrap { width: 100%; max-width: 1440px; margin: 0 auto; padding: 48px 48px 96px; }

  .head { margin-bottom: 32px; }
  .head h1 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: clamp(38px, 5vw, 60px);
    line-height: 1.02;
    letter-spacing: -0.02em;
    margin: 0 0 10px;
  }
  .head p { margin: 0; font-size: 16px; color: var(--ink-60); }

  .controls {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 36px;
  }
  .search {
    flex: 1 1 280px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 12px 16px;
  }
  .search svg { width: 17px; height: 17px; flex-shrink: 0; color: var(--ink-40); }
  .search input {
    border: 0;
    outline: 0;
    background: transparent;
    font-family: var(--ui);
    font-size: 15px;
    color: var(--ink);
    width: 100%;
  }
  .search input::placeholder { color: var(--ink-40); }

  select.region {
    flex: 0 0 auto;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: var(--ui);
    font-size: 15px;
    color: var(--ink);
    cursor: pointer;
  }

  .count { font-size: 14px; color: var(--ink-40); margin-bottom: 20px; }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 24px;
  }
  .grid a {
    display: block;
    text-decoration: none;
    color: var(--ink);
    background: var(--card);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .grid a:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(20,20,20,0.10); }
  .grid .shot { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #d9d7d2; }
  .grid .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .grid .body { padding: 16px 18px 20px; }
  .grid .name { font-family: var(--prose); font-size: 21px; line-height: 1.2; display: block; margin-bottom: 6px; }
  .grid .where { font-size: 13px; color: var(--ink-40); margin-bottom: 10px; }
  .grid .meta { display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 500; color: var(--mark); }
  .grid .meta span + span::before { content: '•'; margin-right: 10px; color: var(--ink-40); }

  .empty {
    padding: 64px 24px;
    text-align: center;
    color: var(--ink-40);
    font-size: 15px;
  }

  @media (max-width: 700px) {
    .wrap { padding: 28px 22px 64px; }
    .controls { flex-direction: column; }
    select.region { width: 100%; }
  }
</style>

<div class="wrap">
  <div class="head">
    <h1>Experiences</h1>
    <p>Hand-picked activities and tours, wherever you're headed.</p>
  </div>

  <div class="controls">
    <div class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
      </svg>
      <input type="text" id="searchInput" placeholder="Search experiences…" aria-label="Search experiences">
    </div>
    <select class="region" id="regionSelect" aria-label="Filter by region">
      <option value="">All regions</option>
    </select>
  </div>

  <p class="count" id="count"></p>
  <div class="grid" id="grid"></div>
  <p class="empty" id="empty" hidden>No experiences match your search.</p>
</div>
`;

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const searchEl = root.getElementById('searchInput');
    const regionEl = root.getElementById('regionSelect');
    const gridEl   = root.getElementById('grid');
    const countEl  = root.getElementById('count');
    const emptyEl  = root.getElementById('empty');

    let ALL = [];
    let query = '';
    let region = '';

    const populateRegions = () => {
      const regions = Array.from(new Set(ALL.map((a) => a.bolge).filter(Boolean))).sort();
      regionEl.innerHTML = '<option value="">All regions</option>' +
        regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    };

    const render = () => {
      const q = query.trim().toLowerCase();
      const list = ALL.filter((a) => {
        const matchesRegion = !region || a.bolge === region;
        const matchesQuery = !q ||
          (a.title || '').toLowerCase().includes(q) ||
          (a.destinationTitle || '').toLowerCase().includes(q) ||
          (a.ulke || '').toLowerCase().includes(q);
        return matchesRegion && matchesQuery;
      });

      countEl.textContent = `${list.length} experience${list.length === 1 ? '' : 's'}`;
      emptyEl.hidden = list.length !== 0;

      gridEl.innerHTML = list.map((a) => {
        const img = a.heroImage
          ? `<img src="${esc(a.heroImage)}" alt="${esc(a.title)}" loading="lazy">`
          : '';
        const where = [a.destinationTitle, a.ulke].filter(Boolean).join(', ');
        const meta = [a.fiyat, a.sure].filter(Boolean);
        return `<a href="${esc(a.link || '#')}">` +
          `<span class="shot">${img}</span>` +
          `<span class="body">` +
            `<span class="name">${esc(a.title)}</span>` +
            (where ? `<span class="where">${esc(where)}</span>` : '') +
            (meta.length ? `<span class="meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</span>` : '') +
          `</span>` +
        `</a>`;
      }).join('');
    };

    searchEl.addEventListener('input', () => { query = searchEl.value; render(); });
    regionEl.addEventListener('change', () => { region = regionEl.value; render(); });

    this._applyActivities = (raw) => {
      try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        ALL = Array.isArray(list) ? list : [];
        populateRegions();
        render();
      } catch (err) { console.error('Aktivite listesi işlenemedi:', err); }
    };

    this.addEventListener('message', (e) => {
      const d = e.detail !== undefined ? e.detail : e.data;
      if (d && d.type === 'ACTIVITIES_UPDATE') this._applyActivities(d.payload);
    });
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (d && d.type === 'ACTIVITIES_UPDATE') this._applyActivities(d.payload);
    });

    render();

    const pend = this._pending || this.getAttribute('data-activities');
    if (pend) this._applyActivities(pend);
    this._pending = null;
  }
}

customElements.define('travel-activity-list', TravelActivityList);
