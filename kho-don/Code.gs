// ===== KHO ĐƠN — trang cho đại lý tự lấy đơn (Sổ Điện Sơn) =====
// Cài: script.google.com → Dự án mới → dán file này vào Code.gs, thêm file HTML tên "Index" và dán Index.html.
// Đổi MA_QUAN_LY thành mã riêng của anh. Triển khai → Ứng dụng web → Thực thi: Tôi · Truy cập: Bất kỳ ai.
const MA_QUAN_LY = 'doi-ma-quan-ly';

const P = PropertiesService.getScriptProperties();
function cfg_() {
  const c = JSON.parse(P.getProperty('cfg') || '{}');
  return Object.assign({ sheet: '', hold: 60, open: true, agents: [] }, c);
}
function saveCfg_(c) { P.setProperty('cfg', JSON.stringify(c)); }
function res_() { return JSON.parse(P.getProperty('res') || '{}'); }
function saveRes_(r) { P.setProperty('res', JSON.stringify(r)); }

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Kho đơn Điện Sơn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- sổ tháng ----------
function book_() {
  const c = cfg_(); const m = String(c.sheet || '').match(/\/d\/([a-zA-Z0-9_-]{20,})/) || String(c.sheet || '').match(/^([a-zA-Z0-9_-]{20,})$/);
  if (!m) throw new Error('Chủ kho chưa cài link sổ tháng');
  return SpreadsheetApp.openById(m[1]);
}
function sheet_() { return book_().getSheets()[0]; }
// % khách theo tab "Bang %" (Thời gian · Khách · Tín dụng % · VTS %) — dòng mới nhất của mỗi khách
const norm_ = x => String(x || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D').replace(/\s+/g, '');
function rates_() { const s = book_().getSheetByName('Bang %'), o = {}; if (!s || s.getLastRow() < 2) return o;
  s.getRange(2, 1, s.getLastRow() - 1, 4).getValues().forEach(r => { const k = norm_(r[1]); if (k) o[k] = { td: r[2] === '' ? null : +r[2], vts: r[3] === '' ? null : +r[3] }; }); return o; }
const pctTxt_ = n => String(Math.round(n * 100) / 100).replace('.', ',');
function clearDI_(s, i) { s.getRange(i + 1, 4).setValue(''); s.getRange(i + 1, 9).setValue(''); }
function readAll_(s) { const last = s.getLastRow(); return last ? s.getRange(1, 1, last, 8).getValues() : []; }

// đơn trong kho: mã PB…, tiền > 0, cột D trống, cột H (nháp) trống
function stock_(v) {
  const out = [];
  v.forEach((r, i) => { const c = String(r[1]).trim().toUpperCase(); if (/^[A-Z]{2}\d{8,}/.test(c) && +r[2] > 0 && String(r[3]).trim() === '' && String(r[7] == null ? '' : r[7]).trim() === '') out.push({ row: i + 1, lot: String(r[0]), code: c, amount: +r[2] }); });
  return out;
}

// trả lại đơn giữ quá hạn
function expire_(s, v) {
  const c = cfg_(), r = res_(), now = Date.now(), lim = (c.hold || 60) * 60000; let changed = false;
  Object.keys(r).forEach(code => {
    const x = r[code];
    if (x.s === 'hold' && now - x.t > lim) {
      const i = v.findIndex(row => String(row[1]).trim().toUpperCase() === code);
      if (i >= 0 && String(v[i][3]).trim().toUpperCase() === x.a) { clearDI_(s, i); v[i][3] = ''; }
      delete r[code]; changed = true;
    } else if (x.s === 'done' && now - x.t > 3 * 86400000) { delete r[code]; changed = true; }
  });
  if (changed) saveRes_(r);
  return r;
}

function agentByPin_(pin) {
  const a = cfg_().agents.find(x => String(x.pin) === String(pin).trim() && x.on !== false);
  if (!a) { Utilities.sleep(800); throw new Error('Mã PIN không đúng hoặc đã bị khóa'); }
  return a;
}

// ---------- chọn bộ đơn: tổng sát nhất, không vượt ----------
function pickSet_(items, target, k) {
  const A = items.filter(r => r.amount <= target).sort((a, b) => a.amount - b.amount); if (!A.length) return [];
  const sum = s => s.reduce((t, r) => t + r.amount, 0);
  if (k === 1) { let b = null; A.forEach(r => { if (r.amount <= target) b = r; }); return b ? [b] : []; }
  if (k === 2 || k === 3) {
    let best = null, bs = -1; const n = A.length;
    const two = (lo, cap, pre) => { let i = lo, j = n - 1; while (i < j) { const s = A[i].amount + A[j].amount; if (s > cap) { j--; continue; } const tot = s + (pre ? pre.amount : 0); if (tot > bs) { bs = tot; best = pre ? [pre, A[i], A[j]] : [A[i], A[j]]; } i++; } };
    if (k === 2) two(0, target, null); else for (let a = 0; a < n - 2; a++) { if (A[a].amount * 3 > target) break; two(a + 1, target - A[a].amount, A[a]); }
    return best || [];
  }
  let sel = [], unused = A.slice();
  if (k) {
    for (let i = 0; i < k && unused.length; i++) {
      const want = (target - sum(sel)) / (k - i), room = target - sum(sel) - (k - i - 1) * unused[0].amount;
      let bi = -1, bd = Infinity; unused.forEach((r, j) => { if (r.amount > room) return; const d = Math.abs(r.amount - want); if (d < bd) { bd = d; bi = j; } });
      if (bi < 0) break; sel.push(unused.splice(bi, 1)[0]);
    }
    if (sel.length < k) return [];
  } else {
    let s = 0; A.slice().reverse().forEach(r => { if (s + r.amount <= target) { sel.push(r); s += r.amount; } });
    const S = new Set(sel); unused = A.filter(r => !S.has(r));
  }
  const ub = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m].amount <= v) lo = m + 1; else hi = m; } return lo - 1; };
  for (let it = 0; it < 400; it++) {
    const gap = target - sum(sel); if (gap <= 0) break; let gain = 0, mv = null;
    if (!k) { const j = ub(unused, gap); if (j >= 0 && unused[j].amount > gain) { gain = unused[j].amount; mv = ['add', j]; } }
    sel.forEach((s, si) => { const j = ub(unused, s.amount + gap); if (j >= 0) { const g = unused[j].amount - s.amount; if (g > gain) { gain = g; mv = ['swap', j, si]; } } });
    if (!mv) break;
    if (mv[0] === 'add') sel.push(unused.splice(mv[1], 1)[0]);
    else { const u = unused.splice(mv[1], 1)[0], s = sel[mv[2]]; sel[mv[2]] = u; unused.splice(ub(unused, s.amount) + 1, 0, s); }
  }
  return sel;
}

