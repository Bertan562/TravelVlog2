// ============================================================
// travel-home.js  —  <travel-home>
// ------------------------------------------------------------
// Anasayfa hero'su: "Destination of the day".
//
// Gösterilen destinasyonu masterPage.js seçer ve buraya gönderir.
// Seçim tarihe göre deterministiktir: aynı gün siteye giren herkes
// aynı destinasyonu görür, gece yarısı kendiliğinden değişir.
//
// Veri girişi:
//   data-daily attribute'u  → JSON string
//   postMessage             → { type: 'DAILY_UPDATE', payload }
//
// Beklenen nesne:
//   { title, kisaAciklama, ulke, bolge, heroImage, link, ortalamaPuan }
// ============================================================

class TravelHome extends HTMLElement {
  static get observedAttributes() { return ['data-daily']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'data-daily' || !newVal || oldVal === newVal) return;
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
    --mark:   #16514C;
    --ui:    'Inter', system-ui, sans-serif;
    --prose: 'Newsreader', Georgia, serif;
    background: var(--paper);
    font-family: var(--ui);
  }
  * { box-sizing: border-box; }

  .hero {
    position: relative;
    width: 100%;
    min-height: 520px;
    height: 78vh;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    background: #24211d;
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
    background: linear-gradient(to top,
      rgba(10,10,10,0.80) 0%,
      rgba(10,10,10,0.30) 50%,
      rgba(10,10,10,0.05) 100%);
  }

  .inner {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 48px 64px;
    color: #fff;
  }

  /* Etiket ve tarih: küçük, sakin, başlığın önüne geçmiyor. */
  .stamp {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-bottom: 22px;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .stamp .tag {
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.16);
    backdrop-filter: blur(6px);
  }
  .stamp .date {
    font-weight: 500;
    color: rgba(255,255,255,0.74);
  }
  /* Bir sonraki destinasyona kalan süre. Rakamlar tabular, yoksa
     her saniye genişlik değişip zıplıyor. */
  .stamp .next {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
    font-weight: 500;
    color: rgba(255,255,255,0.74);
  }
  .stamp .next::before {
    content: '';
    width: 1px;
    height: 13px;
    background: rgba(255,255,255,0.28);
    margin-right: 7px;
  }
  .stamp .next .clock {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: #fff;
  }

  h1 {
    font-family: var(--prose);
    font-weight: 500;
    font-size: clamp(52px, 8vw, 108px);
    line-height: 0.95;
    letter-spacing: -0.025em;
    margin: 0;
  }

  .place {
    margin-top: 14px;
    font-size: 15.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.82);
  }

  .blurb {
    margin: 20px 0 0;
    max-width: 620px;
    font-family: var(--prose);
    font-size: 20px;
    line-height: 1.55;
    color: rgba(255,255,255,0.92);
  }

  .go {
    display: inline-block;
    margin-top: 30px;
    padding: 14px 28px;
    border-radius: 10px;
    background: #fff;
    color: var(--ink);
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
  }
  .go:hover { background: rgba(255,255,255,0.88); }
  .go:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

  .empty {
    position: relative;
    z-index: 2;
    padding: 0 48px 64px;
    color: rgba(255,255,255,0.7);
    font-size: 16px;
  }

  @media (max-width: 900px) {
    .hero { height: 68vh; min-height: 440px; }
    .inner { padding: 0 22px 40px; }
    .blurb { font-size: 18px; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>

<section class="hero" id="hero"></section>
`;

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const heroEl = root.getElementById('hero');

    // Veri gelene kadar gösterilecek örnek — anasayfa bir an bile
    // boş görünmesin diye.
    let D = {
      title: 'Santorini',
      ulke: 'Greece',
      bolge: 'Europe',
      kisaAciklama: "What's left of a volcano that blew itself apart 3,600 years ago.",
      heroImage: null,
      link: '#'
    };

    const todayLabel = () => new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Gece yarısına kalan süre — destinasyon o an değişiyor.
    let tick = null;
    const startClock = () => {
      const clockEl = root.getElementById('clock');
      if (!clockEl) return;

      const paint = () => {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0);          // bir sonraki gece yarısı
        let left = Math.max(0, Math.floor((next - now) / 1000));

        const h = String(Math.floor(left / 3600)).padStart(2, '0');
        const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
        const sec = String(left % 60).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${sec}`;

        // Sıfıra ulaşınca yeni gün başladı: sayfayı tazeleyip yeni
        // destinasyonu getir.
        if (left === 0) {
          clearInterval(tick);
          setTimeout(() => window.location.reload(), 1500);
        }
      };

      paint();
      if (tick) clearInterval(tick);
      tick = setInterval(paint, 1000);
    };

    const render = () => {
      const img = D.heroImage
        ? `<img src="${esc(D.heroImage)}" alt="${esc(D.title)}">`
        : '';
      const place = [D.ulke, D.bolge].filter(Boolean).join(', ');
      const link = D.link || '#';

      heroEl.innerHTML = img + `<div class="inner">` +
        `<div class="stamp">` +
          `<span class="tag">Destination of the day</span>` +
          `<span class="date">${esc(todayLabel())}</span>` +
          `<span class="next">Next in <span class="clock" id="clock">--:--:--</span></span>` +
        `</div>` +
        `<h1>${esc(D.title)}</h1>` +
        (place ? `<div class="place">${esc(place)}</div>` : '') +
        (D.kisaAciklama ? `<p class="blurb">${esc(D.kisaAciklama)}</p>` : '') +
        `<a class="go" href="${esc(link)}">Read the guide</a>` +
      `</div>`;

      startClock();
    };

    this._apply = (raw) => {
      try {
        const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!d) return;
        D = Object.assign({}, D, d);
        render();
      } catch (err) {
        console.error('Günün destinasyonu verisi işlenemedi:', err);
      }
    };

    this.addEventListener('message', (e) => {
      const d = e.detail !== undefined ? e.detail : e.data;
      if (d && d.type === 'DAILY_UPDATE') this._apply(d.payload);
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'DAILY_UPDATE') this._apply(e.data.payload);
    });

    render();

    const pend = this._pending || this.getAttribute('data-daily');
    if (pend) this._apply(pend);
    this._pending = null;

    this._stopClock = () => { if (tick) { clearInterval(tick); tick = null; } };
  }

  disconnectedCallback() {
    if (this._stopClock) this._stopClock();
  }
}

customElements.define('travel-home', TravelHome);
