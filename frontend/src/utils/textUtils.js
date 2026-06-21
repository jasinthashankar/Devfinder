export function isReadable(text) {
  if (!text) return true;
  const nonLatin = (text.match(/[^\u0000-\u024F\s]/g) || []).length;
  return nonLatin / text.length < 0.3;
}

export function cleanText(text, fallback = "") {
  return isReadable(text) ? text : fallback;
}
