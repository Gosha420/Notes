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
function toast(msg){
 const el=$('#toast'); if(!el)return;
 el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1300);
}
function persist(note){
 localStorage.setItem(NOTE_KEY,note.value);
 const status=$('#saveStatus');if(status)status.textContent='LOCAL · SAVED';
 note.dispatchEvent(new Event('input',{bubbles:true}));
}
function calculateIntoNotebook(){
 const note=$('#note');if(!note)return;
 const lines=note.value.split(/\r?\n/);
 const header=/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/;
 const blocks=[];
 for(let i=0;i<lines.length;i++){
   const h=lines[i].trim().match(header);
   if(h&&/[A-Za-zÀ-ž]/.test(h[1])) blocks.push({start:i,end:lines.length,acquired:+h[2]});
 }
 for(let i=0;i<blocks.length-1;i++)blocks[i].end=blocks[i+1].start;
 if(!blocks.length){toast('Add a product heading first');return;}
 const out=[...lines];
 for(let b=blocks.length-1;b>=0;b--){
   const block=blocks[b];
   const body=out.slice(block.start+1,block.end);
   let sold=0,earned=0,smoked=0,smokedLine=null;
   for(const line of body){
     const t=line.trim();
     const used=t.match(/^(?:smoked|used)\s*:?\s*(\d+(?:\.\d+)?)/i);
     if(used){smoked=+used[1];if(smokedLine===null)smokedLine=line;continue;}
     if(answerRow(line))continue;
     const tx=pairs(line);
     sold+=tx.reduce((a,x)=>a+x.qty,0);
     earned+=tx.reduce((a,x)=>a+x.price,0);
   }
   const left=Math.max(0,block.acquired-sold-smoked);
   const cleaned=body.filter(line=>!answerRow(line));
   while(cleaned.length&&cleaned[cleaned.length-1].trim()==='')cleaned.pop();
   const answers=[`Total: €${fmt(earned)}`,`Total sold: ${fmt(sold)}`,`Left: ${fmt(left)}`,smokedLine??`Smoked: ${fmt(smoked)}`];
   const replacement=[out[block.start],...cleaned,...answers];
   out.splice(block.start,block.end-block.start,...replacement);
 }
 note.value=out.join('\n');
 persist(note);toast('Calculated');
}
function installUI(){
 const note=$('#note');if(!note)return;
 if(!localStorage.getItem(NOTE_KEY)&&!localStorage.getItem('goshaNote')) note.value=demoV24;
 const oldDemo=$('#demoBtn');
 if(oldDemo){
   oldDemo.remove();
   const grid=$('#settingsView .settingsGrid');
   if(grid){
     const card=document.createElement('div');card.className='setting';
     card.innerHTML='<h3>Demo data</h3><p>Load the Pineapple OG + Blue Dream example notebook.</p><button class="btn" id="demoBtnV24">Load demo</button>';
     grid.appendChild(card);
     $('#demoBtnV24').onclick=()=>{if(confirm('Replace the current notebook with demo data?')){note.value=demoV24;persist(note);toast('Demo loaded');}};
   }
 }
 const head=note.closest('.panel')?.querySelector('.panelHead');
 if(head&&!$('#calcBtn')){
   const calc=document.createElement('button');calc.className='btn primary';calc.id='calcBtn';calc.textContent='Calc';calc.onclick=calculateIntoNotebook;head.appendChild(calc);
 }
 note.placeholder='Example:\nPineapple OG 500/300\n5/60 4.5/50\nSmoked: 12';
 note.dispatchEvent(new Event('input',{bubbles:true}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUI,{once:true});else installUI();
})();