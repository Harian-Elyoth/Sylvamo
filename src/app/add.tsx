import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field, Input } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { baseCatalog } from '@/data/catalog';
import { useCollection } from '@/store/collection';

export default function AddScreen() {
  const addCustomFigure = useCollection((s) => s.addCustomFigure);
  const [name, setName] = useState('');
  const [setName_, setSetName] = useState('');
  const [species, setSpecies] = useState('');
  const [ref, setRef] = useState('');
  const [collectionId, setCollectionId] = useState('families');

  function save() {
    const id = addCustomFigure({
      name: name.trim(),
      setName: setName_.trim() || name.trim(),
      collectionId,
      species: species.trim() || undefined,
      ref: ref.trim() || undefined,
    });
    router.replace({ pathname: '/figure/[id]', params: { id } });
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary">
          Il manque une figurine dans le catalogue ? Ajoute-la ici, elle apparaîtra avec les autres.
        </ThemedText>
        <Field label="Nom de la figurine *">
          <Input value={name} onChangeText={setName} placeholder="ex. Bébé Lapin Chocolat" autoFocus />
        </Field>
        <Field label="Set / famille">
          <Input value={setName_} onChangeText={setSetName} placeholder="ex. Famille Lapin Chocolat" />
        </Field>
        <Field label="Espèce">
          <Input value={species} onChangeText={setSpecies} placeholder="ex. Lapin" />
        </Field>
        <Field label="N° de référence">
          <Input value={ref} onChangeText={setRef} placeholder="ex. 5655" keyboardType="number-pad" />
        </Field>
        <Field label="Collection">
          <View style={styles.chips}>
            {baseCatalog.collections.map((c) => (
              <Chip key={c.id} label={c.name} selected={collectionId === c.id} onPress={() => setCollectionId(c.id)} />
            ))}
          </View>
        </Field>
        <Button label="Ajouter" variant="primary" onPress={save} disabled={!name.trim()} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
