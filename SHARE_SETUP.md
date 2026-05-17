# 공유 기능 — 도메인/딥링크 설정 (Pawprint AWS 인프라 전제)

현재 상태 가정:
- `api.pawprintapp.link` → ECS Fargate (백엔드, 운영 중)
- `pawprintapp.link` (apex) → 미사용 — universal link 호스팅에 쓸 수 있음
- DNS 는 Route53 으로 관리 중

앱·백엔드 코드 변경은 이미 끝남. 아래는 **채연이 AWS·스토어 콘솔에서 직접** 할 일.

---

## 0. 결정 — apex 호스팅 방식

| 옵션 | 작업량 | 비용 | 권장 |
|---|---|---|---|
| **S3 + CloudFront + Route53** | 콘솔 30분 | 거의 0 (월 < $1) | ✅ AWS 일관성, 가장 자연스러움 |
| 백엔드 ALB 에 apex 라우팅 | 백엔드 재배포 + ACM cert SAN | 0 | 백엔드와 정적 응답 섞임 — 비추 |
| Vercel/Cloudflare Pages | 5분 | 무료 | 빠르지만 도메인이 AWS 밖으로 |

**아래는 S3+CloudFront 기준.** 다른 거 쓰면 5번 (Route53) 만 다르고 나머지는 동일.

---

## 1. S3 — 정적 파일 호스팅

### 버킷 생성
```bash
aws s3 mb s3://pawprintapp-link-web --region ap-northeast-2
```
- Public Read 차단 유지 (CloudFront 만 OAC 로 접근).
- Static website hosting **활성화 안 해도 됨** (CloudFront 가 직접 S3 origin 사용).

### 업로드할 파일 3개

**`/.well-known/apple-app-site-association`** (확장자 없음 주의, Content-Type `application/json`)
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.arrivallab.pawprint",
        "paths": ["/share/*"]
      }
    ]
  }
}
```

**`/.well-known/assetlinks.json`** (Content-Type `application/json`)
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.arrivallab.pawprint",
      "sha256_cert_fingerprints": ["XX:XX:..."]
    }
  }
]
```

