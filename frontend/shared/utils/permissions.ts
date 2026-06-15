import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import i18n from '../i18n';

const openSettingsAlert = (title: string, message: string) =>
  Alert.alert(title, message, [
    { text: i18n.t('action.cancel'), style: 'cancel' },
    { text: i18n.t('common.openSettings'), onPress: () => Linking.openSettings() },
  ]);

async function ensure(
  kind: 'media' | 'camera',
  get: () => Promise<ImagePicker.PermissionResponse>,
  req: () => Promise<ImagePicker.PermissionResponse>,
): Promise<boolean> {
  const label = kind === 'media' ? i18n.t('common.photoLibrary') : i18n.t('common.camera');
  const cur = await get();
  console.log(`[perm:${kind}] get →`, cur);
  if (cur.granted) return true;
  if (!cur.canAskAgain) {
    openSettingsAlert(i18n.t('perm.required'), i18n.t('perm.blocked', { label }));
    return false;
  }
  const r = await req();
  console.log(`[perm:${kind}] request →`, r);
  if (r.granted) return true;
  if (!r.canAskAgain) {
    openSettingsAlert(i18n.t('perm.required'), i18n.t('perm.blocked', { label }));
  } else {
    Alert.alert(i18n.t('perm.neededTitle'), i18n.t('perm.neededBody', { label }));
  }
  return false;
}

export const ensureMediaLibraryPermission = () =>
  ensure(
    'media',
    ImagePicker.getMediaLibraryPermissionsAsync,
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
  );

export const ensureCameraPermission = () =>
  ensure('camera', ImagePicker.getCameraPermissionsAsync, ImagePicker.requestCameraPermissionsAsync);
