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
 setTimeout(()=>{document.body.classList.remove('bio-pending','bio-success-reveal');bio.classList.remove('show','successReveal')},1320)
};
return true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0)
})();

(()=>{
'use strict';
const s=document.createElement('style');
s.id='gosha-deck-style';
s.textContent=`
#goshaRecoverHeader{display:none!important}
.bottomNav.vaultDeck{height:72px!important;display:grid!important;grid-template-columns:minmax(118px,.9fr) repeat(2,minmax(0,1fr))!important;left:10px!important;right:10px!important;bottom:max(9px,env(safe-area-inset-bottom))!important;border:1px solid rgba(108,255,80,.22)!important;border-radius:16px!important;background:linear-gradient(180deg,rgba(3,10,5,.97),rgba(0,2,1,.985))!important;box-shadow:0 -14px 46px rgba(0,0,0,.72),0 0 0 1px rgba(50,255,80,.025) inset,0 0 30px rgba(41,255,88,.055)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;overflow:hidden!important}
.bottomNav.vaultDeck:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(130,255,105,.7),transparent);opacity:.7;pointer-events:none}
.bottomNav.vaultDeck:after{content:"SYS // GO$HA";position:absolute;right:10px;top:5px;font:600 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:rgba(128,255,105,.24);pointer-events:none}
.vaultDeckStatus{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:3px;padding:0 13px;border-right:1px solid rgba(110,255,85,.12);font:600 9px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;color:rgba(188,255,175,.55);min-width:0}
.vaultDeckStatus b{font-size:9px;color:#b8ffac;letter-spacing:.06em;white-space:nowrap}.deckPulse{width:6px;height:6px;border-radius:50%;background:#8cff72;box-shadow:0 0 10px rgba(130,255,105,.9);animation:deckPulse 1.7s ease-in-out infinite}.vaultDeckStatus>span:nth-child(2){position:absolute;left:28px;top:20px}
@keyframes deckPulse{50%{opacity:.28;box-shadow:0 0 3px rgba(130,255,105,.3)}}
.bottomNav.vaultDeck .navBtn{height:72px!important;border:0!important;border-right:1px solid rgba(110,255,85,.09)!important;background:linear-gradient(180deg,rgba(255,255,255,.012),transparent)!important;color:rgba(173,194,169,.55)!important;font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.12em!important;text-transform:uppercase!important;position:relative!important}
.bottomNav.vaultDeck .navBtn:last-child{border-right:0!important}.bottomNav.vaultDeck .navBtn.active{color:#dffff8!important;background:radial-gradient(circle at 50% 100%,rgba(91,255,78,.10),transparent 65%)!important;text-shadow:0 0 12px rgba(104,255,91,.28)}
.bottomNav.vaultDeck .navBtn.active:after{left:22%!important;right:22%!important;height:2px!important;background:#8cff72!important;box-shadow:0 0 12px rgba(110,255,90,.75)!important}
.vaultSetting{position:relative;overflow:hidden}.vaultSetting:before{content:"DATA REDUNDANCY // ACTIVE";position:absolute;right:12px;top:9px;font:600 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;color:rgba(126,255,103,.28)}.vaultMini{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0 13px}.vaultMini span{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border:1px solid rgba(120,255,95,.1);border-radius:8px;background:#000;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:rgba(205,222,200,.48)}.vaultMini b{color:rgba(255,179,80,.72)}.vaultMini b.ok{color:#9cff83;text-shadow:0 0 8px rgba(110,255,90,.25)}
@media(max-width:440px){.bottomNav.vaultDeck{grid-template-columns:104px repeat(2,minmax(0,1fr))!important}.vaultDeckStatus{padding-left:10px}.vaultDeckStatus b{font-size:8px}.bottomNav.vaultDeck .navBtn{font-size:9px!important;letter-spacing:.08em!important}}
`;
document.head.appendChild(s)
})();