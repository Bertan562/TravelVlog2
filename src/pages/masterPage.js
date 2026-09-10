// ============================================================
// masterPage.js — TravelVlog
// ------------------------------------------------------------
// Bu dosyadaki kod sitenin her sayfasına yüklenir. Şu işleri yapar:
//
//   1) HEADER  → <travel-header> (#travelHeader) custom element'ine
//      mega menü verisini gönderir. Kaynak: Destinations koleksiyonu,
//      sabit "Destinations" sekmesi altında listelenir.
//      Header sekmeleri (Trending, Destinations, Guides, Experiences,
//      Vlogs) sabittir; CMS verisine göre değişmez.
//
//   1b) ANASAYFA HERO → günün destinasyonu (<travel-home>)
//   1c) ANASAYFA ÖNE ÇIKANLAR → oneCikan=true olan kayıtlar (<travel-featured>)
//   1d) ANASAYFA KEŞFET IZGARASI → tüm destinasyonlardan 15 kart + /destinations-all linki (<travel-explore-grid>)
//   1e) DESTİNASYON LİSTE SAYFASI → bölge filtresi + arama + ızgara
//
//   2) DESTİNASYON SAYFASI → sayfada <travel-destination>
//      (#destinationBody) varsa, URL'deki slug'a ait kaydı çekip
//      elemana aktarır; yorumları yükler, yeni yorum kaydeder.
//
//   3) ÜLKE REHBERİ (GUIDES) SAYFASI → sayfada <travel-guide>
//      (#guideBody) varsa, URL'deki slug'a ait Guides kaydını çekip
//      elemana aktarır (Rich Text içerik + o ülkedeki destinasyon
//      kartları); GuideReviews'tan yorumları yükler, yenisini kaydeder.
//      Sayfanın URL'i /countries/{slug} — koleksiyon ve menüdeki
//      etiket "Guides" olarak kalıyor, sadece adres bu şekilde.
//
//   4) AKTİVİTE (EXPERIENCES) SAYFASI → sayfada <travel-activity>
//      (#activityBody) varsa, URL'deki slug'a ait Activities kaydını
//      çekip (relatedDestination referansı genişletilerek) elemana
//      aktarır; ActivityReviews'tan yorumları yükler, yenisini
//      kaydeder. Sayfanın URL'i /experiences/{slug} — koleksiyon adı
//      Activities, header'daki sabit "Experiences" sekmesiyle eşleşsin
//      diye adres bu şekilde kuruldu (Guides/countries ile aynı desen).
//
// Not: Sayfa kodu (Destinations (Item).js / Guides (Item).js /
// Activities (Item).js) yerine burada duruyor, çünkü Wix o dosyaları
// git'e senkronize etmiyor. İşlev aynı.
// ============================================================

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members-frontend';

let destinationId = null;
let guideId = null;
let activityId = null;

// Dinamik destinasyon sayfasının URL öneki. Wix Editor'de sayfanın
// URL kalıbını değiştirirsen (Sayfalar → Destinations (Item) →
// SEO/URL), burayı da güncelle.
const DESTINATION_PATH = '/destinations/';

// Breadcrumb'daki "Destinations" bağlantısının ve keşfet ızgarasındaki
// "View all destinations" butonunun gittiği liste sayfası. Wix'te bu
// adreste bir sayfa yoksa null yap, yoksa 404'e götürür.
const DESTINATIONS_LIST_PATH = '/destinations-all';

// Ülke rehberi (Guides koleksiyonu) dinamik sayfasının URL öneki.
// Koleksiyon adı ve header'daki "Guides" etiketi değişmiyor — sadece
// adres SEO amacıyla /countries/{slug} şeklinde.
const GUIDE_PATH = '/countries/';

// Breadcrumb'daki "Guides" bağlantısının gittiği liste sayfası.
const GUIDES_LIST_PATH = '/guides-all';

// Aktivite (Activities koleksiyonu) dinamik sayfasının URL öneki.
// Koleksiyon adı Activities, header'daki sabit "Experiences" sekmesiyle
// eşleşsin diye adres /experiences/{slug} şeklinde kuruldu.
const ACTIVITY_PATH = '/experiences/';

// Breadcrumb'daki "Experiences" bağlantısının gittiği liste sayfası
// (henüz yoksa null yap).
const ACTIVITIES_LIST_PATH = '/experiences-all';

