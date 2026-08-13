(()=>{
'use strict';
if(!(window.AndroidBiometric&&typeof window.AndroidBiometric.authenticate==='function'))return;

document.documentElement.classList.add('nativeAuthGuard');
const style=document.createElement('style');
style.textContent=`
html.nativeAuthGuard,html.nativeAuthGuard body{background:#000!important;overscroll-behavior:none!important}
html.nativeAuthGuard body:not(.authUnlocked) .hero:before,html.nativeAuthGuard body:not(.authUnlocked) .hero:after{opacity:0!important;animation:none!important;filter:none!important;background-image:none!important}
html.nativeAuthGuard body:not(.authUnlocked) .hero{background:#000!important}
html.nativeAuthGuard body.gate-failed,html.nativeAuthGuard body.bio-pending{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important;touch-action:none!important}
html.nativeAuthGuard body.gate-failed .app,html.nativeAuthGuard body.bio-pending .app{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important}
html.nativeAuthGuard body.authUnlocked{position:static!important;height:auto!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:auto!important}
html.nativeAuthGuard body.authUnlocked .app{position:static!important;height:auto!important;overflow:visible!important}
#tapGateFail,#bioStage{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important}
#tapGateFail.show{display:flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;background:#000!important}
#tapGateFail.show .fingerArt{display:block!important;opacity:.94!important;visibility:visible!important;width:min(90vw,680px)!important;max-height:92dvh!important;object-fit:contain!important}
#bioStage.authDenied{cursor:pointer}
#bioStage .authRetry{position:absolute;left:50%;bottom:max(42px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:8;display:none;width:min(86vw,360px);padding:13px 16px;border:1px solid rgba(134,255,40,.24);border-radius:14px;background:rgba(2,8,3,.92);color:#cfffbd;text-align:center;font:700 10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;box-shadow:0 0 30px rgba(134,255,40,.06)}
#bioStage.authDenied .authRetry{display:block}
#bioStage.authDenied .bioHint{opacity:.2!important}
`;
document.head.appendChild(style);

function lock(){if(document.body)document.body.classList.remove('authUnlocked')}
function unlock(){if(document.body)document.body.classList.add('authUnlocked')}

function setup(){
 const app=document.querySelector('.app');
 const bio=document.querySelector('#bioStage');
 const fail=document.querySelector('#tapGateFail');
 if(!app||!bio||!fail||typeof window.goshaBiometricResult!=='function')return false;

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
     originalResult(true);
     return;
   }
   lock();
   document.body.classList.remove('gate-failed');
   document.body.classList.add('bio-pending');
   fail.classList.remove('show');
   bio.classList.remove('success','successReveal','failread');
   bio.classList.add('show','authDenied');
 };

 window.goshaBiometricUnavailable=()=>{
   lock();
   document.body.classList.remove('gate-failed');
   document.body.classList.add('bio-pending');
   fail.classList.remove('show');
   bio.classList.remove('success','successReveal','failread');
   bio.classList.add('show','authDenied');
   const retry=bio.querySelector('.authRetry');
   if(retry)retry.innerHTML='BIOMETRIC UNAVAILABLE<br><span style="opacity:.55;font-weight:600">TAP TO TRY AGAIN</span>';
 };

 bio.addEventListener('click',()=>{
   if(!bio.classList.contains('authDenied'))return;
   bio.classList.remove('authDenied');
   const retry=bio.querySelector('.authRetry');
   if(retry)retry.innerHTML='AUTHENTICATION FAILED<br><span style="opacity:.55;font-weight:600">TAP TO RETRY</span>';
   lock();
   document.body.classList.add('bio-pending');
   bio.classList.add('show');
   try{window.AndroidBiometric.authenticate()}catch(_){
     if(typeof window.goshaBiometricUnavailable==='function')window.goshaBiometricUnavailable();
     else if(typeof originalUnavailable==='function')originalUnavailable();
   }
 });

 const sync=()=>{
   if(app.classList.contains('revealed')){
     unlock();
     return;
   }
   if(document.body.classList.contains('gate-failed')||document.body.classList.contains('bio-pending'))lock();
 };
 const watch=new MutationObserver(sync);
 watch.observe(app,{attributes:true,attributeFilter:['class']});
 watch.observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
 return true;
}

function boot(){let tries=0;const go=()=>{if(!setup()&&tries++<80)setTimeout(go,25)};setTimeout(go,0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
