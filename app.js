const photo=document.querySelector('#photo'), preview=document.querySelector('#preview'), analyze=document.querySelector('#analyze');
const result=document.querySelector('#result'), status=document.querySelector('#status'), key=document.querySelector('#key');
key.value=localStorage.getItem('foodfit_key')||'';
key.addEventListener('input',()=>localStorage.setItem('foodfit_key',key.value.trim()));

let imageData='';
photo.addEventListener('change',()=>{
 const f=photo.files?.[0]; if(!f)return;
 const r=new FileReader(); r.onload=()=>{imageData=r.result;preview.src=imageData;preview.classList.remove('hidden');analyze.classList.remove('hidden');result.classList.add('hidden')}; r.readAsDataURL(f);
});
analyze.addEventListener('click',async()=>{
 const apiKey=key.value.trim();
 if(!apiKey){status.textContent='Please add your OpenAI API key first.';status.className='error';return}
 analyze.disabled=true;analyze.textContent='Analyzing…';status.textContent='AI is checking your food photo…';status.className='muted';
 try{
  const prompt=`You are a nutrition estimation assistant for a 26-year-old person, 5'5", 80+ kg, low activity, trying to reduce body fat. Analyze this food photo. Identify visible foods and estimate calories, protein, carbs and fat. Consider common Bangladeshi foods. Estimates are approximate because a photo cannot know exact grams/oil. Judge the visible portion for a fat-loss meal. Return ONLY JSON: {"summary":"...","calories":number,"protein":number,"carbs":number,"fat":number,"portion":"Low|Okay|High","advice":"..."}.`;
  const resp=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({
   model:'gpt-4.1-mini',
   input:[{role:'system',content:[{type:'input_text',text:prompt}]},{role:'user',content:[{type:'input_text',text:'Analyze this food photo.'},{type:'input_image',image_url:imageData}]}]
  })});
  if(!resp.ok) throw new Error(await resp.text());
  const data=await resp.json();
  const text=(data.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').join('').replace(/```json|```/g,'').trim();
  const d=JSON.parse(text);
  document.querySelector('#summary').innerHTML='<h3>'+esc(d.summary)+'</h3>';
  document.querySelector('#cal').textContent=d.calories+' kcal';
  document.querySelector('#protein').textContent=d.protein+' g';
  document.querySelector('#carbs').textContent=d.carbs+' g';
  document.querySelector('#fat').textContent=d.fat+' g';
  document.querySelector('#portion').textContent=d.portion;
  document.querySelector('#advice').textContent=d.advice;
  result.classList.remove('hidden'); status.textContent='Done. Remember: photo estimates are approximate.';status.className='ok';
 }catch(e){status.textContent='Could not analyze: '+(e.message||e);status.className='error'}
 analyze.disabled=false;analyze.textContent='Analyze Food';
});
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
