import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox, HeartButton } from '@/components/checkbox';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCollection } from '@/store/collection';
import type { Figure } from '@/types';

export const FigureRow = memo(function FigureRow({ figure, detail }: { figure: Figure; detail?: string }) {
  const theme = useTheme();
  const entry = useCollection((s) => s.entries[figure.id]);
  const toggleOwned = useCollection((s) => s.toggleOwned);
  const toggleWishlist = useCollection((s) => s.toggleWishlist);

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Checkbox
        checked={!!entry?.owned}
        onPress={() => toggleOwned(figure.id)}
        label={`J'ai ${figure.name}`}
      />
      <Link href={{ pathname: '/figure/[id]', params: { id: figure.id } }} asChild>
        <Pressable style={styles.main}>
          {entry?.photoUri ? <Image source={{ uri: entry.photoUri }} style={styles.thumb} /> : null}
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
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 36 },
  thumb: { width: 36, height: 36, borderRadius: 6 },
  text: { flex: 1 },
});
