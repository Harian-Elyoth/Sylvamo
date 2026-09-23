import { useMemo } from 'react';

import catalogJson from '@/assets/catalog.json';
import { buildIndex, normalize, type CatalogIndex } from '@/lib/filter';
import { useCollection } from '@/store/collection';
import type { Catalog, CustomFigure, Figure, FigureSet } from '@/types';

export const baseCatalog = catalogJson as Catalog;

function customSetId(f: CustomFigure): string {
  return `custom--${f.collectionId}--${normalize(f.setName.trim()).replace(/[^a-z0-9]+/g, '-')}`;
}

/** Fusionne le catalogue embarqué et les figurines ajoutées par l'utilisateur. */
export function mergeCatalog(catalog: Catalog, custom: CustomFigure[]): CatalogIndex {
  if (!custom.length) return buildIndex(catalog.collections, catalog.sets, catalog.figures);
  const sets = new Map<string, FigureSet>();
  const figures: Figure[] = [];
  for (const f of custom) {
    const setId = customSetId(f);
    if (!sets.has(setId)) {
      sets.set(setId, {
        id: setId,
        name: f.setName.trim() || f.name,
        collectionId: f.collectionId,
        species: f.species,
        ref: f.ref,
        custom: true,
      });
    }
    figures.push({ id: f.id, setId, name: f.name, species: f.species, custom: true });
  }
  return buildIndex(catalog.collections, [...catalog.sets, ...sets.values()], [...catalog.figures, ...figures]);
}

export function useCatalog(): CatalogIndex {
  const custom = useCollection((s) => s.customFigures);
  return useMemo(() => mergeCatalog(baseCatalog, custom), [custom]);
}
