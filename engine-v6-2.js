(()=>{
"use strict";
const D=window.P85_DATA;
const localISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12)};
const add=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return localISO(d)};
const monday=(s=localISO(new Date()))=>{const d=parse(s),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return localISO(d)};
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=hash(seed)||1234567;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function shuffle(a,seed){const r=rng(seed),x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function aliases(ex){return new Set([ex.id,...(ex.aliases||[])])}
function sessionExerciseId(x){return x.exerciseId||x.id}
function historyFor(state,ex){const ids=aliases(ex),rows=[];(state.sessions||[]).forEach(s=>(s.exercises||[]).forEach(e=>{if(ids.has(sessionExerciseId(e)))rows.push({...e,date:s.date})}));return rows.sort((a,b)=>b.date.localeCompare(a.date))}
function reference(state,ex){const h=historyFor(state,ex);for(const e of h){if(Array.isArray(e.sets)){const done=e.sets.filter(s=>s.done!==false&&Number.isFinite(+s.weight)&&+s.weight>=0);if(done.length){const weights=done.map(s=>+s.weight),reps=done.map(s=>+s.reps).filter(Number.isFinite);return {weight:weights[0],reps:reps.length?`${Math.min(...reps)}–${Math.max(...reps)}`:ex.reps,date:e.date,source:'historial'}}}if(e.summary){const nums=String(e.summary).match(/-?\d+(?:[.,]\d+)?/g)||[];if(nums.length>=2)return {weight:+nums[nums.length-1].replace(',','.'),reps:String(nums[1]),date:e.date,source:'historial'}}}return {weight:null,reps:ex.reps,date:null,source:'sin referencia'}}
function recentlyUsed(state,weeks=2){const cutoff=add(monday(),-7*weeks);const set=new Set();Object.entries(state.trainingPlans||{}).forEach(([wk,p])=>{if(wk>=cutoff)(p.days||[]).forEach(d=>(d.exercises||[]).forEach(e=>set.add(e.id)))});return set}
function allowed(state,ex){if(state.gym?.available?.[ex.equipment]===false)return false;const until=state.prefs?.avoidUntil?.[ex.id];if(until&&until>=localISO(new Date()))return false;return true}
function pick(pool,used,recent,seed){let p=pool.filter(x=>allowed(window.P85_STATE(),x)&&!used.has(x.id));if(!p.length)p=pool.filter(x=>allowed(window.P85_STATE(),x));if(!p.length)return null;const ranked=shuffle(p,seed).sort((a,b)=>(recent.has(a.id)?1:0)-(recent.has(b.id)?1:0));return ranked[0]}
function buildTrainingWeek(state,week=monday(),force=false){
 const existing=state.trainingPlans?.[week];
 if(!force&&existing?.engineVersion==='6.2.0')return existing;
 const recent=recentlyUsed(state,2);const days=[];
 const pools={
  knee:D.EXERCISES.filter(x=>x.pattern==='Piernas'&&x.family==='rodilla'),
  post:D.EXERCISES.filter(x=>x.pattern==='Piernas'&&['posterior','cadera','gemelo'].includes(x.family)),
  backV:D.EXERCISES.filter(x=>x.pattern==='Espalda'&&['vertical','postural'].includes(x.family)),
  backH:D.EXERCISES.filter(x=>x.pattern==='Espalda'&&x.family==='horizontal'),
  chest:D.EXERCISES.filter(x=>x.pattern==='Pecho'),shoulder:D.EXERCISES.filter(x=>x.pattern==='Hombros'),
  biceps:D.EXERCISES.filter(x=>x.pattern==='Bíceps'),triceps:D.EXERCISES.filter(x=>x.pattern==='Tríceps'),core:D.EXERCISES.filter(x=>x.pattern==='Core')
 };
 const names=['Full Body A','Full Body B','Full Body C','Full Body D','Full Body E'];
 const focus=['Pierna + empuje','Espalda + posterior','Equilibrio','Pierna + pecho','Completa'];
 for(let i=0;i<5;i++){
  const used=new Set(),sel=[];
  const addp=(pool,key)=>{const x=pick(pool,used,recent,`${week}-${i}-${key}`);if(x){used.add(x.id);sel.push({...x,reference:reference(state,x)})}};
  addp(i%2?pools.post:pools.knee,'legA');
  addp(i%2?pools.knee:pools.post,'legB');
  addp(pools.backV,'backV');
  addp(pools.backH,'backH');
  addp(pools.chest,'chest');addp(pools.shoulder,'shoulder');addp(pools.biceps,'biceps');addp(pools.triceps,'triceps');addp(pools.core,'core');
  days.push({name:names[i],focus:focus[i],exercises:sel,cardio:{mode:D.CARDIO[(hash(week+i)%D.CARDIO.length)],minutes:i===2?20:15}})
 }
 state.trainingPlans=state.trainingPlans||{};
 state.trainingPlans[week]={week,engineVersion:'6.2.0',generatedAt:new Date().toISOString(),days};
 return state.trainingPlans[week]
}
function planMealIds(state){const ids=[];for(const p of Object.values(state.nutritionPlans||{}))for(const d of (p.days||[]))for(const t of ['breakfast','midmorning','lunch','snack','dinner'])if(d[t])ids.push(d[t]);if(state.legacyPlans)for(const p of state.legacyPlans)for(const d of Object.values(p.days||{}))for(const t of ['breakfast','midmorning','lunch','snack','dinner'])if(d[t])ids.push(d[t]);return ids.slice(-250)}
function allRecipes(state){return [...D.RECIPES,...(state.customMeals||[])]}
function chooseRecipe(state,type,used,seed){const recent=planMealIds(state).slice(-90);let pool=allRecipes(state).filter(r=>r.type===type&&!state.prefs?.dislikedMeals?.includes(r.id));if(!pool.length)return null;const counts=id=>recent.filter(x=>x===id).length*4+used.filter(x=>x===id).length*6;return shuffle(pool,seed).sort((a,b)=>counts(a.id)-counts(b.id))[0]}
function buildNutritionWeek(state,week=monday(),force=false){if(!force&&state.nutritionPlans?.[week])return state.nutritionPlans[week];const days=[],used=[];for(let i=0;i<7;i++){const row={date:add(week,i)};for(const t of ['breakfast','midmorning','lunch','snack','dinner']){const r=chooseRecipe(state,t,used,`${week}-${i}-${t}`);row[t]=r?.id||null;if(r)used.push(r.id)}days.push(row)}state.nutritionPlans=state.nutritionPlans||{};state.nutritionPlans[week]={week,generatedAt:new Date().toISOString(),days};return state.nutritionPlans[week]}
function alternatives(state,currentId,day,type,week){const cur=allRecipes(state).find(r=>r.id===currentId);const plan=buildNutritionWeek(state,week);const weekIds=plan.days.flatMap(d=>Object.values(d).filter(v=>typeof v==='string'));return allRecipes(state).filter(r=>r.type===type&&r.id!==currentId&&!state.prefs.dislikedMeals.includes(r.id)).map(r=>({r,score:weekIds.filter(x=>x===r.id).length*10+(cur?.protein===r.protein?2:0)})).sort((a,b)=>a.score-b.score).slice(0,3).map(x=>x.r)}
function recovery(state,date=localISO(new Date())){const c=[...(state.checkins||[])].filter(x=>x.date===date).pop();if(!c)return {level:'unknown',label:'Haz tu check-in',message:'Cuéntame cómo llegas hoy y adaptaré la sesión.'};if(+c.pain>=7||+c.energy<=2||+c.fatigue>=8)return {level:'recovery',label:'Recuperación',message:'Hoy conviene una sesión muy suave o descanso. Nada de progresión automática.'};if(+c.pain>=4||+c.energy<=4||+c.fatigue>=6||+c.bloating>=6)return {level:'soft',label:'Día suave',message:'Mantén técnica y comodidad. Reduciremos volumen y no buscaremos progresión.'};return {level:'normal',label:'Normal',message:'Puedes seguir el plan manteniendo buena técnica y sensaciones cómodas.'}}
window.P85_ENGINE={allRecipes,localISO,parse,add,monday,buildTrainingWeek,buildNutritionWeek,alternatives,reference,recovery,historyFor};
})();