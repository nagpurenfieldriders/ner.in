const $=i=>document.getElementById(i);
const WA='919028267858';                       /* admin WhatsApp */
const SHEET_URL='https://script.google.com/macros/s/AKfycbzna5UWNdrE5iu-HEOnzhHG0pQh63gtkDrl3z3QzwWo2g1666OWUMvTtDvvuVSAoovq-w/exec';
const RIDES_TAB='Upcoming Rides';              /* the only sheet tab the website reads rides from */
const dg=v=>v.replace(/\D/g,'').slice(0,10),okP=v=>/^[6-9]\d{9}$/.test(v);
const vn=v=>v.toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,13);
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const feeOf=s=>{if(s===undefined||s===null)return null;if(typeof s==='number')return Number.isFinite(s)?s:null;s=String(s).trim();if(!s)return null;if(/^(free|nil|\-|na|n\/a)$/i.test(s))return 0;const m=s.replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);if(!m)return null;const n=Number(m[0]);return Number.isFinite(n)?Math.round(n):null};
const goWA=m=>{location.href='https://wa.me/'+WA+'?text='+encodeURIComponent(m)};
const logSheet=o=>{if(!SHEET_URL)return Promise.resolve();return Promise.race([fetch(SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)}).catch(()=>0),new Promise(r=>setTimeout(r,25000))])};
const sentMsg={};
/* save to sheet first, then open WhatsApp (works on Android and iOS: same-tab link, no pop-up blocking) */
async function finish(key,btn,el,rec,msg){
 if(sentMsg[key]===msg){goWA(msg);return}
 btn.disabled=true;el.className='msg';el.textContent='Saving your details… please wait';
 await logSheet(rec);sentMsg[key]=msg;el.textContent='Saved. Opening WhatsApp…';goWA(msg);
 setTimeout(()=>{btn.disabled=false;el.textContent='If WhatsApp did not open, tap the button again.'},5000)}
const err=(el,t)=>{el.className='msg err';el.textContent=t};

/* ---------- payment note (no UPI on the site, no screenshot upload: the rider sends the screenshot on WhatsApp) ---------- */
function payBox(p){$(p).innerHTML=`<div class="pay" id="${p}_box"><b class="pt">Payment</b><div class="amt" id="${p}_amt">₹0</div><p class="pn">Tap the button below. WhatsApp opens with your details and our admin replies there with the payment details. Pay, then <b>attach your payment screenshot in the same WhatsApp chat</b>.</p></div>`}
function setPay(p,amt){$(p+'_box').style.display=amt===0?'none':'';$(p+'_amt').textContent=amt===null?'Fee: to be confirmed by admin':'Amount to pay: '+inr(amt)}
payBox('pj');payBox('pr');

/* ---------- Zero Mile compass ---------- */
const DEST=[["DELHI",-20,1090,"The capital run. Highway miles, dhaba stops and the Yamuna Expressway."],["LEH",-55,2600,"The big one. Passes above 5,000 m. Plan weeks, not days."],["KOLKATA",50,1100,"East through Chhattisgarh and Odisha. Coastal finish."],["TAWANG",80,2400,"Far north-east. Monasteries, mist and mountain roads."],["CHENNAI",125,1150,"Down the east side, past Hyderabad and the Deccan."],["KANYAKUMARI",160,1900,"Land's end. Three seas meet."],["GOA",205,1000,"Western Ghats, red soil, sea at the end."],["MUMBAI",250,830,"West through Nashik and the Sahyadris."],["DWARKA",295,1250,"Rann of Kutch and the Gujarat coast."]];
const cs=$('cs');let h='<circle cx="300" cy="300" r="250" fill="none" stroke="#2b241b"/><circle cx="300" cy="300" r="150" fill="none" stroke="#2b241b" stroke-dasharray="2 8"/>';
DEST.forEach((d,i)=>{const a=(d[1]-90)*Math.PI/180,x=300+Math.cos(a)*225,y=300+Math.sin(a)*225,tx=300+Math.cos(a)*262,ty=300+Math.sin(a)*262;
h+=`<g class="node" data-i="${i}"><line class="spoke" id="sp${i}" x1="300" y1="300" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r="9"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle">${d[0]}</text></g>`});
h+='<circle cx="300" cy="300" r="26" fill="#d6ad57"/><text x="300" y="304" text-anchor="middle" fill="#120a02" font-family="Cinzel" font-weight="700" font-size="13">0 KM</text>';
cs.innerHTML=h;
cs.querySelectorAll('.node').forEach(n=>{const f=()=>{const d=DEST[n.dataset.i];cs.querySelectorAll('.on').forEach(e=>e.classList.remove('on'));n.classList.add('on');$('sp'+n.dataset.i).classList.add('on');$('ci').innerHTML=`<h3>Nagpur → ${d[0]}</h3><p style="font-size:44px;font-family:Cinzel;color:var(--br);margin:6px 0">~${d[2].toLocaleString('en-IN')} km</p><p>${d[3]}</p><a class="btn" href="#rides">See rides</a>`};n.onmouseenter=n.onclick=f});

