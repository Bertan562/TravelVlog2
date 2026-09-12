// Page code for the "Create Vlog" page.
// Rename the $w element IDs below to match your actual Editor element IDs.

import { validateVideoUrl } from 'backend/oembedService';
import { submitVlog } from 'backend/vlogSubmission';
import { currentMember } from 'wix-members-frontend';
import wixLocation from 'wix-location';

let contentType = 'video'; // 'video' | 'gallery'
let videoMeta = null; // populated after successful oEmbed validation
let currentMemberName = '';

$w.onReady(async function () {
  const member = await currentMember.getMember();
  currentMemberName = member ? `${member.contactDetails?.firstName || ''} ${member.contactDetails?.lastName || ''}`.trim() : '';

  setContentType('video');
  $w('#submitButton').disable();

  $w('#toggleVideo').onClick(() => setContentType('video'));
  $w('#toggleGallery').onClick(() => setContentType('gallery'));

  $w('#videoUrlInput').onBlur(onVideoUrlBlur);
  $w('#galleryUploadButton').onChange(onGalleryUpload);
  $w('#ownershipCheckbox').onChange(updateSubmitButtonState);

  $w('#submitButton').onClick(onSubmit);
});

function setContentType(type) {
  contentType = type;
  const isVideo = type === 'video';

  $w('#videoSection').expand();
  $w('#gallerySection').collapse();
  if (!isVideo) {
    $w('#videoSection').collapse();
    $w('#gallerySection').expand();
  }

  $w('#ownershipCheckbox').label =
    isVideo
      ? 'Bu videoyu ben çektim / yayınlama hakkına sahibim ve TravelVlog\'da paylaşmaya yetkiliyim.'
      : 'Bu fotoğrafları ben çektim ve paylaşmaya yetkiliyim.';

  updateSubmitButtonState();
}

async function onVideoUrlBlur() {
  const url = $w('#videoUrlInput').value;
  if (!url) return;

  $w('#videoValidationText').text = 'Doğrulanıyor...';
  $w('#videoValidationText').show();

  const result = await validateVideoUrl(url);

  if (!result.valid) {
    videoMeta = null;
    const messages = {
      unsupported_platform: 'Sadece YouTube veya Vimeo linkleri kabul edilir.',
      video_not_found: 'Video bulunamadı — linki kontrol edin.',
      too_short: 'Video çok kısa görünüyor (Shorts/Reels formatı kabul edilmiyor).',
      fetch_error: 'Video doğrulanırken bir hata oluştu, tekrar deneyin.',
      empty_url: 'Lütfen bir video linki girin.',
    };
    $w('#videoValidationText').text = messages[result.reason] || 'Video doğrulanamadı.';
    $w('#videoPreviewImage').hide();
    updateSubmitButtonState();
    return;
  }

  videoMeta = result;
  $w('#videoValidationText').text = `Video bulundu: "${result.title}"`;
  $w('#videoPreviewImage').src = result.thumbnail;
  $w('#videoPreviewImage').show();
  $w('#videoTitleText').text = result.title;
  $w('#channelNameText').text = result.channelName;

  const mismatch = isChannelMismatch(result.channelName, currentMemberName);
  if (mismatch) {
    $w('#channelMismatchWarning').text =
      'Kanal adı profilinizle eşleşmiyor — lütfen bu videonun size ait olduğundan emin olun.';
    $w('#channelMismatchWarning').show();
  } else {
    $w('#channelMismatchWarning').hide();
  }

  updateSubmitButtonState();
}

function isChannelMismatch(channelName, memberName) {
  if (!channelName || !memberName) return false;
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a = normalize(channelName);
  const b = normalize(memberName);
  // Loose containment check — channel names are rarely an exact match to a real name.
  return !a.includes(b) && !b.includes(a);
}

function onGalleryUpload() {
  const files = $w('#galleryUploadButton').value;
  const MIN_IMAGES = 3;
  const MAX_IMAGES = 15;

  if (files.length < MIN_IMAGES) {
    $w('#galleryValidationText').text = `En az ${MIN_IMAGES} fotoğraf yüklemelisiniz.`;
    $w('#galleryValidationText').show();
  } else if (files.length > MAX_IMAGES) {
    $w('#galleryValidationText').text = `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`;
    $w('#galleryValidationText').show();
  } else {
    $w('#galleryValidationText').hide();
  }

  updateSubmitButtonState();
}

function updateSubmitButtonState() {
  const ownershipChecked = $w('#ownershipCheckbox').checked;
  let contentReady = false;

  if (contentType === 'video') {
    contentReady = !!videoMeta;
  } else {
    const files = $w('#galleryUploadButton').value;
    contentReady = files.length >= 3 && files.length <= 15;
  }

  if (ownershipChecked && contentReady) {
    $w('#submitButton').enable();
  } else {
    $w('#submitButton').disable();
  }
}

async function onSubmit() {
  $w('#submitButton').disable();
  $w('#submitStatusText').text = 'Gönderiliyor...';
  $w('#submitStatusText').show();

  const title = $w('#titleInput').value;
  const slug = slugify(title);
  const description = $w('#descriptionInput').value;
  const relatedDestination = $w('#destinationDropdown').value;
  const relatedExperience = $w('#experienceDropdown').value;
  const ownershipConfirmed = $w('#ownershipCheckbox').checked;

  const payload = {
    title,
    slug,
    contentType,
    description,
    ownershipConfirmed,
    relatedDestination,
    relatedExperience,
  };

  if (contentType === 'video') {
    payload.videoUrl = $w('#videoUrlInput').value;
    payload.videoPlatform = videoMeta.platform;
    payload.videoTitle = videoMeta.title;
    payload.channelName = videoMeta.channelName;
    payload.coverImage = videoMeta.thumbnail;
    payload.channelNameMismatch = isChannelMismatch(videoMeta.channelName, currentMemberName);
  } else {
    const uploadedFiles = await $w('#galleryUploadButton').startUpload();
    const urls = Array.isArray(uploadedFiles) ? uploadedFiles.map((f) => f.url) : [uploadedFiles.url];
    payload.galleryImages = urls;
    payload.coverImage = urls[0];
  }

  try {
    const { status } = await submitVlog(payload);
    const message =
      status === 'Approved'
        ? 'Vlogunuz otomatik olarak yayınlandı!'
        : 'Vlogunuz gönderildi ve onay bekliyor.';
    $w('#submitStatusText').text = message;
    wixLocation.to('/my-vlogs');
  } catch (err) {
    console.error('Vlog submission failed', err);
    $w('#submitStatusText').text = 'Gönderim sırasında bir hata oluştu, lütfen tekrar deneyin.';
    $w('#submitButton').enable();
  }
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
