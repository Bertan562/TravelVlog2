// ============================================================
// masterPage.js — TravelVlog
// ------------------------------------------------------------
// Bu dosyadaki kod sitenin her sayfasına yüklenir. İki iş yapar:
//
//   1) HEADER  → <travel-header> (#travelHeader) custom element'ine
//      mega menü verisini gönderir. Kaynak: Destinations koleksiyonu,
//      sabit "Destinations" sekmesi altında listelenir.
//      Header sekmeleri (Trending, Destinations, Guides, Experiences,
//      Vlogs) sabittir; CMS verisine göre değişmez.
//
//   2) DESTİNASYON SAYFASI → sayfada <travel-destination>
//      (#destinationBody) varsa, URL'deki slug'a ait kaydı çekip
//      elemana aktarır; yorumları yükler, yeni yorum kaydeder.
//
// Not: Sayfa kodu (Destinations (Item).js) yerine burada duruyor,
// çünkü Wix o dosyayı git'e senkronize etmiyor. İşlev aynı.
// ============================================================

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members-frontend';

let destinationId = null;

// Dinamik destinasyon sayfasının URL öneki. Wix Editor'de sayfanın
// URL kalıbını değiştirirsen (Sayfalar → Destinations (Item) →
// SEO/URL), burayı da güncelle.
const DESTINATION_PATH = '/destinations/';

// Kart linkini kur.
//
// Wix'in koleksiyona otomatik eklediği "link-..." alanını KULLANMIYORUZ:
// sitede eskiden kalma başka bir dinamik sayfa olduğu için yanlış yol
// (/destinations/...) döndürüyor. Doğru yolu DESTINATION_PATH ile
// kendimiz kuruyoruz.
//
// Ayrıca site bir alt yolda yayınlanabiliyor (ör. .../travelvlog), o
// yüzden göreli yol yerine wixLocation.baseUrl üzerinden tam adres
// üretiyoruz — aksi halde 404 alınır.
function destinationLink(item) {
    const base = (wixLocation.baseUrl || '').replace(/\/$/, '');
    return base + DESTINATION_PATH + item.slug;
}

$w.onReady(async function () {
    loadHeaderMenu();
    await setupDestinationPage();
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
            category: 'Destinations',   // sekme sabit
            imageUrl: item.heroImage || null,
            description: item.kisaAciklama || '',
            // Dinamik sayfanın gerçek adresi. Wix, koleksiyona
            // otomatik bir "link-..." alanı ekler; varsa onu
            // kullan, yoksa yolu elle kur.
            link: destinationLink(item)
        }));

        send(headerEl, 'MENU_TOPICS_UPDATE', topics, 'data-menu-topics');
    } catch (err) {
        console.error('Menü verisi çekilemedi:', err);
    }
}

// ============================================================
// 2) DESTİNASYON SAYFASI
// ============================================================
async function setupDestinationPage() {
    const el = safeEl('#destinationBody');
    if (!el) return;   // bu sayfa bir destinasyon sayfası değil

    // URL'in son parçası slug: /destinations-1/kyoto → "kyoto"
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
            heroImage:       item.heroImage || null,
            galeri:          (item.galeri || []).map(g => g.src || g.url || g).filter(Boolean),
            genelBakis:      item.genelBakis,
            nasilGidilir:    item.nasilGidilir,
            konaklama:       item.konaklama,
            gezilecekYerler: item.gezilecekYerler,
            yemeIcme:        item.yemeIcme,
            kultur:          item.kultur,
            tarih:           item.tarih,
            ortalamaPuan:    item.ortalamaPuan || 0
        }, 'data-destination');
    } catch (err) {
        console.error('Destinasyon verisi çekilemedi:', err);
        return;
    }

    // Üyelik durumu
    const member = await currentMember.getMember().catch(() => null);
    sendMember(el, !!member);

    await loadReviews(el);

    // Elemandan gelen olaylar
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
        // Koleksiyon henüz yoksa sessizce boş liste gönder.
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
// Yardımcılar
// ============================================================

// $w, olmayan bir ID için hata fırlatabiliyor — güvenli seçim.
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
