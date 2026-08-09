(()=>{
'use strict';
const $=s=>document.querySelector(s);
const NOTE_KEY='goshaNoteV21';
const demoV24=`Pineapple OG 383/2030
3/35 5/60 5/60 5/65 2/30 3/35 2/30 | 2/30 5/65 1/15 2/25 | 5/60 3/40 3/40 1/15 2/30 2/20 2/30
Smoked: 22


Blue Dream 200/1500
7/70 4/50 2/30 2/25 2/25 | 2/30 5/60 100/720 6/75 2/30 5/60 2/30 2/30 2/30
Smoked: 10`;
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(Math.round((n+Number.EPSILON)*100)/100);
const pairs=text=>[...text.matchAll(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g)].map(m=>({qty:+m[1],price:+m[2]}));
const answerRow=line=>/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left|Smoked)\s*:/i.test(line);
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1300)}
function persist(note){localStorage.setItem(NOTE_KEY,note.value);const status=$('#saveStatus');if(status)status.textContent='LOCAL · SAVED';note.dispatchEvent(new Event('input',{bubbles:true}))}
function calculateIntoNotebook(){
 const note=$('#note');if(!note)return;const lines=note.value.split(/\r?\n/);const header=/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/;const blocks=[];
 for(let i=0;i<lines.length;i++){const h=lines[i].trim().match(header);if(h&&/[A-Za-zÀ-ž]/.test(h[1]))blocks.push({start:i,end:lines.length,acquired:+h[2]})}
 for(let i=0;i<blocks.length-1;i++)blocks[i].end=blocks[i+1].start;if(!blocks.length){toast('Add a product heading first');return}const out=[...lines];
 for(let b=blocks.length-1;b>=0;b--){const block=blocks[b],body=out.slice(block.start+1,block.end);let sold=0,earned=0,smoked=0,smokedLine=null;
  for(const line of body){const used=line.trim().match(/^(?:smoked|used)\s*:?\s*(\d+(?:\.\d+)?)/i);if(used){smoked=+used[1];if(smokedLine===null)smokedLine=line;continue}if(answerRow(line))continue;const tx=pairs(line);sold+=tx.reduce((a,x)=>a+x.qty,0);earned+=tx.reduce((a,x)=>a+x.price,0)}
  const left=Math.max(0,block.acquired-sold-smoked),cleaned=body.filter(line=>!answerRow(line));while(cleaned.length&&cleaned[cleaned.length-1].trim()==='')cleaned.pop();const answers=[`Total: €${fmt(earned)}`,`Total sold: ${fmt(sold)}`,`Left: ${fmt(left)}`,smokedLine??`Smoked: ${fmt(smoked)}`],gap=b<blocks.length-1?['','']:[];out.splice(block.start,block.end-block.start,out[block.start],...cleaned,...answers,...gap)}
 note.value=out.join('\n');persist(note);toast('Calculated')
}
function installLaunchPolish(){
 const style=document.createElement('style');style.id='gosha-v28-polish';style.textContent=`
 html,body,.app{background:#000!important}
 .hero{isolation:isolate;background:#000!important;box-shadow:0 24px 80px rgba(69,255,35,.06);transition:height 1.18s cubic-bezier(.16,.84,.2,1),min-height 1.18s cubic-bezier(.16,.84,.2,1)!important}
 .hero:before{filter:saturate(1.13) contrast(1.08) brightness(.9)!important;animation:goshaBreath 2.25s cubic-bezier(.2,.7,.2,1) both;will-change:transform,filter,background-size,background-position!important}
 .hero:after{background:radial-gradient(circle at 50% 45%,rgba(119,255,42,.045),transparent 43%),linear-gradient(to bottom,rgba(0,0,0,.02) 45%,#000 98%)!important;transition:opacity .8s ease!important}
 .app.revealed .hero:before{filter:saturate(1.18) contrast(1.1) brightness(.97)!important;animation:none!important}
 @keyframes goshaBreath{0%{transform:scale(.965);filter:saturate(.92) contrast(1.02) brightness(.72)}55%{transform:scale(1.015);filter:saturate(1.12) contrast(1.07) brightness(.94)}100%{transform:scale(1.035);filter:saturate(1.16) contrast(1.09) brightness(.98)}}
 .bottomNav{opacity:0!important;transform:translateY(115%)!important;pointer-events:none!important;visibility:hidden!important}
 .app.revealed .bottomNav{opacity:1!important;transform:translateY(0)!important;pointer-events:auto!important;visibility:visible!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;left:12px!important;right:12px!important;width:auto!important;box-sizing:border-box!important;overflow:hidden!important;transition:opacity .34s ease .2s,transform .5s cubic-bezier(.16,.84,.2,1) .14s!important}
 .bottomNav button,.bottomNav .navBtn{min-width:0!important;width:100%!important;box-sizing:border-box!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
 .heroText,.topActions{transition-timing-function:cubic-bezier(.16,.84,.2,1)!important}
 @media(prefers-reduced-motion:reduce){.hero:before{animation:none!important}}
 `;document.head.appendChild(style)
}
function installUI(){installLaunchPolish();const note=$('#note');if(!note)return;if(!localStorage.getItem(NOTE_KEY)&&!localStorage.getItem('goshaNote'))note.value=demoV24;const oldDemo=$('#demoBtn');if(oldDemo){oldDemo.remove();const grid=$('#settingsView .settingsGrid');if(grid){const card=document.createElement('div');card.className='setting';card.innerHTML='<h3>Demo data</h3><p>Load the Pineapple OG + Blue Dream example notebook.</p><button class="btn" id="demoBtnV24">Load demo</button>';grid.appendChild(card);$('#demoBtnV24').onclick=()=>{if(confirm('Replace the current notebook with demo data?')){note.value=demoV24;persist(note);toast('Demo loaded')}}}}const head=note.closest('.panel')?.querySelector('.panelHead');if(head&&!$('#calcBtn')){const calc=document.createElement('button');calc.className='btn primary';calc.id='calcBtn';calc.textContent='Calc';calc.onclick=calculateIntoNotebook;head.appendChild(calc)}note.placeholder='Example:\nPineapple OG 500/300\n5/60 4.5/50\nSmoked: 12';note.dispatchEvent(new Event('input',{bubbles:true}))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUI,{once:true});else installUI();
})();