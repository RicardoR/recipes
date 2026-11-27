# Plan — Issue #84: actualizar Firebase JS SDK de 11.9.0 a 13.4.0

> Objetivo: actualizar el SDK modular `firebase` de la aplicación a **13.4.0**, actualizar
> `yarn.lock` y verificar que Auth, Firestore, Storage y Analytics conservan el comportamiento
> esperado. El alcance es solo el SDK web `firebase`; no incluye `firebase-tools`, que es una
> dependencia de desarrollo independiente.
>
> Issue: https://github.com/RicardoR/recipes/issues/84

---

## 0. Seguimiento

Rama: `84-update-firebase-13` (creada desde `master`).

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Baseline: estado Git, build, tests, lint, bundle y alertas de seguridad | ✅ | Build ✅ 1.57 MB · unit ✅ 24 ficheros / 143 tests · lint ✅. `yarn audit`: 4 hallazgos (2 high, 2 low), todos por `@grpc/grpc-js`; endpoint de Dependabot devuelve 401 sin autenticación. |
| **F1** | Revisar release notes y compatibilidad de Firebase 13.2–13.4 | ✅ | No se encontraron breaking changes en APIs usadas. Firebase Firestore requiere Node >=24.12; Angular CLI 22 requiere >=24.15 para Node 24. Cambiar CI de 22.x a 24.x. |
| **F2** | Actualizar `firebase` a 13.4.0 y `yarn.lock` | ✅ | `package.json` solo cambia `firebase`; lockfile actualizado con dependencias transitivas. `firebase-tools` permanece en 15.35.0. `yarn audit` sigue en 4 hallazgos de `@grpc/grpc-js`. |
| **F2b** | Alinear Node de CI y guía del repo con el requisito de Firebase | ✅ | Workflow actualizado a Node 24.x; `AGENTS.md` actualizado a Node 24.15+. |
| **F3** | Validación estática y automatizada | ✅ | Build ✅ 1.80 MB (< 2 MB; +0.23 MB vs. baseline) · unit ✅ 24/143 · lint ✅ · `yarn install --frozen-lockfile` ✅ en Node 24.22. |
| **F4** | QA funcional con emuladores | ✅ | `yarn e2e` ✅ 24/24; repetición `--repeat-each=2` ✅ 48/48. Flujos de Auth, CRUD, Storage, búsqueda y filtros pasan. |
| **F5** | Revisar alertas, documentar resultados y cerrar seguimiento | 🟡 | Análisis local terminado: los 4 hallazgos son de `@grpc/grpc-js` en el árbol; las advisories describen usos de servidor gRPC, que la app browser no ejecuta. No forzar resolución fuera del rango declarado. Dependabot requiere auth (401); comentar/cerrar issue al integrar. |

Cada fase debe dejar el repositorio verificable antes de pasar a la siguiente. No mezclar refactors
ni cambios de Angular en esta actualización.

### Resultados de F0 y F1

- Baseline tomado el 2026-11-26 en Node **24.22.0** (CI usaba Node 22.x antes de F2b):
  - `yarn build` ✅ — `Initial total` **1.57 MB**.
  - `yarn test --watch=false` ✅ — 24 ficheros / **143 tests**.
  - `yarn lint` ✅ — todos los archivos pasan.
  - `yarn audit --groups dependencies` → **4 hallazgos** (2 high, 2 low) de `@grpc/grpc-js`,
    alcanzado vía Firestore y Firestore compat; patched version indicada: `>=1.13.6`.
- El endpoint de alertas de Dependabot requiere autenticación (401), así que no se pudo tomar un
  snapshot directo de GitHub. La auditoría de Yarn es la referencia local para comparar después.
- Release notes oficiales 13.2–13.4: 13.2 y 13.3 incluyen fixes de Auth; 13.3 también corrige
  snapshots Firestore con caracteres multibyte. 13.4 comparte una Trusted Types policy para scripts
  externos de Auth/Analytics/App Check. Las novedades de AI Logic, Pipelines, Remote Config y
  Crashlytics no se usan en esta app.
- Compatibilidad de runtime: `@firebase/firestore@4.20.0` declara `engines.node >=24.12.0`;
  `@angular/cli@22.2.5` declara `^24.15.0` para Node 24. Se actualizó el workflow a `24.x` y la
  guía de contribución a Node 24.15+; la versión local 24.22.0 satisface ambos rangos.
