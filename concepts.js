'use strict';

const workTypes = {
  desk: { label: 'ปฏิทินตั้งโต๊ะ', keyword: 'desk calendar', size: [210, 148], direction: 'วางภาพคู่กับตารางวันที่ให้อ่านได้จากระยะใกล้' },
  wall: { label: 'ปฏิทินแขวน', keyword: 'wall calendar', size: [297, 420], direction: 'วางภาพเป็นจุดดึงสายตาและเว้นพื้นที่เหนือหัวเรื่องสำหรับแขวน' },
  envelope: { label: 'ซองอั่งเปา', keyword: 'red envelope', size: [90, 165], direction: 'รวมลวดลายไว้ในกรอบแนวตั้งและเว้นที่สำหรับข้อความมงคล' },
  pack: { label: 'บรรจุภัณฑ์', keyword: 'packaging design', size: [180, 240], direction: 'จัดวางบนหน้าหลักโดยเผื่อพื้นที่สำหรับชื่อสินค้าและรายละเอียด' },
  poster: { label: 'โปสเตอร์', keyword: 'poster design', size: [297, 420], direction: 'กำหนดจุดเด่นหนึ่งจุดและเหลือพื้นที่ให้หัวเรื่องอ่านชัดจากระยะไกล' }
};

const moodMatrix = {
  fresh: { label: 'สดชื่น', keyword: 'fresh botanical', colors: ['#315E48','#AEC970','#E78763','#E5B847','#4D918B','#785E88','#416D9A','#A95056'] },
  calm: { label: 'สงบ เรียบง่าย', keyword: 'calm minimal', colors: ['#344955','#9CB3A6','#CEA88E','#8EA0CC','#A77D83','#C1A461','#55818D','#645D7C'] },
  bold: { label: 'สนุก มีพลัง', keyword: 'bold graphic', colors: ['#292858','#F06649','#F2BB3C','#7167E8','#24A596','#DE5492','#3881DC','#8AB955'] },
  lux: { label: 'หรู สุขุม', keyword: 'refined editorial', colors: ['#29243B','#BC9B59','#784255','#566D66','#8D7790','#C08069','#6B8397','#9E7767'] }
};

const directions = [
  { name: 'รูปทรงพระเอก', keyword: 'geometric flat illustration', order: [0,1,2,3,4,5,6,7], idea: 'ย่อธีมเป็นรูปทรงเด่นหนึ่งชิ้น ใช้พื้นที่ว่างสร้างจุดพักสายตา' },
  { name: 'จังหวะลวดลาย', keyword: 'seamless repeat pattern', order: [2,0,3,1,6,4,7,5], idea: 'แตกองค์ประกอบของธีมเป็นลายซ้ำ สลับขนาดและทิศทางให้เกิดจังหวะ' },
  { name: 'เส้นนำสายตา', keyword: 'contour line editorial illustration', order: [4,2,0,1,5,7,3,6], idea: 'วาดเส้นต่อเนื่องจากรายละเอียดของธีม แล้วใช้เส้นพาสายตาไปยังหัวเรื่อง' }
];

const themeRules = [
  { match: /ตรุษจีน|มงคล|อั่งเปา|lunar|chinese new year/i, subject: 'โคม กระดาษพับ และตราประทับ', keyword: 'lantern paper cut seal', motif: 'lantern' },
  { match: /ทะเล|คลื่น|ชายหาด|ocean|beach|wave/i, subject: 'แนวคลื่น ฟองน้ำ และเส้นขอบฟ้า', keyword: 'ocean waves horizon', motif: 'wave' },
  { match: /สวน|ดอกไม้|ใบไม้|ป่า|ธรรมชาติ|garden|flower|forest|botanical/i, subject: 'ใบไม้ กลีบดอก และกิ่งก้าน', keyword: 'leaves flowers stems', motif: 'leaf' },
  { match: /เมือง|อาคาร|ตึก|urban|city|architecture/i, subject: 'เงาอาคาร ช่องหน้าต่าง และแนวถนน', keyword: 'city skyline architecture', motif: 'city' }
];

