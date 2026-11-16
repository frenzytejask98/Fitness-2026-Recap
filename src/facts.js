/* ================= fact catalog =================
   Each fact belongs to a slot (one card). calc(M) gives a number r. fit(r, kind) turns it into 0..1:
   0 means "not impressive or not true enough, skip". The picker multiplies by a theme-diversity factor
   and adds a small deterministic jitter per person, then takes the best fact for each slot. */
const X=r=>r>=100?nf.format(r):r>=10?r.toFixed(0):r.toFixed(1);
const B=s=>`<b>${s}</b>`;
function fit(r,kind){
  if(!isFinite(r)||r<=0)return 0;
  if(kind==='x'){return r<.9?0:r<1.5?.7:r<=25?1:r<=100?.75:r<=1000?.4:0}
  if(kind==='n'){return r>=30&&r<=30000?.8:0}
  if(kind==='pct'){return r<3?0:r<=100?.7:0}
  if(kind==='min'){return r>=3&&r<=180?.9:0}
  if(kind==='fixed')return .5;
  return 0;
}
const KINDS={x:'multiple, best between 1.5× and 25×',n:'count, best between 30 and 30,000',pct:'percent, needs 3% or more',min:'minutes or seconds, needs a visible gain',fixed:'always true, low priority'};
const FACTS=[];
const add=f=>FACTS.push(f);
/* factories */
const xf=(slot,id,theme,name,m,unit,mk,rule)=>add({slot,id,theme,name,kind:'x',rule,calc:M=>m(M)/unit,text:(r,M)=>r<1.5?mk.one(name):mk.many(X(r),name)});
const nfc=(slot,id,theme,name,m,unit,tpl,rule)=>add({slot,id,theme,name,kind:'n',rule,calc:M=>m(M)/unit,text:(r,M)=>tpl(nf.format(r),name)});
const ROUTE={one:n=>`That is about ${B('one '+n)}, end to end.`,many:(x,n)=>`That is ${B(x+'×')} ${n}, end to end.`};
const TOWER={one:n=>`That is about ${B('one '+n)}, stacked up.`,many:(x,n)=>`That is ${B(x+'×')} the ${n}, stacked up.`};
const PEAK={one:n=>`That is about ${B('one '+n)}, climbed from sea level.`,many:(x,n)=>`That is ${B(x+'×')} ${n}, climbed from sea level.`};
const FLY={one:n=>`That is about ${B('one '+n)} of pure movement.`,many:(x,n)=>`That is ${B(x+'×')} ${n}.`};

/* DISTANCE (all sports, km) */
[['London to Paris',344],['Tokyo to Osaka',510],['Los Angeles to San Francisco',615],['London to Edinburgh',650],['The Camino de Santiago',800],['Sydney to Melbourne',880],['Paris to Rome',1100],['New York to Chicago',1150],['Land’s End to John o’Groats',1400],['The Tour de France route',3400],['The Appalachian Trail',3500],['Route 66',3940]]
 .forEach(([n,k])=>xf('distance','d-'+n.toLowerCase().replace(/\W+/g,'-'),'geo',n,M=>M.distKm,k,ROUTE,`total km ÷ ${nf.format(k)} km`));
xf('distance','d-marathon','sport','marathons',M=>M.distKm,42.195,{one:()=>`That is about ${B('one marathon')}.`,many:(x)=>`That is ${B(x+' marathons')} back to back.`},'total km ÷ 42.195 km');
xf('distance','d-channel','water','English Channel crossings, Dover to Calais, on foot',M=>M.distKm,33.8,{one:n=>`That is about ${B('one crossing')}.`,many:(x,n)=>`That is ${B(x)} ${n}.`},'total km ÷ 33.8 km');
nfc('distance','d-laps','track','laps of a 400 m track',M=>M.distKm,.4,(x,n)=>`That is ${B(x)} ${n}. The track knows you by name.`,'total km ÷ 0.4 km');
nfc('distance','d-pitches','ball','football pitches, end to end',M=>M.distKm,.105,(x,n)=>`That is ${B(x)} ${n}.`,'total km ÷ 0.105 km');
add({slot:'distance',id:'d-earth',theme:'space',name:'Share of the way around the Earth',kind:'pct',rule:'total km ÷ 40,075 km × 100',calc:M=>M.distKm/40075*100,text:r=>`That is ${B(r.toFixed(1)+'%')} of the way around the Earth.`});

