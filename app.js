
"use strict";

const APP_VERSION="4.2.1";
const SCHEMA_VERSION=4;
const PREFIX="p85pro2_";
const STATE_KEY=PREFIX+"state";
const CUSTOM_RECIPE_KEY=PREFIX+"customRecipes";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const uid=()=>globalThis.crypto?.randomUUID?.()||("id_"+Date.now()+"_"+Math.random().toString(36).slice(2));
const localISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const todayISO=()=>localISO(new Date());
const monday=(offset=0)=>{const d=new Date(),day=d.getDay(),diff=(day===0?-6:1-day)+offset*7;d.setDate(d.getDate()+diff);d.setHours(12,0,0,0);return localISO(d)};
const plusDays=(iso,n)=>{const [y,m,day]=iso.split("-").map(Number),d=new Date(y,m-1,day,12);d.setDate(d.getDate()+n);return localISO(d)};
const dayName=()=>["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const DAYS=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const MEALS={breakfast:"Desayuno",midmorning:"Media mañana",lunch:"Comida",snack:"Merienda",dinner:"Cena"};

const LEARNING_CARDS=[
 {title:"La báscula no cuenta toda la historia",body:"Peso, cintura, rendimiento y constancia aportan información distinta. Una medición aislada puede variar; la tendencia de varias semanas es más útil."},
 {title:"Proteína repartida durante el día",body:"Incluir una fuente de proteína en las comidas principales ayuda a construir platos completos y facilita la recuperación del entrenamiento."},
 {title:"Los hidratos también forman parte de una alimentación equilibrada",body:"Arroz, pasta, patata, pan y legumbres pueden formar parte del plan. Importan la cantidad, el conjunto del día y la actividad."},
 {title:"Progresar no significa subir peso cada sesión",body:"A veces progresar es completar más repeticiones con buena técnica, controlar mejor el movimiento o terminar todas las series previstas."},
 {title:"La recuperación también entrena",body:"Dormir, hidratarse y alternar el énfasis de las sesiones ayuda a mantener una práctica constante sin convertir cada día en una competición."},
 {title:"Comer fuera no invalida la semana",body:"Una comida flexible planificada puede convivir con una semana equilibrada. No hace falta compensarla saltándose comidas después."},
 {title:"Preparar bases ahorra decisiones",body:"Dejar verduras, legumbres y algunas proteínas listas reduce el tiempo de cocina sin tener que cocinar siete días completos el domingo."}
];

const EXERCISES=[
 {id:"leg_press",name:"Prensa de piernas",group:"Piernas",equipment:"Máquina",sets:3,reps:"10-12",seed:52,inc:5,tech:"Espalda apoyada, pies estables y rodillas alineadas. Baja con control dentro de un rango cómodo.",alts:["hack_squat","leg_extension"]},
 {id:"hack_squat",name:"Hack squat en máquina",group:"Piernas",equipment:"Máquina",sets:3,reps:"8-12",seed:30,inc:5,tech:"Mantén la espalda apoyada y las rodillas alineadas con los pies. Usa un recorrido cómodo y controlado.",alts:["leg_press"]},
 {id:"leg_extension",name:"Extensión de cuádriceps",group:"Cuádriceps",equipment:"Máquina",sets:3,reps:"10-12",seed:39,inc:3,tech:"Alinea la rodilla con el eje de la máquina. Extiende sin bloquear bruscamente y vuelve despacio.",alts:["leg_press"]},
 {id:"leg_curl",name:"Curl femoral",group:"Isquiotibiales",equipment:"Máquina",sets:3,reps:"10-12",seed:39,inc:3,tech:"Ajusta el rodillo y flexiona sin despegar la cadera. Controla especialmente la vuelta.",alts:["rdl_machine"]},
 {id:"rdl_machine",name:"Bisagra de cadera en máquina",group:"Isquiotibiales",equipment:"Máquina",sets:3,reps:"10-12",seed:25,inc:5,tech:"Lleva la cadera atrás con espalda neutra y vuelve apretando glúteos, sin forzar el rango.",alts:["leg_curl"]},
 {id:"glute_machine",name:"Extensión de glúteo en máquina",group:"Glúteos",equipment:"Máquina",sets:3,reps:"12-15",seed:25,inc:3,tech:"Mantén la pelvis estable y extiende la cadera sin arquear la zona lumbar.",alts:["abduction"]},
 {id:"abduction",name:"Abducción de cadera",group:"Glúteos",equipment:"Máquina",sets:3,reps:"12-15",seed:39,inc:3,tech:"Tronco estable. Abre las piernas sin impulso y vuelve con control.",alts:["glute_machine"]},
 {id:"adduction",name:"Aducción de cadera",group:"Aductores",equipment:"Máquina",sets:3,reps:"12-15",seed:32,inc:3,tech:"Cierra las piernas de forma controlada, sin rebotes ni movimientos bruscos.",alts:["leg_press"]},
 {id:"calf",name:"Gemelos en máquina",group:"Gemelos",equipment:"Máquina",sets:3,reps:"12-15",seed:20,inc:5,tech:"Recorre un rango cómodo sin rebotes: baja el talón con control y sube de forma estable.",alts:["leg_press"]},
 {id:"lat_pulldown",name:"Jalón al pecho",group:"Dorsal",equipment:"Polea/Máquina",sets:3,reps:"8-12",seed:45,inc:3,tech:"Pecho alto y hombros lejos de las orejas. Lleva el agarre hacia la parte alta del pecho y vuelve despacio.",alts:["chest_row","pullover"]},
 {id:"neutral_pulldown",name:"Jalón agarre neutro",group:"Dorsal",equipment:"Polea",sets:3,reps:"10-12",seed:40,inc:3,tech:"Mantén el torso estable y lleva los codos hacia abajo sin balancearte.",alts:["lat_pulldown"]},
 {id:"chest_row",name:"Remo con apoyo al pecho",group:"Espalda media",equipment:"Máquina",sets:3,reps:"8-12",seed:32,inc:3,tech:"Pecho apoyado. Lleva los codos atrás sin encoger los hombros.",alts:["low_row","lat_pulldown"]},
 {id:"low_row",name:"Remo en polea baja",group:"Espalda media",equipment:"Polea",sets:3,reps:"10-12",seed:30,inc:3,tech:"Tronco estable. Tira hacia el abdomen sin balanceo.",alts:["chest_row"]},
 {id:"pullover",name:"Pullover en polea/máquina",group:"Dorsal",equipment:"Polea/Máquina",sets:3,reps:"10-12",seed:15.9,inc:2.3,tech:"Mantén los brazos casi extendidos y lleva el agarre hacia los muslos usando la espalda.",alts:["lat_pulldown"]},
 {id:"face_pull",name:"Face Pull",group:"Espalda alta",equipment:"Polea",sets:3,reps:"12-15",seed:15.9,inc:2.3,tech:"Tira hacia la cara separando las manos y sin elevar los hombros.",alts:["rear_delt"]},
 {id:"shrug_machine",name:"Encogimientos de trapecio en máquina",group:"Trapecio",equipment:"Máquina",sets:3,reps:"10-15",seed:30,inc:5,tech:"Eleva los hombros hacia arriba de forma controlada, sin realizar círculos con ellos.",alts:["face_pull"]},
 {id:"chest_press",name:"Press de pecho en máquina",group:"Pecho",equipment:"Máquina",sets:3,reps:"8-12",seed:32,inc:3,tech:"Ajusta el asiento para que las asas queden a la altura media del pecho. Empuja sin despegar la espalda.",alts:["incline_press","pec_deck"]},
 {id:"incline_press",name:"Press inclinado en máquina",group:"Pecho superior",equipment:"Máquina",sets:3,reps:"8-12",seed:20,inc:2.5,tech:"Escápulas apoyadas. Empuja arriba y delante de forma controlada.",alts:["chest_press"]},
 {id:"pec_deck",name:"Pec Deck / Mariposa",group:"Pecho",equipment:"Máquina",sets:3,reps:"10-12",seed:45,inc:3,tech:"Pecho apoyado. Junta los brazos sin golpearlos y vuelve lentamente.",alts:["chest_press"]},
 {id:"shoulder_press",name:"Press de hombros en máquina",group:"Hombro",equipment:"Máquina",sets:3,reps:"8-12",seed:13,inc:2,tech:"Espalda apoyada y movimiento controlado, sin arquear la zona lumbar.",alts:["lateral_raise"]},
 {id:"lateral_raise",name:"Elevaciones laterales",group:"Hombro lateral",equipment:"Mancuernas/Máquina",sets:3,reps:"12-15",seed:7,inc:1,tech:"Eleva con codos suaves hasta una altura cómoda, sin impulso.",alts:["shoulder_press"]},
 {id:"rear_delt",name:"Deltoide posterior en máquina",group:"Hombro posterior",equipment:"Máquina",sets:3,reps:"12-15",seed:25,inc:3,tech:"Pecho apoyado. Abre los brazos sin encoger el cuello.",alts:["face_pull"]},
 {id:"biceps",name:"Curl de bíceps",group:"Bíceps",equipment:"Mancuernas/Polea",sets:3,reps:"10-12",seed:10,inc:1,tech:"Codos estables. Flexiona sin balanceo y baja lentamente.",alts:["biceps_machine","hammer_curl"]},
 {id:"biceps_machine",name:"Curl de bíceps en máquina",group:"Bíceps",equipment:"Máquina",sets:3,reps:"10-12",seed:20,inc:2.5,tech:"Apoya bien los brazos y evita despegar los codos.",alts:["biceps"]},
 {id:"hammer_curl",name:"Curl martillo",group:"Bíceps/Antebrazo",equipment:"Mancuernas",sets:3,reps:"10-12",seed:8,inc:1,tech:"Mantén las muñecas neutras y evita balancear el tronco.",alts:["biceps"]},
 {id:"triceps",name:"Tríceps en polea",group:"Tríceps",equipment:"Polea",sets:3,reps:"10-12",seed:15.9,inc:2.3,tech:"Codos pegados al cuerpo. Extiende sin mover el tronco.",alts:["triceps_machine"]},
 {id:"triceps_machine",name:"Tríceps en máquina",group:"Tríceps",equipment:"Máquina",sets:3,reps:"10-12",seed:20,inc:2.5,tech:"Mantén el tronco estable y extiende con control.",alts:["triceps"]},
 {id:"wrist_curl",name:"Flexión de muñeca",group:"Antebrazo",equipment:"Mancuernas/Polea",sets:2,reps:"12-15",seed:5,inc:1,tech:"Apoya el antebrazo y mueve únicamente la muñeca con una carga ligera y controlada.",alts:["reverse_wrist"]},
 {id:"reverse_wrist",name:"Extensión de muñeca",group:"Antebrazo",equipment:"Mancuernas/Polea",sets:2,reps:"12-15",seed:4,inc:1,tech:"Carga ligera, antebrazo apoyado y movimiento corto y controlado de la muñeca.",alts:["wrist_curl"]},
 {id:"core_crunch",name:"Crunch abdominal en máquina",group:"Core",equipment:"Máquina",sets:3,reps:"12-15",seed:20,inc:2.5,tech:"Flexiona el tronco de forma cómoda. Exhala al cerrar y vuelve con control.",alts:["core_rotation"]},
 {id:"core_rotation",name:"Rotación de torso en máquina",group:"Core",equipment:"Máquina",sets:3,reps:"10-12/lado",seed:20,inc:2.5,tech:"Pelvis estable. Gira dentro de un rango cómodo y controlado.",alts:["core_crunch"]},
 {id:"back_extension",name:"Extensión lumbar en máquina",group:"Core posterior",equipment:"Máquina",sets:2,reps:"12-15",seed:20,inc:2.5,tech:"Recorrido cómodo y controlado. Evita hiperextender al final.",alts:["core_crunch"]},
 {id:"ab_machine_alt",name:"Abdominal vertical en máquina",group:"Core",equipment:"Máquina",sets:3,reps:"12-15",seed:20,inc:2.5,tech:"Mantén la pelvis estable y controla tanto la flexión como la vuelta.",alts:["core_crunch"]},
 {id:"neck_mobility",name:"Movilidad cervical suave",group:"Cuello",equipment:"Sin carga",sets:2,reps:"5/lado",seed:0,inc:0,tech:"Movimientos suaves y sin carga. Gira e inclina la cabeza solo dentro de un rango cómodo y detente si aparece dolor.",alts:[]}
];

const TRAINING_DAYS=[
 {key:"POWER",title:"Full Body POWER",subtitle:"Fuerza general y técnica",ex:["leg_press","leg_curl","lat_pulldown","chest_press","chest_row","shoulder_press","shrug_machine","biceps","triceps","wrist_curl","core_crunch","core_rotation","neck_mobility"],cardio:{mode:"Progresivo",minutes:25}},
 {key:"PULL",title:"Full Body PULL",subtitle:"Espalda, cadena posterior y control",ex:["rdl_machine","glute_machine","chest_row","neutral_pulldown","incline_press","face_pull","rear_delt","hammer_curl","triceps_machine","reverse_wrist","core_rotation","back_extension","neck_mobility"],cardio:{mode:"Moderado",minutes:30}},
 {key:"ENGINE",title:"Full Body ENGINE",subtitle:"Trabajo global y capacidad cardiovascular",ex:["hack_squat","leg_extension","abduction","lat_pulldown","pec_deck","low_row","lateral_raise","biceps_machine","triceps","wrist_curl","core_crunch","ab_machine_alt","neck_mobility"],cardio:{mode:"Intervalos sin impacto",minutes:30}},
 {key:"PUSH",title:"Full Body PUSH",subtitle:"Pecho, hombro, piernas y estabilidad",ex:["leg_press","adduction","leg_curl","incline_press","shoulder_press","pec_deck","chest_row","lateral_raise","triceps_machine","hammer_curl","core_rotation","core_crunch","neck_mobility"],cardio:{mode:"Progresivo",minutes:25}},
 {key:"COMPLETE",title:"Full Body COMPLETE",subtitle:"Cobertura completa y control de marcas",ex:["hack_squat","calf","glute_machine","lat_pulldown","chest_press","low_row","face_pull","shrug_machine","biceps","triceps","reverse_wrist","core_crunch","core_rotation","back_extension","neck_mobility"],cardio:{mode:"Moderado",minutes:30}}
];

const SALADS=[
 ["Mediterránea","Tomate, pepino, pimiento, cebolla y hojas verdes","AOVE + limón + orégano"],
 ["Tomate y queso fresco","Tomate, queso fresco, cebolla y hojas verdes","AOVE + vinagre"],
 ["Pimientos asados y atún","Pimientos asados, atún, cebolla y tomate","AOVE + vinagre"],
 ["Aguacate y tomate","Tomate, aguacate, pepino y hojas verdes","Limón + AOVE"],
 ["Garbanzos mediterráneos","Garbanzos, tomate, pepino, pimiento y cebolla","Limón + comino + AOVE"],
 ["Judías y verduras","Judías cocidas, tomate, pimiento y cebolla","Vinagre + AOVE"],
 ["Pollo y vegetales","Pollo, hojas verdes, tomate, pepino y zanahoria","Limón + mostaza suave + AOVE"],
 ["Pasta fría equilibrada","Pasta, tomate, pepino, pimiento, atún y hojas verdes","AOVE + limón"]
];

const RECIPES=[
 {id:"b1",type:"breakfast",name:"Tostada integral con pavo, tomate y AOVE",cat:"desayuno",protein:"pavo",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Pavo",70,"g","listo"],["Tomate",120,"g","crudo"],["AOVE",5,"g","medido"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan hasta que quede ligeramente crujiente.","Ralla o corta el tomate y repártelo sobre la tostada.","Añade el pavo y termina con el AOVE medido.","Acompaña con el café habitual."],storage:"Preparar al momento.",reheat:"No aplica."},
 {id:"b2",type:"breakfast",name:"Tostada integral con queso fresco, tomate y fruta",cat:"desayuno",protein:"queso",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Queso fresco",70,"g","listo"],["Tomate",100,"g","crudo"],["Fruta",1,"pieza","entera"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Añade tomate y queso fresco.","Toma la fruta aparte y acompaña con café."],storage:"Preparar al momento.",reheat:"No aplica."},
 {id:"b3",type:"breakfast",name:"Tostada integral con aguacate y pavo",cat:"desayuno",protein:"pavo",carb:"pan",time:5,prep:"Al momento",items:[["Pan integral",60,"g","listo"],["Aguacate",35,"g","listo"],["Pavo",60,"g","listo"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Machaca el aguacate y extiéndelo.","Añade el pavo y acompaña con café."],storage:"Preparar al momento para que el aguacate no se oxide.",reheat:"No aplica."},
 {id:"b4",type:"breakfast",name:"Tostada integral con queso fresco y pimientos asados",cat:"desayuno",protein:"queso",carb:"pan",time:5,prep:"Pimientos preparados previamente",items:[["Pan integral",60,"g","listo"],["Queso fresco",70,"g","listo"],["Pimientos asados",80,"g","cocinados"],["Café",1,"taza","habitual"]],steps:["Tuesta el pan.","Coloca queso fresco y pimientos asados escurridos.","Acompaña con café."],storage:"Los pimientos pueden dejarse preparados en frío.",reheat:"No aplica."},

 {id:"m1",type:"midmorning",name:"Fruta y yogur natural",cat:"tentempié",protein:"lácteo",carb:"fruta",time:2,prep:"Directo",items:[["Fruta",1,"pieza","entera"],["Yogur natural",1,"unidad","listo"]],steps:["Lleva ambos por separado y tómalos directamente."],storage:"Mantén el yogur refrigerado.",reheat:"No."},
 {id:"m2",type:"midmorning",name:"Queso fresco y fruta",cat:"tentempié",protein:"queso",carb:"fruta",time:2,prep:"Directo",items:[["Queso fresco",60,"g","listo"],["Fruta",1,"pieza","entera"]],steps:["Porciona el queso y acompaña con una fruta."],storage:"Conservar en frío.",reheat:"No."},
 {id:"m3",type:"midmorning",name:"Pavo y pequeña tostada",cat:"tentempié",protein:"pavo",carb:"pan",time:3,prep:"Directo",items:[["Pavo",60,"g","listo"],["Pan integral",30,"g","listo"]],steps:["Prepara la ración y llévala separada para que el pan mantenga textura."],storage:"Mantener el pavo en frío.",reheat:"No."},

 {id:"s1",type:"snack",name:"Yogur natural con kiwi",cat:"tentempié",protein:"lácteo",carb:"fruta",time:2,prep:"Directo",items:[["Yogur natural",1,"unidad","listo"],["Kiwi",1,"pieza","entero"]],steps:["Pela el kiwi justo antes de comer y mézclalo con el yogur si quieres."],storage:"Yogur en frío.",reheat:"No."},
 {id:"s2",type:"snack",name:"Queso fresco con tomate",cat:"tentempié",protein:"queso",carb:"verdura",time:3,prep:"Directo",items:[["Queso fresco",60,"g","listo"],["Tomate",150,"g","crudo"]],steps:["Corta tomate y queso y sirve juntos."],storage:"Conservar en frío.",reheat:"No."},
 {id:"s3",type:"snack",name:"Fruta y café",cat:"tentempié",protein:"otro",carb:"fruta",time:2,prep:"Directo",items:[["Fruta",1,"pieza","entera"],["Café",1,"taza","habitual"]],steps:["Toma la fruta con el café."],storage:"No requiere.",reheat:"No."},

 {id:"l1",type:"lunch",name:"Pasta mediterránea con pollo",cat:"pasta",protein:"pollo",carb:"pasta",time:20,prep:"Dejar preparada; solo calentar",items:[["Pasta integral",70,"g","crudo"],["Pollo",180,"g","crudo"],["Tomate",120,"g","cocinado"],["Pimientos",120,"g","cocinados"],["AOVE",10,"g","medido"]],steps:["Cuece la pasta hasta que quede al dente y escúrrela.","Corta el pollo en tiras y cocínalo en sartén caliente hasta que esté completamente hecho.","Añade pimientos y tomate y cocina 3-4 minutos.","Mezcla la pasta con el salteado y reparte en recipiente."],storage:"2-3 días en frío.",reheat:"Calienta suavemente la ración hasta que esté bien caliente."},
 {id:"l2",type:"lunch",name:"Arroz tres delicias saludable",cat:"arroz",protein:"huevo",carb:"arroz",time:22,prep:"Preparar la noche anterior",items:[["Arroz",65,"g","crudo"],["Huevo",1,"unidad","cocinado"],["Gambas",100,"g","cocinadas"],["Guisantes",60,"g","cocinados"],["Zanahoria",80,"g","cocinada"]],steps:["Cuece el arroz según el envase hasta que quede suelto. Enfríalo pronto si vas a guardarlo.","Corta la zanahoria en dados pequeños y cocina junto con los guisantes hasta que estén tiernos.","Calienta una sartén amplia. Saltea las verduras 5-7 minutos.","Aparta las verduras a un lado, añade el huevo batido y remueve hasta que quede completamente cuajado.","Añade las gambas y cocina hasta que estén hechas.","Incorpora el arroz y saltea 2-3 minutos para mezclar y calentar.","Termina con ajo, perejil u otras especias suaves."],storage:"Enfriar pronto y conservar refrigerado en recipiente cerrado.",reheat:"Recalentar completamente una sola vez."},
 {id:"l3",type:"lunch",name:"Lomo magro con pimientos y arroz",cat:"carne",protein:"cerdo",carb:"arroz",time:20,prep:"Dejar preparado; solo calentar",items:[["Lomo magro",180,"g","crudo"],["Arroz integral",60,"g","crudo"],["Pimientos asados",250,"g","cocinados"],["AOVE",10,"g","medido"]],steps:["Cuece el arroz y reserva.","Cocina el lomo en plancha caliente hasta que esté completamente hecho.","Calienta los pimientos asados y mezcla con el arroz.","Guarda cada componente en la misma ración o separado si prefieres mantener textura."],storage:"2-3 días en frío.",reheat:"Calentar sin resecar el lomo."},
 {id:"l4",type:"lunch",name:"Filete de ternera con patata y verduras",cat:"carne",protein:"ternera",carb:"patata",time:20,prep:"Guarnición lista; carne rápida",items:[["Ternera magra",180,"g","crudo"],["Patata",220,"g","cocida"],["Verduras",250,"g","cocinadas"]],steps:["Cuece o asa la patata hasta que esté tierna.","Saltea o asa las verduras y déjalas preparadas.","Calienta bien una plancha y cocina la ternera por ambos lados hasta el punto seguro y deseado.","Monta la ración con patata y verduras."],storage:"Guarnición 2 días en frío; carne mejor próxima al consumo.",reheat:"Recalienta la guarnición y la carne con suavidad."},
 {id:"l5",type:"lunch",name:"Garbanzos con espinacas y pollo",cat:"legumbre",protein:"pollo",carb:"legumbre",time:18,prep:"Ideal para preparar antes",items:[["Garbanzos",200,"g","cocidos"],["Espinacas",250,"g","cocinadas"],["Pollo",120,"g","crudo"],["AOVE",10,"g","medido"]],steps:["Cocina el pollo en dados hasta que esté completamente hecho.","Saltea las espinacas hasta reducir su volumen.","Añade garbanzos escurridos y calienta 3-4 minutos.","Incorpora el pollo, mezcla y divide en raciones."],storage:"2-3 días en frío.",reheat:"Calienta hasta que esté bien caliente."},
 {id:"l6",type:"lunch",name:"Lentejas con verduras y pavo",cat:"legumbre",protein:"pavo",carb:"legumbre",time:20,prep:"Preparar la noche anterior",items:[["Lentejas",200,"g","cocidas"],["Pavo",120,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Corta y cocina las verduras hasta que estén tiernas.","Cocina el pavo en dados o tiras hasta que esté completamente hecho.","Añade las lentejas cocidas y calienta 4-5 minutos.","Incorpora el pavo y mezcla."],storage:"2-3 días en frío.",reheat:"Recalentar completamente."},
 {id:"l7",type:"lunch",name:"Ensaladilla equilibrada con atún",cat:"ensaladilla",protein:"atún",carb:"patata",time:22,prep:"Dejar hecha en frío",items:[["Patata",220,"g","cocida"],["Atún",140,"g","escurrido"],["Zanahoria",80,"g","cocida"],["Guisantes",50,"g","cocidos"],["Yogur natural",40,"g","salsa ligera"]],steps:["Cuece patata y zanahoria hasta que estén tiernas y deja enfriar.","Cuece los guisantes si lo necesitan y escurre.","Corta patata y zanahoria, añade atún y guisantes.","Mezcla el yogur con limón o especias suaves y utiliza como salsa ligera.","Refrigera antes de servir."],storage:"1-2 días en frío.",reheat:"No recalentar."},
 {id:"l8",type:"lunch",name:"Arroz con langostinos y verduras",cat:"arroz",protein:"langostinos",carb:"arroz",time:20,prep:"Preparar antes; solo calentar",items:[["Arroz",65,"g","crudo"],["Langostinos",160,"g","cocinados"],["Verduras",250,"g","cocinadas"]],steps:["Cuece el arroz y reserva.","Saltea las verduras empezando por las más duras.","Añade los langostinos al final y cocínalos hasta que estén hechos.","Incorpora el arroz y mezcla 2-3 minutos."],storage:"1-2 días en frío.",reheat:"Calienta una sola vez hasta que esté bien caliente."},
 {id:"l9",type:"lunch",name:"Mejillones con arroz y verduras",cat:"marisco",protein:"mejillones",carb:"arroz",time:20,prep:"Base preparada; mejillones próximos al consumo",items:[["Mejillones",180,"g","comestibles"],["Arroz",60,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Cuece el arroz y deja preparado.","Cocina o asa las verduras.","Limpia y cocina los mejillones según su formato hasta que estén hechos.","Monta el plato añadiendo los mejillones al final."],storage:"Base 2 días; mejillones consumir pronto.",reheat:"Recalienta la base y añade el marisco al final."},
 {id:"l10",type:"lunch",name:"Tortilla de patata ligera con ensalada",cat:"huevo",protein:"huevo",carb:"patata",time:25,prep:"Puede dejarse hecha",items:[["Huevos",2,"unidades","cocinados"],["Patata",200,"g","cocida"],["Cebolla",60,"g","cocinada"],["Ensalada",250,"g","cruda"]],steps:["Cuece o cocina la patata hasta que esté tierna y corta en láminas.","Cocina la cebolla lentamente hasta que esté tierna.","Bate los huevos, mezcla con patata y cebolla y cuaja la tortilla completamente por ambos lados.","Sirve con la ensalada sin aliñar hasta el momento de comer."],storage:"1-2 días en frío.",reheat:"Puede tomarse fría o templada."},
 {id:"l11",type:"lunch",name:"Salteado de espárragos, pollo y patata",cat:"verdura",protein:"pollo",carb:"patata",time:20,prep:"Preparar la noche anterior",items:[["Espárragos",250,"g","cocinados"],["Pollo",170,"g","crudo"],["Patata",200,"g","cocida"]],steps:["Cuece o asa la patata.","Trocea los espárragos y saltéalos hasta que estén tiernos.","Cocina el pollo en tiras hasta que esté completamente hecho.","Mezcla el pollo con los espárragos y acompaña con patata."],storage:"2 días en frío.",reheat:"Calentar suavemente."},
 {id:"l12",type:"lunch",name:"Paella sencilla de pollo y verduras",cat:"arroz",protein:"pollo",carb:"arroz",time:28,prep:"Batch cooking",items:[["Arroz",65,"g","crudo"],["Pollo",160,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Corta el pollo y cocina hasta que empiece a dorarse.","Añade verduras y cocina varios minutos.","Incorpora el arroz y el líquido necesario según el tipo de arroz.","Cocina hasta que el arroz esté hecho y el pollo completamente cocinado.","Deja reposar unos minutos antes de repartir."],storage:"Enfriar pronto y conservar en frío.",reheat:"Recalentar una sola vez."},
 {id:"l13",type:"lunch",name:"Macarrones con tomate y ternera magra",cat:"pasta",protein:"ternera",carb:"pasta",time:22,prep:"Preparar antes",items:[["Pasta",70,"g","cruda"],["Ternera magra",150,"g","cruda"],["Tomate",150,"g","cocinado"]],steps:["Cuece los macarrones al dente y escurre.","Cocina la ternera desmenuzada o en tiras hasta que esté completamente hecha.","Añade tomate y cocina 3-4 minutos.","Mezcla con la pasta y divide en raciones."],storage:"2 días en frío.",reheat:"Calentar suavemente."},
 {id:"l14",type:"lunch",name:"Sepia con arroz y verduras",cat:"marisco",protein:"sepia",carb:"arroz",time:20,prep:"Arroz listo; sepia próxima al consumo",items:[["Sepia",180,"g","cocinada"],["Arroz",60,"g","crudo"],["Verduras",250,"g","cocinadas"]],steps:["Cuece el arroz y reserva.","Saltea las verduras.","Seca bien la sepia y cocínala en plancha caliente hasta que esté completamente hecha.","Sirve la sepia con arroz y verduras."],storage:"Base 2 días; sepia mejor próxima al consumo.",reheat:"Calienta base y añade sepia al final."},

 {id:"d1",type:"dinner",name:"Merluza a la plancha con ensalada",cat:"pescado",protein:"merluza",carb:"verdura",time:14,prep:"Cena ligera al momento",items:[["Merluza",200,"g","crudo"],["Ensalada",300,"g","cruda"],["AOVE",10,"g","medido"]],steps:["Seca la merluza y deja que pierda el frío unos minutos.","Calienta una plancha con una pequeña cantidad de aceite.","Cocina por ambos lados hasta que esté hecha sin resecar.","Monta la ensalada y aliña al servir."],storage:"Mejor al momento.",reheat:"Evitar."},
 {id:"d2",type:"dinner",name:"Salmón con espárragos",cat:"pescado",protein:"salmón",carb:"verdura",time:15,prep:"Cena ligera",items:[["Salmón",180,"g","crudo"],["Espárragos",250,"g","cocinados"]],steps:["Seca el salmón.","Saltea los espárragos hasta que estén tiernos.","Calienta una plancha y cocina el salmón controlando el punto.","Sirve junto con los espárragos."],storage:"Mejor al momento.",reheat:"Evitar resecar."},
 {id:"d3",type:"dinner",name:"Tortilla francesa con tomate y queso fresco",cat:"huevo",protein:"huevo",carb:"verdura",time:10,prep:"Rápida",items:[["Huevos",2,"unidades","cocinados"],["Tomate",200,"g","crudo"],["Queso fresco",50,"g","listo"]],steps:["Bate los huevos.","Calienta una sartén antiadherente y cuaja completamente la tortilla.","Corta tomate y queso fresco y sirve como acompañamiento."],storage:"Mejor al momento.",reheat:"No necesario."},
 {id:"d4",type:"dinner",name:"Mejillones al vapor con ensalada",cat:"marisco",protein:"mejillones",carb:"verdura",time:14,prep:"Ligera",items:[["Mejillones",200,"g","comestibles"],["Ensalada",300,"g","cruda"]],steps:["Limpia los mejillones si son frescos.","Cocina al vapor hasta que estén hechos, descartando los que no se abran si corresponde.","Monta la ensalada aparte y aliña al servir."],storage:"Consumir al momento.",reheat:"No."},
 {id:"d5",type:"dinner",name:"Langostinos a la plancha con verduras",cat:"marisco",protein:"langostinos",carb:"verdura",time:14,prep:"Ligera",items:[["Langostinos",180,"g","cocinados"],["Verduras",300,"g","cocinadas"]],steps:["Cocina primero las verduras hasta que estén tiernas.","Calienta la plancha y cocina los langostinos hasta que estén completamente hechos.","Sirve juntos y condimenta al final."],storage:"Mejor al momento.",reheat:"Evitar recalentados repetidos."},
 {id:"d6",type:"dinner",name:"Atún con tomate, aguacate y queso fresco",cat:"pescado",protein:"atún",carb:"verdura",time:8,prep:"Montar",items:[["Atún",150,"g","escurrido"],["Tomate",220,"g","crudo"],["Aguacate",40,"g","listo"],["Queso fresco",50,"g","listo"]],steps:["Escurre bien el atún.","Corta tomate, aguacate y queso.","Monta el plato y aliña justo antes de comer."],storage:"Preparar cerca del consumo.",reheat:"No."},
 {id:"d7",type:"dinner",name:"Pollo con verduras; reserva para mañana",cat:"pollo",protein:"pollo",carb:"verdura",time:18,prep:"Cena + preparación del día siguiente",items:[["Pollo",300,"g","crudo"],["Verduras",300,"g","cocinadas"]],steps:["Corta el pollo en piezas uniformes.","Cocina una ración amplia hasta que esté completamente hecha.","Saltea las verduras.","Cena una parte con verduras y guarda una porción de pollo para la comida del día siguiente."],storage:"Reserva la porción del día siguiente en frío.",reheat:"Calentar completamente al día siguiente."},
 {id:"d8",type:"dinner",name:"Salteado de espárragos con huevo y pavo",cat:"huevo",protein:"huevo",carb:"verdura",time:12,prep:"Rápida",items:[["Espárragos",250,"g","cocinados"],["Huevo",1,"unidad","cocinado"],["Pavo",80,"g","listo"]],steps:["Trocea y saltea los espárragos.","Añade el pavo para calentarlo.","Incorpora el huevo y cocina hasta que quede completamente cuajado."],storage:"Mejor al momento.",reheat:"No."},
 {id:"d9",type:"dinner",name:"Ensalada completa con queso fresco y pavo",cat:"ensalada",protein:"queso",carb:"verdura",time:8,prep:"Montar",items:[["Ensalada variada",300,"g","cruda"],["Queso fresco",70,"g","listo"],["Pavo",80,"g","listo"]],steps:["Lava y seca bien las hojas.","Añade queso fresco y pavo.","Aliña justo antes de servir."],storage:"Componentes separados hasta el consumo.",reheat:"No."},
 {id:"d10",type:"dinner",name:"Salpicón de marisco equilibrado",cat:"marisco",protein:"marisco",carb:"verdura",time:12,prep:"Fría",items:[["Marisco cocido",180,"g","cocinado"],["Tomate",150,"g","crudo"],["Pimiento",120,"g","crudo"],["Cebolla",40,"g","cruda"]],steps:["Corta tomate, pimiento y cebolla en dados pequeños.","Añade el marisco ya cocido y frío.","Mezcla, aliña y refrigera unos minutos antes de servir."],storage:"1 día en frío.",reheat:"No."},
 {id:"l15",type:"lunch",name:"Bacalao con patata, pimientos y tomate",cat:"pescado",protein:"bacalao",carb:"patata",time:25,prep:"Guarnición adelantable",items:[["Bacalao",180,"g","crudo"],["Patata",220,"g","cocida"],["Pimientos",180,"g","asados"],["Tomate",120,"g","cocinado"]],steps:["Cuece o asa la patata.","Deja pimientos y tomate preparados.","Cocina el bacalao hasta que esté completamente hecho sin resecarlo.","Monta con la guarnición."],storage:"Guarnición 2 días; pescado mejor próximo al consumo.",reheat:"Calienta la guarnición y añade el pescado al final."},
 {id:"l16",type:"lunch",name:"Pollo al limón con arroz y judías verdes",cat:"pollo",protein:"pollo",carb:"arroz",time:22,prep:"Preparar con antelación",items:[["Pollo",180,"g","crudo"],["Arroz",65,"g","crudo"],["Judías verdes",250,"g","cocinadas"]],steps:["Cuece el arroz.","Cocina las judías.","Cocina el pollo y termina con limón y especias.","Reparte en raciones."],storage:"2-3 días en frío.",reheat:"Calentar suavemente."},
 {id:"l17",type:"lunch",name:"Ternera salteada con verduras y arroz",cat:"carne",protein:"ternera",carb:"arroz",time:20,prep:"Rápida y preparable",items:[["Ternera magra",170,"g","cruda"],["Arroz",60,"g","crudo"],["Verduras variadas",280,"g","cocinadas"]],steps:["Cuece el arroz.","Saltea las verduras.","Añade la ternera y cocina completamente.","Sirve con el arroz."],storage:"2 días en frío.",reheat:"Calentar sin resecar."},
 {id:"l18",type:"lunch",name:"Pavo con couscous integral y verduras",cat:"cereal",protein:"pavo",carb:"couscous",time:18,prep:"Muy práctico",items:[["Pavo",180,"g","crudo"],["Couscous integral",65,"g","seco"],["Verduras",260,"g","cocinadas"]],steps:["Hidrata el couscous.","Cocina las verduras.","Cocina el pavo completamente.","Mezcla y guarda por ración."],storage:"2-3 días en frío.",reheat:"Calentar suavemente."},
 {id:"l19",type:"lunch",name:"Ensalada templada de garbanzos, atún y pimientos",cat:"legumbre",protein:"atún",carb:"legumbre",time:12,prep:"Muy rápida",items:[["Garbanzos",200,"g","cocidos"],["Atún",140,"g","escurrido"],["Pimientos asados",180,"g","cocinados"],["Tomate",120,"g","crudo"]],steps:["Enjuaga los garbanzos.","Templa con los pimientos.","Añade atún y tomate.","Aliña al comer."],storage:"1-2 días.",reheat:"Solo templar la base."},
 {id:"l20",type:"lunch",name:"Arroz mediterráneo con pollo, alcachofa y pimiento",cat:"arroz",protein:"pollo",carb:"arroz",time:28,prep:"Batch cooking",items:[["Arroz",65,"g","crudo"],["Pollo",160,"g","crudo"],["Alcachofa",120,"g","cocinada"],["Pimiento",130,"g","cocinado"]],steps:["Cocina el pollo.","Añade verduras.","Incorpora arroz y líquido.","Cocina hasta que todo esté hecho."],storage:"Enfriar pronto.",reheat:"Una sola vez."},
 {id:"l21",type:"lunch",name:"Pasta con atún, tomate y espinacas",cat:"pasta",protein:"atún",carb:"pasta",time:18,prep:"Preparar antes",items:[["Pasta integral",70,"g","cruda"],["Atún",140,"g","escurrido"],["Tomate",140,"g","cocinado"],["Espinacas",180,"g","cocinadas"]],steps:["Cuece la pasta.","Saltea espinacas y tomate.","Añade el atún.","Mezcla."],storage:"2 días.",reheat:"Suave."},
 {id:"l22",type:"lunch",name:"Merluza con arroz y pisto",cat:"pescado",protein:"merluza",carb:"arroz",time:22,prep:"Pisto y arroz adelantables",items:[["Merluza",190,"g","cruda"],["Arroz",60,"g","crudo"],["Pisto",280,"g","cocinado"]],steps:["Cuece el arroz.","Prepara el pisto.","Cocina la merluza cerca del consumo.","Sirve junto."],storage:"Base 2 días.",reheat:"Calienta base y añade pescado."},
 {id:"l23",type:"lunch",name:"Tortilla de verduras con patata cocida y ensalada",cat:"huevo",protein:"huevo",carb:"patata",time:20,prep:"Puede dejarse hecha",items:[["Huevos",2,"unidades","cocinados"],["Verduras",180,"g","cocinadas"],["Patata",180,"g","cocida"],["Ensalada",220,"g","cruda"]],steps:["Cocina verduras.","Cuaja la tortilla completamente.","Acompaña con patata y ensalada."],storage:"1-2 días.",reheat:"Opcional."},
 {id:"l24",type:"lunch",name:"Lomo magro con ensalada de arroz y tomate",cat:"carne",protein:"cerdo",carb:"arroz",time:20,prep:"Muy práctico",items:[["Lomo magro",180,"g","crudo"],["Arroz",60,"g","crudo"],["Tomate",180,"g","crudo"],["Pepino",100,"g","crudo"]],steps:["Cuece y enfría el arroz.","Corta tomate y pepino.","Cocina el lomo.","Monta la ensalada."],storage:"2 días.",reheat:"Solo lomo."},
 {id:"l25",type:"lunch",name:"Alubias con verduras y pollo",cat:"legumbre",protein:"pollo",carb:"legumbre",time:18,prep:"Preparar antes",items:[["Alubias",200,"g","cocidas"],["Pollo",130,"g","crudo"],["Verduras",260,"g","cocinadas"]],steps:["Cocina verduras.","Cocina pollo.","Añade alubias.","Mezcla y reparte."],storage:"2-3 días.",reheat:"Completo."},
 {id:"l26",type:"lunch",name:"Fajita integral de pollo y verduras",cat:"wrap",protein:"pollo",carb:"tortilla",time:18,prep:"Relleno adelantable",items:[["Tortilla integral",1,"unidad","lista"],["Pollo",170,"g","crudo"],["Pimientos",160,"g","cocinados"],["Cebolla",60,"g","cocinada"],["Tomate",100,"g","crudo"]],steps:["Cocina pollo, pimientos y cebolla.","Guarda el relleno.","Calienta tortilla al comer.","Añade tomate y enrolla."],storage:"Relleno 2 días.",reheat:"Relleno y tortilla."},
 {id:"l27",type:"lunch",name:"Salmón con patata y judías verdes",cat:"pescado",protein:"salmón",carb:"patata",time:22,prep:"Guarnición adelantable",items:[["Salmón",180,"g","crudo"],["Patata",220,"g","cocida"],["Judías verdes",250,"g","cocinadas"]],steps:["Prepara patata y judías.","Cocina salmón cerca del consumo.","Sirve junto."],storage:"Guarnición 2 días.",reheat:"Guarnición separada."},
 {id:"l28",type:"lunch",name:"Arroz con sepia, guisantes y pimiento",cat:"arroz",protein:"sepia",carb:"arroz",time:25,prep:"Preparar la noche anterior",items:[["Arroz",65,"g","crudo"],["Sepia",170,"g","cocinada"],["Guisantes",60,"g","cocinados"],["Pimiento",120,"g","cocinado"]],steps:["Cuece arroz.","Saltea verduras.","Cocina sepia.","Mezcla."],storage:"1-2 días.",reheat:"Una sola vez."},
 {id:"d11",type:"dinner",name:"Tortilla de calabacín con tomate",cat:"huevo",protein:"huevo",carb:"verdura",time:12,prep:"Ligera",items:[["Huevos",2,"unidades","cocinados"],["Calabacín",180,"g","cocinado"],["Tomate",200,"g","crudo"]],steps:["Saltea calabacín.","Añade huevos y cuaja.","Sirve con tomate."],storage:"Al momento.",reheat:"No."},
 {id:"d12",type:"dinner",name:"Ensalada de pollo, aguacate y tomate",cat:"ensalada",protein:"pollo",carb:"verdura",time:10,prep:"Pollo adelantable",items:[["Pollo",160,"g","cocinado"],["Aguacate",40,"g","listo"],["Tomate",180,"g","crudo"],["Hojas verdes",120,"g","crudas"]],steps:["Deja pollo listo.","Lava hojas.","Corta tomate y aguacate.","Monta y aliña."],storage:"Separado.",reheat:"No."},
 {id:"d13",type:"dinner",name:"Bacalao con pimientos asados y ensalada",cat:"pescado",protein:"bacalao",carb:"verdura",time:15,prep:"Ligera",items:[["Bacalao",190,"g","crudo"],["Pimientos asados",180,"g","cocinados"],["Ensalada",220,"g","cruda"]],steps:["Calienta pimientos.","Cocina bacalao.","Sirve con ensalada."],storage:"Al momento.",reheat:"Evitar resecar."},
 {id:"d14",type:"dinner",name:"Revuelto de huevo, espinacas y langostinos",cat:"huevo",protein:"huevo",carb:"verdura",time:12,prep:"Rápida",items:[["Huevos",2,"unidades","cocinados"],["Espinacas",220,"g","cocinadas"],["Langostinos",100,"g","cocinados"]],steps:["Saltea espinacas.","Añade langostinos.","Cuaja huevos completamente."],storage:"Al momento.",reheat:"No."},
 {id:"d15",type:"dinner",name:"Queso fresco, pavo, tomate y pimientos asados",cat:"fría",protein:"pavo",carb:"verdura",time:7,prep:"Montar",items:[["Queso fresco",80,"g","listo"],["Pavo",100,"g","listo"],["Tomate",180,"g","crudo"],["Pimientos asados",150,"g","cocinados"]],steps:["Escurre pimientos.","Corta tomate y queso.","Monta y aliña."],storage:"1 día.",reheat:"No."},
 {id:"d16",type:"dinner",name:"Merluza con verduras salteadas",cat:"pescado",protein:"merluza",carb:"verdura",time:15,prep:"Ligera",items:[["Merluza",200,"g","cruda"],["Verduras",300,"g","cocinadas"]],steps:["Saltea verduras.","Cocina merluza.","Sirve."],storage:"Al momento.",reheat:"Evitar."},
 {id:"d17",type:"dinner",name:"Ensalada de garbanzos, tomate y queso fresco",cat:"ensalada",protein:"queso",carb:"legumbre",time:10,prep:"Montar",items:[["Garbanzos",120,"g","cocidos"],["Queso fresco",70,"g","listo"],["Tomate",180,"g","crudo"],["Pepino",100,"g","crudo"]],steps:["Enjuaga garbanzos.","Corta verduras y queso.","Mezcla y aliña."],storage:"1 día.",reheat:"No."},
 {id:"d18",type:"dinner",name:"Pollo a la plancha con ensalada mediterránea",cat:"pollo",protein:"pollo",carb:"verdura",time:15,prep:"Pollo adelantable",items:[["Pollo",180,"g","crudo"],["Ensalada mediterránea",300,"g","cruda"]],steps:["Cocina pollo.","Prepara ensalada.","Aliña al servir."],storage:"Pollo 2 días.",reheat:"Solo pollo."}
];

function baseState(){
 return {
  schema:SCHEMA_VERSION,
  plans:[],ratings:{},mealDone:{},pantry:[],shopping:[],trainingSessions:[],
  workoutDraft:null,measurements:[],customExercises:[],weeklyReviews:[],
  settings:{flexMealDay:"Sábado",trainingDays:[1,2,3,4,5],learningSeen:[]},
  importedLegacy:false
 };
}
function readJSON(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}}

function safeStorageSet(key,value){
 try{
  localStorage.setItem(key,value);
  return true;
 }catch(err){
  console.warn("Proyecto85: no se pudo guardar",key,err);
  try{localStorage.removeItem(PREFIX+"legacyBackup_v4")}catch(_){}
  try{
   localStorage.setItem(key,value);
   return true;
  }catch(err2){
   console.warn("Proyecto85: almacenamiento lleno",err2);
   toast?.("No se pudo guardar: almacenamiento del navegador lleno");
   return false;
  }
 }
}

function state(){
 const s=readJSON(STATE_KEY,null);
 if(!s)return baseState();
 return {...baseState(),...s,settings:{...baseState().settings,...(s.settings||{})}};
}
function saveState(s){s.schema=SCHEMA_VERSION;return safeStorageSet(STATE_KEY,JSON.stringify(s))}
function customRecipes(){return readJSON(CUSTOM_RECIPE_KEY,[])}
function saveCustomRecipes(a){return safeStorageSet(CUSTOM_RECIPE_KEY,JSON.stringify(a))}
function allRecipes(){return [...RECIPES,...customRecipes()]}
function recipe(id){return allRecipes().find(r=>r.id===id)}
function recipesBy(type){return allRecipes().filter(r=>r.type===type)}
function exercise(id){return EXERCISES.find(x=>x.id===id)}
function toast(msg){
 const old=$(".toast");if(old)old.remove();
 const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);
 setTimeout(()=>el.remove(),1800);
}

function legacyBackup(){
 // Best-effort only: a backup must never prevent the app from starting.
 try{
  const key=PREFIX+"legacyBackup_v4";
  if(localStorage.getItem(key))return true;
  const snap={createdAt:new Date().toISOString(),items:{}};
  const keys=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)keys.push(k)}
  for(const k of keys){
   // Do not include this backup key itself; that caused recursive growth/quota errors.
   if(k!==key&&(k.startsWith("p85_")||k.startsWith("p85proclean_")||k.startsWith("p85pro2_"))) snap.items[k]=localStorage.getItem(k);
  }
  localStorage.setItem(key,JSON.stringify(snap));
  return true;
 }catch(err){console.warn("Legacy backup omitted; continuing safely",err);return false}
}
function normalizeMeasurement(m){
 if(!m||typeof m!=="object")return null;
 const pick=(...ks)=>{for(const k of ks)if(m[k]!==undefined&&m[k]!==null&&m[k]!=="")return finite(m[k],null);return null};
 return {date:m.date||m.createdAt?.slice?.(0,10)||todayISO(),weight:pick("weight","peso"),waist:pick("waist","cintura"),hip:pick("hip","cadera"),chest:pick("chest","pecho"),arm:pick("arm","brazo"),thigh:pick("thigh","muslo"),calf:pick("calf","gemelo"),bodyFat:pick("bodyFat","fat"),visceral:pick("visceral","visceralFat"),water:pick("water"),skeletalMuscle:pick("skeletalMuscle"),muscleMass:pick("muscleMass"),protein:pick("protein"),bmr:pick("bmr")};
}
function migrateLegacyOnce(){
 const s=state();
 if(s.importedLegacy)return;
 // Migration is non-blocking. Existing data stays untouched if a legacy step fails.
 legacyBackup();
 const measures=[...(readJSON("p85_measures",[])||[]),...(readJSON("p85proclean_measures",[])||[])];
 const converted=measures.map(normalizeMeasurement).filter(Boolean);
 if(converted.length&&!s.measurements.length)s.measurements=converted.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const sessions=readJSON("p85_sessions",[])||[];
 if(Array.isArray(sessions)&&sessions.length&&!s.trainingSessions.length){
  s.trainingSessions=sessions.map(x=>({id:x.id||uid(),date:x.date||todayISO(),legacy:true,...x}));
 }
 const pantry=readJSON("p85_pantry",[])||[]; if(Array.isArray(pantry)&&pantry.length&&!s.pantry.length)s.pantry=pantry;
 const ratings=readJSON("p85_mealRatings",[])||[];
 ratings.forEach(x=>{const id=x.mealId||x.recipeId||x.id,v=finite(x.score??x.rating,0);if(id&&v)s.ratings[id]=v});
 const custom=[...(readJSON("p85_customRecipes",[])||[]),...(readJSON("p85proclean_customRecipes",[])||[])];
 if(custom.length&&!customRecipes().length){try{saveCustomRecipes(custom)}catch(err){console.warn("Custom recipe migration skipped",err)}}
 s.importedLegacy=true;
 try{saveState(s)}catch(err){console.warn("Legacy state migration could not be persisted",err)}
}

function weekSeed(iso){return [...String(iso)].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),2166136261)}
function recentRecipeUse(start,weeks=3){
 const before=state().plans.filter(p=>p.weekStart<start).sort((a,b)=>b.weekStart.localeCompare(a.weekStart)).slice(0,weeks),count={};
 before.forEach((p,wi)=>Object.values(p.days||{}).forEach(ms=>Object.values(ms||{}).forEach(id=>count[id]=(count[id]||0)+(weeks-wi)*25)));
 return count;
}
function chooseRecipeForWeek(type,used,current,dayIndex,start,slotIndex){
 let pool=recipesBy(type);
 if(type==="lunch"){const desired=["legumbre","pescado","pasta","carne","arroz","legumbre","pescado"][dayIndex],spec=pool.filter(r=>r.cat===desired);if(spec.length)pool=spec}
 if(type==="dinner"){const allowed=["pescado","marisco","huevo","ensalada","pollo","fría"],light=pool.filter(r=>allowed.includes(r.cat));if(light.length)pool=light}
 const recent=recentRecipeUse(start,3),seed=weekSeed(start)+dayIndex*53+slotIndex*97,s=state();
 return [...pool].filter(r=>!current||r.id!==current.id).sort((a,b)=>{
  const sa=(recent[a.id]||0)+(used.includes(a.id)?120:0)-(s.ratings[a.id]||0)*2+((weekSeed(a.id)+seed)%29);
  const sb=(recent[b.id]||0)+(used.includes(b.id)?120:0)-(s.ratings[b.id]||0)*2+((weekSeed(b.id)+seed)%29);
  return sa-sb;
 })[0]||pool[0];
}
function generatePlan(start){
 const s=state(),plan={id:uid(),weekStart:start,weekEnd:plusDays(start,6),status:"draft",days:{},createdAt:new Date().toISOString(),flexMealDay:s.settings.flexMealDay},used=[],types=Object.keys(MEALS);
 DAYS.forEach((day,di)=>{plan.days[day]={};types.forEach((type,si)=>{const r=chooseRecipeForWeek(type,used,null,di,start,si);plan.days[day][type]=r.id;used.push(r.id)})});
 s.plans=s.plans.filter(p=>p.weekStart!==start);s.plans.unshift(plan);saveState(s);return plan;
}
function changePlanMeal(start,day,type){
 const s=state(),p=s.plans.find(x=>x.weekStart===start);if(!p)return;
 const current=recipe(p.days[day][type]),used=Object.values(p.days).flatMap(x=>Object.values(x)),next=chooseRecipeForWeek(type,used,current,DAYS.indexOf(day),start,Object.keys(MEALS).indexOf(type));
 if(!next)return toast("No hay alternativa disponible");
 p.days[day][type]=next.id;p.status="draft";saveState(s);NUTRITION_TAB="plan";PLANNER_TAB=start===monday(1)?"next":"current";render();toast("Plato cambiado y guardado");
}
function currentMeal(type){
 const p=state().plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed");
 return recipe(p?.days?.[dayName()]?.[type])||recipesBy(type)[0];
}
function smartTodayMeal(type){
 const s=state(),p=s.plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed");
 if(!p)return toast("Confirma primero la semana");
 const current=recipe(p.days[dayName()][type]),used=Object.values(p.days).flatMap(x=>Object.values(x));
 const next=chooseRecipe(type,used,current,DAYS.indexOf(dayName()));if(!next)return;
 p.days[dayName()][type]=next.id;saveState(s);
 const card=document.querySelector(`[data-meal-card="${type}"]`);
 if(card){const tmp=document.createElement("div");tmp.innerHTML=mealCard(type);card.replaceWith(tmp.firstElementChild)}else render();
 toast("Comida cambiada teniendo en cuenta la semana");
}
function buildShopping(plan){
 const s=state(),need={};
 Object.values(plan.days).forEach(meals=>Object.values(meals).forEach(id=>{
  const r=recipe(id);if(!r)return;
  r.items.forEach(([name,qty,unit])=>{if(!need[name])need[name]={name,qty:0,unit,bought:false};need[name].qty+=typeof qty==="number"?qty:1});
 }));
 const pantry=Object.fromEntries(s.pantry.map(x=>[String(x.name).toLowerCase(),finite(x.qty,0)]));
 s.shopping=Object.values(need).map(x=>({...x,buy:Math.max(0,x.qty-(pantry[x.name.toLowerCase()]||0))})).filter(x=>x.buy>0);
 saveState(s);
}

function detailedSteps(r){return ["Pesa todos los ingredientes y deja preparados los utensilios antes de empezar.",...(r.steps||[])]}
function advanceAdvice(r){
 if(r.type==="dinner"&&["pescado","marisco"].includes(r.cat))return "Deja limpios y porcionados los ingredientes; cocina la proteína cerca de la cena.";
 if(r.cat==="ensalada"||/aguacate/i.test(r.name))return "Lava y seca los componentes con antelación, pero añade tomate, aguacate y aliño al servir.";
 return r.prep+". Deja pesada y porcionada la ración con antelación.";
}

function latestExerciseEntries(id,limit=6){
 const rows=[];
 state().trainingSessions.forEach(sess=>{
  (sess.exercises||[]).forEach(e=>{if(e.exerciseId===id)rows.push({date:sess.date,sets:e.sets||[],effort:e.effort||null})});
 });
 return rows.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
}
function bestSet(id){
 let best=null;
 latestExerciseEntries(id,100).forEach(e=>e.sets.forEach(s=>{
  const w=finite(s.weight,0),r=finite(s.reps,0),score=w*Math.max(r,1);
  if(!best||score>best.score)best={weight:w,reps:r,score,date:e.date};
 }));
 return best;
}
function lastSetSummary(id){
 const last=latestExerciseEntries(id,1)[0];if(!last)return null;
 const complete=last.sets.filter(s=>s.done);
 if(!complete.length)return null;
 return {weight:Math.max(...complete.map(s=>finite(s.weight))),reps:Math.min(...complete.map(s=>finite(s.reps))),sets:complete.length,effort:last.effort};
}
function progressionFor(ex){
 const last=lastSetSummary(ex.id);
 if(!last)return {label:"INICIO",weight:ex.seed,why:"Usamos una carga inicial orientativa que podrás ajustar en la primera sesión."};
 const target=parseInt(ex.reps)||10;
 if(last.reps>=target+2&&finite(last.effort,7)<=8)return {label:"SUBIR",weight:Math.round((last.weight+ex.inc)*10)/10,why:"La última sesión completaste las repeticiones previstas con margen."};
 if(finite(last.effort,7)>=9||last.reps<target)return {label:"MANTENER",weight:last.weight,why:"Primero consolidamos técnica y repeticiones antes de aumentar la carga."};
 return {label:"MANTENER",weight:last.weight,why:"La progresión será completar más repeticiones con la misma carga."};
}
function trainingDayIndex(){
 const d=new Date().getDay();
 return d>=1&&d<=5?d-1:0;
}
function missionFor(day){
 const ex=day.ex.map(exercise).filter(Boolean);
 const candidate=ex.find(x=>lastSetSummary(x.id))||ex[0];
 if(!candidate)return "Completa la sesión con técnica controlada.";
 const p=progressionFor(candidate);
 return p.label==="SUBIR"?`Prueba la progresión propuesta en ${candidate.name} manteniendo buena técnica.`:`Mejora al menos una repetición total en ${candidate.name} sin perder técnica.`;
}
function newWorkoutDraft(dayIndex=trainingDayIndex()){
 const day=TRAINING_DAYS[dayIndex];
 return {id:uid(),date:todayISO(),dayIndex,dayKey:day.key,title:day.title,startedAt:new Date().toISOString(),exercises:day.ex.map(id=>{
  const ex=exercise(id),prog=progressionFor(ex);
  return {exerciseId:id,sets:Array.from({length:ex.sets},()=>({weight:prog.weight,reps:parseInt(ex.reps)||10,done:false})),effort:7};
 }),cardio:{mode:day.cardio.mode,minutes:day.cardio.minutes,intensity:5,distance:""},sessionEnergy:7,sessionDifficulty:7,notes:""};
}
function startWorkout(dayIndex=trainingDayIndex()){
 const s=state();s.workoutDraft=newWorkoutDraft(dayIndex);saveState(s);PAGE="training";TRAINING_TAB="session";render();toast("Entrenamiento iniciado");
}
function updateDraftSet(exIndex,setIndex,field,value){
 const s=state();if(!s.workoutDraft)return;
 const set=s.workoutDraft.exercises[exIndex].sets[setIndex];
 set[field]=field==="done"?!!value:finite(value,0);saveState(s);
}
function updateDraftField(path,value){
 const s=state();if(!s.workoutDraft)return;
 const [a,b]=path.split(".");
 if(b)s.workoutDraft[a][b]=value;else s.workoutDraft[a]=value;
 saveState(s);
}
function finishWorkout(){
 const s=state(),d=s.workoutDraft;if(!d)return;
 d.finishedAt=new Date().toISOString();
 const completed=d.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).length,0);
 const total=d.exercises.reduce((n,e)=>n+e.sets.length,0);
 d.completion=total?Math.round(completed/total*100):0;
 s.trainingSessions.unshift(d);s.workoutDraft=null;saveState(s);TRAINING_TAB="history";render();toast("Entrenamiento guardado");
}
function workoutVolume(sess){
 return (sess.exercises||[]).reduce((sum,e)=>sum+(e.sets||[]).filter(x=>x.done).reduce((a,x)=>a+finite(x.weight)*finite(x.reps),0),0);
}
function coachAfterSession(sess){
 const vol=workoutVolume(sess),prev=state().trainingSessions.find(x=>x.id!==sess.id&&x.dayKey===sess.dayKey);
 const prevVol=prev?workoutVolume(prev):0;
 const delta=prevVol?Math.round((vol-prevVol)/prevVol*100):null;
 const prs=[];
 (sess.exercises||[]).forEach(e=>{
  const ex=exercise(e.exerciseId),best=bestSet(e.exerciseId),maxNow=Math.max(0,...e.sets.filter(x=>x.done).map(x=>finite(x.weight)*finite(x.reps)));
  if(best&&maxNow>=best.score)prs.push(ex?.name);
 });
 return {volume:Math.round(vol),delta,prs:prs.slice(0,3),message:sess.completion>=90?"Sesión muy completa. Mantén el criterio de progresar solo cuando la técnica y las repeticiones estén consolidadas.":"La sesión queda registrada. La próxima propuesta mantendrá las cargas donde no se completó el trabajo previsto."};
}

function firstAndLastMeasurements(){
 const arr=[...state().measurements].filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));
 return {first:arr[0]||null,last:arr[arr.length-1]||null,prev:arr[arr.length-2]||null};
}
function metricDelta(first,last,key){
 if(!first||!last||first[key]==null||last[key]==null)return null;
 return Math.round((finite(last[key])-finite(first[key]))*10)/10;
}
function svgLine(values,width=600,height=150){
 const vals=values.filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number);
 if(vals.length<2)return `<div class="muted">Necesitamos al menos dos registros para dibujar la tendencia.</div>`;
 const min=Math.min(...vals),max=Math.max(...vals),span=Math.max(max-min,1);
 const pts=vals.map((v,i)=>`${20+i*(width-40)/(vals.length-1)},${height-20-(v-min)*(height-40)/span}`).join(" ");
 return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" style="color:#49d58a"/><line x1="20" y1="${height-20}" x2="${width-20}" y2="${height-20}" stroke="#244a39"/><line x1="20" y1="20" x2="20" y2="${height-20}" stroke="#244a39"/></svg>`;
}
function adherenceThisWeek(){
 const s=state(),start=monday(0),end=plusDays(start,6),sessions=s.trainingSessions.filter(x=>x.date>=start&&x.date<=end).length,mealKeys=Object.entries(s.mealDone).filter(([k,v])=>v&&k.slice(0,10)>=start&&k.slice(0,10)<=end).length,nutritionInvalid=(start<="2026-08-30"&&end>="2026-08-24");
 return {training:Math.min(100,Math.round(sessions/5*100)),nutrition:nutritionInvalid?null:Math.min(100,Math.round(mealKeys/(7*5)*100)),sessions,nutritionInvalid};
}
function saveMeasurement(){
 const ids=["weight","waist","hip","chest","arm","thigh","calf","bodyFat","visceral","water","skeletalMuscle","muscleMass","protein","bmr"];
 const row={date:$("#measure_date").value||todayISO()};
 ids.forEach(k=>row[k]=$("#measure_"+k)?.value!==""?finite($("#measure_"+k).value,null):null);
 const s=state();s.measurements=s.measurements.filter(x=>x.date!==row.date);s.measurements.unshift(row);s.measurements.sort((a,b)=>b.date.localeCompare(a.date));saveState(s);render();toast("Medidas guardadas");
}
function generateWeeklyReview(){
 const s=state(),m=firstAndLastMeasurements(),adh=adherenceThisWeek();
 const review={id:uid(),date:todayISO(),weekStart:monday(0),training:adh.training,nutrition:adh.nutrition,weight:m.last?.weight??null,waist:m.last?.waist??null,summary:`Entrenamientos completados esta semana: ${adh.sessions}. La tendencia se interpreta junto con medidas, rendimiento y constancia.`};
 s.weeklyReviews=s.weeklyReviews.filter(x=>x.weekStart!==review.weekStart);s.weeklyReviews.unshift(review);saveState(s);return review;
}