function makeConcepts(brief) {
  const work = workTypes[brief.type];
  const mood = moodMatrix[brief.mood];
  const theme = themeRules.find(rule => rule.match.test(brief.theme));
  return directions.map((direction, index) => ({
    index,
    theme: brief.theme,
    subject: theme?.keyword,
    style: direction.keyword,
    mood: mood.keyword,
    format: work.keyword,
    name: direction.name + ' · ' + brief.theme,
    description: direction.idea + (theme ? ' ลองใช้ ' + theme.subject : '') + ' ให้ภาพรู้สึก' + mood.label + ' ' + work.direction,
    motif: theme?.motif,
    keyword: [brief.theme, theme?.keyword || '', work.keyword, mood.keyword, direction.keyword].filter(Boolean).join(' '),
    colors: direction.order.slice(0, Number(brief.inks)).map(color => mood.colors[color])
  }));
}

function toCmyk(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  const peak = Math.max(r, g, b);
  if (!peak) return [0, 0, 0, 100];
  return [1 - r / peak, 1 - g / peak, 1 - b / peak, 1 - peak].map(value => Math.round(value * 100));
}

function motif(concept) {
  const colors = concept.colors;
  const a = colors[0], b = colors[1] || a, c = colors[2] || b;
  if (concept.index === 0) {
    if (concept.motif === 'lantern') {
      return `<circle cx="150" cy="76" r="53" fill="${a}"/><ellipse cx="150" cy="76" rx="28" ry="53" fill="none" stroke="${b}" stroke-width="4"/><path d="M130 17h40M130 134h40m-20 0v16" stroke="${c}" stroke-width="6"/><circle cx="238" cy="48" r="21" fill="${b}"/>`;
    }
    if (concept.motif === 'wave') {
      return `<circle cx="211" cy="45" r="26" fill="${c}"/><path d="M20 139v-30C88 87 89 36 162 70c-27-4-46 33-12 43 38 11 70-15 130-8v34Z" fill="${a}"/><path d="M27 127c49-13 70-52 117-49" fill="none" stroke="${b}" stroke-width="5"/>`;
    }
    if (concept.motif === 'city') {
      return `<circle cx="210" cy="53" r="32" fill="${c}"/><path d="M36 135V87h42v48m12 0V28h64v107m9 0V65h61v70m10 0V96h29v39Z" fill="${a}"/><path d="M103 48h38m-38 21h38m-38 21h38m35-6h34m-34 18h34" stroke="${b}" stroke-width="4"/>`;
    }
    if (!concept.motif) {
      return `<circle cx="142" cy="78" r="58" fill="${a}"/><path d="M105 113 184 31l59 78Z" fill="${b}" opacity=".64"/><rect x="42" y="40" width="40" height="40" rx="7" fill="${c}"/><path d="M40 143h220" stroke="${a}" stroke-width="2"/>`;
    }
    return `<circle cx="155" cy="77" r="54" fill="${b}" opacity=".34"/><path d="M59 131Q79 22 164 21Q170 104 59 131Z" fill="${a}"/><path d="M89 134Q142 65 206 90Q178 140 89 134Z" fill="${c}" opacity=".74"/><circle cx="222" cy="36" r="14" fill="${a}"/><path d="M40 142H246" stroke="${a}" stroke-width="2"/>`;
  }
  if (concept.index === 1) {
    return Array.from({length: 24}, (_, i) => {
      const x = i % 6 * 49, y = Math.floor(i / 6) * 43;
      const color = colors[(i + Math.floor(i / 6)) % colors.length];
      return `<path d="M0 37V18a18 18 0 0 1 36 0v19z" transform="translate(${x + 6} ${y + 2}) rotate(${i % 2 * 180} 18 18)" fill="${color}" opacity="${i % 3 === 0 ? '.48' : '1'}"/>`;
    }).join('');
  }
  return Array.from({length: 8}, (_, i) => `<path d="M-8 ${75 + i * 12}C65 ${-37 + i * 13} 107 ${211 + i * 5} 169 ${89 + i * 8}S242 ${-4 + i * 11} 310 ${45 + i * 12}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="${i % 3 === 0 ? 5 : 2}"/>`).join('');
}

function moodboardSvg(concept) {
  return `<svg viewBox="0 0 300 160" aria-hidden="true"><path fill="#fff" d="M0 0h300v160H0z"/>${motif(concept)}</svg>`;
}
