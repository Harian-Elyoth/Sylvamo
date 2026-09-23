import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, useColorScheme, View, type StyleProp, type ViewStyle } from 'react-native';

import { speciesEmoji, speciesHue } from '@/lib/species';

type Props = {
  /** Par ordre de priorité : photo perso, photo de la figurine, photo du set. */
  sources: (string | undefined)[];
  species?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function FigureThumb({ sources, species, size = 44, style }: Props) {
  const dark = useColorScheme() === 'dark';
  const [failed, setFailed] = useState<string[]>([]);
  const uri = sources.find((s) => s && !failed.includes(s));
  const radius = Math.round(size * 0.2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius }, style as object]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        onError={() => setFailed((f) => [...f, uri])}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const hue = speciesHue(species);
  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: dark ? `hsl(${hue}, 25%, 22%)` : `hsl(${hue}, 55%, 90%)`,
        },
        style,
      ]}>
      <Text style={{ fontSize: size * 0.5 }}>{speciesEmoji(species)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
