export const getFannedCards = (main = [], extra = [], side = []) => {
  const combined = [...main, ...extra, ...side].filter(Boolean);
  const unique = Array.from(new Set(combined));
  
  while (unique.length < 3) {
    unique.push('back_high');
  }
  return unique.slice(0, 3);
};