/* ---------- Upcoming rides (sample list is used only when no sheet is connected) ---------- */
let RIDES=[["12","NOV","Sunday Dawn Run","NAGPUR → RAMTEK","60 km · Easy",250,"Breakfast"],["29","NOV","Pench Jungle Ride","NAGPUR → PENCH","90 km · Moderate",600,"Breakfast + Lunch"],["20","DEC","Winter Tour","NAGPUR → TADOBA","150 km · Moderate",0,""]];
let loadState=SHEET_URL?1:0;if(SHEET_URL)RIDES=[];
const feeTxt=r=>r[5]===null?'<p class="fee">Fee: to be confirmed</p>':r[5]>0?`<p class="fee">Fee ${inr(r[5])} per rider${r[6]?' · '+esc(r[6]):''}</p>`:r[5]===0?'<p class="fee free">Free ride</p>':'<p class="fee">Fee: to be confirmed</p>';
function renderRides(){$('tix').innerHTML=RIDES.length?RIDES.map((r,i)=>`<div class="tk"><div class="m"><small>Boarding pass · Gate: Zero Mile</small><h3>${esc(r[2])}</h3><div class="route">${esc(r[3])}</div><p style="color:var(--mu);margin:6px 0 4px">${esc(r[4])}</p>${feeTxt(r)}<br><button class="btn g" style="padding:10px 18px" onclick="openRide(${i})">Register for ride</button></div><div class="s"><div><b>${esc(r[0])}</b><br><small>${esc(r[1])}</small></div></div></div>`).join(''):'<p class="sub">'+(loadState?'Loading upcoming rides…':'No upcoming rides announced yet. Check back soon.')+'</p>'}
renderRides();
const pd=s=>{const x=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());return x?new Date(+x[1],+x[2]-1,+x[3]):new Date(s)};
if(SHEET_URL)fetch(SHEET_URL+'?a=rides&tab='+encodeURIComponent(RIDES_TAB),{cache:'no-store'}).then(r=>r.json()).then(j=>{
 if(!j||!j.ok||!Array.isArray(j.rides)){console.warn('NER: Apps Script is an old version (no rides support). Paste the latest Code.gs and deploy a New version.',j);loadState=0;renderRides();return}
 console.info('NER: rides loaded from tab "'+j.tab+'" ('+j.rides.length+' rows)');
 const M=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],t0=new Date();t0.setHours(0,0,0,0);
 RIDES=j.rides.filter(r=>!/^(no|n|false|hide|hidden|closed|cancelled|canceled|completed|done)$/.test((r.show||'yes').trim())).map(r=>({d:isNaN(pd(r.date))?null:pd(r.date),date:r.date,r})).filter(x=>!x.d||x.d>=t0).sort((a,b)=>(a.d||1e15)-(b.d||1e15)).map(x=>{const r=x.r;return[x.d?String(x.d.getDate()):(x.date||'TBA').slice(0,6),x.d?M[x.d.getMonth()]:'',r.name,(r.route||'').toUpperCase(),[r.distance?(/km/i.test(r.distance)?r.distance:r.distance+' km'):'',r.level].filter(Boolean).join(' · '),feeOf(r.fee),r.includes||'']});
 loadState=0;renderRides()}).catch(e=>{console.warn('NER: could not load rides from the sheet',e);loadState=0;renderRides()});
