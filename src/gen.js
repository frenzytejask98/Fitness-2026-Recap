/* ================= sample profiles + data generator (replace with real exports) ================= */
const DAY=86400000, T0=Date.UTC(2026,0,1), T1=Date.UTC(2026,10,16);
const NSAMPLE=Math.round((T1-T0)/DAY)+1;
let N=NSAMPLE;
const setN=n=>{N=n};
const off=(new Date(T0).getUTCDay()+6)%7;
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'];
const MONFULL=['January','February','March','April','May','June','July','August','September','October','November'];
const DAYN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0), mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const nf=new Intl.NumberFormat('en-GB',{maximumFractionDigits:0});
const pace=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const hms=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
const fd=ms=>new Date(ms).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
const hash01=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return ((h>>>0)%10000)/10000};

const PROFILES=[
 {id:'steady',name:'Steady runner',seed:2026,runP:[.85,.15,.7,.2,.7,.1,.75],ramp:[.8,1.1],km:[5,7.5],long:[9,18],pace:[372,334],hr:[157,149],cad:[166,173],morning:.55,longHour:9,
  rideP:[0,0,0,.25,0,.25,0],rideKm:[20,45],rideSpd:24,walkP:[0,0,0,0,0,0,.3],walkKm:[4,6],hikes:4,strP:[0,.35,0,0,0,.35,0],vo2:[41.2,45.6],rhr:[62.4,55.6],sleep:[6.85,7.35],steps:[7600,7600]},
 {id:'marathon',name:'Marathon trainee',seed:77,runP:[.95,.25,.85,.55,.85,.15,.9],ramp:[.85,1.05],km:[8,12],long:[16,30],pace:[342,306],hr:[158,150],cad:[170,177],morning:.8,longHour:7,
  rideP:[0,0,0,.1,0,.1,0],rideKm:[25,40],rideSpd:25,walkP:[0,0,0,0,0,0,0],walkKm:[3,4],hikes:1,strP:[0,.3,0,.3,0,0,0],vo2:[49,54.2],rhr:[54,48.6],sleep:[7.1,7.5],steps:[9000,9000]},
 {id:'cyclist',name:'Cyclist first',seed:314,runP:[.25,.05,.2,.05,.2,0,.2],ramp:[.8,1],km:[5,7],long:[8,12],pace:[385,362],hr:[152,147],cad:[164,168],morning:.4,longHour:9,
  rideP:[.55,.1,.25,.35,.2,.3,.55],rideKm:[30,85],rideSpd:27,walkP:[0,0,0,0,0,0,.15],walkKm:[3,5],hikes:2,strP:[0,.25,0,.25,0,0,0],vo2:[44,51],rhr:[60,53.5],sleep:[7.0,7.4],steps:[6500,6500]},
 {id:'hiker',name:'Weekend hiker',seed:909,runP:[.3,.05,.3,.05,.3,.05,.3],ramp:[.7,1],km:[4,6],long:[6,9],pace:[405,388],hr:[150,146],cad:[160,164],morning:.5,longHour:10,
  rideP:[0,0,0,0,0,0,0],rideKm:[20,30],rideSpd:20,walkP:[.55,.15,.25,.15,.25,.1,.7],walkKm:[5,11],hikes:15,strP:[0,0,.2,0,0,0,0],vo2:[38,41.2],rhr:[66,62.8],sleep:[7.0,7.35],steps:[11200,11200]},
 {id:'beginner',name:'Couch to 5K to 10K',seed:555,runP:[.8,.1,.7,.15,.7,.05,.7],ramp:[.2,1.15],km:[2.4,6.2],long:[3.5,9.5],pace:[470,392],hr:[170,155],cad:[158,168],morning:.45,longHour:9,
  rideP:[0,0,0,0,0,0,0],rideKm:[20,30],rideSpd:20,walkP:[.25,.1,.2,.1,.2,.1,.3],walkKm:[3,6],hikes:2,strP:[0,.15,0,.2,0,0,0],vo2:[32,38.2],rhr:[72,64.6],sleep:[6.4,7.2],steps:[5800,9200]}
];

