// Sổ Điện Sơn — cầu nối ghi sổ tháng (T11, T12, ...)
// Tạo tại script.google.com → Dự án mới, dán toàn bộ file này.
// Đổi MA_BI_MAT thành mã riêng của anh (giống mã nhập trong Trạm check).
// Sheet tháng nào do Trạm gửi lên (link Google Sheet trong Cài đặt), nên sang tháng mới không phải cài lại.
const MA_BI_MAT = 'doi-ma-nay-truoc-khi-dung';

let SS_ = null;
function book_() {
  if (SS_) return SS_;
  throw new Error('Chưa có link Google Sheet tháng (vào Cài đặt của Trạm)');
}
function open_(link) {
  const m = String(link || '').match(/\/d\/([a-zA-Z0-9_-]{20,})/) || String(link || '').match(/^([a-zA-Z0-9_-]{20,})$/);
  if (m) { SS_ = SpreadsheetApp.openById(m[1]); return; }
  try { SS_ = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { SS_ = null; }
}
function sheet_() { return book_().getSheets()[0]; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return out_({ ok: true, msg: 'Cầu nối sổ tháng đang chạy' }); }

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'Dữ liệu gửi lên không đọc được' }); }
  if (b.key !== MA_BI_MAT) return out_({ ok: false, err: 'Sai mã bí mật' });
  try {
    open_(b.sheet);
    if (b.action === 'ping') return out_({ ok: true, name: book_().getName() });
    if (b.action === 'check') return out_({ ok: true, found: lookup_(b.codes || []) });
    if (b.action === 'insert') return out_(insert_(b.rows || []));
    if (b.action === 'stock') return out_(stock_());
    if (b.action === 'assign') return out_(assign_(b.codes || [], b.name || ''));
    return out_({ ok: false, err: 'Không rõ lệnh' });
  } catch (err) { return out_({ ok: false, err: String(err.message || err) }); }
}

// Tìm mã đã có trong T11 → {MA: [{row, amount, d}]}
function lookup_(codes) {
  const s = sheet_(), last = s.getLastRow();
  const v = s.getRange(1, 2, last, 3).getValues(); // B, C, D
  const m = {};
  v.forEach((r, i) => { const c = String(r[0]).trim().toUpperCase(); if (c) (m[c] = m[c] || []).push({ row: i + 1, amount: r[1], d: String(r[2] || '') }); });
  const o = {};
  codes.forEach(c => { c = String(c).trim().toUpperCase(); if (m[c]) o[c] = m[c]; });
  return o;
}

// Dòng tổng = dòng cuối cùng có công thức =SUM ở cột C
function totalRow_(s) {
  const last = s.getLastRow(), f = s.getRange(1, 3, last, 1).getFormulas();
  for (let i = last - 1; i >= 0; i--) if (/^=SUM\(/i.test(f[i][0])) return i + 1;
  return 0; // sheet tháng mới, chưa có dòng tổng
}

// rows: [[lô, mã, tiền, %F], ...] → chèn trước dòng tổng, xếp tiền tăng dần, sửa công thức tổng
function insert_(rows) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const s = sheet_();
    const exist = lookup_(rows.map(r => r[1]));
    const seen = {};
    const add = rows.filter(r => { const c = String(r[1]).trim().toUpperCase(); if (exist[c] || seen[c] || !(+r[2] > 0)) return false; seen[c] = 1; return true; });
    const skipped = rows.length - add.length;
    if (!add.length) return { ok: true, added: 0, skipped: skipped, name: book_().getName() };
    add.sort((a, b) => a[2] - b[2]);
    const n = add.length;
    let tr = totalRow_(s), fresh = false;
    if (!tr) { fresh = true; tr = s.getLastRow() + 1; }   // tháng mới: ghi nối tiếp, tạo dòng tổng
    else s.insertRowsBefore(tr, n);
    const start = tr, ref = tr - 1;
    if (ref >= 1 && !fresh) s.getRange(ref, 1, 1, 7).copyTo(s.getRange(start, 1, n, 7), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    s.getRange(start, 3, n, 1).setNumberFormat('#,##0'); s.getRange(start, 5, n, 2).setNumberFormat('0.0%');
    s.getRange(start, 1, n, 4).setBackground(null);
    s.getRange(start, 1, n, 3).setValues(add.map(r => [r[0], String(r[1]).trim().toUpperCase(), +r[2]]));
    s.getRange(start, 6, n, 1).setValues(add.map(r => [+r[3]]));
    const ntr = tr + n;
    s.getRange(ntr, 3).setFormula('=SUM(C1:C' + (ntr - 1) + ')');
    if (fresh || /^=SUM\(/i.test(s.getRange(ntr, 7).getFormula())) s.getRange(ntr, 7).setFormula('=SUM(G1:G' + (ntr - 1) + ')');
    if (fresh) s.getRange(ntr, 3, 1, 5).setNumberFormat('#,##0');
    return { ok: true, added: n, skipped: skipped, from: start, to: start + n - 1, name: book_().getName() };
  } finally { lock.releaseLock(); }
}

// Kho: các mã chưa có khách (cột D trống), còn tiền → [[dòng, lô, mã, tiền]]
function stock_() {
  const s = sheet_(), last = s.getLastRow();
  const v = s.getRange(1, 1, last, 4).getValues();
  const rows = [];
  v.forEach((r, i) => { const c = String(r[1]).trim().toUpperCase(); if (/^[A-Z]{2}\d{8,}/.test(c) && +r[2] > 0 && String(r[3]).trim() === '') rows.push([i + 1, String(r[0]), c, +r[2]]); });
  return { ok: true, name: book_().getName(), rows: rows };
}

// Ghi tên khách vào cột D cho các mã đang trống (không tô xanh, không ghi E — đợi khách làm xong)
function assign_(codes, name) {
  name = String(name).trim().toUpperCase();
  if (!name) return { ok: false, err: 'Chưa có tên khách' };
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const s = sheet_(), last = s.getLastRow();
    const v = s.getRange(1, 2, last, 3).getValues();
    const want = {}; codes.forEach(c => want[String(c).trim().toUpperCase()] = 1);
    const done = [], taken = [];
    v.forEach((r, i) => { const c = String(r[0]).trim().toUpperCase(); if (!want[c]) return;
      const d = String(r[2]).trim();
      if (d && d.toUpperCase() !== name) { taken.push([c, d]); return; }
      if (!d) s.getRange(i + 1, 4).setValue(name);
      done.push(c); delete want[c]; });
    return { ok: true, name: book_().getName(), done: done.length, taken: taken, missing: Object.keys(want) };
  } finally { lock.releaseLock(); }
}