/* CLIMB (elevation gain, m) */
[['Statue of Liberty',93],['Big Ben',96],['Eiffel Tower',330],['Empire State Building',443],['Burj Khalifa',828]].forEach(([n,h])=>xf('climb','c-'+n.toLowerCase().replace(/\W+/g,'-'),'tower',n,M=>M.elev,h,TOWER,`elevation ÷ ${h} m`));
[['Ben Nevis',1345],['Mount Fuji',3776],['Mont Blanc',4808],['Kilimanjaro',5895],['Everest',8849]].forEach(([n,h])=>xf('climb','c-'+n.toLowerCase().replace(/\W+/g,'-'),'peak',n,M=>M.elev,h,PEAK,`elevation ÷ ${nf.format(h)} m`));
nfc('climb','c-floors','tower','floors of a skyscraper',M=>M.elev,3.5,(x,n)=>`That is ${B(x)} ${n}. Take the stairs, obviously.`,'elevation ÷ 3.5 m');
nfc('climb','c-stairs','tower','stair steps',M=>M.elev,.17,(x,n)=>`That is ${B(x)} ${n}.`,'elevation ÷ 0.17 m');

/* TIME (all sports, hours) */
xf('time','t-flight-lny','travel','flights from London to New York',M=>M.hrs,8,{one:()=>`That is about ${B('one flight')} from London to New York.`,many:(x,n)=>`That is ${B(x)} ${n}. You earned the window seat.`},'hours ÷ 8 h');
xf('time','t-flight-syd','travel','flights from Sydney to Los Angeles',M=>M.hrs,14,{one:()=>`That is about ${B('one flight')} from Sydney to Los Angeles.`,many:(x,n)=>`That is ${B(x)} ${n}.`},'hours ÷ 14 h');
xf('time','t-apollo','space','Apollo 11 round trips to the Moon',M=>M.hrs,195,{one:()=>`That is about ${B('one whole Apollo 11 trip')} to the Moon and back.`,many:(x,n)=>`That is ${B(x+'×')} the whole Apollo 11 trip to the Moon and back.`},'hours ÷ 195 h');
xf('time','t-nights','body','full nights of sleep',M=>M.hrs,8,{one:()=>`That is about ${B('one full night')} of sleep, spent moving.`,many:(x,n)=>`That is ${B(x)} ${n}, spent moving instead.`},'hours ÷ 8 h');
xf('time','t-films','screen','feature films',M=>M.hrs,2,{one:()=>`That is about ${B('one feature film')}.`,many:(x,n)=>`That is ${B(x)} ${n} you did not need to watch.`},'hours ÷ 2 h');
xf('time','t-workweeks','work','full-time work weeks',M=>M.hrs,40,{one:()=>`That is about ${B('one full-time work week')}.`,many:(x,n)=>`That is ${B(x)} ${n}, done on your own terms.`},'hours ÷ 40 h');
nfc('time','t-matches','ball','football matches',M=>M.hrs,1.5,(x,n)=>`That is ${B(x)} ${n}, with extra time.`,'hours ÷ 1.5 h');
nfc('time','t-sauna','sauna','sauna sessions',M=>M.hrs*3,1,(x,n)=>`Enough time for ${B(x)} ${n} of 20 minutes.`,'hours × 3');

