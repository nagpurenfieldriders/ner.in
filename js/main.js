const $ = i => document.getElementById(i);
const WA = '919028267858';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/12bQwYDuYjBnRultp3JnHDaVY11yl_kZg5eR86XKSdQM'; /* paste your Google Apps Script Web app URL here (see google-sheet/SETUP.txt) */
const logSheet = o => { if (!SHEET_URL) return; try { fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) }).catch(() => { }) } catch (e) { } };
const send = m => window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(m), '_blank');
const dg = v => v.replace(/\D/g, '').slice(0, 10), okP = v => /^[6-9]\d{9}$/.test(v);
const vn = v => v.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 13);

/* Zero Mile compass */
const DEST = [["DELHI", -20, 1090, "The capital run. Highway miles, dhaba stops and the Yamuna Expressway."], ["LEH", -55, 2600, "The big one. Passes above 5,000 m. Plan weeks, not days."], ["KOLKATA", 50, 1100, "East through Chhattisgarh and Odisha. Coastal finish."], ["TAWANG", 80, 2400, "Far north-east. Monasteries, mist and mountain roads."], ["CHENNAI", 125, 1150, "Down the east side, past Hyderabad and the Deccan."], ["KANYAKUMARI", 160, 1900, "Land's end. Three seas meet."], ["GOA", 205, 1000, "Western Ghats, red soil, sea at the end."], ["MUMBAI", 250, 830, "West through Nashik and the Sahyadris."], ["DWARKA", 295, 1250, "Rann of Kutch and the Gujarat coast."]];
const cs = $('cs'); let h = '<circle cx="300" cy="300" r="250" fill="none" stroke="#2b241b"/><circle cx="300" cy="300" r="150" fill="none" stroke="#2b241b" stroke-dasharray="2 8"/>';
DEST.forEach((d, i) => {
    const a = (d[1] - 90) * Math.PI / 180, x = 300 + Math.cos(a) * 225, y = 300 + Math.sin(a) * 225, tx = 300 + Math.cos(a) * 262, ty = 300 + Math.sin(a) * 262;
    h += `<g class="node" data-i="${i}"><line class="spoke" id="sp${i}" x1="300" y1="300" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r="9"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="13">${d[0]}</text></g>`
});
h += '<circle cx="300" cy="300" r="26" fill="#d6ad57"/><text x="300" y="304" text-anchor="middle" fill="#120a02" font-family="Cinzel" font-weight="700" font-size="13">0 KM</text>';
cs.innerHTML = h;
cs.querySelectorAll('.node').forEach(n => { const f = () => { const d = DEST[n.dataset.i]; cs.querySelectorAll('.on').forEach(e => e.classList.remove('on')); n.classList.add('on'); $('sp' + n.dataset.i).classList.add('on'); $('ci').innerHTML = `<h3>Nagpur → ${d[0]}</h3><p style="font-size:44px;font-family:Cinzel;color:var(--br);margin:6px 0">~${d[2].toLocaleString('en-IN')} km</p><p>${d[3]}</p><a class="btn" href="#rides">See rides</a>` }; n.onmouseenter = n.onclick = f });

