/* ================= more sources: Garmin, Polar, Whoop, Google Fit, FIT/GPX/TCX (Coros, Suunto, others) =================
   Everything here is read in the browser. Formats come from each service's own export. */
const numc=s=>{s=String(s==null?'':s).trim().replace(/^--$/,'');if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');const v=parseFloat(s.replace(',','.'));return isFinite(v)?v:NaN};
const hmsSec=s=>{s=String(s||'').trim();if(!/^\d+(:\d+){1,2}(\.\d+)?$/.test(s))return NaN;return s.split(':').reduce((a,x)=>a*60+parseFloat(x),0)};
const isoDur=s=>{const m=String(s||'').match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/);return m?(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0):NaN};
/* "2026-03-04 07:30:00" (already local) or a timestamp with Z/offset (converted to this computer's local time) */
function localParts(s){
  s=String(s||'').trim(); const m=s.match(/^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/); if(!m)return null;
  if(/(Z|[+-]\d\d:?\d\d)$/.test(s)){const d=new Date(s);return isFinite(d)?{y:d.getFullYear(),m:d.getMonth(),d:d.getDate(),h:d.getHours()}:null}
  return {y:+m[1],m:+m[2]-1,d:+m[3],h:+m[4]};
}
const partsFromMs=ms=>{const d=new Date(ms);return {y:d.getFullYear(),m:d.getMonth(),d:d.getDate(),h:d.getHours()}};
function mkAct(type,p,km,sec,elev,hr,cad){
  if(!p||p.y!==2026||!(sec>0))return null; km=isFinite(km)&&km>0?km:0; if(type==='Run'&&km<.5)return null;
  const dateMs=Date.UTC(p.y,p.m,p.d);
  const a={type,i:Math.round((dateMs-T0)/DAY),date:dateMs,dow:new Date(dateMs).getUTCDay(),hour:p.h,km,sec,elev:elev>0&&elev<20000?elev:0};
  if(type==='Run'&&km>0)a.pace=sec/km;
  if(hr>40&&hr<230)a.hr=Math.round(hr);
  if(cad>0){if(type==='Run'&&cad<120)cad*=2;a.cad=Math.round(cad)}
  return a;
}
const colOf=H=>(...rx)=>H.findIndex(h=>rx.some(x=>x.test(h.trim())));
function weeklyMean(map){const w={};Object.entries(map).forEach(([d,v])=>{d=+d;if(!isFinite(v))return;const k=Math.floor(d/7)*7;(w[k]=w[k]||{s:0,n:0});w[k].s+=v;w[k].n++});return Object.keys(w).map(Number).sort((a,b)=>a-b).map(i=>({i,v:w[i].s/w[i].n}))}

