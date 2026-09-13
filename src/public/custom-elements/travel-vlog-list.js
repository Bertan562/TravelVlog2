/**
 * travel-vlog-list.js
 * Wix Custom Element — tag: travel-vlog-list, Wix element ID: vlogsList
 *
 * Data contract (matches masterPage.js's universal send() helper, same as
 * travel-explore-grid / travel-activity-list):
 *
 *   - masterPage.setupVlogsList() sets attribute `data-vlogs` on this
 *     element to JSON.stringify(items), AND calls el.postMessage({ type:
 *     'VLOGS_UPDATE', payload: items }).
 *   - This element listens for BOTH (attributeChangedCallback covers the
 *     attribute path, window 'message' covers postMessage) since send()
 *     tries the attribute first and falls back to postMessage silently.
 *
 * Each item in the array looks like:
 * {
 *   title, slug, contentType ("video"|"gallery"), description,
 *   coverImage (resolved static.wixstatic.com URL or null),
 *   destinationName (text, e.g. "cappadocia"),
 *   experienceName (text, e.g. "hot ballons"),
 *   author, link (full /vlogs/{slug} URL)
 * }
 *
 * Only status="Approved" vlogs are ever sent — filtering by approval
 * status happens in masterPage.js, not here.
 *
 * PAGINATION: masterPage.js still sends every approved vlog in one
 * message (up to 1000). To keep the page fast and the grid short as
 * the community grows, this element only RENDERS a page of results at
 * a time and reveals more via a "Load more" button — no extra backend
 * calls, just a slice of the array we already have client-side.
 */

const PAGE_SIZE = 24;

class TravelVlogList extends HTMLElement {
  static get observedAttributes() {
    return ['data-vlogs'];
  }

  constructor() {
    super();
    this._vlogs = [];
    this._search = '';
    this._destination = 'all';
    this._contentType = 'all';
    this._visibleCount = PAGE_SIZE;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();

    // Fallback path: masterPage's send() also does el.postMessage(...).
    // Custom elements don't get postMessage natively like an iframe, but
    // Wix wires $w('#id').postMessage() through to a 'message' event on
    // the element's window context in some setups — listen defensively.
    window.addEventListener('message', this._onWindowMessage);

    // If the attribute was already set before this element upgraded
    // (e.g. fast page load), pick it up now.
    const existing = this.getAttribute('data-vlogs');
    if (existing) {
      this._applyVlogsJson(existing);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onWindowMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-vlogs' && newValue && newValue !== oldValue) {
      this._applyVlogsJson(newValue);
    }
  }

  _onWindowMessage = (event) => {
    const data = event.data;
    if (data && data.type === 'VLOGS_UPDATE' && Array.isArray(data.payload)) {
      this._vlogs = data.payload;
      this._visibleCount = PAGE_SIZE;
      this._render();
    }
  };

  _applyVlogsJson(json) {
    try {
      const parsed = JSON.parse(json);
      this._vlogs = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      this._vlogs = [];
    }
    this._visibleCount = PAGE_SIZE;
    this._render();
  }

  _uniqueDestinations() {
    const names = this._vlogs
      .map((v) => v.destinationName)
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }

  _filteredVlogs() {
    const q = this._search.trim().toLowerCase();
    return this._vlogs.filter((v) => {
      const matchesSearch =
        !q ||
        (v.title || '').toLowerCase().includes(q) ||
        (v.destinationName || '').toLowerCase().includes(q);
      const matchesDestination =
        this._destination === 'all' || v.destinationName === this._destination;
      const matchesType =
        this._contentType === 'all' || v.contentType === this._contentType;
      return matchesSearch && matchesDestination && matchesType;
    });
  }

  _onSearchInput(e) {
    this._search = e.target.value;
    this._visibleCount = PAGE_SIZE;
    this._renderGrid();
  }

  _onDestinationChange(e) {
    this._destination = e.target.value;
    this._visibleCount = PAGE_SIZE;
    this._renderGrid();
  }

  _onTypeChange(type) {
    this._contentType = type;
    this._visibleCount = PAGE_SIZE;
    this._render();
  }

  _onLoadMore() {
    this._visibleCount += PAGE_SIZE;
    this._renderGrid();
  }