**`/index.html`** (apex 진입 / 앱 미설치 사용자 fallback)
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>발자국 — 반려동물 케어</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, "Apple SD Gothic Neo", sans-serif; padding: 40px 24px; text-align: center; background: #FBF9F5; color: #1F2937; }
    h1 { color: #B65A6F; }
    a.cta { display: inline-block; margin: 8px; padding: 12px 20px; border-radius: 12px; background: #B65A6F; color: white; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🐾 발자국</h1>
  <p>반려동물 진료기록·다이어리·케어 공유를 한 곳에서.</p>
  <p>
    <a class="cta" href="https://apps.apple.com/app/idXXXXXXXXX">App Store</a>
    <a class="cta" href="https://play.google.com/store/apps/details?id=com.arrivallab.pawprint">Google Play</a>
  </p>
  <p style="margin-top: 32px; color: #9CA3AF; font-size: 13px;">공유 초대 링크를 받으셨다면 앱 설치 후 다시 링크를 눌러주세요.</p>
</body>
</html>
```

`/share/accept` 도 같은 fallback 보여주면 충분 (앱 설치돼 있으면 universal link 가 가로채서 이 페이지를 안 봄).
S3 에 `/share/accept/index.html` 로 같은 내용 업로드하거나 CloudFront default root object 만 두고 처리.

### 업로드 명령
```bash
# AASA — 확장자 없음 / content-type 강제
aws s3 cp ./apple-app-site-association \
  s3://pawprintapp-link-web/.well-known/apple-app-site-association \
  --content-type "application/json" \
  --cache-control "no-cache"

# assetlinks
aws s3 cp ./assetlinks.json \
  s3://pawprintapp-link-web/.well-known/assetlinks.json \
  --content-type "application/json" \
  --cache-control "max-age=3600"

# index.html
aws s3 cp ./index.html s3://pawprintapp-link-web/index.html \
  --content-type "text/html; charset=utf-8"
```

---

## 2. ACM — 인증서 (CloudFront 용)

CloudFront 는 **us-east-1** 인증서만 받음.
```bash
# us-east-1 에서 발급
aws acm request-certificate \
  --domain-name pawprintapp.link \
  --validation-method DNS \
  --region us-east-1
```
- 콘솔 → ACM → "DNS 검증" 누르면 Route53 에 CNAME 자동 추가 가능.
- Issued 상태 되면 ARN 메모.

---

## 3. CloudFront

콘솔 → Create distribution.
- **Origin**: S3 버킷 (`pawprintapp-link-web.s3.ap-northeast-2.amazonaws.com`), **OAC 새로 생성**.
- **Default behavior**: Viewer protocol policy = Redirect HTTP→HTTPS, Allowed methods = GET/HEAD.
- **Alternate domain names (CNAMEs)**: `pawprintapp.link`
- **Custom SSL**: 2번에서 발급한 us-east-1 ACM cert 선택.
- **Default root object**: `index.html`

생성 후:
- S3 버킷 정책에 OAC 자동 추가됨 (콘솔 안내 따름).
- CloudFront 도메인 (`dXXXXX.cloudfront.net`) 메모.

### Custom behavior — `.well-known/*` 캐시 제어 (선택)
- AASA 는 너무 길게 캐시되면 안 됨. Cache policy = "CachingDisabled" 적용 (또는 TTL 짧게).

---

## 4. Route53 — apex 라우팅

호스팅 영역 `pawprintapp.link` 안에서:
- 타입 **A** (ALIAS), 이름 비움 (apex), 대상 = 위 CloudFront distribution.
- 같은 식으로 `AAAA` (IPv6 ALIAS) 추가.

`api.pawprintapp.link` 레코드는 그대로 유지.

---

## 5. 식별자 채우기

### iOS Team ID
1. https://developer.apple.com/account → Membership.
2. "Team ID" 10자 (예: `AB1CDE2FGH`) 복사.
3. AASA 의 `appID` 를 `TEAMID.com.arrivallab.pawprint` 형태로 수정.

### Android SHA-256 fingerprint
출시 빌드 키스토어 기준. EAS Build 사용 중이면:
```bash
eas credentials --platform android
# → Production / Keystore / "Show keystore credentials" → SHA-256 표시
```
또는 Google Play Console → 앱 → "앱 무결성" → "앱 서명 키 인증서" → **SHA-256 인증서 디지털 지문** 복사.

assetlinks.json 의 `sha256_cert_fingerprints` 배열에 그 값 그대로 (콜론 포함) 넣기.

> **주의**: 업로드 키와 앱 서명 키가 다름. Google Play 가 앱 서명 관리하는 경우 (대부분 그럼) 위 콘솔의 "앱 서명 키" 지문 사용. 업로드 키 지문 쓰면 검증 실패.

---

## 6. 백엔드 환경변수 (ECS task definition)

`share.invite-base-url` 기본값 `https://pawprintapp.link` — 따로 안 건드려도 됨.
다른 값 쓸 거면 ECS task definition 의 환경변수에 추가:
```
SHARE_INVITE_BASE_URL=https://pawprintapp.link
```
Spring 의 relaxed binding 으로 `share.invite-base-url` 와 매핑됨.

---

## 7. 검증

### AASA 200 OK 확인
```bash
curl -I https://pawprintapp.link/.well-known/apple-app-site-association
# HTTP/2 200, content-type: application/json — redirect 없어야 함.
```

Apple validator: https://search.developer.apple.com/appsearch-validation-tool/
- "URL" 에 `https://pawprintapp.link` 넣고 실행.

### iOS 디바이스 테스트
앱 한 번 설치 → 메시지/메모에 다음 링크 붙여넣고 길게 눌러서 "Open in 발자국" 뜨면 OK:
```
https://pawprintapp.link/share/accept?token=test-token
```

### Android App Links 검증
앱 설치 후:
```bash
adb shell pm verify-app-links --re-verify com.arrivallab.pawprint
adb shell pm get-app-links com.arrivallab.pawprint
# → pawprintapp.link verified 라고 나와야 함.
```
실패 시 assetlinks.json 의 fingerprint 가 실제 서명 키와 일치하는지 확인.

---

## 8. 진행 순서 추천

1. **백엔드 env 만 먼저 추가/배포** (이미 코드 들어가 있어 동작). 도메인 없이 custom scheme `pawprint://` 만으로도 앱 설치된 사용자끼리는 즉시 동작.
2. **여유 있을 때 1~5번 진행**. 미설치 사용자용 fallback 까지 동작.

---

## 9. 부가 (선택, v2+)

- 초대받은 이메일로 자동 발송 (AWS SES + 백엔드 메일 서비스)
- 수락 시 소유자에게 FCM 푸시 ("○○님이 콩이 케어에 참여했어요")
- 공유 멤버 권한 차등 (현재는 read-only 통일)
