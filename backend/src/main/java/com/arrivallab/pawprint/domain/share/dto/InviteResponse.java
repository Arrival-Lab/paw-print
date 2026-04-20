package com.arrivallab.pawprint.domain.share.dto;

import java.time.LocalDateTime;

public record InviteResponse(String inviteLink, LocalDateTime expiresAt) {}
