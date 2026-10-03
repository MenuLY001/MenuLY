export const fmt = (p: number) => `₹${p}`;

export function getCatEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/breakfast|morning/.test(n)) return '🥐';
  if (/starter|appetizer|snack/.test(n)) return '🥗';
  if (/main|lunch|entree|course/.test(n)) return '🍽️';
  if (/dessert|sweet|cake|pastry/.test(n)) return '🍰';
  if (/drink|beverage|juice|mocktail|coffee|tea/.test(n)) return '🥤';
  if (/pizza/.test(n)) return '🍕';
  if (/burger|sandwich|wrap/.test(n)) return '🍔';
  if (/pasta|noodle/.test(n)) return '🍝';
  if (/seafood|fish|prawn|shrimp/.test(n)) return '🦐';
  if (/chicken|poultry/.test(n)) return '🍗';
  if (/soup|broth|stew/.test(n)) return '🍜';
  if (/rice|biryani|pulao/.test(n)) return '🍚';
  if (/bread|roti|naan|paratha/.test(n)) return '🫓';
  if (/veg|paneer|dal/.test(n)) return '🥦';
  if (/non.?veg|meat|mutton|lamb/.test(n)) return '🍖';
  return '🍴';
}
