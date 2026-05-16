package com.arrivallab.pawprint.domain.pet.controller;

import com.arrivallab.pawprint.domain.pet.dto.PetRequest;
import com.arrivallab.pawprint.domain.pet.dto.PetResponse;
import com.arrivallab.pawprint.domain.pet.service.PetService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @PostMapping
    public ResponseEntity<ApiResponse<PetResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid PetRequest request) {
        return ApiResponse.created(petService.create(userId(userDetails), request));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PetResponse>>> getMyPets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok(petService.getMyPets(userId(userDetails)));
    }

    @GetMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetResponse>> getPet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        return ApiResponse.ok(petService.getPet(userId(userDetails), petId));
    }

    @PutMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestBody @Valid PetRequest request) {
        return ApiResponse.ok(petService.update(userId(userDetails), petId, request));
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        petService.delete(userId(userDetails), petId);
        return ApiResponse.noContent();
    }

    @PostMapping("/{petId}/profile-image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfileImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam("file") MultipartFile file) {
        String url = petService.uploadProfileImage(userId(userDetails), petId, file);
        return ApiResponse.ok(Map.of("profileImage", url));
    }

    @DeleteMapping("/{petId}/profile-image")
    public ResponseEntity<ApiResponse<Void>> deleteProfileImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        petService.deleteProfileImage(userId(userDetails), petId);
        return ApiResponse.noContent();
    }

    private Long userId(UserDetails userDetails) {
        return Long.parseLong(userDetails.getUsername());
    }
}
