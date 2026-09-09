// ============================================================
// travel-destination.js  —  <travel-destination>
// ------------------------------------------------------------
// TravelVlog destinasyon detay sayfasının gövdesi.
//
// Veri girişi (ikisi de desteklenir):
//   1) data-destination  attribute'u  → JSON string
//   2) postMessage / 'message' event  → { type: 'DESTINATION_UPDATE', payload }
//   3) data-reviews      attribute'u  → JSON string (yorum listesi)
//   4) data-member       attribute'u  → "in" | "out" (üye girişi durumu)
//
// Beklenen destinasyon nesnesi (Destinations koleksiyonu):
//   { title, slug, ulke, bolge, kisaAciklama, heroImage, galeri[],
//     genelBakis, nasilGidilir, konaklama, gezilecekYerler,
//     yemeIcme, kultur, tarih, ortalamaPuan }
//
// Beklenen yorum nesnesi (DestinationReviews koleksiyonu):
//   { author, rating, comment, date }
//
// Dışarı verdiği olaylar (Velo sayfa kodu dinler):
//   'review-submit' → detail: { rating, comment }
//   'login-request' → detail: {}   (üye değilken puanlamaya çalışırsa)
// ============================================================

class TravelDestination extends HTMLElement {
  static get observedAttributes() {
    return ['data-destination', 'data-reviews', 'data-member'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || oldVal === newVal) return;
    if (!this._built) { (this._pending = this._pending || {})[name] = newVal; return; }
    if (name === 'data-destination') this._applyDestination(newVal);
    if (name === 'data-reviews') this._applyReviews(newVal);
    if (name === 'data-member') this._applyMember(newVal);
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const root = this.attachShadow({ mode: 'open' });

    // --- Bölümler: CMS alanı ↔ ekranda görünen başlık ---------
    const SECTIONS = [
      { key: 'genelBakis',      id: 'overview',  label: 'Overview' },
      { key: 'nasilGidilir',    id: 'getting',   label: 'Getting there' },
      { key: 'konaklama',       id: 'staying',   label: 'Where to stay' },
      { key: 'gezilecekYerler', id: 'doing',     label: 'Things to do' },
      { key: 'yemeIcme',        id: 'eating',    label: 'Food and drink' },
      { key: 'kultur',          id: 'culture',   label: 'Culture' },
      { key: 'tarih',           id: 'history',   label: 'History' }
    ];
    this._SECTIONS = SECTIONS;

    root.innerHTML = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap');

  :host {
    display: block;

    /* Header ile aynı zemin ve mürekkep; tek aksan koyu çam yeşili. */
    --paper:  #e9e8e4;
    --card:   #ffffff;
    --ink:    #141414;
    --ink-60: rgba(20,20,20,0.60);
    --ink-40: rgba(20,20,20,0.40);
    --rule:   rgba(20,20,20,0.12);
    --mark:   #16514C;

    --ui:    'Inter', system-ui, sans-serif;
    --prose: 'Newsreader', Georgia, serif;

    --rail:  208px;
    --gap:   64px;
    --stick: 124px;   /* header yüksekliği + nefes payı */

    background: var(--paper);
    color: var(--ink);
    font-family: var(--ui);
  }
  * { box-sizing: border-box; }

  .wrap { width: 100%; max-width: 1440px; margin: 0 auto; }

  /* ---------------- Hero ---------------- */
  .hero {
    position: relative;
    min-height: 420px;
    height: 62vh;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .hero img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12,12,12,0.72) 0%, rgba(12,12,12,0.15) 55%, rgba(12,12,12,0) 100%);
  }
  .hero-inner {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 0 48px 52px;
    color: #fff;
  }
  .hero h1 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: clamp(46px, 7vw, 92px);
    line-height: 0.98;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .hero-meta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px 22px;
    margin-top: 16px;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255,255,255,0.86);
  }
  .hero-rating {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .hero-rating .num { font-weight: 600; color: #fff; }
  .hero-rating .of  { color: rgba(255,255,255,0.62); }
  .star { width: 15px; height: 15px; flex-shrink: 0; }

  .lede {
    padding: 40px 48px 0;
    max-width: 760px;
    font-family: var(--prose);
    font-size: 21px;
    line-height: 1.55;
    color: var(--ink-60);
  }

  /* ---------------- İçindekiler rayı + okuma sütunu ---------------- */
  .body {
    display: grid;
    grid-template-columns: var(--rail) minmax(0, 1fr);
    gap: var(--gap);
    padding: 56px 48px 96px;
    align-items: start;
  }

  .rail { position: sticky; top: var(--stick); }
  .rail ol {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 1px solid var(--rule);
  }
  .rail li a {
    display: block;
    padding: 9px 0 9px 18px;
    margin-left: -1px;
    border-left: 1px solid transparent;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    color: var(--ink-40);
    text-decoration: none;
    transition: color 0.18s ease, border-color 0.18s ease;
  }
  .rail li a:hover { color: var(--ink); }
  .rail li a.on {
    color: var(--mark);
    border-left: 2px solid var(--mark);
    font-weight: 600;
  }
  .rail li a:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; }

  /* ---------------- Bölümler ---------------- */
  .col { max-width: 680px; }

  section.chunk { scroll-margin-top: var(--stick); padding-bottom: 56px; }
  section.chunk + section.chunk { border-top: 1px solid var(--rule); padding-top: 48px; }
  section.chunk h2 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.015em;
    margin: 0 0 20px;
  }
  section.chunk p {
    font-family: var(--prose);
    font-size: 18.5px;
    line-height: 1.72;
    margin: 0 0 1.05em;
    color: rgba(20,20,20,0.86);
  }
  section.chunk p:last-child { margin-bottom: 0; }
  .empty-note {
    font-family: var(--ui);
    font-size: 15px;
    color: var(--ink-40);
  }

  /* ---------------- Galeri ---------------- */
  .gallery { padding: 0 48px 96px; }
  .gallery h2 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: 30px;
    margin: 0 0 22px;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }
  .gallery-grid img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 10px;
    display: block;
  }

  /* ---------------- Yorumlar ---------------- */
  .reviews {
    background: var(--card);
    border-radius: 20px;
    margin: 0 48px 96px;
    padding: 44px 44px 48px;
  }
  .reviews h2 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: 30px;
    margin: 0 0 6px;
  }
  .reviews .sub {
    font-size: 15px;
    color: var(--ink-60);
    margin: 0 0 30px;
  }

  .rate-row { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
  .rate-btn {
    background: none;
    border: 0;
    padding: 2px;
    cursor: pointer;
    line-height: 0;
    color: var(--ink-40);
  }
  .rate-btn.lit { color: var(--mark); }
  .rate-btn:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; border-radius: 3px; }
  .rate-btn svg { width: 26px; height: 26px; }

  .review-form textarea {
    width: 100%;
    min-height: 108px;
    resize: vertical;
    padding: 14px 16px;
    border: 1px solid var(--rule);
    border-radius: 10px;
    font-family: var(--ui);
    font-size: 15px;
    line-height: 1.55;
    color: var(--ink);
    background: #fbfaf8;
  }
  .review-form textarea:focus-visible { outline: 2px solid var(--mark); outline-offset: 1px; }

  .form-foot { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
  .btn {
    font-family: var(--ui);
    font-size: 14.5px;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 9px;
    border: 0;
    background: var(--ink);
    color: #fff;
    cursor: pointer;
  }
  .btn[disabled] { opacity: 0.4; cursor: default; }
  .btn:focus-visible { outline: 2px solid var(--mark); outline-offset: 2px; }
  .form-msg { font-size: 14px; color: var(--ink-60); }

  .signin-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    padding: 20px 22px;
    border: 1px solid var(--rule);
    border-radius: 12px;
    font-size: 15px;
    color: var(--ink-60);
  }

  .review-list { list-style: none; margin: 36px 0 0; padding: 0; }
  .review-list li { padding: 22px 0; border-top: 1px solid var(--rule); }
  .review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .review-head .who { font-size: 14.5px; font-weight: 600; }
  .review-head .when { font-size: 13.5px; color: var(--ink-40); margin-left: auto; }
  .review-stars { display: inline-flex; gap: 2px; color: var(--mark); }
  .review-stars svg { width: 14px; height: 14px; }
  .review-list p {
    margin: 0;
    font-family: var(--prose);
    font-size: 17px;
    line-height: 1.65;
    color: rgba(20,20,20,0.86);
  }
  .no-reviews { font-size: 15px; color: var(--ink-40); margin: 30px 0 0; }

  /* ---------------- Dar ekran ---------------- */
  @media (max-width: 900px) {
    :host { --gap: 0px; --stick: 92px; }
    .hero { height: 52vh; min-height: 340px; }
    .hero-inner { padding: 0 22px 34px; }
    .lede { padding: 30px 22px 0; font-size: 19px; }

    .body {
      grid-template-columns: minmax(0, 1fr);
      padding: 0 22px 64px;
      gap: 0;
    }
    /* Rayı üstte yatay, yapışkan bir şeride çevir. */
    .rail {
      position: sticky;
      top: 0;
      z-index: 5;
      margin: 0 -22px 28px;
      padding: 0 22px;
      background: var(--paper);
      border-bottom: 1px solid var(--rule);
    }
    .rail ol {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      border-left: 0;
      scrollbar-width: none;
    }
    .rail ol::-webkit-scrollbar { display: none; }
    .rail li a {
      padding: 14px 2px;
      margin: 0 8px 0 0;
      white-space: nowrap;
      border-left: 0;
      border-bottom: 2px solid transparent;
    }
    .rail li a.on { border-left: 0; border-bottom: 2px solid var(--mark); }

    section.chunk h2 { font-size: 28px; }
    section.chunk p { font-size: 17.5px; }
    .gallery { padding: 0 22px 64px; }
    .reviews { margin: 0 22px 64px; padding: 30px 24px 34px; border-radius: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; scroll-behavior: auto !important; }
  }