function openModal(title,body){
 const old=$(".modal-backdrop");if(old)old.remove();
 document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal"><div class="section-title"><h2>${esc(title)}</h2><button class="btn small" data-action="close-modal">Cerrar</button></div>${body}</div></div>`);
}
function closeModal(){$(".modal-backdrop")?.remove()}
function openRecipe(id){
 const r=recipe(id);if(!r)return;
 openModal(r.name,`<div class="meta"><span>${esc(r.prep)}</span><span>${r.time} min</span><span>${esc(r.cat)}</span></div>
 <h3>Ingredientes y cantidades</h3><ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${esc(x[2])}</b> ${esc(x[0])}<small>${esc(x[3])}</small></li>`).join("")}</ul>
 <h3>Preparación paso a paso</h3><ol>${detailedSteps(r).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
 <h3>Qué puedes adelantar</h3><p>${esc(advanceAdvice(r))}</p>
 <h3>Conservación</h3><p>${esc(r.storage)}</p><h3>Recalentado / acabado</h3><p>${esc(r.reheat)}</p>`);
}
function openExercise(id){
 const ex=exercise(id);if(!ex)return;
 const hist=latestExerciseEntries(id,6),prog=progressionFor(ex),best=bestSet(id);
 openModal(ex.name,`<div class="meta"><span>${esc(ex.group)}</span><span>${esc(ex.equipment)}</span><span>${ex.sets} × ${esc(ex.reps)}</span></div>
 <h3>Técnica</h3><p>${esc(ex.tech)}</p>
 <h3>Propuesta próxima vez</h3><p><b>${prog.label}</b> · ${prog.weight} kg</p><p class="muted">${esc(prog.why)}</p>
 ${best?`<h3>Mejor registro</h3><p>${best.weight} kg × ${best.reps} rep · ${best.date}</p>`:""}
 <h3>Últimos registros</h3>${hist.length?hist.map(h=>`<p><b>${h.date}</b> · ${h.sets.filter(x=>x.done).map(x=>`${x.weight}×${x.reps}`).join(" · ")||"Sin series completas"}</p>`).join(""):`<p class="muted">Sin historial todavía.</p>`}
 <h3>Alternativas</h3><div class="btn-row">${ex.alts.map(a=>exercise(a)).filter(Boolean).map(a=>`<button class="btn small" data-action="open-exercise" data-id="${a.id}">${esc(a.name)}</button>`).join("")}</div>`);
}
function openRecipeForm(id=""){
 const r=id?recipe(id):null,items=(r?.items||[]).map(x=>`${x[0]} | ${x[1]} | ${x[2]} | ${x[3]}`).join("\n"),steps=(r?.steps||[]).join("\n");
 openModal(id?"Editar receta":"Añadir receta",`<div class="form-grid">
 <label class="wide">Nombre<input id="cr_name" value="${esc(r?.name||"")}"></label>
 <label>Momento<select id="cr_type">${Object.entries(MEALS).map(([k,v])=>`<option value="${k}" ${r?.type===k?"selected":""}>${v}</option>`).join("")}</select></label>
 <label>Categoría<input id="cr_cat" value="${esc(r?.cat||"")}"></label>
 <label>Proteína principal<input id="cr_protein" value="${esc(r?.protein||"")}"></label>
 <label>Hidrato principal<input id="cr_carb" value="${esc(r?.carb||"")}"></label>
 <label>Tiempo (min)<input id="cr_time" type="number" value="${finite(r?.time,15)}"></label>
 <label class="wide">Ingredientes<textarea id="cr_items" rows="7" placeholder="Pollo | 180 | g | crudo">${esc(items)}</textarea></label>
 <label class="wide">Preparación (un paso por línea)<textarea id="cr_steps" rows="7">${esc(steps)}</textarea></label>
 <label>Conservación<input id="cr_storage" value="${esc(r?.storage||"")}"></label>
 <label>Recalentado<input id="cr_reheat" value="${esc(r?.reheat||"")}"></label>
 </div><div class="btn-row"><button class="btn primary" data-action="save-recipe" data-id="${esc(id)}">Guardar</button>${id?`<button class="btn danger" data-action="delete-recipe" data-id="${esc(id)}">Eliminar</button>`:""}</div>`);
}
function saveCustomRecipe(id=""){
 const name=$("#cr_name").value.trim();if(!name)return toast("Escribe el nombre");
 const items=$("#cr_items").value.split("\n").map(x=>x.split("|").map(y=>y.trim())).filter(x=>x[0]).map(x=>[x[0],finite(x[1],1),x[2]||"unidad",x[3]||"listo"]);
 if(!items.length)return toast("Añade ingredientes");
 const row={id:id||("user_"+uid()),type:$("#cr_type").value,name,cat:$("#cr_cat").value.trim()||"propia",protein:$("#cr_protein").value.trim()||"otro",carb:$("#cr_carb").value.trim()||"otro",time:finite($("#cr_time").value,15),prep:"Receta propia",items,steps:$("#cr_steps").value.split("\n").map(x=>x.trim()).filter(Boolean),storage:$("#cr_storage").value.trim()||"Según ingredientes.",reheat:$("#cr_reheat").value.trim()||"Según plato."};
 let a=customRecipes().filter(x=>x.id!==row.id);a.unshift(row);saveCustomRecipes(a);closeModal();render();toast("Receta guardada");
}

function mealCard(type){
 const r=currentMeal(type),s=state(),done=!!s.mealDone[`${todayISO()}_${type}`],rating=s.ratings[r.id]||0;
 return `<div class="meal-card ${done?"meal-complete":""}" data-meal-card="${type}">
 <div class="meal-head"><div><span class="eyebrow">${MEALS[type]}</span><h3>${esc(r.name)}</h3><div class="meta"><span>${esc(r.prep)}</span><span>${r.time} min</span><span>${esc(r.cat)}</span></div></div><button class="btn small" data-action="open-recipe" data-id="${r.id}">Receta</button></div>
 <ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${esc(x[2])}</b> ${esc(x[0])}<small>${esc(x[3])}</small></li>`).join("")}</ul>
 <label class="meal-check"><input type="checkbox" data-action="meal-done" data-type="${type}" ${done?"checked":""}> Comida realizada</label>
 <div class="btn-row"><button class="btn small primary" data-action="smart-meal" data-type="${type}">Cambiar por otra equilibrada</button></div>
 <div class="rating">${[1,2,3,4,5,6,7,8,9,10].map(v=>`<button class="${rating===v?"active":""}" data-action="rate-recipe" data-id="${r.id}" data-value="${v}">${v}</button>`).join("")}</div></div>`;
}

