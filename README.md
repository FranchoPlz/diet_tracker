# DG Nutrición

Aplicación web instalable para convertir un PDF de dieta en un plan semanal y una lista de la compra editable. Todo el procesamiento y el almacenamiento se realizan en el dispositivo, sin cuentas ni servidor.

## Aplicación móvil

La versión web se publica en GitHub Pages en `https://franchoplz.github.io/diet_tracker/`.

- **Android**: abre la página en Chrome y elige `Instalar aplicación` o `Añadir a pantalla de inicio`.
- **iPhone/iPad**: abre la página en Safari, pulsa `Compartir` y elige `Añadir a pantalla de inicio`.
- Tras abrirla una vez con conexión, la aplicación, el parser PDF y los planes guardados funcionan sin conexión.
- Los PDF se procesan localmente y no se conservan; solo se guardan los planes y listas que el usuario elija.

## Uso

1. Carga un PDF de dieta con texto seleccionable, de hasta 20 MB.
2. Configura las opciones de comida y las excepciones de cada día.
3. Crea la lista de la compra, corrige categorías o cantidades y guárdala con un nombre.
4. Guarda el plan para recuperarlo sin conservar el PDF original.

Una vez configurado, el plan se organiza en tres pestañas:

- **Dieta** muestra `DIETA 1` y `DIETA 2` en modo consulta, con acceso a la reconfiguración y a excepciones por día.
- **Ejercicios** muestra la rutina, series, repeticiones, detalles y descansos extraídos del PDF.
- **Compra** contiene la lista calculada, editable y compartible.

El último PDF procesado se conserva como plan activo en el dispositivo. Al volver a abrir la aplicación se recuperan sus datos estructurados, configuración y lista sin guardar el archivo PDF original.

Las listas se pueden compartir como copia independiente mediante el menú de la lista:

- Enlace con los datos comprimidos en el fragmento `#share=...`; el contenido no se envía al servidor web.
- Código QR para listas que quepan de forma fiable.
- Archivo JSON para listas grandes o copias de seguridad.

## Stack

- **Frontend**: Svelte 5 + TailwindCSS v4
- **PWA**: SvelteKit estático, service worker e IndexedDB
- **PDF**: PDF.js y parser TypeScript local

## Requisitos previos

- [Node.js](https://nodejs.org/) v20.16+

## Desarrollo local

```bash
npm install
npm run dev
```

## Construir para producción

```bash
# PWA local
npm run build

# PWA con la ruta usada por GitHub Pages
BASE_PATH=/diet_tracker npm run build
```

## Estructura del proyecto

```
src/                    # Aplicación, parser web y almacenamiento local
static/                 # Manifiesto, iconos y recursos de la PWA
tests/fixtures/         # Datos de referencia para validación
```

## CI/CD

Cada push verificado a `develop` publica la PWA en GitHub Pages.
