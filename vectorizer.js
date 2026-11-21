'use strict';

const traceLimit = 384;

function pixelsFromImage(image) {
  const scale = Math.min(1, traceLimit / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function backgroundMask({data, width, height}, removeWhite) {
  const mask = new Uint8Array(width * height);
  const white = index => {
    const i = index * 4;
    return data[i] >= 244 && data[i + 1] >= 244 && data[i + 2] >= 244;
  };
  for (let i = 0; i < mask.length; i++) {
    if (data[i * 4 + 3] < 128) mask[i] = 1;
  }
  if (!removeWhite) return mask;

  const queue = [];
  function visit(index) {
    if (mask[index] === 2 || (!mask[index] && !white(index))) return;
    mask[index] = 2;
    queue.push(index);
  }
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  for (let i = 0; i < queue.length; i++) {
    const index = queue[i], x = index % width;
    if (x > 0) visit(index - 1);
    if (x + 1 < width) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index + width < mask.length) visit(index + width);
  }
  return mask;
}

function colorBuckets(pixels, mask, limit) {
  const bins = new Map();
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) continue;
    const pos = i * 4;
    const rgb = [pixels[pos], pixels[pos + 1], pixels[pos + 2]];
    const key = (rgb[0] >> 3) * 1024 + (rgb[1] >> 3) * 32 + (rgb[2] >> 3);
    let bin = bins.get(key);
    if (!bin) {
      bin = {key, count:0, sum:[0,0,0]};
      bins.set(key, bin);
    }
    bin.count++;
    rgb.forEach((value, channel) => { bin.sum[channel] += value; });
  }
  if (!bins.size) return {colors:[], labels:new Int16Array(mask.length).fill(-1)};

  function describe(group) {
    const min = [31,31,31], max = [0,0,0];
    let count = 0;
    for (const bin of group) {
      count += bin.count;
      const rgb = [bin.key >> 10, (bin.key >> 5) & 31, bin.key & 31];
      rgb.forEach((value, i) => {
        min[i] = Math.min(min[i], value);
        max[i] = Math.max(max[i], value);
      });
    }
    const range = max.map((value, i) => value - min[i]);
    const channel = range.indexOf(Math.max(...range));
    return {group, count, channel, score:range[channel] * Math.sqrt(count)};
  }

  const groups = [describe([...bins.values()])];
  while (groups.length < limit) {
    groups.sort((a, b) => b.score - a.score);
    const box = groups.shift();
    if (!box.score) {
      groups.unshift(box);
      break;
    }
    const shift = (2 - box.channel) * 5;
    const sorted = box.group.sort((a, b) => ((a.key >> shift) & 31) - ((b.key >> shift) & 31));
    let split = 0, count = 0;
    while (split < sorted.length - 1 && count < box.count / 2) count += sorted[split++].count;
    groups.push(describe(sorted.slice(0, split)), describe(sorted.slice(split)));
  }
  groups.sort((a, b) => b.count - a.count);
  const lookup = new Int16Array(32768);
  const colors = groups.map((box, index) => {
    const sums = [0,0,0];
    for (const bin of box.group) {
      lookup[bin.key] = index;
      bin.sum.forEach((value, channel) => { sums[channel] += value; });
    }
    return '#' + sums.map(value => Math.round(value / box.count).toString(16).padStart(2,'0')).join('').toUpperCase();
  });
  const labels = new Int16Array(mask.length).fill(-1);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) continue;
    const j = i * 4;
    const key = (pixels[j] >> 3) * 1024 + (pixels[j + 1] >> 3) * 32 + (pixels[j + 2] >> 3);
    labels[i] = lookup[key];
  }
  return {colors, labels};
}

function simplifyLine(points, tolerance) {
  if (!tolerance || points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0,points.length - 1]];
  while (stack.length) {
    const [first,last] = stack.pop();
    const [ax,ay] = points[first], [bx,by] = points[last];
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    let max = tolerance * tolerance, selected = -1;
    for (let i = first + 1; i < last; i++) {
      const [x,y] = points[i];
      const position = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
      const distance = (x - ax - dx * position) ** 2 + (y - ay - dy * position) ** 2;
      if (distance > max) {
        max = distance;
        selected = i;
      }
    }
    if (selected >= 0) {
      keep[selected] = 1;
      stack.push([first,selected], [selected,last]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function tracePaths(labels, width, height, colors, tolerance) {
  const stride = width + 1;
  const edges = colors.map(() => new Map());
  // Each edge keeps its color on the right. At a corner shared by two
  // regions of the same color, prefer the right turn to close each region.
  const shifts = [1,stride,-1,-stride];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x, color = labels[i];
      if (color < 0) continue;
      const v = y * stride + x, map = edges[color];
      if (!y || labels[i - width] !== color) map.set(v * 4, true);
      if (x === width - 1 || labels[i + 1] !== color) map.set((v + 1) * 4 + 1, true);
      if (y === height - 1 || labels[i + width] !== color) map.set((v + stride + 1) * 4 + 2, true);
      if (!x || labels[i - 1] !== color) map.set((v + stride) * 4 + 3, true);
    }
  }

  return edges.map((map, color) => {
    const paths = [];
    for (const first of map.keys()) {
      const points = [];
      let edge = first;
      while (map.has(edge)) {
        const vertex = Math.floor(edge / 4), direction = edge % 4;
        const next = vertex + shifts[direction];
        map.delete(edge);
        points.push([vertex % stride, Math.floor(vertex / stride)]);
        edge = [1,0,3,2].map(turn => next * 4 + (direction + turn) % 4)
          .find(candidate => candidate === first || map.has(candidate));
      }
      if (edge !== first || points.length < 4) continue;
      // Remove straight intermediate points even at zero smoothing.
      const corners = points.filter(([x,y], i) => {
        const a = points[(i + points.length - 1) % points.length];
        const b = points[(i + 1) % points.length];
        return !((a[0] === x && b[0] === x) || (a[1] === y && b[1] === y));
      });
      const middle = Math.floor(corners.length / 2);
      const simplified = simplifyLine(corners.slice(0,middle + 1), tolerance).slice(0,-1)
        .concat(simplifyLine(corners.slice(middle).concat([corners[0]]), tolerance).slice(0,-1));
      const outline = simplified.length >= 3 ? simplified : corners;
      paths.push('M' + outline.map(point => point.join(' ')).join('L') + 'Z');
    }
    return {color:colors[color], d:paths.join('')};
  }).filter(path => path.d);
}

function vectorize(image, settings) {
  const {width,height,data} = image;
  const mask = backgroundMask(image, settings.white);
  const {colors, labels} = colorBuckets(data, mask, settings.inks);
  const paths = tracePaths(labels, width, height, colors, settings.smooth * .18);
  return {width,height,colors,paths};
}

function vectorPathMarkup(vector) {
  return vector.paths.map(({color, d}) => `<path fill="${color}" fill-rule="evenodd" d="${d}"/>`).join('');
}

function vectorSvg(vector) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vector.width}" height="${vector.height}" viewBox="0 0 ${vector.width} ${vector.height}">${vectorPathMarkup(vector)}</svg>`;
}