function planMarkup(plan){
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">${plan.weekStart} → ${plan.weekEnd}</span><h2>${plan.status==="confirmed"?"Semana confirmada":"Borrador editable"}</h2></div><span class="pill ${plan.status==="confirmed"?"green":"amber"}">${plan.status}</span></div>
 <p class="muted">Comida flexible planificada: ${esc(plan.flexMealDay)}. No requiere compensar saltándose otras comidas.</p>
 <div class="btn-row"><button class="btn" data-action="regen-plan" data-start="${plan.weekStart}">Otra propuesta</button>${plan.status!=="confirmed"?`<button class="btn primary" data-action="confirm-plan" data-start="${plan.weekStart}">Confirmar semana</button>`:""}</div></div>
 ${DAYS.map(day=>`<div class="week-card"><h3>${day}</h3>${Object.keys(MEALS).map(type=>{const r=recipe(plan.days[day][type]);return `<div class="week-row"><span>${MEALS[type]}</span><div><b>${esc(r?.name||"")}</b><small>${esc(r?.prep||"")} · ${r?.time||"-"} min</small></div><div class="actions"><button class="btn small" data-action="open-recipe" data-id="${r?.id||""}">Ver</button><button class="btn small" data-action="change-plan-meal" data-start="${plan.weekStart}" data-day="${day}" data-type="${type}">Cambiar</button></div></div>`}).join("")}</div>`).join("")}`;
}
function nutritionPlanner(){
 return `<div class="planner-nav"><button class="tab-btn ${PLANNER_TAB==="current"?"active":""}" data-action="planner-tab" data-tab="current">Semana actual</button><button class="tab-btn ${PLANNER_TAB==="next"?"active":""}" data-action="planner-tab" data-tab="next">Semana siguiente</button><button class="tab-btn ${PLANNER_TAB==="history"?"active":""}" data-action="planner-tab" data-tab="history">Historial</button></div>
 <div id="planner_current" class="${PLANNER_TAB==="current"?"":"hidden"}">${planMarkup(getPlan(monday(0)))}</div>
 <div id="planner_next" class="${PLANNER_TAB==="next"?"":"hidden"}">${planMarkup(getPlan(monday(1)))}</div>
 <div id="planner_history" class="${PLANNER_TAB==="history"?"":"hidden"}">${nutritionHistory()}</div>`;
}
function nutritionHistory(){
 const old=state().plans.filter(p=>p.weekStart<monday(0)).sort((a,b)=>b.weekStart.localeCompare(a.weekStart));
 return old.length?old.map(p=>`<div class="card"><h3>${p.weekStart} → ${p.weekEnd}</h3><p>${p.status}</p></div>`).join(""):`<div class="card"><p class="muted">Sin semanas anteriores registradas.</p></div>`;
}
function nutritionLibrary(){
 const main=allRecipes().filter(r=>["lunch","dinner"].includes(r.type)),other=allRecipes().filter(r=>!["lunch","dinner"].includes(r.type));
 const tile=r=>`<div class="recipe-card recipe-filter" data-search="${esc((r.name+" "+r.cat+" "+r.protein+" "+r.items.map(x=>x[0]).join(" ")).toLowerCase())}" data-cat="${esc(r.cat)}"><span class="eyebrow">${MEALS[r.type]}</span><h3>${esc(r.name)}</h3><p class="muted">${esc(r.prep)} · ${r.time} min</p><div class="btn-row"><button class="btn small" data-action="open-recipe" data-id="${r.id}">Ver receta</button>${String(r.id).startsWith("user_")?`<button class="btn small" data-action="edit-recipe" data-id="${r.id}">Editar</button>`:""}</div></div>`;
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">BIBLIOTECA PRINCIPAL</span><h2>${main.length} comidas y cenas</h2></div><button class="btn primary" data-action="add-recipe">+ Añadir receta</button></div>
 <div class="filter-row"><input id="recipe_search" placeholder="Buscar plato o ingrediente"><select id="recipe_filter"><option value="">Todas las categorías</option>${[...new Set(main.map(r=>r.cat))].sort().map(x=>`<option>${esc(x)}</option>`).join("")}</select></div></div>
 <div id="recipe_grid" class="library-grid">${main.map(tile).join("")}</div>
 <div class="card"><span class="eyebrow">DESAYUNOS Y TENTEMPIÉS</span><h3>${other.length} opciones</h3></div><div class="library-grid">${other.map(tile).join("")}</div>`;
}
function shoppingMarkup(){
 const a=state().shopping;if(!a.length)return `<div class="card"><p>Confirma una semana para generar la compra.</p></div>`;
 return `<div class="card"><h2>Compra semanal</h2>${a.map((x,i)=>`<div class="shop-row"><div><b>${esc(x.name)}</b><small>Comprar ${Math.ceil(x.buy)} ${esc(x.unit)}</small></div><input type="checkbox" data-action="shop-done" data-index="${i}" ${x.bought?"checked":""}></div>`).join("")}</div>`;
}
function pantryMarkup(){
 const a=state().pantry;
 return `<div class="card"><h2>Despensa</h2><div class="form-grid"><label>Producto<input id="pantry_name"></label><label>Cantidad<input id="pantry_qty" type="number"></label></div><button class="btn primary" data-action="add-pantry">Añadir</button>
 ${a.map((x,i)=>`<div class="pantry-row"><div><b>${esc(x.name)}</b><small>${x.qty}</small></div><button class="btn small danger" data-action="remove-pantry" data-index="${i}">Quitar</button></div>`).join("")}</div>`;
}
function preparationMarkup(){
 const p=getPlan(monday(1));
 const prepCard=(day,type)=>{const r=recipe(p.days[day][type]);return `<div class="meal-card"><span class="eyebrow">${day.toUpperCase()} · ${MEALS[type].toUpperCase()}</span><h3>${esc(r.name)}</h3><h4>Qué adelantar</h4><p>${esc(advanceAdvice(r))}</p><h4>Ingredientes</h4><ul class="list">${r.items.map(x=>`<li><b>${x[1]} ${esc(x[2])}</b> ${esc(x[0])}<small>${esc(x[3])}</small></li>`).join("")}</ul><h4>Preparación</h4><ol>${detailedSteps(r).map(x=>`<li>${esc(x)}</li>`).join("")}</ol><h4>Conservación</h4><p>${esc(r.storage)}</p><h4>Recalentado / acabado</h4><p>${esc(r.reheat)}</p></div>`};
 return `<div class="card"><span class="eyebrow">PREPARACIÓN · SEMANA SIGUIENTE</span><h2>Bloque del fin de semana</h2><p class="muted">Prepara bases para los primeros días y evita guardar toda la semana cocinada desde el domingo.</p>
 <ol><li>Lava, seca y porciona verduras resistentes; asa pimientos y verduras que vayan cocinadas.</li><li>Deja porcionadas las proteínas. Cocina por adelantado solo las recetas que lo toleran bien; pescado y marisco, cerca del consumo.</li><li>Prepara legumbres de los primeros días y congela porciones posteriores cuando corresponda.</li><li>Con arroz y pasta, cocina solo lo previsto para primeros días o porciona adecuadamente; enfría pronto tras cocinar.</li><li>Deja componentes de ensaladas separados y sin aliñar.</li><li>Haz un segundo bloque de 20-30 min a mitad de semana.</li></ol></div>
 <div class="card"><span class="eyebrow">COMIDAS REALES</span><h2>Qué preparar cada día</h2></div>${DAYS.map(d=>prepCard(d,"lunch")).join("")}
 <div class="card"><span class="eyebrow">CENAS REALES</span><h2>Cenas y preparación para mañana</h2></div>${DAYS.map(d=>prepCard(d,"dinner")).join("")}
 <div class="card"><span class="eyebrow">ENSALADAS</span><h2>Opciones para variar</h2>${SALADS.map(x=>`<p><b>${x[0]}</b><br>${x[1]}<br><small>Aliño: ${x[2]}</small></p>`).join("")}</div>`;
}

