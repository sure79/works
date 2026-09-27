#!/usr/bin/env bash
# Hermes 아침 브리핑 설치/업데이트 스크립트 (Mac / Linux)
# 여러 번 실행해도 안전하다: 파일을 다시 복사하고, cron 작업이 있으면 수정·없으면 생성한다.
set -euo pipefail
cd "$(dirname "$0")"

JOB_NAME="morning-briefing"

# ── 0. 사전 점검 ─────────────────────────────────────────
command -v docker >/dev/null || { echo "❌ Docker가 설치되어 있지 않습니다. https://docs.docker.com/get-docker/"; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌ Docker가 실행 중이 아닙니다. Docker Desktop을 켜 주세요."; exit 1; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "📝 .env 파일을 만들었습니다. API 키와 텔레그램 값을 채운 뒤 다시 실행하세요."
  exit 1
fi

set -a; source .env; set +a
: "${TELEGRAM_BOT_TOKEN:?.env에 TELEGRAM_BOT_TOKEN을 채우세요}"
: "${TELEGRAM_HOME_CHANNEL:?.env에 TELEGRAM_HOME_CHANNEL을 채우세요}"
BRIEFING_CRON="${BRIEFING_CRON:-0 7 * * *}"

if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  PROVIDER="anthropic";  MODEL="${BRIEFING_MODEL:-claude-sonnet-4-6}"
elif [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  PROVIDER="openrouter"; MODEL="${BRIEFING_MODEL:-anthropic/claude-sonnet-4.6}"
else
  echo "❌ .env에 ANTHROPIC_API_KEY 또는 OPENROUTER_API_KEY 중 하나를 채우세요."; exit 1
fi

# ── 1. Hermes 데이터 폴더(./data = 컨테이너의 /opt/data) 준비 ──
mkdir -p data/scripts data/skills/research/"$JOB_NAME"
cp .env data/.env
cp scripts/fetch_news.py data/scripts/fetch_news.py
cp skills/morning-briefing/SKILL.md data/skills/research/"$JOB_NAME"/SKILL.md

# ── 2. 컨테이너 기동 ─────────────────────────────────────
export HERMES_UID="$(id -u)" HERMES_GID="$(id -g)"
docker compose pull
docker compose up -d --force-recreate

echo "⏳ Hermes 시작 대기 중..."
for _ in $(seq 1 30); do
  docker exec hermes hermes --version >/dev/null 2>&1 && break
  sleep 2
done

h() { docker exec hermes hermes "$@"; }

# ── 3. 모델·시간대 설정 ───────────────────────────────────
h config set model.provider "$PROVIDER"
h config set model.default "$MODEL"
h config set timezone "${HERMES_TIMEZONE:-Asia/Seoul}"

# ── 4. cron 작업 등록 ────────────────────────────────────
PROMPT="오늘 아침 뉴스 브리핑을 작성하라. 위에 첨부된 fetch_news.py 수집 결과를 1차 자료로 쓰고, \
morning-briefing 스킬의 선별 기준과 출력 형식을 그대로 따른다. 결과 메시지 본문만 출력한다."

if grep -q "$JOB_NAME" <<<"$(h cron list --all 2>/dev/null || true)"; then
  h cron edit "$JOB_NAME" --schedule "$BRIEFING_CRON" --prompt "$PROMPT" \
    --skill "$JOB_NAME" --script fetch_news.py --deliver "telegram:${TELEGRAM_HOME_CHANNEL}"
  echo "🔁 기존 cron 작업을 업데이트했습니다."
else
  h cron create "$BRIEFING_CRON" "$PROMPT" --name "$JOB_NAME" \
    --skill "$JOB_NAME" --script fetch_news.py --deliver "telegram:${TELEGRAM_HOME_CHANNEL}"
  echo "✅ cron 작업을 만들었습니다."
fi

h cron list
cat <<EOF

🎉 설치 완료! 매일 '${BRIEFING_CRON}' (${HERMES_TIMEZONE:-Asia/Seoul}) 에 텔레그램으로 브리핑이 옵니다.
   지금 바로 테스트:   docker exec hermes hermes cron run ${JOB_NAME}
   로그 보기:          docker compose logs -f hermes
EOF
