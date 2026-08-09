(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
#tapGateFail{background:#000!important}
#tapGateFail .fingerFallback{display:none;position:relative;font-size:min(72vw,460px);line-height:1;opacity:.78;filter:brightness(1.45) saturate(1.1) drop-shadow(0 0 28px rgba(255,199,70,.22));transform:scale(.94);animation:v31FingerIn .8s cubic-bezier(.16,.9,.18,1) forwards;user-select:none}
#tapGateFail.asset-failed .fingerFallback{display:block}
#tapGateFail.asset-failed .fingerArt{display:none!important}
#tapGateFail .fingerFallback:after{content:'✦';position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);font-size:.19em;color:#ffd96d;text-shadow:0 0 6px #fff,0 0 14px rgba(255,215,90,.9),0 0 26px rgba(82,255,100,.28)}
@keyframes v31FingerIn{from{opacity:0;transform:scale(.9)}to{opacity:.78;transform:scale(1)}}
`;
document.head.appendChild(style);
function wire(){
 const fail=document.querySelector('#tapGateFail'); if(!fail)return;
 let img=fail.querySelector('.fingerArt');
 if(!fail.querySelector('.fingerFallback')){
   const fb=document.createElement('div'); fb.className='fingerFallback'; fb.setAttribute('aria-hidden','true'); fb.textContent='🖕'; fail.appendChild(fb);
 }
 if(img){
   const bad=()=>fail.classList.add('asset-failed');
   img.addEventListener('error',bad,{once:true});
   if(img.complete && img.naturalWidth===0) bad();
   setTimeout(()=>{if(!img.complete||img.naturalWidth===0)bad()},1200);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,0),{once:true});else setTimeout(wire,0);
})();