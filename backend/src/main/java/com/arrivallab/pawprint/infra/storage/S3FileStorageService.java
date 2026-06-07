package com.arrivallab.pawprint.infra.storage;

import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    private static final long MAX_SIZE = 10 * 1024 * 1024L;
    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");
    // 확장자 → content-type 폴백. RN/프록시가 part Content-Type 을 null·octet-stream 으로
    // 보내는 경우가 있어(PNG 첨부 시 INVALID_FILE_TYPE 오인 거부) 파일명 확장자로 보정한다.
    private static final Map<String, String> EXT_TO_TYPE = Map.of(
            "jpg", "image/jpeg", "jpeg", "image/jpeg", "png", "image/png",
            "webp", "image/webp", "pdf", "application/pdf");

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.cdn-domain:}")
    private String cdnDomain;

    private final S3Client s3Client;

    @Override
    public String upload(MultipartFile file, String directory) {
        if (file.getSize() > MAX_SIZE) throw new BusinessException(ErrorCode.FILE_TOO_LARGE);

        String extension = extractExtension(file.getOriginalFilename());
        // content-type 우선, 미상/불일치면 확장자로 폴백. 클라이언트가 보낸 헤더 하나만
        // 믿고 정상 이미지를 거부하지 않게 한다. 둘 다 유효하지 않을 때만 거부.
        String contentType = resolveContentType(file.getContentType(), extension);
        if (contentType == null)
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        // 확장자가 없거나 content-type 과 어긋나면 결정된 타입 기준으로 확장자 보정.
        if (!EXT_TO_TYPE.containsKey(extension)) extension = extensionFor(contentType);

        String key = directory + "/" + UUID.randomUUID() + "." + extension;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(contentType)
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new RuntimeException("S3 upload failed", e);
        }

        return publicUrlFor(key);
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        String key = extractKey(fileUrl);
        if (key == null) return;
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    private String publicUrlFor(String key) {
        if (cdnDomain != null && !cdnDomain.isBlank()) {
            return "https://" + cdnDomain + "/" + key;
        }
        return "https://" + bucket + ".s3.ap-northeast-2.amazonaws.com/" + key;
    }

    private String extractKey(String fileUrl) {
        String cdnPrefix = (cdnDomain != null && !cdnDomain.isBlank())
                ? "https://" + cdnDomain + "/" : null;
        String s3Prefix = "https://" + bucket + ".s3.ap-northeast-2.amazonaws.com/";
        if (cdnPrefix != null && fileUrl.startsWith(cdnPrefix)) {
            return fileUrl.substring(cdnPrefix.length());
        }
        if (fileUrl.startsWith(s3Prefix)) {
            return fileUrl.substring(s3Prefix.length());
        }
        return null;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    /**
     * 저장에 사용할 content-type 결정. 클라이언트 헤더가 허용 목록에 있으면 그대로,
     * 아니면(null·octet-stream·charset 파라미터 등) 파일 확장자로 폴백한다.
     * 둘 다 유효하지 않으면 null 반환 → 호출부에서 INVALID_FILE_TYPE.
     */
    private String resolveContentType(String rawContentType, String extension) {
        String normalized = normalizeContentType(rawContentType);
        if (normalized != null && ALLOWED_TYPES.contains(normalized)) return normalized;
        return EXT_TO_TYPE.get(extension); // 확장자 폴백 (없으면 null)
    }

    /** "image/png; charset=utf-8" → "image/png". null/공백은 null. */
    private String normalizeContentType(String contentType) {
        if (contentType == null) return null;
        int semi = contentType.indexOf(';');
        String base = (semi >= 0 ? contentType.substring(0, semi) : contentType).trim().toLowerCase();
        return base.isEmpty() ? null : base;
    }

    /** content-type 에 대응하는 표준 확장자. */
    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "application/pdf" -> "pdf";
            default -> "bin";
        };
    }
}
