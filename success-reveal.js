(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
#bioStage.successReveal{background:rgba(0,0,0,1)!important;transition:none!important;opacity:1!important;pointer-events:none!important;overflow:hidden!important}
body.bio-success-reveal .app{visibility:visible!important}
#bioStage .revealRipple{position:absolute;right:-26px;top:48%;width:46px;height:46px;border-radius:50%;border:1px solid rgba(174,255,130,.9);box-shadow:0 0 18px rgba(134,255,40,.7),inset 0 0 18px rgba(134,255,40,.15);transform:translateY(-50%) scale(.2);opacity:0;pointer-events:none}
#bioStage.successReveal .revealRipple{animation:goshaRipple 1.3s cubic-bezier(.12,.72,.18,1) forwards}
#bioStage.successReveal .revealRipple.r2{animation-delay:.16s}
#bioStage.successReveal .revealRipple.r3{animation-delay:.32s}
#bioStage.successReveal .revealRipple.r4{animation-delay:.48s}
#bioStage.successReveal{animation:goshaLayerFade 1.3s steps(4,end) forwards}
#bioStage.successReveal .bioEdge{background:#e2ffd8!important;box-shadow:-5px 0 40px rgba(134,255,40,.95),-40px 0 140px rgba(78,255,82,.32)!important}
#bioStage.successReveal .bioBeam{animation:goshaSuccessBeam 1.3s cubic-bezier(.12,.72,.18,1) forwards!important}
#bioStage.successReveal .bioHint{animation:goshaHintFade 1.3s ease forwards!important}
@keyframes goshaRipple{0%{transform:translateY(-50%) scale(.2);opacity:0}12%{opacity:.95}70%{opacity:.38}100%{transform:translateY(-50%) scale(42);opacity:0}}
@keyframes goshaLayerFade{0%{background:rgba(0,0,0,1)}25%{background:rgba(0,0,0,.78)}50%{background:rgba(0,0,0,.53)}75%{background:rgba(0,0,0,.28)}100%{background:rgba(0,0,0,0)}}
@keyframes goshaSuccessBeam{0%{transform:translateY(-50%) scaleX(.25);opacity:.7}42%{transform:translateY(-50%) scaleX(1.15);opacity:1}100%{transform:translateY(-50%) scaleX(2.2);opacity:0}}
@keyframes goshaHintFade{0%,20%{opacity:.65}100%{opacity:0}}
`;
document.head.appendChild(style);
function install(){const bio=document.querySelector('#bioStage'),app=document.querySelector('.app');if(!bio||!app||typeof window.goshaBiometricResult!=='function')return false;
if(!bio.querySelector('.revealRipple'))bio.insertAdjacentHTML('beforeend','<i class="revealRipple r1"></i><i class="revealRipple r2"></i><i class="revealRipple r3"></i><i class="revealRipple r4"></i>');
const original=window.goshaBiometricResult;
window.goshaBiometricResult=ok=>{
 if(!ok){original(false);return}
 document.body.classList.add('bio-success-reveal');
 app.classList.add('revealed');
 bio.classList.remove('failread','success');
 bio.classList.add('successReveal');
 try{navigator.vibrate?.([18,48,24,48,42])}catch(_){}
 setTimeout(()=>{
   document.body.classList.remove('bio-pending','bio-success-reveal');
   bio.classList.remove('show','successReveal');
 },1320);
 };
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(install,0)},{once:true});else setTimeout(install,0);
})();