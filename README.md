# DG Nutrición

Aplicación web instalable y de escritorio para convertir un PDF de dieta en un plan semanal y una lista de la compra editable. Todo el procesamiento y el almacenamiento se realizan en el dispositivo, sin cuentas ni servidor.

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
- **PDF web**: PDF.js y parser TypeScript local
- **Escritorio**: Tauri v2 con sidecar Python como parser nativo

## Requisitos previos

- [Node.js](https://nodejs.org/) v20.16+
- [Rust](https://rustup.rs/) (stable)
- [Python](https://python.org/) 3.11+
- Dependencias de sistema para Tauri:
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **Windows**: Visual Studio Build Tools (C++ workload) + WebView2

## Desarrollo local

```bash
# Instalar dependencias de Node
npm install

# Crear entorno virtual de Python e instalar dependencias
python -m venv .venv
source .venv/bin/activate  # Linux/WSL
pip install -r src-tauri/python/requirements.txt pyinstaller

# Construir el sidecar (binario Python)
bash src-tauri/python/build_sidecar.sh  # Linux
# o
src-tauri\python\build_sidecar.bat      # Windows

# Ejecutar en modo desarrollo
npm run tauri dev
```

## Construir para producción

```bash
# PWA local
npm run build

# PWA con la ruta usada por GitHub Pages
BASE_PATH=/diet_tracker npm run build

# Aplicación de escritorio
npm run tauri build
```

El instalador se genera en `src-tauri/target/release/bundle/`.

## Estructura del proyecto

```
src/                    # Frontend, PWA, parser web y almacenamiento local
src-tauri/
  src/lib.rs           # Comandos IPC Tauri (capa fina)
  python/
    diet_parser.py     # Sidecar Python para la aplicación de escritorio
    build_sidecar.sh   # Script de construcción del sidecar (Linux)
    build_sidecar.bat  # Script de construcción del sidecar (Windows)
tests/fixtures/        # Datos de referencia para validación
```

## CI/CD

Cada push verificado a `develop` publica la PWA en GitHub Pages. Los tags `v*` construyen el instalador de Windows y crean un borrador de release de GitHub; la versión `v0.4.0` identifica conjuntamente la aplicación web móvil y la de escritorio.
