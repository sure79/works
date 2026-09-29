import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = '../shots';
const NOW = new Date(2026, 8, 29, 10, 30, 0);
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10) };
const d = n => { const x = new Date(NOW); x.setHours(0,0,0,0); x.setDate(x.getDate() - n); return iso(x) };
const id = () => Math.random().toString(36).slice(2, 10);

function seed({ review = false, focus = null } = {}) {
  const sessions = [
    [9,'컷 편집 기초 유튜브 따라 하기',25,'자르기 단축키 익힘'],[8,'소스 폴더 정리',25,'촬영본 42개 분류 끝'],[7,'오프닝 구성 스케치',5,'첫 3초 아이디어 메모'],
    [6,'컷 전환 연습',25,'컷 전환 3가지 만들어 봄'],[5,'컷 편집 초안 1분',50,'1분 분량 초안 완성'],[4,'초안 다듬기',25,'군더더기 컷 삭제'],
    [3,'자막 스타일 실험',25,'자막 두 가지 비교'],[2,'배경 음악 후보 고르기',5,'후보 5곡 추림'],[1,'컷 편집 2분 구간',25,'2분 구간 이어 붙임'],
    [0,'오프닝 컷 3개 이어 붙이기',25,'오프닝 컷 3개 이어 붙임'],
  ].map(([n,goal,planned,win]) => ({ id:id(), date:d(n), minutes:planned, planned, goal, msId:null, win, resume:'다음은 엔딩 자막', full:true }));
  const ms = [
    { id:id(), text:'촬영 소스 정리하기', cue:'평일 밤 9시, 식탁에서', done:true, doneDate:d(8), rewarded:true },
    { id:id(), text:'컷 편집 초안 만들기', cue:'주말 오전, 서재에서', done:true, doneDate:d(4), rewarded:true },
    { id:id(), text:'자막과 음악 넣기', cue:'평일 밤 9시, 식탁에서', done:false },
    { id:id(), text:'친구 3명에게 보여 주기', cue:'토요일 오후, 카페에서', done:false },
  ];
  const checkins = [
    { id:id(), week:1, date:d(13), did:'촬영본 정리와 편집 프로그램 기본기 익히기', stuck:'stayed', solo:'튜토리얼 없이 컷 자르기', gap:'컷 전환 타이밍', mix:true, rest:true, q1:'회사 보고서 구성과 영상 흐름이 닮았다', q2:'영화는 첫 3초에 시선을 잡는다', exp:'오프닝을 두 버전으로 만들어 비교', res:'' },
    { id:id(), week:2, date:d(6), did:'컷 편집 초안 1분 완성', stuck:'none', solo:'자막 없이 초안 끝까지', gap:'', mix:false, rest:true, q1:'', q2:'', exp:'', res:'두 번째 버전이 더 잘 보임' },
  ];
  const cardBase = (prompt, tag, notes, due, revs) => ({ id:id(), prompt, notes, tag, conn:'', principle:'', change:'', created:d(8), due, step: revs.length, reviews: revs.map((r,i)=>({date:d(7-i*2), r})), fromCheckin:null });
  const cards = [
    cardBase('빈 화면에서 컷 전환 3가지 만들어 보기','편집 기술','디졸브, 점프 컷, 매치 컷. 감정 흐름에 맞춰 고른다.', d(0), ['ok']),
    cardBase('영상 첫 3초에 시청자를 붙잡는 방법 설명하기','구성','질문·결과 먼저 보여 주기·큰 소리. 배경 설명은 뒤로.', d(0), ['hard']),
    cardBase('자막 글자 크기와 위치의 기준 말하기','편집 기술','모바일 기준 하단 1/5, 한 줄 15자 이내.', d(0), []),
    cardBase('배경 음악 볼륨을 대사 아래로 낮추는 순서','소리','대사 트랙 기준 -18dB, 음악은 -30dB.', d(3), ['easy','ok']),
    cardBase('색 보정 3단계 순서 말하기','색','노출, 화이트밸런스, 채도 순서.', d(5), ['easy','easy']),
  ];
  if (review) cards[0].reviews.push({ date:d(0), r:'ok' });
  const s = { id:id(), title:'영상 편집', deliverable:'우리 동네 브이로그 3분짜리 1편', doneWhen:'유튜브에 올리고 친구 5명이 끝까지 본다', audience:'친구와 가족 10명', start:d(20), weeks:8,
    woop:{ outcome:'친구들이 웃으며 끝까지 보는 장면', obstacle:'결과물이 초라해 보이면 다른 취미로 도망가고 싶어진다', plan:'만약 새 분야가 끌리면, 나중 목록에 적고 5분만 편집한다' },
    milestones:ms, supports:[{id:id(),name:'AI 활용',role:'자막 초안 자동 생성'},{id:id(),name:'음악 공부',role:'분위기에 맞는 배경 음악 고르기'}], checkins, sessions };
  return { v:4, season:s, focus, later:[{ id:id(), title:'기타 코드 익히기', why:'편집하다 지루해서 떠오름', output:'노래 1곡 연주', avoid:true, date:d(2) },{ id:id(), title:'사진 보정 배우기', why:'색 보정이 재밌어서', output:'', avoid:false, date:d(5) }],
    pitch:{who:'',problem:'',combo:''}, archive:[], cards, rewards:[{id:id(),text:'좋아하는 카페 디저트',tier:'small'},{id:id(),text:'영화 한 편 보기',tier:'small'},{id:id(),text:'하루 여행',tier:'big'}],
    earned:[{id:id(),text:'좋아하는 카페 디저트',tier:'small',date:d(8),reason:'단계 완료',used:true},{id:id(),text:'영화 한 편 보기',tier:'small',date:d(4),reason:'단계 완료',used:false}],
    bundle:'좋아하는 플레이리스트는 집중 세션 중에만', chests:[d(3)], badges:{}, seenLevel:null };
}

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const FONT = `:root{--display:"NanumMyeongjo",serif !important;--body:"NanumGothic",sans-serif !important;--mono:"DejaVu Sans Mono",monospace !important}body{font-family:"NanumGothic",sans-serif !important}`;