/* ---- Garmin Connect CSV (Activities.csv) ---- */
function garminCSV(text){
  const rows=parseCSV(text), H=rows[0].map(h=>h.trim()), c=colOf(H);
  const k={date:c(/^date$/i),type:c(/^activity type$/i),dist:c(/^distance$/i),time:c(/^time$/i),mov:c(/^moving time$/i),hr:c(/^avg hr$/i),cad:c(/^avg (run )?cadence$/i),asc:c(/^total ascent$/i)};
  if(k.date<0||k.type<0||k.dist<0)throw new Error('This Garmin CSV has unexpected columns.');
  const out=[]; for(let r=1;r<rows.length;r++){const R=rows[r]; if(R.length<=k.type)continue;
    let sec=k.mov>=0?hmsSec(R[k.mov]):NaN; if(!(sec>0))sec=hmsSec(R[k.time]);
    const a=mkAct(mapType(R[k.type]),localParts(R[k.date]),numc(R[k.dist]),sec,k.asc>=0?numc(R[k.asc]):0,k.hr>=0?numc(R[k.hr]):NaN,k.cad>=0?numc(R[k.cad]):NaN); if(a)out.push(a)}
  return out;
}
/* ---- Garmin full account export (DI_CONNECT ... summarizedActivities.json) ---- */
function garminJSON(text){
  const j=JSON.parse(text), list=[]; (Array.isArray(j)?j:[j]).forEach(x=>{(x.summarizedActivitiesExport||[x]).forEach(a=>list.push(a))});
  const out=[];
  list.forEach(a=>{
    if(!a||!a.startTimeLocal||!a.duration)return;
    const type=mapType(a.activityType&&a.activityType.typeKey||a.activityType||''), p=(d=>({y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),h:d.getUTCHours()}))(new Date(a.startTimeLocal));
    /* Garmin's units vary between export versions: try centimetres and milliseconds first, then metres and seconds */
    let km=(a.distance||0)/100000, sec=a.duration/1000, el=(a.elevationGain||0)/100;
    if(type==='Run'&&km>0&&(sec/km<150||sec/km>1500)){km=(a.distance||0)/1000;sec=a.duration;el=a.elevationGain||0}
    else if(type==='Run'&&km===0&&a.distance){km=a.distance/1000}
    const x=mkAct(type,p,km,sec,el,a.avgHr,a.avgRunCadence||a.avgBikeCadence); if(x)out.push(x);
  });
  return out;
}
/* ---- Polar Flow (training-session-*.json) ---- */
function polarJSON(text){
  const j=JSON.parse(text), ex=j.exercises||(j.startTime?[j]:[]), out=[];
  ex.forEach(e=>{
    const sec=isoDur(e.duration)||(typeof e.duration==='number'?e.duration/1000:NaN);
    const a=mkAct(mapType(e.sport||''),localParts(e.startTime||j.startTime),(e.distance||0)/1000,sec,e.ascent,e.heartRate&&e.heartRate.avg,NaN); if(a)out.push(a)});
  return out;
}
/* ---- Whoop (physiological_cycles.csv, sleeps.csv, workouts.csv) ---- */
function whoopCycles(text){
  const rows=parseCSV(text), c=colOf(rows[0]), cs=c(/cycle start/i), rh=c(/resting heart/i), as=c(/asleep duration/i);
  if(cs<0)throw new Error('Unexpected Whoop cycles file.');
  const rhr={},sl={}; for(let r=1;r<rows.length;r++){const R=rows[r]; const s=(R[cs]||'').slice(0,10); if(!/^\d{4}-\d\d-\d\d$/.test(s)||s.slice(0,4)!=='2026')continue; const d=dayIdx(s);
    const v=rh>=0?numc(R[rh]):NaN; if(v>30&&v<120)rhr[d]=v; const m=as>=0?numc(R[as]):NaN; if(m>180&&m<840)sl[d]=m/60}
  return {rhr:weeklyMean(rhr),sleep:weeklyMean(sl)};
}
function whoopSleeps(text){
  const rows=parseCSV(text), c=colOf(rows[0]), wk=c(/wake onset/i), as=c(/asleep duration/i), nap=c(/^nap$/i), sl={};
  if(wk<0||as<0)throw new Error('Unexpected Whoop sleeps file.');
  for(let r=1;r<rows.length;r++){const R=rows[r]; if(nap>=0&&/true/i.test(R[nap]))continue; const s=(R[wk]||'').slice(0,10); if(!/^\d{4}-\d\d-\d\d$/.test(s)||s.slice(0,4)!=='2026')continue; const m=numc(R[as]); if(m>0)sl[dayIdx(s)]=(sl[dayIdx(s)]||0)+m/60}
  return {sleep:weeklyMean(sl)};
}
function whoopWorkouts(text){
  const rows=parseCSV(text), c=colOf(rows[0]), st=c(/workout start/i), du=c(/^duration/i), ac=c(/activity name/i), di=c(/distance \(m/i), hr=c(/average hr/i), al=c(/altitude gain/i), out=[];
  if(st<0||du<0)throw new Error('Unexpected Whoop workouts file.');
  for(let r=1;r<rows.length;r++){const R=rows[r]; const a=mkAct(mapType(R[ac]),localParts(R[st]),di>=0?numc(R[di])/1000:0,numc(R[du])*60,al>=0?numc(R[al]):0,hr>=0?numc(R[hr]):NaN,NaN); if(a)out.push(a)}
  return out;
}
/* ---- Google Fit via Takeout (Fit/Daily activity metrics/*.csv) ---- */
function gfitDaily(text,name){
  const rows=parseCSV(text), c=colOf(rows[0]), st=c(/step count/i), dt=c(/^date$/i), steps={};
  if(st<0)return steps;
  const fromName=(name.match(/(\d{4}-\d\d-\d\d)/)||[])[1];
  for(let r=1;r<rows.length;r++){const R=rows[r]; const s=dt>=0?R[dt]:fromName; if(!s||s.slice(0,4)!=='2026')continue; const v=numc(R[st]); if(v>0)steps[dayIdx(s.slice(0,10))]=(steps[dayIdx(s.slice(0,10))]||0)+v}
  return steps;
}
/* ---- FIT (Garmin, Coros, Suunto, Wahoo ... the common binary workout format) ---- */
const FITSPORT={1:'Run',2:'Ride',4:'Strength',5:'Swim',10:'Strength',11:'Walk',17:'Hike'};
/* walks a FIT file and calls cb(fields) for every data message with the wanted global number (18 session, 20 record) */
function fitWalk(buf,want,cb){
  const dv=new DataView(buf), u8=new Uint8Array(buf); if(buf.byteLength<16||String.fromCharCode(u8[8],u8[9],u8[10],u8[11])!=='.FIT')return;
  const hs=u8[0], ds=dv.getUint32(4,true), end=Math.min(buf.byteLength-2,hs+ds), defs={}; let p=hs, lastTs=0;
  const rd=(q,sz,le)=>{if(sz===1){const v=u8[q];return v===255?NaN:v}if(sz===2){const v=dv.getUint16(q,le);return v===65535?NaN:v}if(sz===4){const v=dv.getUint32(q,le);return v===4294967295?NaN:v}return NaN};
  const decode=(d,q)=>{const r={};for(const fd of d.f){r[fd.num]=rd(q,fd.size,d.le);q+=fd.size}return r};
  while(p<end){
    const h=u8[p++];
    if(h&0x80){const d=defs[(h>>5)&3]; if(!d)break;
      if(d.g===want){const r=decode(d,p),off=h&31;let ts=(lastTs&~31)+off;if(ts<lastTs)ts+=32;r[253]=ts;lastTs=ts;cb(r)}
      p+=d.size; continue}
    const l=h&15;
    if(h&0x40){p++; const le=u8[p++]===0, g=dv.getUint16(p,le); p+=2; const n=u8[p++], f=[]; let size=0;
      for(let k=0;k<n;k++){f.push({num:u8[p],size:u8[p+1]});size+=u8[p+1];p+=3}
      if(h&0x20){const nd=u8[p++];for(let k=0;k<nd;k++){size+=u8[p+1];p+=3}}
      defs[l]={g,le,f,size,ts:f.some(x=>x.num===253)};
    }else{const d=defs[l]; if(!d)break;
      const r=d.g===want||d.ts?decode(d,p):null; if(r&&isFinite(r[253]))lastTs=r[253];
      if(d.g===want)cb(r);
      p+=d.size}
  }
}
function fitSessions(buf){const out=[];fitWalk(buf,18,r=>out.push(r));return out}
/* distance in metres against time in seconds, from FIT records */
const semi=v=>(v>2147483647?v-4294967296:v)*(180/2147483648);
function fitTrack(buf){
  const t=[],d=[]; let la0,lo0,cum=0;
  fitWalk(buf,20,r=>{const ts=r[253]; if(!(ts>0))return;
    if(isFinite(r[5])){t.push(ts);d.push(r[5]/100)}
    else if(isFinite(r[0])&&isFinite(r[1])&&r[0]!==2147483647){const la=semi(r[0]),lo=semi(r[1]);if(la0!==undefined)cum+=hav(la0,lo0,la,lo)*1000;la0=la;lo0=lo;t.push(ts);d.push(cum)}});
  return {t,d};
}
function fitActs(buf){
  const out=[]; fitSessions(buf).forEach(r=>{
    const t=r[2]; if(!(t>0))return; const ms=(631065600+t)*1000, type=FITSPORT[r[5]]||'Other';
    const sec=(isFinite(r[8])?r[8]:r[7])/1000, a=mkAct(type,partsFromMs(ms),(r[9]||0)/100000,sec,r[22],r[16],r[18]); if(a)out.push(a)});
  return out;
}
/* ---- GPX and TCX ---- */
const hav=(a,b,c,d)=>{const R=6371,t=x=>x*Math.PI/180,dl=t(c-a),dn=t(d-b),q=Math.sin(dl/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(q))};
const gain=el=>{let g=0;for(let i=1;i<el.length;i++)if(el[i]>el[i-1])g+=el[i]-el[i-1];return g};
function gpxActs(text){
  const type=mapType((text.match(/<type>([^<]*)<\/type>/)||[])[1]||'Other'), pts=[]; let m; const re=/<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  while((m=re.exec(text))){const la=+(m[1].match(/lat="([-\d.]+)"/)||[])[1], lo=+(m[1].match(/lon="([-\d.]+)"/)||[])[1];
    const t=(m[2].match(/<time>([^<]*)<\/time>/)||[])[1], e=(m[2].match(/<ele>([-\d.]+)<\/ele>/)||[])[1], h=(m[2].match(/<(?:\w+:)?hr>(\d+)</)||[])[1];
    if(isFinite(la)&&isFinite(lo)&&t)pts.push({la,lo,t:Date.parse(t),e:e!=null?+e:NaN,h:h!=null?+h:NaN})}
  if(pts.length<2)return [];
  let km=0; for(let i=1;i<pts.length;i++)km+=hav(pts[i-1].la,pts[i-1].lo,pts[i].la,pts[i].lo);
  const hr=pts.map(x=>x.h).filter(isFinite), a=mkAct(type,partsFromMs(pts[0].t),km,(pts[pts.length-1].t-pts[0].t)/1000,gain(pts.map(x=>x.e).filter(isFinite)),hr.length?hr.reduce((s,v)=>s+v,0)/hr.length:NaN,NaN);
  return a?[a]:[];
}
function gpxTrack(text){
  const t=[],d=[]; let la0,lo0,cum=0,m; const re=/<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  while((m=re.exec(text))){const la=+(m[1].match(/lat="([-\d.]+)"/)||[])[1],lo=+(m[1].match(/lon="([-\d.]+)"/)||[])[1],tm=(m[2].match(/<time>([^<]*)<\/time>/)||[])[1];
    if(!isFinite(la)||!isFinite(lo)||!tm)continue; if(la0!==undefined)cum+=hav(la0,lo0,la,lo)*1000; la0=la;lo0=lo; t.push(Date.parse(tm)/1000);d.push(cum)}
  return {t,d};
}
function tcxTrack(text){
  const t=[],d=[]; let m; const re=/<Trackpoint>([\s\S]*?)<\/Trackpoint>/g;
  while((m=re.exec(text))){const tm=(m[1].match(/<Time>([^<]*)<\/Time>/)||[])[1],ds=(m[1].match(/<DistanceMeters>([\d.]+)</)||[])[1]; if(tm&&ds){t.push(Date.parse(tm)/1000);d.push(+ds)}}
  return {t,d};
}
/* fastest 5K, 10K and half marathon inside one run, found by sliding a window along distance */
const EFFORTS=[['5K',5000],['10K',10000],['Half marathon',21097.5]];
function bestEfforts(tr){
  const {t,d}=tr, out={}, n=d.length; if(n<20)return out;
  for(const [name,D] of EFFORTS){
    if(d[n-1]-d[0]<D)continue; let j=0,best=Infinity;
    for(let i=0;i<n;i++){
      while(j+1<i&&d[i]-d[j+1]>=D)j++;
      if(d[i]-d[j]<D)continue;
      const span=d[j+1]-d[j], f=span>0?(d[i]-D-d[j])/span:0, t0=t[j]+(t[j+1]-t[j])*Math.max(0,Math.min(1,f)), sec=t[i]-t0;
      if(sec>0&&sec<best)best=sec;
    }
    if(isFinite(best)&&best/(D/1000)>=150&&best/(D/1000)<=900)out[name]=best; /* ignore GPS glitches faster than 2:30/km */
  }
  return out;
}
function tcxActs(text){
  const out=[], re=/<Activity\b[^>]*Sport="([^"]*)"[^>]*>([\s\S]*?)<\/Activity>/g; let m;
  while((m=re.exec(text))){
    const body=m[2], laps=[...body.matchAll(/<Lap\b[^>]*StartTime="([^"]*)"[^>]*>([\s\S]*?)<\/Lap>/g)]; if(!laps.length)continue;
    let sec=0,dist=0,hs=0,hw=0; laps.forEach(L=>{const t=+(L[2].match(/<TotalTimeSeconds>([\d.]+)</)||[])[1]||0,d=+(L[2].match(/<DistanceMeters>([\d.]+)</)||[])[1]||0,h=+(L[2].match(/<AverageHeartRateBpm[^>]*>\s*<Value>(\d+)</)||[])[1]||0;sec+=t;dist+=d;if(h){hs+=h*t;hw+=t}});
    const el=[...body.matchAll(/<AltitudeMeters>([-\d.]+)</g)].map(x=>+x[1]), cd=[...body.matchAll(/<Cadence>(\d+)</g)].map(x=>+x[1]).filter(v=>v>0);
    const a=mkAct(mapType(m[1]),localParts(laps[0][1]),dist/1000,sec,gain(el),hw?hs/hw:NaN,cd.length?cd.reduce((s,v)=>s+v,0)/cd.length:NaN); if(a)out.push(a);
  }
  return out;
}

