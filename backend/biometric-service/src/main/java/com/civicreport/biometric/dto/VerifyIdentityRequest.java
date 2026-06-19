package com.civicreport.biometric.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyIdentityRequest {

    @NotBlank
    private String selfieBase64;

    @NotBlank
    private String cedulaFrenteBase64;

    private String cedulaAtrasBase64;

    private String cedulaEscrita;

    private String nombreEscrito;

    private boolean livenessClient = false;

    public String getSelfieBase64() {
        return selfieBase64;
    }

    public void setSelfieBase64(String selfieBase64) {
        this.selfieBase64 = selfieBase64;
    }

    public String getCedulaFrenteBase64() {
        return cedulaFrenteBase64;
    }

    public void setCedulaFrenteBase64(String cedulaFrenteBase64) {
        this.cedulaFrenteBase64 = cedulaFrenteBase64;
    }

    public String getCedulaAtrasBase64() {
        return cedulaAtrasBase64;
    }

    public void setCedulaAtrasBase64(String cedulaAtrasBase64) {
        this.cedulaAtrasBase64 = cedulaAtrasBase64;
    }

    public String getCedulaEscrita() {
        return cedulaEscrita;
    }

    public void setCedulaEscrita(String cedulaEscrita) {
        this.cedulaEscrita = cedulaEscrita;
    }

    public String getNombreEscrito() {
        return nombreEscrito;
    }

    public void setNombreEscrito(String nombreEscrito) {
        this.nombreEscrito = nombreEscrito;
    }

    public boolean isLivenessClient() {
        return livenessClient;
    }

    public void setLivenessClient(boolean livenessClient) {
        this.livenessClient = livenessClient;
    }
}
