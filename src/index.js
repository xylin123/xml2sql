
const parse = require('./parse');

const cache = {};
const DEFINED_FUNC = {};

// 简单防止注入
function escape(param) {
  if (typeof param === 'number') {
    return param;
  }
  if (typeof param === 'string') {
    return `'${param}'`;
  }
  throw new Error('参数的基本类型不是 number 或者 string，不能进行防注入处理！');
}

// 根据字符串生成对应function
function templer(str) {
  return new Function('escape',
    'var arr = []; arr.push("'
    + str.replace(/[\r\t\n]/g, ' ') // 在代码中去掉换行符
    .replace(/#{/g, '");arr.push(escape(this.') // 替换变量的开始部分
    .replace(/}/g, '));arr.push("') // 替换变量的结尾部分
    + '");return arr.join("");'
  );
}

function handleIf(node) {
  if (eval(node.test.replace(/\s+and\s+/g, ' && ').replace(/\s+or\s+/g, ' || ').replace(/@/g, 'DEFINED_FUNC.'))) {
    return node.content;
  }
  return '';
}

function handleText(node) {
  if (node.tag === 'where' || node.tag === 'set') {
    return `${node.tag} ${node.content}`;
  }
  return node.content;
}

// 根据map + vo 生成sql字符串
function formatStr(map) {
  return map.reduce((arr, node) => {
    let str = '';
    if (node.type === 'if') {
      str = handleIf.call(this, node);
    } else if (node.type === 'text') {
      str = handleText(node);
    }
    if (str) { arr.push(str); }
    return arr;
  }, []).join(' ').replace(/\s+/g, ' ').trim();
}

function getSQL(filePath, mapId, vo) {
  if (!cache[filePath]) {
    cache[filePath] = parse(filePath);
  }
  const maps = cache[filePath];
  const map = maps[mapId];
  const str = formatStr.call(vo, map);
  const sql = templer(str).call(vo, escape);

  return sql;
}

function definedFunc(name, func) {
  if (typeof name === 'string' && typeof func === 'function') {
    DEFINED_FUNC[name] = func;
  } else {
    throw new Error('参数格式／类型不对！arguments[0]应为string arguments[1]应为number');
  }
}


module.exports = { getSQL, definedFunc };