/* CONSISTENCY */
[['a two-week holiday',14],['a whole Tour de France, rest days included',23],['Dry January, but better',31],['all of Lent',40]].forEach(([n,d])=>add({slot:'consistency',id:'k-'+d,theme:'calendar',name:n,kind:'x',rule:`longest streak ÷ ${d} days`,calc:M=>M.streak/d,text:(r,M)=>r<1.5?`Your streak matches ${B(n)}.`:`Your streak is ${B(X(r)+'×')} ${n}.`}));
add({slot:'consistency',id:'k-week',theme:'plain',name:'Active days per week',kind:'fixed',rule:'active days ÷ weeks',calc:M=>M.activePerWeek,text:(r,M)=>`You moved on ${B(r.toFixed(1)+' days a week')}, every week of the year.`});
add({slot:'consistency',id:'k-rest',theme:'plain',name:'Rest days earned',kind:'fixed',rule:'days without activity',calc:M=>M.N-M.activeDays,text:(r,M)=>`The other ${B(nf.format(r)+' days')} were rest. Every one of them earned.`});
add({slot:'consistency',id:'k-every',theme:'plain',name:'One day in every N',kind:'fixed',rule:'days ÷ active days',calc:M=>M.N/M.activeDays,text:(r,M)=>`You were active ${B('1 day in every '+r.toFixed(1))}.`});

/* BIGGEST MONTH */
add({slot:'month',id:'m-perday',theme:'plain',name:'Kilometres per day in the best month',kind:'fixed',rule:'peak month km ÷ days',calc:M=>M.peak.km/30,text:(r,M)=>`That is ${B(r.toFixed(1)+' km')} on average, every single day of the month.`,ok:M=>M.peak.km>=60});
xf('month','m-5k','sport','5K runs in one month',M=>M.peak.km,5,{one:()=>'',many:(x)=>`That is the same as ${B(x+' parkruns')} in one month.`},'peak month km ÷ 5 km');
xf('month','m-week','sport','marathons in your biggest week',M=>M.bestWeek,42.195,{one:()=>`Your biggest week was about ${B('one marathon')} of movement.`,many:(x)=>`Your biggest week was ${B(x+'×')} a marathon.`},'best week km ÷ 42.195 km');
xf('month','m-channel','water','Channel crossings in one month',M=>M.peak.km,33.8,{one:()=>'',many:(x)=>`That month alone was ${B(x)} Channel crossings on foot.`},'peak month km ÷ 33.8 km');

/* RIDE */
xf('ride','r-stage','sport','Tour de France stages',M=>M.rideKm,170,{one:()=>`That is about ${B('one Tour de France stage')}.`,many:(x)=>`That is ${B(x)} full Tour de France stages.`},'ride km ÷ 170 km');
xf('ride','r-lp','geo','London to Paris rides',M=>M.rideKm,344,{one:()=>`That is about ${B('London to Paris')}, by bike.`,many:(x)=>`That is ${B(x+'×')} London to Paris, by bike.`},'ride km ÷ 344 km');
xf('ride','r-lejog','geo','Land’s End to John o’Groats',M=>M.rideKm,1400,{one:()=>`That is about ${B('Land’s End to John o’Groats')}.`,many:(x)=>`That is ${B(x+'×')} Land’s End to John o’Groats.`},'ride km ÷ 1,400 km');
xf('ride','r-films','screen','feature films in the saddle',M=>M.rideHrs,2,{one:()=>'',many:(x)=>`That is ${B(x)} feature films, but you were outside.`},'saddle hours ÷ 2 h');

/* HIKE */
xf('hike','h-nevis','peak','Ben Nevis',M=>M.hikeElev,1345,{one:()=>`Your hikes add up to about ${B('one Ben Nevis')}.`,many:(x)=>`Your hikes add up to ${B(x+'×')} Ben Nevis.`},'hike elevation ÷ 1,345 m');
xf('hike','h-fuji','peak','Mount Fuji',M=>M.hikeElev,3776,{one:()=>`Your hikes add up to about ${B('one Mount Fuji')}.`,many:(x)=>`Your hikes add up to ${B(x+'×')} Mount Fuji.`},'hike elevation ÷ 3,776 m');
xf('hike','h-marathon','sport','marathons on trails',M=>M.hikeKm,42.195,{one:()=>'',many:(x)=>`Your trail days cover ${B(x)} marathons of distance, with views.`},'hike km ÷ 42.195 km');