</style>

<div class="wrap">
  <header class="hero" id="hero"></header>
  <p class="lede" id="lede"></p>

  <div class="body">
    <nav class="rail" id="rail" aria-label="Sections"></nav>
    <div class="col" id="col"></div>
  </div>

  <div class="gallery" id="gallery" hidden></div>

  <div class="reviews">
    <h2>Ratings and reviews</h2>
    <p class="sub" id="reviewSub">Been here? Share what the trip was actually like.</p>
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
      `<svg class="${cls || 'star'}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">` +
      `<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>`;

    // Düz metni paragraflara böl (CMS alanları düz metin).
    const toParas = (text) => {
      const t = String(text || '').trim();
      if (!t) return '';
      return t.split(/\n\s*\n|\r\n\s*\r\n/)
        .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('');
    };

    const heroEl    = root.getElementById('hero');
    const ledeEl    = root.getElementById('lede');
    const railEl    = root.getElementById('rail');
    const colEl     = root.getElementById('col');
    const galEl     = root.getElementById('gallery');
    const formEl    = root.getElementById('reviewForm');
    const listEl    = root.getElementById('reviewList');
    const subEl     = root.getElementById('reviewSub');

    // CMS bağlanana kadar gösterilecek örnek içerik — editörde ve
    // veri gecikmesinde sayfa boş görünmesin diye.
    let DATA = {
      title: 'Santorini',
      ulke: 'Greece',
      bolge: 'Europe',
      kisaAciklama: 'A volcanic island in the Aegean, known for white-washed villages stacked along the caldera rim.',
      heroImage: 'https://picsum.photos/seed/santorini-hero/1600/900',
      galeri: [],
      ortalamaPuan: 0
    };
    let REVIEWS = [];
    let MEMBER = false;
    let chosenRating = 0;

    // ---------- render ----------
    const renderHero = () => {
      const img = DATA.heroImage
        ? `<img src="${esc(DATA.heroImage)}" alt="${esc(DATA.title)}">`
        : '';
      const place = [DATA.ulke, DATA.bolge].filter(Boolean).join(', ');
      const score = Number(DATA.ortalamaPuan) || 0;
      const count = REVIEWS.length;
      const rating = score > 0
        ? `<span class="hero-rating">${starSvg()}<span class="num">${score.toFixed(1)}</span>` +
          `<span class="of">out of 5${count ? ` · ${count} review${count === 1 ? '' : 's'}` : ''}</span></span>`
        : '';
      heroEl.innerHTML = img +
        `<div class="hero-inner"><h1>${esc(DATA.title)}</h1>` +
        (place || rating ? `<div class="hero-meta">${place ? `<span>${esc(place)}</span>` : ''}${rating}</div>` : '') +
        `</div>`;
      ledeEl.textContent = DATA.kisaAciklama || '';
      ledeEl.hidden = !DATA.kisaAciklama;
    };

    // Sadece içeriği dolu bölümler görünür — boş bir başlık göstermek
    // okuyucuya hiçbir şey söylemez.
    const activeSections = () =>
      SECTIONS.filter((s) => String(DATA[s.key] || '').trim().length > 0);

    const renderBody = () => {
      let list = activeSections();
      if (list.length === 0) list = [SECTIONS[0]];

      railEl.innerHTML = '<ol>' + list.map((s) =>
        `<li><a href="#${s.id}" data-target="${s.id}">${esc(s.label)}</a></li>`
      ).join('') + '</ol>';

      colEl.innerHTML = list.map((s) => {
        const inner = toParas(DATA[s.key]) ||
          `<p class="empty-note">Nothing here yet.</p>`;
        return `<section class="chunk" id="${s.id}"><h2>${esc(s.label)}</h2>${inner}</section>`;
      }).join('');

      wireRail();
      observeSections();
    };

    const renderGallery = () => {
      const imgs = Array.isArray(DATA.galeri) ? DATA.galeri.filter(Boolean) : [];
      if (!imgs.length) { galEl.hidden = true; galEl.innerHTML = ''; return; }
      galEl.hidden = false;
      galEl.innerHTML = `<h2>Photos</h2><div class="gallery-grid">` +
        imgs.map((src, i) =>
          `<img src="${esc(src)}" alt="${esc(DATA.title)} photo ${i + 1}" loading="lazy">`
        ).join('') + `</div>`;
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
          `<textarea id="cmt" placeholder="What should someone know before they go?"></textarea>` +
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

    // ---------- davranış ----------
    const wireRail = () => {
      railEl.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const t = root.getElementById(a.getAttribute('data-target'));
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    };

    // Okuyucu kaydırdıkça raydaki işaret onunla birlikte gider —
    // sayfadaki tek hareketli öge bu.
    let io = null;
    const observeSections = () => {
      if (io) io.disconnect();
      const links = Array.from(railEl.querySelectorAll('a'));
      const setActive = (id) => links.forEach((l) =>
        l.classList.toggle('on', l.getAttribute('data-target') === id));

      const secs = Array.from(colEl.querySelectorAll('section.chunk'));
      if (!secs.length) return;
      setActive(secs[0].id);

      io = new IntersectionObserver((entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis.length) setActive(vis[0].target.id);
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

      secs.forEach((s) => io.observe(s));
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
    this._applyDestination = (raw) => {
      try {
        const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!d) return;
        DATA = Object.assign({}, DATA, d);
        renderHero(); renderBody(); renderGallery();
      } catch (err) { console.error('Destination verisi işlenemedi:', err); }
    };

    this._applyReviews = (raw) => {
      try {
        const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
        REVIEWS = Array.isArray(r) ? r : [];
        renderReviews(); renderHero();
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
      if (d.type === 'DESTINATION_UPDATE') this._applyDestination(d.payload);
      if (d.type === 'REVIEWS_UPDATE')     this._applyReviews(d.payload);
      if (d.type === 'MEMBER_UPDATE')      this._applyMember(d.payload ? 'in' : 'out');
    });
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (!d || !d.type) return;
      if (d.type === 'DESTINATION_UPDATE') this._applyDestination(d.payload);
      if (d.type === 'REVIEWS_UPDATE')     this._applyReviews(d.payload);
      if (d.type === 'MEMBER_UPDATE')      this._applyMember(d.payload ? 'in' : 'out');
    });

    // İlk çizim
    renderHero(); renderBody(); renderGallery(); renderForm(); renderReviews();

    // connectedCallback'ten önce set edilmiş attribute'ları uygula.
    const pend = this._pending || {};
    const d = pend['data-destination'] || this.getAttribute('data-destination');
    const r = pend['data-reviews']     || this.getAttribute('data-reviews');
    const m = pend['data-member']      || this.getAttribute('data-member');
    if (m) this._applyMember(m);
    if (d) this._applyDestination(d);
    if (r) this._applyReviews(r);
    this._pending = null;
  }
}

customElements.define('travel-destination', TravelDestination);
