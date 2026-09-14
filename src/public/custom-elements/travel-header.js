// ===================================================================
// travel-header.js
//
// ALL SITE URLS LIVE IN ONE PLACE — edit ROUTES below if a page URL
// changes in Wix, and every link in the header and mega menu follows.
// ===================================================================

// Wix Studio's staging domain serves the site under an extra path
// segment (e.g. https://darkworld55.wixstudio.com/travelvlog/...).
// A future custom domain will not have this segment. Compute it once
// at load time so every route below resolves correctly in both cases.
const BASE_PATH = (() => {
  if (window.location.hostname.endsWith('wixstudio.com')) {
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    return seg ? '/' + seg : '';
  }
  return '';
})();

const ROUTES = {
  home: BASE_PATH + '/',
  destinations: BASE_PATH + '/destinations-all',
  experiences: BASE_PATH + '/experiences-all',
  guides: BASE_PATH + '/guides-all',
  vlogs: BASE_PATH + '/vlogs-all',
  createVlog: BASE_PATH + '/createvlog',
  myVlogs: BASE_PATH + '/my-vlogs',
  profile: BASE_PATH + '/profile'
};

class TravelHeader extends HTMLElement {
  static get observedAttributes() {
    return ['data-menu-topics', 'data-member-state'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || newVal === oldVal) return;
    if (!this._built) {
      (this._pending = this._pending || {})[name] = newVal;
      return;
    }
    this._handleAttribute(name, newVal);
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = this._template();
    this._root = root;
    this._setup();

    if (this._pending) {
      Object.keys(this._pending).forEach((k) => this._handleAttribute(k, this._pending[k]));
      this._pending = null;
    }
  }

