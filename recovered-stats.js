(()=>{
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(Math.round((Number(n)+Number.EPSILON)*100)/100);
const money=n=>'€'+fmt(n);

// Verified remembered checkpoint at the END of Day 6. Day 7 is always read live
// from the notebook; missing historical transaction lines are never fabricated.
const BASE={
 completedDays:6,currentDay:7,
 earned:2930,net:1000.2,leftToEarn:3500,sold:330,left:343,smoked:27,day6Net:168,
 products:{
  'LEMON OG':{acquired:500,spent:3100,sold:235,left:250,smoked:15,total:2086.52},
  'BLUE DREAM':{acquired:200,spent:1400,sold:95,left:93,smoked:12,total:843.48}
 }
};
const TARGET_PER_LEFT=BASE.left?BASE.leftToEarn/BASE.left:0;
let queued=false,observer=null,syncing=false,selectedDay=7;

function hasOtherBatches(){
 try{const a=JSON.parse(localStorage.getItem('goshaBatchStatsSelectedV1')||'[]');return Array.isArray(a)&&a.length>0}catch(_){return false}
}
function isCurrentNote(){const n=$('#note');if(!n)return false;const t=n.value.toUpperCase();return t.includes('LEMON OG 500/3100')&&t.includes('BLUE DREAM 200/1400')}
function pairs(s){return [...String(s||'').matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g)].map(m=>({qty:+m[1],price:+m[2]}))}

function live(){
 const n=$('#note');if(!n)return null;
 const lines=n.value.split(/\r?\n/),out={products:{},earned:0,sold:0,net:0,tx:0,smokedDelta:0};let cur=null;
 for(const line of lines){
  const t=line.trim();if(!t)continue;
  const h=t.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if(h&&/[A-Za-zÀ-ž]/.test(h[1])){
   const name=h[1].trim().toUpperCase();
   cur=BASE.products[name]?{name,smoked:BASE.products[name].smoked,sold:0,earned:0,tx:0}:null;
   if(cur)out.products[name]=cur;
   continue;
  }
  if(!cur)continue;
  const sm=t.match(/^(?:smoked|used)\s*:?\s*(\d+(?:\.\d+)?)/i);
  if(sm){cur.smoked=+sm[1];continue}
  if(/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left)\s*:/i.test(t))continue;
  for(const x of pairs(line)){cur.sold+=x.qty;cur.earned+=x.price;cur.tx++}
 }
 for(const [name,p] of Object.entries(out.products)){
  const b=BASE.products[name],cost=b.spent/b.acquired,sd=Math.max(0,p.smoked-b.smoked);
  out.sold+=p.sold;out.earned+=p.earned;out.net+=p.earned-p.sold*cost;out.tx+=p.tx;out.smokedDelta+=sd;
  p.smokedDelta=sd;p.total=b.total+p.earned;p.totalSold=b.sold+p.sold;p.left=Math.max(0,b.left-p.sold-sd);
 }
 out.totalEarned=BASE.earned+out.earned;
 out.totalSold=BASE.sold+out.sold;
 out.totalNet=BASE.net+out.net;
 out.totalLeft=Math.max(0,BASE.left-out.sold-out.smokedDelta);
 out.leftToEarn=Math.max(0,out.totalLeft*TARGET_PER_LEFT);
 return out;
}

function set(sel,val){const e=$(sel);if(e&&e.textContent!==String(val))e.textContent=String(val)}
function setUnknown(sel){set(sel,'—')}
function mode(){
 if($('#dashDaySelect')?.classList.contains('active'))return 'day';
 return $('#goshaDashboard .dashScope.active')?.dataset.mode||'batch';
}
function setTop({earned,sold,net,tx,avg,left,leftToEarn,label,delta,headerTx}){
 if(earned===null)setUnknown('#dashEarned');else set('#dashEarned',money(earned));
 if(sold===null)setUnknown('#dashSold');else set('#dashSold',fmt(sold));
 if(net===null)setUnknown('#dashProfit');else set('#dashProfit',money(net));
 if(tx===null)setUnknown('#dashTransactions');else set('#dashTransactions',fmt(tx));
 if(avg===null)setUnknown('#dashAverage');else set('#dashAverage',money(avg));
 if(left===null)setUnknown('#dashLeft');else set('#dashLeft',fmt(left));
 if(leftToEarn!==undefined){if(leftToEarn===null)setUnknown('#dashLeftToEarn');else set('#dashLeftToEarn',money(leftToEarn))}
 if(label)set('#dashScopeLabel',label);if(delta)set('#dashDelta',delta);if(headerTx!==undefined)set('#dashTx',headerTx);
}
function setCombined(d){
 set('#allEarned',money(d.totalEarned));set('#allSold',fmt(d.totalSold));set('#allNet',money(d.totalNet));
 set('#allAvg',money(d.totalSold?d.totalEarned/d.totalSold:0));set('#allRemaining',fmt(d.totalLeft));set('#allLeftToEarn',money(d.leftToEarn));set('#allStrainCount','2 STRAINS');
}

