import { useDeferredValue, useMemo, useState } from 'react';

import { FigureList } from '@/components/figure-list';
import { FilterBar } from '@/components/filter-bar';
import { ThemedView } from '@/components/themed-view';
import { useCatalog } from '@/data/catalog';
import { filterFigures, groupBySet } from '@/lib/filter';
import { useCollection } from '@/store/collection';
import type { StatusFilter } from '@/types';

export default function CatalogScreen() {
  const index = useCatalog();
  const entries = useCollection((s) => s.entries);
  const [query, setQuery] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const deferredQuery = useDeferredValue(query);

  const collections = useMemo(
    () => index.collections.filter((c) => index.sets.some((s) => s.collectionId === c.id)),
    [index],
  );
  const sections = useMemo(
    () => groupBySet(index, filterFigures(index, entries, { query: deferredQuery, collectionId, status }), entries),
    [index, entries, deferredQuery, collectionId, status],
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FilterBar
        query={query}
        onQuery={setQuery}
        collections={collections}
        collectionId={collectionId}
        onCollection={setCollectionId}
        status={status}
        onStatus={setStatus}
      />
      <FigureList sections={sections} empty="Aucune figurine ne correspond à ta recherche." />
    </ThemedView>
  );
}
