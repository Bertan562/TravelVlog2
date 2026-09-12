class TravelVlogDetail extends HTMLElement {
  static get observedAttributes() {
    return ['data-vlog', 'data-response'];
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

    this._vlog = null;
    this._galleryIndex = 0;
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

  .wrap {
    font-family: 'Inter', system-ui, sans-serif;
    width: 100%; max-width: 900px; margin: 0 auto;
    color: #141414; padding: 8px 0 72px;
  }

  .loading, .missing {
    background: #f4f3ef; border-radius: 12px; padding: 56px 24px;
    text-align: center; font-size: 15px; opacity: 0.6;
  }
  .hidden { display: none; }

  /* ---- breadcrumb ---- */
  .crumb { font-size: 12.5px; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; opacity: 0.5; margin-bottom: 10px; }
  .crumb a { color: #141414; text-decoration: none; }
  .crumb a:hover { opacity: 0.6; }
  .crumb span { margin: 0 7px; opacity: 0.4; }

  h1 { font-size: 38px; font-weight: 700; letter-spacing: -0.8px; line-height: 1.15; margin: 0 0 14px; }

  /* ---- byline ---- */
  .byline { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
  .avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: #141414; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }
  .byline .who { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .byline .when { font-size: 12.5px; opacity: 0.5; }
  .ig {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: #141414;
    text-decoration: none; border: 1px solid rgba(20,20,20,0.2);
    border-radius: 999px; padding: 7px 14px; margin-left: auto;
  }
  .ig:hover { background: #f4f3ef; }
  .ig svg { width: 15px; height: 15px; }

  /* ---- video ---- */
  .player { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #141414; border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
  .player iframe { width: 100%; height: 100%; border: 0; display: block; }

  /* ---- gallery ---- */
  .gal { margin-bottom: 28px; }
  .gal-main {
    position: relative; width: 100%; aspect-ratio: 3 / 2;
    background: #f4f3ef center/cover no-repeat;
    border-radius: 14px; overflow: hidden; cursor: zoom-in;
  }
  .gal-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,0.92); border: 0; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: #141414; box-shadow: 0 2px 10px rgba(20,20,20,0.2);
  }
  .gal-nav.prev { left: 12px; }
  .gal-nav.next { right: 12px; }
  .gal-count {
    position: absolute; right: 12px; bottom: 12px;
    background: rgba(20,20,20,0.75); color: #fff;
    font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
  }
  .gal-strip { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px; }
  .gal-strip img {
    width: 76px; height: 56px; object-fit: cover; border-radius: 7px;
    cursor: pointer; flex-shrink: 0; opacity: 0.55; transition: opacity 0.15s ease;
  }
  .gal-strip img.on { opacity: 1; outline: 2px solid #141414; outline-offset: -2px; }

  /* ---- lightbox ---- */
  .lb {
    position: fixed; inset: 0; background: rgba(20,20,20,0.92);
    display: none; align-items: center; justify-content: center; z-index: 10060;
  }
  .lb.on { display: flex; }
  .lb img { max-width: 92vw; max-height: 88vh; border-radius: 8px; }
  .lb .x {
    position: absolute; top: 20px; right: 24px;
    background: none; border: 0; color: #fff; font-size: 30px; cursor: pointer; line-height: 1;
  }

  /* ---- body ---- */
  .desc { font-size: 16px; line-height: 1.7; white-space: pre-wrap; margin-bottom: 34px; }

  .links { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 34px; }
  .linkcard {
    flex: 1 1 260px; background: #f4f3ef; border-radius: 12px;
    padding: 18px 20px; text-decoration: none; color: #141414;
    display: block; transition: background 0.15s ease;
  }
  .linkcard:hover { background: #edece7; }
  .linkcard .k { font-size: 11.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.45; margin-bottom: 5px; }
  .linkcard .v { font-size: 17px; font-weight: 700; line-height: 1.25; }
  .linkcard .go { font-size: 13px; font-weight: 600; margin-top: 8px; opacity: 0.65; }

  .foot { border-top: 1px solid rgba(20,20,20,0.1); padding-top: 18px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .report {
    font-family: inherit; background: none; border: 0; padding: 0;
    font-size: 13px; color: #141414; opacity: 0.5; cursor: pointer; text-decoration: underline;
  }
  .report:hover { opacity: 0.85; }
  .report:disabled { cursor: default; text-decoration: none; }
  .foot .note { font-size: 12.5px; opacity: 0.45; }

  /* ---- comments ---- */
  .comments { margin-top: 40px; border-top: 1px solid rgba(20,20,20,0.1); padding-top: 28px; }
  .comments h2 { font-size: 20px; font-weight: 700; margin: 0 0 20px; }

  .comment-list { display: flex; flex-direction: column; gap: 18px; margin-bottom: 26px; }
  .comment-empty { font-size: 14px; opacity: 0.5; margin-bottom: 26px; }
  .comment { display: flex; gap: 12px; }
  .c-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: #f4f3ef; color: #141414;
    display: flex; align-items: center; justify-content: center;
    font-size: 12.5px; font-weight: 700;
  }
  .c-body { flex: 1; min-width: 0; }
  .c-top { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
  .c-author { font-size: 13.5px; font-weight: 600; }
  .c-date { font-size: 12px; opacity: 0.45; }
  .c-text { font-size: 14.5px; line-height: 1.55; white-space: pre-wrap; }

  .comment-form textarea {
    width: 100%; min-height: 80px; resize: vertical;
    font-family: inherit; font-size: 14.5px; line-height: 1.5;
    border: 1px solid rgba(20,20,20,0.18); border-radius: 10px;
    padding: 12px 14px; margin-bottom: 10px;
  }
  .comment-form textarea:focus { outline: none; border-color: #141414; }
  .comment-form-row { display: flex; align-items: center; gap: 14px; }
  .comment-submit {
    font-family: inherit; font-size: 14px; font-weight: 600;
    background: #141414; color: #fff; border: 0; border-radius: 999px;
    padding: 10px 20px; cursor: pointer;
  }
  .comment-submit:disabled { opacity: 0.5; cursor: default; }
  .comment-status { font-size: 12.5px; opacity: 0.55; }
  .comment-status.err { color: #b3261e; opacity: 1; }

  .comment-login {
    background: #f4f3ef; border-radius: 12px; padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 14px; flex-wrap: wrap;
  }
  .comment-login p { margin: 0; font-size: 14px; }
  .comment-login-btn {
    font-family: inherit; font-size: 13.5px; font-weight: 600;
    background: #141414; color: #fff; border: 0; border-radius: 999px;
    padding: 9px 18px; cursor: pointer; flex-shrink: 0;
  }
</style>

<div class="wrap">
  <div id="loading" class="loading">Loading…</div>
  <div id="missing" class="missing hidden">This vlog isn't available.</div>

  <div id="body" class="hidden">
    <div class="crumb" id="crumb"></div>
    <h1 id="title"></h1>

    <div class="byline">
      <div class="avatar" id="avatar"></div>
      <div>
        <div class="who" id="author"></div>
        <div class="when" id="published"></div>
      </div>
      <a class="ig hidden" id="igLink" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1961" style="display:none"/><circle cx="17.5" cy="6.5" r="1"/></svg>
        <span id="igHandle"></span>
      </a>
    </div>

    <div class="player hidden" id="player"></div>

    <div class="gal hidden" id="gallery">
      <div class="gal-main" id="galMain">
        <button class="gal-nav prev" id="galPrev" type="button" aria-label="previous">&#10094;</button>
        <button class="gal-nav next" id="galNext" type="button" aria-label="next">&#10095;</button>
        <span class="gal-count" id="galCount"></span>
      </div>
      <div class="gal-strip" id="galStrip"></div>
    </div>

    <div class="desc" id="desc"></div>

    <div class="links" id="links"></div>

    <div class="foot">
      <button class="report" id="reportBtn" type="button">Report this vlog</button>
      <span class="note" id="reportNote"></span>
    </div>

    <div class="comments" id="comments">
      <h2 id="commentsHeading">Comments</h2>

      <div class="comment-empty hidden" id="commentEmpty">Be the first to comment.</div>
      <div class="comment-list" id="commentList"></div>

      <div class="comment-form hidden" id="commentForm">
        <textarea id="commentInput" maxlength="1000" placeholder="Share a tip, a question, or your own experience…"></textarea>
        <div class="comment-form-row">
          <button class="comment-submit" id="commentSubmit" type="button">Post comment</button>
          <span class="comment-status" id="commentStatus"></span>
        </div>
      </div>

      <div class="comment-login hidden" id="commentLogin">
        <p>Log in to join the conversation.</p>
        <button class="comment-login-btn" id="commentLoginBtn" type="button">Log In</button>
      </div>
    </div>
  </div>
</div>

<div class="lb" id="lightbox">
  <button class="x" id="lbClose" type="button" aria-label="close">&times;</button>
  <img id="lbImg" alt="">
</div>`;
  }

  _cacheEls() {
    const id = (x) => this._root.getElementById(x);
    this.el = {
      loading: id('loading'), missing: id('missing'), body: id('body'),
      crumb: id('crumb'), title: id('title'),
      avatar: id('avatar'), author: id('author'), published: id('published'),
      igLink: id('igLink'), igHandle: id('igHandle'),
      player: id('player'),
      gallery: id('gallery'), galMain: id('galMain'), galPrev: id('galPrev'),
      galNext: id('galNext'), galCount: id('galCount'), galStrip: id('galStrip'),
      desc: id('desc'), links: id('links'),
      reportBtn: id('reportBtn'), reportNote: id('reportNote'),
      lightbox: id('lightbox'), lbImg: id('lbImg'), lbClose: id('lbClose'),
      commentEmpty: id('commentEmpty'), commentList: id('commentList'),
      commentForm: id('commentForm'), commentInput: id('commentInput'),
      commentSubmit: id('commentSubmit'), commentStatus: id('commentStatus'),
      commentLogin: id('commentLogin'), commentLoginBtn: id('commentLoginBtn')
    };
  }

  _wire() {
    const e = this.el;
    e.galPrev.addEventListener('click', (ev) => { ev.stopPropagation(); this._step(-1); });
    e.galNext.addEventListener('click', (ev) => { ev.stopPropagation(); this._step(1); });
    e.galMain.addEventListener('click', () => this._openLightbox());
    e.lbClose.addEventListener('click', () => e.lightbox.classList.remove('on'));
    e.lightbox.addEventListener('click', (ev) => {
      if (ev.target === e.lightbox) e.lightbox.classList.remove('on');
    });
    e.reportBtn.addEventListener('click', () => this._report());
    e.commentSubmit.addEventListener('click', () => this._submitComment());
    e.commentLoginBtn.addEventListener('click', () => this._requestLogin());
  }

  // ================================================================
  _ask(action, payload) {
    const requestId = `r${++this._requestSeq}`;
    return new Promise((resolve, reject) => {
      this._pendingRequests.set(requestId, { resolve, reject });
      this.dispatchEvent(new CustomEvent('vlogDetailRequest', { detail: { requestId, action, payload } }));
      setTimeout(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          reject(new Error('timeout'));
        }
      }, 20000);
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

    if (name === 'data-vlog') {
      let vlog;
      try { vlog = JSON.parse(value); } catch (err) { return; }
      this._render(vlog);
    }
  }

  // ================================================================
  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Turns a YouTube or Vimeo watch URL into its embeddable form.
   * Returns null when the URL isn't recognised, so the player can be
   * hidden rather than showing a broken frame.
   */
  _embedUrl(url, platform) {
    if (!url) return null;

    if (platform === 'youtube' || /youtube\.com|youtu\.be/.test(url)) {
      let id = '';
      const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
      const long = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
      const embed = url.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
      if (short) id = short[1];
      else if (long) id = long[1];
      else if (embed) id = embed[1];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }

    if (platform === 'vimeo' || /vimeo\.com/.test(url)) {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}` : null;
    }

    return null;
  }

  _render(vlog) {
    const e = this.el;
    e.loading.classList.add('hidden');

    if (!vlog || !vlog.title) {
      e.missing.classList.remove('hidden');
      return;
    }

    this._vlog = vlog;
    e.body.classList.remove('hidden');

    // ---- breadcrumb ----
    const crumbs = [];
    if (vlog.vlogsListUrl) crumbs.push(`<a href="${this._esc(vlog.vlogsListUrl)}">Vlogs</a>`);
    if (vlog.destinationName) crumbs.push(this._esc(vlog.destinationName));
    e.crumb.innerHTML = crumbs.join('<span>·</span>');

    e.title.textContent = vlog.title;

    // ---- byline ----
    const author = vlog.authorName || 'Traveller';
    e.author.textContent = author;
    e.avatar.textContent = author.trim().charAt(0).toUpperCase() || '?';
    e.published.textContent = vlog.publishedDate
      ? new Date(vlog.publishedDate).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      : '';

    if (vlog.instagramHandle) {
      e.igLink.href = `https://instagram.com/${vlog.instagramHandle}`;
      e.igHandle.textContent = `@${vlog.instagramHandle}`;
      e.igLink.classList.remove('hidden');
    }

    // ---- media ----
    if (vlog.contentType === 'gallery') {
      this._renderGallery(vlog.galleryImages || []);
    } else {
      const src = this._embedUrl(vlog.videoUrl, vlog.videoPlatform);
      if (src) {
        e.player.innerHTML =
          `<iframe src="${this._esc(src)}" title="${this._esc(vlog.title)}" allowfullscreen ` +
          `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        e.player.classList.remove('hidden');
      }
    }

    // ---- description ----
    if (vlog.description) e.desc.textContent = vlog.description;
    else e.desc.classList.add('hidden');

    // ---- related links ----
    const cards = [];
    if (vlog.destinationName) {
      const href = vlog.destinationUrl || '';
      cards.push(
        `<a class="linkcard" ${href ? `href="${this._esc(href)}"` : ''}>` +
        `<div class="k">Destination</div>` +
        `<div class="v">${this._esc(vlog.destinationName)}</div>` +
        (href ? `<div class="go">Explore destination &rarr;</div>` : '') +
        `</a>`
      );
    }
    if (vlog.experienceName) {
      const href = vlog.experienceUrl || '';
      cards.push(
        `<a class="linkcard" ${href ? `href="${this._esc(href)}"` : ''}>` +
        `<div class="k">Experience</div>` +
        `<div class="v">${this._esc(vlog.experienceName)}</div>` +
        (href ? `<div class="go">Explore experience &rarr;</div>` : '') +
        `</a>`
      );
    }
    e.links.innerHTML = cards.join('');

    // ---- comments ----
    this._isMemberLoggedIn = !!vlog.isMemberLoggedIn;
    this._renderComments(vlog.comments || []);
  }

  // ---- gallery helpers ----
  _renderGallery(images) {
    if (!images.length) return;
    this._images = images;
    this._galleryIndex = 0;
    this.el.gallery.classList.remove('hidden');

    this.el.galStrip.innerHTML = images
      .map((u, i) => `<img src="${this._esc(u)}" data-i="${i}" class="${i === 0 ? 'on' : ''}" alt="">`)
      .join('');

    this.el.galStrip.querySelectorAll('img').forEach((img) => {
      img.addEventListener('click', () => this._show(Number(img.getAttribute('data-i'))));
    });

    if (images.length < 2) {
      this.el.galPrev.style.display = 'none';
      this.el.galNext.style.display = 'none';
    }

    this._show(0);
  }

  _show(i) {
    const images = this._images || [];
    if (!images.length) return;
    this._galleryIndex = (i + images.length) % images.length;

    this.el.galMain.style.backgroundImage = `url('${images[this._galleryIndex]}')`;
    this.el.galCount.textContent = `${this._galleryIndex + 1} / ${images.length}`;

    this.el.galStrip.querySelectorAll('img').forEach((img, idx) => {
      img.classList.toggle('on', idx === this._galleryIndex);
    });
  }

  _step(delta) {
    this._show(this._galleryIndex + delta);
  }

  _openLightbox() {
    const images = this._images || [];
    if (!images.length) return;
    this.el.lbImg.src = images[this._galleryIndex];
    this.el.lightbox.classList.add('on');
  }

  // ---- report ----
  async _report() {
    if (!this._vlog) return;

    const ok = window.confirm(
      'Report this vlog for review? Use this if the content is stolen, misleading or inappropriate.'
    );
    if (!ok) return;

    this.el.reportBtn.disabled = true;
    this.el.reportNote.textContent = 'Sending…';

    try {
      await this._ask('reportVlog', { vlogId: this._vlog._id });
      this.el.reportBtn.textContent = 'Reported';
      this.el.reportNote.textContent = 'Thanks — a moderator will take a look.';
    } catch (err) {
      console.error('Report failed', err);
      this.el.reportBtn.disabled = false;
      this.el.reportNote.textContent = 'Could not send the report. Please try again.';
    }
  }

  // ---- comments ----
  _renderComments(comments) {
    const e = this.el;

    e.commentList.innerHTML = comments
      .map((c) => {
        const author = c.author || 'Traveller';
        const date = c.date
          ? new Date(c.date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })
          : '';
        return `
          <div class="comment">
            <div class="c-avatar">${this._esc(author.trim().charAt(0).toUpperCase() || '?')}</div>
            <div class="c-body">
              <div class="c-top">
                <span class="c-author">${this._esc(author)}</span>
                <span class="c-date">${this._esc(date)}</span>
              </div>
              <div class="c-text">${this._esc(c.comment)}</div>
            </div>
          </div>`;
      })
      .join('');

    e.commentEmpty.classList.toggle('hidden', comments.length > 0);

    if (this._isMemberLoggedIn) {
      e.commentForm.classList.remove('hidden');
      e.commentLogin.classList.add('hidden');
    } else {
      e.commentForm.classList.add('hidden');
      e.commentLogin.classList.remove('hidden');
    }
  }

  async _submitComment() {
    if (!this._vlog) return;

    const text = this.el.commentInput.value.trim();
    if (!text) {
      this.el.commentStatus.textContent = 'Write something first.';
      this.el.commentStatus.classList.add('err');
      return;
    }

    this.el.commentSubmit.disabled = true;
    this.el.commentStatus.classList.remove('err');
    this.el.commentStatus.textContent = 'Posting…';

    try {
      const result = await this._ask('submitComment', {
        vlogId: this._vlog._id,
        comment: text
      });

      this.el.commentInput.value = '';
      this.el.commentStatus.textContent = 'Posted.';
      this._renderComments(result.comments || []);

    } catch (err) {
      console.error('Comment could not be posted', err);
      this.el.commentStatus.textContent =
        err.message === 'not_logged_in'
          ? 'You need to be logged in to comment.'
          : 'Could not post your comment. Please try again.';
      this.el.commentStatus.classList.add('err');

    } finally {
      this.el.commentSubmit.disabled = false;
    }
  }

  async _requestLogin() {
    this.el.commentLoginBtn.disabled = true;

    try {
      const result = await this._ask('requestLogin', {});
      if (result && result.loggedIn) {
        this._isMemberLoggedIn = true;
        this._renderComments(
          (this._vlog && this._vlog.comments) || []
        );
      }
    } catch (err) {
      console.error('Login could not be completed', err);
    } finally {
      this.el.commentLoginBtn.disabled = false;
    }
  }
}

customElements.define('travel-vlog-detail', TravelVlogDetail);
