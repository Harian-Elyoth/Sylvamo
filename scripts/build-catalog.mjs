#!/usr/bin/env node
/**
 * Génère assets/catalog.json à partir de data/seed.json et, avec --wiki,
 * des pages du Sylvanian Families Wiki (Fandom, CC BY-SA).
 *
 *   node scripts/build-catalog.mjs
 *   node scripts/build-catalog.mjs --images   (photos du wiki pour les sets existants)
 *   node scripts/build-catalog.mjs --wiki     (nouveaux sets + photos)
 *   node scripts/build-catalog.mjs --wiki --category="Baby Collection:babies"
 *
 * Les identifiants sont dérivés du nom anglais du set et du nom de la figurine :
 * ils doivent rester stables, car la collection de l'utilisateur est indexée dessus.
 * Un set déjà présent n'est donc qu'enrichi (référence, année, photo), jamais remplacé.
 *
 * Les photos ne sont pas copiées dans l'app : on garde l'URL de la vignette du wiki,
 * chargée (puis mise en cache) par l'app à l'affichage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIKI_API = 'https://sylvanianfamilies.fandom.com/api.php';
const WIKI_SOURCE = 'Sylvanian Families Wiki (sylvanianfamilies.fandom.com) — CC BY-SA 3.0';
const DEFAULT_CATEGORIES = [['Families', 'families']];
const IMAGE_SIZE = 400;

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `members` : noms, ou objets { name, image } (photo propre à la figurine). */
function figuresFor(setId, members, species) {
  const seen = new Set();
  return members.map((member) => {
    const { name, image } = typeof member === 'string' ? { name: member } : member;
    let id = `${setId}--${slugify(name)}`;
    for (let n = 2; seen.has(id); n++) id = `${setId}--${slugify(name)}-${n}`;
    seen.add(id);
    return { id, setId, name, species, image };
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
      image: s.image,
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

/**
 * Figurines listées sous une section « Members » / « Characters » de la page,
 * avec le titre de leur propre page du wiki quand la ligne en contient un lien.
 */
export function parseMembers(text) {
  const section = text.match(/==+\s*(?:Family )?(?:Members|Characters|Figures)\s*==+([\s\S]*?)(?:\n==[^=]|$)/i);
  if (!section) return [];
  return section[1]
    .split('\n')
    .filter((line) => /^\s*[*#]/.test(line))
    .map((line) => ({
      name: stripMarkup(line.replace(/^\s*[*#]+/, '')).split(/\s[-–(]/)[0].trim(),
      title: line.match(/\[\[([^|\]]+)/)?.[1]?.trim(),
    }))
    .filter((m) => m.name);
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

/** Associe titre de page → URL de sa vignette, en suivant les redirections. */
export function extractPageImages(data) {
  const aliases = new Map();
  for (const r of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) aliases.set(r.from, r.to);
  const images = new Map();
  for (const page of data.query?.pages ?? []) {
    if (page.thumbnail?.source) images.set(page.title, page.thumbnail.source);
  }
  const resolve = (title) => {
    for (let i = 0; i < 5 && aliases.has(title); i++) title = aliases.get(title);
    return images.get(title);
  };
  const out = new Map();
  for (const title of new Set([...aliases.keys(), ...images.keys()])) {
    const url = resolve(title);
    if (url) out.set(title, url);
  }
  return out;
}

async function pageImages(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const data = await wikiQuery({
      action: 'query',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: String(IMAGE_SIZE),
      redirects: '1',
      titles: titles.slice(i, i + 50).join('|'),
    });
    for (const [title, url] of extractPageImages(data)) out.set(title, url);
  }
  return out;
}

/** Ajoute une photo aux sets et figurines qui n'en ont pas, d'après leur page du wiki. */
async function addWikiImages(catalog) {
  const setTitles = catalog.sets.filter((s) => !s.image && s.nameEn).map((s) => s.nameEn);
  const figureTitles = catalog.figures.filter((f) => !f.image && f.wikiTitle).map((f) => f.wikiTitle);
  const images = await pageImages([...new Set([...setTitles, ...figureTitles])]);
  let count = 0;
  for (const s of catalog.sets) {
    if (!s.image && s.nameEn && images.has(s.nameEn)) {
      s.image = images.get(s.nameEn);
      count++;
    }
  }
  for (const f of catalog.figures) {
    if (!f.image && f.wikiTitle && images.has(f.wikiTitle)) {
      f.image = images.get(f.wikiTitle);
      count++;
    }
    delete f.wikiTitle;
  }
  console.log(`Wiki: ${count} photos trouvées`);
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
      const members = info.members.length ? info.members : [{ name: title, title }];
      const figures = figuresFor(id, members.map((m) => m.name), info.species);
      figures.forEach((f, i) => (f.wikiTitle = members[i].title));
      catalog.figures.push(...figures);
    }
  }
  await addWikiImages(catalog);
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
  } else if (args.includes('--images')) {
    await addWikiImages(catalog);
    catalog.sources.push(WIKI_SOURCE);
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