// Wix, CMS görsel alanlarını "wix:image://v1/<dosya>/<ad>#..." biçiminde
// iç bir adres olarak verir; bu doğrudan <img src> içinde çalışmaz.
// Gerçek, herkese açık URL'e çeviriyoruz.
function toImageUrl(value) {
    if (!value) return null;
    var v = (typeof value === 'string') ? value : (value.src || value.url || '');
    if (!v) return null;
    if (v.indexOf('wix:image://') !== 0) return v;   // zaten normal URL
    var rest = v.slice('wix:image://'.length);       // "v1/<dosya>/<ad>#..."
    var parts = rest.split('/');
    var file = parts[1] || '';                       // "<dosya>"
    file = file.split('#')[0];
    return file ? 'https://static.wixstatic.com/media/' + file : null;
}

// Kart linkini kur.
function destinationLink(item) {
    const base = (wixLocation.baseUrl || '').replace(/\/$/, '');
    return base + DESTINATION_PATH + item.slug;
}

// Guide kartı/breadcrumb linki. Aynı baseUrl deseni; adres /countries/.
function guideLink(item) {
    const base = (wixLocation.baseUrl || '').replace(/\/$/, '');
    return base + GUIDE_PATH + item.slug;
}

// Aktivite kartı/breadcrumb linki. Aynı baseUrl deseni; adres /experiences/.
function activityLink(item) {
    const base = (wixLocation.baseUrl || '').replace(/\/$/, '');
    return base + ACTIVITY_PATH + item.slug;
}

$w.onReady(async function () {
    loadHeaderMenu();
    setupHomeHero();
    setupFeaturedBand();
    setupExploreGrid();
    setupDestinationsList();
    await setupDestinationPage();
    await setupGuidePage();
    await setupActivityPage();
});

// ============================================================
// 1) HEADER MEGA MENÜSÜ
// ============================================================
async function loadHeaderMenu() {
    const headerEl = safeEl('#travelHeader');
    if (!headerEl) return;

    try {
        const res = await wixData.query('Destinations').limit(1000).find();

        const topics = res.items.map((item) => ({
            id: item._id,
            title: item.title,
            slug: item.slug,
            category: 'Destinations',
            imageUrl: toImageUrl(item.heroImage),
            description: item.kisaAciklama || '',
            link: destinationLink(item)
        }));

        send(headerEl, 'MENU_TOPICS_UPDATE', topics, 'data-menu-topics');
    } catch (err) {
        console.error('Menü verisi çekilemedi:', err);
    }
}

// ============================================================
// 1b) ANASAYFA — GÜNÜN DESTİNASYONU
// ============================================================
async function setupHomeHero() {
    const el = safeEl('#homeHero');
    if (!el) return;

    try {
        const res = await wixData.query('Destinations').limit(1000).find();
        if (!res.items.length) return;

        const items = res.items.slice().sort((a, b) =>
            String(a._id).localeCompare(String(b._id)));

        const daysSinceEpoch = Math.floor(Date.now() / 86400000);
        const item = items[daysSinceEpoch % items.length];

        send(el, 'DAILY_UPDATE', {
            title:        item.title,
            ulke:         item.ulke,
            bolge:        item.bolge,
            kisaAciklama: item.kisaAciklama,
            heroImage:    toImageUrl(item.heroImage),
            link:         destinationLink(item),
            ortalamaPuan: item.ortalamaPuan || 0
        }, 'data-daily');
    } catch (err) {
        console.error('Günün destinasyonu çekilemedi:', err);
    }
}

// ============================================================
// 1c) ANASAYFA — ÖNE ÇIKAN DESTİNASYONLAR
// ============================================================
async function setupFeaturedBand() {
    const el = safeEl('#featuredBand');
    if (!el) return;

    try {
        const res = await wixData.query('Destinations')
            .eq('oneCikan', true)
            .limit(8)
            .find();

        send(el, 'FEATURED_UPDATE', res.items.map(function (item) {
            return {
                title:        item.title,
                link:         destinationLink(item),
                heroImage:    toImageUrl(item.heroImage),
                ulke:         item.ulke,
                bolge:        item.bolge,
                ortalamaPuan: item.ortalamaPuan || 0
            };
        }), 'data-featured');
    } catch (err) {
        console.error('Öne çıkan destinasyonlar çekilemedi:', err);
    }
}