/* STRENGTH */
add({slot:'strength',id:'s-week',theme:'plain',name:'Sessions per week',kind:'fixed',rule:'sessions ÷ weeks',calc:M=>M.strength/(N/7),text:(r,M)=>`That is about ${B(r.toFixed(1)+' sessions a week')}, all year.`});
xf('strength','s-films','screen','feature films under the bar',M=>M.strengthHrs,2,{one:()=>'',many:(x)=>`That is ${B(x)} feature films of lifting heavy things.`},'strength hours ÷ 2 h');

/* SPEED (needs enough runs) */
const sp=(id,theme,name,kind,rule,calc,text,ok)=>add({slot:'speed',id,theme,name,kind,rule,calc,text,ok:M=>M.hasRuns&&(!ok||ok(M))});
sp('p-marathon','sport','Minutes saved over a marathon','min','pace gain × 42.195 km',M=>M.gain*42.195/60,(r)=>`Over a marathon, that is ${B(Math.round(r)+' minutes')} back in your pocket.`);
sp('p-5k','sport','Seconds saved over a 5K','min','pace gain × 5 km',M=>M.gain*5,(r)=>`A 5K at your new pace is ${B(Math.round(r)+' seconds')} quicker.`,M=>M.gain*5>=20&&M.gain*5<180);
sp('p-walk','body','Speed vs a brisk walk','x','speed ÷ 5 km/h',M=>M.speed/5,(r,M)=>`You now average ${B(M.speed.toFixed(1)+' km/h')}, ${B(X(r)+'×')} a brisk walk.`);
sp('p-chicken','animal','Speed vs a sprinting chicken','x','speed ÷ 14 km/h',M=>M.speed/14,(r,M)=>`At ${B(M.speed.toFixed(1)+' km/h')} you are as fast as a ${B('sprinting chicken')}. Respect.`);
sp('p-bolt','sport','Share of Usain Bolt’s 100 m average speed','pct','speed ÷ 37.6 km/h × 100',M=>M.speed/37.6*100,(r)=>`Your average speed is ${B(Math.round(r)+'%')} of Usain Bolt’s average over 100 m.`,M=>M.speed/37.6*100>=20);
sp('p-steps','body','Steps taken while running','x','cadence × running minutes ÷ 1M',M=>M.runSteps/1e6,(r)=>`You took about ${B(X(r)+' million steps')} while running. Each one counted.`,M=>M.hasCad);
sp('p-beats','body','Heartbeats while running','x','heart rate × running minutes ÷ 1M',M=>M.runHeartbeats/1e6,(r)=>`Your heart beat about ${B(X(r)+' million times')} while you ran. A very long drum solo.`,M=>M.hasHr);

/* PERSONAL BEST line */
const pr=(id,theme,name,calc,text)=>add({slot:'pr',id,theme,name,kind:'fixed',rule:'from your first and best 5K, 10K or half',calc,text,ok:M=>M.hasRuns&&M.prs&&M.prs.length>0});
pr('b-jan','plain','January self',M=>M.prs[0].then-M.prs[0].now,(r,M)=>`Your January self would finish ${B(hms(r))} behind you over ${M.prs[0].d}.`);
pr('b-total','plain','Total time saved',M=>sum(M.prs,p=>p.then-p.now),(r,M)=>`Across ${M.prs.length===1?'your PR':'your PRs'} you saved ${B(hms(r))} in one year.`);

/* VO2 MAX */
const vo=(id,theme,name,kind,rule,calc,text)=>add({slot:'vo2',id,theme,name,kind,rule,calc,text,ok:M=>M.hasVo2&&M.vo2gain>0.5});
vo('v-pct','body','Percent bigger engine','pct','gain ÷ starting VO₂ × 100',M=>M.vo2gain/M.vo2a*100,r=>`That is a ${B(Math.round(r)+'% bigger engine')}. Same body, more horsepower.`);
vo('v-years','body','Years of age-related decline reversed','x','gain ÷ 0.4 per year',M=>M.vo2gain/.4,r=>`Roughly ${B(X(r)+' years')} of normal age-related decline, turned back.`);

