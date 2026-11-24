const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.Native={isDark:()=>false,copy:t=>{window.__c=t},paste:()=>'45881 .26481 .24471\n.24339 .26519 =5',shareZalo:t=>{window.__z=t},saveFile:()=>{},askServers:()=>{},
 check:(cj)=>{const c=JSON.parse(cj);setTimeout(()=>window.__sdsDone({rows:c.map((x,i)=>({code:x,rem:[0,500000,300000,null,420000][i],st:['Thành công','Chờ xử lý','Chờ xử lý','Lỗi','Chờ xử lý'][i]})),stop:''}),30)}}});
await p.goto('file://'+require('path').join(__dirname,'..','so-dien-son.html'));await p.click('#t-lo');
await p.fill('#l-in','cũ 11111');await p.click('#l-paste');await p.waitForTimeout(100);console.log('in:',JSON.stringify(await p.$eval('#l-in',e=>e.value)));
await p.click('#l-check');await p.waitForTimeout(200);await p.click('#l-zmsg');console.log(await p.evaluate(()=>window.__z));
await p.click('#l-clear');console.log('cleared:',JSON.stringify(await p.$eval('#l-in',e=>e.value)));
console.log('errs',errs);await b.close()})();