function renderNutrition(){
 return `<div class="card hero"><span class="eyebrow">NUTRICIÓN</span><h2>Planifica → prepara → compra → sigue → aprende</h2><p class="muted">Más variedad, semana siguiente independiente y cambios persistentes.</p></div>
 <div class="tabs" id="nutrition_tabs">${[["today","Hoy"],["plan","Plan semanal"],["recipes","Biblioteca"],["shopping","Compra"],["pantry","Despensa"],["prep","Preparación"]].map(([id,l])=>`<button class="tab-btn ${NUTRITION_TAB===id?"active":""}" data-action="nutrition-tab" data-tab="${id}">${l}</button>`).join("")}</div>
 <section id="nutrition_today" class="${NUTRITION_TAB==="today"?"":"hidden"}">${Object.keys(MEALS).map(mealCard).join("")}</section>
 <section id="nutrition_plan" class="${NUTRITION_TAB==="plan"?"":"hidden"}">${nutritionPlanner()}</section>
 <section id="nutrition_recipes" class="${NUTRITION_TAB==="recipes"?"":"hidden"}">${nutritionLibrary()}</section>
 <section id="nutrition_shopping" class="${NUTRITION_TAB==="shopping"?"":"hidden"}">${shoppingMarkup()}</section>
 <section id="nutrition_pantry" class="${NUTRITION_TAB==="pantry"?"":"hidden"}">${pantryMarkup()}</section>
 <section id="nutrition_prep" class="${NUTRITION_TAB==="prep"?"":"hidden"}">${preparationMarkup()}</section>`;
}

