# Proyecto85 Pro 4.0.2 — Boot seguro

Corrección específica del error mostrado en iPhone:
- no ejecuta migración legacy al arrancar;
- elimina únicamente p85pro2_legacyBackup_v4, que era una copia temporal;
- conserva p85pro2_state y p85pro2_customRecipes;
- no borra medidas, entrenamientos, menús, recetas, despensa ni puntuaciones;
- las escrituras en localStorage ya no provocan caída completa si Safari está lleno;
- sin service worker.
