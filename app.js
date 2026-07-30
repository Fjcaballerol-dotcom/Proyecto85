const DAYS_PER_WEEK=5;
const TOTAL_WEEKS=24;

const WORKOUTS=[
 {name:"Día 1 · Base de fuerza",ex:[
  ["Prensa",3,10,50,"Sube solo si no existe molestia"],
  ["Curl femoral",3,10,42,"Controla la bajada"],
  ["Jalón al pecho",3,10,50,"Pecho alto"],
  ["Remo con apoyo",3,10,35,"Sin balanceo"],
  ["Press de pecho",3,10,36,"Recorrido cómodo"],
  ["Elevaciones laterales",3,15,8,"Sin impulso"],
  ["Curl bíceps",3,12,13.6,""],
  ["Tríceps polea",3,12,15.9,""]
 ],core:[
  ["Plancha",3,"35 s","Mantén abdomen activo"],
  ["Bird Dog",3,"10/lado","Movimiento lento"],
  ["Pallof Press",3,"12/lado","Evita rotar"]
 ]},
 {name:"Día 2 · Espalda y piernas",ex:[
  ["Jalón al pecho",3,10,45,""],
  ["Remo con apoyo",3,10,32,""],
  ["Pullover en polea",3,12,15.9,""],
  ["Prensa",3,10,45,""],
  ["Extensión de cuádriceps",3,12,32,""],
  ["Abducción de cadera",3,15,39,""],
  ["Press inclinado",3,10,20,"Peso total orientativo"],
  ["Face Pull",3,15,15.9,""]
 ],core:[
  ["Dead Bug",3,"10/lado","Espalda pegada"],
  ["Crunch controlado",3,"12","Cambia por Dead Bug si molesta"],
  ["Plancha lateral",3,"25 s/lado","Rodillas apoyadas si hace falta"]
 ]},
 {name:"Día 3 · Control técnico",ex:[
  ["Press inclinado",3,10,20,""],
  ["Extensión de cuádriceps",3,12,39,"Control de rodilla"],
  ["Face Pull",3,15,13.9,""],
  ["Curl femoral",3,10,39,""],
  ["Jalón neutro",3,10,45,""],
  ["Remo en polea baja",3,10,32,""],
  ["Press militar",3,12,13,""],
  ["Gemelos",3,15,20,""]
 ],core:[
  ["Bird Dog",3,"10/lado",""],
  ["Extensión lumbar suave",3,"12","Sin hiperextender"],
  ["Pallof Press",3,"12/lado",""]
 ]},
 {name:"Día 4 · Full Body",ex:[
  ["Prensa",3,10,50,"52 kg solo con rodilla 0–1/10"],
  ["Curl femoral",3,10,42,"No fuerces la última repetición"],
  ["Jalón al pecho",3,10,50,""],
  ["Remo con apoyo",3,10,35,""],
  ["Press de pecho",3,10,36,""],
  ["Peck Deck",3,12,50,""],
  ["Press militar",3,12,13,""],
  ["Elevaciones laterales",3,15,8,""],
  ["Face Pull",3,15,15.9,""],
  ["Curl bíceps",3,12,13.6,""],
  ["Tríceps polea",3,12,15.9,""]
 ],core:[
  ["Plancha",3,"35 s",""],
  ["Dead Bug",3,"10/lado",""],
  ["Plancha lateral",3,"25 s/lado",""]
 ]},
 {name:"Día 5 · Cierre semanal",ex:[
  ["Prensa",3,12,45,"Trabajo fluido"],
  ["Curl femoral",3,12,39,""],
  ["Jalón al pecho",3,12,45,""],
  ["Remo en máquina",3,12,32,""],
  ["Press inclinado",3,12,20,""],
  ["Peck Deck",3,15,45,""],
  ["Elevaciones laterales",3,15,7,""],
  ["Face Pull",3,15,15.9,""],
  ["Curl martillo",3,12,10,""],
  ["Tríceps cuerda",3,12,15.9,""]
 ],core:[
  ["Woodchopper en polea",3,"12/lado","Controla la rotación"],
  ["Marcha unilateral",3,"30 s/lado","Carga moderada"],
  ["Bird Dog",3,"10/lado",""]
 ]}
];