// ============================================================
// 1d) ANASAYFA — TÜM DESTİNASYONLARI KEŞFET IZGARASI
// ============================================================
async function setupExploreGrid() {
    const el = safeEl('#exploreGrid');
    if (!el) return;

    try {
        const res = await wixData.query('Destinations')
            .ascending('title')
            .limit(15)
            .find();

        const items = res.items.map(function (item) {
            return {
                title:     item.title,
                link:      destinationLink(item),
                heroImage: toImageUrl(item.heroImage),
                ulke:      item.ulke,
                bolge:     item.bolge
            };
        });

        const viewAllLink = (wixLocation.baseUrl || '').replace(/\/$/, '') + DESTINATIONS_LIST_PATH;

        send(el, 'EXPLORE_UPDATE', { items: items, viewAllLink: viewAllLink }, 'data-explore');
    } catch (err) {
        console.error('Keşfet ızgarası çekilemedi:', err);
    }
}

// ============================================================
// 1e) DESTİNASYON LİSTE SAYFASI
// ============================================================
async function setupDestinationsList() {
    const el = safeEl('#destinationsList');
    if (!el) return;

    try {
        const res = await wixData.query('Destinations').limit(1000).find();

        send(el, 'DESTINATIONS_UPDATE', res.items.map(function (item) {
            return {
                title:        item.title,
                ulke:         item.ulke,
                bolge:        item.bolge,
                kisaAciklama: item.kisaAciklama,
                imageUrl:     toImageUrl(item.heroImage),
                link:         destinationLink(item)
            };
        }), 'data-destinations');
    } catch (err) {
        console.error('Destinasyon listesi çekilemedi:', err);
    }
}

// ============================================================
// 2) DESTİNASYON SAYFASI
// ============================================================
async function setupDestinationPage() {
    const el = safeEl('#destinationBody');
    if (!el) return;

    const path = wixLocation.path || [];
    const slug = path[path.length - 1];
    if (!slug) {
        console.error('URL\'de destinasyon slug\'ı bulunamadı.');
        return;
    }

    try {
        const res = await wixData.query('Destinations').eq('slug', slug).limit(1).find();
        if (!res.items.length) {
            console.error('Destinasyon kaydı bulunamadı:', slug);
            return;
        }

        const item = res.items[0];
        destinationId = item._id;

        send(el, 'DESTINATION_UPDATE', {
            title:           item.title,
            slug:            item.slug,
            ulke:            item.ulke,
            bolge:           item.bolge,
            kisaAciklama:    item.kisaAciklama,
            heroImage:       toImageUrl(item.heroImage),
            galeri:          (item.galeri || []).map(toImageUrl).filter(Boolean),
            genelBakis:      item.genelBakis,
            nasilGidilir:    item.nasilGidilir,
            konaklama:       item.konaklama,
            gezilecekYerler: item.gezilecekYerler,
            yemeIcme:        item.yemeIcme,
            kultur:          item.kultur,
            tarih:           item.tarih,
            ortalamaPuan:    item.ortalamaPuan || 0,

            homeLink:        (wixLocation.baseUrl || '/').replace(/\/$/, '') || '/',
            listLink:        DESTINATIONS_LIST_PATH
                                ? (wixLocation.baseUrl || '').replace(/\/$/, '') + DESTINATIONS_LIST_PATH
                                : null,

            related:         await relatedFor(item)
        }, 'data-destination');
    } catch (err) {
        console.error('Destinasyon verisi çekilemedi:', err);
        return;
    }

    const member = await currentMember.getMember().catch(() => null);
    sendMember(el, !!member);

    await loadReviews(el);

    try {
        el.on('login-request', async () => {
            await authentication.promptLogin({ mode: 'login' }).catch(() => null);
            const m = await currentMember.getMember().catch(() => null);
            sendMember(el, !!m);
        });

        el.on('review-submit', async (event) => {
            const d = event.detail || {};
            const m = await currentMember.getMember().catch(() => null);
            if (!m) { sendMember(el, false); return; }

            try {
                await wixData.insert('DestinationReviews', {
                    destinationId: destinationId,
                    memberId: m._id,
                    author: (m.profile && (m.profile.nickname || m.profile.slug)) || 'Traveller',
                    rating: Number(d.rating),
                    comment: d.comment || ''
                });
                await loadReviews(el);
                await refreshAverage();
            } catch (err) {
                console.error('Yorum kaydedilemedi:', err);
            }
        });
    } catch (err) {
        console.warn('Olay dinleyicileri bağlanamadı:', err);
    }
}