// ---------- API cho đại lý ----------
function mine_(r, a) { return Object.keys(r).filter(c => r[c].a === a.d).map(c => Object.assign({ code: c }, r[c])).sort((x, y) => x.amount - y.amount); }
function view_(a, s, v, r) {
  const c = cfg_(), st = stock_(v);
  const bands = [[0, 500000, '≤500K'], [500000, 1000000, '500K–1Tr'], [1000000, 2000000, '1Tr–2Tr'], [2000000, 4000000, '2Tr–4Tr'], [4000000, 1e12, '>4Tr']]
    .map(b => { const x = st.filter(o => o.amount >= b[0] && o.amount < b[1]); return { t: b[2], n: x.length, sum: x.reduce((t, o) => t + o.amount, 0) }; });
  const rt = rates_()[a.d] || {};
  return { name: a.name || a.d, d: a.d, rate: +a.rate || 0, td: rt.td, vts: rt.vts, limit: +a.limit || 0, open: c.open !== false, hold: c.hold || 60,
    stock: { n: st.length, sum: st.reduce((t, o) => t + o.amount, 0), bands }, mine: mine_(r, a), now: Date.now() };
}
function agentInfo(pin) {
  const a = agentByPin_(pin), s = sheet_(), v = readAll_(s), r = expire_(s, v);
  return view_(a, s, v, r);
}
function agentTake(pin, q) {
  const a = agentByPin_(pin), c = cfg_();
  if (c.open === false) throw new Error('Kho đang tạm đóng, anh/chị liên hệ chủ kho.');
  const target = Math.round(+q.target || 0), k = Math.round(+q.k || 0), mn = +q.min || 0, mx = +q.max || 0, ty = q.ty === 'TD' || q.ty === 'VTS' ? q.ty : '';
  const rt = rates_()[a.d] || {}, p = ty ? rt[ty.toLowerCase()] : null, itag = p != null ? ty + ' ' + pctTxt_(p) + '%' : (ty || '');
  if (!(target > 0)) throw new Error('Nhập số tiền cần lấy');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const s = sheet_(), v = readAll_(s), r = expire_(s, v);
    const holding = mine_(r, a).filter(x => x.s === 'hold').reduce((t, x) => t + x.amount, 0);
    if (a.limit && holding + target > +a.limit) throw new Error('Vượt giới hạn giữ đơn (' + Number(a.limit).toLocaleString('vi-VN') + 'đ). Đang giữ ' + holding.toLocaleString('vi-VN') + 'đ.');
    const pool = stock_(v).filter(o => !r[o.code] && (!mn || o.amount >= mn) && (!mx || o.amount <= mx));
    const pick = pickSet_(pool, target, k);
    if (!pick.length) throw new Error('Kho không còn bộ đơn phù hợp — thử số tiền khác hoặc nới dải tiền.');
    const now = Date.now();
    pick.forEach(o => { s.getRange(o.row, 4).setValue(a.d); if (itag) s.getRange(o.row, 9).setValue(itag); r[o.code] = { a: a.d, t: now, s: 'hold', amount: o.amount, lot: o.lot, ty: ty, p: p }; v[o.row - 1][3] = a.d; });
    saveRes_(r);
    return Object.assign(view_(a, s, v, r), { picked: pick.map(o => o.code) });
  } finally { lock.releaseLock(); }
}
function agentDone(pin, codes) {
  const a = agentByPin_(pin), lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const s = sheet_(), v = readAll_(s), r = expire_(s, v), now = Date.now();
    (codes || []).forEach(c => { if (r[c] && r[c].a === a.d && r[c].s === 'hold') { r[c].s = 'done'; r[c].t = now; } });
    saveRes_(r); return view_(a, s, v, r);
  } finally { lock.releaseLock(); }
}
function agentReturn(pin, codes) {
  const a = agentByPin_(pin), lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const s = sheet_(), v = readAll_(s), r = expire_(s, v);
    (codes || []).forEach(c => { const x = r[c]; if (!x || x.a !== a.d || x.s !== 'hold') return;
      const i = v.findIndex(row => String(row[1]).trim().toUpperCase() === c);
      if (i >= 0 && String(v[i][3]).trim().toUpperCase() === a.d) { clearDI_(s, i); v[i][3] = ''; }
      delete r[c]; });
    saveRes_(r); return view_(a, s, v, r);
  } finally { lock.releaseLock(); }
}