function trainingTodayCard(){
 const idx=trainingDayIndex(),day=TRAINING_DAYS[idx],s=state(),draft=s.workoutDraft,mission=missionFor(day);
 const lastSame=s.trainingSessions.find(x=>x.dayKey===day.key);
 return `<div class="card hero"><span class="eyebrow">ENTRENADOR85 · HOY</span><h2>${day.title}</h2><p>${day.subtitle}</p>
 <div class="grid3"><div class="stat"><span>Ejercicios</span><b>${day.ex.length}</b></div><div class="stat"><span>Cardio</span><b>${day.cardio.minutes} min</b></div><div class="stat"><span>Última sesión</span><b>${lastSame?lastSame.completion+"%":"—"}</b></div></div>
 <div class="mission"><b>🎯 Misión de hoy</b><p>${esc(mission)}</p></div>
 <div class="btn-row" style="margin-top:12px">${draft?`<button class="btn primary" data-action="training-tab" data-tab="session">Continuar entrenamiento</button>`:`<button class="btn primary" data-action="start-workout" data-day="${idx}">Comenzar entrenamiento</button>`}<button class="btn" data-action="training-tab" data-tab="plan">Ver los 5 días</button></div></div>`;
}
function trainingPlanMarkup(){
 return TRAINING_DAYS.map((d,i)=>`<div class="card"><div class="section-title"><div><span class="eyebrow">DÍA ${i+1}</span><h3>${d.title}</h3><p class="muted">${d.subtitle}</p></div><button class="btn small primary" data-action="start-workout" data-day="${i}">Iniciar</button></div>
 <div class="list">${d.ex.map(id=>{const ex=exercise(id),p=progressionFor(ex);return `<li><b>${esc(ex.name)}</b><small>${ex.sets} × ${esc(ex.reps)} · ${p.label} ${p.weight} kg</small></li>`}).join("")}</div>
 <p class="note">Bloque de core en máquina · Cardio ${d.cardio.mode} ${d.cardio.minutes} min</p></div>`).join("");
}
function workoutSessionMarkup(){
 const d=state().workoutDraft;if(!d)return `<div class="card"><p>No hay entrenamiento activo.</p><button class="btn primary" data-action="start-workout" data-day="${trainingDayIndex()}">Empezar el de hoy</button></div>`;
 const day=TRAINING_DAYS[d.dayIndex];
 return `<div class="card hero"><span class="eyebrow">SESIÓN ACTIVA</span><h2>${esc(d.title)}</h2><p class="muted">Registra cada serie. La aplicación conservará el peso y las repeticiones.</p></div>
 ${d.exercises.map((row,ei)=>{const ex=exercise(row.exerciseId),prog=progressionFor(ex),best=bestSet(ex.id);return `<div class="exercise-card"><div class="exercise-head"><div><span class="eyebrow">${esc(ex.group)}</span><h3>${esc(ex.name)}</h3><div class="meta"><span>${ex.sets} × ${esc(ex.reps)}</span><span>${prog.label}: ${prog.weight} kg</span>${best?`<span>Mejor ${best.weight}×${best.reps}</span>`:""}</div></div><button class="btn small" data-action="open-exercise" data-id="${ex.id}">Técnica</button></div>
 ${row.sets.map((set,si)=>`<div class="set-row"><div class="set-index">${si+1}</div><input type="number" step="0.1" value="${set.weight}" data-action="draft-set" data-ex="${ei}" data-set="${si}" data-field="weight" aria-label="Peso"><input type="number" value="${set.reps}" data-action="draft-set" data-ex="${ei}" data-set="${si}" data-field="reps" aria-label="Repeticiones"><div class="set-ok"><input type="checkbox" ${set.done?"checked":""} data-action="draft-set-done" data-ex="${ei}" data-set="${si}"></div></div>`).join("")}
 <div class="form-grid" style="margin-top:10px"><label>Esfuerzo 1-10<input type="number" min="1" max="10" value="${row.effort||7}" data-action="draft-effort" data-ex="${ei}"></label><label>Alternativa<select data-action="draft-alternative" data-ex="${ei}"><option value="">Mantener ejercicio</option>${ex.alts.map(a=>exercise(a)).filter(Boolean).map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></label></div></div>`}).join("")}
 <div class="card"><span class="eyebrow">CORE</span><h3>Bloque diario de core en máquina</h3><p class="muted">Cada sesión incluye 2–3 patrones de core y se registran como cualquier otro ejercicio.</p></div>
 <div class="card"><span class="eyebrow">CARDIO</span><h3>${esc(d.cardio.mode)}</h3><div class="form-grid"><label>Minutos<input type="number" value="${d.cardio.minutes}" data-action="draft-field" data-path="cardio.minutes"></label><label>Intensidad 1-10<input type="number" min="1" max="10" value="${d.cardio.intensity}" data-action="draft-field" data-path="cardio.intensity"></label><label>Distancia opcional<input value="${esc(d.cardio.distance)}" data-action="draft-field" data-path="cardio.distance"></label><label>Tipo<select data-action="draft-field" data-path="cardio.mode">${["Moderado","Progresivo","Intervalos sin impacto","Recuperación"].map(x=>`<option ${d.cardio.mode===x?"selected":""}>${x}</option>`).join("")}</select></label></div></div>
 <div class="card"><span class="eyebrow">CIERRE DE SESIÓN</span><div class="form-grid"><label>Energía 1-10<input type="number" min="1" max="10" value="${d.sessionEnergy}" data-action="draft-field" data-path="sessionEnergy"></label><label>Dificultad 1-10<input type="number" min="1" max="10" value="${d.sessionDifficulty}" data-action="draft-field" data-path="sessionDifficulty"></label><label class="wide">Notas<textarea data-action="draft-field" data-path="notes">${esc(d.notes)}</textarea></label></div><button class="btn primary" data-action="finish-workout">Terminar y analizar</button></div>`;
}
function trainingHistoryMarkup(){
 const sessions=state().trainingSessions;
 if(!sessions.length)return `<div class="card"><p class="muted">Todavía no hay entrenamientos guardados.</p></div>`;
 return sessions.slice(0,30).map(sess=>{const c=coachAfterSession(sess);return `<div class="card coach"><div class="section-title"><div><span class="eyebrow">${sess.date}</span><h3>${esc(sess.title||sess.dayKey||"Entrenamiento")}</h3></div><span class="pill green">${sess.completion||0}%</span></div>
 <div class="grid3"><div class="stat"><span>Volumen</span><b>${c.volume}</b></div><div class="stat"><span>Cambio</span><b>${c.delta==null?"—":(c.delta>0?"+":"")+c.delta+"%"}</b></div><div class="stat"><span>Cardio</span><b>${sess.cardio?.minutes||0} min</b></div></div>
 ${c.prs.length?`<p>🏆 ${c.prs.map(esc).join(" · ")}</p>`:""}<p class="muted">${esc(c.message)}</p></div>`}).join("");
}
function exerciseLibraryMarkup(){
 return `<div class="card"><div class="filter-row"><input id="exercise_search" placeholder="Buscar ejercicio o músculo"><select id="exercise_filter"><option value="">Todos</option>${[...new Set(EXERCISES.map(x=>x.group))].sort().map(x=>`<option>${esc(x)}</option>`).join("")}</select></div></div>
 <div id="exercise_grid" class="library-grid">${EXERCISES.map(ex=>{const p=progressionFor(ex);return `<div class="exercise-card exercise-filter" data-search="${esc((ex.name+" "+ex.group+" "+ex.equipment).toLowerCase())}" data-group="${esc(ex.group)}"><span class="eyebrow">${esc(ex.group)}</span><h3>${esc(ex.name)}</h3><div class="meta"><span>${esc(ex.equipment)}</span><span>${ex.sets} × ${esc(ex.reps)}</span><span>${p.label} ${p.weight} kg</span></div><button class="btn small" data-action="open-exercise" data-id="${ex.id}">Historial y técnica</button></div>`}).join("")}</div>`;
}
let TRAINING_TAB="today";
function renderTraining(){
 const tabs=[["today","Hoy"],["session","Sesión"],["plan","5 días"],["history","Historial"],["library","Biblioteca"]];
 const body=TRAINING_TAB==="today"?trainingTodayCard():TRAINING_TAB==="session"?workoutSessionMarkup():TRAINING_TAB==="plan"?trainingPlanMarkup():TRAINING_TAB==="history"?trainingHistoryMarkup():exerciseLibraryMarkup();
 return `<div class="card hero"><span class="eyebrow">ENTRENAMIENTO</span><h2>Entrenador85</h2><p class="muted">Full Body 5 días · progreso registrado · core en máquina · cardio integrado.</p></div>
 <div class="tabs">${tabs.map(([id,l])=>`<button class="tab-btn ${TRAINING_TAB===id?"active":""}" data-action="training-tab" data-tab="${id}">${l}</button>`).join("")}</div>${body}`;
}

function classifyMetric(key,delta){
 if(delta==null)return ["Sin datos","neutral"];
 const lower=["weight","waist","hip","bodyFat","visceral"],stable=["muscleMass","skeletalMuscle","protein"];
 if(lower.includes(key))return delta<0?["Mejora","good"]:delta===0?["Estable","neutral"]:["Vigilar","attn"];
 if(stable.includes(key))return delta>0?["Mejora","good"]:Math.abs(delta)<=0.2?["Estable","neutral"]:["Vigilar tendencia","attn"];
 return [Math.abs(delta)<0.5?"Estable":"Cambio","neutral"];
}
function anomalyFlags(last,prev){
 if(!last||!prev)return [];const out=[];
 [["hip","Cadera",2],["thigh","Muslo",2],["calf","Gemelo",1.5],["chest","Pecho",2]].forEach(([k,n,t])=>{if(last[k]!=null&&prev[k]!=null&&Math.abs(last[k]-prev[k])>=t)out.push(`${n}: cambio de ${Math.round((last[k]-prev[k])*10)/10} cm; repite la medición con el mismo punto y tensión de cinta.`)});
 return out;
}
function evolutionCoachInterpretation(){
 const {first,last,prev}=firstAndLastMeasurements();if(!last)return `<div class="card coach"><h3>Entrenador85 interpreta tus resultados</h3><p class="muted">Guarda un control para empezar.</p></div>`;
 const keys=[["weight","Peso","kg"],["waist","Cintura","cm"],["bodyFat","Grasa corporal","p.p."],["visceral","Grasa visceral",""],["muscleMass","Masa muscular","kg"],["skeletalMuscle","Músculo esquelético","p.p."]];
 const rows=keys.map(([k,n,u])=>{const weekly=prev&&last[k]!=null&&prev[k]!=null?Math.round((last[k]-prev[k])*10)/10:null,total=first&&last[k]!=null&&first[k]!=null?Math.round((last[k]-first[k])*10)/10:null,[label,cls]=classifyMetric(k,weekly);return `<div class="week-row"><span>${n}</span><div><b>${last[k]??"—"} ${last[k]!=null?u:""}</b><small>Semana: ${weekly==null?"—":(weekly>0?"+":"")+weekly} · Desde inicio: ${total==null?"—":(total>0?"+":"")+total}</small></div><div><span class="pill ${cls==="good"?"green":cls==="attn"?"amber":""}">${label}</span></div></div>`}).join("");
 const flags=anomalyFlags(last,prev),combined=prev&&last.weight!=null&&prev.weight!=null&&last.waist!=null&&prev.waist!=null&&last.weight<=prev.weight&&last.waist<=prev.waist?"Peso y cintura mantienen una tendencia favorable. Interpreta la composición corporal como tendencia de varias semanas.":"Valora el conjunto: peso, cintura, rendimiento, constancia y composición corporal.";
 return `<div class="card coach"><span class="eyebrow">ENTRENADOR85 INTERPRETA</span><h2>Lectura automática</h2>${rows}<p>${combined}</p>${flags.length?`<div class="warning"><b>Revisar medición</b><ul>${flags.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}</div>`;
}
function evolutionSummary(){
 const {first,last,prev}=firstAndLastMeasurements(),adh=adherenceThisWeek();
 if(!last)return `<div class="card hero"><h2>Empieza tu evolución</h2><p class="muted">Introduce las medidas para crear comparativas y gráficas.</p></div>`;
 const cards=[
  ["Peso",last.weight,"kg",metricDelta(first,last,"weight")],
  ["Cintura",last.waist,"cm",metricDelta(first,last,"waist")],
  ["Cadera",last.hip,"cm",metricDelta(first,last,"hip")],
  ["Pecho",last.chest,"cm",metricDelta(first,last,"chest")]
 ];
 return `<div class="card hero"><span class="eyebrow">EVOLUCIÓN DESDE EL INICIO</span><h2>${first?.date||"Inicio"} → ${last.date}</h2><div class="grid">${cards.map(([n,v,u,d])=>`<div class="stat"><span>${n}</span><b>${v??"—"} ${v!=null?u:""}</b><small class="delta ${d==null?"neutral":d<0?"good":"neutral"}">${d==null?"Sin comparación":(d>0?"+":"")+d+" "+u}</small></div>`).join("")}</div>
 <div class="grid" style="margin-top:10px"><div class="stat"><span>Entrenamiento semanal</span><b>${adh.training}%</b></div><div class="stat"><span>Plan nutricional marcado</span><b>${adh.nutrition==null?"No evaluable":adh.nutrition+"%"}</b></div></div></div>`;
}
function measurementForm(){
 const last=firstAndLastMeasurements().last||{};
 const fields=[["weight","Peso (kg)"],["waist","Cintura (cm)"],["hip","Cadera (cm)"],["chest","Pecho (cm)"],["arm","Brazo (cm)"],["thigh","Muslo (cm)"],["calf","Gemelo (cm)"],["bodyFat","Grasa corporal (%)"],["visceral","Grasa visceral"],["water","Agua (%)"],["skeletalMuscle","Músculo esquelético (%)"],["muscleMass","Masa muscular (kg)"],["protein","Proteína (%)"],["bmr","BMR"]];
 return `<div class="card"><div class="section-title"><div><span class="eyebrow">CONTROL SEMANAL</span><h2>Medidas</h2></div><span class="pill green">Lunes</span></div><div class="form-grid"><label>Fecha<input id="measure_date" type="date" value="${todayISO()}"></label>${fields.map(([k,l])=>`<label>${l}<input id="measure_${k}" type="number" step="0.1" value="${last[k]??""}"></label>`).join("")}</div><button class="btn primary" data-action="save-measurement">Guardar control</button></div>`;
}
function evolutionCharts(){
 const arr=[...state().measurements].filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));
 return `<div class="card"><span class="eyebrow">TENDENCIA</span><h3>Peso</h3><div class="chart">${svgLine(arr.map(x=>x.weight))}</div><div class="legend">${arr.slice(-6).map(x=>`<span>${x.date}: <b>${x.weight??"—"}</b></span>`).join("")}</div></div>
 <div class="card"><span class="eyebrow">TENDENCIA</span><h3>Cintura</h3><div class="chart">${svgLine(arr.map(x=>x.waist))}</div><div class="legend">${arr.slice(-6).map(x=>`<span>${x.date}: <b>${x.waist??"—"}</b></span>`).join("")}</div></div>`;
}
function weeklyCoachMarkup(){
 const s=state(),r=s.weeklyReviews.find(x=>x.weekStart===monday(0));
 return `<div class="card coach"><div class="section-title"><div><span class="eyebrow">INFORME DEL ENTRENADOR</span><h2>Semana actual</h2></div><button class="btn small primary" data-action="weekly-review">${r?"Actualizar":"Generar"}</button></div>${r?`<div class="grid"><div class="stat"><span>Entrenamiento</span><b>${r.training}%</b></div><div class="stat"><span>Nutrición</span><b>${r.nutrition==null?"No evaluable":r.nutrition+"%"}</b></div></div><p>${esc(r.summary)}</p>`:`<p class="muted">Genera el informe cuando hayas registrado parte de la semana.</p>`}</div>`;
}
function renderEvolution(){
 return evolutionSummary()+evolutionCoachInterpretation()+evolutionCharts()+weeklyCoachMarkup()+measurementForm();
}

function todayDashboard(){
 const idx=trainingDayIndex(),day=TRAINING_DAYS[idx],p=state().plans.find(x=>x.weekStart===monday(0)&&x.status==="confirmed"),learn=LEARNING_CARDS[new Date().getDate()%LEARNING_CARDS.length],last=firstAndLastMeasurements().last;
 const dinner=p?recipe(p.days?.[dayName()]?.dinner):currentMeal("dinner");
 const lunchTomorrow=p?recipe(p.days?.[DAYS[(Math.max(0,DAYS.indexOf(dayName()))+1)%7]]?.lunch):null;
 return `<div class="card hero"><span class="eyebrow">HOY</span><h2>${day.title}</h2><p>${day.subtitle}</p><div class="btn-row"><button class="btn primary" data-action="go-page" data-page="training">Entrenar</button><button class="btn" data-action="go-page" data-page="nutrition">Ver comidas</button></div></div>
 <div class="grid"><div class="card"><span class="eyebrow">ENTRENO</span><h3>${day.title}</h3><p>${day.ex.length} ejercicios · core máquina · ${day.cardio.minutes} min cardio</p><div class="mission"><b>Misión</b><p>${esc(missionFor(day))}</p></div></div>
 <div class="card"><span class="eyebrow">NUTRICIÓN</span><h3>${p?"Semana confirmada":"Semana por confirmar"}</h3><p>Comida: ${esc(currentMeal("lunch")?.name||"")}</p><p>Cena: ${esc(dinner?.name||"")}</p></div></div>
 <div class="card"><span class="eyebrow">PREPARA HOY</span><h3>Para mañana</h3><p>${lunchTomorrow?`${esc(lunchTomorrow.name)} · ${esc(advanceAdvice(lunchTomorrow))}`:"Confirma la semana para ver la preparación del día siguiente."}</p></div>
 <div class="card learning"><span class="eyebrow">APRENDE CONMIGO</span><h3>${esc(learn.title)}</h3><p>${esc(learn.body)}</p></div>
 <div class="card"><span class="eyebrow">EVOLUCIÓN</span><h3>${last?`Último control · ${last.date}`:"Sin control todavía"}</h3>${last?`<div class="grid"><div class="stat"><span>Peso</span><b>${last.weight??"—"}</b></div><div class="stat"><span>Cintura</span><b>${last.waist??"—"}</b></div></div>`:`<p class="muted">Introduce tus medidas para empezar la comparación.</p>`}<button class="btn small" data-action="go-page" data-page="evolution">Ver evolución</button></div>`;
}
function moreMarkup(){
 const backup=!!localStorage.getItem(PREFIX+"legacyBackup_v4");
 return `<div class="card"><span class="eyebrow">DATOS Y SEGURIDAD</span><h2>Proyecto85 Pro 4.0</h2><p class="muted">Sin service worker. Las futuras mejoras pueden sustituir los archivos manteniendo estas mismas claves de datos.</p>
 <div class="grid"><div class="stat"><span>Esquema de datos</span><b>v${SCHEMA_VERSION}</b></div><div class="stat"><span>Copia legacy</span><b>${backup?"Sí":"No"}</b></div></div>
 <div class="btn-row" style="margin-top:12px"><button class="btn primary" data-action="export-data">Exportar copia</button><button class="btn" data-action="import-data">Importar copia</button><input id="import_file" type="file" accept="application/json" class="hidden"></div></div>
 <div class="card learning"><span class="eyebrow">FILOSOFÍA</span><h3>Planifica → Haz → Registra → Aprende → Analiza → Ajusta</h3><p>Proyecto85 prioriza constancia, técnica, alimentación variada y evolución de varias semanas por encima de decisiones basadas en un solo dato.</p></div>`;
}

let PAGE="home";
let NUTRITION_TAB="today";
let PLANNER_TAB="current";
function nav(){
 const items=[["home","⌂","Hoy"],["training","🏋️","Entreno"],["nutrition","🍽️","Nutrición"],["evolution","↗","Evolución"],["more","•••","Más"]];
 return `<nav class="bottom"><div class="bottom-inner">${items.map(([p,i,l])=>`<button class="nav-btn ${PAGE===p?"active":""}" data-action="go-page" data-page="${p}"><b>${i}</b>${l}</button>`).join("")}</div></nav>`;
}
function render(){
 const host=$("#app");if(!host)return;
 let content;
 if(PAGE==="home")content=todayDashboard();
 else if(PAGE==="training")content=renderTraining();
 else if(PAGE==="nutrition")content=renderNutrition();
 else if(PAGE==="evolution")content=renderEvolution();
 else content=moreMarkup();
 host.innerHTML=`<div class="shell"><header><div class="brand"><small>ENTRENADOR PERSONAL</small><h1>Proyecto85 Pro <span class="version">4.1</span></h1></div><span class="header-badge">Entrenador85</span></header>${content}</div>${nav()}`;
}
function boot(){
 try{
  try{localStorage.removeItem(PREFIX+"legacyBackup_v4")}catch(_){}
  render()
 }catch(err){
  console.error(err);
  $("#app").innerHTML=`<div class="error-card"><h2>Proyecto85 Pro</h2><p>Se ha producido un error al iniciar. Tus datos no se han borrado.</p><pre>${esc(err?.stack||err?.message||err)}</pre><button class="btn primary" onclick="location.reload()">Reintentar</button></div>`;
 }
}

document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-action]");if(!b)return;
 const a=b.dataset.action;
 if(a==="go-page"){PAGE=b.dataset.page;render();window.scrollTo(0,0);return}
 if(a==="training-tab"){TRAINING_TAB=b.dataset.tab;render();return}
 if(a==="start-workout"){startWorkout(Number(b.dataset.day));return}
 if(a==="finish-workout"){finishWorkout();return}
 if(a==="open-exercise"){openExercise(b.dataset.id);return}
 if(a==="open-recipe"){openRecipe(b.dataset.id);return}
 if(a==="close-modal"){closeModal();return}
 if(a==="modal-backdrop"&&e.target===b){closeModal();return}
 if(a==="nutrition-tab"){
  const tab=b.dataset.tab;NUTRITION_TAB=tab;["today","plan","recipes","shopping","pantry","prep"].forEach(x=>$("#nutrition_"+x)?.classList.toggle("hidden",x!==tab));
  $("#nutrition_tabs")?.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active",x===b));return
 }
 if(a==="planner-tab"){
  const tab=b.dataset.tab;PLANNER_TAB=tab;["current","next","history"].forEach(x=>$("#planner_"+x)?.classList.toggle("hidden",x!==tab));
  b.parentElement.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active",x===b));return
 }
 if(a==="confirm-plan"){confirmPlan(b.dataset.start);return}
 if(a==="regen-plan"){regeneratePlan(b.dataset.start);return}
 if(a==="change-plan-meal"){changePlanMeal(b.dataset.start,b.dataset.day,b.dataset.type);return}
 if(a==="smart-meal"){smartTodayMeal(b.dataset.type);return}
 if(a==="rate-recipe"){
  const s=state();s.ratings[b.dataset.id]=Number(b.dataset.value);saveState(s);
  b.closest(".rating")?.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));return
 }
 if(a==="add-recipe"){openRecipeForm();return}
 if(a==="edit-recipe"){openRecipeForm(b.dataset.id);return}
 if(a==="save-recipe"){saveCustomRecipe(b.dataset.id||"");return}
 if(a==="delete-recipe"){if(confirm("¿Eliminar esta receta propia?")){saveCustomRecipes(customRecipes().filter(x=>x.id!==b.dataset.id));closeModal();render()}return}
 if(a==="add-pantry"){
  const n=$("#pantry_name").value.trim(),q=finite($("#pantry_qty").value,0);if(!n)return;
  const s=state();s.pantry.push({name:n,qty:q});saveState(s);render();return
 }
 if(a==="remove-pantry"){const s=state();s.pantry.splice(Number(b.dataset.index),1);saveState(s);render();return}
 if(a==="save-measurement"){saveMeasurement();return}
 if(a==="weekly-review"){generateWeeklyReview();render();return}
 if(a==="export-data"){
  const payload={app:"Proyecto85 Pro",version:APP_VERSION,schema:SCHEMA_VERSION,exportedAt:new Date().toISOString(),state:state(),customRecipes:customRecipes()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`Proyecto85_backup_${todayISO()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);return
 }
 if(a==="import-data"){$("#import_file").click();return}
});

