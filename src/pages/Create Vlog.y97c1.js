// Page code for the "Create Vlog" page.
// v4: the whole form lives in the <travel-vlog-create> custom element.
// This file is only a bridge — the element can't import backend modules
// itself, so it fires 'vlogRequest' events and this code answers them
// by writing back into the element's data-response attribute.
//
// Required element on this page:
//   #createVlogElement   Custom Element (travel-vlog-create)

import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members-frontend';
import { validateVideoUrl } from 'backend/oembedService';
import { submitVlog } from 'backend/vlogSubmission';
import { getGalleryUploadUrl } from 'backend/vlogUpload';
import { getPlaceSuggestions } from 'backend/vlogPlaces';
import { getAgreementStatus, signAgreement } from 'backend/vlogAgreement';

const ELEMENT = '#createVlogElement';

$w.onReady(async function () {
  let member = await currentMember.getMember();

  // Not logged in — the form is useless, so sign them up first.
  if (!member) {
    await authentication.promptLogin({ mode: 'signup' });
    member = await currentMember.getMember();
    if (!member) {
      wixLocation.to('/');
      return;
    }
  }

  await pushMemberInfo(member);
  await pushAgreementStatus();
  await pushSuggestions();

  $w(ELEMENT).on('vlogRequest', (event) => handleRequest(event.detail));
  $w(ELEMENT).on('vlogSubmitted', () => {
    // Small delay so the element's own success message stays readable.
    setTimeout(() => wixLocation.to('/my-vlogs'), 1400);
  });
});

async function pushMemberInfo(member) {
  const first = member?.contactDetails?.firstName || '';
  const last = member?.contactDetails?.lastName || '';
  const name = `${first} ${last}`.trim() || member?.profile?.nickname || '';
  $w(ELEMENT).setAttribute('data-member', JSON.stringify({ name }));
}

async function pushAgreementStatus() {
  try {
    const status = await getAgreementStatus();
    $w(ELEMENT).setAttribute('data-agreement', JSON.stringify(status));
  } catch (err) {
    console.error('Agreement status could not be loaded', err);
  }
}

async function pushSuggestions() {
  // Autocomplete only — members can still type anything they like.
  try {
    const destinations = await getPlaceSuggestions('destination');
    $w(ELEMENT).setAttribute('data-destination-suggestions', JSON.stringify(destinations));
  } catch (err) {
    console.error('Destination suggestions could not be loaded', err);
  }

  try {
    const experiences = await getPlaceSuggestions('experience');
    $w(ELEMENT).setAttribute('data-experience-suggestions', JSON.stringify(experiences));
  } catch (err) {
    console.error('Experience suggestions could not be loaded', err);
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
    } else if (action === 'signAgreement') {
      result = await signAgreement(payload.fullName);
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
