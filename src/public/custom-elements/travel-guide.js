// ============================================================
// travel-guide.js  —  <travel-guide>
// ------------------------------------------------------------
// TravelVlog ülke rehberi (Guides koleksiyonu) detay sayfasının
// ETKİLEŞİMLİ gövdesi.
//
// SEO NOTU (önemli):
// Wix, arama motoru botlarına "seoSsrOnly" modunda indirgenmiş bir
// yanıt döner ve o yanıtta istemci JavaScript'i hiç çalışmaz. Bunun
// sonucu olarak custom element'lerin shadow DOM içeriği Googlebot
// tarafından GÖRÜLMEZ — etiket boş bir kabuk olarak kalır.
//
// Bu yüzden SEO açısından kritik olan içerik bu dosyadan çıkarıldı
// ve Wix'in yerel (native) bileşenlerine taşındı. Aşağıdakiler ARTIK
// BURADA RENDER EDİLMİYOR; dinamik sayfada dataset'e bağlı native
// elemanlarla gösterilir:
//   - breadcrumb
//   - hero görseli + H1 başlık + meta (yazar / tarih / ülke, bölge)
//   - kısa açıklama (lede)
//   - makale gövdesi (content — Rich Text)
//
// Burada kalanlar, botun görmesine gerek olmayan etkileşimli parçalar:
//   - ortalama puan kutusu
//   - o ülkedeki destinasyon kartları
//   - puanlama ve yorum sistemi
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
// Beklenen guide nesnesi (bu dosyanın kullandığı alanlar):
//   { ulke, ortalamaPuan,
//     countryDestinations: [ { title, link, heroImage, ulke, bolge } ] }
//   (title/heroImage/content/kisaAciklama/tarih/author alanları artık
//    native elemanlarda kullanılıyor, burada okunmuyor.)
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

  /* ---------------- Ortalama puan ---------------- */
  .score-band { padding: 32px 48px 0; }
  .score { max-width: 280px; padding-left: 28px; border-left: 1px solid var(--rule); }
  .score .avg { display: flex; align-items: baseline; gap: 6px; font-family: var(--prose); font-size: 44px; line-height: 1; color: var(--ink); }
  .score .avg .outof { font-family: var(--ui); font-size: 15px; font-weight: 500; color: var(--ink-40); }
  .score .stars { display: flex; gap: 3px; margin: 10px 0 8px; color: var(--mark); }
  .score .stars svg { width: 16px; height: 16px; }
  .score .stars .off { color: var(--ink-40); opacity: 0.35; }
  .score .count { font-size: 14px; color: var(--ink-60); }
  .score a { display: inline-block; margin-top: 12px; font-size: 14px; font-weight: 600; color: var(--mark); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
  .score a:hover { opacity: 0.7; }
  .score .none { font-family: var(--ui); font-size: 15px; line-height: 1.5; color: var(--ink-40); }

  /* ---------------- Bu ülkedeki destinasyonlar ---------------- */
  .destinations { padding: 48px 48px 96px; }
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
    .score-band { padding: 24px 22px 0; }
    .score { padding: 18px 0 0; border-left: 0; border-top: 1px solid var(--rule); max-width: none; }
    .destinations { padding: 36px 22px 64px; }
    .reviews { margin: 0 22px 64px; padding: 30px 24px 34px; border-radius: 16px; }
  }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <div class="score-band"><div class="score" id="score"></div></div>

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

    const scoreEl = root.getElementById('score');
    const destEl  = root.getElementById('destinations');
    const formEl  = root.getElementById('reviewForm');
    const listEl  = root.getElementById('reviewList');

    // CMS bağlanana kadarki varsayılanlar.
    let DATA = {
      ulke: '',
      ortalamaPuan: 0,
      countryDestinations: []
    };
    let REVIEWS = [];
    let MEMBER = false;
    let chosenRating = 0;

    // ---------- render ----------
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
        renderScore(); renderDestinations();
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
    renderScore(); renderDestinations(); renderForm(); renderReviews();

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
