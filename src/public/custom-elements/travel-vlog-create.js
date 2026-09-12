class TravelVlogCreate extends HTMLElement {
  static get observedAttributes() {
    return ['data-response', 'data-destination-suggestions', 'data-experience-suggestions', 'data-member', 'data-agreement'];
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

    this._contentType = 'video';
    this._videoMeta = null;
    this._galleryFiles = [];
    this._memberName = '';
    this._agreementSigned = false;
    this._agreementVersion = '';
    this._pendingRequests = new Map();
    this._requestSeq = 0;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = this._template();
    this._root = root;
    this._cacheEls();
    this._wire();
    this._setContentType('video');

    if (this._pending) {
      Object.keys(this._pending).forEach((k) => this._handleAttribute(k, this._pending[k]));
      this._pending = null;
    }
  }

  // ================================================================
  // Agreement text. Bump AGREEMENT_VERSION in backend/vlogAgreement.jsw
  // whenever this wording changes, so members sign again.
  // ================================================================
  _agreementHtml() {
    return `
<h3>TravelVlog Contributor Agreement</h3>
<p class="ver">Version 1.0</p>

<p>This agreement is between you ("the Contributor") and TravelVlog ("the Platform"). By signing below you confirm that you have read, understood and accept every clause. If you do not accept any part of this agreement, do not submit content.</p>

<h4>1. Ownership and originality</h4>
<p>You confirm that you are the sole author and copyright owner of every video, photograph, caption and description you submit, or that you hold a valid written licence from the rightful owner granting you authority to publish that material and to grant the Platform the rights described in clause 3. You confirm that none of your submitted material was copied, downloaded, scraped or re-uploaded from another creator, stock library, social network, broadcaster or any other third-party source.</p>

<h4>2. Third parties appearing in your content</h4>
<p>Where your content features identifiable individuals, you confirm you have obtained their consent to be filmed or photographed and to have that material published publicly. Where your content features minors, you confirm you hold the documented consent of a parent or legal guardian. Where your content was captured on private property, at a ticketed venue, in a museum, or anywhere recording is restricted, you confirm you had permission both to record and to publish.</p>

<h4>3. Licence you grant to the Platform</h4>
<p>You retain full ownership of your content. You grant the Platform a non-exclusive, worldwide, royalty-free licence to host, display, reproduce, resize, crop, excerpt, embed, index and distribute your submitted material for the purpose of operating and promoting the Platform — including on Platform pages, in search results, in newsletters and on the Platform's own social media accounts — with attribution to you. This licence lasts for as long as your content remains published, and ends when your content is removed, except for copies already distributed or cached by third parties beyond the Platform's control.</p>

<h4>4. Video hosting</h4>
<p>Where you submit a video, the video file itself remains hosted on YouTube, Vimeo or another third-party service of your choosing, and is displayed on the Platform through an embedded player. You remain bound by that provider's terms of service. If you delete, restrict or make the underlying video private, the corresponding page on the Platform may stop working and may be removed without notice.</p>

<h4>5. Prohibited content</h4>
<p>You will not submit material that: infringes any copyright, trademark, design right, database right or moral right; is defamatory, harassing, threatening or discriminatory; depicts or promotes violence, self-harm, cruelty to animals or illegal activity; is sexually explicit or sexualises any person; contains malware or deceptive links; misrepresents a location, experience or price; constitutes undisclosed paid promotion; or breaches any applicable law in the jurisdiction where it was recorded or where it will be viewed.</p>

<h4>6. Commercial disclosure</h4>
<p>If any part of your submission was paid for, gifted, sponsored, comped or produced under any commercial arrangement — including free accommodation, tours, meals, equipment or transport — you must disclose that clearly within your description. Undisclosed commercial content will be removed and may result in your account being suspended.</p>

<h4>7. Accuracy</h4>
<p>You will make reasonable efforts to ensure that locations, routes, opening details, safety information and other practical guidance in your submission are accurate at the time of publication. You accept that other travellers may rely on this information, and you will not knowingly publish misleading or unsafe guidance.</p>

<h4>8. Moderation and removal</h4>
<p>All submissions are reviewed before publication. The Platform may accept, reject, edit for length or formatting, re-categorise, unpublish or permanently delete any submission at its sole discretion and without providing a reason. Content that receives multiple user reports may be automatically returned to a pending state and hidden from public view pending review.</p>

<h4>9. Copyright complaints and indemnity</h4>
<p>If a rights holder notifies the Platform that your submission infringes their rights, the Platform may remove that content immediately and without prior notice to you. Repeated infringement will result in permanent termination of your account. You agree to indemnify and hold the Platform harmless against any claim, demand, loss, damage, cost or legal expense arising from content you submitted in breach of clauses 1, 2, 5 or 6.</p>

<h4>10. Your right to withdraw</h4>
<p>You may request removal of any of your published content at any time through your profile or by contacting the Platform. Removal will be processed within a reasonable period. Removal does not entitle you to compensation and does not oblige the Platform to delete aggregate statistics, anonymised data or archived moderation records relating to that content.</p>

<h4>11. No employment or partnership</h4>
<p>Nothing in this agreement creates an employment relationship, partnership, joint venture or agency between you and the Platform. You submit content voluntarily. Unless separately agreed in writing, you are not entitled to any payment, revenue share or other consideration for content you submit.</p>

<h4>12. Data</h4>
<p>The Platform will store your account details, the content you submit, the metadata attached to it, and a record of this signed agreement including the date and version signed. This record is retained for as long as necessary to evidence the rights under which your content is published.</p>

<h4>13. Changes to this agreement</h4>
<p>The Platform may revise this agreement. Where a revision materially changes your obligations or the rights you grant, you will be asked to review and sign the new version before submitting further content. Content already published remains governed by the version you signed at the time of its submission.</p>

<h4>14. Governing law</h4>
<p>This agreement is governed by the laws of the Republic of Türkiye. Any dispute arising from it shall be subject to the exclusive jurisdiction of the courts of Istanbul.</p>

<h4>15. Acknowledgement</h4>
<p>By typing your full legal name below and confirming, you acknowledge that you have read this agreement in full, that you accept every clause, and that you intend your typed name to have the same effect as a handwritten signature.</p>
`;
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
    width: 100%; max-width: 760px; margin: 0 auto;
    color: #141414; padding: 8px 0 56px;
  }

  h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.6px; margin: 0 0 6px; }
  .sub { font-size: 15px; opacity: 0.55; margin: 0 0 32px; }

  .field { margin-bottom: 26px; }
  label.lbl { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
  label.lbl .opt { font-weight: 400; opacity: 0.5; }
  .hint { font-size: 12.5px; opacity: 0.5; margin-top: 6px; line-height: 1.45; }

  input[type="text"], input[type="url"], textarea {
    width: 100%; font-family: inherit; font-size: 14.5px; color: #141414;
    background: #ffffff; border: 1px solid rgba(20,20,20,0.16);
    border-radius: 10px; padding: 13px 16px; outline: none;
    transition: border-color 0.15s ease;
  }
  input:focus, textarea:focus { border-color: #141414; }
  textarea { min-height: 120px; resize: vertical; line-height: 1.5; }

  .toggle { display: flex; gap: 8px; background: rgba(20,20,20,0.05); padding: 5px; border-radius: 12px; margin-bottom: 30px; }
  .toggle button {
    flex: 1; font-family: inherit; font-size: 14px; font-weight: 600;
    color: #141414; background: transparent; border: 0; border-radius: 9px;
    padding: 11px 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s ease;
  }
  .toggle button:hover { background: rgba(255,255,255,0.6); }
  .toggle button.active { background: #ffffff; box-shadow: 0 1px 3px rgba(20,20,20,0.12); }
  .toggle svg { width: 16px; height: 16px; }

  .vpreview { display: none; gap: 14px; align-items: flex-start; background: #f4f3ef; border-radius: 12px; padding: 14px; margin-top: 14px; }
  .vpreview.on { display: flex; }
  .vpreview img { width: 150px; height: 84px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .vpreview .vtitle { font-size: 14px; font-weight: 600; line-height: 1.35; margin-bottom: 4px; }
  .vpreview .vchan { font-size: 12.5px; opacity: 0.55; }

  .status { font-size: 13px; margin-top: 8px; display: none; }
  .status.on { display: block; }
  .status.err { color: #b3261e; }
  .status.ok { color: #1e7b3c; }
  .status.warn { color: #8a5a00; }

  .drop {
    border: 1.5px dashed rgba(20,20,20,0.25); border-radius: 12px;
    padding: 34px 20px; text-align: center; cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .drop:hover, .drop.over { border-color: #141414; background: rgba(20,20,20,0.03); }
  .drop .big { font-size: 14.5px; font-weight: 600; margin-bottom: 4px; }
  .drop .small { font-size: 12.5px; opacity: 0.5; }

  .thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .thumb { position: relative; width: 96px; height: 96px; border-radius: 10px; overflow: hidden; background: #f4f3ef; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb .rm {
    position: absolute; top: 5px; right: 5px; width: 20px; height: 20px;
    border-radius: 50%; background: rgba(20,20,20,0.72); color: #fff;
    border: 0; cursor: pointer; font-size: 13px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .thumb.cover::after {
    content: 'Cover'; position: absolute; left: 5px; bottom: 5px;
    background: rgba(20,20,20,0.78); color: #fff; font-size: 10px;
    font-weight: 600; padding: 2px 6px; border-radius: 4px;
  }

  .prefixed { display: flex; align-items: stretch; }
  .prefixed .pfx {
    display: flex; align-items: center; padding: 0 4px 0 16px;
    background: #ffffff; border: 1px solid rgba(20,20,20,0.16);
    border-right: 0; border-radius: 10px 0 0 10px;
    font-size: 14.5px; opacity: 0.45; white-space: nowrap;
  }
  .prefixed input { border-radius: 0 10px 10px 0; border-left: 0; padding-left: 2px; }

  .agree-box { background: #f4f3ef; border-radius: 12px; padding: 18px; margin: 4px 0 24px; }
  .agree-head { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
  .agree-head .dot { width: 8px; height: 8px; border-radius: 50%; background: #b3261e; flex-shrink: 0; }
  .agree-head.done .dot { background: #1e7b3c; }
  .agree-body { font-size: 13px; line-height: 1.55; opacity: 0.7; }
  .agree-btn {
    font-family: inherit; margin-top: 12px; background: #141414; color: #fff;
    font-size: 13.5px; font-weight: 600; border: 0; border-radius: 8px;
    padding: 11px 20px; cursor: pointer;
  }
  .agree-btn.secondary { background: transparent; color: #141414; border: 1px solid rgba(20,20,20,0.28); }

  .modal-back {
    position: fixed; inset: 0; background: rgba(20,20,20,0.45);
    display: none; align-items: center; justify-content: center;
    z-index: 10050; padding: 24px;
  }
  .modal-back.on { display: flex; }
  .modal {
    background: #fff; border-radius: 16px; width: 100%; max-width: 720px;
    max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 24px 60px rgba(20,20,20,0.28);
  }
  .modal .m-head { padding: 22px 26px 14px; border-bottom: 1px solid rgba(20,20,20,0.08); }
  .modal .m-head strong { font-size: 17px; font-weight: 700; }
  .modal .m-head p { font-size: 12.5px; opacity: 0.5; margin: 4px 0 0; }
  .doc { overflow-y: auto; padding: 20px 26px; font-size: 13.5px; line-height: 1.62; flex: 1 1 auto; }
  .doc h3 { font-size: 17px; margin: 0 0 2px; }
  .doc .ver { font-size: 12px; opacity: 0.45; margin: 0 0 18px; }
  .doc h4 { font-size: 13.5px; margin: 20px 0 6px; }
  .doc p { margin: 0 0 10px; opacity: 0.85; }
  .m-foot { border-top: 1px solid rgba(20,20,20,0.08); padding: 18px 26px 22px; background: #fafaf8; }
  .scroll-note { font-size: 12.5px; color: #8a5a00; margin-bottom: 12px; }
  .scroll-note.hide { display: none; }
  .sig-row { display: flex; gap: 10px; align-items: center; }
  .sig-row input { flex: 1 1 auto; }
  .m-foot .agree-btn { margin-top: 0; }
  .m-foot .agree-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .m-close {
    background: none; border: 0; font-family: inherit; font-size: 13px;
    opacity: 0.55; cursor: pointer; margin-top: 12px; padding: 0;
  }

  .submit {
    font-family: inherit; width: 100%; background: #141414; color: #fff;
    font-size: 15px; font-weight: 600; border: 0; border-radius: 10px;
    padding: 15px 24px; cursor: pointer; transition: opacity 0.15s ease;
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
    <label class="lbl" for="title">Vlog title</label>
    <input type="text" id="title" maxlength="90" placeholder="e.g. Cappadocia at Sunrise">
  </div>

  <div class="section on" id="videoSection">
    <div class="field">
      <label class="lbl" for="videoUrl">YouTube or Vimeo link</label>
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
      <div class="hint">We don't host the video itself — your YouTube or Vimeo upload plays embedded on your TravelVlog page.</div>
    </div>
  </div>

  <div class="section" id="gallerySection">
    <div class="field">
      <label class="lbl">Photos</label>
      <div class="drop" id="drop">
        <div class="big">Drag photos here, or click to choose</div>
        <div class="small">Between 3 and 15 photos · JPG, PNG or WebP</div>
      </div>
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" multiple hidden>
      <div class="thumbs" id="thumbs"></div>
      <div class="status" id="galleryStatus"></div>
      <div class="hint">The first photo becomes your cover image.</div>
    </div>
  </div>

  <div class="field">
    <label class="lbl" for="destination">Destination</label>
    <input type="text" id="destination" list="destinationList" maxlength="80" placeholder="e.g. Cappadocia, Türkiye" autocomplete="off">
    <datalist id="destinationList"></datalist>
    <div class="hint">Type the place yourself. If it already exists we'll match it; if it's new, it joins the map once approved.</div>
  </div>

  <div class="field">
    <label class="lbl" for="experience">Experience <span class="opt">(optional)</span></label>
    <input type="text" id="experience" list="experienceList" maxlength="80" placeholder="e.g. Hot air balloon flight" autocomplete="off">
    <datalist id="experienceList"></datalist>
  </div>

  <div class="field">
    <label class="lbl" for="instagram">Your Instagram <span class="opt">(optional)</span></label>
    <div class="prefixed">
      <span class="pfx">instagram.com/</span>
      <input type="text" id="instagram" maxlength="40" placeholder="yourhandle" autocomplete="off">
    </div>
    <div class="status" id="instagramStatus"></div>
    <div class="hint">Shown on your vlog page so viewers can follow you.</div>
  </div>

  <div class="field">
    <label class="lbl" for="description">Description</label>
    <textarea id="description" maxlength="2000" placeholder="What happened on this trip?"></textarea>
  </div>

  <div class="agree-box">
    <div class="agree-head" id="agreeHead"><span class="dot"></span><span id="agreeHeadText">Contributor Agreement — not signed</span></div>
    <div class="agree-body" id="agreeBody">Before publishing anything you need to read and sign the Contributor Agreement. It covers ownership, permissions, disclosure and removal.</div>
    <button type="button" class="agree-btn" id="openAgreement">Read and sign</button>
  </div>

  <button class="submit" id="submit" disabled>Submit for Review</button>
  <div class="status" id="submitStatus"></div>
</div>

<div class="modal-back" id="modalBack">
  <div class="modal">
    <div class="m-head">
      <strong>Contributor Agreement</strong>
      <p>Please scroll to the end before signing.</p>
    </div>
    <div class="doc" id="doc">${this._agreementHtml()}</div>
    <div class="m-foot">
      <div class="scroll-note" id="scrollNote">Scroll to the bottom of the agreement to enable signing.</div>
      <div class="sig-row">
        <input type="text" id="signature" placeholder="Type your full legal name" disabled autocomplete="off">
        <button type="button" class="agree-btn" id="signBtn" disabled>Sign</button>
      </div>
      <div class="status" id="signStatus"></div>
      <button type="button" class="m-close" id="closeModal">Cancel</button>
    </div>
  </div>
</div>`;
  }

  // ================================================================
  _cacheEls() {
    const r = this._root;
    const id = (x) => r.getElementById(x);
    this.el = {
      toggle: id('toggle'), title: id('title'),
      videoSection: id('videoSection'), gallerySection: id('gallerySection'),
      videoUrl: id('videoUrl'), videoStatus: id('videoStatus'),
      videoPreview: id('videoPreview'), videoThumb: id('videoThumb'),
      videoTitle: id('videoTitle'), videoChannel: id('videoChannel'),
      channelWarn: id('channelWarn'),
      drop: id('drop'), fileInput: id('fileInput'), thumbs: id('thumbs'),
      galleryStatus: id('galleryStatus'),
      destination: id('destination'), destinationList: id('destinationList'),
      experience: id('experience'), experienceList: id('experienceList'),
      instagram: id('instagram'), instagramStatus: id('instagramStatus'),
      description: id('description'),
      agreeHead: id('agreeHead'), agreeHeadText: id('agreeHeadText'),
      agreeBody: id('agreeBody'), openAgreement: id('openAgreement'),
      modalBack: id('modalBack'), doc: id('doc'), scrollNote: id('scrollNote'),
      signature: id('signature'), signBtn: id('signBtn'), signStatus: id('signStatus'),
      closeModal: id('closeModal'),
      submit: id('submit'), submitStatus: id('submitStatus')
    };
  }

  _wire() {
    const e = this.el;

    e.toggle.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-type]');
      if (btn) this._setContentType(btn.getAttribute('data-type'));
    });

    e.videoUrl.addEventListener('blur', () => this._validateVideo());
    e.title.addEventListener('input', () => this._refreshSubmit());
    e.destination.addEventListener('input', () => this._refreshSubmit());
    e.instagram.addEventListener('input', () => this._checkInstagram());

    e.drop.addEventListener('click', () => e.fileInput.click());
    e.fileInput.addEventListener('change', () => this._addFiles(Array.from(e.fileInput.files)));
    ['dragenter', 'dragover'].forEach((t) =>
      e.drop.addEventListener(t, (ev) => { ev.preventDefault(); e.drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) =>
      e.drop.addEventListener(t, (ev) => { ev.preventDefault(); e.drop.classList.remove('over'); }));
    e.drop.addEventListener('drop', (ev) =>
      this._addFiles(Array.from(ev.dataTransfer.files).filter((f) => f.type.startsWith('image/'))));

    e.openAgreement.addEventListener('click', () => this._openAgreement());
    e.closeModal.addEventListener('click', () => e.modalBack.classList.remove('on'));
    e.doc.addEventListener('scroll', () => this._checkScrolledToEnd());
    e.signature.addEventListener('input', () => this._refreshSignButton());
    e.signBtn.addEventListener('click', () => this._sign());

    e.submit.addEventListener('click', () => this._submit());
  }

  // ================================================================
  // Bridge to page code
  // ================================================================
  _ask(action, payload) {
    const requestId = `r${++this._requestSeq}`;
    return new Promise((resolve, reject) => {
      this._pendingRequests.set(requestId, { resolve, reject });
      this.dispatchEvent(new CustomEvent('vlogRequest', { detail: { requestId, action, payload } }));
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

    if (name === 'data-destination-suggestions' || name === 'data-experience-suggestions') {
      let list;
      try { list = JSON.parse(value); } catch (err) { return; }
      const target = name === 'data-destination-suggestions' ? this.el.destinationList : this.el.experienceList;
      target.innerHTML = '';
      (list || []).forEach((label) => {
        const opt = document.createElement('option');
        opt.value = label;
        target.appendChild(opt);
      });
      return;
    }

    if (name === 'data-member') {
      try {
        const m = JSON.parse(value) || {};
        this._memberName = m.name || '';
        if (m.instagram && !this.el.instagram.value) this.el.instagram.value = m.instagram;
      } catch (err) { /* ignore */ }
      return;
    }

    if (name === 'data-agreement') {
      try {
        const a = JSON.parse(value) || {};
        this._agreementSigned = !!a.signed;
        this._agreementVersion = a.version || '';
        this._renderAgreementState(a.signedDate);
      } catch (err) { /* ignore */ }
    }
  }

  // ================================================================
  // Agreement
  // ================================================================
  _renderAgreementState(signedDate) {
    const e = this.el;
    if (this._agreementSigned) {
      e.agreeHead.classList.add('done');
      e.agreeHeadText.textContent = `Contributor Agreement — signed (v${this._agreementVersion})`;
      const when = signedDate ? new Date(signedDate).toLocaleDateString('en-GB') : '';
      e.agreeBody.textContent = when
        ? `You signed this agreement on ${when}. You can read it again at any time.`
        : 'You have signed this agreement. You can read it again at any time.';
      e.openAgreement.textContent = 'Read agreement';
      e.openAgreement.classList.add('secondary');
    } else {
      e.agreeHead.classList.remove('done');
      e.agreeHeadText.textContent = 'Contributor Agreement — not signed';
      e.openAgreement.textContent = 'Read and sign';
      e.openAgreement.classList.remove('secondary');
    }
    this._refreshSubmit();
  }

  _openAgreement() {
    this.el.modalBack.classList.add('on');
    this.el.doc.scrollTop = 0;
    if (this._agreementSigned) {
      this.el.scrollNote.classList.add('hide');
      this.el.signature.disabled = true;
      this.el.signBtn.disabled = true;
      this.el.signature.value = '';
      this.el.signature.placeholder = 'Already signed';
    } else {
      this.el.scrollNote.classList.remove('hide');
      this.el.signature.disabled = true;
      this.el.signBtn.disabled = true;
      // A short viewport could already show the whole document.
      setTimeout(() => this._checkScrolledToEnd(), 60);
    }
  }

  _checkScrolledToEnd() {
    if (this._agreementSigned) return;
    const d = this.el.doc;
    if (d.scrollTop + d.clientHeight >= d.scrollHeight - 24) {
      this.el.scrollNote.classList.add('hide');
      this.el.signature.disabled = false;
      this.el.signature.placeholder = 'Type your full legal name';
      this._refreshSignButton();
    }
  }

  _refreshSignButton() {
    const v = this.el.signature.value.trim();
    this.el.signBtn.disabled = !(v.length >= 5 && v.indexOf(' ') > 0);
  }

  async _sign() {
    this.el.signBtn.disabled = true;
    this._setStatus(this.el.signStatus, 'Recording your signature…', '');
    try {
      const result = await this._ask('signAgreement', { fullName: this.el.signature.value.trim() });
      this._agreementSigned = true;
      this._agreementVersion = (result && result.version) || this._agreementVersion;
      this._setStatus(this.el.signStatus, 'Signed. Thank you.', 'ok');
      this._renderAgreementState(result && result.signedDate);
      setTimeout(() => this.el.modalBack.classList.remove('on'), 900);
    } catch (err) {
      const messages = {
        not_logged_in: 'You need to be logged in to sign.',
        invalid_signature: 'Please type your full name, first and last.',
        timeout: 'The request timed out. Please try again.'
      };
      this._setStatus(this.el.signStatus, messages[err.message] || 'Could not record the signature. Please try again.', 'err');
      this.el.signBtn.disabled = false;
    }
  }

  // ================================================================
  // Content type
  // ================================================================
  _setContentType(type) {
    this._contentType = type;
    const isVideo = type === 'video';
    this.el.toggle.querySelectorAll('button').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-type') === type));
    this.el.videoSection.classList.toggle('on', isVideo);
    this.el.gallerySection.classList.toggle('on', !isVideo);
    this._refreshSubmit();
  }

  // ================================================================
  // Video
  // ================================================================
  async _validateVideo() {
    const url = this.el.videoUrl.value.trim();
    if (!url) return;

    this._setStatus(this.el.videoStatus, 'Checking…', '');
    this.el.videoPreview.classList.remove('on');
    this.el.channelWarn.classList.remove('on');

    let result;
    try {
      result = await this._ask('validateVideo', { url });
    } catch (err) {
      this._videoMeta = null;
      this._setStatus(this.el.videoStatus, 'Something went wrong while checking the video. Please try again.', 'err');
      this._refreshSubmit();
      return;
    }

    if (!result || !result.valid) {
      this._videoMeta = null;
      const messages = {
        unsupported_platform: 'Only YouTube and Vimeo links are accepted.',
        video_not_found: 'We couldn\'t find that video — please check the link.',
        too_short: 'That clip looks too short. Shorts and Reels aren\'t accepted.',
        fetch_error: 'Something went wrong while checking the video. Please try again.',
        empty_url: 'Please paste a video link.'
      };
      this._setStatus(this.el.videoStatus, messages[result && result.reason] || 'The video could not be verified.', 'err');
      this._refreshSubmit();
      return;
    }

    this._videoMeta = result;
    this._setStatus(this.el.videoStatus, 'Video found.', 'ok');
    this.el.videoThumb.src = result.thumbnail || '';
    this.el.videoTitle.textContent = result.title || '';
    this.el.videoChannel.textContent = result.channelName || '';
    this.el.videoPreview.classList.add('on');

    if (this._channelMismatch(result.channelName, this._memberName)) {
      this._setStatus(this.el.channelWarn,
        'This channel name doesn\'t match your profile — please make sure the video is yours.', 'warn');
    }

    if (!this.el.title.value.trim() && result.title) this.el.title.value = result.title;
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
  // Instagram
  // ================================================================
  _cleanInstagram() {
    let v = this.el.instagram.value.trim();
    v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
    v = v.replace(/^@/, '').replace(/\/+$/, '').split('?')[0];
    return v;
  }

  _checkInstagram() {
    const handle = this._cleanInstagram();
    if (!handle) { this.el.instagramStatus.classList.remove('on'); this._refreshSubmit(); return true; }
    const valid = /^[A-Za-z0-9._]{1,30}$/.test(handle);
    if (!valid) {
      this._setStatus(this.el.instagramStatus,
        'Handles can only contain letters, numbers, dots and underscores.', 'err');
    } else {
      this.el.instagramStatus.classList.remove('on');
    }
    this._refreshSubmit();
    return valid;
  }

  // ================================================================
  // Gallery
  // ================================================================
  _addFiles(files) {
    const MAX = 15;
    const room = MAX - this._galleryFiles.length;
    if (room <= 0) {
      this._setStatus(this.el.galleryStatus, `You can add at most ${MAX} photos.`, 'err');
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
      div.innerHTML = `<img src="${entry.previewUrl}" alt=""><button class="rm" type="button" aria-label="remove">&times;</button>`;
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
    if (n < 3) this._setStatus(this.el.galleryStatus, `At least 3 photos are needed — you have ${n}.`, 'err');
    else this._setStatus(this.el.galleryStatus, `${n} photos ready.`, 'ok');
  }

  async _uploadGallery() {
    const urls = [];
    for (let i = 0; i < this._galleryFiles.length; i++) {
      const entry = this._galleryFiles[i];
      if (entry.uploadedUrl) { urls.push(entry.uploadedUrl); continue; }

      this._setStatus(this.el.submitStatus, `Uploading photos… (${i + 1}/${this._galleryFiles.length})`, '');

      const ticket = await this._ask('getUploadUrl', {
        fileName: entry.file.name, mimeType: entry.file.type
      });

      const form = new FormData();
      form.append('file', entry.file);

      const res = await fetch(`${ticket.uploadUrl}?filename=${encodeURIComponent(entry.file.name)}`, {
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
    const hasDestination = this.el.destination.value.trim().length > 1;
    const handle = this._cleanInstagram();
    const igOk = !handle || /^[A-Za-z0-9._]{1,30}$/.test(handle);
    const ready = this._contentType === 'video'
      ? !!this._videoMeta
      : (this._galleryFiles.length >= 3 && this._galleryFiles.length <= 15);

    this.el.submit.disabled = !(hasTitle && hasDestination && igOk && ready && this._agreementSigned);
  }

  async _submit() {
    this.el.submit.disabled = true;
    this._setStatus(this.el.submitStatus, 'Submitting…', '');

    const payload = {
      title: this.el.title.value.trim(),
      slug: this._slugify(this.el.title.value),
      contentType: this._contentType,
      description: this.el.description.value.trim(),
      destinationName: this.el.destination.value.trim(),
      experienceName: this.el.experience.value.trim(),
      instagramHandle: this._cleanInstagram(),
      agreementVersion: this._agreementVersion
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
      this._setStatus(this.el.submitStatus,
        result && result.status === 'Approved'
          ? 'Your vlog is live! Redirecting…'
          : 'Your vlog was submitted and is awaiting review. Redirecting…',
        'ok');
      this.dispatchEvent(new CustomEvent('vlogSubmitted', { detail: result || {} }));
    } catch (err) {
      console.error('Vlog submission failed', err);
      const messages = {
        not_logged_in: 'You need to be logged in to submit a vlog.',
        agreement_not_signed: 'Please sign the Contributor Agreement first.',
        upload_failed: 'The photos could not be uploaded. Please try again.',
        unsupported_file_type: 'Only JPG, PNG and WebP files are accepted.',
        timeout: 'The request timed out. Please try again.'
      };
      this._setStatus(this.el.submitStatus,
        messages[err.message] || 'Something went wrong while submitting. Please try again.', 'err');
      this.el.submit.disabled = false;
    }
  }

  // ================================================================
  _setStatus(node, text, kind) {
    node.textContent = text;
    node.className = 'status on' + (kind ? ' ' + kind : '');
  }

  _slugify(text) {
    return (text || '')
      .toLowerCase().trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

customElements.define('travel-vlog-create', TravelVlogCreate);
