# Hermes 아침 뉴스 브리핑 (선박 전장 · 배터리 · AI)

매일 아침 정해진 시각에 **선박 전장 / 배터리 / AI** 뉴스를 모아 한국어로 요약하고 **텔레그램**으로 보내 줍니다.
[Hermes Agent](https://github.com/NousResearch/hermes-agent)(Nous Research의 오픈소스 AI 에이전트)를 Docker로 실행합니다.

---

## 1. 동작 원리: 헤르메스가 매일 아침 하는 일

```
 [PC/서버의 Docker]
  └─ hermes 컨테이너  (gateway run: 24시간 상주)
       ├─ 텔레그램 연결 ────────────────┐
       └─ cron 스케줄러 (매분 확인)      │
            │ 07:00 (Asia/Seoul)         │
            ▼                            │
   ① 사전 점검: API 키·스킬·텔레그램 대상 확인
   ② scripts/fetch_news.py 실행
      → Google News RSS에서 분야별 최근 36시간 헤드라인 수집 (LLM 비용 없음)
   ③ 새 에이전트 세션 시작 (이전 대화 기억 없이 독립 실행)
      프롬프트 = [②의 수집 결과] + [cron 지시문] + [morning-briefing 스킬]
   ④ LLM(Claude)이 기사 선별·요약. 부족하면 web_search/web_extract로 보충
   ⑤ 결과를 telegram:<내 채팅ID>로 전송 ───────┘  → 📱 휴대폰 알림
   ⑥ 실행 기록은 data/cron/output/ 에 저장
```

| 구성 요소 | 파일 | 역할 |
|---|---|---|
| 컨테이너 정의 | `docker-compose.yml` | Hermes 공식 이미지 실행, `./data`를 `/opt/data`에 연결 |
| 비밀키/설정 | `.env` → `data/.env` | LLM 키, 텔레그램 토큰, 시간대, 브리핑 시각 |
| 수집 스크립트 | `scripts/fetch_news.py` → `data/scripts/` | 뉴스 헤드라인 수집 (표준 라이브러리만 사용) |
| 스킬 | `skills/morning-briefing/SKILL.md` → `data/skills/research/` | 선별 기준·출력 형식 지침 |
| 설치 스크립트 | `setup.sh` / `setup.ps1` | 파일 복사 → 컨테이너 실행 → 모델 설정 → cron 등록 |

---

## 2. Docker면 어느 컴퓨터에서나 되나요?

**됩니다.** Windows, Mac(Intel/Apple Silicon), Linux, 클라우드 VPS 모두 같은 파일로 동작합니다(이미지가 amd64/arm64 지원).
다만 조건이 있습니다.

- **컴퓨터가 브리핑 시각에 켜져 있어야 합니다.** 절전/종료 상태면 그 시각에는 실행되지 않고,
  다시 켜진 뒤 스케줄러가 밀린 작업을 처리합니다. 매일 정확한 시각에 받으려면
  **항상 켜진 기기**(미니PC, 사무실 서버, 월 5천~1만 원대 VPS)를 권장합니다.
- Docker Desktop(Windows/Mac)은 **로그인 시 자동 시작**을 켜 두세요. 그러면 `restart: unless-stopped`로 컨테이너도 자동으로 올라옵니다.
- **컴퓨터 이전:** 이 `hermes-briefing` 폴더 전체(`data/` 포함)를 복사한 뒤 새 컴퓨터에서 `setup` 스크립트를 한 번 실행하면 됩니다.
- ⚠️ **같은 텔레그램 봇으로 두 대를 동시에 켜면 충돌**합니다. 한 대에서만 실행하세요.

---

## 3. 설치 절차 (처음 한 번, 약 15분)

### Step 1. Docker 설치
- Windows/Mac: [Docker Desktop](https://docs.docker.com/desktop/) 설치 → 실행 → Settings에서 *Start when you sign in* 켜기
- Linux/VPS: `curl -fsSL https://get.docker.com | sh`

### Step 2. 텔레그램 봇 만들기
1. 텔레그램에서 **@BotFather** 검색 → `/newbot` → 이름 입력 → `..._bot`으로 끝나는 아이디 입력
2. 받은 토큰(`123456789:ABC...`)을 복사합니다. **남에게 노출하지 마세요.**
3. **@userinfobot**에게 아무 메시지나 보내 내 숫자 ID(예: `987654321`)를 확인합니다.
4. 방금 만든 **내 봇을 검색해서 `/start`를 한 번 보냅니다.** 이렇게 해야 봇이 나에게 메시지를 보낼 수 있습니다.

### Step 3. LLM API 키 준비 (둘 중 하나)
- **Anthropic**: https://console.anthropic.com → API Keys → 키 생성 (사용한 만큼 과금)
- **OpenRouter**: https://openrouter.ai/keys → 여러 회사 모델을 키 하나로 사용

> 참고: Claude Pro 구독으로는 Hermes를 쓸 수 없고 **API 키**가 필요합니다.
> 하루 한 번 브리핑이면 Sonnet 기준 한 달 대략 몇 달러 수준입니다(검색 보충 횟수에 따라 달라짐).

### Step 4. 이 폴더 받기
```bash
git clone https://github.com/sure79/works.git
cd works/hermes-briefing
```

### Step 5. `.env` 채우기
```bash
cp .env.example .env      # Windows: copy .env.example .env
```
`.env`를 열어 채웁니다.
```ini
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_ALLOWED_USERS=987654321
TELEGRAM_HOME_CHANNEL=987654321
HERMES_TIMEZONE=Asia/Seoul
BRIEFING_CRON="0 7 * * *"     # 매일 07:00
```

### Step 6. 설치 스크립트 실행
```bash
./setup.sh                                               # Mac / Linux
powershell -ExecutionPolicy Bypass -File .\setup.ps1     # Windows
```
스크립트가 하는 일:
1. `.env`, 수집 스크립트, 스킬을 `data/`(Hermes 홈 폴더)에 복사
2. `nousresearch/hermes-agent` 이미지를 받아 `hermes` 컨테이너 실행 (`gateway run`)
3. `hermes config set`으로 모델·시간대 설정
4. `hermes cron create`로 `morning-briefing` 작업 등록 (이미 있으면 `cron edit`로 갱신)

### Step 7. 바로 테스트
```bash
docker exec hermes hermes cron run morning-briefing
```
1~2분 안에 텔레그램으로 브리핑이 오면 성공입니다. 내일부터는 자동으로 옵니다.

---

## 4. 운영 명령어 모음

| 하고 싶은 일 | 명령 |
|---|---|
| 작업 목록/다음 실행 시각 | `docker exec hermes hermes cron list` |
| 지금 즉시 실행 | `docker exec hermes hermes cron run morning-briefing` |
| 일시 중지 / 재개 | `docker exec hermes hermes cron pause morning-briefing` / `resume` |
| 시각 변경 | `.env`의 `BRIEFING_CRON` 수정 → `setup` 다시 실행 |
| 스케줄러 상태 점검 | `docker exec hermes hermes cron status` · `hermes cron doctor` |
| 로그 | `docker compose logs -f hermes` |
| 지난 브리핑 원문 | `data/cron/output/<job_id>/` 폴더 |
| 중지 / 시작 | `docker compose down` / `docker compose up -d` |
| Hermes 업데이트 | `docker compose pull && docker compose up -d` |

텔레그램에서 봇에게 직접 말로 시켜도 됩니다.
- `/cron list`
- "브리핑에 수소연료전지 선박도 추가해줘"
- "내일부터 6시 반에 보내줘"

## 5. 커스터마이징
- **검색 분야/키워드**: `scripts/fetch_news.py`의 `TOPICS` 수정 → `setup` 재실행
- **요약 스타일/분량**: `skills/morning-briefing/SKILL.md` 수정 → `setup` 재실행
- **모델 변경**: `.env`에 `BRIEFING_MODEL=claude-haiku-4-5`처럼 지정 (Anthropic 키 기준. 더 저렴함)

## 6. 문제 해결
| 증상 | 확인할 것 |
|---|---|
| 텔레그램이 안 옴 | 봇에게 `/start`를 보냈는지, `TELEGRAM_HOME_CHANNEL`이 숫자 ID인지 확인 |
| `Provider authentication failed` | `.env`의 API 키 확인 → `setup` 재실행 |
| 시각이 9시간 어긋남 | `HERMES_TIMEZONE=Asia/Seoul`인지 확인 |
| 기사가 비어 있음 | `data/cron/output`에서 "수집 오류" 확인 (회사망에서 news.google.com이 차단됐는지) |
