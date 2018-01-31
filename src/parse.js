const fs = require('fs');
const et = require('elementtree');

// 判断是否是空字符串
function isNotEmptyString(s) {
  return !/^\s*$/.test(s);
}

// 解析
function analyze(map) {
  let id = '';
  const arr = [];
  function loop(el) {
    if (el.tag === 'map' || el.tag === 'set' || el.tag === 'where') {
      if (el.attrib.id && el.tag === 'map') { id = el.attrib.id; }
      if (isNotEmptyString(el.text)) { arr.push({ type: 'text', tag: el.tag, content: el.text }); }
      el.getchildren().forEach(element => loop(element));
      if (isNotEmptyString(el.tail)) { arr.push({ type: 'text', content: el.tail }); }
    } else if (el.tag === 'if' && el.attrib.test) {
      if (isNotEmptyString(el.text)) { arr.push({ type: 'if', content: el.text, test: el.attrib.test }); }
      el.getchildren().forEach(element => loop(element));
      if (isNotEmptyString(el.tail)) { arr.push({ type: 'text', content: el.tail }); }
    }
  }
  loop(map);
  return { id, arr };
}

// xml文件转化
function parse(filePath) {
  const maps = {};
  const xml = fs.readFileSync(filePath, 'utf-8');
  const root = et.parse(xml).getroot();

  root.iter('map', (map) => {
    const res = analyze(map);
    maps[res.id] = res.arr;
  });

  return maps;
}

module.exports = parse;
