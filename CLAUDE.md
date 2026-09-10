# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

Esta es la migración web de `apk-stock` (la app Ionic+Capacitor+SQLite para tablet del mismo local de ropa, repo hermano en `../apk-stock`). Acá se reconstruye la misma app como aplicación web: backend en Python (FastAPI) y frontend en Angular/Ionic corriendo en el navegador, con la idea de eventualmente reemplazar por completo la app de la tablet.

**No tocar `../apk-stock`** salvo que se pida explícitamente — se usa únicamente como referencia de la lógica de negocio a replicar.

## Idioma

El usuario es Salvador, habla español argentino. **Respondé siempre en español argentino, no en inglés ni en español neutro.** Usá "vos" en lugar de "tú", y giros locales (decime, hacelo, copiá, pegá, etc.). No es programador profesional — explicar qué se está haciendo y por qué, no solo el qué. Cuando algo sea ambiguo (features nuevas, cambios de diseño), preguntar antes de implementar.

## Stack técnico

**Backend** (`backend/`):
- FastAPI + Uvicorn
- SQLAlchemy 2.0 en modo **async** (`asyncpg` en producción, `aiosqlite` en desarrollo local)
- Alembic para migraciones (nunca se toca el schema a mano, todo vía `alembic revision`)
- Pydantic v2 para los schemas de entrada/salida
- Auth: JWT (`python-jose`) + hash de contraseña (`passlib[bcrypt]`)
- Base de datos: **Postgres** en producción (pensado para Neon, aún no desplegado), **SQLite** (`sqlite+aiosqlite`) en desarrollo local por defecto — configurable vía `DATABASE_URL` en `.env`, el código es agnóstico del motor

**Frontend** (`frontend/`):
- Angular 20 (standalone components, sin NgModules)
- Ionic 8 vía `@ionic/angular/standalone` — **sin Capacitor**, es una SPA de navegador común, no una app nativa
- Chart.js v4 (`chart.js/auto`) para los gráficos de Balance
- RxJS + `HttpClient` para hablar con la API

**IMPORTANTE — compatibilidad de Python 3.9**: el entorno de desarrollo tiene Python 3.9 instalado (no hay 3.10+, ni pyenv, ni Homebrew). **Nunca usar la sintaxis `X | None`** en el backend (rompe en runtime) — usar siempre `Optional[X]` de `typing`.

## Estructura de carpetas

```
backend/app/
├── main.py                  # instancia FastAPI, CORS, monta todos los routers
├── config.py                # Settings (lee .env): DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.
├── database.py               # Base declarativa, engine async, get_db() (yield de sesión)
├── security.py               # hash/verify password, crear/decodificar JWT
├── deps.py                   # get_current_user() — dependencia de auth para endpoints protegidos
├── rate_limit.py              # rate limit de login (5 intentos fallidos → bloqueo 15 min por email)
├── models/                    # SQLAlchemy: Usuario, Categoria, Proveedor, Producto, VarianteProducto,
│                               # MovimientoStock, Venta, DetalleVenta, PagoVenta, ConfigMedioPago,
│                               # CategoriaGasto, Gasto
├── schemas/                   # Pydantic: *Create, *Update, *Out por cada entidad
├── crud/                      # Lógica de negocio y transacciones — cada función abre su propio
│                               # commit/rollback; excepciones propias (NoEncontradoError,
│                               # ConflictoError, ValidacionError) que los routers mapean a HTTP
└── routers/                    # Un router por recurso, todos con dependencies=[Depends(get_current_user)]
                                 # salvo auth.py

frontend/src/app/
├── app.ts / app.html / app.scss    # Shell de la app: sidebar propio (custom, no ion-menu) +
│                                    # ion-router-outlet, visible solo si auth.autenticado()
├── app.routes.ts                   # Rutas lazy (loadComponent), todas con canActivate: [authGuard]
├── core/
│   ├── services/                   # Un service por recurso, HttpClient contra la API
│   ├── guards/auth.guard.ts        # Bloquea rutas sin token
│   └── interceptors/auth.interceptor.ts  # Agrega Authorization: Bearer <token>; en 401 desloguea
├── models/                         # Interfaces TS que reflejan el JSON del backend
├── shared/                         # Cosas reusadas entre pantallas: pipes/money.pipe.ts (formato
│                                    # "$ 18.900"), presentacion.ts (color por categoría, swatch de
│                                    # color de variante, etiqueta talle/color), y
│                                    # modals/confirm-dialog/ (diálogo de confirmación genérico que
│                                    # reemplaza AlertController.create() en toda la app)
└── pages/                          # Una carpeta por pantalla principal (ventas, stock, historial,
                                     # categorias, proveedores, gastos, balance, login), cada una con
                                     # sus modales en pages/<x>/modals/<modal>/
```

