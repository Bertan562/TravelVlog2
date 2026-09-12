// Page code for the "Vlog Moderation" page (admin only).
//
// Required elements on this page:
//   #pendingRepeater        Repeater
//     inside each item:
//       #itemCover          Image
//       #itemTitle          Text
//       #itemAuthor         Text
//       #itemType           Text   (Video / Galeri)
//       #itemChannel        Text   (channel name, video only)
//       #itemFlag           Text   (mismatch warning, hidden by default)
//       #itemReverseSearch  Button (opens Google reverse image search)
//       #approveButton      Button
//       #rejectButton       Button
//   #emptyStateText         Text   ("Bekleyen vlog yok")
//   #pendingCountText       Text
//   #accessDeniedText       Text   (hidden by default)

import { getPendingVlogs, approveVlog, rejectVlog, isCurrentMemberAdmin } from 'backend/vlogModeration';
import wixLocation from 'wix-location';

$w.onReady(async function () {
  $w('#accessDeniedText').hide();
  $w('#emptyStateText').hide();

  const isAdmin = await isCurrentMemberAdmin();
  if (!isAdmin) {
    $w('#pendingRepeater').hide();
    $w('#pendingCountText').hide();
    $w('#accessDeniedText').text = 'Bu sayfaya erişim yetkiniz yok.';
    $w('#accessDeniedText').show();
    return;
  }

  $w('#pendingRepeater').onItemReady(bindRepeaterItem);
  await loadPending();
});

async function loadPending() {
  const items = await getPendingVlogs();

  $w('#pendingCountText').text = `${items.length} vlog onay bekliyor`;

  if (items.length === 0) {
    $w('#pendingRepeater').hide();
    $w('#emptyStateText').text = 'Bekleyen vlog yok.';
    $w('#emptyStateText').show();
    return;
  }

  $w('#emptyStateText').hide();
  $w('#pendingRepeater').data = items;
  $w('#pendingRepeater').show();
}

function bindRepeaterItem($item, itemData) {
  $item('#itemTitle').text = itemData.title || '(başlıksız)';
  $item('#itemAuthor').text = itemData.author || '—';
  $item('#itemType').text = itemData.contentType === 'gallery'
    ? `Galeri (${itemData.galleryImageCount || 0} fotoğraf)`
    : 'Video';

  if (itemData.coverImage) {
    $item('#itemCover').src = itemData.coverImage;
    $item('#itemCover').show();
  } else {
    $item('#itemCover').hide();
  }

  if (itemData.contentType === 'video') {
    $item('#itemChannel').text = itemData.channelName || '—';
    $item('#itemChannel').show();
  } else {
    $item('#itemChannel').hide();
  }

  // Flag raised at submission time when the channel name didn't look
  // like the member's own name.
  const flagged = (itemData.moderatorNote || '').indexOf('channel name mismatch') !== -1;
  if (flagged) {
    $item('#itemFlag').text = 'Kanal adı üyenin adıyla eşleşmiyor — kontrol edin.';
    $item('#itemFlag').show();
  } else {
    $item('#itemFlag').hide();
  }

  // One-click reverse image search on the cover, useful for galleries
  // where there is no channel to cross-check.
  if (itemData.coverImage) {
    $item('#itemReverseSearch').show();
    $item('#itemReverseSearch').onClick(() => {
      const target = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(itemData.coverImage)}`;
      wixLocation.to(target);
    });
  } else {
    $item('#itemReverseSearch').hide();
  }

  $item('#approveButton').onClick(async () => {
    $item('#approveButton').disable();
    $item('#rejectButton').disable();
    try {
      await approveVlog(itemData._id);
      await loadPending();
    } catch (err) {
      console.error('Approve failed', err);
      $item('#approveButton').enable();
      $item('#rejectButton').enable();
    }
  });

  $item('#rejectButton').onClick(async () => {
    $item('#approveButton').disable();
    $item('#rejectButton').disable();
    try {
      await rejectVlog(itemData._id, 'Moderatör tarafından reddedildi');
      await loadPending();
    } catch (err) {
      console.error('Reject failed', err);
      $item('#approveButton').enable();
      $item('#rejectButton').enable();
    }
  });
}