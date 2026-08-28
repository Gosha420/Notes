(()=>{
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(Math.round((Number(n)+Number.EPSILON)*100)/100);
const money=n=>'€'+fmt(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

// End-of-Day-6 recovered batch baseline.
const BASE={
 completedDays:6,currentDay:7,earned:2930,net:1000.2,leftToEarn:3500,sold:330,left:343,smoked:27,
 products:{
  'LEMON OG':{name:'LEMON OG',acquired:500,spent:3100,sold:235,left:250,smoked:15,total:2086.52},
  'BLUE DREAM':{name:'BLUE DREAM',acquired:200,spent:1400,sold:95,left:93,smoked:12,total:843.48}
 }
};
// User-confirmed current Day-7 state.
const DAY7_PROFIT=168;
const LEMON_CURRENT_LEFT=245;
const LEMON_ANCHOR_KEY='goshaLemon245Anchor_20260828_v2';
const PROFIT_ANCHOR_KEY='goshaDay7Profit168Anchor_20260828_v1';
const TARGET_PER_LEFT=BASE.left?BASE.leftToEarn/BASE.left:0;
let queued=false,observer=null,selectedDay=7;

function hasOtherBatches(){try{const a=JSON.parse(localStorage.getItem('goshaBatchStatsSelectedV1')||'[]');return Array.isArray(a)&&a.length>0}catch(_){return false}}
function isCurrentNote(){const n=$('#note');if(!n)return false;const t=n.value.toUpperCase();return t.includes('LEMON OG 500/3100')&&t.includes('BLUE DREAM 200/1400')}
function pairs(s){return [...String(s||'').matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g)].map(m=>({qty:+m[1],price:+m[2]}))}
function readAnchor(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function saveAnchor(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}

function parseLive(){
 const n=$('#note');if(!n)return null;
 const lines=n.value.split(/\r?\n/),out={products:{},earned:0,parsedSold:0,rawNet:0,tx:0};let cur=null;
 for(const line of lines){
  const t=line.trim();if(!t)continue;
  const h=t.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if(h&&/[A-Za-zÀ-ž]/.test(h[1])){const name=h[1].trim().toUpperCase();cur=BASE.products[name]?{name,smoked:BASE.products[name].smoked,parsedSold:0,earned:0,tx:0}:null;if(cur)out.products[name]=cur;continue}
  if(!cur)continue;
  const sm=t.match(/^(?:smoked|used)\s*:?\s*(\d+(?:\.\d+)?)/i);if(sm){cur.smoked=+sm[1];continue}
  if(/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left)\s*:/i.test(t))continue;
  for(const x of pairs(line)){cur.parsedSold+=x.qty;cur.earned+=x.price;cur.tx++}
 }
 for(const name of Object.keys(BASE.products)){
  const b=BASE.products[name],p=out.products[name]||{name,smoked:b.smoked,parsedSold:0,earned:0,tx:0};out.products[name]=p;
  const cost=b.spent/b.acquired;
  if(name==='LEMON OG'){
   let a=readAnchor(LEMON_ANCHOR_KEY);
   if(!a||!Number.isFinite(+a.parsedSold)||!Number.isFinite(+a.smoked)){a={parsedSold:p.parsedSold,smoked:p.smoked,createdAt:Date.now()};saveAnchor(LEMON_ANCHOR_KEY,a)}
   const afterSold=Math.max(0,p.parsedSold-(+a.parsedSold||0)),afterSmoke=Math.max(0,p.smoked-(+a.smoked||b.smoked));
   p.left=Math.max(0,LEMON_CURRENT_LEFT-afterSold-afterSmoke);p.totalSmoked=p.smoked;p.totalSold=Math.max(0,b.acquired-p.left-p.totalSmoked);p.daySold=Math.max(0,p.totalSold-b.sold);
  }else{
   p.daySold=p.parsedSold;p.totalSmoked=Math.max(b.smoked,p.smoked);p.totalSold=b.sold+p.daySold;p.left=Math.max(0,b.acquired-p.totalSold-p.totalSmoked);
  }
  p.rawNet=p.earned-p.daySold*cost;p.totalEarned=b.total+p.earned;
  out.earned+=p.earned;out.parsedSold+=p.daySold;out.rawNet+=p.rawNet;out.tx+=p.tx;
 }
 let pa=readAnchor(PROFIT_ANCHOR_KEY);
 if(!pa||!Number.isFinite(+pa.rawNet)){pa={rawNet:out.rawNet,createdAt:Date.now()};saveAnchor(PROFIT_ANCHOR_KEY,pa)}
 out.dayNet=DAY7_PROFIT+(out.rawNet-(+pa.rawNet||0));
 out.totalNet=BASE.net+out.dayNet;
 out.totalEarned=BASE.earned+out.earned;
 out.totalSold=Object.values(out.products).reduce((a,p)=>a+p.totalSold,0);
 out.totalLeft=Object.values(out.products).reduce((a,p)=>a+p.left,0);
 out.leftToEarn=Math.max(0,out.totalLeft*TARGET_PER_LEFT);
 return out;
}

function set(sel,val){const e=$(sel);if(e&&e.textContent!==String(val))e.textContent=String(val)}
function setUnknown(sel){set(sel,'—')}
function mode(){if($('#dashDaySelect')?.classList.contains('active'))return 'day';return $('#goshaDashboard .dashScope.active')?.dataset.mode||'batch'}
function setTop({earned,sold,net,tx,avg,left,leftToEarn,label,delta,headerTx}){
 earned===null?setUnknown('#dashEarned'):set('#dashEarned',money(earned));sold===null?setUnknown('#dashSold'):set('#dashSold',fmt(sold));net===null?setUnknown('#dashProfit'):set('#dashProfit',money(net));tx===null?setUnknown('#dashTransactions'):set('#dashTransactions',fmt(tx));avg===null?setUnknown('#dashAverage'):set('#dashAverage',money(avg));left===null?setUnknown('#dashLeft'):set('#dashLeft',fmt(left));
 if(leftToEarn!==undefined)(leftToEarn===null?setUnknown('#dashLeftToEarn'):set('#dashLeftToEarn',money(leftToEarn)));if(label)set('#dashScopeLabel',label);if(delta)set('#dashDelta',delta);if(headerTx!==undefined)set('#dashTx',headerTx);
}
function card(name,earned,sold,tx,left,leftToEarn,share,showNet){const avg=sold?money(earned/sold):'€0';return `<article class="dashProduct"><div class="dashProductHead"><b>${esc(name)}</b><span class="dashBadge">${tx===null?'— TX':fmt(tx)+' TX'}</span></div><div class="dashRow"><span>EARNED</span><strong>${money(earned)}</strong></div><div class="dashRow"><span>SOLD</span><strong>${fmt(sold)}</strong></div><div class="dashRow"><span>NET</span><strong>${showNet?'—':'—'}</strong></div><div class="dashRow"><span>AVG / UNIT</span><strong>${avg}</strong></div><div class="dashRow leftEarnRow"><span>LEFT TO EARN</span><strong>${money(leftToEarn)}</strong></div><div class="dashRow"><span>REMAINING</span><strong>${fmt(left)}</strong></div><div class="dashMeter"><i style="width:${Math.max(0,Math.min(100,share))}%"></i></div></article>`}
function renderCards(d,m){const out=$('#dashProducts');if(!out)return;let html='';if(m==='day'&&selectedDay<7)html='<div class="dashEmpty">HISTORICAL PER-STRAIN DETAIL NOT RECOVERED</div>';else if(m==='day'){const total=d.earned;html=Object.values(d.products).map(p=>card(p.name,p.earned,p.daySold,p.tx,p.left,p.left*TARGET_PER_LEFT,total?p.earned/total*100:0,false)).join('')}else{const total=d.totalEarned;html=Object.values(d.products).map(p=>card(p.name,p.totalEarned,p.totalSold,null,p.left,p.left*TARGET_PER_LEFT,total?p.totalEarned/total*100:0,false)).join('')}if(out.innerHTML!==html)out.innerHTML=html}
function setCombined(d){set('#allEarned',money(d.totalEarned));set('#allSold',fmt(d.totalSold));set('#allNet',money(d.totalNet));set('#allAvg',money(d.totalSold?d.totalEarned/d.totalSold:0));set('#allRemaining',fmt(d.totalLeft));set('#allLeftToEarn',money(d.leftToEarn));set('#allStrainCount','2 STRAINS')}

function render(){
 if(!isCurrentNote()||hasOtherBatches())return;const d=parseLive();if(!d)return;const m=mode(),day=$('#dashDaySelect');if(day)day.textContent='DAY '+selectedDay+' / 50';
 const prev=$('#dashPrevDay'),next=$('#dashNextDay');if(m==='day'){if(prev)prev.disabled=selectedDay<=1;if(next)next.disabled=selectedDay>=7}
 if(m==='day'){
  if(selectedDay===7)setTop({earned:d.earned,sold:d.parsedSold,net:d.dayNet,tx:d.tx,avg:d.parsedSold?d.earned/d.parsedSold:0,left:d.totalLeft,leftToEarn:d.leftToEarn,label:'DAY 7 SIGNAL',delta:'TODAY',headerTx:d.tx+' TX'});
  else setTop({earned:null,sold:null,net:null,tx:null,avg:null,left:null,leftToEarn:null,label:'DAY '+selectedDay+' SIGNAL',delta:'HISTORICAL DETAIL LOST',headerTx:'— TX'});
 }else{
  const labels={week1:'FIRST 7 DAYS',week2:'FIRST 2 WEEKS',week3:'FIRST 3 WEEKS',month:'FIRST 30 DAYS',batch:'WHOLE BATCH'};
  setTop({earned:d.totalEarned,sold:d.totalSold,net:d.totalNet,tx:null,avg:d.totalSold?d.totalEarned/d.totalSold:0,left:d.totalLeft,leftToEarn:d.leftToEarn,label:labels[m]||'WHOLE BATCH',delta:'DAY 6 BASE + DAY 7 LIVE',headerTx:'DAY 7: '+d.tx+' TX'});
 }
 renderCards(d,m);setCombined(d);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
function ownDayControls(){const day=$('#dashDaySelect'),prev=$('#dashPrevDay'),next=$('#dashNextDay');if(!day||!prev||!next)return;day.addEventListener('click',e=>{if(!isCurrentNote()||hasOtherBatches())return;e.preventDefault();e.stopImmediatePropagation();day.classList.add('active');document.querySelectorAll('#goshaDashboard .dashScope').forEach(b=>b.classList.remove('active'));render()},true);prev.addEventListener('click',e=>{if(!isCurrentNote()||hasOtherBatches()||mode()!=='day')return;e.preventDefault();e.stopImmediatePropagation();if(selectedDay>1)selectedDay--;render()},true);next.addEventListener('click',e=>{if(!isCurrentNote()||hasOtherBatches()||mode()!=='day')return;e.preventDefault();e.stopImmediatePropagation();if(selectedDay<7)selectedDay++;render()},true)}
function boot(){let tries=0;const go=()=>{if(!$('#goshaDashboard')||!$('#note')){if(tries++<60)setTimeout(go,100);return}ownDayControls();render();observer=new MutationObserver(schedule);observer.observe($('#goshaDashboard'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});$('#note').addEventListener('input',schedule,{passive:true});$('#note').addEventListener('change',schedule);document.addEventListener('click',e=>{if(e.target?.id==='calcBtn'&&isCurrentNote()){e.preventDefault();e.stopImmediatePropagation();render()}},true)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();