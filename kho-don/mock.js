// mock GAS for node/browser
function makeEnv(){const rows=[];for(let i=0;i<60;i++)rows.push(['TUNG 14.11.26','PB110700'+String(10000+i).padStart(5,'0'),300000+i*37000,i%5==0?'KIEUMY':'']);rows.push(['','',123,'']);
 const props={};const sheet={getLastRow:()=>rows.length,getRange:(r,c,nr,nc)=>({getValues:()=>rows.slice(r-1,r-1+nr).map(x=>{const o=[];for(let j=0;j<nc;j++)o.push(x[c-1+j]==null?'':x[c-1+j]);return o}),setValue:v=>{rows[r-1][c-1]=v}})};
 return {rows,props,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v}})},SpreadsheetApp:{openById:()=>({getName:()=>'Hoa Don T11.2026',getSheets:()=>[sheet]})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{sleep(){}},HtmlService:{}}}
module.exports=makeEnv;
