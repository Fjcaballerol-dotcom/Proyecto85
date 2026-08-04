const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const APP_VERSION='6.1.0',PREFIX='p85_';
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
 settings:{notifications:false},goals:[],achievements:[],calendarNotes:[],favoriteExercises:[],favoriteRecipes:[],migrationBackups:[],migrationState:{},weeklyReviews:[],mealSelections:{}
};

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


const MIGRATION_TARGET='6.1.0';
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
function rateMeal(id,score){let r=store('mealRatings');r.unshift({date:todayISO(),mealId:id,score});save('mealRatings',r);toast(score>=9?'Añadido a favoritos':'Puntuación guardada')}
function generateShopping(){
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
function renderNutrition(){
 $('#nutricion').innerHTML=`<div class="section-title"><div><span class="eyebrow">APRENDER A COMER</span><h2>Plan semanal sostenible</h2></div><span class="pill">${dayName()}</span></div><div class="card"><button class="btn primary" onclick="applySmartMenu()">Generar menú inteligente</button><p class="note">Usa despensa y preferencias registradas.</p></div><div class="tabs"><button class="tab-btn active" onclick="nutritionTab('menu',this)">Menú</button><button class="tab-btn" onclick="nutritionTab('shopping',this)">Compra</button><button class="tab-btn" onclick="nutritionTab('pantry',this)">Despensa</button><button class="tab-btn" onclick="nutritionTab('batch',this)">Batch cooking</button></div>
 <div id="nutMenu">${Object.keys(mealLabels).map(recipeCard).join('')}</div><div id="nutShopping" class="hidden"><div class="card"><button class="btn primary" onclick="generateShopping()">Generar lista semanal</button><div id="shoppingArea"></div></div></div><div id="nutPantry" class="hidden"><div class="card"><div class="form-grid"><label>Producto<input id="pantryName"></label><label>Cantidad (g/unidades)<input id="pantryQty" type="number"></label></div><button class="btn primary" onclick="addPantry()">Guardar en despensa</button><div id="pantryArea"></div></div></div><div id="nutBatch" class="hidden"><div class="card"><h3>Preparación del domingo</h3><ol class="guide-list"><li>Hornear o planchar pollo y lomo.</li><li>Cocer arroz, pasta y patata por raciones.</li><li>Preparar pimientos, espinacas y verduras.</li><li>Lavar ensaladas y organizar frutas.</li><li>Separar raciones y etiquetar fecha.</li></ol><p class="note">Objetivo aproximado: dejar preparadas las bases en 2 horas.</p></div></div>`;renderShopping();renderPantry()
}
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
 <div id="moreSettings" class="hidden"><div class="card"><h2>Ajustes y seguridad</h2><button class="btn" onclick="requestNotifications()">Permitir notificaciones</button><button class="btn" onclick="hardRefresh()">Forzar actualización limpia</button><button class="btn" onclick="exportData()">Exportar copia de seguridad</button><button class="btn" onclick="exportAutomaticBackup()">Descargar copia automática previa</button><button class="btn danger" onclick="restoreLatestAutomaticBackup()">Restaurar copia previa a la migración</button><label class="file-btn">Importar copia<input type="file" accept="application/json" hidden onchange="importData(this)"></label><p class="note">Las notificaciones web en iPhone dependen de permisos y del sistema. Los avisos esenciales también aparecen dentro de la aplicación.</p></div></div>`
}
function moreTab(id,b){$$('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');['Health','Calendar','Stats','Goals','Library','Achievements','Analytics','Assistant','Settings'].forEach(x=>$('#more'+x).classList.toggle('hidden',x.toLowerCase()!==id.toLowerCase()))}

async function forceUpdate(){await hardRefresh();}
$('#refreshBtn').onclick=forceUpdate;
migrate();runMigrationAndNotify();updateAppShell();renderHome();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=6.1.0');
