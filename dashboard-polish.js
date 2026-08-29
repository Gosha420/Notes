(()=>{
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(Math.round((Number(n)+Number.EPSILON)*100)/100);
const money=n=>'€'+fmt(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));

function installStyle(){
 if($('#gosha-polish-style'))return;
 const s=document.createElement('style');s.id='gosha-polish-style';s.textContent=`
#goshaDashboard{border-color:rgba(134,255,40,.26)!important;background:linear-gradient(180deg,rgba(5,11,6,.99),rgba(0,0,0,.998))!important;box-shadow:0 28px 80px rgba(0,0,0,.52),inset 0 1px 0 rgba(214,255,198,.055),inset 0 0 90px rgba(76,255,60,.014)!important}
.dashHead{padding:17px 18px!important;background:linear-gradient(180deg,rgba(134,255,40,.03),transparent)!important}.dashHead .dashTitle{color:#e3efdf!important;text-shadow:0 0 20px rgba(134,255,40,.11)}
.dashControls{padding:12px!important;background:linear-gradient(180deg,rgba(4,8,4,.97),rgba(0,0,0,.97))!important}.dashArrow,.dashDaySelect,.dashScope{border-color:rgba(134,255,40,.2)!important;background:linear-gradient(180deg,rgba(134,255,40,.032),rgba(255,255,255,.007))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important}.dashArrow:hover,.dashDaySelect:hover,.dashScope:hover{border-color:rgba(134,255,40,.36)!important}
.dashStats{gap:9px!important;padding:11px!important;background:transparent!important}.dashStat{border:1px solid rgba(134,255,40,.115)!important;border-radius:15px!important;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.95))!important;padding:16px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important}.dashStat small{color:rgba(150,171,145,.74)!important}.dashStat strong{font-size:20px!important;letter-spacing:-.025em}.dashStat.primary,.dashStat.leftEarn{border-color:rgba(134,255,40,.23)!important}.dashStat.primary strong,.dashStat.leftEarn strong{color:#d0ffbf!important;text-shadow:0 0 20px rgba(134,255,40,.12)}
.dashProduct{border-color:rgba(134,255,40,.145)!important;border-radius:16px!important;background:linear-gradient(145deg,rgba(134,255,40,.022),rgba(255,255,255,.009) 45%,rgba(0,0,0,.22))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important}.dashProductHead b{font-size:12.5px!important}.dashRow{padding:6px 0!important;border-bottom:1px solid rgba(134,255,40,.04)}.dashRow:last-of-type{border-bottom:0}.dashRow.leftEarnRow strong{color:#d0ffbf!important;text-shadow:0 0 12px rgba(134,255,40,.08)}
#allStrainsDash{border-color:rgba(134,255,40,.3)!important;border-radius:21px!important;background:radial-gradient(circle at 12% 0%,rgba(134,255,40,.065),transparent 36%),linear-gradient(180deg,rgba(4,9,4,.99),rgba(0,0,0,.997))!important;box-shadow:inset 0 1px 0 rgba(220,255,210,.055),0 20px 52px rgba(0,0,0,.3)!important}.allHead{padding:14px 15px!important;background:rgba(134,255,40,.018)}.allGrid{gap:9px!important;padding:11px!important;background:transparent!important}.allMetric{border:1px solid rgba(134,255,40,.11)!important;border-radius:13px!important;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.96))!important;padding:14px!important}.allMetric.primary,.allMetric.leftEarn{border-color:rgba(134,255,40,.23)!important}.allMetric.primary strong,.allMetric.leftEarn strong{color:#d0ffbf!important;text-shadow:0 0 18px rgba(134,255,40,.11)}.allMix{border-top:1px solid rgba(134,255,40,.085);padding-top:13px!important}
@media(max-width:620px){.dashStats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.dashStat strong{font-size:18px!important}.allGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;document.head.appendChild(s)
}

function parseLedger(text){
 const lines=String(text||'').split(/\r?\n/),products=[];let current=null;
 const pairRe=/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
 for(const line of lines){
  const t=line.trim();if(!t)continue;
  const h=t.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if(h&&/[A-Za-zÀ-ž]/.test(h[1])){current={name:h[1].trim(),acquired:+h[2],spent:+h[3],sold:0,earned:0,smoked:0};products.push(current);continue}
  if(!current)continue;
  const used=t.match(/^(?:smoked|used)\s*:?\s*(\d+(?:\.\d+)?)/i);if(used){current.smoked=+used[1];continue}
  if(/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left)\s*:/i.test(t))continue;
  for(const m of line.matchAll(pairRe)){current.sold+=+m[1];current.earned+=+m[2]}
 }
 for(const p of products){const calculated=Math.max(0,p.acquired-p.sold-p.smoked);p.left=window.GoshaInventoryCorrection?.get?.(p.name,calculated)??calculated;p.avg=p.sold>0?p.earned/p.sold:0;p.leftToEarn=p.left*p.avg}
 return products
}
function ensureMain(){const stats=$('.dashStats');if(!stats)return null;let box=$('#dashLeftToEarn');if(!box){const wrap=document.createElement('div');wrap.className='dashStat leftEarn';wrap.innerHTML='<small>LEFT TO EARN</small><strong id="dashLeftToEarn">€0</strong>';stats.appendChild(wrap);box=$('#dashLeftToEarn')}return box}
function ensureAll(){const grid=$('#allStrainsDash .allGrid');if(!grid)return null;let box=$('#allLeftToEarn');if(!box){const wrap=document.createElement('div');wrap.className='allMetric leftEarn';wrap.innerHTML='<small>LEFT TO EARN</small><strong id="allLeftToEarn">€0</strong>';grid.appendChild(wrap);box=$('#allLeftToEarn')}return box}
function addCardValue(card,value){let r=card.querySelector('.leftEarnRow');if(!r){r=document.createElement('div');r.className='dashRow leftEarnRow';r.innerHTML='<span>LEFT TO EARN</span><strong>€0</strong>';const meter=card.querySelector('.dashMeter');card.insertBefore(r,meter||null)}r.querySelector('strong').textContent=money(value)}
function render(){
 installStyle();const note=$('#note');if(!note)return;
 const ledger=parseLedger(note.value),byName=new Map(ledger.map(p=>[p.name,p]));
 const total=ledger.reduce((a,p)=>a+p.leftToEarn,0);
 const main=ensureMain();if(main)main.textContent=money(total);
 const all=ensureAll();if(all)all.textContent=money(total);
 for(const card of document.querySelectorAll('#dashProducts .dashProduct')){const name=card.querySelector('.dashProductHead b')?.textContent?.trim()||'';addCardValue(card,byName.get(name)?.leftToEarn||0)}
 const mix=$('#allShareRows');if(mix&&ledger.length){for(const row of mix.querySelectorAll('.allShare')){const name=row.querySelector('b')?.textContent?.trim()||'';const p=byName.get(name);if(p)row.title='Remaining '+fmt(p.left)+' · Left to earn '+money(p.leftToEarn)}}
}
function schedule(){setTimeout(render,0)}
function boot(){let tries=0;const go=()=>{if(!$('#goshaDashboard')||!$('#note')){if(tries++<60)setTimeout(go,100);return}render();$('#note').addEventListener('input',schedule,{passive:true});$('#note').addEventListener('change',schedule);$('#goshaDashboard').addEventListener('click',schedule);window.addEventListener('gosha-inventory-correction',schedule)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
