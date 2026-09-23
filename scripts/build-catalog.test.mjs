import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseMembers, parseWikiPage, slugify, validate } from './build-catalog.mjs';

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
    members: ['Frasier', 'Kathryn', 'Freya Chocolate'],
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
