// ============================================================
// home.js — <travel-home>
// ------------------------------------------------------------
// TravelVlog — Premium "Destination of the Day" hero
//
// Veri:
//   data-daily attribute → JSON
//   postMessage          → { type: 'DAILY_UPDATE', payload }
//
// Beklenen:
//   {
//     title,
//     kisaAciklama,
//     ulke,
//     bolge,
//     heroImage,
//     link,
//     ortalamaPuan
//   }
// ============================================================

class TravelHome extends HTMLElement {

  static get observedAttributes() {
    return ['data-daily'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'data-daily' || !newVal || oldVal === newVal) return;

    if (this._built) {
      this._apply(newVal);
    } else {
      this._pending = newVal;
    }
  }

  connectedCallback() {
    if (this._built) return;

    this._built = true;

    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = `

      <style>

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&display=swap'
        );

        :host {
          display: block;

          --paper: #e9e8e4;
          --ink: #141414;
          --white: #ffffff;

          --ui:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;

          --prose:
            'Newsreader',
            Georgia,
            serif;

          width: 100%;
          background: #111;
          font-family: var(--ui);
        }

        * {
          box-sizing: border-box;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero {
          position: relative;

          width: 100%;
          height: min(820px, 82vh);
          min-height: 620px;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #18262c,
              #30271f
            );

          color: var(--white);
        }

        /* =====================================================
           IMAGE
        ===================================================== */

        .hero-image {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          object-fit: cover;

          object-position: center center;

          transform: scale(1.015);

          transition:
            transform 1.2s ease,
            opacity 0.5s ease;
        }

        .hero:hover .hero-image {
          transform: scale(1.025);
        }

        /* =====================================================
           IMAGE OVERLAYS
        ===================================================== */

        .overlay {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              90deg,
              rgba(5, 12, 17, 0.72) 0%,
              rgba(5, 12, 17, 0.46) 28%,
              rgba(5, 12, 17, 0.12) 58%,
              rgba(5, 12, 17, 0.20) 100%
            );

          pointer-events: none;
        }

        .bottom-overlay {
          position: absolute;
          inset: auto 0 0 0;

          height: 48%;

          background:
            linear-gradient(
              to top,
              rgba(0, 0, 0, 0.58),
              rgba(0, 0, 0, 0)
            );

          pointer-events: none;
        }

        /* =====================================================
           CONTENT WRAPPER
        ===================================================== */

        .hero-inner {
          position: relative;

          z-index: 5;

          width: 100%;
          max-width: 1500px;

          height: 100%;

          margin: 0 auto;

          padding:
            46px
            54px
            44px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .brand {
          display: flex;
          align-items: center;

          font-family: var(--prose);

          font-size: 21px;
          font-weight: 400;

          letter-spacing: 0.18em;

          text-transform: uppercase;

          color: rgba(255,255,255,0.95);
        }

        /* =====================================================
           MAIN CONTENT
        ===================================================== */

        .main-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            minmax(330px, 390px);

          gap: 70px;

          align-items: end;

          width: 100%;
        }

        /* =====================================================
           LEFT CONTENT
        ===================================================== */

        .copy {
          max-width: 800px;
        }

        .eyebrow {
          display: flex;

          align-items: center;

          gap: 20px;

          margin-bottom: 23px;

          font-size: 13px;
          font-weight: 500;

          letter-spacing: 0.26em;

          text-transform: uppercase;

          color: rgba(255,255,255,0.90);
        }

        .eyebrow-line {
          width: 64px;
          height: 1px;

          background:
            rgba(255,255,255,0.82);

          flex: 0 0 auto;
        }

        .title {
          margin: 0;

          font-family: var(--prose);

          font-size:
            clamp(
              74px,
              9vw,
              148px
            );

          line-height: 0.83;

          font-weight: 300;

          letter-spacing: -0.045em;

          color: #fff;

          text-wrap: balance;
        }

        .place {
          margin-top: 25px;

          font-family: var(--prose);

          font-size: 25px;

          line-height: 1.2;

          letter-spacing: 0.06em;

          color:
            rgba(255,255,255,0.90);
        }

        .description {
          max-width: 600px;

          margin:
            25px 0 0;

          font-family: var(--prose);

          font-size: 20px;

          line-height: 1.48;

          font-weight: 400;

          color:
            rgba(255,255,255,0.88);
        }

        /* =====================================================
           BUTTON
        ===================================================== */

        .guide {
          display: inline-flex;

          align-items: center;
          justify-content: space-between;

          min-width: 235px;

          margin-top: 34px;

          padding:
            17px
            20px
            17px
            24px;

          background: #fff;

          color: #151515;

          text-decoration: none;

          font-size: 12px;

          font-weight: 600;

          letter-spacing: 0.18em;

          text-transform: uppercase;

          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .guide:hover {
          transform: translateY(-2px);

          background: #f1f0ec;
        }

        .guide-arrow {
          margin-left: 35px;

          font-family:
            Arial,
            sans-serif;

          font-size: 21px;

          font-weight: 300;

          line-height: 1;
        }

        /* =====================================================
           DAILY PANEL
        ===================================================== */

        .daily-panel {
          position: relative;

          min-height: 245px;

          padding-left: 42px;

          border-left:
            1px solid
            rgba(255,255,255,0.58);

          display: flex;

          flex-direction: column;

          justify-content: flex-start;
        }

        .date {
          margin: 0 0 31px;

          font-family: var(--prose);

          font-size: 24px;

          line-height: 1.1;

          font-weight: 400;

          letter-spacing: 0.16em;

          text-transform: uppercase;

          color: #fff;
        }

        .next-label {
          margin-bottom: 12px;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 0.25em;

          text-transform: uppercase;

          color:
            rgba(255,255,255,0.72);
        }

        .countdown {
          display: flex;

          align-items: baseline;

          gap: 9px;

          white-space: nowrap;

          font-family: var(--prose);

          font-size:
            clamp(
              47px,
              4.5vw,
              70px
            );

          line-height: 0.95;

          font-weight: 300;

          letter-spacing: -0.025em;

          font-variant-numeric:
            tabular-nums;

          color: #fff;
        }

        .colon {
          opacity: 0.65;

          transform:
            translateY(-2px);
        }

        .time-labels {
          display: grid;

          grid-template-columns:
            1fr
            1fr
            1fr;

          width: 100%;

          max-width: 320px;

          margin-top: 13px;

          font-size: 9px;

          font-weight: 600;

          letter-spacing: 0.20em;

          text-transform: uppercase;

          color:
            rgba(255,255,255,0.62);
        }

        .time-labels span:nth-child(2) {
          text-align: center;
        }

        .time-labels span:nth-child(3) {
          text-align: right;
        }

        /* =====================================================
           BOTTOM INFO
        ===================================================== */

        .bottom-row {
          display: flex;

          align-items: flex-end;

          justify-content: space-between;

          gap: 30px;

          font-size: 10px;

          font-weight: 500;

          letter-spacing: 0.22em;

          text-transform: uppercase;

          color:
            rgba(255,255,255,0.70);
        }

        .bottom-left {
          display: flex;

          align-items: center;

          gap: 13px;
        }

        .bottom-slash {
          opacity: 0.45;
        }

        .scroll {
          display: flex;

          align-items: center;

          gap: 16px;
        }

        .scroll-arrow {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 32px;
          height: 32px;

          border:
            1px solid
            rgba(255,255,255,0.42);

          border-radius: 50%;

          font-size: 15px;

          line-height: 1;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .loading {
          position: absolute;

          inset: 0;

          z-index: 10;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            #1b1b19;

          color:
            rgba(255,255,255,0.7);

          font-size: 12px;

          letter-spacing: 0.20em;

          text-transform: uppercase;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1050px) {

          .hero {
            height: 760px;
          }

          .hero-inner {
            padding:
              36px
              34px
              34px;
          }

          .main-grid {
            grid-template-columns:
              minmax(0, 1fr)
              320px;

            gap: 45px;
          }

          .title {
            font-size:
              clamp(
                68px,
                10vw,
                110px
              );
          }

          .daily-panel {
            padding-left: 30px;
          }

          .date {
            font-size: 20px;
          }

          .countdown {
            font-size: 48px;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 760px) {

          .hero {
            height: auto;

            min-height: 760px;
          }

          .hero-inner {
            min-height: 760px;

            padding:
              28px
              22px
              27px;
          }

          .brand {
            font-size: 16px;

            letter-spacing: 0.16em;
          }

          .main-grid {
            display: flex;

            flex-direction: column;

            align-items: stretch;

            gap: 38px;

            margin-top: auto;

            margin-bottom: 35px;
          }

          .eyebrow {
            font-size: 10px;

            gap: 12px;

            margin-bottom: 18px;

            letter-spacing: 0.19em;
          }

          .eyebrow-line {
            width: 40px;
          }

          .title {
            font-size:
              clamp(
                62px,
                19vw,
                100px
              );

            line-height: 0.86;
          }

          .place {
            margin-top: 18px;

            font-size: 20px;
          }

          .description {
            margin-top: 18px;

            font-size: 18px;

            line-height: 1.45;
          }

          .guide {
            min-width: 210px;

            margin-top: 25px;

            padding:
              15px
              18px
              15px
              20px;
          }

          .daily-panel {
            min-height: auto;

            padding:
              25px 0 0;

            border-left: 0;

            border-top:
              1px solid
              rgba(255,255,255,0.45);
          }

          .date {
            margin-bottom: 20px;

            font-size: 17px;

            letter-spacing: 0.12em;
          }

          .next-label {
            margin-bottom: 9px;

            font-size: 9px;
          }

          .countdown {
            font-size:
              clamp(
                43px,
                13vw,
                62px
              );

            gap: 6px;
          }

          .time-labels {
            max-width: 280px;

            margin-top: 11px;
          }

          .bottom-row {
            font-size: 8px;

            letter-spacing: 0.16em;
          }

          .scroll {
            display: none;
          }
        }

        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 430px) {

          .hero {
            min-height: 720px;
          }

          .hero-inner {
            min-height: 720px;
          }

          .description {
            font-size: 17px;
          }

          .title {
            font-size: 61px;
          }

          .countdown {
            font-size: 40px;
          }

          .date {
            font-size: 15px;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .hero-image,
          .guide {
            transition: none;
          }

          .hero:hover .hero-image {
            transform: none;
          }
        }

      </style>

      <section class="hero" id="hero">

        <div class="loading" id="loading">
          TravelVlog
        </div>

      </section>
    `;

    /* ========================================================
       HELPERS
    ======================================================== */

    const esc = (value) => {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const heroEl =
      root.getElementById('hero');

    /* ========================================================
       DEFAULT DATA
       ======================================================== */

    let D = {

      title: 'Santorini',

      ulke: 'Greece',

      bolge: 'Europe',

      kisaAciklama:
        'Whitewashed villages, breathtaking sunsets and a unique island atmosphere.',

      heroImage: null,

      link: '#',

      ortalamaPuan: null
    };

    /* ========================================================
       TURKEY DATE
       ======================================================== */

    const turkeyDate = () => {

      const now = new Date();

      return new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone: 'Europe/Istanbul',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      ).format(now).toUpperCase();
    };

    /* ========================================================
       TURKEY MIDNIGHT
       ======================================================== */

    const getTurkeyNow = () => {

      const now = new Date();

      const parts =
        new Intl.DateTimeFormat(
          'en-US',
          {
            timeZone: 'Europe/Istanbul',

            year: 'numeric',
            month: '2-digit',
            day: '2-digit',

            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',

            hour12: false
          }
        ).formatToParts(now);

      const values = {};

      for (const part of parts) {
        if (part.type !== 'literal') {
          values[part.type] =
            Number(part.value);
        }
      }

      return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        second: values.second
      };
    };

