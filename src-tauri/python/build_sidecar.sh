#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "$PROJECT_ROOT/.venv/bin/activate"
pyinstaller "$SCRIPT_DIR/diet_parser.spec" --distpath "$SCRIPT_DIR/dist" --workpath "$SCRIPT_DIR/build" --clean -y

TARGET_TRIPLE="x86_64-unknown-linux-gnu"
cp "$SCRIPT_DIR/dist/diet_parser" "$PROJECT_ROOT/src-tauri/diet_parser-$TARGET_TRIPLE"
chmod +x "$PROJECT_ROOT/src-tauri/diet_parser-$TARGET_TRIPLE"
echo "Sidecar binary built: src-tauri/diet_parser-$TARGET_TRIPLE"
