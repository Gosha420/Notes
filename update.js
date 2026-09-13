(()=>{
'use strict';
const $=s=>document.querySelector(s);
let manifest=null,heartbeatTimer=0,lastServerOk=0;
function toast(text){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function installedVersion(){try{if(window.AndroidUpdater&&typeof AndroidUpdater.getVersionCode==='function')return +AndroidUpdater.getVersionCode()||0}catch(_){}return window.AndroidBiometric?1:0}
function isAndroidApp(){return !!window.AndroidBiometric}
function installStyles(){if($('#goshaUpdateStyle'))return;const s=document.createElement('style');s.id='goshaUpdateStyle';s.textContent=`
.status.serverActive{color:rgba(190,255,170,.92)!important}.status.serverActive:before{color:#86ff28!important;text-shadow:0 0 9px rgba(134,255,40,.72)}.status.serverOffline{color:rgba(255,150,150,.75)!important}.status.serverOffline:before{color:#ff6060!important;text-shadow:none}.status.serverChecking{color:rgba(210,220,205,.48)!important}.status.serverChecking:before{color:#8b9588!important;text-shadow:none}
.navBtn[data-target="settings"]{overflow:visible!important}.settingsUpdateBadge{position:absolute;right:14px;top:9px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#86ff28;color:#061003;display:flex;align-items:center;justify-content:center;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 0 14px rgba(134,255,40,.45);z-index:6}.nativeUpdateCard{border-color:rgba(134,255,40,.28)!important;background:radial-gradient(circle at 8% 0%,rgba(134,255,40,.06),transparent 36%),rgba(255,255,255,.012)!important}.nativeUpdateCard h3{display:flex;align-items:center;gap:8px}.nativeUpdateCard h3:before{content:'●';font-size:9px;color:#86ff28;text-shadow:0 0 10px rgba(134,255,40,.7)}.updateMeta{display:flex;justify-content:space-between;gap:8px;margin:10px 0 13px;padding:9px 10px;border:1px solid rgba(134,255,40,.1);border-radius:10px;color:#71806d;font:650 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace}.updateMeta b{color:#cfe9c7}.updateAction{width:100%;border-color:rgba(134,255,40,.34)!important;color:#e9ffe3!important;background:rgba(134,255,40,.06)!important}.updateState{margin-top:9px;color:#667462;font:600 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace}.nativeUpdateCard.upToDate{opacity:.58}.nativeUpdateCard.upToDate .updateAction{display:none}
`;document.head.appendChild(s)}
function setServerState(state,detail=''){
 const e=$('#saveStatus');if(!e)return;
 e.classList.remove('serverActive','serverOffline','serverChecking');
 if(state==='active'){e.classList.add('serverActive');e.textContent='ACTIVE';e.title=detail||'Connected to update server';}
 else if(state==='offline'){e.classList.add('serverOffline');e.textContent='OFFLINE';e.title=detail||'Update server unreachable';}
 else{e.classList.add('serverChecking');e.textContent='CHECKING';e.title=detail||'Checking update server';}
}
function ensureBadge(show){const b=$('.navBtn[data-target="settings"]');if(!b)return;let x=$('#settingsUpdateBadge');if(show){if(!x){x=document.createElement('span');x.id='settingsUpdateBadge';x.className='settingsUpdateBadge';x.textContent='1';b.appendChild(x)}}else x?.remove()}
function ensureCard(){const grid=$('#settingsView .settingsGrid');if(!grid)return null;let c=$('#nativeUpdateCard');if(c)return c;c=document.createElement('div');c.id='nativeUpdateCard';c.className='setting nativeUpdateCard';c.innerHTML='<h3>Native app update</h3><p id="nativeUpdateText">Checking native build…</p><div class="updateMeta"><span>INSTALLED <b id="nativeInstalled">—</b></span><span>LATEST <b id="nativeLatest">—</b></span></div><button class="btn updateAction" id="nativeUpdateBtn" type="button">UPDATE APP</button><div class="updateState" id="nativeUpdateState"></div>';grid.prepend(c);$('#nativeUpdateBtn').onclick=startUpdate;return c}
function render(){if(!manifest||!isAndroidApp())return;installStyles();const card=ensureCard();if(!card)return;const installed=installedVersion(),latest=+manifest.requiredNativeVersion||0,needs=installed<latest;ensureBadge(needs);$('#nativeInstalled').textContent=installed?('v'+installed):'LEGACY';$('#nativeLatest').textContent='v'+latest;card.classList.toggle('upToDate',!needs);$('#nativeUpdateText').textContent=needs?(manifest.message||'A native update is required to enable all current app features.'):'Native Android shell is fully up to date.';$('#nativeUpdateState').textContent=needs?(window.AndroidUpdater?'One tap downloads the APK; Android will ask you to approve installation.':'One-time updater install required. This older APK cannot launch the installer itself yet.'):'No reinstall required.'}
async function startUpdate(){if(!manifest)return;const url=manifest.apkUrl;if(!url)return toast('Update URL unavailable');try{if(window.AndroidUpdater&&typeof AndroidUpdater.install==='function'){AndroidUpdater.install(url);$('#nativeUpdateState').textContent='Starting update…';return}}catch(_){}
try{await navigator.clipboard.writeText(url);toast('Update link copied — open it in Chrome');$('#nativeUpdateState').textContent='This legacy APK needs one final manual reinstall. The direct APK link was copied.'}catch(_){toast('Open the latest Android release in your browser')}}
window.goshaUpdateState=(state,message)=>{const e=$('#nativeUpdateState');if(e)e.textContent=message||state;if(state==='permission')toast('Allow installs, then tap Update again');if(state==='error')toast(message||'Update failed')};
async function check(){
 if(!navigator.onLine){setServerState('offline','Device reports no network connection');return false}
 setServerState(lastServerOk&&Date.now()-lastServerOk<60000?'active':'checking');
 try{
  const r=await fetch('./app-update.json?heartbeat='+Date.now(),{cache:'no-store',headers:{'cache-control':'no-cache'}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  manifest=await r.json();lastServerOk=Date.now();setServerState('active','Connected to update server · manifest received');render();return true;
 }catch(e){setServerState('offline','Update server unreachable'+(e?.message?' · '+e.message:''));return false}
}
function schedule(){clearInterval(heartbeatTimer);heartbeatTimer=setInterval(check,30000)}
function boot(){installStyles();setServerState('checking');let tries=0;const go=()=>{if(!$('#settingsView')||!$('.navBtn[data-target="settings"]')||!$('#saveStatus')){if(tries++<50)setTimeout(go,100);return}check();schedule();window.addEventListener('online',check);window.addEventListener('offline',()=>setServerState('offline','Device reports no network connection'));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()})};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
