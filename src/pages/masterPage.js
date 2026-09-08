// ============================================================
// masterPage.js — TravelVlog
// ------------------------------------------------------------
// Bu dosyadaki kod sitenin her sayfasına yüklenir.
//
// Amaç: "MenuTopics" CMS koleksiyonundaki verileri, header'daki
// <travel-header> custom element'ine (id: #travelHeader) hem
// attribute hem postMessage yoluyla aktarmak. Header, bu veriyi
// kategoriye (category alanı) göre gruplayıp mega menüsünü
// otomatik olarak dolduruyor.
//
// Not: Eski native-eleman (#box4, #searchInput, #text30x vb.)
// menü kodu artık kullanılmıyor; header tamamen Custom Element
// (travel-header.js) tarafından yönetiliyor.
// ============================================================

import wixData from 'wix-data';

$w.onReady(function () {
    loadMenuTopicsIntoHeader();
});

async function loadMenuTopicsIntoHeader() {
    try {
        const results = await wixData.query('MenuTopics')
            .limit(1000)
            .find();

        const topics = results.items.map((item) => ({
            id: item._id,
            title: item.title,
            slug: item.slug,
            category: item.category,
            imageUrl: item.image ? item.image : null,
            description: item.description || ''
        }));

        sendTopicsToHeader(topics);
    } catch (err) {
        console.error('MenuTopics verisi çekilemedi:', err);
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
