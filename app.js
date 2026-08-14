const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const APP_VERSION='10.0.1',PREFIX='p85_';
const todayISO=()=>new Date().toISOString().slice(0,10);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2);
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(PREFIX+k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(PREFIX+k,JSON.stringify(v));
const fmt=n=>finite(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const dayName=()=>['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];

const INITIAL={
 profile:{name:'Javier',initialWeight:106,goalWeight:90,currentWeek:3,currentDay:1,totalWeeks:24,restSeconds:90,version:APP_VERSION},
 measures:[
  {date:'2026-07-27',label:'Inicio',weight:106,waist:108,hip:110,chest:119,arm:34,thigh:54,calf:37,bmi:31.6,bodyFat:39.5,visceralFat:15,water:43.7,skeletalMuscle:39.1,muscleMass:63.8,protein:16.5,bmr:1755,metabolicAge:58},
  {date:'2026-08-03',label:'Semana 1',weight:105.2,waist:107,hip:109,chest:114,arm:34,thigh:55,calf:39}
 ],
 sessions:[],workoutDraft:null,workoutQueue:[],exercisePreferences:{},
 nutritionLog:[],mealRatings:[],mealSwaps:[],pantry:[],shopping:[],
 health:[],analytics:[],photos:[],reminders:[],weeklyGoals:[],
 settings:{notifications:false},goals:[],achievements:[],calendarNotes:[],favoriteExercises:[],favoriteRecipes:[],migrationBackups:[],migrationState:{},weeklyReviews:[],mealSelections:{},weeklyMenus:[],socialMeals:[],recipeFavorites:[],nutritionGoals:{protein:150,fiber:25,water:2.5},restaurantHistory:[]
};


INITIAL.nutritionFeedback = INITIAL.nutritionFeedback || [];
INITIAL.customRecipes = INITIAL.customRecipes || [];
INITIAL.recipeMedia = INITIAL.recipeMedia || {};
INITIAL.nutritionPreferences = INITIAL.nutritionPreferences || {avoidRepetition:true,variety:true};
INITIAL.batchPlans = INITIAL.batchPlans || [];
INITIAL.foodHistory = INITIAL.foodHistory || [];
INITIAL.nutritionCheckins = INITIAL.nutritionCheckins || [];
INITIAL.socialMeals = INITIAL.socialMeals || [];
INITIAL.weeklyMenus = INITIAL.weeklyMenus || [];
INITIAL.mealSelections = INITIAL.mealSelections || {};
INITIAL.recipeFavorites = INITIAL.recipeFavorites || [];


INITIAL.hydrationLog = INITIAL.hydrationLog || [];
INITIAL.outOfHomeHistory = INITIAL.outOfHomeHistory || [];
INITIAL.nutritionWeeklyReports = INITIAL.nutritionWeeklyReports || [];
INITIAL.nutritionEducationSeen = INITIAL.nutritionEducationSeen || [];
INITIAL.nutritionPlanRules = INITIAL.nutritionPlanRules || {avoidAggressiveCuts:true,useMultiweekTrend:true};


INITIAL.lockedWeeklyMenu = INITIAL.lockedWeeklyMenu || null;
INITIAL.bodyDataWarnings = INITIAL.bodyDataWarnings || [];

function migrate(){
 const oldSettings=get('settings',{});
 const profile={...INITIAL.profile,...oldSettings,...get('profile',{})};
 profile.initialWeight=finite(profile.initialWeight,106);
 profile.goalWeight=finite(profile.goalWeight,90);
 profile.currentWeek=clamp(Math.trunc(finite(profile.currentWeek,3)),1,24);
 profile.currentDay=clamp(Math.trunc(finite(profile.currentDay,1)),1,5);
 profile.totalWeeks=Math.max(profile.currentWeek,Math.trunc(finite(profile.totalWeeks,24)));
 profile.version=APP_VERSION;set('profile',profile);
 Object.entries(INITIAL).forEach(([k,v])=>{if(k!=='profile'&&localStorage.getItem(PREFIX+k)===null)set(k,v)});
 let ms=get('measures',[]);
 if(!Array.isArray(ms))ms=[];
 INITIAL.measures.forEach(base=>{if(!ms.some(x=>x.date===base.date))ms.push(base)});
 ms.sort((a,b)=>a.date.localeCompare(b.date));set('measures',ms);
 dedupeQueue();
}
function store(k){return get(k,structuredClone(INITIAL[k]??null))}
function save(k,v){set(k,v)}
function profile(){return {...INITIAL.profile,...store('profile')}}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function openModal(title,body){$('#modalTitle').innerHTML=title;$('#modalBody').innerHTML=body;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false')}
function closeModal(){$('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true')}
$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target===$('#modal'))closeModal()};


const MIGRATION_TARGET='10.0.1';
const LEGACY_KEYS=[
 'settings','profile','sessions','health','measures','pantry','shopping','analytics',
 'reminders','nutritionLog','workoutQueue','workoutDraft','exercisePreferences',
 'mealRatings','mealSwaps','photos','goals','achievements','calendarNotes'
];

function rawLocalStorageSnapshot(){
 const snap={createdAt:new Date().toISOString(),targetVersion:MIGRATION_TARGET,items:{}};
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);
  if(key&&key.startsWith(PREFIX))snap.items[key]=localStorage.getItem(key);
 }
 return snap;
}

function saveAutomaticMigrationBackup(){
 const existing=get('migrationBackups',[]);
 if(existing.some(x=>x.targetVersion===MIGRATION_TARGET))return existing.find(x=>x.targetVersion===MIGRATION_TARGET);
 const backup=rawLocalStorageSnapshot();
 existing.unshift(backup);
 while(existing.length>3)existing.pop();
 set('migrationBackups',existing);
 return backup;
}

function normalizeArray(value){
 return Array.isArray(value)?value:[];
}

function uniqueBy(items,keyFn){
 const map=new Map();
 items.forEach(item=>{
  if(!item)return;
  const key=keyFn(item);
  const previous=map.get(key);
  if(!previous||String(item.updatedAt||item.date||item.createdAt||'')>=String(previous.updatedAt||previous.date||previous.createdAt||'')){
   map.set(key,item);
  }
 });
 return [...map.values()];
}

function migrateLegacyData(){
 const state=get('migrationState',{});
 if(state.completedVersion===MIGRATION_TARGET)return state;

 saveAutomaticMigrationBackup();
 const report={version:MIGRATION_TARGET,startedAt:new Date().toISOString(),imported:{},warnings:[]};

 // Perfil/configuración antigua
 const legacySettings=get('settings',{});
 const legacyProfile=get('profile',{});
 const p={
  ...INITIAL.profile,
  ...legacySettings,
  ...legacyProfile,
  initialWeight:finite(legacyProfile.initialWeight??legacySettings.initialWeight??legacySettings.currentWeight,106),
  goalWeight:finite(legacyProfile.goalWeight??legacySettings.goalWeight,90),
  currentWeek:clamp(Math.trunc(finite(legacyProfile.currentWeek??legacySettings.currentWeek,3)),1,24),
  currentDay:clamp(Math.trunc(finite(legacyProfile.currentDay??legacySettings.currentDay,1)),1,5),
  totalWeeks:Math.max(24,Math.trunc(finite(legacyProfile.totalWeeks??legacySettings.totalWeeks,24))),
  version:MIGRATION_TARGET
 };
 save('profile',p);
 report.imported.profile=1;

 // Medidas: normalizar nombres antiguos
 let measures=normalizeArray(get('measures',[])).map(x=>({
  ...x,
  date:x.date||todayISO(),
  weight:finite(x.weight??x.currentWeight??x.peso,0)||undefined,
  waist:finite(x.waist??x.cintura,0)||undefined,
  hip:finite(x.hip??x.cadera,0)||undefined,
  chest:finite(x.chest??x.pecho,0)||undefined,
  arm:finite(x.arm??x.brazo,0)||undefined,
  thigh:finite(x.thigh??x.muslo,0)||undefined,
  calf:finite(x.calf??x.gemelo,0)||undefined,
  bodyFat:finite(x.bodyFat??x.grasa,0)||undefined,
  visceralFat:finite(x.visceralFat??x.visceral,0)||undefined,
  water:finite(x.water??x.agua,0)||undefined,
  skeletalMuscle:finite(x.skeletalMuscle??x.musculoEsqueletico,0)||undefined,
  muscleMass:finite(x.muscleMass??x.masaMuscular,0)||undefined
 }));
 INITIAL.measures.forEach(base=>{if(!measures.some(x=>x.date===base.date))measures.push(base)});
 measures=uniqueBy(measures,x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));
 save('measures',measures);
 report.imported.measures=measures.length;

 // Sesiones
 let sessions=normalizeArray(get('sessions',[])).map(x=>({
  ...x,
  id:x.id||uid(),
  date:x.date||todayISO(),
  week:finite(x.week,1),
  day:finite(x.day,1),
  label:x.label||x.workoutName||x.programLabel||'Entrenamiento',
  duration:finite(x.duration,0),
  rpe:finite(x.rpe,0),
  completed:finite(x.completed,0),
  total:finite(x.total,0),
  volume:finite(x.volume,0),
  exercises:normalizeArray(x.exercises||x.ex),
  core:normalizeArray(x.core)
 }));
 sessions=uniqueBy(sessions,x=>x.id||`${x.date}-${x.week}-${x.day}-${x.label}`);
 save('sessions',sessions);
 report.imported.sessions=sessions.length;

 // Cola de pendientes, deduplicada por semana/día
 let queue=normalizeArray(get('workoutQueue',[])).map(x=>({
  ...x,id:x.id||`${finite(x.week,1)}-${finite(x.day,1)}`,
  week:finite(x.week,1),day:finite(x.day,1),status:x.status||'pending'
 }));
 queue=uniqueBy(queue,x=>`${x.week}-${x.day}`);
 save('workoutQueue',queue);
 report.imported.pendingWorkouts=queue.length;

 // Borrador actual
 const draft=get('workoutDraft',null);
 if(draft&&typeof draft==='object'){
  if(!Array.isArray(draft.ex)&&Array.isArray(draft.exercises))draft.ex=draft.exercises;
  save('workoutDraft',draft);
  report.imported.workoutDraft=1;
 }else report.imported.workoutDraft=0;

 // Resto de colecciones
 const collections=['health','pantry','shopping','analytics','reminders','nutritionLog','exercisePreferences','mealRatings','mealSwaps','photos','goals','achievements','calendarNotes'];
 collections.forEach(k=>{
  const value=get(k,INITIAL[k]??[]);
  if(Array.isArray(value)){
   const normalized=uniqueBy(value,x=>x.id||`${x.date||''}-${x.name||x.type||x.label||JSON.stringify(x)}`);
   save(k,normalized);
   report.imported[k]=normalized.length;
  }else if(value&&typeof value==='object'){
   save(k,value);
   report.imported[k]=Object.keys(value).length;
  }
 });

 report.finishedAt=new Date().toISOString();
 report.completedVersion=MIGRATION_TARGET;
 set('migrationState',report);
 return report;
}

function migrationReportMarkup(report){
 const labels={
  profile:'Perfil',measures:'Controles corporales',sessions:'Entrenamientos',
  pendingWorkouts:'Entrenamientos pendientes',workoutDraft:'Sesión en curso',
  health:'Registros de salud',pantry:'Productos en despensa',shopping:'Lista de compra',
  analytics:'Parámetros de analíticas',reminders:'Recordatorios',nutritionLog:'Registros nutricionales',
  exercisePreferences:'Preferencias de ejercicios',mealRatings:'Valoraciones de platos',
  mealSwaps:'Sustituciones de comidas',photos:'Registros fotográficos',goals:'Objetivos',
  achievements:'Logros',calendarNotes:'Notas de calendario'
 };
 return `<div class="migration-summary">
   <p>Se ha creado una copia automática de los datos anteriores antes de realizar la migración.</p>
   ${Object.entries(report.imported||{}).map(([k,v])=>`<div class="migration-row"><span>${labels[k]||k}</span><b>${v}</b></div>`).join('')}
   ${report.warnings?.length?`<div class="warning-box">${report.warnings.map(x=>`<p>${x}</p>`).join('')}</div>`:''}
   <p class="note">La copia automática queda guardada en este dispositivo. También puedes exportar una copia manual desde Más → Ajustes.</p>
 </div>`;
}

function runMigrationAndNotify(){
 const previous=get('migrationState',{});
 const report=migrateLegacyData();
 if(previous.completedVersion!==MIGRATION_TARGET){
  setTimeout(()=>openModal(
   `<span class="eyebrow">MIGRACIÓN COMPLETADA</span><h2>Proyecto85 actualizado</h2>`,
   migrationReportMarkup(report)
  ),500);
 }
}


const RELEASE_CHANNEL='stable';
const BUILD_ID='2026-08-04-v6';

function versionInfo(){
 return {version:APP_VERSION,build:BUILD_ID,channel:RELEASE_CHANNEL};
}
async function hardRefresh(){
 try{
  if('serviceWorker' in navigator){
   const regs=await navigator.serviceWorker.getRegistrations();
   for(const reg of regs) await reg.unregister();
  }
  if('caches' in window){
   const keys=await caches.keys();
   await Promise.all(keys.map(k=>caches.delete(k)));
  }
  localStorage.setItem(PREFIX+'lastHardRefresh',new Date().toISOString());
  location.replace('./index.html?v='+Date.now());
 }catch(e){
  location.reload();
 }
}
function renderVersionBadge(){
 const badge=document.getElementById('versionBadge');
 if(badge)badge.textContent='V'+APP_VERSION;
}
function updateAppShell(){
 renderVersionBadge();
 localStorage.setItem(PREFIX+'versionInfo',JSON.stringify(versionInfo()));
}


const VERSION_CHECK_INTERVAL=15*60*1000;
let updateCheckTimer=null;

function compareVersions(a,b){
 const pa=String(a||'0').split('.').map(n=>parseInt(n,10)||0);
 const pb=String(b||'0').split('.').map(n=>parseInt(n,10)||0);
 for(let i=0;i<Math.max(pa.length,pb.length);i++){
  const diff=(pa[i]||0)-(pb[i]||0);
  if(diff!==0)return diff;
 }
 return 0;
}

async function fetchPublishedVersion(){
 const response=await fetch(`./version.json?t=${Date.now()}`,{cache:'no-store'});
 if(!response.ok)throw new Error('No se pudo consultar la versión publicada');
 return response.json();
}

function showUpdateAvailable(info){
 if(document.querySelector('.update-available-banner'))return;
 const banner=document.createElement('div');
 banner.className='update-available-banner';
 banner.innerHTML=`<div><b>Nueva versión ${info.version} disponible</b><small>${info.message||'Incluye mejoras y correcciones.'}</small></div><button class="btn primary small" id="installUpdateBtn">Actualizar ahora</button><button class="icon-btn update-dismiss" aria-label="Cerrar">×</button>`;
 document.body.appendChild(banner);
 banner.querySelector('#installUpdateBtn').onclick=()=>installPublishedUpdate(info.version);
 banner.querySelector('.update-dismiss').onclick=()=>banner.remove();
}

async function checkForAppUpdate({silent=true}={}){
 try{
  const info=await fetchPublishedVersion();
  localStorage.setItem(PREFIX+'lastVersionCheck',new Date().toISOString());
  if(compareVersions(info.version,APP_VERSION)>0){
   showUpdateAvailable(info);
   return true;
  }
  if(!silent)toast(`Proyecto85 ${APP_VERSION} está actualizado`);
  return false;
 }catch(error){
  if(!silent)toast('No se pudo comprobar la actualización');
  return false;
 }
}

async function installPublishedUpdate(targetVersion){
 try{
  const button=document.getElementById('installUpdateBtn');
  if(button){button.disabled=true;button.textContent='Actualizando…'}
  // Los datos p85_* se mantienen en localStorage. Solo se eliminan archivos en caché.
  if('serviceWorker' in navigator){
   const regs=await navigator.serviceWorker.getRegistrations();
   for(const reg of regs){
    if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
    await reg.unregister();
   }
  }
  if('caches' in window){
   const keys=await caches.keys();
   await Promise.all(keys.map(key=>caches.delete(key)));
  }
  localStorage.setItem(PREFIX+'requestedVersion',targetVersion||'latest');
  location.replace(`./index.html?v=${encodeURIComponent(targetVersion||Date.now())}&updated=${Date.now()}`);
 }catch(error){
  toast('No se pudo completar la actualización');
 }
}

function startAutomaticUpdateChecks(){
 checkForAppUpdate({silent:true});
 if(updateCheckTimer)clearInterval(updateCheckTimer);
 updateCheckTimer=setInterval(()=>checkForAppUpdate({silent:true}),VERSION_CHECK_INTERVAL);
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')checkForAppUpdate({silent:true});
 });
}

const GUIDES={
 'Prensa':['Cuádriceps, glúteos e isquiotibiales',['Espalda y cadera apoyadas','Pies al ancho de hombros','Baja sin despegar la pelvis','Empuja sin bloquear rodillas'],['Rodillas hacia dentro','Rebotar abajo','Carga excesiva']],
 'Curl femoral':['Isquiotibiales',['Ajusta el rodillo','Cadera apoyada','Flexiona con control','Vuelve lentamente'],['Levantar la cadera','Usar impulso','Soltar la bajada']],
 'Jalón al pecho':['Dorsal y bíceps',['Pecho alto','Codos hacia abajo','Barra a la parte alta del pecho','Regreso lento'],['Balancearse','Tirar tras la nuca','Encoger hombros']],
 'Remo máquina':['Espalda media y dorsal',['Pecho estable','Tira con los codos','Junta escápulas','Regresa con control'],['Impulso','Cuello adelantado','Hombros elevados']],
 'Press pecho máquina':['Pectoral, tríceps y hombro',['Escápulas apoyadas','Empuja sin bloquear','Muñecas neutras','Baja controlada'],['Hombros adelantados','Rebotar','Arquear demasiado']],
 'Press inclinado máquina':['Pectoral superior y tríceps',['Ajusta asiento','Pecho elevado','Empuja en línea','Baja controlada'],['Codos demasiado abiertos','Despegar espalda','Carga excesiva']],
 'Press hombro máquina':['Deltoides y tríceps',['Espalda apoyada','Abdomen activo','Empuja sin encoger','Rango cómodo'],['Arquear lumbar','Bajar demasiado','Empuje desigual']],
 'Elevaciones laterales':['Deltoide lateral',['Codos flexionados','Eleva hasta hombro','Tronco quieto','Baja lento'],['Balanceo','Subir demasiado','Encoger hombros']],
 'Face Pull':['Deltoide posterior y espalda alta',['Polea a la cara','Separa manos','Codos altos cómodos','Aprieta escápulas'],['Arquear espalda','Tirar al pecho','Demasiado peso']],
 'Peck Deck':['Pectoral',['Espalda apoyada','Codos alineados','Cierra con control','Abre sin forzar'],['Estirar de más','Despegar espalda','Golpear placas']],
 'Curl bíceps':['Bíceps',['Codos quietos','Sube sin balanceo','Aprieta arriba','Baja lento'],['Mover hombros','Balancear tronco','Soltar bajada']],
 'Tríceps polea':['Tríceps',['Codos pegados','Extiende abajo','Muñecas neutras','Regresa controlado'],['Abrir codos','Balanceo','Mover hombros']],
 'Extensión cuádriceps':['Cuádriceps',['Alinea rodilla y eje','Extiende sin golpe','Aprieta arriba','Baja lento'],['Movimiento brusco','Despegar cadera','Carga excesiva']],
 'Abducción cadera':['Glúteo medio',['Espalda apoyada','Abre controlado','Pausa breve','Cierra lento'],['Rebotar','Cerrar de golpe','Arquear espalda']],
 'Crunch en máquina':['Recto abdominal',['Ajusta rango cómodo','Acerca costillas y pelvis','Exhala al contraer','Regresa con control'],['Tirar con cuello','Recorrido excesivo','Carga que provoque calambre']],
 'Rotación tronco máquina':['Oblicuos',['Rango corto','Pelvis estable','Rota lento','Ambos lados'],['Impulso','Rango excesivo','Mover caderas']],
 'Extensión lumbar máquina':['Zona lumbar y glúteos',['Columna neutra','Extiende hasta alineación','Movimiento lento','Carga moderada'],['Hiperextender','Movimiento rápido','Carga excesiva']],
 'Pallof press':['Core antirotación',['Lateral a polea','Pelvis estable','Extiende brazos','No gires'],['Rotar','Arquear espalda','Carga excesiva']]
};
function guide(name){return GUIDES[name]||['Grupo muscular principal',['Ajusta la máquina','Mantén postura estable','Movimiento lento','Rango sin dolor'],['Impulso','Carga excesiva','Dolor durante el movimiento']]}

const WORKOUTS=[
 {name:'Full Body A',focus:'Base de fuerza y técnica',ex:[['Prensa',3,10,52],['Curl femoral',3,10,39],['Jalón al pecho',3,10,45],['Remo máquina',3,10,32],['Press pecho máquina',3,10,32],['Elevaciones laterales',3,15,7],['Curl bíceps',3,12,10],['Tríceps polea',3,12,15.9]],core:[['Crunch en máquina',3,12],['Rotación tronco máquina',3,12],['Extensión lumbar máquina',3,12]],cardio:['Cinta progresiva',25,'5 min suave + 15 min inclinación moderada + 5 min suave']},
 {name:'Full Body B',focus:'Espalda, piernas y estabilidad',ex:[['Jalón al pecho',3,10,45],['Remo máquina',3,10,32],['Prensa',3,12,45],['Extensión cuádriceps',3,12,39],['Abducción cadera',3,15,39],['Press inclinado máquina',3,10,20],['Face Pull',3,15,15.9],['Tríceps polea',3,12,15.9]],core:[['Crunch en máquina',3,12],['Pallof press',3,12],['Extensión lumbar máquina',3,12]],cardio:['Bicicleta',28,'4 min suave + 6 bloques de 2 min vivo/2 min suave']},
 {name:'Full Body C',focus:'Control técnico y volumen',ex:[['Prensa',3,10,50],['Curl femoral',3,12,39],['Jalón al pecho',3,12,45],['Remo máquina',3,12,32],['Press hombro máquina',3,12,13],['Peck Deck',3,15,45],['Curl bíceps',3,12,10],['Tríceps polea',3,12,15.9]],core:[['Rotación tronco máquina',3,12],['Crunch en máquina',3,12],['Pallof press',3,12]],cardio:['Elíptica',30,'10 min suave + 15 min moderado + 5 min suave']},
 {name:'Full Body D',focus:'Fuerza general y progresión',ex:[['Prensa',3,10,52],['Curl femoral',3,10,42],['Jalón al pecho',3,10,50],['Remo máquina',3,10,35],['Press pecho máquina',3,10,36],['Press hombro máquina',3,12,13],['Face Pull',3,15,15.9],['Curl bíceps',3,12,13.6],['Tríceps polea',3,12,15.9]],core:[['Crunch en máquina',3,12],['Rotación tronco máquina',3,12],['Extensión lumbar máquina',3,12]],cardio:['Cinta intervalos controlados',30,'5 min suave + 6 bloques de 2 min rápido/2 min suave + 1 min suave']},
 {name:'Full Body E',focus:'Cierre semanal y trabajo completo',ex:[['Prensa',3,12,45],['Curl femoral',3,12,39],['Jalón al pecho',3,12,45],['Remo máquina',3,12,32],['Press inclinado máquina',3,12,20],['Peck Deck',3,15,45],['Elevaciones laterales',3,15,7],['Curl bíceps',3,12,10],['Tríceps polea',3,12,15.9]],core:[['Pallof press',3,12],['Crunch en máquina',3,12],['Extensión lumbar máquina',3,12]],cardio:['Exterior o cinta',35,'Ritmo cómodo-vivo continuo, sin saltos']}
];