/* ---- recognise files by name, whether loose or inside a zip ---- */
function classify(name){
  const n=name.replace(/\\/g,'/'), b=n.split('/').pop();
  if(/(^|\/)export\.xml$/i.test(n))return 'apple';
  if(/summarizedActivities.*\.json$/i.test(b))return 'garminjson';
  if(/^training-session.*\.json$/i.test(b))return 'polar';
  if(/^physiological_cycles\.csv$/i.test(b))return 'whoopcycles';
  if(/^sleeps\.csv$/i.test(b))return 'whoopsleeps';
  if(/^workouts\.csv$/i.test(b))return 'whoopworkouts';
  if(/daily (activity )?(metrics|summar)/i.test(n)&&/\.csv$/i.test(b))return 'gfitdaily';
  if(/\.fit(\.gz)?$/i.test(b))return 'fit'; if(/\.gpx(\.gz)?$/i.test(b))return 'gpx'; if(/\.tcx(\.gz)?$/i.test(b))return 'tcx';
  if(/^activities.*\.csv$/i.test(b))return 'activitiescsv';
  return null;
}
const LABEL={stravatrack:'Strava tracks',apple:'Apple Health',garminjson:'Garmin',polar:'Polar',whoopcycles:'Whoop',whoopsleeps:'Whoop',whoopworkouts:'Whoop',gfitdaily:'Google Fit',fit:'FIT files',gpx:'GPX files',tcx:'TCX files',activitiescsv:'activities CSV'};
async function collect(files){
  const items=[];
  for(const f of files){
    if(/\.zip$/i.test(f.name)){
      const ents=await zipEntries(f), strava=ents.some(e=>/(^|\/)activities\.csv$/i.test(e.name));
      for(const en of ents){ if(en.name.endsWith('/'))continue; let kind=classify(en.name);
        /* in a Strava archive the files under activities/ are the GPS tracks of the workouts listed in activities.csv, so use them for best efforts only */
        if(strava&&/(^|\/)activities\/[^\/]+\.(fit|gpx|tcx)(\.gz)?$/i.test(en.name))kind='stravatrack';
        if(kind)items.push({kind,name:en.name,size:en.usize,file:f,en,stream:()=>entryStream(f,en)}) }
    }else{const kind=classify(f.name); if(kind)items.push({kind,name:f.name,size:f.size,file:f,stream:async()=>f.stream()}); else items.push({kind:null,name:f.name})}
  }
  return items;
}
/* Strava headers follow the account language, so also recognise it by shape: many columns and a numeric activity id in the first column */
function isStravaCSV(t){
  if(/Activity Date/.test(t.slice(0,3000)))return true;
  const l=t.split('\n',3); if(l.length<2)return false;
  return l[0].split(',').length>=32&&/^\s*\d{4,}\s*,/.test(l[1]);
}
function dedupe(acts){
  acts.sort((a,b)=>a.i-b.i||a.hour-b.hour); const out=[];
  /* the same workout often arrives twice, from the watch maker and from Strava. Same day, same sport, starts within 2 hours,
     and either a similar duration or a similar distance (moving and elapsed time can differ a lot, distance does not). */
  const same=(a,b)=>b.i===a.i&&b.type===a.type&&Math.abs(b.hour-a.hour)<=2&&
    (Math.abs(b.sec-a.sec)<Math.max(120,a.sec*.1)||(a.km>.3&&b.km>.3&&Math.abs(a.km-b.km)<Math.max(.3,Math.max(a.km,b.km)*.05)));
  acts.forEach(a=>{
    const k=out.find(b=>same(a,b));
    if(!k){out.push(a);return}
    /* keep one copy, but do not lose what only the other copy knows (heart rate, cadence, best efforts, the GPS file name) */
    ['hr','cad','best','file','pace'].forEach(f=>{if(k[f]==null&&a[f]!=null)k[f]=a[f]});
    if(!(k.elev>0)&&a.elev>0)k.elev=a.elev;
  });
  return out;
}
/* the entry point: any mix of files in, activities and health series out */
const INGEST_CACHE=new Map(), BEST_CACHE=new Map();
const itemKey=it=>it.file?[it.file.name,it.file.size,it.file.lastModified,it.name].join('|'):null;
async function ingest(files,onStatus,onProgress){
  const items=await collect(files), acts=[], H={vo2:[],rhr:[],sleep:[],steps:{}}, seen={}, errs=[], skipped=[];
  const note=(k,n)=>{const l=LABEL[k];seen[l]=(seen[l]||0)+n};
  const take=p=>{['vo2','rhr','sleep'].forEach(k=>{if(p[k]&&p[k].length&&!H[k].length)H[k]=p[k]});if(p.steps)Object.entries(p.steps).forEach(([d,v])=>{H.steps[d]=Math.max(H.steps[d]||0,v)})};
  const src=async it=>{const st=await it.stream();return /\.gz$/i.test(it.name)?st.pipeThrough(new DecompressionStream('gzip')):st};
  const text=async it=>new Response(await src(it)).text();
  const buf=async it=>new Response(await src(it)).arrayBuffer();
  let sleepAlt=[];
  /* a file that was already read is not read again: adding one more file to the set is instant */
  const apply=r=>{
    if(r.take)take(r.take); if(r.sleepAlt)sleepAlt=r.sleepAlt;
    if(r.acts)acts.push(...r.acts.map(a=>({...a})));
    (r.notes||[]).forEach(([k,n])=>note(k,n)); (r.seen||[]).forEach(([l,n])=>{seen[l]=(seen[l]||0)+n});
  };
  const work=items.filter(it=>it.kind&&it.kind!=='stravatrack'), hasTracks=items.some(it=>it.kind==='stravatrack');
  const W=hasTracks?.45:1, prog=f=>{if(onProgress)onProgress(Math.max(0,Math.min(1,f)))};
  let n=0, lastPct=-1;
  for(const it of items){
    if(!it.kind){skipped.push(it.name);continue}
    if(it.kind==='stravatrack')continue;
    n++; const key=itemKey(it);
    if(key&&INGEST_CACHE.has(key)){apply(INGEST_CACHE.get(key));prog(n/work.length*W);continue}
    if(onStatus&&(work.length<=3||n%10===1))onStatus('Reading '+LABEL[it.kind]+(work.length>3?' ('+n+' of '+work.length+')':'')+'...');
    try{
      const r={}; let a=null;
      switch(it.kind){
        case 'apple':{
          const inner=p=>{prog((n-1+p)/work.length*W);const pc=Math.round(p*100);if(onStatus&&pc!==lastPct&&pc%5===0){lastPct=pc;onStatus('Reading Apple Health, '+pc+'%...')}};
          let p; try{p=await parseHealthWorker(it,inner)}catch(e){p=await parseHealth(await it.stream(),it.size,inner)}
          r.take=p; r.notes=[['apple',p.counts.vo2+p.counts.rhr+p.counts.steps+p.counts.sleep]]; break}
        case 'activitiescsv':{const t=await text(it);const isS=isStravaCSV(t);a=isS?stravaActs(t):garminCSV(t);if(a.length){r.acts=a;r.seen=[[isS?'Strava':'Garmin',a.length]]}a=null;break}
        case 'garminjson':a=garminJSON(await text(it));break;
        case 'polar':a=polarJSON(await text(it));break;
        case 'whoopcycles':r.take=whoopCycles(await text(it));r.notes=[['whoopcycles',1]];break;
        case 'whoopsleeps':{const p=whoopSleeps(await text(it));if(p.sleep.length)r.sleepAlt=p.sleep;r.notes=[['whoopsleeps',1]];break}
        case 'whoopworkouts':a=whoopWorkouts(await text(it));break;
        case 'gfitdaily':r.take={steps:gfitDaily(await text(it),it.name)};r.notes=[['gfitdaily',1]];break;
        case 'fit':a=fitActs(await buf(it));break;
        case 'gpx':a=gpxActs(await text(it));break;
        case 'tcx':a=tcxActs(await text(it));break;
      }
      if(a){r.acts=a;r.notes=[[it.kind,a.length]]}
      if(key)INGEST_CACHE.set(key,r); apply(r);
    }catch(e){errs.push(it.name.split('/').pop()+': '+e.message)}
    prog(n/work.length*W);
    if(n%10===0)await new Promise(r=>setTimeout(r,0));
  }
  if(!H.sleep.length&&sleepAlt.length)H.sleep=sleepAlt;
  /* real best efforts from the Strava GPS tracks, remembered per track file */
  const tracks={}; items.forEach(it=>{if(it.kind==='stravatrack')tracks[it.name.split('/').pop().toLowerCase()]=it});
  const need=acts.filter(a=>a.type==='Run'&&a.file&&a.km>=5&&tracks[a.file.split('/').pop().toLowerCase()]);
  let bestN=0;
  for(let k=0;k<need.length;k++){
    const a=need[k], it=tracks[a.file.split('/').pop().toLowerCase()], key=itemKey(it);
    if(onStatus&&k%5===0)onStatus('Finding your best efforts, run '+(k+1)+' of '+need.length+'...');
    prog(W+(k/need.length)*(1-W));
    if(key&&BEST_CACHE.has(key)){const be=BEST_CACHE.get(key);if(be){a.best=be;bestN++}continue}
    let be=null;
    try{
      const name=it.name.toLowerCase(), raw=await src(it);
      const kind=/\.fit/.test(name)?'fit':/\.gpx/.test(name)?'gpx':'tcx';
      let tr; if(kind==='fit')tr=fitTrack(await new Response(raw).arrayBuffer()); else{const tx=await new Response(raw).text();tr=kind==='gpx'?gpxTrack(tx):tcxTrack(tx)}
      be=bestEfforts(tr); if(!Object.keys(be).length)be=null;
    }catch(e){}
    if(key)BEST_CACHE.set(key,be); if(be){a.best=be;bestN++}
    if(k%10===0)await new Promise(r=>setTimeout(r,0));
  }
  prog(1);
  if(bestN)seen['Best efforts from '+bestN+' runs']=bestN;
  const A=dedupe(acts);
  if(!A.length&&!H.rhr.length&&!H.sleep.length&&!Object.keys(H.steps).length){
    throw new Error(errs[0]||(skipped.length?'I did not recognise these files: '+skipped.slice(0,3).join(', ')+'. Drop the zip or CSV exactly as you downloaded it.':'No 2026 data found in these files.'));
  }
  if(A.length<3)throw new Error('I found '+(Object.keys(H.steps).length||H.rhr.length||H.sleep.length?'health data but ':'')+'only '+A.length+' workouts from 2026. Add your activity export too (Strava, Garmin, Polar, Whoop workouts or FIT/GPX/TCX files).');
  return {acts:A,health:H,seen,errs,skipped:skipped.length,dups:acts.length-A.length};
}
