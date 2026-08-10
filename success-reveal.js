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

(()=>{
'use strict';
const NOTE_KEY='goshaNoteV21',LEGACY_NOTE_KEY='goshaNote',CURRENT_BACKUP='goshaPreDemoBackup',LEGACY_BACKUPS=['goshaPreDemoBackupV35'],UNDO_KEY='goshaRecoveryUndo';
const demoPrefix='Pineapple OG 383/2030';
function toast(text){const t=document.querySelector('#toast');if(!t)return;t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}
function get(key){try{return localStorage.getItem(key)}catch(_){return null}}
function put(key,value){try{localStorage.setItem(key,value)}catch(_){}}
function usable(value){return typeof value==='string'&&value.trim().length>0}
function candidates(){const out=[];for(const key of [...LEGACY_BACKUPS,CURRENT_BACKUP]){const value=get(key);if(usable(value)&&!out.some(x=>x.value===value))out.push({key,value})}return out}
function saveNotebook(value){const note=document.querySelector('#note');if(!note)return;put(UNDO_KEY,note.value);note.value=value;put(NOTE_KEY,value);put(LEGACY_NOTE_KEY,value);note.dispatchEvent(new Event('input',{bubbles:true}));const status=document.querySelector('#saveStatus');if(status)status.textContent='LOCAL · SAVED'}
function recoverBest(){const all=candidates();if(!all.length){toast('No old local backup found');return}const current=document.querySelector('#note')?.value||'';const best=all.find(x=>x.key==='goshaPreDemoBackupV35'&&x.value!==current)||all.find(x=>!x.value.startsWith(demoPrefix)&&x.value!==current)||all.find(x=>x.value!==current)||all[0];saveNotebook(best.value);if(get(CURRENT_BACKUP)===null)put(CURRENT_BACKUP,best.value);toast('Old notebook recovered')}
function importText(value){if(!usable(value)){toast('Backup file is empty');return}saveNotebook(value);toast('Notebook imported')}
function setup(){const grid=document.querySelector('#settingsView .settingsGrid');if(!grid||document.querySelector('#goshaRecoveryCard'))return false;const card=document.createElement('div');card.className='setting';card.id='goshaRecoveryCard';card.innerHTML='<h3>Recovery</h3><p>Recover older pre-demo data or load a saved notebook file. Your current notebook is kept as an undo copy first.</p><button class="btn" id="goshaRecoverOld" type="button">Recover old notebook</button><button class="btn" id="goshaImportBtn" type="button" style="margin-top:10px">Import notebook file</button><button class="btn" id="goshaUndoRecovery" type="button" style="margin-top:10px">Undo last recovery</button><input id="goshaImportFile" type="file" accept="text/plain,.txt,.json" style="display:none">';grid.appendChild(card);const recover=card.querySelector('#goshaRecoverOld'),input=card.querySelector('#goshaImportFile'),undo=card.querySelector('#goshaUndoRecovery');recover.style.display=candidates().length?'':'none';undo.style.display=get(UNDO_KEY)!==null?'':'none';recover.onclick=()=>{recoverBest();undo.style.display=get(UNDO_KEY)!==null?'':'none'};card.querySelector('#goshaImportBtn').onclick=()=>input.click();input.onchange=()=>{const f=input.files&&input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{importText(String(r.result||''));undo.style.display=get(UNDO_KEY)!==null?'':'none'};r.onerror=()=>toast('Could not read backup file');r.readAsText(f)};undo.onclick=()=>{const old=get(UNDO_KEY);if(old===null)return;const note=document.querySelector('#note');if(!note)return;const now=note.value;note.value=old;put(NOTE_KEY,old);put(LEGACY_NOTE_KEY,old);put(UNDO_KEY,now);note.dispatchEvent(new Event('input',{bubbles:true}));toast('Recovery undone')};return true}
function boot(){if(setup())return;let tries=0;const id=setInterval(()=>{tries++;if(setup()||tries>20)clearInterval(id)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();