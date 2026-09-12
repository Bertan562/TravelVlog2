/**
 * travel-my-vlogs.js
 * Wix Custom Element — tag: travel-my-vlogs, Wix element ID: myVlogsList
 *
 * Data contract (same pattern as travel-vlog-list.js, matches
 * masterPage.js's universal send() helper):
 *
 *   - masterPage.setupMyVlogsList() sets attribute `data-my-vlogs` on
 *     this element to JSON.stringify(items), AND calls
 *     el.postMessage({ type: 'MY_VLOGS_UPDATE', payload: items }).
 *
 * Each item:
 * {
 *   title, slug, contentType ("video"|"gallery"),
 *   coverImage (resolved static.wixstatic.com URL or null),
 *   destinationName, status ("Pending"|"Approved"|"Rejected"),
 *   moderatorNote (only meaningful when status is "Rejected"),
 *   submissionDate, link (null unless status is "Approved")
 * }
 *
 * Unlike travel-vlog-list.js, cards here are NOT filterable/searchable
 * — this is a personal dashboard, not a public browse page. A card is
 * a link only when status is "Approved" (the /vlogs/{slug} page won't
 * exist publicly otherwise); Pending/Rejected cards render as static
 * (non-clickable) cards with their status and, for Rejected, the
 * moderator's note.
 *
 * NOTE: written without direct access to travel-vlog-moderation.js
 * (the moderation panel's own custom element) — the status label
 * colors/wording here are a reasonable default and can be aligned to
 * whatever that panel already uses.
 */

class TravelMyVlogs extends HTMLElement {
  static get observedAttributes() {
    return ['data-my-vlogs'];
  }

  constructor() {
    super();
    this._vlogs = [];
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();

    window.addEventListener('message', this._onWindowMessage);

    const existing = this.getAttribute('data-my-vlogs');
    if (existing) {
      this._applyVlogsJson(existing);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onWindowMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-my-vlogs' && newValue && newValue !== oldValue) {
      this._applyVlogsJson(newValue);
    }
  }

  _onWindowMessage = (event) => {
    const data = event.data;
    if (data && data.type === 'MY_VLOGS_UPDATE' && Array.isArray(data.payload)) {
      this._vlogs = data.payload;
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
    this._render();
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

  _statusMeta(status) {
    switch (status) {
      case 'Approved':
        return { label: 'Approved', className: 'status-approved' };
      case 'Rejected':
        return { label: 'Rejected', className: 'status-rejected' };
      default:
        return { label: 'Pending review', className: 'status-pending' };
    }
  }

  _formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  }

  _cardMarkup(vlog) {
    const badge = vlog.contentType === 'gallery' ? 'Gallery' : 'Video';
    const cover = vlog.coverImage || '';
    const { label, className } = this._statusMeta(vlog.status);
    const isClickable = vlog.status === 'Approved' && vlog.link;

    const inner = `
      <div class="my-vlog-card__cover">
        ${cover ? `<img src="${cover}" alt="${this._escape(vlog.title)}" loading="lazy" />` : ''}
        <span class="my-vlog-card__badge">${badge}</span>
        <span class="my-vlog-card__status ${className}">${label}</span>
      </div>
      <div class="my-vlog-card__body">
        <span class="my-vlog-card__destination">${this._escape(vlog.destinationName || '')}</span>
        <h3 class="my-vlog-card__title">${this._escape(vlog.title)}</h3>
        <span class="my-vlog-card__date">${this._escape(this._formatDate(vlog.submissionDate))}</span>
        ${
          vlog.status === 'Rejected' && vlog.moderatorNote
            ? `<p class="my-vlog-card__note">${this._escape(vlog.moderatorNote)}</p>`
            : ''
        }
      </div>
    `;

    return isClickable
      ? `<a class="my-vlog-card" href="${vlog.link}">${inner}</a>`
      : `<div class="my-vlog-card my-vlog-card--static">${inner}</div>`;
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--wix-body-font, inherit);
          color: var(--wix-text-color, #1a1a1a);
        }
        .my-vlog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }
        .my-vlog-card {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        a.my-vlog-card:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .my-vlog-card--static {
          opacity: 0.85;
        }
        .my-vlog-card__cover {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #eee;
        }
        .my-vlog-card__cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .my-vlog-card__badge {
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
        .my-vlog-card__status {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .status-pending {
          background: #fff3cd;
          color: #7a5b00;
        }
        .status-approved {
          background: #d4edda;
          color: #155724;
        }
        .status-rejected {
          background: #f8d7da;
          color: #721c24;
        }
        .my-vlog-card__body {
          padding: 14px 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .my-vlog-card__destination {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #888;
        }
        .my-vlog-card__title {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.3;
        }
        .my-vlog-card__date {
          font-size: 13px;
          color: #666;
        }
        .my-vlog-card__note {
          margin: 6px 0 0;
          font-size: 13px;
          color: #721c24;
          background: #f8d7da;
          padding: 8px 10px;
          border-radius: 6px;
        }
        .my-vlog-empty {
          padding: 40px 0;
          text-align: center;
          color: #888;
        }
      </style>

      ${
        this._vlogs.length === 0
          ? `<div class="my-vlog-empty">You haven't submitted any vlogs yet.</div>`
          : `<div class="my-vlog-grid">${this._vlogs.map((v) => this._cardMarkup(v)).join('')}</div>`
      }
    `;
  }
}

customElements.define('travel-my-vlogs', TravelMyVlogs);
