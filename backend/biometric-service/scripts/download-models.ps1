# Descarga modelos ONNX para CivicReport Biometric Service
$ErrorActionPreference = "Stop"
$modelsDir = Join-Path $PSScriptRoot "..\src\main\resources\models"
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

$models = @{
    "face_embedding.onnx" = "https://github.com/yakhyo/face-reidentification/releases/download/v0.0.1/w600k_r50.onnx"
    "face_detector.onnx"  = "https://github.com/yakhyo/face-reidentification/releases/download/v0.0.1/det_10g.onnx"
    "anti_spoof.onnx"     = "https://huggingface.co/garciafido/minifasnet-v2-anti-spoofing-onnx/resolve/main/minifasnet_v2.onnx"
}

foreach ($entry in $models.GetEnumerator()) {
    $dest = Join-Path $modelsDir $entry.Key
    if (Test-Path $dest) {
        $mb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
        Write-Host "OK  $($entry.Key) ya existe ($mb MB)"
        continue
    }
    Write-Host "Descargando $($entry.Key)..."
    Invoke-WebRequest -Uri $entry.Value -OutFile $dest -UseBasicParsing
    $mb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
    Write-Host "OK  $($entry.Key) ($mb MB)"
}

Write-Host ""
Write-Host "Modelos listos (~184 MB total). Reinicia: npm run dev"
