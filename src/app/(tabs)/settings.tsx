import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { baseCatalog, useCatalog } from '@/data/catalog';
import { exportBackup, pickBackup } from '@/lib/backup';
import { confirm, notify } from '@/lib/dialogs';
import { useCollection } from '@/store/collection';

export default function SettingsScreen() {
  const index = useCatalog();
  const entries = useCollection((s) => s.entries);
  const custom = useCollection((s) => s.customFigures);
  const values = Object.values(entries);
  const owned = values.filter((e) => e.owned).length;
  const wished = values.filter((e) => e.wishlist).length;
  const spent = values.reduce((sum, e) => sum + (e.owned && e.pricePaid ? e.pricePaid : 0), 0);

  async function runExport() {
    try {
      await exportBackup();
    } catch (e) {
      notify('Export impossible', e instanceof Error ? e.message : String(e));
    }
  }

  async function runImport() {
    try {
      const backup = await pickBackup();
      if (!backup) return;
      const ok = await confirm(
        'Remplacer ta collection ?',
        `La sauvegarde du ${backup.exportedAt.slice(0, 10)} remplacera toutes tes données actuelles.`,
        'Remplacer',
      );
      if (!ok) return;
      useCollection.getState().restore(backup);
      notify('Sauvegarde restaurée');
    } catch (e) {
      notify('Import impossible', e instanceof Error ? e.message : String(e));
    }
  }

  async function runReset() {
    const ok = await confirm(
      'Tout effacer ?',
      'Toutes tes cases cochées, souhaits, notes et figurines ajoutées seront supprimés. Pense à exporter une sauvegarde avant.',
      'Tout effacer',
    );
    if (ok) useCollection.getState().reset();
  }

  const stats: [string, string][] = [
    ['Figurines possédées', `${owned} / ${index.figures.length}`],
    ['Dans ma liste de souhaits', String(wished)],
    ['Figurines ajoutées à la main', String(custom.length)],
    ['Total dépensé', `${spent.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`],
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          {stats.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                {label}
              </ThemedText>
              <ThemedText type="smallBold">{value}</ThemedText>
            </View>
          ))}
        </Card>

        <Card>
          <ThemedText type="smallBold">Sauvegarde</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ta collection est enregistrée uniquement sur ce téléphone. Exporte-la régulièrement pour ne rien perdre
            ou pour la transférer sur un autre appareil. Les photos ne sont pas incluses dans le fichier.
          </ThemedText>
          <View style={styles.buttons}>
            <Button label="Exporter" variant="primary" onPress={runExport} />
            <Button label="Importer" onPress={runImport} />
          </View>
        </Card>

        <Card>
          <ThemedText type="smallBold">À propos du catalogue</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {baseCatalog.sets.length} sets et {baseCatalog.figures.length} figurines, mis à jour le{' '}
            {baseCatalog.generatedAt.slice(0, 10)}.
          </ThemedText>
          {baseCatalog.sources.map((s) => (
            <ThemedText key={s} type="small" themeColor="textSecondary">
              • {s}
            </ThemedText>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Sylvamo est une application de fan, sans lien avec Epoch Co., Ltd. Sylvanian Families et Calico Critters
            sont des marques de leurs propriétaires respectifs.
          </ThemedText>
        </Card>

        <Button label="Tout effacer" variant="danger" onPress={runReset} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  buttons: { flexDirection: 'row', gap: Spacing.two },
});
