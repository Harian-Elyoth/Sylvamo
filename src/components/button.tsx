import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'secondary', disabled }: Props) {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.tint : theme.backgroundElement;
  const fg = variant === 'primary' ? theme.onTint : variant === 'danger' ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: theme.border, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}>
      <ThemedText type="smallBold" style={{ color: fg }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
});
