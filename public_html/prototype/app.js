import {analyze,baseline,money} from './engine.js';
const initial={income:5400,extra:150,insurance:true,stage:0,failed:false,states:['To do','To do','To do']};
let data=structuredClone(initial), persistent=true;
try{const raw=JSON.parse(localStorage.getItem('ft360-demo.v1'));if(raw&&[5400,5600].includes(raw.income)&&Number.isFinite(raw.extra)&&raw.extra>=0&&raw.extra<=600&&Array.isArray(raw.states)&&raw.states.length===3){data={...initial,...raw};}}catch{persistent=false;}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], page=document.body.dataset.page;
function save(){try{localStorage.setItem('ft360-demo.v1',JSON.stringify(data));}catch{persistent=false;}render();}
function button(text){return $$('button').find(x=>x.textContent.trim()===text);}
function note(text){$$('[role=status]').forEach(x=>x.textContent=text);}
function press(text,fn){const b=button(text);if(b)b.addEventListener('click',fn);}
press('Reset demo',()=>{data=structuredClone(initial);save();note('Demo reset to the original sample.');});
press('$5,400 original',()=>{data.income=5400;save();});press('$5,600 correction',()=>{data.income=5600;save();});
press('Load sample paystub',()=>{data.stage=1;data.failed=false;save();});press('Simulate extraction',()=>{data.stage=2;save();});press('Try failure state',()=>{data.failed=true;save();});
press('Include sample',()=>{data.insurance=true;save();});press('Hide sample',()=>{data.insurance=false;save();});
const slider=$('input[type=range]');if(slider)slider.addEventListener('input',()=>{data.extra=Number(slider.value);save();});
$$('.action').forEach((action,i)=>action.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{data.states[i]=b.textContent.trim();save();note(`Action ${i+1}: ${data.states[i]}. Demo tracking only.`);})));
function render(){
 const r=analyze({...baseline,income:data.income},data.extra);
 $('#storage-status').textContent=persistent?'Demo choices saved in this browser only.':'Storage unavailable. Changes last only while this page is open.';
 if(page==='dashboard'){
 const cards=$$('.metrics>div');cards[0].querySelector('strong').textContent=money(data.income);cards[0].querySelector('small').textContent=data.income===5400?'Sample source':'Corrected sample';cards[1].querySelector('strong').textContent=money(r.cash);
 }
 if(page==='evidence'){
 $('.step strong').textContent=data.failed?'Sample extraction failed':['Not started','Sample loaded','Sample facts ready'][data.stage];
 button('Load sample paystub').disabled=data.stage!==0;button('Simulate extraction').disabled=data.stage!==1||data.failed;button('Try failure state').disabled=data.stage!==1||data.failed;
 let retry=button('Retry sample');if(data.failed&&!retry){retry=document.createElement('button');retry.textContent='Retry sample';retry.addEventListener('click',()=>{data.failed=false;data.stage=1;save();});$('.buttons').append(retry);}if(retry)retry.hidden=!data.failed;
 let status=$('#intake-notice');if(!status){status=document.createElement('p');status.id='intake-notice';status.setAttribute('role','status');$('.buttons').after(status);}status.textContent=data.failed?'Demo failure: no extraction ran. Retry returns the sample to loaded.':data.stage===2?'Simulated extraction complete. These fields were prewritten, not read by OCR or AI.':'';
 $('#correction-status').textContent=(data.income===5400?'Original sample value.':'Corrected sample value; original retained as $5,400.')+' Fictional choices only. The dashboard uses the selected value.';
 for(const n of [5400,5600])button(n===5400?'$5,400 original':'$5,600 correction').setAttribute('aria-pressed',String(data.income===n));
 }
 if(page==='plan'){
 slider.value=data.extra;slider.style.setProperty('--file-slider-fill',`${data.extra/6}%`);
 const label=slider.parentElement.querySelector('.file-slider-value')||slider.previousElementSibling?.lastElementChild;if(label)label.textContent=`${money(data.extra)} extra per month`;
 const cards=$$('.metrics>div');cards[1].querySelector('strong').textContent=`${money(300+data.extra)}/mo`;cards[1].querySelector('small').textContent=`${r.scenario.months} months · ${money(r.scenario.interest)} interest`;
 const values=$$('dd');values[0].textContent=`${r.base.months-r.scenario.months} fewer months; ${money(r.base.interest-r.scenario.interest)} less interest.`;values[1].textContent=`${money(r.afterExtra)} after listed costs and the scenario card payment.`;
 $$('.action').forEach((action,i)=>{action.hidden=i===2&&!data.insurance;action.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent.trim()===data.states[i])));});
 let hidden=$('#insurance-notice');if(!hidden){hidden=document.createElement('p');hidden.id='insurance-notice';$('.action').parentElement.append(hidden);}hidden.textContent=data.insurance?'':'Insurance action hidden. Turn it on in Engine & mission. Budget total stays unchanged because no expense was deleted.';
 }
 if(page==='about'){button('Include sample').setAttribute('aria-pressed',String(data.insurance));button('Hide sample').setAttribute('aria-pressed',String(!data.insurance));}
}
render();
