(()=>{
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(Math.round((Number(n)+Number.EPSILON)*100)/100);
const money=n=>'€'+fmt(n);
let queued=false,observer=null;
function stats(){
  if(window.GoshaRecoveredCurrent)return window.GoshaRecoveredCurrent;
  try{return JSON.parse(localStorage.getItem('goshaRecoveredCurrentStatsV1')||'null')}catch(_){return null}
}
function isCurrentNote(){const n=$('#note');if(!n)return false;const t=n.value.toUpperCase();return t.includes('LEMON OG 500/3100')&&t.includes('BLUE DREAM 200/1400')}
function set(sel,val){const e=$(sel);if(e&&e.textContent!==val)e.textContent=val}
function render(){
  const s=stats();if(!s||!isCurrentNote())return;
  const batchActive=$('#goshaDashboard .dashScope[data-mode="batch"]')?.classList.contains('active');
  if(batchActive){
    set('#dashEarned',money(s.earned));
    set('#dashSold',fmt(s.sold));
    set('#dashProfit',money(s.net));
    set('#dashAverage',money(s.sold?s.earned/s.sold:0));
    set('#dashLeft',fmt(s.left));
    set('#dashLeftToEarn',money(s.leftToEarn));
    set('#dashScopeLabel','WHOLE BATCH');
    set('#dashDelta','DAY '+s.day+' // RECOVERED TOTAL');
  }
  set('#allEarned',money(s.earned));
  set('#allSold',fmt(s.sold));
  set('#allNet',money(s.net));
  set('#allAvg',money(s.sold?s.earned/s.sold:0));
  set('#allRemaining',fmt(s.left));
  set('#allLeftToEarn',money(s.leftToEarn));
  set('#allStrainCount',s.products.length+' STRAINS');
  const day=$('#dashDaySelect');if(day&&!day.classList.contains('active'))day.textContent='DAY '+s.day+' / 50';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
function boot(){
  let tries=0;
  const go=()=>{if(!$('#goshaDashboard')||!$('#note')){if(tries++<60)setTimeout(go,100);return}render();observer=new MutationObserver(schedule);observer.observe($('#goshaDashboard'),{subtree:true,childList:true,characterData:true});$('#note').addEventListener('input',schedule,{passive:true});$('#note').addEventListener('change',schedule)};
  go();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();