/**
 * Nagpur Enfield Riders - registration backend (Google Apps Script)
 * - Saves Join / Ride / Merchandise requests into the sheet below.
 * - Has a "Payment received" Yes/No column (payment screenshots are NOT stored: riders send them on WhatsApp).
 * - Serves the "Upcoming Rides" tab and the riders marked "Show on website" = Yes to the website.
 * Run setup() once, then Deploy > Manage deployments > Edit > New version.
 */
const SHEET_ID = '12bQwYDuYjBnRultp3JnHDaVY11yl_kZg5eR86XKSdQM';

const TABS = {
  rider: { name: 'Riders', yn: [12, 13], head: ['Timestamp','Name','WhatsApp','Email','Date of birth','Profession','Bike model','Bike number','Membership','Fee','Registration type','Payment received','Show on website'] },
  ride:  { name: 'Ride Registrations', yn: [12], head: ['Timestamp','Ride','Date','Route','Rider name','WhatsApp','Bike model','Bike number','Riders (with pillion)','Note','Total fee','Payment received'] },
  order: { name: 'Merchandise Orders', yn: [], head: ['Timestamp','Item','Quantity','Size','Rider name','WhatsApp','Note'] },
  upcoming: { name: 'Upcoming Rides', yn: [], head: ['Date','Ride name','Route','Distance (km)','Difficulty','Fee (₹)','Includes','Show on website'] }
};

function match_(k, name) {
  const n = String(name).toLowerCase();
  if (k === 'upcoming') return n.indexOf('upcom') > -1;
  if (k === 'order') return n.indexOf('merch') > -1 || n.indexOf('order') > -1;
  if (k === 'ride')  return n.indexOf('ride') > -1 && n.indexOf('rider') < 0 && n.indexOf('upcom') < 0;
  return n.indexOf('rider') > -1 || n.indexOf('member') > -1;
}

function sheetFor_(k) {
  const ss = SpreadsheetApp.openById(SHEET_ID), t = TABS[k], all = ss.getSheets();
  let sh = all.filter(s => match_(k, s.getName()))[0];
  if (!sh) { // use the first empty tab that no other type owns, else add a new one
    const owned = Object.keys(TABS).map(x => all.filter(s => match_(x, s.getName()))[0]).filter(Boolean);
    sh = all.filter(s => owned.indexOf(s) < 0 && s.getLastRow() === 0)[0];
    if (sh) sh.setName(t.name); else sh = ss.insertSheet(t.name);
  }
  if (k === 'upcoming') {
    if (sh.getLastRow() === 0) { sh.appendRow(t.head); style_(sh, t.head.length); }
    else { // keep your own headings; only add the Fee / Includes columns if they are missing
      const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(x => String(x).toLowerCase());
      if (!h.some(x => x.indexOf('fee') > -1)) sh.getRange(1, sh.getLastColumn() + 1).setValue('Fee (₹)');
      const h2 = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(x => String(x).toLowerCase());
      if (!h2.some(x => x.indexOf('include') > -1)) sh.getRange(1, sh.getLastColumn() + 1).setValue('Includes');
    }
    return sh;
  }
  const cur = sh.getLastRow() > 0 ? sh.getRange(1, 1, 1, t.head.length).getValues()[0] : [];
  if (cur.join('|') !== t.head.join('|')) { // new or older headings: write the current ones (data rows are kept)
    sh.getRange(1, 1, sh.getMaxRows(), t.head.length).setNumberFormat('@'); // plain text: keeps +91, blocks formulas
    sh.getRange(1, 1, 1, t.head.length).setValues([t.head]);
    const extra = sh.getLastColumn() - t.head.length;
    if (extra > 0) sh.getRange(1, t.head.length + 1, 1, extra).clearContent(); // old headings that no longer exist
    style_(sh, t.head.length);
  }
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(true).build();
  t.yn.forEach(c => sh.getRange(2, c, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(rule)); // Yes / No dropdown
  return sh;
}
function style_(sh, n) { sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#ff6a13').setFontColor('#ffffff'); sh.setFrozenRows(1); }

// Run once from the editor (Run > setup): headings, Yes/No dropdowns and permissions.
function setup() { Object.keys(TABS).forEach(k => sheetFor_(k)); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents);
    if (['rider', 'ride', 'order'].indexOf(d.type) < 0) return out_({ ok: false, error: 'type' });
    if (!/^\+91[6-9]\d{9}$/.test(d.phone || '')) return out_({ ok: false, error: 'phone' });
    const ts = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    const due = Number(d.type === 'rider' ? d.fee : d.total) > 0 ? 'No' : 'N/A'; // Payment received: admin changes No -> Yes
    const rows = {
      rider: [ts, d.name, d.phone, d.email, d.dob, d.profession, d.bike, d.bikeNo, d.membership, d.fee, d.regType, due, 'No'],
      ride:  [ts, d.ride, d.date, d.route, d.name, d.phone, d.bike, d.bikeNo, d.count, d.note, d.total, due],
      order: [ts, d.item, d.qty, d.size, d.name, d.phone, d.note]
    };
    sheetFor_(d.type).appendRow(rows[d.type].map(c => String(c == null ? '' : c).slice(0, 300)));
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Website calls:  ?a=rides&tab=Upcoming Rides   |   ?a=riders&q=search words (empty q = first 10 listed riders)
// Diagnose with   ?a=debug
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === 'rides') { const r = rides_(p.tab); return out_({ ok: true, tab: r.tab, rides: r.rides }); }
  if (p.a === 'riders') return out_({ ok: true, riders: riders_(p.q) });
  if (p.a === 'debug') {
    const u = upcomingSheet_(p.tab), r = ridersSheet_();
    const range = u && u.getLastRow() > 0 ? u.getDataRange() : null;
    const vals = range ? range.getValues() : [], shown = range ? range.getDisplayValues() : [];
    const heads = vals.length ? vals[0] : [];
    const map = headerMap_(heads);
    const sample = vals.length > 1 ? vals.slice(1, Math.min(6, vals.length)) : [];
    const sampleDisplay = shown.length > 1 ? shown.slice(1, Math.min(6, shown.length)) : [];
    return out_({ ok: true, tabs: SpreadsheetApp.openById(SHEET_ID).getSheets().map(s => s.getName()),
      upcomingTabUsed: u ? u.getName() : null, headers: heads, columnMap: map,
      feeHeader: map.fee > -1 ? heads[map.fee] : null,
      sampleFeeValues: sample.map((row, i) => map.fee > -1 ? { raw: row[map.fee], displayed: sampleDisplay[i][map.fee], parsed: parseFee_(row[map.fee], sampleDisplay[i][map.fee]) } : null),
      rows: u ? Math.max(u.getLastRow() - 1, 0) : 0,
      ridersTabUsed: r ? r.getName() : null, listedRiders: riders_('').length });
  }
  return out_({ ok: true, msg: 'NER registration endpoint is live' });
}

