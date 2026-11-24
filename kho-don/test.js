const fs=require('fs');const env=require(require('path').join(__dirname,'mock'))();
const src=fs.readFileSync(require('path').join(__dirname,'Code.gs'),'utf8');
const f=new Function(...Object.keys(env).filter(k=>!['rows','props'].includes(k)),src+';return {adminSave,adminInfo,agentInfo,agentTake,agentDone,agentReturn,adminRelease,expire_,cfg_,res_,saveRes_};');
const S=f(...Object.keys(env).filter(k=>!['rows','props'].includes(k)).map(k=>env[k]));
const KEY='doi-ma-quan-ly';
console.log(S.adminSave(KEY,{sheet:'https://docs.google.com/spreadsheets/d/1fvuQYbjy_IAXPupJg8Ss6RTfRZZbIgGQY8js3q4kEJI/edit',hold:60,open:true,agents:[{name:'Phúc',d:'phuc',pin:'1234',rate:'2',limit:'5.000.000'},{name:'Đức Venus',d:'Đức Venus',pin:'5678',rate:'1,2'}]}).cfg.agents);
let v=S.agentInfo('1234');console.log('stock',v.stock.n,v.stock.sum,v.rate);
v=S.agentTake('1234',{target:2000000,k:3});console.log('take',v.picked,v.mine.map(x=>[x.code,x.amount,x.s]));
try{S.agentTake('1234',{target:4000000,k:0})}catch(e){console.log('limit err:',e.message)}
v=S.agentTake('5678',{target:3000000,k:0});console.log('duc',v.mine.length,v.mine.reduce((t,x)=>t+x.amount,0));
console.log('D col',env.rows.filter(r=>r[3]==='PHUC'||r[3]==='DUCVENUS').map(r=>r[1].slice(-5)+':'+r[3]).join(' '));
v=S.agentDone('1234',[v.picked?null:null].filter(Boolean));
let a=S.agentInfo('1234');S.agentDone('1234',[a.mine[0].code]);S.agentReturn('1234',[a.mine[1].code]);a=S.agentInfo('1234');console.log('after',a.mine.map(x=>x.code.slice(-5)+':'+x.s));
// expire
const r=JSON.parse(env.props.res);Object.values(r).forEach(x=>x.t-=2*3600000);env.props.res=JSON.stringify(r);
a=S.agentInfo('5678');console.log('after expire duc',a.mine.length,'D duc left',env.rows.filter(r=>r[3]==='DUCVENUS').length,'phuc done kept',env.rows.filter(r=>r[3]==='PHUC').length);
try{S.agentInfo('0000')}catch(e){console.log('pin err:',e.message)}
console.log(S.adminInfo(KEY).res.length);
