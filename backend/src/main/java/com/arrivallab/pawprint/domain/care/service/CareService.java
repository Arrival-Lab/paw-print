package com.arrivallab.pawprint.domain.care.service;

import com.arrivallab.pawprint.domain.care.dto.*;
import com.arrivallab.pawprint.domain.care.entity.CareCheck;
import com.arrivallab.pawprint.domain.care.entity.CareItem;
import com.arrivallab.pawprint.domain.care.repository.CareCheckRepository;
import com.arrivallab.pawprint.domain.care.repository.CareItemRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareMember;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CareService {

    private final CareItemRepository itemRepository;
    private final CareCheckRepository checkRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ShareMemberRepository shareMemberRepository;

    // ── 항목 CRUD ──────────────────────────────────────────────────
    public CareItemResponse createItem(Long userId, Long petId, CareItemRequest req) {
        Pet pet = checkPetAccess(userId, petId);
        CareItem item = CareItem.builder()
                .pet(pet)
                .name(req.name())
                .itemType(req.itemType())
                .targetCount(Math.max(1, req.targetCountOrDefault()))
                .sortOrder(req.sortOrderOrDefault())
                .active(true)
                .build();
        return CareItemResponse.from(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<CareItemResponse> listItems(Long userId, Long petId) {
        checkPetAccess(userId, petId);
        return itemRepository.findByPet_IdAndActiveTrueOrderBySortOrderAscIdAsc(petId).stream()
                .map(CareItemResponse::from)
                .toList();
    }

    public CareItemResponse updateItem(Long userId, Long petId, Long itemId, CareItemRequest req) {
        checkPetAccess(userId, petId);
        CareItem item = getItem(petId, itemId);
        item.update(req.name(), req.itemType(), req.targetCountOrDefault(), req.sortOrderOrDefault());
        return CareItemResponse.from(item);
    }

    public void deleteItem(Long userId, Long petId, Long itemId) {
        checkPetAccess(userId, petId);
        CareItem item = getItem(petId, itemId);
        item.deactivate();
    }

    // ── 일별 체크 ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DailyCareDto> getDay(Long userId, Long petId, LocalDate date) {
        checkPetAccess(userId, petId);
        List<CareItem> items = itemRepository.findByPet_IdAndActiveTrueOrderBySortOrderAscIdAsc(petId);
        Map<Long, CareCheck> checkByItem = checkRepository.findByPetAndDate(petId, date).stream()
                .collect(Collectors.toMap(c -> c.getCareItem().getId(), c -> c));
        return items.stream()
                .map(it -> {
                    CareCheck c = checkByItem.get(it.getId());
                    return DailyCareDto.of(it, c != null ? c.getCount() : 0, c != null ? c.getId() : null, date);
                })
                .toList();
    }

    /** count=0 이면 체크 삭제. 그 외엔 upsert. */
    public DailyCareDto setCheck(Long userId, Long petId, Long itemId, CareCheckRequest req) {
        checkPetAccess(userId, petId);
        CareItem item = getItem(petId, itemId);
        Optional<CareCheck> existing = checkRepository.findByCareItem_IdAndCheckedAt(itemId, req.date());

        if (req.count() == 0) {
            existing.ifPresent(checkRepository::delete);
            return DailyCareDto.of(item, 0, null, req.date());
        }
        CareCheck check = existing.orElseGet(() -> CareCheck.builder()
                .careItem(item)
                .checkedAt(req.date())
                .count(0)
                .build());
        check.setCount(req.count());
        check.setNote(req.note());
        CareCheck saved = checkRepository.save(check);
        return DailyCareDto.of(item, saved.getCount(), saved.getId(), req.date());
    }

    // ── 홈 위젯 — 현재 유저의 모든 펫 오늘 진행률 ───────────────────
    @Transactional(readOnly = true)
    public List<HomeCareDto> getHomeToday(Long userId, LocalDate date) {
        List<Pet> pets = getAccessiblePets(userId);
        if (pets.isEmpty()) return List.of();

        // 모든 access 가능 펫의 today 체크 한 번에
        List<CareCheck> allChecks = checkRepository.findByUserAndDate(userId, date);
        Map<Long, Map<Long, Integer>> checkByPet = new HashMap<>();
        for (CareCheck c : allChecks) {
            Long petId = c.getCareItem().getPet().getId();
            checkByPet.computeIfAbsent(petId, k -> new HashMap<>())
                    .put(c.getCareItem().getId(), c.getCount());
        }
        Map<Long, Map<Long, Long>> checkIdByPet = new HashMap<>();
        for (CareCheck c : allChecks) {
            Long petId = c.getCareItem().getPet().getId();
            checkIdByPet.computeIfAbsent(petId, k -> new HashMap<>())
                    .put(c.getCareItem().getId(), c.getId());
        }

        List<HomeCareDto> result = new ArrayList<>();
        for (Pet pet : pets) {
            List<CareItem> items = itemRepository.findByPet_IdAndActiveTrueOrderBySortOrderAscIdAsc(pet.getId());
            if (items.isEmpty()) continue;
            Map<Long, Integer> petChecks = checkByPet.getOrDefault(pet.getId(), Map.of());
            Map<Long, Long> petCheckIds = checkIdByPet.getOrDefault(pet.getId(), Map.of());

            int totalTargets = items.stream().mapToInt(CareItem::getTargetCount).sum();
            int totalCompleted = items.stream()
                    .mapToInt(it -> Math.min(petChecks.getOrDefault(it.getId(), 0), it.getTargetCount()))
                    .sum();
            List<DailyCareDto> dtos = items.stream()
                    .map(it -> DailyCareDto.of(
                            it,
                            petChecks.getOrDefault(it.getId(), 0),
                            petCheckIds.get(it.getId()),
                            date))
                    .toList();
            result.add(new HomeCareDto(pet.getId(), pet.getName(), totalTargets, totalCompleted, dtos));
        }
        return result;
    }

    // ── 권한 helper ─────────────────────────────────────────────────
    private Pet checkPetAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        boolean owner = pet.getUser().getId().equals(userId);
        boolean shared = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!owner && !shared) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return pet;
    }

    private List<Pet> getAccessiblePets(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        List<Pet> owned = petRepository.findByUserOrderByCreatedAtAsc(user);
        // 공유 받은 펫 — JOIN FETCH 가 따로 없으므로 ShareMember 에서 pet 끄집어냄.
        List<Pet> shared = shareMemberRepository.findAll().stream()
                .filter(sm -> sm.getMember() != null && sm.getMember().getId().equals(userId))
                .filter(sm -> sm.getStatus() == ShareStatus.ACCEPTED)
                .map(ShareMember::getPet)
                .toList();
        Set<Long> seen = new HashSet<>();
        List<Pet> result = new ArrayList<>();
        for (Pet p : owned) if (seen.add(p.getId())) result.add(p);
        for (Pet p : shared) if (seen.add(p.getId())) result.add(p);
        return result;
    }

    private CareItem getItem(Long petId, Long itemId) {
        CareItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!item.getPet().getId().equals(petId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return item;
    }
}
