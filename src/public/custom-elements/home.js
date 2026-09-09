// ============================================================
// TravelVlog — home.js
// Custom Element: <travel-home>
//
// Wix Velo masterPage.js tarafından gönderilen:
// DAILY_UPDATE
//
// Beklenen veri:
// {
//   title,
//   ulke,
//   bolge,
//   kisaAciklama,
//   heroImage,
//   link,
//   ortalamaPuan
// }
// ============================================================

class TravelHome extends HTMLElement {

  static get observedAttributes() {
    return ['data-daily'];
  }

  constructor() {
    super();

    this._data = null;
    this._clock = null;
    this._rendered = false;
  }

  connectedCallback() {

    if (this._rendered) return;

    this._rendered = true;

    this.attachShadow({
      mode: 'open'
    });

    this._build();

    // Wix attribute ile veri geldiyse
    const initialData =
      this.getAttribute('data-daily');

    if (initialData) {
      this._apply(initialData);
    }

    // Wix postMessage
    this.addEventListener('message', (event) => {

      const message =
        event.detail || event.data;

      if (
        message &&
        message.type === 'DAILY_UPDATE'
      ) {
        this._apply(message.payload);
      }

    });

    // Window message
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

  }

  attributeChangedCallback(
    name,
    oldValue,
    newValue
  ) {

    if (
      name === 'data-daily' &&
      newValue &&
      newValue !== oldValue
    ) {

      this._apply(newValue);

    }

  }

  // ==========================================================
  // BUILD
  // ==========================================================

