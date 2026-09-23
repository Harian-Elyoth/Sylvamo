import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/**
 * Ouvre l'appareil photo ou la galerie et renvoie l'URI d'une copie
 * conservée dans le dossier de l'app, ou null si l'utilisateur annule.
 */
export async function pickPhoto(source: 'camera' | 'library', figureId: string): Promise<string | null> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error("L'accès à l'appareil photo a été refusé.");
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);
  if (result.canceled || !result.assets[0]) return null;

  const uri = result.assets[0].uri;
  if (Platform.OS === 'web') return uri;

  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const safeId = figureId.replace(/[^a-zA-Z0-9-]/g, '_');
  const dest = new File(dir, `${safeId}-${Date.now()}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

export function deletePhoto(uri: string | undefined) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Photo déjà supprimée ou hors du dossier de l'app : rien à faire.
  }
}
