
/* Proyecto85 Pro 4.2 — grouped upgrade, additive over 4.1 */
let EVOLUTION_NOTICE42=false,REST_END42=0,REST_HANDLE42=null;

/* Repair missing/old planner functions without changing storage keys */
function normalizePlan42(p,start){
 if(!p||typeof p!=="object")p={id:uid(),weekStart:start,days:{}};
 p.weekStart=p.weekStart||start;p.weekEnd=p.weekEnd||plusDays(p.weekStart,6);p.status=p.status||"draft";p.flexMealDay=p.flexMealDay||state().settings.flexMealDay;p.days=p.days||{};
 const used=[];
 DAYS.forEach((d,di)=>{p.days[d]=p.days[d]||{};Object.keys(MEALS).forEach((t,si)=>{
  let r=recipe(p.days[d][t]);if(!r||r.type!==t){r=chooseRecipeForWeek(t,used,null,di,start,si);if(r)p.days[d][t]=r.id}
  if(r)used.push(r.id);
 })});return p;
}
function getPlan(start){
 const s=state();let p=s.plans.find(x=>x.weekStart===start);
 if(!p)p=generatePlan(start);p=normalizePlan42(p,start);
 const i=s.plans.findIndex(x=>x.weekStart===start);if(i>=0)s.plans[i]=p;else s.plans.unshift(p);saveState(s);return p;
}
function confirmPlan(start){const s=state(),p=s.plans.find(x=>x.weekStart===start);if(!p)return;p.status="confirmed";buildShopping(p);saveState(s);render();toast("Semana confirmada y compra actualizada")}
function regeneratePlan(start){generatePlan(start);NUTRITION_TAB="plan";PLANNER_TAB=start===monday(1)?"next":"current";render();toast("Nueva propuesta creada")}
function chooseRecipe(type,used,current,dayIndex){return chooseRecipeForWeek(type,used,current,dayIndex,monday(0),Object.keys(MEALS).indexOf(type))}

