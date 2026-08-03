const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>new Date().toISOString().slice(0,10);
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16).slice(2);

const APP_VERSION='4.0.1';
const INITIAL_MEASURE={
 date:'2026-07-27',official:true,weight:106,bmi:31.6,bodyFat:39.5,fatFreeMass:64.13,
 subcutaneousFat:34.9,visceralFat:15,water:43.7,skeletalMuscle:39.1,muscle:63.8,
 protein:16.5,bmr:1755,metabolicAge:58,waist:108,hip:110,chest:119,arm:34,thigh:54,calf:37
};
const DEFAULTS={
 settings:{name:'Javier',initialWeight:106,goalWeight:90,currentWeight:106,currentWeek:2,currentDay:5,totalWeeks:24,restSeconds:90,dataVersion:APP_VERSION},
 sessions:[], health:[], measures:[INITIAL_MEASURE],
 pantry:[], shopping:[], analytics:[], reminders:[], nutritionLog:[], workoutQueue:[], workoutDraft:null, exercisePreferences:{}
};
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function migrateData(){
 Object.entries(DEFAULTS).forEach(([k,v])=>{if(localStorage.getItem('p85_'+k)===null)set('p85_'+k,v)});
 const raw=get('p85_settings',{});
 const settings={...DEFAULTS.settings,...(raw&&typeof raw==='object'?raw:{})};
 settings.initialWeight=finite(settings.initialWeight,106);
 settings.goalWeight=finite(settings.goalWeight,90);
 settings.currentWeight=finite(settings.currentWeight,settings.initialWeight);
 settings.currentWeek=clamp(Math.trunc(finite(settings.currentWeek,2)),1,24);
 settings.currentDay=clamp(Math.trunc(finite(settings.currentDay,5)),1,5);
 settings.totalWeeks=Math.max(settings.currentWeek,Math.trunc(finite(settings.totalWeeks,24)));
 settings.restSeconds=Math.max(15,Math.trunc(finite(settings.restSeconds,90)));
 settings.dataVersion=APP_VERSION;
 set('p85_settings',settings);
 let measures=get('p85_measures',[]);
 if(!Array.isArray(measures))measures=[];
 const hasInitial=measures.some(x=>x&&x.date===INITIAL_MEASURE.date&&finite(x.weight,0)===106);
 if(!hasInitial)measures.unshift({...INITIAL_MEASURE});
 measures=measures.filter(x=>x&&typeof x==='object').map(x=>({...x,weight:x.weight==null?null:finite(x.weight,null)}));
 set('p85_measures',measures);
 Object.keys(DEFAULTS).filter(k=>!['settings','measures'].includes(k)).forEach(k=>{
   const value=get('p85_'+k,DEFAULTS[k]);
   if(!Array.isArray(value))set('p85_'+k,DEFAULTS[k]);
 });
}
migrateData();
const store=(k)=>get('p85_'+k,DEFAULTS[k]);
const save=(k,v)=>set('p85_'+k,v);
function safeSettings(){
 const s={...DEFAULTS.settings,...store('settings')};
 return {
  ...s,
  initialWeight:finite(s.initialWeight,106),goalWeight:finite(s.goalWeight,90),
  currentWeight:finite(s.currentWeight,finite(s.initialWeight,106)),
  currentWeek:clamp(Math.trunc(finite(s.currentWeek,2)),1,24),
  currentDay:clamp(Math.trunc(finite(s.currentDay,5)),1,5),
  totalWeeks:Math.max(1,Math.trunc(finite(s.totalWeeks,24)))
 };
}
const fmt=n=>finite(n,0).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});


