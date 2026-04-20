package com.arrivallab.pawprint.infra.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class S3Service {

    public String upload(MultipartFile file, String directory) {
        // TODO: AWS S3 업로드 구현
        throw new UnsupportedOperationException("S3 업로드 미구현");
    }

    public void delete(String fileUrl) {
        // TODO: S3 파일 삭제 구현
        throw new UnsupportedOperationException("S3 삭제 미구현");
    }
}
