(()=>{
'use strict';
if(!(window.AndroidBiometric&&typeof window.AndroidBiometric.authenticate==='function'))return;
document.documentElement.classList.add('nativeAuthDirect');
const style=document.createElement('style');style.textContent=`
html.nativeAuthDirect .app:not(.revealed) .hero:before,html.nativeAuthDirect .app:not(.revealed) .hero:after{opacity:0!important;animation:none!important;filter:none!important;background-image:none!important}
html.nativeAuthDirect .app:not(.revealed) .hero{background:#000!important}
`;
document.head.appendChild(style);
function arm(){const hero=document.querySelector('.hero'),bio=document.querySelector('#bioStage');if(!hero||!bio)return false;
 for(let i=0;i<3;i++){try{hero.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}))}catch(_){hero.dispatchEvent(new Event('pointerdown',{bubbles:true}))}}
 document.body.classList.add('bio-pending');bio.classList.add('show');return true}
function start(){let tries=0;const go=()=>{if(!arm()&&tries++<30)setTimeout(go,30)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
