/* ================= importer: Strava archive + Apple Health export, read in the browser, nothing uploaded ================= */
const NUM=s=>{const v=parseFloat(String(s==null?'':s).replace(',','.'));return isFinite(v)?v:NaN};
const MONI={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

/* ---- zip reader (stored and deflate, with zip64) ---- */
async function zipEntries(file){
  const size=file.size, tl=Math.min(size,66000);
  const tail=new DataView(await file.slice(size-tl,size).arrayBuffer());
  let e=-1; for(let i=tl-22;i>=0;i--){if(tail.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('This does not look like a zip file.');
  let cnt=tail.getUint16(e+10,true), cdSize=tail.getUint32(e+12,true), cdOff=tail.getUint32(e+16,true);
  if(cdOff===0xFFFFFFFF||cnt===0xFFFF||cdSize===0xFFFFFFFF){
    const loc=e-20; if(loc<0||tail.getUint32(loc,true)!==0x07064b50)throw new Error('Unsupported zip layout.');
    const zo=Number(tail.getBigUint64(loc+8,true)); const z=new DataView(await file.slice(zo,zo+56).arrayBuffer());
    cnt=Number(z.getBigUint64(32,true)); cdSize=Number(z.getBigUint64(40,true)); cdOff=Number(z.getBigUint64(48,true));
  }
  const cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()), dec=new TextDecoder(), out=[]; let p=0;
  for(let k=0;k<cnt&&p+46<=cd.byteLength;k++){
    if(cd.getUint32(p,true)!==0x02014b50)break;
    const method=cd.getUint16(p+10,true); let csize=cd.getUint32(p+20,true), usize=cd.getUint32(p+24,true);
    const nl=cd.getUint16(p+28,true), el=cd.getUint16(p+30,true), cl=cd.getUint16(p+32,true); let off=cd.getUint32(p+42,true);
    const name=dec.decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,nl));
    let q=p+46+nl; const end=q+el;
    while(q+4<=end){const id=cd.getUint16(q,true),len=cd.getUint16(q+2,true);
      if(id===1){let r=q+4;if(usize===0xFFFFFFFF){usize=Number(cd.getBigUint64(r,true));r+=8}if(csize===0xFFFFFFFF){csize=Number(cd.getBigUint64(r,true));r+=8}if(off===0xFFFFFFFF){off=Number(cd.getBigUint64(r,true));r+=8}}
      q+=4+len}
    out.push({name,method,csize,usize,off}); p+=46+nl+el+cl;
  }
  return out;
}
async function entryStream(file,en){
  const lh=new DataView(await file.slice(en.off,en.off+30).arrayBuffer());
  if(lh.getUint32(0,true)!==0x04034b50)throw new Error('Broken zip entry.');
  const start=en.off+30+lh.getUint16(26,true)+lh.getUint16(28,true);
  const raw=file.slice(start,start+en.csize).stream();
  if(en.method===0)return raw;
  if(en.method===8)return raw.pipeThrough(new DecompressionStream('deflate-raw'));
  throw new Error('Unsupported zip compression.');
}
/* returns a stream for the wanted file, whether the user dropped the zip or the file itself */
async function openSource(file,rx){
  if(/\.zip$/i.test(file.name)){
    const en=(await zipEntries(file)).find(x=>rx.test(x.name)&&!x.name.endsWith('/'));
    if(!en)throw new Error('Could not find the right file inside the zip.');
    return {stream:await entryStream(file,en),size:en.usize||file.size};
  }
  return {stream:file.stream(),size:file.size};
}