// Only a tab named like "Upcoming Rides" can be read as rides (never Riders / Registrations / Orders).
function upcomingSheet_(want) {
  const all = SpreadsheetApp.openById(SHEET_ID).getSheets().filter(s => match_('upcoming', s.getName()));
  const w = String(want || 'Upcoming Rides').trim().toLowerCase();
  return all.filter(s => s.getName().trim().toLowerCase() === w)[0] || all[0];
}

function headerMap_(headers) {
  // Normalize headings so Fee, Fee (₹), Ride Fees (INR), Rider Fee, Amount (Rs.) etc. match.
  const h = headers.map(x => String(x == null ? '' : x).trim().toLowerCase()
    .replace(/₹/g, ' rs ').replace(/\binr\b/g, ' rs ').replace(/\brupees?\b/g, ' rs ')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '));
  const findExact = (...ks) => { for (const k of ks) { const i = h.indexOf(k); if (i >= 0) return i; } return -1; };
  const findContains = (...ks) => { for (const k of ks) { const i = h.findIndex(x => x.indexOf(k) >= 0); if (i >= 0) return i; } return -1; };
  // Prefer explicitly fee-named columns, then conventional charge/amount columns.
  let fee = findExact('fee', 'fee rs', 'fee in rs', 'ride fee', 'ride fees', 'rider fee', 'rider fees', 'registration fee', 'entry fee', 'fee amount', 'amount fee');
  if (fee < 0) fee = findContains('fee', 'charge', 'price', 'cost', 'entry amount', 'amount rs', 'amount in rs');
  return {
    date: findContains('date', 'when'),
    name: findExact('ride name', 'name of ride', 'event name') >= 0 ? findExact('ride name', 'name of ride', 'event name') : findContains('name', 'title', 'ride'),
    route: findContains('route'),
    from: findExact('from', 'start', 'start point'), to: findExact('to', 'end', 'destination'),
    dist: findContains('distance', ' km'), lvl: findContains('difficulty', 'level'), fee: fee,
    inc: findContains('include', 'meal', 'food'), show: findContains('show', 'status', 'visible')
  };
}

function parseFee_(raw, display) {
  // Use the underlying numeric value where available, otherwise parse the displayed cell text.
  let value = raw;
  if (value === '' || value === null || value === undefined) value = display;
  if (typeof value === 'number') return isFinite(value) ? value : '';
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  if (/^(free|nil|n\/a|na|-)$/i.test(s)) return 0;
  const cleaned = s.replace(/,/g, '').replace(/\s/g, '');
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!m) return '';
  const n = Number(m[0]);
  return isFinite(n) ? n : '';
}

