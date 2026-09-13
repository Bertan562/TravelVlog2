// travel-profile.js
// TravelVlog — My Profile page
// Basic member info + own vlog submission stats.
// Wix element ID: profileBody
// Data contract: attribute `data-profile` (JSON) AND postMessage type
// 'PROFILE_UPDATE', matching masterPage.js's universal send() helper.

class TravelProfile extends HTMLElement {

  static get observedAttributes() {
    return ['data-profile'];
  }

  constructor() {
    super();
    this._data = null;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();

    window.addEventListener('message', this._onWindowMessage);

    const existing = this.getAttribute('data-profile');
    if (existing) {
      this._applyJson(existing);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onWindowMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-profile' && newValue && newValue !== oldValue) {
      this._applyJson(newValue);
    }
  }

  _onWindowMessage = (event) => {
    const data = event.data;
    if (data && data.type === 'PROFILE_UPDATE') {
      this._data = data.payload;
      this._render();
    }
  };

  _applyJson(json) {
    try {
      this._data = JSON.parse(json);
    } catch (e) {
      this._data = null;
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

  _render() {
    const d = this._data;

    if (!d) {
      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <div class="wrap"><div class="loading">Loading profile…</div></div>
      `;
      return;
    }

    if (!d.loggedIn) {
      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <div class="wrap">
          <div class="signed-out">
            <h2>You're not logged in</h2>
            <p>Log in to see your profile and your submitted vlogs.</p>
          </div>
        </div>
      `;
      return;
    }

    const avatar = d.avatarUrl
      ? `<img class="avatar" src="${this._escape(d.avatarUrl)}" alt="${this._escape(d.name)}" />`
      : `<div class="avatar avatar--placeholder">${this._escape((d.name || '?').charAt(0).toUpperCase())}</div>`;

    const instagram = d.instagramHandle
      ? `<a class="instagram" href="https://instagram.com/${this._escape(d.instagramHandle)}" target="_blank" rel="noopener">@${this._escape(d.instagramHandle)}</a>`
      : `<span class="instagram instagram--empty">Not shared yet</span>`;

    const stats = d.stats || { total: 0, pending: 0, approved: 0, rejected: 0 };

    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <div class="wrap">

        <div class="header">
          ${avatar}
          <div class="header-text">
            <h1 class="name">${this._escape(d.name) || 'Traveller'}</h1>
            <div class="email">${this._escape(d.email)}</div>
            <div class="instagram-row">
              <span class="label">Instagram:</span> ${instagram}
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat">
            <div class="stat-num">${stats.total}</div>
            <div class="stat-label">Total vlogs</div>
          </div>
          <div class="stat">
            <div class="stat-num">${stats.approved}</div>
            <div class="stat-label">Approved</div>
          </div>
          <div class="stat">
            <div class="stat-num">${stats.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat">
            <div class="stat-num">${stats.rejected}</div>
            <div class="stat-label">Rejected</div>
          </div>
        </div>

        <a class="my-vlogs-link" href="${this._escape(d.myVlogsUrl || '/my-vlogs')}">View my vlogs →</a>

      </div>
    `;
  }

  _css() {
    return `
      :host { display: block; font-family: var(--wix-body-font, Inter, sans-serif); color: #1a1a1a; }
      .wrap { max-width: 760px; margin: 0 auto; padding: 8px 0 48px; }
      .loading, .signed-out { padding: 60px 20px; text-align: center; color: #888; }
      .signed-out h2 { margin: 0 0 8px; font-size: 22px; color: #1a1a1a; }

      .header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
      .avatar { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
      .avatar--placeholder {
        display: flex; align-items: center; justify-content: center;
        background: #1a1a1a; color: #fff; font-size: 32px; font-weight: 700;
      }
      .header-text { min-width: 0; }
      .name { margin: 0 0 4px; font-size: 26px; font-weight: 700; }
      .email { font-size: 14px; color: #666; margin-bottom: 6px; }
      .instagram-row { font-size: 14px; }
      .instagram-row .label { color: #888; margin-right: 4px; }
      .instagram { color: #1a1a1a; text-decoration: none; font-weight: 600; }
      .instagram--empty { color: #999; font-weight: 400; }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 28px;
      }
      .stat {
        background: #f7f7f5; border-radius: 10px; padding: 18px 8px;
        text-align: center;
      }
      .stat-num { font-size: 26px; font-weight: 700; }
      .stat-label { font-size: 12px; color: #777; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em; }

      .my-vlogs-link {
        display: inline-block; font-size: 14px; font-weight: 600;
        color: #1a1a1a; text-decoration: none; border-bottom: 1px solid #1a1a1a;
        padding-bottom: 2px;
      }

      @media (max-width: 520px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .header { flex-direction: column; align-items: flex-start; text-align: left; }
      }
    `;
  }
}

customElements.define('travel-profile', TravelProfile);
