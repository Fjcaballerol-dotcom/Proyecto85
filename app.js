
const VERSION="2.0.0",PREFIX="p85pro2_";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(PREFIX+k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(PREFIX+k,JSON.stringify(v));
const monday=(o=0)=>{const d=new Date(),day=d.getDay(),diff=(day===0?-6:1-day)+o*7;d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d.toISOString().slice(0,10)};
const plus=(iso,n)=>{const d=new Date(iso+"T00:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const todayISO=()=>new Date().toISOString().slice(0,10);
const dayName=()=>["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];
const DAYS=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const MEALS={breakfast:"Desayuno",midmorning:"Media mañana",lunch:"Comida",snack:"Merienda",dinner:"Cena"};

const DEFAULT_RECIPES=[
 {id:"b1",type:"breakfast",name:"Tostada integral con pavo, tomate y AOVE",cat:"desayuno",protein:"pavo",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Pavo",70,"g","listo"],["Tomate",120,"g","crudo"],["AOVE",5,"g","medido"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Añade tomate y pavo.","Termina con el AOVE medido.","Acompaña con el café habitual."],storage:"Sin preparación previa.",reheat:"No aplica."},
 {id:"b2",type:"breakfast",name:"Tostada integral con queso fresco, tomate y fruta",cat:"desayuno",protein:"queso",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Queso fresco",70,"g","listo"],["Tomate",100,"g","crudo"],["Fruta",1,"pieza","entera"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Añade queso y tomate.","Toma la fruta y el café."],storage:"Sin preparación previa.",reheat:"No aplica."},
 {id:"b3",type:"breakfast",name:"Tostada integral con aguacate y pavo",cat:"desayuno",protein:"pavo",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Aguacate",35,"g","listo"],["Pavo",60,"g","listo"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Unta el aguacate.","Añade pavo.","Acompaña con café."],storage:"Al momento.",reheat:"No aplica."},
 {id:"m1",type:"midmorning",name:"Fruta y yogur natural",cat:"tentempié",protein:"lácteo",carb:"fruta",time:2,prep:"Directo",items:[["Fruta",1,"pieza","entera"],["Yogur natural",1,"unidad","listo"]],steps:["Tomar directamente."],storage:"Transportable.",reheat:"No."},
 {id:"m2",type:"midmorning",name:"Pavo y pequeña tostada",cat:"tentempié",protein:"pavo",carb:"pan",time:3,prep:"Directo",items:[["Pavo",60,"g","listo"],["Pan integral",30,"g","listo"]],steps:["Preparar y llevar."],storage:"Transportable.",reheat:"No."},
 {id:"s1",type:"snack",name:"Yogur natural con kiwi",cat:"tentempié",protein:"lácteo",carb:"fruta",time:2,prep:"Directo",items:[["Yogur natural",1,"unidad","listo"],["Kiwi",1,"pieza","entero"]],steps:["Tomar directamente."],storage:"Transportable.",reheat:"No."},
 {id:"s2",type:"snack",name:"Queso fresco con tomate",cat:"tentempié",protein:"queso",carb:"verdura",time:3,prep:"Directo",items:[["Queso fresco",60,"g","listo"],["Tomate",150,"g","crudo"]],steps:["Cortar y servir."],storage:"En frío.",reheat:"No."},

 {id:"l1",type:"lunch",name:"Pasta mediterránea con pollo",cat:"pasta",protein:"pollo",carb:"pasta",time:15,prep:"Dejar preparada; solo calentar",items:[["Pasta integral",70,"g","crudo"],["Pollo",180,"g","crudo"],["Tomate",120,"g","cocinado"],["Pimientos",120,"g","cocinados"],["AOVE",10,"g","medido"]],steps:["Cuece la pasta.","Cocina el pollo en tiras.","Añade tomate y pimientos.","Mezcla y guarda en ración."],storage:"2-3 días en frío.",reheat:"Calentar suavemente."},
 {id:"l2",type:"lunch",name:"Arroz tres delicias saludable",cat:"arroz",protein:"huevo",carb:"arroz",time:15,prep:"Preparar la noche anterior",items:[["Arroz",65,"g","crudo"],["Huevo",1,"unidad","cocinado"],["Gambas",100,"g","cocinadas"],["Guisantes",60,"g","cocinados"],["Zanahoria",80,"g","cocinada"]],steps:["Cuece el arroz según el envase y deja que se enfríe.","Saltea zanahoria y guisantes 5-7 minutos.","Aparta la verdura a un lado y cuaja el huevo.","Añade las gambas y cocínalas completamente.","Incorpora el arroz y saltea 2-3 minutos.","Termina con ajo, perejil u otras especias suaves."],storage:"Enfriar pronto y conservar en frío.",reheat:"Recalentar completamente una sola vez."},
 {id:"l3",type:"lunch",name:"Lomo magro con pimientos y arroz",cat:"carne",protein:"cerdo",carb:"arroz",time:12,prep:"Dejar preparado; solo calentar",items:[["Lomo magro",180,"g","crudo"],["Arroz integral",60,"g","crudo"],["Pimientos asados",250,"g","cocinados"]],steps:["Cuece el arroz.","Cocina el lomo a la plancha.","Añade pimientos asados.","Guarda por ración."],storage:"2-3 días en frío.",reheat:"Calentar suavemente."},
 {id:"l4",type:"lunch",name:"Filete de ternera con patata y verduras",cat:"carne",protein:"ternera",carb:"patata",time:12,prep:"Dejar guarnición lista",items:[["Ternera magra",180,"g","crudo"],["Patata",220,"g","cocida"],["Verduras",250,"g","cocinadas"]],steps:["Cuece o asa la patata.","Deja las verduras listas.","Cocina la ternera en plancha caliente.","Monta la ración."],storage:"2 días en frío.",reheat:"Sin resecar."},
 {id:"l5",type:"lunch",name:"Garbanzos con espinacas y pollo",cat:"legumbre",protein:"pollo",carb:"legumbre",time:12,prep:"Ideal para preparar antes",items:[["Garbanzos",200,"g","cocidos"],["Espinacas",250,"g","cocinadas"],["Pollo",120,"g","crudo"]],steps:["Saltea las espinacas.","Añade garbanzos.","Incorpora el pollo ya cocinado.","Mezcla y guarda."],storage:"2-3 días en frío.",reheat:"Calentar suavemente."},
 {id:"l6",type:"lunch",name:"Lentejas con verduras y pavo",cat:"legumbre",protein:"pavo",carb:"legumbre",time:12,prep:"Preparar la noche anterior",items:[["Lentejas",200,"g","cocidas"],["Pavo",120,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Calienta las lentejas.","Añade verduras.","Incorpora pavo cocinado.","Guarda por ración."],storage:"2-3 días en frío.",reheat:"Bien caliente."},
 {id:"l7",type:"lunch",name:"Ensaladilla equilibrada con atún",cat:"ensaladilla",protein:"atún",carb:"patata",time:10,prep:"Dejar hecha en frío",items:[["Patata",220,"g","cocida"],["Atún",140,"g","escurrido"],["Zanahoria",80,"g","cocida"],["Guisantes",50,"g","cocidos"],["Yogur natural",40,"g","salsa ligera"]],steps:["Cuece y enfría patata y zanahoria.","Añade guisantes y atún.","Liga con salsa ligera de yogur.","Refrigera."],storage:"1-2 días en frío.",reheat:"No."},
 {id:"l8",type:"lunch",name:"Arroz con langostinos y verduras",cat:"arroz",protein:"langostinos",carb:"arroz",time:14,prep:"Preparar antes; solo calentar",items:[["Arroz",65,"g","crudo"],["Langostinos",160,"g","cocinados"],["Verduras",250,"g","cocinadas"]],steps:["Cuece el arroz.","Saltea verduras.","Añade langostinos al final.","Guarda."],storage:"1-2 días en frío.",reheat:"Calentar una vez."},
 {id:"l9",type:"lunch",name:"Mejillones con arroz y verduras",cat:"marisco",protein:"mejillones",carb:"arroz",time:12,prep:"Arroz y verduras preparados",items:[["Mejillones",180,"g","comestibles"],["Arroz",60,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Deja arroz y verduras listos.","Cocina o incorpora mejillones según formato.","Monta el plato."],storage:"Consumir pronto.",reheat:"Suave."},
 {id:"l10",type:"lunch",name:"Tortilla de patata ligera con ensalada",cat:"huevo",protein:"huevo",carb:"patata",time:15,prep:"Puede dejarse hecha",items:[["Huevos",2,"unidades","cocinados"],["Patata",200,"g","cocida"],["Cebolla",60,"g","cocinada"],["Ensalada",250,"g","cruda"]],steps:["Cuece o cocina la patata con poco aceite.","Añade cebolla.","Cuaja con huevo.","Acompaña con ensalada."],storage:"1-2 días en frío.",reheat:"Opcional."},
 {id:"l11",type:"lunch",name:"Salteado de espárragos, pollo y patata",cat:"verdura",protein:"pollo",carb:"patata",time:12,prep:"Preparar la noche anterior",items:[["Espárragos",250,"g","cocinados"],["Pollo",170,"g","crudo"],["Patata",200,"g","cocida"]],steps:["Saltea espárragos.","Añade pollo.","Acompaña con patata."],storage:"2 días.",reheat:"Suave."},

 {id:"d1",type:"dinner",name:"Merluza a la plancha con ensalada",cat:"pescado",protein:"merluza",carb:"verdura",time:12,prep:"Cena ligera",items:[["Merluza",200,"g","crudo"],["Ensalada",300,"g","cruda"]],steps:["Seca el pescado.","Cocina en plancha caliente hasta que esté hecho.","Monta la ensalada aparte."],storage:"Mejor al momento.",reheat:"Evitar."},
 {id:"d2",type:"dinner",name:"Salmón con espárragos",cat:"pescado",protein:"salmón",carb:"verdura",time:12,prep:"Cena ligera",items:[["Salmón",180,"g","crudo"],["Espárragos",250,"g","cocinados"]],steps:["Seca el salmón.","Cocina en plancha caliente controlando el punto.","Saltea los espárragos aparte.","Sirve junto."],storage:"Mejor al momento.",reheat:"Evitar resecar."},
 {id:"d3",type:"dinner",name:"Tortilla francesa con tomate y queso fresco",cat:"huevo",protein:"huevo",carb:"verdura",time:8,prep:"Rápida",items:[["Huevos",2,"unidades","cocinados"],["Tomate",200,"g","crudo"],["Queso fresco",50,"g","listo"]],steps:["Bate los huevos.","Cuaja la tortilla completamente.","Acompaña con tomate y queso fresco."],storage:"Al momento.",reheat:"No."},
 {id:"d4",type:"dinner",name:"Mejillones al vapor con ensalada",cat:"marisco",protein:"mejillones",carb:"verdura",time:10,prep:"Ligera",items:[["Mejillones",200,"g","comestibles"],["Ensalada",300,"g","cruda"]],steps:["Limpia los mejillones si procede.","Cocina al vapor hasta que estén hechos.","Monta la ensalada."],storage:"Al momento.",reheat:"No."},
 {id:"d5",type:"dinner",name:"Langostinos a la plancha con verduras",cat:"marisco",protein:"langostinos",carb:"verdura",time:10,prep:"Ligera",items:[["Langostinos",180,"g","cocinados"],["Verduras",300,"g","cocinadas"]],steps:["Cocina las verduras primero.","Plancha los langostinos hasta que estén hechos.","Sirve juntos."],storage:"Mejor al momento.",reheat:"No."},
 {id:"d6",type:"dinner",name:"Atún con tomate, aguacate y queso fresco",cat:"pescado",protein:"atún",carb:"verdura",time:7,prep:"Montar",items:[["Atún",150,"g","escurrido"],["Tomate",220,"g","crudo"],["Aguacate",40,"g","listo"],["Queso fresco",50,"g","listo"]],steps:["Escurre el atún.","Corta tomate y aguacate.","Añade queso fresco.","Monta y aliña."],storage:"Al momento.",reheat:"No."},
 {id:"d7",type:"dinner",name:"Pollo con verduras; reserva para mañana",cat:"pollo",protein:"pollo",carb:"verdura",time:12,prep:"Cena + preparar mañana",items:[["Pollo",300,"g","crudo"],["Verduras",300,"g","cocinadas"]],steps:["Cocina una ración amplia de pollo.","Cena una parte con verduras.","Reserva una porción para la comida del día siguiente."],storage:"Reserva en frío.",reheat:"Calentar mañana."},
 {id:"d8",type:"dinner",name:"Salteado de espárragos con huevo y pavo",cat:"huevo",protein:"huevo",carb:"verdura",time:10,prep:"Rápida",items:[["Espárragos",250,"g","cocinados"],["Huevo",1,"unidad","cocinado"],["Pavo",80,"g","listo"]],steps:["Saltea espárragos.","Añade pavo.","Cuaja el huevo completamente."],storage:"Al momento.",reheat:"No."},
 {id:"d9",type:"dinner",name:"Ensalada completa con queso fresco y pavo",cat:"ensalada",protein:"queso",carb:"verdura",time:8,prep:"Montar",items:[["Ensalada",300,"g","cruda"],["Queso fresco",70,"g","listo"],["Pavo",80,"g","listo"]],steps:["Lava y seca las hojas.","Añade queso y pavo.","Aliña al servir."],storage:"Al momento.",reheat:"No."}
];

const DEFAULT_TRAINING=[
 {day:"Día 1",title:"Full Body A",ex:["Prensa","Curl femoral","Jalón al pecho","Remo","Press pecho","Press militar","Elevaciones laterales","Curl bíceps","Tríceps"]},
 {day:"Día 2",title:"Full Body B",ex:["Jalón al pecho","Remo apoyo pecho","Pullover","Prensa","Extensión cuádriceps","Abducción","Press inclinado","Face Pull","Curl bíceps","Tríceps"]},
 {day:"Día 3",title:"Full Body C",ex:["Prensa","Extensión cuádriceps","Press inclinado","Face Pull","Remo","Jalón","Core en máquina"]},
 {day:"Día 4",title:"Full Body D",ex:["Prensa","Curl femoral","Peck Deck","Remo","Elevaciones laterales","Face Pull","Core"]},
 {day:"Día 5",title:"Full Body E",ex:["Trabajo completo","Core en máquina","Cardio progresivo"]}
];

function customRecipes(){return get("customRecipes",[])}
function saveCustomRecipes(a){set("customRecipes",a)}
function recipes(){return [...DEFAULT_RECIPES,...customRecipes()]}
function recipe(id){return recipes().find(r=>r.id===id)}
function recipesBy(t){return recipes().filter(r=>r.type===t)}
function state(){return get("state",{plans:[],ratings:{},mealDone:{},pantry:[],shopping:[],trainingLog:[],measurements:[],settings:{flexMeal:true}})}
function saveState(s){set("state",s)}

function scoreRecipe(r,used,current){
 const s=state();let score=0;
 if(used.includes(r.id))score+=100;
 if(current&&r.protein===current.protein)score+=25;
 if(current&&r.carb===current.carb)score+=10;
 score-=(s.ratings[r.id]||0)*2;
 return score;
}
function chooseRecipe(type,used,current=null){
 const pool=recipesBy(type).filter(r=>!current||r.id!==current.id);
 return [...pool].sort((a,b)=>scoreRecipe(a,used,current)-scoreRecipe(b,used,current))[0];
}
function generatePlan(start){
 const s=state(),plan={weekStart:start,weekEnd:plus(start,6),status:"draft",days:{}};
 const used=[];
 DAYS.forEach((day,di)=>{
  plan.days[day]={};
  Object.keys(MEALS).forEach(t=>{
   let pool=recipesBy(t);
   if(t==="lunch"&&[1,5].includes(di)){const p=pool.filter(r=>r.cat==="legumbre");if(p.length)pool=p}
   if(t==="dinner"&&[0,2,4].includes(di)){const p=pool.filter(r=>["pescado","marisco","huevo"].includes(r.cat));if(p.length)pool=p}
   const r=[...pool].sort((a,b)=>scoreRecipe(a,used)-scoreRecipe(b,used))[0];
   plan.days[day][t]=r.id;used.push(r.id);
  });
 });
 s.plans=s.plans.filter(p=>p.weekStart!==start);s.plans.unshift(plan);saveState(s);return plan;
}
function getPlan(start){return state().plans.find(p=>p.weekStart===start)||generatePlan(start)}
function confirmPlan(start){
 const s=state(),p=s.plans.find(x=>x.weekStart===start);if(!p)return;p.status="confirmed";saveState(s);buildShopping(p);render();
}
function buildShopping(p){
 const s=state(),need={};
 Object.values(p.days).forEach(ms=>Object.values(ms).forEach(id=>recipe(id).items.forEach(([n,q,u])=>{
  if(!need[n])need[n]={name:n,qty:0,unit:u,bought:false};
  need[n].qty+=(typeof q==="number"?q:1);
 })));
 const pantry=Object.fromEntries(s.pantry.map(x=>[x.name.toLowerCase(),Number(x.qty)||0]));
 s.shopping=Object.values(need).map(x=>({...x,buy:Math.max(0,x.qty-(pantry[x.name.toLowerCase()]||0))})).filter(x=>x.buy>0);
 saveState(s);
}
function currentMeal(t){
 const p=state().plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed");
 return recipe(p?.days?.[dayName()]?.[t])||recipesBy(t)[0];
}
function smartReplacement(t){
 const s=state(),p=s.plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed");
 if(!p)return alert("Confirma primero la semana.");
 const current=recipe(p.days[dayName()][t]),used=Object.values(p.days).flatMap(x=>Object.values(x));
 const next=chooseRecipe(t,used,current);if(!next)return;
 p.days[dayName()][t]=next.id;saveState(s);
 const old=document.querySelector(`[data-meal-card="${t}"]`);
 if(old){const tmp=document.createElement("div");tmp.innerHTML=mealCard(t);old.replaceWith(tmp.firstElementChild)}
}
function toggleMealDone(t,v){
 const s=state();s.mealDone[`${todayISO()}_${t}`]=!!v;saveState(s);
 document.querySelector(`[data-meal-card="${t}"]`)?.classList.toggle("meal-complete",!!v);
}
function rateRecipe(id,v,btn){
 const s=state();s.ratings[id]=v;saveState(s);
 btn.closest(".rating")?.querySelectorAll("button").forEach(b=>b.classList.toggle("active",Number(b.textContent)===v));
}
function detailedSteps(r){
 const out=["Pesa todos los ingredientes y deja preparadas las verduras antes de empezar.",...(r.steps||[])];
 return out;
}
function advanceAdvice(r){
 if(r.type==="dinner"&&["pescado","marisco"].includes(r.cat))return "Deja los ingredientes limpios y porcionados; cocina la proteína cerca de la cena.";
 if(r.cat==="ensalada")return "Lava y seca hojas con antelación, pero añade tomate, aguacate y aliño al servir.";
 return r.prep+"; puedes dejar la ración pesada y porcionada con antelación.";
}

function openModal(title,body){
 document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop"><div class="modal"><div class="section-title"><h2>${title}</h2><button class="btn small" data-close-modal>Cerrar</button></div>${body}</div></div>`);
}
function closeModal(){document.querySelector(".modal-backdrop")?.remove()}
function openRecipe(id){
 const r=recipe(id);if(!r)return;
 openModal(r.name,`<div class="meta"><span>${r.prep}</span><span>${r.time} min</span><span>${r.cat}</span></div>
 <h3>Ingredientes y cantidades</h3><ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]}</small></li>`).join("")}</ul>
 <h3>Preparación paso a paso</h3><ol>${detailedSteps(r).map(x=>`<li>${x}</li>`).join("")}</ol>
 <h3>Qué puedes adelantar</h3><p>${advanceAdvice(r)}</p><h3>Conservación</h3><p>${r.storage}</p><h3>Recalentado</h3><p>${r.reheat}</p>`);
}
function openCustomRecipeForm(id=""){
 const r=id?recipe(id):null;
 const items=(r?.items||[]).map(x=>`${x[0]} | ${x[1]} | ${x[2]} | ${x[3]}`).join("\n");
 const steps=(r?.steps||[]).join("\n");
 openModal(id?"Editar receta":"Añadir receta",`<div class="form-grid">
 <label class="wide">Nombre<input id="cr_name" value="${r?.name||""}"></label>
 <label>Momento<select id="cr_type">${Object.entries(MEALS).map(([k,v])=>`<option value="${k}" ${r?.type===k?"selected":""}>${v}</option>`).join("")}</select></label>
 <label>Categoría<input id="cr_cat" value="${r?.cat||""}"></label>
 <label>Proteína<input id="cr_protein" value="${r?.protein||""}"></label>
 <label>Hidrato<input id="cr_carb" value="${r?.carb||""}"></label>
 <label>Tiempo<input id="cr_time" type="number" value="${r?.time||15}"></label>
 <label class="wide">Ingredientes<textarea id="cr_items" rows="7">${items}</textarea></label>
 <label class="wide">Preparación<textarea id="cr_steps" rows="7">${steps}</textarea></label>
 <label>Conservación<input id="cr_storage" value="${r?.storage||""}"></label>
 <label>Recalentado<input id="cr_reheat" value="${r?.reheat||""}"></label>
 </div><div class="btn-row"><button class="btn primary" data-save-recipe="${id}">Guardar</button>${id?`<button class="btn danger" data-delete-recipe="${id}">Eliminar</button>`:""}</div>`);
}
function saveCustomRecipe(id=""){
 const name=$("#cr_name").value.trim();if(!name)return alert("Escribe el nombre.");
 const row={id:id||"user_"+uid(),type:$("#cr_type").value,name,cat:$("#cr_cat").value.trim()||"propia",protein:$("#cr_protein").value.trim()||"otro",carb:$("#cr_carb").value.trim()||"otro",time:Number($("#cr_time").value)||15,prep:"Receta propia",items:$("#cr_items").value.split("\n").map(x=>x.split("|").map(y=>y.trim())).filter(x=>x[0]).map(x=>[x[0],Number(x[1])||x[1]||1,x[2]||"unidad",x[3]||"listo"]),steps:$("#cr_steps").value.split("\n").map(x=>x.trim()).filter(Boolean),storage:$("#cr_storage").value.trim()||"Según ingredientes.",reheat:$("#cr_reheat").value.trim()||"Según plato."};
 let a=customRecipes().filter(x=>x.id!==row.id);a.unshift(row);saveCustomRecipes(a);closeModal();render();
}

function mealCard(t){
 const r=currentMeal(t),s=state(),done=!!s.mealDone[`${todayISO()}_${t}`],rating=s.ratings[r.id]||0;
 return `<div class="meal-card ${done?"meal-complete":""}" data-meal-card="${t}">
 <div class="meal-head"><div><span class="eyebrow">${MEALS[t]}</span><h3>${r.name}</h3><div class="meta"><span>${r.prep}</span><span>${r.time} min</span><span>${r.cat}</span></div></div><button class="btn small" data-open-recipe="${r.id}">Receta</button></div>
 <ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]}</small></li>`).join("")}</ul>
 <label class="meal-check"><input type="checkbox" data-meal-done="${t}" ${done?"checked":""}> Comida realizada</label>
 <div class="btn-row"><button class="btn small primary" data-smart-change="${t}">Cambiar por otra equilibrada</button></div>
 <div class="rating">${[1,2,3,4,5,6,7,8,9,10].map(v=>`<button class="${rating===v?"active":""}" data-rate="${r.id}" data-value="${v}">${v}</button>`).join("")}</div></div>`;
}

function planner(){
 return `<div class="planner-nav"><button class="tab-btn active" data-pview="current">Semana actual</button><button class="tab-btn" data-pview="next">Semana siguiente</button><button class="tab-btn" data-pview="history">Historial</button></div>
 <div id="p_current">${planMarkup(getPlan(monday(0)))}</div><div id="p_next" class="hidden">${planMarkup(getPlan(monday(1)))}</div><div id="p_history" class="hidden">${historyMarkup()}</div>`;
}
function planMarkup(p){
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">${p.weekStart} → ${p.weekEnd}</span><h2>${p.status==="confirmed"?"Semana confirmada":"Borrador editable"}</h2></div></div>
 <div class="btn-row"><button class="btn" data-regenerate="${p.weekStart}">Otra propuesta</button>${p.status!=="confirmed"?`<button class="btn primary" data-confirm-plan="${p.weekStart}">Confirmar semana</button>`:""}</div></div>
 ${DAYS.map(day=>`<div class="week-card"><h3>${day}</h3>${Object.keys(MEALS).map(t=>{const r=recipe(p.days[day][t]);return `<div class="week-row"><span>${MEALS[t]}</span><div><b>${r.name}</b><small>${r.prep} · ${r.time} min</small></div><div class="actions"><button class="btn small" data-open-recipe="${r.id}">Ver</button><button class="btn small" data-change-plan="${p.weekStart}|${day}|${t}">Cambiar</button></div></div>`}).join("")}</div>`).join("")}`;
}
function historyMarkup(){const a=state().plans.filter(p=>p.weekStart<monday(0));return a.length?a.map(p=>`<div class="card"><h3>${p.weekStart} → ${p.weekEnd}</h3><p>${p.status}</p></div>`).join(""):`<div class="card"><p class="muted">Sin historial todavía.</p></div>`}
function changePlan(start,day,t){
 const p=getPlan(start),cur=recipe(p.days[day][t]),used=Object.values(p.days).flatMap(x=>Object.values(x)),next=chooseRecipe(t,used,cur);
 if(!next)return;const s=state(),sp=s.plans.find(x=>x.weekStart===start);sp.days[day][t]=next.id;sp.status="draft";saveState(s);render();
}

function library(){
 const main=recipes().filter(r=>["lunch","dinner"].includes(r.type)),other=recipes().filter(r=>!["lunch","dinner"].includes(r.type));
 const tile=r=>`<div class="recipe-card"><span class="eyebrow">${MEALS[r.type]}</span><h3>${r.name}</h3><p class="muted">${r.prep} · ${r.time} min</p><div class="btn-row"><button class="btn small" data-open-recipe="${r.id}">Ver</button>${String(r.id).startsWith("user_")?`<button class="btn small" data-edit-recipe="${r.id}">Editar</button>`:""}</div></div>`;
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">BIBLIOTECA PRINCIPAL</span><h2>${main.length} comidas y cenas</h2></div><button class="btn primary" data-add-recipe>+ Añadir receta</button></div></div><div class="recipe-grid">${main.map(tile).join("")}</div><div class="card"><span class="eyebrow">DESAYUNOS Y TENTEMPIÉS</span><h3>${other.length} opciones</h3></div><div class="recipe-grid">${other.map(tile).join("")}</div>`;
}
function shopping(){
 const a=state().shopping;if(!a.length)return `<div class="card"><p>Confirma una semana para generar la compra.</p></div>`;
 return `<div class="card"><h2>Compra semanal</h2>${a.map((x,i)=>`<div class="shop-row"><div><b>${x.name}</b><small>Comprar ${Math.ceil(x.buy)} ${x.unit}</small></div><input type="checkbox" data-shop="${i}" ${x.bought?"checked":""}></div>`).join("")}</div>`;
}
function pantry(){
 const a=state().pantry;return `<div class="card"><h2>Despensa</h2><div class="form-grid"><label>Producto<input id="pn"></label><label>Cantidad<input id="pq" type="number"></label></div><button class="btn primary" data-add-pantry>Añadir</button>${a.map((x,i)=>`<div class="pantry-row"><div><b>${x.name}</b><small>${x.qty}</small></div><button class="btn small danger" data-remove-pantry="${i}">Quitar</button></div>`).join("")}</div>`;
}
function prepMarkup(){
 const p=getPlan(monday(1));
 const meal=(day,t)=>{const r=recipe(p.days[day][t]);return `<div class="meal-card"><span class="eyebrow">${day.toUpperCase()} · ${MEALS[t].toUpperCase()}</span><h3>${r.name}</h3><h4>Qué adelantar</h4><p>${advanceAdvice(r)}</p><h4>Ingredientes</h4><ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}</li>`).join("")}</ul><h4>Preparación</h4><ol>${detailedSteps(r).map(x=>`<li>${x}</li>`).join("")}</ol><h4>Conservación</h4><p>${r.storage}</p></div>`};
 return `<div class="card"><span class="eyebrow">PREPARACIÓN DE LA SEMANA</span><h2>Fin de semana</h2><ol><li>Revisa primero la semana siguiente.</li><li>Lava y corta verduras resistentes y asa una bandeja de verduras/pimientos.</li><li>Deja porcionadas proteínas y cocina por adelantado solo las que lo permitan.</li><li>Prepara legumbres para los primeros días.</li><li>Deja componentes de ensaladas separados y sin aliñar.</li><li>Reserva 20–30 min a mitad de semana para completar el resto.</li></ol></div>${DAYS.map(d=>meal(d,"lunch")).join("")}<div class="card"><h2>Cenas</h2></div>${DAYS.map(d=>meal(d,"dinner")).join("")}`;
}

function training(){
 const logs=state().trainingLog;return `<div class="card hero"><span class="eyebrow">ENTRENO</span><h2>Plan de entrenamiento</h2><p class="muted">Registro simple y estable.</p></div>${DEFAULT_TRAINING.map((d,i)=>`<div class="card"><span class="eyebrow">${d.day}</span><h3>${d.title}</h3>${d.ex.map(x=>`<div class="exercise-row"><div><b>${x}</b><small>Registra sensaciones y carga</small></div><button class="btn small" data-log-ex="${i}|${x}">Registrar</button></div>`).join("")}</div>`).join("")}`;
}
function evolution(){const s=state(),m=s.measurements[0];return `<div class="card"><span class="eyebrow">EVOLUCIÓN</span><h2>Control semanal</h2><div class="form-grid"><label>Peso<input id="ev_weight" type="number" step="0.1" value="${m?.weight||""}"></label><label>Cintura<input id="ev_waist" type="number" step="0.1" value="${m?.waist||""}"></label><label>Cadera<input id="ev_hip" type="number" step="0.1" value="${m?.hip||""}"></label><label>Pecho<input id="ev_chest" type="number" step="0.1" value="${m?.chest||""}"></label></div><button class="btn primary" data-save-measure>Guardar control</button></div>`}
function more(){return `<div class="card"><span class="eyebrow">MÁS</span><h2>Proyecto85 Pro</h2><p>Base única y limpia, sin service worker.</p><button class="btn" data-export>Exportar datos</button></div>`}
function home(){const p=state().plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed");return `<div class="card hero"><span class="eyebrow">PROYECTO85 PRO</span><h2>Inicio</h2><div class="grid"><div class="stat"><span>Semana</span><b>${p?"Planificada":"Pendiente"}</b></div><div class="stat"><span>Versión</span><b>2.0</b></div></div></div>`}
function nutrition(){return `<div class="card hero"><span class="eyebrow">NUTRICIÓN</span><h2>Planifica → prepara → compra → sigue</h2><p class="muted">Plan semanal estable, recetas, compra, despensa y preparación.</p></div><div class="tabs" id="nutritionTabs">${[["today","Hoy"],["plan","Plan semanal"],["recipes","Biblioteca"],["shopping","Compra"],["pantry","Despensa"],["prep","Preparación"]].map(([id,l],i)=>`<button class="tab-btn ${i===0?"active":""}" data-ntab="${id}">${l}</button>`).join("")}</div><section id="n_today">${Object.keys(MEALS).map(mealCard).join("")}</section><section id="n_plan" class="hidden">${planner()}</section><section id="n_recipes" class="hidden">${library()}</section><section id="n_shopping" class="hidden">${shopping()}</section><section id="n_pantry" class="hidden">${pantry()}</section><section id="n_prep" class="hidden">${prepMarkup()}</section>`}

let PAGE="home";
function nav(){const it=[["home","⌂","Inicio"],["training","🏋️","Entreno"],["nutrition","🍽️","Nutrición"],["evolution","↗","Evolución"],["more","•••","Más"]];return `<nav class="bottom"><div class="bottom-inner">${it.map(([p,i,l])=>`<button class="nav-btn ${PAGE===p?"active":""}" data-page="${p}"><b>${i}</b>${l}</button>`).join("")}</div></nav>`}
function render(){const host=$("#app");if(!host)return;const content=PAGE==="home"?home():PAGE==="training"?training():PAGE==="nutrition"?nutrition():PAGE==="evolution"?evolution():more();host.innerHTML=`<div class="shell"><header><div class="brand"><small>ENTRENADOR PERSONAL</small><h1>Proyecto85 Pro <span class="version">2.0</span></h1></div></header>${content}</div>${nav()}`}

document.addEventListener("click",e=>{
 const page=e.target.closest("[data-page]");if(page){PAGE=page.dataset.page;render();window.scrollTo(0,0);return}
 const nt=e.target.closest("[data-ntab]");if(nt){const id=nt.dataset.ntab;["today","plan","recipes","shopping","pantry","prep"].forEach(x=>$("#n_"+x)?.classList.toggle("hidden",x!==id));$("#nutritionTabs")?.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active",x===nt));return}
 const pv=e.target.closest("[data-pview]");if(pv){["current","next","history"].forEach(x=>$("#p_"+x)?.classList.toggle("hidden",x!==pv.dataset.pview));pv.parentElement.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active",x===pv));return}
 const op=e.target.closest("[data-open-recipe]");if(op){openRecipe(op.dataset.openRecipe);return}
 const sc=e.target.closest("[data-smart-change]");if(sc){smartReplacement(sc.dataset.smartChange);return}
 const cp=e.target.closest("[data-confirm-plan]");if(cp){confirmPlan(cp.dataset.confirmPlan);return}
 const rg=e.target.closest("[data-regenerate]");if(rg){generatePlan(rg.dataset.regenerate);render();return}
 const ch=e.target.closest("[data-change-plan]");if(ch){const [a,b,c]=ch.dataset.changePlan.split("|");changePlan(a,b,c);return}
 if(e.target.closest("[data-add-recipe]")){openCustomRecipeForm();return}
 const er=e.target.closest("[data-edit-recipe]");if(er){openCustomRecipeForm(er.dataset.editRecipe);return}
 const sv=e.target.closest("[data-save-recipe]");if(sv){saveCustomRecipe(sv.dataset.saveRecipe);return}
 const dr=e.target.closest("[data-delete-recipe]");if(dr){saveCustomRecipes(customRecipes().filter(x=>x.id!==dr.dataset.deleteRecipe));closeModal();render();return}
 if(e.target.closest("[data-close-modal]")){closeModal();return}
 if(e.target.closest("[data-add-pantry]")){const n=$("#pn").value.trim(),q=Number($("#pq").value)||0;if(n){const s=state();s.pantry.push({name:n,qty:q});saveState(s);render()}return}
 const rp=e.target.closest("[data-remove-pantry]");if(rp){const s=state();s.pantry.splice(Number(rp.dataset.removePantry),1);saveState(s);render();return}
 const rt=e.target.closest("[data-rate]");if(rt){rateRecipe(rt.dataset.rate,Number(rt.dataset.value),rt);return}
 if(e.target.closest("[data-save-measure]")){const s=state();s.measurements.unshift({date:todayISO(),weight:Number($("#ev_weight").value)||null,waist:Number($("#ev_waist").value)||null,hip:Number($("#ev_hip").value)||null,chest:Number($("#ev_chest").value)||null});saveState(s);alert("Control guardado");return}
 if(e.target.closest("[data-export]")){const blob=new Blob([JSON.stringify(state(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Proyecto85-datos.json";a.click();return}
});
document.addEventListener("change",e=>{
 if(e.target.matches("[data-meal-done]"))toggleMealDone(e.target.dataset.mealDone,e.target.checked);
 if(e.target.matches("[data-shop]")){const s=state();s.shopping[Number(e.target.dataset.shop)].bought=e.target.checked;saveState(s)}
});
render();
