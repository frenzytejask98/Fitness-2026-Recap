/* ================= graphics (final state is the resting state; motion plays when a card turns active) ================= */
const svg=inner=>`<div class="viz"><svg viewBox="0 0 300 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg></div>`;
const f1=v=>(+v).toFixed(1);
function barsViz(vals,hi){
  const n=vals.length,mx=Math.max(...vals)||1,bw=300/n,isHi=(k)=>typeof hi==='function'?hi(k,vals[k]):k===hi;
  let s='<line x1="0" x2="300" y1="85" y2="85" class="sf o4" stroke-width="1"/>';
  vals.forEach((v,k)=>{const h=Math.max(2,v/mx*74),x=k*bw+bw*.14;
    s+=`<rect class="rs fh${isHi(k)?'':' o4'}" style="--d:${(k*.05).toFixed(2)}s" x="${x.toFixed(1)}" y="${(85-h).toFixed(1)}" width="${(bw*.72).toFixed(1)}" height="${h.toFixed(1)}" rx="2"/>`});
  return svg(s);
}
const GFX={
  rings:()=>{let s='<g transform="translate(150 45) scale(1.5) translate(-150 -45)">';[40,29,18].forEach((r,k)=>{s+=`<circle cx="150" cy="45" r="${r}" class="sh o4" stroke-width="2"/><g class="sp" style="--s:${[3.2,4.6,6.4][k]}s"><circle cx="${150+r}" cy="45" r="${5-k}" class="fh"/></g>`});return svg(s+'</g>')},
  route:(r)=>{const n=Math.max(1,Math.min(10,Math.round(r)));let s='<path d="M12 58 L288 58" class="sh o4" stroke-width="3" stroke-dasharray="2 7"/><path d="M12 58 L288 58" pathLength="1" class="sh dr" stroke-width="4"/><circle cx="12" cy="58" r="6" class="fh"/>';
    for(let k=1;k<=n;k++){const x=12+k/n*276;s+=`<g class="pp" style="--d:${(.3+k*.12).toFixed(2)}s"><path d="M${x} 58 L${x} 28" class="sh" stroke-width="2"/><path d="M${x} 28 L${x+14} 34 L${x} 40Z" class="fh"/></g>`}
    return svg(s)},
  climb:(M)=>{const c=M.cumElev,mx=c[c.length-1]||1,pts=c.map((v,i)=>[2+i/(c.length-1)*296,84-v/mx*72]);const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');const e=pts[pts.length-1];
    return svg(`<path d="${d} L298 85 L2 85Z" class="fh o2"/><path d="${d}" pathLength="1" class="sh dr" stroke-width="3.5"/><g class="pp" style="--d:1.3s"><circle cx="${e[0]}" cy="${e[1]}" r="6" class="fh"/><path d="M${e[0]} ${e[1]-6} L${e[0]} ${e[1]-24} L${e[0]+16} ${e[1]-18} L${e[0]} ${e[1]-12}" class="sh" stroke-width="2"/></g>`)},
  donut:(M)=>{const tot=sum(M.hoursBy,x=>x[1]),op=[1,.7,.45,.28,.15];let off2=0,s='<circle cx="62" cy="45" r="30" class="sh o2" stroke-width="14"/>',lab='';
    M.hoursBy.slice(0,5).forEach(([k,h],i)=>{const f=h/tot;s+=`<circle cx="62" cy="45" r="30" pathLength="1" class="arc sh" transform="rotate(-90 62 45)" style="--f:${f.toFixed(4)};stroke-dashoffset:${(-off2).toFixed(4)};opacity:${op[i]};stroke-linecap:butt;--d:${(i*.15).toFixed(2)}s" stroke-width="14"/>`;off2+=f;
      if(i<4)lab+=`<circle cx="128" cy="${18+i*20}" r="4.5" class="fh" style="opacity:${op[i]}"/><text x="140" y="${22+i*20}" class="lab">${k} ${nf.format(h)} h</text>`});
    return svg(s+lab)},
  weeks:(M)=>barsViz(M.weekAct,(k,v)=>v>=6),
  months:(M)=>barsViz(M.monthKm,M.peak.k),
  wheel:()=>{let sp='';for(let k=0;k<8;k++){const a=k*Math.PI/4;sp+=`<line x1="${(150+4*Math.cos(a)).toFixed(1)}" y1="${(42+4*Math.sin(a)).toFixed(1)}" x2="${(150+28*Math.cos(a)).toFixed(1)}" y2="${(42+28*Math.sin(a)).toFixed(1)}" class="sh" stroke-width="1.6" style="opacity:.7"/>`}
    return svg(`<g class="sp" style="--s:1.4s;transform-origin:150px 42px">${sp}</g><circle cx="150" cy="42" r="32" class="sh" stroke-width="4"/><circle cx="150" cy="42" r="4" class="fh"/><g class="drive"><line x1="-30" x2="340" y1="80" y2="80" class="sf o4" stroke-width="3" stroke-dasharray="14 10"/></g>`)},
  hike:()=>svg(`<path d="M0 82 L70 32 L100 56 L150 12 L205 62 L240 40 L300 82" pathLength="1" class="sh dr" stroke-width="3.5"/><path d="M0 82 L70 32 L100 56 L150 12 L205 62 L240 40 L300 82Z" class="fh o2"/><g class="pp" style="--d:1.2s"><path d="M150 12 L150 -10 L170 -3 L150 4" class="sh" stroke-width="2.4"/></g>`),
  dots:(n)=>{const c=Math.min(n,48);let s='';for(let k=0;k<c;k++){const col=k%16,row=Math.floor(k/16);s+=`<circle class="pp fh" style="--d:${(k*.025).toFixed(2)}s" cx="${12+col*18.4}" cy="${16+row*26}" r="6"/>`}return svg(s)},
  speed:(M)=>{const mx=Math.max(M.speed,3600/M.pace0)*1.1,w0=3600/M.pace0/mx*190,w1=M.speed/mx*190;
    return svg(`<text x="0" y="31" class="lab">JAN</text><rect x="44" y="18" width="${w0.toFixed(1)}" height="18" rx="9" class="fh o4 gx"/><text x="${(52+w0).toFixed(1)}" y="31" class="lab">${f1(3600/M.pace0)} km/h</text><text x="0" y="69" class="lab">NOW</text><rect x="44" y="56" width="${w1.toFixed(1)}" height="18" rx="9" class="fh gx" style="--d:.25s"/><text x="${(52+w1).toFixed(1)}" y="69" class="lab">${f1(M.speed)} km/h</text>`)},
  gauge:(M)=>{const fa=(M.vo2a-25)/40,fb=(M.vo2b-25)/40,ang=Math.PI*(1-fb),px=150+70*Math.cos(ang),py=84-70*Math.sin(ang),d='M80 84 A70 70 0 0 1 220 84';
    return svg(`<path d="${d}" pathLength="1" class="sh o2" stroke-width="12" style="stroke-linecap:butt"/><path d="${d}" pathLength="1" class="sh o4 arc" stroke-width="12" style="--f:${fa.toFixed(3)};stroke-linecap:butt"/><path d="${d}" pathLength="1" class="sh arc" stroke-width="12" style="--f:${fb.toFixed(3)};stroke-linecap:butt;--d:.3s"/><g class="pp" style="--d:1.5s"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" class="fh"/></g><text x="150" y="78" text-anchor="middle" class="lab">${f1(M.vo2a)} to ${f1(M.vo2b)}</text>`)},
  ecg:(M)=>{const beat=o=>`L${o+30} 50 L${o+36} 32 L${o+42} 68 L${o+50} 12 L${o+58} 62 L${o+64} 50`;let d='M0 50 ';[0,86,172].forEach(o=>d+=beat(o));d+=' L240 50';
    return svg(`<path d="${d}" pathLength="1" class="sh ecg" stroke-width="3"/><g transform="translate(268 42)"><path class="fh hb" style="--bt:${(60/M.rhrb).toFixed(2)}s" d="M0 -8 C-10 -22 -30 -4 0 22 C30 -4 10 -22 0 -8Z"/></g>`)},
  sleep:(M)=>{const v=M.sleepSeries,mn=Math.min(...v.map(p=>p.v))-.1,mx=Math.max(...v.map(p=>p.v))+.1,pts=v.map((p,i)=>[4+i/(v.length-1)*220,80-(p.v-mn)/(mx-mn)*62]);
    const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
    const stars=[[250,14],[286,30],[270,62],[238,48],[292,70]].map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.2" class="fh tw" style="--d:${i*.4}s"/>`).join('');
    return svg(`<path d="${d}" pathLength="1" class="sh dr" stroke-width="3"/><mask id="moonm"><rect width="300" height="90" fill="#fff"/><circle cx="268" cy="38" r="14" fill="#000"/></mask><circle cx="258" cy="40" r="19" class="fh" mask="url(#moonm)"/>${stars}`)},
  feet:()=>{let s='';for(let k=0;k<10;k++){const x=16+k*28,y=k%2?58:30;s+=`<ellipse class="pp fh" style="--d:${(k*.12).toFixed(2)}s;opacity:${(.35+k*.065).toFixed(2)}" cx="${x}" cy="${y}" rx="6" ry="10" transform="rotate(${k%2?-12:12} ${x} ${y})"/>`}return svg(s)},
  heat:(M)=>{const rows=[1,2,3,4,5,6,0],cw=300/17,ch=88/7;let s='';
    rows.forEach((d,r)=>{for(let c=0;c<17;c++){const h=c+5,v=M.heat[d+'-'+h]||0,top=d===M.topDow&&h===M.topHour;
      s+=`<rect class="${top?'fh glow':'fh'}" style="opacity:${v?(.2+.8*v/M.heatMax).toFixed(2):.1}" x="${(c*cw+1).toFixed(1)}" y="${(r*ch+1).toFixed(1)}" width="${(cw-2).toFixed(1)}" height="${(ch-2).toFixed(1)}" rx="2.5"/>`}});return svg(s)},
  badge:()=>{let p='';for(let k=0;k<24;k++){const a=k*Math.PI/12-Math.PI/2,r=k%2?30:42;p+=(k?'L':'M')+(150+r*Math.cos(a)).toFixed(1)+' '+(45+r*Math.sin(a)).toFixed(1)}
    return svg(`<g class="flip"><path d="${p}Z" class="fh"/><circle cx="150" cy="45" r="20" class="sf" stroke-width="2.5" style="stroke:var(--bg)"/></g>`)},
  year:()=>{const x=10+(N/365)*280;return svg(`<line x1="10" x2="290" y1="40" y2="40" class="sh o4" stroke-width="10" style="stroke-linecap:butt"/><rect x="10" y="35" width="${(x-10).toFixed(1)}" height="10" rx="2" class="fh gx"/><path d="M${x.toFixed(1)} 40 L290 40" pathLength="1" class="sh dr" stroke-width="3" stroke-dasharray=".04 .03" style="--d:1s"/><g class="pp" style="--d:1s"><circle cx="${x.toFixed(1)}" cy="40" r="8" class="fh"/></g><circle cx="290" cy="40" r="6" class="sh" stroke-width="2.5"/><text x="${(x-12).toFixed(1)}" y="20" class="lab">NOW</text><text x="258" y="72" class="lab">31 DEC</text>`)}
};

