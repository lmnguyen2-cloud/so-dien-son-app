// Test: Bank từ sổ, Đại lý từ sổ, Công nợ, Xong lô — với Google Sheets giả lập trong window.Native.http
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 const T={Sheet1:[['HUY 20.11.26','PB20050000001',300000,'HT','',0.005,''],['HUY 20.11.26','PB20050000002',500000,'HT','',0.006,''],['HUY 20.11.26','PB20050000003',700000,'PHUC','',0.006,''],['HUY 20.11.26','PB20050000004',1070010,'Trả ĐL','',0.01,''],['HUY 20.11.26','PB20050000005',420000,'HT',0.025,0.006,'=x'],['','','=SUM(C1:C5)','','','','=SUM(G1:G5)']]};
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
// Bank từ sổ
await p.click('#t-bank');await p.fill('#bs-name','HT');await p.fill('#b-rate','2');await p.click('#bs-load');await p.waitForTimeout(150);
console.log('bank in:',JSON.stringify(await p.$eval('#b-in',e=>e.value)),'|',await p.$eval('#bs-note',e=>e.innerText));
await p.click('#bs-check');await p.waitForTimeout(150);console.log('after check:',JSON.stringify(await p.$eval('#b-in',e=>e.value)),'|',await p.$eval('#bs-note',e=>e.innerText));
await p.click('#bs-settle');await p.click('#bs-settle');await p.waitForTimeout(300);console.log(await p.$eval('#bs-note',e=>e.innerText));
console.log('row1',JSON.stringify(await p.evaluate(()=>window.__T.Sheet1[0])),'ledger',JSON.stringify(await p.evaluate(()=>window.__T['Cong no'])));
// Đại lý từ sổ
await p.click('#t-dl');await p.click('#ds-list');await p.waitForTimeout(100);console.log(await p.$eval('#ds-lots',e=>e.innerText));
await p.click('#ds-lots button');await p.waitForTimeout(150);console.log(await p.$eval('#ds-note',e=>e.innerText),'| tier',await p.$eval('#d-tier',e=>e.value),'|',await p.$eval('#d-stats',e=>e.innerText.replace(/\n/g,' ')));
// Công nợ
await p.click('#t-no');await p.click('#n-load');await p.waitForTimeout(150);await p.fill('#n-name','HT');await p.selectOption('#n-type','Đã chuyển');await p.fill('#n-amt','288.000');await p.click('#n-add');await p.waitForTimeout(150);
console.log(await p.$eval('#n-sum',e=>e.innerText.replace(/\n/g,' | ')));
// Xong lô
await p.click('#t-lo');await p.fill('#l-dl','TUNG');await p.fill('#l-in','11119 11112 11113');await p.click('#l-check');await p.waitForTimeout(150);
await p.click('#l-done');await p.click('#l-done');await p.waitForTimeout(400);console.log(await p.$eval('#l-chknote',e=>e.innerText));console.log('zalo:',JSON.stringify(await p.evaluate(()=>window.__z)),'saved',await p.evaluate(()=>window.__saved));
// nav Khác
await p.click('#t-more');console.log('nav2 visible',await p.$eval('#nav2',e=>!e.hidden));
console.log('errs',errs);await b.close()})();
