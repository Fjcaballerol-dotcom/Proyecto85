# Proyecto85 Pro CLEAN 1.1.1

Corrección de actualización para iPhone/PWA antigua.

Al abrir:
- desregistra cualquier service worker heredado;
- borra cachés antiguas;
- conserva localStorage;
- recarga una sola vez con URL limpia.

Después de esa primera apertura, la app funciona sin service worker.
