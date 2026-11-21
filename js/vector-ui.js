'use strict';

const vectorFile = document.querySelector('#vector-file');
const vectorInks = document.querySelector('#vector-inks');
const vectorSmooth = document.querySelector('#vector-smooth');
const vectorWhite = document.querySelector('#vector-white');
const vectorPreview = document.querySelector('#vector-preview');
const vectorSize = document.querySelector('#vector-size');
const vectorMessage = document.querySelector('#vector-message');
const vectorPalette = document.querySelector('#vector-palette');
const vectorDownload = document.querySelector('#vector-download');
const vectorUseColors = document.querySelector('#vector-use-colors');
const vectorUseArt = document.querySelector('#vector-use-art');
let raster;
let traced;
let vectorUrl;
let workTimer;
let uploadSequence = 0;

function vectorSettings() {
  return {inks:Number(vectorInks.value), smooth:Number(vectorSmooth.value), white:vectorWhite.checked};
}

function applyVectorSettings(settings) {
  vectorInks.value = settings.inks;
  vectorSmooth.value = settings.smooth;
  vectorWhite.checked = settings.white;
  scheduleTrace();
}

function showVector(result, message = '') {
  traced = result;
  if (vectorUrl) URL.revokeObjectURL(vectorUrl);
  vectorPalette.replaceChildren();
  vectorSize.textContent = '';
  vectorPreview.replaceChildren();
  vectorMessage.textContent = message;
  const ready = !!result?.paths.length;
  vectorDownload.disabled = !ready;
  vectorUseColors.disabled = !ready;
  vectorUseArt.disabled = !ready;
  if (!ready) {
    const placeholder = document.createElement('p');
    placeholder.textContent = message || 'เลือกภาพ PNG หรือ JPG เพื่อเริ่ม';
    vectorPreview.append(placeholder);
    vectorMessage.textContent = '';
    return;
  }
  const image = document.createElement('img');
  vectorUrl = URL.createObjectURL(new Blob([vectorSvg(result)], {type:'image/svg+xml'}));
  image.src = vectorUrl;
  image.alt = 'ภาพเวกเตอร์หลังแปลง';
  vectorPreview.append(image);
  vectorSize.textContent = result.width + ' × ' + result.height + ' px ต้นทาง';
  vectorMessage.textContent = result.colors.length + ' สี · กดรหัสสีเพื่อคัดลอก';
  for (const color of result.colors) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    const swatch = document.createElement('i');
    swatch.style.background = color;
    button.append(swatch, color);
    button.addEventListener('click', async () => {
      if (await copyText(color)) notify('คัดลอก ' + color + ' แล้ว');
      else window.prompt('คัดลอกรหัสสี', color);
    });
    vectorPalette.append(button);
  }
}

function scheduleTrace() {
  const settings = vectorSettings();
  document.querySelector('#vector-ink-count').value = settings.inks;
  document.querySelector('#vector-smooth-count').value = settings.smooth;
  clearTimeout(workTimer);
  if (!raster) return;
  showVector(null, 'กำลังแปลงภาพ…');
  workTimer = setTimeout(() => {
    try {
      const result = vectorize(raster, settings);
      showVector(result, 'ไม่พบพื้นที่สี ลองปิดการลบพื้นหลังขาวหรือเลือกภาพใหม่');
    } catch {
      showVector(null, 'แปลงภาพไม่สำเร็จ ลองเลือกภาพใหม่');
    }
  }, 90);
}

async function importVectorImage(file) {
  const sequence = ++uploadSequence;
  raster = null;
  clearTimeout(workTimer);
  showVector(null, 'กำลังอ่านภาพ…');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (sequence !== uploadSequence) return;
    raster = pixelsFromImage(image);
    scheduleTrace();
  } catch {
    if (sequence === uploadSequence) showVector(null, 'เปิดภาพนี้ไม่ได้ กรุณาตรวจสอบไฟล์แล้วลองใหม่');
  } finally {
    URL.revokeObjectURL(url);
  }
}

vectorFile.addEventListener('change', () => {
  const file = vectorFile.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type) && !(file.type === '' && /\.(png|jpe?g)$/i.test(file.name))) {
    uploadSequence++;
    raster = null;
    clearTimeout(workTimer);
    showVector(null, 'รองรับไฟล์ PNG และ JPG เท่านั้น');
    return;
  }
  importVectorImage(file);
});

for (const field of [vectorInks, vectorSmooth, vectorWhite]) field.addEventListener('input', scheduleTrace);
vectorDownload.addEventListener('click', () => {
  if (traced) downloadBlob(new Blob([vectorSvg(traced)], {type:'image/svg+xml'}), 'forma-vector.svg');
});
vectorUseColors.addEventListener('click', () => {
  if (!traced) return;
  templateAssets.colors = traced.colors;
  refreshPreview();
  notify('ใช้ชุดสีจากภาพในเทมเพลตแล้ว');
});
vectorUseArt.addEventListener('click', () => {
  if (!traced) return;
  templateAssets.vector = traced;
  refreshPreview();
  notify('วางภาพในกลุ่ม Layer_Artwork แล้ว');
});
