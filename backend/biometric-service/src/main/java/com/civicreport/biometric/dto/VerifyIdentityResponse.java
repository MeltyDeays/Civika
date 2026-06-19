package com.civicreport.biometric.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class VerifyIdentityResponse {

    private boolean valido;
    private double score;
    private String motivo;
    private Map<String, Object> checks = new LinkedHashMap<>();

    public static VerifyIdentityResponse accept(double score, String motivo, Map<String, Object> checks) {
        VerifyIdentityResponse r = new VerifyIdentityResponse();
        r.valido = true;
        r.score = score;
        r.motivo = motivo;
        r.checks = checks;
        return r;
    }

    public static VerifyIdentityResponse reject(String motivo, Map<String, Object> checks) {
        VerifyIdentityResponse r = new VerifyIdentityResponse();
        r.valido = false;
        r.score = checks.containsKey("faceMatchScore") ? ((Number) checks.get("faceMatchScore")).doubleValue() : 0.0;
        r.motivo = motivo;
        r.checks = checks;
        return r;
    }

    public boolean isValido() {
        return valido;
    }

    public void setValido(boolean valido) {
        this.valido = valido;
    }

    /** Alias JSON para clientes REST: { "verified": true } */
    public boolean isVerified() {
        return valido;
    }

    /** Alias JSON para clientes REST: { "error": "SUPLANTACION_DETECTADA" } */
    public String getError() {
        return valido ? null : motivo;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Map<String, Object> getChecks() {
        return checks;
    }

    public void setChecks(Map<String, Object> checks) {
        this.checks = checks;
    }
}