const EXERCISE_GUIDES={
 'Prensa':{muscles:'Cuádriceps, glúteos e isquiotibiales',steps:['Apoya completamente espalda y cadera.','Coloca los pies al ancho de hombros.','Baja con control sin despegar la pelvis.','Empuja sin bloquear completamente las rodillas.'],errors:['Juntar las rodillas hacia dentro.','Bajar más de lo que permite la movilidad.','Rebotar en la parte inferior.']},
 'Curl femoral':{muscles:'Isquiotibiales',steps:['Ajusta el rodillo sobre la parte baja de la pierna.','Mantén la cadera apoyada.','Flexiona de forma controlada.','Regresa lentamente.'],errors:['Levantar la cadera.','Usar impulso.','Soltar el peso en la bajada.']},
 'Jalón neutro':{muscles:'Dorsal ancho, bíceps y espalda alta',steps:['Sujeta con agarre neutro.','Eleva ligeramente el pecho.','Lleva los codos hacia abajo.','Controla la vuelta sin encoger hombros.'],errors:['Balancear el tronco.','Tirar solo con los brazos.','Llevar el agarre detrás de la cabeza.']},
 'Jalón al pecho agarre medio':{muscles:'Dorsal ancho y bíceps',steps:['Pecho alto y abdomen estable.','Lleva la barra hacia la parte alta del pecho.','Junta ligeramente las escápulas.','Sube de forma controlada.'],errors:['Inclinarse demasiado hacia atrás.','Dar tirones.','Encoger los hombros.']},
 'Jalón al pecho':{muscles:'Dorsal ancho y bíceps',steps:['Pecho alto.','Codos hacia abajo y atrás.','Barra hacia la parte alta del pecho.','Regreso lento.'],errors:['Balanceo.','Agarre excesivamente ancho.','Tirar detrás de la nuca.']},
 'Remo con apoyo':{muscles:'Espalda media, dorsal y bíceps',steps:['Apoya el pecho firmemente.','Tira llevando los codos atrás.','Junta escápulas sin encoger hombros.','Vuelve lentamente.'],errors:['Despegar el pecho.','Elevar los hombros.','Usar impulso.']},
 'Remo polea baja':{muscles:'Espalda media y dorsal',steps:['Espalda neutra y pecho alto.','Tira hacia el abdomen.','Codos cerca del cuerpo.','Extiende sin redondear la espalda.'],errors:['Balancearse.','Redondear la zona lumbar.','Tirar con los hombros elevados.']},
 'Remo máquina':{muscles:'Espalda media y dorsal',steps:['Ajusta asiento y apoyo.','Tira con los codos.','Mantén el pecho estable.','Controla el retorno.'],errors:['Recorrido demasiado corto.','Impulso.','Cuello adelantado.']},
 'Press convergente':{muscles:'Pectoral, tríceps y deltoide anterior',steps:['Ajusta el asiento para alinear las manos con el pecho.','Mantén escápulas apoyadas.','Empuja sin bloquear los codos.','Regresa con control.'],errors:['Hombros adelantados.','Arquear demasiado la espalda.','Rebotar.']},
 'Press inclinado máquina':{muscles:'Pectoral superior, hombro y tríceps',steps:['Ajusta el asiento.','Mantén el pecho elevado.','Empuja en línea con la máquina.','Controla la bajada.'],errors:['Abrir demasiado los codos.','Despegar la espalda.','Usar una carga excesiva.']},
 'Press hombro máquina':{muscles:'Hombros y tríceps',steps:['Espalda apoyada y abdomen firme.','Empuja sin encoger hombros.','No bloquees los codos.','Baja hasta un rango cómodo.'],errors:['Arquear la zona lumbar.','Bajar demasiado.','Empujar de forma desigual.']},
 'Press pecho máquina':{muscles:'Pectoral, tríceps y hombro anterior',steps:['Escápulas estables.','Empuja al frente.','Mantén muñecas neutras.','Controla el regreso.'],errors:['Hombros adelantados.','Rebotar.','Separar la espalda del respaldo.']},
 'Press militar máquina':{muscles:'Deltoides y tríceps',steps:['Espalda apoyada.','Abdomen activo.','Empuja verticalmente.','Baja de forma controlada.'],errors:['Arquear la espalda.','Encoger hombros.','Forzar el rango.']},
 'Elevaciones laterales':{muscles:'Deltoide lateral',steps:['Codos ligeramente flexionados.','Eleva hasta aproximadamente la altura del hombro.','Mantén el tronco quieto.','Baja lentamente.'],errors:['Balancearse.','Subir demasiado.','Encoger hombros.']},
 'Face Pull':{muscles:'Deltoide posterior, trapecio medio y manguito rotador',steps:['Polea a la altura de la cara.','Tira separando las manos.','Codos altos sin dolor.','Aprieta escápulas.'],errors:['Arquear la espalda.','Tirar hacia el pecho.','Usar demasiado peso.']},
 'Peck Deck':{muscles:'Pectoral',steps:['Espalda apoyada.','Codos alineados con el pecho.','Cierra sin golpear las placas.','Abre hasta un rango cómodo.'],errors:['Estirar en exceso.','Despegar la espalda.','Mover los hombros hacia delante.']},
 'Curl bíceps':{muscles:'Bíceps y braquial',steps:['Codos junto al cuerpo.','Flexiona sin mover los hombros.','Aprieta arriba.','Baja lentamente.'],errors:['Balancear el tronco.','Adelantar los codos.','Soltar la bajada.']},
 'Curl martillo':{muscles:'Braquial, bíceps y antebrazo',steps:['Agarre neutro.','Codos quietos.','Sube de forma controlada.','Baja lentamente.'],errors:['Balanceo.','Muñecas dobladas.','Carga excesiva.']},
 'Tríceps cuerda':{muscles:'Tríceps',steps:['Codos pegados al cuerpo.','Extiende hacia abajo.','Separa la cuerda al final.','Regresa sin mover los hombros.'],errors:['Abrir los codos.','Inclinarse demasiado.','Usar impulso.']},
 'Tríceps polea':{muscles:'Tríceps',steps:['Codos fijos.','Extiende completamente sin bloquear con violencia.','Mantén muñecas neutras.','Sube con control.'],errors:['Mover los hombros.','Abrir codos.','Balancear el cuerpo.']},
 'Extensión cuádriceps':{muscles:'Cuádriceps',steps:['Alinea la rodilla con el eje de la máquina.','Extiende sin golpe.','Aprieta arriba.','Baja lentamente.'],errors:['Carga excesiva.','Movimiento brusco.','Despegar la cadera.']},
 'Abducción cadera':{muscles:'Glúteo medio y menor',steps:['Espalda apoyada.','Abre las piernas de forma controlada.','Mantén un segundo.','Regresa lentamente.'],errors:['Rebotar.','Cerrar de golpe.','Arquear la espalda.']},
 'Pullover en polea':{muscles:'Dorsal ancho y core',steps:['Brazos casi estirados.','Lleva la barra hacia los muslos.','Mantén abdomen activo.','Regresa sin perder tensión.'],errors:['Flexionar demasiado los codos.','Arquear la espalda.','Usar impulso.']},
 'Crunch en máquina':{muscles:'Recto abdominal',steps:['Ajusta la máquina a un rango cómodo.','Acerca costillas y pelvis.','Exhala al contraer.','Regresa sin soltar el peso.'],errors:['Tirar con brazos o cuello.','Recorrido excesivo.','Usar una carga que provoque calambres.']},
 'Rotación de tronco en máquina':{muscles:'Oblicuos y estabilizadores del core',steps:['Ajusta el rango corto.','Mantén pelvis estable.','Rota de forma lenta.','Trabaja ambos lados.'],errors:['Girar con impulso.','Rango excesivo.','Mover las caderas.']},
 'Extensión lumbar en máquina':{muscles:'Erectores espinales, glúteos e isquiotibiales',steps:['Ajusta el apoyo.','Mantén columna neutra.','Extiende hasta quedar alineado.','Regresa lentamente.'],errors:['Hiperextender.','Movimiento rápido.','Carga excesiva.']},
 'Crunch polea con cuerda':{muscles:'Recto abdominal',steps:['Rodillas estables.','Flexiona el tronco acercando costillas a pelvis.','Exhala al bajar.','Vuelve lentamente.'],errors:['Tirar con los brazos.','Mover la cadera.','Redondear bruscamente el cuello.']},
 'Wood chop en polea':{muscles:'Oblicuos y core',steps:['Mantén pelvis estable.','Mueve brazos y tronco juntos.','Controla la rotación.','Trabaja ambos lados.'],errors:['Girar solo con los brazos.','Usar impulso.','Forzar la zona lumbar.']},
 'Pallof press en polea':{muscles:'Core antirotación',steps:['Colócate lateral a la polea.','Mantén pelvis y hombros rectos.','Extiende brazos sin girar.','Regresa lentamente.'],errors:['Rotar hacia la polea.','Separar los pies demasiado poco.','Usar carga excesiva.']},
 'Pallof press':{muscles:'Core antirotación',steps:['Colócate lateral a la polea.','Mantén abdomen firme.','Extiende brazos.','Evita que el tronco rote.'],errors:['Girar.','Arquear la espalda.','Perder estabilidad.']}
};
function guideFor(name){
 return EXERCISE_GUIDES[name]||{
  muscles:'Consulta la máquina y ajusta el ejercicio a un rango sin dolor.',
  steps:['Ajusta asiento y apoyos.','Mantén una postura estable.','Realiza el movimiento lentamente.','Detente si aparece dolor.'],
  errors:['Usar una carga excesiva.','Hacer movimientos bruscos.','Sacrificar la técnica.']
 };
}