## Modelo de datos

Tablas (todas con migraciones incrementales en `backend/alembic/versions/`, sin triggers de base de datos — la lógica que en SQLite vivía en triggers ahora vive explícitamente en Python, en `crud/`):

- `usuario` — sin registro público, se crea con `python seed_usuario.py`
- `categoria`, `proveedor` — catálogo de producto, soft delete (`activo`)
- `producto` + `variante_producto` (talle/color, cada una con su `stock_actual`) + `movimiento_stock` (auditoría; `ajustar_stock()` en `crud/productos.py` es el único camino permitido para cambiar `stock_actual`, siempre en una transacción)
- `venta` + `detalle_venta` + `pago_venta` + `config_medio_pago` (sembrada con los defaults de la app vieja: efectivo 20% desc., transferencia 15% desc., débito/crédito 0%)
- `categoria_gasto` + `gasto` — `gasto` es la única entidad con **hard delete** (las demás, incluida `categoria_gasto`, son soft delete vía `activo`)

## Reglas de negocio críticas (replicadas de `apk-stock`, no romper)

1. **El stock se actualiza SOLO vía `movimiento_stock`**, nunca escribiendo `stock_actual` directo — ver `ajustar_stock()`, `crear_venta()` y `anular_venta()` en `crud/`.
2. **Fórmula de monto de pago**: `monto = monto_subtotal × (1 − descuento/100) × (1 + recargo/100)`, redondeado a 2 decimales (`ROUND_HALF_UP`) antes de persistir. El frontend nunca manda un `monto` calculado — el backend siempre lo recalcula y es la fuente de verdad.
3. **Venta transaccional con bloqueo de fila**: `crear_venta()` y `anular_venta()` usan `SELECT ... FOR UPDATE` sobre las variantes involucradas (ordenadas por id) antes de tocar stock — a diferencia de la app vieja (una sola tablet, sin concurrencia real), acá puede haber más de un cajero al mismo tiempo.
4. **`numero_venta` no existe** — se usa `venta.id` (serial de Postgres) como número de comprobante; la app vieja lo calculaba a mano (`MAX+1`) con riesgo de colisión, acá se eliminó esa columna redundante.
5. **Soft delete** (`activo=false`) en categoría, proveedor, producto, variante — **excepto `gasto`**, que se borra físicamente (no tiene histórico que dependa de él).
6. **Rate limit de login**: 5 intentos fallidos → bloqueo 15 minutos, **por email, no por IP** (para no dejar afuera a todo el local si comparten conexión). Vive en memoria del proceso (`rate_limit.py`) — si el backend escala a más de una instancia, hay que pasarlo a un store compartido.
7. **JWT en `localStorage`** (no cookie httpOnly) — decisión consciente por simplicidad, la app es interna y sin datos de tarjetas.

## Diseño de UI — sistema "Nocturne"

El frontend se migró de la UI celeste/blanca por defecto de Ionic a un diseño propio oscuro ("Nocturne": fondo `#161826`, acento blurple `#9184d9` usado como borde/glow, nunca como relleno grande), a partir de un handoff de diseño con mockups pantalla por pantalla. Ya está aplicado en **todas** las pantallas principales y sus modales, excepto **Historial** (listado + modal de detalle de venta, salvo el diálogo de "Anular venta" que sí se migró), que sigue con el estilo viejo de Ionic porque el handoff no la cubría.