const RECIPES={
 breakfast:[
  {id:'b1',name:'Tostada integral con pavo, fruta y café',flavor:'Mediterráneo',items:[['Pan integral',40,'g','tal como se consume'],['Pavo',70,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Café con leche desnatada',1,'taza','preparado']],alts:[['Queso fresco, tostada y fruta','80 g queso fresco + 40 g pan + fruta'],['Yogur natural, tostada de pavo y fruta','1 yogur + 40 g pan + 50 g pavo + fruta']]},
 ],
 midmorning:[
  {id:'m1',name:'Yogur natural y tostada',flavor:'Simple',items:[['Yogur natural',1,'unidad','listo'],['Pan integral',30,'g','tal como se consume']],alts:[['Queso fresco y tostada','80 g queso fresco + 30 g pan'],['Pavo y pequeña tostada','60 g pavo + 30 g pan']]},
 ],
 lunch:[
  {id:'l1',name:'Pasta mediterránea con pollo',flavor:'Mediterráneo',items:[['Pasta',70,'g','en crudo'],['Pechuga de pollo',180,'g','en crudo'],['Verduras mediterráneas',250,'g','en crudo'],['Aceite de oliva',10,'g','medido']],alts:[['Lomo con arroz y pimientos','180 g lomo + 60 g arroz crudo + 250 g verdura'],['Salmón con patata y ensalada','180 g salmón + 250 g patata cocida + ensalada'],['Merluza con arroz y verduras','200 g merluza + 60 g arroz crudo + 250 g verdura']]},
  {id:'l2',name:'Churrasco de pollo estilo argentino',flavor:'Argentino',items:[['Churrasco de pollo',200,'g','en crudo'],['Patata',250,'g','cocida'],['Ensalada',250,'g','en crudo'],['Aceite de oliva',10,'g','medido']],alts:[['Lomo con pimientos','180 g lomo + pimientos + hidrato equivalente'],['Arroz con pollo y verduras','180 g pollo + 60 g arroz crudo + verdura']]},
  {id:'l3',name:'Lomo magro con pimientos y arroz',flavor:'Español',items:[['Lomo de cerdo',180,'g','en crudo'],['Arroz integral',60,'g','en crudo'],['Pimientos',250,'g','en crudo'],['Aceite de oliva',10,'g','medido']],alts:[['Pasta mediterránea con pollo','70 g pasta cruda + 180 g pollo + verduras'],['Espinacas con garbanzos','200 g garbanzos cocidos + 250 g espinacas + proteína complementaria']]},
 ],
 snack:[
  {id:'s1',name:'Fruta y yogur',flavor:'Simple',items:[['Fruta',1,'pieza','entera'],['Yogur natural',1,'unidad','listo']],alts:[['Queso fresco y fruta','80 g queso fresco + fruta'],['Pavo y tostada','60 g pavo + 30 g pan']]},
 ],
 dinner:[
  {id:'d1',name:'Salmón a la plancha con verduras',flavor:'Mediterráneo',items:[['Salmón',180,'g','en crudo'],['Verduras o ensalada',300,'g','en crudo'],['Aceite de oliva',10,'g','medido']],alts:[['Merluza con ensalada','200 g merluza + 300 g verdura'],['Lomo magro con verduras','180 g lomo + 300 g verdura'],['Salpicón equilibrado','Ración moderada con proteína y verduras']]},
  {id:'d2',name:'Espinacas con garbanzos y proteína',flavor:'Tradicional',items:[['Garbanzos',180,'g','cocidos'],['Espinacas',250,'g','cocinadas'],['Proteína magra',120,'g','cocinada'],['Aceite de oliva',10,'g','medido']],alts:[['Atún con tomate y aguacate','2 latas atún + tomate + 50 g aguacate'],['Pollo con pimientos','180 g pollo + 300 g pimientos/verdura']]},
 ]
};
const WEEK_MENU={
 Lunes:{breakfast:'b1',midmorning:'m1',lunch:'l1',snack:'s1',dinner:'d1'},
 Martes:{breakfast:'b1',midmorning:'m1',lunch:'l2',snack:'s1',dinner:'d2'},
 Miércoles:{breakfast:'b1',midmorning:'m1',lunch:'l3',snack:'s1',dinner:'d1'},
 Jueves:{breakfast:'b1',midmorning:'m1',lunch:'l1',snack:'s1',dinner:'d2'},
 Viernes:{breakfast:'b1',midmorning:'m1',lunch:'l2',snack:'s1',dinner:'d1'},
 Sábado:{breakfast:'b1',midmorning:'m1',lunch:'l3',snack:'s1',dinner:'d2'},
 Domingo:{breakfast:'b1',midmorning:'m1',lunch:'l1',snack:'s1',dinner:'d1'}
};
const mealLabels={breakfast:'Desayuno',midmorning:'Media mañana',lunch:'Comida',snack:'Merienda',dinner:'Cena'};
function recipeById(type,id){return RECIPES[type].find(x=>x.id===id)||RECIPES[type][0]}
function activeRecipe(type){const swaps=store('mealSwaps');const today=swaps.find(x=>x.date===todayISO()&&x.type===type);const sel=store('mealSelections')||{};return today?.custom||recipeById(type,sel[todayISO()]?.[type]||WEEK_MENU[dayName()][type])}

function dedupeQueue(){
 let q=get('workoutQueue',[]);if(!Array.isArray(q))q=[];
 const map=new Map();q.forEach(x=>{const k=`${x.week}-${x.day}`;const prev=map.get(k);if(!prev||String(x.updatedAt||x.createdAt||'')>String(prev.updatedAt||prev.createdAt||''))map.set(k,x)});
 q=[...map.values()];set('workoutQueue',q);return q
}
function upsertPending(reason){
 const p=profile(),q=dedupeQueue(),i=q.findIndex(x=>x.week===p.currentWeek&&x.day===p.currentDay);
 const e={id:`${p.currentWeek}-${p.currentDay}`,week:p.currentWeek,day:p.currentDay,label:`Semana ${p.currentWeek} · Día ${p.currentDay}`,reason,status:'pending',updatedAt:new Date().toISOString()};
 if(i>=0)q[i]={...q[i],...e};else q.push({...e,createdAt:e.updatedAt});set('workoutQueue',q);renderWorkout()
}
function clearPending(week,day){set('workoutQueue',dedupeQueue().filter(x=>!(x.week===week&&x.day===day)))}

function emptyDraft(){const p=profile(),w=WORKOUTS[p.currentDay-1];return{week:p.currentWeek,day:p.currentDay,updatedAt:null,ex:w.ex.map(e=>({name:e[0],rating:'',sets:Array.from({length:e[1]},()=>({kg:e[3],reps:e[2],done:false}))})),core:w.core.map(c=>({name:c[0],done:false})),cardio:false,duration:70,rpe:8,energy:8,painBefore:0,painAfter:0,notes:''}}
function draft(){const p=profile();let d=store('workoutDraft');if(!d||d.week!==p.currentWeek||d.day!==p.currentDay||!Array.isArray(d.ex)){d=emptyDraft();save('workoutDraft',d)}return d}
function saveDraft(){
 const form=$('#workoutForm');if(!form)return;const d=draft(),w=WORKOUTS[profile().currentDay-1];
 d.updatedAt=new Date().toISOString();
 d.ex=[...form.querySelectorAll('.exercise')].map((card,i)=>({name:w.ex[i][0],rating:card.dataset.rating||'',sets:[...card.querySelectorAll('.set-row')].map(r=>({kg:finite(r.querySelector('.kg').value),reps:finite(r.querySelector('.reps').value),done:r.querySelector('.done').checked}))}));
 d.core=[...form.querySelectorAll('.coreDone')].map((x,i)=>({name:w.core[i][0],done:x.checked}));
 ['cardio','duration','rpe','energy','painBefore','painAfter','notes'].forEach(k=>{const el=$('#'+k);d[k]=el?.type==='checkbox'?el.checked:(el?.value??d[k])});
 save('workoutDraft',d);updateDraftLabel()
}
function updateDraftLabel(){const d=store('workoutDraft');if(!d)return;const sets=d.ex.flatMap(x=>x.sets),el=$('#draftLabel');if(el)el.textContent=`Autoguardado · ${sets.filter(x=>x.done).length}/${sets.length} series`}
function setRating(i,r){const card=document.querySelector(`.exercise[data-i="${i}"]`);card.dataset.rating=r;card.querySelectorAll('.rating-btn').forEach(b=>b.classList.toggle('active',b.dataset.r===r));saveDraft()}
function openGuide(name){const [muscles,steps,errors]=guide(name);openModal(`<span class="eyebrow">BIBLIOTECA</span><h2>${name}</h2>`,`<p><b>Músculos:</b> ${muscles}</p><h3>Técnica</h3><ol class="guide-list">${steps.map(x=>`<li>${x}</li>`).join('')}</ol><div class="warning-box"><h3>Evita</h3><ul class="guide-list">${errors.map(x=>`<li>${x}</li>`).join('')}</ul></div><p class="note">Detén el ejercicio si aparece dolor nuevo o intenso.</p>`)}
function finishWorkout(){
 saveDraft();const p=profile(),w=WORKOUTS[p.currentDay-1],d=draft(),sets=d.ex.flatMap(x=>x.sets),sessions=store('sessions');
 sessions.unshift({id:uid(),date:todayISO(),week:p.currentWeek,day:p.currentDay,label:w.name,duration:finite(d.duration),rpe:finite(d.rpe),energy:finite(d.energy),painBefore:finite(d.painBefore),painAfter:finite(d.painAfter),notes:d.notes,cardio:!!d.cardio,core:d.core,exercises:d.ex,completed:sets.filter(x=>x.done).length,total:sets.length,volume:sets.filter(x=>x.done).reduce((a,x)=>a+finite(x.kg)*finite(x.reps),0)});
 save('sessions',sessions);const prefs=store('exercisePreferences');d.ex.forEach(x=>{if(x.rating)prefs[x.name]={rating:x.rating,date:todayISO()}});save('exercisePreferences',prefs);clearPending(p.currentWeek,p.currentDay);save('workoutDraft',null);
 if(p.currentDay<5)p.currentDay++;else{p.currentDay=1;p.currentWeek=Math.min(p.totalWeeks,p.currentWeek+1)}save('profile',p);toast('Entrenamiento guardado');renderWorkout()
}

function go(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));render(id);scrollTo({top:0,behavior:'smooth'})}
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function render(id){({inicio:renderHome,entrenamiento:renderWorkout,nutricion:renderNutrition,evolucion:renderEvolution,mas:renderMore})[id]?.()}

function latestMeasure(){return [...store('measures')].sort((a,b)=>b.date.localeCompare(a.date))[0]||INITIAL.measures[0]}
function readiness(){const h=store('health').find(x=>x.date===todayISO());return h?clamp(Math.round((finite(h.energy,7)+finite(h.sleep,7))*5-finite(h.pain)*4),20,100):78}
function recommendations(){
 const out=[],m=latestMeasure(),sessions=store('sessions'),ratings=store('mealRatings'),q=dedupeQueue();
 if(q.length)out.push(`Tienes ${q.length} entrenamiento pendiente. Recupera el más antiguo sin duplicarlo.`);
 if(new Date().getDay()===1&&!store('measures').some(x=>x.date===todayISO()))out.push('Hoy es lunes: realiza el control completo de peso, medidas y composición corporal.');
 const recent=sessions.slice(0,3);if(recent.length&&recent.some(x=>finite(x.painAfter)>=4))out.push('Hay molestias elevadas recientes. Mantén o reduce cargas y revisa la técnica.');
 if(ratings.filter(x=>x.score>=9).length)out.push('Tus platos mejor valorados se priorizarán en las próximas planificaciones.');
 if(m.weight>profile().goalWeight)out.push(`Faltan ${fmt(m.weight-profile().goalWeight)} kg para el objetivo. Mantén el déficit moderado y la fuerza.`);
 return out.length?out:['El plan está al día. Registra entrenamiento, comidas y salud para generar recomendaciones más precisas.']
}
function renderHome(){
 const p=profile(),m=latestMeasure(),w=WORKOUTS[p.currentDay-1],q=dedupeQueue(),doneMeals=store('nutritionLog').filter(x=>x.date===todayISO()&&x.done).length;
 $('#inicio').innerHTML=`<div class="banner"><b>Base definitiva V6</b><p class="muted">Entrenamiento, nutrición, salud, evolución, compras y asistente integrados.</p></div><div class="card hero"><div class="hero-grid"><div><span class="eyebrow">SEMANA ${p.currentWeek} · DÍA ${p.currentDay}</span><h2>${w.name}</h2><p class="muted">${w.focus} · core en máquina · cardio progresivo</p></div><div class="score">${readiness()}<small>Preparación</small></div></div></div>
 ${q.length?`<div class="banner warn"><b>${q.length} sesión pendiente</b><p>La cola está limpia: un único pendiente por semana y día.</p><button class="btn small" onclick="go('entrenamiento')">Gestionar</button></div>`:''}
 <div class="grid-2"><div class="stat"><span>Peso inicial</span><strong>106,0 kg</strong></div><div class="stat"><span>Peso actual</span><strong>${fmt(m.weight)} kg</strong></div><div class="stat"><span>Objetivo</span><strong>90,0 kg</strong></div><div class="stat"><span>Evolución</span><strong>-${fmt(106-m.weight)} kg</strong></div></div>
 <div class="card"><div class="section-title"><h2>Mi día</h2><span class="pill">${dayName()}</span></div>
 <div class="task"><div><b>Entrenamiento</b><div class="muted">${w.name} · ${w.cardio[1]} min cardio</div></div><button class="btn small primary" onclick="go('entrenamiento')">Abrir</button></div>
 <div class="task"><div><b>Nutrición</b><div class="muted">${doneMeals}/5 comidas completadas</div></div><button class="btn small" onclick="go('nutricion')">Menú</button></div>
 <div class="task"><div><b>Control semanal</b><div class="muted">${new Date().getDay()===1?'Hoy toca medir':'Todos los lunes'}</div></div><button class="btn small" onclick="go('evolucion')">Evolución</button></div></div>
 ${assistantPanel()}<div class="card"><h3>Asistente Proyecto85</h3>${recommendations().map(x=>`<div class="assistant-item">${x}</div>`).join('')}</div>`;
}

function renderWorkout(){
 const p=profile(),w=WORKOUTS[p.currentDay-1],d=draft(),q=dedupeQueue(),sets=d.ex.flatMap(x=>x.sets);
 $('#entrenamiento').innerHTML=`<div class="section-title"><div><span class="eyebrow">SEMANA ${p.currentWeek} · DÍA ${p.currentDay}</span><h2>${w.name}</h2><p class="muted">${w.focus}</p></div><span id="draftLabel" class="pill blue">Autoguardado · ${sets.filter(x=>x.done).length}/${sets.length} series</span></div>
 <div class="card"><h3>Horario flexible</h3><p class="muted">Puedes continuar por la tarde o recuperar mañana. El mismo entrenamiento nunca se duplicará.</p><div class="btn-row"><button class="btn primary" onclick="toast('Sesión lista y autoguardada')">Comenzar/continuar</button><button class="btn" onclick="upsertPending('Esta tarde')">Esta tarde</button><button class="btn secondary" onclick="upsertPending('Mañana')">Mañana</button></div></div>
 ${q.map(x=>`<div class="banner"><b>Pendiente: ${x.label}</b><p>${x.reason}</p><button class="btn small" onclick="clearPending(${x.week},${x.day});renderWorkout()">Marcar recuperado</button></div>`).join('')}
 <div id="workoutForm">
 <div class="card"><h3>Fuerza · cuerpo completo</h3>${w.ex.map((e,i)=>{const de=d.ex[i];return `<div class="exercise" data-i="${i}" data-rating="${de.rating||''}"><div class="exercise-head"><div><h3>${i+1}. ${e[0]}</h3><span class="muted">${e[1]} × ${e[2]} · referencia ${e[3]} kg</span></div><button class="guide-btn" type="button" onclick="openGuide('${e[0]}')">? Técnica</button></div>${de.sets.map((s,j)=>`<div class="set-row"><b>${j+1}</b><input class="kg" type="number" step=".1" value="${s.kg}"><input class="reps" type="number" value="${s.reps}"><input class="done" type="checkbox" ${s.done?'checked':''}></div>`).join('')}<div class="rating-row"><span>Próxima vez:</span>${[['ok','✓ OK'],['up','↑ Subir'],['down','↓ Bajar']].map(x=>`<button type="button" data-r="${x[0]}" class="rating-btn ${de.rating===x[0]?'active':''}" onclick="setRating(${i},'${x[0]}')">${x[1]}</button>`).join('')}</div></div>`}).join('')}</div>
 <div class="card"><h3>Core en máquinas y poleas</h3>${w.core.map((c,i)=>`<div class="task"><label class="check"><input class="coreDone" type="checkbox" ${d.core[i]?.done?'checked':''}><span><b>${c[0]}</b><small class="muted">${c[1]} × ${c[2]}</small></span></label><button class="guide-btn" type="button" onclick="openGuide('${c[0]}')">? Técnica</button></div>`).join('')}</div>
 <div class="card"><h3>Cardio progresivo</h3><b>${w.cardio[0]} · ${w.cardio[1]} min</b><p class="muted">${w.cardio[2]}</p><label class="check"><input id="cardio" type="checkbox" ${d.cardio?'checked':''}> Cardio completado</label></div>
 <div class="card"><div class="form-grid"><label>Duración<input id="duration" type="number" value="${d.duration}"></label><label>Sensación<input id="rpe" type="number" step=".1" value="${d.rpe}"></label><label>Energía<input id="energy" type="number" value="${d.energy}"></label><label>Dolor antes<input id="painBefore" type="number" value="${d.painBefore}"></label><label>Dolor después<input id="painAfter" type="number" value="${d.painAfter}"></label><label class="wide">Notas<textarea id="notes">${d.notes||''}</textarea></label></div><button class="btn primary" onclick="finishWorkout()">Guardar entrenamiento</button></div></div>`;
 const form=$('#workoutForm');form.addEventListener('input',saveDraft);form.addEventListener('change',saveDraft)
}

function recipeCard(type){
 const r=activeRecipe(type),log=store('nutritionLog').find(x=>x.date===todayISO()&&x.type===type),rating=store('mealRatings').find(x=>x.date===todayISO()&&x.mealId===r.id)?.score;
 return `<div class="meal-card"><div class="meal-head"><div><span class="eyebrow">${mealLabels[type]}</span><h3>${r.name}</h3><span class="pill">${r.flavor}</span></div><button class="btn small" onclick="showAlternatives('${type}')">Cambiar comida</button></div><ul class="meal-items">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>Peso: ${x[3]}</small></li>`).join('')}</ul><label class="check"><input type="checkbox" ${log?.done?'checked':''} onchange="toggleMeal('${type}',this.checked)"> Comida realizada</label><div class="rating-row"><span>Puntuación:</span>${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="score-btn ${rating===n?'active':''}" onclick="rateMeal('${r.id}',${n});renderNutrition()">${n}</button>`).join('')}</div></div>`
}
function showAlternatives(type){const r=activeRecipe(type);openModal(`<span class="eyebrow">SUSTITUCIÓN EQUIVALENTE</span><h2>${mealLabels[type]}</h2>`,`<p class="muted">Elige una alternativa cuando no tengas el alimento previsto. Se conservará el equilibrio general del plato.</p><div class="alt-grid">${r.alts.map((a,i)=>`<button class="alt-btn" onclick="swapMeal('${type}',${i})"><b>${a[0]}</b><small>${a[1]}</small></button>`).join('')}</div>`)}
function swapMeal(type,i){const r=activeRecipe(type),a=r.alts[i],sw=store('mealSwaps').filter(x=>!(x.date===todayISO()&&x.type===type));sw.unshift({date:todayISO(),type,original:r.name,custom:{id:'custom-'+uid(),name:a[0],flavor:'Sustitución',items:[[a[1],1,'ración','según equivalencia']],alts:r.alts}});save('mealSwaps',sw);closeModal();toast('Comida cambiada');renderNutrition()}
function toggleMeal(type,done){let l=store('nutritionLog'),i=l.findIndex(x=>x.date===todayISO()&&x.type===type);const e={date:todayISO(),type,done};if(i>=0)l[i]=e;else l.push(e);save('nutritionLog',l)}
function rateMeal(id,score){let r=store('mealRatings').filter(x=>!(x.date===todayISO()&&x.mealId===id));r.unshift({date:todayISO(),mealId:id,score});save('mealRatings',r);toast(score>=9?'Añadido a favoritos':'Puntuación guardada')}
function generateV8Shopping(){
 const needed={};Object.keys(WEEK_MENU).forEach(day=>Object.entries(WEEK_MENU[day]).forEach(([type,id])=>recipeById(type,id).items.forEach(x=>{const k=x[0];if(!needed[k])needed[k]={name:k,qty:0,unit:x[2],category:type};needed[k].qty+=finite(x[1])})));
 const pantry=store('pantry');const list=Object.values(needed).map(x=>{const have=pantry.find(p=>p.name===x.name);return{...x,have:finite(have?.qty),buy:Math.max(0,x.qty-finite(have?.qty)),owned:false,bought:false}});
 save('shopping',list);renderShopping()
}
function renderShopping(){
 const list=store('shopping');$('#shoppingArea').innerHTML=list.length?list.map((x,i)=>`<div class="shopping-row"><input type="checkbox" ${x.bought?'checked':''} onchange="shopUpdate(${i},'bought',this.checked)"><div><b>${x.name}</b><small class="muted">Necesario ${Math.round(x.qty)} ${x.unit} · tienes ${x.have||0}</small></div><button class="btn small ${x.owned?'primary':''}" onclick="shopUpdate(${i},'owned',!${x.owned})">${x.owned?'Ya tengo':'Tengo en casa'}</button></div>`).join(''):'<p class="muted">Genera la lista desde el menú semanal.</p>'
}
function shopUpdate(i,k,v){const l=store('shopping');l[i][k]=v;save('shopping',l);renderShopping()}
function addPantry(){const name=$('#pantryName').value.trim(),qty=finite($('#pantryQty').value);if(!name)return;const p=store('pantry'),i=p.findIndex(x=>x.name.toLowerCase()===name.toLowerCase());if(i>=0)p[i].qty=qty;else p.push({name,qty,unit:'g'});save('pantry',p);renderPantry()}
function renderPantry(){$('#pantryArea').innerHTML=store('pantry').map((x,i)=>`<div class="pantry-row"><span>•</span><div><b>${x.name}</b><small class="muted">${x.qty} ${x.unit}</small></div><button class="btn small danger" onclick="let p=store('pantry');p.splice(${i},1);save('pantry',p);renderPantry()">Quitar</button></div>`).join('')}
function renderNutrition(){renderNutritionV7()}
function nutritionTab(id,b){$$('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');['Menu','Shopping','Pantry','Batch'].forEach(x=>$('#nut'+x).classList.toggle('hidden',x.toLowerCase()!==id.toLowerCase()))}