const BLOCK3=[
 {name:'Día 1 · Fuerza base',focus:'Pierna + tirón + empuje',ex:[['Prensa',3,10,50],['Curl femoral',3,10,42],['Jalón neutro',3,10,45],['Remo con apoyo',3,10,35],['Press convergente',3,10,34],['Elevaciones laterales',3,14,7],['Tríceps cuerda',3,12,15.9]],core:[['Crunch en máquina',3,12],['Pallof press en polea',3,12]],cardio:{type:'Cinta inclinada',minutes:25,plan:'5 min suave + 15 min inclinación moderada + 5 min suave'}},
 {name:'Día 2 · Espalda y pierna',focus:'Espalda + cuádriceps',ex:[['Jalón al pecho agarre medio',3,10,45],['Remo polea baja',3,10,32],['Pullover en polea',3,12,15.9],['Extensión cuádriceps',3,12,32],['Abducción cadera',3,15,39],['Press inclinado máquina',3,10,20],['Face Pull',3,15,15.9]],core:[['Rotación de tronco en máquina',3,12],['Extensión lumbar en máquina',3,12]],cardio:{type:'Bicicleta',minutes:28,plan:'Ritmo continuo: 6/10 de esfuerzo'}},
 {name:'Día 3 · Técnica y control',focus:'Carga moderada',ex:[['Prensa',3,12,45],['Curl femoral',3,12,39],['Jalón neutro',3,12,45],['Remo máquina',3,12,32],['Press hombro máquina',3,12,13],['Peck Deck',3,14,45],['Curl martillo',3,12,10]],core:[['Crunch polea con cuerda',3,12],['Wood chop en polea',3,12]],cardio:{type:'Elíptica',minutes:30,plan:'3 min cómodo / 2 min vivo × 6'}},
 {name:'Día 4 · Full Body',focus:'Fuerza completa',ex:[['Prensa',3,10,50],['Curl femoral',3,10,42],['Jalón al pecho',3,10,50],['Remo con apoyo',3,10,35],['Press pecho máquina',3,10,36],['Press militar máquina',3,12,13],['Face Pull',3,15,15.9],['Curl bíceps',3,12,12]],core:[['Crunch en máquina',3,12],['Pallof press',3,12]],cardio:{type:'Cinta',minutes:30,plan:'2 min rápido / 2 min cómodo × 7 + vuelta a la calma'}},
 {name:'Día 5 · Cierre semanal',focus:'Volumen controlado',ex:[['Prensa',3,12,45],['Extensión cuádriceps',3,12,32],['Jalón neutro',3,12,45],['Remo máquina',3,12,32],['Press inclinado',3,12,20],['Peck Deck',3,15,45],['Tríceps polea',3,12,15.9],['Curl martillo',3,12,10]],core:[['Rotación de tronco máquina',3,12],['Extensión lumbar máquina',3,12]],cardio:{type:'Cardio libre',minutes:35,plan:'Caminata rápida, bicicleta o elíptica a intensidad progresiva'}}
];

const MENU={
 Lunes:{training:'Fuerza',meals:[['Desayuno','Café con leche desnatada, 40 g pan integral, 70 g pavo y fruta'],['Media mañana','Yogur natural y tostada integral pequeña'],['Comida','Pollo al horno, pasta integral, pimientos asados y ensalada'],['Merienda','Queso fresco y fruta'],['Cena','Salmón con calabacín mediterráneo y ensalada']]},
 Martes:{training:'Fuerza',meals:[['Desayuno','Café con leche desnatada, pan integral, pavo y fruta'],['Media mañana','Queso fresco y tostada integral'],['Comida','Lomo de cerdo magro, arroz integral y verduras'],['Merienda','Yogur natural'],['Cena','Atún, tomate, aguacate y ensalada variada']]},
 Miércoles:{training:'Fuerza + cardio',meals:[['Desayuno','Café con leche, pan integral, pavo y plátano'],['Media mañana','Yogur natural y tostada'],['Comida','Espinacas con garbanzos y pollo a la plancha'],['Merienda','Queso fresco'],['Cena','Bacalao con pimientos asados y ensalada']]},
 Jueves:{training:'Fuerza',meals:[['Desayuno','Café con leche, pan integral, pavo y fruta'],['Media mañana','Jamón cocido y tostada integral'],['Comida','Churrasco de pollo con especias argentinas, patata cocida y ensalada'],['Merienda','Yogur natural'],['Cena','Lomo de cerdo magro con verduras salteadas']]},
 Viernes:{training:'Fuerza',meals:[['Desayuno','Café con leche, pan integral, pavo y fruta'],['Media mañana','Queso fresco y tostada'],['Comida','Ternera magra, pasta integral y verduras'],['Merienda','Yogur o pavo'],['Cena','Salmón con espárragos y tomate']]},
 Sábado:{training:'Cardio suave',meals:[['Desayuno','Café con leche, pan integral, pavo y fruta'],['Media mañana','Yogur natural'],['Comida','Arroz con pollo y verduras'],['Merienda','Fruta y queso fresco'],['Cena','Ensalada completa con atún, tomate y aguacate']]},
 Domingo:{training:'Recuperación',meals:[['Desayuno','Café con leche, pan integral, pavo y fruta'],['Media mañana','Yogur natural'],['Comida','Legumbres con verduras y proteína magra'],['Merienda','Queso fresco'],['Cena','Pollo con pimientos asados y ensalada']]}
};
const SHOP_BASE=[
 ['Pechuga o churrasco de pollo','2 kg','Proteínas'],['Lomo de cerdo magro','700 g','Proteínas'],['Ternera magra','400 g','Proteínas'],['Salmón','600 g','Pescado'],['Bacalao','350 g','Pescado'],['Atún al natural','6 latas','Pescado'],['Pavo lonchas','600 g','Proteínas'],['Yogur natural desnatado','14 unidades','Lácteos'],['Queso fresco sin sal','700 g','Lácteos'],['Pan integral','1 paquete','Hidratos'],['Pasta integral','500 g','Hidratos'],['Arroz integral','500 g','Hidratos'],['Garbanzos cocidos','2 tarros','Legumbres'],['Patata','1 kg','Hidratos'],['Calabacín','4 unidades','Verduras'],['Pimientos asados','4-6 unidades','Verduras'],['Espinacas','600 g','Verduras'],['Ensalada variada','4 bolsas','Verduras'],['Tomate','1.5 kg','Verduras'],['Espárragos','2 manojos','Verduras'],['Aguacate','4 unidades','Grasas saludables'],['Fruta variada','14-18 piezas','Fruta'],['Aceite de oliva virgen extra','1 botella','Despensa'],['Frutos secos naturales','250 g','Grasas saludables']
];

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function go(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));render(id);scrollTo({top:0,behavior:'smooth'})}
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));$('#refreshBtn').onclick=forceAppUpdate;
function render(id){({inicio:renderHome,entrenamiento:renderWorkout,nutricion:renderNutrition,evolucion:renderProgress,mas:renderMore})[id]?.()}

