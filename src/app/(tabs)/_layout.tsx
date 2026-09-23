import { Link } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.tint, tabBarInactiveTintColor: theme.textSecondary }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color }) => <Icon name={Icons.catalog} color={color} />,
          headerRight: () => (
            <Link href="/add" asChild>
              <Pressable accessibilityLabel="Ajouter une figurine" hitSlop={10} style={{ paddingHorizontal: 16 }}>
                <Icon name={Icons.add} color={theme.tint} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Ma collection',
          tabBarIcon: ({ color }) => <Icon name={Icons.collection} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Souhaits',
          tabBarIcon: ({ color }) => <Icon name={Icons.heart} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color }) => <Icon name={Icons.settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
