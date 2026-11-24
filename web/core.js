/* ===== SDS CORE: check cước trên trang otpsms (dùng chung cho Trạm và app Android) ===== */
(function(){
if(window.SDSCore)return;
var num=function(s){var d=String(s||'').replace(/[^\d]/g,'');return d?parseInt(d,10):0};
function form(){var tb=document.getElementById('CodeBill');if(!tb)return null;return{tb:tb,f:tb.form||tb.closest('form')}}
function serverSelect(){var x=form();if(!x||!x.f)return null;var ss=[].slice.call(x.f.querySelectorAll('select'));
  return ss.filter(function(s){return /server|máy chủ|sv/i.test(s.name+' '+s.id+' '+[].map.call(s.options,function(o){return o.textContent}).join(' '))})[0]||ss[0]||null}
function servers(){var s=serverSelect();if(!s)return[];return[].map.call(s.options,function(o){return{v:o.value,t:o.textContent.trim()}}).filter(function(o){return o.v!==''})}
function kind(r){if(r.rem==null)return'err';if(/lỗi|không|sai|error|fail/i.test(r.st)&&!/thành công/i.test(r.st))return'err';return r.rem>0?'ok':'zero'}
function parse(html,batch){var doc=new DOMParser().parseFromString(html,'text/html'),o={};
  doc.querySelectorAll('tr').forEach(function(tr){var c=[].map.call(tr.querySelectorAll('td'),function(td){return td.textContent.replace(/\s+/g,' ').trim()});if(c.length<3)return;
    var code=null;for(var i=0;i<c.length;i++){var m=c[i].toUpperCase().match(/\b[A-Z]{2}\d{8,14}\b/);if(m){code=m[0];break}}if(!code)return;
    o[code]={code:code,rem:c[4]!=null?num(c[4]):0,st:c[5]!=null?c[5]:c[c.length-1]}});
  var txt=doc.body?doc.body.textContent:'';
  return{rows:batch.map(function(c){return o[c]||{code:c,rem:null,st:'Không có kết quả'}}),poor:Object.keys(o).length===0&&/không đủ số dư|số dư không đủ|insufficient/i.test(txt)}}
async function post(batch,server){var x=form();var url=(x.f&&x.f.getAttribute('action'))||'/electric/CheckBill';
  x.tb.value=batch.join('\n');var fd=x.f?new FormData(x.f):new FormData();if(!x.f)fd.append('CodeBill',x.tb.value);
  var s=serverSelect();if(s&&server!=null)fd.set(s.name,server);
  var r=await fetch(url,{method:'POST',body:fd,credentials:'include'});
  if(/account\/login/i.test(r.url))throw new Error('LOGIN');
  return parse(await r.text(),batch)}
/* codes: mảng mã đủ; opt:{server, fallback:true, onProgress(text, partial)} → Promise<{rows, stop}> */
async function run(codes,opt){opt=opt||{};if(!form())return{rows:[],stop:'Trang otpsms đang mở ('+location.pathname+') không có ô nhập mã để check. Mở trang Điện → Kiểm tra trên otpsms rồi thử lại.'};var sv=servers().map(function(o){return o.v});var cur=opt.server!=null&&opt.server!==''?opt.server:(sv[0]!=null?sv[0]:null);
  var out=[],stop='';
  for(var i=0;i<codes.length;i+=23){var b=codes.slice(i,i+23),tries=[cur].concat(opt.fallback===false?[]:sv.filter(function(v){return v!==cur})),got=null;
    for(var k=0;k<tries.length;k++){
      if(opt.onProgress)opt.onProgress('Đang check '+Math.min(i+23,codes.length)+' / '+codes.length+(tries[k]!=null?' · server '+label(tries[k]):'')+'…',out);
      try{var r=await post(b,tries[k]);
        if(r.poor){stop='Số dư otpsms không đủ — nạp thêm rồi check lại.';got=r.rows;break}
        var bad=r.rows.filter(function(x){return kind(x)=='err'}).length;
        r.rows.forEach(function(x){x.server=label(tries[k])});
        if(bad<b.length||k==tries.length-1){got=r.rows;if(k>0)cur=tries[k];break}
      }catch(e){if(e.message=='LOGIN'){stop='Hết phiên đăng nhập otpsms — đăng nhập lại rồi check tiếp.';break}
        if(k==tries.length-1)got=b.map(function(c){return{code:c,rem:null,st:'Lỗi mạng / server'}})}
      await new Promise(function(ok){setTimeout(ok,500)})}
    if(got)out=out.concat(got);if(stop)break;
    await new Promise(function(ok){setTimeout(ok,400)})}
  return{rows:out,stop:stop}}
function label(v){var o=servers().filter(function(x){return x.v==v})[0];return o?o.t:String(v)}
window.SDSCore={ready:function(){return!!form()},servers:servers,run:run,kind:kind};
})();