/* ---- CSV ---- */
function parseCSV(t){
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true; else if(c===','){row.push(f);f=''}
    else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''} else if(c!=='\r')f+=c}
  if(f!==''||row.length){row.push(f);rows.push(row)}
  return rows;
}
function parseStravaDate(s){
  s=String(s).trim(); const m=s.match(/^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4}),? (\d{1,2}):(\d{2}):(\d{2}) ?(AM|PM)$/i);
  if(m){let h=+m[4]%12;if(/pm/i.test(m[7]))h+=12;return Date.UTC(+m[3],MONI[m[1].toLowerCase()],+m[2],h,+m[5],+m[6])}
  const t=Date.parse(s.replace(' ','T')+'Z'); return isFinite(t)?t:null;
}
const TYPEMAP=[[/run/i,'Run'],[/ride|cycl|bike/i,'Ride'],[/^walk/i,'Walk'],[/hike/i,'Hike'],[/weight|crossfit|strength/i,'Strength']];
const mapType=t=>{t=String(t).trim();for(const [r,n] of TYPEMAP)if(r.test(t))return n;return t||'Other'};

function stravaActs(text){
  const rows=parseCSV(text); if(rows.length<2)throw new Error('The Strava file has no activities.');
  const H=rows[0].map(h=>h.trim()), last=n=>H.lastIndexOf(n), first=n=>H.indexOf(n);
  const c={date:last('Activity Date'),type:last('Activity Type'),dist:last('Distance'),dist0:first('Distance'),mov:last('Moving Time'),ela:last('Elapsed Time'),elev:last('Elevation Gain'),hr:last('Average Heart Rate'),cad:last('Average Cadence')};
  if(c.date<0||c.type<0)throw new Error('Could not find the Strava columns. The export must use English headers (Activity Date, Activity Type).');
  const acts=[]; let seen=0;
  for(let r=1;r<rows.length;r++){
    const R=rows[r]; if(R.length<=c.type)continue;
    const ms=parseStravaDate(R[c.date]); if(ms===null)continue;
    const d=new Date(ms); if(d.getFullYear()!==2026)continue; seen++;
    const dateMs=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()), type=mapType(R[c.type]);
    let km=c.dist>=0?NUM(R[c.dist]):NaN;
    if(isFinite(km)){ if(c.dist!==c.dist0||km>1000)km=km/1000 } else km=0;
    let sec=NUM(R[c.mov]); if(!isFinite(sec)||sec<=0)sec=NUM(R[c.ela]); if(!isFinite(sec)||sec<=0)continue;
    if(type==='Run'&&km<.5)continue;
    const a={type,i:Math.round((dateMs-T0)/DAY),date:dateMs,dow:d.getDay(),hour:d.getHours(),km,sec,elev:isFinite(NUM(R[c.elev]))?NUM(R[c.elev]):0};
    if(type==='Run')a.pace=sec/km;
    const hr=NUM(R[c.hr]); if(hr>40&&hr<230)a.hr=Math.round(hr);
    let cad=NUM(R[c.cad]); if(cad>0){if(type==='Run'&&cad<120)cad*=2;if(type==='Run'||!isFinite(a.cad))a.cad=Math.round(cad)}
    acts.push(a);
  }
  if(!acts.length)throw new Error(seen?'No usable 2026 activities found.':'No 2026 activities found in this file.');
  return acts;
}
async function readStravaFile(file){
  const {stream}=await openSource(file,/(^|\/)activities\.csv$/i);
  return stravaActs(await new Response(stream).text());
}

