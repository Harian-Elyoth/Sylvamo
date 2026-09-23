import assert from 'node:assert/strict';
import { test } from 'node:test';

import { extractPageImages, parseMembers, parseWikiPage, slugify, validate } from './build-catalog.mjs';

test('slugify builds stable ascii ids', () => {
  assert.equal(slugify('Famille Lapin Chocolat'), 'famille-lapin-chocolat');
  assert.equal(slugify("Cochon d'Inde & Écureuil"), 'cochon-d-inde-and-ecureuil');
});

test('parseWikiPage reads infobox fields and members', () => {
  const text = `{{Infobox family
| number = 5655 (UK)
| released = March 2019
| species = Rabbit
}}
Some intro.
== Members ==
* [[Frasier Chocolate|Frasier]] - father
* '''Kathryn''' (mother)
# [[Freya Chocolate]]
== Trivia ==
* Not a member`;
  assert.deepEqual(parseWikiPage('Chocolate Rabbit Family', text), {
    nameEn: 'Chocolate Rabbit Family',
    ref: '5655',
    year: 2019,
    species: 'Rabbit',
    members: [
      { name: 'Frasier', title: 'Frasier Chocolate' },
      { name: 'Kathryn', title: undefined },
      { name: 'Freya Chocolate', title: 'Freya Chocolate' },
    ],
  });
  assert.deepEqual(parseMembers('no section'), []);
});

test('validate reports duplicates and dangling references', () => {
  const errors = validate({
    collections: [{ id: 'families', name: 'Familles' }],
    sets: [
      { id: 'a', name: 'A', collectionId: 'families' },
      { id: 'a', name: 'A2', collectionId: 'nope' },
    ],
    figures: [
      { id: 'f', setId: 'a', name: 'F' },
      { id: 'f', setId: 'zzz', name: 'F' },
    ],
  });
  assert.equal(errors.length, 4);
});

test('extractPageImages maps requested titles to thumbnails through normalization and redirects', () => {
  const images = extractPageImages({
    query: {
      normalized: [{ from: 'chocolate Rabbit Family', to: 'Chocolate Rabbit Family' }],
      redirects: [{ from: 'Chocolate Rabbit Family', to: 'Chocolate Rabbit Family (UK)' }],
      pages: [
        { title: 'Chocolate Rabbit Family (UK)', thumbnail: { source: 'https://img/choco.png' } },
        { title: 'Hedgehog Family' },
      ],
    },
  });
  assert.equal(images.get('chocolate Rabbit Family'), 'https://img/choco.png');
  assert.equal(images.get('Chocolate Rabbit Family'), 'https://img/choco.png');
  assert.equal(images.has('Hedgehog Family'), false);
});
