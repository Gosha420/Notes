(()=>{
'use strict';
const MARK='goshaReconstructedDay7_20260828_v1';
const TEXT=`RECOVERED / RECONSTRUCTED CHECKPOINT — DAY 7

LEMON OG 500/3100
Smoked: 15
Remembered/provisional left: 250
Exact Lemon OG remaining amount: UNKNOWN — change 250 when established.


BLUE DREAM 200/1400
Smoked: 12
Remembered left: ~93


REMEMBERED BATCH TOTALS
Day: 7 now
By end of Day 6 / yesterday:
Gross earned: ~€2930
Net profit: ~€1000.20
Left to earn: ~€3500
Day 6 profit: ~€168 (approx.)
Other days: roughly ~€200/day

€1000.20 belongs to THIS Lemon OG + Blue Dream batch only.
Previous Pineapple OG + Blue Dream batch ended the same calendar day this batch began and had made over €2000.

Missing transaction lines have NOT been invented.`;
function install(){
  let done=false;try{done=localStorage.getItem(MARK)==='1'}catch(_){}
  if(done)return;
  const n=document.querySelector('#note');if(!n)return setTimeout(install,100);
  // Preserve whatever is currently visible before replacing it.
  try{localStorage.setItem('goshaBeforeDay7Reconstruction',n.value)}catch(_){}
  n.value=TEXT;
  try{localStorage.setItem('goshaNoteV21',TEXT);localStorage.setItem('goshaNote',TEXT);localStorage.setItem(MARK,'1')}catch(_){}
  n.dispatchEvent(new Event('input',{bubbles:true}));
  n.dispatchEvent(new Event('change',{bubbles:true}));
  // The existing vault input/change handlers replicate this into IndexedDB, Cache Storage and native Android storage.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,650),{once:true});else setTimeout(install,650);
})();