async function open(state, name) {
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(s => { localStorage.setItem('season-app', JSON.stringify(s)); localStorage.setItem('season-tab','today'); }, state);
  await page.goto('file://' + process.cwd() + '/app.html');
  await page.addStyleTag({ content: FONT });
  await page.waitForSelector('.hud');
  await page.waitForTimeout(500);
  return { ctx, page };
}
const RECTS = {};
const TARGETS = {
  today_panel:{scene:'.scene',quests:'.qlist',tiles:'.tiles',focus:'#focus-card',qhead:'.season-head'},
  season_panel:{head:'article.card',weeks:'.weeks',facts:'.facts',woop:'article.card:nth-of-type(2)',steps:'article.card:nth-of-type(3)'},
  recall_panel:{due:'article.card',add:'#card-add'},
  recall_q:{prompt:'.prompt',attempt:'#attempt',btn:'[data-act=reveal]'},
  recall_a:{answer:'.answer',rate:'.rate'},
  checkin_panel:{form:'#checkin',q1:'#c-q1',past:'.entry'},
  focus_panel:{ring:'.ring-wrap',park:'#focus-park',end:'#focus-end'},
  chest_panel:{chest:'.chest-ready',quests:'.qlist'},
  reward_panel:{badges:'.badges',rules:'details.more',list:'ul.list'},
  more_panel:{note:'.note',form:'#later-add'},
};
const snapEl = async (page, sel, file) => {
  const el = await page.$(sel);
  if (sel === '#panel' && TARGETS[file]) RECTS[file] = await page.evaluate(t => { const P = document.querySelector('#panel').getBoundingClientRect(), o = { _w:P.width, _h:P.height }; for (const [k,q] of Object.entries(t)) { const e = document.querySelector('#panel ' + q); if (e) { const r = e.getBoundingClientRect(); o[k] = { x:r.left-P.left, y:r.top-P.top, w:r.width, h:r.height } } } return o }, TARGETS[file]);
  if (sel === '#panel') await page.addStyleTag({ content: 'nav.tabs{visibility:hidden !important}.hud{visibility:hidden !important}' }).then(h => h.evaluate(n => n.id = 'hidecss'));
  await el.screenshot({ path: `${OUT}/${file}.png` });
  if (sel === '#panel') await page.evaluate(() => document.getElementById('hidecss')?.remove());
};
async function capTab(page, tab, prefix) {
  await page.click(`[data-tab="${tab}"]`); await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0,0)); await snapEl(page, '.hud', `${prefix}_hud`);
  await snapEl(page, 'nav.tabs', `${prefix}_tabs`);
  await snapEl(page, '#panel', `${prefix}_panel`);
}

// 1) main state
{
  const { ctx, page } = await open(seed(), 'main');
  await capTab(page, 'today', 'today');
  await capTab(page, 'season', 'season');
  await capTab(page, 'recall', 'recall');
  // recall session
  await page.click('[data-act="sess-start"]'); await page.waitForTimeout(300);
  await page.fill('#attempt', '디졸브, 점프 컷…').catch(()=>{});
  await snapEl(page, '#panel', 'recall_q');
  await page.click('[data-act="reveal"]'); await page.waitForTimeout(300);
  await snapEl(page, '#panel', 'recall_a');
  await page.click('[data-act="sess-stop"]').catch(()=>{});
  await capTab(page, 'checkin', 'checkin');
  await capTab(page, 'reward', 'reward');
  await page.click('[data-tab="more"]'); await page.waitForTimeout(300);
  await page.click('[data-sub="later"]').catch(()=>{}); await page.waitForTimeout(200);
  await snapEl(page, 'nav.tabs', 'more_tabs'); await snapEl(page, '#panel', 'more_panel'); await snapEl(page, '.hud', 'more_hud');
  await ctx.close();
}
// 2) focus running
{
  const { ctx, page } = await open(seed({ focus:{ start: NOW.getTime() - 7*60000, minutes:25, goal:'엔딩 자막 3줄 쓰기', msId:null } }), 'focus');
  await page.click('[data-tab="today"]'); await page.waitForTimeout(300);
  await snapEl(page, '.hud', 'focus_hud'); await snapEl(page, 'nav.tabs', 'focus_tabs'); await snapEl(page, '#panel', 'focus_panel');
  await ctx.close();
}
// 3) chest ready + overlay
{
  const { ctx, page } = await open(seed({ review:true }), 'chest');
  await page.click('[data-tab="today"]'); await page.waitForTimeout(300);
  await snapEl(page, '.hud', 'chest_hud'); await snapEl(page, 'nav.tabs', 'chest_tabs'); await snapEl(page, '#panel', 'chest_panel');
  await page.click('[data-act="chest"]', { force:true }); await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/chest_overlay.png` });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + '/rects.json', JSON.stringify(RECTS, null, 1));
console.log(fs.readdirSync(OUT).join('\n'));