function readiness(){const h=store('health').find(x=>x.date===todayISO());if(!h)return 76;return Math.max(20,Math.min(100,Math.round((h.energy||7)*5+(h.sleep||7)*5-(h.pain||0)*4)))}
function renderHome(){
 const s=safeSettings(), sessions=store('sessions'), today=dayName(), menu=MENU[today], pending=store('workoutQueue').filter(x=>x.status==='pending');
 const doneMeals=store('nutritionLog').filter(x=>x.date===todayISO()&&x.done).length;
 $('#inicio').innerHTML=`
 <div class="card hero"><div class="hero-grid"><div><div class="kicker">Semana ${s.currentWeek} · Día ${s.currentDay}</div><h2>${BLOCK3[s.currentDay-1].name}</h2><p class="muted">Fuerza + core en máquina + cardio progresivo</p></div><div class="score">${readiness()}<small>Preparación</small></div></div></div>
 ${pending.length?`<div class="banner"><strong>Tienes ${pending.length} sesión/es pendiente/s de recuperar.</strong><div class="btn-row" style="margin-top:10px"><button class="btn small" onclick="go('entrenamiento')">Ver recuperación</button></div></div>`:''}
 <div class="grid-2"><div class="stat"><span class="muted">Peso inicial</span><strong>${fmt(s.initialWeight)} kg</strong></div><div class="stat"><span class="muted">Peso actual</span><strong>${fmt(s.currentWeight)} kg</strong></div><div class="stat"><span class="muted">Objetivo</span><strong>${fmt(s.goalWeight)} kg</strong></div><div class="stat"><span class="muted">Semana</span><strong>${s.currentWeek} de ${s.totalWeeks}</strong></div></div>
 <div class="grid-2"><div class="stat compact"><span class="muted">Pérdida acumulada</span><strong>${fmt(Math.max(0,s.initialWeight-s.currentWeight))} kg</strong></div><div class="stat compact"><span class="muted">Faltan</span><strong>${fmt(Math.max(0,s.currentWeight-s.goalWeight))} kg</strong></div></div>
 <div class="card"><div class="section-title"><h2>Mi día</h2><span class="pill">${today}</span></div>
 <div class="task"><div><strong>Entrenamiento</strong><div class="muted">${BLOCK3[s.currentDay-1].focus}</div></div><button class="btn small primary" onclick="go('entrenamiento')">Abrir</button></div>
 <div class="task"><div><strong>Nutrición</strong><div class="muted">${doneMeals}/5 comidas registradas · ${menu.training}</div></div><button class="btn small" onclick="go('nutricion')">Ver menú</button></div>
 <div class="task"><div><strong>Salud</strong><div class="muted">${store('health').some(x=>x.date===todayISO())?'Registro realizado':'Pendiente de registrar'}</div></div><button class="btn small" onclick="openHealthForm()">Registrar</button></div></div>
 <div class="card"><div class="section-title"><h3>Progreso del programa</h3><strong>${Math.round(((s.currentWeek-1)*5+s.currentDay)/(s.totalWeeks*5)*100)}%</strong></div><div class="progress"><span style="width:${Math.round(((s.currentWeek-1)*5+s.currentDay)/(s.totalWeeks*5)*100)}%"></span></div></div>`;
}


function emptyWorkoutDraft(s,w){
 return {
  version:APP_VERSION,week:s.currentWeek,day:s.currentDay,date:todayISO(),startedAt:null,updatedAt:null,
  exercises:w.ex.map(e=>({name:e[0],rating:'',sets:Array.from({length:e[1]},()=>({kg:e[3],reps:e[2],done:false}))})),
  core:w.core.map(c=>({name:c[0],done:false})),
  cardioDone:false,duration:70,rpe:8,painBefore:0,painAfter:0,notes:''
 };
}
function currentDraft(s,w){
 let d=store('workoutDraft');
 if(!d||d.week!==s.currentWeek||d.day!==s.currentDay||!Array.isArray(d.exercises)){
  d=emptyWorkoutDraft(s,w);save('workoutDraft',d);
 }
 return d;
}
function draftProgress(d){
 const sets=d.exercises.flatMap(x=>x.sets||[]);
 return {done:sets.filter(x=>x.done).length,total:sets.length};
}
function saveWorkoutDraftFromForm(){
 const form=$('#workoutForm');if(!form)return;
 const s=safeSettings(),w=BLOCK3[s.currentDay-1],d=currentDraft(s,w);
 d.updatedAt=new Date().toISOString();
 d.exercises=[...form.querySelectorAll('.exercise[data-i]')].map((card,i)=>({
  name:w.ex[i][0],
  rating:card.dataset.rating||'',
  sets:[...card.querySelectorAll('.set-row')].map(row=>({
   kg:finite(row.querySelector('.kg').value,0),
   reps:finite(row.querySelector('.reps').value,0),
   done:row.querySelector('.done').checked
  }))
 }));
 d.core=[...form.querySelectorAll('.coreDone')].map((x,i)=>({name:w.core[i][0],done:x.checked}));
 d.cardioDone=$('#cardioDone')?.checked||false;
 d.duration=finite($('#duration')?.value,70);
 d.rpe=finite($('#rpe')?.value,8);
 d.painBefore=finite($('#painBefore')?.value,0);
 d.painAfter=finite($('#painAfter')?.value,0);
 d.notes=$('#workoutNotes')?.value||'';
 save('workoutDraft',d);
 updateDraftStatus();
}
function bindWorkoutAutosave(){
 const form=$('#workoutForm');if(!form)return;
 form.addEventListener('input',saveWorkoutDraftFromForm);
 form.addEventListener('change',saveWorkoutDraftFromForm);
 updateDraftStatus();
}
function updateDraftStatus(){
 const el=$('#draftStatus');if(!el)return;
 const d=store('workoutDraft');if(!d)return;
 const p=draftProgress(d);
 el.textContent=`Autoguardado · ${p.done}/${p.total} series`;
}
function setExerciseRating(index,rating){
 const card=document.querySelector(`.exercise[data-i="${index}"]`);if(!card)return;
 card.dataset.rating=rating;
 card.querySelectorAll('.rating-btn').forEach(b=>b.classList.toggle('active',b.dataset.value===rating));
 saveWorkoutDraftFromForm();
 toast(rating==='up'?'Marcado para subir peso':rating==='down'?'Marcado para bajar peso':'Peso correcto para mantener');
}
function openExerciseGuide(name){
 const g=guideFor(name);
 $('#guideTitle').textContent=name;
 $('#guideMuscles').textContent=g.muscles;
 $('#guideSteps').innerHTML=g.steps.map((x,i)=>`<li><b>${i+1}.</b> ${x}</li>`).join('');
 $('#guideErrors').innerHTML=g.errors.map(x=>`<li>${x}</li>`).join('');
 $('#exerciseGuideModal').classList.add('open');
}
function closeExerciseGuide(){$('#exerciseGuideModal').classList.remove('open')}

