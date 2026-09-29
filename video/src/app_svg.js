const clone=x=>JSON.parse(JSON.stringify(x));
function treeSVG(i){
  const soil = `<ellipse class="t-soil" cx="60" cy="102" rx="48" ry="6"/>`;
  if(i === 0) return soil + `<ellipse class="t-seed" cx="60" cy="97" rx="6" ry="4"/>`;
  const leaf = ([x,y,r]) => `<ellipse class="t-leaf" cx="${x}" cy="${y}" rx="8" ry="4" transform="rotate(${r} ${x} ${y})"/>`;
  if(i === 1) return soil + `<rect class="t-stem" x="59" y="84" width="2.5" height="16" rx="1"/>` + [[53,84,-20],[67,82,20]].map(leaf).join("");
  if(i === 2) return soil + `<rect class="t-stem" x="58.5" y="60" width="3" height="40" rx="1.5"/>` + [[51,82,-20],[69,78,20],[52,68,-25],[68,64,25],[60,56,0]].map(leaf).join("");
  const T = {
    3:[57,64,6,38,[[60,56,15],[48,63,10],[72,63,10]]],
    4:[56,56,8,46,[[60,42,19],[43,54,13],[77,54,13],[51,32,12],[69,32,12]]],
    5:[55,52,10,50,[[60,36,22],[39,50,15],[81,50,15],[47,24,14],[73,24,14],[60,16,12]]]
  }[i];
  let out = soil + `<rect class="t-trunk" x="${T[0]}" y="${T[1]}" width="${T[2]}" height="${T[3]}" rx="2"/>` +
    T[4].map(([x,y,r]) => `<circle class="t-canopy" cx="${x}" cy="${y}" r="${r}"/>`).join("");
  if(i === 5) out += [[48,46],[70,40],[62,56],[80,52],[44,32],[66,24]].map(([x,y]) => `<circle class="t-fruit" cx="${x}" cy="${y}" r="3"/>`).join("");
  return out;
}