/* RESTING HEART RATE */
const rh=(id,theme,name,kind,rule,calc,text)=>add({slot:'rhr',id,theme,name,kind,rule,calc,text,ok:M=>M.hasRhr&&M.rhrDrop>=2});
rh('r-day','body','Fewer heartbeats per day','n','drop × 1,440 min',M=>M.rhrDrop*1440,r=>`That is ${B(nf.format(r)+' fewer heartbeats')} every single day. Your heart gets to chill.`);
rh('r-year','body','Fewer heartbeats per year','x','drop × 1,440 × 365 ÷ 1M',M=>M.rhrDrop*1440*365/1e6,r=>`That is about ${B(X(r)+' million fewer beats')} a year.`);
rh('r-pct','body','Percent slower resting pulse','pct','drop ÷ start × 100',M=>M.rhrDrop/M.rhra*100,r=>`A resting pulse ${B(Math.round(r)+'% slower')} than in January.`);

/* SLEEP */
const sl=(id,theme,name,kind,rule,calc,text)=>add({slot:'sleep',id,theme,name,kind,rule,calc,text,ok:M=>M.hasSleep&&M.sleepMin>=8});
sl('z-days','body','Extra days of sleep per year','x','gain min × 365 ÷ 1,440',M=>M.sleepMin*365/1440,r=>`That is ${B(X(r)+' extra days')} of sleep per year. Professional-level napping.`);
sl('z-cycles','body','Extra 90 minute sleep cycles per year','n','gain min × 365 ÷ 90',M=>M.sleepMin*365/90,r=>`That is ${B(nf.format(r)+' extra sleep cycles')} a year, each one a full dream cycle.`);
sl('z-hours','body','Extra hours per year','n','gain min × 365 ÷ 60',M=>M.sleepMin*365/60,r=>`That is ${B(nf.format(r)+' more hours')} of sleep a year.`);

/* STEPS */
[['London to Paris',344],['London to Edinburgh',650],['Paris to Rome',1100],['New York to Chicago',1150],['Land’s End to John o’Groats',1400],['New York to Dallas',2200],['Route 66',3940]]
 .forEach(([n,k])=>xf('steps','st-'+n.toLowerCase().replace(/\W+/g,'-'),'geo',n,M=>M.stepsKm,k,{one:n=>`Your daily steps alone cover about ${B('one '+n)}.`,many:(x,n)=>`Your daily steps alone cover ${B(x+'×')} ${n}.`},`step km ÷ ${nf.format(k)} km`));
xf('steps','st-shoes','shoes','pairs of running shoes retired',M=>M.stepsKm,700,{one:()=>`That is about ${B('one pair of shoes')} worn out.`,many:(x,n)=>`That is ${B(x)} ${n} (700 km each).`},'step km ÷ 700 km');
add({slot:'steps',id:'st-earth',theme:'space',name:'Share of the way around the Earth',kind:'pct',rule:'step km ÷ 40,075 km × 100',calc:M=>M.stepsKm/40075*100,text:r=>`Your steps alone are ${B(r.toFixed(1)+'%')} of the way around the Earth.`});
xf('steps','st-best','body','half marathons of steps in one day',M=>M.stepsBest.v*.75/1000,21.0975,{one:()=>`Your best day was about ${B('one half marathon')} of steps.`,many:(x)=>`Your best day was ${B(x+'×')} a half marathon of steps.`},'best day steps × 0.75 m ÷ 21.1 km');
add({slot:'steps',id:'st-10k',theme:'plain',name:'Days over 10,000 steps',kind:'fixed',rule:'days with 10,000+ steps',calc:M=>M.over10,text:(r,M)=>`${B(nf.format(r)+' days')} went past 10,000 steps.`,ok:M=>M.over10>=20});

