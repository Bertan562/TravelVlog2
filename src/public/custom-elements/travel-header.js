class TravelHeader extends HTMLElement {
  static get observedAttributes() {
    return ['data-menu-topics'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'data-menu-topics' || !newVal) return;
    if (this._built && this._applyCmsTopics) {
      this._applyCmsTopics(newVal);
    } else {
      this._pendingTopics = newVal;
    }
  }

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

  /* Header'ın görünür içeriği (#headerContent) backdrop'un üzerinde
     duruyor, böylece mega panel açıldığında karanlıkta kalmıyor. */
  #headerRow { position: relative; }

  /* Logo artık tıklanabilir bir bağlantı; hover'da metin rengi
     değişmesin diye opacity yerine kendi kuralını kullanıyor. */
  .logo-link { display: flex; align-items: center; gap: 10px; }
  .logo-link:hover { opacity: 0.8; }

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
    position: fixed;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 24px 48px rgba(20,20,20,0.16);
    z-index: 10001;
    display: flex;
    align-items: stretch;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    overflow: hidden;
  }
  .mega.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  /* --- Sabit sekme sütunu (her zaman solda, kaymaz) --- */
  .mega-tabs-col {
    flex: 0 0 200px;
    padding: 28px 16px 28px 30px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-right: 1px solid rgba(20,20,20,0.08);
    background: #ffffff;
    position: relative;
    z-index: 2;
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

  /* --- Kademeli sütunları tutan görünüm penceresi: scrollbar yok, --- */
  /* --- sadece ok butonlarıyla kayar (kaydırıcılı galeri mantığı)   --- */
  .mega-columns-viewport {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
  }
  .mega-columns {
    display: flex;
    align-items: stretch;
    height: 100%;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  .mega-col {
    flex: 1 1 480px;
    min-width: 480px;
    overflow: hidden;
    padding: 28px 24px;
    border-right: 1px solid rgba(20,20,20,0.08);
    animation: slideIn 0.2s ease;
  }
  .mega-col:last-child { border-right: none; }
  .mega-col.search-col { flex: 1 1 auto; min-width: 480px; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .mega-col-label {
    font-size: 12px;
    font-weight: 600;
    color: #141414;
    opacity: 0.45;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 14px;
    white-space: nowrap;
  }

  /* Sekmenin altındaki "hepsini gör" bağlantısı: kullanıcı mega
     menüden doğrudan ilgili bölüm sayfasına gidebilsin diye. */
  .mega-col-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }
  .mega-col-head .mega-col-label { margin-bottom: 0; }
  .mega-col-all {
    font-size: 13px;
    font-weight: 600;
    color: #141414;
    white-space: nowrap;
  }

  /* --- Her sütunun kendi sağ/sol ok butonlu galerisi --- */
  .gallery { position: relative; }
  .gallery-track {
    display: flex;
    gap: 12px;
    overflow-x: hidden;
    scroll-behavior: smooth;
    padding: 2px 2px 6px;
  }
  .gallery-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid rgba(20,20,20,0.1);
    box-shadow: 0 2px 8px rgba(20,20,20,0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #141414;
    cursor: pointer;
    z-index: 4;
  }
  .gallery-arrow:hover { background: #f4f3ef; }
  .gallery-arrow.left { left: -4px; }
  .gallery-arrow.right { right: -4px; }

  .gallery-track .empty {
    font-size: 14px;
    color: #141414;
    opacity: 0.5;
    padding: 20px 0;
    white-space: nowrap;
  }
  .gallery-track a.card {
    flex: 0 0 220px;
    width: 220px;
    height: 350px;
    display: flex;
    flex-direction: column;
    background: #f4f3ef;
    border-radius: 12px;
    padding: 10px;
    color: #141414;
  }
  .gallery-track a.card img {
    width: 100%;
    height: 230px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    margin-bottom: 12px;
  }
  .gallery-track a.card .card-title {
    font-size: 14px;
    font-weight: 600;
    display: block;
    line-height: 1.3;
  }
  .gallery-track a.card .count {
    font-size: 12px;
    font-weight: 500;
    color: #141414;
    opacity: 0.45;
    display: block;
    margin-top: 4px;
  }
</style>

<div class="stack">
  <div id="headerRow" style="display: flex; align-items: center; justify-content: space-between; padding: 26px 48px;">

    <div id="headerContent" style="position: relative; z-index: 10002; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: nowrap; width: 100%; min-width: 0;">

    <div style="display: flex; align-items: center; gap: 44px; flex-shrink: 0;">
      <a href="/" class="logo-link" id="logoLink" aria-label="TravelVlog ana sayfa">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="14" stroke="#141414" stroke-width="2"/>
          <path d="M15 5 L15 25 M5 15 L25 15" stroke="#141414" stroke-width="1.4" opacity="0.35"/>
          <path d="M9 19 C11 12, 19 12, 21 19" stroke="#141414" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
        <span style="font-size: 19px; font-weight: 700; letter-spacing: -0.3px; color: #141414;">TravelVlog</span>
      </a>

      <div style="display: flex; align-items: center; gap: 34px;">
        <a href="#" id="discoverLink" style="font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
          Discover
          <span style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #141414; opacity: 0.6;"></span>
        </a>
        <a href="#" id="guidesLink" style="font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
          Guides
          <span style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #141414; opacity: 0.6;"></span>
        </a>
        <a href="#" id="vlogsLink" style="font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
          Vlogs
          <span style="background: #141414; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px;">New</span>
        </a>
      </div>
    </div>

    <div id="searchBox" style="display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1px solid rgba(20,20,20,0.14); border-radius: 10px; padding: 11px 20px; flex: 1 1 320px; min-width: 180px; max-width: 480px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#141414; opacity:0.5; flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="searchInput" type="text" placeholder="Search for inspiration" autocomplete="off" style="border:0; outline:0; background:transparent; width:100%; font-family:'Inter',system-ui,sans-serif; font-size:14px; color:#141414;">
    </div>

    <div style="display: flex; align-items: center; gap: 22px; flex-shrink: 0;">
      <a href="/login" id="loginLink" style="font-size: 14px; font-weight: 500; white-space: nowrap;">Log In</a>
      <a href="/signup" id="signupLink" style="font-size: 14px; font-weight: 500; white-space: nowrap;">Sign Up</a>
      <a href="/create-vlog" id="submitContentLink" style="border: 1px solid #141414; color: #141414; font-size: 14px; font-weight: 600; padding: 10px 21px; border-radius: 8px; white-space: nowrap;">Submit Content</a>
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
</div>
`;

    const ICONS = {
      trending: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
      pin: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      book: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      compass: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      play: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>'
    };

    // Her sekmenin "hepsini gör" hedefi. Mega menü açıkken kullanıcı
    // tek tıkla ilgili bölümün liste sayfasına gidebilsin diye.
    const SECTION_URLS = {
      trending: '/',
      destinations: '/destinations',
      guides: '/guides',
      experiences: '/experiences',
      vlogs: '/vlogs'
    };

    // ------------------------------------------------------------
    // Varsayılan (CMS henüz veri göndermediyse gösterilecek) veri.
    // Her kart { title, subtitle, imageUrl, link } biçiminde — bu
    // şekil, CMS'ten gelen gerçek MenuTopics kayıtlarıyla aynı.
    // Artık varsayılan kartların da gerçek bir `link` değeri var,
    // böylece CMS boşken bile menü tıklanabilir durumda.
    // ------------------------------------------------------------
    const asItem = (title, count, link) => ({
      title,
      subtitle: `${count} guides`,
      imageUrl: null,
      link: link || ''
    });

    const DATA = {
      trending: {
        label: 'Trending', icon: ICONS.trending,
        items: [
          asItem('Cappadocia balloon tours', 128, '/destinations/cappadocia'),
          asItem('3-day Istanbul itinerary', 342, '/destinations/istanbul'),
          asItem('Santorini sunset guides', 96, '/destinations/santorini'),
          asItem('Winter destinations', 210, '/destinations'),
          asItem('Solo travel guides', 154, '/guides'),
          asItem('Budget road trips', 88, '/guides'),
          asItem('Family-friendly resorts', 176, '/destinations'),
          asItem('Hidden beach coves', 64, '/destinations'),
          asItem('Mountain hiking trails', 132, '/experiences'),
          asItem('Local food guides', 201, '/experiences')
        ]
      },
      destinations: {
        label: 'Destinations', icon: ICONS.pin,
        items: [
          asItem('Santorini', 96, '/destinations/santorini'),
          asItem('Kyoto', 121, '/destinations/kyoto'),
          asItem('Patagonia', 58, '/destinations/patagonia'),
          asItem('Marrakech', 74, '/destinations/marrakech'),
          asItem('Bali', 189, '/destinations/bali'),
          asItem('Istanbul', 233, '/destinations/istanbul'),
          asItem('Cappadocia', 128, '/destinations/cappadocia'),
          asItem('Iceland', 102, '/destinations/iceland'),
          asItem('Cape Town', 47, '/destinations/cape-town'),
          asItem('Lisbon', 85, '/destinations/lisbon')
        ]
      },
      guides: {
        label: 'Guides', icon: ICONS.book,
        items: [
          asItem('Visas & documents', 41, '/guides'),
          asItem('Budget routes', 96, '/guides'),
          asItem('Traveling with family', 63, '/guides'),
          asItem('Solo travelers', 154, '/guides'),
          asItem('Packing lists', 38, '/guides'),
          asItem('Travel insurance', 22, '/guides'),
          asItem('First-time flyers', 29, '/guides'),
          asItem('Digital nomad basics', 51, '/guides')
        ]
      },
      experiences: {
        label: 'Experiences', icon: ICONS.compass,
        items: [
          asItem('Balloon tours', 34, '/experiences'),
          asItem('Diving spots', 58, '/experiences'),
          asItem('Local cuisine', 201, '/experiences'),
          asItem('Nature hikes', 132, '/experiences'),
          asItem('Road trips', 88, '/experiences'),
          asItem('Northern lights', 26, '/experiences'),
          asItem('Safari tours', 19, '/experiences'),
          asItem('City food crawls', 77, '/experiences')
        ]
      },
      vlogs: {
        label: 'Vlogs', icon: ICONS.play,
        items: [
          asItem('All community vlogs', 0, '/vlogs'),
          asItem('Share your own vlog', 0, '/create-vlog'),
          asItem('My vlogs', 0, '/my-vlogs'),
          asItem('Cappadocia vlogs', 0, '/vlogs'),
          asItem('Bali vlogs', 0, '/vlogs'),
          asItem('Kyoto vlogs', 0, '/vlogs')
        ]
      }
    };

    const order = ['trending', 'destinations', 'guides', 'experiences', 'vlogs'];
    const CARD_STEP = 220 + 12; // kart genişliği + gap

    // openKeys: kullanıcının şu ana kadar tıkladığı, halen ekranda
    // "yana doğru" sütun olarak duran kategori sırası (Finder mantığı).
    let openKeys = [];
    let isSearching = false;

    const tabsColEl = root.getElementById('megaTabsCol');
    const columnsEl = root.getElementById('megaColumns');
    const box = root.getElementById('searchBox');
    const input = root.getElementById('searchInput');
    const mega = root.getElementById('mega');
    const backdrop = root.getElementById('backdrop');
    const discoverLink = root.getElementById('discoverLink');
    const guidesLink = root.getElementById('guidesLink');
    const vlogsLink = root.getElementById('vlogsLink');
    const stackEl = root.querySelector('.stack');
    const headerRowEl = root.getElementById('headerRow');

    // Mega panel artık position:fixed — Wix'in custom element'e
    // verdiği kutunun boyutu ne olursa olsun (taşan içeriği kırpsa
    // bile) panel doğru yerde ve tam boyutlu görünsün diye gerçek
    // ekran koordinatlarını JS ile hesaplıyoruz.
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
      // Link ya CMS'ten (masterPage.js üzerinden) ya da yukarıdaki
      // varsayılan veriden gelir. İkisi de yoksa kart tıklansa da
      // sayfayı değiştirmez.
      const href = item.link || '#';
      return `<a class="card" href="${href}">` +
        `<img src="${img}" alt="${item.title}">` +
        `<span class="card-title">${item.title}</span>` +
        `<span class="count">${item.subtitle || ''}</span>` +
        `</a>`;
    };

    const galleryHtml = (items) => {
      const track = items.length
        ? items.map(cardHtml).join('')
        : '<div class="empty">No results found.</div>';
      return `<div class="gallery">` +
        `<button class="gallery-arrow left" aria-label="scroll left">&#10094;</button>` +
        `<div class="gallery-track">${track}</div>` +
        `<button class="gallery-arrow right" aria-label="scroll right">&#10095;</button>` +
        `</div>`;
    };

    // Bir konteynerin içindeki galeri ok butonlarını, o galeriye özel
    // track elementini kaydıracak şekilde bağlar. Başta/sonda ilgili
    // ok soluklaşıp pasif olur, böylece "çalışmıyor" izlenimi kalkar.
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
      const head = allUrl
        ? `<div class="mega-col-head">` +
            `<div class="mega-col-label">${d.label}</div>` +
            `<a class="mega-col-all" href="${allUrl}">View all &rarr;</a>` +
          `</div>`
        : `<div class="mega-col-label">${d.label}</div>`;

      return `<div class="mega-col" data-key="${key}">` + head + galleryHtml(d.items) + `</div>`;
    };

    // Bir kategoriye tıklandığında sadece o kategori gösterilir,
    // önceki açık olan kategori kapanır.
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
        galleryHtml(matches) +
        `</div>`;
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

    // ------------------------------------------------------------
    // CMS köprüsü: masterPage.js buraya iki yoldan veri gönderebilir —
    // (1) data-menu-topics attribute'u, (2) postMessage.
    //
    // Sekmeler HER ZAMAN sabittir: Trending, Destinations, Guides,
    // Experiences, Vlogs. CMS'ten gelen kayıtlar bu sekmelerin
    // içine yerleşir; tanınmayan bir kategori Destinations'a düşer.
    // Sekme listesi asla CMS verisine göre yeniden kurulmaz.
    // ------------------------------------------------------------
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

      // Yalnızca veri gelen sekmenin içeriği değişir; diğer sekmeler
      // ve sekme sırası olduğu gibi kalır.
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
        const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        applyCmsTopics(payload);
      } catch (err) {
        console.error('Menu topics verisi işlenemedi:', err);
      }
    };

    // Wix Velo custom element köprüsü, mesajı doğrudan bu elementin
    // kendisine ('message' event) veya window'a postMessage ile
    // gönderebilir — ikisini de dinliyoruz.
    this.addEventListener('message', (e) => {
      this._applyCmsTopics(e.detail !== undefined ? e.detail : e.data);
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'MENU_TOPICS_UPDATE') {
        this._applyCmsTopics(e.data.payload);
      }
    });

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

    window.addEventListener('resize', () => {
      if (mega.classList.contains('open')) positionMega();
    });
    window.addEventListener('scroll', () => {
      if (mega.classList.contains('open')) positionMega();
    }, true);

    input.addEventListener('focus', () => openMega('trending'));
    input.addEventListener('click', () => openMega('trending'));
    input.addEventListener('input', () => {
      handleQuery();
      mega.classList.add('open');
      backdrop.classList.add('open');
    });

    // Üst menüdeki üç bağlantı da mega paneli kendi sekmesinde açar.
    const openTabFromLink = (e, key) => {
      e.preventDefault();
      input.value = '';
      isSearching = false;
      selectCategory(key);
      openMega(key);
    };

    discoverLink.addEventListener('click', (e) => openTabFromLink(e, 'destinations'));
    guidesLink.addEventListener('click', (e) => openTabFromLink(e, 'guides'));
    vlogsLink.addEventListener('click', (e) => openTabFromLink(e, 'vlogs'));

    // Use composedPath() because clicks inside an open shadow root are
    // retargeted at the document level — box.contains(e.target) would
    // otherwise always fail once the event crosses the shadow boundary.
    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      if (!path.includes(box) && !path.includes(mega)) closeMega();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeMega(); input.blur(); }
    });

    // Element DOM'a eklenmeden önce attribute zaten set edilmiş olabilir
    // (attributeChangedCallback connectedCallback'ten önce tetiklenmiş
    // olabilir) — o durumda bekleyen veriyi şimdi uygula.
    if (this._pendingTopics) {
      this._applyCmsTopics(this._pendingTopics);
      this._pendingTopics = null;
    } else {
      const existing = this.getAttribute('data-menu-topics');
      if (existing) this._applyCmsTopics(existing);
    }
  }
}

customElements.define('travel-header', TravelHeader);