- **Tokens y clases reusables**: `frontend/src/nocturne-tokens.scss` (importado desde `styles.scss`, global). Variables CSS `--sl-*` (colores, radios, sombras, spacing) y clases `.sl-btn`/`.sl-input`/`.sl-field`/`.sl-seg`/`.sl-tag`/`.sl-card`/`.sl-table`/`.sl-dialog-*`. Antes de armar una pantalla nueva, revisar ahí si ya existe la clase que hace falta en vez de escribir CSS a mano.
- **Iconos**: Phosphor Icons (`@phosphor-icons/web`, clase `ph ph-<nombre>`) — no `ionicons`.
- **Modales**: siguen usando `ModalController` de Ionic (no se reemplazó esa arquitectura), pero estilizados para verse como diálogo Nocturne pasando `cssClass: ['sl-dialog-modal', 'sl-dialog-modal--<variante>']` al `.create()` (los anchos por variante están en `nocturne-tokens.scss`). El contenido interno usa `.sl-dialog-content`/`.sl-dialog-title`/`.sl-dialog-actions`, no `ion-header`/`ion-content`.
- **Confirmaciones y "eliminar"**: usar `ConfirmDialogModal` (`shared/modals/confirm-dialog/`), nunca `AlertController.create()` — este último no se puede restylear para que combine con el resto de la app. Soporta pedir un motivo de texto (obligatorio u opcional), usado por ejemplo en "Anular venta".
- **Helpers compartidos**: `shared/pipes/money.pipe.ts` (formato `$ 18.900`) y `shared/presentacion.ts` (color de miniatura por categoría, swatch de color de variante, etiqueta talle/color) — usarlos en vez de reimplementar el formateo en cada página nueva.

## Comandos importantes

**Backend:**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # completar DATABASE_URL/JWT_SECRET si hace falta
alembic upgrade head              # aplica todas las migraciones
python seed_usuario.py            # crea un usuario para loguearse
uvicorn app.main:app --reload --port 8000
```
Para agregar una tabla/columna nueva: crear/editar el modelo en `models/`, correr `alembic revision --autogenerate -m "..."`, revisar el archivo generado (Alembic no siempre acierta con `CheckConstraint` o FKs en SQLite — a veces hace falta `batch_alter_table`), y `alembic upgrade head`.

**Frontend:**
```bash
cd frontend
npm install
ng serve          # http://localhost:4200, apunta a environment.ts (apiUrl: localhost:8000)
ng build          # build de producción, usa environment.prod.ts vía fileReplacements en angular.json
```

**Tests**: no hay suite de tests todavía (ni backend ni frontend, más allá del `app.spec.ts` default que deja `ng new`) — la verificación de cada módulo se hizo manual, con `curl` en el backend y probando en el navegador en el frontend. No asumir que existen tests para correr.

## Estado del proyecto

Módulos completos y verificados end-to-end (backend probado con `curl`, frontend probado en el navegador): **login** (con rate limit), **stock** (productos + variantes talle/color + categorías + proveedores), **ventas** (carrito, cobro simple/mixto, historial, anulación), **gastos** (con categorías corriente/no-corriente), **balance** (dashboard con gráficos, top de categorías más vendidas, tabla por medio de pago). Navegación por sidebar. UI en el diseño "Nocturne" (ver sección de Diseño de UI más arriba) salvo Historial, todavía sin migrar.

**Todavía no desplegado a producción** — corre todo local (backend en `localhost:8000`, Postgres real pendiente de Neon, frontend pendiente de Vercel).

**Fuera de alcance por ahora** (no proponer sin que se pida): servicios en la venta (el modelo de `apk-stock` los soporta pero acá no hay módulo de Servicios), devoluciones parciales, reportes/exportación PDF/Excel, UI de configuración de medios de pago.

**Migración de datos**: la migración del stock/histórico ya cargado en la app vieja (SQLite) hacia esta base (Postgres) se va a hacer **al final**, una vez que esta web tenga paridad completa con `apk-stock` — no antes. Mientras tanto ambas apps corren en paralelo sin ningún tipo de sincronización.

## Preferencias del usuario

- Tono cercano, casual, español argentino. No formal.
- Mínimo de bullets/headers en las respuestas salvo que sea necesario.
- Al hacer cambios de UI, siempre indicar usuario/contraseña de prueba para verificar en el navegador.
- Preguntar antes de tomar decisiones de alcance no triviales (qué UI exponer, qué queda para después).
