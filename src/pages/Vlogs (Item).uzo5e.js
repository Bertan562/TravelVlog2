// Page code for the "Vlogs (Item)" dynamic page — /vlogs/{slug}
//
// Required element on this page:
//   #vlogDetail   Custom Element (travel-vlog-detail)
//
// NOTE: when you set the dynamic page URL in Wix Studio, the slug part
// must be inserted with "+ Değişken Ekle" (a bound field token), not
// typed as literal text — typing it makes every item resolve to the
// same broken URL.

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getVlogBySlug } from 'backend/vlogPublic';
import { reportVlog } from 'backend/vlogSubmission';

const ELEMENT = '#vlogDetail';
const VLOGS_LIST_PATH = null; // TODO: set once the /vlogs list page exists

$w.onReady(async function () {

  $w(ELEMENT).on('vlogDetailRequest', (event) => handleRequest(event.detail));

  const path = wixLocation.path || [];
  const slug = path[path.length - 1];

  if (!slug) {
    console.error('No vlog slug in the URL');
    $w(ELEMENT).setAttribute('data-vlog', JSON.stringify(null));
    return;
  }

  let vlog = null;
  try {
    vlog = await getVlogBySlug(slug);
  } catch (err) {
    console.error('Vlog could not be loaded', err);
  }

  if (!vlog) {
    $w(ELEMENT).setAttribute('data-vlog', JSON.stringify(null));
    return;
  }

  if (VLOGS_LIST_PATH) {
    vlog.vlogsListUrl = VLOGS_LIST_PATH;
  }

  $w(ELEMENT).setAttribute('data-vlog', JSON.stringify(vlog));

  applySeo(vlog);
});


function applySeo(vlog) {
  // Her vlogun kendi başlığı ve açıklaması olsun — bölümün SEO
  // değeri buradan geliyor.
  try {
    const summary = (vlog.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155);

    wixSeo.title = `${vlog.title} | TravelVlog`;

    wixSeo.setMetaTags([
      {
        name: 'description',
        content: summary || `A community travel vlog from ${vlog.destinationName || 'TravelVlog'}.`
      },
      { property: 'og:title', content: vlog.title },
      { property: 'og:description', content: summary },
      { property: 'og:type', content: 'article' }
    ]);

    if (vlog.coverImage) {
      wixSeo.setMetaTags([{ property: 'og:image', content: vlog.coverImage }]);
    }
  } catch (err) {
    console.warn('SEO tags could not be set', err);
  }
}


async function handleRequest({ requestId, action, payload }) {
  let response;
  try {
    let result;
    if (action === 'reportVlog') {
      result = await reportVlog(payload.vlogId);
    } else {
      throw new Error('unknown_action');
    }
    response = { requestId, result: { ok: true } };
  } catch (err) {
    console.error(`Vlog detail request "${action}" failed`, err);
    response = { requestId, error: err.message || 'unknown_error' };
  }

  $w(ELEMENT).setAttribute('data-response', JSON.stringify(response));
}