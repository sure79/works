#!/usr/bin/env python3
"""매일 아침 브리핑용 뉴스 수집 스크립트 (Hermes cron --script 로 실행).

Google News RSS에서 분야별 최신 기사 헤드라인을 모아 Markdown으로 출력한다.
Hermes는 이 stdout을 에이전트 프롬프트에 붙여 넣고, 에이전트가 요약·정리한다.
표준 라이브러리만 사용하므로 Hermes 컨테이너 안에서 추가 설치 없이 동작한다.
"""

from __future__ import annotations

import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

# 분야별 검색어. (검색어, 언어) — 언어는 "ko" 또는 "en"
TOPICS: dict[str, list[tuple[str, str]]] = {
    "선박 전장": [
        ("선박 전기추진", "ko"),
        ("친환경 선박 배터리", "ko"),
        ("조선 전장 배전반", "ko"),
        ("marine electric propulsion vessel", "en"),
        ("ship battery hybrid electrification", "en"),
    ],
    "배터리": [
        ("배터리 ESS", "ko"),
        ("LFP 배터리 리튬인산철", "ko"),
        ("전고체 배터리", "ko"),
        ("battery energy storage LFP", "en"),
    ],
    "AI": [
        ("생성형 AI", "ko"),
        ("AI 에이전트", "ko"),
        ("LLM AI model release", "en"),
        ("AI agent", "en"),
    ],
}

LOOKBACK_HOURS = 36      # 이 시간 이내에 발행된 기사만 사용
MAX_PER_TOPIC = 12       # 분야별 최대 기사 수
TIMEOUT = 20

LANG_PARAMS = {
    "ko": {"hl": "ko", "gl": "KR", "ceid": "KR:ko"},
    "en": {"hl": "en-US", "gl": "US", "ceid": "US:en"},
}


def fetch_rss(query: str, lang: str) -> list[dict]:
    params = {"q": f"{query} when:2d", **LANG_PARAMS[lang]}
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (hermes-briefing)"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        root = ET.fromstring(resp.read())

    items = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        source = (item.findtext("source") or "").strip()
        try:
            published = parsedate_to_datetime(item.findtext("pubDate") or "")
        except (TypeError, ValueError):
            continue
        if title and link:
            items.append({"title": title, "link": link, "source": source, "published": published})
    return items


def normalize(title: str) -> str:
    # Google News 제목 끝의 " - 언론사" 를 떼고 비교용 키로 사용
    return title.rsplit(" - ", 1)[0].strip().lower()


def main() -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
    kst = timezone(timedelta(hours=9))
    print(f"# 뉴스 수집 결과 ({datetime.now(kst):%Y-%m-%d %H:%M} KST, 최근 {LOOKBACK_HOURS}시간)\n")

    seen: set[str] = set()
    errors = []
    for topic, queries in TOPICS.items():
        collected = []
        for query, lang in queries:
            try:
                for it in fetch_rss(query, lang):
                    key = normalize(it["title"])
                    if it["published"] < cutoff or key in seen:
                        continue
                    seen.add(key)
                    collected.append(it)
            except Exception as exc:  # 한 검색어가 실패해도 나머지는 계속
                errors.append(f"{query}: {exc}")

        collected.sort(key=lambda it: it["published"], reverse=True)
        print(f"## {topic}")
        if not collected:
            print("- (최근 기사 없음)\n")
            continue
        for it in collected[:MAX_PER_TOPIC]:
            when = it["published"].astimezone(kst).strftime("%m-%d %H:%M")
            src = f" | {it['source']}" if it["source"] else ""
            print(f"- [{when}{src}] {it['title']}\n  {it['link']}")
        print()

    if errors:
        print("## 수집 오류")
        for e in errors:
            print(f"- {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
