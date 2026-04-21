package com.arrivallab.pawprint.infra.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@Profile("local")
public class LocalFileStorageService implements FileStorageService {

    @Override
    public String upload(MultipartFile file, String directory) {
        String extension = extractExtension(file.getOriginalFilename());
        return "http://localhost:8080/local-files/" + directory + "/" + UUID.randomUUID() + "." + extension;
    }

    @Override
    public void delete(String fileUrl) {
        // no-op in local profile
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
