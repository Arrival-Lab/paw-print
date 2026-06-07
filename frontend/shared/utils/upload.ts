// 멀티파트 업로드용 파일 파트 생성 — uri 확장자에서 MIME 타입을 추론한다.
// 기존엔 모든 사진을 image/jpeg 로 하드코딩해 보냈는데, 전송 스택에 따라 part
// Content-Type 이 누락/변형되면 백엔드가 정상 이미지를 거부하는 문제가 있었다.
// (백엔드도 확장자 폴백을 갖췄지만, 클라이언트가 정확한 타입을 보내는 게 우선.)

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface MultipartFilePart {
  uri: string;
  type: string;
  name: string;
}

/**
 * RN FormData 에 append 할 파일 파트를 만든다.
 * @param uri        ImagePicker 등에서 받은 로컬 uri
 * @param baseName   확장자를 뺀 파일명 (기본 'photo')
 * 확장자를 못 알아내면 image/jpeg + .jpg 로 안전하게 폴백.
 */
export function filePartFromUri(uri: string, baseName = 'photo'): MultipartFilePart {
  const path = uri.split('?')[0];
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1).toLowerCase() : '';
  const type = EXT_TO_MIME[ext] ?? 'image/jpeg';
  const name = EXT_TO_MIME[ext] ? `${baseName}.${ext}` : `${baseName}.jpg`;
  return { uri, type, name };
}