/* Rides + gallery */
let RIDES = [["12", "NOV", "Sunday Dawn Run", "NAGPUR → RAMTEK", "60 km · Easy"], ["29", "NOV", "Pench Jungle Ride", "NAGPUR → PENCH", "90 km · Moderate"], ["20", "DEC", "Winter Tour", "NAGPUR → TADOBA", "150 km · Moderate"]];
let loadState = SHEET_URL ? 1 : 0; if (SHEET_URL) RIDES = []; /* with a sheet connected, never show sample rides */
function renderRides() { $('tix').innerHTML = RIDES.length ? RIDES.map(r => `<div class="tk"><div class="m"><small>Boarding pass · Gate: Zero Mile</small><h3>${r[2]}</h3><div class="route">${r[3]}</div><p style="color:var(--mu);margin:6px 0 12px">${r[4]}</p><button class="btn g" style="padding:8px 18px" onclick="openRide(${RIDES.indexOf(r)})">Register for ride</button></div><div class="s"><div><b>${r[0]}</b><br><small>${r[1]}</small></div></div></div>`).join('') : '<p class="sub">' + (loadState ? 'Loading upcoming rides…' : 'No upcoming rides announced yet. Check back soon.') + '</p>' }
renderRides();
/* Upcoming rides come ONLY from the "Upcoming Rides" tab of the Google Sheet */
const RIDES_TAB = 'Upcoming Rides';
const pd = s => { const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim()); return x ? new Date(+x[1], +x[2] - 1, +x[3]) : new Date(s) };
if (SHEET_URL) fetch(SHEET_URL + '?tab=' + encodeURIComponent(RIDES_TAB), { cache: 'no-store' }).then(r => r.json()).then(j => {
    if (!j || !j.ok || !Array.isArray(j.rides)) { console.warn('NER: Apps Script is an old version (no rides support). Paste the latest Code.gs and deploy a New version.', j); loadState = 0; renderRides(); return }
    console.info('NER: rides loaded from tab "' + j.tab + '" (' + j.rides.length + ' rows)');
    const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], t0 = new Date(); t0.setHours(0, 0, 0, 0);
    RIDES = j.rides.filter(r => !/^(no|n|false|hide|hidden|closed|cancelled|canceled|completed|done)$/.test((r.show || 'yes').trim())).map(r => ({ d: isNaN(pd(r.date)) ? null : pd(r.date), date: r.date, r })).filter(x => !x.d || x.d >= t0).sort((a, b) => (a.d || 1e15) - (b.d || 1e15)).map(x => { const r = x.r; return [x.d ? String(x.d.getDate()) : (x.date || 'TBA').slice(0, 6), x.d ? M[x.d.getMonth()] : '', r.name, (r.route || '').toUpperCase(), [r.distance ? (/km/i.test(r.distance) ? r.distance : r.distance + ' km') : '', r.level].filter(Boolean).join(' · ')] });
    loadState = 0; renderRides()
}).catch(e => { console.warn('NER: could not load rides from the sheet', e); loadState = 0; renderRides() });
const G = ["#7a2d0a,#1a0b04", "#d6ad57,#3a2a0a", "#ff6a13,#2a0f05", "#5b3a1e,#0d0906"];
$('film').innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="fr" style="background:linear-gradient(135deg,${G[i % 4]})">FRAME ${String(i + 1).padStart(2, '0')} · your ride photo</div>`).join('');

/* Ride registration form */
let cr = 0;
function openRide(i) { cr = i; const r = RIDES[i]; $('rt').textContent = r[2]; $('rs').textContent = r[0] + ' ' + r[1] + ' · ' + r[3] + ' · ' + r[4]; $('re').textContent = ''; $('rd').showModal() }
$('rp').oninput = e => e.target.value = dg(e.target.value);
$('rv').oninput = e => e.target.value = vn(e.target.value);
$('rf').onsubmit = e => {
    e.preventDefault(); const n = $('rn').value.trim(), p = $('rp').value, r = RIDES[cr];
    if (n.length < 2 || !okP(p)) { $('re').textContent = 'Enter your name and a valid 10-digit WhatsApp number.'; return }
    logSheet({ type: 'ride', ride: r[2], date: r[0] + ' ' + r[1], route: r[3], name: n, phone: '+91' + p, bike: $('rb').value, bikeNo: $('rv').value, count: $('rq').value || 1, note: $('rc').value.trim() });
    send(`*Ride registration - Nagpur Enfield Riders*\nRide: ${r[2]} (${r[0]} ${r[1]}, ${r[3]})\nRider: ${n}\nWhatsApp: +91${p}\nBike: ${$('rb').value || '-'}\nBike number: ${$('rv').value || '-'}\nRiders (with pillion): ${$('rq').value || 1}\nNote: ${$('rc').value.trim() || '-'}`); $('rd').close()
};

/* Join / licence form */
const MODELS = ["Hunter 350", "Bullet 350", "Classic 350", "Goan Classic 350", "Meteor 350", "Scram 440", "Himalayan 450", "Guerrilla 450", "Scrambler 450", "Interceptor 650", "Continental GT 650", "Super Meteor 650", "Shotgun 650", "Classic 650", "Bear 650", "Bullet 650", "Flying Flea C6 (Electric)", "Other / older Royal Enfield"];
$('rb').innerHTML = '<option value="">Select your Royal Enfield model</option>' + MODELS.map(m => `<option>${m}</option>`).join('');
$('bike').innerHTML = '<option value="">Select your Royal Enfield model</option>' + MODELS.map(m => `<option>${m}</option>`).join('');
const TIERS = [{ n: 'Rider', fee: '₹0/-', sub: 'Free' }, { n: 'Royal Legend', fee: '₹1,200/- yearly', sub: '₹1,200/- yearly' }]; let tier = TIERS[0];
$('tiers').innerHTML = TIERS.map((t, i) => `<div class="tr${i ? '' : ' on'}" data-i="${i}"><b>${t.n}</b>${t.sub}</div>`).join('');
document.querySelectorAll('.tr').forEach(e => e.onclick = () => { document.querySelectorAll('.tr').forEach(x => x.classList.remove('on')); e.classList.add('on'); tier = TIERS[e.dataset.i]; up() });
function up() { const v = $('in').value.trim(); $('ln').textContent = (v || 'YOUR NAME').toUpperCase(); $('lp').textContent = ($('pf').value.trim() || 'PROFESSION').toUpperCase(); $('lb').textContent = ($('bike').value || 'YOUR BIKE').toUpperCase() + ($('bn').value ? ' · ' + $('bn').value : ''); $('lno').textContent = '+91 ' + ($('ph').value || 'XXXXXXXXXX'); $('lt').textContent = tier.n.toUpperCase() }
['in', 'pf', 'bike', 'bn', 'ph'].forEach(i => $(i).addEventListener('input', () => { if (i == 'ph') $(i).value = dg($(i).value); if (i == 'bn') $(i).value = vn($(i).value); up() }));
$('db').max = new Date().toISOString().slice(0, 10);
$('jf').onsubmit = e => {
    e.preventDefault(); const n = $('in').value.trim(), p = $('ph').value, em = $('em').value.trim(), db = $('db').value;
    if (n.length < 2 || !okP(p)) { $('je').textContent = 'Enter your name and a valid 10-digit WhatsApp number.'; return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { $('je').textContent = 'Enter a valid email address.'; return }
    if (!db || db > $('db').max || db < '1930-01-01') { $('je').textContent = 'Enter a valid date of birth.'; return }
    $('je').textContent = '';
    logSheet({ type: 'rider', name: n, phone: '+91' + p, email: em, dob: db, profession: $('pf').value.trim(), bike: $('bike').value, bikeNo: $('bn').value, membership: tier.n, fee: tier.fee });
    send(`*New rider join request - Nagpur Enfield Riders*\nName: ${n}\nWhatsApp: +91${p}\nEmail: ${em}\nDate of birth: ${db}\nProfession: ${$('pf').value.trim() || '-'}\nBike: ${$('bike').value || '-'}\nBike number: ${$('bn').value || '-'}\nMembership: ${tier.n} (${tier.fee})`)
};

/* Directory */
const R = [["Amit Deshmukh", "Engineer", "Classic 350", "MH 31 XX 0001", "Dharampeth"], ["Rohan Meshram", "Doctor", "Himalayan 450", "MH 31 XX 0002", "Sitabuldi"], ["Sneha Patil", "Designer", "Meteor 350", "MH 31 XX 0003", "Manish Nagar"], ["Vikram Thakur", "Business owner", "Interceptor 650", "MH 31 XX 0004", "Sadar"], ["Nikhil Wankhede", "Photographer", "Bullet 350", "MH 31 XX 0005", "Pratap Nagar"], ["Pooja Kale", "Teacher", "Hunter 350", "MH 31 XX 0006", "Besa"]];
function dp() { const q = $('q').value.toLowerCase(); $('pl').innerHTML = R.filter(r => r.join(' ').toLowerCase().includes(q)).map(r => `<div class="plate"><i>IND</i><div><b>${r[3]}</b><span>${r[0]} · ${r[1]}<br>${r[2]} · ${r[4]}</span></div></div>`).join('') } $('q').oninput = dp; dp();

/* Shop: no prices, order via WhatsApp */
const S = [{ n: "Zero Mile Tee", sz: 1, img: "images/merch/tee.svg" }, { n: "Night Rider Hoodie", sz: 1, img: "images/merch/hoodie.svg" }, { n: "Route Sticker Set", sz: 0, img: "images/merch/stickers.svg" }, { n: "Brass Key Ring", sz: 0, img: "images/merch/keyring.svg" }]; let cur = 0;
$('sh').innerHTML = S.map((s, i) => `<div class="it"><img class="mi" src="${s.img}" alt="${s.n}" onclick="oo_(${i})"><h3 style="font-size:20px">${s.n}</h3><p style="color:var(--mu);margin:6px 0 12px">${s.sz ? 'Sizes S to 4XL' : 'One size'}</p><button class="btn" style="padding:9px 24px" onclick="oo_(${i})">Order</button></div>`).join('');
function oo_(i) { cur = i; $('oimg').src = S[i].img; $('oimg').alt = S[i].n; $('oi').textContent = S[i].n; $('osw').style.display = S[i].sz ? '' : 'none'; $('oe').textContent = ''; $('od').showModal() }
$('op').oninput = e => e.target.value = dg(e.target.value);
$('of').onsubmit = e => {
    e.preventDefault(); const n = $('on').value.trim(), p = $('op').value, it = S[cur];
    if (n.length < 2 || !okP(p)) { $('oe').textContent = 'Enter your name and a valid 10-digit WhatsApp number.'; return }
    logSheet({ type: 'order', item: it.n, qty: $('oq').value || 1, size: it.sz ? $('os').value : 'One size', name: n, phone: '+91' + p, note: $('oc').value.trim() });
    send(`*New merchandise order - Nagpur Enfield Riders*\nItem: ${it.n}\nQuantity: ${$('oq').value || 1}\nSize: ${it.sz ? $('os').value : 'One size'}\nRider: ${n}\nWhatsApp: +91${p}\nNote: ${$('oc').value.trim() || '-'}`); $('od').close()
};

/* Tachometer */
const tk = $('tk'); for (let i = 0; i <= 10; i++) { const a = (-120 + i * 24) * Math.PI / 180; tk.innerHTML += `<line x1="${75 + Math.sin(a) * 58}" y1="${75 - Math.cos(a) * 58}" x2="${75 + Math.sin(a) * 64}" y2="${75 - Math.cos(a) * 64}"/>` }

/* Engine: synthesized single-cylinder start, idle thump and exhaust roar (no recorded audio, no copyright) */
let ac, mg, nb, on = false, rpm = 0, target = 0, st = 1, disp = 0;
function boot() { if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)(); const c = ac.createDynamicsCompressor(); mg = ac.createGain(); mg.gain.value = .9; mg.connect(c).connect(ac.destination); nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1 }
function fire(s) {
    const t = ac.currentTime, r = Math.min(rpm / 6000, 1);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(95 + r * 70, t); o.frequency.exponentialRampToValueAtTime(34, t + .14); g.gain.setValueAtTime(.9 * s, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g).connect(mg); o.start(t); o.stop(t + .2);
    const n = ac.createBufferSource(), f = ac.createBiquadFilter(), k = ac.createGain(); n.buffer = nb; f.type = 'lowpass'; f.frequency.value = 380 + r * 2200; k.gain.setValueAtTime(.55 * s, t); k.gain.exponentialRampToValueAtTime(.001, t + .09 + (1 - r) * .06); n.connect(f).connect(k).connect(mg); n.start(t, Math.random() * .5); n.stop(t + .2);
    const q = ac.createOscillator(), qf = ac.createBiquadFilter(), qg = ac.createGain(); q.type = 'sawtooth'; q.frequency.value = 46 + r * 80; qf.type = 'lowpass'; qf.frequency.value = 240 + r * 600; qg.gain.setValueAtTime(.3 * s, t); qg.gain.exponentialRampToValueAtTime(.001, t + .16); q.connect(qf).connect(qg).connect(mg); q.start(t); q.stop(t + .18)
}
function whine() { const t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(260, t + 1.2); f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(.05, t); g.gain.linearRampToValueAtTime(.001, t + 1.3); o.connect(f).connect(g).connect(mg); o.start(t); o.stop(t + 1.35) }
function loop() { if (!on) return; if (rpm > 150) { fire(st); const el = $('tach'); el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 60) } setTimeout(loop, Math.max(24, 120000 / Math.max(rpm, 300)) * (.9 + Math.random() * .2)) }
function start() { boot(); ac.resume(); on = true; st = .4; rpm = target = 260; whine(); loop(); setTimeout(() => { if (on) { st = 1; rpm = 3300; target = 1100 } }, 1300); $('snd').textContent = '⏹ Stop engine' }
function stop() { on = false; rpm = target = 0; $('snd').textContent = '🔥 Start the engine' }
$('snd').onclick = () => on ? stop() : start();
const rv = $('rev'), rs = () => { if (on) target = 1100 }, rg = () => { if (!on) start(); setTimeout(() => { target = 5800 }, on ? 0 : 1500) };
rv.onpointerdown = e => { e.preventDefault(); rg() };['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => rv.addEventListener(ev, rs));
setInterval(() => { if (on) rpm += (target - rpm) * .1 }, 30);
const t0 = performance.now(); (function f(t) { const s = (t - t0) / 1000; const v = s < 2.4 ? 7000 * Math.sin(s / 2.4 * Math.PI) : (on ? rpm + Math.sin(t / 55) * 70 : 0); disp += (v - disp) * .25; $('nd').setAttribute('transform', `rotate(${-120 + 240 * Math.min(Math.max(disp, 0) / 7000, 1)} 75 75)`); requestAnimationFrame(f) })(t0);

/* Headlight pointer, reveal, odometer */
const hr = $('hero'); hr.onpointermove = e => { const r = hr.getBoundingClientRect(); hr.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hr.style.setProperty('--my', (e.clientY - r.top) + 'px') };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }), { threshold: .1 }); document.querySelectorAll('.rv').forEach(e => io.observe(e));
const oo = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; oo.disconnect(); document.querySelectorAll('[data-n]').forEach(b => { const n = +b.dataset.n, s = performance.now(); (function f(t) { const p = Math.min((t - s) / 1800, 1); b.textContent = Math.round(n * p).toLocaleString('en-IN') + (p == 1 && n >= 250 && n != 40000 ? '+' : ''); if (p < 1) requestAnimationFrame(f) })(s) }) }), { threshold: .5 }); oo.observe(document.querySelector('.odo'));