function render(){
 if(!isCurrentNote()||hasOtherBatches())return;
 const d=live();if(!d)return;
 const m=mode(),day=$('#dashDaySelect');
 if(day)day.textContent='DAY '+selectedDay+' / 50';
 const prev=$('#dashPrevDay'),next=$('#dashNextDay');
 if(m==='day'){if(prev)prev.disabled=selectedDay<=1;if(next)next.disabled=selectedDay>=7}

 if(m==='day'){
  if(selectedDay===7){
   setTop({earned:d.earned,sold:d.sold,net:d.net,tx:d.tx,avg:d.sold?d.earned/d.sold:0,left:d.totalLeft,leftToEarn:d.leftToEarn,label:'DAY 7 SIGNAL',delta:'TODAY',headerTx:d.tx+' TX'});
  }else if(selectedDay===6){
   setTop({earned:null,sold:null,net:BASE.day6Net,tx:null,avg:null,left:BASE.left,leftToEarn:BASE.leftToEarn,label:'DAY 6 SIGNAL',delta:'RECOVERED NET',headerTx:'— TX'});
  }else{
   setTop({earned:null,sold:null,net:null,tx:null,avg:null,left:null,leftToEarn:null,label:'DAY '+selectedDay+' SIGNAL',delta:'HISTORICAL DETAIL LOST',headerTx:'— TX'});
  }
 }else{
  // Through Day 7, every supported longer window contains the entire current batch.
  // Historical transaction count is unknown, so do not mislabel today's count as batch TX.
  const labels={week1:'FIRST 7 DAYS',week2:'FIRST 2 WEEKS',week3:'FIRST 3 WEEKS',month:'FIRST 30 DAYS',batch:'WHOLE BATCH'};
  setTop({earned:d.totalEarned,sold:d.totalSold,net:d.totalNet,tx:null,avg:d.totalSold?d.totalEarned/d.totalSold:0,left:d.totalLeft,leftToEarn:d.leftToEarn,label:labels[m]||'WHOLE BATCH',delta:'DAY 6 BASE + DAY 7 LIVE',headerTx:'DAY 7: '+d.tx+' TX'});
 }
 setCombined(d);
}

// Calc must preserve the recovered Day-6 checkpoint and only add live Day-7 entries.
function cleanAndSyncNotebook(){
 if(syncing||!isCurrentNote())return;const n=$('#note'),d=live();if(!n||!d)return;
 const lines=n.value.split(/\r?\n/),heads=[];
 for(let i=0;i<lines.length;i++){
  const h=lines[i].trim().match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if(h&&BASE.products[h[1].trim().toUpperCase()])heads.push({i,name:h[1].trim().toUpperCase()});
 }
 if(!heads.length)return;const out=[...lines];
 for(let z=heads.length-1;z>=0;z--){
  const h=heads[z],end=z+1<heads.length?heads[z+1].i:out.length,p=d.products[h.name];if(!p)continue;
  const body=out.slice(h.i+1,end).filter(l=>!/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left|Smoked|Used)\s*:/i.test(l));
  while(body.length&&body[body.length-1].trim()==='')body.pop();
  out.splice(h.i,end-h.i,out[h.i],...body,'',`Total: €${fmt(p.total)}`,`Total sold: ${fmt(p.totalSold)}`,`Left: ${fmt(p.left)}`,`Smoked: ${fmt(p.smoked)}`,...(z<heads.length-1?['','']:[]));
 }
 const nextText=out.join('\n');if(nextText===n.value)return;
 syncing=true;n.value=nextText;
 try{localStorage.setItem('goshaNoteV21',nextText);localStorage.setItem('goshaNote',nextText)}catch(_){}
 n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));syncing=false;
}

function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
function ownDayControls(){
 const day=$('#dashDaySelect'),prev=$('#dashPrevDay'),next=$('#dashNextDay');if(!day||!prev||!next)return;
 const activateDay=e=>{if(!isCurrentNote()||hasOtherBatches())return;e.preventDefault();e.stopImmediatePropagation();day.classList.add('active');document.querySelectorAll('#goshaDashboard .dashScope').forEach(b=>b.classList.remove('active'));render()};
 day.addEventListener('click',activateDay,true);
 prev.addEventListener('click',e=>{if(!isCurrentNote()||hasOtherBatches()||mode()!=='day')return;e.preventDefault();e.stopImmediatePropagation();if(selectedDay>1)selectedDay--;render()},true);
 next.addEventListener('click',e=>{if(!isCurrentNote()||hasOtherBatches()||mode()!=='day')return;e.preventDefault();e.stopImmediatePropagation();if(selectedDay<7)selectedDay++;render()},true);
}
function boot(){
 let tries=0;const go=()=>{
  if(!$('#goshaDashboard')||!$('#note')){if(tries++<60)setTimeout(go,100);return}
  ownDayControls();render();
  observer=new MutationObserver(schedule);observer.observe($('#goshaDashboard'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  $('#note').addEventListener('input',schedule,{passive:true});$('#note').addEventListener('change',schedule);
  document.addEventListener('click',e=>{if(e.target?.id==='calcBtn'&&isCurrentNote()){e.preventDefault();e.stopImmediatePropagation();cleanAndSyncNotebook();render()}},true);
 };
 go();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();