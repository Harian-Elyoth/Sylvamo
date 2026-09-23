import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FigureList } from '@/components/figure-list';
import { Progress } from '@/components/progress';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCatalog } from '@/data/catalog';
import { countOwned, filterFigures, groupByCollection } from '@/lib/filter';
import { useCollection } from '@/store/collection';

export default function CollectionScreen() {
  const index = useCatalog();
  const entries = useCollection((s) => s.entries);
  const owned = useMemo(() => filterFigures(index, entries, { status: 'owned' }), [index, entries]);
  const sections = useMemo(() => groupByCollection(index, owned, entries), [index, owned, entries]);
  const detail = (id: string) => {
    const f = index.figuresById.get(id);
    return f ? index.setsById.get(f.setId)?.name : undefined;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <FigureList
        sections={sections}
        detail={detail}
        empty="Tu n'as encore coché aucune figurine. Va dans le Catalogue pour commencer !"
        header={
          <View style={styles.summary}>
            <ThemedText type="smallBold">
              {owned.length} figurine{owned.length > 1 ? 's' : ''} dans ta collection
            </ThemedText>
            <Progress owned={countOwned(index.figures, entries)} total={index.figures.length} />
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  summary: { padding: Spacing.three, gap: Spacing.two },
});
