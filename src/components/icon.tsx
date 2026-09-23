import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export type IconName = SymbolViewProps['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}

export const Icons = {
  catalog: { ios: 'books.vertical', android: 'menu_book', web: 'menu_book' },
  collection: { ios: 'checkmark.seal', android: 'verified', web: 'verified' },
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  heartOutline: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  photo: { ios: 'photo', android: 'photo', web: 'photo' },
} satisfies Record<string, IconName>;
