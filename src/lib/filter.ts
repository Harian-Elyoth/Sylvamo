import type { Collection, Entry, Figure, FigureSet, StatusFilter } from '@/types';

export type CatalogIndex = {
  collections: Collection[];
  sets: FigureSet[];
  figures: Figure[];
  setsById: Map<string, FigureSet>;
  figuresById: Map<string, Figure>;
  figuresBySet: Map<string, Figure[]>;
  collectionsById: Map<string, Collection>;
};

export type Section = {
  key: string;
  title: string;
  subtitle?: string;
  href?: { pathname: '/set/[id]'; params: { id: string } };
  /** Set affiché en en-tête (regroupement par set). */
  set?: FigureSet;
  owned: number;
  total: number;
  data: Figure[];
};

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function buildIndex(collections: Collection[], sets: FigureSet[], figures: Figure[]): CatalogIndex {
  const figuresBySet = new Map<string, Figure[]>();
  for (const f of figures) {
    const list = figuresBySet.get(f.setId);
    if (list) list.push(f);
    else figuresBySet.set(f.setId, [f]);
  }
  return {
    collections,
    sets,
    figures,
    setsById: new Map(sets.map((s) => [s.id, s])),
    figuresById: new Map(figures.map((f) => [f.id, f])),
    figuresBySet,
    collectionsById: new Map(collections.map((c) => [c.id, c])),
  };
}

export function matchesStatus(entry: Entry | undefined, status: StatusFilter): boolean {
  switch (status) {
    case 'owned':
      return !!entry?.owned;
    case 'missing':
      return !entry?.owned;
    case 'wishlist':
      return !!entry?.wishlist;
    default:
      return true;
  }
}

export type FilterOptions = {
  query?: string;
  collectionId?: string | null;
  status?: StatusFilter;
};

export function filterFigures(
  index: CatalogIndex,
  entries: Record<string, Entry>,
  { query = '', collectionId = null, status = 'all' }: FilterOptions,
): Figure[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return index.figures.filter((f) => {
    const set = index.setsById.get(f.setId);
    if (!set) return false;
    if (collectionId && set.collectionId !== collectionId) return false;
    if (!matchesStatus(entries[f.id], status)) return false;
    if (!terms.length) return true;
    const haystack = normalize(
      [f.name, f.role, f.species, set.name, set.nameEn, set.species, set.ref].filter(Boolean).join(' '),
    );
    return terms.every((t) => haystack.includes(t));
  });
}

export function countOwned(figures: Figure[], entries: Record<string, Entry>): number {
  return figures.reduce((n, f) => n + (entries[f.id]?.owned ? 1 : 0), 0);
}

export function groupBySet(index: CatalogIndex, figures: Figure[], entries: Record<string, Entry>): Section[] {
  const groups = new Map<string, Figure[]>();
  for (const f of figures) {
    const list = groups.get(f.setId);
    if (list) list.push(f);
    else groups.set(f.setId, [f]);
  }
  return [...groups].map(([setId, data]) => {
    const set = index.setsById.get(setId)!;
    const all = index.figuresBySet.get(setId) ?? data;
    return {
      key: setId,
      title: set.name,
      subtitle: [set.ref && `n° ${set.ref}`, index.collectionsById.get(set.collectionId)?.name]
        .filter(Boolean)
        .join(' · '),
      href: { pathname: '/set/[id]', params: { id: setId } },
      set,
      owned: countOwned(all, entries),
      total: all.length,
      data,
    };
  });
}

export function groupByCollection(index: CatalogIndex, figures: Figure[], entries: Record<string, Entry>): Section[] {
  return index.collections.flatMap((c) => {
    const data = figures.filter((f) => index.setsById.get(f.setId)?.collectionId === c.id);
    if (!data.length) return [];
    const all = index.figures.filter((f) => index.setsById.get(f.setId)?.collectionId === c.id);
    return [{ key: c.id, title: c.name, owned: countOwned(all, entries), total: all.length, data }];
  });
}