const INITIAL_SESSIONS=[
 {programLabel:"Semana 1 · Día 1",date:"2026-07-17",duration:70,rpe:7,cardio:0,pain:0,painAfter:0,coreCompleted:false,volume:0,notes:"Prensa 45; curl femoral 39; jalón 45; remo 32; press pecho 32."},
 {programLabel:"Semana 1 · Día 2",date:"2026-07-18",duration:70,rpe:7,cardio:0,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Core: crunch, plancha y Bird Dog."},
 {programLabel:"Semana 1 · Día 3",date:"2026-07-24",duration:71,rpe:8,cardio:0,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Press inclinado 10 kg/lado; extensión 39; face pull 13,9."},
 {programLabel:"Semana 1 · Día 4",date:"2026-07-25",duration:72,rpe:8.5,cardio:0,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Buena respuesta."},
 {programLabel:"Semana 1 · Día 5",date:"2026-07-26",duration:70,rpe:8.8,cardio:0,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Los nuevos pesos se sintieron bien."},
 {programLabel:"Semana 2 · Día 1",date:"2026-07-27",duration:65,rpe:8.9,cardio:20,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Pesos programados completados."},
 {programLabel:"Semana 2 · Día 2",date:"2026-07-28",duration:70,rpe:9,cardio:20,pain:0,painAfter:0,coreCompleted:true,volume:0,notes:"Abducción aumentada a 39 kg. Cansancio por calor."},
 {programLabel:"Semana 2 · Día 3",date:"2026-07-29",duration:0,rpe:8.9,cardio:0,pain:2,painAfter:2,coreCompleted:false,volume:0,notes:"Prensa 52 kg. Curl femoral costó. Molestia leve exterior de rodilla derecha."}
];
const INITIAL_MEASURES=[{date:"2026-07-29",weight:106,bodyFat:39.5,muscleMass:63.8,waist:108,chest:119,hip:110}];
const DEFAULT_SETTINGS={name:"Javier",goalWeight:90,currentWeek:2,currentDay:4};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const todayISO=()=>new Date().toISOString().slice(0,10);

function seed(){
 if(!localStorage.getItem("p85_sessions"))set("p85_sessions",INITIAL_SESSIONS);
 if(!localStorage.getItem("p85_measures"))set("p85_measures",INITIAL_MEASURES);
 if(!localStorage.getItem("p85_settings"))set("p85_settings",DEFAULT_SETTINGS);
 if(!localStorage.getItem("p85_health"))set("p85_health",[]);
}

function toast(msg){
 const t=$("#toast");t.textContent=msg;t.classList.add("show");
 setTimeout(()=>t.classList.remove("show"),2200);
}

function settings(){return get("p85_settings",DEFAULT_SETTINGS)}
function programLabel(){const s=settings();return `Semana ${s.currentWeek} · Día ${s.currentDay}`}

function go(id){
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 $$("nav button").forEach(b=>b.classList.toggle("active",b.dataset.go===id));
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="inicio")updateDashboard();
 if(id==="historial")renderHistory();
 if(id==="progreso"){renderMeasures();drawChart()}
 if(id==="salud")renderHealth();
}
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

function renderWorkout(){
 const s=settings(), workout=WORKOUTS[s.currentDay-1];
 $("#workoutDayLabel").textContent=programLabel();
 $("#exerciseList").innerHTML=workout.ex.map((e,i)=>`
  <div class="exercise" data-exercise="${i}">
   <h3>${i+1}. ${e[0]}</h3>
   <div class="target">${e[1]} × ${e[2]} · ${e[3]} kg</div>
   ${e[4]?`<p class="muted">${e[4]}</p>`:""}
   ${Array.from({length:e[1]},(_,j)=>`
    <div class="set-row">
      <b>${j+1}</b>
      <input class="set-weight" aria-label="Peso" type="number" step=".1" value="${e[3]}">
      <input class="set-reps" aria-label="Repeticiones" type="number" value="${e[2]}">
      <input class="set-done" aria-label="Serie completada" type="checkbox">
    </div>`).join("")}
  </div>`).join("");

 $("#coreList").innerHTML=workout.core.map((c,i)=>`
  <div class="core-card" data-core="${i}">
   <h3>${i+1}. ${c[0]}</h3>
   <div class="target">${c[1]} series · ${c[2]}</div>
   ${c[3]?`<p class="muted">${c[3]}</p>`:""}
   <div class="core-meta">
    <label>Series realizadas<input class="core-sets" type="number" min="0" max="${c[1]}" value="${c[1]}"></label>
    <label>Dificultad<input class="core-rpe" type="number" min="1" max="10" value="6"></label>
   </div>
   <label class="core-done"><input class="core-check" type="checkbox"> Ejercicio completado</label>
  </div>`).join("");
}

function readWorkoutData(){
 const s=settings(), workout=WORKOUTS[s.currentDay-1];
 let volume=0, completedSets=0, totalSets=0;
 const exercises=[...document.querySelectorAll(".exercise")].map((card,i)=>{
  const sets=[...card.querySelectorAll(".set-row")].map(row=>{
   const weight=+row.querySelector(".set-weight").value||0;
   const reps=+row.querySelector(".set-reps").value||0;
   const done=row.querySelector(".set-done").checked;
   totalSets++; if(done){completedSets++;volume+=weight*reps}
   return {weight,reps,done};
  });
  return {name:workout.ex[i][0],sets};
 });
 const core=[...document.querySelectorAll(".core-card")].map((card,i)=>({
  name:workout.core[i][0],
  sets:+card.querySelector(".core-sets").value||0,
  difficulty:+card.querySelector(".core-rpe").value||0,
  done:card.querySelector(".core-check").checked
 }));
 return {exercises,core,volume,completedSets,totalSets,coreCompleted:core.every(x=>x.done)};
}

function advanceProgram(){
 const s=settings();
 if(s.currentDay<DAYS_PER_WEEK)s.currentDay++;
 else if(s.currentWeek<TOTAL_WEEKS){s.currentWeek++;s.currentDay=1}
 set("p85_settings",s);
}

function calculateReadiness(){
 const energy=+$("#energy").value,sleep=+$("#sleep").value,pain=+$("#pain").value;
 const score=Math.max(20,Math.round((energy*4)+(sleep*4)+((10-pain)*2)));
 $("#energyTxt").textContent=energy;$("#sleepTxt").textContent=sleep;$("#painTxt").textContent=pain;
 const a=$("#readinessAdvice");
 if(pain>=4||score<50){a.className="advice danger";a.textContent="Reduce claramente la sesión. Evita el ejercicio que provoque dolor y no aumentes cargas."}
 else if(pain>=2||score<70){a.className="advice warn";a.textContent="Entrena con carga moderada y técnica estricta. No busques progresión hoy."}
 else{a.className="advice good";a.textContent="Preparación correcta: entrena con técnica y control."}
 return score;
}
["energy","sleep","pain"].forEach(id=>$("#"+id).addEventListener("input",calculateReadiness));

$("#saveSession").addEventListener("click",()=>{
 const data=readWorkoutData();
 const duration=+$("#duration").value||0,rpe=+$("#rpe").value||0;
 if(!duration||!rpe){toast("Añade duración y sensación");return}
 const sess={
  date:todayISO(),programLabel:programLabel(),workoutName:WORKOUTS[settings().currentDay-1].name,
  duration,rpe,pain:+$("#pain").value,painAfter:+$("#painAfter").value,
  energy:+$("#energy").value,sleep:+$("#sleep").value,
  cardio:+$("#cardio").value||0,cardioType:$("#cardioType").value,
  cardioDistance:+$("#cardioDistance").value||0,avgHr:+$("#avgHr").value||0,
  coreDifficulty:+$("#coreDifficulty").value||0,notes:$("#notes").value.trim(),...data
 };
 const arr=get("p85_sessions",[]);arr.unshift(sess);set("p85_sessions",arr);
 advanceProgram();renderWorkout();updateDashboard();renderHistory();
 ["duration","rpe","cardioDistance","avgHr","notes"].forEach(id=>$("#"+id).value="");
 $("#cardio").value=20;$("#pain").value=0;$("#painAfter").value=0;calculateReadiness();
 toast("Entrenamiento guardado. Avanzamos al siguiente día.");
 setTimeout(()=>go("inicio"),700);
});

$("#saveMeasures").addEventListener("click",()=>{
 const obj={date:todayISO(),weight:+$("#weight").value,bodyFat:+$("#bodyFat").value,muscleMass:+$("#muscleMass").value,waist:+$("#waist").value,chest:+$("#chest").value,hip:+$("#hip").value};
 const arr=get("p85_measures",[]);arr.unshift(obj);set("p85_measures",arr);
 renderMeasures();drawChart();updateDashboard();toast("Medidas guardadas");
});

function renderMeasures(){
 const arr=get("p85_measures",[]);
 $("#measureHistory").innerHTML=arr.map(x=>`<div class="history"><div class="history-head"><h3>${formatDate(x.date)}</h3><span class="badge">${x.weight} kg</span></div><p>Grasa ${x.bodyFat??"-"}% · Músculo ${x.muscleMass??"-"} kg</p><p class="muted">Cintura ${x.waist} · Pecho ${x.chest} · Cadera ${x.hip} cm</p></div>`).join("");
}

function drawChart(){
 const c=$("#weightChart"),ctx=c.getContext("2d"),arr=[...get("p85_measures",[])].reverse();
 const vals=arr.map(x=>+x.weight).filter(Boolean);
 ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#09130f";ctx.fillRect(0,0,c.width,c.height);
 if(!vals.length)return;
 const pad=45,min=Math.min(...vals)-1,max=Math.max(...vals)+1;
 ctx.strokeStyle="#26372f";ctx.lineWidth=1;
 for(let i=0;i<4;i++){const y=pad+i*(c.height-pad*2)/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(c.width-pad,y);ctx.stroke()}
 ctx.strokeStyle="#43d17d";ctx.lineWidth=5;ctx.beginPath();
 vals.forEach((v,i)=>{const x=pad+i*(c.width-pad*2)/Math.max(1,vals.length-1),y=c.height-pad-(v-min)/(max-min)*(c.height-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.stroke();ctx.fillStyle="#f5f8f6";ctx.font="22px -apple-system";ctx.fillText(vals.at(-1).toFixed(1)+" kg",pad,30);
}

function renderHistory(){
 const arr=get("p85_sessions",[]);
 let mins=0,cardio=0,core=0,volume=0;
 arr.forEach(x=>{mins+=+x.duration||0;cardio+=+x.cardio||0;core+=x.coreCompleted?1:0;volume+=+x.volume||0});
 $("#totalTime").textContent=(mins/60).toFixed(1).replace(".",",")+" h";
 $("#totalCardio").textContent=cardio+" min";$("#coreSessions").textContent=core;
 $("#totalVolume").textContent=Math.round(volume).toLocaleString("es-ES")+" kg";
 $("#history").innerHTML=arr.map(x=>`
  <div class="history">
   <div class="history-head"><h3>${x.programLabel||formatDate(x.date)}</h3><span class="badge">${x.rpe||"-"}/10</span></div>
   <p>${x.duration||"-"} min · Cardio ${x.cardio||0} min · Core ${x.coreCompleted?"completo":"pendiente"}</p>
   <p class="muted">Molestia ${x.pain||0}→${x.painAfter??x.pain??0}/10${x.volume?` · Volumen ${Math.round(x.volume).toLocaleString("es-ES")} kg`:""}</p>
   ${x.notes?`<p>${escapeHtml(x.notes)}</p>`:""}
  </div>`).join("");
}

$("#saveHealth").addEventListener("click",()=>{
 const obj={date:todayISO(),steps:+$("#steps").value||0,sleepHours:+$("#sleepHours").value||0,restingHr:+$("#restingHr").value||0,activeCalories:+$("#activeCalories").value||0};
 const arr=get("p85_health",[]);arr.unshift(obj);set("p85_health",arr);renderHealth();toast("Datos Garmin guardados");
});
function renderHealth(){
 const arr=get("p85_health",[]);
 $("#healthHistory").innerHTML=arr.map(x=>`<div class="history"><div class="history-head"><h3>${formatDate(x.date)}</h3><span class="badge">${(+x.steps).toLocaleString("es-ES")} pasos</span></div><p>Sueño ${x.sleepHours||"-"} h · FC reposo ${x.restingHr||"-"} · ${x.activeCalories||0} kcal activas</p></div>`).join("");
}

function updateDashboard(){
 const s=settings(),sessions=get("p85_sessions",[]),measures=get("p85_measures",[]);
 $("#todayLabel").textContent=programLabel();$("#workoutDayLabel").textContent=programLabel();
 $("#todayTitle").textContent=WORKOUTS[s.currentDay-1].name.replace(/^Día \d · /,"");
 $("#todayMeta").textContent="Fuerza + core + cardio · sin saltos";
 $("#sessionCount").textContent=sessions.length;$("#homeGoal").textContent=s.goalWeight+" kg";
 if(measures[0])$("#homeWeight").textContent=String(measures[0].weight).replace(".",",")+" kg";
 const completed=(s.currentWeek-1)*5+(s.currentDay-1),pct=Math.round(completed/(TOTAL_WEEKS*5)*100);
 $("#programProgressText").textContent=`Semana ${s.currentWeek} de ${TOTAL_WEEKS}`;
 $("#programPercent").textContent=pct+"%";$("#programBar").style.width=pct+"%";
 $("#streak").textContent=calculateStreak(sessions)+" días";
 $("#readinessScore").textContent=calculateReadiness();
 $("#profileName").value=s.name;$("#goalWeight").value=s.goalWeight;$("#currentWeek").value=s.currentWeek;$("#currentDay").value=s.currentDay;
}

function calculateStreak(arr){
 const dates=[...new Set(arr.map(x=>x.date).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort().reverse();
 if(!dates.length)return 0;
 let streak=1;
 for(let i=1;i<dates.length;i++){
  const prev=new Date(dates[i-1]),cur=new Date(dates[i]);
  const diff=Math.round((prev-cur)/86400000);
  if(diff<=3)streak++;else break;
 }
 return streak;
}

$("#saveSettings").addEventListener("click",()=>{
 const s={name:$("#profileName").value.trim()||"Javier",goalWeight:+$("#goalWeight").value||90,currentWeek:Math.min(24,Math.max(1,+$("#currentWeek").value||1)),currentDay:Math.min(5,Math.max(1,+$("#currentDay").value||1))};
 set("p85_settings",s);renderWorkout();updateDashboard();toast("Ajustes guardados");
});
$("#changeDayBtn").addEventListener("click",()=>go("ajustes"));

$("#exportData").addEventListener("click",()=>{
 const data={version:"1.0",exportedAt:new Date().toISOString(),sessions:get("p85_sessions",[]),measures:get("p85_measures",[]),health:get("p85_health",[]),settings:settings()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="Proyecto85-copia-"+todayISO()+".json";a.click();URL.revokeObjectURL(a.href);
});
$("#importData").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;
 const reader=new FileReader();reader.onload=()=>{
  try{const d=JSON.parse(reader.result);if(d.sessions)set("p85_sessions",d.sessions);if(d.measures)set("p85_measures",d.measures);if(d.health)set("p85_health",d.health);if(d.settings)set("p85_settings",d.settings);renderWorkout();updateDashboard();toast("Copia restaurada")}
  catch{toast("El archivo no es válido")}
 };reader.readAsText(file);
});
$("#refreshBtn").addEventListener("click",async()=>{
 if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.update()}
 location.reload();
});

function formatDate(v){if(!v)return"-";const d=new Date(v+"T12:00:00");return isNaN(d)?v:d.toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

seed();renderWorkout();calculateReadiness();updateDashboard();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js");
