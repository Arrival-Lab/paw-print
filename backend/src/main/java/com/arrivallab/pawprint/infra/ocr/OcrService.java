package com.arrivallab.pawprint.infra.ocr;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class OcrService {

    public String parseVetRecord(byte[] imageBytes) {
        // TODO: Claude Vision API를 이용한 진료기록 OCR 파싱 구현
        throw new UnsupportedOperationException("OCR 파싱 미구현");
    }
}
