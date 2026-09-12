// Page code for the "Create Vlog" page.
// v3: the whole form lives in the <travel-vlog-create> custom element.
// This file is only a bridge — the element can't import backend modules
// itself, so it fires 'vlogRequest' events and this code answers them
// by writing back into the element's data-response attribute.
//
// Required element on this page:
//   #createVlogElement   Custom Element (travel-vlog-create)

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members-frontend';
import { validateVideoUrl } from 'backend/oembedService';
import { submitVlog } from 'backend/vlogSubmission';
import { getGalleryUploadUrl } from 'backend/vlogUpload';

const ELEMENT = '#createVlogElement';

$w.onReady(async function () {
  const member = await currentMember.getMember();

  // Not logged in — the form is useless, so send them to sign-up first.
  if (!member) {
    await authentication.promptLogin({ mode: 'signup' });
    const after = await currentMember.getMember();
    if (!after) {
      wixLocation.to('/');
      return;
    }
  }

  await pushMemberInfo();
  await pushDropdownData();

  $w(ELEMENT).on('vlogRequest', (event) => handleRequest(event.detail));
  $w(ELEMENT).on('vlogSubmitted', () => {
    // Small delay so the element's own success message is readable.
    setTimeout(() => wixLocation.to('/my-vlogs'), 1200);
  });
});

async function pushMemberInfo() {
  const member = await currentMember.getMember();
  const first = member?.contactDetails?.firstName || '';
  const last = member?.contactDetails?.lastName || '';
  const name = `${first} ${last}`.trim() || member?.profile?.nickname || '';
  $w(ELEMENT).setAttribute('data-member', JSON.stringify({ name }));
}

async function pushDropdownData() {
  // Destinations are required; Experiences are optional, so a missing
  // collection there shouldn't break the page.
  try {
    const dest = await wixData.query('Destinations').ascending('title').limit(200).find();
    $w(ELEMENT).setAttribute(
      'data-destinations',
      JSON.stringify(dest.items.map((d) => ({ value: d._id, label: d.title })))
    );
  } catch (err) {
    console.error('Destinations could not be loaded', err);
  }

  try {
    const exp = await wixData.query('Activities').ascending('title').limit(200).find();
    $w(ELEMENT).setAttribute(
      'data-experiences',
      JSON.stringify(exp.items.map((e) => ({ value: e._id, label: e.title })))
    );
  } catch (err) {
    console.error('Experiences could not be loaded', err);
  }
}

async function handleRequest({ requestId, action, payload }) {
  let response;
  try {
    let result;
    if (action === 'validateVideo') {
      result = await validateVideoUrl(payload.url);
    } else if (action === 'getUploadUrl') {
      result = await getGalleryUploadUrl(payload.fileName, payload.mimeType);
    } else if (action === 'submitVlog') {
      result = await submitVlog(payload);
    } else {
      throw new Error('unknown_action');
    }
    response = { requestId, result };
  } catch (err) {
    console.error(`Request "${action}" failed`, err);
    response = { requestId, error: err.message || 'unknown_error' };
  }

  $w(ELEMENT).setAttribute('data-response', JSON.stringify(response));
}