/* ---- Apple Health (streamed, so a multi gigabyte export.xml is fine) ---- */
const attr=(line,name)=>{const k=line.indexOf(' '+name+'="');if(k<0)return null;const s=k+name.length+3;return line.slice(s,line.indexOf('"',s))};
const dayIdx=s=>(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))-T0)/DAY;
const tsMs=s=>{const m=s.match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d) ([+-])(\d\d)(\d\d)$/);if(!m)return NaN;return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6])-(m[7]==='-'?-1:1)*(+m[8]*60+ +m[9])*60000};
async function parseHealth(stream,size,onProgress){
  const rd=stream.getReader(), dec=new TextDecoder(); let buf='',read=0;
  const vo2={},rhr={},steps={},sleep={},cnt={vo2:0,rhr:0,steps:0,sleep:0};
  const bump=(o,k,v)=>{(o[k]=o[k]||{s:0,n:0});o[k].s+=v;o[k].n++};
  const nest=(o,src,d,v)=>{((o[src]=o[src]||{})[d]=(o[src][d]||0)+v)};
  const handle=line=>{
    if(line.indexOf('<Record ')<0)return;
    const t=attr(line,'type'); if(!t)return;
    let kind=t==='HKQuantityTypeIdentifierVO2Max'?'vo2':t==='HKQuantityTypeIdentifierRestingHeartRate'?'rhr':t==='HKQuantityTypeIdentifierStepCount'?'steps':t==='HKCategoryTypeIdentifierSleepAnalysis'?'sleep':null;
    if(!kind)return;
    const st=attr(line,'startDate'),en=attr(line,'endDate'); if(!st||!en)return;
    if(kind==='sleep'){
      if(en.slice(0,4)!=='2026')return; const v=attr(line,'value'); if(!v||v.indexOf('Asleep')<0)return;
      const a=tsMs(st),b=tsMs(en); if(!isFinite(a)||!isFinite(b)||b<=a)return;
      nest(sleep,attr(line,'sourceName')||'x',dayIdx(en),(b-a)/3600000); cnt.sleep++; return;
    }
    if(st.slice(0,4)!=='2026')return;
    const v=parseFloat(attr(line,'value')); if(!isFinite(v))return; const d=dayIdx(st);
    if(kind==='vo2'){bump(vo2,Math.floor(d/7)*7,v);cnt.vo2++}
    else if(kind==='rhr'){bump(rhr,Math.floor(d/7)*7,v);cnt.rhr++}
    else {nest(steps,attr(line,'sourceName')||'x',d,v);cnt.steps++}
  };
  for(;;){
    const {done,value}=await rd.read(); if(done)break;
    read+=value.length; buf+=dec.decode(value,{stream:true});
    let p,s=0; while((p=buf.indexOf('\n',s))>=0){handle(buf.slice(s,p));s=p+1} buf=buf.slice(s);
    if(onProgress)onProgress(Math.min(1,read/(size||read)));
  }
  if(buf)handle(buf);
  const weekly=o=>Object.keys(o).map(Number).sort((a,b)=>a-b).map(i=>({i,v:o[i].s/o[i].n}));
  /* overlapping devices would double count, so for steps and sleep take the busiest source per day */
  const perDay=src=>{const m={};Object.values(src).forEach(days=>Object.entries(days).forEach(([d,v])=>{m[d]=Math.max(m[d]||0,v)}));return m};
  const stepDay=perDay(steps), sleepDay=perDay(sleep), sw={};
  Object.entries(sleepDay).forEach(([d,h])=>{if(h>=3&&h<=14){const w=Math.floor(d/7)*7;(sw[w]=sw[w]||{s:0,n:0});sw[w].s+=h;sw[w].n++}});
  return {vo2:weekly(vo2),rhr:weekly(rhr),sleep:weekly(sw),steps:stepDay,counts:cnt};
}
async function readHealthFile(file,onProgress){
  const {stream,size}=await openSource(file,/(^|\/)export\.xml$/i);
  return parseHealth(stream,size,onProgress);
}

/* ---- put it together as a profile the deck engine understands ---- */
function buildReal(acts,health){
  const end=Math.min(Date.now(),Date.UTC(2026,11,31)), n=Math.max(60,Math.round((end-T0)/DAY)+1);
  setN(n);
  const A=acts.filter(a=>a.i>=0&&a.i<n), daySteps=new Array(n).fill(0);
  if(health)Object.entries(health.steps||{}).forEach(([d,v])=>{if(+d>=0&&+d<n)daySteps[+d]=Math.round(v)});
  const cut=a=>(a||[]).filter(p=>p.i>=0&&p.i<n);
  return {id:'mine',name:'Your data',real:true,N:n,Y:{acts:A,daySteps,vo2:cut(health&&health.vo2),rhr:cut(health&&health.rhr),sleep:cut(health&&health.sleep)}};
}