- `yarn install --frozen-lockfile` ✅ en Node 24.22.0 tras el cambio.
- Las advisories GHSA-m9gg-hp2v-232j (high) y GHSA-f596-whhp-79r4 (low) afectan a servidores gRPC:
  autenticación mediante `getAuthContext` con certificados de cliente opcionales, y filtración de
  errores de handlers de servidor, respectivamente. La app no crea servidores gRPC ni usa esas APIs;
  el paquete Firestore publica entry points separados para `browser` y `node`. Se deja el rango
  transitivo upstream intacto en vez de forzar `@grpc/grpc-js@1.14.7` sobre `~1.9.0`.
- El paquete `@firebase/firestore@4.20.0` de Firebase 13.4.0 aún declara `@grpc/grpc-js ~1.9.0`.
  No se añadirá una resolución forzada sin confirmar el árbol resultante y probarla; el objetivo
  primario sigue siendo actualizar el SDK y se informará con precisión del resultado de audit.
- Tras el bump, `yarn audit --groups dependencies` sigue mostrando **los mismos 4 hallazgos** de
  `@grpc/grpc-js`; la resolución anidada de Firestore es `1.9.16`, mientras Firebase CLI usa
  `1.14.7`. El SDK actualizado no elimina por sí solo esas alertas.
- E2E: `yarn e2e` ✅ 24/24 y `node node_modules/@playwright/test/cli.js test --repeat-each=2`
  ✅ 48/48. Se observaron algunos logs transitorios de Firestore de “Could not reach Cloud Firestore
  backend” en la salida del web server; los flujos contra emuladores terminaron bien y las
  aserciones de consola de las specs pasaron. Analytics emite los warnings esperados de evento no
  inicializado en el entorno de emuladores.

## 1. Contexto y alcance

- `package.json` fija actualmente `firebase` en **11.9.0**.
- La aplicación usa la API modular de Firebase para:
  - App: `initializeApp`.
  - Auth: `getAuth`, `onAuthStateChanged`, `signInWithEmailAndPassword`, `signOut`.
  - Firestore: `getFirestore`, consultas, CRUD y `Timestamp`.
  - Storage: `getStorage`, `uploadBytesResumable`, `getDownloadURL`, `deleteObject`.
  - Analytics: `getAnalytics`, `isSupported`, `logEvent`.
  - Emuladores: conexión de Firestore y Storage.
- No se usa `@angular/fire`; Auth se inyecta mediante `FIREBASE_AUTH`.
- `firebase-tools` es una dependencia separada y queda fuera del alcance.
- La issue verificó que las APIs usadas están presentes en 13.1.0 y revisó sus cambios de versión.
  Este plan apunta a **13.4.0**, por lo que F1 debe cubrir las versiones posteriores a 13.1.0.
- La cifra de alertas de Dependabot de la issue es histórica; no asumir que refleja el estado actual.

## 2. Fases

### F0 — Baseline antes del cambio

1. Confirmar rama y árbol de trabajo limpios.
2. Registrar versiones instaladas de `firebase` y `firebase-tools`.
3. Ejecutar y guardar resultados:

   ```bash
   yarn build
   yarn test --watch=false
   yarn lint
   ```

4. Anotar el tamaño `Initial total` del build.
5. Consultar y registrar las alertas de Dependabot abiertas en la rama por defecto.
6. Confirmar que los archivos de entorno necesarios existen. Si hay que generarlos, usar
   `node server.js` con las variables de entorno requeridas; **no editar a mano**
   `src/environments/` (está generado e ignorado por Git).

No continuar si el baseline falla: identificar si es una condición preexistente y dejarla registrada.

### F1 — Auditoría de compatibilidad para 13.4.0

1. Revisar las release notes de Firebase JS SDK desde 13.1.0 hasta 13.4.0.
2. Confirmar compatibilidad de runtime: Firestore exige Node >=24.12.0 y Angular CLI 22 exige
   Node >=24.15.0 en la línea 24; por ello el CI debe ejecutar Node 24.x.
3. Verificar en los entry points/tipos del paquete las funciones enumeradas en §1, en particular:
   Auth modular, consultas/CRUD de Firestore, Storage resumable y Analytics.
4. Identificar cambios conductuales que puedan afectar persistencia de sesión, tamaño de bundle,
   inicialización de Analytics o uso de emuladores.
5. Registrar riesgos y decidir si el bump directo a 13.4.0 sigue siendo apropiado. Si aparece un
   breaking change relevante, pausar y acordar el alcance antes de tocar código.

