'use strict';

const briefForm = document.querySelector('#brief');
const templateForm = document.querySelector('#template');
const cards = document.querySelector('#cards');
const preview = document.querySelector('#preview');
const statusBox = document.querySelector('#status');
const promptBox = document.querySelector('#prompt');
const templateAssets = { colors:null, vector:null };
let activeBrief;
const templateFields = templateForm.elements;
const calendarSettings = document.querySelector('#calendar-settings');
const currentYear = Number(new Intl.DateTimeFormat('en', {year:'numeric', timeZone:'Asia/Bangkok'}).format(new Date()));
let concepts = [];
let selected = 0;
let previousUnit = 'mm';
let previousEra = 'BE';
let previewUrl;
let statusTimer;

const searchSites = {
  Pinterest: term => 'https://www.pinterest.com/search/pins/?q=' + term,
  Behance: term => 'https://www.behance.net/search/projects?search=' + term,
  Freepik: term => 'https://www.freepik.com/search?query=' + term
};

function notify(message) {
  clearTimeout(statusTimer);
  statusBox.textContent = message;
  statusBox.hidden = false;
  statusTimer = setTimeout(() => { statusBox.hidden = true; }, 3500);
}

function renderConcepts() {
  promptBox.value = makeImagePrompt(concepts[selected]);
  cards.innerHTML = concepts.map(concept => {
    const active = concept.index === selected;
    const palette = concept.colors.map(color =>
      `<div class="ink"><i style="background:${color}"></i><span>${color} · CMYK ${toCmyk(color).join('/')}</span></div>`
    ).join('');
    const links = Object.entries(searchSites).map(([name, url]) =>
      `<a href="${escapeXml(url(encodeURIComponent(concept.keyword)))}" target="_blank" rel="noopener noreferrer" aria-label="${name} · ${escapeXml(concept.name)}">${name}</a>`
    ).join('');
    return `<article class="card${active ? ' selected' : ''}"><div class="art">${moodboardSvg(concept)}</div><div class="card-body"><h3>${escapeXml(concept.name)}</h3><p>${escapeXml(concept.description)}</p><div class="palette">${palette}</div><div class="links">${links}</div><button class="select-concept" type="button" data-concept="${concept.index}" aria-pressed="${active}">${active ? '✓ ใช้ในเทมเพลต' : 'ใช้ในเทมเพลต'}</button></div></article>`;
  }).join('');
}

function setPreset(type) {
  const [width, height] = workTypes[type].size;
  const factor = unitFactors[templateFields.unit.value];
  templateFields.width.value = Number((width / factor).toFixed(8));
  templateFields.height.value = Number((height / factor).toFixed(8));
}

function refreshPreview() {
  const type = templateFields.type.value;
  const isCalendar = type === 'desk' || type === 'wall';
  calendarSettings.hidden = !isCalendar;
  calendarSettings.querySelectorAll('input, select').forEach(field => { field.disabled = !isCalendar; });
  const settings = fieldValues(templateForm);
  const applied = document.querySelector('#applied-vector');
  const reset = document.querySelector('#reset-vector');
  const labels = [];
  if (templateAssets.colors) labels.push('ใช้ชุดสีจากภาพ');
  if (templateAssets.vector) labels.push('วางภาพเวกเตอร์แล้ว');
  applied.textContent = labels.join(' · ');
  const palette = document.querySelector('#applied-palette');
  palette.replaceChildren(...(templateAssets.colors || []).map(color => {
    const swatch = document.createElement('span');
    swatch.style.background = color;
    swatch.title = color;
    return swatch;
  }));
  reset.hidden = !labels.length;
  const note = document.querySelector('#export-note');
  const size = document.querySelector('#size');
  const download = templateForm.querySelector('button');
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  try {
    const svg = makeTemplate(settings, concepts[selected], templateAssets);
    const blob = new Blob([svg], {type:'image/svg+xml;charset=utf-8'});
    previewUrl = URL.createObjectURL(blob);
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = 'ภาพตัวอย่าง ' + workTypes[type].label;
    preview.replaceChildren(image);
    size.textContent = settings.width + ' × ' + settings.height + ' ' + settings.unit;
    note.textContent = type === 'pack'
      ? 'เทมเพลตหน้าหลักสำหรับจัดวางกราฟิก · ใช้ไดคัทจริงจากผู้ผลิตเมื่อนำไปผลิต'
      : 'เส้นสีน้ำเงินคือขอบตัด · เส้นสีชมพูคือขอบพื้นที่ตัดตก';
    download.disabled = false;
    return {blob, type, year: isCalendar ? settings.year : null};
  } catch (error) {
    preview.textContent = error.message;
    size.textContent = '';
    note.textContent = '';
    download.disabled = true;
    return null;
  }
}

function generate(syncTemplate) {
  const brief = fieldValues(briefForm);
  brief.theme = brief.theme.trim();
  if (!brief.theme) {
    notify('กรุณาระบุธีมงาน');
    briefForm.elements.theme.focus();
    return;
  }
  activeBrief = brief;
  concepts = makeConcepts(brief);
  selected = 0;
  if (syncTemplate && templateFields.type.value !== brief.type) {
    templateFields.type.value = brief.type;
    setPreset(brief.type);
  }
  renderConcepts();
  refreshPreview();
}

