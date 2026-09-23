import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FigureThumb } from '@/components/figure-thumb';
import { Card, Field, Input } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCatalog } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { useSetImage } from '@/lib/wiki-images';
import { confirm, notify } from '@/lib/dialogs';
import { deletePhoto, pickPhoto } from '@/lib/photos';
import { useCollection } from '@/store/collection';
import { CONDITIONS, type Condition } from '@/types';

function parsePrice(text: string): number | undefined {
  const n = Number(text.replace(',', '.').replace(/[^\d.]/g, ''));
  return text.trim() && Number.isFinite(n) ? n : undefined;
}

export default function FigureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const index = useCatalog();
  const entry = useCollection((s) => s.entries[id]);
  const { toggleOwned, toggleWishlist, updateEntry, removeCustomFigure } = useCollection.getState();
  const [photoSize, setPhotoSize] = useState(0);
  const [price, setPrice] = useState(entry?.pricePaid?.toString().replace('.', ',') ?? '');

  const figure = index.figuresById.get(id);
  const setImage = useSetImage(figure && index.setsById.get(figure.setId));
  if (!figure) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText>Cette figurine n’existe plus dans le catalogue.</ThemedText>
      </ThemedView>
    );
  }
  const set = index.setsById.get(figure.setId);
  const collection = set && index.collectionsById.get(set.collectionId);

  async function choosePhoto(source: 'camera' | 'library') {
    try {
      const uri = await pickPhoto(source, id);
      if (!uri) return;
      deletePhoto(entry?.photoUri);
      updateEntry(id, { photoUri: uri });
    } catch (e) {
      notify('Photo', e instanceof Error ? e.message : String(e));
    }
  }

  async function removePhoto() {
    if (!(await confirm('Supprimer la photo ?', 'La photo sera effacée de l’app.', 'Supprimer'))) return;
    deletePhoto(entry?.photoUri);
    updateEntry(id, { photoUri: undefined });
  }

  async function removeFigure() {
    if (!(await confirm('Supprimer cette figurine ?', 'Elle sera retirée de ton catalogue.', 'Supprimer'))) return;
    deletePhoto(entry?.photoUri);
    removeCustomFigure(id);
    router.back();
  }

  const infos = [
    set?.species && ['Espèce', set.species],
    figure.species && figure.species !== set?.species && ['Espèce', figure.species],
    collection && ['Collection', collection.name],
    set?.ref && ['Référence', `n° ${set.ref}`],
    set?.year && ['Année', String(set.year)],
  ].filter((x): x is [string, string] => !!x);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: set?.name ?? figure.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <ThemedText style={styles.title}>{figure.name}</ThemedText>
          {set ? (
            <Link href={{ pathname: '/set/[id]', params: { id: set.id } }}>
              <ThemedText type="small" style={{ color: theme.tint }}>
                {set.name} ›
              </ThemedText>
            </Link>
          ) : null}
        </View>

        <Card>
          <View style={styles.switchRow}>
            <ThemedText>Je l’ai</ThemedText>
            <Switch
              value={!!entry?.owned}
              onValueChange={() => toggleOwned(id)}
              trackColor={{ true: theme.tint }}
            />
          </View>
          <View style={styles.switchRow}>
            <ThemedText>Dans ma liste de souhaits</ThemedText>
            <Switch
              value={!!entry?.wishlist}
              onValueChange={() => toggleWishlist(id)}
              trackColor={{ true: theme.heart }}
            />
          </View>
        </Card>

        <Card>
          <ThemedText type="smallBold">Photo</ThemedText>
          <View style={styles.photoBox} onLayout={(e) => setPhotoSize(e.nativeEvent.layout.width)}>
            {photoSize ? (
              <FigureThumb
                sources={[entry?.photoUri, figure.image, setImage]}
                species={figure.species ?? set?.species}
                size={photoSize}
              />
            ) : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {entry?.photoUri
              ? 'Ta photo'
              : figure.image || setImage
                ? 'Photo du catalogue — ajoute la tienne pour la remplacer'
                : 'Pas encore de photo dans le catalogue — ajoute la tienne !'}
          </ThemedText>
          <View style={styles.buttons}>
            <Button label="Prendre une photo" onPress={() => choosePhoto('camera')} />
            <Button label="Galerie" onPress={() => choosePhoto('library')} />
          </View>
          {entry?.photoUri ? <Button label="Supprimer la photo" variant="danger" onPress={removePhoto} /> : null}
        </Card>

        <Card>
          <Field label="État">
            <View style={styles.chips}>
              {(Object.entries(CONDITIONS) as [Condition, string][]).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={entry?.condition === value}
                  onPress={() => updateEntry(id, { condition: entry?.condition === value ? undefined : value })}
                />
              ))}
            </View>
          </Field>
          <Field label="Prix payé (€)">
            <Input
              value={price}
              onChangeText={(t) => {
                setPrice(t);
                updateEntry(id, { pricePaid: parsePrice(t) });
              }}
              keyboardType="decimal-pad"
              placeholder="ex. 24,90"
            />
          </Field>
          <Field label="Date d’achat">
            <Input
              value={entry?.acquiredAt ?? ''}
              onChangeText={(t) => updateEntry(id, { acquiredAt: t || undefined })}
              placeholder="ex. Noël 2025 ou 2025-12-25"
            />
          </Field>
          <Field label="Notes">
            <Input
              value={entry?.notes ?? ''}
              onChangeText={(t) => updateEntry(id, { notes: t || undefined })}
              placeholder="Où je l’ai trouvée, accessoires manquants…"
              multiline
            />
          </Field>
        </Card>

        {infos.length ? (
          <Card>
            {infos.map(([label, value]) => (
              <View key={label + value} style={styles.infoRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {label}
                </ThemedText>
                <ThemedText type="small">{value}</ThemedText>
              </View>
            ))}
          </Card>
        ) : null}

        {figure.custom ? <Button label="Supprimer cette figurine" variant="danger" onPress={removeFigure} /> : null}
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
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  title: { fontSize: 26, lineHeight: 32, fontWeight: 700 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoBox: { width: '100%', aspectRatio: 1 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
});
