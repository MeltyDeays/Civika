package com.civicreport.biometric.controller;

import com.civicreport.biometric.dto.VerifyIdentityRequest;
import com.civicreport.biometric.dto.VerifyIdentityResponse;
import com.civicreport.biometric.service.IdentityVerificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class IdentityVerificationController {

    private final IdentityVerificationService verificationService;

    public IdentityVerificationController(IdentityVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "civicreport-biometric"));
    }

    @PostMapping({"/identity/verify", "/biometrics/verify"})
    public ResponseEntity<VerifyIdentityResponse> verify(@Valid @RequestBody VerifyIdentityRequest request) {
        return ResponseEntity.ok(verificationService.verify(request));
    }
}
