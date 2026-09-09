// ============================================================
// travel-destinations.js  —  <travel-destinations>
// ------------------------------------------------------------
// Destinasyon liste sayfası (/destinations).
//
// Tüm destinasyonları ızgara halinde gösterir; bölgeye göre
// filtrelenir ve isimle aranabilir. Veriyi masterPage.js gönderir.
//
// Veri girişi:
//   data-destinations attribute'u → JSON string (dizi)
//   postMessage → { type: 'DESTINATIONS_UPDATE', payload: [...] }
//
// Beklenen her öge:
//   { title, ulke, bolge, kisaAciklama, imageUrl, link }
// ============================================================

class TravelDestinations extends HTMLElement {
  static get observedAttributes() { return ['data-destinations']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'data-destinations' || !newVal || oldVal === newVal) return;
    if (this._built) this._apply(newVal);
    else this._pending = newVal;
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap');

  :host {
    display: block;
    --paper:  #e9e8e4;
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

  .wrap { max-width: 1440px; margin: 0 auto; padding: 0 48px 96px; }

  /* ---------- Başlık ---------- */
  .head { padding: 56px 0 0; }
  .head h1 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: clamp(40px, 5.5vw, 64px);
    line-height: 1.02;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .head p {
    margin: 16px 0 0;
    max-width: 620px;
    font-family: var(--prose);
    font-size: 20px;
    line-height: 1.55;
    color: var(--ink-60);
  }

  /* ---------- Filtre satırı ---------- */
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px 28px;
    margin: 38px 0 6px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--rule);
  }
  .tabs { display: flex; flex-wrap: wrap; gap: 6px; }
  .tabs button {
    font-family: var(--ui);
    font-size: 14.5px;
    font-weight: 500;
    padding: 9px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ink-60);
    cursor: pointer;
  }
  .tabs button:hover { background: rgba(20,20,20,0.06); color: var(--ink); }
  .tabs button.on { background: var(--ink); color: #fff; font-weight: 600; }
  .tabs button:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; }

  .search {
    display: flex;
    align-items: center;
    gap: 9px;
    background: #fff;
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 10px 16px;
    min-width: 240px;
  }
  .search svg { width: 15px; height: 15px; color: var(--ink-40); flex-shrink: 0; }
  .search input {
    border: 0;
    outline: 0;
    background: transparent;
    width: 100%;
    font-family: var(--ui);
    font-size: 14.5px;
    color: var(--ink);
  }

  .count {
    margin: 20px 0 26px;
    font-size: 14px;
    color: var(--ink-40);
  }

  /* ---------- Izgara ---------- */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 34px 26px;
  }
  .card { text-decoration: none; color: var(--ink); display: block; }
  .card .shot {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 14px;
    overflow: hidden;
    background: #d9d7d2;
    margin-bottom: 14px;
  }
  .card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .card:hover img { transform: scale(1.04); }
  .card .name {
    display: block;
    font-family: var(--prose);
    font-size: 25px;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }
  .card .where {
    display: block;
    margin-top: 6px;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink-40);
  }
  .card .blurb {
    display: block;
    margin-top: 10px;
    font-family: var(--prose);
    font-size: 16.5px;
    line-height: 1.5;
    color: var(--ink-60);
  }

  .none {
    padding: 40px 0;
    font-size: 16px;
    color: var(--ink-40);
  }

  @media (max-width: 900px) {
    .wrap { padding: 0 22px 64px; }
    .head { padding: 34px 0 0; }
    .head p { font-size: 18px; }
    .bar { margin: 28px 0 4px; }
    .search { min-width: 0; width: 100%; }
    .grid { gap: 28px 18px; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>

<div class="wrap">
  <header class="head">
    <h1>Destinations</h1>
    <p>Every place we've written a full guide to — how to get there, where to
       stay, what's worth your time once you arrive.</p>
  </header>

  <div class="bar">
    <div class="tabs" id="tabs" role="group" aria-label="Filter by region"></div>
    <label class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input id="q" type="text" placeholder="Search destinations" autocomplete="off" aria-label="Search destinations">
    </label>
  </div>

  <p class="count" id="count"></p>
  <div class="grid" id="grid"></div>
</div>
`;

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const tabsEl  = root.getElementById('tabs');
    const gridEl  = root.getElementById('grid');
    const countEl = root.getElementById('count');
    const qEl     = root.getElementById('q');

    let ALL = [];
    let region = 'all';

    const visible = () => {
      const q = qEl.value.trim().toLowerCase();
      return ALL.filter((d) => {
        if (region !== 'all' && String(d.bolge || '') !== region) return false;
        if (!q) return true;
        return (String(d.title || '') + ' ' + String(d.ulke || ''))
          .toLowerCase().indexOf(q) !== -1;
      });
    };

    const renderTabs = () => {
      // Bölgeler veriden geliyor — elle liste tutmak, yeni bir kıta
      // eklendiğinde unutulacak bir yer daha demek.
      const regions = [];
      ALL.forEach((d) => {
        const b = String(d.bolge || '').trim();
        if (b && regions.indexOf(b) === -1) regions.push(b);
      });
      regions.sort();

      const opts = [['all', 'All']].concat(regions.map((r) => [r, r]));
      tabsEl.innerHTML = opts.map(([val, label]) =>
        `<button type="button" data-r="${esc(val)}"${val === region ? ' class="on"' : ''}>${esc(label)}</button>`
      ).join('');

      tabsEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          region = b.getAttribute('data-r');
          renderTabs();
          renderGrid();
        });
      });
    };

    const renderGrid = () => {
      const list = visible().slice().sort((a, b) =>
        String(a.title || '').localeCompare(String(b.title || '')));

      countEl.textContent = list.length
        ? `${list.length} destination${list.length === 1 ? '' : 's'}`
        : '';

      if (!list.length) {
        gridEl.innerHTML = `<p class="none">Nothing matches that yet.</p>`;
        return;
      }

      gridEl.innerHTML = list.map((d) => {
        const img = d.imageUrl
          ? `<img src="${esc(d.imageUrl)}" alt="${esc(d.title)}" loading="lazy">`
          : '';
        const where = [d.ulke, d.bolge].filter(Boolean).join(', ');
        return `<a class="card" href="${esc(d.link || '#')}">` +
          `<span class="shot">${img}</span>` +
          `<span class="name">${esc(d.title)}</span>` +
          (where ? `<span class="where">${esc(where)}</span>` : '') +
          (d.kisaAciklama ? `<span class="blurb">${esc(d.kisaAciklama)}</span>` : '') +
          `</a>`;
      }).join('');
    };

    qEl.addEventListener('input', renderGrid);

    this._apply = (raw) => {
      try {
        const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
        ALL = Array.isArray(arr) ? arr : [];
        renderTabs();
        renderGrid();
      } catch (err) {
        console.error('Destinasyon listesi işlenemedi:', err);
      }
    };

    this.addEventListener('message', (e) => {
      const d = e.detail !== undefined ? e.detail : e.data;
      if (d && d.type === 'DESTINATIONS_UPDATE') this._apply(d.payload);
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'DESTINATIONS_UPDATE') this._apply(e.data.payload);
    });

    renderTabs();
    renderGrid();

    const pend = this._pending || this.getAttribute('data-destinations');
    if (pend) this._apply(pend);
    this._pending = null;
  }
}

customElements.define('travel-destinations', TravelDestinations);
