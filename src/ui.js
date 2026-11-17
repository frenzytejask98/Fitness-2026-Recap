/* ================= render + navigation ================= */
const $=id=>document.getElementById(id);
/* public visitors get a clean toolbar. Add ?studio to the address to see profile, template and the fact catalog */
const STUDIO=/[?&]studio\b/.test(location.search); if(!STUDIO)document.body.classList.add('pub');
const track=$('track'), stage=$('stage'), prog=$('prog'), catEl=$('cat');
let P=PROFILES[0], M=null, DECK=[], over={}, idx=0, mode='cards';
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function cardHTML(o,i,n){
  const attr=o.count?` data-n="${o.count.n}" data-dec="${o.count.dec}" data-pre="${o.count.pre}" data-suf="${o.count.suf}"`:'';
  const kick=o.num?`${pad(o.num)} ${o.title}`:o.title;
  return `<article class="card k${i%6+1}" data-i="${i}" aria-label="${o.title}"><div class="inner"><div class="kick">${kick}</div><div class="main">${o.viz||''}${o.big?`<div class="big ${o.bigCls||''}"${attr}>${o.big}</div>`:''}${o.unit?`<div class="unit">${o.unit}</div>`:''}${o.head?`<h2>${o.head}</h2>`:''}${o.body?`<p class="txt">${o.body}</p>`:''}${o.extra||''}${o.quirk||''}</div><div class="foot"><span>2026 IN MOTION</span><span>${pad(i+1)}/${pad(n)}</span></div>${o.confetti?'<div class="conf"></div>':''}</div></article>`;
}
function render(){
  track.innerHTML=DECK.map((o,i)=>cardHTML(o,i,DECK.length)).join('');
  prog.innerHTML=DECK.map(()=>'<i></i>').join('');
  requestAnimationFrame(fitBig);
}
function fitBig(){
  document.querySelectorAll('.big:not(.xs)').forEach(el=>{
    const card=el.closest('.card'), cw=card.clientWidth/100; if(!cw)return;
    el.style.fontSize=''; let guard=0;
    while(el.scrollWidth>el.clientWidth+1&&guard<40){const px=parseFloat(getComputedStyle(el).fontSize);el.style.fontSize=(px*.94/cw).toFixed(2)+'cqw';guard++}
  });
}
function countUp(card){
  if(reduce)return;
  card.querySelectorAll('[data-n]').forEach(el=>{
    const n=+el.dataset.n,dec=+el.dataset.dec||0,pre=el.dataset.pre||'',suf=el.dataset.suf||'';let t0=null;
    const fmt=v=>pre+(dec?v.toFixed(dec):nf.format(Math.round(v)))+suf;
    const step=t=>{if(t0===null)t0=t;const k=Math.max(0,Math.min(1,(t-t0)/1100)),e=1-Math.pow(1-k,3);el.textContent=fmt(n*e);if(k<1&&card.classList.contains('active'))requestAnimationFrame(step);else el.textContent=fmt(n)};
    requestAnimationFrame(step);
  });
}
function confetti(card){
  const box=card.querySelector('.conf'); if(!box||reduce)return; box.innerHTML='';
  const cols=['var(--hi)','var(--fg)','#FFE68A','#FF5A3C','#AEB7FF','#7EE3D0'];
  for(let k=0;k<54;k++){const i=document.createElement('i');i.style.left=(Math.random()*100)+'%';i.style.background=cols[k%cols.length];i.style.setProperty('--x',(Math.random()*30-15)+'cqw');i.style.setProperty('--r',(Math.random()*720-360)+'deg');i.style.setProperty('--t',(1.8+Math.random()*1.4)+'s');i.style.animationDelay=(Math.random()*.5)+'s';box.appendChild(i)}
  setTimeout(()=>{box.innerHTML=''},4200);
}
function go(n){
  idx=Math.max(0,Math.min(DECK.length-1,n));
  track.style.transform=`translateX(${-idx*100}%)`;
  [...prog.children].forEach((b,k)=>b.classList.toggle('on',k<=idx));
  const cards=[...track.children];
  cards.forEach(c=>c.classList.remove('active'));
  const c=cards[idx]; if(!c)return;
  void c.offsetWidth; c.classList.add('active');
  stage.style.setProperty('--pfg',getComputedStyle(c).color);
  countUp(c); confetti(c);
}
function setMode(m){
  mode=m; document.body.classList.toggle('grid',m==='grid'); document.body.classList.toggle('cat-on',m==='cat');
  $('btnCards').classList.toggle('on',m==='cards');$('btnGrid').classList.toggle('on',m==='grid');$('btnCat').classList.toggle('on',m==='cat');
  if(m==='cards')go(idx); else [...track.children].forEach(c=>c.classList.remove('active'));
  requestAnimationFrame(fitBig);
}
let sx=null;
stage.addEventListener('pointerdown',e=>{sx=e.clientX});
stage.addEventListener('pointerup',e=>{
  if(sx===null)return; const dx=e.clientX-sx; sx=null;
  if(mode==='grid'){const c=e.target.closest('.card');if(c){idx=+c.dataset.i;setMode('cards')}return}
  if(Math.abs(dx)>40){go(idx+(dx<0?1:-1));return}
  const r=stage.getBoundingClientRect(); go(e.clientX-r.left<r.width*.35?idx-1:idx+1);
});
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='SELECT'||mode==='cat')return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '){e.preventDefault();go(idx+1)}
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();go(idx-1)}
  else if(e.key==='g'||e.key==='G')setMode(mode==='grid'?'cards':'grid');
});
$('btnCards').onclick=()=>setMode('cards');
$('btnGrid').onclick=()=>setMode(mode==='grid'?'cards':'grid');
$('btnCat').onclick=()=>setMode(mode==='cat'?'cards':'cat');
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(fitBig,120)});
if(document.fonts){document.fonts.ready.then(()=>requestAnimationFrame(fitBig));document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',()=>requestAnimationFrame(fitBig))}

/* ================= catalog view ================= */
const strip=h=>h.replace(/<[^>]+>/g,'');
const valTxt=row=>{if(!row.allowed)return 'n/a';const r=row.r;switch(row.f.kind){case 'x':return X(r)+'×';case 'n':return nf.format(r);case 'pct':return r.toFixed(1)+'%';case 'min':return Math.round(r)+'';default:return 'always'}};
const whyNot=row=>{if(!row.allowed)return 'Not for this profile';const r=row.r,k=row.f.kind;if(k==='x')return r<.9?'Too small':'Too big';if(k==='n')return r<30?'Too small':'Too big';if(k==='pct')return r<3?'Under 3%':'Too big';if(k==='min')return r<3?'Too small':'Too big';return 'Skipped'};
function renderCat(){
  const slots=Object.keys(SLOT_INFO); let elig=0; slots.forEach(s=>{if(LAST[s])elig+=LAST[s].ev.rows.filter(r=>r.fit>0).length});
  const themes=[['t-bold','Bold','Anybody, saturated colour blocks, ring pattern.'],['t-night','Night','Dela Gothic One on deep tones, one glowing accent each.'],['t-sun','Sunrise','Gloock serif on soft gradients.'],['t-receipt','Receipt','Azeret Mono on thermal paper, dashed rules.']];
  let h=`<h1>Fact catalog</h1><p>Every card picks its comparison from this list. The picker only uses facts that are true and impressive for the person, so a cyclist, a hiker and a beginner each get different lines.</p>
  <div class="stats"><span class="pill hot">${FACTS.length} facts</span><span class="pill">${TYPES.length} archetypes</span><span class="pill">${GOALS.length} goal ideas</span><span class="pill">${elig} eligible for ${P.name}</span><span class="pill">${DECK.length} cards in this deck</span></div>
  <div class="how"><div><b>1 Fit</b><span>Each fact turns a number into a score. A multiple between 1.5× and 25× scores best. Anything under 0.9× is dropped.</span></div><div><b>2 Variety</b><span>If a theme is already in the deck, such as geography, a later fact from it loses 40%.</span></div><div><b>3 Personal jitter</b><span>A small stable offset per person breaks ties, so two similar people still get different lines.</span></div><div><b>4 Your override</b><span>Press Use on any eligible fact to lock it into the card. Press Auto to let the picker choose again.</span></div></div>`;
  slots.forEach(s=>{
    const L=LAST[s]; if(!L)return; const info=SLOT_INFO[s], pickedId=L.ev.best&&L.ev.best.f.id;
    const rows=L.ev.rows.slice().sort((a,b)=>(b.f.id===pickedId)-(a.f.id===pickedId)||b.score-a.score||b.fit-a.fit);
    const nOk=rows.filter(r=>r.fit>0).length;
    h+=`<section class="slot"><header><h3>${info[0]}</h3><span>${rows.length} facts, ${nOk} eligible${L.shown?'':', card hidden for this profile'}${over[s]?'':''}</span>${over[s]?`<button class="use" data-auto="${s}" type="button">Auto</button>`:''}</header><p>${info[1]}</p><div class="tw-x"><table><thead><tr><th>Fact</th><th>Theme</th><th>Rule</th><th>Value</th><th>Status</th></tr></thead><tbody>`;
    rows.forEach(r=>{const picked=r.f.id===pickedId&&L.shown;
      const st=picked?`<span class="st pick">${over[s]===r.f.id?'Locked in':'In your deck'}</span>`:r.fit>0?`<span class="st ok">Eligible ${r.score.toFixed(2)}</span> <button class="use" data-slot="${s}" data-id="${r.f.id}" type="button">Use</button>`:`<span class="st">${whyNot(r)}</span>`;
      h+=`<tr class="${picked?'picked':r.fit>0?'':'skip'}"><td>${r.f.name}</td><td><span class="tag">${r.f.theme}</span></td><td class="m">${r.f.rule}</td><td class="m">${valTxt(r)}</td><td>${st}</td></tr>`});
    h+=`</tbody></table></div></section>`;
  });
  h+=`<section class="slot"><header><h3>Archetypes</h3><span>${TYPES.length} types, highest score wins</span></header><p>Scored from the person's own data. The winner gets the 2026 type card, the runner-up is named under it.</p><div class="tw-x"><table><thead><tr><th>Type</th><th>Score</th><th>Why, for this profile</th><th>Status</th></tr></thead><tbody>${LAST.types.map((t,i)=>`<tr class="${i===0?'picked':''}"><td>${t.t}</td><td class="m">${Math.round(t.sc*100)}</td><td class="m">${strip(t.why(M))}</td><td>${i===0?'<span class="st pick">Your type</span>':i===1?'<span class="st ok">Runner-up</span>':''}</td></tr>`).join('')}</tbody></table></div></section>`;
  h+=`<section class="slot"><header><h3>Goal ideas for 2027</h3><span>top 3 with different themes</span></header><p>The 2027 card shows the three highest priority goals, one per theme.</p><div class="tw-x"><table><thead><tr><th>Goal</th><th>Rule</th><th>Priority</th><th>Status</th></tr></thead><tbody>${LAST.goals.slice().sort((a,b)=>b.pv-a.pv).map(g=>`<tr class="${LAST.picked.includes(g.id)?'picked':g.pv>0?'':'skip'}"><td>${strip(g.pv>0?g.text(M):'')||'Not for this profile'}</td><td class="m">${g.rule}</td><td class="m">${Math.round(g.pv*100)}</td><td>${LAST.picked.includes(g.id)?'<span class="st pick">On the card</span>':g.pv>0?'<span class="st ok">Eligible</span>':'<span class="st">Not for this profile</span>'}</td></tr>`).join('')}</tbody></table></div></section>`;
  h+=`<section class="slot"><header><h3>Templates</h3><span>same data, four looks</span></header><p>Pick a look. Every card, graphic and number follows it.</p><div class="how">${themes.map(t=>`<div><b>${t[1]}</b><span>${t[2]}</span><br><button class="use" data-theme="${t[0]}" type="button" style="margin-top:8px">Use ${t[1]}</button></div>`).join('')}</div></section>`;
  catEl.innerHTML=h;
}
catEl.addEventListener('click',e=>{
  const u=e.target.closest('button'); if(!u)return;
  if(u.dataset.slot){over[u.dataset.slot]=u.dataset.id;rebuild(false)}
  else if(u.dataset.auto){delete over[u.dataset.auto];rebuild(false)}
  else if(u.dataset.theme){$('selTheme').value=u.dataset.theme;applyTheme(u.dataset.theme)}
});

/* ================= wiring ================= */
function rebuild(reset){
  setN(P.real?P.N:NSAMPLE); M=computeM(P.real?P.Y:makeYear(P),P); DECK=buildDeck(M,over);
  if(reset)idx=0; idx=Math.min(idx,DECK.length-1);
  render(); renderCat(); if(mode==='cards')go(idx);
}
function applyTheme(t){
  document.body.classList.remove('t-bold','t-night','t-sun','t-receipt'); document.body.classList.add(t);
  requestAnimationFrame(()=>{fitBig();if(mode==='cards')go(idx)});
}
let LIST=PROFILES.slice();
function fillProfiles(sel){$('selProfile').innerHTML=LIST.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');if(sel!=null)$('selProfile').value=sel}
fillProfiles();
$('selProfile').onchange=e=>{P=LIST[+e.target.value];over={};rebuild(true)};
/* ---- Use my data dialog ---- */
const dlg=$('dlg'),msg=$('msg');
const say=(t,bad)=>{msg.textContent=t;msg.style.color=bad?'#ff8a8a':'#b9b6ad'};
$('btnMine').onclick=()=>dlg.classList.add('on'); $('dClose').onclick=()=>dlg.classList.remove('on');
$('btnSave').onclick=async()=>{const b=$('btnSave');b.disabled=true;try{await saveCurrent()}catch(e){alert(e.message)}b.disabled=false};
$('btnSaveAll').onclick=async()=>{const b=$('btnSaveAll'),t=b.textContent;b.disabled=true;try{await saveAll(m=>{b.textContent=m||t})}catch(e){alert(e.message)}b.textContent=t;b.disabled=false};
let FILES=[];
function addFiles(list){
  FILES=FILES.concat([...list]); $('flist').innerHTML=FILES.map(f=>`<li>${f.name.replace(/</g,'&lt;')} <span style="color:#6f6c64">${(f.size/1048576).toFixed(1)} MB</span></li>`).join('');
  $('dz').classList.toggle('ok',FILES.length>0); $('dGo').disabled=!FILES.length; say('');
}
const dz=$('dz'); dz.onclick=()=>$('fIn').click(); $('fIn').onchange=e=>{addFiles(e.target.files);e.target.value=''};
dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')}; dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');addFiles(e.dataTransfer.files)};
$('dGo').onclick=async()=>{
  const b=$('dGo'); b.disabled=true; const bar=dz.querySelector('.bar'), fill=bar.firstChild;
  try{
    bar.style.display='block'; fill.style.width='0';
    const r=await ingest(FILES,t=>say(t),p=>{fill.style.width=Math.round(p*100)+'%'});
    bar.style.display='none';
    const mine=buildReal(r.acts,r.health);
    const k=LIST.findIndex(p=>p.real); if(k>=0)LIST[k]=mine; else LIST.push(mine);
    const at=LIST.indexOf(mine); fillProfiles(at); P=mine; over={}; rebuild(true);
    dlg.classList.remove('on'); say('Found '+Object.entries(r.seen).map(([k,v])=>k+' ('+v+')').join(', ')+(r.dups?'. Removed '+r.dups+' duplicate workouts.':'.'));
    $('flist').innerHTML=''; FILES=[]; dz.classList.remove('ok');
    try{if(!sessionStorage.counted){sessionStorage.counted=1;fetch('https://abacus.jasoncameron.dev/hit/frenzytejask98-fitness-2026-recap/recaps',{keepalive:true}).catch(()=>{})}}catch(e){}
  }catch(err){bar.style.display='none';say(err.message||String(err),true)}
  b.disabled=!FILES.length;
};
$('selTheme').onchange=e=>applyTheme(e.target.value);
rebuild(true);
if(location.hash==='#mine')dlg.classList.add('on');
</script>
</body>
</html>
