class TravelHeader extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
<style>
  :host { display: block; }
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .stack { font-family: 'Inter', system-ui, sans-serif; width: 1440px; max-width: 100%; margin: 0 auto; background: #e9e8e4; position: relative; }
  a { color: #141414; text-decoration: none; }
  a:hover { opacity: 0.65; }

  #headerRow { position: relative; z-index: 2; }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20,20,20,0.32);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.22s ease, visibility 0.22s;
    z-index: 9998;
  }
  .backdrop.open { opacity: 1; visibility: visible; pointer-events: auto; }

  .mega {
    position: absolute;
    top: calc(100% + 12px);
    left: 48px;
    right: 48px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 24px 48px rgba(20,20,20,0.16);
    padding: 28px 30px;
    z-index: 9999;
    display: flex;
    gap: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  }
  .mega.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  .mega-tabs {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mega-tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 8px;
    font-size: 14.5px;
    font-weight: 500;
    color: #141414;
    cursor: pointer;
  }
  .mega-tab:hover { background: #f4f3ef; opacity: 1; }
  .mega-tab.active { background: #141414; color: #fff; font-weight: 600; }
  .mega-tab.active .ico { opacity: 1; }
  .mega-tab .ico { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.55; }

  .mega-right {
    flex: 1;
    padding-left: 28px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .mega-right-label {
    font-size: 12px;
    font-weight: 600;
    color: #141414;
    opacity: 0.45;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 14px;
  }

  .mega-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .mega-list .empty {
    grid-column: 1 / -1;
    font-size: 14px;
    color: #141414;
    opacity: 0.5;
    padding: 20px 0;
  }
  .mega-list a {
    display: block;
    background: #f4f3ef;
    border-radius: 12px;
    padding: 10px;
    color: #141414;
  }
  .mega-list a img {
    width: 100%;
    height: 84px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    margin-bottom: 10px;
  }
  .mega-list a .card-title {
    font-size: 13.5px;
    font-weight: 600;
    display: block;
  }
  .mega-list a .count {
    font-size: 12px;
    font-weight: 500;
    color: #141414;
    opacity: 0.45;
    display: block;
    margin-top: 2px;
  }
</style>

<div class="stack">
  <div id="headerRow" style="display: flex; align-items: center; justify-content: space-between; padding: 26px 48px;">

    <div style="display: flex; align-items: center; gap: 44px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="14" stroke="#141414" stroke-width="2"/>
          <path d="M15 5 L15 25 M5 15 L25 15" stroke="#141414" stroke-width="1.4" opacity="0.35"/>
          <path d="M9 19 C11 12, 19 12, 21 19" stroke="#141414" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
        <span style="font-size: 19px; font-weight: 700; letter-spacing: -0.3px; color: #141414;">TravelVlog</span>
      </div>

      <div style="display: flex; align-items: center; gap: 34px;">
        <a href="#" style="font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
          Discover
          <span style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #141414; opacity: 0.6;"></span>
        </a>
        <a href="#" style="font-size: 15px; font-weight: 500;">Guides</a>
        <a href="#" style="font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
          Vlogs
          <span style="background: #141414; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px;">New</span>
        </a>
      </div>
    </div>

    <div id="searchBox" style="display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1px solid rgba(20,20,20,0.14); border-radius: 10px; padding: 11px 20px; width: 480px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#141414; opacity:0.5; flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="searchInput" type="text" placeholder="Search for inspiration" autocomplete="off" style="border:0; outline:0; background:transparent; width:100%; font-family:'Inter',system-ui,sans-serif; font-size:14px; color:#141414;">
    </div>

    <div style="display: flex; align-items: center; gap: 22px;">
      <a href="#" style="font-size: 14px; font-weight: 500;">Log In</a>
      <a href="#" style="font-size: 14px; font-weight: 500;">Sign Up</a>
      <a href="#" style="background: #141414; color: #fff; font-size: 14px; font-weight: 600; padding: 11px 22px; border-radius: 8px; white-space: nowrap;">Go Pro</a>
      <a href="#" style="border: 1px solid #141414; color: #141414; font-size: 14px; font-weight: 600; padding: 10px 21px; border-radius: 8px; white-space: nowrap;">Submit Content</a>
    </div>

    <div class="backdrop" id="backdrop"></div>

    <div id="mega" class="mega">
      <div class="mega-tabs" id="megaTabs"></div>
      <div class="mega-right">
        <div class="mega-right-label" id="megaLabel">Trending</div>
        <div class="mega-list" id="megaList"></div>
      </div>
    </div>
  </div>
</div>
`;

    const ICONS = {
      trending: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
      pin: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      book: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      compass: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      play: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>'
    };

    const DATA = {
      trending: {
        label: 'Trending', icon: ICONS.trending,
        items: [
          ['Cappadocia balloon tours', 128], ['3-day Istanbul itinerary', 342],
          ['Santorini sunset guides', 96], ['Winter destinations', 210],
          ['Solo travel guides', 154], ['Budget road trips', 88],
          ['Family-friendly resorts', 176], ['Hidden beach coves', 64],
          ['Mountain hiking trails', 132], ['Local food guides', 201]
        ]
      },
      destinations: {
        label: 'Destinations', icon: ICONS.pin,
        items: [
          ['Santorini', 96], ['Kyoto', 121], ['Patagonia', 58],
          ['Marrakech', 74], ['Bali', 189], ['Istanbul', 233],
          ['Cappadocia', 128], ['Iceland', 102], ['Cape Town', 47], ['Lisbon', 85]
        ]
      },
      guides: {
        label: 'Guides', icon: ICONS.book,
        items: [
          ['Visas & documents', 41], ['Budget routes', 96],
          ['Traveling with family', 63], ['Solo travelers', 154],
          ['Packing lists', 38], ['Travel insurance', 22],
          ['First-time flyers', 29], ['Digital nomad basics', 51]
        ]
      },
      experiences: {
        label: 'Experiences', icon: ICONS.compass,
        items: [
          ['Balloon tours', 34], ['Diving spots', 58], ['Local cuisine', 201],
          ['Nature hikes', 132], ['Road trips', 88], ['Northern lights', 26],
          ['Safari tours', 19], ['City food crawls', 77]
        ]
      },
      vlogs: {
        label: 'Vlogs', icon: ICONS.play,
        items: [
          ['Latest episodes', 12], ['Most watched', 40], ['Behind the scenes', 18],
          ['Gear & setup', 9], ['Season 1', 24], ['Season 2', 16]
        ]
      }
    };

    const tabsEl = root.getElementById('megaTabs');
    const listEl = root.getElementById('megaList');
    const labelEl = root.getElementById('megaLabel');
    const order = ['trending', 'destinations', 'guides', 'experiences', 'vlogs'];
    let currentTab = 'trending';

    const renderTabs = (activeKey) => {
      tabsEl.innerHTML = order.map((key) => {
        const d = DATA[key];
        return `<div class="mega-tab${key === activeKey ? ' active' : ''}" data-key="${key}">${d.icon}<span>${d.label}</span></div>`;
      }).join('');
      tabsEl.querySelectorAll('.mega-tab').forEach((el) => {
        el.addEventListener('click', () => {
          input.value = '';
          selectTab(el.getAttribute('data-key'));
        });
      });
    };

    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const renderCards = (items) => {
      if (!items.length) {
        listEl.innerHTML = '<div class="empty">No results found.</div>';
        return;
      }
      listEl.innerHTML = items.map((pair) => {
        const seed = slugify(pair[0]);
        return `<a href="#">` +
          `<img src="https://picsum.photos/seed/${seed}/300/200" alt="${pair[0]}">` +
          `<span class="card-title">${pair[0]}</span>` +
          `<span class="count">${pair[1]} guides</span>` +
          `</a>`;
      }).join('');
    };

    const selectTab = (key) => {
      currentTab = key;
      renderTabs(key);
      labelEl.textContent = DATA[key].label;
      renderCards(DATA[key].items);
    };

    const renderSearchResults = (query) => {
      renderTabs(null);
      const q = query.toLowerCase();
      const matches = [];
      order.forEach((key) => {
        DATA[key].items.forEach((pair) => {
          if (pair[0].toLowerCase().indexOf(q) !== -1) matches.push(pair);
        });
      });
      labelEl.textContent = `Results for \u201c${query}\u201d (${matches.length})`;
      renderCards(matches);
    };

    const handleQuery = () => {
      const q = input.value.trim();
      if (q === '') { selectTab(currentTab); }
      else { renderSearchResults(q); }
    };

    const box = root.getElementById('searchBox');
    const input = root.getElementById('searchInput');
    const mega = root.getElementById('mega');
    const backdrop = root.getElementById('backdrop');

    const openMega = () => {
      handleQuery();
      mega.classList.add('open');
      backdrop.classList.add('open');
    };
    const closeMega = () => {
      mega.classList.remove('open');
      backdrop.classList.remove('open');
    };

    input.addEventListener('focus', openMega);
    input.addEventListener('click', openMega);
    input.addEventListener('input', () => {
      handleQuery();
      mega.classList.add('open');
      backdrop.classList.add('open');
    });

    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      if (!path.includes(box) && !path.includes(mega)) closeMega();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeMega(); input.blur(); }
    });
  }
}

customElements.define('wix-default-custom-element', TravelHeader);
