import { makeBackup, parseBackup, useCollection } from '@/store/collection';

const store = () => useCollection.getState();

beforeEach(() => store().reset());

test('owning a figure removes it from the wishlist', () => {
  store().toggleWishlist('a');
  expect(store().entries.a).toEqual({ wishlist: true });
  store().toggleOwned('a');
  expect(store().entries.a).toEqual({ owned: true, wishlist: false });
});

test('entries with nothing left are removed', () => {
  store().toggleOwned('a');
  store().toggleOwned('a');
  expect(store().entries).toEqual({});
  store().updateEntry('b', { notes: 'boîte abîmée' });
  store().updateEntry('b', { notes: undefined });
  expect(store().entries).toEqual({});
});

test('setOwnedMany checks and unchecks a whole set', () => {
  store().toggleWishlist('b');
  store().setOwnedMany(['a', 'b'], true);
  expect(store().entries).toEqual({ a: { owned: true, wishlist: false }, b: { owned: true, wishlist: false } });
  store().setOwnedMany(['a', 'b'], false);
  expect(store().entries).toEqual({});
});

test('custom figures can be added and removed with their entry', () => {
  const id = store().addCustomFigure({ name: 'Bébé', setName: 'Famille X', collectionId: 'families' });
  store().toggleOwned(id);
  expect(store().customFigures).toHaveLength(1);
  store().removeCustomFigure(id);
  expect(store().customFigures).toEqual([]);
  expect(store().entries).toEqual({});
});

test('backup round-trips and restores', () => {
  store().toggleOwned('a');
  store().addCustomFigure({ name: 'Bébé', setName: 'Famille X', collectionId: 'families' });
  const json = JSON.stringify(makeBackup(store()));
  store().reset();
  store().restore(parseBackup(json));
  expect(store().entries).toEqual({ a: { owned: true, wishlist: false } });
  expect(store().customFigures).toHaveLength(1);
});

test('parseBackup rejects invalid files', () => {
  expect(() => parseBackup('pas du json')).toThrow('JSON valide');
  expect(() => parseBackup('{"foo":1}')).toThrow('pas une sauvegarde');
  expect(() => parseBackup('{"app":"sylvamo","version":2,"entries":{},"customFigures":[]}')).toThrow('Version');
});