document.addEventListener("change",async e=>{
 const t=e.target;
 if(t.matches('[data-action="meal-done"]')){
  const s=state(),key=`${todayISO()}_${t.dataset.type}`;s.mealDone[key]=t.checked;saveState(s);t.closest(".meal-card")?.classList.toggle("meal-complete",t.checked);return
 }
 if(t.matches('[data-action="shop-done"]')){const s=state();s.shopping[Number(t.dataset.index)].bought=t.checked;saveState(s);return}
 if(t.matches('[data-action="draft-set"]')){updateDraftSet(Number(t.dataset.ex),Number(t.dataset.set),t.dataset.field,t.value);return}
 if(t.matches('[data-action="draft-set-done"]')){updateDraftSet(Number(t.dataset.ex),Number(t.dataset.set),"done",t.checked);return}
 if(t.matches('[data-action="draft-effort"]')){const s=state();if(s.workoutDraft){s.workoutDraft.exercises[Number(t.dataset.ex)].effort=finite(t.value,7);saveState(s)}return}
 if(t.matches('[data-action="draft-alternative"]')&&t.value){
  const s=state(),i=Number(t.dataset.ex);if(s.workoutDraft){const alt=exercise(t.value),prog=progressionFor(alt);s.workoutDraft.exercises[i]={exerciseId:alt.id,sets:Array.from({length:alt.sets},()=>({weight:prog.weight,reps:parseInt(alt.reps)||10,done:false})),effort:7};saveState(s);render()}return
 }
 if(t.matches('[data-action="draft-field"]')){updateDraftField(t.dataset.path,t.type==="number"?finite(t.value,0):t.value);return}
 if(t.id==="recipe_search"||t.id==="recipe_filter"){
  const q=($("#recipe_search")?.value||"").toLowerCase(),f=$("#recipe_filter")?.value||"";
  $$(".recipe-filter").forEach(x=>x.classList.toggle("hidden",(q&&!x.dataset.search.includes(q))||(f&&x.dataset.cat!==f)));return
 }
 if(t.id==="exercise_search"||t.id==="exercise_filter"){
  const q=($("#exercise_search")?.value||"").toLowerCase(),f=$("#exercise_filter")?.value||"";
  $$(".exercise-filter").forEach(x=>x.classList.toggle("hidden",(q&&!x.dataset.search.includes(q))||(f&&x.dataset.group!==f)));return
 }
 if(t.id==="import_file"&&t.files?.[0]){
  try{
   const data=JSON.parse(await t.files[0].text());
   if(!data.state)throw new Error("El archivo no contiene datos de Proyecto85.");
   localStorage.setItem(STATE_KEY,JSON.stringify({...baseState(),...data.state,schema:SCHEMA_VERSION}));
   if(Array.isArray(data.customRecipes))saveCustomRecipes(data.customRecipes);
   toast("Copia importada");setTimeout(()=>location.reload(),600);
  }catch(err){toast("No se pudo importar: "+err.message)}
 }
});

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
