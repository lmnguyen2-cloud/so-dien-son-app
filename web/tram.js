(function(){
var ID='sds-tram';var old=document.getElementById(ID);if(old){old.remove();return}
var LS='sds_tram_cfg',cfg={};try{cfg=JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){}
var tb=document.getElementById('CodeBill');
var G='#0f7a55',box=document.createElement('div');box.id=ID;
box.style.cssText='position:fixed;z-index:2147483647;inset:8px;max-width:720px;margin-left:auto;overflow:auto;background:#fff;color:#18201d;border:2px solid '+G+';border-radius:10px;padding:12px;font:14px/1.45 system-ui,Segoe UI,Arial;box-shadow:0 8px 30px rgba(0,0,0,.25)';
var bt=function(a,t,p){return '<button '+a+' style="'+(p?'background:'+G+';color:#fff;border:0':'background:#fff;color:'+G+';border:1px solid '+G)+';border-radius:6px;padding:8px 12px;font-weight:600;cursor:pointer">'+t+'</button>'};
var inp='width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;padding:7px 8px;font:14px system-ui,Arial';
var today=new Date(),dstr=today.getDate()+'.'+(today.getMonth()+1)+'.'+String(today.getFullYear()).slice(2);
box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">Trạm check cước</b><span>'+bt('data-cfgbtn','Cài đặt')+' '+bt('data-x','Đóng')+'</span></div>'+
'<div data-cfg style="display:none;margin-top:8px;padding:8px;background:#f3f5f4;border-radius:6px"><div>Link cầu nối (Apps Script)</div><input data-url style="'+inp+'" placeholder="https://script.google.com/macros/s/…/exec"><div style="margin-top:6px">Link Google Sheet tháng (T11, sang tháng 12 dán link T12)</div><input data-sheet style="'+inp+'" placeholder="https://docs.google.com/spreadsheets/d/…"><div style="margin-top:6px">Mã bí mật</div><input data-key style="'+inp+'">'+'<div style="margin-top:6px">'+bt('data-save','Lưu',1)+' '+bt('data-test','Thử kết nối')+'</div></div>'+
(tb?'':'<p style="color:#b42318">Chưa ở trang Điện của otpsms hoặc chưa đăng nhập. Anh mở trang Điện, đăng nhập, rồi bấm lại nút.</p>')+
'<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><label style="flex:1 1 120px">Đại lý<input data-dl style="'+inp+'" placeholder="TUNG"></label><label style="flex:1 1 120px">Ngày<input data-day style="'+inp+'" value="'+dstr+'"></label><label style="flex:1 1 140px">Server<select data-sv style="'+inp+'"></select></label><label style="flex:1 1 160px">Bậc phí (cột F)<select data-tier style="'+inp+'"><option value="auto">Tự theo đại lý</option><option value="3">Bậc 3</option><option value="2">Bậc 2</option></select></label></div>'+
'<textarea data-in placeholder="Dán nguyên tin đại lý gửi (5 số cuối hoặc mã đủ, có =64, kh = … cũng được)" style="'+inp+';min-height:110px;margin-top:8px;font-family:ui-monospace,Consolas,monospace"></textarea>'+
'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+bt('data-go','1. Check cước',1)+bt('data-xl','2. Tải Excel')+bt('data-t11','3. Ghi vào sổ tháng')+bt('data-msg','Copy tin gửi (100 dòng)')+'</div>'+
'<div data-st style="margin-top:8px;color:#5d6b66"></div><div data-sum style="margin-top:4px"></div><div data-out style="margin-top:6px;overflow-x:auto"></div>';
document.body.appendChild(box);
var q=function(s){return box.querySelector(s)};
var SV=window.SDSCore?SDSCore.servers():[];q('[data-sv]').innerHTML=SV.length?SV.map(function(o){return'<option value="'+o.v+'">'+o.t+'</option>'}).join(''):'<option value="">Mặc định</option>';if(cfg.server!=null&&SV.some(function(o){return o.v==cfg.server}))q('[data-sv]').value=cfg.server;
q('[data-url]').value=cfg.url||'';q('[data-sheet]').value=cfg.sheet||'';q('[data-key]').value=cfg.key||'';if(cfg.dl)q('[data-dl]').value=cfg.dl;
q('[data-x]').onclick=function(){box.remove()};
q('[data-cfgbtn]').onclick=function(){var c=q('[data-cfg]');c.style.display=c.style.display=='none'?'block':'none'};
q('[data-save]').onclick=function(){cfg.url=q('[data-url]').value.trim();cfg.sheet=q('[data-sheet]').value.trim();cfg.key=q('[data-key]').value.trim();localStorage.setItem(LS,JSON.stringify(cfg));st('Đã lưu cài đặt.')};
q('[data-test]').onclick=async function(){try{var r=await api({action:'ping'});if(r.ok){cfg.sheetName=r.name;localStorage.setItem(LS,JSON.stringify(cfg))}st(r.ok?'Kết nối được sheet: '+(r.name||'OK'):'Lỗi: '+r.err)}catch(e){st('Không kết nối được Apps Script: '+e.message)}};
function st(t){q('[data-st]').textContent=t}
var num=function(s){var d=String(s||'').replace(/[^\d]/g,'');return d?parseInt(d,10):0};
var dots=function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')};
var STAFF3=['KHA','SANG','THUAN','TRI','NAM'];
function tierOf(dl,day){var t=q('[data-tier]').value;if(t!='auto')return+t;if(dl=='HUY')return 3;if(dl=='HUNG'||dl=='TUNG')return 2;var d=parseInt(day,10);return STAFF3.indexOf(dl)>=0&&d<=4?3:2}
function rateF(a,t){if(a<400000)return .005;if(t==2)return .006;return a<1000000?.006:.01}
function parseMsg(t){t=String(t||'');var expN=(t.match(/=\s*(\d{1,4})(?!\d)/)||[])[1],expT=(t.match(/kh\s*[:=]?\s*(\d[\d.,]{3,})/i)||[])[1];
  t=t.replace(/=\s*\d{1,4}(?!\d)/g,' ').replace(/kh\s*[:=]?\s*\d[\d.,]{3,}/ig,' ');
  var tk=t.toUpperCase().match(/[A-Z]{2}\d{11}|\d{4,7}/g)||[];return{tk:tk,expN:expN?+expN:null,expT:expT?num(expT):null}}
function full(tk,dl){if(/^[A-Z]/.test(tk))return tk;return(dl=='HUY'?'PB2005':'PB1107')+('0000000'+tk).slice(-7)}
var res=[],meta={};
var kind=SDSCore.kind;
function draw(){var n={ok:0,zero:0,err:0},sum=0,dup=0;res.forEach(function(r){n[kind(r)]++;if(kind(r)=='ok')sum+=r.rem;if(r.t11)dup++});
  q('[data-sum]').innerHTML='<b>'+n.ok+'</b> mã còn cước · tổng <b>'+dots(sum)+'</b> · '+n.zero+' mã 0đ · <span style="color:#b42318">'+n.err+' lỗi</span>'+(dup?' · <span style="color:#b4540a">'+dup+' mã đã có trong T11</span>':'')+
   (meta.expN&&meta.expN!=res.length?'<br><span style="color:#b42318">Tin ghi '+meta.expN+' mã, đọc được '+res.length+'.</span>':'')+(meta.expT&&n.ok?'<br>Tin ghi kh = '+dots(meta.expT)+(meta.expT==sum?' — khớp.':' — lệch '+dots(meta.expT-sum)+'.'):'');
  var col={ok:'#e1f2ea',zero:'#f3f5f4',err:'#fbe4e1'};
  q('[data-out]').innerHTML='<table style="border-collapse:collapse;width:100%;font-size:13px"><tr><th style="text-align:left;padding:4px">#</th><th style="text-align:left;padding:4px">Mã</th><th style="text-align:right;padding:4px">Còn</th><th style="text-align:left;padding:4px">Trạng thái</th><th style="text-align:left;padding:4px">T11</th></tr>'+
   res.map(function(r,i){return'<tr style="background:'+col[kind(r)]+'"><td style="padding:4px">'+(i+1)+'</td><td style="padding:4px;font-family:monospace">'+r.code+'</td><td style="padding:4px;text-align:right;font-family:monospace">'+(r.rem==null?'':dots(r.rem))+'</td><td style="padding:4px">'+String(r.st).replace(/</g,'&lt;')+(r.server?' <small style="color:#5d6b66">('+r.server+')</small>':'')+'</td><td style="padding:4px">'+(r.t11?'dòng '+r.t11.row+(r.t11.d?' · '+r.t11.d:''):'')+'</td></tr>'}).join('')+'</table>'}
async function api(body){if(!cfg.url||!cfg.key)throw new Error('chưa cài link Apps Script (bấm Cài đặt)');body.key=cfg.key;body.sheet=cfg.sheet||'';
  var r=await fetch(cfg.url,{method:'POST',body:JSON.stringify(body)});return r.json()}
q('[data-go]').onclick=async function(){
  if(!tb){st('Chưa ở trang Điện của otpsms.');return}
  var dl=q('[data-dl]').value.trim().toUpperCase().replace(/\s+/g,'');cfg.dl=dl;localStorage.setItem(LS,JSON.stringify(cfg));
  var p=parseMsg(q('[data-in]').value),seen={},list=[];p.tk.forEach(function(t){var c=full(t,dl);if(!seen[c]){seen[c]=1;list.push(c)}});
  meta={expN:p.expN,expT:p.expT,dl:dl,day:q('[data-day]').value.trim()};
  if(!list.length){st('Chưa có mã nào.');return}
  res=[];q('[data-go]').disabled=true;cfg.server=q('[data-sv]').value;localStorage.setItem(LS,JSON.stringify(cfg));
  var R=await SDSCore.run(list,{server:cfg.server,fallback:true,onProgress:function(t,part){st(t);res=part.slice();draw()}});res=R.rows;draw();
  q('[data-go]').disabled=false;if(R.stop){st(R.stop);return}
  if(cfg.url&&cfg.key){try{st('Đang dò trùng với T11…');var f=await api({action:'check',codes:res.map(function(r){return r.code})});if(f.ok){res.forEach(function(r){var x=f.found[r.code];if(x)r.t11=x[0]})}}catch(e){}}
  draw();st('Xong '+res.length+' mã. Tự đổi server khi lỗi. Bước tiếp: Tải Excel, Ghi vào sổ tháng.')};
function lotName(){return(meta.dl||'LO')+' '+meta.day}
function okRows(){return res.filter(function(r){return kind(r)=='ok'}).sort(function(a,b){return a.rem-b.rem||(a.code<b.code?-1:1)})}
/* ---- xlsx ---- */
var CRC=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc(u){var c=0xFFFFFFFF;for(var i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zip(files){var enc=new TextEncoder(),parts=[],cd=[],off=0;
  function w16(a,v){a.push(v&255,(v>>8)&255)}function w32(a,v){a.push(v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255)}
  files.forEach(function(f){var nm=enc.encode(f[0]),d=enc.encode(f[1]),c=crc(d),h=[];
    w32(h,0x04034b50);w16(h,20);w16(h,0x0800);w16(h,0);w16(h,0);w16(h,0);w32(h,c);w32(h,d.length);w32(h,d.length);w16(h,nm.length);w16(h,0);
    parts.push(new Uint8Array(h),nm,d);var e=[];w32(e,0x02014b50);w16(e,20);w16(e,20);w16(e,0x0800);w16(e,0);w16(e,0);w16(e,0);w32(e,c);w32(e,d.length);w32(e,d.length);w16(e,nm.length);w16(e,0);w16(e,0);w16(e,0);w16(e,0);w32(e,0);w32(e,off);
    cd.push(new Uint8Array(e),nm);off+=h.length+nm.length+d.length});
  var cdl=cd.reduce(function(s,a){return s+a.length},0),z=[];w32(z,0x06054b50);w16(z,0);w16(z,0);w16(z,files.length);w16(z,files.length);w32(z,cdl);w32(z,off);w16(z,0);
  return new Blob(parts.concat(cd,[new Uint8Array(z)]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
function xe(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function xlsx(sheetName,rows){/* rows: arrays; cell {v,s} s:1 bold,2 number,3 bold number */
  var cols='ABCD',sd=rows.map(function(r,i){return'<row r="'+(i+1)+'">'+r.map(function(c,j){if(c==null||c==='')return'';var o=typeof c=='object'?c:{v:c},ref=cols[j]+(i+1),s=o.s?' s="'+o.s+'"':'';
    return typeof o.v=='number'?'<c r="'+ref+'"'+s+'><v>'+o.v+'</v></c>':'<c r="'+ref+'" t="inlineStr"'+s+'><is><t>'+xe(o.v)+'</t></is></c>'}).join('')+'</row>'}).join('');
  var ws='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="34" customWidth="1"/></cols><sheetData>'+sd+'</sheetData></worksheet>';
  var styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="3" applyNumberFormat="1"/><xf numFmtId="3" fontId="1" applyNumberFormat="1" applyFont="1"/></cellXfs></styleSheet>';
  return zip([['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
   ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
   ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xe(sheetName.slice(0,31))+'" sheetId="1" r:id="rId1"/></sheets></workbook>'],
   ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
   ['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',ws]])}
function buildRows(){var ok=okRows(),zero=res.filter(function(r){return kind(r)=='zero'}),rows=[[{v:'STT',s:1},{v:'Mã hóa đơn',s:1},{v:'Tổng tiền',s:1},{v:'Khách làm',s:1}]],i=0,sum=0;
  ok.filter(function(r){return!r.t11}).forEach(function(r){i++;sum+=r.rem;rows.push([i,r.code,{v:r.rem,s:2},''])});
  ok.filter(function(r){return r.t11}).forEach(function(r){i++;rows.push([i,r.code,{v:r.rem,s:2},'Trùng T11 dòng '+r.t11.row+(r.t11.d?' ('+r.t11.d+')':'')+', không tính'])});
  zero.forEach(function(r){i++;rows.push([i,r.code,'','Đã thanh toán (0đ), không tính'])});
  rows.push(['',{v:'Tổng',s:1},{v:sum,s:3},'']);return rows}
q('[data-xl]').onclick=function(){if(!res.length){st('Check cước trước đã.');return}var name=lotName(),b=xlsx(name,buildRows()),a=document.createElement('a');var fn=name.replace(/^(\w)(\w*)/,function(m,x,y){return x+y.toLowerCase()})+'.xlsx';if(window.Native&&Native.saveFile){var rd=new FileReader();rd.onload=function(){Native.saveFile(fn,String(rd.result).split(',')[1],b.type);st('Đã lưu '+fn+' vào Download/SoDienSon')};rd.readAsDataURL(b);return}
  a.href=URL.createObjectURL(b);a.download=name.replace(/^(\w)(\w*)/,function(m,x,y){return x+y.toLowerCase()})+'.xlsx';document.body.appendChild(a);a.click();a.remove();st('Đã tải file '+a.download)};
var armed=0;
q('[data-t11]').onclick=async function(){var ok=okRows().filter(function(r){return!r.t11});if(!ok.length){st('Không có mã mới để ghi.');return}
  var t=tierOf(meta.dl,meta.day);
  if(!armed){armed=1;st('Sẽ ghi '+ok.length+' mã còn cước vào cuối sheet "'+(cfg.sheetName||'sổ tháng')+'" (trước dòng tổng), lô "'+lotName()+'", bậc '+t+'. Bấm "3. Ghi vào sổ tháng" lần nữa để xác nhận.');setTimeout(function(){armed=0},15000);return}
  armed=0;st('Đang ghi vào T11…');
  try{var r=await api({action:'insert',rows:ok.map(function(x){return[lotName(),x.code,x.rem,rateF(x.rem,t)]})});
    st(r.ok?'Đã ghi '+r.added+' mã vào "'+(r.name||'sổ tháng')+'" (dòng '+r.from+'–'+r.to+')'+(r.skipped?', bỏ '+r.skipped+' mã đã có':'')+'. Dòng tổng đã cập nhật.':'Lỗi: '+r.err)}catch(e){st('Không ghi được: '+e.message)}};
q('[data-msg]').onclick=function(){var ok=okRows().filter(function(r){return!r.t11});if(!ok.length){st('Check cước trước đã.');return}
  var lines=ok.map(function(r){return r.code+' '+dots(r.rem)}),ch=[];for(var i=0;i<lines.length;i+=100)ch.push(lines.slice(i,i+100).join('\n'));
  var idx=+(box.dataset.chunk||0)%ch.length,txt=ch[idx];box.dataset.chunk=idx+1;
  var done=function(){st('Đã copy phần '+(idx+1)+'/'+ch.length+' ('+txt.split('\n').length+' dòng). Bấm lại để copy phần tiếp.')};
  if(window.Native&&Native.copy){Native.copy(txt);done()}else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done,fb);else fb();
  function fb(){var a=document.createElement('textarea');a.value=txt;box.appendChild(a);a.select();document.execCommand('copy');a.remove();done()}};
})();
