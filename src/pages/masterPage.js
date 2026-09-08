// ============================================================
// masterPage.js — TravelVlog
// ------------------------------------------------------------
// Bu dosyadaki kod sitenin her sayfasına yüklenir.
//
// Amaç: header'daki <travel-header> custom element'ine (id:
// #travelHeader) mega menü verisini göndermek.
//
// Kaynak: "Destinations" koleksiyonu. Her destinasyon, mega
// menüde "bolge" alanına göre gruplanır (Avrupa, Asya vb.);
// bolge boşsa "Destinations" altında görünür.
// ============================================================

import wixData from 'wix-data';

$w.onReady(function () {
    loadMenuIntoHeader();
});

async function loadMenuIntoHeader() {
    try {
        const results = await wixData.query('Destinations')
            .limit(1000)
            .find();

        const topics = results.items.map((item) => ({
            id: item._id,
            title: item.title,
            slug: item.slug,
            category: item.bolge || 'Destinations',
            imageUrl: item.heroImage || null,
            description: item.kisaAciklama || ''
        }));

        sendTopicsToHeader(topics);
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
    if (!headerEl) return;

    try {
        headerEl.setAttribute('data-menu-topics', JSON.stringify(topics));
    } catch (e) {
        console.warn('setAttribute başarısız, postMessage denenecek.', e);
    }

    try {
        headerEl.postMessage({ type: 'MENU_TOPICS_UPDATE', payload: topics });
    } catch (e) {
        console.warn('postMessage başarısız:', e);
    }
}