function makeYear(P){
  const R=mulberry32(P.seed), rr=(a,b)=>a+(b-a)*R();
  const gauss=()=>{let s=0;for(let i=0;i<6;i++)s+=R();return (s-3)/Math.sqrt(.5)};
  const lerp=(a,t)=>a[0]+(a[1]-a[0])*t;
  const hikeSet=new Set(); while(hikeSet.size<P.hikes)hikeSet.add(110+Math.floor(rr(0,170)));
  const acts=[];
  for(let i=0;i<N;i++){
    const t=i/(N-1), date=T0+i*DAY, dow=new Date(date).getUTCDay(), rest=i>=152&&i<=168;
    if(R()<P.runP[dow]*(rest?.15:1)*lerp(P.ramp,t)){
      const long=dow===0, km=Math.max(2,long?lerp(P.long,t)+gauss()*1.5:lerp(P.km,t)+gauss());
      const pc=lerp(P.pace,Math.pow(t,.8))+gauss()*6+(long?10:0);
      const hour=dow===6?9+Math.floor(R()*2):long?P.longHour+Math.floor(R()*2):(R()<P.morning?6+Math.floor(R()*2):17+Math.floor(R()*3));
      acts.push({type:'Run',i,date,dow,hour,km,sec:km*pc,pace:pc,elev:km*rr(5,14),hr:Math.round(lerp(P.hr,t)+gauss()*2.5-(long?2:0)),cad:Math.round(lerp(P.cad,t)+gauss()*1.2)});
    }
    if(R()<P.rideP[dow]*(rest?.5:1)){const km=rr(P.rideKm[0],P.rideKm[1]);acts.push({type:'Ride',i,date,dow,hour:dow===0||dow===6?8+Math.floor(R()*3):17,km,sec:km/P.rideSpd*3600,elev:km*rr(4,10)})}
    if(R()<P.strP[dow]){acts.push({type:'Strength',i,date,dow,hour:R()<.5?7:18,km:0,sec:3000+rr(-400,600),elev:0})}
    if(R()<P.walkP[dow]){const km=rr(P.walkKm[0],P.walkKm[1]);acts.push({type:'Walk',i,date,dow,hour:14+Math.floor(R()*3),km,sec:km/5*3600,elev:km*rr(4,12)})}
    if(hikeSet.has(i)){const km=rr(11,19);acts.push({type:'Hike',i,date,dow,hour:9,km,sec:km/3.2*3600,elev:rr(450,800)})}
  }
  const daySteps=new Array(N).fill(0);
  for(let i=0;i<N;i++){
    const t=i/(N-1), todays=acts.filter(a=>a.i===i);
    let s=lerp(P.steps,t)+gauss()*1500;
    todays.forEach(a=>{if(a.type==='Run')s+=a.km*450;if(a.type==='Walk')s+=a.km*1300;if(a.type==='Hike')s+=a.km*1000;if(a.type==='Ride')s+=1200});
    daySteps[i]=Math.max(2500,Math.round(s));
  }
  const ease=t=>1-Math.pow(1-t,1.6), vo2=[],rhr=[],sleep=[];
  for(let i=0;i<N;i+=7){const t=i/(N-1),dip=(i>=150&&i<=180)?.5:0;
    vo2.push({i,v:P.vo2[0]+(P.vo2[1]-P.vo2[0])*ease(t)+gauss()*.25-dip});
    rhr.push({i,v:P.rhr[0]+(P.rhr[1]-P.rhr[0])*ease(t)+gauss()*.7+dip});
    sleep.push({i,v:P.sleep[0]+(P.sleep[1]-P.sleep[0])*t+gauss()*.28});}
  return {acts,daySteps,vo2,rhr,sleep};
}

