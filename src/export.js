/* ================= export cards as 1080x1920 PNGs (Instagram story size), drawn in the browser ================= */
let FONTCSS=null;
async function fontCSS(){
  if(FONTCSS!==null)return FONTCSS;
  let css=''; const ctl=new AbortController(), kill=setTimeout(()=>ctl.abort(),12000);
  try{
    const links=[...document.querySelectorAll('link[rel=stylesheet][href*="fonts.googleapis.com"]')];
    for(const l of links){
      let t=await (await fetch(l.href,{signal:ctl.signal})).text();
      const urls=[...new Set([...t.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
      for(const u of urls){
        const b=await (await fetch(u,{signal:ctl.signal})).blob();
        const d=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
        t=t.split(u).join(d);
      }
      css+=t+'\n';
    }
  }catch(e){css=''}
  clearTimeout(kill); return FONTCSS=css;
}
function pageCSS(){
  let out='';
  for(const s of document.styleSheets){try{for(const r of s.cssRules)out+=r.cssText+'\n'}catch(e){}}
  return out;
}
async function cardToPNG(i,W=1080,H=1920){
  const theme=[...document.body.classList].find(c=>/^t-/.test(c))||'t-bold';
  const host=document.createElement('div');
  host.className=theme;
  host.style.cssText=`position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;display:flex;pointer-events:none`;
  host.innerHTML=cardHTML(DECK[i],i,DECK.length);
  document.body.appendChild(host);
  const card=host.firstElementChild; card.classList.add('active');
  try{
    await (document.fonts&&document.fonts.ready);
    fitBig(); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const xml=new XMLSerializer().serializeToString(card);
    const css=(await fontCSS())+pageCSS()+'*{animation:none!important;transition:none!important}';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="${W}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml" class="${theme}" style="width:${W}px;height:${H}px;display:flex"><style>${css.replace(/</g,'&lt;')}</style>${xml}</div></foreignObject></svg>`;
    const img=new Image(); img.decoding='sync';
    await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(new Error('Could not draw this card as an image in this browser.'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H; cv.getContext('2d').drawImage(img,0,0,W,H);
    return await new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('Image export failed')),'image/png'));
  }finally{host.remove();fitBig()}
}
/* tiny zip writer (stored, no compression) so "save all" is one file */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function makeZip(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  files.forEach(f=>{const nm=enc.encode(f.name),crc=crc32(f.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);
    parts.push(new Uint8Array(h.buffer),nm,f.data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nm); off+=30+nm.length+f.data.length});
  const cds=cd.reduce((s,x)=>s+x.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cds,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/zip'});
}
function saveBlob(b,name){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},2000)}
const pn=i=>`2026-recap-${String(i+1).padStart(2,'0')}.png`;
async function saveCurrent(){
  const b=await cardToPNG(idx), f=new File([b],pn(idx),{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})&&/Android|iPhone|iPad/i.test(navigator.userAgent)){try{await navigator.share({files:[f]});return}catch(e){if(e&&e.name==='AbortError')return}}
  saveBlob(b,pn(idx));
}
/* save only the chosen cards: shared as several images on a phone, otherwise one image or one zip */
async function saveSelected(ids,setMsg){
  ids=[...ids].sort((a,b)=>a-b); const files=[];
  for(let k=0;k<ids.length;k++){setMsg('Drawing card '+(k+1)+' of '+ids.length+'...');const b=await cardToPNG(ids[k]);files.push({name:pn(ids[k]),blob:b,data:new Uint8Array(await b.arrayBuffer())})}
  const fl=files.map(f=>new File([f.blob],f.name,{type:'image/png'}));
  if(/Android|iPhone|iPad/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:fl})){try{await navigator.share({files:fl});return}catch(e){if(e&&e.name==='AbortError')return}}
  if(files.length===1)saveBlob(files[0].blob,files[0].name); else saveBlob(makeZip(files),'2026-recap-selected.zip');
}
async function saveAll(setMsg){
  const files=[];
  for(let i=0;i<DECK.length;i++){setMsg('Drawing card '+(i+1)+' of '+DECK.length+'...');files.push({name:pn(i),data:new Uint8Array(await (await cardToPNG(i)).arrayBuffer())})}
  saveBlob(makeZip(files),'2026-recap-cards.zip'); setMsg('');
}
