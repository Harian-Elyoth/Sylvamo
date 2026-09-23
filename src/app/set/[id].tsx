import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { FigureRow } from '@/components/figure-row';
import { FigureThumb } from '@/components/figure-thumb';
import { Progress } from '@/components/progress';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCatalog } from '@/data/catalog';
import { countOwned } from '@/lib/filter';
import { useCollection } from '@/store/collection';

export default function SetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = useCatalog();
  const entries = useCollection((s) => s.entries);
  const setOwnedMany = useCollection((s) => s.setOwnedMany);
  const set = index.setsById.get(id);
  const figures = useMemo(() => index.figuresBySet.get(id) ?? [], [index, id]);

  if (!set) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText>Ce set n’existe pas dans le catalogue.</ThemedText>
      </ThemedView>
    );
  }

  const owned = countOwned(figures, entries);
  const complete = owned === figures.length;
  const meta = [
    index.collectionsById.get(set.collectionId)?.name,
    set.species,
    set.ref && `n° ${set.ref}`,
    set.year && String(set.year),
    set.nameEn && set.nameEn !== set.name && set.nameEn,
  ].filter(Boolean);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: set.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <FigureThumb sources={[set.image]} species={set.species} size={180} style={styles.image} />
          <ThemedText style={styles.title}>{set.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {meta.join(' · ')}
          </ThemedText>
          <Progress owned={owned} total={figures.length} />
          <Button
            label={complete ? 'Tout décocher' : 'J’ai tout le set'}
            variant={complete ? 'secondary' : 'primary'}
            onPress={() => setOwnedMany(figures.map((f) => f.id), !complete)}
          />
        </View>
        {figures.map((f) => (
          <FigureRow key={f.id} figure={f} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { padding: Spacing.three, gap: Spacing.two },
  image: { alignSelf: 'center', marginBottom: Spacing.two },
  title: { fontSize: 26, lineHeight: 32, fontWeight: 700 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
});
