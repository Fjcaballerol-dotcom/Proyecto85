(()=>{
"use strict";
const D=window.P85_DATA;
const VERSION='7.0.0';
const localISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parse=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d,12)};
const add=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return localISO(d)};
const monday=(s=localISO(new Date()))=>{const d=parse(s),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return localISO(d)};
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=hash(seed)||1234567;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function shuffle(a,seed){const r=rng(seed),x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
const aliases=ex=>new Set([ex.id,...(ex.aliases||[])]);
const sessionExerciseId=x=>x.exerciseId||x.id;
function historyFor(state,ex){const ids=aliases(ex),rows=[];(state.sessions||[]).forEach(s=>(s.exercises||[]).forEach(e=>{if(ids.has(sessionExerciseId(e)))rows.push({...e,date:s.date,sessionId:s.id})}));return rows.sort((a,b)=>b.date.localeCompare(a.date))}
function lastCompletedSets(state,ex){for(const e of historyFor(state,ex)){const sets=(e.sets||[]).filter(s=>s.done!==false&&(+s.reps||0)>0);if(sets.length)return {date:e.date,sets:sets.map(s=>({weight:+s.weight||0,reps:+s.reps||0}))}}return null}
function reference(state,ex){const last=lastCompletedSets(state,ex);if(last){const weights=last.sets.map(s=>s.weight),reps=last.sets.map(s=>s.reps);return {weight:weights[0],reps:`${Math.min(...reps)}–${Math.max(...reps)}`,date:last.date,source:'historial',sets:last.sets}}for(const e of historyFor(state,ex)){if(e.summary){const nums=String(e.summary).match(/-?\d+(?:[.,]\d+)?/g)||[];if(nums.length>=2)return {weight:+nums[nums.length-1].replace(',','.'),reps:String(nums[1]),date:e.date,source:'historial',sets:[]}}}return {weight:null,reps:ex.reps,date:null,source:'sin referencia',sets:[]}}
function progressionHint(state,ex){const h=historyFor(state,ex).slice(0,3);if(!h.length)return 'Primera referencia: prioriza técnica y comodidad.';const last=reference(state,ex);const recentComplete=h.filter(e=>(e.sets||[]).length&&(e.sets||[]).every(s=>s.done!==false));if(recentComplete.length>=2)return `Referencia consolidada: mantén ${last.weight??'la carga'} y, si todo se siente cómodo, puedes añadir alguna repetición dentro del rango.`;return 'Mantén la referencia y ajusta según técnica y sensaciones; no es obligatorio progresar hoy.'}
function allowed(state,ex){if(state.gym?.available?.[ex.equipment]===false)return false;const until=state.prefs?.avoidUntil?.[ex.id];if(until&&until>=localISO(new Date()))return false;const blocked=(state.gym?.temporaryUnavailable||[]).find(x=>x.equipment===ex.equipment&&x.date===localISO(new Date()));if(blocked)return false;return true}
function exerciseUseCounts(state,weeks=3){const cutoff=add(monday(),-7*weeks),m=new Map();for(const [wk,p] of Object.entries(state.trainingPlans||{})){if(wk<cutoff)continue;for(const d of p.days||[])for(const e of d.exercises||[])m.set(e.id,(m.get(e.id)||0)+1)}for(const s of state.sessions||[]){if(s.date<cutoff)continue;for(const e of s.exercises||[])m.set(sessionExerciseId(e),(m.get(sessionExerciseId(e))||0)+1)}return m}
function pick(pool,state,used,seed,preferred=null){let candidates=pool.filter(x=>allowed(state,x)&&!used.has(x.id));if(!candidates.length)candidates=pool.filter(x=>allowed(state,x));if(!candidates.length)return null;const counts=exerciseUseCounts(state,3);const ordered=shuffle(candidates,seed).sort((a,b)=>(counts.get(a.id)||0)-(counts.get(b.id)||0));if(preferred&&ordered.some(x=>x.id===preferred.id)&&rng(seed+'keep')()<.50)return preferred;return ordered[0]}
function poolBy(predicate){return D.EXERCISES.filter(predicate)}
function slotPools(){return {
 knee:poolBy(x=>x.pattern==='Piernas'&&x.family==='rodilla'),
 posterior:poolBy(x=>x.pattern==='Piernas'&&x.family==='posterior'),
 cadera:poolBy(x=>x.pattern==='Piernas'&&x.family==='cadera'),
 gemelo:poolBy(x=>x.pattern==='Piernas'&&x.family==='gemelo'),
 backV:poolBy(x=>x.pattern==='Espalda'&&x.family==='vertical'),
 backH:poolBy(x=>x.pattern==='Espalda'&&['horizontal','postural'].includes(x.family)),
 chest:poolBy(x=>x.pattern==='Pecho'),
 shoulder:poolBy(x=>x.pattern==='Hombros'),
 biceps:poolBy(x=>x.pattern==='Bíceps'),
 triceps:poolBy(x=>x.pattern==='Tríceps'),
 core:poolBy(x=>x.pattern==='Core'),
 trap:poolBy(x=>x.pattern==='Trapecio'),
 forearm:poolBy(x=>x.pattern==='Antebrazos'),
 rear:poolBy(x=>x.pattern==='Hombros'&&x.family==='posterior'),
 lowback:poolBy(x=>x.pattern==='Core'&&x.family==='extension')
}}
function buildTrainingWeek(state,week=monday(),force=false){
 const existing=state.trainingPlans?.[week];if(!force&&existing?.engineVersion===VERSION)return existing;
 const prev=state.trainingPlans?.[add(week,-7)],pools=slotPools();
 const names=['Full Body A','Full Body B','Full Body C','Full Body D','Full Body E'];
 const focuses=['Piernas + empuje','Espalda alta + posterior','Equilibrio + técnica','Pecho + piernas','Completa + accesorios'];
 const days=[];
 const lower2=['posterior','cadera','posterior','cadera','posterior'];
 const accessory=['trap','forearm','gemelo','rear','lowback'];
 for(let i=0;i<5;i++){
  const slots=['knee',lower2[i],'backV','backH','chest','shoulder','biceps','triceps','core',accessory[i]];
  const used=new Set(),sel=[];
  const prevDay=prev?.days?.[i];
  slots.forEach((slot,si)=>{
   const pool=pools[slot]; const prior=prevDay?.exercises?.[si];
   const priorObj=prior&&D.EXERCISES.find(x=>x.id===prior.id)&&pool.some(x=>x.id===prior.id)?D.EXERCISES.find(x=>x.id===prior.id):null;
   let x=pick(pool,state,used,`${week}-${i}-${slot}`,priorObj);
   if(x){used.add(x.id);sel.push({...x,reference:reference(state,x),progression:progressionHint(state,x),slot})}
  });
  // Ensure at least four changes from prior week's same day when alternatives exist.
  if(prevDay){let same=sel.filter((x,idx)=>prevDay.exercises?.[idx]?.id===x.id).length;for(let si=0;si<sel.length&&same>6;si++){if(prevDay.exercises?.[si]?.id!==sel[si].id)continue;const pool=pools[slots[si]].filter(x=>x.id!==sel[si].id&&allowed(state,x)&&!used.has(x.id));if(pool.length){const old=sel[si];used.delete(old.id);const repl=pick(pool,state,used,`${week}-${i}-${slots[si]}-force`);if(repl){used.add(repl.id);sel[si]={...repl,reference:reference(state,repl),progression:progressionHint(state,repl),slot:slots[si]};same--}}}}
  days.push({name:names[i],focus:focuses[i],exercises:sel,cardio:{mode:D.CARDIO[hash(week+i)%D.CARDIO.length],minutes:i===2?20:15},estimatedMinutes:52+i*2});
 }
 state.trainingPlans=state.trainingPlans||{};state.trainingPlans[week]={week,engineVersion:VERSION,generatedAt:new Date().toISOString(),days};return state.trainingPlans[week]
}
function exerciseAlternatives(state,currentId,reason='Variar'){const cur=D.EXERCISES.find(x=>x.id===currentId);if(!cur)return[];let pool=D.EXERCISES.filter(x=>x.id!==cur.id&&allowed(state,x));const sameFamily=pool.filter(x=>x.pattern===cur.pattern&&x.family===cur.family),samePattern=pool.filter(x=>x.pattern===cur.pattern);pool=[...sameFamily,...samePattern.filter(x=>!sameFamily.includes(x))];if(reason==='Máquina ocupada'||reason==='Máquina averiada')pool=pool.filter(x=>x.equipment!==cur.equipment);const counts=exerciseUseCounts(state,3);return pool.sort((a,b)=>((a.family===cur.family?0:100)+(counts.get(a.id)||0))-((b.family===cur.family?0:100)+(counts.get(b.id)||0))).slice(0,4)}
const zoneMap={
 Piernas:['Cuádriceps','Femoral','Glúteos'],Espalda:['Dorsales','Espalda alta','Espalda media'],Pecho:['Pecho'],Hombros:['Hombros'],Bíceps:['Bíceps'],Tríceps:['Tríceps'],Core:['Core'],Trapecio:['Trapecio'],Antebrazos:['Antebrazos']
};
function zonesFor(ex){let z=[...(zoneMap[ex.pattern]||[])];if(ex.family==='rodilla')z=['Cuádriceps'];if(ex.family==='posterior')z=['Femoral','Glúteos'];if(ex.family==='cadera')z=['Glúteos','Abductores/aductores'];if(ex.family==='gemelo')z=['Gemelos'];if(ex.family==='vertical')z=['Dorsales','Espalda alta'];if(ex.family==='horizontal')z=['Espalda media','Espalda alta'];if(ex.family==='postural')z=['Espalda alta','Deltoide posterior'];if(ex.family==='extension'&&ex.pattern==='Core')z=['Espalda baja','Core'];if(ex.pattern==='Hombros'&&ex.family==='posterior')z=['Deltoide posterior'];return z}
function muscleStatus(state){const now=localISO(new Date()),zones={};for(const s of state.sessions||[]){const age=Math.max(0,Math.round((parse(now)-parse(s.date))/86400000));if(age>7)continue;for(const er of s.exercises||[]){const ex=D.EXERCISES.find(x=>aliases(x).has(sessionExerciseId(er)));if(!ex)continue;const sets=(er.sets||[]).filter(x=>x.done!==false).length||1;for(const z of zonesFor(ex)){const cur=zones[z]||{sets:0,last:null};cur.sets+=sets*Math.max(.25,1-age*.12);if(!cur.last||s.date>cur.last)cur.last=s.date;zones[z]=cur}}}
 const all=['Cuádriceps','Femoral','Glúteos','Abductores/aductores','Gemelos','Dorsales','Espalda alta','Espalda media','Espalda baja','Trapecio','Hombros','Deltoide posterior','Pecho','Bíceps','Tríceps','Antebrazos','Core'];
 return all.map(z=>{const x=zones[z]||{sets:0,last:null};const level=x.sets>=9?'alta':x.sets>=4?'media':'disponible';return{zone:z,level,last:x.last,score:Math.round(x.sets)}})
}
function recovery(state,date=localISO(new Date())){const c=[...(state.checkins||[])].filter(x=>x.date===date).pop();if(!c)return{level:'unknown',label:'Haz tu check-in',message:'Dime cómo llegas hoy. La sesión se ajustará de verdad antes de empezar.',mode:'normal'};const mode=c.intent||'normal';if(+c.pain>=7||+c.energy<=2||+c.fatigue>=8)return{level:'recovery',label:'Recuperación',message:'Hoy priorizamos movimiento cómodo o descanso. Nada de progresión automática.',mode};if(+c.pain>=4||+c.energy<=4||+c.fatigue>=6||+c.bloating>=6||mode==='soft')return{level:'soft',label:'Día suave',message:'Mantendremos cuerpo completo, con menos volumen y sin obligación de progresar.',mode};if(mode==='short')return{level:'normal',label:'Poco tiempo',message:'Haremos una versión compacta manteniendo los patrones principales de cuerpo completo.',mode};if(mode==='vary')return{level:'normal',label:'Quiero variar',message:'Mantengo la estructura Full Body y aumento la rotación de ejercicios equivalentes.',mode};return{level:'normal',label:'Normal',message:'Sesión completa con tu historial como referencia. Técnica y sensaciones mandan.',mode}}
function sessionProfile(state){const r=recovery(state);if(r.level==='recovery')return{...r,mainSets:1,accessorySets:1,maxExercises:7,cardio:'Opcional y muy cómodo'};if(r.level==='soft')return{...r,mainSets:2,accessorySets:1,maxExercises:9,cardio:'10–15 min cómodo'};if(r.mode==='short')return{...r,mainSets:2,accessorySets:1,maxExercises:8,cardio:'10 min opcional'};return{...r,mainSets:3,accessorySets:2,maxExercises:10,cardio:null}}
function planMealIds(state){const ids=[];for(const p of Object.values(state.nutritionPlans||{}))for(const d of p.days||[])for(const t of ['breakfast','midmorning','lunch','snack','dinner'])if(d[t])ids.push(d[t]);for(const p of state.legacyPlans||[])for(const d of Object.values(p.days||{}))for(const t of ['breakfast','midmorning','lunch','snack','dinner'])if(d[t])ids.push(d[t]);return ids.slice(-350)}
function allRecipes(state){return[...D.RECIPES,...(state.customMeals||[])]}
function chooseRecipe(state,type,used,seed){const recent=planMealIds(state).slice(-140),fav=new Set(state.prefs?.favoriteMeals||[]),no=new Set(state.prefs?.noRepeatMeals||[]);let pool=allRecipes(state).filter(r=>r.type===type&&!state.prefs?.dislikedMeals?.includes(r.id)&&!no.has(r.id));if(!pool.length)pool=allRecipes(state).filter(r=>r.type===type&&!state.prefs?.dislikedMeals?.includes(r.id));if(!pool.length)return null;const score=id=>recent.filter(x=>x===id).length*5+used.filter(x=>x===id).length*8-(fav.has(id)?1:0);return shuffle(pool,seed).sort((a,b)=>score(a.id)-score(b.id))[0]}
function buildNutritionWeek(state,week=monday(),force=false){if(!force&&state.nutritionPlans?.[week]?.engineVersion===VERSION)return state.nutritionPlans[week];const days=[],used=[];for(let i=0;i<7;i++){const row={date:add(week,i)};for(const t of ['breakfast','midmorning','lunch','snack','dinner']){const r=chooseRecipe(state,t,used,`${week}-${i}-${t}`);row[t]=r?.id||null;if(r)used.push(r.id)}days.push(row)}state.nutritionPlans=state.nutritionPlans||{};state.nutritionPlans[week]={week,engineVersion:VERSION,generatedAt:new Date().toISOString(),days};return state.nutritionPlans[week]}
function alternatives(state,currentId,date,type,week){const cur=allRecipes(state).find(r=>r.id===currentId),plan=buildNutritionWeek(state,week),weekIds=plan.days.flatMap(d=>Object.values(d).filter(v=>typeof v==='string')),fav=new Set(state.prefs?.favoriteMeals||[]);return allRecipes(state).filter(r=>r.type===type&&r.id!==currentId&&!state.prefs?.dislikedMeals?.includes(r.id)&&!state.prefs?.noRepeatMeals?.includes(r.id)).map(r=>({r,score:weekIds.filter(x=>x===r.id).length*10+(cur?.protein===r.protein?1:0)-(fav.has(r.id)?1:0)})).sort((a,b)=>a.score-b.score).slice(0,4).map(x=>x.r)}
function nutritionBalance(state,week=monday()){const p=buildNutritionWeek(state,week),main=p.days.flatMap(d=>[d.lunch,d.dinner]).map(id=>allRecipes(state).find(r=>r.id===id)).filter(Boolean);const counts={};for(const r of main){const k=r.protein||r.cat||'Otro';counts[k]=(counts[k]||0)+1}return{distinct:new Set(main.map(r=>r.id)).size,total:main.length,counts}}
window.P85_ENGINE={VERSION,localISO,parse,add,monday,buildTrainingWeek,buildNutritionWeek,alternatives,reference,historyFor,lastCompletedSets,progressionHint,exerciseAlternatives,zonesFor,muscleStatus,recovery,sessionProfile,allRecipes,nutritionBalance};
})();
