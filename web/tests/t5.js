const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{
 // sheet mô phỏng: 5 dòng dữ liệu + dòng tổng
 const S={rows:[['HUY 1.11.26','PB20050000001',300000,'PHUC',0.02,0.005,null],['HUY 1.11.26','PB20050000002',500000,'',null,0.006,null],['HUY 1.11.26','PB20050000003',700000,'',null,0.006,null],[null,null,'=SUM(C1:C3)',null,null,null,'=SUM(G1:G3)']],log:[]};
 window.__S=S;
 const colI=c=>c.charCodeAt(0)-65;
 window.Native={googleAuth:()=>setTimeout(()=>window.__gAuth({token:'T'}),5),
  http:(id,m,url,body)=>{let out={},st=200;const B=body?JSON.parse(body):null;S.log.push(m+' '+url.replace(/https:\/\/[^/]+/,'').slice(0,90));
   if(/\?fields=properties/.test(url))out={properties:{title:'Hoa Don T11.2026'},sheets:[{properties:{sheetId:0,title:'Sheet1'}}]};
   else if(/\/values\/[^:]+\?valueRenderOption=FORMULA/.test(url))out={values:S.rows.map(r=>[r[2]])};
   else if(/\/values\//.test(url))out={values:S.rows.map(r=>r.slice(0,4).map(x=>x==null?'':(typeof x=='string'&&x.startsWith('=')?0:x)))};
   else if(/values:batchUpdate/.test(url)){B.data.forEach(d=>{const m2=d.range.match(/!([A-Z])(\d+)(?::([A-Z])(\d+))?/);const c0=colI(m2[1]),r0=+m2[2];d.values.forEach((vr,i)=>vr.forEach((v,j)=>{const R=S.rows[r0-1+i]||(S.rows[r0-1+i]=[]);R[c0+j]=v}))})}
   else if(/:batchUpdate/.test(url)){B.requests.forEach(q=>{if(q.insertDimension){const r=q.insertDimension.range;for(let i=r.startIndex;i<r.endIndex;i++)S.rows.splice(i,0,[])}})}
   setTimeout(()=>window.__gHttp({id,status:st,body:JSON.stringify(out)}),5)}};
 localStorage.setItem('sds_gsheet',JSON.stringify({id:'X',name:'Hoa Don T11.2026'}));
});
await p.goto('file://'+require('path').join(__dirname,'..','so-dien-son.html'));
const r=await p.evaluate(async()=>{const o={};
 o.ping=await api({action:'ping'});
 o.stock=await api({action:'stock'});
 o.ins=await api({action:'insert',rows:[['TUNG 14.11.26','PB11070000009',450000,0.006],['TUNG 14.11.26','PB11070000008',350000,0.005],['TUNG 14.11.26','PB20050000002',500000,0.006]]});
 o.assign=await api({action:'assign',name:'KIEUMY',codes:['PB20050000002','PB20050000001','PB11070000008','PBX']});
 o.rows=window.__S.rows;return o});
console.log(JSON.stringify(r,null,0));console.log('errs',errs);await b.close()})();
