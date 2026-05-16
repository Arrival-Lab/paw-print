-- S3 직접 URL → CloudFront URL 일괄 치환.
-- CloudFront 배포 도입 후 raw S3 URL은 OAC 정책으로 403 떨어지므로 기존 데이터 마이그레이션 필요.
--
-- 도메인이 환경에 따라 다를 수 있어 sentinel 변수 패턴 사용:
-- 운영 배포 시 :s3_prefix / :cdn_prefix 가 환경별로 다르면 Flyway placeholder 로 전환 고려.
-- 현재 운영 도메인 하드코딩.

UPDATE pets
   SET profile_image = REPLACE(
       profile_image,
       'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/',
       'https://d2cb1kakaj8sci.cloudfront.net/'
   )
 WHERE profile_image LIKE 'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/%';

UPDATE record_attachments
   SET file_url = REPLACE(
       file_url,
       'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/',
       'https://d2cb1kakaj8sci.cloudfront.net/'
   )
 WHERE file_url LIKE 'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/%';

UPDATE diary_photos
   SET photo_url = REPLACE(
       photo_url,
       'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/',
       'https://d2cb1kakaj8sci.cloudfront.net/'
   )
 WHERE photo_url LIKE 'https://pawprint-files.s3.ap-northeast-2.amazonaws.com/%';
