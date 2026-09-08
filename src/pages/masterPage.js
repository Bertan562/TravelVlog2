// ============================================================
// masterPage.js — TravelVlog
// ------------------------------------------------------------
// Bu dosyadaki kod sitenin her sayfasına yüklenir.
//
// Amaç: header'daki <travel-header> custom element'ine (id:
// #travelHeader) mega menü verisini hazırlayıp göndermek.
//
// Veri iki kaynaktan birleştiriliyor:
//   1) "MenuTopics"    → Trending, Guides, Experiences, Vlogs
//                        gibi henüz kendi detay sayfası olmayan
//                        kategoriler.
//   2) "Destinations"  → Kendi dinamik sayfası olan destinasyonlar
//                        (Genel Bakış, Nasıl Gidilir, Konaklama vb.
//                        bölümleriyle). Bu koleksiyon aynı zamanda
//                        destinasyon sayfalarının da veri kaynağı.
//
// travel-header.js, gelen listeyi "category" alanına göre
// otomatik olarak sekmelere grupluyor — bu yüzden burada sadece
// iki kaynağı aynı ortak biçime ("title, slug, category, imageUrl,
// description") çevirip birleştirmemiz yeterli.
// ============================================================

import wixData from 'wix-data';

$w.onReady(function () {
    loadMenuTopicsIntoHeader();
});

async function loadMenuTopicsIntoHeader() {
    try {
        const [menuTopicsResult, destinationsResult] = await Promise.all([
            wixData.query('MenuTopics').limit(1000).find(),
            wixData.query('Destinations').limit(1000).find()
        ]);

        const menuTopics = menuTopicsResult.items.map((item) => ({
            id: item._id,
            title: item.title,
            slug: item.slug,
            category: item.category,
            imageUrl: item.image ? item.image : null,
            description: item.description || ''
        }));

        // Destinations koleksiyonundaki her kayıt, header'da her
        // zaman "Destinations" sekmesi altında görünür. Kart
        // metni olarak kısa açıklama (kisaAciklama), sayfaya
        // gitmek için de slug kullanılıyor.
        const destinations = destinationsResult.items.map((item) => ({
            id: item._id,
            title: item.title,
            slug: item.slug,
            category: 'Destinations',
            imageUrl: item.heroImage ? item.heroImage : null,
            description: item.kisaAciklama || ''
        }));

        sendTopicsToHeader([...menuTopics, ...destinations]);
    } catch (err) {
        console.error('Menü verisi çekilemedi:', err);
    }
}

function sendTopicsToHeader(topics) {
    let headerEl;
    try {
        headerEl = $w('#travelHeader');
    } catch (e) {
        console.error('#travelHeader elementi bulunamadı:', e);
        return;
    }

    if (!headerEl) {
        console.error('#travelHeader elementi bulunamadı.');
        return;
    }

    // Yöntem 1: attribute olarak JSON string set etme
    // (travel-header.js içinde attributeChangedCallback ile okunuyor)
    try {
        headerEl.setAttribute('data-menu-topics', JSON.stringify(topics));
    } catch (e) {
        console.warn('setAttribute başarısız, sadece postMessage kullanılacak.', e);
    }

    // Yöntem 2: postMessage ile custom element'e mesaj gönderme
    // (travel-header.js içinde 'message' event'i ile dinleniyor)
    try {
        headerEl.postMessage({
            type: 'MENU_TOPICS_UPDATE',
            payload: topics
        });
    } catch (e) {
        console.warn('postMessage başarısız:', e);
    }
}
