# Diet Planner

Aplicación de escritorio para planificar dietas semanales. Parsea un PDF de dieta (ABRIL.pdf), permite seleccionar comidas y opciones durante 4 semanas con alternancia DIETA 1 / DIETA 2, calcula las cantidades agregadas de ingredientes y exporta una lista de la compra en CSV.

## Stack

- **Frontend**: Svelte 5 + TailwindCSS v4
- **Backend**: Tauri v2 (Rust como capa IPC)
- **Parser**: Python sidecar (pdfplumber + PyInstaller)

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
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
npm run tauri build
```

El instalador se genera en `src-tauri/target/release/bundle/`.

## Estructura del proyecto

```
src/                    # Frontend Svelte 5
src-tauri/
  src/lib.rs           # Comandos IPC Tauri (capa fina)
  python/
    diet_parser.py     # Sidecar Python: parse, calculate, export
    build_sidecar.sh   # Script de construcción del sidecar (Linux)
    build_sidecar.bat  # Script de construcción del sidecar (Windows)
tests/fixtures/        # Datos de referencia para validación
```

## CI/CD

El workflow de GitHub Actions construye automáticamente el instalador de Windows al crear un tag `v*`. Los artefactos se suben como release de GitHub.
