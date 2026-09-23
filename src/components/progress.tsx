import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Progress({ owned, total }: { owned: number; total: number }) {
  const theme = useTheme();
  const ratio = total ? owned / total : 0;
  return (
    <View style={styles.row}>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: theme.tint }]} />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {owned} / {total}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  label: { minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
