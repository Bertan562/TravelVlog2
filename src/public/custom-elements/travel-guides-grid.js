// travel-guides-grid.js
// TravelVlog — Homepage Guides Grid
// Cards → Guide (Item) dynamic page: /countries/{slug}
// View all → /guides-all
//
// Visual pattern mirrors the "Explore all destinations" homepage
// section: image, then title (serif), then location caption below
// in a muted tone.

class TravelGuidesGrid extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._data = {
      items: [],
      viewAllLink: "/guides-all"
    };

    this._render();
  }

  static get observedAttributes() {
    return ["data-guides-grid"];
  }

  attributeChangedCallback(name, oldValue, newValue) {

    if (name !== "data-guides-grid") return;
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
      console.error("TravelGuidesGrid: Invalid data-guides-grid", error);
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
    if (data.type !== "GUIDES_GRID_UPDATE") return;

    const payload = data.payload || {};

    this._data = {
      items: Array.isArray(payload.items) ? payload.items : [],
      viewAllLink: payload.viewAllLink || "/guides-all"
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

    const items = Array.isArray(this._data.items)
      ? this._data.items.slice(0, 15)
      : [];

    const viewAllLink = this._data.viewAllLink || "/guides-all";

    const grid = this.shadowRoot.querySelector(".guide-grid");
    const count = this.shadowRoot.querySelector(".guide-count");
    const viewAll = this.shadowRoot.querySelector(".view-all");

    if (!grid || !count || !viewAll) return;

    count.textContent = items.length > 0 ? `${items.length} guides` : "";

    viewAll.href = viewAllLink;

    if (!items.length) {

      grid.innerHTML = `
        <div class="empty">
          <div class="empty-title">Guides coming soon</div>
          <div class="empty-text">
            Country and destination guides will appear here.
          </div>
        </div>
      `;

      return;
    }

    grid.innerHTML = items
      .map((item) => {

        const link = item.link || "#";
        const image = this._image(item.heroImage);
        const title = this._escape(item.title || "Guide");

        const location = this._escape(
          [item.ulke, item.bolge].filter(Boolean).join(" · ")
        );

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
              <h3 class="title">${title}</h3>
              ${location ? `<div class="location">${location}</div>` : ""}
            </div>
          </a>
        `;
      })
      .join("");
  }

  _render() {

    this.shadowRoot.innerHTML = `

      <style>

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap'
        );

        :host {
          display: block;
          width: 100%;
          background: #E9E8E4;
          color: #151515;
          font-family: Inter, sans-serif;
          box-sizing: border-box;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

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
          line-height: 1;
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

        .guide-card:hover .image-wrap img {
          transform: scale(1.045);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0) 65%,
            rgba(0,0,0,.12)
          );
          pointer-events: none;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          background: #d8d7d2;
        }

        .card-content {
          padding-top: 14px;
        }

        .title {
          margin: 0;
          font-family: Newsreader, Georgia, serif;
          font-size: 22px;
          line-height: 1.08;
          font-weight: 400;
          letter-spacing: -.015em;
        }

        .location {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #16514C;
        }

        .view-all-wrap {
          display: flex;
          justify-content: center;
          padding-top: 48px;
        }

        .view-all {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 245px;
          min-height: 52px;
          padding: 0 28px;
          border: 1px solid #151515;
          color: #151515;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          transition: background .25s ease, color .25s ease;
        }

        .view-all:hover {
          background: #151515;
          color: #E9E8E4;
        }

        .empty {
          grid-column: 1 / -1;
          padding: 70px 20px;
          text-align: center;
        }

        .empty-title {
          font-family: Newsreader, Georgia, serif;
          font-size: 34px;
        }

        .empty-text {
          margin-top: 10px;
          font-size: 14px;
          opacity: .6;
        }

        @media (max-width: 1200px) {

          .section {
            padding-left: 44px;
            padding-right: 44px;
          }

          .guide-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {

          .section {
            padding: 26px 22px 48px;
          }

          .top {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 24px;
          }

          .guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 32px 14px;
          }

          .title {
            font-size: 19px;
          }

          .view-all-wrap {
            padding-top: 38px;
          }
        }

        @media (max-width: 480px) {

          .guide-grid {
            grid-template-columns: 1fr 1fr;
          }

          .image-wrap {
            aspect-ratio: 4 / 5;
          }

          .card-content {
            padding-top: 11px;
          }

          .title {
            font-size: 18px;
          }
        }

      </style>

      <section class="section">

        <div class="top">

          <div>

            <div class="eyebrow">
              Guides
            </div>

            <h2 class="heading">
              Explore all guides
            </h2>

          </div>

          <div class="guide-count"></div>

        </div>

        <div class="guide-grid"></div>

        <div class="view-all-wrap">

          <a class="view-all" href="/guides-all">
            View all guides
          </a>

        </div>

      </section>

    `;
  }
}

if (!customElements.get("travel-guides-grid")) {

  customElements.define(
    "travel-guides-grid",
    TravelGuidesGrid
  );

}