### F2 — Actualización aislada

1. Actualizar únicamente el SDK:

   ```bash
   yarn add firebase@13.4.0
   ```

2. Revisar el diff de `package.json` y `yarn.lock`.
3. Confirmar que `firebase-tools` y otras dependencias no cambiaron.
4. Revisar los paquetes `@firebase/*` resueltos por el lockfile y que no se hayan añadido
   dependencias directas innecesarias.

### F3 — Verificación automatizada

Ejecutar en este orden y registrar resultados:

```bash
yarn build
yarn test --watch=false
yarn lint
```

- Comparar el bundle con el valor F0 y verificar el límite configurado.
- Si hay errores, corregir solo incompatibilidades demostrables causadas por Firebase 13.4.0.
- No introducir cambios para el bug de Promise/zone.js de la issue #87 en este trabajo.

### F4 — QA funcional

1. Ejecutar `yarn e2e`; Playwright inicia los emuladores y el servidor de prueba. No levantar un
   `ng serve` normal en paralelo.
2. Completar el checklist de flujos con la configuración de emuladores:
   - Auth: iniciar/cerrar sesión y comprobar persistencia después de recargar.
   - Firestore: crear, editar y borrar una receta.
   - Storage: subir y borrar una imagen.
   - Búsqueda y filtro por categorías.
3. Comprobar que los errores de Analytics en un entorno local sin soporte no rompen la app ni
   producen errores inesperados de consola. No exigir que Analytics registre eventos en emuladores.
4. Si el entorno de emuladores no cubre un comportamiento, anotar el caso y hacer smoke manual
   contra el proyecto Firebase de test solo si están disponibles sus variables de entorno.

### F5 — Cierre y seguimiento de seguridad

1. Volver a consultar Dependabot y comparar las alertas con F0; distinguir las cerradas por este
   bump de las que siguen abiertas por otras dependencias.
2. Registrar versión final, bundle, resultados de build/tests/lint/e2e y cualquier limitación de QA.
3. Actualizar la tabla §0 y comentar la issue #84 con el resumen.
4. Cerrar la issue al integrar el cambio, no antes.

## 3. Criterios de aceptación

- [x] `firebase` está fijado en `13.4.0` y `yarn.lock` queda actualizado.
- [x] `firebase-tools` y dependencias ajenas al alcance no cambian.
- [x] El workflow de CI usa Node 24.x, compatible con Firebase 13.4 y Angular CLI 22.
- [x] `yarn install --frozen-lockfile` pasa con Node 24.22.0.
- [x] `yarn build`, `yarn test --watch=false` y `yarn lint` pasan.
- [x] El tamaño del bundle se compara con F0 y queda dentro del límite del proyecto.
- [x] `yarn e2e` pasa con los emuladores.
- [x] Se verifican Auth, CRUD de recetas, Storage, búsqueda/filtros y el comportamiento local de
      Analytics.
- [x] Se reevalúan las alertas disponibles y se documenta el resultado, sin prometer que el bump
      elimina alertas ajenas al SDK.
- [ ] Plan e issue se actualizan al integrar el cambio.

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La auditoría existente solo verificó directamente la versión 13.1.0 | Revisar releases y APIs de 13.2–13.4 en F1 antes del bump. |
| Cambios conductuales en persistencia de Auth | Cubrir login/logout y recarga en QA con emuladores; añadir smoke de test si hace falta. |
| Regresión en Storage o Firestore aunque compile | Probar CRUD e imagen end-to-end con emuladores. |
| Diferencia de bundle | Guardar baseline en F0 y comparar después de F3. |
| Alertas de Dependabot históricas o no relacionadas con Firebase | Registrar snapshot actualizado antes/después y no atribuir al bump alertas de otros paquetes. |
| Analytics no soportado en tests/emuladores | Verificar que la falta de soporte se maneja sin romper la app; no validar recolección real en ese entorno. |
| Archivos de entorno ausentes en un clon limpio | Generarlos con `node server.js` y las variables correspondientes; nunca editarlos manualmente. |

## 5. Fuera de alcance

- Actualizar Angular, `firebase-tools` u otras dependencias.
- Migrar APIs modulares o introducir `@angular/fire`.
- Resolver el bug upstream de Promise rechazados de la issue #87.
- Cambiar la estrategia de Analytics o validar recolección de producción.
- Refactors no necesarios para compatibilidad con Firebase 13.4.0.
