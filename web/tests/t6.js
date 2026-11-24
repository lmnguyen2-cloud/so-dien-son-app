const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const S={rows:[['Ma KH','SỐTIỀN','check cước'],[],['HUY 11.11.26'],['PB1',305230,0]],reqs:[]};window.__S=S;const colI=c=>c.charCodeAt(0)-65;
 window.Native={googleAuth:()=>setTimeout(()=>window.__gAuth({token:'T'}),5),saveFile:(n)=>{window.__saved=n},copy:()=>{},
  check:(cj)=>{const c=JSON.parse(cj);setTimeout(()=>window.__sdsDone({rows:c.map((x,i)=>({code:x,rem:[350000,420000,980000,0][i%4],st:'Chờ xử lý'})),stop:''}),20)},askServers:()=>{},
  http:(id,m,url,body)=>{let out={};const B=body?JSON.parse(body):null;
   if(/\?fields=properties/.test(url))out={properties:{title:'ĐIỆN A SƠN VTS'},sheets:[{properties:{sheetId:0,title:'Lay Don o day'}}]};
   else if(/\/values\//.test(url))out={values:S.rows.map(r=>r.slice(0,2))};
   else if(/values:batchUpdate/.test(url)){B.data.forEach(d=>{const m2=d.range.match(/!([A-Z])(\d+)/);const c0=colI(m2[1]),r0=+m2[2];d.values.forEach((vr,i)=>vr.forEach((v,j)=>{const R=S.rows[r0-1+i]||(S.rows[r0-1+i]=[]);R[c0+j]=v}))})}
   else if(/:batchUpdate/.test(url))S.reqs.push(...B.requests.map(q=>Object.keys(q)[0]));
   setTimeout(()=>window.__gHttp({id,status:200,body:JSON.stringify(out)}),5)}}});
await p.goto('file://'+require('path').join(__dirname,'..','so-dien-son.html'));
await p.click('#t-lo');await p.fill('#l-dl','HUNG');await p.fill('#l-day','14.11.26');await p.fill('#l-in','10001 10002 10003 10004 10005 10006');
await p.click('#l-check');await p.waitForTimeout(200);
await p.click('#l-sub');console.log(await p.$eval('#l-chknote',e=>e.innerText));await p.click('#l-sub');await p.waitForTimeout(400);console.log(await p.$eval('#l-chknote',e=>e.innerText));
console.log(JSON.stringify(await p.evaluate(()=>window.__S)));
await p.click('#l-subimg');console.log('img',await p.evaluate(()=>window.__saved));
await p.click('#t-cai');await p.click('#g-logout');await p.waitForTimeout(100);console.log(await p.$eval('#g-st',e=>e.innerText));
console.log('errs',errs);await b.close()})();
