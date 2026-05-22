package com.arrivallab.pawprint.domain.diary.service;

import com.arrivallab.pawprint.domain.diary.dto.*;
import com.arrivallab.pawprint.domain.diary.entity.DiaryPhoto;
import com.arrivallab.pawprint.domain.diary.entity.DiaryTag;
import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;
import com.arrivallab.pawprint.domain.diary.repository.DiaryPhotoRepository;
import com.arrivallab.pawprint.domain.diary.repository.HealthDiaryRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.record.repository.MedicalRecordRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.constants.FreeLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import com.arrivallab.pawprint.infra.storage.FileDirectory;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class DiaryService {

    private final HealthDiaryRepository diaryRepository;
    private final DiaryPhotoRepository photoRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final MedicalRecordRepository recordRepository;
    private final FileStorageService fileStorageService;

    public record UpsertResult(DiaryResponse diary, boolean created) {}

    public UpsertResult createOrUpdate(Long userId, Long petId, DiaryRequest request) {
        checkPetAccess(userId, petId);
        Optional<HealthDiary> existing = diaryRepository.findByPet_IdAndDiaryDate(petId, request.diaryDate());

        if (existing.isPresent()) {
            HealthDiary diary = existing.get();
            diary.update(request.title(), request.content());
            diary.replaceTags(request.tags());
            return new UpsertResult(DiaryResponse.from(diary), false);
        }

        Pet pet = getPet(petId);
        HealthDiary diary = HealthDiary.builder()
                .pet(pet)
                .diaryDate(request.diaryDate())
                .title(request.title())
                .content(request.content())
                .build();
        HealthDiary saved = diaryRepository.save(diary);
        saved.replaceTags(request.tags());
        return new UpsertResult(DiaryResponse.from(saved), true);
    }

    @Transactional(readOnly = true)
    public PageResponse<DiarySummaryDto> getDiaries(Long userId, Long petId,
                                                     LocalDate from, LocalDate to,
                                                     int page, int size) {
        checkPetAccess(userId, petId);
        LocalDate effectiveFrom = from != null ? from : LocalDate.of(1900, 1, 1);
        LocalDate effectiveTo = to != null ? to : LocalDate.of(9999, 12, 31);
        return PageResponse.from(
                diaryRepository.findByPet_IdAndDiaryDateBetweenOrderByDiaryDateDesc(
                                petId, effectiveFrom, effectiveTo, PageRequest.of(page, size))
                        .map(DiarySummaryDto::from)
        );
    }

    @Transactional(readOnly = true)
    public DiaryResponse getDiary(Long userId, Long petId, Long diaryId) {
        checkPetAccess(userId, petId);
        return DiaryResponse.from(getDiary(petId, diaryId));
    }

    public DiaryResponse update(Long userId, Long petId, Long diaryId, DiaryRequest request) {
        checkPetAccess(userId, petId);
        HealthDiary diary = getDiary(petId, diaryId);
        diary.update(request.title(), request.content());
        diary.replaceTags(request.tags());
        return DiaryResponse.from(diary);
    }

    public void delete(Long userId, Long petId, Long diaryId) {
        checkPetAccess(userId, petId);
        HealthDiary diary = getDiary(petId, diaryId);
        diary.getPhotos().forEach(p -> fileStorageService.delete(p.getPhotoUrl()));
        diaryRepository.delete(diary);
    }

    public PhotoResponse addPhoto(Long userId, Long petId, Long diaryId, MultipartFile file) {
        checkPetAccess(userId, petId);
        HealthDiary diary = getDiary(petId, diaryId);

        User user = getUser(userId);
        if (user.getSubscriptionType() == SubscriptionType.FREE
                && photoRepository.countByDiary(diary) >= FreeLimits.MAX_PHOTOS_PER_ITEM) {
            throw new BusinessException(ErrorCode.PHOTO_LIMIT_EXCEEDED);
        }

        String url = fileStorageService.upload(file, FileDirectory.DIARY_PHOTO.getPath());
        int nextOrder = photoRepository.findMaxSortOrderByDiaryId(diaryId) + 1;

        DiaryPhoto photo = DiaryPhoto.builder()
                .diary(diary)
                .photoUrl(url)
                .sortOrder(nextOrder)
                .build();
        return PhotoResponse.from(photoRepository.save(photo));
    }

    public void deletePhoto(Long userId, Long petId, Long diaryId, Long photoId) {
        checkPetAccess(userId, petId);
        DiaryPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        fileStorageService.delete(photo.getPhotoUrl());
        photoRepository.delete(photo);
    }

    @Transactional(readOnly = true)
    public Map<String, CalendarDayDto> getCalendar(Long userId, Long petId, int year, int month) {
        checkPetAccess(userId, petId);
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<HealthDiary> diaries = diaryRepository.findForCalendar(petId, start, end);
        Set<LocalDate> recordDates = new HashSet<>(
                recordRepository.findVisitedDatesByPetIdAndRange(petId, start, end));

        return buildCalendar(diaries, recordDates);
    }

    /** "N년 전 오늘" 회고 — 본인+공유 펫의 같은 월/일, 오늘 이전 다이어리. 연도 desc. */
    @Transactional(readOnly = true)
    public List<MemoryDiaryDto> getMemories(Long userId) {
        LocalDate today = LocalDate.now();
        return diaryRepository.findMemoriesForUser(
                        userId, ShareStatus.ACCEPTED,
                        today.getMonthValue(), today.getDayOfMonth(), today)
                .stream()
                .map(MemoryDiaryDto::from)
                .toList();
    }

    /** "전체" 모드 — 현재 유저의 모든 펫(소유) 다이어리·진료기록을 날짜 단위로 병합. */
    @Transactional(readOnly = true)
    public Map<String, CalendarDayDto> getCalendarForUser(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<HealthDiary> diaries = diaryRepository.findForUserCalendar(userId, ShareStatus.ACCEPTED, start, end);
        Set<LocalDate> recordDates = new HashSet<>(
                recordRepository.findVisitedDatesByUserAndRange(userId, ShareStatus.ACCEPTED, start, end));

        return buildCalendar(diaries, recordDates);
    }

    private Map<String, CalendarDayDto> buildCalendar(List<HealthDiary> diaries, Set<LocalDate> recordDates) {
        Map<String, CalendarDayDto> result = new LinkedHashMap<>();

        for (HealthDiary diary : diaries) {
            String key = diary.getDiaryDate().toString();
            String thumbnail = diary.getPhotos().isEmpty() ? null : diary.getPhotos().get(0).getPhotoUrl();
            List<String> tags = diary.getTags().stream().map(DiaryTag::getTagName).toList();
            CalendarDayDto prev = result.get(key);
            if (prev == null) {
                result.put(key, new CalendarDayDto(thumbnail, recordDates.contains(diary.getDiaryDate()), tags));
            } else {
                // 같은 날짜에 여러 펫 다이어리가 있을 때 — 썸네일은 먼저 들어온 것 유지, 태그 합집합.
                Set<String> merged = new LinkedHashSet<>(prev.tags());
                merged.addAll(tags);
                result.put(key, new CalendarDayDto(
                        prev.thumbnail() != null ? prev.thumbnail() : thumbnail,
                        prev.hasRecord() || recordDates.contains(diary.getDiaryDate()),
                        List.copyOf(merged)
                ));
            }
        }

        for (LocalDate recordDate : recordDates) {
            result.putIfAbsent(recordDate.toString(), new CalendarDayDto(null, true, List.of()));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public PageResponse<DiarySummaryDto> search(Long userId, Long petId,
                                                 String keyword, List<String> tags,
                                                 int page, int size) {
        checkPetAccess(userId, petId);
        List<String> tagList = tags != null ? tags : List.of();
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasTagFilter = !tagList.isEmpty();
        String effectiveKeyword = hasKeyword ? keyword : "";
        List<String> effectiveTags = hasTagFilter ? tagList : List.of("__none__");
        return PageResponse.from(
                diaryRepository.search(petId, effectiveKeyword, hasKeyword, effectiveTags, hasTagFilter,
                                PageRequest.of(page, size))
                        .map(DiarySummaryDto::from)
        );
    }

    private void checkPetAccess(Long userId, Long petId) {
        Pet pet = getPet(petId);
        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isShared = shareMemberRepository.existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
    }

    private Pet getPet(Long petId) {
        return petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
    }

    private HealthDiary getDiary(Long petId, Long diaryId) {
        HealthDiary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!diary.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.NOT_FOUND);
        return diary;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
