import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

const openSettingsAlert = (title: string, message: string) =>
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: '설정 열기', onPress: () => Linking.openSettings() },
  ]);

async function ensure(
  kind: 'media' | 'camera',
  get: () => Promise<ImagePicker.PermissionResponse>,
  req: () => Promise<ImagePicker.PermissionResponse>,
): Promise<boolean> {
  const label = kind === 'media' ? '사진 라이브러리' : '카메라';
  const cur = await get();
  console.log(`[perm:${kind}] get →`, cur);
  if (cur.granted) return true;
  if (!cur.canAskAgain) {
    openSettingsAlert('권한 필요', `${label} 접근이 차단돼 있어요. 설정에서 권한을 허용해주세요.`);
    return false;
  }
  const r = await req();
  console.log(`[perm:${kind}] request →`, r);
  if (r.granted) return true;
  if (!r.canAskAgain) {
    openSettingsAlert('권한 필요', `${label} 접근이 차단돼 있어요. 설정에서 권한을 허용해주세요.`);
  } else {
    Alert.alert(
      '권한이 필요해요',
      `${label} 접근을 허용해야 사진을 첨부할 수 있어요. (status: ${r.status})`,
    );
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
