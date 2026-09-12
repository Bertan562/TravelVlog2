// Page code for the "Vlog Moderation" page.
// v3: the whole panel lives in the <travel-vlog-moderation> custom
// element. This file only bridges it to the backend.
//
// Required element on this page:
//   #moderationElement   Custom Element (travel-vlog-moderation)

import { currentMember, authentication } from 'wix-members-frontend';
import {
  isCurrentMemberAdmin,
  getVlogsByStatus,
  approveVlog,
  rejectVlog,
  debugAccess
} from 'backend/vlogModeration';

const ELEMENT = '#moderationElement';

$w.onReady(async function () {
  let member = await currentMember.getMember();
  if (!member) {
    await authentication.promptLogin({ mode: 'login' });
    member = await currentMember.getMember();
  }

  // Open the browser console (F12) to see exactly what Wix reports for
  // this member if access is denied unexpectedly.
  try {
    const report = await debugAccess();
    console.log('[Vlog Moderation] access report:', report);
  } catch (err) {
    console.error('[Vlog Moderation] debug call failed', err);
  }

  let isAdmin = false;
  try {
    isAdmin = await isCurrentMemberAdmin();
  } catch (err) {
    console.error('Admin check failed', err);
  }
  console.log('[Vlog Moderation] isAdmin:', isAdmin);

  $w(ELEMENT).on('moderationRequest', (event) => handleRequest(event.detail));
  $w(ELEMENT).setAttribute('data-access', JSON.stringify({ isAdmin }));
});

async function handleRequest({ requestId, action, payload }) {
  let response;
  try {
    let result;
    if (action === 'getVlogs') {
      result = await getVlogsByStatus(payload.status);
    } else if (action === 'approveVlog') {
      result = await approveVlog(payload.vlogId, payload.note);
    } else if (action === 'rejectVlog') {
      result = await rejectVlog(payload.vlogId, payload.note);
    } else {
      throw new Error('unknown_action');
    }
    response = { requestId, result };
  } catch (err) {
    console.error(`Moderation request "${action}" failed`, err);
    response = { requestId, error: err.message || 'unknown_error' };
  }

  $w(ELEMENT).setAttribute('data-response', JSON.stringify(response));
}