/* RHYTHM */
const rt=(id,theme,name,kind,rule,calc,text,ok)=>add({slot:'rhythm',id,theme,name,kind,rule,calc,text,ok});
rt('y-dawn','sun','Early starts','pct','share before 8 am × 100',M=>M.dawn*100,r=>`${B(Math.round(r)+'%')} of your workouts started before 8 am. The sunrise is your accomplice.`,M=>M.dawn>=.3);
rt('y-eve','sun','Evening sessions','pct','share after 5 pm × 100',M=>M.eve*100,r=>`${B(Math.round(r)+'%')} of your workouts happened after 5 pm. Golden hour, every time.`,M=>M.eve>=.3);
rt('y-weekend','calendar','Weekend share','pct','weekend sessions ÷ all × 100',M=>M.weekend*100,r=>`${B(Math.round(r)+'%')} of your sessions landed on a weekend. You make weekends count.`,M=>M.weekend>=.4);
rt('y-sunday','calendar','Long Sunday runs','n','Sunday runs of 10 km or more',M=>M.sundayLong*30,(r,M)=>`${B(M.sundayLong+' long Sunday runs')}. That is a tradition now.`,M=>M.sundayLong>=8);
rt('y-slot','plain','Standing appointment','fixed','always true',M=>1,(r,M)=>`Nobody books a meeting on ${B(DAYN[M.topDow]+' at '+String(M.topHour).padStart(2,'0')+':00')}. It is sacred.`);

/* ================= archetypes ================= */
const TYPES=[
 {id:'dawn',t:'The Dawn Patrol',s:M=>M.dawn/.5,why:M=>`${Math.round(M.dawn*100)}% of your workouts started before 8 am.`,hype:'Up before the world.'},
 {id:'eve',t:'The Golden Hour Regular',s:M=>M.eve/.5,why:M=>`${Math.round(M.eve*100)}% of your workouts happened after 5 pm.`,hype:'Chasing the light.'},
 {id:'sun',t:'The Sunday Ritualist',s:M=>M.sundayLong/40,why:M=>`${M.sundayLong} long runs on Sundays. Same slot, every week.`,hype:'Sundays belong to you.'},
 {id:'comeback',t:'The Comeback Engine',s:M=>M.hasRuns?M.gain/45:0,why:M=>`${Math.round(M.gain||0)} seconds per km faster than in January.`,hype:'Look how far you came.'},
 {id:'consistency',t:'The Consistency Machine',s:M=>(M.activeDays/N)/.7,why:M=>`You moved on ${Math.round(M.activeDays/N*100)}% of all days.`,hype:'You just keep showing up.'},
 {id:'hill',t:'The Hill Hunter',s:M=>(M.elev/Math.max(1,M.distKm))/30,why:M=>`${Math.round(M.elev/M.distKm)} metres climbed for every kilometre.`,hype:'Uphill is home.'},
 {id:'weekend',t:'The Weekend Warrior',s:M=>M.weekend/.65,why:M=>`${Math.round(M.weekend*100)}% of your sessions were on a weekend.`,hype:'Weekends, fully used.'},
 {id:'multi',t:'The Multi-Sport Magician',s:M=>M.sports.length/4,why:M=>`${M.sports.length} different sports, each done at least 8 times.`,hype:'Never just one thing.'},
 {id:'long',t:'The Long Run Legend',s:M=>M.longestRun.km/32,why:M=>`Your longest run was ${M.longestRun.km.toFixed(1)} km.`,hype:'Distance is your language.'},
 {id:'steps',t:'The Step Collector',s:M=>M.stepsAvg/14000,why:M=>`${nf.format(M.stepsAvg)} steps a day, on average.`,hype:'Every step counts, and you counted.'},
 {id:'pedal',t:'The Pedal Pusher',s:M=>M.rideKm/Math.max(1,M.distKm)/.55,why:M=>`${Math.round(M.rideKm/M.distKm*100)}% of your distance was on a bike.`,hype:'Wheels up.'},
 {id:'rest',t:'The Recovery Pro',s:M=>M.sleepMin/50,why:M=>`${Math.round(M.sleepMin)} more minutes of sleep a night than in January.`,hype:'Rest is training too.'},
 {id:'heart',t:'The Heart of an Athlete',s:M=>M.rhrDrop/10,why:M=>`Your resting heart rate dropped ${Math.round(M.rhrDrop)} bpm.`,hype:'Built from the inside.'}
];

