(()=>{
'use strict';
const RESET_KEY='goshaActiveReset20260913V1',BACKUP_KEY='goshaBeforeBatchReset20260913',NOTE='goshaNoteV21',LEGACY='goshaNote';
function run(){try{if(localStorage.getItem(RESET_KEY)==='1')return}catch(_){}const n=document.querySelector('#note');if(!n)return;const old=n.value;try{if(old.trim())localStorage.setItem(BACKUP_KEY,old);localStorage.removeItem('goshaInventoryCorrectionsV1');localStorage.removeItem('goshaBatchStatsSelectedV1')}catch(_){}n.value='';try{localStorage.setItem(NOTE,'');localStorage.setItem(LEGACY,'');sessionStorage.setItem(NOTE,'')}catch(_){}n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));try{localStorage.setItem(RESET_KEY,'1')}catch(_){}setTimeout(()=>window.GoshaImmediateSave?.(),0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();