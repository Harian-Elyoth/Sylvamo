import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { makeBackup, parseBackup, useCollection, type Backup } from '@/store/collection';

function fileName() {
  return `sylvamo-${new Date().toISOString().slice(0, 10)}.json`;
}

export async function exportBackup() {
  const json = JSON.stringify(makeBackup(useCollection.getState()), null, 2);

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Sauvegarde Sylvamo' });
}

/** Demande un fichier de sauvegarde et le lit ; null si l'utilisateur annule. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const { uri } = result.assets[0];
  const text = Platform.OS === 'web' ? await (await fetch(uri)).text() : await new File(uri).text();
  return parseBackup(text);
}