  _build() {

    this.shadowRoot.innerHTML = `

      <style>

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&display=swap'
        );

        :host {
          display: block;

          width: 100%;

          margin: 0;
          padding: 0;

          background: #111;

          color: #fff;

          font-family:
            'Inter',
            Arial,
            sans-serif;

          --serif:
            'Newsreader',
            Georgia,
            serif;

          --sans:
            'Inter',
            Arial,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        /* ======================================================
           HERO
        ====================================================== */

        .hero {

          position: relative;

          width: 100%;

          height: 78vh;

          min-height: 650px;

          max-height: 900px;

          overflow: hidden;

          background:
            #1b1b19;

        }

        /* ======================================================
           IMAGE
        ====================================================== */

        .hero-image {

          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          object-fit: cover;

          object-position: center;

          transform: scale(1.01);

          opacity: 0;

          transition:
            opacity 0.6s ease,
            transform 1.4s ease;

        }

        .hero.ready .hero-image {

          opacity: 1;

        }

        .hero:hover .hero-image {

          transform: scale(1.025);

        }

        /* ======================================================
           DARK OVERLAY
        ====================================================== */

        .hero-overlay {

          position: absolute;

          inset: 0;

          background:

            linear-gradient(
              90deg,
              rgba(0,0,0,0.67) 0%,
              rgba(0,0,0,0.42) 25%,
              rgba(0,0,0,0.12) 58%,
              rgba(0,0,0,0.08) 100%
            );

          pointer-events: none;

        }

        .hero-bottom {

          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 42%;

          background:

            linear-gradient(
              to top,
              rgba(0,0,0,0.58),
              rgba(0,0,0,0)
            );

          pointer-events: none;

        }

        /* ======================================================
           MAIN WRAPPER
        ====================================================== */

        .container {

          position: relative;

          z-index: 5;

          width: 100%;

          max-width: 1500px;

          height: 100%;

          margin: 0 auto;

          padding:
            38px 70px 38px;

          display: flex;

          flex-direction: column;

          justify-content: space-between;

        }

        /* ======================================================
           DESTINATION CONTENT
        ====================================================== */

        .content {

          margin-top: auto;

          margin-bottom: 32px;

          max-width: 760px;

        }

        /* ======================================================
           EYEBROW
        ====================================================== */

        .eyebrow {

          display: flex;

          align-items: center;

          gap: 22px;

          margin-bottom: 24px;

          color:
            rgba(255,255,255,0.92);

          font-family: var(--sans);

          font-size: 12px;

          font-weight: 600;

          letter-spacing:
            0.30em;

          text-transform:
            uppercase;

        }

        .eyebrow-line {

          width: 70px;

          height: 1px;

          flex: 0 0 auto;

          background:
            rgba(255,255,255,0.78);

        }

        /* ======================================================
           TITLE
        ====================================================== */

        .title {

          margin: 0;

          padding: 0;

          color: #fff;

          font-family: var(--serif);

          font-size:
            clamp(
              88px,
              10vw,
              154px
            );

          font-weight: 300;

          line-height:
            0.78;

          letter-spacing:
            -0.055em;

          text-shadow:
            0 2px 20px
            rgba(0,0,0,0.10);

        }

        /* ======================================================
           LOCATION
        ====================================================== */

        .location {

          margin-top: 30px;

          color:
            rgba(255,255,255,0.96);

          font-family: var(--serif);

          font-size: 28px;

          font-weight: 400;

          line-height: 1;

          letter-spacing:
            0.045em;

        }

        .location-dot {

          display: inline-block;

          margin:
            0 8px;

        }

        /* ======================================================
           DESCRIPTION
        ====================================================== */

        .description {

          max-width: 650px;

          margin:
            27px 0 0;

          color:
            rgba(255,255,255,0.93);

          font-family: var(--serif);

          font-size: 21px;

          line-height: 1.42;

          font-weight: 400;

          text-shadow:
            0 1px 8px
            rgba(0,0,0,0.25);

        }

        /* ======================================================
           GUIDE BUTTON
        ====================================================== */

        .guide {

          display: inline-flex;

          align-items: center;

          justify-content:
            space-between;

          min-width: 295px;

          height: 61px;

          margin-top: 34px;

          padding:
            0 24px 0 27px;

          background: #fff;

          color: #151515;

          text-decoration: none;

          font-family: var(--sans);

          font-size: 12px;

          font-weight: 600;

          letter-spacing:
            0.20em;

          text-transform:
            uppercase;

          transition:
            transform .25s ease,
            background .25s ease;

        }

        .guide:hover {

          transform:
            translateY(-2px);

          background:
            #f0efeb;

        }

        .guide-arrow {

          font-family:
            Arial,
            sans-serif;

          font-size: 25px;

          font-weight: 300;

          line-height: 1;

        }

        /* ======================================================
           DAILY PANEL
        ====================================================== */

        .daily-panel {

          position: absolute;

          top: 72px;

          right: 70px;

          width: 350px;

          min-height: 225px;

          padding-left: 45px;

          border-left:
            1px solid
            rgba(255,255,255,0.72);

        }

        /* ======================================================
           DATE
        ====================================================== */

        .date {

          margin: 0 0 34px;

          color: #fff;

          font-family: var(--serif);

          font-size: 20px;

          font-weight: 400;

          letter-spacing:
            0.22em;

          text-transform:
            uppercase;

          white-space:
            nowrap;

        }

        /* ======================================================
           NEXT
        ====================================================== */

        .next {

          margin-bottom: 12px;

          color:
            rgba(255,255,255,0.82);

          font-family: var(--sans);

          font-size: 11px;

          font-weight: 600;

          letter-spacing:
            0.28em;

          text-transform:
            uppercase;

        }

        /* ======================================================
           COUNTDOWN
        ====================================================== */

        .countdown {

          display: flex;

          align-items:
            baseline;

          gap: 8px;

          color: #fff;

          font-family: var(--serif);

          font-size:
            clamp(
              50px,
              4.2vw,
              67px
            );

          font-weight: 300;

          line-height: .95;

          letter-spacing:
            -0.025em;

          white-space:
            nowrap;

          font-variant-numeric:
            tabular-nums;

        }

        .colon {

          opacity: .75;

        }

        /* ======================================================
           TIME LABELS
        ====================================================== */

        .labels {

          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          width: 100%;

          margin-top: 13px;

          color:
            rgba(255,255,255,0.78);

          font-family: var(--sans);

          font-size: 8px;

          font-weight: 600;

          letter-spacing:
            0.22em;

          text-transform:
            uppercase;

        }

        .labels span:nth-child(2) {

          text-align:
            center;

        }

        .labels span:nth-child(3) {

          text-align:
            right;

        }

        /* ======================================================
           BOTTOM BAR
        ====================================================== */

        .bottom {

          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          width: 100%;

          color:
            rgba(255,255,255,0.83);

          font-family: var(--sans);

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.24em;

          text-transform:
            uppercase;

        }

        .bottom-left {

          display: flex;

          align-items: center;

          gap: 14px;

        }

        .slash {

          opacity: .45;

        }

        /* ======================================================
           SCROLL
        ====================================================== */

        .scroll {

          display: flex;

          align-items: center;

          gap: 16px;

        }

        .scroll-circle {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 38px;

          height: 38px;

          border:
            1px solid
            rgba(255,255,255,0.72);

          border-radius: 50%;

          font-family:
            Arial,
            sans-serif;

          font-size: 17px;

          font-weight: 300;

        }

        /* ======================================================
           LOADING
        ====================================================== */

        .loading {

          position: absolute;

          inset: 0;

          z-index: 20;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            #171715;

          color:
            rgba(255,255,255,.75);

          font-family: var(--sans);

          font-size: 11px;

          letter-spacing:
            .28em;

          text-transform:
            uppercase;

        }

        .loading.hidden {

          display: none;

        }

        /* ======================================================
           TABLET
        ====================================================== */

        @media (max-width: 1100px) {

          .container {

            padding:
              35px 42px 34px;

          }

          .daily-panel {

            right: 42px;

            width: 330px;

          }

          .title {

            font-size:
              clamp(
                76px,
                10vw,
                120px
              );

          }

        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 760px) {

          .hero {

            height: 790px;

            min-height: 790px;

          }

          .container {

            padding:
              28px 22px 25px;

          }

          .hero-overlay {

            background:

              linear-gradient(
                90deg,
                rgba(0,0,0,.66),
                rgba(0,0,0,.20)
              );

          }

          .content {

            margin-bottom:
              160px;

          }

          .eyebrow {

            gap: 13px;

            margin-bottom: 20px;

            font-size: 9px;

            letter-spacing:
              .20em;

          }

          .eyebrow-line {

            width: 42px;

          }

          .title {

            font-size:
              clamp(
                66px,
                20vw,
                100px
              );

            line-height:
              .84;

          }

          .location {

            margin-top: 21px;

            font-size: 21px;

          }

          .description {

            margin-top: 19px;

            font-size: 17px;

            line-height: 1.45;

            max-width:
              92%;

          }

          .guide {

            min-width: 220px;

            height: 56px;

            margin-top: 25px;

            padding:
              0 19px 0 21px;

          }

          .daily-panel {

            top: auto;

            right: 22px;

            bottom: 83px;

            left: 22px;

            width: auto;

            min-height: 0;

            padding:
              20px 0 0;

            border-left: 0;

            border-top:
              1px solid
              rgba(255,255,255,.55);

          }

          .date {

            margin-bottom: 18px;

            font-size: 15px;

            letter-spacing:
              .16em;

          }

          .next {

            font-size: 8px;

            margin-bottom: 9px;

          }

          .countdown {

            font-size:
              clamp(
                42px,
                13vw,
                59px
              );

            gap: 5px;

          }

          .labels {

            max-width: 280px;

          }

          .bottom {

            font-size: 7px;

            letter-spacing:
              .16em;

          }

          .scroll {

            display: none;

          }

        }

        /* ======================================================
           SMALL MOBILE
        ====================================================== */

        @media (max-width: 430px) {

          .hero {

            height: 740px;

            min-height: 740px;

          }

          .content {

            margin-bottom:
              145px;

          }

          .title {

            font-size:
              64px;

          }

          .description {

            font-size: 16px;

          }

          .countdown {

            font-size: 39px;

          }

          .date {

            font-size: 14px;

          }

        }

        /* ======================================================
           REDUCED MOTION
        ====================================================== */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .hero-image {

            transition:
              opacity .3s ease;

            transform:
              none !important;

          }

          .guide {

            transition:
              none;

          }

        }

      </style>

      <section class="hero">

        <div class="loading">
          TRAVELVLOG
        </div>

        <div class="hero-overlay"></div>

        <div class="hero-bottom"></div>

        <div class="container">

          <!-- ================================================
               MAIN DESTINATION
          ================================================= -->

          <div class="content">

            <div class="eyebrow">

              <span class="eyebrow-line"></span>

              <span>
                Destination of the day
              </span>

            </div>

            <h1 class="title">
              Destination
            </h1>

            <div class="location">

              <span class="country">
                —
              </span>

              <span class="location-dot">
                ·
              </span>

              <span class="region">
                —
              </span>

            </div>

            <p class="description">
              Discover today's destination.
            </p>

            <a
              class="guide"
              href="#"
            >

              <span>
                Read the guide
              </span>

              <span class="guide-arrow">
                →
              </span>

            </a>

          </div>

          <!-- ================================================
               DAILY COUNTDOWN
          ================================================= -->

          <aside class="daily-panel">

            <div class="date">
              10 SEPTEMBER 2026
            </div>

            <div class="next">
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

            <div class="labels">

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

          <!-- ================================================
               BOTTOM
          ================================================= -->

          <div class="bottom">

            <div class="bottom-left">

              <span>
                TRAVELVLOG
              </span>

              <span class="slash">
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

              <span class="scroll-circle">
                ↓
              </span>

            </div>

          </div>

        </div>

      </section>
    `;

  }

