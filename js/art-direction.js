const artThemes = [
  [/ยุค\s*(?:90|๙๐)|\b90[’']?s\b|nineties/i, {
    en:'90s retro', graphics:['วางป้ายราคาทรงระเบิดกับเส้นซิกแซ็กเป็นจุดนำ ก่อนจัดตารางวันที่บนพื้นเรียบ','ทำแพตเทิร์นสติกเกอร์ คลื่น และลายตารางหมากรุก โดยเว้นช่องข้อมูลให้โล่ง','ใช้กรอบหน้าต่างคอมพิวเตอร์ยุค 90 และแถบสีแยกหมวดข้อมูล'],
    type:['หัวเรื่อง Sans ทรงหนาและแคบ คู่กับเลขแบบ tabular','หัวเรื่อง Rounded Sans คู่กับฟอนต์ไทยมีหัวที่อ่านง่าย','ใช้ Mono กับตัวเลข คู่กับ Sans ไทยสำหรับข้อความยาว'],
    print:['เคลือบ Spot UV เฉพาะป้ายหลักบนพื้นด้าน','ลองพิมพ์สีพิเศษนีออนหนึ่งสีสำหรับสติกเกอร์หลัก','ใช้กระดาษไม่เคลือบผิวสีขาวและเก็บขอบสีให้คม']
  }],
  [/ทะเล|คลื่น|ชายหาด|ocean|beach|wave/i, {
    en:'coastal ocean waves', graphics:['วางเส้นขอบฟ้าต่ำและใช้รูปคลื่นหลักกวาดเข้าสู่หัวเรื่อง','ใช้ลายเปลือกหอยสลับฟองคลื่นเป็นขอบกรอบ','วาดเส้นชั้นคลื่นแบบแผนที่น้ำขึ้นลง พร้อมเว้นช่องวันที่'],
    type:['ใช้ Sans ทรงกว้างกับหัวเรื่อง','จับคู่ Serif ทรงอ่อนกับ Sans สำหรับรายละเอียด','ใช้ Sans น้ำหนักกลางและเลขแบบ tabular'],
    print:['ใช้ Spot UV เฉพาะยอดคลื่น','ลองกระดาษไม่เคลือบผิวโทนอุ่นคล้ายทราย','ลองปั๊มฟอยล์เงินบนเส้นขอบฟ้าเส้นหลัก']
  }],
  [/ตรุษจีน|อั่งเปา|มงคล|lunar|chinese new year/i, {
    en:'Lunar New Year paper-cut', graphics:['จัดโคมและตราประทับให้อยู่บนแกนกลาง','ทำกรอบลายเมฆจากรูปกระดาษตัดและเว้นพื้นที่กลางหน้า','ใช้เส้นพับกระดาษสร้างกรอบรอบคำอวยพร'],
    type:['ใช้หัวเรื่องน้ำหนักหนาและให้ข้อความรองมีช่องไฟกว้าง','เลือก Serif ไทยมีหัวคู่กับ Sans ตัวเล็ก','ใช้ Sans น้ำหนักกลางเพื่อรับกับเส้นตกแต่ง'],
    print:['ปั๊มฟอยล์ทองเฉพาะตราประทับ','ลองปั๊มนูนลายเมฆจุดเดียว','ลองกระดาษแดงย้อมเนื้อและทดสอบสีทึบก่อนผลิต']
  }],
  [/สวน|ดอกไม้|ใบไม้|ป่า|ธรรมชาติ|garden|flower|forest|botanical/i, {
    en:'botanical garden', graphics:['ใช้ช่อใบไม้ตัดขอบด้านเดียวและเว้นพื้นที่หายใจให้หัวเรื่อง','จัดกลีบและเมล็ดเป็นลายซ้ำที่เปลี่ยนขนาดตามขอบ','ใช้เส้นใบพาดจากภาพเข้าสู่พื้นที่ข้อมูล'],
    type:['ใช้ Serif ไทยมีหัวสำหรับชื่อและ Sans สำหรับตัวเลข','ใช้ Sans ทรงมนคู่กับตัวเลขน้ำหนักกลาง','ใช้ฟอนต์ไทยแบบมีหัวและเพิ่มช่องไฟเล็กน้อย'],
    print:['ลองกระดาษไม่เคลือบผิวสีงาช้าง','ปั๊มนูนเฉพาะกลีบเด่นโดยคุมรายละเอียดให้หยาบพอ','ใช้ Spot UV แต้มเฉพาะเส้นใบหลัก']
  }],
  [/เมือง|ตึก|อาคาร|urban|city|architecture/i, {
    en:'urban architecture', graphics:['ใช้เส้นขอบฟ้าอาคารเป็นซิลูเอตต์และวางหัวเรื่องชิดแนวกริด','จัดโมดูลหน้าต่างเป็นแพตเทิร์นรอบขอบหน้า','ใช้เส้นผังถนนแบ่งโซนภาพและข้อมูล'],
    type:['ใช้ Sans ทรงแคบเน้นหัวเรื่องแนวตั้ง','ใช้ Grotesk น้ำหนักกลางกับคำกำกับ','ใช้ฟอนต์ Mono กับตัวเลขและ Sans ไทยกับเนื้อหา'],
    print:['เคลือบด้านและแต้ม Spot UV เฉพาะหน้าต่าง','ใช้กระดาษผิวด้านเนื้อแน่นเพื่อเก็บขอบเส้น','ลองฟอยล์เงินเส้นหนาที่จุดตัดหลัก']
  }]
];