/* Nutrition */
function groups42(r){
 const x=((r?.name||"")+" "+(r?.cat||"")+" "+(r?.protein||"")+" "+(r?.carb||"")).toLowerCase(),a=[];
 if(/garbanz|lentej|alub|legumbr/.test(x))a.push("Legumbres");
 if(/salm|merlu|bacala|atún|sepia|pesc|marisco|langost/.test(x))a.push("Pescado/marisco");
 if(/pollo|pavo|ternera|lomo|carne/.test(x))a.push("Carne/aves");
 if(/huevo|tortilla|revuelto/.test(x))a.push("Huevos");
 if(/verd|ensalad|pisto|tomate|pimiento|calabac|espinac|judía/.test(x))a.push("Verduras");
 if(/arroz|pasta|patata|cous|pan|wrap|cereal/.test(x))a.push("Cereales/tubérculos");
 return a.length?a:["Mixto"];
}
function profile42(r){
 const x=(r.name+" "+r.cat+" "+r.protein+" "+r.carb).toLowerCase();
 return `<div class="nutrition-chips"><span>Proteína: ${/pesc|pollo|pavo|ternera|lomo|atún|huevo|garbanz|lentej|alub|langost|sepia/.test(x)?"presente":"revisar conjunto"}</span><span>Fibra/vegetal: ${/verd|ensalad|garbanz|lentej|alub|integral|judía|espinac/.test(x)?"presente":"completar"}</span><span>${groups42(r).join(" · ")}</span></div>`;
}
function mealCard(type){
 const r=currentMeal(type),s=state(),done=!!s.mealDone[`${todayISO()}_${type}`],rating=s.ratings[r.id]||0;
 const icon={breakfast:"☕",snack1:"🍎",lunch:"🍽️",snack2:"🥛",dinner:"🌙"}[type]||"🍽️";
 return `<div class="meal-card ${done?"meal-complete":""}" data-meal-card="${type}"><div class="meal-visual">${icon}</div><div class="meal-head"><div><span class="eyebrow">${MEALS[type]}</span><h3>${esc(r.name)}</h3><div class="meta"><span>${esc(r.prep)}</span><span>${r.time} min</span><span>${esc(r.cat)}</span></div></div><button class="btn small" data-action="open-recipe" data-id="${r.id}">Ficha</button></div>${profile42(r)}<label class="meal-check"><input type="checkbox" data-action="meal-done" data-type="${type}" ${done?"checked":""}> Realizado</label><div class="btn-row"><button class="btn small primary" data-action="smart-meal" data-type="${type}">Cambiar opción</button></div><div class="rating compact">${[1,2,3,4,5].map(v=>`<button class="${rating===v*2?"active":""}" data-action="rate-recipe" data-id="${r.id}" data-value="${v*2}">${v}</button>`).join("")}</div></div>`;
}
function balance42(start=monday(1)){
 const p=getPlan(start),c={};DAYS.forEach(d=>["lunch","dinner"].forEach(t=>groups42(recipe(p.days[d][t])).forEach(g=>c[g]=(c[g]||0)+1)));
 let tip="Buena base de variedad. Ajusta platos según disponibilidad y preferencias.";
 if((c["Legumbres"]||0)<2)tip="La propuesta puede ganar variedad incorporando otra comida con legumbres.";
 else if((c["Pescado/marisco"]||0)<2)tip="Puedes alternar alguna proteína con pescado o marisco.";
 return `<div class="card"><span class="eyebrow">EQUILIBRIO SEMANAL</span><h3>Variedad de la planificación</h3><div class="balance-grid">${Object.entries(c).map(([g,n])=>`<div><span>${esc(g)}</span><b>${n}</b></div>`).join("")}</div><p class="muted">${esc(tip)}</p></div>`;
}
function nutritionToday42(){
 const done=Object.keys(MEALS).filter(t=>state().mealDone[`${todayISO()}_${t}`]).length,n=Object.keys(MEALS).length;
 return `<div class="card hero"><span class="eyebrow">OBJETIVO DE LA SEMANA</span><h2>Variedad, preparación y regularidad</h2><p>${done}/${n} momentos registrados hoy.</p><div class="progress-bar"><span style="width:${done/n*100}%"></span></div></div>${Object.keys(MEALS).map(mealCard).join("")}<div class="card learning"><span class="eyebrow">APRENDE CONMIGO</span><h3>Entiende el plato completo</h3><p>Las fichas destacan proteína, fibra y grupos de alimentos para aprender a combinar los platos sin centrar el día en contar calorías.</p></div>`;
}
function weekOrganizer42(){
 const p=getPlan(monday(1));
 return `<div class="card hero"><span class="eyebrow">ORGANIZA LA SEMANA</span><h2>${p.weekStart} → ${p.weekEnd}</h2><p>Revisa → ajusta → confirma → compra → prepara → entrena.</p></div>${balance42(p.weekStart)}<div class="card"><h3>Checklist para dejarla preparada</h3><ol class="checklist42"><li>Revisar comidas y cenas.</li><li>Cambiar platos antes de confirmar.</li><li>Confirmar para generar la compra.</li><li>Revisar despensa.</li><li>Preparar bases del inicio de semana y otro bloque a mitad de semana.</li><li>Revisar los cinco entrenamientos.</li></ol><div class="btn-row"><button class="btn primary" data-action="p85-plan-next">Revisar menú</button><button class="btn" data-action="p85-nut-tab" data-tab="shopping">Compra</button><button class="btn" data-action="p85-nut-tab" data-tab="prep">Preparación</button></div></div><div class="card"><span class="eyebrow">5 ENTRENAMIENTOS</span>${TRAINING_DAYS.map((d,i)=>`<div class="week-row"><span>Día ${i+1}</span><div><b>${esc(d.title)}</b><small>${d.ex.length} ejercicios · ${d.cardio.minutes} min cardio</small></div></div>`).join("")}</div>`;
}
function safeNutrition42(tab){
 try{return tab==="today"?nutritionToday42():tab==="plan"?nutritionPlanner():tab==="week"?weekOrganizer42():tab==="recipes"?nutritionLibrary():tab==="shopping"?shoppingMarkup():tab==="pantry"?pantryMarkup():preparationMarkup()}
 catch(e){console.error(e);return `<div class="error-card"><h3>Este apartado encontró un error</h3><p>Tus datos siguen guardados.</p><button class="btn primary" data-action="p85-nut-tab" data-tab="${esc(tab)}">Reintentar</button></div>`}
}
function renderNutrition(){
 const tabs=[["today","Hoy"],["plan","Plan"],["week","Organizar"],["recipes","Biblioteca"],["shopping","Compra"],["pantry","Despensa"],["prep","Preparación"]];
 return `<div class="card hero"><span class="eyebrow">NUTRICIÓN</span><h2>Planifica y prepara la semana</h2><p class="muted">Cada apartado carga de forma independiente para evitar bloqueos.</p></div><div class="tabs">${tabs.map(([id,l])=>`<button class="tab-btn ${NUTRITION_TAB===id?"active":""}" data-action="p85-nut-tab" data-tab="${id}">${l}</button>`).join("")}</div><section>${safeNutrition42(NUTRITION_TAB)}</section>`;
}
function openRecipe(id){
 const r=recipe(id);if(!r)return;openModal(r.name,`<div class="recipe-hero">🍽️</div><div class="meta"><span>${esc(r.prep)}</span><span>${r.time} min</span><span>${esc(r.cat)}</span></div>${profile42(r)}<h3>Ingredientes</h3><ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${esc(x[2])}</b> ${esc(x[0])}<small>${esc(x[3])}</small></li>`).join("")}</ul><h3>Preparación</h3><ol>${detailedSteps(r).map(x=>`<li>${esc(x)}</li>`).join("")}</ol><h3>Qué adelantar</h3><p>${esc(advanceAdvice(r))}</p><h3>Conservación</h3><p>${esc(r.storage)}</p>`);
}

/* Training */
function progression42(ex){
 const h=latestExerciseEntries(ex.id,3).filter(x=>x.sets.some(s=>s.done)),last=lastSetSummary(ex.id),target=parseInt(ex.reps)||10;
 if(!h.length)return {label:"INICIO",weight:ex.seed,why:"Primera referencia; ajusta a una ejecución cómoda y controlada."};
 const solid=h.filter(x=>x.sets.filter(s=>s.done).length>=2&&x.sets.filter(s=>s.done).every(s=>finite(s.reps)>=target)&&finite(x.effort,7)<=8).length;
 if(solid>=2)return {label:"PROGRESAR",weight:Math.round((last.weight+ex.inc)*10)/10,why:"Varias sesiones recientes consolidan las repeticiones con margen."};
 if(finite(last?.effort,7)>=9)return {label:"REVISAR",weight:last?.weight||ex.seed,why:"La última sesión fue exigente; prioriza técnica y control."};
 return {label:"MANTENER",weight:last?.weight||ex.seed,why:"Consolida el rango previsto antes de progresar."};
}
function note42(id){return state().exerciseNotes?.[id]||""}
function saveNote42(id,v){const s=state();s.exerciseNotes=s.exerciseNotes||{};s.exerciseNotes[id]=v;saveState(s)}
function openExercise(id){
 const ex=exercise(id);if(!ex)return;const h=latestExerciseEntries(id,8),p=progression42(ex),best=bestSet(id),vals=h.slice().reverse().map(x=>Math.max(0,...x.sets.filter(s=>s.done).map(s=>finite(s.weight))));
 openModal(ex.name,`<div class="exercise-hero">🏋️</div><div class="meta"><span>${esc(ex.group)}</span><span>${esc(ex.equipment)}</span><span>${ex.sets} × ${esc(ex.reps)}</span></div><div class="coach-mini"><b>${p.label}</b><span>${p.weight} kg</span><small>${esc(p.why)}</small></div><h3>Técnica</h3><p>${esc(ex.tech)}</p><p class="warning-lite">Movimiento controlado y rango cómodo. Si aparece dolor, detén el ejercicio.</p><h3>Nota para la próxima sesión</h3><textarea id="note42">${esc(note42(id))}</textarea><button class="btn small primary" data-action="p85-save-note" data-id="${id}">Guardar nota</button>${best?`<h3>Mejor registro</h3><p>${best.weight} kg × ${best.reps} · ${best.date}</p>`:""}<h3>Evolución reciente</h3><div class="chart mini">${svgLine(vals)}</div><h3>Historial</h3>${h.length?h.map(x=>`<p><b>${x.date}</b> · ${x.sets.filter(s=>s.done).map(s=>`${s.weight}×${s.reps}`).join(" · ")}</p>`).join(""):`<p class="muted">Sin historial todavía.</p>`}<h3>Alternativas</h3><div class="btn-row">${ex.alts.map(a=>exercise(a)).filter(Boolean).map(a=>`<button class="btn small" data-action="open-exercise" data-id="${a.id}">${esc(a.name)}</button>`).join("")}</div>`);
}
function muscleMap42(){
 const c={Pecho:0,Espalda:0,Hombros:0,Brazos:0,Piernas:0,Core:0};
 TRAINING_DAYS.forEach(d=>d.ex.map(exercise).filter(Boolean).forEach(ex=>{let g=ex.group.toLowerCase(),k=/pecho/.test(g)?"Pecho":/dorsal|espalda|trapecio/.test(g)?"Espalda":/hombro/.test(g)?"Hombros":/bíceps|tríceps|antebrazo/.test(g)?"Brazos":/core/.test(g)?"Core":/pierna|cuádriceps|isquio|glúteo|aductor|gemelo/.test(g)?"Piernas":null;if(k)c[k]++}));
 const on=k=>c[k]?"muscle-on":"";
 return `<div class="card"><span class="eyebrow">MAPA MUSCULAR</span><h2>Distribución semanal</h2><div class="bodymaps"><div class="bodymap"><b>Frontal</b><svg viewBox="0 0 180 330"><circle cx="90" cy="28" r="20"/><rect x="62" y="50" width="56" height="92" rx="24"/><rect class="${on("Pecho")}" x="69" y="61" width="42" height="34" rx="12"/><rect class="${on("Core")}" x="76" y="99" width="28" height="38" rx="10"/><rect class="${on("Brazos")}" x="35" y="60" width="20" height="105" rx="10"/><rect class="${on("Brazos")}" x="125" y="60" width="20" height="105" rx="10"/><rect class="${on("Piernas")}" x="62" y="145" width="25" height="150" rx="12"/><rect class="${on("Piernas")}" x="93" y="145" width="25" height="150" rx="12"/></svg></div><div class="bodymap"><b>Posterior</b><svg viewBox="0 0 180 330"><circle cx="90" cy="28" r="20"/><rect x="62" y="50" width="56" height="92" rx="24"/><rect class="${on("Espalda")}" x="69" y="58" width="42" height="58" rx="12"/><rect class="${on("Hombros")}" x="58" y="54" width="64" height="20" rx="10"/><rect class="${on("Brazos")}" x="35" y="60" width="20" height="105" rx="10"/><rect class="${on("Brazos")}" x="125" y="60" width="20" height="105" rx="10"/><rect class="${on("Piernas")}" x="62" y="145" width="25" height="150" rx="12"/><rect class="${on("Piernas")}" x="93" y="145" width="25" height="150" rx="12"/></svg></div></div><div class="balance-grid">${Object.entries(c).map(([k,n])=>`<div><span>${k}</span><b>${n}</b></div>`).join("")}</div></div>`;
}
function timer42(){
 const l=Math.max(0,Math.ceil((REST_END42-Date.now())/1000));
 return `<div id="timer42" class="rest-timer ${l?"active":""}"><span>Descanso</span><b>${l?Math.floor(l/60)+":"+String(l%60).padStart(2,"0"):"—"}</b><button class="btn small" data-action="p85-rest" data-sec="60">60 s</button><button class="btn small" data-action="p85-rest" data-sec="90">90 s</button></div>`;
}
function tick42(){clearInterval(REST_HANDLE42);REST_HANDLE42=setInterval(()=>{const e=$("#timer42");if(!e){clearInterval(REST_HANDLE42);return}const l=Math.max(0,Math.ceil((REST_END42-Date.now())/1000));e.querySelector("b").textContent=l?Math.floor(l/60)+":"+String(l%60).padStart(2,"0"):"Listo";if(!l)clearInterval(REST_HANDLE42)},500)}
function workoutSessionMarkup(){
 const d=state().workoutDraft;if(!d)return `<div class="card"><p>No hay entrenamiento activo.</p><button class="btn primary" data-action="start-workout" data-day="${trainingDayIndex()}">Empezar</button></div>`;
 return `<div class="card hero"><span class="eyebrow">MODO SESIÓN</span><h2>${esc(d.title)}</h2><p>Anterior → registra → descansa → continúa.</p>${timer42()}</div>${d.exercises.map((row,ei)=>{const ex=exercise(row.exerciseId),p=progression42(ex),last=lastSetSummary(ex.id);return `<div class="exercise-card"><div class="exercise-head"><div><span class="eyebrow">${esc(ex.group)}</span><h3>${esc(ex.name)}</h3><div class="meta"><span>${p.label}: ${p.weight} kg</span>${last?`<span>Anterior ${last.weight} kg · ${last.reps} rep</span>`:""}</div></div><button class="btn small" data-action="open-exercise" data-id="${ex.id}">Ficha</button></div>${note42(ex.id)?`<p class="exercise-note">📝 ${esc(note42(ex.id))}</p>`:""}${row.sets.map((s,si)=>`<div class="set-row"><div class="set-index">${si+1}</div><input type="number" step=".1" value="${s.weight}" data-action="draft-set" data-ex="${ei}" data-set="${si}" data-field="weight"><input type="number" value="${s.reps}" data-action="draft-set" data-ex="${ei}" data-set="${si}" data-field="reps"><div class="set-ok"><input type="checkbox" ${s.done?"checked":""} data-action="draft-set-done" data-ex="${ei}" data-set="${si}"></div></div>`).join("")}<div class="form-grid"><label>Esfuerzo 1–10<input type="number" min="1" max="10" value="${row.effort||7}" data-action="draft-effort" data-ex="${ei}"></label><label>Alternativa<select data-action="draft-alternative" data-ex="${ei}"><option value="">Mantener</option>${ex.alts.map(a=>exercise(a)).filter(Boolean).map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></label></div></div>`}).join("")}<div class="card"><span class="eyebrow">CARDIO</span><h3>${esc(d.cardio.mode)}</h3><div class="form-grid"><label>Minutos<input type="number" value="${d.cardio.minutes}" data-action="draft-field" data-path="cardio.minutes"></label><label>Intensidad 1–10<input type="number" value="${d.cardio.intensity}" data-action="draft-field" data-path="cardio.intensity"></label></div></div><div class="card"><span class="eyebrow">CIERRE</span><div class="form-grid"><label>Energía 1–10<input type="number" value="${d.sessionEnergy}" data-action="draft-field" data-path="sessionEnergy"></label><label>Dificultad 1–10<input type="number" value="${d.sessionDifficulty}" data-action="draft-field" data-path="sessionDifficulty"></label><label class="wide">Notas<textarea data-action="draft-field" data-path="notes">${esc(d.notes)}</textarea></label></div><button class="btn primary" data-action="finish-workout">Terminar y analizar</button></div>`;
}
function progress42(){
 const s=state(),last=s.trainingSessions[0];return `<div class="card hero"><span class="eyebrow">PROGRESO</span><h2>Tu historial contra ti mismo</h2><p class="muted">Sin rankings frente a otras personas.</p></div><div class="grid"><div class="stat"><span>Sesiones</span><b>${s.trainingSessions.length}</b></div><div class="stat"><span>Esta semana</span><b>${adherenceThisWeek().sessions}</b></div><div class="stat"><span>Última sesión</span><b>${last?last.completion+"%":"—"}</b></div><div class="stat"><span>Cardio última</span><b>${last?(last.cardio?.minutes||0)+" min":"—"}</b></div></div>${muscleMap42()}${trainingHistoryMarkup()}`;
}
function renderTraining(){
 const tabs=[["today","Hoy"],["session","Sesión"],["plan","5 días"],["progress","Progreso"],["muscles","Mapa"],["library","Biblioteca"]];
 const body=TRAINING_TAB==="today"?trainingTodayCard():TRAINING_TAB==="session"?workoutSessionMarkup():TRAINING_TAB==="plan"?trainingPlanMarkup():TRAINING_TAB==="progress"?progress42():TRAINING_TAB==="muscles"?muscleMap42():exerciseLibraryMarkup();
 return `<div class="card hero"><span class="eyebrow">ENTRENAMIENTO</span><h2>Entrenador85</h2><p class="muted">Hoy → Ejercicio → Progreso → Mapa muscular.</p></div><div class="tabs">${tabs.map(([id,l])=>`<button class="tab-btn ${TRAINING_TAB===id?"active":""}" data-action="training-tab" data-tab="${id}">${l}</button>`).join("")}</div>${body}`;
}

/* Evolution: automatic report on save */
const saveMeasurementBase42=saveMeasurement;
saveMeasurement=function(){
 saveMeasurementBase42();
 try{generateWeeklyReview();EVOLUTION_NOTICE42=true;render();toast("Control guardado · informe actualizado")}catch(e){console.error(e)}
}
function trend42(k,d){
 if(d==null)return ["SIN DATOS",""];
 if((k==="muscleMass"&&Math.abs(d)>=1.5)||(k==="bodyFat"&&Math.abs(d)>=1.5))return ["CONFIRMAR","amber"];
 if(["waist","visceral"].includes(k))return d<0?["CAMBIO FAVORABLE","green"]:d===0?["ESTABLE",""]:["REVISAR TENDENCIA","amber"];
 return Math.abs(d)<.3?["ESTABLE",""]:["CAMBIO",""];
}
function evolutionCoachInterpretation(){
 const {first,last,prev}=firstAndLastMeasurements();if(!last)return `<div class="card coach"><h3>Entrenador85 interpreta tus resultados</h3><p>Guarda un control para empezar.</p></div>`;
 const ks=[["weight","Peso","kg"],["waist","Cintura","cm"],["bodyFat","Grasa corporal","p.p."],["visceral","Grasa visceral",""],["muscleMass","Masa muscular","kg"],["skeletalMuscle","Músculo esquelético","p.p."]];
 const rows=ks.map(([k,n,u])=>{const w=prev&&last[k]!=null&&prev[k]!=null?Math.round((last[k]-prev[k])*10)/10:null,t=first&&last[k]!=null&&first[k]!=null?Math.round((last[k]-first[k])*10)/10:null,[lab,cl]=trend42(k,w);return `<div class="week-row"><span>${n}</span><div><b>${last[k]??"—"} ${last[k]!=null?u:""}</b><small>Semana: ${w==null?"—":(w>0?"+":"")+w} · Inicio: ${t==null?"—":(t>0?"+":"")+t}</small></div><span class="pill ${cl}">${lab}</span></div>`}).join("");
 const f=anomalyFlags(last,prev);return `<div class="card coach ${EVOLUTION_NOTICE42?"fresh-report":""}"><span class="eyebrow">INFORME AUTOMÁTICO</span><h2>Semana · inicio · tendencia</h2>${rows}<p>Los datos de composición corporal se interpretan como tendencia de varias semanas y pueden variar con la hidratación.</p>${f.length?`<div class="warning"><b>Repetir medición</b><ul>${f.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}</div>`;
}
function weeklyCoachMarkup(){const a=adherenceThisWeek();return `<div class="card coach"><span class="eyebrow">SEMANA ACTUAL</span><h2>Entrenador85</h2><div class="grid"><div class="stat"><span>Entrenamiento</span><b>${a.training}%</b></div><div class="stat"><span>Nutrición</span><b>${a.nutrition==null?"No evaluable":a.nutrition+"%"}</b></div></div><p class="muted">El informe se actualiza al guardar el control.</p></div>`}

