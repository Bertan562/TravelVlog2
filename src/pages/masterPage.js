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
//   1a) HEADER AUTH → Log In / Sign Up / Log Out / Submit Content.
//       Wix'te giriş bir sayfa değil açılır penceredir; header
//       'headerAction' olayı gönderir, pencere burada açılır.
//       Üyelik durumu header'a geri bildirilir.
//
//   1b) ANASAYFA HERO → günün destinasyonu (<travel-home>)
//   1c) ANASAYFA ÖNE ÇIKANLAR → oneCikan=true olan kayıtlar (<travel-featured>)
//   1d) ANASAYFA KEŞFET IZGARASI → tüm destinasyonlardan 15 kart + /destinations-all
//   1e) ANASAYFA EXPERIENCES IZGARASI → Activities'ten 15 kart + /experiences-all
//        Kartlar /experiences/{slug} → Activities (Item) dinamik sayfasına gider.
//   1f) DESTİNASYON LİSTE SAYFASI → bölge filtresi + arama + ızgara
//
//   1g) VLOG LİSTE SAYFASI → /vlogs-all sayfasında <travel-vlog-list>
//       (#vlogsList) varsa, sadece status="Approved" olan Vlogs
//       kayıtlarını submissionDate'e göre azalan sırada çekip
//       elemana aktarır. Arama/destinasyon/tip filtreleri elemanın
//       kendi içinde (client-side) yapılır.
//
//   1h) MY VLOGS SAYFASI → /my-vlogs sayfasında <travel-my-vlogs>
//       (#myVlogsList) varsa, giriş yapan üyenin KENDİ vloglarını
//       (Pending/Approved/Rejected hepsi) çekip elemana aktarır.
//
//   2) DESTİNASYON SAYFASI → sayfada <travel-destination>
//      (#destinationBody) varsa, URL'deki slug'a ait kaydı çekip
//      elemana aktarır; yorumları yükler, yeni yorum kaydeder.
//
//   3) ÜLKE REHBERİ (GUIDES) SAYFASI → sayfada <travel-guide>
//      (#guideBody) varsa, URL'deki slug'a ait Guides kaydını çekip
//      elemana aktarır.
//
//   4) AKTİVİTE (EXPERIENCES) SAYFASI → sayfada <travel-activity>
//      (#activityBody) varsa, URL'deki slug'a ait Activities kaydını
//      çekip elemana aktarır.
//
//   5) DENEYİMLER LİSTE SAYFASI → /experiences-all
//      sayfasında <travel-activity-list> (#activitiesList) varsa,
//      Activities kayıtlarını çekip elemana aktarır.
//
// ============================================================

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members-frontend';
import { resolveAuthorNames } from 'backend/vlogAuthors';

let destinationId = null;
let guideId = null;
let activityId = null;


// ============================================================
// URL PATH AYARLARI
// ============================================================

const DESTINATION_PATH = '/destinations/';

const DESTINATIONS_LIST_PATH = '/destinations-all';

const GUIDE_PATH = '/countries/';

const GUIDES_LIST_PATH = '/guides-all';

const ACTIVITY_PATH = '/experiences/';

const ACTIVITIES_LIST_PATH = '/experiences-all';

const VLOG_PATH = '/vlogs/';

const VLOGS_LIST_PATH = '/vlogs-all';


// ------------------------------------------------------------
// VLOG BÖLÜMÜ
// ------------------------------------------------------------
// Sayfalar yapıldıkça null olanları doldurun. Bu değerler
// travel-header.js içindeki ROUTES bloğuyla aynı kalmalı.
// ------------------------------------------------------------

const CREATE_VLOG_PATH = '/cratevlog';

const MY_VLOGS_PATH = '/my-vlogs';

const PROFILE_PATH = null;


// ============================================================
// WIX IMAGE → PUBLIC URL
// ============================================================

function toImageUrl(value) {
    if (!value) return null;

    var v = (typeof value === 'string')
        ? value
        : (value.src || value.url || '');

    if (!v) return null;

    if (v.indexOf('wix:image://') !== 0) {
        return v;
    }

    var rest = v.slice('wix:image://'.length);

    var parts = rest.split('/');

    var file = parts[1] || '';

    file = file.split('#')[0];

    return file
        ? 'https://static.wixstatic.com/media/' + file
        : null;
}


// ============================================================
// DESTINATION LINK
// ============================================================

function destinationLink(item) {

    const base =
        (wixLocation.baseUrl || '').replace(/\/$/, '');

    return base +
        DESTINATION_PATH +
        item.slug;
}


// ============================================================
// GUIDE LINK
// ============================================================

function guideLink(item) {

    const base =
        (wixLocation.baseUrl || '').replace(/\/$/, '');

    return base +
        GUIDE_PATH +
        item.slug;
}


// ============================================================
// ACTIVITY LINK
// ============================================================
//
// Activities (Item) dynamic page:
//
// /experiences/{slug}
//
// Örnek:
//
// /experiences/balloon-tour
//
// ============================================================

function activityLink(item) {

    const base =
        (wixLocation.baseUrl || '').replace(/\/$/, '');

    return base +
        ACTIVITY_PATH +
        item.slug;
}