// ---------- API cho chủ kho ----------
function admin_(key) { if (key !== MA_QUAN_LY) { Utilities.sleep(800); throw new Error('Sai mã quản lý'); } }
function adminInfo(key) {
  admin_(key); const c = cfg_(); let name = '', r = res_(), st = null;
  try { const b = book_(); name = b.getName(); const s = b.getSheets()[0], v = readAll_(s); r = expire_(s, v); const x = stock_(v); st = { n: x.length, sum: x.reduce((t, o) => t + o.amount, 0) }; } catch (e) { name = 'Lỗi: ' + e.message; }
  return { cfg: c, sheetName: name, stock: st, res: Object.keys(r).map(k => Object.assign({ code: k }, r[k])).sort((a, b) => b.t - a.t), now: Date.now() };
}
function adminSave(key, c) {
  admin_(key);
  const agents = (c.agents || []).filter(a => a.d && a.pin).map(a => ({ name: String(a.name || a.d).trim(), d: String(a.d).trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D').replace(/\s+/g, ''), pin: String(a.pin).trim(), rate: +String(a.rate).replace(',', '.') || 0, limit: +String(a.limit || 0).replace(/[^\d]/g, '') || 0, on: a.on !== false }));
  const pins = agents.map(a => a.pin); if (new Set(pins).size !== pins.length) throw new Error('Hai đại lý trùng mã PIN');
  saveCfg_({ sheet: String(c.sheet || '').trim(), hold: Math.max(5, +c.hold || 60), open: c.open !== false, agents });
  return adminInfo(key);
}
function adminRelease(key, codes) {
  admin_(key); const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const s = sheet_(), v = readAll_(s), r = res_();
    (codes || []).forEach(c => { const x = r[c]; if (!x) return; if (x.s === 'hold') { const i = v.findIndex(row => String(row[1]).trim().toUpperCase() === c); if (i >= 0 && String(v[i][3]).trim().toUpperCase() === x.a) clearDI_(s, i); } delete r[c]; });
    saveRes_(r); return adminInfo(key);
  } finally { lock.releaseLock(); }
}