  _template() {
    return `
<style>
  :host { display: block; }
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .stack { font-family: 'Inter', system-ui, sans-serif; width: 1280px; max-width: 100%; margin: 0 auto; background: #e9e8e4; position: relative; }
  a { color: #141414; text-decoration: none; }
  a:hover { opacity: 0.65; }
  button.navlink {
    font-family: inherit; background: none; border: 0; padding: 0;
    color: #141414; cursor: pointer; font-size: 15px; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
  }
  button.navlink:hover { opacity: 0.65; }

  #headerRow { position: relative; }

  .logo-link { display: flex; align-items: center; gap: 10px; }
  .logo-link:hover { opacity: 0.8; }

  .caret { width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #141414; opacity: 0.6; }
  .pill { background: #141414; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px; }

  .authbtn {
    font-family: inherit; background: none; border: 0; padding: 0; cursor: pointer;
    font-size: 14px; font-weight: 500; white-space: nowrap; color: #141414;
  }
  .authbtn:hover { opacity: 0.65; }
  .cta {
    border: 1px solid #141414; color: #141414; font-size: 14px; font-weight: 600;
    padding: 10px 21px; border-radius: 8px; white-space: nowrap;
    background: none; font-family: inherit; cursor: pointer;
  }
  .cta.solid { background: #141414; color: #fff; border-color: #141414; }

  .backdrop {
    position: fixed; inset: 0; background: rgba(20,20,20,0.32);
    opacity: 0; visibility: hidden; pointer-events: none;
    transition: opacity 0.22s ease, visibility 0.22s; z-index: 9998;
  }
  .backdrop.open { opacity: 1; visibility: visible; pointer-events: auto; }

  .mega {
    position: fixed; background: #ffffff; border-radius: 20px;
    box-shadow: 0 24px 48px rgba(20,20,20,0.16); z-index: 10001;
    display: flex; align-items: stretch;
    opacity: 0; visibility: hidden; pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    overflow: hidden;
  }
  .mega.open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0); }

  .mega-tabs-col {
    flex: 0 0 200px; padding: 28px 16px 28px 30px;
    display: flex; flex-direction: column; gap: 2px;
    border-right: 1px solid rgba(20,20,20,0.08);
    background: #ffffff; position: relative; z-index: 2;
  }
  .mega-tab {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 8px;
    font-size: 14.5px; font-weight: 500; color: #141414; cursor: pointer;
  }
  .mega-tab:hover { background: #f4f3ef; opacity: 1; }
  .mega-tab.active { background: #141414; color: #fff; font-weight: 600; }
  .mega-tab.active .ico { opacity: 1; }
  .mega-tab .ico { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.55; }

  .mega-columns-viewport { position: relative; flex: 1 1 auto; min-width: 0; overflow: hidden; }
  .mega-columns { display: flex; align-items: stretch; height: 100%; overflow-x: hidden; scroll-behavior: smooth; }

  .mega-col {
    flex: 1 1 480px; min-width: 480px; overflow: hidden;
    padding: 28px 24px; border-right: 1px solid rgba(20,20,20,0.08);
    animation: slideIn 0.2s ease;
  }
  .mega-col:last-child { border-right: none; }
  .mega-col.search-col { flex: 1 1 auto; min-width: 480px; }

  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

  .mega-col-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .mega-col-label {
    font-size: 12px; font-weight: 600; color: #141414; opacity: 0.45;
    text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap;
  }
  .mega-col-all { font-size: 13px; font-weight: 600; color: #141414; white-space: nowrap; }

  .gallery { position: relative; }
  .gallery-track { display: flex; gap: 12px; overflow-x: hidden; scroll-behavior: smooth; padding: 2px 2px 6px; }
  .gallery-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 28px; height: 28px; border-radius: 50%;
    background: #ffffff; border: 1px solid rgba(20,20,20,0.1);
    box-shadow: 0 2px 8px rgba(20,20,20,0.16);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; color: #141414; cursor: pointer; z-index: 4;
  }
  .gallery-arrow:hover { background: #f4f3ef; }
  .gallery-arrow.left { left: -4px; }
  .gallery-arrow.right { right: -4px; }

  .gallery-track .empty { font-size: 14px; color: #141414; opacity: 0.5; padding: 20px 0; white-space: nowrap; }
  .gallery-track a.card {
    flex: 0 0 220px; width: 220px; height: 350px;
    display: flex; flex-direction: column;
    background: #f4f3ef; border-radius: 12px; padding: 10px; color: #141414;
  }
  .gallery-track a.card img { width: 100%; height: 230px; object-fit: cover; border-radius: 8px; display: block; margin-bottom: 12px; }
  .gallery-track a.card .card-title { font-size: 14px; font-weight: 600; display: block; line-height: 1.3; }
  .gallery-track a.card .count { font-size: 12px; font-weight: 500; color: #141414; opacity: 0.45; display: block; margin-top: 4px; }

  /* Mobile: compact single-row header (logo + hamburger + search
     icon) instead of stacking everything, which took up too much
     vertical space. Nav links and auth buttons live in a drawer
     toggled by JS classes on #headerContent. Inline styles need
     !important here since they'd otherwise win over this stylesheet. */
  @media (max-width: 880px) {
    .stack { width: 100%; }
    #headerRow { padding: 16px 20px !important; }
    #headerContent {
      flex-wrap: wrap !important;
      row-gap: 0 !important;
      justify-content: space-between !important;
    }
    #headerContent > div:first-child { gap: 0 !important; }
    #mobileSearchBtn, #mobileMenuBtn { display: flex !important; }
    #navLinksRow, #searchBox, #authOut, #authIn { display: none !important; }

    #headerContent.mobile-nav-open #navLinksRow {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
      width: 100%;
      order: 20;
      padding-top: 14px;
      border-top: 1px solid rgba(20,20,20,0.08);
    }
    #headerContent.mobile-nav-open #navLinksRow .navlink { padding: 8px 0; }

    /* :not([style*="none"]) lets the existing login-state logic
       (which sets authOut/authIn's inline display via JS) keep
       deciding WHICH one shows — this only reveals whichever one
       isn't already hidden, instead of forcing both open. */
    #headerContent.mobile-nav-open #authOut:not([style*="none"]),
    #headerContent.mobile-nav-open #authIn:not([style*="none"]) {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
      width: 100%;
      order: 21;
      padding-top: 10px;
    }
    #headerContent.mobile-nav-open #authOut:not([style*="none"]) .cta,
    #headerContent.mobile-nav-open #authIn:not([style*="none"]) .cta { width: 100%; text-align: center; }

    #headerContent.mobile-search-open #searchBox {
      display: flex !important;
      width: 100%;
      max-width: 100% !important;
      flex: 1 1 100% !important;
      order: 19;
      margin-top: 14px;
    }

    /* Mega menu: stack tabs above content instead of side-by-side,
       and drop the fixed min-widths that were built for desktop —
       those are what caused the panel to overflow off-screen. */
    .mega {
      flex-direction: column !important;
      left: 12px !important;
      right: 12px !important;
      width: auto !important;
      max-height: 70vh;
      overflow-y: auto;
    }
    .mega-tabs-col {
      flex: 0 0 auto !important;
      flex-direction: row !important;
      flex-wrap: wrap;
      gap: 6px !important;
      padding: 16px 16px 12px !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(20,20,20,0.08);
    }
    .mega-tab { padding: 8px 12px !important; font-size: 13px !important; }
    .mega-columns-viewport { width: 100%; }
    .mega-col {
      flex: 1 1 100% !important;
      min-width: 0 !important;
      padding: 16px !important;
    }
    .mega-col.search-col { min-width: 0 !important; }
    .gallery-track a.card { flex: 0 0 160px; width: 160px; height: 260px; }
    .gallery-track a.card img { height: 150px; }
  }
</style>

<div class="stack">
  <div id="headerRow" style="display: flex; align-items: center; justify-content: space-between; padding: 26px 48px;">
    <div id="headerContent" style="position: relative; z-index: 10002; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: nowrap; width: 100%; min-width: 0;">

      <div style="display: flex; align-items: center; gap: 44px; flex-shrink: 0;">
        <a href="${ROUTES.home}" class="logo-link" id="logoLink" aria-label="TravelVlog home">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="14" stroke="#141414" stroke-width="2"/>
            <path d="M15 5 L15 25 M5 15 L25 15" stroke="#141414" stroke-width="1.4" opacity="0.35"/>
            <path d="M9 19 C11 12, 19 12, 21 19" stroke="#141414" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
          <span style="font-size: 19px; font-weight: 700; letter-spacing: -0.3px; color: #141414;">TravelVlog</span>
        </a>

        <div id="navLinksRow" style="display: flex; align-items: center; gap: 34px;">
          <button class="navlink" id="discoverLink" type="button">Discover <span class="caret"></span></button>
          <button class="navlink" id="guidesLink" type="button">Guides</button>
          <button class="navlink" id="vlogsLink" type="button">Vlogs <span class="pill">New</span></button>
        </div>
      </div>

      <button id="mobileSearchBtn" type="button" aria-label="Search" style="display:none; background:none; border:0; padding:8px; cursor:pointer; color:#141414;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
      <button id="mobileMenuBtn" type="button" aria-label="Menu" style="display:none; background:none; border:0; padding:8px; cursor:pointer; color:#141414; flex-direction:column; gap:4px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <div id="searchBox" style="display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1px solid rgba(20,20,20,0.14); border-radius: 10px; padding: 11px 20px; flex: 1 1 320px; min-width: 180px; max-width: 720px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#141414; opacity:0.5; flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="searchInput" type="text" placeholder="Search for inspiration" autocomplete="off" style="border:0; outline:0; background:transparent; width:100%; font-family:'Inter',system-ui,sans-serif; font-size:14px; color:#141414;">
      </div>

      <!-- Logged OUT -->
      <div id="authOut" style="display: flex; align-items: center; gap: 22px; flex-shrink: 0;">
        <button class="authbtn" id="loginBtn" type="button">Log In</button>
        <button class="authbtn" id="signupBtn" type="button">Sign Up</button>
        <button class="cta" id="submitOut" type="button">Create Vlog</button>
      </div>

      <!-- Logged IN -->
      <div id="authIn" style="display: none; align-items: center; gap: 22px; flex-shrink: 0;">
        <button class="authbtn" id="profileBtn" type="button">Profile</button>
        <button class="authbtn" id="myVlogsBtn" type="button">My Vlogs</button>
        <button class="cta solid" id="submitIn" type="button">Create Vlog</button>
        <button class="authbtn" id="logoutBtn" type="button">Log Out</button>
      </div>
    </div>

    <div class="backdrop" id="backdrop"></div>

    <div id="mega" class="mega">
      <div class="mega-tabs-col" id="megaTabsCol"></div>
      <div class="mega-columns-viewport">
        <div class="mega-columns" id="megaColumns"></div>
      </div>
    </div>
  </div>
</div>`;
  }

