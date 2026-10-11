const $=i=>document.getElementById(i);
const DEST=[["DELHI",-20,1090,"The capital run. Highway miles, dhaba stops and the Yamuna Expressway."],["LEH",-55,2600,"The big one. Passes above 5,000 m. Plan weeks, not days."],["KOLKATA",50,1100,"East through Chhattisgarh and Odisha. Coastal finish."],["TAWANG",80,2400,"Far north-east. Monasteries, mist and mountain roads."],["CHENNAI",125,1150,"Down the east side, past Hyderabad and the Deccan."],["KANYAKUMARI",160,1900,"Land's end. Three seas meet."],["GOA",205,1000,"Western Ghats, red soil, sea at the end."],["MUMBAI",250,830,"West through Nashik and the Sahyadris."],["DWARKA",295,1250,"Rann of Kutch and the Gujarat coast."]];
const cs=$('cs');let h='<circle cx="300" cy="300" r="250" fill="none" stroke="#2b241b"/><circle cx="300" cy="300" r="150" fill="none" stroke="#2b241b" stroke-dasharray="2 8"/>';
DEST.forEach((d,i)=>{const a=(d[1]-90)*Math.PI/180,x=300+Math.cos(a)*225,y=300+Math.sin(a)*225,tx=300+Math.cos(a)*262,ty=300+Math.sin(a)*262;
h+=`<g class="node" data-i="${i}"><line class="spoke" id="sp${i}" x1="300" y1="300" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r="9"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="13">${d[0]}</text></g>`});
h+='<circle cx="300" cy="300" r="26" fill="#d6ad57"/><text x="300" y="304" text-anchor="middle" fill="#120a02" font-family="Cinzel" font-weight="700" font-size="13">0 KM</text>';
cs.innerHTML=h;
cs.querySelectorAll('.node').forEach(n=>{const f=()=>{const d=DEST[n.dataset.i];cs.querySelectorAll('.on').forEach(e=>e.classList.remove('on'));n.classList.add('on');$('sp'+n.dataset.i).classList.add('on');$('ci').innerHTML=`<h3>Nagpur → ${d[0]}</h3><p style="font-size:44px;font-family:Cinzel;color:var(--br);margin:6px 0">~${d[2].toLocaleString('en-IN')} km</p><p>${d[3]}</p><a class="btn" href="#rides">See rides</a>`};n.onmouseenter=n.onclick=f});
const RIDES=[["12","NOV","Sunday Dawn Run","NAGPUR → RAMTEK","60 km · Easy"],["29","NOV","Pench Jungle Ride","NAGPUR → PENCH","90 km · Moderate"],["20","DEC","Winter Tour","NAGPUR → TADOBA","150 km · Moderate"]];
$('tix').innerHTML=RIDES.map(r=>`<div class="tk"><div class="m"><small>Boarding pass · Gate: Zero Mile</small><h3>${r[2]}</h3><div class="route">${r[3]}</div><p style="color:var(--mu);margin:6px 0 12px">${r[4]}</p><button class="btn g" style="padding:8px 18px" onclick="alert('RSVP demo. Connect a form or WhatsApp link.')">RSVP</button></div><div class="s"><div><b>${r[0]}</b><br><small>${r[1]}</small></div></div></div>`).join('');
const G=["#7a2d0a,#1a0b04","#d6ad57,#3a2a0a","#ff6a13,#2a0f05","#5b3a1e,#0d0906"];
$('film').innerHTML=Array.from({length:8},(_,i)=>`<div class="fr" style="background:linear-gradient(135deg,${G[i%4]})">FRAME ${String(i+1).padStart(2,'0')} · your ride photo</div>`).join('');
const TIERS=[["Rider",0],["Road Captain",999],["Royal Legend",2499]];let tier=TIERS[0];
$('tiers').innerHTML=TIERS.map((t,i)=>`<div class="tr${i?'':' on'}" data-i="${i}"><b>${t[0]}</b>${t[1]?'₹'+t[1]+'/yr':'Free'}</div>`).join('');
document.querySelectorAll('.tr').forEach(e=>e.onclick=()=>{document.querySelectorAll('.tr').forEach(x=>x.classList.remove('on'));e.classList.add('on');tier=TIERS[e.dataset.i];$('lt').textContent=tier[0].toUpperCase()});
const hash=s=>{let n=0;for(const c of s)n=(n*31+c.charCodeAt(0))%9000;return n+1000};
$('in').oninput=e=>{const v=e.target.value.trim();$('ln').textContent=(v||'YOUR NAME').toUpperCase();$('lno').textContent='NER-MH31-'+(v?hash(v):'0000')};
$('ib').oninput=e=>$('lb').textContent=(e.target.value||'YOUR BIKE').toUpperCase();
const R=[["Amit Deshmukh","350 cc Thumper","Dharampeth"],["Rohan Meshram","Adventure Tourer","Sitabuldi"],["Sneha Patil","350 cc Cruiser","Manish Nagar"],["Vikram Thakur","Classic Cruiser","Sadar"],["Nikhil Wankhede","500 cc Thumper","Pratap Nagar"],["Pooja Kale","Roadster 350","Besa"]];
function dp(){const q=$('q').value.toLowerCase();$('pl').innerHTML=R.filter(r=>r.join(' ').toLowerCase().includes(q)).map(r=>`<div class="plate"><i>IND</i><div><b>MH 31 · ${hash(r[0])}</b><span>${r[0]} · ${r[1]}<br>${r[2]}</span></div></div>`).join('')}$('q').oninput=dp;dp();
const S=[["Zero Mile Tee",599],["Night Rider Hoodie",1299],["Route Sticker Set",199],["Brass Key Ring",249]];let cart=[];
$('sh').innerHTML=S.map((s,i)=>`<div class="it"><div class="bd">ZERO<br>MILE</div><h3 style="font-size:20px">${s[0]}</h3><p style="font:700 26px Cinzel;color:var(--br);margin:6px 0">₹${s[1]}</p><button class="btn" style="padding:8px 20px" onclick="cart.push(S[${i}]);$('cc').textContent=cart.length">Add</button></div>`).join('');
const tot=()=>cart.reduce((a,b)=>a+b[1],0);
function oc(){$('cl').innerHTML=cart.length?cart.map(c=>`<p>${c[0]} · ₹${c[1]}</p>`).join(''):'<p>Empty.</p>';$('ct').textContent=tot();$('dl').showModal()}
function pay(n,a){alert('Payment demo: '+n+' · ₹'+a+'\n\nFor real UPI/card payments, connect Razorpay through a small backend.')}
// tachometer
const tk=$('tk');for(let i=0;i<=10;i++){const a=(-120+i*24)*Math.PI/180;tk.innerHTML+=`<line x1="${75+Math.sin(a)*58}" y1="${75-Math.cos(a)*58}" x2="${75+Math.sin(a)*64}" y2="${75-Math.cos(a)*64}"/>`}
let t0=performance.now();(function f(t){const s=(t-t0)/1000;const base=s<2.2?-120+240*Math.sin(Math.min(s/2.2,1)*Math.PI/2)*(1-.55*Math.min(s/2.2,1)):-60;const j=s>2.2?Math.sin(s*14)*3:0;$('nd').setAttribute('transform',`rotate(${base+j} 75 75)`);requestAnimationFrame(f)})(t0);
// thump
let ac,on=false,tm;function th(){$('tach').classList.add('pulse');setTimeout(()=>$('tach').classList.remove('pulse'),120);if(!on)return;const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(70,ac.currentTime);o.frequency.exponentialRampToValueAtTime(28,ac.currentTime+.2);g.gain.setValueAtTime(.7,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.25);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.26)}
setInterval(th,620);
$('snd').onclick=()=>{on=!on;if(on&&!ac)ac=new(window.AudioContext||window.webkitAudioContext)();$('snd').textContent=on?'🔇 Mute the thump':'🔊 Hear the thump'};
// headlight follows pointer
const hr=$('hero');hr.onpointermove=e=>{const r=hr.getBoundingClientRect();hr.style.setProperty('--mx',(e.clientX-r.left)+'px');hr.style.setProperty('--my',(e.clientY-r.top)+'px')};
// reveal + odometer
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.1});document.querySelectorAll('.rv').forEach(e=>io.observe(e));
const oo=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;oo.disconnect();document.querySelectorAll('[data-n]').forEach(b=>{const n=+b.dataset.n,s=performance.now();(function f(t){const p=Math.min((t-s)/1800,1);b.textContent=Math.round(n*p).toLocaleString('en-IN')+(p==1&&n>=250&&n!=40000?'+':'');if(p<1)requestAnimationFrame(f)})(s)})}),{threshold:.5});oo.observe(document.querySelector('.odo'));