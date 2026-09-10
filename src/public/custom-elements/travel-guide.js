// ============================================================
// travel-guide.js  —  <travel-guide>
// ------------------------------------------------------------
// TravelVlog ülke rehberi (Guides koleksiyonu) detay sayfasının
// gövdesi. Destinasyon sayfasıyla (travel-destination.js) aynı
// giriş/çıkış desenini kullanır, ama içerik yapısı farklıdır:
// sabit bölümler yerine TEK akıcı Rich Text makale + o ülkeye ait
// destinasyon kartları bandı.
//
// Veri girişi (ikisi de desteklenir):
//   1) data-guide     attribute'u  → JSON string
//   2) postMessage / 'message' event →
//        { type: 'GUIDE_UPDATE',          payload }
//        { type: 'GUIDE_REVIEWS_UPDATE',  payload }
//        { type: 'GUIDE_MEMBER_UPDATE',   payload }
//   3) data-reviews   attribute'u  → JSON string (yorum listesi)
//   4) data-member    attribute'u  → "in" | "out"
//
// Beklenen guide nesnesi (Guides koleksiyonu):
//   { title, slug, ulke, bolge, kisaAciklama, heroImage,
//     content (Rich Text → HTML string), author, tarih,
//     ortalamaPuan, homeLink, listLink,
//     countryDestinations: [ { title, link, heroImage, ulke, bolge } ] }
//
// Beklenen yorum nesnesi (GuideReviews koleksiyonu):
//   { author, rating, comment, date }
//
// Dışarı verdiği olaylar (Velo sayfa kodu dinler):
//   'review-submit' → detail: { rating, comment }
//   'login-request' → detail: {}
// ============================================================