// ============================================================
// VLOG LINK
// ============================================================
//
// Vlog (Item) dynamic page:
//
// /vlogs/{slug}
//
// Örnek:
//
// /vlogs/cappadocia
//
// ============================================================

function vlogLink(item) {

    const base =
        (wixLocation.baseUrl || '').replace(/\/$/, '');

    return base +
        VLOG_PATH +
        item.slug;
}


// ============================================================
// MASTER PAGE READY
// ============================================================

$w.onReady(async function () {

    loadHeaderMenu();

    // YENİ:
    // Header giriş / kayıt / çıkış butonları
    setupHeaderAuth();

    setupHomeHero();

    setupFeaturedBand();

    setupExploreGrid();

    // Homepage Experiences section
    setupExperiencesGrid();

    setupDestinationsList();

    setupVlogsList();

    await setupMyVlogsList();

    await setupDestinationPage();

    await setupGuidePage();

    await setupActivityPage();

    await setupActivitiesList();
});


// ============================================================
// 1) HEADER MEGA MENU
// ============================================================

async function loadHeaderMenu() {

    const headerEl =
        safeEl('#travelHeader');

    if (!headerEl) return;

    try {

        const res =
            await wixData
                .query('Destinations')
                .limit(1000)
                .find();

        const topics =
            res.items.map((item) => ({

                id: item._id,

                title: item.title,

                slug: item.slug,

                category: 'Destinations',

                imageUrl:
                    toImageUrl(item.heroImage),

                description:
                    item.kisaAciklama || '',

                link:
                    destinationLink(item)

            }));

        send(
            headerEl,
            'MENU_TOPICS_UPDATE',
            topics,
            'data-menu-topics'
        );

    } catch (err) {

        console.error(
            'Menü verisi çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1a) HEADER AUTH
// ============================================================
//
// Wix'te giriş ve kayıt bir sayfa değil, açılır penceredir.
// Custom element bu pencereyi kendi açamaz; 'headerAction'
// olayı gönderir, burada karşılanır.
//
// Header üyelik durumuna göre görünümünü değiştirir:
//
//   çıkış  → Log In | Sign Up | Submit Content
//   giriş  → Profile | My Vlogs | Submit Content | Log Out
//
// ============================================================

async function setupHeaderAuth() {

    const el =
        safeEl('#travelHeader');

    if (!el) return;

    await pushMemberState(el);

    try {

        el.on(
            'headerAction',
            async (event) => {

                const action =
                    (event.detail || {}).action;

                await handleHeaderAction(
                    action,
                    el
                );
            }
        );

    } catch (err) {

        console.warn(
            'Header olay dinleyicisi bağlanamadı:',
            err
        );
    }
}


async function pushMemberState(el) {

    let loggedIn = false;

    let name = '';

    try {

        const member =
            await currentMember.getMember();

        loggedIn = !!member;

        if (member) {

            const first =
                (member.contactDetails &&
                    member.contactDetails.firstName) || '';

            const last =
                (member.contactDetails &&
                    member.contactDetails.lastName) || '';

            name =
                (first + ' ' + last).trim() ||
                (member.profile &&
                    member.profile.nickname) ||
                '';
        }

    } catch (err) {

        console.warn(
            'Üyelik durumu okunamadı:',
            err
        );
    }

    send(
        el,
        'MEMBER_STATE_UPDATE',
        {
            loggedIn: loggedIn,
            name: name
        },
        'data-member-state'
    );
}


async function handleHeaderAction(action, el) {

    try {

        if (
            action === 'login' ||
            action === 'signup'
        ) {

            await authentication
                .promptLogin({ mode: action })
                .catch(() => null);

            await pushMemberState(el);

            return;
        }


        if (action === 'logout') {

            await authentication
                .logout()
                .catch(() => null);

            await pushMemberState(el);

            wixLocation.to('/');

            return;
        }


        if (action === 'submitContent') {

            // Vlog göndermek üyelik gerektiriyor; önce kayıt
            // penceresi açılır, kayıt olunursa forma gidilir.

            const member =
                await currentMember
                    .getMember()
                    .catch(() => null);

            if (!member) {

                await authentication
                    .promptLogin({ mode: 'signup' })
                    .catch(() => null);

                const after =
                    await currentMember
                        .getMember()
                        .catch(() => null);

                await pushMemberState(el);

                if (!after) return;
            }

            wixLocation.to(CREATE_VLOG_PATH);

            return;
        }


        if (action === 'myVlogs') {

            if (MY_VLOGS_PATH) {
                wixLocation.to(MY_VLOGS_PATH);
            } else {
                console.warn('My Vlogs sayfası henüz yok');
            }

            return;
        }


        if (action === 'profile') {

            if (PROFILE_PATH) {
                wixLocation.to(PROFILE_PATH);
            } else {
                console.warn('Profil sayfası henüz yok');
            }
        }

    } catch (err) {

        console.error(
            'Header işlemi başarısız (' + action + '):',
            err
        );
    }
}


// ============================================================
// 1b) HOMEPAGE HERO
// ============================================================

async function setupHomeHero() {

    const el =
        safeEl('#homeHero');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Destinations')
                .limit(1000)
                .find();

        if (!res.items.length) return;

        const items =
            res.items
                .slice()
                .sort((a, b) =>
                    String(a._id)
                        .localeCompare(
                            String(b._id)
                        )
                );

        const daysSinceEpoch =
            Math.floor(
                Date.now() / 86400000
            );

        const item =
            items[
                daysSinceEpoch %
                items.length
            ];

        send(
            el,
            'DAILY_UPDATE',
            {

                title:
                    item.title,

                ulke:
                    item.ulke,

                bolge:
                    item.bolge,

                kisaAciklama:
                    item.kisaAciklama,

                heroImage:
                    toImageUrl(
                        item.heroImage
                    ),

                link:
                    destinationLink(item),

                ortalamaPuan:
                    item.ortalamaPuan || 0

            },
            'data-daily'
        );

    } catch (err) {

        console.error(
            'Günün destinasyonu çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1c) HOMEPAGE FEATURED DESTINATIONS
// ============================================================

async function setupFeaturedBand() {

    const el =
        safeEl('#featuredBand');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Destinations')
                .eq('oneCikan', true)
                .limit(8)
                .find();

        send(
            el,
            'FEATURED_UPDATE',
            res.items.map(function (item) {

                return {

                    title:
                        item.title,

                    link:
                        destinationLink(item),

                    heroImage:
                        toImageUrl(
                            item.heroImage
                        ),

                    ulke:
                        item.ulke,

                    bolge:
                        item.bolge,

                    ortalamaPuan:
                        item.ortalamaPuan || 0

                };

            }),
            'data-featured'
        );

    } catch (err) {

        console.error(
            'Öne çıkan destinasyonlar çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1d) HOMEPAGE DESTINATIONS GRID
// ============================================================

async function setupExploreGrid() {

    const el =
        safeEl('#exploreGrid');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Destinations')
                .ascending('title')
                .limit(15)
                .find();

        const items =
            res.items.map(function (item) {

                return {

                    title:
                        item.title,

                    link:
                        destinationLink(item),

                    heroImage:
                        toImageUrl(
                            item.heroImage
                        ),

                    ulke:
                        item.ulke,

                    bolge:
                        item.bolge

                };

            });

        const viewAllLink =
            (wixLocation.baseUrl || '')
                .replace(/\/$/, '') +
            DESTINATIONS_LIST_PATH;

        send(
            el,
            'EXPLORE_UPDATE',
            {
                items: items,
                viewAllLink: viewAllLink
            },
            'data-explore'
        );

    } catch (err) {

        console.error(
            'Keşfet ızgarası çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1e) HOMEPAGE EXPERIENCES GRID
// ============================================================
//
// Homepage'deki:
//
// <travel-experiences-grid id="experiencesGrid">
//
// elementine Activities CMS kayıtlarını gönderir.
//
// ------------------------------------------------------------
//
// KARTLAR:
//
// /experiences/{slug}
//
// → Activities (Item)
//
// ------------------------------------------------------------
//
// ALT BUTON:
//
// /experiences-all
//
// → Experiences list page
//
// ============================================================

async function setupExperiencesGrid() {

    const el =
        safeEl('#experiencesGrid');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Activities')
                .include('relatedDestination')
                .ascending('title')
                .limit(15)
                .find();


        const items =
            res.items.map(function (item) {

                const dest =
                    item.relatedDestination ||
                    null;

                return {

                    title:
                        item.title,

                    slug:
                        item.slug,

                    // ========================================
                    // Activities (Item) dynamic page
                    // ========================================

                    link:
                        activityLink(item),

                    heroImage:
                        toImageUrl(
                            item.heroImage
                        ),

                    fiyat:
                        item.fiyat || '',

                    sure:
                        item.sure || '',

                    destinationTitle:
                        dest
                            ? dest.title
                            : '',

                    ulke:
                        dest
                            ? dest.ulke
                            : '',

                    bolge:
                        dest
                            ? dest.bolge
                            : ''

                };

            });


        // ================================================
        // Explore all experiences
        // ================================================

        const viewAllLink =
            (wixLocation.baseUrl || '')
                .replace(/\/$/, '') +
            ACTIVITIES_LIST_PATH;


        // ================================================
        // Send to custom element
        // ================================================

        send(
            el,
            'EXPERIENCES_UPDATE',
            {

                items:
                    items,

                viewAllLink:
                    viewAllLink

            },
            'data-experiences'
        );


    } catch (err) {

        console.error(
            'Homepage Experiences verisi çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1f) DESTINATIONS LIST PAGE
// ============================================================

async function setupDestinationsList() {

    const el =
        safeEl('#destinationsList');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Destinations')
                .limit(1000)
                .find();

        send(
            el,
            'DESTINATIONS_UPDATE',
            res.items.map(function (item) {

                return {

                    title:
                        item.title,

                    ulke:
                        item.ulke,

                    bolge:
                        item.bolge,

                    kisaAciklama:
                        item.kisaAciklama,

                    imageUrl:
                        toImageUrl(
                            item.heroImage
                        ),

                    link:
                        destinationLink(item)

                };

            }),
            'data-destinations'
        );

    } catch (err) {

        console.error(
            'Destinasyon listesi çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1g) VLOGS LIST PAGE
// ============================================================
//
// URL:
//
// /vlogs-all
//
// Custom element:
//
// <travel-vlog-list id="vlogsList">
//
// Sadece status="Approved" kayıtlar gönderilir; Pending/Rejected
// hiçbir zaman bu elemana ulaşmaz. Arama/destinasyon/tip filtreleri
// elemanın kendi içinde (client-side) uygulanır.
//
// ============================================================

async function setupVlogsList() {

    const el =
        safeEl('#vlogsList');

    if (!el) return;

    try {

        const res =
            await wixData
                .query('Vlogs')
                .eq('status', 'Approved')
                .descending('submissionDate')
                .limit(1000)
                .find();

        // author alanı backend/vlogSubmission.jsw'de member._id (ham
        // üye ID'si) olarak yazılıyor; okunabilir isme çevirmek için
        // backend/vlogAuthors.jsw'deki toplu çözümleyiciyi kullanıyoruz
        // (aynı mantık backend/vlogPublic.jsw'deki resolveAuthorName
        // ile, sadece tek seferde birden çok ID çözebiliyor).
        const authorNames =
            await resolveAuthorNames(
                res.items.map(
                    (item) => item.author
                )
            );

        send(
            el,
            'VLOGS_UPDATE',
            res.items.map(function (item) {

                return {

                    title:
                        item.title,

                    slug:
                        item.slug,

                    contentType:
                        item.contentType,

                    description:
                        item.description,

                    coverImage:
                        toImageUrl(
                            item.coverImage
                        ),

                    // DİKKAT: gerçek alan adları destinationName /
                    // experienceName — relatedDestination /
                    // relatedExperience bu koleksiyonda hiç
                    // yazılmayan, hep boş kalan eski alanlar.
                    destinationName:
                        item.destinationName,

                    experienceName:
                        item.experienceName,

                    author:
                        authorNames[item.author] ||
                        'Traveller',

                    link:
                        vlogLink(item)

                };

            }),
            'data-vlogs'
        );

    } catch (err) {

        console.error(
            'Vlog listesi çekilemedi:',
            err
        );
    }
}


// ============================================================
// 1h) MY VLOGS PAGE
// ============================================================
//
// URL:
//
// /my-vlogs
//
// Custom element:
//
// <travel-my-vlogs id="myVlogsList">
//
// Giriş yapan üyenin KENDİ gönderdiği vlogları, durumu ne olursa
// olsun (Pending/Approved/Rejected), gösterir — setupVlogsList()'in
// aksine burada status filtresi YOK. Üye giriş yapmamışsa boş bir
// liste gönderilir (sayfa izinleri zaten "Sadece üyeler" olmalı,
// ama kod tarafında da savunma amaçlı kontrol ediyoruz).
//
// ============================================================

async function setupMyVlogsList() {

    const el =
        safeEl('#myVlogsList');

    if (!el) return;

    try {

        const member =
            await currentMember
                .getMember()
                .catch(() => null);

        if (!member) {

            send(
                el,
                'MY_VLOGS_UPDATE',
                [],
                'data-my-vlogs'
            );

            return;
        }

        const res =
            await wixData
                .query('Vlogs')
                .eq('author', member._id)
                .descending('submissionDate')
                .limit(1000)
                .find();

        send(
            el,
            'MY_VLOGS_UPDATE',
            res.items.map(function (item) {

                return {

                    title:
                        item.title,

                    slug:
                        item.slug,

                    contentType:
                        item.contentType,

                    coverImage:
                        toImageUrl(
                            item.coverImage
                        ),

                    destinationName:
                        item.destinationName,

                    status:
                        item.status,

                    moderatorNote:
                        item.moderatorNote ||
                        '',

                    submissionDate:
                        item.submissionDate,

                    // status "Approved" değilse link null —
                    // eleman Pending/Rejected kartları tıklanamaz
                    // gösterip yayında olmayan bir sayfaya
                    // yönlendirmemeli.
                    link:
                        item.status === 'Approved'
                            ? vlogLink(item)
                            : null

                };

            }),
            'data-my-vlogs'
        );

    } catch (err) {

        console.error(
            'Kendi vloglarım çekilemedi:',
            err
        );
    }
}


// ============================================================
// 2) DESTINATION DETAIL PAGE
// ============================================================

async function setupDestinationPage() {

    const el =
        safeEl('#destinationBody');

    if (!el) return;

    const path =
        wixLocation.path || [];

    const slug =
        path[path.length - 1];

    if (!slug) {

        console.error(
            'URL\'de destinasyon slug\'ı bulunamadı.'
        );

        return;
    }

    try {

        const res =
            await wixData
                .query('Destinations')
                .eq('slug', slug)
                .limit(1)
                .find();

        if (!res.items.length) {

            console.error(
                'Destinasyon kaydı bulunamadı:',
                slug
            );

            return;
        }

        const item =
            res.items[0];

        destinationId =
            item._id;


        send(
            el,
            'DESTINATION_UPDATE',
            {

                title:
                    item.title,

                slug:
                    item.slug,

                ulke:
                    item.ulke,

                bolge:
                    item.bolge,

                kisaAciklama:
                    item.kisaAciklama,

                heroImage:
                    toImageUrl(
                        item.heroImage
                    ),

                galeri:
                    (item.galeri || [])
                        .map(toImageUrl)
                        .filter(Boolean),

                genelBakis:
                    item.genelBakis,

                nasilGidilir:
                    item.nasilGidilir,

                konaklama:
                    item.konaklama,

                gezilecekYerler:
                    item.gezilecekYerler,

                yemeIcme:
                    item.yemeIcme,

                kultur:
                    item.kultur,

                tarih:
                    item.tarih,

                ortalamaPuan:
                    item.ortalamaPuan || 0,


                homeLink:
                    (wixLocation.baseUrl || '/')
                        .replace(/\/$/, '') || '/',


                listLink:
                    DESTINATIONS_LIST_PATH
                        ? (
                            (wixLocation.baseUrl || '')
                                .replace(/\/$/, '') +
                            DESTINATIONS_LIST_PATH
                        )
                        : null,


                related:
                    await relatedFor(item)

            },
            'data-destination'
        );


    } catch (err) {

        console.error(
            'Destinasyon verisi çekilemedi:',
            err
        );

        return;
    }


    const member =
        await currentMember
            .getMember()
            .catch(() => null);

    sendMember(
        el,
        !!member
    );


    await loadReviews(el);


    try {

        el.on(
            'login-request',
            async () => {

                await authentication
                    .promptLogin({
                        mode: 'login'
                    })
                    .catch(() => null);

                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);

                sendMember(
                    el,
                    !!m
                );
            }
        );


        el.on(
            'review-submit',
            async (event) => {

                const d =
                    event.detail || {};

                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);

                if (!m) {

                    sendMember(
                        el,
                        false
                    );

                    return;
                }


                try {

                    await wixData.insert(
                        'DestinationReviews',
                        {

                            destinationId:
                                destinationId,

                            memberId:
                                m._id,

                            author:
                                (
                                    m.profile &&
                                    (
                                        m.profile.nickname ||
                                        m.profile.slug
                                    )
                                ) ||
                                'Traveller',

                            rating:
                                Number(d.rating),

                            comment:
                                d.comment || ''

                        }
                    );


                    await loadReviews(el);

                    await refreshAverage();


                } catch (err) {

                    console.error(
                        'Yorum kaydedilemedi:',
                        err
                    );
                }
            }
        );


    } catch (err) {

        console.warn(
            'Olay dinleyicileri bağlanamadı:',
            err
        );
    }
}


// ============================================================
// RELATED DESTINATIONS
// ============================================================

async function relatedFor(item) {

    try {

        let res = null;


        if (item.bolge) {

            res =
                await wixData
                    .query('Destinations')
                    .eq('bolge', item.bolge)
                    .ne('_id', item._id)
                    .limit(4)
                    .find();

        }


        if (
            !res ||
            !res.items.length
        ) {

            res =
                await wixData
                    .query('Destinations')
                    .ne('_id', item._id)
                    .limit(4)
                    .find();

        }


        return res.items.map(
            function (r) {

                return {

                    title:
                        r.title,

                    ulke:
                        r.ulke,

                    bolge:
                        r.bolge,

                    imageUrl:
                        toImageUrl(
                            r.heroImage
                        ),

                    link:
                        destinationLink(r)

                };

            }
        );


    } catch (err) {

        console.warn(
            'İlgili destinasyonlar çekilemedi:',
            err
        );

        return [];
    }
}


// ============================================================
// DESTINATION REVIEWS
// ============================================================

async function loadReviews(el) {

    try {

        const res =
            await wixData
                .query('DestinationReviews')
                .eq(
                    'destinationId',
                    destinationId
                )
                .descending('_createdDate')
                .limit(100)
                .find();


        send(
            el,
            'REVIEWS_UPDATE',
            res.items.map(r => ({

                author:
                    r.author ||
                    'Traveller',

                rating:
                    r.rating,

                comment:
                    r.comment,

                date:
                    r._createdDate
                        ? new Date(
                            r._createdDate
                        ).toLocaleDateString(
                            'en-GB',
                            {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            }
                        )
                        : ''

            })),
            'data-reviews'
        );


    } catch (err) {

        console.warn(
            'Yorumlar yüklenemedi:',
            err
        );

        send(
            el,
            'REVIEWS_UPDATE',
            [],
            'data-reviews'
        );
    }
}


// ============================================================
// DESTINATION AVERAGE
// ============================================================

async function refreshAverage() {

    try {

        const res =
            await wixData
                .query('DestinationReviews')
                .eq(
                    'destinationId',
                    destinationId
                )
                .limit(1000)
                .find();

        if (!res.items.length) return;


        const avg =
            res.items.reduce(
                (s, r) =>
                    s +
                    (
                        Number(r.rating) ||
                        0
                    ),
                0
            ) /
            res.items.length;


        const dest =
            await wixData.get(
                'Destinations',
                destinationId
            );


        dest.ortalamaPuan =
            Math.round(avg * 10) / 10;


        await wixData.update(
            'Destinations',
            dest
        );


    } catch (err) {

        console.warn(
            'Ortalama puan güncellenemedi:',
            err
        );
    }
}


// ============================================================
// 3) GUIDE DETAIL PAGE
// ============================================================

async function setupGuidePage() {

    const el =
        safeEl('#guideBody');

    if (!el) return;


    const path =
        wixLocation.path || [];

    const slug =
        path[path.length - 1];


    if (!slug) {

        console.error(
            'URL\'de guide slug\'ı bulunamadı.'
        );

        return;
    }


    try {

        const res =
            await wixData
                .query('Guides')
                .eq('slug', slug)
                .limit(1)
                .find();


        if (!res.items.length) {

            console.error(
                'Guide kaydı bulunamadı:',
                slug
            );

            return;
        }


        const item =
            res.items[0];

        guideId =
            item._id;


        send(
            el,
            'GUIDE_UPDATE',
            {

                title:
                    item.title,

                slug:
                    item.slug,

                ulke:
                    item.ulke,

                bolge:
                    item.bolge,

                kisaAciklama:
                    item.kisaAciklama,

                heroImage:
                    toImageUrl(
                        item.heroImage
                    ),

                content:
                    item.content || '',

                author:
                    item.author || '',

                tarih:
                    item.tarih
                        ? new Date(
                            item.tarih
                        ).toLocaleDateString(
                            'en-GB',
                            {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            }
                        )
                        : '',

                ortalamaPuan:
                    item.ortalamaPuan || 0,


                homeLink:
                    (wixLocation.baseUrl || '/')
                        .replace(/\/$/, '') || '/',


                listLink:
                    GUIDES_LIST_PATH
                        ? (
                            (wixLocation.baseUrl || '')
                                .replace(/\/$/, '') +
                            GUIDES_LIST_PATH
                        )
                        : null,


                countryDestinations:
                    await countryDestinationsFor(item)

            },
            'data-guide'
        );


    } catch (err) {

        console.error(
            'Guide verisi çekilemedi:',
            err
        );

        return;
    }


    const member =
        await currentMember
            .getMember()
            .catch(() => null);


    sendGuideMember(
        el,
        !!member
    );


    await loadGuideReviews(el);


    try {

        el.on(
            'login-request',
            async () => {

                await authentication
                    .promptLogin({
                        mode: 'login'
                    })
                    .catch(() => null);


                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);


                sendGuideMember(
                    el,
                    !!m
                );
            }
        );


        el.on(
            'review-submit',
            async (event) => {

                const d =
                    event.detail || {};


                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);


                if (!m) {

                    sendGuideMember(
                        el,
                        false
                    );

                    return;
                }


                try {

                    await wixData.insert(
                        'GuideReviews',
                        {

                            guideId:
                                guideId,

                            memberId:
                                m._id,

                            author:
                                (
                                    m.profile &&
                                    (
                                        m.profile.nickname ||
                                        m.profile.slug
                                    )
                                ) ||
                                'Traveller',

                            rating:
                                Number(d.rating),

                            comment:
                                d.comment || ''

                        }
                    );


                    await loadGuideReviews(el);

                    await refreshGuideAverage();


                } catch (err) {

                    console.error(
                        'Guide yorumu kaydedilemedi:',
                        err
                    );
                }
            }
        );


    } catch (err) {

        console.warn(
            'Olay dinleyicileri bağlanamadı:',
            err
        );
    }
}


// ============================================================
// COUNTRY DESTINATIONS
// ============================================================

async function countryDestinationsFor(item) {

    if (!item.ulke) return [];


    try {

        const res =
            await wixData
                .query('Destinations')
                .eq(
                    'ulke',
                    item.ulke
                )
                .limit(24)
                .find();


        return res.items.map(
            function (r) {

                return {

                    title:
                        r.title,

                    ulke:
                        r.ulke,

                    bolge:
                        r.bolge,

                    heroImage:
                        toImageUrl(
                            r.heroImage
                        ),

                    link:
                        destinationLink(r)

                };

            }
        );


    } catch (err) {

        console.warn(
            'Ülkeye ait destinasyonlar çekilemedi:',
            err
        );

        return [];
    }
}


// ============================================================
// GUIDE REVIEWS
// ============================================================

async function loadGuideReviews(el) {

    try {

        const res =
            await wixData
                .query('GuideReviews')
                .eq(
                    'guideId',
                    guideId
                )
                .descending('_createdDate')
                .limit(100)
                .find();


        send(
            el,
            'GUIDE_REVIEWS_UPDATE',
            res.items.map(r => ({

                author:
                    r.author ||
                    'Traveller',

                rating:
                    r.rating,

                comment:
                    r.comment,

                date:
                    r._createdDate
                        ? new Date(
                            r._createdDate
                        ).toLocaleDateString(
                            'en-GB',
                            {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            }
                        )
                        : ''

            })),
            'data-reviews'
        );


    } catch (err) {

        console.warn(
            'Guide yorumları yüklenemedi:',
            err
        );

        send(
            el,
            'GUIDE_REVIEWS_UPDATE',
            [],
            'data-reviews'
        );
    }
}


// ============================================================
// GUIDE AVERAGE
// ============================================================

async function refreshGuideAverage() {

    try {

        const res =
            await wixData
                .query('GuideReviews')
                .eq(
                    'guideId',
                    guideId
                )
                .limit(1000)
                .find();


        if (!res.items.length) return;


        const avg =
            res.items.reduce(
                (s, r) =>
                    s +
                    (
                        Number(r.rating) ||
                        0
                    ),
                0
            ) /
            res.items.length;


        const guide =
            await wixData.get(
                'Guides',
                guideId
            );


        guide.ortalamaPuan =
            Math.round(avg * 10) / 10;


        await wixData.update(
            'Guides',
            guide
        );


    } catch (err) {

        console.warn(
            'Guide ortalama puanı güncellenemedi:',
            err
        );
    }
}


// ============================================================
// GUIDE MEMBER
// ============================================================

function sendGuideMember(
    el,
    isIn
) {

    if (!el) return;


    try {

        el.setAttribute(
            'data-member',
            isIn
                ? 'in'
                : 'out'
        );

    } catch (e) {}


    try {

        el.postMessage({

            type:
                'GUIDE_MEMBER_UPDATE',

            payload:
                isIn

        });

    } catch (e) {}
}


// ============================================================
// 4) ACTIVITY DETAIL PAGE
// ============================================================
//
// URL:
//
// /experiences/{slug}
//
// Wix:
//
// Activities (Item)
//
// ============================================================

async function setupActivityPage() {

    const el =
        safeEl('#activityBody');

    if (!el) return;


    const path =
        wixLocation.path || [];

    const slug =
        path[path.length - 1];


    if (!slug) {

        console.error(
            'URL\'de aktivite slug\'ı bulunamadı.'
        );

        return;
    }


    try {

        const res =
            await wixData
                .query('Activities')
                .eq('slug', slug)
                .include('relatedDestination')
                .limit(1)
                .find();


        if (!res.items.length) {

            console.error(
                'Aktivite kaydı bulunamadı:',
                slug
            );

            return;
        }


        const item =
            res.items[0];


        activityId =
            item._id;


        const dest =
            item.relatedDestination ||
            null;


        send(
            el,
            'ACTIVITY_UPDATE',
            {

                title:
                    item.title,

                slug:
                    item.slug,

                kisaAciklama:
                    item.kisaAciklama,

                heroImage:
                    toImageUrl(
                        item.heroImage
                    ),

                galeri:
                    (item.galeri || [])
                        .map(toImageUrl)
                        .filter(Boolean),

                genelBakis:
                    item.genelBakis,

                nasilKatilirim:
                    item.nasilKatilirim,

                fiyat:
                    item.fiyat,

                sure:
                    item.sure,

                ortalamaPuan:
                    item.ortalamaPuan || 0,


                homeLink:
                    (wixLocation.baseUrl || '/')
                        .replace(/\/$/, '') || '/',


                listLink:
                    ACTIVITIES_LIST_PATH
                        ? (
                            (wixLocation.baseUrl || '')
                                .replace(/\/$/, '') +
                            ACTIVITIES_LIST_PATH
                        )
                        : null,


                destination:
                    dest
                        ? {

                            title:
                                dest.title,

                            ulke:
                                dest.ulke,

                            bolge:
                                dest.bolge,

                            heroImage:
                                toImageUrl(
                                    dest.heroImage
                                ),

                            link:
                                destinationLink(
                                    dest
                                )

                        }
                        : null,


                otherDestinations:
                    await otherDestinationsFor(
                        dest
                    )

            },
            'data-activity'
        );


    } catch (err) {

        console.error(
            'Aktivite verisi çekilemedi:',
            err
        );

        return;
    }


    const member =
        await currentMember
            .getMember()
            .catch(() => null);


    sendActivityMember(
        el,
        !!member
    );


    await loadActivityReviews(el);


    try {

        el.on(
            'login-request',
            async () => {

                await authentication
                    .promptLogin({
                        mode: 'login'
                    })
                    .catch(() => null);


                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);


                sendActivityMember(
                    el,
                    !!m
                );
            }
        );


        el.on(
            'review-submit',
            async (event) => {

                const d =
                    event.detail || {};


                const m =
                    await currentMember
                        .getMember()
                        .catch(() => null);


                if (!m) {

                    sendActivityMember(
                        el,
                        false
                    );

                    return;
                }


                try {

                    await wixData.insert(
                        'ActivityReviews',
                        {

                            activityId:
                                activityId,

                            memberId:
                                m._id,

                            author:
                                (
                                    m.profile &&
                                    (
                                        m.profile.nickname ||
                                        m.profile.slug
                                    )
                                ) ||
                                'Traveller',

                            rating:
                                Number(d.rating),

                            comment:
                                d.comment || ''

                        }
                    );


                    await loadActivityReviews(el);

                    await refreshActivityAverage();


                } catch (err) {

                    console.error(
                        'Aktivite yorumu kaydedilemedi:',
                        err
                    );
                }
            }
        );


    } catch (err) {

        console.warn(
            'Olay dinleyicileri bağlanamadı:',
            err
        );
    }
}


// ============================================================
// OTHER DESTINATIONS FOR ACTIVITY
// ============================================================

async function otherDestinationsFor(dest) {

    if (
        !dest ||
        !dest.ulke
    ) {
        return [];
    }


    try {

        const res =
            await wixData
                .query('Destinations')
                .eq(
                    'ulke',
                    dest.ulke
                )
                .ne(
                    '_id',
                    dest._id
                )
                .limit(10)
                .find();


        return res.items.map(
            function (r) {

                return {

                    title:
                        r.title,

                    ulke:
                        r.ulke,

                    bolge:
                        r.bolge,

                    heroImage:
                        toImageUrl(
                            r.heroImage
                        ),

                    link:
                        destinationLink(r)

                };

            }
        );


    } catch (err) {

        console.warn(
            'Diğer destinasyonlar çekilemedi:',
            err
        );

        return [];
    }
}


// ============================================================
// ACTIVITY REVIEWS
// ============================================================

async function loadActivityReviews(el) {

    try {

        const res =
            await wixData
                .query('ActivityReviews')
                .eq(
                    'activityId',
                    activityId
                )
                .descending('_createdDate')
                .limit(100)
                .find();


        send(
            el,
            'ACTIVITY_REVIEWS_UPDATE',
            res.items.map(r => ({

                author:
                    r.author ||
                    'Traveller',

                rating:
                    r.rating,

                comment:
                    r.comment,

                date:
                    r._createdDate
                        ? new Date(
                            r._createdDate
                        ).toLocaleDateString(
                            'en-GB',
                            {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            }
                        )
                        : ''

            })),
            'data-reviews'
        );


    } catch (err) {

        console.warn(
            'Aktivite yorumları yüklenemedi:',
            err
        );

        send(
            el,
            'ACTIVITY_REVIEWS_UPDATE',
            [],
            'data-reviews'
        );
    }
}


// ============================================================
// ACTIVITY AVERAGE
// ============================================================

async function refreshActivityAverage() {

    try {

        const res =
            await wixData
                .query('ActivityReviews')
                .eq(
                    'activityId',
                    activityId
                )
                .limit(1000)
                .find();


        if (!res.items.length) return;


        const avg =
            res.items.reduce(
                (s, r) =>
                    s +
                    (
                        Number(r.rating) ||
                        0
                    ),
                0
            ) /
            res.items.length;


        const activity =
            await wixData.get(
                'Activities',
                activityId
            );


        activity.ortalamaPuan =
            Math.round(avg * 10) / 10;


        await wixData.update(
            'Activities',
            activity
        );


    } catch (err) {

        console.warn(
            'Aktivite ortalama puanı güncellenemedi:',
            err
        );
    }
}


// ============================================================
// ACTIVITY MEMBER
// ============================================================

function sendActivityMember(
    el,
    isIn
) {

    if (!el) return;


    try {

        el.setAttribute(
            'data-member',
            isIn
                ? 'in'
                : 'out'
        );

    } catch (e) {}


    try {

        el.postMessage({

            type:
                'ACTIVITY_MEMBER_UPDATE',

            payload:
                isIn

        });

    } catch (e) {}
}


// ============================================================
// 5) ACTIVITIES LIST PAGE
// ============================================================
//
// URL:
//
// /experiences-all
//
// Custom element:
//
// <travel-activity-list id="activitiesList">
//
// ============================================================

async function setupActivitiesList() {

    const el =
        safeEl('#activitiesList');

    if (!el) return;


    try {

        const res =
            await wixData
                .query('Activities')
                .include('relatedDestination')
                .limit(1000)
                .find();


        send(
            el,
            'ACTIVITIES_UPDATE',
            res.items.map(
                function (item) {

                    const dest =
                        item.relatedDestination ||
                        null;


                    return {

                        title:
                            item.title,

                        slug:
                            item.slug,

                        link:
                            activityLink(item),

                        heroImage:
                            toImageUrl(
                                item.heroImage
                            ),

                        fiyat:
                            item.fiyat,

                        sure:
                            item.sure,

                        destinationTitle:
                            dest
                                ? dest.title
                                : '',

                        ulke:
                            dest
                                ? dest.ulke
                                : '',

                        bolge:
                            dest
                                ? dest.bolge
                                : ''

                    };

                }
            ),
            'data-activities'
        );


    } catch (err) {

        console.error(
            'Deneyim listesi çekilemedi:',
            err
        );
    }
}


// ============================================================
// HELPERS
// ============================================================

function safeEl(selector) {

    try {

        const el =
            $w(selector);

        return (
            el &&
            typeof el === 'object' &&
            el.id
        )
            ? el
            : null;

    } catch (e) {

        return null;
    }
}


// ============================================================
// UNIVERSAL SEND
// ============================================================

function send(
    el,
    type,
    payload,
    attrName
) {

    if (!el) return;


    try {

        if (attrName) {

            el.setAttribute(
                attrName,
                JSON.stringify(payload)
            );
        }

    } catch (e) {
        // postMessage'a düşer
    }


    try {

        el.postMessage({

            type:
                type,

            payload:
                payload

        });

    } catch (e) {
        // yoksay
    }
}


// ============================================================
// DESTINATION MEMBER
// ============================================================

function sendMember(
    el,
    isIn
) {

    if (!el) return;


    try {

        el.setAttribute(
            'data-member',
            isIn
                ? 'in'
                : 'out'
        );

    } catch (e) {}


    try {

        el.postMessage({

            type:
                'MEMBER_UPDATE',

            payload:
                isIn

        });

    } catch (e) {}
}
