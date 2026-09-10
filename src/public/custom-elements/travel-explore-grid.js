// ============================================================
// TravelVlog — travel-explore-grid.js
// Custom Element: <travel-explore-grid>
//
// Anasayfada "Tüm destinasyonları keşfet" ızgarası — 10-15 kart,
// altta /destinations-all'a giden bir buton.
//
// Wix Velo masterPage.js tarafından gönderilmesi beklenen
// mesaj tipi: EXPLORE_UPDATE
//
// payload:
// {
//   items: [
//     {
//       title,        // string
//       link,         // string — destinationLink(item)
//       heroImage,    // string — ZATEN wix:image://'dan çevrilmiş gerçek URL
//       ulke,         // string
//       bolge         // string
//     },
//     ...
//   ],
//   viewAllLink: string   // /destinations-all sayfasının tam adresi
// }
//
// home.js ve travel-featured.js ile aynı iki kanalı kullanır:
// data-explore attribute'u veya postMessage.
// ============================================================

class TravelExploreGrid extends HTMLElement {

  static get observedAttributes() {
    return ['data-explore'];
  }

  constructor() {
    super();

    this._data = null;
    this._pendingData = null;
    this._rendered = false;

    this._onElementMessage = this._onElementMessage.bind(this);
    this._onWindowMessage = this._onWindowMessage.bind(this);
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;

    this.attachShadow({ mode: 'open' });
    this._build();

    const initialData = this.getAttribute('data-explore');

    if (initialData) {
      this._apply(initialData);
    } else if (this._pendingData) {
      const pending = this._pendingData;
      this._pendingData = null;
      this._apply(pending);
    }

    this.addEventListener('message', this._onElementMessage);
    window.addEventListener('message', this._onWindowMessage);
  }

  disconnectedCallback() {
    this.removeEventListener('message', this._onElementMessage);
    window.removeEventListener('message', this._onWindowMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-explore' && newValue && newValue !== oldValue) {
      this._apply(newValue);
    }
  }

  _onElementMessage(event) {
    const message = event.detail || event.data;
    if (message && message.type === 'EXPLORE_UPDATE') {
      this._apply(message.payload);
    }
  }

  _onWindowMessage(event) {
    if (event.data && event.data.type === 'EXPLORE_UPDATE') {
      this._apply(event.data.payload);
    }
  }

  // ==========================================================
  // APPLY DATA
  // ==========================================================

  _apply(raw) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (!data || !Array.isArray(data.items)) return;

      this._data = {
        items: data.items.slice(0, 15),
        viewAllLink: data.viewAllLink || '/destinations-all'
      };

      if (!this.shadowRoot) {
        this._pendingData = raw;
        return;
      }

      this._renderData();

    } catch (error) {
      console.error('TravelExploreGrid data error:', error);
    }
  }

  // ==========================================================
  // BUILD (statik iskelet)
  // ==========================================================

  _build() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&display=swap');

        :host {
          display: block;
          width: 100%;
          background: #fff;
          font-family: 'Inter', Arial, sans-serif;
          --serif: 'Newsreader', Georgia, serif;
          --sans: 'Inter', Arial, sans-serif;
          --ink: #151515;
        }

        * { box-sizing: border-box; }

        .section {
          max-width: 1500px;
          margin: 0 auto;
          padding: 28px 70px 56px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 14px;
          color: rgba(21,21,21,0.65);
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .eyebrow-line {
          width: 46px;
          height: 1px;
          background: rgba(21,21,21,0.35);
        }

        .heading {
          margin: 0 0 40px;
          color: var(--ink);
          font-family: var(--serif);
          font-size: clamp(32px, 3.2vw, 46px);
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px 22px;
          margin-bottom: 46px;
        }

        .card {
          text-decoration: none;
          color: inherit;
        }

        .card-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #e7e4dc;
        }

        .card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .5s ease;
        }

        .card:hover .card-image-wrap img {
          transform: scale(1.04);
        }

        .card-title {
          margin: 14px 0 4px;
          color: var(--ink);
          font-family: var(--serif);
          font-size: 19px;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .card-loc {
          margin: 0;
          color: rgba(21,21,21,0.6);
          font-family: var(--sans);
          font-size: 11.5px;
          letter-spacing: 0.03em;
        }

        .view-all-wrap {
          display: flex;
          justify-content: center;
        }

        .view-all {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          height: 58px;
          padding: 0 34px;
          border: 1px solid rgba(21,21,21,0.75);
          color: var(--ink);
          text-decoration: none;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          transition: background .25s ease, color .25s ease;
        }

        .view-all:hover {
          background: var(--ink);
          color: #fff;
        }

        .empty {
          color: rgba(21,21,21,0.45);
          font-family: var(--sans);
          font-size: 13px;
        }

        @media (max-width: 1200px) {
          .grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 1100px) {
          .section { padding: 24px 42px 48px; }
        }

        @media (max-width: 760px) {
          .section { padding: 20px 22px 42px; }
          .grid { grid-template-columns: repeat(2, 1fr); gap: 16px 14px; }
          .card-title { font-size: 16px; }
        }

        @media (max-width: 460px) {
          .grid { grid-template-columns: 1fr 1fr; }
        }
      </style>

      <div class="section">
        <div class="eyebrow">
          <span class="eyebrow-line"></span>
          <span>All destinations</span>
        </div>
        <h2 class="heading">Explore all destinations</h2>

        <div class="grid"></div>

        <div class="view-all-wrap">
          <a class="view-all" href="destinations-all">
            <span>View all destinations</span>
            <span>→</span>
          </a>
        </div>
      </div>
    `;
  }

  // ==========================================================
  // RENDER DATA
  // ==========================================================

  _renderData() {
    const grid = this.shadowRoot.querySelector('.grid');
    const viewAll = this.shadowRoot.querySelector('.view-all');
    if (!grid) return;

    grid.innerHTML = '';

    if (viewAll && this._data.viewAllLink) {
      viewAll.href = this._data.viewAllLink;
    }

    const items = this._data.items;

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No destinations yet.';
      grid.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('a');
      card.className = 'card';
      card.href = item.link || '#';

      const imageWrap = document.createElement('div');
      imageWrap.className = 'card-image-wrap';

      if (item.heroImage) {
        const img = document.createElement('img');
        img.src = item.heroImage;
        img.alt = item.title || '';
        img.loading = 'lazy';
        imageWrap.appendChild(img);
      }

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || '';

      const loc = document.createElement('div');
      loc.className = 'card-loc';
      loc.textContent = [item.ulke, item.bolge].filter(Boolean).join(' · ');

      card.appendChild(imageWrap);
      card.appendChild(title);
      if (loc.textContent) card.appendChild(loc);

      grid.appendChild(card);
    });
  }
}

if (!customElements.get('travel-explore-grid')) {
  customElements.define('travel-explore-grid', TravelExploreGrid);
}
