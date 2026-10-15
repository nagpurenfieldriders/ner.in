/**
 * Nagpur Enfield Riders - registration backend (Google Apps Script)
 * Works with the existing sheet below. It uses your 3 tabs:
 *   Riders, Ride Registrations, Merchandise Orders  (matched by name; empty tabs are renamed to these names).
 * Also reads the "Upcoming Rides" tab so the website can show rides when it loads.
 * Run setup() once, then Deploy as a Web app (after any change: Deploy > Manage deployments > Edit > New version).
 */
const SHEET_ID = '12bQwYDuYjBnRultp3JnHDaVY11yl_kZg5eR86XKSdQM';

const TABS = {
  rider: { name: 'Riders', head: ['Timestamp','Name','WhatsApp','Email','Date of birth','Profession','Bike model','Bike number','Membership','Fee'] },
  ride:  { name: 'Ride Registrations', head: ['Timestamp','Ride','Date','Route','Rider name','WhatsApp','Bike model','Bike number','Riders (with pillion)','Note'] },
  order: { name: 'Merchandise Orders', head: ['Timestamp','Item','Quantity','Size','Rider name','WhatsApp','Note'] },
  upcoming: { name: 'Upcoming Rides', head: ['Date','Ride name','Route','Distance (km)','Difficulty','Show on website'], plain: false }
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
  if (sh.getLastRow() === 0) { // write the column headings once
    if (t.plain !== false) sh.getRange(1, 1, sh.getMaxRows(), t.head.length).setNumberFormat('@'); // plain text: keeps +91, blocks formulas
    sh.appendRow(t.head);
    sh.getRange(1, 1, 1, t.head.length).setFontWeight('bold').setBackground('#ff6a13').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Run once from the editor (Run > setup): creates headings in your 3 tabs and asks for permission.
function setup() { Object.keys(TABS).forEach(k => sheetFor_(k)); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    if (['rider', 'ride', 'order'].indexOf(d.type) < 0) return out_({ ok: false, error: 'type' });
    if (!/^\+91[6-9]\d{9}$/.test(d.phone || '')) return out_({ ok: false, error: 'phone' });
    const ts = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    const rows = {
      rider: [ts, d.name, d.phone, d.email, d.dob, d.profession, d.bike, d.bikeNo, d.membership, d.fee],
      ride:  [ts, d.ride, d.date, d.route, d.name, d.phone, d.bike, d.bikeNo, d.count, d.note],
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

// Website calls  <web app URL>?a=rides&tab=Upcoming Rides   when the page loads.
// Diagnose with   <web app URL>?a=debug   (shows tab names, which tab is used, its headings and row count).
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === 'rides') { const r = rides_(p.tab); return out_({ ok: true, tab: r.tab, rides: r.rides }); }
  if (p.a === 'debug') {
    const u = upcomingSheet_(p.tab);
    return out_({ ok: true, tabs: SpreadsheetApp.openById(SHEET_ID).getSheets().map(s => s.getName()),
      upcomingTabUsed: u ? u.getName() : null,
      headers: u && u.getLastRow() > 0 ? u.getRange(1, 1, 1, u.getLastColumn()).getValues()[0] : [],
      rows: u ? Math.max(u.getLastRow() - 1, 0) : 0 });
  }
  return out_({ ok: true, msg: 'NER registration endpoint is live' });
}

// Only a tab named like "Upcoming Rides" can ever be read by the website (never Riders / Registrations / Orders).
function upcomingSheet_(want) {
  const all = SpreadsheetApp.openById(SHEET_ID).getSheets().filter(s => match_('upcoming', s.getName()));
  const w = String(want || 'Upcoming Rides').trim().toLowerCase();
  return all.filter(s => s.getName().trim().toLowerCase() === w)[0] || all[0];
}

function rides_(want) {
  const sh = upcomingSheet_(want);
  if (!sh) return { tab: null, rides: [] };
  if (sh.getLastRow() < 2) return { tab: sh.getName(), rides: [] };
  const v = sh.getDataRange().getValues(), h = v[0].map(x => String(x).trim().toLowerCase());
  const has = (...ks) => { for (const k of ks) { const i = h.findIndex(x => x.indexOf(k) > -1); if (i > -1) return i; } return -1; };
  const eq = (...ks) => { for (const k of ks) { const i = h.indexOf(k); if (i > -1) return i; } return -1; };
  let c = { date: has('date', 'when'), name: has('ride name', 'name', 'title', 'ride'), route: has('route'), from: eq('from', 'start', 'start point'),
            to: eq('to', 'end', 'destination'), dist: has('distance', 'km'), lvl: has('difficulty', 'level'), show: has('show', 'status', 'visible') };
  if (c.date < 0) c.date = 0;
  if (c.name < 0) c.name = c.date === 0 ? 1 : 0;
  const g = (r, i) => (i > -1 && r[i] !== undefined) ? r[i] : '';
  return { tab: sh.getName(), rides: v.slice(1).filter(r => String(g(r, c.name)).trim()).map(r => {
    const d = g(r, c.date), route = c.route > -1 ? String(g(r, c.route)) : [g(r, c.from), g(r, c.to)].filter(String).join(' to ');
    return { date: d instanceof Date ? Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd') : String(d), name: String(g(r, c.name)).trim(), route: route,
             distance: String(g(r, c.dist)), level: String(g(r, c.lvl)), show: String(g(r, c.show) || 'yes').toLowerCase() };
  }) };
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