function rides_(want) {
  const sh = upcomingSheet_(want);
  if (!sh) return { tab: null, rides: [], feeColumn: null };
  if (sh.getLastRow() < 2) return { tab: sh.getName(), rides: [], feeColumn: null };
  const range = sh.getDataRange();
  const v = range.getValues();
  const display = range.getDisplayValues();
  const c = headerMap_(v[0]);
  if (c.date < 0) c.date = 0;
  if (c.name < 0) c.name = c.date === 0 ? 1 : 0;
  const g = (r, i) => (i > -1 && r[i] !== undefined) ? r[i] : '';
  const gd = (r, i) => (i > -1 && r[i] !== undefined) ? r[i] : '';
  const rides = v.slice(1).map((row, idx) => ({ row, displayRow: display[idx + 1] }))
    .filter(x => String(g(x.row, c.name)).trim() || String(g(x.displayRow, c.name)).trim())
    .map(x => {
      const r = x.row, dr = x.displayRow;
      const d = g(r, c.date) || gd(dr, c.date);
      const route = c.route > -1 ? String(g(dr, c.route) || g(r, c.route)) : [g(dr, c.from) || g(r, c.from), g(dr, c.to) || g(r, c.to)].filter(String).join(' to ');
      const rawFee = g(r, c.fee), displayFee = gd(dr, c.fee);
      return {
        date: d instanceof Date ? Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd') : String(d),
        name: String(g(dr, c.name) || g(r, c.name)).trim(), route: route,
        distance: String(g(dr, c.dist) || g(r, c.dist)), level: String(g(dr, c.lvl) || g(r, c.lvl)),
        fee: parseFee_(rawFee, displayFee), includes: String(g(dr, c.inc) || g(r, c.inc)),
        show: String(g(dr, c.show) || g(r, c.show) || 'yes').toLowerCase()
      };
    });
  return { tab: sh.getName(), rides: rides, feeColumn: c.fee >= 0 ? String(v[0][c.fee]) : null };
}

function ridersSheet_() { return SpreadsheetApp.openById(SHEET_ID).getSheets().filter(s => match_('rider', s.getName()))[0]; }

// Public rider directory: ONLY rows with "Show on website" = Yes, ONLY these fields (never email, birth date or payment info). Max 10 per call.
function riders_(q) {
  const sh = ridersSheet_();
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues(), h = v[0].map(x => String(x).trim().toLowerCase());
  const ix = k => h.findIndex(x => x.indexOf(k) > -1);
  const c = { name: ix('name'), phone: ix('whatsapp'), prof: ix('profession'), bike: ix('bike model'), no: ix('bike number'), show: ix('show') };
  if (c.show < 0 || c.name < 0) return [];
  const needle = String(q || '').trim().toLowerCase().slice(0, 40), digits = needle.replace(/\D/g, '');
  const g = (r, i) => i > -1 ? String(r[i] == null ? '' : r[i]).trim() : '';
  const out = [];
  for (let i = 1; i < v.length && out.length < 10; i++) {
    const r = v[i];
    if (!/^(yes|y|true|1)$/i.test(g(r, c.show)) || !g(r, c.name)) continue;
    const rawPhone = g(r, c.phone).replace(/[\s()-]/g, '');
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const phone = /^\+91[6-9]\d{9}$/.test(rawPhone) ? rawPhone : (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly) ? '+91' + digitsOnly : (digitsOnly.length === 12 && digitsOnly.indexOf('91') === 0 && /^[6-9]/.test(digitsOnly.slice(2)) ? '+' + digitsOnly : ''));
    if (needle) {
      const hay = [g(r, c.name), g(r, c.prof), g(r, c.bike), g(r, c.no)].join(' ').toLowerCase();
      const phoneDigits = phone.replace(/\D/g, '');
      const phoneMatch = digits.length >= 2 && phoneDigits.indexOf(digits) > -1;
      if (hay.indexOf(needle) < 0 && !phoneMatch) continue;
    }
    out.push({ name: g(r, c.name), profession: g(r, c.prof), bike: g(r, c.bike), bikeNo: g(r, c.no), phone: phone });
  }
  return out;
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