async function relatedFor(item) {
    try {
        let res = null;
        if (item.bolge) {
            res = await wixData.query('Destinations')
                .eq('bolge', item.bolge)
                .ne('_id', item._id)
                .limit(4)
                .find();
        }
        if (!res || !res.items.length) {
            res = await wixData.query('Destinations')
                .ne('_id', item._id)
                .limit(4)
                .find();
        }
        return res.items.map(function (r) {
            return {
                title:    r.title,
                ulke:     r.ulke,
                bolge:    r.bolge,
                imageUrl: toImageUrl(r.heroImage),
                link:     destinationLink(r)
            };
        });
    } catch (err) {
        console.warn('İlgili destinasyonlar çekilemedi:', err);
        return [];
    }
}

async function loadReviews(el) {
    try {
        const res = await wixData.query('DestinationReviews')
            .eq('destinationId', destinationId)
            .descending('_createdDate')
            .limit(100)
            .find();

        send(el, 'REVIEWS_UPDATE', res.items.map(r => ({
            author: r.author || 'Traveller',
            rating: r.rating,
            comment: r.comment,
            date: r._createdDate
                ? new Date(r._createdDate).toLocaleDateString('en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' })
                : ''
        })), 'data-reviews');
    } catch (err) {
        console.warn('Yorumlar yüklenemedi:', err);
        send(el, 'REVIEWS_UPDATE', [], 'data-reviews');
    }
}

async function refreshAverage() {
    try {
        const res = await wixData.query('DestinationReviews')
            .eq('destinationId', destinationId)
            .limit(1000)
            .find();
        if (!res.items.length) return;

        const avg = res.items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / res.items.length;
        const dest = await wixData.get('Destinations', destinationId);
        dest.ortalamaPuan = Math.round(avg * 10) / 10;
        await wixData.update('Destinations', dest);
    } catch (err) {
        console.warn('Ortalama puan güncellenemedi:', err);
    }
}

// ============================================================
// 3) ÜLKE REHBERİ (GUIDES) SAYFASI
// ============================================================
async function setupGuidePage() {
    const el = safeEl('#guideBody');
    if (!el) return;

    const path = wixLocation.path || [];
    const slug = path[path.length - 1];
    if (!slug) {
        console.error('URL\'de guide slug\'ı bulunamadı.');
        return;
    }

    try {
        const res = await wixData.query('Guides').eq('slug', slug).limit(1).find();
        if (!res.items.length) {
            console.error('Guide kaydı bulunamadı:', slug);
            return;
        }

        const item = res.items[0];
        guideId = item._id;

        send(el, 'GUIDE_UPDATE', {
            title:        item.title,
            slug:         item.slug,
            ulke:         item.ulke,
            bolge:        item.bolge,
            kisaAciklama: item.kisaAciklama,
            heroImage:    toImageUrl(item.heroImage),
            content:      item.content || '',
            author:       item.author || '',
            tarih:        item.tarih
                            ? new Date(item.tarih).toLocaleDateString('en-GB',
                                { day: 'numeric', month: 'short', year: 'numeric' })
                            : '',
            ortalamaPuan: item.ortalamaPuan || 0,

            homeLink:     (wixLocation.baseUrl || '/').replace(/\/$/, '') || '/',
            listLink:     GUIDES_LIST_PATH
                            ? (wixLocation.baseUrl || '').replace(/\/$/, '') + GUIDES_LIST_PATH
                            : null,

            countryDestinations: await countryDestinationsFor(item)
        }, 'data-guide');
    } catch (err) {
        console.error('Guide verisi çekilemedi:', err);
        return;
    }

    const member = await currentMember.getMember().catch(() => null);
    sendGuideMember(el, !!member);

    await loadGuideReviews(el);

    try {
        el.on('login-request', async () => {
            await authentication.promptLogin({ mode: 'login' }).catch(() => null);
            const m = await currentMember.getMember().catch(() => null);
            sendGuideMember(el, !!m);
        });

        el.on('review-submit', async (event) => {
            const d = event.detail || {};
            const m = await currentMember.getMember().catch(() => null);
            if (!m) { sendGuideMember(el, false); return; }

            try {
                await wixData.insert('GuideReviews', {
                    guideId: guideId,
                    memberId: m._id,
                    author: (m.profile && (m.profile.nickname || m.profile.slug)) || 'Traveller',
                    rating: Number(d.rating),
                    comment: d.comment || ''
                });
                await loadGuideReviews(el);
                await refreshGuideAverage();
            } catch (err) {
                console.error('Guide yorumu kaydedilemedi:', err);
            }
        });
    } catch (err) {
        console.warn('Olay dinleyicileri bağlanamadı:', err);
    }
}

