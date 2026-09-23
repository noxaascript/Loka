# Upload cloudflared binaries ke GitHub Releases
# Butuh: gh CLI

param(
  [string]$Tag = "v0.0.0-alpha.2026dev0923.binaries",
  [string]$Title = "Cloudflared Binaries Mirror"
)

$binDir = "dist\binaries"
if (-not (Test-Path $binDir)) {
  Write-Host "Folder $binDir tidak ada. Jalanin dulu: node tools\download-all.cjs" -ForegroundColor Red
  exit 1
}

$files = Get-ChildItem $binDir -File
if ($files.Count -eq 0) {
  Write-Host "Tidak ada file di $binDir" -ForegroundColor Red
  exit 1
}

Write-Host "Files yang akan di-upload:" -ForegroundColor Cyan
$files | ForEach-Object { Write-Host "  - $($_.Name) ($([Math]::Round($_.Length/1MB,1)) MB)" }

# Cek release udah ada atau belum  suppress error
$existing = $null
try {
  $existing = & gh release view $Tag 2>&1
  $releaseExists = ($LASTEXITCODE -eq 0)
} catch {
  $releaseExists = $false
}

if ($releaseExists) {
  Write-Host "`nRelease $Tag sudah ada. Upload files (overwrite)..." -ForegroundColor Yellow
  $paths = $files | ForEach-Object { $_.FullName }
  & gh release upload $Tag $paths --clobber
} else {
  Write-Host "`nBikin release baru: $Tag" -ForegroundColor Green
  $paths = $files | ForEach-Object { $_.FullName }
  & gh release create $Tag --title $Title --notes "Cloudflared binary mirror untuk Loka." $paths
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nSelesai. Cek: gh release view $Tag" -ForegroundColor Green
} else {
  Write-Host "`nUpload gagal. Cek error di atas." -ForegroundColor Red
}