function mondayDue(){return new Date().getDay()===1&&!store('measures').some(x=>x.date===todayISO())}
function saveWeekly(){
 const ids=['weight','waist','hip','chest','arm','thigh','calf','bmi','bodyFat','visceralFat','water','skeletalMuscle','muscleMass','protein','bmr','metabolicAge'],m={date:todayISO(),label:'Control semanal'};ids.forEach(k=>m[k]=finite($('#w_'+k).value,null));let arr=store('measures'),i=arr.findIndex(x=>x.date===m.date);if(i>=0)arr[i]=m;else arr.push(m);save('measures',arr);const p=profile();p.currentWeight=m.weight||p.initialWeight;save('profile',p);toast('Control semanal guardado');renderEvolution()
}
function drawChart(){
 const c=$('#weightChart');if(!c)return;const ctx=c.getContext('2d'),arr=[...store('measures')].sort((a,b)=>a.date.localeCompare(b.date)).filter(x=>x.weight);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#071510';ctx.fillRect(0,0,c.width,c.height);if(!arr.length)return;const vals=arr.map(x=>finite(x.weight)),min=Math.min(...vals)-1,max=Math.max(...vals)+1,pad=38;ctx.strokeStyle='#49d383';ctx.lineWidth=4;ctx.beginPath();vals.forEach((v,i)=>{const x=pad+i*(c.width-pad*2)/Math.max(1,vals.length-1),y=c.height-pad-(v-min)/(max-min)*(c.height-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle='#f4f8f6';ctx.font='20px -apple-system';ctx.fillText(vals.at(-1).toFixed(1)+' kg',pad,27)
}
function compareMeasures(){
 const a=[...store('measures')].sort((x,y)=>y.date.localeCompare(x.date)),cur=a[0],prev=a[1];if(!cur||!prev)return'<p class="muted">Se necesitan dos controles.</p>';const keys=[['weight','Peso','kg'],['waist','Cintura','cm'],['hip','Cadera','cm'],['chest','Pecho','cm'],['arm','Brazo','cm'],['thigh','Muslo','cm'],['calf','Gemelo','cm']];return`<div class="weekly-grid">${keys.map(([k,l,u])=>{const d=finite(cur[k])-finite(prev[k]);return`<div><span>${l}</span><b>${cur[k]??'-'} ${u}</b><small>${d>0?'+':''}${d.toFixed(1)} ${u}</small></div>`}).join('')}</div>`}
