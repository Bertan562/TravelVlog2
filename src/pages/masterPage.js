// Bu dosyadaki kod sitenizin her sayfasina yuklenir.
// Header'daki arama kutusuna odaklanildiginda mega menu paneli
// (#box4) acilir; odak kaybolunca ve imlec panelden ayrilinca kapanir.

console.error('MEGA_INIT_START');
$w.onReady(function () {
    const panel = $w('#box4');
    const input = $w('#searchInput');
    const tabs = [{ tab: '#text300', content: '#text11' }, { tab: '#text301', content: '#text12' }, { tab: '#text302', content: '#text13' }, { tab: '#text303', content: '#text14' }];
const ACTIVE_CLASS = 'tv-tab-active';
function selectTab(activeIndex) {
    tabs.forEach(function (t, i) {
        try {
            if (i === activeIndex) {
            $w(t.content).show();
            $w(t.tab).customClassList.add(ACTIVE_CLASS);
        } else {
            $w(t.content).hide();
            $w(t.tab).customClassList.remove(ACTIVE_CLASS);A
            }
        } catch (e) {}
    })
}
tabs.forEach(function (t, i) {
    try {
    $w(t.tab).onClick(function () { selectTab(i); });
    } catch (e) {}
})

    selectTab(0);
    console.error('MEGA_INIT_AFTER_TABS');

    let overPanel = false;
    let closeTimer = null;

    function openMega() {
        console.error('MEGA_OPEN_CALLED');
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        try { panel.customClassList.add('tv-search-open'); } catch (e) {}
    }

    function closeMega() {
        try { panel.customClassList.remove('tv-search-open'); } catch (e) {}
    }

    function scheduleClose() {
        if (closeTimer) { clearTimeout(closeTimer); }
        closeTimer = setTimeout(function () {
            if (!overPanel) { closeMega(); }
        }, 200);
    }

    // Panel DOM'da hep dursun; gorunurlugu global.css yonetiyor.
    try { panel.expand(); } catch (e) {}
    try { panel.show(); } catch (e) {}
    closeMega();

    try {
        input.onFocus(openMega);
        input.onBlur(scheduleClose);
    } catch (e) {}

    try {
        panel.onMouseIn(function () {
            overPanel = true;
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        });
        panel.onMouseOut(function () {
            overPanel = false;
            scheduleClose();
        });
    } catch (e) {}
});


$w('#section2').onMouseIn((event) => {
        
})