'use strict';

const bleed = 3;
const unitFactors = { mm: 1, cm: 10, in: 25.4 };
const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const weekdays = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, char => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[char]))
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '');
}

function monthDates(year, month, weekStart) {
  // setUTCFullYear retains years below 100 without the Date constructor's 1900 offset.
  const date = new Date(0);
  date.setUTCFullYear(year, month, 1);
  const offset = (date.getUTCDay() - weekStart + 7) % 7;
  date.setUTCMonth(month + 1, 0);
  return { offset, days: date.getUTCDate() };
}

function calendarMarkup(year, weekStart, x, y, width, height, color, layout, chosenMonth, holidays) {
  const monthly = layout === 'monthly';
  const columns = monthly ? 1 : (width >= height ? 4 : 3);
  const rows = monthly ? 1 : 12 / columns;
  const cellW = width / columns, cellH = height / rows;
  const dayW = cellW / 7.8;
  const font = Math.min(dayW * .63, cellH / (monthly ? 13 : 10));
  const indexes = monthly ? [chosenMonth - 1] : months.map((_, index) => index);
  const redDates = [];
  const grid = indexes.map((index, slot) => {
    const {offset, days} = monthDates(year, index, weekStart);
    const dx = x + slot % columns * cellW, dy = y + Math.floor(slot / columns) * cellH;
    const groupId = String(index + 1).padStart(2, '0');
    let contents = `<rect x="0" y="0" width="${cellW * .94}" height="${cellH * .94}" rx="${font * .45}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="${font * .075}"/><text x="${dayW * .35}" y="${cellH * .17}" font-size="${font * 1.32}" font-weight="bold">${months[index]}</text>`;
    for (let col = 0; col < 7; col++) {
      contents += `<text x="${dayW * (col + .65)}" y="${cellH * .32}" text-anchor="middle" fill-opacity=".76">${weekdays[(col + weekStart) % 7]}</text>`;
    }
    const monthHolidays = [];
    for (let day = 1; day <= days; day++) {
      const position = offset + day - 1;
      const dateX = dayW * (position % 7 + .65);
      const dateY = cellH * (.43 + Math.floor(position / 7) * (monthly ? .067 : .084));
      const holiday = holidays[`${index + 1}-${day}`];
      const date = `<text x="${dateX}" y="${dateY}" text-anchor="middle"${holiday ? ' font-weight="bold"' : ''}>${holiday ? '<title>' + escapeXml(holiday) + '</title>' : ''}${day}</text>`;
      if (holiday) {
        monthHolidays.push(date);
        if (monthly) monthHolidays.push(`<text x="${dayW * .35}" y="${cellH * (.83 + .025 * ((monthHolidays.length - 1) / 2))}" font-size="${font * .35}">${day} · ${escapeXml(holiday)}</text>`);
      } else {
        contents += date;
      }
    }
    if (monthHolidays.length) redDates.push(`<g id="Holidays_${groupId}" transform="translate(${dx} ${dy})" font-size="${font}">${monthHolidays.join('')}</g>`);
    return `<g id="Month_${groupId}" transform="translate(${dx} ${dy})" font-size="${font}">${contents}</g>`;
  }).join('');
  return {grid, holidays:redDates.join('')};
}

function fittedArtwork(vector, x, y, width, height) {
  const scale = Math.min(width / vector.width, height / vector.height);
  const left = x + (width - vector.width * scale) / 2;
  const top = y + (height - vector.height * scale) / 2;
  return `<g id="Traced_Artwork" transform="translate(${left} ${top}) scale(${scale})">${vectorPathMarkup(vector)}</g>`;
}

function makeTemplate(settings, concept, assets = {}) {
  const {type, width, height, unit, era, year, week} = settings;
  const layoutMode = ['cover','monthly','annual'].includes(settings.layout) ? settings.layout : 'annual';
  const chosenMonth = Number(settings.month) || 1;
  const factor = unitFactors[unit];
  const decimals = value => Number(value.toFixed(8));
  const trimW = decimals(Number(width) * factor), trimH = decimals(Number(height) * factor);
  const isCalendar = type === 'desk' || type === 'wall';
  const ce = Number(year) - (era === 'BE' ? 543 : 0);
  if (![trimW, trimH].every(value => Number.isFinite(value) && value >= 30 && value <= 2000)) {
    throw new Error('กรุณาระบุความกว้างและสูงให้อยู่ระหว่าง 30–2,000 mm หลังแปลงหน่วย');
  }
  if (isCalendar && (!Number.isInteger(ce) || ce < 1 || ce > 9999)) {
    throw new Error('กรุณาระบุปีเต็มที่เทียบเท่า ค.ศ. 1–9999');
  }
  const pageW = decimals(trimW + bleed * 2), pageH = decimals(trimH + bleed * 2);
  const margin = Math.min(trimW, trimH) * .065;
  const x = bleed + margin, y = bleed + margin;
  const innerW = trimW - margin * 2, innerH = trimH - margin * 2;
  const color = assets.colors?.[0] || concept.colors[0], displayYear = escapeXml((era === 'BE' ? 'พ.ศ. ' : 'ค.ศ. ') + year);
  const title = isCalendar ? displayYear : workTypes[type].label;
  const layout = {
    envelope: [ .13, .30, .74, .54 ],
    pack: [ .09, .28, .82, .50 ],
    poster: [ .03, .24, .94, .71 ]
  };
  const hasGrid = isCalendar && layoutMode !== 'cover';
  const [ox, oy, ow, oh] = isCalendar
    ? (hasGrid ? [.58, 0, .42, .21] : [.05, .19, .90, .76])
    : layout[type];
  const art = assets.vector ? fittedArtwork(assets.vector, x + innerW * ox, y + innerH * oy, innerW * ow, innerH * oh) : `<svg x="${x + innerW * ox}" y="${y + innerH * oy}" width="${innerW * ow}" height="${innerH * oh}" viewBox="0 0 300 160" overflow="hidden">${motif(assets.colors ? {...concept, colors:assets.colors} : concept)}</svg>`;
  const calendar = hasGrid
    ? calendarMarkup(ce, Number(week), x, y + innerH * .25, innerW, innerH * .75, color, layoutMode, chosenMonth, thaiHolidaysFor(ce))
    : {grid:'', holidays:''};
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${decimals(pageW / factor)}${unit}" height="${decimals(pageH / factor)}${unit}" viewBox="0 0 ${pageW} ${pageH}" font-family="Tahoma, Noto Sans Thai, sans-serif">
<title>${escapeXml(workTypes[type].label)}${isCalendar ? ' ' + displayYear : ''}</title>
<g id="Layer_Background"><rect width="${pageW}" height="${pageH}" fill="#fff"/></g>
<g id="Layer_Artwork" fill="${color}"><text x="${x}" y="${y + margin}" font-size="${margin * .85}" font-weight="bold">${title}</text>${art}</g>
<g id="Layer_Calendar_Grid" fill="${color}">${calendar.grid}</g>
<g id="Layer_Holidays" fill="#B52334">${calendar.holidays}</g>
<g id="Layer_Bleed_Guides" fill="none" stroke-width=".22"><rect x=".11" y=".11" width="${pageW - .22}" height="${pageH - .22}" stroke="#bf3c80" stroke-dasharray="2 1"/><rect x="${bleed}" y="${bleed}" width="${trimW}" height="${trimH}" stroke="#46749c" stroke-dasharray="2 1"/></g>
</svg>`;
}
