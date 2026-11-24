const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__saved=[];window.Native={isDark:()=>true,copy:t=>{window.__copied=t},share:()=>{},saveFile:(n,b,m)=>{window.__saved.push(n);return'ok'},
 askServers:()=>setTimeout(()=>window.__sdsServers([{v:'1',t:'Server 1'},{v:'2',t:'Server 2'}]),50),
 check:(cj,sv)=>{const c=JSON.parse(cj);setTimeout(()=>window.__sdsProgress('Đang check…'),10);setTimeout(()=>window.__sdsDone({rows:c.map((x,i)=>({code:x,rem:i%5==0?0:300000+i*1000,st:i%5==0?'Thành công':'Chờ xử lý',server:'Server 2'})),stop:''}),100)}}});
await p.goto('file://'+require('path').join(__dirname,'..','so-dien-son.html'));
await p.setInputFiles('#t-file',process.env.T11_CSV||'t11b.csv');await p.waitForTimeout(600);
await p.click('#t-lo');await p.waitForTimeout(1700);
console.log('servers',await p.$eval('#l-sv',e=>[...e.options].map(o=>o.text).join(',')),'| theme',await p.evaluate(()=>document.documentElement.dataset.theme));
await p.fill('#l-in','11111 22222 33333 44444 45881 =5 kh = 900000');await p.fill('#l-dl','TUNG');
await p.click('#l-check');await p.waitForTimeout(400);
console.log(await p.$eval('#l-stats',e=>e.innerText.replace(/\n/g,' | ')));console.log(await p.$eval('#l-chknote',e=>e.innerText));
await p.click('#l-xl');await p.waitForTimeout(200);console.log('saved',await p.evaluate(()=>window.__saved));
await p.click('#l-msg');console.log('msg',JSON.stringify(await p.evaluate(()=>window.__copied)));
await p.click('#t-loc');await p.waitForTimeout(200);
console.log(await p.$eval('#f-kho',e=>e.innerText));console.log(await p.$eval('#f-sum',e=>e.innerText));
await p.click('#f-go');await p.waitForTimeout(200);console.log(await p.$eval('#f-stats',e=>e.innerText.replace(/\n/g,' | ')));
await p.click('#f-adv summary');await p.click('#f-agents button:first-child');await p.click('#f-k button[data-k=""]');await p.fill('#f-target','15.000.000');await p.click('#f-go');await p.waitForTimeout(200);
console.log(await p.$eval('#f-stats',e=>e.innerText.replace(/\n/g,' | ')));
await p.screenshot({path:'loc.png',fullPage:true});
console.log('errs',errs,await p.evaluate(()=>document.body.scrollWidth));await b.close()})();
