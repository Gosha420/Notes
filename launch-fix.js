(()=>{
'use strict';
if(!(window.AndroidBiometric&&typeof window.AndroidBiometric.authenticate==='function'))return;

const style=document.createElement('style');
style.textContent=`
html.nativeAuthSimple body:not(.authUnlocked) .hero:before,html.nativeAuthSimple body:not(.authUnlocked) .hero:after{opacity:0!important;animation:none!important;filter:none!important;background-image:none!important}
html.nativeAuthSimple body:not(.authUnlocked) .hero{background:#000!important}
body.bio-pending{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important}
body.bio-pending .app{visibility:hidden!important}
#bioStage.show{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;overflow:hidden!important;pointer-events:auto!important;background:#000!important}
#bioStage.authDenied .authRetry{display:block!important}
#bioStage .authRetry{position:absolute;left:50%;bottom:max(42px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10;display:none;width:min(86vw,360px);padding:13px 16px;border:1px solid rgba(134,255,40,.24);border-radius:14px;background:rgba(2,8,3,.96);color:#cfffbd;text-align:center;font:700 10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}
#tapGateFail.show{display:flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;background:#000!important}
#tapGateFail.show .fingerArt{display:block!important;opacity:.95!important;visibility:visible!important;width:min(90vw,680px)!important;max-height:92dvh!important;object-fit:contain!important}
`;
document.head.appendChild(style);
document.documentElement.classList.add('nativeAuthSimple');

function setup(){
 const app=document.querySelector('.app');
 const bio=document.querySelector('#bioStage');
 if(!app||!bio||typeof window.goshaBiometricResult!=='function')return false;
 if(bio.dataset.simpleGuard==='1')return true;
 bio.dataset.simpleGuard='1';
 if(!bio.querySelector('.authRetry')){
   const retry=document.createElement('div');
   retry.className='authRetry';
   retry.innerHTML='AUTHENTICATION FAILED<br><span style="opacity:.55;font-weight:600">TAP TO RETRY</span>';
   bio.appendChild(retry);
 }
 const originalResult=window.goshaBiometricResult;
 const originalUnavailable=window.goshaBiometricUnavailable;
 window.goshaBiometricResult=ok=>{
   if(ok){
     bio.classList.remove('authDenied');
     document.body.classList.add('authUnlocked');
     originalResult(true);
     return;
   }
   document.body.classList.remove('authUnlocked','gate-failed');
   document.body.classList.add('bio-pending');
   bio.classList.remove('success','successReveal','failread');
   bio.classList.add('show','authDenied');
 };
 window.goshaBiometricUnavailable=()=>{
   document.body.classList.remove('authUnlocked','gate-failed');
   document.body.classList.add('bio-pending');
   bio.classList.remove('success','successReveal','failread');
   bio.classList.add('show','authDenied');
   const retry=bio.querySelector('.authRetry');
   if(retry)retry.innerHTML='BIOMETRIC UNAVAILABLE<br><span style="opacity:.55;font-weight:600">TAP TO TRY AGAIN</span>';
   if(typeof originalUnavailable==='function')try{originalUnavailable()}catch(_){}
 };
 bio.addEventListener('click',()=>{
   if(!bio.classList.contains('authDenied'))return;
   bio.classList.remove('authDenied');
   const retry=bio.querySelector('.authRetry');
   if(retry)retry.innerHTML='AUTHENTICATION FAILED<br><span style="opacity:.55;font-weight:600">TAP TO RETRY</span>';
   document.body.classList.add('bio-pending');
   bio.classList.add('show');
   try{window.AndroidBiometric.authenticate()}catch(_){window.goshaBiometricUnavailable()}
 });
 return true;
}
function boot(){let tries=0;const go=()=>{if(!setup()&&tries++<100)setTimeout(go,20)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