/* Version + safer render */
function moreMarkup(){return `<div class="card"><span class="eyebrow">DATOS Y SEGURIDAD</span><h2>Proyecto85 Pro 4.2</h2><p class="muted">Actualización agrupada · mismas claves p85pro2_ · sin service worker.</p><div class="btn-row"><button class="btn primary" data-action="export-data">Exportar copia</button><button class="btn" data-action="import-data">Importar copia</button><input id="import_file" type="file" accept="application/json" class="hidden"></div></div><div class="card learning"><span class="eyebrow">FLUJO</span><h3>Planificar → Entrenar → Organizar → Registrar → Analizar → Aprender</h3></div>`}
function render(){
 const host=$("#app");if(!host)return;let content;
 try{content=PAGE==="home"?todayDashboard():PAGE==="training"?renderTraining():PAGE==="nutrition"?renderNutrition():PAGE==="evolution"?renderEvolution():moreMarkup()}
 catch(e){console.error(e);content=`<div class="error-card"><h2>${esc(PAGE)}</h2><p>Este módulo encontró un error. Tus datos siguen guardados.</p></div>`}
 host.innerHTML=`<div class="shell"><header><div class="brand"><small>ENTRENADOR PERSONAL</small><h1>Proyecto85 Pro <span class="version">4.2</span></h1></div><span class="header-badge">Entrenador85</span></header>${content}</div>${nav()}`;
}

/* Additional 4.2 actions. Existing 4.1 actions remain active. */
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action;
 if(a==="p85-nut-tab"){e.stopImmediatePropagation();NUTRITION_TAB=b.dataset.tab||"today";render()}
 if(a==="p85-plan-next"){e.stopImmediatePropagation();NUTRITION_TAB="plan";PLANNER_TAB="next";render()}
 if(a==="p85-save-note"){e.stopImmediatePropagation();saveNote42(b.dataset.id,$("#note42")?.value||"");toast("Nota guardada")}
 if(a==="p85-rest"){e.stopImmediatePropagation();REST_END42=Date.now()+Number(b.dataset.sec||90)*1000;render();tick42()}
},true);