  _setup() {
    const root = this._root;

    const ICONS = {
      trending: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
      pin: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      book: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      compass: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      play: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>'
    };

    // Every tab points at a real page, or null when that page doesn't
    // exist yet — a null section simply shows no "View all" link and
    // its cards aren't clickable, rather than 404ing.
    const SECTION_URLS = {
      destinations: ROUTES.destinations,
      guides: ROUTES.guides,
      experiences: ROUTES.experiences,
      vlogs: ROUTES.vlogs
    };

    const asItem = (title, count, link) => ({
      title, subtitle: `${count} guides`, imageUrl: null, link: link || ''
    });

    const DATA = {
      destinations: {
        label: 'Destinations', icon: ICONS.pin,
        items: [
          asItem('Santorini', 96, ROUTES.destinations),
          asItem('Kyoto', 121, ROUTES.destinations),
          asItem('Patagonia', 58, ROUTES.destinations),
          asItem('Marrakech', 74, ROUTES.destinations),
          asItem('Bali', 189, ROUTES.destinations),
          asItem('Istanbul', 233, ROUTES.destinations),
          asItem('Cappadocia', 128, ROUTES.destinations),
          asItem('Iceland', 102, ROUTES.destinations),
          asItem('Cape Town', 47, ROUTES.destinations),
          asItem('Lisbon', 85, ROUTES.destinations)
        ]
      },
      guides: {
        label: 'Guides', icon: ICONS.book,
        items: [
          asItem('Visas & documents', 41, ROUTES.guides),
          asItem('Budget routes', 96, ROUTES.guides),
          asItem('Traveling with family', 63, ROUTES.guides),
          asItem('Solo travelers', 154, ROUTES.guides),
          asItem('Packing lists', 38, ROUTES.guides),
          asItem('Travel insurance', 22, ROUTES.guides),
          asItem('First-time flyers', 29, ROUTES.guides),
          asItem('Digital nomad basics', 51, ROUTES.guides)
        ]
      },
      experiences: {
        label: 'Experiences', icon: ICONS.compass,
        items: [
          asItem('Balloon tours', 34, ROUTES.experiences),
          asItem('Diving spots', 58, ROUTES.experiences),
          asItem('Local cuisine', 201, ROUTES.experiences),
          asItem('Nature hikes', 132, ROUTES.experiences),
          asItem('Road trips', 88, ROUTES.experiences),
          asItem('Northern lights', 26, ROUTES.experiences),
          asItem('Safari tours', 19, ROUTES.experiences),
          asItem('City food crawls', 77, ROUTES.experiences)
        ]
      },
      vlogs: {
        label: 'Vlogs', icon: ICONS.play,
        items: [
          asItem('All community vlogs', 0, ROUTES.vlogs),
          asItem('Share your own vlog', 0, ROUTES.createVlog),
          asItem('My vlogs', 0, ROUTES.myVlogs),
          asItem('Most recent', 0, ROUTES.vlogs),
          asItem('Most watched', 0, ROUTES.vlogs),
          asItem('Behind the scenes', 0, ROUTES.vlogs)
        ]
      }
    };

    const order = ['destinations', 'guides', 'experiences', 'vlogs'];
    const CARD_STEP = 220 + 12;

    let openKeys = [];
    let isSearching = false;

    const tabsColEl = root.getElementById('megaTabsCol');
    const columnsEl = root.getElementById('megaColumns');
    const box = root.getElementById('searchBox');
    const input = root.getElementById('searchInput');
    const mega = root.getElementById('mega');
    const backdrop = root.getElementById('backdrop');
    const stackEl = root.querySelector('.stack');
    const headerRowEl = root.getElementById('headerRow');

    const positionMega = () => {
      const hRect = headerRowEl.getBoundingClientRect();
      const sRect = stackEl.getBoundingClientRect();
      mega.style.top = (hRect.bottom + 12) + 'px';
      mega.style.left = (sRect.left + 48) + 'px';
      mega.style.width = Math.max(sRect.width - 96, 320) + 'px';
    };

    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const cardHtml = (item) => {
      const img = item.imageUrl || `https://picsum.photos/seed/${slugify(item.title)}/220/230`;
      const href = item.link || '#';
      return `<a class="card" href="${href}">` +
        `<img src="${img}" alt="${item.title}">` +
        `<span class="card-title">${item.title}</span>` +
        `<span class="count">${item.subtitle || ''}</span>` +
        `</a>`;
    };

    const galleryHtml = (items) => {
      const track = items.length ? items.map(cardHtml).join('') : '<div class="empty">No results found.</div>';
      return `<div class="gallery">` +
        `<button class="gallery-arrow left" aria-label="scroll left">&#10094;</button>` +
        `<div class="gallery-track">${track}</div>` +
        `<button class="gallery-arrow right" aria-label="scroll right">&#10095;</button>` +
        `</div>`;
    };

    const wireGalleries = (scopeEl) => {
      scopeEl.querySelectorAll('.gallery').forEach((g) => {
        const trackEl = g.querySelector('.gallery-track');
        const leftBtn = g.querySelector('.gallery-arrow.left');
        const rightBtn = g.querySelector('.gallery-arrow.right');

        const updateArrows = () => {
          const maxScroll = trackEl.scrollWidth - trackEl.clientWidth - 1;
          const atStart = trackEl.scrollLeft <= 0;
          const atEnd = trackEl.scrollLeft >= maxScroll;
          leftBtn.style.opacity = atStart ? '0.3' : '1';
          leftBtn.style.pointerEvents = atStart ? 'none' : 'auto';
          rightBtn.style.opacity = atEnd ? '0.3' : '1';
          rightBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
        };

        leftBtn.addEventListener('click', () => trackEl.scrollBy({ left: -CARD_STEP * 2, behavior: 'smooth' }));
        rightBtn.addEventListener('click', () => trackEl.scrollBy({ left: CARD_STEP * 2, behavior: 'smooth' }));
        trackEl.addEventListener('scroll', updateArrows);
        updateArrows();
      });
    };

    const renderTabsColumn = () => {
      const activeKeys = isSearching ? [] : openKeys;
      tabsColEl.innerHTML = order.map((key) => {
        const d = DATA[key];
        const active = activeKeys.includes(key);
        return `<div class="mega-tab${active ? ' active' : ''}" data-key="${key}">${d.icon}<span>${d.label}</span></div>`;
      }).join('');
      tabsColEl.querySelectorAll('.mega-tab').forEach((el) => {
        el.addEventListener('click', () => {
          input.value = '';
          isSearching = false;
          selectCategory(el.getAttribute('data-key'));
        });
      });
    };

    const buildColumn = (key) => {
      const d = DATA[key];
      const allUrl = SECTION_URLS[key];
      const head = `<div class="mega-col-head">` +
        `<div class="mega-col-label">${d.label}</div>` +
        (allUrl ? `<a class="mega-col-all" href="${allUrl}">View all &rarr;</a>` : '') +
        `</div>`;
      return `<div class="mega-col" data-key="${key}">` + head + galleryHtml(d.items) + `</div>`;
    };

    const selectCategory = (key) => {
      openKeys = [key];
      renderColumnsFromState();
      renderTabsColumn();
    };

    const renderColumnsFromState = () => {
      columnsEl.innerHTML = openKeys.map(buildColumn).join('');
      wireGalleries(columnsEl);
      columnsEl.scrollLeft = 0;
    };

    const renderSearchColumn = (query) => {
      isSearching = true;
      const q = query.toLowerCase();
      const matches = [];
      order.forEach((key) => {
        DATA[key].items.forEach((item) => {
          if (item.title.toLowerCase().indexOf(q) !== -1) matches.push(item);
        });
      });
      columnsEl.innerHTML = `<div class="mega-col search-col">` +
        `<div class="mega-col-label">Results for \u201c${query}\u201d (${matches.length})</div>` +
        galleryHtml(matches) + `</div>`;
      wireGalleries(columnsEl);
      renderTabsColumn();
    };

    const handleQuery = (defaultKey) => {
      const q = input.value.trim();
      if (q === '') {
        isSearching = false;
        if (openKeys.length === 0 && order.length) {
          openKeys = [defaultKey && order.includes(defaultKey) ? defaultKey : order[0]];
        }
        renderColumnsFromState();
        renderTabsColumn();
      } else {
        renderSearchColumn(q);
      }
    };

    // ---- CMS bridge (unchanged shape) ----
    const CATEGORY_ALIASES = {
      trending: 'trending',
      destinations: 'destinations', destination: 'destinations',
      guides: 'guides', guide: 'guides',
      experiences: 'experiences', experience: 'experiences',
      vlogs: 'vlogs', vlog: 'vlogs'
    };

    const applyCmsTopics = (topics) => {
      if (!Array.isArray(topics) || topics.length === 0) return;
      const buckets = {};
      topics.forEach((t) => {
        const raw = slugify(String(t.category || ''));
        const key = CATEGORY_ALIASES[raw] || 'destinations';
        (buckets[key] = buckets[key] || []).push({
          title: t.title || '',
          subtitle: t.description || '',
          imageUrl: t.imageUrl || null,
          link: t.link || ''
        });
      });
      Object.keys(buckets).forEach((key) => {
        if (DATA[key]) DATA[key].items = buckets[key];
      });
      openKeys = [];
      isSearching = false;
      input.value = '';
      renderTabsColumn();
      renderColumnsFromState();
    };

    this._applyCmsTopics = (raw) => {
      try {
        applyCmsTopics(typeof raw === 'string' ? JSON.parse(raw) : raw);
      } catch (err) {
        console.error('Menu topics could not be parsed:', err);
      }
    };

    this.addEventListener('message', (e) => {
      this._applyCmsTopics(e.detail !== undefined ? e.detail : e.data);
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'MENU_TOPICS_UPDATE') this._applyCmsTopics(e.data.payload);
    });

