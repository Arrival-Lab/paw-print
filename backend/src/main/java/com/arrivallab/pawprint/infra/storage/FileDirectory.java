package com.arrivallab.pawprint.infra.storage;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FileDirectory {
    PET_PROFILE("pets/profiles"),
    RECORD_ATTACHMENT("records/attachments"),
    DIARY_PHOTO("diaries/photos"),
    POST_PHOTO("posts/photos");

    private final String path;
}