  _cardMarkup(vlog) {
    const href = vlog.link || `/vlogs/${vlog.slug}`;
    const badge = vlog.contentType === 'gallery' ? 'Gallery' : 'Video';
    const cover = vlog.coverImage || '';
    return `
      <a class="vlog-card" href="${href}">
        <div class="vlog-card__cover">
          ${cover ? `<img src="${cover}" alt="${this._escape(vlog.title)}" loading="lazy" />` : ''}
          <span class="vlog-card__badge">${badge}</span>
        </div>
        <div class="vlog-card__body">
          <span class="vlog-card__destination">${this._escape(vlog.destinationName || '')}</span>
          <h3 class="vlog-card__title">${this._escape(vlog.title)}</h3>
          <span class="vlog-card__author">${this._escape(vlog.author || '')}</span>
        </div>
      </a>
    `;
  }

  _escape(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  _renderGrid() {
    const grid = this.shadowRoot.querySelector('.vlog-grid');
    const empty = this.shadowRoot.querySelector('.vlog-empty');
    const loadMoreWrap = this.shadowRoot.querySelector('.vlog-load-more-wrap');
    const countText = this.shadowRoot.querySelector('.vlog-count');
    if (!grid) return;

    const filtered = this._filteredVlogs();
    const visible = filtered.slice(0, this._visibleCount);

    grid.innerHTML = visible.map((v) => this._cardMarkup(v)).join('');

    if (empty) {
      empty.style.display = filtered.length === 0 ? 'block' : 'none';
    }

    if (countText) {
      countText.textContent = filtered.length > 0
        ? `Showing ${visible.length} of ${filtered.length}`
        : '';
    }

    if (loadMoreWrap) {
      loadMoreWrap.style.display = visible.length < filtered.length ? 'flex' : 'none';
    }
  }

  _render() {
    const destinations = this._uniqueDestinations();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--wix-body-font, inherit);
          color: var(--wix-text-color, #1a1a1a);
        }
        .vlog-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .vlog-search {
          flex: 1 1 240px;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        .vlog-select {
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
        }
        .vlog-type-toggle {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }
        .vlog-type-toggle button {
          border: none;
          background: #fff;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
        }
        .vlog-type-toggle button.active {
          background: #1a1a1a;
          color: #fff;
        }
        .vlog-count {
          font-size: 12.5px;
          opacity: 0.55;
          margin-bottom: 16px;
          display: block;
        }
        .vlog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }
        .vlog-card {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .vlog-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .vlog-card__cover {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #eee;
        }
        .vlog-card__cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vlog-card__badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .vlog-card__body {
          padding: 14px 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .vlog-card__destination {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #888;
        }
        .vlog-card__title {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.3;
        }
        .vlog-card__author {
          font-size: 13px;
          color: #666;
        }
        .vlog-empty {
          display: none;
          padding: 40px 0;
          text-align: center;
          color: #888;
        }
        .vlog-load-more-wrap {
          display: none;
          justify-content: center;
          padding-top: 32px;
        }
        .vlog-load-more {
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          background: #fff;
          border: 1px solid #1a1a1a;
          color: #1a1a1a;
          border-radius: 999px;
          padding: 12px 28px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .vlog-load-more:hover {
          background: #1a1a1a;
          color: #fff;
        }
      </style>

      <div class="vlog-toolbar">
        <input
          class="vlog-search"
          type="text"
          placeholder="Search vlogs..."
        />
        <select class="vlog-select">
          <option value="all">All destinations</option>
          ${destinations
            .map((d) => `<option value="${this._escape(d)}">${this._escape(d)}</option>`)
            .join('')}
        </select>
        <div class="vlog-type-toggle">
          <button data-type="all" class="${this._contentType === 'all' ? 'active' : ''}">All</button>
          <button data-type="video" class="${this._contentType === 'video' ? 'active' : ''}">Video</button>
          <button data-type="gallery" class="${this._contentType === 'gallery' ? 'active' : ''}">Gallery</button>
        </div>
      </div>

      <span class="vlog-count"></span>

      <div class="vlog-grid"></div>
      <div class="vlog-empty">No vlogs match your filters yet.</div>

      <div class="vlog-load-more-wrap">
        <button class="vlog-load-more" type="button">Load more</button>
      </div>
    `;

    const searchInput = this.shadowRoot.querySelector('.vlog-search');
    searchInput.value = this._search;
    searchInput.addEventListener('input', (e) => this._onSearchInput(e));

    const select = this.shadowRoot.querySelector('.vlog-select');
    select.value = this._destination;
    select.addEventListener('change', (e) => this._onDestinationChange(e));

    this.shadowRoot.querySelectorAll('.vlog-type-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => this._onTypeChange(btn.dataset.type));
    });

    this.shadowRoot.querySelector('.vlog-load-more').addEventListener('click', () => this._onLoadMore());

    this._renderGrid();
  }
}

customElements.define('travel-vlog-list', TravelVlogList);
