# Hermes 아침 브리핑 설치/업데이트 스크립트 (Windows PowerShell)
# 실행: PowerShell에서  powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$JobName = "morning-briefing"

# ── 0. 사전 점검 ─────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Desktop이 설치되어 있지 않습니다. https://docs.docker.com/desktop/"; exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Docker Desktop을 먼저 실행해 주세요."; exit 1 }

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "📝 .env 파일을 만들었습니다. 메모장으로 열어 값을 채운 뒤 다시 실행하세요."
    notepad .env
    exit 1
}

# .env 읽기
$envVars = @{}
Get-Content .env -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$') {
        $envVars[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
    }
}
function Need($k) { if (-not $envVars[$k]) { Write-Host "❌ .env에 $k 값을 채우세요."; exit 1 } }
Need "TELEGRAM_BOT_TOKEN"; Need "TELEGRAM_HOME_CHANNEL"
$Cron = if ($envVars["BRIEFING_CRON"]) { $envVars["BRIEFING_CRON"] } else { "0 7 * * *" }
$Tz   = if ($envVars["HERMES_TIMEZONE"]) { $envVars["HERMES_TIMEZONE"] } else { "Asia/Seoul" }

if ($envVars["ANTHROPIC_API_KEY"]) {
    $Provider = "anthropic";  $Model = if ($envVars["BRIEFING_MODEL"]) { $envVars["BRIEFING_MODEL"] } else { "claude-sonnet-4-6" }
} elseif ($envVars["OPENROUTER_API_KEY"]) {
    $Provider = "openrouter"; $Model = if ($envVars["BRIEFING_MODEL"]) { $envVars["BRIEFING_MODEL"] } else { "anthropic/claude-sonnet-4.6" }
} else {
    Write-Host "❌ .env에 ANTHROPIC_API_KEY 또는 OPENROUTER_API_KEY 중 하나를 채우세요."; exit 1
}

# ── 1. 데이터 폴더 준비 ──────────────────────────────────
New-Item -ItemType Directory -Force -Path "data\scripts", "data\skills\research\$JobName" | Out-Null
Copy-Item .env data\.env -Force
Copy-Item scripts\fetch_news.py data\scripts\fetch_news.py -Force
Copy-Item skills\morning-briefing\SKILL.md "data\skills\research\$JobName\SKILL.md" -Force

# ── 2. 컨테이너 기동 ─────────────────────────────────────
docker compose pull
docker compose up -d --force-recreate
Write-Host "⏳ Hermes 시작 대기 중..."
for ($i = 0; $i -lt 30; $i++) {
    docker exec hermes hermes --version *> $null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}

# ── 3. 모델·시간대 설정 ───────────────────────────────────
docker exec hermes hermes config set model.provider $Provider
docker exec hermes hermes config set model.default $Model
docker exec hermes hermes config set timezone $Tz

# ── 4. cron 작업 등록 ────────────────────────────────────
$Prompt = "오늘 아침 뉴스 브리핑을 작성하라. 위에 첨부된 fetch_news.py 수집 결과를 1차 자료로 쓰고, " +
          "morning-briefing 스킬의 선별 기준과 출력 형식을 그대로 따른다. 결과 메시지 본문만 출력한다."
$Deliver = "telegram:" + $envVars["TELEGRAM_HOME_CHANNEL"]

$existing = (docker exec hermes hermes cron list --all 2>$null) -join "`n"
if ($existing -match $JobName) {
    docker exec hermes hermes cron edit $JobName --schedule $Cron --prompt $Prompt `
        --skill $JobName --script fetch_news.py --deliver $Deliver
    Write-Host "🔁 기존 cron 작업을 업데이트했습니다."
} else {
    docker exec hermes hermes cron create $Cron $Prompt --name $JobName `
        --skill $JobName --script fetch_news.py --deliver $Deliver
    Write-Host "✅ cron 작업을 만들었습니다."
}

docker exec hermes hermes cron list
Write-Host ""
Write-Host "🎉 설치 완료! 매일 '$Cron' ($Tz) 에 텔레그램으로 브리핑이 옵니다."
Write-Host "   지금 바로 테스트:   docker exec hermes hermes cron run $JobName"
Write-Host "   로그 보기:          docker compose logs -f hermes"
