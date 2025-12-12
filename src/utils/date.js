/**
 * 时间戳格式化
 * @param {number} timestamp 时间戳（秒/毫秒）
 * @param {string} format 格式，默认 YYYY-MM-DD HH:mm:ss
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!timestamp) return '-';
  // 统一转换为毫秒级
  const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(time);
  
  const fmtMap = {
    Y: date.getFullYear(),
    M: date.getMonth() + 1,
    D: date.getDate(),
    H: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds()
  };
  
  // 补零处理
  const pad = (num) => String(num).padStart(2, '0');
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (key) => {
    switch (key) {
      case 'YYYY': return fmtMap.Y;
      case 'MM': return pad(fmtMap.M);
      case 'DD': return pad(fmtMap.D);
      case 'HH': return pad(fmtMap.H);
      case 'mm': return pad(fmtMap.m);
      case 'ss': return pad(fmtMap.s);
      default: return key;
    }
  });
};