const printStyles = [
  'editorial hero composition, strong asymmetric hierarchy, one large focal illustration',
  'playful repeat pattern, modular color blocks, generous clear content zone',
  'line-led Swiss editorial composition, visual rhythm, fine contour accents and structured white space'
];

function printDirection(brief, index) {
  const theme = artThemes.find(([pattern]) => pattern.test(brief.theme))?.[1];
  const anchors = [
    ['เลือกภาพแทนธีม “' + brief.theme + '” เพียงชิ้นเดียว วางเยื้องแกนและให้พื้นที่ข้อมูลอยู่ฝั่งตรงข้าม','ใช้หัวเรื่อง Sans หนา คู่กับตัวเลขแบบ tabular','ลอง Spot UV เฉพาะจุดเด่นบนผิวเคลือบด้าน'],
    ['แตกธีม “' + brief.theme + '” เป็นไอคอน 3 แบบ ใช้เป็นลายซ้ำเฉพาะขอบและปล่อยใจกลางให้โล่ง','เลือกฟอนต์ไทยมีหัวสำหรับข้อความและ Sans ทรงมนสำหรับหัวรอง','ลองใช้กระดาษผิวไม่เคลือบเพื่อให้แพตเทิร์นดูนุ่ม'],
    ['ดึงเส้นขอบจากสิ่งที่นึกถึงในธีม “' + brief.theme + '” และจัดเส้นตามกริดข้อมูล','ใช้ฟอนต์ Sans น้ำหนักกลางและเลขความกว้างคงที่','ลองปั๊มฟอยล์เฉพาะตราหรือชื่อหลัก โดยแยกเพลตและขยายเส้นให้ผ่านสเปกโรงพิมพ์']
  ];
  const format = workTypes[brief.type].keyword;
  const subject = theme?.en || brief.theme;
  const [graphics, type, print] = theme
    ? [theme.graphics[index], theme.type[index], theme.print[index]] : anchors[index];
  return {
    graphics, type, print, subject, style:printStyles[index],
    keyword: [subject, format, 'layout design print', ['editorial','repeat pattern','typography grid'][index]].join(' ')
  };
}

function conceptImageUrl(concept) {
  const prompt = [
    'Professional ' + concept.subject + ' ' + concept.format + ' layout design, print design mockup',
    concept.artDirection.style, concept.mood, 'flat vector illustration, solid colors ' + concept.colors.join(' '),
    'clean edges, no gradients, believable editorial grid, front-facing printed piece, no people, no watermark, no illegible text'
  ].join(', ');
  const url = new URL('https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt));
  url.search = new URLSearchParams({model:'flux',width:'768',height:'512',seed:String(101 + concept.index),nologo:'true'});
  return url.href;
}