    const secondsUntilTurkeyMidnight = () => {

      const t = getTurkeyNow();

      const currentSeconds =
        t.hour * 3600 +
        t.minute * 60 +
        t.second;

      return Math.max(
        0,
        86400 - currentSeconds
      );
    };

    /* ========================================================
       COUNTDOWN
       ======================================================== */

    let tick = null;

    const startClock = () => {

      const hoursEl =
        root.getElementById('hours');

      const minutesEl =
        root.getElementById('minutes');

      const secondsEl =
        root.getElementById('seconds');

      if (
        !hoursEl ||
        !minutesEl ||
        !secondsEl
      ) {
        return;
      }

      const paint = () => {

        const left =
          secondsUntilTurkeyMidnight();

        const hours =
          Math.floor(left / 3600);

        const minutes =
          Math.floor(
            (left % 3600) / 60
          );

        const seconds =
          left % 60;

        hoursEl.textContent =
          String(hours).padStart(2, '0');

        minutesEl.textContent =
          String(minutes).padStart(2, '0');

        secondsEl.textContent =
          String(seconds).padStart(2, '0');

        /*
         * Gece yarısında yeni destinasyon
         * için sayfa yenileniyor.
         */
        if (left <= 0) {

          if (tick) {
            clearInterval(tick);
            tick = null;
          }

          setTimeout(() => {

            window.location.reload();

          }, 1200);
        }
      };

      paint();

      if (tick) {
        clearInterval(tick);
      }

      tick =
        setInterval(
          paint,
          1000
        );
    };

