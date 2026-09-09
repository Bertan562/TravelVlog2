// ============================================================
// travel-home.js — <travel-home>
// ------------------------------------------------------------
// Homepage hero: "Destination of the Day"
//
// masterPage.js mevcut günün destinasyonunu gönderir.
// Yarınki destinasyon hiçbir şekilde gösterilmez.
//
// Veri:
//   data-daily attribute → JSON string
//   postMessage → { type: 'DAILY_UPDATE', payload }
//
// Beklenen veri:
// {
//   title,
//   kisaAciklama,
//   ulke,
//   bolge,
//   heroImage,
//   link,
//   ortalamaPuan
// }
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

    const root = this.attachShadow({
      mode: 'open'
    });

    root.innerHTML = `

<style>

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap');

/* ============================================================
   ROOT
   ============================================================ */

:host {
  display: block;

  --paper: #e9e8e4;
  --ink: #141414;
  --mark: #16514C;

  --ui: 'Inter', system-ui, sans-serif;
  --prose: 'Newsreader', Georgia, serif;

  background: var(--paper);
  font-family: var(--ui);
}

* {
  box-sizing: border-box;
}

/* ============================================================
   HERO
   ============================================================ */

.hero {
  position: relative;

  width: 100%;
  min-height: 590px;
  height: 78vh;

  display: flex;
  align-items: flex-end;

  overflow: hidden;

  background: #24211d;
}

/* ============================================================
   HERO IMAGE
   ============================================================ */

.hero img {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transform: scale(1.001);
}

/* Daha güçlü alt gradient */
.hero::after {
  content: '';

  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      to top,
      rgba(8,8,8,0.86) 0%,
      rgba(8,8,8,0.58) 27%,
      rgba(8,8,8,0.20) 58%,
      rgba(8,8,8,0.03) 100%
    );
}

/* ============================================================
   CONTENT
   ============================================================ */

.inner {

  position: relative;

  z-index: 2;

  width: 100%;
  max-width: 1440px;

  margin: 0 auto;

  padding:
    0
    48px
    62px;

  color: #fff;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  column-gap: 50px;

  align-items: end;
}

/* ============================================================
   LEFT CONTENT
   ============================================================ */

.content {
  max-width: 760px;
}

/* ============================================================
   DESTINATION LABEL
   ============================================================ */

.label {

  display: inline-flex;

  align-items: center;

  gap: 9px;

  margin-bottom: 20px;

  font-family: var(--ui);

  font-size: 13px;

  font-weight: 600;

  letter-spacing: 0.12em;

  text-transform: uppercase;

  color: rgba(255,255,255,0.88);
}

.label::before {

  content: '';

  width: 32px;

  height: 1px;

  background: rgba(255,255,255,0.65);
}

/* ============================================================
   TITLE
   ============================================================ */

h1 {

  margin: 0;

  font-family: var(--prose);

  font-weight: 400;

  font-size:
    clamp(
      58px,
      8vw,
      112px
    );

  line-height: 0.88;

  letter-spacing: -0.035em;

  color: #fff;
}

/* ============================================================
   PLACE
   ============================================================ */

.place {

  margin-top: 20px;

  font-family: var(--ui);

  font-size: 15px;

  font-weight: 500;

  letter-spacing: 0.02em;

  color: rgba(255,255,255,0.84);
}

/* ============================================================
   DESCRIPTION
   ============================================================ */

.blurb {

  max-width: 610px;

  margin: 18px 0 0;

  font-family: var(--prose);

  font-size: 20px;

  line-height: 1.45;

  color: rgba(255,255,255,0.90);
}

/* ============================================================
   BUTTON
   ============================================================ */

.go {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  margin-top: 27px;

  padding:
    14px
    22px;

  border-radius: 7px;

  background: #fff;

  color: var(--ink);

  font-family: var(--ui);

  font-size: 13px;

  font-weight: 600;

  letter-spacing: 0.01em;

  text-decoration: none;

  transition:
    transform 180ms ease,
    background 180ms ease;
}

.go::after {

  content: '→';

  margin-left: 12px;

  font-size: 16px;

  transition: transform 180ms ease;
}

.go:hover {

  background: rgba(255,255,255,0.90);

  transform: translateY(-1px);
}

.go:hover::after {

  transform: translateX(4px);
}

.go:focus-visible {

  outline: 2px solid #fff;

  outline-offset: 4px;
}

/* ============================================================
   RIGHT DATE / COUNTDOWN
   ============================================================ */

.info {

  min-width: 245px;

  padding-left: 34px;

  border-left:
    1px solid
    rgba(255,255,255,0.35);

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  justify-content: flex-end;
}

/* ============================================================
   DATE
   ============================================================ */

.date {

  font-family: var(--ui);

  font-size: 15px;

  font-weight: 600;

  letter-spacing: 0.12em;

  color: #fff;

  white-space: nowrap;
}

/* ============================================================
   COUNTDOWN LABEL
   ============================================================ */

.next-label {

  margin-top: 32px;

  font-family: var(--ui);

  font-size: 10px;

  font-weight: 600;

  letter-spacing: 0.16em;

  text-transform: uppercase;

  color: rgba(255,255,255,0.60);
}

/* ============================================================
   COUNTDOWN
   ============================================================ */

.clock {

  margin-top: 6px;

  font-family: var(--ui);

  font-size: 31px;

  line-height: 1;

  font-weight: 500;

  letter-spacing: 0.08em;

  font-variant-numeric: tabular-nums;

  color: #fff;

  white-space: nowrap;
}

/* ============================================================
   CLOCK UNITS
   ============================================================ */

.units {

  display: flex;

  gap: 25px;

  margin-top: 7px;
}

.units span {

  font-family: var(--ui);

  font-size: 8px;

  font-weight: 500;

  letter-spacing: 0.12em;

  color: rgba(255,255,255,0.46);
}

/* ============================================================
   EMPTY
   ============================================================ */

.empty {

  position: relative;

  z-index: 2;

  padding:
    0
    48px
    64px;

  color: rgba(255,255,255,0.70);

  font-size: 16px;
}

/* ============================================================
   TABLET
   ============================================================ */

@media (max-width: 1000px) {

  .hero {

    min-height: 540px;

    height: 72vh;
  }

  .inner {

    padding:
      0
      32px
      48px;

    grid-template-columns:
      minmax(0, 1fr)
      auto;

    column-gap: 30px;
  }

  .info {

    min-width: 210px;

    padding-left: 24px;
  }

  .clock {

    font-size: 27px;
  }

}

/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 720px) {

  .hero {

    min-height: 650px;

    height: 82vh;

    align-items: flex-end;
  }

  .hero::after {

    background:
      linear-gradient(
        to top,
        rgba(8,8,8,0.92) 0%,
        rgba(8,8,8,0.68) 38%,
        rgba(8,8,8,0.12) 75%,
        rgba(8,8,8,0.02) 100%
      );
  }

  .inner {

    padding:
      0
      22px
      34px;

    display: block;
  }

  .content {

    max-width: 100%;
  }

  .label {

    margin-bottom: 17px;

    font-size: 11px;

    letter-spacing: 0.10em;
  }

  .label::before {

    width: 23px;
  }

  h1 {

    font-size:
      clamp(
        52px,
        17vw,
        82px
      );
  }

  .place {

    margin-top: 16px;

    font-size: 14px;
  }

  .blurb {

    margin-top: 15px;

    font-size: 18px;

    line-height: 1.42;
  }

  .go {

    margin-top: 23px;

    padding:
      13px
      20px;
  }

  .info {

    margin-top: 36px;

    padding:
      20px
      0
      0;

    border-left: none;

    border-top:
      1px solid
      rgba(255,255,255,0.25);

    display: grid;

    grid-template-columns:
      1fr
      auto;

    column-gap: 25px;

    align-items: end;
  }

  .date {

    grid-column: 1 / -1;

    font-size: 13px;

    letter-spacing: 0.10em;
  }

  .next-label {

    margin-top: 20px;
  }

  .clock {

    font-size: 25px;

    letter-spacing: 0.06em;
  }

  .units {

    gap: 20px;
  }

}

/* ============================================================
   SMALL MOBILE
   ============================================================ */

@media (max-width: 420px) {

  .hero {

    min-height: 680px;
  }

  h1 {

    font-size: 55px;
  }

  .blurb {

    font-size: 17px;
  }

  .clock {

    font-size: 22px;
  }

  .units {

    gap: 16px;
  }

}

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {

    transition: none !important;
  }

}

</style>


<section class="hero" id="hero"></section>

`;

    /* ============================================================
       HELPERS
       ============================================================ */

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');


    /* ============================================================
       DEFAULT DATA
       ============================================================ */

    let D = {

      title: 'Santorini',

      ulke: 'Greece',

      bolge: 'Europe',

      kisaAciklama:
        "What's left of a volcano that blew itself apart 3,600 years ago.",

      heroImage: null,

      link: '#',

      ortalamaPuan: null

    };


    const heroEl =
      root.getElementById('hero');


    /* ============================================================
       TURKEY DATE
       ============================================================ */

    const getTurkeyDateParts = () => {

      const parts =
        new Intl.DateTimeFormat(
          'en-GB',
          {
            timeZone: 'Europe/Istanbul',

            day: '2-digit',

            month: '2-digit',

            year: 'numeric'
          }
        ).formatToParts(new Date());

      const result = {};

      parts.forEach(part => {

        if (part.type !== 'literal') {

          result[part.type] =
            part.value;

        }

      });

      return result;

    };


    /* ============================================================
       EXACT DATE LABEL
       Example:
       10 SEPTEMBER 2026
       ============================================================ */

    const todayLabel = () => {

      const parts =
        new Intl.DateTimeFormat(
          'en-GB',
          {
            timeZone: 'Europe/Istanbul',

            day: '2-digit',

            month: 'long',

            year: 'numeric'
          }
        ).formatToParts(new Date());

      let day = '';
      let month = '';
      let year = '';

      parts.forEach(part => {

        if (part.type === 'day') {
          day = part.value;
        }

        if (part.type === 'month') {
          month = part.value;
        }

        if (part.type === 'year') {
          year = part.value;
        }

      });

      return `${day} ${month} ${year}`.toUpperCase();
    };


    /* ============================================================
       NEXT MIDNIGHT — EUROPE/ISTANBUL
       ============================================================ */

    const secondsUntilTurkeyMidnight = () => {

      const now = new Date();

      const parts =
        getTurkeyDateParts();

      const year =
        Number(parts.year);

      const month =
        Number(parts.month);

      const day =
        Number(parts.day);

      /*
       * Türkiye UTC+3 kullanıyor.
       *
       * Bir sonraki Türkiye gece yarısını
       * UTC üzerinden hesaplıyoruz.
       */

      const turkeyNextMidnightUTC =
        Date.UTC(
          year,
          month - 1,
          day + 1,
          0,
          0,
          0
        ) - (3 * 60 * 60 * 1000);

      return Math.max(
        0,
        Math.floor(
          (turkeyNextMidnightUTC - now.getTime()) / 1000
        )
      );
    };


    /* ============================================================
       COUNTDOWN
       ============================================================ */

    let tick = null;

    const startClock = () => {

      const clockEl =
        root.getElementById('clock');

      if (!clockEl) return;


      const paint = () => {

        let left =
          secondsUntilTurkeyMidnight();


        const h =
          String(
            Math.floor(left / 3600)
          ).padStart(2, '0');


        const m =
          String(
            Math.floor(
              (left % 3600) / 60
            )
          ).padStart(2, '0');


        const sec =
          String(
            left % 60
          ).padStart(2, '0');


        clockEl.textContent =
          `${h} : ${m} : ${sec}`;


        /*
         * Türkiye'de gece 00:00 olduğunda
         * mevcut destinasyon artık yeni güne ait değil.
         *
         * Sayfayı yenileyerek masterPage.js'den
         * yeni günün destinasyonunu alıyoruz.
         */

        if (left <= 0) {

          clearInterval(tick);

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


    /* ============================================================
       RENDER
       ============================================================ */

    const render = () => {

      const img =
        D.heroImage

          ? `<img
               src="${esc(D.heroImage)}"
               alt="${esc(D.title)}"
               loading="eager"
             >`

          : '';


      const place =
        [
          D.ulke,
          D.bolge
        ]
          .filter(Boolean)
          .join(' · ');


      const link =
        D.link || '#';


      heroEl.innerHTML =

        img +

        `

        <div class="inner">

          <div class="content">

            <div class="label">
              Destination of the day
            </div>

            <h1>
              ${esc(D.title)}
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
              D.kisaAciklama
                ? `
                  <p class="blurb">
                    ${esc(D.kisaAciklama)}
                  </p>
                `
                : ''
            }

            <a
              class="go"
              href="${esc(link)}"
            >
              Read the guide
            </a>

          </div>


          <div class="info">

            <div class="date">
              ${esc(todayLabel())}
            </div>


            <div class="next-label">
              Next destination in
            </div>


            <div
              class="clock"
              id="clock"
            >
              -- : -- : --
            </div>


            <div class="units">

              <span>HOURS</span>

              <span>MINUTES</span>

              <span>SECONDS</span>

            </div>

          </div>

        </div>

        `;


      startClock();

    };


    /* ============================================================
       APPLY DATA
       ============================================================ */

    this._apply = (raw) => {

      try {

        const d =
          typeof raw === 'string'
            ? JSON.parse(raw)
            : raw;


        if (!d) return;


        D =
          Object.assign(
            {},
            D,
            d
          );


        render();

      } catch (err) {

        console.error(
          'Günün destinasyonu verisi işlenemedi:',
          err
        );

      }

    };


    /* ============================================================
       WIX MESSAGE
       ============================================================ */

    this.addEventListener(
      'message',
      (e) => {

        const d =
          e.detail !== undefined
            ? e.detail
            : e.data;


        if (
          d &&
          d.type === 'DAILY_UPDATE'
        ) {

          this._apply(
            d.payload
          );

        }

      }
    );


    window.addEventListener(
      'message',
      (e) => {

        if (
          e.data &&
          e.data.type === 'DAILY_UPDATE'
        ) {

          this._apply(
            e.data.payload
          );

        }

      }
    );


    /* ============================================================
       INITIAL RENDER
       ============================================================ */

    render();


    const pending =
      this._pending ||
      this.getAttribute(
        'data-daily'
      );


    if (pending) {

      this._apply(
        pending
      );

    }


    this._pending = null;


    /* ============================================================
       CLEANUP
       ============================================================ */

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


customElements.define(
  'travel-home',
  TravelHome
);
