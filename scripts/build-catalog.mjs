#!/usr/bin/env node
/**
 * Génère assets/catalog.json à partir de data/seed.json et, avec --wiki,
 * des pages du Sylvanian Families Wiki (Fandom, CC BY-SA).
 *
 *   node scripts/build-catalog.mjs
 *   node scripts/build-catalog.mjs --wiki
 *   node scripts/build-catalog.mjs --wiki --category="Baby Collection:babies"
 *
 * Les identifiants sont dérivés du nom anglais du set et du nom de la figurine :
 * ils doivent rester stables, car la collection de l'utilisateur est indexée dessus.
 * Un set déjà présent n'est donc qu'enrichi (référence, année), jamais remplacé.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIKI_API = 'https://sylvanianfamilies.fandom.com/api.php';
const WIKI_SOURCE = 'Sylvanian Families Wiki (sylvanianfamilies.fandom.com) — CC BY-SA 3.0';
const DEFAULT_CATEGORIES = [['Families', 'families']];

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function figuresFor(setId, names, species) {
  const seen = new Set();
  return names.flatMap((name) => {
    let id = `${setId}--${slugify(name)}`;
    for (let n = 2; seen.has(id); n++) id = `${setId}--${slugify(name)}-${n}`;
    seen.add(id);
    return [{ id, setId, name, species }];
  });
}

function fromSeed(seed) {
  const sets = [];
  const figures = [];
  for (const s of seed.sets) {
    const id = slugify(s.nameEn ?? s.name);
    sets.push({
      id,
      ref: s.ref,
      name: s.name,
      nameEn: s.nameEn,
      collectionId: s.collection,
      species: s.species,
      year: s.year,
    });
    figures.push(...figuresFor(id, s.figures ?? [], s.species));
  }
  return { collections: seed.collections, sets, figures };
}

async function wikiQuery(params) {
  const url = `${WIKI_API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Sylvamo catalog builder' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function categoryMembers(category) {
  const titles = [];
  let cont = {};
  do {
    const data = await wikiQuery({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmnamespace: '0',
      cmlimit: '500',
      ...cont,
    });
    titles.push(...data.query.categorymembers.map((m) => m.title));
    cont = data.continue ?? null;
  } while (cont);
  return titles;
}

async function pageWikitext(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const data = await wikiQuery({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: titles.slice(i, i + 50).join('|'),
    });
    for (const page of data.query.pages) {
      const text = page.revisions?.[0]?.slots?.main?.content;
      if (text) out.set(page.title, text);
    }
  }
  return out;
}

function infoboxField(text, names) {
  for (const name of names) {
    const m = text.match(new RegExp(`^\\s*\\|\\s*${name}\\s*=\\s*(.+)$`, 'im'));
    if (m) return stripMarkup(m[1]);
  }
  return undefined;
}

function stripMarkup(value) {
  return value
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/'{2,}/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .trim();
}

/** Figurines listées sous une section « Members » / « Characters » de la page. */
export function parseMembers(text) {
  const section = text.match(/==+\s*(?:Family )?(?:Members|Characters|Figures)\s*==+([\s\S]*?)(?:\n==[^=]|$)/i);
  if (!section) return [];
  return section[1]
    .split('\n')
    .filter((line) => /^\s*[*#]/.test(line))
    .map((line) => stripMarkup(line.replace(/^\s*[*#]+/, '')).split(/\s[-–(]/)[0].trim())
    .filter(Boolean);
}

export function parseWikiPage(title, text) {
  const ref = infoboxField(text, ['number', 'set number', 'item number', 'code'])?.match(/\d{3,5}/)?.[0];
  const year = Number(infoboxField(text, ['released', 'release', 'year'])?.match(/(19|20)\d{2}/)?.[0]);
  return {
    nameEn: title,
    ref,
    year: Number.isFinite(year) ? year : undefined,
    species: infoboxField(text, ['species', 'animal']),
    members: parseMembers(text),
  };
}

async function fromWiki(categories, catalog) {
  const setsById = new Map(catalog.sets.map((s) => [s.id, s]));
  for (const [category, collectionId] of categories) {
    const titles = await categoryMembers(category);
    const pages = await pageWikitext(titles);
    console.log(`Wiki: ${category} → ${pages.size} pages`);
    for (const [title, text] of pages) {
      const info = parseWikiPage(title, text);
      const id = slugify(title);
      const existing = setsById.get(id);
      if (existing) {
        existing.ref ??= info.ref;
        existing.year ??= info.year;
        continue;
      }
      const set = { id, ref: info.ref, name: title, nameEn: title, collectionId, species: info.species, year: info.year };
      catalog.sets.push(set);
      setsById.set(id, set);
      const names = info.members.length ? info.members : [title];
      catalog.figures.push(...figuresFor(id, names, info.species));
    }
  }
  catalog.sources.push(WIKI_SOURCE);
}

export function validate(catalog) {
  const errors = [];
  const setIds = new Set();
  for (const s of catalog.sets) {
    if (setIds.has(s.id)) errors.push(`Set en double : ${s.id}`);
    setIds.add(s.id);
  }
  const collectionIds = new Set(catalog.collections.map((c) => c.id));
  for (const s of catalog.sets) {
    if (!collectionIds.has(s.collectionId)) errors.push(`Collection inconnue pour ${s.id} : ${s.collectionId}`);
  }
  const figureIds = new Set();
  for (const f of catalog.figures) {
    if (figureIds.has(f.id)) errors.push(`Figurine en double : ${f.id}`);
    figureIds.add(f.id);
    if (!setIds.has(f.setId)) errors.push(`Set inconnu pour ${f.id} : ${f.setId}`);
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const seed = JSON.parse(readFileSync(join(root, 'data/seed.json'), 'utf8'));
  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sources: ['Catalogue de départ Sylvamo (data/seed.json)'],
    ...fromSeed(seed),
  };

  if (args.includes('--wiki')) {
    const custom = args
      .filter((a) => a.startsWith('--category='))
      .map((a) => a.slice('--category='.length).split(':'));
    await fromWiki(custom.length ? custom : DEFAULT_CATEGORIES, catalog);
  }

  const errors = validate(catalog);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  writeFileSync(join(root, 'assets/catalog.json'), JSON.stringify(catalog, null, 1) + '\n');
  console.log(`Catalogue : ${catalog.collections.length} collections, ${catalog.sets.length} sets, ${catalog.figures.length} figurines`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
