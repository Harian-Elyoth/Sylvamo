import { Link } from 'expo-router';
import type { ReactElement } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { FigureRow } from '@/components/figure-row';
import { FigureThumb } from '@/components/figure-thumb';
import { Icon, Icons } from '@/components/icon';
import { Progress } from '@/components/progress';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Section } from '@/lib/filter';

type Props = {
  sections: Section[];
  header?: ReactElement;
  empty: string;
  /** Texte secondaire de chaque ligne (ex. nom du set quand on groupe par collection). */
  detail?: (figureId: string) => string | undefined;
};

export function FigureList({ sections, header, empty, detail }: Props) {
  const theme = useTheme();
  return (
    <SectionList
      sections={sections}
      keyExtractor={(f) => f.id}
      stickySectionHeadersEnabled
      keyboardShouldPersistTaps="handled"
      initialNumToRender={30}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          {empty}
        </ThemedText>
      }
      renderSectionHeader={({ section }) => {
        const content = (
          <View style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.headerTitle}>
              {section.thumb ? (
                <FigureThumb sources={[section.thumb.image]} species={section.thumb.species} size={40} />
              ) : null}
              <View style={styles.headerText}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {section.title}
                </ThemedText>
                {section.subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {section.subtitle}
                  </ThemedText>
                ) : null}
              </View>
              {section.href ? <Icon name={Icons.chevron} size={16} color={theme.textSecondary} /> : null}
            </View>
            <Progress owned={section.owned} total={section.total} />
          </View>
        );
        return section.href ? (
          <Link href={section.href} asChild>
            <Pressable>{content}</Pressable>
          </Link>
        ) : (
          content
        );
      }}
      renderItem={({ item }) => <FigureRow figure={item} detail={detail?.(item.id)} />}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 4 },
  headerText: { flex: 1 },
  empty: { textAlign: 'center', padding: Spacing.five },
});
