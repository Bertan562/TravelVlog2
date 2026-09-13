// guides-list.js
// TravelVlog — Guides All page grid
// Cards → Guides (Item) dynamic page: /countries/{slug}

class TravelGuidesList extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._data = {
      items: []
    };

    this._render();
  }

  static get observedAttributes() {
    return ["data-guides"];
  }

  attributeChangedCallback(name, oldValue, newValue) {

    if (name !== "data-guides") return;
    if (!newValue) return;

    try {
      const data = JSON.parse(newValue);

      if (Array.isArray(data)) {
        this._data.items = data;
      } else {
        this._data = {
          ...this._data,
          ...data
        };
      }

      this._renderData();

    } catch (error) {
      console.error("TravelGuidesList: Invalid data-guides", error);
    }
  }

  connectedCallback() {

    window.addEventListener("message", this._handleMessage.bind(this));
    this.addEventListener("message", this._handleMessage.bind(this));

    this._renderData();
  }

  disconnectedCallback() {
    window.removeEventListener("message", this._handleMessage.bind(this));
  }

  _handleMessage(event) {

    const data = event?.data;
    if (!data) return;
    if (data.type !== "GUIDES_UPDATE") return;

    const payload = data.payload || {};

    this._data = {
      items: Array.isArray(payload.items) ? payload.items : []
    };

    this._renderData();
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _image(value) {
    return value ? String(value) : "";
  }

  _renderData() {

    const items = Array.isArray(this._data.items) ? this._data.items : [];

    const grid = this.shadowRoot.querySelector(".guide-grid");
    const count = this.shadowRoot.querySelector(".guide-count");

    if (!grid || !count) return;

    count.textContent = items.length > 0 ? `${items.length} guides` : "";

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty">
          <div class="empty-title">Guides coming soon</div>
          <div class="empty-text">Country and destination guides will appear here.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = items
      .map((item) => {

        const link = item.slug
          ? `/countries/${encodeURIComponent(item.slug)}`
          : "#";

        const image = this._image(item.heroImage);
        const title = this._escape(item.title || "Guide");

        const location = this._escape(
          [item.ulke, item.bolge].filter(Boolean).join(" · ")
        );

        const desc = this._escape(item.kisaAciklama || "");

        return `
          <a class="guide-card" href="${this._escape(link)}" aria-label="${title}">
            <div class="image-wrap">
              ${
                image
                  ? `<img src="${this._escape(image)}" alt="${title}" loading="lazy" />`
                  : `<div class="image-placeholder"></div>`
              }
              <div class="image-overlay"></div>
            </div>
            <div class="card-content">
              ${location ? `<div class="location">${location}</div>` : ""}
              <h3 class="title">${title}</h3>
              ${desc ? `<p class="desc">${desc}</p>` : ""}
            </div>
          </a>
        `;
      })
      .join("");
  }

  _render() {

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap');

        :host {
          display: block;
          width: 100%;
          background: #E9E8E4;
          color: #151515;
          font-family: Inter, sans-serif;
          box-sizing: border-box;
        }

        *, *::before, *::after { box-sizing: border-box; }

        .section {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 28px 70px 64px;
        }

        .top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 30px;
        }

        .eyebrow {
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #16514C;
        }

        .heading {
          margin: 0;
          font-family: Newsreader, Georgia, serif;
          font-size: clamp(38px, 4.2vw, 64px);
          line-height: .96;
          font-weight: 400;
          letter-spacing: -.035em;
        }

        .guide-count {
          flex-shrink: 0;
          margin-bottom: 5px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          opacity: .55;
        }

        .guide-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 42px 24px;
        }

        .guide-card {
          display: block;
          color: inherit;
          text-decoration: none;
          min-width: 0;
        }

        .image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #d8d7d2;
        }

        .image-wrap img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .7s cubic-bezier(.2,.7,.2,1);
        }

        .guide-card:hover .image-wrap img { transform: scale(1.045); }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 65%, rgba(0,0,0,.12));
          pointer-events: none;
        }

        .image-placeholder { width: 100%; height: 100%; background: #d8d7d2; }

        .card-content { padding-top: 14px; }

        .location {
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #16514C;
        }

        .title {
          margin: 0;
          font-family: Newsreader, Georgia, serif;
          font-size: 22px;
          line-height: 1.08;
          font-weight: 400;
          letter-spacing: -.015em;
        }

        .desc {
          margin: 8px 0 0;
          font-size: 13px;
          line-height: 1.4;
          opacity: .65;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .empty {
          grid-column: 1 / -1;
          padding: 70px 20px;
          text-align: center;
        }

        .empty-title { font-family: Newsreader, Georgia, serif; font-size: 34px; }
        .empty-text { margin-top: 10px; font-size: 14px; opacity: .6; }

        @media (max-width: 1200px) {
          .section { padding-left: 44px; padding-right: 44px; }
          .guide-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .section { padding: 26px 22px 48px; }
          .top { align-items: flex-start; flex-direction: column; gap: 10px; margin-bottom: 24px; }
          .guide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 14px; }
          .title { font-size: 19px; }
          .location { font-size: 9px; }
        }

        @media (max-width: 480px) {
          .guide-grid { grid-template-columns: 1fr 1fr; }
          .card-content { padding-top: 11px; }
          .title { font-size: 18px; }
        }
      </style>

      <section class="section">
        <div class="top">
          <div>
            <div class="eyebrow">Guides</div>
            <h2 class="heading">All guides</h2>
          </div>
          <div class="guide-count"></div>
        </div>

        <div class="guide-grid"></div>
      </section>
    `;
  }
}

if (!customElements.get("travel-guides-list")) {
  customElements.define("travel-guides-list", TravelGuidesList);
}