    /* ========================================================
       RENDER
       ======================================================== */

    const render = () => {

      const title =
        D.title || 'Destination';

      const placeParts =
        [
          D.ulke,
          D.bolge
        ].filter(Boolean);

      const place =
        placeParts.join(' · ');

      const image =
        D.heroImage
          ? `
            <img
              class="hero-image"
              src="${esc(D.heroImage)}"
              alt="${esc(title)}"
              loading="eager"
              decoding="async"
            >
          `
          : '';

      const link =
        D.link || '#';

      const description =
        D.kisaAciklama || '';

      heroEl.innerHTML = `

        ${image}

        <div class="overlay"></div>

        <div class="bottom-overlay"></div>

        <div class="hero-inner">

          <!-- BRAND -->

          <div class="brand">
            TRAVELVLOG
          </div>

          <!-- MAIN -->

          <div class="main-grid">

            <!-- LEFT -->

            <div class="copy">

              <div class="eyebrow">

                <span class="eyebrow-line"></span>

                <span>
                  Destination of the day
                </span>

              </div>

              <h1 class="title">
                ${esc(title)}
              </h1>

              ${
                place
                  ? `
                    <div class="place">
                      ${esc(place)}
                    </div>
                  `
                  : ''
              }

              ${
                description
                  ? `
                    <p class="description">
                      ${esc(description)}
                    </p>
                  `
                  : ''
              }

              <a
                class="guide"
                href="${esc(link)}"
              >
                <span>
                  Read the guide
                </span>

                <span class="guide-arrow">
                  →
                </span>
              </a>

            </div>

            <!-- RIGHT DAILY PANEL -->

            <aside class="daily-panel">

              <div class="date">
                ${esc(turkeyDate())}
              </div>

              <div class="next-label">
                Next destination in
              </div>

              <div class="countdown">

                <span id="hours">
                  00
                </span>

                <span class="colon">
                  :
                </span>

                <span id="minutes">
                  00
                </span>

                <span class="colon">
                  :
                </span>

                <span id="seconds">
                  00
                </span>

              </div>

              <div class="time-labels">

                <span>
                  Hours
                </span>

                <span>
                  Minutes
                </span>

                <span>
                  Seconds
                </span>

              </div>

            </aside>

          </div>

          <!-- BOTTOM -->

          <div class="bottom-row">

            <div class="bottom-left">

              <span>
                TRAVELVLOG
              </span>

              <span class="bottom-slash">
                /
              </span>

              <span>
                DAILY DESTINATION
              </span>

            </div>

            <div class="scroll">

              <span>
                Scroll to explore
              </span>

              <span class="scroll-arrow">
                ↓
              </span>

            </div>

          </div>

        </div>
      `;

      startClock();

      const loading =
        root.getElementById('loading');

      if (loading) {
        loading.remove();
      }
    };

