// Test: Bank từ sổ, Đại lý từ sổ, Công nợ, Xong lô — với Google Sheets giả lập trong window.Native.http
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 const p2=n=>String(n).padStart(2,'0'),d0=new Date(Date.now()-5*36e5),OLD=`HT ${p2(d0.getDate())}/${p2(d0.getMonth()+1)} ${p2(d0.getHours())}:${p2(d0.getMinutes())}`;
 const T={Sheet1:[['HUY 26.11.26','PB20050000012',300000,'','','','',''],['HUY 26.11.26','PB20050000019',500000,'','','','',''],['HUY 26.11.26','PB20050000021',400000,'','','','',''],['HUY 26.11.26','PB20050000029',450000,'','','','',''],['HUY 26.11.26','PB20050000039',600000,'','','','',''],['KHA 26.11.26','PB11070000041',200000,'','','','',OLD],['KHA 26.11.26','PB11070000053',350000,'','','','',OLD],['KHA 26.11.26','PB11070000062',800000,'KHA','','','',''],['','',"=SUM(C1:C8)",'','','','=SUM(G1:G8)','']]};
 window.__T=T;const ci=c=>c.charCodeAt(0)-65;
 function rng(r){const m=decodeURIComponent(r).match(/'(.+)'!([A-Z])(\d+)(?::([A-Z])(\d*))?/);return{tab:m[1],c0:ci(m[2]),r0:+m[3],c1:m[4]?ci(m[4]):ci(m[2]),r1:m[5]?+m[5]:null}}
 function set(rg,vals){const R=rng(rg);T[R.tab]=T[R.tab]||[];vals.forEach((vr,i)=>vr.forEach((v,j)=>{const row=T[R.tab][R.r0-1+i]||(T[R.tab][R.r0-1+i]=[]);row[R.c0+j]=v}))}
 window.Native={isDark:()=>false,copy:t=>{window.__c=t},shareZalo:t=>{window.__z=t},saveFile:n=>{window.__saved=n},askServers:()=>{},googleAuth:()=>setTimeout(()=>window.__gAuth({token:'T'}),5),
  check:(cj)=>{const c=JSON.parse(cj);setTimeout(()=>window.__sdsDone({rows:c.map(x=>({code:x,rem:x.endsWith('2')?150000:(x.endsWith('9')?333000:0),st:'ok'})),stop:''}),20)},
  http:(id,m,url,body)=>{let out={};const B=body?JSON.parse(body):null;
   if(/\?fields=properties/.test(url))out={properties:{title:'Hoa Don T11.2026'},sheets:Object.keys(T).map((t,i)=>({properties:{sheetId:i,title:t}}))};
   else if(/:append/.test(url)){const tab=decodeURIComponent(url.match(/values\/(.+):append/)[1]).match(/'(.+)'/)[1];T[tab]=T[tab]||[];B.values.forEach(v=>T[tab].push(v))}
   else if(/values:batchUpdate/.test(url))B.data.forEach(d=>set(d.range,d.values));
   else if(/:batchUpdate/.test(url))B.requests.forEach(q=>{if(q.addSheet)T[q.addSheet.properties.title]=[];if(q.insertDimension){const r=q.insertDimension.range;for(let i=r.startIndex;i<r.endIndex;i++)T.Sheet1.splice(i,0,[])}});
   else if(/\/values\//.test(url)){const R=rng(url.match(/values\/([^?]+)/)[1]);const rows=(T[R.tab]||[]).slice(R.r0-1);out={values:rows.map(r=>{const o=[];for(let j=R.c0;j<=R.c1;j++){let x=r[j];if(x==null)x='';if(!/FORMULA/.test(url)&&typeof x=='string'&&x.startsWith('='))x=0;o.push(x)}return o})}}
   setTimeout(()=>window.__gHttp({id,status:200,body:JSON.stringify(out)}),3)}};
 localStorage.setItem('sds_gsheet',JSON.stringify({id:'X',name:'Hoa Don T11.2026'}));});
await p.goto('file://'+path.join(__dirname,'..','so-dien-son.html'));
const N=s=>p.$eval(s,e=>e.innerText.replace(/\n/g,' | '));
await p.click('#t-loc');await p.click('#f-load');await p.waitForTimeout(250);
console.log('kho:',await N('#f-kho'));console.log('stock codes',JSON.stringify(await p.evaluate(()=>STOCK.rows.map(r=>r.code.slice(-2)))));
console.log('warn banner:',await p.$eval('#nhap-warn',e=>e.hidden?'(ẩn)':e.innerText));
await p.fill('#f-name','HT');await p.fill('#f-target','1.000.000');await p.click('#f-k button[data-k=""]');await p.click('#f-go');await p.waitForTimeout(50);
console.log('pick:',JSON.stringify(await p.evaluate(()=>PICK.map(r=>r.code.slice(-2)+':'+r.amount))));
await p.click('#f-chk');await p.waitForTimeout(400);
console.log('after chk:',JSON.stringify(await p.evaluate(()=>PICK.map(r=>r.code.slice(-2)+':'+r.amount+'/'+r.rem))),'|',await N('#f-note'));
await p.click('#f-nhap');console.log(await N('#f-note'));await p.click('#f-nhap');await p.waitForTimeout(400);
console.log(await N('#f-note'));console.log('zalo:',JSON.stringify(await p.evaluate(()=>window.__z)));
console.log('H col:',JSON.stringify(await p.evaluate(()=>window.__T.Sheet1.map(r=>r[7]||''))));
console.log('nháp list:',await N('#nh-list'));if(process.env.SHOT){await p.$eval('#nh-list',e=>e.scrollIntoView());await p.screenshot({path:process.env.SHOT})}
await p.click('.nh-g.old button[data-a=back]');await p.click('.nh-g.old button[data-a=back]');await p.waitForTimeout(300);console.log(await N('#nh-note'),'|',await N('#nh-list'),'| banner',await p.$eval('#nhap-warn',e=>e.hidden?'(ẩn)':e.innerText));
// Bank: lấy đơn nháp
await p.click('#t-bank');await p.fill('#bs-name','HT');await p.fill('#b-rate','2');await p.click('#bs-nhap');await p.waitForTimeout(250);
console.log('b-in:',JSON.stringify(await p.$eval('#b-in',e=>e.value)));
await p.click('#bs-check');await p.waitForTimeout(250);console.log('after check:',JSON.stringify(await p.$eval('#b-in',e=>e.value)),'|',await N('#bs-note'),'| back hidden',await p.$eval('#bs-back',e=>e.hidden));
await p.click('#bs-back');await p.click('#bs-back');await p.waitForTimeout(300);console.log(await N('#bs-note'));
await p.click('#bs-settle');await p.click('#bs-settle');await p.waitForTimeout(400);console.log(await N('#bs-note'));
console.log('sheet:',JSON.stringify(await p.evaluate(()=>window.__T.Sheet1.map(r=>[r[1].slice(-2),r[3],r[4],r[7]||'']))));
console.log('banner sau:',await p.$eval('#nhap-warn',e=>e.hidden?'(ẩn)':e.innerText));
console.log('errs',errs);await b.close()})();
