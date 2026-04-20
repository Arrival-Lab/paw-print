package com.arrivallab.pawprint.infra.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String upload(MultipartFile file, String directory);
    void delete(String fileUrl);
}
