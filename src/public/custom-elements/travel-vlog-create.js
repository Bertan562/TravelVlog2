class TravelVlogCreate extends HTMLElement {
  static get observedAttributes() {
    return ['data-response', 'data-destinations', 'data-experiences', 'data-member'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || newVal === oldVal) return;
    if (!this._built) {
      (this._pending = this._pending || {})[name] = newVal;
      return;
    }
    this._handleAttribute(name, newVal);
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;

    // ---- state -------------------------------------------------
    this._contentType = 'video';
    this._videoMeta = null;
    this._galleryFiles = [];   // { file, previewUrl, uploadedUrl }
    this._memberName = '';
    this._pendingRequests = new Map();
    this._requestSeq = 0;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = this._template();
    this._root = root;
    this._cacheEls();
    this._wire();
    this._setContentType('video');

    // Attributes set before the element was upgraded.
    if (this._pending) {
      Object.keys(this._pending).forEach((k) => this._handleAttribute(k, this._pending[k]));
      this._pending = null;
    }
  }

  // ================================================================
  // Template
  // ================================================================
  _template() {
    return `
<style>
  :host { display: block; }
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .wrap {
    font-family: 'Inter', system-ui, sans-serif;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    color: #141414;
    padding: 8px 0 48px;
  }

  h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.6px; margin: 0 0 6px; }
  .sub { font-size: 15px; opacity: 0.55; margin: 0 0 32px; }

  .field { margin-bottom: 26px; }
  label.lbl {
    display: block;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    margin-bottom: 8px;
  }
  .hint { font-size: 12.5px; opacity: 0.5; margin-top: 6px; line-height: 1.45; }

  input[type="text"], input[type="url"], textarea, select {
    width: 100%;
    font-family: inherit;
    font-size: 14.5px;
    color: #141414;
    background: #ffffff;
    border: 1px solid rgba(20,20,20,0.16);
    border-radius: 10px;
    padding: 13px 16px;
    outline: none;
    transition: border-color 0.15s ease;
  }
  input:focus, textarea:focus, select:focus { border-color: #141414; }
  textarea { min-height: 120px; resize: vertical; line-height: 1.5; }
  select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%23141414' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }

  /* ---- content type toggle ---- */
  .toggle {
    display: flex;
    gap: 8px;
    background: rgba(20,20,20,0.05);
    padding: 5px;
    border-radius: 12px;
    margin-bottom: 30px;
  }
  .toggle button {
    flex: 1;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #141414;
    background: transparent;
    border: 0;
    border-radius: 9px;
    padding: 11px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s ease;
  }
  .toggle button:hover { background: rgba(255,255,255,0.6); }
  .toggle button.active { background: #ffffff; box-shadow: 0 1px 3px rgba(20,20,20,0.12); }
  .toggle svg { width: 16px; height: 16px; }

  /* ---- video preview ---- */
  .vpreview {
    display: none;
    gap: 14px;
    align-items: flex-start;
    background: #f4f3ef;
    border-radius: 12px;
    padding: 14px;
    margin-top: 14px;
  }
  .vpreview.on { display: flex; }
  .vpreview img { width: 150px; height: 84px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .vpreview .vtitle { font-size: 14px; font-weight: 600; line-height: 1.35; margin-bottom: 4px; }
  .vpreview .vchan { font-size: 12.5px; opacity: 0.55; }

  .status { font-size: 13px; margin-top: 8px; display: none; }
  .status.on { display: block; }
  .status.err { color: #b3261e; }
  .status.ok { color: #1e7b3c; }
  .status.warn { color: #8a5a00; }

  /* ---- gallery dropzone ---- */
  .drop {
    border: 1.5px dashed rgba(20,20,20,0.25);
    border-radius: 12px;
    padding: 34px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .drop:hover, .drop.over { border-color: #141414; background: rgba(20,20,20,0.03); }
  .drop .big { font-size: 14.5px; font-weight: 600; margin-bottom: 4px; }
  .drop .small { font-size: 12.5px; opacity: 0.5; }

  .thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .thumb { position: relative; width: 96px; height: 96px; border-radius: 10px; overflow: hidden; background: #f4f3ef; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb .rm {
    position: absolute; top: 5px; right: 5px;
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(20,20,20,0.72); color: #fff;
    border: 0; cursor: pointer;
    font-size: 13px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .thumb.cover::after {
    content: 'Kapak';
    position: absolute; left: 5px; bottom: 5px;
    background: rgba(20,20,20,0.78); color: #fff;
    font-size: 10px; font-weight: 600;
    padding: 2px 6px; border-radius: 4px;
  }

  /* ---- ownership + submit ---- */
  .own {
    display: flex; align-items: flex-start; gap: 11px;
    background: #f4f3ef; border-radius: 12px;
    padding: 16px; margin: 4px 0 24px;
  }
  .own input { margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0; accent-color: #141414; cursor: pointer; }
  .own label { font-size: 13.5px; line-height: 1.5; cursor: pointer; }

  .submit {
    font-family: inherit;
    width: 100%;
    background: #141414; color: #fff;
    font-size: 15px; font-weight: 600;
    border: 0; border-radius: 10px;
    padding: 15px 24px; cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .submit:disabled { opacity: 0.35; cursor: not-allowed; }

  .section { display: none; }
  .section.on { display: block; }
</style>

<div class="wrap">
  <h1>Create your Vlog</h1>
  <p class="sub">Real journeys. Real travelers. Share yours with the TravelVlog community.</p>

  <div class="toggle" id="toggle">
    <button type="button" data-type="video" class="active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 10l5-3v10l-5-3z"/></svg>
      Video
    </button>
    <button type="button" data-type="gallery">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>
      Photo Gallery
    </button>
  </div>

  <div class="field">
    <label class="lbl" for="title">Vlog başlığı</label>
    <input type="text" id="title" maxlength="90" placeholder="ör. Cappadocia at Sunrise">
  </div>

  <!-- VIDEO -->
  <div class="section on" id="videoSection">
    <div class="field">
      <label class="lbl" for="videoUrl">YouTube veya Vimeo linki</label>
      <input type="url" id="videoUrl" placeholder="https://www.youtube.com/watch?v=...">
      <div class="status" id="videoStatus"></div>
      <div class="vpreview" id="videoPreview">
        <img id="videoThumb" alt="">
        <div>
          <div class="vtitle" id="videoTitle"></div>
          <div class="vchan" id="videoChannel"></div>
        </div>
      </div>
      <div class="status warn" id="channelWarn"></div>
      <div class="hint">Videoyu biz barındırmıyoruz — YouTube/Vimeo'daki videonuz TravelVlog sayfanızda gömülü olarak oynatılır.</div>
    </div>
  </div>

  <!-- GALLERY -->
  <div class="section" id="gallerySection">
    <div class="field">
      <label class="lbl">Fotoğraflar</label>
      <div class="drop" id="drop">
        <div class="big">Fotoğrafları buraya sürükleyin veya seçmek için tıklayın</div>
        <div class="small">En az 3, en fazla 15 fotoğraf · JPG, PNG veya WebP</div>
      </div>
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" multiple hidden>
      <div class="thumbs" id="thumbs"></div>
      <div class="status" id="galleryStatus"></div>
      <div class="hint">İlk fotoğraf otomatik olarak kapak görseli olur.</div>
    </div>
  </div>

  <div class="field">
    <label class="lbl" for="destination">Destinasyon</label>
    <select id="destination"><option value="">Seçiniz…</option></select>
  </div>

  <div class="field">
    <label class="lbl" for="experience">İlgili deneyim <span style="font-weight:400;opacity:0.5">(opsiyonel)</span></label>
    <select id="experience"><option value="">Seçiniz…</option></select>
  </div>

  <div class="field">
    <label class="lbl" for="description">Açıklama</label>
    <textarea id="description" maxlength="2000" placeholder="Bu yolculukta neler yaşadınız?"></textarea>
  </div>

  <div class="own">
    <input type="checkbox" id="ownership">
    <label for="ownership" id="ownershipLabel"></label>
  </div>

  <button class="submit" id="submit" disabled>Submit for Review</button>
  <div class="status" id="submitStatus"></div>
</div>`;
  }

  // ================================================================
  // Element refs + wiring
  // ================================================================
  _cacheEls() {
    const r = this._root;
    this.el = {
      toggle: r.getElementById('toggle'),
      title: r.getElementById('title'),
      videoSection: r.getElementById('videoSection'),
      gallerySection: r.getElementById('gallerySection'),
      videoUrl: r.getElementById('videoUrl'),
      videoStatus: r.getElementById('videoStatus'),
      videoPreview: r.getElementById('videoPreview'),
      videoThumb: r.getElementById('videoThumb'),
      videoTitle: r.getElementById('videoTitle'),
      videoChannel: r.getElementById('videoChannel'),
      channelWarn: r.getElementById('channelWarn'),
      drop: r.getElementById('drop'),
      fileInput: r.getElementById('fileInput'),
      thumbs: r.getElementById('thumbs'),
      galleryStatus: r.getElementById('galleryStatus'),
      destination: r.getElementById('destination'),
      experience: r.getElementById('experience'),
      description: r.getElementById('description'),
      ownership: r.getElementById('ownership'),
      ownershipLabel: r.getElementById('ownershipLabel'),
      submit: r.getElementById('submit'),
      submitStatus: r.getElementById('submitStatus')
    };
  }

  _wire() {
    const e = this.el;

    e.toggle.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-type]');
      if (btn) this._setContentType(btn.getAttribute('data-type'));
    });

    e.videoUrl.addEventListener('blur', () => this._validateVideo());
    e.ownership.addEventListener('change', () => this._refreshSubmit());
    e.title.addEventListener('input', () => this._refreshSubmit());

    e.drop.addEventListener('click', () => e.fileInput.click());
    e.fileInput.addEventListener('change', () => this._addFiles(Array.from(e.fileInput.files)));

    ['dragenter', 'dragover'].forEach((t) =>
      e.drop.addEventListener(t, (ev) => { ev.preventDefault(); e.drop.classList.add('over'); })
    );
    ['dragleave', 'drop'].forEach((t) =>
      e.drop.addEventListener(t, (ev) => { ev.preventDefault(); e.drop.classList.remove('over'); })
    );
    e.drop.addEventListener('drop', (ev) => {
      const files = Array.from(ev.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      this._addFiles(files);
    });

    e.submit.addEventListener('click', () => this._submit());
  }

  // ================================================================
  // Page-code bridge
  // ================================================================
  /**
   * Fires a CustomEvent the page code listens for, and returns a promise
   * that resolves when the page code writes the answer back into the
   * data-response attribute with the same requestId.
   */
  _ask(action, payload) {
    const requestId = `r${++this._requestSeq}`;
    return new Promise((resolve, reject) => {
      this._pendingRequests.set(requestId, { resolve, reject });
      this.dispatchEvent(new CustomEvent('vlogRequest', {
        detail: { requestId, action, payload }
      }));
      // Don't leave the UI stuck if the page code never answers.
      setTimeout(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          reject(new Error('timeout'));
        }
      }, 30000);
    });
  }

  _handleAttribute(name, value) {
    if (name === 'data-response') {
      let parsed;
      try { parsed = JSON.parse(value); } catch (err) { return; }
      const pending = this._pendingRequests.get(parsed.requestId);
      if (!pending) return;
      this._pendingRequests.delete(parsed.requestId);
      if (parsed.error) pending.reject(new Error(parsed.error));
      else pending.resolve(parsed.result);
      return;
    }

    if (name === 'data-destinations' || name === 'data-experiences') {
      let list;
      try { list = JSON.parse(value); } catch (err) { return; }
      const select = name === 'data-destinations' ? this.el.destination : this.el.experience;
      const first = select.options[0];
      select.innerHTML = '';
      select.appendChild(first);
      (list || []).forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.value !== undefined ? item.value : item._id;
        opt.textContent = item.label !== undefined ? item.label : item.title;
        select.appendChild(opt);
      });
      return;
    }

    if (name === 'data-member') {
      try { this._memberName = (JSON.parse(value) || {}).name || ''; } catch (err) { /* ignore */ }
    }
  }

  // ================================================================
  // Content type
  // ================================================================
  _setContentType(type) {
    this._contentType = type;
    const isVideo = type === 'video';

    this.el.toggle.querySelectorAll('button').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-type') === type)
    );
    this.el.videoSection.classList.toggle('on', isVideo);
    this.el.gallerySection.classList.toggle('on', !isVideo);

    this.el.ownershipLabel.textContent = isVideo
      ? 'Bu videoyu ben çektim / yayınlama hakkına sahibim ve TravelVlog\'da paylaşmaya yetkiliyim.'
      : 'Bu fotoğrafları ben çektim ve paylaşmaya yetkiliyim.';

    this._refreshSubmit();
  }

  // ================================================================
  // Video validation (oEmbed, via page code → backend)
  // ================================================================
  async _validateVideo() {
    const url = this.el.videoUrl.value.trim();
    if (!url) return;

    this._setStatus(this.el.videoStatus, 'Doğrulanıyor…', '');
    this.el.videoPreview.classList.remove('on');
    this.el.channelWarn.classList.remove('on');

    let result;
    try {
      result = await this._ask('validateVideo', { url });
    } catch (err) {
      this._videoMeta = null;
      this._setStatus(this.el.videoStatus, 'Video doğrulanırken bir hata oluştu, tekrar deneyin.', 'err');
      this._refreshSubmit();
      return;
    }

    if (!result || !result.valid) {
      this._videoMeta = null;
      const messages = {
        unsupported_platform: 'Sadece YouTube veya Vimeo linkleri kabul edilir.',
        video_not_found: 'Video bulunamadı — linki kontrol edin.',
        too_short: 'Video çok kısa görünüyor (Shorts/Reels formatı kabul edilmiyor).',
        fetch_error: 'Video doğrulanırken bir hata oluştu, tekrar deneyin.',
        empty_url: 'Lütfen bir video linki girin.'
      };
      this._setStatus(this.el.videoStatus, messages[result && result.reason] || 'Video doğrulanamadı.', 'err');
      this._refreshSubmit();
      return;
    }

    this._videoMeta = result;
    this._setStatus(this.el.videoStatus, 'Video bulundu.', 'ok');
    this.el.videoThumb.src = result.thumbnail || '';
    this.el.videoTitle.textContent = result.title || '';
    this.el.videoChannel.textContent = result.channelName || '';
    this.el.videoPreview.classList.add('on');

    if (this._channelMismatch(result.channelName, this._memberName)) {
      this._setStatus(
        this.el.channelWarn,
        'Kanal adı profilinizle eşleşmiyor — lütfen bu videonun size ait olduğundan emin olun.',
        'warn'
      );
    }

    if (!this.el.title.value.trim() && result.title) {
      this.el.title.value = result.title;
    }

    this._refreshSubmit();
  }

  _channelMismatch(channelName, memberName) {
    if (!channelName || !memberName) return false;
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = norm(channelName);
    const b = norm(memberName);
    return !a.includes(b) && !b.includes(a);
  }

  // ================================================================
  // Gallery
  // ================================================================
  _addFiles(files) {
    const MAX = 15;
    const room = MAX - this._galleryFiles.length;
    if (room <= 0) {
      this._setStatus(this.el.galleryStatus, `En fazla ${MAX} fotoğraf ekleyebilirsiniz.`, 'err');
      return;
    }

    files.slice(0, room).forEach((file) => {
      this._galleryFiles.push({ file, previewUrl: URL.createObjectURL(file), uploadedUrl: null });
    });

    this._renderThumbs();
    this._checkGalleryCount();
    this._refreshSubmit();
  }

  _renderThumbs() {
    this.el.thumbs.innerHTML = '';
    this._galleryFiles.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'thumb' + (i === 0 ? ' cover' : '');
      div.innerHTML = `<img src="${entry.previewUrl}" alt=""><button class="rm" type="button" aria-label="kaldır">&times;</button>`;
      div.querySelector('.rm').addEventListener('click', () => {
        URL.revokeObjectURL(entry.previewUrl);
        this._galleryFiles.splice(i, 1);
        this._renderThumbs();
        this._checkGalleryCount();
        this._refreshSubmit();
      });
      this.el.thumbs.appendChild(div);
    });
  }

  _checkGalleryCount() {
    const n = this._galleryFiles.length;
    if (n === 0) { this.el.galleryStatus.classList.remove('on'); return; }
    if (n < 3) this._setStatus(this.el.galleryStatus, `En az 3 fotoğraf gerekli — şu an ${n} tane var.`, 'err');
    else this._setStatus(this.el.galleryStatus, `${n} fotoğraf hazır.`, 'ok');
  }

  /**
   * Uploads every pending gallery file straight to Wix Media using a
   * short-lived URL the backend hands out per file.
   */
  async _uploadGallery() {
    const urls = [];
    for (let i = 0; i < this._galleryFiles.length; i++) {
      const entry = this._galleryFiles[i];
      if (entry.uploadedUrl) { urls.push(entry.uploadedUrl); continue; }

      this._setStatus(this.el.submitStatus, `Fotoğraflar yükleniyor… (${i + 1}/${this._galleryFiles.length})`, '');

      const ticket = await this._ask('getUploadUrl', {
        fileName: entry.file.name,
        mimeType: entry.file.type
      });

      const form = new FormData();
      form.append('file', entry.file);

      const target = `${ticket.uploadUrl}?filename=${encodeURIComponent(entry.file.name)}`;
      const res = await fetch(target, {
        method: 'PUT',
        headers: { Authorization: ticket.uploadToken },
        body: form
      });

      if (!res.ok) throw new Error('upload_failed');
      const data = await res.json();
      const file = Array.isArray(data) ? data[0] : (data.file || data);
      const fileUrl = file.fileUrl || file.fileName || file.url;
      if (!fileUrl) throw new Error('upload_failed');

      entry.uploadedUrl = fileUrl;
      urls.push(fileUrl);
    }
    return urls;
  }

  // ================================================================
  // Submit
  // ================================================================
  _refreshSubmit() {
    const hasTitle = this.el.title.value.trim().length > 2;
    const owned = this.el.ownership.checked;
    const ready = this._contentType === 'video'
      ? !!this._videoMeta
      : (this._galleryFiles.length >= 3 && this._galleryFiles.length <= 15);

    this.el.submit.disabled = !(hasTitle && owned && ready);
  }

  async _submit() {
    this.el.submit.disabled = true;
    this._setStatus(this.el.submitStatus, 'Gönderiliyor…', '');

    const payload = {
      title: this.el.title.value.trim(),
      slug: this._slugify(this.el.title.value),
      contentType: this._contentType,
      description: this.el.description.value.trim(),
      ownershipConfirmed: this.el.ownership.checked,
      relatedDestination: this.el.destination.value || null,
      relatedExperience: this.el.experience.value || null
    };

    try {
      if (this._contentType === 'video') {
        payload.videoUrl = this.el.videoUrl.value.trim();
        payload.videoPlatform = this._videoMeta.platform;
        payload.videoTitle = this._videoMeta.title;
        payload.channelName = this._videoMeta.channelName;
        payload.coverImage = this._videoMeta.thumbnail;
        payload.channelNameMismatch = this._channelMismatch(this._videoMeta.channelName, this._memberName);
      } else {
        const urls = await this._uploadGallery();
        payload.galleryImages = urls;
        payload.coverImage = urls[0];
      }

      const result = await this._ask('submitVlog', payload);
      this._setStatus(
        this.el.submitStatus,
        result && result.status === 'Approved'
          ? 'Vlogunuz yayınlandı! Yönlendiriliyorsunuz…'
          : 'Vlogunuz gönderildi ve onay bekliyor. Yönlendiriliyorsunuz…',
        'ok'
      );
      this.dispatchEvent(new CustomEvent('vlogSubmitted', { detail: result || {} }));
    } catch (err) {
      console.error('Vlog submission failed', err);
      const messages = {
        not_logged_in: 'Vlog göndermek için giriş yapmalısınız.',
        upload_failed: 'Fotoğraflar yüklenemedi, lütfen tekrar deneyin.',
        unsupported_file_type: 'Sadece JPG, PNG veya WebP yükleyebilirsiniz.',
        timeout: 'İşlem zaman aşımına uğradı, lütfen tekrar deneyin.'
      };
      this._setStatus(this.el.submitStatus, messages[err.message] || 'Gönderim sırasında bir hata oluştu, lütfen tekrar deneyin.', 'err');
      this.el.submit.disabled = false;
    }
  }

  // ================================================================
  // Helpers
  // ================================================================
  _setStatus(node, text, kind) {
    node.textContent = text;
    node.className = 'status on' + (kind ? ' ' + kind : '');
  }

  _slugify(text) {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

customElements.define('travel-vlog-create', TravelVlogCreate);