async function countryDestinationsFor(item) {
    if (!item.ulke) return [];
    try {
        const res = await wixData.query('Destinations')
            .eq('ulke', item.ulke)
            .limit(24)
            .find();

        return res.items.map(function (r) {
            return {
                title:     r.title,
                ulke:      r.ulke,
                bolge:     r.bolge,
                heroImage: toImageUrl(r.heroImage),
                link:      destinationLink(r)
            };
        });
    } catch (err) {
        console.warn('Ülkeye ait destinasyonlar çekilemedi:', err);
        return [];
    }
}

async function loadGuideReviews(el) {
    try {
        const res = await wixData.query('GuideReviews')
            .eq('guideId', guideId)
            .descending('_createdDate')
            .limit(100)
            .find();

        send(el, 'GUIDE_REVIEWS_UPDATE', res.items.map(r => ({
            author: r.author || 'Traveller',
            rating: r.rating,
            comment: r.comment,
            date: r._createdDate
                ? new Date(r._createdDate).toLocaleDateString('en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' })
                : ''
        })), 'data-reviews');
    } catch (err) {
        console.warn('Guide yorumları yüklenemedi:', err);
        send(el, 'GUIDE_REVIEWS_UPDATE', [], 'data-reviews');
    }
}

async function refreshGuideAverage() {
    try {
        const res = await wixData.query('GuideReviews')
            .eq('guideId', guideId)
            .limit(1000)
            .find();
        if (!res.items.length) return;

        const avg = res.items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / res.items.length;
        const guide = await wixData.get('Guides', guideId);
        guide.ortalamaPuan = Math.round(avg * 10) / 10;
        await wixData.update('Guides', guide);
    } catch (err) {
        console.warn('Guide ortalama puanı güncellenemedi:', err);
    }
}

function sendGuideMember(el, isIn) {
    if (!el) return;
    try { el.setAttribute('data-member', isIn ? 'in' : 'out'); } catch (e) {}
    try { el.postMessage({ type: 'GUIDE_MEMBER_UPDATE', payload: isIn }); } catch (e) {}
}

