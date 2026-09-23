import { baseCatalog, mergeCatalog } from '@/data/catalog';

test('catalog ids are unique and every figure belongs to a known set and collection', () => {
  const setIds = new Set(baseCatalog.sets.map((s) => s.id));
  const collectionIds = new Set(baseCatalog.collections.map((c) => c.id));
  expect(setIds.size).toBe(baseCatalog.sets.length);
  expect(new Set(baseCatalog.figures.map((f) => f.id)).size).toBe(baseCatalog.figures.length);
  for (const f of baseCatalog.figures) expect(setIds.has(f.setId)).toBe(true);
  for (const s of baseCatalog.sets) expect(collectionIds.has(s.collectionId)).toBe(true);
});

test('custom figures sharing a set name are grouped in one custom set', () => {
  const index = mergeCatalog(baseCatalog, [
    { id: 'custom-1', name: 'Père', setName: 'Famille Loup', collectionId: 'families', species: 'Loup' },
    { id: 'custom-2', name: 'Mère', setName: 'famille loup ', collectionId: 'families' },
  ]);
  const setId = index.figuresById.get('custom-1')!.setId;
  expect(index.figuresById.get('custom-2')!.setId).toBe(setId);
  expect(index.setsById.get(setId)).toMatchObject({ name: 'Famille Loup', custom: true });
  expect(index.figures).toHaveLength(baseCatalog.figures.length + 2);
});