class TravelGuide extends HTMLElement {
  static get observedAttributes() {
    return ['data-guide', 'data-reviews', 'data-member'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || oldVal === newVal) return;
    if (!this._built) { (this._pending = this._pending || {})[name] = newVal; return; }
    if (name === 'data-guide') this._applyGuide(newVal);
    if (name === 'data-reviews') this._applyReviews(newVal);
    if (name === 'data-member') this._applyMember(newVal);
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

  .wrap { width: 100%; max-width: 1440px; margin: 0 auto; }

  /* ---------------- Breadcrumb ---------------- */
  .crumbs { padding: 20px 48px 16px; font-size: 13.5px; color: var(--ink-40); }
  .crumbs ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .crumbs li { display: flex; align-items: center; gap: 8px; }
  .crumbs li + li::before { content: '/'; color: var(--ink-40); opacity: 0.6; }
  .crumbs a { color: var(--ink-60); text-decoration: none; }
  .crumbs a:hover { color: var(--ink); text-decoration: underline; }
  .crumbs [aria-current] { color: var(--ink); font-weight: 500; }

  /* ---------------- Hero ---------------- */
  .hero {
    position: relative;
    min-height: 380px;
    height: 52vh;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    background: #24211d;
  }
  .hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .hero::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(12,12,12,0.72) 0%, rgba(12,12,12,0.15) 55%, rgba(12,12,12,0) 100%);
  }
  .hero-inner { position: relative; z-index: 2; width: 100%; padding: 0 48px 46px; color: #fff; }
  .hero h1 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: clamp(40px, 6vw, 76px);
    line-height: 1;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .hero-meta {
    display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 18px;
    margin-top: 14px; font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.86);
  }
  .hero-meta span + span::before { content: '•'; margin-right: 18px; opacity: 0.6; }

  /* ---------------- Özet + puan ---------------- */
  .intro {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 56px;
    padding: 40px 48px 0;
  }
  .lede {
    margin: 0; max-width: 720px;
    font-family: var(--prose); font-size: 21px; line-height: 1.55;
    color: var(--ink-60);
  }
  .score { flex-shrink: 0; min-width: 176px; padding-left: 28px; border-left: 1px solid var(--rule); }
  .score .avg { display: flex; align-items: baseline; gap: 6px; font-family: var(--prose); font-size: 44px; line-height: 1; color: var(--ink); }
  .score .avg .outof { font-family: var(--ui); font-size: 15px; font-weight: 500; color: var(--ink-40); }
  .score .stars { display: flex; gap: 3px; margin: 10px 0 8px; color: var(--mark); }
  .score .stars svg { width: 16px; height: 16px; }
  .score .stars .off { color: var(--ink-40); opacity: 0.35; }
  .score .count { font-size: 14px; color: var(--ink-60); }
  .score a { display: inline-block; margin-top: 12px; font-size: 14px; font-weight: 600; color: var(--mark); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
  .score a:hover { opacity: 0.7; }
  .score .none { font-family: var(--ui); font-size: 15px; line-height: 1.5; color: var(--ink-40); }

  /* ---------------- Makale (tek akıcı Rich Text) ---------------- */
  .article {
    max-width: 760px;
    margin: 0 auto;
    padding: 56px 48px 24px;
    font-family: var(--prose);
    font-size: 18.5px;
    line-height: 1.78;
    color: rgba(20,20,20,0.86);
  }
  .article > *:first-child { margin-top: 0; }
  .article h2 { font-family: var(--prose); font-weight: 500; font-size: 32px; line-height: 1.2; letter-spacing: -0.01em; margin: 1.5em 0 0.55em; }
  .article h3 { font-family: var(--prose); font-weight: 500; font-size: 24px; line-height: 1.25; margin: 1.4em 0 0.5em; }
  .article p { margin: 0 0 1.1em; }
  .article img { width: 100%; border-radius: 12px; display: block; margin: 1.5em 0; }
  .article a { color: var(--mark); text-decoration: underline; }
  .article blockquote { margin: 1.6em 0; padding-left: 20px; border-left: 3px solid var(--mark); font-style: italic; color: var(--ink-60); }
  .article ul, .article ol { margin: 0 0 1.2em; padding-left: 1.4em; }
  .article li { margin-bottom: 0.4em; }
  .article-empty { font-family: var(--ui); font-size: 15px; color: var(--ink-40); }

  /* ---------------- Bu ülkedeki destinasyonlar ---------------- */
  .destinations { padding: 24px 48px 96px; }
  .destinations h2 { font-family: var(--prose); font-weight: 500; font-size: 30px; margin: 0 0 22px; }
  .dest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
  .dest-grid a { display: block; text-decoration: none; color: var(--ink); }
  .dest-grid .shot { width: 100%; aspect-ratio: 3 / 2; border-radius: 12px; overflow: hidden; background: #d9d7d2; margin-bottom: 12px; }
  .dest-grid img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
  .dest-grid a:hover img { transform: scale(1.04); }
  .dest-grid .name { font-family: var(--prose); font-size: 21px; line-height: 1.2; display: block; }
  .dest-grid .where { display: block; margin-top: 5px; font-size: 13.5px; color: var(--ink-40); }

  /* ---------------- Yorumlar ---------------- */
  .reviews { background: var(--card); border-radius: 20px; margin: 0 48px 96px; padding: 44px 44px 48px; }
  .reviews h2 { font-family: var(--prose); font-weight: 500; font-size: 30px; margin: 0 0 6px; }
  .reviews .sub { font-size: 15px; color: var(--ink-60); margin: 0 0 30px; }

  .rate-row { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
  .rate-btn { background: none; border: 0; padding: 2px; cursor: pointer; line-height: 0; color: var(--ink-40); }
  .rate-btn.lit { color: var(--mark); }
  .rate-btn:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; border-radius: 3px; }
  .rate-btn svg { width: 26px; height: 26px; }

  .review-form textarea {
    width: 100%; min-height: 108px; resize: vertical; padding: 14px 16px;
    border: 1px solid var(--rule); border-radius: 10px;
    font-family: var(--ui); font-size: 15px; line-height: 1.55; color: var(--ink); background: #fbfaf8;
  }
  .review-form textarea:focus-visible { outline: 2px solid var(--mark); outline-offset: 1px; }

  .form-foot { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
  .btn {
    font-family: var(--ui); font-size: 14.5px; font-weight: 600; padding: 12px 24px;
    border-radius: 9px; border: 0; background: var(--ink); color: #fff; cursor: pointer;
  }
  .btn[disabled] { opacity: 0.4; cursor: default; }
  .btn:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; }
  .form-msg { font-size: 14px; color: var(--ink-60); }

  .signin-note {
    display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
    padding: 20px 22px; border: 1px solid var(--rule); border-radius: 12px; font-size: 15px; color: var(--ink-60);
  }

  .review-list { list-style: none; margin: 36px 0 0; padding: 0; }
  .review-list li { padding: 22px 0; border-top: 1px solid var(--rule); }
  .review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .review-head .who { font-size: 14.5px; font-weight: 600; }
  .review-head .when { font-size: 13.5px; color: var(--ink-40); margin-left: auto; }
  .review-stars { display: inline-flex; gap: 2px; color: var(--mark); }
  .review-stars svg { width: 14px; height: 14px; }
  .review-list p { margin: 0; font-family: var(--prose); font-size: 17px; line-height: 1.65; color: rgba(20,20,20,0.86); }
  .no-reviews { font-size: 15px; color: var(--ink-40); margin: 30px 0 0; }

  /* ---------------- Dar ekran ---------------- */
  @media (max-width: 900px) {
    .hero { height: 44vh; min-height: 300px; }
    .hero-inner { padding: 0 22px 30px; }
    .intro { grid-template-columns: minmax(0, 1fr); gap: 24px; padding: 30px 22px 0; }
    .lede { font-size: 19px; }
    .score { padding: 18px 0 0; border-left: 0; border-top: 1px solid var(--rule); min-width: 0; }
    .article { padding: 40px 22px 12px; font-size: 17.5px; }
    .article h2 { font-size: 27px; }
    .crumbs { padding: 14px 22px 12px; }
    .destinations { padding: 12px 22px 64px; }
    .reviews { margin: 0 22px 64px; padding: 30px 24px 34px; border-radius: 16px; }
  }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <nav class="crumbs" id="crumbs" aria-label="Breadcrumb"></nav>
  <header class="hero" id="hero"></header>
  <div class="intro">
    <p class="lede" id="lede"></p>
    <div class="score" id="score"></div>
  </div>

  <article class="article" id="article"></article>

  <div class="destinations" id="destinations" hidden></div>

  <div class="reviews" id="reviewsSection">
    <h2>Ratings and reviews</h2>
    <p class="sub" id="reviewSub">Read this guide? Let others know how it went.</p>
    <div id="reviewForm"></div>
    <ul class="review-list" id="reviewList"></ul>
  </div>
</div>
`;

    // ---------- yardımcılar ----------
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const starSvg = (cls) =>
      `<svg class="${cls === undefined ? 'star' : cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">` +
      `<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>`;

    const heroEl  = root.getElementById('hero');
    const ledeEl  = root.getElementById('lede');
    const scoreEl = root.getElementById('score');
    const artEl   = root.getElementById('article');
    const destEl  = root.getElementById('destinations');
    const crumbEl = root.getElementById('crumbs');
    const formEl  = root.getElementById('reviewForm');
    const listEl  = root.getElementById('reviewList');

    // CMS bağlanana kadar örnek içerik.
    let DATA = {
      title: 'Italy',
      ulke: 'Italy',
      bolge: 'Europe',
      kisaAciklama: 'Everything to know before planning a trip across Italy — regions, timing, getting around, and where to start.',
      heroImage: 'https://picsum.photos/seed/italy-guide/1600/900',
      content: '',
      author: '',
      tarih: '',
      ortalamaPuan: 0,
      homeLink: '/',
      listLink: null,
      countryDestinations: []
    };
    let REVIEWS = [];
    let MEMBER = false;
    let chosenRating = 0;

    // ---------- render ----------
    const renderCrumbs = () => {
      const parts = [`<li><a href="${esc(DATA.homeLink || '/')}">Home</a></li>`];
      if (DATA.listLink) parts.push(`<li><a href="${esc(DATA.listLink)}">Guides</a></li>`);
      parts.push(`<li><span aria-current="page">${esc(DATA.title)}</span></li>`);
      crumbEl.innerHTML = `<ol>${parts.join('')}</ol>`;
    };

    const renderHero = () => {
      const img = DATA.heroImage ? `<img src="${esc(DATA.heroImage)}" alt="${esc(DATA.title)}">` : '';
      const meta = [];
      if (DATA.author) meta.push(esc(DATA.author));
      if (DATA.tarih) meta.push(esc(DATA.tarih));
      const place = [DATA.ulke, DATA.bolge].filter(Boolean).join(', ');
      if (place) meta.push(esc(place));

      heroEl.innerHTML = img +
        `<div class="hero-inner"><h1>${esc(DATA.title)}</h1>` +
        (meta.length ? `<div class="hero-meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>` : '') +
        `</div>`;
      ledeEl.textContent = DATA.kisaAciklama || '';
      ledeEl.hidden = !DATA.kisaAciklama;
    };

    const renderScore = () => {
      const count = REVIEWS.length;
      const avg = count
        ? REVIEWS.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count
        : (Number(DATA.ortalamaPuan) || 0);

      if (!count && !avg) {
        scoreEl.innerHTML = `<p class="none">No ratings yet.<br><a href="#reviewsSection">Be the first to review</a></p>`;
        wireScoreLink();
        return;
      }

      const full = Math.round(avg);
      const stars = [1, 2, 3, 4, 5].map((n) => starSvg(n <= full ? '' : 'off')).join('');

      scoreEl.innerHTML =
        `<div class="avg">${avg.toFixed(1)}<span class="outof">out of 5</span></div>` +
        `<div class="stars">${stars}</div>` +
        `<div class="count">${count ? `Based on ${count} review${count === 1 ? '' : 's'}` : 'No reviews yet'}</div>` +
        `<a href="#reviewsSection">${count ? 'Read reviews' : 'Write a review'}</a>`;
      wireScoreLink();
    };

    const wireScoreLink = () => {
      const a = scoreEl.querySelector('a');
      if (!a) return;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = root.getElementById('reviewsSection');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    // content, Guides koleksiyonundaki Rich Text alanından gelen HTML
    // string. Bu, ziyaretçi girdisi değil site sahibinin CMS'te yazdığı
    // güvenilir içerik olduğu için doğrudan innerHTML ile basılıyor.
    const renderArticle = () => {
      const html = String(DATA.content || '').trim();
      artEl.innerHTML = html || `<p class="article-empty">This guide doesn't have content yet.</p>`;
    };

    const renderDestinations = () => {
      const list = Array.isArray(DATA.countryDestinations) ? DATA.countryDestinations : [];
      if (!list.length) { destEl.hidden = true; destEl.innerHTML = ''; return; }

      const heading = DATA.ulke ? `Destinations in ${esc(DATA.ulke)}` : 'Destinations';
      destEl.hidden = false;
      destEl.innerHTML = `<h2>${heading}</h2><div class="dest-grid">` +
        list.map((r) => {
          const img = r.heroImage
            ? `<img src="${esc(r.heroImage)}" alt="${esc(r.title)}" loading="lazy">`
            : '';
          const where = [r.ulke, r.bolge].filter(Boolean).join(', ');
          return `<a href="${esc(r.link || '#')}">` +
            `<span class="shot">${img}</span>` +
            `<span class="name">${esc(r.title)}</span>` +
            (where ? `<span class="where">${esc(where)}</span>` : '') +
            `</a>`;
        }).join('') + `</div>`;
    };

    const renderForm = () => {
      if (!MEMBER) {
        formEl.innerHTML =
          `<div class="signin-note"><span>Sign in to leave a rating and review.</span>` +
          `<button class="btn" id="signInBtn" type="button">Sign in</button></div>`;
        const b = root.getElementById('signInBtn');
        if (b) b.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('login-request', { bubbles: true, composed: true, detail: {} }));
        });
        return;
      }
      formEl.innerHTML =
        `<div class="review-form">` +
          `<div class="rate-row" id="rateRow" role="group" aria-label="Your rating">` +
            [1, 2, 3, 4, 5].map((n) =>
              `<button class="rate-btn" type="button" data-v="${n}" aria-label="${n} out of 5">${starSvg('')}</button>`
            ).join('') +
          `</div>` +
          `<textarea id="cmt" placeholder="What should someone know before they read this guide?"></textarea>` +
          `<div class="form-foot">` +
            `<button class="btn" id="postBtn" type="button" disabled>Post review</button>` +
            `<span class="form-msg" id="formMsg"></span>` +
          `</div>` +
        `</div>`;
      wireForm();
    };

    const renderReviews = () => {
      if (!REVIEWS.length) {
        listEl.innerHTML = `<li style="border:0;padding:0"><p class="no-reviews">No reviews yet.</p></li>`;
        return;
      }
      listEl.innerHTML = REVIEWS.map((r) => {
        const n = Math.max(0, Math.min(5, Number(r.rating) || 0));
        const stars = `<span class="review-stars">${starSvg('').repeat(n)}</span>`;
        const when = r.date ? esc(r.date) : '';
        return `<li><div class="review-head"><span class="who">${esc(r.author || 'Traveller')}</span>` +
          stars + (when ? `<span class="when">${when}</span>` : '') + `</div>` +
          `<p>${esc(r.comment || '')}</p></li>`;
      }).join('');
    };

    const wireForm = () => {
      const row  = root.getElementById('rateRow');
      const cmt  = root.getElementById('cmt');
      const post = root.getElementById('postBtn');
      const msg  = root.getElementById('formMsg');
      if (!row) return;

      const paint = () => row.querySelectorAll('.rate-btn').forEach((b) =>
        b.classList.toggle('lit', Number(b.getAttribute('data-v')) <= chosenRating));

      row.querySelectorAll('.rate-btn').forEach((b) => {
        b.addEventListener('click', () => {
          chosenRating = Number(b.getAttribute('data-v'));
          paint();
          post.disabled = chosenRating === 0;
        });
      });

      post.addEventListener('click', () => {
        if (!chosenRating) return;
        this.dispatchEvent(new CustomEvent('review-submit', {
          bubbles: true, composed: true,
          detail: { rating: chosenRating, comment: cmt.value.trim() }
        }));
        post.disabled = true;
        msg.textContent = 'Posting…';
      });
    };

    // ---------- dış dünya ----------
    this._applyGuide = (raw) => {
      try {
        const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!d) return;
        DATA = Object.assign({}, DATA, d);
        renderCrumbs(); renderHero(); renderScore(); renderArticle(); renderDestinations();
      } catch (err) { console.error('Guide verisi işlenemedi:', err); }
    };

    this._applyReviews = (raw) => {
      try {
        const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
        REVIEWS = Array.isArray(r) ? r : [];
        renderReviews(); renderScore();
        chosenRating = 0;
        if (MEMBER) renderForm();
      } catch (err) { console.error('Yorum verisi işlenemedi:', err); }
    };

    this._applyMember = (v) => {
      MEMBER = String(v) === 'in';
      renderForm();
    };

    this.addEventListener('message', (e) => {
      const d = e.detail !== undefined ? e.detail : e.data;
      if (!d) return;
      if (d.type === 'GUIDE_UPDATE')         this._applyGuide(d.payload);
      if (d.type === 'GUIDE_REVIEWS_UPDATE') this._applyReviews(d.payload);
      if (d.type === 'GUIDE_MEMBER_UPDATE')  this._applyMember(d.payload ? 'in' : 'out');
    });
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (!d || !d.type) return;
      if (d.type === 'GUIDE_UPDATE')         this._applyGuide(d.payload);
      if (d.type === 'GUIDE_REVIEWS_UPDATE') this._applyReviews(d.payload);
      if (d.type === 'GUIDE_MEMBER_UPDATE')  this._applyMember(d.payload ? 'in' : 'out');
    });

    // İlk çizim
    renderCrumbs(); renderHero(); renderScore(); renderArticle();
    renderDestinations(); renderForm(); renderReviews();

    // connectedCallback'ten önce set edilmiş attribute'ları uygula.
    const pend = this._pending || {};
    const g = pend['data-guide']   || this.getAttribute('data-guide');
    const r = pend['data-reviews'] || this.getAttribute('data-reviews');
    const m = pend['data-member']  || this.getAttribute('data-member');
    if (m) this._applyMember(m);
    if (g) this._applyGuide(g);
    if (r) this._applyReviews(r);
    this._pending = null;
  }
}

customElements.define('travel-guide', TravelGuide);