// ============================================================
// 4) AKTİVİTE (EXPERIENCES) SAYFASI
// ============================================================
async function setupActivityPage() {
    const el = safeEl('#activityBody');
    if (!el) return;

    const path = wixLocation.path || [];
    const slug = path[path.length - 1];
    if (!slug) {
        console.error('URL\'de aktivite slug\'ı bulunamadı.');
        return;
    }

    try {
        // relatedDestination bir Reference alanı — .include() ile
        // genişletmezsek sadece referans ID'si gelir, destinasyonun
        // kendi alanlarına (title, heroImage, ulke, bolge) ulaşamayız.
        const res = await wixData.query('Activities')
            .eq('slug', slug)
            .include('relatedDestination')
            .limit(1)
            .find();

        if (!res.items.length) {
            console.error('Aktivite kaydı bulunamadı:', slug);
            return;
        }

        const item = res.items[0];
        activityId = item._id;
        const dest = item.relatedDestination || null;

        send(el, 'ACTIVITY_UPDATE', {
            title:          item.title,
            slug:           item.slug,
            kisaAciklama:   item.kisaAciklama,
            heroImage:      toImageUrl(item.heroImage),
            galeri:         (item.galeri || []).map(toImageUrl).filter(Boolean),
            genelBakis:     item.genelBakis,
            nasilKatilirim: item.nasilKatilirim,
            fiyat:          item.fiyat,
            sure:           item.sure,
            ortalamaPuan:   item.ortalamaPuan || 0,

            homeLink:       (wixLocation.baseUrl || '/').replace(/\/$/, '') || '/',
            listLink:       ACTIVITIES_LIST_PATH
                                ? (wixLocation.baseUrl || '').replace(/\/$/, '') + ACTIVITIES_LIST_PATH
                                : null,

            destination: dest ? {
                title:     dest.title,
                ulke:      dest.ulke,
                bolge:     dest.bolge,
                heroImage: toImageUrl(dest.heroImage),
                link:      destinationLink(dest)
            } : null
        }, 'data-activity');
    } catch (err) {
        console.error('Aktivite verisi çekilemedi:', err);
        return;
    }

    const member = await currentMember.getMember().catch(() => null);
    sendActivityMember(el, !!member);

    await loadActivityReviews(el);

    try {
        el.on('login-request', async () => {
            await authentication.promptLogin({ mode: 'login' }).catch(() => null);
            const m = await currentMember.getMember().catch(() => null);
            sendActivityMember(el, !!m);
        });

        el.on('review-submit', async (event) => {
            const d = event.detail || {};
            const m = await currentMember.getMember().catch(() => null);
            if (!m) { sendActivityMember(el, false); return; }

            try {
                await wixData.insert('ActivityReviews', {
                    activityId: activityId,
                    memberId: m._id,
                    author: (m.profile && (m.profile.nickname || m.profile.slug)) || 'Traveller',
                    rating: Number(d.rating),
                    comment: d.comment || ''
                });
                await loadActivityReviews(el);
                await refreshActivityAverage();
            } catch (err) {
                console.error('Aktivite yorumu kaydedilemedi:', err);
            }
        });
    } catch (err) {
        console.warn('Olay dinleyicileri bağlanamadı:', err);
    }
}

async function loadActivityReviews(el) {
    try {
        const res = await wixData.query('ActivityReviews')
            .eq('activityId', activityId)
            .descending('_createdDate')
            .limit(100)
            .find();

        send(el, 'ACTIVITY_REVIEWS_UPDATE', res.items.map(r => ({
            author: r.author || 'Traveller',
            rating: r.rating,
            comment: r.comment,
            date: r._createdDate
                ? new Date(r._createdDate).toLocaleDateString('en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' })
                : ''
        })), 'data-reviews');
    } catch (err) {
        console.warn('Aktivite yorumları yüklenemedi:', err);
        send(el, 'ACTIVITY_REVIEWS_UPDATE', [], 'data-reviews');
    }
}

async function refreshActivityAverage() {
    try {
        const res = await wixData.query('ActivityReviews')
            .eq('activityId', activityId)
            .limit(1000)
            .find();
        if (!res.items.length) return;

        const avg = res.items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / res.items.length;
        const activity = await wixData.get('Activities', activityId);
        activity.ortalamaPuan = Math.round(avg * 10) / 10;
        await wixData.update('Activities', activity);
    } catch (err) {
        console.warn('Aktivite ortalama puanı güncellenemedi:', err);
    }
}

function sendActivityMember(el, isIn) {
    if (!el) return;
    try { el.setAttribute('data-member', isIn ? 'in' : 'out'); } catch (e) {}
    try { el.postMessage({ type: 'ACTIVITY_MEMBER_UPDATE', payload: isIn }); } catch (e) {}
}

// ============================================================
// Yardımcılar
// ============================================================

function safeEl(selector) {
    try {
        const el = $w(selector);
        return (el && typeof el === 'object' && el.id) ? el : null;
    } catch (e) {
        return null;
    }
}

function send(el, type, payload, attrName) {
    if (!el) return;
    try {
        if (attrName) el.setAttribute(attrName, JSON.stringify(payload));
    } catch (e) { /* postMessage'a düşer */ }
    try {
        el.postMessage({ type: type, payload: payload });
    } catch (e) { /* yoksay */ }
}

function sendMember(el, isIn) {
    if (!el) return;
    try { el.setAttribute('data-member', isIn ? 'in' : 'out'); } catch (e) {}
    try { el.postMessage({ type: 'MEMBER_UPDATE', payload: isIn }); } catch (e) {}
}
