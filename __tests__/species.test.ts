import { speciesEmoji, speciesHue } from '@/lib/species';

test('speciesEmoji matches French species names, most specific first', () => {
  expect(speciesEmoji('Lapin')).toBe('🐰');
  expect(speciesEmoji('Écureuil')).toBe('🐿️');
  expect(speciesEmoji('Panda roux')).toBe('🐼');
  expect(speciesEmoji("Cochon d'Inde")).toBe('🐹');
  expect(speciesEmoji('Cochon')).toBe('🐷');
  expect(speciesEmoji(undefined)).toBe('🐾');
});

test('speciesHue is stable and within range', () => {
  expect(speciesHue('Lapin')).toBe(speciesHue('lapin'));
  expect(speciesHue('Chat')).toBeGreaterThanOrEqual(0);
  expect(speciesHue('Chat')).toBeLessThan(360);
});