briefForm.addEventListener('submit', event => {
  event.preventDefault();
  generate(true);
});
cards.addEventListener('click', event => {
  const button = event.target.closest('[data-concept]');
  if (!button) return;
  selected = Number(button.dataset.concept);
  renderConcepts();
  cards.querySelector('[data-concept="' + selected + '"]').focus();
  refreshPreview();
});

templateForm.addEventListener('input', event => {
  const field = event.target;
  if (field.name === 'type') setPreset(field.value);
  if (field.name === 'unit') {
    const ratio = unitFactors[previousUnit] / unitFactors[field.value];
    for (const dimension of ['width', 'height']) {
      if (templateFields[dimension].value !== '') {
        templateFields[dimension].value = Number((Number(templateFields[dimension].value) * ratio).toFixed(8));
      }
    }
    previousUnit = field.value;
  }
  if (field.name === 'era') {
    if (templateFields.year.value && previousEra !== field.value) {
      templateFields.year.value = Number(templateFields.year.value) + (field.value === 'BE' ? 543 : -543);
    }
    previousEra = field.value;
  }
  refreshPreview();
});

templateForm.addEventListener('submit', event => {
  event.preventDefault();
  const file = refreshPreview();
  if (!file) return;
  downloadBlob(file.blob, 'forma-' + file.type + (file.year ? '-' + file.year : '') + '.svg');
  notify('ดาวน์โหลดเทมเพลต SVG แล้ว');
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

templateFields.year.value = currentYear + 543;
generate(false);

function fieldValues(form) {
  return Object.fromEntries([...form.elements].filter(field => field.name).map(field => [field.name, field.value]));
}

function assignFields(form, values) {
  for (const [name,value] of Object.entries(values)) form.elements[name].value = value;
}

document.querySelector('#copy-prompt').addEventListener('click', async () => {
  if (await copyText(promptBox.value)) {
    notify('คัดลอก Prompt แล้ว');
  } else {
    promptBox.focus();
    promptBox.select();
    notify('เลือก Prompt ให้แล้ว กดคัดลอกได้เลย');
  }
});

document.querySelector('#reset-vector').addEventListener('click', () => {
  templateAssets.colors = null;
  templateAssets.vector = null;
  refreshPreview();
});

function restoreBrief() {
  if (!location.hash.startsWith(sharePrefix)) return;
  try {
    const restored = decodeShare(location.hash);
    activeBrief = restored.brief;
    concepts = makeConcepts(activeBrief);
    selected = restored.selected;
    assignFields(briefForm, restored.draft);
    assignFields(templateForm, restored.template);
    previousUnit = restored.template.unit;
    previousEra = restored.template.era;
    templateAssets.colors = restored.colors;
    templateAssets.vector = restored.art;
    applyVectorSettings(restored.vector);
    renderConcepts();
    refreshPreview();
    notify(restored.omitted ? 'เปิดบรีฟแล้ว · ลิงก์นี้ไม่มีไฟล์ภาพเวกเตอร์ขนาดใหญ่' : 'เปิดบรีฟที่แชร์แล้ว');
  } catch {
    notify('เปิดบรีฟจากลิงก์นี้ไม่ได้');
  }
}

document.querySelector('#share-brief').addEventListener('click', async () => {
  const note = document.querySelector('#share-note');
  note.replaceChildren();
  const artwork = templateAssets.vector;
  const art = artwork ? {width:artwork.width,height:artwork.height,paths:artwork.paths} : null;
  const included = art && JSON.stringify(art).length <= shareArtworkLimit;
  const hash = encodeShare({
    v:2, brief:activeBrief, draft:fieldValues(briefForm), selected, template:fieldValues(templateForm),
    vector:vectorSettings(), colors:templateAssets.colors, art:included ? art : null, omitted:!!art && !included
  });
  const url = new URL(location.href);
  url.hash = hash;
  const text = [];
  if (art && !included) text.push('ภาพเวกเตอร์ใหญ่เกินกว่าจะแนบในลิงก์ ส่งไฟล์ SVG แยกให้ทีมได้');
  if (url.protocol === 'file:') text.push('ลิงก์นี้เปิดได้บนเครื่องนี้ เมื่อขึ้น GitHub Pages ให้สร้างลิงก์จากหน้าเว็บที่เผยแพร่');
  note.textContent = text.join(' · ');
  if (await copyText(url.href)) {
    notify('คัดลอกลิงก์แชร์บรีฟแล้ว');
  } else {
    const box = document.createElement('input');
    box.className = 'share-fallback';
    box.readOnly = true;
    box.value = url.href;
    box.setAttribute('aria-label', 'ลิงก์แชร์บรีฟ');
    note.append(document.createElement('br'), box);
    box.focus();
    box.select();
    notify('เลือกที่อยู่ลิงก์ให้แล้ว กดคัดลอกได้เลย');
  }
});
window.addEventListener('hashchange', restoreBrief);
