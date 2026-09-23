import { buildIndex, filterFigures, groupByCollection, groupBySet, normalize } from '@/lib/filter';
import type { Collection, Entry, Figure, FigureSet } from '@/types';

const collections: Collection[] = [
  { id: 'families', name: 'Familles' },
  { id: 'babies', name: 'Bébés' },
];
const sets: FigureSet[] = [
  { id: 'chocolate', name: 'Famille Lapin Chocolat', nameEn: 'Chocolate Rabbit Family', collectionId: 'families', species: 'Lapin', ref: '5655' },
  { id: 'hedgehog', name: 'Famille Hérisson', collectionId: 'families', species: 'Hérisson' },
  { id: 'baby-cat', name: 'Bébé Chat', collectionId: 'babies', species: 'Chat' },
];
const figures: Figure[] = [
  { id: 'c1', setId: 'chocolate', name: 'Père' },
  { id: 'c2', setId: 'chocolate', name: 'Mère' },
  { id: 'h1', setId: 'hedgehog', name: 'Père' },
  { id: 'b1', setId: 'baby-cat', name: 'Bébé' },
];
const index = buildIndex(collections, sets, figures);
const entries: Record<string, Entry> = { c1: { owned: true }, h1: { wishlist: true } };
const ids = (fs: Figure[]) => fs.map((f) => f.id);

test('normalize removes accents and case', () => {
  expect(normalize('Hérisson Été')).toBe('herisson ete');
});

test('search matches set name, species, reference and English name without accents', () => {
  expect(ids(filterFigures(index, entries, { query: 'herisson' }))).toEqual(['h1']);
  expect(ids(filterFigures(index, entries, { query: '5655' }))).toEqual(['c1', 'c2']);
  expect(ids(filterFigures(index, entries, { query: 'chocolate mere' }))).toEqual(['c2']);
  expect(ids(filterFigures(index, entries, { query: 'chat' }))).toEqual(['b1']);
});

test('filters by status and collection', () => {
  expect(ids(filterFigures(index, entries, { status: 'owned' }))).toEqual(['c1']);
  expect(ids(filterFigures(index, entries, { status: 'missing' }))).toEqual(['c2', 'h1', 'b1']);
  expect(ids(filterFigures(index, entries, { status: 'wishlist' }))).toEqual(['h1']);
  expect(ids(filterFigures(index, entries, { collectionId: 'babies' }))).toEqual(['b1']);
});

test('groupBySet counts owned figures over the whole set, not just the filtered ones', () => {
  const sections = groupBySet(index, filterFigures(index, entries, { status: 'missing' }), entries);
  expect(sections.map((s) => [s.key, s.owned, s.total, s.data.length])).toEqual([
    ['chocolate', 1, 2, 1],
    ['hedgehog', 0, 1, 1],
    ['baby-cat', 0, 1, 1],
  ]);
  expect(sections[0].subtitle).toBe('n° 5655 · Familles');
});

test('groupByCollection skips empty collections', () => {
  const sections = groupByCollection(index, filterFigures(index, entries, { status: 'owned' }), entries);
  expect(sections.map((s) => [s.key, s.owned, s.total])).toEqual([['families', 1, 3]]);
});
