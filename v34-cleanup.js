(()=>{
'use strict';
const note=()=>document.querySelector('#note');
const style=document.createElement('style');
style.textContent=`
:root{--v34-line:rgba(114,255,116,.13);--v34-soft:rgba(114,255,116,.055);--v34-text:#e8eee8;--v34-muted:rgba(220,235,220,.46)}
.panel{background:linear-gradient(180deg,rgba(6,10,6,.98),rgba(1,3,1,.99))!important;border-color:var(--v34-line)!important;border-radius:24px!important;box-shadow:0 14px 42px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.015)!important;overflow:hidden}
.panelHead{padding-top:18px!important;padding-bottom:16px!important;border-bottom:1px solid rgba(114,255,116,.095)!important;background:linear-gradient(180deg,rgba(255,255,255,.014),transparent)!important}
.panelHead h2,.panelHead h3{letter-spacing:-.02em!important}
#note{background:#000!important;color:var(--v34-text)!important;border:0!important;box-shadow:none!important;line-height:1.62!important;padding:28px 28px 34px!important;caret-color:#8cff72!important;letter-spacing:.005em!important}
#note::placeholder{color:rgba(220,235,220,.25)!important}
#saveStatus{background:transparent!important;border-color:rgba(114,255,116,.17)!important;color:rgba(190,255,190,.56)!important;box-shadow:none!important;font-size:.82em!important;letter-spacing:.045em!important}
.btn,.navBtn,.bottomNav button{background:rgba(255,255,255,.018)!important;border-color:rgba(114,255,116,.17)!important;color:rgba(228,240,228,.78)!important;box-shadow:none!important}
.btn:hover,.navBtn:hover,.bottomNav button:hover{background:rgba(114,255,116,.045)!important}
.btn.primary,#calcBtn{background:rgba(114,255,116,.065)!important;border-color:rgba(114,255,116,.28)!important;color:#dfffe0!important}
.bottomNav{background:rgba(2,4,2,.96)!important;border-color:rgba(114,255,116,.12)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;box-shadow:0 -12px 35px rgba(0,0,0,.32)!important}
.setting,.stat,.card{border-color:rgba(114,255,116,.11)!important;background:rgba(255,255,255,.012)!important;box-shadow:none!important}
`;
document.head.appendChild(style);

function removeInstruction(){
 for(const el of document.querySelectorAll('p,div,small,footer,span')){
  const t=(el.textContent||'').trim();
  if(t.startsWith('Product headings such as')||t.includes('define starting stock and cost. Heading values are excluded')) el.remove();
 }
}

function suppressSavedPopup(){
 const toast=document.querySelector('#toast');
 if(!toast)return;
 const clean=()=>{
  const t=(toast.textContent||'').trim().toLowerCase();
  if(t==='saved locally'||t==='saved local'||t==='saved' || (t.includes('saved')&&t.includes('local'))){
   toast.classList.remove('show');
   toast.style.opacity='0';
   toast.style.pointerEvents='none';
   setTimeout(()=>{toast.style.opacity='';toast.style.pointerEvents=''},180);
  }
 };
 new MutationObserver(clean).observe(toast,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
 clean();
}

function addResultGap(){
 const n=note(); if(!n)return;
 let lines=n.value.split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  if(/^\s*Total:\s*/i.test(lines[i])){
   let j=i-1;
   while(j>=0&&lines[j].trim()==='')j--;
   const blanks=i-j-1;
   if(blanks!==1){
    lines.splice(j+1,blanks,'');
    i=j+2;
   }
  }
 }
 const next=lines.join('\n');
 if(next!==n.value){
  const pos=n.selectionStart;
  n.value=next;
  localStorage.setItem('goshaNoteV21',next);
  n.dispatchEvent(new Event('input',{bubbles:true}));
  try{n.setSelectionRange(Math.min(pos,next.length),Math.min(pos,next.length))}catch(_){ }
 }
}

function wireCalcGap(){
 const b=document.querySelector('#calcBtn');if(!b)return;
 b.addEventListener('click',()=>setTimeout(addResultGap,0));
}

function boot(){removeInstruction();suppressSavedPopup();wireCalcGap();setTimeout(removeInstruction,250);setTimeout(removeInstruction,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();