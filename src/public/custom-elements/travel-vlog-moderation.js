class TravelVlogModeration extends HTMLElement {
  static get observedAttributes() {
    return ['data-response', 'data-access'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || newVal === oldVal) return;
    if (!this._built) {
      (this._pending = this._pending || {})[name] = newVal;
      return;
    }
    this._handleAttribute(name, newVal);
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    this._items = [];
    this._filter = 'Pending';
    this._pendingRequests = new Map();
    this._requestSeq = 0;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = this._template();
    this._root = root;
    this._cacheEls();
    this._wire();

    if (this._pending) {
      Object.keys(this._pending).forEach((k) => this._handleAttribute(k, this._pending[k]));
      this._pending = null;
    }
  }

  // ================================================================
  _template() {
    return `
<style>
  :host { display: block; }
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .wrap { font-family: 'Inter', system-ui, sans-serif; width: 100%; max-width: 1040px; margin: 0 auto; color: #141414; padding: 8px 0 56px; }

  h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 4px; }
  .sub { font-size: 14.5px; opacity: 0.55; margin: 0 0 26px; }

  .bar { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .bar .tab {
    font-family: inherit; font-size: 13.5px; font-weight: 600;
    background: rgba(20,20,20,0.05); color: #141414; border: 0;
    border-radius: 999px; padding: 9px 16px; cursor: pointer;
  }
  .bar .tab.active { background: #141414; color: #fff; }
  .bar .spacer { flex: 1 1 auto; }
  .bar .count { font-size: 13px; opacity: 0.55; }
  .bar .refresh {
    font-family: inherit; font-size: 13px; font-weight: 600;
    background: transparent; border: 1px solid rgba(20,20,20,0.22);
    border-radius: 8px; padding: 8px 14px; cursor: pointer; color: #141414;
  }

  .empty, .denied, .loading {
    background: #f4f3ef; border-radius: 12px; padding: 40px 24px;
    text-align: center; font-size: 14.5px; opacity: 0.65;
  }
  .denied { color: #b3261e; opacity: 1; font-weight: 600; }
  .hidden { display: none; }

  .card {
    display: flex; gap: 18px; background: #fff;
    border: 1px solid rgba(20,20,20,0.12); border-radius: 14px;
    padding: 16px; margin-bottom: 14px;
  }
  .card .cover {
    width: 190px; height: 124px; flex-shrink: 0; border-radius: 10px;
    background: #f4f3ef center/cover no-repeat; position: relative; overflow: hidden;
  }
  .card .cover .badge {
    position: absolute; left: 8px; bottom: 8px;
    background: rgba(20,20,20,0.78); color: #fff;
    font-size: 10.5px; font-weight: 600; padding: 3px 7px; border-radius: 5px;
  }
  .card .body { flex: 1 1 auto; min-width: 0; }

  .ttl { font-size: 16.5px; font-weight: 700; line-height: 1.3; margin-bottom: 4px; word-break: break-word; }
  .meta { font-size: 12.5px; opacity: 0.55; margin-bottom: 10px; }
  .meta b { font-weight: 600; opacity: 1; }

  .rows { font-size: 13px; line-height: 1.6; margin-bottom: 10px; }
  .rows .r { display: flex; gap: 8px; }
  .rows .k { flex: 0 0 104px; opacity: 0.5; }
  .rows .v { flex: 1 1 auto; min-width: 0; word-break: break-word; }
  .rows a { color: #141414; }

  .desc {
    font-size: 13px; line-height: 1.55; opacity: 0.78;
    background: #f8f8f6; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;
    max-height: 96px; overflow: auto; white-space: pre-wrap;
  }

  .flag {
    display: inline-block; font-size: 12px; font-weight: 600; color: #8a5a00;
    background: #fff5e0; border-radius: 6px; padding: 5px 10px; margin-bottom: 10px;
  }

  .gal { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .gal img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; }

  .acts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .acts button {
    font-family: inherit; font-size: 13px; font-weight: 600;
    border-radius: 8px; padding: 9px 16px; cursor: pointer; border: 0;
  }
  .acts .approve { background: #1e7b3c; color: #fff; }
  .acts .reject { background: #b3261e; color: #fff; }
  .acts .link {
    background: transparent; color: #141414;
    border: 1px solid rgba(20,20,20,0.22); text-decoration: none;
    display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
  }
  .acts button:disabled { opacity: 0.4; cursor: not-allowed; }
  .acts .note {
    font-family: inherit; font-size: 13px; padding: 9px 12px;
    border: 1px solid rgba(20,20,20,0.16); border-radius: 8px;
    flex: 1 1 180px; min-width: 140px; outline: none;
  }
  .acts .note:focus { border-color: #141414; }

  .card-status { font-size: 12.5px; margin-top: 8px; display: none; }
  .card-status.on { display: block; }
  .card-status.err { color: #b3261e; }
  .card-status.ok { color: #1e7b3c; }
</style>

<div class="wrap">
  <h1>Vlog Moderation</h1>
  <p class="sub">Review community submissions before they go live.</p>

  <div id="denied" class="denied hidden">You don't have permission to view this page.</div>

  <div id="panel" class="hidden">
    <div class="bar">
      <button class="tab active" data-filter="Pending" type="button">Pending</button>
      <button class="tab" data-filter="Approved" type="button">Approved</button>
      <button class="tab" data-filter="Rejected" type="button">Rejected</button>
      <span class="spacer"></span>
      <span class="count" id="countText"></span>
      <button class="refresh" id="refreshBtn" type="button">Refresh</button>
    </div>

    <div id="loading" class="loading">Loading submissions…</div>
    <div id="empty" class="empty hidden">Nothing here.</div>
    <div id="list"></div>
  </div>
</div>`;
  }

  _cacheEls() {
    const r = this._root;
    this.el = {
      denied: r.getElementById('denied'),
      panel: r.getElementById('panel'),
      loading: r.getElementById('loading'),
      empty: r.getElementById('empty'),
      list: r.getElementById('list'),
      countText: r.getElementById('countText'),
      refreshBtn: r.getElementById('refreshBtn'),
      tabs: r.querySelectorAll('.tab')
    };
  }

  _wire() {
    this.el.tabs.forEach((t) => {
      t.addEventListener('click', () => {
        this._filter = t.getAttribute('data-filter');
        this.el.tabs.forEach((x) => x.classList.toggle('active', x === t));
        this._load();
      });
    });
    this.el.refreshBtn.addEventListener('click', () => this._load());
  }

  // ================================================================
  // Bridge
  // ================================================================
  _ask(action, payload) {
    const requestId = `r${++this._requestSeq}`;
    return new Promise((resolve, reject) => {
      this._pendingRequests.set(requestId, { resolve, reject });
      this.dispatchEvent(new CustomEvent('moderationRequest', { detail: { requestId, action, payload } }));
      setTimeout(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          reject(new Error('timeout'));
        }
      }, 30000);
    });
  }

  _handleAttribute(name, value) {
    if (name === 'data-response') {
      let parsed;
      try { parsed = JSON.parse(value); } catch (err) { return; }
      const pending = this._pendingRequests.get(parsed.requestId);
      if (!pending) return;
      this._pendingRequests.delete(parsed.requestId);
      if (parsed.error) pending.reject(new Error(parsed.error));
      else pending.resolve(parsed.result);
      return;
    }

    if (name === 'data-access') {
      let access;
      try { access = JSON.parse(value); } catch (err) { return; }
      if (access && access.isAdmin) {
        this.el.denied.classList.add('hidden');
        this.el.panel.classList.remove('hidden');
        this._load();
      } else {
        this.el.panel.classList.add('hidden');
        this.el.denied.classList.remove('hidden');
      }
    }
  }

  // ================================================================
  async _load() {
    this.el.loading.classList.remove('hidden');
    this.el.empty.classList.add('hidden');
    this.el.list.innerHTML = '';

    try {
      this._items = await this._ask('getVlogs', { status: this._filter });
    } catch (err) {
      console.error('Could not load submissions', err);
      this._items = [];
    }

    this.el.loading.classList.add('hidden');
    this.el.countText.textContent = this._items.length === 1
      ? '1 submission'
      : `${this._items.length} submissions`;

    if (this._items.length === 0) {
      this.el.empty.textContent = this._filter === 'Pending'
        ? 'No vlogs waiting for review.'
        : `No ${this._filter.toLowerCase()} vlogs.`;
      this.el.empty.classList.remove('hidden');
      return;
    }

    this._items.forEach((item) => this.el.list.appendChild(this._card(item)));
  }

  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _card(item) {
    const isGallery = item.contentType === 'gallery';
    const flagged = (item.moderatorNote || '').indexOf('channel name mismatch') !== -1;
    const submitted = item.submissionDate
      ? new Date(item.submissionDate).toLocaleDateString('en-GB')
      : '—';

    const card = document.createElement('div');
    card.className = 'card';

    const galleryStrip = isGallery && Array.isArray(item.galleryImages) && item.galleryImages.length
      ? `<div class="gal">${item.galleryImages.slice(0, 8).map((u) => `<img src="${this._esc(u)}" alt="">`).join('')}</div>`
      : '';

    const instagram = item.instagramHandle
      ? `<div class="r"><span class="k">Instagram</span><span class="v"><a href="https://instagram.com/${this._esc(item.instagramHandle)}" target="_blank" rel="noopener">@${this._esc(item.instagramHandle)}</a></span></div>`
      : '';

    const sourceRow = isGallery
      ? `<div class="r"><span class="k">Photos</span><span class="v">${item.galleryImageCount || 0} uploaded</span></div>`
      : `<div class="r"><span class="k">Video</span><span class="v"><a href="${this._esc(item.videoUrl)}" target="_blank" rel="noopener">${this._esc(item.videoUrl)}</a></span></div>
         <div class="r"><span class="k">Channel</span><span class="v">${this._esc(item.channelName) || '—'}</span></div>`;

    card.innerHTML = `
      <div class="cover" style="background-image:url('${this._esc(item.coverImage)}')">
        <span class="badge">${isGallery ? 'Gallery' : 'Video'}</span>
      </div>
      <div class="body">
        <div class="ttl">${this._esc(item.title) || '(untitled)'}</div>
        <div class="meta">Submitted ${submitted} · trust level: <b>${this._esc(item.trustLevelAtSubmission) || 'new'}</b> · agreement v${this._esc(item.agreementVersion) || '—'}</div>
        ${flagged ? '<div class="flag">Channel name doesn\'t match the member\'s profile — check ownership.</div>' : ''}
        <div class="rows">
          ${sourceRow}
          <div class="r"><span class="k">Destination</span><span class="v">${this._esc(item.destinationName) || '—'}</span></div>
          ${item.experienceName ? `<div class="r"><span class="k">Experience</span><span class="v">${this._esc(item.experienceName)}</span></div>` : ''}
          ${instagram}
        </div>
        ${item.description ? `<div class="desc">${this._esc(item.description)}</div>` : ''}
        ${galleryStrip}
        <div class="acts">
          <button class="approve" type="button">Approve</button>
          <button class="reject" type="button">Reject</button>
          <input class="note" type="text" placeholder="Reason (shown to the author on reject)">
          ${item.coverImage ? `<a class="link" target="_blank" rel="noopener" href="https://lens.google.com/uploadbyurl?url=${encodeURIComponent(item.coverImage)}">Reverse search</a>` : ''}
        </div>
        <div class="card-status"></div>
      </div>`;

    const approveBtn = card.querySelector('.approve');
    const rejectBtn = card.querySelector('.reject');
    const note = card.querySelector('.note');
    const status = card.querySelector('.card-status');

    const act = async (action, requireNote) => {
      const reason = note.value.trim();
      if (requireNote && !reason) {
        status.textContent = 'Please give a reason before rejecting.';
        status.className = 'card-status on err';
        note.focus();
        return;
      }

      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      status.textContent = action === 'approveVlog' ? 'Approving…' : 'Rejecting…';
      status.className = 'card-status on';

      try {
        await this._ask(action, { vlogId: item._id, note: reason });
        card.style.opacity = '0.45';
        status.textContent = action === 'approveVlog' ? 'Approved.' : 'Rejected.';
        status.className = 'card-status on ok';
        setTimeout(() => this._load(), 700);
      } catch (err) {
        console.error(err);
        status.textContent = err.message === 'not_authorized'
          ? 'You are not authorised to do this.'
          : 'Something went wrong. Please try again.';
        status.className = 'card-status on err';
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    };

    approveBtn.addEventListener('click', () => act('approveVlog', false));
    rejectBtn.addEventListener('click', () => act('rejectVlog', true));

    // Approved / rejected views are read-only.
    if (this._filter !== 'Pending') {
      approveBtn.style.display = 'none';
      rejectBtn.style.display = 'none';
      note.style.display = 'none';
    }

    return card;
  }
}

customElements.define('travel-vlog-moderation', TravelVlogModeration);
