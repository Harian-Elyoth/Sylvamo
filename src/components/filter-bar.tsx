import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Icon, Icons } from '@/components/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Collection, StatusFilter } from '@/types';

const STATUSES: [StatusFilter, string][] = [
  ['all', 'Toutes'],
  ['owned', 'Je les ai'],
  ['missing', 'Manquantes'],
  ['wishlist', 'Souhaits'],
];

type Props = {
  query: string;
  onQuery: (q: string) => void;
  collections: Collection[];
  collectionId: string | null;
  onCollection: (id: string | null) => void;
  status?: StatusFilter;
  onStatus?: (s: StatusFilter) => void;
};

export function FilterBar({ query, onQuery, collections, collectionId, onCollection, status, onStatus }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Icon name={Icons.search} size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={onQuery}
          placeholder="Nom, espèce, n° de référence…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
      {status && onStatus ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {STATUSES.map(([value, label]) => (
            <Chip key={value} label={label} selected={status === value} onPress={() => onStatus(value)} />
          ))}
        </ScrollView>
      ) : null}
      {collections.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Toutes les collections" selected={collectionId === null} onPress={() => onCollection(null)} />
          {collections.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={collectionId === c.id}
              onPress={() => onCollection(collectionId === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.two, gap: Spacing.two },
  search: {
    marginHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three - 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: Spacing.two + 2, fontSize: 16 },
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two },
});
