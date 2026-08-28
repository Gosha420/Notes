(()=>{
'use strict';
const MARK='goshaReconstructedDay7_20260828_v2';
const TEXT=`LEMON OG 500/3100

Total: €—
Total sold: 235
Left: 250
Smoked: 15


BLUE DREAM 200/1400

Total: €—
Total sold: 95
Left: 93
Smoked: 12


BATCH TOTALS — DAY 7
Total earned: ~€2930
Profit: ~€1000.20
Left to earn: ~€3500
Yesterday / Day 6 profit: ~€168`;
function install(){
  let done=false;try{done=localStorage.getItem(MARK)==='1'}catch(_){}
  if(done)return;
  const n=document.querySelector('#note');if(!n)return setTimeout(install,100);
  try{localStorage.setItem('goshaBeforeDay7ReconstructionV2',n.value)}catch(_){}
  n.value=TEXT;
  try{
    localStorage.setItem('goshaNoteV21',TEXT);
    localStorage.setItem('goshaNote',TEXT);
    localStorage.setItem(MARK,'1');
  }catch(_){}
  n.dispatchEvent(new Event('input',{bubbles:true}));
  n.dispatchEvent(new Event('change',{bubbles:true}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,650),{once:true});else setTimeout(install,650);
})();