function renderWorkout(){
 const s=safeSettings(),w=BLOCK3[s.currentDay-1],queue=store('workoutQueue'),d=currentDraft(s,w),p=draftProgress(d);
 $('#entrenamiento').innerHTML=`<div class="section-title"><div><span class="eyebrow">BLOQUE 2 · SEMANA ${s.currentWeek}</span><h2>${w.name}</h2><p class="muted">${w.focus}</p></div><span id="draftStatus" class="pill blue">Autoguardado · ${p.done}/${p.total} series</span></div>
 <div class="card"><h3>Flexibilidad del día</h3><p class="muted">Puedes entrenar por la mañana o por la tarde. Todo lo que marques se guarda automáticamente, incluso si cierras la aplicación.</p><div class="btn-row"><button class="btn primary" onclick="startWorkout()">Comenzar o continuar</button><button class="btn" onclick="postponeWorkout('tarde')">Pasar a la tarde</button><button class="btn secondary" onclick="postponeWorkout('mañana')">Recuperar mañana</button></div></div>
 ${d.updatedAt?`<div class="banner"><strong>Sesión recuperada automáticamente.</strong><p>Llevabas ${p.done} de ${p.total} series completadas.</p></div>`:''}
 ${queue.filter(x=>x.status==='pending').map(q=>`<div class="banner"><strong>Pendiente: ${q.label}</strong><p>${q.reason||'Sesión reprogramada'}</p><button class="btn small" onclick="recoverQueue('${q.id}')">Recuperar ahora</button></div>`).join('')}
 <div id="workoutForm">${workoutMarkup(w,d)}</div>`;
 bindWorkoutAutosave();
}
function workoutMarkup(w,d){return `<div class="card"><div class="section-title"><h3>Fuerza</h3><span class="pill">Prioridad alta</span></div>${w.ex.map((e,i)=>{
 const de=d.exercises[i]||{rating:'',sets:[]};
 return `<div class="exercise" data-i="${i}" data-rating="${de.rating||''}"><div class="exercise-head"><div><h3>${i+1}. ${e[0]}</h3><div class="muted">${e[1]} × ${e[2]} · referencia ${e[3]} kg</div></div><button class="guide-btn" type="button" onclick="openExerciseGuide('${e[0].replace(/'/g,"\\'")}')">? Técnica</button></div>
 ${Array.from({length:e[1]},(_,j)=>{const ds=de.sets[j]||{kg:e[3],reps:e[2],done:false};return `<div class="set-row"><b>${j+1}</b><input class="kg" type="number" step=".1" value="${ds.kg}"><input class="reps" type="number" value="${ds.reps}"><input class="done" type="checkbox" ${ds.done?'checked':''}></div>`}).join('')}
 <div class="rating-row"><span>Próxima vez:</span><button type="button" class="rating-btn ${de.rating==='ok'?'active':''}" data-value="ok" onclick="setExerciseRating(${i},'ok')">✓ OK</button><button type="button" class="rating-btn ${de.rating==='up'?'active':''}" data-value="up" onclick="setExerciseRating(${i},'up')">↑ Subir</button><button type="button" class="rating-btn ${de.rating==='down'?'active':''}" data-value="down" onclick="setExerciseRating(${i},'down')">↓ Bajar</button></div>
 <button class="btn small secondary" type="button" onclick="skipExercise(${i})">Saltar y recuperar</button></div>`}).join('')}</div>
 <div class="card"><div class="section-title"><h3>Core en máquina/polea</h3><span class="pill blue">Progresivo</span></div>${w.core.map((c,i)=>`<div class="exercise core-exercise"><label class="check"><input class="coreDone" type="checkbox" ${d.core[i]?.done?'checked':''}> <span><strong>${c[0]}</strong><br><span class="muted">${c[1]} × ${c[2]}</span></span></label><button class="guide-btn" type="button" onclick="openExerciseGuide('${c[0].replace(/'/g,"\\'")}')">? Técnica</button></div>`).join('')}</div>
 <div class="card"><div class="section-title"><h3>Cardio</h3><span class="pill amber">${w.cardio.minutes} min</span></div><strong>${w.cardio.type}</strong><p class="muted">${w.cardio.plan}</p><label class="check"><input id="cardioDone" type="checkbox" ${d.cardioDone?'checked':''}> Cardio completado</label></div>
 <div class="card"><div class="form-grid"><label>Duración (min)<input id="duration" type="number" value="${d.duration}"></label><label>Sensación 1-10<input id="rpe" type="number" min="1" max="10" step=".1" value="${d.rpe}"></label><label>Dolor antes 0-10<input id="painBefore" type="number" min="0" max="10" value="${d.painBefore}"></label><label>Dolor después 0-10<input id="painAfter" type="number" min="0" max="10" value="${d.painAfter}"></label><label class="wide">Notas<textarea id="workoutNotes" placeholder="Sensaciones, molestias, cambios...">${d.notes||''}</textarea></label></div><div class="btn-row" style="margin-top:14px"><button class="btn primary" type="button" onclick="finishWorkout()">Guardar entrenamiento</button><button class="btn" type="button" onclick="shortSession()">Modo 40 minutos</button></div></div>`}
function startWorkout(){const s=safeSettings(),w=BLOCK3[s.currentDay-1],d=currentDraft(s,w);if(!d.startedAt)d.startedAt=new Date().toISOString();d.updatedAt=new Date().toISOString();save('workoutDraft',d);toast('Sesión iniciada y autoguardada');updateDraftStatus()}
function postponeWorkout(when){const s=safeSettings(),q=store('workoutQueue');q.push({id:uid(),label:`Semana ${s.currentWeek} · Día ${s.currentDay}`,day:s.currentDay,status:'pending',reason:when==='tarde'?'Pendiente para esta tarde':'Pendiente para mañana',created:todayISO()});save('workoutQueue',q);toast('Sesión reprogramada');renderWorkout()}
function recoverQueue(id){const q=store('workoutQueue'),item=q.find(x=>x.id===id);if(item){const s=safeSettings();s.currentDay=item.day;save('settings',s);item.status='in_progress';save('workoutQueue',q);renderWorkout();toast('Sesión recuperada') }}
function skipExercise(i){const s=safeSettings(),w=BLOCK3[s.currentDay-1],q=store('workoutQueue');q.push({id:uid(),label:`Recuperar: ${w.ex[i][0]}`,day:s.currentDay,status:'pending',reason:'Ejercicio no realizado',exercise:w.ex[i][0],created:todayISO()});save('workoutQueue',q);toast('Ejercicio guardado para recuperar')}
function shortSession(){document.querySelectorAll('.exercise').forEach((el,i)=>{if(i>4)el.classList.add('hidden')});toast('Modo 40 minutos: se mantienen los ejercicios prioritarios')}
function finishWorkout(){
 saveWorkoutDraftFromForm();
 const s=safeSettings(),w=BLOCK3[s.currentDay-1],d=currentDraft(s,w);
 const sets=d.exercises.flatMap(x=>x.sets||[]);
 let completed=0,total=sets.length,volume=0;
 sets.forEach(x=>{if(x.done){completed++;volume+=finite(x.kg,0)*finite(x.reps,0)}});
 const sessions=store('sessions');
 sessions.push({
  id:uid(),date:todayISO(),week:s.currentWeek,day:s.currentDay,label:w.name,
  duration:d.duration,rpe:d.rpe,painBefore:d.painBefore,painAfter:d.painAfter,
  completed,total,volume,cardio:d.cardioDone,notes:d.notes,
  exercises:d.exercises,core:d.core,startedAt:d.startedAt,finishedAt:new Date().toISOString()
 });
 save('sessions',sessions);
 const prefs=store('exercisePreferences');
 d.exercises.forEach(x=>{if(x.rating)prefs[x.name]={rating:x.rating,date:todayISO(),week:s.currentWeek,day:s.currentDay}});
 save('exercisePreferences',prefs);
 save('workoutDraft',null);
 if(s.currentDay<5)s.currentDay++;else{s.currentDay=1;s.currentWeek=Math.min(s.totalWeeks,s.currentWeek+1)}
 save('settings',s);
 toast('Entrenamiento guardado definitivamente');
 renderWorkout();
}

function renderNutrition(){
 const log=store('nutritionLog'), today=dayName(), shop=ensureShopping(), pantry=store('pantry');
 $('#nutricion').innerHTML=`<div class="section-title"><div><span class="eyebrow">PLAN SEMANAL</span><h2>Nutrición</h2></div></div>
 <div class="tabs"><button class="tab active" onclick="nutritionTab('menu',this)">Menú</button><button class="tab" onclick="nutritionTab('compra',this)">Compra</button><button class="tab" onclick="nutritionTab('despensa',this)">Despensa</button><button class="tab" onclick="nutritionTab('batch',this)">Batch cooking</button></div>
 <div id="nutriContent">${menuPanel(today,log)}</div>`;
}
function nutritionTab(tab,btn){$$('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const today=dayName();$('#nutriContent').innerHTML=tab==='menu'?menuPanel(today,store('nutritionLog')):tab==='compra'?shoppingPanel():tab==='despensa'?pantryPanel():batchPanel()}
function menuPanel(today,log){const days=Object.keys(MENU);return `<div class="card"><label>Día de la semana<select id="menuDay" onchange="changeMenuDay(this.value)">${days.map(d=>`<option ${d===today?'selected':''}>${d}</option>`).join('')}</select></label></div><div id="dayMenu">${dayMenu(today,log)}</div><div class="card"><h3>Cobertura nutricional semanal</h3><div class="mini-grid"><div class="mini">Proteína<strong>Diaria</strong></div><div class="mini">Omega-3<strong>2 veces</strong></div><div class="mini">Legumbres<strong>2 veces</strong></div><div class="mini">Fruta/verdura<strong>Diaria</strong></div></div><p class="note">La planificación prioriza variedad de proteínas, fibra, calcio, hierro, grasas saludables y carbohidratos ajustados al entrenamiento. No sustituye la pauta de tu endocrino.</p></div>`}
function changeMenuDay(d){$('#dayMenu').innerHTML=dayMenu(d,store('nutritionLog'))}
function dayMenu(day,log){return `<div class="card"><div class="section-title"><h3>${day}</h3><span class="pill">${MENU[day].training}</span></div>${MENU[day].meals.map((m,i)=>{const key=`${todayISO()}-${day}-${i}`;const done=log.some(x=>x.key===key&&x.done);return `<div class="meal"><label class="check"><input type="checkbox" ${done?'checked':''} onchange="toggleMeal('${key}','${day}',${i},this.checked)"><span><strong>${m[0]}</strong><br><span class="muted">${m[1]}</span></span></label></div>`}).join('')}<div class="form-grid"><label>Hambre 1-10<input id="hunger" type="number" min="1" max="10"></label><label>Energía 1-10<input id="foodEnergy" type="number" min="1" max="10"></label><label class="wide">Digestión / hinchazón<textarea id="digestion"></textarea></label></div><button class="btn primary" style="margin-top:12px" onclick="saveNutritionFeeling('${day}')">Guardar sensaciones</button></div>`}
function toggleMeal(key,day,index,done){let l=store('nutritionLog');const old=l.find(x=>x.key===key);if(old)old.done=done;else l.push({key,date:todayISO(),day,index,done});save('nutritionLog',l);toast(done?'Comida registrada':'Registro desmarcado')}
function saveNutritionFeeling(day){let l=store('nutritionLog');l.push({id:uid(),date:todayISO(),day,type:'feeling',hunger:+$('#hunger').value||0,energy:+$('#foodEnergy').value||0,digestion:$('#digestion').value});save('nutritionLog',l);toast('Sensaciones guardadas')}
function ensureShopping(){let s=store('shopping');if(!s.length){s=SHOP_BASE.map(x=>({id:uid(),name:x[0],qty:x[1],category:x[2],have:false,bought:false}));save('shopping',s)}return s}
function shoppingPanel(){const s=ensureShopping();const cats=[...new Set(s.map(x=>x.category))];return `<div class="card"><h3>Lista inteligente</h3><p class="muted">Marca “Ya tengo” para excluirlo de la compra. Marca “Comprado” cuando lo metas en casa.</p><div class="btn-row"><button class="btn small" onclick="resetShopping()">Reiniciar semana</button><button class="btn small primary" onclick="moveBoughtToPantry()">Pasar comprados a despensa</button></div></div>${cats.map(c=>`<div class="card"><h3>${c}</h3>${s.filter(x=>x.category===c).map(x=>`<div class="shopping-item ${x.have||x.bought?'done':''}"><div><strong>${x.name}</strong><div class="shopping-meta">${x.qty}</div></div><div><label class="check"><input type="checkbox" ${x.have?'checked':''} onchange="setShopping('${x.id}','have',this.checked)"> Ya tengo</label><label class="check"><input type="checkbox" ${x.bought?'checked':''} onchange="setShopping('${x.id}','bought',this.checked)"> Comprado</label></div></div>`).join('')}</div>`).join('')}`}
function setShopping(id,field,val){const s=store('shopping'),x=s.find(i=>i.id===id);x[field]=val;save('shopping',s);$('#nutriContent').innerHTML=shoppingPanel()}
function resetShopping(){save('shopping',SHOP_BASE.map(x=>({id:uid(),name:x[0],qty:x[1],category:x[2],have:false,bought:false})));$('#nutriContent').innerHTML=shoppingPanel();toast('Lista reiniciada')}
function moveBoughtToPantry(){const s=store('shopping'),p=store('pantry');s.filter(x=>x.bought).forEach(x=>{const e=p.find(y=>y.name===x.name);if(e)e.qty=x.qty;else p.push({id:uid(),name:x.name,qty:x.qty})});save('pantry',p);toast('Despensa actualizada')}
function pantryPanel(){const p=store('pantry');return `<div class="card"><h3>Mi despensa</h3><div class="form-grid"><label class="wide">Producto<input id="pantryName"></label><label>Cantidad<input id="pantryQty"></label><button class="btn primary" onclick="addPantry()">Añadir</button></div></div><div class="card">${p.length?p.map(x=>`<div class="task"><div><strong>${x.name}</strong><div class="muted">${x.qty||'Disponible'}</div></div><button class="btn small danger" onclick="removePantry('${x.id}')">Eliminar</button></div>`).join(''):'<div class="empty">Aún no hay productos guardados.</div>'}</div>`}
function addPantry(){const n=$('#pantryName').value.trim();if(!n)return;const p=store('pantry');p.push({id:uid(),name:n,qty:$('#pantryQty').value});save('pantry',p);$('#nutriContent').innerHTML=pantryPanel()}
function removePantry(id){save('pantry',store('pantry').filter(x=>x.id!==id));$('#nutriContent').innerHTML=pantryPanel()}
function batchPanel(){return `<div class="card"><h3>Preparación del domingo · 2 horas</h3>${['Hornear pollo y churrasco para varias raciones','Cocer arroz y pasta; enfriar y guardar porciones','Asar pimientos y preparar calabacín','Lavar y secar ensaladas y tomates','Preparar garbanzos con espinacas','Separar pescado por raciones y congelar lo que no se use en 48 horas','Dejar fruta, yogures y queso fresco visibles para meriendas'].map((x,i)=>`<label class="check task"><input type="checkbox"> <span><strong>${i+1}. ${x}</strong></span></label>`).join('')}<p class="note">Conserva y congela de forma segura según el alimento. El pescado fresco y las preparaciones cocinadas no deben permanecer varios días sin refrigeración adecuada.</p></div>`}

function renderProgress(){const m=store('measures'),sessions=store('sessions');const last=m.at(-1)||{};$('#evolucion').innerHTML=`<div class="section-title"><div><span class="eyebrow">DATOS Y TENDENCIAS</span><h2>Evolución</h2></div></div><div class="grid-2"><div class="stat"><span class="muted">Peso</span><strong>${last.weight||'—'} kg</strong></div><div class="stat"><span class="muted">Cintura</span><strong>${last.waist||'—'} cm</strong></div><div class="stat"><span class="muted">Entrenos</span><strong>${sessions.length}</strong></div><div class="stat"><span class="muted">Volumen último</span><strong>${sessions.at(-1)?.volume||0}</strong></div></div><div class="card"><h3>Nueva medición</h3><div class="form-grid"><label>Fecha<input id="measureDate" type="date" value="${todayISO()}"></label><label>Peso kg<input id="measureWeight" type="number" step=".1"></label><label>Cintura cm<input id="measureWaist" type="number" step=".1"></label><label>Grasa %<input id="measureFat" type="number" step=".1"></label><label>Masa muscular kg<input id="measureMuscle" type="number" step=".1"></label></div><button class="btn primary" style="margin-top:12px" onclick="saveMeasure()">Guardar medición</button></div><div class="card"><h3>Histórico</h3><div class="table-wrap"><table class="simple-table"><thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Grasa</th><th>Músculo</th></tr></thead><tbody>${[...m].reverse().map(x=>`<tr><td>${x.date}</td><td>${x.weight||'—'}</td><td>${x.waist||'—'}</td><td>${x.bodyFat||'—'}</td><td>${x.muscle||'—'}</td></tr>`).join('')}</tbody></table></div></div>`}
function saveMeasure(){const weight=$('#measureWeight').value===''?null:finite($('#measureWeight').value,null);const m=store('measures');m.push({date:$('#measureDate').value,official:true,weight,waist:$('#measureWaist').value===''?null:finite($('#measureWaist').value,null),bodyFat:$('#measureFat').value===''?null:finite($('#measureFat').value,null),muscle:$('#measureMuscle').value===''?null:finite($('#measureMuscle').value,null)});m.sort((a,b)=>(a.date||'').localeCompare(b.date||''));save('measures',m);const s=safeSettings();if(weight!==null)s.currentWeight=weight;save('settings',s);renderProgress();toast('Medición guardada')}

function renderMore(){const a=store('analytics'),r=store('reminders');$('#mas').innerHTML=`<div class="section-title"><div><span class="eyebrow">SALUD Y AJUSTES</span><h2>Más</h2></div></div><div class="card"><div class="task"><div><strong>Registro diario de salud</strong><div class="muted">Sueño, energía, pasos, agua y dolor</div></div><button class="btn small" onclick="openHealthForm()">Abrir</button></div><div class="task"><div><strong>Analíticas</strong><div class="muted">${a.length} registros locales</div></div><button class="btn small" onclick="showAnalytics()">Gestionar</button></div><div class="task"><div><strong>Notificaciones</strong><div class="muted">${r.length} recordatorios configurados</div></div><button class="btn small" onclick="showReminders()">Configurar</button></div><div class="task"><div><strong>Copia de seguridad</strong><div class="muted">Exportar o importar datos del dispositivo</div></div><button class="btn small" onclick="showBackup()">Abrir</button></div></div><div id="moreContent"></div>`}
function openHealthForm(){go('mas');$('#moreContent').innerHTML=`<div class="card"><h3>Salud de hoy</h3><div class="form-grid"><label>Pasos<input id="steps" type="number"></label><label>Sueño (h)<input id="sleep" type="number" step=".1"></label><label>FC reposo<input id="hr" type="number"></label><label>Agua (L)<input id="water" type="number" step=".1"></label><label>Energía 1-10<input id="energy" type="number" min="1" max="10"></label><label>Dolor 0-10<input id="healthPain" type="number" min="0" max="10"></label><label class="wide">Observaciones<textarea id="healthNotes"></textarea></label></div><button class="btn primary" style="margin-top:12px" onclick="saveHealth()">Guardar</button></div>`}
function saveHealth(){let h=store('health');h=h.filter(x=>x.date!==todayISO());h.push({date:todayISO(),steps:+$('#steps').value||0,sleep:+$('#sleep').value||0,hr:+$('#hr').value||0,water:+$('#water').value||0,energy:+$('#energy').value||0,pain:+$('#healthPain').value||0,notes:$('#healthNotes').value});save('health',h);toast('Salud registrada');renderMore()}
function showAnalytics(){const a=store('analytics');$('#moreContent').innerHTML=`<div class="card"><h3>Nueva analítica</h3><p class="note">Los datos se guardan únicamente en este dispositivo. No subas informes médicos al repositorio público.</p><div class="form-grid"><label>Fecha<input id="aDate" type="date" value="${todayISO()}"></label><label>Parámetro<input id="aParam" placeholder="Ej. Glucosa"></label><label>Valor<input id="aValue" type="number" step=".01"></label><label>Unidad<input id="aUnit" placeholder="mg/dL"></label><label>Rango del laboratorio<input id="aRange" placeholder="70-100"></label><label class="wide">Observaciones<textarea id="aNotes"></textarea></label></div><button class="btn primary" style="margin-top:12px" onclick="saveAnalytic()">Guardar parámetro</button></div><div class="card"><h3>Histórico</h3><div class="table-wrap"><table class="simple-table"><thead><tr><th>Fecha</th><th>Parámetro</th><th>Valor</th><th>Rango</th></tr></thead><tbody>${[...a].reverse().map(x=>`<tr><td>${x.date}</td><td>${x.param}</td><td>${x.value} ${x.unit}</td><td>${x.range||'—'}</td></tr>`).join('')}</tbody></table></div></div>`}
function saveAnalytic(){const p=$('#aParam').value.trim();if(!p)return toast('Escribe el parámetro');const a=store('analytics');a.push({id:uid(),date:$('#aDate').value,param:p,value:$('#aValue').value,unit:$('#aUnit').value,range:$('#aRange').value,notes:$('#aNotes').value});save('analytics',a);showAnalytics();toast('Analítica guardada')}
function showReminders(){const r=store('reminders');$('#moreContent').innerHTML=`<div class="card"><h3>Recordatorios</h3><div class="form-grid"><label class="wide">Nombre<input id="rName" placeholder="Entrenamiento, agua, compra..."></label><label>Hora<input id="rTime" type="time" value="06:30"></label><label>Días<select id="rDays"><option>Todos los días</option><option>Lunes a viernes</option><option>Viernes</option><option>Domingo</option></select></label></div><div class="btn-row" style="margin-top:12px"><button class="btn primary" onclick="addReminder()">Añadir</button><button class="btn" onclick="requestNotifications()">Permitir avisos</button></div><p class="note">En iPhone, los avisos web dependen de que la app esté instalada en la pantalla de inicio y del soporte del sistema. Los recordatorios también aparecen dentro de Proyecto85.</p></div><div class="card">${r.length?r.map(x=>`<div class="task"><div><strong>${x.name}</strong><div class="muted">${x.time} · ${x.days}</div></div><button class="btn small danger" onclick="removeReminder('${x.id}')">Eliminar</button></div>`).join(''):'<div class="empty">Sin recordatorios.</div>'}</div>`}
function addReminder(){const n=$('#rName').value.trim();if(!n)return;const r=store('reminders');r.push({id:uid(),name:n,time:$('#rTime').value,days:$('#rDays').value});save('reminders',r);showReminders();toast('Recordatorio añadido')}
function removeReminder(id){save('reminders',store('reminders').filter(x=>x.id!==id));showReminders()}
async function requestNotifications(){if(!('Notification'in window))return toast('Este navegador no admite notificaciones');const p=await Notification.requestPermission();if(p==='granted'){new Notification('Proyecto85',{body:'Avisos activados correctamente'});toast('Notificaciones activadas')}else toast('Permiso no concedido')}
function showBackup(){$('#moreContent').innerHTML=`<div class="card"><h3>Copia de seguridad</h3><div class="btn-row"><button class="btn primary" onclick="exportData()">Exportar datos</button><label class="btn">Importar<input type="file" accept="application/json" class="hidden" onchange="importData(this.files[0])"></label></div><p class="note">El archivo puede contener información personal y médica. Guárdalo de forma privada.</p></div>`}
function exportData(){const data={version:APP_VERSION,exported:new Date().toISOString()};Object.keys(DEFAULTS).forEach(k=>data[k]=store(k));const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Proyecto85-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importData(file){if(!file)return;const fr=new FileReader();fr.onload=()=>{try{const d=JSON.parse(fr.result);Object.keys(DEFAULTS).forEach(k=>{if(d[k]!==undefined)save(k,d[k])});toast('Copia importada');renderMore()}catch{toast('Archivo no válido')}};fr.readAsText(file)}

function dayName(){return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()]}
function checkInAppReminders(){const now=new Date(), hh=now.toTimeString().slice(0,5),day=dayName();store('reminders').forEach(r=>{const relevant=r.days==='Todos los días'||(r.days==='Lunes a viernes'&&!['Sábado','Domingo'].includes(day))||r.days===day;if(relevant&&r.time===hh){const key=`p85_notified_${todayISO()}_${r.id}_${hh}`;if(!sessionStorage.getItem(key)){toast(`Recordatorio: ${r.name}`);if(Notification.permission==='granted')new Notification('Proyecto85',{body:r.name});sessionStorage.setItem(key,'1')}}})}
setInterval(checkInAppReminders,30000);
async function forceAppUpdate(){
 migrateData();
 if('serviceWorker'in navigator){
  try{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update()}catch{}
 }
 render($('.view.active')?.id||'inicio');
 toast('Datos y aplicación actualizados');
}
if('serviceWorker'in navigator){
 navigator.serviceWorker.register('./sw.js?v=4.0.1').then(reg=>reg.update()).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!sessionStorage.getItem('p85_reloaded_401')){sessionStorage.setItem('p85_reloaded_401','1');location.reload()}});
}
renderHome();