const ICONS = {
  sun:`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  flag:`<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>`,
  cards:`<rect x="4" y="7" width="12" height="14" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/>`,
  calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>`,
  gift:`<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18M12 9v12M12 9C10 5 6 5 6 7.5S10 9 12 9c2 0 6 1 6-1.5S14 5 12 9"/>`,
  more:`<circle class="fill" cx="5" cy="12" r="1.7"/><circle class="fill" cx="12" cy="12" r="1.7"/><circle class="fill" cx="19" cy="12" r="1.7"/>`,
  flame:`<path d="M12 3c1 4 5 5.5 5 10.5a5 5 0 0 1-10 0c0-3 1.5-4.5 2-6.5 1.5 1 2.5 2.5 2.5 2.5s1.5-3 .5-6.5z"/>`,
  star:`<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>`,
  leaf:`<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14zM5 19l7-7"/>`,
  timer:`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>`,
  trophy:`<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M9 17h6"/>`,
  lock:`<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  check:`<path d="M5 12.5l4.5 4.5L19 7.5"/>`
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const MOODNAME = {happy:"기분 좋음", cheer:"신남", sleepy:"졸림", focus:"집중", worried:"걱정"};
function mascotSVG(stage, mood){
  const leaf = ([x,y,rx,ry,r]) => `<ellipse class="m-leaf" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})"/>`;
  let top;
  if(stage === 0) top = `<circle class="m-leaf" cx="50" cy="27" r="4.5"/>`;
  else {
    const L = stage >= 3 ? [[39,18,12,5.5,-28],[61,16,12,5.5,28]] : [[41,19,9,4.5,-30],[59,17,9,4.5,30]];
    if(stage >= 2) L.push([50,11,6,3.5,-90]);
    if(stage >= 5) L.push([33,26,8,4,-55],[67,24,8,4,55]);
    top = `<rect class="m-stem" x="48.8" y="17" width="2.4" height="15" rx="1.2"/>` + L.map(leaf).join("");
    if(stage >= 4) top += [0,72,144,216,288].map(r => `<ellipse class="m-petal" cx="50" cy="4" rx="2.4" ry="3.6" transform="rotate(${r} 50 9)"/>`).join("") + `<circle class="m-flower" cx="50" cy="9" r="2.8"/>`;
  }
  const arms = mood === "cheer"
    ? `<ellipse class="m-arm" cx="16" cy="54" rx="5" ry="9" transform="rotate(-35 16 54)"/><ellipse class="m-arm" cx="84" cy="54" rx="5" ry="9" transform="rotate(35 84 54)"/>`
    : `<ellipse class="m-arm" cx="15" cy="75" rx="5" ry="8" transform="rotate(20 15 75)"/><ellipse class="m-arm" cx="85" cy="75" rx="5" ry="8" transform="rotate(-20 85 75)"/>`;
  const eye = x => `<ellipse class="m-ink" cx="${x}" cy="62" rx="4.2" ry="5.2"/><circle class="m-shine" cx="${x+1.4}" cy="60" r="1.5"/>`;
  const open = `<g class="m-eyes">${eye(38)}${eye(62)}</g>`;
  const star = (x,y) => `<path class="m-spark" d="M${x} ${y-6}L${x+1.6} ${y-1.6}L${x+6} ${y}L${x+1.6} ${y+1.6}L${x} ${y+6}L${x-1.6} ${y+1.6}L${x-6} ${y}L${x-1.6} ${y-1.6}Z"/>`;
  let eyes = open, mouth = `<path class="m-line" d="M43 73 Q50 80 57 73"/>`, extra = "";
  if(mood === "cheer"){
    eyes = `<path class="m-line" d="M33 64 Q38 57 43 64"/><path class="m-line" d="M57 64 Q62 57 67 64"/>`;
    mouth = `<path class="m-ink" d="M42 72 Q50 86 58 72 Z"/>`;
    extra = star(12,34) + star(90,40) + star(20,96);
  } else if(mood === "sleepy"){
    eyes = `<path class="m-line" d="M33 63 Q38 66 43 63"/><path class="m-line" d="M57 63 Q62 66 67 63"/>`;
    mouth = `<ellipse class="m-ink" cx="50" cy="76" rx="2.6" ry="3"/>`;
    extra = `<text class="m-z" x="76" y="34">z</text><text class="m-z m-z2" x="84" y="24">z</text>`;
  } else if(mood === "focus"){
    eyes = open + `<path class="m-line" d="M32 53 L43 56"/><path class="m-line" d="M68 53 L57 56"/>`;
    mouth = `<path class="m-line" d="M45 76 L55 76"/>`;
  } else if(mood === "worried"){
    eyes = open + `<path class="m-line" d="M32 55 L43 52"/><path class="m-line" d="M68 55 L57 52"/>`;
    mouth = `<path class="m-line" d="M44 78 Q47 75 50 78 Q53 81 56 78"/>`;
  }
  return `<svg viewBox="0 0 100 112" class="mascot ${mood}" role="img" aria-label="싹이 (${MOODNAME[mood] || ""})">
    <ellipse class="m-shadow" cx="50" cy="108" rx="26" ry="3.5"/>
    <g class="m-bob">
      <ellipse class="m-foot" cx="38" cy="103" rx="9" ry="4.5"/><ellipse class="m-foot" cx="62" cy="103" rx="9" ry="4.5"/>
      ${arms}
      <path class="m-body" d="M50 31 C75 31 86 50 86 70 C86 93 70 104 50 104 C30 104 14 93 14 70 C14 50 25 31 50 31 Z"/>
      <ellipse class="m-hi" cx="40" cy="48" rx="10" ry="6" transform="rotate(-20 40 48)"/>
      <g class="m-leaves">${top}</g>
      ${eyes}${mouth}
      <ellipse class="m-cheek" cx="29" cy="71" rx="5.5" ry="3.2"/><ellipse class="m-cheek" cx="71" cy="71" rx="5.5" ry="3.2"/>
      ${extra}
    </g></svg>`;
}