    // ---- mega open/close ----
    const openMega = (defaultKey) => {
      handleQuery(defaultKey);
      positionMega();
      mega.classList.add('open');
      backdrop.classList.add('open');
    };
    const closeMega = () => {
      mega.classList.remove('open');
      backdrop.classList.remove('open');
    };

    window.addEventListener('resize', () => { if (mega.classList.contains('open')) positionMega(); });
    window.addEventListener('scroll', () => { if (mega.classList.contains('open')) positionMega(); }, true);

    input.addEventListener('focus', () => openMega('trending'));
    input.addEventListener('click', () => openMega('trending'));
    input.addEventListener('input', () => {
      handleQuery();
      mega.classList.add('open');
      backdrop.classList.add('open');
    });

    const openTab = (key) => {
      input.value = '';
      isSearching = false;
      selectCategory(key);
      openMega(key);
    };

    root.getElementById('discoverLink').addEventListener('click', () => openTab('destinations'));
    root.getElementById('guidesLink').addEventListener('click', () => go(ROUTES.guides));
    root.getElementById('vlogsLink').addEventListener('click', () => go(ROUTES.vlogs));

    // ---- mobile compact header: hamburger drawer + search toggle ----
    const headerContentEl = root.getElementById('headerContent');
    const mobileMenuBtn = root.getElementById('mobileMenuBtn');
    const mobileSearchBtn = root.getElementById('mobileSearchBtn');

