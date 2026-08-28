(()=>{
'use strict';
const MARK='goshaReconstructedDay7_20260828_v3';
const TEXT=`LEMON OG 500/3100

Total: €2086.52
Total sold: 235
Left: 250
Smoked: 15


BLUE DREAM 200/1400

Total: €843.48
Total sold: 95
Left: 93
Smoked: 12`;
const STATS={version:1,day:7,completedDays:6,earned:2930,net:1000.2,leftToEarn:3500,sold:330,left:343,smoked:27,day6Net:168,products:[{name:'LEMON OG',acquired:500,spent:3100,sold:235,left:250,smoked:15,total:2086.52},{name:'BLUE DREAM',acquired:200,spent:1400,sold:95,left:93,smoked:12,total:843.48}]};
window.GoshaRecoveredCurrent=STATS;
function install(){
  try{localStorage.setItem('goshaRecoveredCurrentStatsV1',JSON.stringify(STATS))}catch(_){}
  let done=false;try{done=localStorage.getItem(MARK)==='1'}catch(_){}
  if(done)return;
  const n=document.querySelector('#note');if(!n)return setTimeout(install,100);
  try{localStorage.setItem('goshaBeforeDay7ReconstructionV3',n.value)}catch(_){}
  n.value=TEXT;
  try{localStorage.setItem('goshaNoteV21',TEXT);localStorage.setItem('goshaNote',TEXT);localStorage.setItem(MARK,'1')}catch(_){}
  n.dispatchEvent(new Event('input',{bubbles:true}));
  n.dispatchEvent(new Event('change',{bubbles:true}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,650),{once:true});else setTimeout(install,650);
})();