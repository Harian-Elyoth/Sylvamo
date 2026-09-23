import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox, HeartButton } from '@/components/checkbox';
import { FigureThumb } from '@/components/figure-thumb';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCatalog } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { useCollection } from '@/store/collection';
import type { Figure } from '@/types';

export const FigureRow = memo(function FigureRow({ figure, detail }: { figure: Figure; detail?: string }) {
  const theme = useTheme();
  const entry = useCollection((s) => s.entries[figure.id]);
  const toggleOwned = useCollection((s) => s.toggleOwned);
  const toggleWishlist = useCollection((s) => s.toggleWishlist);
  const set = useCatalog().setsById.get(figure.setId);

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Checkbox
        checked={!!entry?.owned}
        onPress={() => toggleOwned(figure.id)}
        label={`J'ai ${figure.name}`}
      />
      <Link href={{ pathname: '/figure/[id]', params: { id: figure.id } }} asChild>
        <Pressable style={styles.main}>
          <FigureThumb
            sources={[entry?.photoUri, figure.image, set?.image]}
            species={figure.species ?? set?.species}
          />
          <View style={styles.text}>
            <ThemedText numberOfLines={1}>{figure.name}</ThemedText>
            {detail || entry?.notes ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {detail ?? entry?.notes}
              </ThemedText>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <HeartButton
        checked={!!entry?.wishlist}
        onPress={() => toggleWishlist(figure.id)}
        label={`Souhaiter ${figure.name}`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 4 },
  text: { flex: 1 },
});