  // ==========================================================
  // APPLY DATA
  // ==========================================================

  _apply(raw) {

    try {

      const data =
        typeof raw === 'string'
          ? JSON.parse(raw)
          : raw;

      if (!data) return;

      this._data = {
        title:
          data.title ||
          'Destination',

        ulke:
          data.ulke ||
          '',

        bolge:
          data.bolge ||
          '',

        kisaAciklama:
          data.kisaAciklama ||
          '',

        heroImage:
          data.heroImage ||
          '',

        link:
          data.link ||
          '#',

        ortalamaPuan:
          data.ortalamaPuan ||
          null
      };

      this._renderData();

    } catch (error) {

      console.error(
        'TravelHome data error:',
        error
      );

    }

  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  _escape(value) {

    return String(
      value == null
        ? ''
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }

  // ==========================================================
  // DATE — TURKEY
  // ==========================================================

  _getTurkeyDate() {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          'Europe/Istanbul',

        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric'
      }
    )
      .format(new Date())
      .toUpperCase();

  }

  // ==========================================================
  // TURKEY TIME
  // ==========================================================

  _getTurkeyParts() {

    const parts =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone:
            'Europe/Istanbul',

          hour:
            '2-digit',

          minute:
            '2-digit',

          second:
            '2-digit',

          hour12:
            false
        }
      )
        .formatToParts(
          new Date()
        );

    const result = {};

    parts.forEach(
      (part) => {

        if (
          part.type !==
          'literal'
        ) {

          result[part.type] =
            Number(part.value);

        }

      }
    );

    return result;

  }

  // ==========================================================
  // SECONDS TO MIDNIGHT
  // ==========================================================

  _secondsToMidnight() {

    const time =
      this._getTurkeyParts();

    const current =
      (time.hour * 3600) +
      (time.minute * 60) +
      time.second;

    return Math.max(
      0,
      86400 - current
    );

  }

  // ==========================================================
  // COUNTDOWN
  // ==========================================================

  _startCountdown() {

    if (this._clock) {

      clearInterval(
        this._clock
      );

    }

    const hours =
      this.shadowRoot.getElementById(
        'hours'
      );

    const minutes =
      this.shadowRoot.getElementById(
        'minutes'
      );

    const seconds =
      this.shadowRoot.getElementById(
        'seconds'
      );

    if (
      !hours ||
      !minutes ||
      !seconds
    ) {
      return;
    }

    const update = () => {

      const remaining =
        this._secondsToMidnight();

      const h =
        Math.floor(
          remaining / 3600
        );

      const m =
        Math.floor(
          (remaining % 3600) / 60
        );

      const s =
        remaining % 60;

      hours.textContent =
        String(h)
          .padStart(2, '0');

      minutes.textContent =
        String(m)
          .padStart(2, '0');

      seconds.textContent =
        String(s)
          .padStart(2, '0');

      /*
       * Saat 00:00 olduğunda
       * yeni günlük destinasyonu
       * almak için sayfayı yenile.
       */

      if (remaining <= 0) {

        clearInterval(
          this._clock
        );

        this._clock = null;

        setTimeout(
          () => {

            window.location.reload();

          },
          1000
        );

      }

    };

    update();

    this._clock =
      setInterval(
        update,
        1000
      );

  }

  // ==========================================================
  // RENDER DATA
  // ==========================================================

  _renderData() {

    if (!this._data) return;

    const data =
      this._data;

    const root =
      this.shadowRoot;

    const hero =
      root.querySelector(
        '.hero'
      );

    const content =
      root.querySelector(
        '.content'
      );

    if (!hero || !content) {
      return;
    }

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    const oldImage =
      root.querySelector(
        '.hero-image'
      );

    if (oldImage) {
      oldImage.remove();
    }

    if (data.heroImage) {

      const image =
        document.createElement(
          'img'
        );

      image.className =
        'hero-image';

      image.src =
        data.heroImage;

      image.alt =
        data.title;

      image.loading =
        'eager';

      image.decoding =
        'async';

      image.onload =
        () => {

          hero.classList.add(
            'ready'
          );

        };

      image.onerror =
        () => {

          hero.classList.add(
            'ready'
          );

        };

      hero.prepend(
        image
      );

    } else {

      hero.classList.add(
        'ready'
      );

    }

    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    const title =
      root.querySelector(
        '.title'
      );

    if (title) {

      title.textContent =
        data.title;

    }

    // --------------------------------------------------------
    // COUNTRY
    // --------------------------------------------------------

    const country =
      root.querySelector(
        '.country'
      );

    if (country) {

      country.textContent =
        data.ulke ||
        '';

    }

    // --------------------------------------------------------
    // REGION
    // --------------------------------------------------------

    const region =
      root.querySelector(
        '.region'
      );

    if (region) {

      region.textContent =
        data.bolge ||
        '';

    }

    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    const location =
      root.querySelector(
        '.location'
      );

    if (location) {

      if (
        !data.ulke &&
        !data.bolge
      ) {

        location.style.display =
          'none';

      } else {

        location.style.display =
          '';

      }

    }

    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    const description =
      root.querySelector(
        '.description'
      );

    if (description) {

      description.textContent =
        data.kisaAciklama ||
        '';

      description.style.display =
        data.kisaAciklama
          ? ''
          : 'none';

    }

    // --------------------------------------------------------
    // LINK
    // --------------------------------------------------------

    const guide =
      root.querySelector(
        '.guide'
      );

    if (guide) {

      guide.href =
        data.link ||
        '#';

    }

    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------

    const date =
      root.querySelector(
        '.date'
      );

    if (date) {

      date.textContent =
        this._getTurkeyDate();

    }

    // --------------------------------------------------------
    // COUNTDOWN
    // --------------------------------------------------------

    this._startCountdown();

    // --------------------------------------------------------
    // REMOVE LOADING
    // --------------------------------------------------------

    const loading =
      root.querySelector(
        '.loading'
      );

    if (loading) {

      loading.classList.add(
        'hidden'
      );

    }

  }

  // ==========================================================
  // CLEANUP
  // ==========================================================

  disconnectedCallback() {

    if (this._clock) {

      clearInterval(
        this._clock
      );

      this._clock = null;

    }

  }

}


// ============================================================
// CUSTOM ELEMENT REGISTER
// ============================================================

if (
  !customElements.get(
    'travel-home'
  )
) {

  customElements.define(
    'travel-home',
    TravelHome
  );

}