    mobileMenuBtn.addEventListener('click', () => {
      headerContentEl.classList.toggle('mobile-nav-open');
      headerContentEl.classList.remove('mobile-search-open');
    });
    mobileSearchBtn.addEventListener('click', () => {
      const willOpen = !headerContentEl.classList.contains('mobile-search-open');
      headerContentEl.classList.toggle('mobile-search-open', willOpen);
      headerContentEl.classList.remove('mobile-nav-open');
      if (willOpen) setTimeout(() => input.focus(), 50);
    });
    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      if (!path.includes(headerContentEl)) {
        headerContentEl.classList.remove('mobile-nav-open');
        if (!path.includes(mega)) headerContentEl.classList.remove('mobile-search-open');
      }
    });

    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      if (!path.includes(box) && !path.includes(mega)) closeMega();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeMega(); input.blur(); }
    });

    // ---- auth actions ----
    // Wix login/signup are dialogs, not pages, so the element asks
    // masterPage.js to open them instead of navigating anywhere.
    const emit = (action) => this.dispatchEvent(new CustomEvent('headerAction', { detail: { action } }));
    const go = (url) => { if (url) window.location.href = url; };

    root.getElementById('loginBtn').addEventListener('click', () => emit('login'));
    root.getElementById('signupBtn').addEventListener('click', () => emit('signup'));
    root.getElementById('logoutBtn').addEventListener('click', () => emit('logout'));
    root.getElementById('submitOut').addEventListener('click', () => emit('submitContent'));
    root.getElementById('submitIn').addEventListener('click', () => go(ROUTES.createVlog));
    root.getElementById('profileBtn').addEventListener('click', () => {
      if (ROUTES.profile) go(ROUTES.profile); else emit('profile');
    });
    root.getElementById('myVlogsBtn').addEventListener('click', () => {
      if (ROUTES.myVlogs) go(ROUTES.myVlogs); else emit('myVlogs');
    });

    this._authOut = root.getElementById('authOut');
    this._authIn = root.getElementById('authIn');

    renderTabsColumn();
  }

  _handleAttribute(name, value) {
    if (name === 'data-menu-topics') {
      this._applyCmsTopics(value);
      return;
    }
    if (name === 'data-member-state') {
      let state;
      try { state = JSON.parse(value); } catch (err) { return; }
      const loggedIn = !!(state && state.loggedIn);
      this._authOut.style.display = loggedIn ? 'none' : 'flex';
      this._authIn.style.display = loggedIn ? 'flex' : 'none';
    }
  }
}

customElements.define('travel-header', TravelHeader);