const G=["#7a2d0a,#1a0b04","#d6ad57,#3a2a0a","#ff6a13,#2a0f05","#5b3a1e,#0d0906"];
$('film').innerHTML=Array.from({length:8},(_,i)=>`<div class="fr" style="background:linear-gradient(135deg,${G[i%4]})">FRAME ${String(i+1).padStart(2,'0')} · your ride photo</div>`).join('');

/* ---------- Bike models ---------- */
const MODELS=["Hunter 350","Bullet 350","Classic 350","Goan Classic 350","Meteor 350","Scram 440","Himalayan 450","Guerrilla 450","Scrambler 450","Interceptor 650","Continental GT 650","Super Meteor 650","Shotgun 650","Classic 650","Bear 650","Bullet 650","Flying Flea C6 (Electric)","Other / older Royal Enfield"];
const mOpts='<option value="">Select your Royal Enfield model</option>'+MODELS.map(m=>`<option>${m}</option>`).join('');
$('rb').innerHTML=mOpts;$('bike').innerHTML=mOpts;

/* ---------- Ride registration ---------- */
let cr=0;
const rideTotal=()=>{const f=RIDES[cr][5];return f===null?null:f*Math.max(1,parseInt($('rq').value)||1)};
function rideRefresh(){setPay('pr',rideTotal());const f=RIDES[cr][5];$('rfee').textContent=f===null?'Fee: to be confirmed':f>0?`Fee ${inr(f)} per rider${RIDES[cr][6]?' · '+RIDES[cr][6]:''}`:'Free ride'}
function openRide(i){cr=i;const r=RIDES[i];$('rt').textContent=r[2];$('rs').textContent=r[0]+' '+r[1]+' · '+r[3]+' · '+r[4];$('re').textContent='';rideRefresh();$('rd').showModal()}
$('rq').oninput=rideRefresh;
$('rp').oninput=e=>e.target.value=dg(e.target.value);
$('rv').oninput=e=>e.target.value=vn(e.target.value);
$('rf').onsubmit=e=>{e.preventDefault();const n=$('rn').value.trim(),p=$('rp').value,r=RIDES[cr],tot=rideTotal(),q=parseInt($('rq').value)||1;
 if(n.length<2||!okP(p))return err($('re'),'Enter your name and a valid 10-digit WhatsApp number.');
 finish('ride'+cr,$('rsub'),$('re'),{type:'ride',ride:r[2],date:r[0]+' '+r[1],route:r[3],name:n,phone:'+91'+p,bike:$('rb').value,bikeNo:$('rv').value,count:q,note:$('rc').value.trim(),total:tot===null?'':tot},
 `*Ride registration - Nagpur Enfield Riders*\nRide: ${r[2]} (${r[0]} ${r[1]}, ${r[3]})\nRider: ${n}\nWhatsApp: +91${p}\nBike: ${$('rb').value||'-'}\nBike number: ${$('rv').value||'-'}\nRiders (with pillion): ${q}\nFee: ${tot===null?'to be confirmed':inr(tot)}${tot>0?'\nPlease share the payment details. I will send my payment screenshot in this chat.':''}\nNote: ${$('rc').value.trim()||'-'}`)};

