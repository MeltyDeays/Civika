# Instala DLLs CUDA 12 + cuDNN 9 y las copia a tools/cuda-deps/bin
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$dest = Join-Path $root "tools\cuda-deps\bin"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "Instalando paquetes NVIDIA via pip..."
python -m pip install --upgrade pip -q
python -m pip install `
  "nvidia-cudnn-cu12==9.*" `
  "nvidia-cuda-runtime-cu12==12.*" `
  "nvidia-cublas-cu12" `
  "nvidia-cufft-cu12" `
  "nvidia-curand-cu12" `
  "nvidia-cuda-nvrtc-cu12" `
  "nvidia-nvjitlink-cu12" -q

$site = python -c "import os,site; paths=[p for p in site.getsitepackages() if os.path.isdir(os.path.join(p,'nvidia'))]; print(paths[0] if paths else site.getsitepackages()[-1])"
$srcBins = @(
    "nvidia\cudnn\bin",
    "nvidia\cuda_runtime\bin",
    "nvidia\cublas\bin",
    "nvidia\cufft\bin",
    "nvidia\curand\bin",
    "nvidia\cuda_nvrtc\bin",
    "nvidia\nvjitlink\bin"
) | ForEach-Object { Join-Path $site $_ } | Where-Object { Test-Path $_ }

Write-Host "Copiando DLLs a $dest ..."
foreach ($bin in $srcBins) {
    Get-ChildItem $bin -Filter "*.dll" | ForEach-Object {
        Copy-Item $_.FullName -Destination $dest -Force
    }
}

$count = (Get-ChildItem $dest -Filter "*.dll").Count
Write-Host "OK  $count DLLs en tools/cuda-deps/bin"
Write-Host "Reinicia: npm run dev"