/* ================= goals for next year ================= */
const GOALS=[
 {id:'g-dist',theme:'dist',p:M=>.5,text:M=>`Move ${B(nf.format(Math.ceil(M.projKm*1.1/50)*50)+' km')} in 2027`,rule:'forecast × 1.1, rounded to 50'},
 {id:'g-5k',theme:'pr',p:M=>M.hasRuns&&M.prs[0]&&M.prs[0].d==='5K'?.9-Math.min(.5,((M.prs[0].now-1)%60)/120):0,text:M=>{const t=Math.floor((M.prs[0].now-1)/60)*60;return `Break ${B(hms(t))} for 5K, only ${B(Math.round(M.prs[0].now-t)+' s')} away`},rule:'next whole minute below your 5K PR'},
 {id:'g-half',theme:'pr',p:M=>M.hasRuns&&M.longestRun.km>=10&&!M.prs.find(p=>p.d==='Half marathon')?.8:0,text:M=>`Run your first ${B('half marathon')}`,rule:'longest run 10 km or more, no half yet'},
 {id:'g-10k',theme:'pr',p:M=>M.hasRuns&&M.longestRun.km>=5&&M.longestRun.km<10?.8:0,text:M=>`Run your first ${B('10K')}`,rule:'longest run between 5 and 10 km'},
 {id:'g-vo2',theme:'body',p:M=>M.hasVo2?.6:0,text:M=>`Push VO₂ max to ${B((Math.round((M.vo2b+1.5)*10)/10).toFixed(1))}`,rule:'current + 1.5'},
 {id:'g-sleep',theme:'body',p:M=>M.hasSleep&&M.sleepB<7.5?.65:0,text:M=>`Average ${B('7.5 hours')} of sleep`,rule:'only if sleep is under 7.5 h'},
 {id:'g-streak',theme:'cal',p:M=>.45,text:M=>`Beat your ${B(M.streak+' day streak')} and reach ${B(M.streak+7)}`,rule:'longest streak + 7'},
 {id:'g-sport',theme:'sport',p:M=>M.topShare>.85?.85:0,text:M=>`Add a second sport: ${B('swim, row or ski')}`,rule:'one sport is over 85% of distance'},
 {id:'g-lift',theme:'sport',p:M=>M.strength<30?.55:0,text:M=>`Lift ${B('twice a week')} for the full year`,rule:'fewer than 30 strength sessions'},
 {id:'g-steps',theme:'steps',p:M=>!M.hasSteps?0:M.stepsAvg<10000?.6:.3,text:M=>M.stepsAvg<10000?`Average ${B('10,000 steps')} a day`:`Protect your ${B(nf.format(M.stepsAvg)+' step')} daily average`,rule:'10,000 if below, else protect'},
 {id:'g-climb',theme:'dist',p:M=>.4,text:M=>`Climb ${B(nf.format(Math.ceil(M.elev*1.15/500)*500)+' m')} in total`,rule:'elevation × 1.15, rounded to 500'}
];

/* ================= the picker ================= */
function evalSlot(slot,M,usedThemes,forced){
  const rows=FACTS.filter(f=>f.slot===slot).map(f=>{
    const allowed=!f.ok||f.ok(M); let r=NaN,fv=0;
    if(allowed){r=f.calc(M);fv=fit(r,f.kind)}
    const div=usedThemes.has(f.theme)?.6:1, jit=hash01(M.P.id+f.id)*.12;
    const score=fv>0?fv*div+jit:0;
    return {f,allowed,r,fit:fv,div,score};
  });
  let best=rows.filter(x=>x.score>0).sort((a,b)=>b.score-a.score)[0]||null;
  if(forced){const o=rows.find(x=>x.f.id===forced&&x.fit>0);if(o)best=o}
  return {rows,best};
}