    /* ========================================================
       DATA APPLY
       ======================================================== */

    this._apply = (raw) => {

      try {

        const data =
          typeof raw === 'string'
            ? JSON.parse(raw)
            : raw;

        if (!data) return;

        D =
          Object.assign(
            {},
            D,
            data
          );

        render();

      } catch (error) {

        console.error(
          'TravelVlog daily destination error:',
          error
        );
      }
    };

    /* ========================================================
       MESSAGE — CUSTOM ELEMENT
       ======================================================== */

    this.addEventListener(
      'message',
      (event) => {

        const data =
          event.detail !== undefined
            ? event.detail
            : event.data;

        if (
          data &&
          data.type === 'DAILY_UPDATE'
        ) {
          this._apply(data.payload);
        }
      }
    );

    /* ========================================================
       MESSAGE — WINDOW
       ======================================================== */

    window.addEventListener(
      'message',
      (event) => {

        if (
          event.data &&
          event.data.type === 'DAILY_UPDATE'
        ) {
          this._apply(
            event.data.payload
          );
        }
      }
    );

    /* ========================================================
       INITIAL RENDER
       ======================================================== */

    render();

    const pending =
      this._pending ||
      this.getAttribute('data-daily');

    if (pending) {
      this._apply(pending);
    }

    this._pending = null;

    /* ========================================================
       CLEANUP
       ======================================================== */

    this._stopClock = () => {

      if (tick) {

        clearInterval(tick);

        tick = null;
      }
    };
  }

  disconnectedCallback() {

    if (this._stopClock) {
      this._stopClock();
    }
  }
}


/* ============================================================
   REGISTER CUSTOM ELEMENT
   ============================================================ */

customElements.define(
  'travel-home',
  TravelHome
);