/* ================= metrics: everything the fact catalog can use ================= */
const head=(a,n)=>mean(a.slice(0,n).map(p=>p.v)), tail=(a,n)=>mean(a.slice(-n).map(p=>p.v));
function computeM(Y,P){
  const {acts,daySteps,vo2,rhr,sleep}=Y, M={P};
  const runs=acts.filter(a=>a.type==='Run');
  const by={}; [...new Set(['Run','Ride','Walk','Hike','Strength',...acts.map(a=>a.type)])].forEach(t=>{const a=acts.filter(x=>x.type===t);by[t]={n:a.length,km:sum(a,x=>x.km),hrs:sum(a,x=>x.sec)/3600,elev:sum(a,x=>x.elev)}});
  M.by=by; M.runs=runs.length;
  M.distKm=sum(acts,a=>a.km); M.elev=sum(acts,a=>a.elev); M.hrs=sum(acts,a=>a.sec)/3600;
  M.runKm=by.Run.km; M.rideKm=by.Ride.km; M.rides=by.Ride.n; M.rideHrs=by.Ride.hrs;
  M.hikes=by.Hike.n; M.hikeElev=by.Hike.elev; M.hikeKm=by.Hike.km; M.walkKm=by.Walk.km;
  M.strength=by.Strength.n; M.strengthHrs=by.Strength.hrs;
  const dayAny=new Array(N).fill(false); acts.forEach(a=>dayAny[a.i]=true);
  M.activeDays=dayAny.filter(Boolean).length; M.N=N;
  let st=0,c=0; dayAny.forEach(a=>{c=a?c+1:0;st=Math.max(st,c)}); M.streak=st;
  const W=Math.ceil((N+off)/7), weekKm=new Array(W).fill(0), weekAct=new Array(W).fill(0);
  acts.forEach(a=>{weekKm[Math.floor((a.i+off)/7)]+=a.km}); dayAny.forEach((a,i)=>{if(a)weekAct[Math.floor((i+off)/7)]++});
  M.weekAct=weekAct; M.bestWeek=Math.max(...weekKm); M.wkNow=mean(weekKm.slice(-9,-1)); M.wkThen=mean(weekKm.slice(0,8));
  M.activePerWeek=M.activeDays/(N/7);
  M.monthKm=MON.map((m,k)=>sum(acts.filter(a=>new Date(a.date).getUTCMonth()===k),a=>a.km));
  M.monthN=MON.map((m,k)=>acts.filter(a=>new Date(a.date).getUTCMonth()===k).length);
  const pm=M.monthKm.indexOf(Math.max(...M.monthKm)); M.peak={k:pm,name:MONFULL[pm],km:M.monthKm[pm],n:M.monthN[pm]};
  M.monthRide=MON.map((m,k)=>sum(acts.filter(a=>a.type==='Ride'&&new Date(a.date).getUTCMonth()===k),a=>a.km));
  const cum=[];let e=0;const byDay=new Array(N).fill(0);acts.forEach(a=>byDay[a.i]+=a.elev);
  for(let i=0;i<N;i++){e+=byDay[i];if(i%7===0||i===N-1)cum.push(e)} M.cumElev=cum;
  M.hoursBy=Object.entries(by).map(([k,v])=>[k,v.hrs]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  M.sports=M.hoursBy.filter(x=>by[x[0]].n>=8);
  const kmSports=Object.entries(by).map(([k,v])=>[k,v.km]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]); M.kmSports=kmSports;
  M.topShare=kmSports.length?kmSports[0][1]/M.distKm:1;
  M.longestAct=acts.filter(a=>a.km>0).reduce((m,a)=>a.km>m.km?a:m,{km:0});
  M.longestRun=runs.length?runs.reduce((m,a)=>a.km>m.km?a:m):{km:0,sec:0,date:T0};
  M.climbRun=runs.length?runs.reduce((m,a)=>a.elev>m.elev?a:m):{elev:0};
  // running trends
  const f56=runs.filter(a=>a.i<56), l56=runs.filter(a=>a.i>=N-56);
  M.hasRuns=runs.length>=20&&f56.length>=3&&l56.length>=3;
  if(M.hasRuns){
    M.pace0=sum(f56,a=>a.sec)/sum(f56,a=>a.km); M.pace1=sum(l56,a=>a.sec)/sum(l56,a=>a.km);
    const okv=a=>a.map(x=>x.hr).filter(v=>isFinite(v)&&v>0), okc=a=>a.map(x=>x.cad).filter(v=>isFinite(v)&&v>0);
    M.hr0=mean(okv(f56)); M.hr1=mean(okv(l56)); M.hasHr=okv(f56).length>2&&okv(l56).length>2;
    M.cad0=mean(okc(f56)); M.cad1=mean(okc(l56)); M.hasCad=okc(f56).length>2&&okc(l56).length>2;
    M.gain=M.pace0-M.pace1; M.speed=3600/M.pace1;
    M.runSteps=sum(runs,a=>a.sec/60*(a.cad||0)); M.runHeartbeats=sum(runs,a=>a.sec/60*(a.hr||0));
    M.fast=runs.filter(a=>a.km>=Math.min(5,M.longestRun.km)).reduce((m,a)=>a.pace<m.pace?a:m);
    // personal bests. Real best efforts (from GPS tracks) when we have them, otherwise estimated from the best run that was long enough
    const real=runs.some(a=>a.best);
    M.prEst=!!(P&&P.real)&&!real;
    if(real){
      M.prs=[['5K',5],['10K',10],['Half marathon',21.0975]].map(([n,d])=>{
        const c=runs.filter(a=>a.best&&a.best[n]); if(!c.length)return null;
        const best=c.reduce((m,a)=>a.best[n]<m.best[n]?a:m), early=c.filter(a=>a.i<N/3);
        if(!early.length)return null; const then=Math.min(...early.map(a=>a.best[n])), now=best.best[n];
        if(then<=now+1)return null; return {d:n,dist:d,now,then,when:best.date}}).filter(Boolean);
    }else{
    M.prs=[['5K',5,.94],['10K',10,.96],['Half marathon',21.0975,.97]].filter(([n,d])=>M.longestRun.km>=d).map(([n,d,f])=>{
      const c=runs.filter(a=>a.km>=d), best=c.reduce((m,a)=>a.pace<m.pace?a:m), early=c.filter(a=>a.i<56);
      let now=best.pace*d*f, then=early.length?Math.min(...early.map(a=>a.pace))*d*f:M.pace0*d*1.03;
      if(then<=now)then=now*1.04; return {d:n,dist:d,now,then,when:best.date}});
    }
  }
  M.hasVo2=vo2.length>=8;M.hasRhr=rhr.length>=8;M.hasSleep=sleep.length>=8;
  M.vo2a=head(vo2,4);M.vo2b=tail(vo2,4);M.vo2gain=M.vo2b-M.vo2a;
  M.rhra=head(rhr,4);M.rhrb=tail(rhr,4);M.rhrDrop=M.rhra-M.rhrb;
  M.sleepA=head(sleep,4);M.sleepB=tail(sleep,4);M.sleepMin=(M.sleepB-M.sleepA)*60;
  M.sleepSeries=sleep;
  const rec=daySteps.filter(v=>v>0);M.hasSteps=rec.length>=20;M.steps=sum(rec,v=>v);M.stepsAvg=mean(rec);M.stepsKm=M.steps*.75/1000;
  M.stepsBest=daySteps.reduce((m,v,i)=>v>m.v?{v,i}:m,{v:0,i:0});M.over10=daySteps.filter(v=>v>=10000).length;
  M.stepsThen=mean(daySteps.slice(0,56).filter(v=>v>0));M.stepsNow=mean(daySteps.slice(-56).filter(v=>v>0));
  const heat={};acts.forEach(a=>{const k=a.dow+'-'+a.hour;heat[k]=(heat[k]||0)+a.sec/60});M.heat=heat;
  M.heatMax=Math.max(...Object.values(heat));const tp=Object.entries(heat).sort((a,b)=>b[1]-a[1])[0][0].split('-').map(Number);M.topDow=tp[0];M.topHour=tp[1];
  const real=acts.filter(a=>a.type!=='Strength');
  M.dawn=real.filter(a=>a.hour<8).length/real.length;M.eve=real.filter(a=>a.hour>=17).length/real.length;
  M.weekend=acts.filter(a=>a.dow===0||a.dow===6).length/acts.length;
  M.sundayLong=runs.filter(a=>a.dow===0&&a.km>=10).length;
  M.projKm=M.distKm+(M.distKm/N)*(365-N)*1.0;
  return M;
}