function renderEvolution(){
 const m=latestMeasure();$('#evolucion').innerHTML=`<div class="section-title"><div><span class="eyebrow">CONTROL OFICIAL</span><h2>Todos los lunes</h2></div><span class="pill ${mondayDue()?'amber':''}">${mondayDue()?'Pendiente':'Al día'}</span></div><div class="card"><div class="form-grid">${[['weight','Peso'],['waist','Cintura'],['hip','Cadera'],['chest','Pecho'],['arm','Brazo'],['thigh','Muslo'],['calf','Gemelo'],['bmi','IMC'],['bodyFat','Grasa corporal %'],['visceralFat','Grasa visceral'],['water','Agua %'],['skeletalMuscle','Músculo esquelético %'],['muscleMass','Masa muscular kg'],['protein','Proteína %'],['bmr','Metabolismo basal'],['metabolicAge','Edad metabólica']].map(x=>`<label>${x[1]}<input id="w_${x[0]}" type="number" step=".1" value="${m[x[0]]??''}"></label>`).join('')}</div><button class="btn primary" onclick="saveWeekly()">Guardar control semanal</button></div><div class="card"><h3>Evolución del peso</h3><canvas id="weightChart" class="chart" width="700" height="290"></canvas></div><div class="card"><h3>Comparativa semanal</h3>${compareMeasures()}</div><div class="card"><h3>Fotos de evolución</h3><div class="form-grid"><label>Frontal<input id="photoFront" type="file" accept="image/*"></label><label>Perfil<input id="photoSide" type="file" accept="image/*"></label></div><button class="btn" onclick="savePhotos()">Guardar fotos</button><div id="photoArea" class="photo-grid"></div></div>`;drawChart();renderPhotos()
}
function fileData(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
async function savePhotos(){const f=$('#photoFront').files[0],s=$('#photoSide').files[0];if(!f&&!s)return toast('Selecciona una foto');const arr=store('photos');arr.unshift({date:todayISO(),front:f?await fileData(f):null,side:s?await fileData(s):null});try{save('photos',arr);renderPhotos()}catch{toast('No hay espacio suficiente')}}
function renderPhotos(){const e=$('#photoArea');if(e)e.innerHTML=store('photos').flatMap(x=>[x.front?`<div><img src="${x.front}"><small>${x.date} frontal</small></div>`:'',x.side?`<div><img src="${x.side}"><small>${x.date} perfil</small></div>`:'']).join('')}


let calendarCursor=new Date();

function calculateStats(){
 const sessions=store('sessions'),logs=store('nutritionLog'),measures=store('measures');
 const totalMinutes=sessions.reduce((a,x)=>a+finite(x.duration),0);
 const totalVolume=sessions.reduce((a,x)=>a+finite(x.volume),0);
 const totalSets=sessions.reduce((a,x)=>a+finite(x.completed),0);
 const cardioSessions=sessions.filter(x=>x.cardio).length;
 const nutritionDays=new Set(logs.filter(x=>x.done).map(x=>x.date)).size;
 const latest=latestMeasure(),first=[...measures].sort((a,b)=>a.date.localeCompare(b.date))[0]||latest;
 return {sessions:sessions.length,totalMinutes,totalVolume,totalSets,cardioSessions,nutritionDays,
  lost:finite(first.weight)-finite(latest.weight),waistLost:finite(first.waist)-finite(latest.waist)};
}
function personalRecords(){
 const rec={};
 store('sessions').forEach(s=>(s.exercises||[]).forEach(ex=>(ex.sets||[]).forEach(setx=>{
  if(!setx.done)return;
  rec[ex.name]=Math.max(rec[ex.name]||0,finite(setx.kg));
 })));
 return Object.entries(rec).sort((a,b)=>b[1]-a[1]);
}
function renderStatsBlock(){
 const s=calculateStats(),prs=personalRecords().slice(0,8);
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">ESTADÍSTICAS</span><h2>Rendimiento acumulado</h2></div><span class="pill blue">${s.sessions} sesiones</span></div>
 <div class="grid-2"><div class="stat"><span>Tiempo entrenado</span><strong>${(s.totalMinutes/60).toFixed(1)} h</strong></div><div class="stat"><span>Volumen movido</span><strong>${Math.round(s.totalVolume).toLocaleString('es-ES')} kg</strong></div><div class="stat"><span>Series realizadas</span><strong>${s.totalSets}</strong></div><div class="stat"><span>Cardio completado</span><strong>${s.cardioSessions}</strong></div><div class="stat"><span>Peso perdido</span><strong>${fmt(s.lost)} kg</strong></div><div class="stat"><span>Cintura reducida</span><strong>${fmt(s.waistLost)} cm</strong></div></div>
 <h3>Récords personales</h3>${prs.length?prs.map(x=>`<div class="pr-row"><span>${x[0]}</span><b>${x[1]} kg</b></div>`).join(''):'<p class="muted">Registra entrenamientos para generar récords.</p>'}</div>`;
}

function calendarEvents(){
 const sessions=store('sessions'),measures=store('measures'),logs=store('nutritionLog'),notes=store('calendarNotes');
 const out={};
 const add=(date,type,label)=>{if(!out[date])out[date]=[];out[date].push({type,label})};
 sessions.forEach(x=>add(x.date,'training',x.label));
 measures.forEach(x=>add(x.date,'measure','Control corporal'));
 logs.filter(x=>x.done).forEach(x=>add(x.date,'nutrition','Comida registrada'));
 notes.forEach(x=>add(x.date,'note',x.text));
 return out;
}
function renderCalendarBlock(){
 const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),events=calendarEvents();
 let cells=['L','M','X','J','V','S','D'].map(x=>`<div class="calendar-head">${x}</div>`).join('');
 for(let i=0;i<start;i++)cells+='<div class="calendar-day empty"></div>';
 for(let d=1;d<=days;d++){
  const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ev=events[iso]||[];
  cells+=`<button class="calendar-day ${ev.length?'has-events':''}" onclick="openCalendarDay('${iso}')"><b>${d}</b><div class="calendar-dots">${ev.slice(0,3).map(e=>`<i class="${e.type}"></i>`).join('')}</div></button>`;
 }
 return `<div class="card"><div class="calendar-toolbar"><button class="btn small" onclick="moveCalendar(-1)">←</button><h3>${calendarCursor.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}</h3><button class="btn small" onclick="moveCalendar(1)">→</button></div><div class="calendar-grid">${cells}</div></div>`;
}
function moveCalendar(n){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+n,1);renderMore();moreTab('calendar',document.querySelector('[data-more="calendar"]'))}
function openCalendarDay(date){
 const ev=calendarEvents()[date]||[];
 openModal(`<span class="eyebrow">CALENDARIO</span><h2>${date}</h2>`,`<div>${ev.length?ev.map(x=>`<div class="assistant-item">${x.label}</div>`).join(''):'<p class="muted">Sin registros.</p>'}</div><label>Nota<input id="calendarNoteText" placeholder="Cita, compra, recordatorio..."></label><button class="btn primary" onclick="addCalendarNote('${date}')">Guardar nota</button>`)
}
function addCalendarNote(date){const text=$('#calendarNoteText').value.trim();if(!text)return;const n=store('calendarNotes');n.unshift({id:uid(),date,text});save('calendarNotes',n);closeModal();toast('Nota añadida')}

function defaultGoals(){
 const g=store('goals');if(g.length)return g;
 const p=profile();return[
  {id:uid(),type:'weight',label:'Alcanzar 90 kg',target:p.goalWeight,current:latestMeasure().weight,unit:'kg'},
  {id:uid(),type:'habit',label:'Completar 5 entrenamientos semanales',target:5,current:0,unit:'sesiones'},
  {id:uid(),type:'habit',label:'Registrar control todos los lunes',target:4,current:0,unit:'controles/mes'}
 ]
}
function ensureGoals(){if(!store('goals').length)save('goals',defaultGoals())}
function goalProgress(g){
 if(g.type==='weight'){const start=profile().initialWeight,target=g.target,current=latestMeasure().weight;return clamp(((start-current)/(start-target))*100,0,100)}
 return clamp((finite(g.current)/finite(g.target,1))*100,0,100)
}
function renderGoalsBlock(){
 ensureGoals();const goals=store('goals');
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">OBJETIVOS</span><h2>Semanales, mensuales y finales</h2></div><button class="btn small" onclick="openGoalForm()">Añadir</button></div>${goals.map((g,i)=>{const pct=goalProgress(g);return`<div class="goal-row"><div><b>${g.label}</b><small>${g.type==='weight'?`${fmt(latestMeasure().weight)} → ${g.target} ${g.unit}`:`${g.current}/${g.target} ${g.unit}`}</small></div><div class="progress"><span style="width:${pct}%"></span></div><button class="btn small danger" onclick="deleteGoal(${i})">×</button></div>`}).join('')}</div>`
}
function openGoalForm(){openModal(`<span class="eyebrow">NUEVO OBJETIVO</span><h2>Crear objetivo</h2>`,`<label>Nombre<input id="goalLabel"></label><label>Tipo<select id="goalType"><option value="habit">Hábito</option><option value="weight">Peso</option></select></label><label>Meta<input id="goalTarget" type="number" step=".1"></label><label>Unidad<input id="goalUnit" placeholder="sesiones, kg, días..."></label><button class="btn primary" onclick="saveGoal()">Guardar</button>`)}
function saveGoal(){const label=$('#goalLabel').value.trim(),type=$('#goalType').value,target=finite($('#goalTarget').value),unit=$('#goalUnit').value.trim();if(!label||!target)return;const g=store('goals');g.push({id:uid(),label,type,target,current:0,unit});save('goals',g);closeModal();renderMore();toast('Objetivo añadido')}
function deleteGoal(i){const g=store('goals');g.splice(i,1);save('goals',g);renderMore()}

function computeAchievements(){
 const stats=calculateStats(),measures=[...store('measures')].sort((a,b)=>a.date.localeCompare(b.date)),ratings=store('mealRatings');
 const candidates=[
  {id:'first_training',label:'Primer entrenamiento',done:stats.sessions>=1},
  {id:'ten_trainings',label:'10 entrenamientos completados',done:stats.sessions>=10},
  {id:'five_kg',label:'5 kg perdidos',done:stats.lost>=5},
  {id:'four_controls',label:'4 controles semanales',done:measures.length>=6},
  {id:'first_favorite',label:'Primer plato favorito',done:ratings.some(x=>x.score>=9)},
  {id:'hundred_sets',label:'100 series realizadas',done:stats.totalSets>=100}
 ];
 const unlocked=store('achievements'),ids=new Set(unlocked.map(x=>x.id));
 candidates.filter(x=>x.done&&!ids.has(x.id)).forEach(x=>unlocked.unshift({...x,date:todayISO()}));
 save('achievements',unlocked);return{candidates,unlocked}
}
function renderAchievementsBlock(){
 const {candidates}=computeAchievements();
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">LOGROS</span><h2>Progreso conseguido</h2></div><span class="pill">${candidates.filter(x=>x.done).length}/${candidates.length}</span></div><div class="achievement-grid">${candidates.map(x=>`<div class="achievement ${x.done?'unlocked':''}"><span>${x.done?'✓':'○'}</span><b>${x.label}</b></div>`).join('')}</div></div>`
}

function favoriteRecipeIds(){const ratings=store('mealRatings'),scores={};ratings.forEach(x=>{if(scores[x.mealId]==null)scores[x.mealId]=x.score});return Object.entries(scores).filter(x=>x[1]>=9).map(x=>x[0])}
function allRecipes(){return Object.values(RECIPES).flat()}
function renderLibraryBlock(){
 const favRecipeIds=favoriteRecipeIds(),favRecipes=allRecipes().filter(x=>favRecipeIds.includes(x.id)),prefs=store('exercisePreferences'),favExercises=Object.entries(prefs).filter(x=>x[1].rating==='up'||x[1].rating==='ok');
 return `<div class="card"><span class="eyebrow">BIBLIOTECA PERSONAL</span><h2>Tus referencias</h2><h3>Platos favoritos</h3>${favRecipes.length?favRecipes.map(x=>`<div class="pr-row"><span>${x.name}</span><b>${x.flavor}</b></div>`).join(''):'<p class="muted">Puntúa con 9 o 10 para añadir platos.</p>'}<h3>Ejercicios consolidados</h3>${favExercises.length?favExercises.map(x=>`<div class="pr-row"><span>${x[0]}</span><b>${x[1].rating==='up'?'Subir':'Mantener'}</b></div>`).join(''):'<p class="muted">Usa OK/Subir/Bajar durante los entrenamientos.</p>'}</div>`
}


function weeklyAdherence(){
 const start=new Date();start.setDate(start.getDate()-6);const iso=start.toISOString().slice(0,10);
 const sessions=store('sessions').filter(x=>x.date>=iso).length;
 const meals=store('nutritionLog').filter(x=>x.date>=iso&&x.done).length;
 const health=store('health').filter(x=>x.date>=iso).length;
 return {sessions,meals,health,total:Math.round(clamp(sessions/5*50,0,50)+clamp(meals/35*35,0,35)+clamp(health/7*15,0,15))};
}
function exerciseSuggestion(name){
 const pref=store('exercisePreferences')[name];
 if(pref?.rating==='up')return['up','Subir','Marcaste subir la última vez.'];
 if(pref?.rating==='down')return['down','Bajar','Marcaste bajar la última vez.'];
 if(pref?.rating==='ok')return['hold','Mantener','La carga actual está consolidada.'];
 return['hold','Mantener','Registra más sesiones para afinar la recomendación.'];
}
function bestRecipeFor(type){
 const list=RECIPES[type]||[],ratings=store('mealRatings'),pantry=store('pantry').map(x=>x.name.toLowerCase());
 const score=id=>ratings.find(x=>x.mealId===id)?.score||0;
 return [...list].sort((a,b)=>{
  const ma=a.items.filter(x=>pantry.some(p=>p.includes(x[0].toLowerCase())||x[0].toLowerCase().includes(p))).length;
  const mb=b.items.filter(x=>pantry.some(p=>p.includes(x[0].toLowerCase())||x[0].toLowerCase().includes(p))).length;
  return (score(b.id)*2+mb)-(score(a.id)*2+ma);
 })[0]||list[0];
}
function assistantPanel(){
 const p=profile(),w=WORKOUTS[p.currentDay-1],ad=weeklyAdherence(),lunch=bestRecipeFor('lunch'),dinner=bestRecipeFor('dinner');
 return `<div class="card smart-coach"><div class="section-title"><div><span class="eyebrow">MI ENTRENADOR</span><h2>Plan inteligente de hoy</h2></div><span class="pill blue">${ad.total}% adherencia</span></div>
 <div class="assistant-item"><b>Entrenamiento</b><p>${w.name} · ${w.focus}</p></div>
 <div class="assistant-item"><b>Comida recomendada</b><p>${lunch?.name||'Completa la despensa'}</p></div>
 <div class="assistant-item"><b>Cena recomendada</b><p>${dinner?.name||'Completa la despensa'}</p></div>
 <h3>Progresión sugerida</h3>${w.ex.slice(0,4).map(e=>{const s=exerciseSuggestion(e[0]);return `<div class="smart-suggestion"><span>${e[0]}</span><b class="${s[0]}">${s[1]}</b><small>${s[2]}</small></div>`}).join('')}
 <button class="btn primary" onclick="openWeeklyReview()">Analizar mi semana</button></div>`;
}
function openWeeklyReview(){
 const ad=weeklyAdherence(),ms=[...store('measures')].sort((a,b)=>b.date.localeCompare(a.date)),cur=ms[0],prev=ms[1];
 const positives=[],actions=[],alerts=[];
 if(cur&&prev){
  const dw=finite(cur.weight)-finite(prev.weight),dc=finite(cur.waist)-finite(prev.waist);
  if(dw<0)positives.push(`Peso: ${Math.abs(dw).toFixed(1)} kg menos.`);
  if(dc<0)positives.push(`Cintura: ${Math.abs(dc).toFixed(1)} cm menos.`);
  if(dw===0&&dc<0)positives.push('El peso está estable, pero la cintura baja.');
 }
 if(ad.total<65)actions.push('Mejora primero la adherencia antes de cambiar dieta o rutina.');
 else actions.push('Mantén el plan actual una semana más.');
 if(store('sessions').slice(0,3).some(x=>finite(x.painAfter)>=4))alerts.push('Hay molestias recientes: no subas carga hasta revisarlas.');
 const review={id:uid(),date:todayISO(),adherence:ad,positives,actions,alerts};
 const rows=store('weeklyReviews');rows.unshift(review);save('weeklyReviews',rows);
 openModal(`<span class="eyebrow">REVISIÓN SEMANAL</span><h2>Análisis Proyecto85</h2>`,
 `${positives.length?positives.map(x=>`<div class="assistant-item">${x}</div>`).join(''):'<p class="muted">Aún faltan datos comparables.</p>'}
 ${alerts.map(x=>`<div class="banner danger">${x}</div>`).join('')}
 <h3>Acciones</h3>${actions.map(x=>`<div class="assistant-item">${x}</div>`).join('')}
 <p class="note">Apoyo al seguimiento; no sustituye la indicación médica.</p>`);
}
function applySmartMenu(){
 const sel=store('mealSelections');sel[todayISO()]={};
 Object.keys(mealLabels).forEach(type=>{const r=bestRecipeFor(type);if(r)sel[todayISO()][type]=r.id});
 save('mealSelections',sel);toast('Menú inteligente aplicado');renderNutrition();
}


const PRO_RECIPES=[
{id:'r_pasta_pol',name:'Pasta mediterránea con pollo',meal:'lunch',flavor:'Mediterráneo',time:25,items:[['Pasta integral',70,'g','en crudo'],['Pechuga de pollo',180,'g','en crudo'],['Verduras mediterráneas',250,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Cuece la pasta al dente.','Saltea el pollo en tiras.','Añade verduras y especias.'],nutrition:{kcal:610,protein:52,carbs:63,fat:16,fiber:10}},
{id:'r_churrasco',name:'Churrasco de pollo estilo argentino',meal:'lunch',flavor:'Argentino',time:30,items:[['Churrasco de pollo',200,'g','en crudo'],['Patata',250,'g','cocida'],['Ensalada',250,'g','tal como se consume'],['Aceite de oliva',10,'g','medido']],steps:['Sazona el pollo.','Cocina a la plancha.','Acompaña con patata y ensalada.'],nutrition:{kcal:590,protein:48,carbs:49,fat:21,fiber:8}},
{id:'r_lomo',name:'Lomo magro con pimientos y arroz',meal:'lunch',flavor:'Español',time:25,items:[['Lomo de cerdo magro',180,'g','en crudo'],['Arroz integral',60,'g','en crudo'],['Pimientos asados',250,'g','cocinados'],['Aceite de oliva',10,'g','medido']],steps:['Cuece el arroz.','Cocina el lomo.','Sirve con pimientos.'],nutrition:{kcal:610,protein:48,carbs:52,fat:20,fiber:7}},
{id:'r_salmon',name:'Salmón a la plancha con patata y ensalada',meal:'dinner',flavor:'Mediterráneo',time:20,items:[['Salmón',180,'g','en crudo'],['Patata',200,'g','cocida'],['Ensalada completa',300,'g','tal como se consume']],steps:['Cocina el salmón.','Sirve con patata y ensalada.'],nutrition:{kcal:610,protein:42,carbs:43,fat:27,fiber:8}},
{id:'r_merluza',name:'Merluza con arroz y verduras',meal:'dinner',flavor:'Ligero',time:20,items:[['Merluza',200,'g','en crudo'],['Arroz integral',50,'g','en crudo'],['Verduras variadas',300,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Cuece el arroz.','Cocina la merluza.','Añade verduras.'],nutrition:{kcal:510,protein:43,carbs:50,fat:14,fiber:9}},
{id:'r_garbanzos',name:'Espinacas con garbanzos y proteína',meal:'lunch',flavor:'Tradicional',time:25,items:[['Garbanzos',180,'g','cocidos'],['Espinacas',250,'g','cocinadas'],['Pechuga de pollo',120,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Saltea espinacas.','Añade garbanzos.','Incorpora proteína.'],nutrition:{kcal:600,protein:46,carbs:55,fat:18,fiber:18}},
{id:'r_atun',name:'Atún con tomate, aguacate y pan integral',meal:'dinner',flavor:'Rápido',time:10,items:[['Atún al natural',160,'g','escurrido'],['Pan integral',60,'g','tal como se consume'],['Tomate',250,'g','tal como se consume'],['Aguacate',60,'g','tal como se consume']],steps:['Escurre el atún.','Corta tomate y aguacate.','Sirve con pan.'],nutrition:{kcal:520,protein:45,carbs:44,fat:17,fiber:11}},
{id:'r_desayuno',name:'Tostada integral con pavo, fruta y café',meal:'breakfast',flavor:'Habitual',time:8,items:[['Pan integral',40,'g','tal como se consume'],['Pavo',70,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Café con leche desnatada',1,'taza','preparado']],steps:['Tuesta el pan.','Añade pavo.','Acompaña con fruta y café.'],nutrition:{kcal:340,protein:25,carbs:45,fat:6,fiber:7}},
{id:'r_media',name:'Yogur natural y tostada integral',meal:'midmorning',flavor:'Simple',time:3,items:[['Yogur natural',1,'unidad','listo'],['Pan integral',30,'g','tal como se consume']],steps:['Sirve yogur y tostada.'],nutrition:{kcal:180,protein:10,carbs:25,fat:4,fiber:3}},
{id:'r_merienda',name:'Fruta con queso fresco',meal:'snack',flavor:'Simple',time:3,items:[['Fruta',1,'pieza','entera'],['Queso fresco sin sal',80,'g','tal como se consume']],steps:['Sirve fruta y queso fresco.'],nutrition:{kcal:210,protein:14,carbs:26,fat:6,fiber:4}}
];

// --- V7.1: variedad extra para evitar monotonía ---
PRO_RECIPES.push(
{id:'r_ternera_asiatica',name:'Ternera magra con arroz y verduras estilo asiático',meal:'lunch',flavor:'Asiático',time:25,items:[['Ternera magra',180,'g','en crudo'],['Arroz integral',60,'g','en crudo'],['Verduras variadas',300,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Corta la ternera en tiras.','Saltea verduras.','Añade ternera y especias suaves.','Sirve con el arroz.'],nutrition:{kcal:620,protein:46,carbs:56,fat:22,fiber:9}},
{id:'r_pollo_italiano',name:'Pollo italiano con tomate, pasta y verduras',meal:'lunch',flavor:'Italiano',time:25,items:[['Pechuga de pollo',180,'g','en crudo'],['Pasta integral',70,'g','en crudo'],['Tomate',200,'g','cocinado'],['Verduras variadas',200,'g','en crudo']],steps:['Cuece la pasta.','Cocina el pollo.','Añade tomate y verduras.','Mezcla y sazona con hierbas.'],nutrition:{kcal:590,protein:50,carbs:62,fat:13,fiber:11}},
{id:'r_bacalao',name:'Bacalao con patata y pimientos',meal:'dinner',flavor:'Mediterráneo',time:25,items:[['Bacalao',200,'g','en crudo'],['Patata',220,'g','cocida'],['Pimientos asados',250,'g','cocinados'],['Aceite de oliva',10,'g','medido']],steps:['Cocina el bacalao.','Sirve con patata y pimientos.','Añade el aceite medido al final.'],nutrition:{kcal:510,protein:42,carbs:44,fat:16,fiber:7}},
{id:'r_salpicón',name:'Salpicón equilibrado con verduras y patata',meal:'dinner',flavor:'Fresco',time:15,items:[['Marisco o pescado cocido',180,'g','cocinado'],['Patata',180,'g','cocida'],['Tomate',150,'g','tal como se consume'],['Pimientos',150,'g','tal como se consume'],['Aceite de oliva',10,'g','medido']],steps:['Corta los ingredientes.','Mezcla y enfría.','Aliña justo antes de servir.'],nutrition:{kcal:470,protein:38,carbs:39,fat:16,fiber:7}},
{id:'r_pavo_wrap',name:'Wrap integral de pavo, aguacate y ensalada',meal:'dinner',flavor:'Rápido',time:10,items:[['Tortilla integral',1,'unidad','tal como se consume'],['Pavo',120,'g','tal como se consume'],['Aguacate',50,'g','tal como se consume'],['Ensalada',200,'g','tal como se consume']],steps:['Calienta la tortilla.','Añade pavo, aguacate y ensalada.','Enrolla y sirve.'],nutrition:{kcal:480,protein:36,carbs:45,fat:18,fiber:10}},
{id:'r_media_queso',name:'Queso fresco, fruta y pequeña tostada',meal:'midmorning',flavor:'Oficina',time:3,items:[['Queso fresco sin sal',80,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Pan integral',25,'g','tal como se consume']],steps:['Prepara en un recipiente.','Acompaña con fruta.'],nutrition:{kcal:250,protein:16,carbs:33,fat:7,fiber:5}},
{id:'r_media_pavo',name:'Pavo con tostada integral y tomate',meal:'midmorning',flavor:'Salado',time:5,items:[['Pavo',60,'g','tal como se consume'],['Pan integral',30,'g','tal como se consume'],['Tomate',120,'g','tal como se consume']],steps:['Tuesta el pan.','Añade tomate y pavo.'],nutrition:{kcal:210,protein:17,carbs:27,fat:4,fiber:4}},
{id:'r_merienda_yogur',name:'Yogur natural con fruta',meal:'snack',flavor:'Simple',time:3,items:[['Yogur natural',1,'unidad','listo'],['Fruta',1,'pieza','entera']],steps:['Sirve juntos o por separado.'],nutrition:{kcal:190,protein:9,carbs:30,fat:4,fiber:4}},
{id:'r_desayuno_qf',name:'Queso fresco, pan integral, fruta y café',meal:'breakfast',flavor:'Alternativo',time:7,items:[['Queso fresco sin sal',80,'g','tal como se consume'],['Pan integral',40,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Café con leche desnatada',1,'taza','preparado']],steps:['Tuesta el pan.','Añade queso fresco.','Acompaña con fruta y café.'],nutrition:{kcal:360,protein:23,carbs:48,fat:8,fiber:7}}
);

function allProRecipes(){return PRO_RECIPES}
function recipeScore(id){return store('mealRatings').find(x=>x.mealId===id)?.score||8}
function recipeAvailability(r){const names=store('pantry').map(x=>x.name.toLowerCase());const m=r.items.filter(x=>names.some(n=>n.includes(x[0].toLowerCase())||x[0].toLowerCase().includes(n))).length;return{matched:m,total:r.items.length,pct:Math.round(m/r.items.length*100)}}
function smartRecipeList(meal){return PRO_RECIPES.filter(x=>x.meal===meal).sort((a,b)=>(recipeScore(b)*3+recipeAvailability(b).pct)-(recipeScore(a)*3+recipeAvailability(a).pct))}
function activeProRecipe(type){const sw=store('mealSwaps').find(x=>x.date===todayISO()&&x.type===type),sel=store('mealSelections')||{},id=sel[todayISO()]?.[type];return sw?.custom||PRO_RECIPES.find(x=>x.id===id)||smartRecipeList(type)[0]}
function openRecipe(id){const r=PRO_RECIPES.find(x=>x.id===id),n=r.nutrition,av=recipeAvailability(r);openModal(`<span class="eyebrow">RECETA</span><h2>${r.name}</h2>`,`<div class="recipe-meta"><span>${r.flavor}</span><span>${r.time} min</span><span>${av.pct}% despensa</span></div><h3>Ingredientes</h3><ul class="meal-items">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]}</small></li>`).join('')}</ul><h3>Preparación</h3><ol class="guide-list">${r.steps.map(x=>`<li>${x}</li>`).join('')}</ol><div class="nutrition-grid"><div><span>Kcal</span><b>${n.kcal}</b></div><div><span>Proteína</span><b>${n.protein} g</b></div><div><span>Hidratos</span><b>${n.carbs} g</b></div><div><span>Grasa</span><b>${n.fat} g</b></div><div><span>Fibra</span><b>${n.fiber} g</b></div></div><button class="btn primary" onclick="selectRecipeForToday('${r.meal}','${r.id}')">Usar hoy</button>`)}
function selectRecipeForToday(type,id){const s=store('mealSelections');if(!s[todayISO()])s[todayISO()]={};s[todayISO()][type]=id;save('mealSelections',s);closeModal();renderNutrition()}
function showRecipeAlternatives(type){const list=smartRecipeList(type).filter(x=>x.id!==activeProRecipe(type).id);openModal(`<span class="eyebrow">CAMBIAR PLATO</span><h2>${mealLabels[type]}</h2>`,`<div class="alt-grid">${list.map(r=>`<button class="alt-btn" onclick="selectRecipeForToday('${type}','${r.id}')"><b>${r.name}</b><small>${r.flavor} · ${r.nutrition.protein} g proteína · ${recipeAvailability(r).pct}% disponible</small></button>`).join('')}</div>`)}
function smartIngredientSwap(type){const r=activeProRecipe(type);const map={'Arroz integral':['Patata',250,'g','cocida'],'Pasta integral':['Arroz integral',60,'g','en crudo'],'Pechuga de pollo':['Lomo de cerdo magro',180,'g','en crudo'],'Salmón':['Merluza',200,'g','en crudo'],'Merluza':['Atún al natural',160,'g','escurrido']};const opts=r.items.filter(x=>map[x[0]]);openModal(`<span class="eyebrow">CAMBIAR INGREDIENTE</span><h2>${r.name}</h2>`,`<div class="alt-grid">${opts.map((x,i)=>{const y=map[x[0]];return`<button class="alt-btn" onclick="applyIngredientSwap('${type}',${i})"><b>${x[0]} → ${y[0]}</b><small>${y[1]} ${y[2]} · ${y[3]}</small></button>`}).join('')||'<p>No hay sustituciones disponibles.</p>'}</div>`)}
function applyIngredientSwap(type,index){const r=activeProRecipe(type),map={'Arroz integral':['Patata',250,'g','cocida'],'Pasta integral':['Arroz integral',60,'g','en crudo'],'Pechuga de pollo':['Lomo de cerdo magro',180,'g','en crudo'],'Salmón':['Merluza',200,'g','en crudo'],'Merluza':['Atún al natural',160,'g','escurrido']},opts=r.items.filter(x=>map[x[0]]),x=opts[index],y=map[x[0]],clone=JSON.parse(JSON.stringify(r));clone.id='swap-'+uid();clone.name=r.name+' adaptada';clone.items=clone.items.map(i=>i[0]===x[0]?[y[0],y[1],y[2],y[3]]:i);const sw=store('mealSwaps').filter(a=>!(a.date===todayISO()&&a.type===type));sw.unshift({date:todayISO(),type,custom:clone});save('mealSwaps',sw);closeModal();renderNutrition()}
function buildWeeklyMenu(){const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],menu={id:uid(),createdAt:new Date().toISOString(),days:{}};days.forEach((d,i)=>{menu.days[d]={breakfast:'r_desayuno',midmorning:'r_media',snack:'r_merienda',lunch:smartRecipeList('lunch')[i%smartRecipeList('lunch').length]?.id,dinner:smartRecipeList('dinner')[i%smartRecipeList('dinner').length]?.id}});const a=store('weeklyMenus');a.unshift(menu);save('weeklyMenus',a);renderNutrition()}
function currentWeeklyMenu(){return store('weeklyMenus')[0]}
function weeklyMenuMarkup(){const m=currentWeeklyMenu();return m?Object.entries(m.days).map(([d,ms])=>`<div class="week-day-card"><h3>${d}</h3>${Object.entries(ms).map(([t,id])=>`<div class="week-meal"><span>${mealLabels[t]}</span><b>${PRO_RECIPES.find(r=>r.id===id)?.name||'-'}</b></div>`).join('')}</div>`).join(''):'<p class="muted">Genera el menú semanal.</p>'}
function generateV8Shopping(){const m=currentWeeklyMenu();if(!m)return toast('Genera primero el menú');const need={};Object.values(m.days).forEach(ms=>Object.values(ms).forEach(id=>{const r=PRO_RECIPES.find(x=>x.id===id);r?.items.forEach(x=>{if(!need[x[0]])need[x[0]]={name:x[0],qty:0,unit:x[2],category:shoppingCategory(x[0])};need[x[0]].qty+=finite(x[1])})}));const pantry=store('pantry');save('shopping',Object.values(need).map(x=>{const h=pantry.find(p=>p.name.toLowerCase()===x.name.toLowerCase());return{...x,have:finite(h?.qty),buy:Math.max(0,x.qty-finite(h?.qty)),owned:!!h,bought:false}}));renderNutrition()}
function shoppingCategory(n){n=n.toLowerCase();if(/pollo|pavo|lomo|ternera|churrasco/.test(n))return'Carnicería';if(/salmón|merluza|atún/.test(n))return'Pescadería';if(/verdura|ensalada|espinaca|pimiento|tomate|fruta|aguacate|patata/.test(n))return'Fruta y verdura';if(/yogur|queso|leche/.test(n))return'Lácteos';if(/arroz|pasta|pan|garbanzo/.test(n))return'Alimentación seca';return'Otros'}
function shoppingMarkup(){const g={};store('shopping').forEach((x,i)=>{if(!g[x.category])g[x.category]=[];g[x.category].push({...x,index:i})});return Object.entries(g).map(([c,it])=>`<div class="shopping-category"><h3>${c}</h3>${it.map(x=>`<div class="shopping-row"><input type="checkbox" ${x.bought?'checked':''} onchange="shopUpdate(${x.index},'bought',this.checked)"><div><b>${x.name}</b><small>Comprar ${Math.round(x.buy)} ${x.unit} · tienes ${x.have}</small></div><button class="btn small ${x.owned?'primary':''}" onclick="shopUpdate(${x.index},'owned',!${x.owned})">${x.owned?'En casa':'Ya tengo'}</button></div>`).join('')}</div>`).join('')||'<p class="muted">Genera la lista.</p>'}
function addPantryV7(){const name=$('#pantryName').value.trim(),qty=finite($('#pantryQty').value),unit=$('#pantryUnit').value,expiry=$('#pantryExpiry').value;if(!name)return;const p=store('pantry'),i=p.findIndex(x=>x.name.toLowerCase()===name.toLowerCase()),row={name,qty,unit,expiry};if(i>=0)p[i]=row;else p.push(row);save('pantry',p);renderNutrition()}
function openSocialMeal(){openModal(`<span class="eyebrow">COMIDA SOCIAL</span><h2>Adaptar el día</h2>`,`<label>Tipo<select id="socialType"><option>Comida familiar</option><option>Restaurante</option><option>Tapas</option><option>Celebración</option><option>Cine</option></select></label><label>Momento<select id="socialMoment"><option value="lunch">Comida</option><option value="dinner">Cena</option></select></label><button class="btn primary" onclick="saveSocialMeal()">Guardar</button>`)}
function saveSocialMeal(){const a=store('socialMeals');a.unshift({id:uid(),date:todayISO(),type:$('#socialType').value,moment:$('#socialMoment').value});save('socialMeals',a);closeModal();renderNutrition()}
function restaurantMode(){openModal(`<span class="eyebrow">MODO RESTAURANTE</span><h2>Elegir mejor</h2>`,`<label>Tipo<select id="restaurantType"><option>Bar de tapas</option><option>Italiano</option><option>Japonés</option><option>Hamburguesería</option><option>Asador</option></select></label><button class="btn primary" onclick="showRestaurantAdvice()">Ver recomendaciones</button><div id="restaurantAdvice"></div>`)}
function showRestaurantAdvice(){const t=$('#restaurantType').value,m={'Bar de tapas':['Ensalada o aliño','Carne o pescado a la plancha','Una sola ración de pan o patata'],'Italiano':['Pasta con tomate, verduras y proteína','Pizza fina con verduras','No acumular pan, entrante y postre'],'Japonés':['Sashimi o nigiri','Arroz moderado','Evitar exceso de fritos'],'Hamburguesería':['Hamburguesa sencilla','Ensalada o patata pequeña','Evitar dobles y salsas'],'Asador':['Carne o pescado','Verduras','Patata controlada']};$('#restaurantAdvice').innerHTML=`<div class="assistant-item"><ul>${m[t].map(x=>`<li>${x}</li>`).join('')}</ul></div>`}
function proMealCard(type){const r=activeProRecipe(type),n=r.nutrition,log=store('nutritionLog').find(x=>x.date===todayISO()&&x.type===type),score=recipeScore(r.id);return`<div class="meal-card"><div class="meal-head"><div><span class="eyebrow">${mealLabels[type]}</span><h3>${r.name}</h3><div class="recipe-meta"><span>${r.flavor}</span><span>${r.time} min</span><span>${n.protein} g proteína</span></div></div><button class="btn small" onclick="openRecipe('${r.id}')">Ver receta</button></div><ul class="meal-items">${r.items.map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]}</small></li>`).join('')}</ul><div class="btn-row"><button class="btn small secondary" onclick="smartIngredientSwap('${type}')">Cambiar ingrediente</button><button class="btn small secondary" onclick="showRecipeAlternatives('${type}')">Cambiar plato</button></div><label class="check"><input type="checkbox" ${log?.done?'checked':''} onchange="toggleMeal('${type}',this.checked)"> Comida realizada</label><div class="rating-row"><span>Valorar:</span>${[1,2,3,4,5,6,7,8,9,10].map(v=>`<button class="score-btn ${score===v?'active':''}" onclick="rateMeal('${r.id}',${v});renderNutrition()">${v}</button>`).join('')}</div></div>`}
function recipeCardV7(r){return`<button class="recipe-card" onclick="openRecipe('${r.id}')"><div><span class="eyebrow">${mealLabels[r.meal]}</span><h3>${r.name}</h3><p>${r.flavor} · ${r.time} min</p></div><div class="recipe-score"><b>${recipeScore(r.id)}</b><small>/10</small></div><div class="recipe-macros"><span>${r.nutrition.kcal} kcal</span><span>${r.nutrition.protein} g prot.</span><span>${recipeAvailability(r).pct}% despensa</span></div></button>`}
function renderNutritionV7(){$('#nutricion').innerHTML=`<div class="card nutrition-dashboard"><div class="section-title"><div><span class="eyebrow">NUTRICIÓN INTELIGENTE</span><h2>Planificar, comprar y aprender</h2></div><span class="pill green">V7</span></div><div class="btn-row"><button class="btn primary" onclick="buildWeeklyMenu()">Generar menú semanal</button><button class="btn" onclick="generateV8Shopping()">Generar compra</button></div><div class="btn-row" style="margin-top:8px"><button class="btn secondary" onclick="openSocialMeal()">Comida social</button><button class="btn secondary" onclick="restaurantMode()">Modo restaurante</button></div></div><div class="tabs"><button class="tab-btn active" onclick="nvTab('today',this)">Hoy</button><button class="tab-btn" onclick="nvTab('week',this)">Semana</button><button class="tab-btn" onclick="nvTab('recipes',this)">Recetas</button><button class="tab-btn" onclick="nvTab('shopping',this)">Compra</button><button class="tab-btn" onclick="nvTab('pantry',this)">Despensa</button></div><div id="nvToday">${Object.keys(mealLabels).map(proMealCard).join('')}</div><div id="nvWeek" class="hidden">${weeklyMenuMarkup()}</div><div id="nvRecipes" class="hidden"><div class="recipe-library">${PRO_RECIPES.map(recipeCardV7).join('')}</div></div><div id="nvShopping" class="hidden"><div class="card">${shoppingMarkup()}</div></div><div id="nvPantry" class="hidden"><div class="card"><div class="form-grid"><label>Producto<input id="pantryName"></label><label>Cantidad<input id="pantryQty" type="number"></label><label>Unidad<select id="pantryUnit"><option>g</option><option>kg</option><option>unidad</option><option>lata</option></select></label><label>Caducidad<input id="pantryExpiry" type="date"></label></div><button class="btn primary" onclick="addPantryV7()">Guardar</button>${store('pantry').map((x,i)=>`<div class="pantry-row"><span>•</span><div><b>${x.name}</b><small>${x.qty} ${x.unit||'g'} ${x.expiry?'· '+x.expiry:''}</small></div><button class="btn small danger" onclick="let p=store('pantry');p.splice(${i},1);save('pantry',p);renderNutrition()">Quitar</button></div>`).join('')}</div></div>`}
function nvTab(id,b){$$('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');['Today','Week','Recipes','Shopping','Pantry'].forEach(x=>$('#nv'+x).classList.toggle('hidden',x.toLowerCase()!==id.toLowerCase()))}


// =========================
// V7.1 NUTRICIÓN COMPLETA
// =========================
const FOOD_GROUP_HINTS={
 fruit:['fruta','kiwi','manzana','pera','naranja','plátano','fresa'],
 veg:['verdura','ensalada','espinaca','pimiento','tomate','calabacín','berenjena'],
 fish:['salmón','merluza','bacalao','atún','marisco','pescado'],
 legumes:['garbanzo','lenteja','alubia','legumbre'],
 dairy:['yogur','queso','leche'],
 wholegrain:['integral','arroz','pasta','pan'],
 nuts:['frutos secos','nuez','almendra'],
 olive:['aceite de oliva','aguacate']
};

function completeRecipeList(){
 return [...PRO_RECIPES,...store('customRecipes')];
}
function recipeByAnyId(id){return completeRecipeList().find(x=>x.id===id)}
function allProRecipes(){return completeRecipeList()}

function nutritionRatingMap(){
 const map={};
 store('mealRatings').forEach(x=>{if(map[x.mealId]==null)map[x.mealId]=x.score});
 return map;
}
function nutritionHistoryIds(days=4){
 const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);
 const iso=cutoff.toISOString().slice(0,10),ids=[];
 const sel=store('mealSelections')||{};
 Object.entries(sel).forEach(([date,meals])=>{if(date>=iso)Object.values(meals||{}).forEach(id=>ids.push(id))});
 return ids;
}
function smartRecipeList(meal){
 const ratings=nutritionRatingMap(),recent=nutritionHistoryIds(3),pantry=store('pantry').map(x=>x.name.toLowerCase());
 return completeRecipeList().filter(x=>x.meal===meal).sort((a,b)=>{
   const avail=r=>{const items=r.items||[];return items.filter(i=>pantry.some(p=>p.includes(String(i[0]).toLowerCase())||String(i[0]).toLowerCase().includes(p))).length/Math.max(1,items.length)};
   const score=r=>(ratings[r.id]??8)*3 + avail(r)*12 - (recent.includes(r.id)?10:0);
   return score(b)-score(a);
 });
}
function activeProRecipe(type){
 const sw=store('mealSwaps').find(x=>x.date===todayISO()&&x.type===type);
 const sel=store('mealSelections')||{},id=sel[todayISO()]?.[type];
 return sw?.custom||recipeByAnyId(id)||smartRecipeList(type)[0];
}
function recipeScore(id){return nutritionRatingMap()[id]??8}
function recipeAvailability(r){
 const names=store('pantry').map(x=>x.name.toLowerCase()),items=r.items||[];
 const m=items.filter(x=>names.some(n=>n.includes(String(x[0]).toLowerCase())||String(x[0]).toLowerCase().includes(n))).length;
 return{matched:m,total:items.length,pct:items.length?Math.round(m/items.length*100):0}
}

function selectedRecipesToday(){
 return Object.keys(mealLabels).map(type=>activeProRecipe(type)).filter(Boolean)
}
function todayNutritionTotals(){
 return selectedRecipesToday().reduce((a,r)=>{
  const n=r.nutrition||{};
  a.kcal+=finite(n.kcal);a.protein+=finite(n.protein);a.carbs+=finite(n.carbs);a.fat+=finite(n.fat);a.fiber+=finite(n.fiber);
  return a;
 },{kcal:0,protein:0,carbs:0,fat:0,fiber:0});
}
function todayFoodGroupCoverage(){
 const txt=selectedRecipesToday().flatMap(r=>(r.items||[]).map(i=>String(i[0]).toLowerCase()));
 const count=keys=>txt.filter(t=>keys.some(k=>t.includes(k))).length;
 return {
  fruit:count(FOOD_GROUP_HINTS.fruit),
  veg:count(FOOD_GROUP_HINTS.veg),
  fish:count(FOOD_GROUP_HINTS.fish),
  legumes:count(FOOD_GROUP_HINTS.legumes),
  dairy:count(FOOD_GROUP_HINTS.dairy),
  wholegrain:count(FOOD_GROUP_HINTS.wholegrain)
 };
}
function dailyBalanceMarkup(){
 const t=todayNutritionTotals(),g=todayFoodGroupCoverage();
 return `<div class="card balance-card">
  <div class="section-title"><div><span class="eyebrow">EQUILIBRIO DEL DÍA</span><h3>Lo que aporta el menú de hoy</h3></div><span class="pill blue">orientativo</span></div>
  <div class="nutrition-grid">
    <div><span>Proteína</span><b>${Math.round(t.protein)} g</b></div>
    <div><span>Fibra</span><b>${Math.round(t.fiber)} g</b></div>
    <div><span>Hidratos</span><b>${Math.round(t.carbs)} g</b></div>
    <div><span>Grasas</span><b>${Math.round(t.fat)} g</b></div>
  </div>
  <div class="group-chips">
   <span class="${g.fruit?'good':''}">Fruta ${g.fruit?'✓':'○'}</span>
   <span class="${g.veg>=2?'good':''}">Verduras ${g.veg>=2?'✓':'○'}</span>
   <span class="${g.dairy?'good':''}">Lácteo/equiv. ${g.dairy?'✓':'○'}</span>
   <span class="${g.wholegrain?'good':''}">Cereal/legumbre ${g.wholegrain||g.legumes?'✓':'○'}</span>
  </div>
  <p class="note">Se usa como guía de variedad y suficiencia, no como límite rígido de comida.</p>
 </div>`;
}

function saveNutritionCheckin(){
 const row={
  id:uid(),date:todayISO(),
  hunger:finite($('#nfHunger').value),
  energy:finite($('#nfEnergy').value),
  satiety:finite($('#nfSatiety').value),
  digestion:finite($('#nfDigestion').value),
  notes:$('#nfNotes').value.trim()
 };
 let a=store('nutritionCheckins');a=a.filter(x=>x.date!==row.date);a.unshift(row);save('nutritionCheckins',a);
 toast('Sensaciones guardadas');renderNutrition();
}
function nutritionCheckinMarkup(){
 const x=store('nutritionCheckins').find(x=>x.date===todayISO())||{};
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">APRENDER DE TU DÍA</span><h3>Hambre, energía y saciedad</h3></div><span class="pill">1–10</span></div>
 <div class="form-grid">
  <label>Hambre<input id="nfHunger" type="number" min="1" max="10" value="${x.hunger||''}"></label>
  <label>Energía<input id="nfEnergy" type="number" min="1" max="10" value="${x.energy||''}"></label>
  <label>Saciedad<input id="nfSatiety" type="number" min="1" max="10" value="${x.satiety||''}"></label>
  <label>Digestión<input id="nfDigestion" type="number" min="1" max="10" value="${x.digestion||''}"></label>
  <label class="wide">Observaciones<textarea id="nfNotes" placeholder="Qué funcionó, qué cambiarías...">${x.notes||''}</textarea></label>
 </div><button class="btn primary" onclick="saveNutritionCheckin()">Guardar sensaciones</button></div>`;
}

function weeklyLearning(){
 const ratings=nutritionRatingMap(),checks=store('nutritionCheckins').slice(0,14);
 const favorites=completeRecipeList().filter(r=>(ratings[r.id]||0)>=9).slice(0,5);
 const low=completeRecipeList().filter(r=>(ratings[r.id]||99)<=4).slice(0,5);
 const avg=(k)=>checks.length?(checks.reduce((a,x)=>a+finite(x[k]),0)/checks.length).toFixed(1):'-';
 return {favorites,low,avgHunger:avg('hunger'),avgEnergy:avg('energy'),avgSatiety:avg('satiety')};
}
function learningMarkup(){
 const l=weeklyLearning();
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">APRENDIZAJE</span><h3>Qué está funcionando</h3></div></div>
 <div class="grid-3"><div class="stat"><span>Hambre media</span><strong>${l.avgHunger}</strong></div><div class="stat"><span>Energía media</span><strong>${l.avgEnergy}</strong></div><div class="stat"><span>Saciedad media</span><strong>${l.avgSatiety}</strong></div></div>
 <h4>Platos prioritarios</h4>${l.favorites.length?l.favorites.map(r=>`<div class="pr-row"><span>${r.name}</span><b>${recipeScore(r.id)}/10</b></div>`).join(''):'<p class="muted">Puntúa platos con 9–10 para priorizarlos.</p>'}
 ${l.low.length?`<h4>Aparecerán menos</h4>${l.low.map(r=>`<div class="pr-row"><span>${r.name}</span><b>${recipeScore(r.id)}/10</b></div>`).join('')}`:''}
 </div>`;
}

function menuVarietyScore(menu){
 if(!menu)return 0;
 const ids=Object.values(menu.days||{}).flatMap(x=>Object.values(x||{}));
 const unique=new Set(ids.filter(Boolean)).size;
 return Math.round(unique/Math.max(1,ids.length)*100);
}
function weeklyCoverageV71(){
 const m=currentWeeklyMenu();if(!m)return null;
 const recipes=Object.values(m.days).flatMap(x=>Object.values(x)).map(recipeByAnyId).filter(Boolean);
 const text=recipes.map(r=>(r.name+' '+(r.flavor||'')+' '+(r.items||[]).map(i=>i[0]).join(' ')).toLowerCase());
 const count=(arr)=>text.filter(t=>arr.some(k=>t.includes(k))).length;
 return {
  fish:count(FOOD_GROUP_HINTS.fish),legumes:count(FOOD_GROUP_HINTS.legumes),
  veg:count(FOOD_GROUP_HINTS.veg),fruit:count(FOOD_GROUP_HINTS.fruit),
  variety:menuVarietyScore(m)
 };
}
function weeklyCoverageMarkupV71(){
 const c=weeklyCoverageV71();if(!c)return'';
 return `<div class="coverage-grid">
  <div class="${c.fish>=3?'ok':'warn'}"><span>Pescado/marisco</span><b>${c.fish}</b><small>presencias</small></div>
  <div class="${c.legumes>=2?'ok':'warn'}"><span>Legumbres</span><b>${c.legumes}</b><small>presencias</small></div>
  <div class="${c.veg>=7?'ok':'warn'}"><span>Verduras</span><b>${c.veg}</b><small>presencias</small></div>
  <div class="${c.variety>=35?'ok':'warn'}"><span>Variedad</span><b>${c.variety}%</b><small>sin monotonía</small></div>
 </div>`;
}

function buildWeeklyMenu(){
 const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const menu={id:uid(),createdAt:new Date().toISOString(),days:{}},used={};
 Object.keys(mealLabels).forEach(t=>used[t]=[]);
 days.forEach((d,di)=>{
  menu.days[d]={};
  Object.keys(mealLabels).forEach(type=>{
   const pool=smartRecipeList(type).filter(r=>!used[type].slice(-2).includes(r.id));
   const r=pool[0]||smartRecipeList(type)[0];
   menu.days[d][type]=r?.id; if(r)used[type].push(r.id);
  });
 });
 const a=store('weeklyMenus');a.unshift(menu);save('weeklyMenus',a);toast('Menú semanal generado con rotación');renderNutrition();
}
function weeklyMenuMarkup(){
 const m=currentWeeklyMenu();if(!m)return'<p class="muted">Genera el menú semanal.</p>';
 return `${weeklyCoverageMarkupV71()}${Object.entries(m.days).map(([d,ms])=>`<div class="week-day-card"><h3>${d}</h3>${Object.entries(ms).map(([t,id])=>{const r=recipeByAnyId(id);return`<div class="week-meal"><span>${mealLabels[t]}</span><b>${r?.name||'-'}</b></div>`}).join('')}</div>`).join('')}`;
}

function batchCookingPlan(){
 const m=currentWeeklyMenu();if(!m)return toast('Genera primero el menú semanal');
 const recipeIds=[...new Set(Object.values(m.days).flatMap(x=>Object.values(x)))];
 const recipes=recipeIds.map(recipeByAnyId).filter(Boolean);
 const plan={
  id:uid(),date:todayISO(),
  proteins:[...new Set(recipes.flatMap(r=>(r.items||[]).filter(i=>['pollo','lomo','ternera','pavo'].some(k=>String(i[0]).toLowerCase().includes(k))).map(i=>i[0])))],
  carbs:[...new Set(recipes.flatMap(r=>(r.items||[]).filter(i=>['arroz','pasta','patata','garbanzo'].some(k=>String(i[0]).toLowerCase().includes(k))).map(i=>i[0])))],
  veg:[...new Set(recipes.flatMap(r=>(r.items||[]).filter(i=>FOOD_GROUP_HINTS.veg.some(k=>String(i[0]).toLowerCase().includes(k))).map(i=>i[0])))]
 };
 const a=store('batchPlans');a.unshift(plan);save('batchPlans',a);renderNutrition();
}
function batchMarkup(){
 const p=store('batchPlans')[0];
 if(!p)return `<div class="card"><h3>Batch cooking</h3><p class="muted">Genera el menú y crea un plan de preparación.</p><button class="btn primary" onclick="batchCookingPlan()">Crear plan</button></div>`;
 return `<div class="card"><div class="section-title"><h3>Batch cooking de la semana</h3><button class="btn small" onclick="batchCookingPlan()">Recalcular</button></div>
 <ol class="guide-list">
  <li><b>Proteínas:</b> ${p.proteins.join(', ')||'Preparar al día'}</li>
  <li><b>Hidratos:</b> ${p.carbs.join(', ')||'Preparar al día'}</li>
  <li><b>Verduras:</b> ${p.veg.join(', ')||'Lavar y cortar variedad'}</li>
  <li>Separar porciones y etiquetar fecha.</li>
  <li>Dejar pescado y ensaladas delicadas para cocinar más cerca del consumo.</li>
 </ol><p class="note">Objetivo: reducir trabajo semanal sin sacrificar variedad.</p></div>`;
}

function pantryExpiryAlerts(){
 const now=new Date();now.setHours(0,0,0,0);
 return store('pantry').filter(x=>x.expiry).map(x=>{
  const d=new Date(x.expiry+'T00:00:00');return{...x,days:Math.ceil((d-now)/86400000)}
 }).filter(x=>x.days<=4).sort((a,b)=>a.days-b.days);
}
function expiryMarkup(){
 const a=pantryExpiryAlerts();if(!a.length)return'';
 return `<div class="banner warn"><b>Aprovechar primero</b><p>${a.map(x=>`${x.name}: ${x.days<0?'caducado':x.days===0?'hoy':x.days+' días'}`).join(' · ')}</p></div>`;
}

function addCustomRecipe(){
 openModal(`<span class="eyebrow">RECETA PROPIA</span><h2>Añadir receta</h2>`,
 `<label>Nombre<input id="crName"></label>
 <label>Momento<select id="crMeal">${Object.entries(mealLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
 <label>Estilo<input id="crFlavor" placeholder="Mediterráneo, rápido..."></label>
 <label>Tiempo (min)<input id="crTime" type="number"></label>
 <label>Ingredientes<textarea id="crItems" placeholder="Uno por línea: Pollo | 180 | g | en crudo"></textarea></label>
 <label>Preparación<textarea id="crSteps" placeholder="Un paso por línea"></textarea></label>
 <button class="btn primary" onclick="saveCustomRecipe()">Guardar receta</button>`);
}
function saveCustomRecipe(){
 const items=$('#crItems').value.split('\n').map(x=>x.split('|').map(v=>v.trim())).filter(x=>x[0]).map(x=>[x[0],finite(x[1],1),x[2]||'unidad',x[3]||'tal como se consume']);
 const r={id:'custom-'+uid(),name:$('#crName').value.trim(),meal:$('#crMeal').value,flavor:$('#crFlavor').value.trim()||'Propio',time:finite($('#crTime').value,15),items,steps:$('#crSteps').value.split('\n').filter(Boolean),nutrition:{kcal:0,protein:0,carbs:0,fat:0,fiber:0}};
 if(!r.name||!items.length)return toast('Añade nombre e ingredientes');
 const a=store('customRecipes');a.unshift(r);save('customRecipes',a);closeModal();toast('Receta propia guardada');renderNutrition();
}

async function saveRecipePhoto(id,input){
 const f=input.files?.[0];if(!f)return;
 const data=await fileData(f),m=store('recipeMedia');m[id]={...(m[id]||{}),photo:data};save('recipeMedia',m);toast('Foto guardada');openRecipe(id);
}
function saveRecipeVideo(id){
 const url=$('#recipeVideoUrl').value.trim(),m=store('recipeMedia');m[id]={...(m[id]||{}),video:url};save('recipeMedia',m);toast('Vídeo guardado');openRecipe(id);
}
function openRecipe(id){
 const r=recipeByAnyId(id);if(!r)return;
 const n=r.nutrition||{},av=recipeAvailability(r),media=store('recipeMedia')[id]||{};
 openModal(`<span class="eyebrow">RECETA</span><h2>${r.name}</h2>`,
 `${media.photo?`<img class="recipe-photo" src="${media.photo}" alt="">`:'<div class="recipe-photo placeholder">Añade una foto propia</div>'}
 <div class="recipe-meta"><span>${r.flavor||'Variado'}</span><span>${r.time||'-'} min</span><span>${av.pct}% despensa</span></div>
 <h3>Ingredientes</h3><ul class="meal-items">${(r.items||[]).map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]}</small></li>`).join('')}</ul>
 <h3>Preparación</h3><ol class="guide-list">${(r.steps||[]).map(x=>`<li>${x}</li>`).join('')}</ol>
 <h3>Valor nutricional aproximado</h3><div class="nutrition-grid"><div><span>Proteína</span><b>${n.protein||'-'} g</b></div><div><span>Hidratos</span><b>${n.carbs||'-'} g</b></div><div><span>Grasa</span><b>${n.fat||'-'} g</b></div><div><span>Fibra</span><b>${n.fiber||'-'} g</b></div></div>
 <div class="form-grid"><label>Foto propia<input type="file" accept="image/*" onchange="saveRecipePhoto('${id}',this)"></label><label>Vídeo/URL<input id="recipeVideoUrl" value="${media.video||''}" placeholder="Enlace opcional"></label></div><button class="btn" onclick="saveRecipeVideo('${id}')">Guardar vídeo</button>
 ${media.video?`<p><a class="app-link" href="${media.video}" target="_blank" rel="noopener">Abrir vídeo de la receta</a></p>`:''}
 <button class="btn primary" onclick="selectRecipeForToday('${r.meal}','${r.id}')">Usar hoy</button>`);
}

function substitutionsForItem(item){
 const n=String(item[0]).toLowerCase();
 const groups=[
  {keys:['arroz','pasta','patata','pan','garbanzo'],alts:[['Arroz integral',60,'g','en crudo'],['Pasta integral',70,'g','en crudo'],['Patata',250,'g','cocida'],['Pan integral',80,'g','tal como se consume'],['Garbanzos',180,'g','cocidos']]},
  {keys:['pollo','lomo','ternera','pavo','merluza','salmón','bacalao','atún','pescado'],alts:[['Pechuga de pollo',180,'g','en crudo'],['Lomo de cerdo magro',180,'g','en crudo'],['Ternera magra',180,'g','en crudo'],['Merluza',200,'g','en crudo'],['Bacalao',200,'g','en crudo'],['Atún al natural',160,'g','escurrido']]},
  {keys:['verdura','ensalada','espinaca','pimiento','tomate'],alts:[['Verduras variadas',300,'g','en crudo'],['Ensalada completa',300,'g','tal como se consume'],['Pimientos asados',250,'g','cocinados'],['Espinacas',250,'g','cocinadas']]}
 ];
 const g=groups.find(g=>g.keys.some(k=>n.includes(k)));return g?g.alts.filter(a=>a[0].toLowerCase()!==n):[];
}
function smartIngredientSwap(type){
 const r=activeProRecipe(type),opts=[];
 (r.items||[]).forEach((item,itemIndex)=>substitutionsForItem(item).slice(0,4).forEach(alt=>opts.push({itemIndex,original:item[0],alt})));
 openModal(`<span class="eyebrow">CAMBIAR INGREDIENTE</span><h2>${r.name}</h2>`,
 `<p class="muted">Sustituciones orientativas para mantener un plato parecido y evitar quedarte sin opciones.</p><div class="alt-grid">${opts.map((o,i)=>`<button class="alt-btn" onclick="applyIngredientSwapV71('${type}',${i})"><b>${o.original} → ${o.alt[0]}</b><small>${o.alt[1]} ${o.alt[2]} · ${o.alt[3]}</small></button>`).join('')||'<p>No hay sustituciones disponibles.</p>'}</div>`);
 window._p85SwapOptions=opts;
}
function applyIngredientSwapV71(type,index){
 const r=activeProRecipe(type),o=window._p85SwapOptions?.[index];if(!o)return;
 const clone=JSON.parse(JSON.stringify(r));clone.id='swap-'+uid();clone.name=r.name+' · adaptada';
 clone.items[o.itemIndex]=[o.alt[0],o.alt[1],o.alt[2],o.alt[3]];
 const sw=store('mealSwaps').filter(a=>!(a.date===todayISO()&&a.type===type));sw.unshift({date:todayISO(),type,custom:clone});save('mealSwaps',sw);closeModal();toast('Ingrediente cambiado');renderNutrition();
}

function socialAdviceV71(){
 const s=store('socialMeals').find(x=>x.date===todayISO());if(!s)return'';
 return `<div class="banner warn"><b>${s.type} registrada</b><p>El día sigue siendo válido. Mantén comidas normales, variedad, agua y vuelve al plan en la siguiente comida.</p></div>`;
}
function saveSocialMeal(){
 const a=store('socialMeals');a.unshift({id:uid(),date:todayISO(),type:$('#socialType').value,moment:$('#socialMoment').value});save('socialMeals',a);closeModal();toast('Comida social guardada');renderNutrition();
}

function nutritionHistoryMarkup(){
 const checks=store('nutritionCheckins').slice(0,7);
 const logs=store('nutritionLog').filter(x=>x.done);
 const days=new Set(logs.map(x=>x.date)).size;
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">HISTORIAL</span><h3>Adherencia y sensaciones</h3></div><span class="pill">${days} días con registro</span></div>
 ${checks.length?checks.map(x=>`<div class="pr-row"><span>${x.date} · hambre ${x.hunger||'-'} · energía ${x.energy||'-'}</span><b>saciedad ${x.satiety||'-'}</b></div>`).join(''):'<p class="muted">Aún no hay suficientes registros.</p>'}
 </div>`;
}

function recipeCardV7(r){
 const n=r.nutrition||{},av=recipeAvailability(r);
 return `<button class="recipe-card" onclick="openRecipe('${r.id}')"><div><span class="eyebrow">${mealLabels[r.meal]||r.meal}</span><h3>${r.name}</h3><p>${r.flavor||'Variado'} · ${r.time||'-'} min</p></div><div class="recipe-score"><b>${recipeScore(r.id)}</b><small>/10</small></div><div class="recipe-macros"><span>${n.protein||'-'} g prot.</span><span>${n.fiber||'-'} g fibra</span><span>${av.pct}% despensa</span></div></button>`;
}

function renderNutritionV7(){
 $('#nutricion').innerHTML=`<div class="card nutrition-dashboard"><div class="section-title"><div><span class="eyebrow">NUTRICIÓN INTELIGENTE</span><h2>Aprender a comer con variedad</h2></div><span class="pill green">V7.1 COMPLETO</span></div>
 <div class="btn-row"><button class="btn primary" onclick="buildWeeklyMenu()">Generar menú semanal</button><button class="btn" onclick="generateV8Shopping()">Generar compra</button></div>
 <div class="btn-row" style="margin-top:8px"><button class="btn secondary" onclick="openSocialMeal()">Comida social</button><button class="btn secondary" onclick="restaurantMode()">Modo restaurante</button></div>
 </div>
 ${expiryMarkup()}${socialAdviceV71()}${dailyBalanceMarkup()}
 <div class="tabs"><button class="tab-btn active" onclick="nvTab('today',this)">Hoy</button><button class="tab-btn" onclick="nvTab('week',this)">Semana</button><button class="tab-btn" onclick="nvTab('recipes',this)">Recetas</button><button class="tab-btn" onclick="nvTab('shopping',this)">Compra</button><button class="tab-btn" onclick="nvTab('pantry',this)">Despensa</button><button class="tab-btn" onclick="nvTab('batch',this)">Preparación</button><button class="tab-btn" onclick="nvTab('learning',this)">Aprendizaje</button></div>
 <div id="nvToday">${Object.keys(mealLabels).map(proMealCard).join('')}${nutritionCheckinMarkup()}</div>
 <div id="nvWeek" class="hidden">${weeklyMenuMarkup()}</div>
 <div id="nvRecipes" class="hidden"><div class="card"><button class="btn primary" onclick="addCustomRecipe()">+ Añadir receta propia</button></div><div class="recipe-library">${completeRecipeList().map(recipeCardV7).join('')}</div></div>
 <div id="nvShopping" class="hidden"><div class="card">${shoppingMarkup()}</div></div>
 <div id="nvPantry" class="hidden"><div class="card"><div class="form-grid"><label>Producto<input id="pantryName"></label><label>Cantidad<input id="pantryQty" type="number"></label><label>Unidad<select id="pantryUnit"><option>g</option><option>kg</option><option>unidad</option><option>lata</option></select></label><label>Caducidad<input id="pantryExpiry" type="date"></label></div><button class="btn primary" onclick="addPantryV7()">Guardar</button>${store('pantry').map((x,i)=>`<div class="pantry-row"><span>•</span><div><b>${x.name}</b><small>${x.qty} ${x.unit||'g'} ${x.expiry?'· '+x.expiry:''}</small></div><button class="btn small danger" onclick="let p=store('pantry');p.splice(${i},1);save('pantry',p);renderNutrition()">Quitar</button></div>`).join('')}</div></div>
 <div id="nvBatch" class="hidden">${batchMarkup()}</div>
 <div id="nvLearning" class="hidden">${learningMarkup()}${nutritionHistoryMarkup()}</div>`;
}
function nvTab(id,b){
 $$('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');
 ['Today','Week','Recipes','Shopping','Pantry','Batch','Learning'].forEach(x=>$('#nv'+x).classList.toggle('hidden',x.toLowerCase()!==id.toLowerCase()));
}


// ===== V7.2 NUTRICIÓN DEFINITIVA =====
function hydrationToday(){return store('hydrationLog').filter(x=>x.date===todayISO()).reduce((a,x)=>a+finite(x.ml),0)}
function addWater(ml){const a=store('hydrationLog');a.unshift({id:uid(),date:todayISO(),ml});save('hydrationLog',a);renderNutrition()}
function hydrationMarkup(){const ml=hydrationToday(),pct=clamp(Math.round(ml/2000*100),0,100);return `<div class="card hydration-card"><div class="section-title"><div><span class="eyebrow">HIDRATACIÓN</span><h3>${ml} ml registrados</h3></div><span class="pill ${pct>=80?'green':'blue'}">${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="btn-row" style="margin-top:10px"><button class="btn small" onclick="addWater(250)">+250 ml</button><button class="btn small" onclick="addWater(500)">+500 ml</button></div><p class="note">Referencia general de 2 L/día según la documentación aportada; puede individualizarse.</p></div>`}
function trainingNutritionContext(){const d=store('workoutDraft'),s=store('sessions')[0];if(d)return{label:'Fuerza prevista',trained:true};if(s?.date===todayISO())return{label:'Fuerza realizada',trained:true};return{label:'Día de recuperación',trained:false}}
function trainingNutritionMarkup(){const c=trainingNutritionContext();return `<div class="card training-nutrition"><span class="eyebrow">ENTRENAMIENTO ↔ NUTRICIÓN</span><h3>${c.label}</h3><p>${c.trained?'Mantén proteína repartida, hidratación y una fuente de hidratos en las comidas principales para apoyar el rendimiento y la recuperación.':'Prioriza regularidad, proteína, verduras, fruta e hidratos según apetito y actividad.'}</p></div>`}
function nutritionQualityScore(){const g=todayFoodGroupCoverage();let s=50;if(g.fruit>=1)s+=10;if(g.veg>=2)s+=15;if(g.dairy>=1)s+=5;if(g.wholegrain>=1||g.legumes>=1)s+=10;const fish=selectedRecipesToday().some(r=>(r.name||'').toLowerCase().match(/salmón|merluza|bacalao|atún|pescado|marisco/));if(fish)s+=10;return clamp(s,0,100)}
function nextMealInfo(){const o=['breakfast','midmorning','lunch','snack','dinner'],done=new Set(store('nutritionLog').filter(x=>x.date===todayISO()&&x.done).map(x=>x.type)),t=o.find(x=>!done.has(x));return t?{label:mealLabels[t],recipe:activeProRecipe(t)}:{label:'Día completado',recipe:null}}
function nutritionStatusText(){const q=nutritionQualityScore(),h=hydrationToday(),c=store('nutritionCheckins').find(x=>x.date===todayISO());let a=[];a.push(q>=80?'Buen equilibrio y variedad en el menú de hoy.':'Conviene reforzar variedad de fruta, verdura o proteína.');if(h<1000)a.push('La hidratación registrada es todavía baja.');if(c?.energy&&c.energy<=4)a.push('La energía es baja: revisa cantidad y reparto antes de reducir comida.');return a.join(' ')}
function nutritionDashboardV72(){const logs=store('nutritionLog').filter(x=>x.date===todayISO()&&x.done).length,n=nextMealInfo(),q=nutritionQualityScore(),c=store('nutritionCheckins').find(x=>x.date===todayISO());return `<div class="card nutrition-hero"><div class="section-title"><div><span class="eyebrow">NUTRICIÓN HOY</span><h2>${logs}/5 comidas registradas</h2></div><span class="quality-ring">${q}</span></div><div class="dashboard-grid"><div><span>Próxima comida</span><b>${n.label}</b><small>${n.recipe?.name||'—'}</small></div><div><span>Hidratación</span><b>${hydrationToday()} ml</b><small>referencia 2.000 ml</small></div><div><span>Energía</span><b>${c?.energy||'—'}/10</b></div><div><span>Hambre</span><b>${c?.hunger||'—'}/10</b></div></div><div class="assistant-item"><b>Recomendación</b><p>${nutritionStatusText()}</p></div></div>`}
function openChangeReason(type){const r=activeProRecipe(type);openModal(`<span class="eyebrow">CAMBIAR COMIDA</span><h2>${r.name}</h2>`,`<div class="alt-grid"><button class="alt-btn" onclick="showChangeOptions('${type}','missing')"><b>No tengo el alimento</b><small>Priorizar despensa</small></button><button class="alt-btn" onclick="showChangeOptions('${type}','outside')"><b>Estoy fuera de casa</b><small>Plan B práctico</small></button><button class="alt-btn" onclick="showChangeOptions('${type}','taste')"><b>No me apetece</b><small>Buscar variedad</small></button><button class="alt-btn" onclick="showChangeOptions('${type}','time')"><b>Tengo poco tiempo</b><small>Opciones rápidas</small></button><button class="alt-btn" onclick="showChangeOptions('${type}','social')"><b>Comida social</b><small>Adaptar sin castigo</small></button></div>`)}
function showChangeOptions(type,reason){if(reason==='social'){closeModal();openSocialMeal();return}if(reason==='outside'){closeModal();openOutOfHomeMode(type);return}let list=smartRecipeList(type).filter(r=>r.id!==activeProRecipe(type).id);if(reason==='missing')list=list.sort((a,b)=>recipeAvailability(b).pct-recipeAvailability(a).pct);if(reason==='time')list=list.sort((a,b)=>finite(a.time,99)-finite(b.time,99));if(reason==='taste')list=list.filter(r=>r.flavor!==activeProRecipe(type).flavor);openModal(`<span class="eyebrow">ALTERNATIVAS</span><h2>${mealLabels[type]}</h2>`,`<div class="alt-grid">${list.slice(0,6).map(r=>`<button class="alt-btn" onclick="chooseReplacement('${type}','${r.id}','${reason}')"><b>${r.name}</b><small>${r.flavor||'Variado'} · ${recipeAvailability(r).pct}% despensa · ${finite(r.nutrition?.protein)} g proteína</small></button>`).join('')}</div>`)}
function chooseReplacement(type,id,reason){const old=activeProRecipe(type),sel=store('mealSelections');if(!sel[todayISO()])sel[todayISO()]={};sel[todayISO()][type]=id;save('mealSelections',sel);const edu=store('nutritionEducationSeen');edu.unshift({date:todayISO(),message:`Has cambiado ${old?.name||'el plato'} por ${recipeByAnyId(id)?.name||'otra opción'}. Buscamos mantener una estructura parecida de proteína, vegetales y energía, no copiar calorías exactas.`});save('nutritionEducationSeen',edu);closeModal();toast('Comida cambiada');renderNutrition()}
function latestEducationMarkup(){const x=store('nutritionEducationSeen')[0];return x?`<div class="card education-card"><span class="eyebrow">APRENDER A COMER</span><p>${x.message}</p></div>`:''}
function openOutOfHomeMode(type='lunch'){openModal(`<span class="eyebrow">PLAN B FUERA DE CASA</span><h2>${mealLabels[type]||'Comida'}</h2>`,`<div class="alt-grid">${[['Bocadillo integral de pavo + tomate + fruta','Proteína + cereal integral + fruta'],['Ensalada completa con atún/pollo + pan','Verduras + proteína + hidrato'],['Yogur natural + fruta + tostada integral','Práctico para media mañana/merienda'],['Carne/pescado plancha + verdura + patata/arroz','Similar a un plato casero'],['Tapa de proteína + ensalada + pequeña ración','Útil en bar o cafetería']].map((x,i)=>`<button class="alt-btn" onclick="saveOutOfHome('${type}',${i})"><b>${x[0]}</b><small>${x[1]}</small></button>`).join('')}</div>`)}
function saveOutOfHome(type,index){const opts=['Bocadillo integral de pavo + tomate + fruta','Ensalada completa con atún/pollo + pan','Yogur natural + fruta + tostada integral','Carne/pescado plancha + verdura + patata/arroz','Tapa de proteína + ensalada + pequeña ración'];const a=store('outOfHomeHistory');a.unshift({id:uid(),date:todayISO(),type,choice:opts[index]});save('outOfHomeHistory',a);closeModal();toast('Plan B registrado')}
function nutritionTrendMultiweek(){const m=[...store('measures')].sort((a,b)=>a.date.localeCompare(b.date)).slice(-4);if(m.length<3)return{status:'insufficient',message:'Aún faltan varias semanas para adaptar el plan.'};const dw=finite(m.at(-1).weight)-finite(m[0].weight),dc=finite(m.at(-1).waist)-finite(m[0].waist);if(dw<-1||dc<-1)return{status:'progress',message:'La tendencia de varias semanas es favorable. No hace falta recortar comida.'};if(Math.abs(dw)<.4&&Math.abs(dc)<.5)return{status:'plateau',message:'La tendencia está estable. Revisa adherencia, hambre, energía y entrenamiento antes de cambiar cantidades.'};return{status:'review',message:'La evolución requiere revisión, sin recortes agresivos automáticos.'}}
function adaptationMarkup(){const t=nutritionTrendMultiweek();return `<div class="card"><span class="eyebrow">ADAPTACIÓN PROGRESIVA</span><h3>${t.status==='progress'?'Mantener':'Revisar con datos'}</h3><p>${t.message}</p><p class="note">Se usan tendencias de varias semanas, no una sola medición.</p></div>`}
function nutritionWeeklyReport(){const c=store('nutritionCheckins').slice(0,7),r={id:uid(),date:todayISO(),adherence:weeklyAdherence(),variety:menuVarietyScore(currentWeeklyMenu()),avgHunger:c.length?(c.reduce((a,x)=>a+finite(x.hunger),0)/c.length).toFixed(1):null,avgEnergy:c.length?(c.reduce((a,x)=>a+finite(x.energy),0)/c.length).toFixed(1):null,trend:nutritionTrendMultiweek()};const a=store('nutritionWeeklyReports');a.unshift(r);save('nutritionWeeklyReports',a);return r}
function openNutritionWeeklyReport(){const r=nutritionWeeklyReport();openModal(`<span class="eyebrow">RESUMEN SEMANAL</span><h2>Nutrición Proyecto85 Pro</h2>`,`<div class="nutrition-grid"><div><span>Adherencia</span><b>${r.adherence.total}%</b></div><div><span>Variedad</span><b>${r.variety||0}%</b></div><div><span>Hambre</span><b>${r.avgHunger||'—'}</b></div><div><span>Energía</span><b>${r.avgEnergy||'—'}</b></div></div><h3>Adaptación</h3><p>${r.trend.message}</p>`)}
function nutritionSafetyMarkup(){return `<div class="card safety-card"><span class="eyebrow">REGLAS DEL SISTEMA</span><p>✓ Una mala puntuación no prohíbe un alimento.</p><p>✓ No hay recortes agresivos automáticos.</p><p>✓ La pauta antigua de 1.200 kcal se usa como referencia de raciones/equivalencias, no como objetivo automático.</p><p>✓ Los cambios importantes se apoyan en tendencias de varias semanas.</p></div>`}
function proMealCard(type){const r=activeProRecipe(type),n=r.nutrition||{},log=store('nutritionLog').find(x=>x.date===todayISO()&&x.type===type),score=recipeScore(r.id);return `<div class="meal-card"><div class="meal-head"><div><span class="eyebrow">${mealLabels[type]}</span><h3>${r.name}</h3><div class="recipe-meta"><span>${r.flavor||'Variado'}</span><span>${r.time||'-'} min</span><span>${finite(n.protein)} g proteína</span></div></div><button class="btn small" onclick="openRecipe('${r.id}')">Ver receta</button></div><ul class="meal-items">${(r.items||[]).map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]||'tal como se consume'}</small></li>`).join('')}</ul><div class="btn-row"><button class="btn small secondary" onclick="smartIngredientSwap('${type}')">Cambiar ingrediente</button><button class="btn small secondary" onclick="openChangeReason('${type}')">Cambiar comida</button></div><label class="check" style="margin-top:12px"><input type="checkbox" ${log?.done?'checked':''} onchange="toggleMeal('${type}',this.checked)"> Comida realizada</label><div class="rating-row"><span>Puntuación:</span>${[1,2,3,4,5,6,7,8,9,10].map(v=>`<button class="score-btn ${score===v?'active':''}" onclick="rateMeal('${r.id}',${v});renderNutrition()">${v}</button>`).join('')}</div></div>`}
function renderNutritionV7(){$('#nutricion').innerHTML=`${nutritionDashboardV72()}${hydrationMarkup()}${trainingNutritionMarkup()}${endocrineReferenceMarkup()}${expiryMarkup()}${socialAdviceV71()}${latestEducationMarkup()}<div class="tabs"><button class="tab-btn active" onclick="nvTab('today',this)">Hoy</button><button class="tab-btn" onclick="nvTab('week',this)">Semana</button><button class="tab-btn" onclick="nvTab('recipes',this)">Recetas</button><button class="tab-btn" onclick="nvTab('shopping',this)">Compra</button><button class="tab-btn" onclick="nvTab('pantry',this)">Despensa</button><button class="tab-btn" onclick="nvTab('batch',this)">Preparación</button><button class="tab-btn" onclick="nvTab('learning',this)">Aprendizaje</button></div><div id="nvToday">${Object.keys(mealLabels).map(proMealCard).join('')}${nutritionCheckinMarkup()}</div><div id="nvWeek" class="hidden">${weeklyMenuMarkup()}<div class="card"><button class="btn primary" onclick="openNutritionWeeklyReport()">Generar resumen semanal</button></div>${adaptationMarkup()}</div><div id="nvRecipes" class="hidden"><div class="card"><button class="btn primary" onclick="addCustomRecipe()">+ Añadir receta propia</button></div><div class="recipe-library">${completeRecipeList().map(recipeCardV7).join('')}</div></div><div id="nvShopping" class="hidden"><div class="card">${shoppingMarkup()}</div></div><div id="nvPantry" class="hidden"><div class="card"><div class="form-grid"><label>Producto<input id="pantryName"></label><label>Cantidad<input id="pantryQty" type="number"></label><label>Unidad<select id="pantryUnit"><option>g</option><option>kg</option><option>unidad</option><option>lata</option></select></label><label>Caducidad<input id="pantryExpiry" type="date"></label></div><button class="btn primary" onclick="addPantryV7()">Guardar</button>${store('pantry').map((x,i)=>`<div class="pantry-row"><span>•</span><div><b>${x.name}</b><small>${x.qty} ${x.unit||'g'} ${x.expiry?'· '+x.expiry:''}</small></div><button class="btn small danger" onclick="let p=store('pantry');p.splice(${i},1);save('pantry',p);renderNutrition()">Quitar</button></div>`).join('')}</div></div><div id="nvBatch" class="hidden">${batchMarkup()}</div><div id="nvLearning" class="hidden">${learningMarkup()}${nutritionHistoryMarkup()}${nutritionSafetyMarkup()}</div>`}


// ==========================
// V7.3 · Biblioteca ampliada
// ==========================
const V73_RECIPES=[
{id:'v73_arroz_pollo',name:'Arroz integral con pollo y verduras',meal:'lunch',flavor:'Mediterráneo',time:30,items:[['Arroz integral',60,'g','en crudo'],['Pechuga de pollo',180,'g','en crudo'],['Verduras variadas',300,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Cuece el arroz.','Cocina el pollo.','Saltea las verduras.','Mezcla y sirve.'],nutrition:{protein:48,carbs:55,fat:15,fiber:10}},
{id:'v73_paella',name:'Paella sencilla de pollo y verduras',meal:'lunch',flavor:'Español',time:35,items:[['Arroz',60,'g','en crudo'],['Pollo',160,'g','en crudo'],['Verduras',250,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Sofríe verduras.','Añade pollo.','Incorpora arroz y caldo.','Cocina hasta el punto deseado.'],nutrition:{protein:43,carbs:55,fat:16,fiber:8}},
{id:'v73_lentejas',name:'Lentejas con verduras y proteína magra',meal:'lunch',flavor:'Tradicional',time:35,items:[['Lentejas',200,'g','cocidas'],['Verduras variadas',250,'g','cocinadas'],['Pavo o pollo',120,'g','en crudo'],['Aceite de oliva',10,'g','medido']],steps:['Cuece o calienta las lentejas.','Añade verduras.','Incorpora proteína magra.'],nutrition:{protein:40,carbs:50,fat:15,fiber:17}},
{id:'v73_alubias',name:'Alubias con verduras y atún',meal:'lunch',flavor:'Mediterráneo',time:15,items:[['Alubias',200,'g','cocidas'],['Atún al natural',120,'g','escurrido'],['Tomate y pimiento',250,'g','tal como se consume'],['Aceite de oliva',10,'g','medido']],steps:['Aclara las alubias.','Añade atún y verduras.','Aliña al final.'],nutrition:{protein:39,carbs:42,fat:15,fiber:15}},
{id:'v73_garbanzos_espinacas',name:'Garbanzos con espinacas',meal:'lunch',flavor:'Andaluz',time:20,items:[['Garbanzos',200,'g','cocidos'],['Espinacas',250,'g','cocinadas'],['Proteína magra',120,'g','cocinada'],['Aceite de oliva',10,'g','medido']],steps:['Saltea espinacas.','Añade garbanzos.','Incorpora proteína.'],nutrition:{protein:40,carbs:48,fat:16,fiber:18}},
{id:'v73_pasta_atun',name:'Pasta integral con atún y tomate',meal:'lunch',flavor:'Italiano',time:20,items:[['Pasta integral',70,'g','en crudo'],['Atún al natural',140,'g','escurrido'],['Tomate',200,'g','cocinado'],['Verduras',150,'g','en crudo']],steps:['Cuece la pasta.','Calienta tomate y verduras.','Añade atún y mezcla.'],nutrition:{protein:42,carbs:62,fat:10,fiber:10}},
{id:'v73_pavo_patata',name:'Pavo a la plancha con patata y ensalada',meal:'lunch',flavor:'Simple',time:20,items:[['Pavo',180,'g','en crudo'],['Patata',250,'g','cocida'],['Ensalada completa',300,'g','tal como se consume'],['Aceite de oliva',10,'g','medido']],steps:['Cocina el pavo.','Cuece o asa la patata.','Sirve con ensalada.'],nutrition:{protein:43,carbs:45,fat:14,fiber:9}},
{id:'v73_ternera_patata',name:'Ternera magra con patata y pimientos',meal:'lunch',flavor:'Español',time:25,items:[['Ternera magra',180,'g','en crudo'],['Patata',220,'g','cocida'],['Pimientos asados',250,'g','cocinados']],steps:['Cocina la ternera.','Acompaña con patata y pimientos.'],nutrition:{protein:40,carbs:40,fat:17,fiber:7}},
{id:'v73_conejo',name:'Conejo con arroz y verduras',meal:'lunch',flavor:'Tradicional',time:35,items:[['Conejo',200,'g','en crudo'],['Arroz',60,'g','en crudo'],['Verduras variadas',250,'g','en crudo']],steps:['Dora el conejo.','Añade verduras.','Acompaña con arroz.'],nutrition:{protein:45,carbs:54,fat:14,fiber:8}},
{id:'v73_merluza_patata',name:'Merluza con patata y ensalada',meal:'dinner',flavor:'Ligero',time:20,items:[['Merluza',200,'g','en crudo'],['Patata',200,'g','cocida'],['Ensalada completa',300,'g','tal como se consume'],['Aceite de oliva',10,'g','medido']],steps:['Cocina la merluza.','Acompaña con patata y ensalada.'],nutrition:{protein:38,carbs:38,fat:14,fiber:8}},
{id:'v73_bacalao_verduras',name:'Bacalao con verduras y arroz',meal:'dinner',flavor:'Mediterráneo',time:25,items:[['Bacalao',200,'g','en crudo'],['Arroz integral',50,'g','en crudo'],['Verduras',300,'g','en crudo']],steps:['Cocina el bacalao.','Cuece el arroz.','Sirve con verduras.'],nutrition:{protein:42,carbs:45,fat:10,fiber:8}},
{id:'v73_sardinas',name:'Sardinas con ensalada y pan integral',meal:'dinner',flavor:'Mediterráneo',time:15,items:[['Sardinas',180,'g','cocinadas'],['Ensalada completa',300,'g','tal como se consume'],['Pan integral',60,'g','tal como se consume']],steps:['Cocina o sirve las sardinas.','Acompaña con ensalada y pan.'],nutrition:{protein:38,carbs:32,fat:20,fiber:8}},
{id:'v73_atun_tomate',name:'Atún con tomate, aguacate y pan integral',meal:'dinner',flavor:'Rápido',time:10,items:[['Atún al natural',160,'g','escurrido'],['Tomate',250,'g','tal como se consume'],['Aguacate',50,'g','tal como se consume'],['Pan integral',60,'g','tal como se consume']],steps:['Escurre el atún.','Corta tomate y aguacate.','Sirve con pan.'],nutrition:{protein:42,carbs:38,fat:16,fiber:10}},
{id:'v73_salmon_esparragos',name:'Salmón con espárragos y patata',meal:'dinner',flavor:'Mediterráneo',time:20,items:[['Salmón',180,'g','en crudo'],['Espárragos',250,'g','cocinados'],['Patata',180,'g','cocida']],steps:['Cocina el salmón.','Saltea espárragos.','Acompaña con patata.'],nutrition:{protein:38,carbs:34,fat:23,fiber:7}},
{id:'v73_pollo_calabacin',name:'Pollo con calabacín mediterráneo y arroz',meal:'dinner',flavor:'Mediterráneo',time:20,items:[['Pechuga de pollo',180,'g','en crudo'],['Calabacín',300,'g','cocinado'],['Arroz',50,'g','en crudo']],steps:['Cocina el pollo.','Saltea calabacín.','Acompaña con arroz.'],nutrition:{protein:45,carbs:44,fat:10,fiber:7}},
{id:'v73_lomo_ensalada',name:'Lomo magro con ensalada y patata',meal:'dinner',flavor:'Español',time:20,items:[['Lomo de cerdo magro',180,'g','en crudo'],['Ensalada completa',300,'g','tal como se consume'],['Patata',180,'g','cocida']],steps:['Cocina el lomo.','Sirve con ensalada y patata.'],nutrition:{protein:40,carbs:35,fat:15,fiber:8}},
{id:'v73_desayuno_pavo',name:'Tostada integral con pavo, fruta y café',meal:'breakfast',flavor:'Habitual',time:7,items:[['Pan integral',40,'g','tal como se consume'],['Pavo',70,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Café con leche desnatada',1,'taza','preparado']],steps:['Tuesta el pan.','Añade pavo.','Acompaña con fruta y café.'],nutrition:{protein:24,carbs:44,fat:6,fiber:7}},
{id:'v73_desayuno_qf',name:'Pan integral con queso fresco, fruta y café',meal:'breakfast',flavor:'Alternativo',time:7,items:[['Pan integral',40,'g','tal como se consume'],['Queso fresco sin sal',80,'g','tal como se consume'],['Fruta',1,'pieza','entera'],['Café con leche desnatada',1,'taza','preparado']],steps:['Tuesta el pan.','Añade queso fresco.','Acompaña con fruta y café.'],nutrition:{protein:20,carbs:45,fat:8,fiber:7}},
{id:'v73_media_yogur',name:'Yogur natural con fruta',meal:'midmorning',flavor:'Oficina',time:2,items:[['Yogur natural',1,'unidad','listo'],['Fruta',1,'pieza','entera']],steps:['Servir y consumir.'],nutrition:{protein:9,carbs:28,fat:4,fiber:4}},
{id:'v73_media_pavo',name:'Pavo con pequeña tostada integral',meal:'midmorning',flavor:'Salado',time:3,items:[['Pavo',60,'g','tal como se consume'],['Pan integral',30,'g','tal como se consume']],steps:['Preparar y consumir.'],nutrition:{protein:17,carbs:20,fat:3,fiber:3}},
{id:'v73_media_queso',name:'Queso fresco con fruta',meal:'midmorning',flavor:'Oficina',time:3,items:[['Queso fresco sin sal',80,'g','tal como se consume'],['Fruta',1,'pieza','entera']],steps:['Preparar y consumir.'],nutrition:{protein:14,carbs:24,fat:5,fiber:4}},
{id:'v73_merienda_yogur',name:'Yogur natural con fruta',meal:'snack',flavor:'Simple',time:2,items:[['Yogur natural',1,'unidad','listo'],['Fruta',1,'pieza','entera']],steps:['Servir y consumir.'],nutrition:{protein:9,carbs:28,fat:4,fiber:4}},
{id:'v73_merienda_qf',name:'Queso fresco sin sal con fruta',meal:'snack',flavor:'Simple',time:3,items:[['Queso fresco sin sal',80,'g','tal como se consume'],['Fruta',1,'pieza','entera']],steps:['Servir y consumir.'],nutrition:{protein:14,carbs:24,fat:5,fiber:4}},
{id:'v73_merienda_pavo',name:'Pavo con tostada integral',meal:'snack',flavor:'Salado',time:3,items:[['Pavo',60,'g','tal como se consume'],['Pan integral',30,'g','tal como se consume']],steps:['Preparar y consumir.'],nutrition:{protein:17,carbs:20,fat:3,fiber:3}}
];

function ensureV73Recipes(){
 const custom=store('customRecipes'),ids=new Set(custom.map(r=>r.id));
 V73_RECIPES.forEach(r=>{if(!ids.has(r.id))custom.push(r)});
 save('customRecipes',custom);
}


function currentMenuOrGenerate(){
 let m=currentWeeklyMenu();
 if(!m){
   buildWeeklyMenu();
   m=currentWeeklyMenu();
 }
 return m;
}
function generateV8Shopping(){
 const menu=currentMenuOrGenerate();
 if(!menu)return toast('No se ha podido generar el menú');
 const need={};
 Object.values(menu.days||{}).forEach(meals=>Object.values(meals||{}).forEach(id=>{
  const r=recipeByAnyId(id);if(!r)return;
  (r.items||[]).forEach(i=>{
    const name=String(i[0]),qty=finite(i[1],0),unit=i[2]||'unidad';
    if(!need[name])need[name]={name,qty:0,unit,category:shoppingCategory(name)};
    need[name].qty+=qty;
  });
 }));
 const pantry=store('pantry');
 const list=Object.values(need).map(x=>{
   const have=pantry.find(p=>p.name.toLowerCase()===x.name.toLowerCase());
   const haveQty=finite(have?.qty,0);
   return {...x,have:haveQty,buy:Math.max(0,x.qty-haveQty),owned:haveQty>0,bought:false};
 }).filter(x=>x.buy>0 || !x.owned);
 save('shopping',list);
 toast(`Lista generada: ${list.length} productos`);
 renderNutrition();
 setTimeout(()=>{const tab=[...document.querySelectorAll('.tab-btn')].find(b=>b.textContent.trim()==='Compra');if(tab)nvTab('shopping',tab)},0);
}
function shoppingMarkup(){
 const list=store('shopping');
 if(!list.length)return `<div class="empty-state"><h3>Lista vacía</h3><p>Genera la compra desde el menú semanal.</p><button class="btn primary" onclick="generateV8Shopping()">Generar ahora</button></div>`;
 const groups={};
 list.forEach((x,i)=>{if(!groups[x.category])groups[x.category]=[];groups[x.category].push({...x,index:i})});
 return `<div class="section-title"><div><span class="eyebrow">COMPRA SEMANAL</span><h2>${list.filter(x=>!x.bought).length} pendientes</h2></div><button class="btn small" onclick="generateV8Shopping()">Recalcular</button></div>
 ${Object.entries(groups).map(([cat,items])=>`<div class="shopping-category"><h3>${cat}</h3>${items.map(x=>`<div class="shopping-row"><input type="checkbox" ${x.bought?'checked':''} onchange="shopUpdate(${x.index},'bought',this.checked)"><div><b>${x.name}</b><small>Comprar ${Math.ceil(x.buy)} ${x.unit}${x.have?` · tienes ${x.have} ${x.unit}`:''}</small></div><button class="btn small ${x.owned?'primary':''}" onclick="shopUpdate(${x.index},'owned',!${x.owned})">${x.owned?'En casa':'Tengo'}</button></div>`).join('')}</div>`).join('')}`;
}


function weeklyMenuMarkup(){
 const m=currentWeeklyMenu();
 if(!m)return `<div class="card empty-state"><h3>No hay menú semanal</h3><p>Genera los 7 días completos con un toque.</p><button class="btn primary" onclick="buildWeeklyMenu()">Generar semana</button></div>`;
 const order=['breakfast','midmorning','lunch','snack','dinner'];
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">MENÚ COMPLETO</span><h2>Los 7 días de la semana</h2></div><button class="btn small" onclick="buildWeeklyMenu()">Regenerar</button></div>${weeklyCoverageMarkupV71()}</div>
 ${Object.entries(m.days).map(([day,meals])=>`<div class="week-day-card"><div class="week-day-title"><h3>${day}</h3></div>${order.map(type=>{const r=recipeByAnyId(meals[type]);return`<div class="week-meal"><span>${mealLabels[type]}</span><div><b>${r?.name||'Sin asignar'}</b>${r?`<small>${(r.items||[]).slice(0,3).map(i=>`${i[1]} ${i[2]} ${i[0]}`).join(' · ')}</small>`:''}</div><button class="guide-btn" onclick="${r?`openRecipe('${r.id}')`:'void 0'}">Ver</button></div>`}).join('')}</div>`).join('')}`;
}


function buildWeeklyMenu(){
 const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const menu={id:uid(),createdAt:new Date().toISOString(),days:{}};
 const used={breakfast:[],midmorning:[],lunch:[],snack:[],dinner:[]};
 const choose=(type,dayIndex)=>{
  let pool=smartRecipeList(type).filter(r=>!used[type].slice(-2).includes(r.id));
  if(!pool.length)pool=smartRecipeList(type);
  if(type==='lunch' && dayIndex===2){
    const leg=pool.find(r=>(r.name||'').toLowerCase().match(/lenteja|garbanzo|alubia/));if(leg)return leg;
  }
  if(type==='lunch' && dayIndex===5){
    const leg=pool.find(r=>(r.name||'').toLowerCase().match(/garbanzo|lenteja|alubia/));if(leg)return leg;
  }
  if(type==='dinner' && [1,3,6].includes(dayIndex)){
    const fish=pool.find(r=>(r.name||'').toLowerCase().match(/salmón|merluza|bacalao|sardina|atún|pescado|salpicón/));if(fish)return fish;
  }
  return pool[dayIndex%Math.max(1,pool.length)]||pool[0];
 };
 days.forEach((day,di)=>{
  menu.days[day]={};
  Object.keys(mealLabels).forEach(type=>{
    const r=choose(type,di);menu.days[day][type]=r?.id;if(r)used[type].push(r.id);
  });
 });
 const a=store('weeklyMenus');a.unshift(menu);save('weeklyMenus',a);toast('Menú de 7 días generado');renderNutrition();
}


function endocrineReferenceMarkup(){
 return `<div class="card reference-card"><span class="eyebrow">BASE PROFESIONAL</span><h3>Raciones y equivalencias</h3><p>La estructura de alimentos y sustituciones utiliza como referencia las pautas y tablas del endocrino aportadas, adaptadas al funcionamiento de Proyecto85. No convierte automáticamente una pauta antigua de 1.200 kcal en objetivo diario.</p></div>`;
}


// ===== PRO MÓDULO 1 DEFINITIVO =====
function weekStartISO(date=new Date()){
 const d=new Date(date),day=d.getDay(),diff=(day===0?-6:1-day);
 d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d.toISOString().slice(0,10);
}
function weekEndISO(start){
 const d=new Date(start+'T00:00:00');d.setDate(d.getDate()+6);return d.toISOString().slice(0,10);
}
function officialWeeklyMenu(){
 const m=store('lockedWeeklyMenu'),start=weekStartISO();
 return m&&m.weekStart===start?m:null;
}
function lockCurrentWeeklyMenu(){
 const m=store('weeklyMenus')[0];if(!m)return toast('Genera primero el menú semanal');
 const locked=JSON.parse(JSON.stringify(m)),start=weekStartISO();
 locked.weekStart=start;locked.weekEnd=weekEndISO(start);locked.locked=true;locked.lockedAt=new Date().toISOString();
 save('lockedWeeklyMenu',locked);toast('Semana bloqueada');renderNutrition();
}
function unlockWeeklyMenu(){
 if(!officialWeeklyMenu())return;
 if(!confirm('¿Desbloquear el menú semanal?'))return;
 save('lockedWeeklyMenu',null);toast('Semana desbloqueada');renderNutrition();
}
function regenerateOfficialWeek(){
 if(officialWeeklyMenu()&&!confirm('El menú está bloqueado. ¿Regenerar toda la semana?'))return;
 save('lockedWeeklyMenu',null);buildWeeklyMenu();
}
function currentWeeklyMenu(){
 return officialWeeklyMenu()||store('weeklyMenus')[0]||null;
}
function currentDayName(){
 return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];
}
function activeProRecipe(type){
 const swap=store('mealSwaps').find(x=>x.date===todayISO()&&x.type===type);
 if(swap?.custom)return swap.custom;
 const manual=store('mealSelections')?.[todayISO()]?.[type];
 if(manual)return recipeByAnyId(manual);
 const official=officialWeeklyMenu();
 if(official){
   const id=official.days?.[currentDayName()]?.[type];
   if(id)return recipeByAnyId(id);
 }
 return smartRecipeList(type)[0];
}
function buildWeeklyMenu(){
 const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const menu={id:uid(),createdAt:new Date().toISOString(),weekStart:weekStartISO(),weekEnd:weekEndISO(weekStartISO()),days:{}};
 const used={breakfast:[],midmorning:[],lunch:[],snack:[],dinner:[]};
 const choose=(type,di)=>{
   let pool=smartRecipeList(type).filter(r=>!used[type].slice(-2).includes(r.id));
   if(!pool.length)pool=smartRecipeList(type);
   if(type==='lunch'&&[0,4].includes(di)){const r=pool.find(x=>/lenteja|garbanzo|alubia/i.test(x.name));if(r)return r}
   if(type==='dinner'&&[1,3,5].includes(di)){const r=pool.find(x=>/salmón|merluza|bacalao|sardina|atún|pescado|marisco|salpicón/i.test(x.name));if(r)return r}
   return pool[di%Math.max(pool.length,1)]||pool[0];
 };
 days.forEach((day,di)=>{menu.days[day]={};Object.keys(mealLabels).forEach(type=>{const r=choose(type,di);menu.days[day][type]=r?.id;if(r)used[type].push(r.id)})});
 const rows=store('weeklyMenus');rows.unshift(menu);save('weeklyMenus',rows);save('lockedWeeklyMenu',null);toast('Semana generada: revísala y bloquéala');renderNutrition();
}
function weeklyLockBanner(){
 const m=officialWeeklyMenu();
 if(!m)return `<div class="banner warn"><b>Semana sin bloquear</b><p>Revísala y pulsa “Bloquear semana” para que no cambie sola.</p></div>`;
 return `<div class="card lock-card"><div class="section-title"><div><span class="eyebrow">MENÚ OFICIAL</span><h3>${m.weekStart} → ${m.weekEnd}</h3></div><span class="pill green">🔒 Planificado</span></div><p>La pantalla Hoy siempre lee de este menú.</p><button class="btn small" onclick="unlockWeeklyMenu()">Desbloquear</button></div>`;
}
function weeklyMenuMarkup(){
 const m=currentWeeklyMenu();
 if(!m)return `<div class="card empty-state"><h3>No hay menú semanal</h3><button class="btn primary" onclick="buildWeeklyMenu()">Generar semana</button></div>`;
 const order=['breakfast','midmorning','lunch','snack','dinner'];
 return `${weeklyLockBanner()}<div class="card"><div class="section-title"><div><span class="eyebrow">SEMANA COMPLETA</span><h2>${m.weekStart} → ${m.weekEnd}</h2></div>${officialWeeklyMenu()?'<button class="btn small" onclick="regenerateOfficialWeek()">Regenerar</button>':'<button class="btn primary small" onclick="lockCurrentWeeklyMenu()">Bloquear semana</button>'}</div></div>
 ${Object.entries(m.days).map(([day,meals])=>`<div class="week-day-card"><h3>${day}</h3>${order.map(type=>{const r=recipeByAnyId(meals[type]);return `<div class="week-meal"><span>${mealLabels[type]}</span><div><b>${r?.name||'Sin asignar'}</b>${r?`<small>${(r.items||[]).slice(0,4).map(i=>`${i[1]} ${i[2]} ${i[0]}`).join(' · ')}</small>`:''}</div><button class="guide-btn" onclick="${r?`openRecipe('${r.id}')`:'void 0'}">Ver</button></div>`}).join('')}</div>`).join('')}`;
}
function recipePrepText(r){
 const t=(r.name+' '+(r.items||[]).map(i=>i[0]).join(' ')).toLowerCase();
 if(/ensalada|salpicón/.test(t))return 'Preparación en frío';
 if(/arroz|pasta|lenteja|garbanzo|alubia/.test(t))return 'Cocción + salteado suave';
 if(/salmón|merluza|bacalao|pollo|pavo|lomo|ternera|conejo/.test(t))return 'Plancha, horno o parrilla';
 return 'Cocción sencilla';
}
function recipeStorageText(r){
 const n=r.name.toLowerCase();
 if(/ensalada|aguacate|salpicón/.test(n))return 'Mejor preparar el mismo día.';
 if(/salmón|merluza|bacalao|sardina|pescado/.test(n))return 'Preferible cocinar cerca del consumo y refrigerar si se adelanta.';
 return 'Puede prepararse con antelación y guardarse refrigerado en recipiente cerrado.';
}
function recipeReheatText(r){
 return /ensalada|salpicón|aguacate/i.test(r.name)?'No recalentar.':'Recalentar suavemente hasta estar bien caliente, evitando resecar.';
}
function openRecipe(id){
 const r=recipeByAnyId(id);if(!r)return;const n=r.nutrition||{},av=recipeAvailability(r);
 openModal(`<span class="eyebrow">RECETA COMPLETA</span><h2>${r.name}</h2>`,
 `<div class="recipe-meta"><span>${r.flavor||'Variado'}</span><span>${r.time||'-'} min</span><span>${av.pct}% despensa</span></div>
 <h3>Ingredientes y cantidades</h3><ul class="meal-items">${(r.items||[]).map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]||'tal como se consume'}</small></li>`).join('')}</ul>
 <h3>Modo de preparación</h3><p><b>Técnica:</b> ${recipePrepText(r)}</p><ol class="guide-list">${(r.steps||[]).map(x=>`<li>${x}</li>`).join('')}</ol>
 <h3>Preparación anticipada</h3><p>${recipeStorageText(r)}</p><h3>Recalentado</h3><p>${recipeReheatText(r)}</p>
 <h3>Valor nutricional aproximado</h3><div class="nutrition-grid"><div><span>Proteína</span><b>${n.protein||'-'} g</b></div><div><span>Hidratos</span><b>${n.carbs||'-'} g</b></div><div><span>Grasas</span><b>${n.fat||'-'} g</b></div><div><span>Fibra</span><b>${n.fiber||'-'} g</b></div></div>`);
}
function generateV8Shopping(){
 const menu=currentWeeklyMenu();if(!menu)return toast('Genera primero el menú semanal');
 const need={};
 Object.values(menu.days||{}).forEach(meals=>Object.values(meals||{}).forEach(id=>{const r=recipeByAnyId(id);if(!r)return;(r.items||[]).forEach(i=>{const name=String(i[0]),qty=finite(i[1],0),unit=i[2]||'unidad';if(!need[name])need[name]={name,qty:0,unit,category:shoppingCategory(name)};need[name].qty+=qty})}));
 const pantry=store('pantry');
 const list=Object.values(need).map(x=>{const p=pantry.find(y=>y.name.toLowerCase()===x.name.toLowerCase()),have=finite(p?.qty,0);return {...x,have,buy:Math.max(0,x.qty-have),bought:false}}).filter(x=>x.buy>0);
 save('shopping',list);toast(`Compra generada: ${list.length} productos`);renderNutrition();
}
function shoppingMarkup(){
 const list=store('shopping');if(!list.length)return `<div class="empty-state"><h3>Sin lista generada</h3><p>Se crea desde el menú semanal y descuenta la despensa.</p><button class="btn primary" onclick="generateV8Shopping()">Generar compra</button></div>`;
 const groups={};list.forEach((x,i)=>{if(!groups[x.category])groups[x.category]=[];groups[x.category].push({...x,index:i})});
 return `<div class="section-title"><div><span class="eyebrow">COMPRA SEMANAL</span><h2>${list.filter(x=>!x.bought).length} pendientes</h2></div><button class="btn small" onclick="generateV8Shopping()">Recalcular</button></div>${Object.entries(groups).map(([cat,items])=>`<div class="shopping-category"><h3>${cat}</h3>${items.map(x=>`<div class="shopping-row"><input type="checkbox" ${x.bought?'checked':''} onchange="shopUpdate(${x.index},'bought',this.checked)"><div><b>${x.name}</b><small>Comprar ${Math.ceil(x.buy)} ${x.unit}${x.have?` · tienes ${x.have} ${x.unit}`:''}</small></div></div>`).join('')}</div>`).join('')}`;
}
function bodyDataAudit(){
 const latest=[...store('measures')].sort((a,b)=>b.date.localeCompare(a.date))[0];if(!latest)return[];
 const w=[];
 if(finite(latest.bmi)>45||finite(latest.bmi)<15)w.push('Revisar IMC: valor incoherente.');
 if(finite(latest.bmi)>35&&Math.abs(finite(latest.bmi)-finite(latest.skeletalMuscle))<0.3)w.push('Posible confusión entre IMC y músculo esquelético.');
 return w;
}
function nutritionBodyContextMarkup(){
 const w=bodyDataAudit();return `<div class="card"><span class="eyebrow">DATOS CORPORALES</span><h3>Control de coherencia</h3>${w.length?w.map(x=>`<div class="banner danger">${x}</div>`).join(''):'<p>Sin incoherencias evidentes.</p>'}<p class="note">Una medición aislada no modifica automáticamente el menú.</p></div>`;
}
function batchCookingPlan(){
 const m=currentWeeklyMenu();if(!m)return toast('Genera primero el menú semanal');
 const rs=[...new Set(Object.values(m.days).flatMap(x=>Object.values(x)))].map(recipeByAnyId).filter(Boolean),all=rs.flatMap(r=>r.items||[]);
 const group=keys=>[...new Set(all.filter(i=>keys.some(k=>String(i[0]).toLowerCase().includes(k))).map(i=>i[0]))];
 const p={id:uid(),date:todayISO(),proteins:group(['pollo','pavo','lomo','ternera','conejo']),carbs:group(['arroz','pasta','patata','garbanzo','lenteja','alubia']),veg:group(['verdura','ensalada','espinaca','pimiento','tomate','calabacín'])};
 const a=store('batchPlans');a.unshift(p);save('batchPlans',a);renderNutrition();
}
function batchMarkup(){
 const p=store('batchPlans')[0],m=currentWeeklyMenu();
 if(!m)return `<div class="card empty-state"><h3>Primero genera el menú semanal</h3></div>`;
 if(!p)return `<div class="card"><h3>Preparación semanal</h3><p>Usaremos el menú oficial para decidir qué adelantar y qué cocinar fresco.</p><button class="btn primary" onclick="batchCookingPlan()">Crear plan</button></div>`;
 return `<div class="card"><span class="eyebrow">PREPARACIÓN SEMANAL</span><h2>Qué adelantar</h2><ol class="guide-list"><li><b>Proteínas:</b> ${p.proteins.join(', ')||'Preparar según el día'}</li><li><b>Hidratos:</b> ${p.carbs.join(', ')||'Preparar según el día'}</li><li><b>Verduras:</b> ${p.veg.join(', ')||'Lavar y cortar variedad'}</li><li>Separar raciones por día según el menú bloqueado.</li><li>Dejar pescado y ensaladas delicadas para fechas próximas al consumo.</li></ol></div>`;
}


// Proyecto85 Pro · coherencia de nombres en recetas adaptadas
function adaptedRecipeName(baseName, originalIngredient, replacementIngredient){
 const clean=String(baseName||'Plato')
   .replace(/\s*·\s*adaptad[oa]$/i,'')
   .replace(/\s*\(adaptad[oa]\)$/i,'');
 if(!replacementIngredient)return clean+' · adaptado';
 const escaped=String(originalIngredient||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(escaped){
   const rx=new RegExp(escaped,'i');
   if(rx.test(clean)) return clean.replace(rx,String(replacementIngredient));
 }
 return `${clean} · con ${replacementIngredient}`;
}

function applyIngredientSwapV71(type,index){
 const r=activeProRecipe(type),o=window._p85SwapOptions?.[index];if(!o)return;
 const clone=JSON.parse(JSON.stringify(r));
 clone.id='swap-'+uid();
 clone.name=adaptedRecipeName(r.name,o.original,o.alt[0]);
 clone.items[o.itemIndex]=[o.alt[0],o.alt[1],o.alt[2],o.alt[3]];
 const sw=store('mealSwaps').filter(a=>!(a.date===todayISO()&&a.type===type));
 sw.unshift({date:todayISO(),type,original:r.name,custom:clone});
 save('mealSwaps',sw);
 closeModal();
 toast(`Plato actualizado: ${clone.name}`);
 renderNutrition();
}

function applyIngredientSwap(type,index){
 const r=activeProRecipe(type),opt=equivalentOptions(r)[index];if(!opt)return;
 const clone=JSON.parse(JSON.stringify(r));
 clone.id='swap-'+uid();
 clone.name=adaptedRecipeName(r.name,opt.original,opt.replacement);
 clone.items=clone.items.map(x=>x[0]===opt.original?[opt.replacement,opt.qty,opt.unit,opt.state,opt.group]:x);
 const swaps=store('mealSwaps').filter(x=>!(x.date===todayISO()&&x.type===type));
 swaps.unshift({date:todayISO(),type,original:r.name,custom:clone});
 save('mealSwaps',swaps);
 closeModal();
 toast(`Plato actualizado: ${clone.name}`);
 renderNutrition();
}


// =====================================================
// PROYECTO85 PRO · MÓDULO 1 NUTRICIÓN COMPLETO
// Planificación profesional: actual / siguiente / historial
// =====================================================
INITIAL.nutritionPlans = INITIAL.nutritionPlans || [];
INITIAL.nutritionPlannerView = INITIAL.nutritionPlannerView || 'current';
INITIAL.recipeTags = INITIAL.recipeTags || {};

function isoMonday(offsetWeeks=0){
 const d=new Date(),day=d.getDay(),diff=(day===0?-6:1-day)+(offsetWeeks*7);
 d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d.toISOString().slice(0,10);
}
function isoPlusDays(iso,n){const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function planForWeek(start){return store('nutritionPlans').find(p=>p.weekStart===start)||null}
function savePlan(plan){
 let a=store('nutritionPlans').filter(p=>p.weekStart!==plan.weekStart);a.unshift(plan);a.sort((x,y)=>y.weekStart.localeCompare(x.weekStart));save('nutritionPlans',a);
}
function mealDayNames(){return ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']}
function plannerStart(mode){return mode==='next'?isoMonday(1):isoMonday(0)}

function recipeFamily(r){
 const s=(r?.name+' '+(r?.items||[]).map(x=>x[0]).join(' ')).toLowerCase();
 if(/merluza|bacalao|salmón|sardina|atún|pescado|marisco|gamba/.test(s))return'pescado';
 if(/lenteja|garbanzo|alubia|legumbre/.test(s))return'legumbre';
 if(/pollo|pavo/.test(s))return'ave';
 if(/lomo|cerdo|ternera|conejo/.test(s))return'carne';
 if(/pasta/.test(s))return'pasta';
 if(/arroz/.test(s))return'arroz';
 return'otro';
}
function mainCarb(r){
 const s=(r?.items||[]).map(x=>x[0]).join(' ').toLowerCase();
 if(/pasta/.test(s))return'pasta';if(/arroz/.test(s))return'arroz';if(/patata/.test(s))return'patata';if(/pan/.test(s))return'pan';if(/garbanzo|lenteja|alubia/.test(s))return'legumbre';return'otro';
}
function recipeRank(r,usedIds,recentFamilies,recentCarbs){
 let score=100;
 if(usedIds.includes(r.id))score-=80;
 if(recentFamilies.slice(-1).includes(recipeFamily(r)))score-=35;
 if(recentCarbs.slice(-1).includes(mainCarb(r)))score-=20;
 const ratings=nutritionRatingMap();score+=(ratings[r.id]||0)*2;
 score+=recipeAvailability(r).pct*.08;
 return score;
}
function pickVariedRecipe(type,state,dayIndex){
 let pool=smartRecipeList(type).slice();
 if(!pool.length)return null;
 // enforce structural variety on main meals
 if(type==='lunch'&&[1,5].includes(dayIndex)){
   const legs=pool.filter(r=>recipeFamily(r)==='legumbre');if(legs.length)pool=legs;
 }
 if(type==='dinner'&&[0,2,4].includes(dayIndex)){
   const fish=pool.filter(r=>recipeFamily(r)==='pescado');if(fish.length)pool=fish;
 }
 pool.sort((a,b)=>recipeRank(b,state.ids,state.families,state.carbs)-recipeRank(a,state.ids,state.families,state.carbs));
 return pool[0];
}
function generateNutritionPlan(start){
 const days=mealDayNames(),plan={id:uid(),weekStart:start,weekEnd:isoPlusDays(start,6),status:'draft',createdAt:new Date().toISOString(),days:{}};
 const states={};Object.keys(mealLabels).forEach(t=>states[t]={ids:[],families:[],carbs:[]});
 days.forEach((day,di)=>{
   plan.days[day]={};
   Object.keys(mealLabels).forEach(type=>{
     const r=pickVariedRecipe(type,states[type],di);
     plan.days[day][type]=r?.id||null;
     if(r){states[type].ids.push(r.id);states[type].families.push(recipeFamily(r));states[type].carbs.push(mainCarb(r))}
   });
 });
 plan.variety=planVarietyScore(plan);savePlan(plan);return plan;
}
function planVarietyScore(plan){
 const ids=[],families=[];
 mealDayNames().forEach(d=>['lunch','dinner'].forEach(t=>{const r=recipeByAnyId(plan.days?.[d]?.[t]);if(r){ids.push(r.id);families.push(recipeFamily(r))}}));
 if(!ids.length)return 0;
 const uniqueIds=new Set(ids).size/ids.length*70;
 const uniqueFam=Math.min(1,new Set(families).size/5)*30;
 return Math.round(uniqueIds+uniqueFam);
}
function ensurePlan(start){return planForWeek(start)||generateNutritionPlan(start)}
function confirmNutritionPlan(start){
 const p=planForWeek(start);if(!p)return;
 p.status='confirmed';p.confirmedAt=new Date().toISOString();p.variety=planVarietyScore(p);savePlan(p);
 if(start===isoMonday(0)){save('lockedWeeklyMenu',{...p,locked:true,lockedAt:new Date().toISOString()})}
 generateShoppingFromPlan(p);generateBatchFromPlan(p);toast('Semana confirmada, compra y preparación generadas');renderNutrition();
}
function regeneratePlan(start){
 const p=planForWeek(start);
 if(p?.status==='confirmed'&&!confirm('Esta semana está confirmada. ¿Quieres sustituirla por una nueva propuesta?'))return;
 let a=store('nutritionPlans').filter(x=>x.weekStart!==start);save('nutritionPlans',a);generateNutritionPlan(start);toast('Nueva propuesta generada');renderNutrition();
}
function changePlannedMeal(start,day,type){
 const p=planForWeek(start);if(!p)return;
 const current=recipeByAnyId(p.days[day][type]);
 const pool=smartRecipeList(type).filter(r=>r.id!==current?.id).sort((a,b)=>recipeRank(b,[],[recipeFamily(current)],[mainCarb(current)])-recipeRank(a,[],[recipeFamily(current)],[mainCarb(current)]));
 openModal(`<span class="eyebrow">CAMBIAR PLATO</span><h2>${day} · ${mealLabels[type]}</h2>`,
 `<p class="muted">Elige otra propuesta o entra en la biblioteca.</p><div class="alt-grid">${pool.slice(0,8).map(r=>`<button class="alt-btn" onclick="setPlannedMeal('${start}','${day}','${type}','${r.id}')"><b>${r.name}</b><small>${recipeFamily(r)} · ${r.time||'-'} min</small></button>`).join('')}</div>`);
}
function setPlannedMeal(start,day,type,id){
 const p=planForWeek(start);if(!p)return;p.days[day][type]=id;p.variety=planVarietyScore(p);savePlan(p);closeModal();toast('Plato actualizado');renderNutrition();
}
function generateShoppingFromPlan(plan){
 const need={};
 Object.values(plan.days||{}).forEach(meals=>Object.values(meals||{}).forEach(id=>{const r=recipeByAnyId(id);if(!r)return;(r.items||[]).forEach(i=>{const name=String(i[0]),qty=finite(i[1],0),unit=i[2]||'unidad';if(!need[name])need[name]={name,qty:0,unit,category:shoppingCategory(name)};need[name].qty+=qty})}));
 const pantry=store('pantry');
 const list=Object.values(need).map(x=>{const h=pantry.find(p=>p.name.toLowerCase()===x.name.toLowerCase()),have=finite(h?.qty,0);return{...x,have,buy:Math.max(0,x.qty-have),bought:false}}).filter(x=>x.buy>0);
 save('shopping',list);
}
function generateBatchFromPlan(plan){
 const rs=[...new Set(Object.values(plan.days).flatMap(x=>Object.values(x)))].map(recipeByAnyId).filter(Boolean);
 const all=rs.flatMap(r=>r.items||[]);
 const g=keys=>[...new Set(all.filter(i=>keys.some(k=>String(i[0]).toLowerCase().includes(k))).map(i=>i[0]))];
 const batch={id:uid(),weekStart:plan.weekStart,date:todayISO(),proteins:g(['pollo','pavo','lomo','ternera','conejo']),carbs:g(['arroz','pasta','patata','garbanzo','lenteja','alubia']),veg:g(['verdura','ensalada','espinaca','pimiento','tomate','calabacín'])};
 const a=store('batchPlans');a.unshift(batch);save('batchPlans',a);
}
function currentOfficialPlan(){
 const p=planForWeek(isoMonday(0));return p?.status==='confirmed'?p:null;
}
function activeProRecipe(type){
 const swap=store('mealSwaps').find(x=>x.date===todayISO()&&x.type===type);if(swap?.custom)return swap.custom;
 const manual=store('mealSelections')?.[todayISO()]?.[type];if(manual)return recipeByAnyId(manual);
 const p=currentOfficialPlan();if(p){const id=p.days?.[currentDayName()]?.[type];if(id)return recipeByAnyId(id)}
 return smartRecipeList(type)[0];
}
function plannerDayCard(start,day,plan){
 return `<div class="week-day-card"><div class="section-title"><h3>${day}</h3><span class="pill">${plan.status==='confirmed'?'Confirmado':'Editable'}</span></div>${Object.keys(mealLabels).map(type=>{const r=recipeByAnyId(plan.days?.[day]?.[type]);return `<div class="week-meal"><span>${mealLabels[type]}</span><div><b>${r?.name||'Sin plato'}</b><small>${r?(r.items||[]).slice(0,3).map(i=>`${i[1]} ${i[2]} ${i[0]}`).join(' · '):''}</small></div><div class="week-actions"><button class="guide-btn" onclick="${r?`openRecipe('${r.id}')`:'void 0'}">Ver</button><button class="guide-btn" onclick="changePlannedMeal('${start}','${day}','${type}')">Cambiar</button></div></div>`}).join('')}</div>`;
}
function plannerWeekMarkup(mode){
 const start=plannerStart(mode),p=ensurePlan(start);
 return `<div class="card planner-summary"><div class="section-title"><div><span class="eyebrow">${mode==='next'?'SEMANA SIGUIENTE':'SEMANA ACTUAL'}</span><h2>${p.weekStart} → ${p.weekEnd}</h2></div><span class="quality-ring">${p.variety||planVarietyScore(p)}</span></div><p>Variedad de la propuesta. ${p.status==='confirmed'?'Esta planificación está confirmada.':'Revísala antes de confirmar.'}</p><div class="btn-row"><button class="btn" onclick="regeneratePlan('${start}')">Otra propuesta</button>${p.status!=='confirmed'?`<button class="btn primary" onclick="confirmNutritionPlan('${start}')">Confirmar semana</button>`:''}</div></div>${mealDayNames().map(d=>plannerDayCard(start,d,p)).join('')}`;
}
function plannerHistoryMarkup(){
 const old=store('nutritionPlans').filter(p=>p.weekStart<isoMonday(0));
 if(!old.length)return `<div class="card empty-state"><h3>Sin semanas anteriores</h3></div>`;
 return old.map(p=>`<div class="card"><span class="eyebrow">SEMANA</span><h3>${p.weekStart} → ${p.weekEnd}</h3><p>Estado: ${p.status==='confirmed'?'Confirmada':'Borrador'} · Variedad ${p.variety||planVarietyScore(p)}%</p></div>`).join('');
}
function nutritionPlannerMarkup(){
 return `<div class="planner-nav"><button class="tab-btn active" onclick="showPlannerMode('current',this)">Semana actual</button><button class="tab-btn" onclick="showPlannerMode('next',this)">Semana siguiente</button><button class="tab-btn" onclick="showPlannerMode('history',this)">Historial</button></div><div id="plannerCurrent">${plannerWeekMarkup('current')}</div><div id="plannerNext" class="hidden">${plannerWeekMarkup('next')}</div><div id="plannerHistory" class="hidden">${plannerHistoryMarkup()}</div>`;
}
function showPlannerMode(mode,btn){
 ['Current','Next','History'].forEach(x=>$('#planner'+x)?.classList.add('hidden'));
 const key=mode==='current'?'Current':mode==='next'?'Next':'History';$('#planner'+key)?.classList.remove('hidden');
 btn.parentElement.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
}
function recipeCategoryLabel(r){return `${recipeFamily(r)} · ${mainCarb(r)} · ${r.flavor||'variado'}`}
function recipeLibraryProfessional(){
 const recipes=completeRecipeList();
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">BIBLIOTECA</span><h2>${recipes.length} platos disponibles</h2></div></div><div class="filter-row"><input id="recipeSearch" placeholder="Buscar plato o ingrediente" oninput="filterProfessionalRecipes()"><select id="recipeFilter" onchange="filterProfessionalRecipes()"><option value="">Todas</option><option value="pescado">Pescado</option><option value="legumbre">Legumbres</option><option value="ave">Pollo / pavo</option><option value="carne">Carnes</option><option value="pasta">Pasta</option><option value="arroz">Arroz</option></select></div></div><div id="professionalRecipeGrid" class="recipe-library">${recipes.map(r=>`<div class="recipe-filter-card" data-search="${(r.name+' '+(r.items||[]).map(i=>i[0]).join(' ')+' '+recipeCategoryLabel(r)).toLowerCase()}" data-family="${recipeFamily(r)}">${recipeCardV7(r)}</div>`).join('')}</div>`;
}
function filterProfessionalRecipes(){
 const q=($('#recipeSearch')?.value||'').toLowerCase(),f=$('#recipeFilter')?.value||'';
 document.querySelectorAll('.recipe-filter-card').forEach(el=>el.classList.toggle('hidden',!!((q&&!el.dataset.search.includes(q))||(f&&el.dataset.family!==f))));
}
function proMealCard(type){
 const r=activeProRecipe(type),n=r.nutrition||{},log=store('nutritionLog').find(x=>x.date===todayISO()&&x.type===type),score=recipeScore(r.id);
 return `<div class="meal-card"><div class="meal-head"><div><span class="eyebrow">${mealLabels[type]}</span><h3>${r.name}</h3><div class="recipe-meta"><span>${r.flavor||'Variado'}</span><span>${r.time||'-'} min</span><span>${finite(n.protein)} g proteína</span></div></div><button class="btn small" onclick="openRecipe('${r.id}')">Receta</button></div><ul class="meal-items">${(r.items||[]).map(x=>`<li><b>${x[1]} ${x[2]}</b> ${x[0]}<small>${x[3]||'tal como se consume'}</small></li>`).join('')}</ul><div class="btn-row"><button class="btn small secondary" onclick="smartIngredientSwap('${type}')">Cambiar ingrediente</button><button class="btn small secondary" onclick="openChangeReason('${type}')">Cambiar comida</button></div><label class="check"><input type="checkbox" ${log?.done?'checked':''} onchange="toggleMeal('${type}',this.checked)"> Realizada</label><div class="rating-row"><span>Valorar</span>${[1,2,3,4,5,6,7,8,9,10].map(v=>`<button class="score-btn ${score===v?'active':''}" onclick="rateMeal('${r.id}',${v});renderNutrition()">${v}</button>`).join('')}</div></div>`;
}
function renderNutritionV7(){
 $('#nutricion').innerHTML=`
 <div class="card pro-title"><span class="eyebrow">PROYECTO85 PRO</span><h2>Nutrición</h2><p>Planifica → revisa → confirma → compra → prepara → sigue → aprende.</p></div>
 ${nutritionDashboardV72?nutritionDashboardV72():''}${hydrationMarkup?hydrationMarkup():''}
 <div class="tabs"><button class="tab-btn active" onclick="nvTab('today',this)">Hoy</button><button class="tab-btn" onclick="nvTab('week',this)">Plan semanal</button><button class="tab-btn" onclick="nvTab('recipes',this)">Recetas</button><button class="tab-btn" onclick="nvTab('shopping',this)">Compra</button><button class="tab-btn" onclick="nvTab('pantry',this)">Despensa</button><button class="tab-btn" onclick="nvTab('batch',this)">Preparación</button><button class="tab-btn" onclick="nvTab('learning',this)">Seguimiento</button></div>
 <div id="nvToday">${Object.keys(mealLabels).map(proMealCard).join('')}${nutritionCheckinMarkup?nutritionCheckinMarkup():''}</div>
 <div id="nvWeek" class="hidden">${nutritionPlannerMarkup()}</div>
 <div id="nvRecipes" class="hidden">${recipeLibraryProfessional()}</div>
 <div id="nvShopping" class="hidden"><div class="card">${shoppingMarkup()}</div></div>
 <div id="nvPantry" class="hidden"><div class="card"><div class="form-grid"><label>Producto<input id="pantryName"></label><label>Cantidad<input id="pantryQty" type="number"></label><label>Unidad<select id="pantryUnit"><option>g</option><option>kg</option><option>unidad</option><option>lata</option></select></label><label>Caducidad<input id="pantryExpiry" type="date"></label></div><button class="btn primary" onclick="addPantryV7()">Guardar</button>${store('pantry').map((x,i)=>`<div class="pantry-row"><span>•</span><div><b>${x.name}</b><small>${x.qty} ${x.unit||'g'} ${x.expiry?'· '+x.expiry:''}</small></div><button class="btn small danger" onclick="let p=store('pantry');p.splice(${i},1);save('pantry',p);renderNutrition()">Quitar</button></div>`).join('')}</div></div>
 <div id="nvBatch" class="hidden">${batchMarkup()}</div>
 <div id="nvLearning" class="hidden">${nutritionBodyContextMarkup?nutritionBodyContextMarkup():''}${learningMarkup?learningMarkup():''}${nutritionHistoryMarkup?nutritionHistoryMarkup():''}${nutritionSafetyMarkup?nutritionSafetyMarkup():''}</div>`;
}


// =====================================================
// V10.0.1 · ACTUALIZACIÓN ROBUSTA
// =====================================================
async function hardUpdateNow(){
 try{
   toast('Actualizando Proyecto85 Pro…');
   // Preserve localStorage by design: only caches + service worker are refreshed.
   if('serviceWorker' in navigator){
     const regs=await navigator.serviceWorker.getRegistrations();
     for(const reg of regs){
       try{ await reg.update(); }catch(e){}
     }
   }
   if('caches' in window){
     const keys=await caches.keys();
     await Promise.all(keys.map(k=>caches.delete(k)));
   }
   // Bust browser cache and force a fresh navigation
   const url=new URL(location.href);
   url.searchParams.set('v','10.0.1');
   url.searchParams.set('_refresh',Date.now().toString());
   location.replace(url.toString());
 }catch(e){
   console.error(e);
   location.reload();
 }
}

async function checkForUpdate(){
 try{
   const r=await fetch('./version.json?_='+Date.now(),{cache:'no-store'});
   if(!r.ok)return;
   const remote=await r.json();
   if(remote.version && remote.version!==APP_VERSION){
     showUpdateBanner(remote.version);
   }
 }catch(e){ console.warn('Update check failed',e); }
}

function showUpdateBanner(version){
 let old=document.getElementById('updateBanner');if(old)old.remove();
 const el=document.createElement('div');el.id='updateBanner';el.className='update-banner';
 el.innerHTML=`<div><b>Nueva versión ${version} disponible</b><small>Actualiza sin perder tus datos.</small></div><button onclick="hardUpdateNow()">Actualizar ahora</button><button class="close" onclick="this.parentElement.remove()">×</button>`;
 document.body.appendChild(el);
}

function saveHealth(){const o={date:todayISO(),steps:finite($('#h_steps').value),sleep:finite($('#h_sleep').value),restHr:finite($('#h_hr').value),water:finite($('#h_water').value),energy:finite($('#h_energy').value),stress:finite($('#h_stress').value),pain:finite($('#h_pain').value)};let a=store('health'),i=a.findIndex(x=>x.date===o.date);if(i>=0)a[i]=o;else a.unshift(o);save('health',a);toast('Salud guardada')}
function addAnalytic(){const o={id:uid(),date:$('#a_date').value||todayISO(),name:$('#a_name').value.trim(),value:$('#a_value').value,unit:$('#a_unit').value,reference:$('#a_ref').value};if(!o.name)return;const a=store('analytics');a.unshift(o);save('analytics',a);renderMore()}
function requestNotifications(){if(!('Notification'in window))return toast('No disponible');Notification.requestPermission().then(x=>{const s=store('settings');s.notifications=x==='granted';save('settings',s);toast(x==='granted'?'Notificaciones permitidas':'Permiso no concedido')})}

function exportAutomaticBackup(){
 const backups=store('migrationBackups');
 if(!backups.length)return toast('No hay copia automática');
 const blob=new Blob([JSON.stringify(backups[0],null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='Proyecto85-copia-automatica-'+todayISO()+'.json';a.click();
}
function restoreLatestAutomaticBackup(){
 const backups=store('migrationBackups');
 if(!backups.length)return toast('No hay copia automática');
 if(!confirm('Esto sustituirá los datos actuales por la copia anterior. ¿Continuar?'))return;
 const snap=backups[0];
 Object.entries(snap.items||{}).forEach(([key,value])=>localStorage.setItem(key,value));
 localStorage.removeItem(PREFIX+'migrationState');
 location.reload();
}

function exportData(){const data={version:APP_VERSION,exportedAt:new Date().toISOString()};Object.keys(INITIAL).forEach(k=>data[k]=store(k));const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Proyecto85-copia-'+todayISO()+'.json';a.click()}
function importData(e){const f=e.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);Object.keys(INITIAL).forEach(k=>{if(d[k]!=null)save(k,d[k])});migrate();toast('Copia restaurada');renderMore()}catch{toast('Copia no válida')}};r.readAsText(f)}
function renderMore(){
 const h=store('health').find(x=>x.date===todayISO())||{},analytics=store('analytics');
 $('#mas').innerHTML=`<div class="tabs"><button class="tab-btn active" data-more="health" onclick="moreTab('health',this)">Salud</button><button class="tab-btn" data-more="calendar" onclick="moreTab('calendar',this)">Calendario</button><button class="tab-btn" data-more="stats" onclick="moreTab('stats',this)">Estadísticas</button><button class="tab-btn" data-more="goals" onclick="moreTab('goals',this)">Objetivos</button><button class="tab-btn" data-more="library" onclick="moreTab('library',this)">Biblioteca</button><button class="tab-btn" data-more="achievements" onclick="moreTab('achievements',this)">Logros</button><button class="tab-btn" data-more="analytics" onclick="moreTab('analytics',this)">Analíticas</button><button class="tab-btn" data-more="assistant" onclick="moreTab('assistant',this)">Asistente</button><button class="tab-btn" data-more="settings" onclick="moreTab('settings',this)">Ajustes</button></div>
 <div id="moreHealth"><div class="card"><h2>Salud diaria</h2><div class="form-grid"><label>Pasos<input id="h_steps" type="number" value="${h.steps||''}"></label><label>Sueño (h)<input id="h_sleep" type="number" step=".1" value="${h.sleep||''}"></label><label>FC reposo<input id="h_hr" type="number" value="${h.restHr||''}"></label><label>Agua (L)<input id="h_water" type="number" step=".1" value="${h.water||''}"></label><label>Energía<input id="h_energy" type="number" value="${h.energy||''}"></label><label>Estrés<input id="h_stress" type="number" value="${h.stress||''}"></label><label>Molestia<input id="h_pain" type="number" value="${h.pain||''}"></label></div><button class="btn primary" onclick="saveHealth()">Guardar</button></div></div>
 <div id="moreCalendar" class="hidden">${renderCalendarBlock()}</div>
 <div id="moreStats" class="hidden">${renderStatsBlock()}</div>
 <div id="moreGoals" class="hidden">${renderGoalsBlock()}</div>
 <div id="moreLibrary" class="hidden">${renderLibraryBlock()}</div>
 <div id="moreAchievements" class="hidden">${renderAchievementsBlock()}</div>
 <div id="moreAnalytics" class="hidden"><div class="card"><h2>Analíticas locales</h2><p class="note">Los datos permanecen en este dispositivo. No subas informes médicos a GitHub.</p><div class="form-grid"><label>Fecha<input id="a_date" type="date"></label><label>Parámetro<input id="a_name" placeholder="Glucosa, vitamina D..."></label><label>Valor<input id="a_value"></label><label>Unidad<input id="a_unit"></label><label class="wide">Rango de referencia<input id="a_ref"></label></div><button class="btn primary" onclick="addAnalytic()">Guardar parámetro</button>${analytics.map(x=>`<div class="pr-row"><span>${x.date} · ${x.name}</span><b>${x.value} ${x.unit}</b></div>`).join('')}</div></div>
 <div id="moreAssistant" class="hidden"><div class="card"><h2>Asistente Proyecto85</h2>${recommendations().map(x=>`<div class="assistant-item">${x}</div>`).join('')}</div></div>
 <div id="moreSettings" class="hidden"><div class="card"><h2>Ajustes y seguridad</h2><button class="btn" onclick="requestNotifications()">Permitir notificaciones</button><button class="btn" onclick="checkForAppUpdate({silent:false})">Buscar actualización</button><button class="btn" onclick="hardRefresh()">Forzar actualización limpia</button><button class="btn" onclick="exportData()">Exportar copia de seguridad</button><button class="btn" onclick="exportAutomaticBackup()">Descargar copia automática previa</button><button class="btn danger" onclick="restoreLatestAutomaticBackup()">Restaurar copia previa a la migración</button><label class="file-btn">Importar copia<input type="file" accept="application/json" hidden onchange="importData(this)"></label><p class="note">Las notificaciones web en iPhone dependen de permisos y del sistema. Los avisos esenciales también aparecen dentro de la aplicación.</p></div></div>`
}
function moreTab(id,b){$$('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');['Health','Calendar','Stats','Goals','Library','Achievements','Analytics','Assistant','Settings'].forEach(x=>$('#more'+x).classList.toggle('hidden',x.toLowerCase()!==id.toLowerCase()))}

async function hardUpdateNow(){await hardRefresh();}
$('#refreshBtn').onclick=forceUpdate;
migrate();runMigrationAndNotify();ensureV73Recipes();updateAppShell();renderHome();setTimeout(checkForUpdate,1500);startAutomaticUpdateChecks();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=10.0.1');