/* ================= deck ================= */
const pad=n=>String(n).padStart(2,'0');
const Q=t=>t?`<p class="quirk">${t}</p>`:'';
const cnt=(n,o={})=>{const dec=o.dec||0,pre=o.pre||'',suf=o.suf||'';return {text:pre+(dec?(+n).toFixed(dec):nf.format(Math.round(n)))+suf,n:Math.abs(n),dec,pre,suf}};
const SLOT_INFO={distance:['Distance','Total km across every sport, set against a route, a distance or a track.'],climb:['Climbing','Elevation gain set against buildings and mountains.'],time:['Time','Hours spent moving, set against flights, films and missions.'],consistency:['Consistency','Streaks and rhythm of active days.'],month:['Biggest month','Peak month and best week.'],ride:['Cycling','Only for people with 150 km or more on a bike.'],hike:['Hiking','Only for people with 2 or more hikes.'],strength:['Strength','Only for people with 12 or more sessions.'],speed:['Speed','Only for people with enough runs and a pace gain of 5 s/km or more.'],pr:['Personal bests','A fun line for people with a 5K, 10K or half PR.'],vo2:['VO₂ max','Fitness gain from Apple Health.'],rhr:['Resting heart rate','Needs a drop of 2 bpm or more.'],sleep:['Sleep','Needs a gain of 8 minutes a night or more.'],steps:['Steps','Daily steps from Apple Health.'],rhythm:['Rhythm','When and how often you train.']};
const SLOTS=[
 {id:'cover',show:M=>true,build:(M,q,ctx)=>({title:'Your 2026 replay',viz:GFX.rings(),big:cnt(M.distKm).text,count:cnt(M.distKm),unit:'kilometres moved',head:ctx.type.hype,
   body:M.kmSports.slice(0,2).map(([k,v])=>`${B(nf.format(v)+' km')} ${({Run:'running',Ride:'cycling',Walk:'walking',Hike:'hiking',Swim:'swimming',Strength:'lifting'})[k]||k.toLowerCase()}`).join(' and ')+(M.sports.length>2?`, plus ${M.sports.length-2} more ${M.sports.length-2===1?'sport':'sports'}`:'')+'.'})},
 {id:'distance',facts:'distance',show:M=>true,numbered:1,build:(M,q)=>({title:'Distance',viz:GFX.route(1),big:cnt(M.distKm/(N/7)).text,count:cnt(M.distKm/(N/7)),unit:'km a week',head:'Week after week.',body:`Your biggest week reached ${B(nf.format(M.bestWeek)+' km')}.`,quirk:Q(q)})},
 {id:'climb',facts:'climb',show:M=>M.elev>=500,numbered:1,build:(M,q)=>({title:'Climbing',viz:GFX.climb(M),big:cnt(M.elev).text,count:cnt(M.elev),unit:'metres climbed',head:'You went up. A lot.',body:'Hills, hikes and everything in between.',quirk:Q(q)})},
 {id:'time',facts:'time',show:M=>true,numbered:1,build:(M,q)=>({title:'Time',viz:GFX.donut(M),big:cnt(M.hrs).text,count:cnt(M.hrs),unit:'hours moving',head:'Time well spent.',body:`That is ${B((M.hrs/24).toFixed(1)+' full days')} of your year.`,quirk:Q(q)})},
 {id:'consistency',facts:'consistency',show:M=>true,numbered:1,build:(M,q)=>({title:'Consistency',viz:GFX.weeks(M),big:cnt(M.activeDays).text,count:cnt(M.activeDays),unit:'active days',head:`${Math.round(M.activeDays/N*100)}% of your year.`,body:`Your longest streak was ${B(M.streak+' days')} in a row.`,quirk:Q(q)})},
 {id:'month',facts:'month',show:M=>M.peak.km>=30,numbered:1,build:(M,q)=>({title:'Biggest month',viz:GFX.months(M),big:M.peak.name.toUpperCase(),bigCls:'s',head:`${nf.format(M.peak.km)} km in one month.`,body:`${M.peak.n} sessions. The month you moved like you had somewhere to be.`,quirk:Q(q)})},
 {id:'ride',facts:'ride',show:M=>M.rideKm>=150,numbered:1,build:(M,q)=>({title:'Cycling',viz:GFX.wheel(),big:cnt(M.rideKm).text,count:cnt(M.rideKm),unit:'km by bike',head:'Wheels up.',body:`${M.rides} rides and ${B(nf.format(M.rideHrs)+' hours')} in the saddle.`,quirk:Q(q)})},
 {id:'hike',facts:'hike',show:M=>M.hikes>=2,numbered:1,build:(M,q)=>({title:'Hiking',viz:GFX.hike(),big:cnt(M.hikes).text,count:cnt(M.hikes),unit:'hikes',head:'Trail legend.',body:`${B(nf.format(M.hikeKm)+' km')} and ${B(nf.format(M.hikeElev)+' m')} of climbing on the trail.`,quirk:Q(q)})},
 {id:'strength',facts:'strength',show:M=>M.strength>=12,numbered:1,build:(M,q)=>({title:'Strength',viz:GFX.dots(M.strength),big:cnt(M.strength).text,count:cnt(M.strength),unit:'strength sessions',head:'Strong where it counts.',body:`${B(nf.format(M.strengthHrs)+' hours')} of lifting, all year.`,quirk:Q(q)})},
 {id:'speed',facts:'speed',show:M=>M.hasRuns&&M.gain>=5,numbered:1,build:(M,q)=>({title:'Speed',viz:GFX.speed(M),big:cnt(M.gain,{pre:'−',suf:'s'}).text,count:cnt(M.gain,{pre:'−',suf:'s'}),bigCls:'m',unit:'per kilometre',head:M.hasHr&&M.hr1<M.hr0?'Faster, and it felt easier.':'Faster every month.',body:`Pace went from ${B(pace(M.pace0))} to ${B(pace(M.pace1))} per km.`+(M.hasHr?` Heart rate on runs went from ${Math.round(M.hr0)} to ${Math.round(M.hr1)} bpm.`:''),quirk:Q(q)})},
 {id:'pr',facts:'pr',show:M=>M.hasRuns&&M.prs&&M.prs.length>0,numbered:1,build:(M,q)=>({title:'Personal bests',head:M.prs.length===1?'A new PR. Receipts attached.':`${M.prs.length} PRs. Receipts attached.`,extra:`<div class="rows">${M.prs.map((p,i)=>`<div class="row" style="--k:${i}"><span class="d">${p.d}</span><span class="t"><b>${hms(p.now)}</b>was ${hms(p.then)}, saved ${hms(p.then-p.now)}</span></div>`).join('')}</div>`,quirk:Q(q)})},
 {id:'vo2',facts:'vo2',show:M=>M.hasVo2&&M.vo2gain>.5,numbered:1,build:(M,q)=>({title:'Fitness',viz:GFX.gauge(M),big:cnt(M.vo2gain,{pre:'+',dec:1}).text,count:cnt(M.vo2gain,{pre:'+',dec:1}),bigCls:'m',unit:'VO₂ max',head:'Your engine got an upgrade.',body:`From ${B(f1(M.vo2a))} to ${B(f1(M.vo2b))} ml/kg/min over the year.`,quirk:Q(q)})},
 {id:'rhr',facts:'rhr',show:M=>M.hasRhr&&M.rhrDrop>=2,numbered:1,build:(M,q)=>({title:'Heart',viz:GFX.ecg(M),big:cnt(M.rhrDrop,{pre:'−'}).text,count:cnt(M.rhrDrop,{pre:'−'}),bigCls:'m',unit:'resting bpm',head:'A calmer heart.',body:`Resting heart rate went from ${B(Math.round(M.rhra))} to ${B(Math.round(M.rhrb))} bpm.`,quirk:Q(q)})},
 {id:'sleep',facts:'sleep',show:M=>M.hasSleep&&M.sleepMin>=8,numbered:1,build:(M,q)=>({title:'Recovery',viz:GFX.sleep(M),big:cnt(M.sleepMin,{pre:'+'}).text,count:cnt(M.sleepMin,{pre:'+'}),bigCls:'m',unit:'min of sleep a night',head:'Training and sleeping. Both.',body:`You now sleep about ${B(f1(M.sleepB)+' hours')} a night, up from ${f1(M.sleepA)}.`,quirk:Q(q)})},
 {id:'steps',facts:'steps',show:M=>M.hasSteps,numbered:1,build:(M,q)=>({title:'Everyday steps',viz:GFX.feet(),big:cnt(M.steps/1e6,{dec:1,suf:'M'}).text,count:cnt(M.steps/1e6,{dec:1,suf:'M'}),bigCls:'m',unit:'steps',head:`${nf.format(M.stepsAvg)} a day.`,body:`Your best day hit ${B(nf.format(M.stepsBest.v))} steps on ${fd(T0+M.stepsBest.i*DAY)}.`,quirk:Q(q)})},
 {id:'rhythm',facts:'rhythm',show:M=>true,numbered:1,build:(M,q)=>({title:'Your rhythm',viz:GFX.heat(M),big:DAYN[M.topDow].toUpperCase(),bigCls:'s',unit:`${pad(M.topHour)}:00`,head:'Your standing appointment.',body:'More of your training minutes land here than in any other hour of the week.',quirk:Q(q)})},
 {id:'persona',show:M=>true,numbered:1,build:(M,q,ctx)=>({title:'Your 2026 type',viz:GFX.badge(),big:ctx.type.t.replace('The ','').toUpperCase(),bigCls:'xs',head:ctx.type.t,body:`${ctx.type.why(M)} Runner-up: ${B(ctx.types[1].t.replace('The ',''))}.`})},
 {id:'next',show:M=>true,numbered:1,build:(M,q,ctx)=>({title:'2027 loading',viz:GFX.year(),big:cnt(M.projKm).text,count:cnt(M.projKm),bigCls:'m',unit:'km by 31 Dec',head:'The year is not done yet.',extra:`<ul class="list">${ctx.goals.map((g,i)=>`<li><span>${i+1}</span><span>${g.text(M)}</span></li>`).join('')}</ul>`})},
 {id:'summary',show:M=>true,build:(M,q)=>{
   const it=[[nf.format(M.distKm),'km moved'],[M.activeDays,'active days'],[nf.format(M.hrs),'hours moving']];
   if(M.hasVo2&&M.vo2gain>.5)it.push([f1(M.vo2b),`VO₂ max, up ${f1(M.vo2gain)}`]);
   if(M.hasRhr&&M.rhrDrop>=2)it.push([Math.round(M.rhrb),`resting bpm, down ${Math.round(M.rhrDrop)}`]);
   if(M.hasSteps)it.push([nf.format(M.stepsAvg),'steps a day']);
   if(M.hasRuns&&M.gain>=5)it.push([pace(M.pace1),`pace now, from ${pace(M.pace0)}`]);
   it.push([M.streak,'day best streak'],[nf.format(M.elev),'metres climbed']);
   return {title:'Your 2026 in motion',head:'Look what you did.',confetti:true,extra:`<div class="grid6">${it.slice(0,6).map(x=>`<div><div class="n">${x[0]}</div><div class="l">${x[1]}</div></div>`).join('')}</div>`,body:'Strong. Healthy. Moving. See you in 2027.'}}}
];
/* distance viz needs the ratio of the picked route; patch after the build */
let LAST={};
function buildDeck(M,over){
  const used=new Set(), out=[]; let num=0; LAST={};
  const types=TYPES.map(t=>({...t,sc:t.s(M)})).sort((a,b)=>b.sc-a.sc);
  const goals=[];const gUsed=new Set();
  GOALS.map(g=>({...g,pv:g.p(M)})).filter(g=>g.pv>0).sort((a,b)=>b.pv-a.pv).forEach(g=>{if(goals.length<3&&!gUsed.has(g.theme)){goals.push(g);gUsed.add(g.theme)}});
  const ctx={type:types[0],types,goals};
  LAST.types=types;LAST.goals=GOALS.map(g=>({id:g.id,theme:g.theme,rule:g.rule,pv:g.p(M),text:g.text}));LAST.picked=goals.map(g=>g.id);
  SLOTS.forEach(sl=>{
    let ev=null,q='';
    if(sl.facts){ev=evalSlot(sl.facts,M,used,over[sl.facts]);LAST[sl.facts]={ev,shown:sl.show(M)}}
    if(!sl.show(M))return;
    if(ev&&ev.best){used.add(ev.best.f.theme);q=ev.best.f.text(ev.best.r,M)}
    const spec=sl.build(M,q,ctx); spec.slot=sl.id; spec.num=sl.numbered?++num:0;
    if(sl.id==='distance'){const r=ev&&ev.best&&ev.best.f.kind==='x'?ev.best.r:M.distKm/42.195;spec.viz=GFX.route(r)}
    out.push(spec);
  });
  return out;
}
