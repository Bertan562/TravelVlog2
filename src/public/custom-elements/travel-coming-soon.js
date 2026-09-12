// ============================================================
// TravelVlog — travel-coming-soon.js
// Custom Element: <travel-coming-soon>
//
// Anasayfada Guides / Experiences / Vlogs için statik "Yakında"
// bandı. Bu element HİÇBİR veri beklemez — masterPage.js'te ek
// bir setup fonksiyonuna gerek yok. Sadece Wix Editor'de bu
// custom element'i sayfaya ekleyip tag name'i "travel-coming-soon"
// olarak ayarlaman yeterli.
//
// Guides/Experiences/Vlogs sayfaları hazır olduğunda buradaki
// içerik ve rozet metinlerini güncelleyip gerçek linkler eklemek
// yeterli olacak — kart yapısı zaten <a> etiketi kullanıyor.
// ============================================================

class TravelComingSoon extends HTMLElement {

  constructor() {
    super();
    this._rendered = false;
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;

    this.attachShadow({ mode: 'open' });
    this._build();
  }

  _build() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&display=swap');

        :host {
          display: block;
          width: 100%;
          background: #111;
          color: #fff;
          font-family: 'Inter', Arial, sans-serif;
          --serif: 'Newsreader', Georgia, serif;
          --sans: 'Inter', Arial, sans-serif;
          --gold: #c9a227;
        }

        * { box-sizing: border-box; }

        .section {
          max-width: 1500px;
          margin: 0 auto;
          padding: 88px 70px 96px;
        }

        .head {
          margin-bottom: 52px;
          max-width: 640px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 16px;
          color: rgba(255,255,255,0.62);
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .eyebrow-line {
          width: 46px;
          height: 1px;
          background: rgba(255,255,255,0.35);
        }

        .heading {
          margin: 0 0 14px;
          color: #fff;
          font-family: var(--serif);
          font-size: clamp(32px, 3.2vw, 46px);
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        .sub {
          margin: 0;
          color: rgba(255,255,255,0.65);
          font-family: var(--sans);
          font-size: 15px;
          line-height: 1.5;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.14);
        }

        .card {
          position: relative;
          background: #111;
          padding: 40px 34px 36px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .icon {
          width: 34px;
          height: 34px;
          color: var(--gold);
        }

        .icon svg {
          width: 100%;
          height: 100%;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .card-title {
          margin: 0;
          color: #fff;
          font-family: var(--serif);
          font-size: 24px;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .badge {
          flex: 0 0 auto;
          padding: 5px 12px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 999px;
          color: rgba(255,255,255,0.75);
          font-family: var(--sans);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .card-desc {
          margin: 0;
          color: rgba(255,255,255,0.6);
          font-family: var(--sans);
          font-size: 13.5px;
          line-height: 1.6;
        }

        @media (max-width: 1100px) {
          .section { padding: 68px 42px 76px; }
        }

        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 760px) {
          .section { padding: 56px 22px 64px; }
          .card { padding: 32px 26px 30px; }
        }
      </style>

      <div class="section">
        <div class="head">
          <div class="eyebrow">
            <span class="eyebrow-line"></span>
            <span>More from TravelVlog</span>
          </div>
          <h2 class="heading">More ways to explore</h2>
          <p class="sub">We're building out three new sections of the site — here's a preview of what's on the way.</p>
        </div>

        <div class="grid">

          <div class="card">
            <div class="icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9.5"/>
                <path d="M15.2 8.8l-2 5.2-5.2 2 2-5.2z"/>
              </svg>
            </div>
            <div class="card-title-row">
              <h3 class="card-title">Guides</h3>
              <span class="badge">Coming soon</span>
            </div>
            <p class="card-desc">In-depth destination guides — what to pack, how to plan, and how to get the most out of every trip.</p>
          </div>

          <div class="card">
            <div class="icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/>
                <circle cx="12" cy="13.2" r="3.4"/>
              </svg>
            </div>
            <div class="card-title-row">
              <h3 class="card-title">Experiences</h3>
              <span class="badge">Coming soon</span>
            </div>
            <p class="card-desc">Curated things to do — from quiet local finds to once-in-a-lifetime adventures.</p>
          </div>

          <div class="card">
            <div class="icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5.5" width="14" height="13" rx="1.5"/>
                <path d="M17 9.5l4-2.3v9.6l-4-2.3"/>
              </svg>
            </div>
            <div class="card-title-row">
              <h3 class="card-title">Vlogs</h3>
              <span class="badge">Coming soon</span>
            </div>
            <p class="card-desc">Real trips, real footage — follow along as we explore new destinations on video.</p>
          </div>

        </div>
      </div>
    `;
  }
}

if (!customElements.get('travel-coming-soon')) {
  customElements.define('travel-coming-soon', TravelComingSoon);
}
