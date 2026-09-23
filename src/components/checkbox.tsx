import { Pressable, StyleSheet } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  checked: boolean;
  onPress: () => void;
  label: string;
};

export function Checkbox({ checked, onPress, label }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[
        styles.box,
        { borderColor: checked ? theme.tint : theme.textSecondary },
        checked && { backgroundColor: theme.tint },
      ]}>
      {checked && <Icon name={Icons.check} size={16} color={theme.onTint} />}
    </Pressable>
  );
}

export function HeartButton({ checked, onPress, label }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.heart}>
      <Icon name={checked ? Icons.heart : Icons.heartOutline} size={22} color={checked ? theme.heart : theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
