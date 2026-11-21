const imageCache = new Map();
const imageTimeout = 14000;
let imageGeneration = 0;

function releaseConceptImages() {
  imageGeneration++;
  for (const entry of imageCache.values()) {
    entry.controller?.abort();
    if (entry.url) URL.revokeObjectURL(entry.url);
  }
  imageCache.clear();
}

function refreshConceptImageSelection() {
  for (const card of cards.querySelectorAll('.card')) {
    const button = card.querySelector('[data-concept]');
    const active = Number(button.dataset.concept) === selected;
    card.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '✓ ใช้ในเทมเพลต' : 'ใช้ในเทมเพลต';
  }
}

function identifyFallback(card, message) {
  card.querySelector('.art').dataset.state = 'fallback';
  card.querySelector('.image-status').textContent = message;
  card.querySelector('[data-retry]').hidden = false;
  card.querySelector('.image-source').hidden = false;
}

async function loadConceptImage(card, concept) {
  const generation = imageGeneration;
  const frame = card.querySelector('.art');
  const status = card.querySelector('.image-status');
  const retry = card.querySelector('[data-retry]');
  const direct = card.querySelector('.image-source');
  const art = card.querySelector('.generated-art');
  const use = card.querySelector('[data-use-image]');
  const remote = conceptImageUrl(concept);
  direct.href = remote;
  direct.hidden = true;
  retry.hidden = true;
  frame.dataset.state = 'loading';
  status.textContent = 'กำลังสร้างภาพตัวอย่าง…';
  use.disabled = true;
  const controller = new AbortController();
  const entry = {controller};
  imageCache.set(concept.index, entry);
  const timer = setTimeout(() => controller.abort(), imageTimeout);
  try {
    const response = await fetch(remote, {signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Invalid image response');
    if (generation !== imageGeneration) return;
    if (controller.signal.aborted) throw new Error('Timed out');
    entry.url = URL.createObjectURL(blob);
    art.src = entry.url;
    await art.decode();
    if (generation !== imageGeneration) return;
    if (controller.signal.aborted) throw new Error('Timed out');
    entry.blob = blob;
    frame.dataset.state = 'ready';
    status.textContent = 'ภาพตัวอย่างจาก Pollinations';
    use.disabled = false;
  } catch {
    if (generation !== imageGeneration) return;
    if (entry.url) URL.revokeObjectURL(entry.url);
    imageCache.delete(concept.index);
    art.removeAttribute('src');
    identifyFallback(card, controller.signal.aborted ? 'รอภาพนานเกินไป · กำลังแสดงแบบร่างจัดหน้า' : 'โหลดภาพ AI ไม่สำเร็จ · กำลังแสดงแบบร่างจัดหน้า');
  } finally {
    clearTimeout(timer);
  }
}

function loadConceptImages() {
  for (const card of cards.querySelectorAll('.card')) {
    const index = Number(card.querySelector('[data-concept]').dataset.concept);
    loadConceptImage(card, concepts[index]);
  }
}

function handleConceptImageAction(event) {
  const retry = event.target.closest('[data-retry]');
  const use = event.target.closest('[data-use-image]');
  if (retry) {
    loadConceptImage(retry.closest('.card'), concepts[Number(retry.dataset.retry)]);
    return true;
  }
  if (use) {
    const entry = imageCache.get(Number(use.dataset.useImage));
    if (entry?.blob) {
      document.querySelector('#vectorizer').scrollIntoView({behavior:'smooth'});
      importVectorImage(entry.blob);
    }
    return true;
  }
  return false;
}
