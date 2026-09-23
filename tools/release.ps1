# tools/release.ps1
# Usage: .\tools\release.ps1 "commit message here"

param(
  [Parameter(Mandatory=$false)]
  [string]$Message = "chore: daily release"
)

$ErrorActionPreference = "Stop"

# 1. Cek git bersih
$status = git status --porcelain
if ($status) {
  Write-Host "Ada perubahan yang belum di-commit. Commit dulu atau stash:" -ForegroundColor Yellow
  Write-Host $status
  Write-Host ""
  Write-Host "Running: git add . && git commit -m '$Message'" -ForegroundColor Cyan
  git add .
  git commit -m $Message
}

# 2. Push kalau ada commit baru
$unpushed = git log origin/main..HEAD --oneline 2>$null
if ($unpushed) {
  Write-Host "`nPush ke GitHub..." -ForegroundColor Cyan
  git push origin main
}

# 3. Ambil hash
$hash = (git rev-parse --short HEAD).Trim()
if (-not $hash) {
  Write-Host "Gagal ambil git hash" -ForegroundColor Red
  exit 1
}

# 4. Bikin versi
$date = Get-Date -Format "yyyyMMdd"
$version = "0.0.0-beta.$date.$hash"

Write-Host "`nVersion: $version" -ForegroundColor Green

# 5. Update package.json
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='$version';fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

# 6. Commit versi
git add package.json
git commit -m "chore: bump $version"
git push origin main

# 7. Publish ke npm
Write-Host "`nPublish ke npm..." -ForegroundColor Cyan
npm publish --tag beta --access public

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n Release $version sukses!" -ForegroundColor Green
  Write-Host "  Install: npm install -g loka-ai-router@$version" -ForegroundColor Cyan
} else {
  Write-Host "`n Publish gagal" -ForegroundColor Red
  exit 1
}
