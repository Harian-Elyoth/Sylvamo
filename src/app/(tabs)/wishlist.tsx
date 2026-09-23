import { useMemo } from 'react';

import { FigureList } from '@/components/figure-list';
import { ThemedView } from '@/components/themed-view';
import { useCatalog } from '@/data/catalog';
import { filterFigures, groupBySet } from '@/lib/filter';
import { useCollection } from '@/store/collection';

export default function WishlistScreen() {
  const index = useCatalog();
  const entries = useCollection((s) => s.entries);
  const sections = useMemo(
    () => groupBySet(index, filterFigures(index, entries, { status: 'wishlist' }), entries),
    [index, entries],
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FigureList sections={sections} empty="Ta liste de souhaits est vide. Touche le cœur ♡ d'une figurine pour l'ajouter." />
    </ThemedView>
  );
}
