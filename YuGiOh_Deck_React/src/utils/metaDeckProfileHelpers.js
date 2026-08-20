export const getAttributeColor = (attribute) => {
  if (!attribute) return 'secondary';
  switch (attribute.toUpperCase()) {
    case 'LIGHT': return 'warning';
    case 'DARK': return 'dark';
    case 'FIRE': return 'danger';
    case 'WATER': return 'primary';
    case 'WIND': return 'success';
    case 'EARTH': return 'secondary';
    case 'DIVINE': return 'warning';
    default: return 'info';
  }
};