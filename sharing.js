'use strict';

const sharePrefix = '#brief=';
const shareArtworkLimit = 4500;
const shareHashLimit = 10000;
const hexColor = /^#[0-9a-f]{6}$/i;

function makeImagePrompt(concept) {
  const theme = concept.theme.replace(/[\r\n]/g, ' ');
  const subject = concept.subject ? 'Feature ' + concept.subject + ' inspired by the brief theme “' + theme + '”.'
    : 'Interpret the brief theme “' + theme + '” as the visual subject.';
  return [
    'Create a print-oriented flat vector illustration for a ' + concept.format + '.',
    subject,
    'Art direction: ' + concept.style + ' with a ' + concept.mood + ' mood.',
    'Limit the illustration to these solid ink colors: ' + concept.colors.join(', ') + '.',
    'Use clean edges, closed silhouettes, crisp contours, and simple, clearly separated shapes. Keep the background plain and reserve negative space for layout.',
    'No gradients, shadows, textures, blur, photographs, mockups, typography, watermarks, or lettering. Output artwork only, suitable for later vector tracing.'
  ].join(' ');
}

function encodeShare(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  const base64 = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  return sharePrefix + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isChoice(object, key) {
  return typeof key === 'string' && Object.hasOwn(object, key);
}

function readBrief(value, allowBlank = false) {
  if (!value || !isChoice(workTypes, value.type) || !isChoice(moodMatrix, value.mood)
      || !/^[1-8]$/.test(value.inks) || typeof value.theme !== 'string'
      || (!allowBlank && !value.theme.trim()) || value.theme.length > 100) throw new Error('บรีฟในลิงก์ไม่สมบูรณ์');
  return {type:value.type, mood:value.mood, inks:String(value.inks), theme:value.theme};
}

function readTemplate(value) {
  const numberField = (field, maxLength) => typeof field === 'string' && field.length <= maxLength
    && (field === '' || (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(field) && Number.isFinite(Number(field))));
  if (!value || !isChoice(workTypes,value.type) || !isChoice(unitFactors,value.unit)
      || !['BE','CE'].includes(value.era) || !['0','1'].includes(value.week)
      || !numberField(value.width, 32) || !numberField(value.height, 32) || !numberField(value.year, 32)) {
    throw new Error('เทมเพลตในลิงก์ไม่สมบูรณ์');
  }
  const {type,unit,era,week,width,height,year} = value;
  return {type,unit,era,week,width,height,year};
}

function decodeShare(hash) {
  const token = hash.slice(sharePrefix.length);
  if (!hash.startsWith(sharePrefix) || !/^[\w-]+$/.test(token) || hash.length > shareHashLimit) throw new Error('ลิงก์แชร์ไม่ถูกต้อง');
  const bytes = Uint8Array.from(atob(token.replace(/-/g,'+').replace(/_/g,'/')), char => char.charCodeAt(0));
  const state = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  if (state?.v !== 2 || ![0,1,2].includes(state.selected)) throw new Error('ไม่รองรับลิงก์แชร์นี้');
  const vector = state.vector;
  if (!vector || !Number.isInteger(vector.inks) || vector.inks < 2 || vector.inks > 16
      || !Number.isInteger(vector.smooth) || vector.smooth < 0 || vector.smooth > 5 || typeof vector.white !== 'boolean') {
    throw new Error('การตั้งค่าแปลงภาพในลิงก์ไม่สมบูรณ์');
  }
  const colors = Array.isArray(state.colors) && state.colors.length > 0 && state.colors.length <= 16
    && state.colors.every(color => typeof color === 'string' && hexColor.test(color)) ? state.colors : null;
  const art = state.art;
  const validArt = art && [art.width,art.height].every(size => Number.isInteger(size) && size >= 1 && size <= traceLimit)
    && Array.isArray(art.paths) && art.paths.length > 0 && art.paths.length <= 16
    && JSON.stringify(art).length <= shareArtworkLimit && art.paths.every(path => path && typeof path.color === 'string'
      && hexColor.test(path.color) && typeof path.d === 'string' && /^M[0-9 MLZ]+Z$/.test(path.d));
  return {
    brief:readBrief(state.brief), draft:readBrief(state.draft, true), template:readTemplate(state.template),
    selected:state.selected, vector, colors,
    art:validArt ? {width:art.width,height:art.height,paths:art.paths.map(({color,d}) => ({color,d}))} : null,
    omitted:state.omitted === true
  };
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const box = document.createElement('textarea');
    const previous = document.activeElement;
    box.value = value;
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.append(box);
    box.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Manual selection stays available. */ }
    box.remove();
    previous?.focus();
    return copied;
  }
}
