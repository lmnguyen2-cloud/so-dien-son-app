const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.Native={isDark:()=>false,copy:()=>{},paste:()=>'PB20050000001 300.000\nPB20050000002 1.200.000 3%',askServers:()=>{}}});
await p.goto('file://'+path.join(__dirname,'..','so-dien-son.html'));
await p.click('#t-bank');await p.fill('#b-rate','2');await p.fill('#b-ung','5000');await p.click('#b-paste');await p.waitForTimeout(100);
console.log(JSON.stringify(await p.$eval('#b-in',e=>e.value)),'ung=',await p.$eval('#b-ung',e=>e.value));console.log(await p.$eval('#b-msg',e=>e.textContent));
await p.click('#t-dl');await p.click('#d-paste');await p.waitForTimeout(100);console.log(await p.$eval('#d-stats',e=>e.innerText.replace(/\n/g,' ')));
await p.click('#d-clear');console.log('d cleared',JSON.stringify(await p.$eval('#d-in',e=>e.value)));
console.log('errs',errs);await b.close()})();