/* ---------- Join / licence form ---------- */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],YR=new Date().getFullYear();
$('dd').innerHTML='<option value="">Day</option>'+Array.from({length:31},(_,i)=>`<option>${i+1}</option>`).join('');
$('dm').innerHTML='<option value="">Month</option>'+MON.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
$('dy').innerHTML='<option value="">Year</option>'+Array.from({length:YR-1939-10},(_,i)=>`<option>${YR-10-i}</option>`).join('');
function dobVal(){const d=+$('dd').value,m=+$('dm').value,y=+$('dy').value;if(!d||!m||!y)return '';const t=new Date(y,m-1,d);if(t.getDate()!==d||t.getMonth()!==m-1)return '';return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
const TIERS=[{n:'Rider',typ:'Free',fee:0,sub:'Free'},{n:'Royal Legend',typ:'New registration',fee:1200,sub:'New registration · ₹1,200 one time'},{n:'Royal Legend',typ:'Renewal',fee:300,sub:'Renewal · ₹300'}];let tier=TIERS[0];
$('tiers').innerHTML=TIERS.map((t,i)=>`<div class="tr${i?'':' on'}" data-i="${i}" role="button" tabindex="0"><b>${t.n}</b>${t.sub}</div>`).join('');
document.querySelectorAll('.tr').forEach(e=>e.onclick=()=>{document.querySelectorAll('.tr').forEach(x=>x.classList.remove('on'));e.classList.add('on');tier=TIERS[e.dataset.i];setPay('pj',tier.fee);up()});
setPay('pj',0);
function up(){const v=$('in').value.trim();$('ln').textContent=(v||'YOUR NAME').toUpperCase();$('lp').textContent=($('pf').value.trim()||'PROFESSION').toUpperCase();$('lb').textContent=($('bike').value||'YOUR BIKE').toUpperCase()+($('bn').value?' · '+$('bn').value:'');$('lno').textContent='+91 '+($('ph').value||'XXXXXXXXXX');$('lt').textContent=tier.n.toUpperCase()+(tier.typ=='Renewal'?' · RENEWAL':'')}
['in','pf','bike','bn','ph'].forEach(i=>$(i).addEventListener('input',()=>{if(i=='ph')$(i).value=dg($(i).value);if(i=='bn')$(i).value=vn($(i).value);up()}));
$('jf').onsubmit=e=>{e.preventDefault();const n=$('in').value.trim(),p=$('ph').value,em=$('em').value.trim(),db=dobVal(),je=$('je');
 if(n.length<2||!okP(p))return err(je,'Enter your name and a valid 10-digit WhatsApp number.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return err(je,'Enter a valid email address.');
 if(!db)return err(je,'Select your date of birth (day, month and year).');
 finish('join',$('jsub'),je,{type:'rider',name:n,phone:'+91'+p,email:em,dob:db,profession:$('pf').value.trim(),bike:$('bike').value,bikeNo:$('bn').value,membership:tier.n,regType:tier.typ,fee:tier.fee},
 `*New rider join request - Nagpur Enfield Riders*\nName: ${n}\nWhatsApp: +91${p}\nEmail: ${em}\nDate of birth: ${db}\nProfession: ${$('pf').value.trim()||'-'}\nBike: ${$('bike').value||'-'}\nBike number: ${$('bn').value||'-'}\nMembership: ${tier.n} - ${tier.typ} (${inr(tier.fee)})${tier.fee>0?'\nPlease share the payment details. I will send my payment screenshot in this chat.':''}`)};

/* ---------- Riders directory: from the Riders tab, only riders marked "Show on website" = Yes (max 10 per search) ---------- */
const R=[];
const card=r=>`<div class="rc"><div class="plate"><i>IND</i><div><b>${esc(r.bikeNo||'—')}</b><span>${esc(r.name)}${r.profession?' · '+esc(r.profession):''}<br>${esc(r.bike||'')}</span></div></div>${r.phone?`<div class="ct"><a class="btn sm" href="tel:${r.phone}">Call</a><a class="btn g sm" href="https://wa.me/${r.phone.replace('+','')}" target="_blank" rel="noopener">WhatsApp</a></div>`:''}</div>`;
const showRiders=(l,m)=>{$('pl').innerHTML=l.length?l.map(card).join(''):'<p class="sub">'+m+'</p>'};
let dtok=0,dtm;
function dp(){const q=$('q').value.trim();
 if(!SHEET_URL){showRiders([],'Rider directory is not connected.');$('dn').textContent='';return}
 const t=++dtok;$('dn').textContent='Loading…';
 fetch(SHEET_URL+'?a=riders&q='+encodeURIComponent(q),{cache:'no-store'}).then(r=>r.json()).then(j=>{if(t!==dtok)return;if(!j||!j.ok||!Array.isArray(j.riders)){showRiders([],'The riders list is not available right now.');$('dn').textContent='';return}
  showRiders(j.riders,q?'No listed rider matches your search.':'No riders marked “Show on website” yet.');$('dn').textContent=q?'Showing up to 10 matching riders.':'Showing the first 10 riders marked Yes in the Riders sheet. Search by name, bike, bike number or phone to find others.'}).catch(()=>{if(t===dtok){showRiders([],'Could not load riders. Please try again.');$('dn').textContent=''}})}
$('q').oninput=()=>{clearTimeout(dtm);dtm=setTimeout(dp,SHEET_URL?350:0)};dp();

/* ---------- Shop: no prices, order via WhatsApp ---------- */
const S=[{n:"Zero Mile Tee",sz:1,img:"images/merch/tee.svg"},{n:"Night Rider Hoodie",sz:1,img:"images/merch/hoodie.svg"},{n:"Route Sticker Set",sz:0,img:"images/merch/stickers.svg"},{n:"Brass Key Ring",sz:0,img:"images/merch/keyring.svg"}];let cur=0;
$('sh').innerHTML=S.map((s,i)=>`<div class="it"><img class="mi" src="${s.img}" alt="${s.n}" onclick="oo_(${i})"><h3 style="font-size:18px">${s.n}</h3><p style="color:var(--mu);margin:6px 0 12px">${s.sz?'Sizes S to 4XL':'One size'}</p><button class="btn" style="padding:10px 24px" onclick="oo_(${i})">Order</button></div>`).join('');
function oo_(i){cur=i;$('oimg').src=S[i].img;$('oimg').alt=S[i].n;$('oi').textContent=S[i].n;$('osw').style.display=S[i].sz?'':'none';$('oe').textContent='';$('od').showModal()}
$('op').oninput=e=>e.target.value=dg(e.target.value);
$('of').onsubmit=e=>{e.preventDefault();const n=$('on').value.trim(),p=$('op').value,it=S[cur];
 if(n.length<2||!okP(p))return err($('oe'),'Enter your name and a valid 10-digit WhatsApp number.');
 finish('order'+cur,$('osub'),$('oe'),{type:'order',item:it.n,qty:$('oq').value||1,size:it.sz?$('os').value:'One size',name:n,phone:'+91'+p,note:$('oc').value.trim()},
 `*New merchandise order - Nagpur Enfield Riders*\nItem: ${it.n}\nQuantity: ${$('oq').value||1}\nSize: ${it.sz?$('os').value:'One size'}\nRider: ${n}\nWhatsApp: +91${p}\nNote: ${$('oc').value.trim()||'-'}`)};

/* ---------- Tachometer ---------- */
const tk=$('tk');for(let i=0;i<=10;i++){const a=(-120+i*24)*Math.PI/180;tk.innerHTML+=`<line x1="${75+Math.sin(a)*58}" y1="${75-Math.cos(a)*58}" x2="${75+Math.sin(a)*64}" y2="${75-Math.cos(a)*64}"/>`}

/* ---------- Engine: synthesized single-cylinder start, idle thump and exhaust roar (no recordings, no copyright) ---------- */
let ac,mg,nb,on=false,rpm=0,target=0,st=1,disp=0;
function boot(){if(ac)return;ac=new(window.AudioContext||window.webkitAudioContext)();const c=ac.createDynamicsCompressor();mg=ac.createGain();mg.gain.value=.9;mg.connect(c);c.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
function fire(s){const t=ac.currentTime,r=Math.min(rpm/6000,1);
 const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(95+r*70,t);o.frequency.exponentialRampToValueAtTime(34,t+.14);g.gain.setValueAtTime(.9*s,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(mg);o.start(t);o.stop(t+.2);
 const n=ac.createBufferSource(),f=ac.createBiquadFilter(),k=ac.createGain();n.buffer=nb;f.type='lowpass';f.frequency.value=380+r*2200;k.gain.setValueAtTime(.55*s,t);k.gain.exponentialRampToValueAtTime(.001,t+.09+(1-r)*.06);n.connect(f);f.connect(k);k.connect(mg);n.start(t,Math.random()*.5);n.stop(t+.2);
 const q=ac.createOscillator(),qf=ac.createBiquadFilter(),qg=ac.createGain();q.type='sawtooth';q.frequency.value=46+r*80;qf.type='lowpass';qf.frequency.value=240+r*600;qg.gain.setValueAtTime(.3*s,t);qg.gain.exponentialRampToValueAtTime(.001,t+.16);q.connect(qf);qf.connect(qg);qg.connect(mg);q.start(t);q.stop(t+.18)}
function whine(){const t=ac.currentTime,o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.linearRampToValueAtTime(260,t+1.2);f.type='lowpass';f.frequency.value=900;g.gain.setValueAtTime(.05,t);g.gain.linearRampToValueAtTime(.001,t+1.3);o.connect(f);f.connect(g);g.connect(mg);o.start(t);o.stop(t+1.35)}
function loop(){if(!on)return;if(rpm>150){fire(st);const el=$('tach');el.classList.add('pulse');setTimeout(()=>el.classList.remove('pulse'),60)}setTimeout(loop,Math.max(24,120000/Math.max(rpm,300))*(.9+Math.random()*.2))}
function start(){boot();ac.resume();on=true;st=.4;rpm=target=260;whine();loop();setTimeout(()=>{if(on){st=1;rpm=3300;target=1100}},1300);$('snd').textContent='⏹ Stop engine'}
function stop(){on=false;rpm=target=0;$('snd').textContent='🔥 Start the engine'}
$('snd').onclick=()=>on?stop():start();
const rv=$('rev'),rs=()=>{if(on)target=1100},rg=()=>{const was=on;if(!on)start();setTimeout(()=>{if(on)target=5800},was?0:1500)};
rv.onpointerdown=e=>{e.preventDefault();rg()};['pointerup','pointerleave','pointercancel'].forEach(ev=>rv.addEventListener(ev,rs));
setInterval(()=>{if(on)rpm+=(target-rpm)*.1},30);
const t0=performance.now();(function f(t){const s=(t-t0)/1000;const v=s<2.4?7000*Math.sin(s/2.4*Math.PI):(on?rpm+Math.sin(t/55)*70:0);disp+=(v-disp)*.25;$('nd').setAttribute('transform',`rotate(${-120+240*Math.min(Math.max(disp,0)/7000,1)} 75 75)`);requestAnimationFrame(f)})(t0);

/* on phones the engine buttons sit inside the hero instead of floating over the forms */
if(matchMedia('(max-width:700px)').matches)document.querySelector('.hero .c').appendChild(document.querySelector('.sw'));
/* ---------- Mobile burger menu ---------- */
const nav=document.querySelector('nav'),bg=nav.querySelector('.bg'),setNav=o=>{nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o);bg.textContent=o?'✕':'☰'};
bg.onclick=()=>setNav(!nav.classList.contains('open'));nav.querySelectorAll('.nl a').forEach(a=>a.addEventListener('click',()=>setNav(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setNav(false)});document.addEventListener('click',e=>{if(!nav.contains(e.target))setNav(false)});
/* ---------- Headlight pointer, reveal, odometer ---------- */
const hr=$('hero');hr.onpointermove=e=>{const r=hr.getBoundingClientRect();hr.style.setProperty('--mx',(e.clientX-r.left)+'px');hr.style.setProperty('--my',(e.clientY-r.top)+'px')};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.05});document.querySelectorAll('.rv').forEach(e=>io.observe(e));
const oo=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;oo.disconnect();document.querySelectorAll('[data-n]').forEach(b=>{const n=+b.dataset.n,s=performance.now();(function f(t){const p=Math.min((t-s)/1800,1);b.textContent=Math.round(n*p).toLocaleString('en-IN')+(p==1&&n>=250&&n!=40000?'+':'');if(p<1)requestAnimationFrame(f)})(s)})}),{threshold:.5});oo.observe(document.querySelector('.odo'));
